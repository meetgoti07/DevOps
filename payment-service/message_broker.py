import pika
import json
import logging
import threading
from typing import Dict, Any, Callable

logger = logging.getLogger(__name__)

class RabbitMQService:
    """RabbitMQ Service for Payment Service messaging"""
    
    def __init__(self, rabbitmq_url: str):
        self.rabbitmq_url = rabbitmq_url
        self.connection = None
        self.channel = None
        self.exchange = 'canteen.orders'
        self._connect()
        
    def _connect(self):
        """Establish connection to RabbitMQ"""
        try:
            # Parse connection URL
            connection_params = pika.URLParameters(self.rabbitmq_url)
            self.connection = pika.BlockingConnection(connection_params)
            self.channel = self.connection.channel()
            
            # Declare exchange
            self.channel.exchange_declare(
                exchange=self.exchange,
                exchange_type='topic',
                durable=True
            )
            
            logger.info(f"Payment Service connected to RabbitMQ: {self.rabbitmq_url}")
            
        except Exception as e:
            logger.error(f"Failed to connect to RabbitMQ: {str(e)}")
            raise
    
    def setup_consumer(self, payment_service):
        """Set up consumer for payment initiation events"""
        try:
            if not self.connection or self.connection.is_closed:
                self._connect()
            
            # Declare queue for payment events
            queue_name = 'payment.service.queue'
            self.channel.queue_declare(queue=queue_name, durable=True)
            
            # Bind to payment initiation routing key
            self.channel.queue_bind(
                exchange=self.exchange,
                queue=queue_name,
                routing_key='payment.initiated'
            )
            
            def callback(ch, method, properties, body):
                try:
                    message = json.loads(body.decode('utf-8'))
                    self._handle_payment_message(message, payment_service)
                    ch.basic_ack(delivery_tag=method.delivery_tag)
                except Exception as e:
                    logger.error(f"Error processing payment message: {str(e)}")
                    ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
            
            self.channel.basic_consume(
                queue=queue_name,
                on_message_callback=callback
            )
            
            logger.info("Payment Service: RabbitMQ consumer set up")
            
        except Exception as e:
            logger.error(f"Failed to set up consumer: {str(e)}")
            raise
    
    def _handle_payment_message(self, message: Dict[str, Any], payment_service):
        """Handle payment initiation message"""
        try:
            if message.get('event_type') == 'payment_initiated':
                order_id = message['order_id']
                user_id = message['user_id']
                amount = message['amount']
                
                logger.info(f"Processing payment initiation for order {order_id}")
                
                # Initiate payment
                payment = payment_service.initiate_payment(
                    order_id=order_id,
                    user_id=user_id,
                    amount=amount,
                    payment_method='mock'
                )
                
                if payment:
                    # Start async payment processing
                    threading.Thread(
                        target=payment_service.process_mock_payment,
                        args=(payment.payment_id,)
                    ).start()
                    
                    logger.info(f"Payment {payment.payment_id} initiated for order {order_id}")
                
        except Exception as e:
            logger.error(f"Failed to handle payment message: {str(e)}")
            raise
    
    def publish_payment_result(self, order_id: int, payment_status: str, payment_id: str = None):
        """Publish payment result event"""
        try:
            if not self.connection or self.connection.is_closed:
                self._connect()
            
            message = {
                'event_type': 'payment_completed',
                'order_id': order_id,
                'payment_status': payment_status,
                'payment_id': payment_id
            }
            
            routing_key = f'payment.{payment_status}'
            
            self.channel.basic_publish(
                exchange=self.exchange,
                routing_key=routing_key,
                body=json.dumps(message, default=str),
                properties=pika.BasicProperties(
                    delivery_mode=2,  # Make message persistent
                    content_type='application/json'
                )
            )
            
            logger.info(f"Published payment result: {payment_status} for order {order_id}")
            
        except Exception as e:
            logger.error(f"Failed to publish payment result: {str(e)}")
            # Don't raise to avoid breaking payment flow
    
    def start_consuming(self):
        """Start consuming messages (blocking)"""
        try:
            logger.info("Payment Service: Starting message consumption...")
            self.channel.start_consuming()
        except KeyboardInterrupt:
            logger.info("Payment Service: Stopping message consumption...")
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
            logger.info("Payment Service: RabbitMQ connection closed")
        except Exception as e:
            logger.error(f"Error closing RabbitMQ connection: {str(e)}")

# Global instance
_rabbitmq_service = None

def get_rabbitmq_service(rabbitmq_url: str = None) -> RabbitMQService:
    """Get or create RabbitMQ service instance"""
    global _rabbitmq_service
    if _rabbitmq_service is None and rabbitmq_url:
        _rabbitmq_service = RabbitMQService(rabbitmq_url)
    return _rabbitmq_service