import pika
import json
import logging
import threading
from datetime import datetime
from django.conf import settings
from typing import Dict, Any, Callable

logger = logging.getLogger(__name__)

class RabbitMQService:
    """RabbitMQ Service for asynchronous messaging"""
    
    def __init__(self):
        self.connection = None
        self.channel = None
        self.exchange = settings.RABBITMQ_EXCHANGE
        self.routing_keys = settings.RABBITMQ_ROUTING_KEYS
        self._consumers = {}
        self._connect()
        
    def _connect(self):
        """Establish connection to RabbitMQ"""
        try:
            # Parse connection URL
            connection_params = pika.URLParameters(settings.RABBITMQ_URL)
            self.connection = pika.BlockingConnection(connection_params)
            self.channel = self.connection.channel()
            
            # Declare exchange
            self.channel.exchange_declare(
                exchange=self.exchange,
                exchange_type='topic',
                durable=True
            )
            
            logger.info(f"Connected to RabbitMQ: {settings.RABBITMQ_URL}")
            
        except Exception as e:
            logger.error(f"Failed to connect to RabbitMQ: {str(e)}")
            raise
    
    def publish_message(self, routing_key: str, message: Dict[str, Any]):
        """Publish a message to RabbitMQ"""
        try:
            if not self.connection or self.connection.is_closed:
                self._connect()
            
            # Prepare message
            message_body = json.dumps(message, default=str)
            
            # Publish message
            self.channel.basic_publish(
                exchange=self.exchange,
                routing_key=routing_key,
                body=message_body,
                properties=pika.BasicProperties(
                    delivery_mode=2,  # Make message persistent
                    content_type='application/json',
                    timestamp=int(datetime.now().timestamp() * 1000)
                )
            )
            
            logger.info(f"Published message to {routing_key}: {message}")
            
        except Exception as e:
            logger.error(f"Failed to publish message: {str(e)}")
            raise
    
    def publish_order_created(self, order_data: Dict[str, Any]):
        """Publish order created event"""
        message = {
            'event_type': 'order_created',
            'order_id': order_data['order_id'],
            'user_id': order_data['user_id'],
            'total_amount': float(order_data['total_amount']),
            'items': order_data['items'],
            'special_instructions': order_data.get('special_instructions'),
            'timestamp': order_data['created_at']
        }
        self.publish_message(self.routing_keys['order_created'], message)
    
    def publish_order_status_changed(self, order_id: int, old_status: str, new_status: str, order_data: Dict[str, Any] = None):
        """Publish order status change event"""
        message = {
            'event_type': 'order_status_changed',
            'order_id': order_id,
            'old_status': old_status,
            'new_status': new_status,
            'timestamp': order_data.get('updated_at') if order_data else None
        }
        
        # Add additional data based on status
        if order_data:
            message.update({
                'user_id': order_data['user_id'],
                'total_amount': float(order_data['total_amount']),
                'queue_number': order_data.get('queue_number')
            })
        
        # Route to appropriate routing key based on status
        routing_key_map = {
            'confirmed': self.routing_keys['order_confirmed'],
            'preparing': self.routing_keys['order_preparing'],
            'ready': self.routing_keys['order_ready'],
            'completed': self.routing_keys['order_completed'],
            'cancelled': self.routing_keys['order_cancelled']
        }
        
        routing_key = routing_key_map.get(new_status, self.routing_keys['order_created'])
        self.publish_message(routing_key, message)
    
    def publish_payment_initiated(self, order_id: int, user_id: int, amount: float, payment_id: str = None):
        """Publish payment initiated event"""
        message = {
            'event_type': 'payment_initiated',
            'order_id': order_id,
            'user_id': user_id,
            'amount': float(amount),
            'payment_id': payment_id,
            'timestamp': None  # Will be set by timestamp property
        }
        self.publish_message(self.routing_keys['payment_initiated'], message)
    
    def declare_queue(self, queue_name: str, routing_key: str) -> str:
        """Declare a queue and bind it to the exchange"""
        try:
            if not self.connection or self.connection.is_closed:
                self._connect()
            
            # Declare queue
            self.channel.queue_declare(queue=queue_name, durable=True)
            
            # Bind queue to exchange
            self.channel.queue_bind(
                exchange=self.exchange,
                queue=queue_name,
                routing_key=routing_key
            )
            
            logger.info(f"Declared and bound queue {queue_name} with routing key {routing_key}")
            return queue_name
            
        except Exception as e:
            logger.error(f"Failed to declare queue {queue_name}: {str(e)}")
            raise
    
    def setup_consumer(self, queue_name: str, callback: Callable):
        """Set up a consumer for a queue"""
        try:
            if not self.connection or self.connection.is_closed:
                self._connect()
            
            def wrapper(ch, method, properties, body):
                try:
                    message = json.loads(body.decode('utf-8'))
                    callback(message)
                    ch.basic_ack(delivery_tag=method.delivery_tag)
                except Exception as e:
                    logger.error(f"Error processing message: {str(e)}")
                    ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
            
            self.channel.basic_consume(
                queue=queue_name,
                on_message_callback=wrapper
            )
            
            self._consumers[queue_name] = callback
            logger.info(f"Set up consumer for queue {queue_name}")
            
        except Exception as e:
            logger.error(f"Failed to set up consumer for {queue_name}: {str(e)}")
            raise
    
    def start_consuming(self):
        """Start consuming messages (blocking)"""
        try:
            logger.info("Starting message consumption...")
            self.channel.start_consuming()
        except KeyboardInterrupt:
            logger.info("Stopping message consumption...")
            self.channel.stop_consuming()
        except Exception as e:
            logger.error(f"Error during message consumption: {str(e)}")
            raise
    
    def close(self):
        """Close RabbitMQ connection"""
        try:
            if self.channel and not self.channel.is_closed:
                self.channel.close()
            if self.connection and not self.connection.is_closed:
                self.connection.close()
            logger.info("RabbitMQ connection closed")
        except Exception as e:
            logger.error(f"Error closing RabbitMQ connection: {str(e)}")

# Global instance
_rabbitmq_service = None

def get_rabbitmq_service() -> RabbitMQService:
    """Get or create RabbitMQ service instance"""
    global _rabbitmq_service
    if _rabbitmq_service is None:
        _rabbitmq_service = RabbitMQService()
    return _rabbitmq_service

def publish_order_event(event_type: str, **kwargs):
    """Convenience function to publish order events"""
    try:
        service = get_rabbitmq_service()
        
        if event_type == 'order_created':
            service.publish_order_created(kwargs)
        elif event_type == 'order_status_changed':
            service.publish_order_status_changed(
                kwargs['order_id'],
                kwargs['old_status'],
                kwargs['new_status'],
                kwargs.get('order_data')
            )
        elif event_type == 'payment_initiated':
            service.publish_payment_initiated(
                kwargs['order_id'],
                kwargs['user_id'],
                kwargs['amount'],
                kwargs.get('payment_id')
            )
        else:
            logger.warning(f"Unknown event type: {event_type}")
            
    except Exception as e:
        logger.error(f"Failed to publish {event_type} event: {str(e)}")
        # Don't raise exception to avoid breaking the main flow