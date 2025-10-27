import uuid
import requests
import logging
from datetime import datetime
from database import Database
from models import Payment

logger = logging.getLogger(__name__)

class PaymentService:
    def __init__(self, db_path, order_service_url):
        self.db = Database(db_path)
        self.order_service_url = order_service_url
    
    def initiate_payment(self, order_id, user_id, amount, payment_method='mock'):
        """Initiate a new payment"""
        try:
            # Generate unique payment ID
            payment_id = f"pay_{uuid.uuid4().hex[:12]}"
            
            # Create payment record
            payment = Payment(
                payment_id=payment_id,
                order_id=order_id,
                user_id=user_id,
                amount=amount,
                status='pending',
                payment_method=payment_method
            )
            
            # Save to database
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO payments (payment_id, order_id, user_id, amount, status, payment_method, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                payment.payment_id,
                payment.order_id,
                payment.user_id,
                payment.amount,
                payment.status,
                payment.payment_method,
                payment.created_at,
                payment.updated_at
            ))
            
            payment.id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            logger.info(f"Payment {payment_id} initiated for order {order_id}")
            return payment
            
        except Exception as e:
            logger.error(f"Failed to initiate payment: {str(e)}")
            raise
    
    def get_payment(self, payment_id):
        """Get payment by payment ID"""
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('SELECT * FROM payments WHERE payment_id = ?', (payment_id,))
            row = cursor.fetchone()
            conn.close()
            
            if row:
                return Payment.from_db_row(row)
            return None
            
        except Exception as e:
            logger.error(f"Failed to get payment {payment_id}: {str(e)}")
            raise
    
    def get_payment_by_order(self, order_id):
        """Get payment by order ID"""
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1', (order_id,))
            row = cursor.fetchone()
            conn.close()
            
            if row:
                return Payment.from_db_row(row)
            return None
            
        except Exception as e:
            logger.error(f"Failed to get payment for order {order_id}: {str(e)}")
            raise
    
    def update_payment_status(self, payment_id, status):
        """Update payment status"""
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                UPDATE payments 
                SET status = ?, updated_at = ?
                WHERE payment_id = ?
            ''', (status, datetime.now(), payment_id))
            
            if cursor.rowcount == 0:
                conn.close()
                raise ValueError(f"Payment {payment_id} not found")
            
            conn.commit()
            conn.close()
            
            # Get updated payment
            payment = self.get_payment(payment_id)
            
            # Notify order service if payment is successful
            if status == 'success' and payment:
                try:
                    # Try async messaging first, fallback to HTTP
                    try:
                        from message_broker import get_rabbitmq_service
                        rabbitmq = get_rabbitmq_service()
                        if rabbitmq:
                            rabbitmq.publish_payment_result(
                                order_id=payment.order_id,
                                payment_status=status,
                                payment_id=payment_id
                            )
                            logger.info(f"Published payment result via RabbitMQ for order {payment.order_id}")
                        else:
                            # Fallback to HTTP notification
                            self._notify_order_service(payment.order_id, payment_id, status)
                    except (ImportError, Exception):
                        # Fallback to HTTP notification
                        self._notify_order_service(payment.order_id, payment_id, status)
                except Exception as e:
                    logger.error(f"Failed to notify order service: {str(e)}")
            
            logger.info(f"Payment {payment_id} status updated to {status}")
            return payment
            
        except Exception as e:
            logger.error(f"Failed to update payment status: {str(e)}")
            raise
    
    def process_mock_payment(self, payment_id):
        """Process a mock payment (simulate payment processing)"""
        import time
        import random
        
        try:
            # Simulate processing delay
            time.sleep(1)
            
            # Mock payment success (90% success rate)
            success = random.random() < 0.9
            
            if success:
                return self.update_payment_status(payment_id, 'success')
            else:
                return self.update_payment_status(payment_id, 'failed')
                
        except Exception as e:
            logger.error(f"Failed to process mock payment: {str(e)}")
            return self.update_payment_status(payment_id, 'failed')
    
    def _notify_order_service(self, order_id, payment_id, payment_status):
        """Notify order service about payment status"""
        try:
            url = f"{self.order_service_url}/api/orders/{order_id}/status/"
            
            # Update order status based on payment status
            order_status = 'confirmed' if payment_status == 'success' else 'cancelled'
            
            payload = {
                'status': order_status
            }
            
            response = requests.put(url, json=payload, timeout=5)
            
            if response.status_code not in [200, 201]:
                logger.error(f"Order service returned {response.status_code}: {response.text}")
            else:
                logger.info(f"Order {order_id} status updated to {order_status}")
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to notify order service: {str(e)}")
    
    def get_payment_stats(self):
        """Get payment statistics"""
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            # Get today's stats
            cursor.execute('''
                SELECT 
                    COUNT(*) as total_payments,
                    SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_payments,
                    SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END) as total_revenue
                FROM payments 
                WHERE DATE(created_at) = DATE('now')
            ''')
            
            row = cursor.fetchone()
            conn.close()
            
            return {
                'total_payments': row['total_payments'] or 0,
                'successful_payments': row['successful_payments'] or 0,
                'total_revenue': row['total_revenue'] or 0,
                'success_rate': (row['successful_payments'] / row['total_payments'] * 100) if row['total_payments'] > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Failed to get payment stats: {str(e)}")
            return {
                'total_payments': 0,
                'successful_payments': 0,
                'total_revenue': 0,
                'success_rate': 0
            }