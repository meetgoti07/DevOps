import requests
import logging
from django.conf import settings
from django.db import transaction
from .models import Order, OrderItem
from .message_broker import publish_order_event

logger = logging.getLogger(__name__)


class OrderService:
    @staticmethod
    def create_order(user_id, items_data, special_instructions=None):
        """Create a new order with items"""
        try:
            with transaction.atomic():
                # Fetch menu item details and calculate total
                enriched_items = []
                total_amount = 0
                
                for item_data in items_data:
                    menu_item = OrderService._fetch_menu_item(item_data['menu_item_id'])
                    if not menu_item:
                        raise ValueError(f"Menu item {item_data['menu_item_id']} not found")
                    
                    enriched_item = {
                        'menu_item_id': item_data['menu_item_id'],
                        'item_name': menu_item['name'],
                        'quantity': item_data['quantity'],
                        'price': menu_item['price'],
                        'special_instructions': item_data.get('special_instructions', '')
                    }
                    enriched_items.append(enriched_item)
                    total_amount += menu_item['price'] * item_data['quantity']
                
                # Create order
                order = Order.objects.create(
                    user_id=user_id,
                    total_amount=total_amount,
                    status='placed',
                    special_instructions=special_instructions
                )
                
                # Create order items
                order_items = []
                for item_data in enriched_items:
                    order_item = OrderItem(
                        order=order,
                        menu_item_id=item_data['menu_item_id'],
                        item_name=item_data['item_name'],
                        quantity=item_data['quantity'],
                        price=item_data['price'],
                        special_instructions=item_data['special_instructions']
                    )
                    order_items.append(order_item)
                
                OrderItem.objects.bulk_create(order_items)
                
                # Publish order created event asynchronously
                order_data = {
                    'order_id': order.id,
                    'user_id': order.user_id,
                    'total_amount': order.total_amount,
                    'items': [
                        {
                            'menu_item_id': item_data['menu_item_id'],
                            'item_name': item_data['item_name'],
                            'quantity': item_data['quantity'],
                            'price': item_data['price'],
                            'special_instructions': item_data.get('special_instructions')
                        }
                        for item_data in enriched_items
                    ],
                    'special_instructions': order.special_instructions,
                    'created_at': order.created_at.isoformat()
                }
                
                # Publish order created event
                publish_order_event('order_created', **order_data)
                
                # Initiate payment asynchronously
                publish_order_event(
                    'payment_initiated',
                    order_id=order.id,
                    user_id=order.user_id,
                    amount=order.total_amount
                )
                
                # Don't add to queue immediately - wait for payment confirmation
                # Queue will be added when status changes to 'confirmed' via message
                
                return order
                
        except Exception as e:
            logger.error(f"Failed to create order: {str(e)}")
            raise
    
    @staticmethod
    def _fetch_menu_item(menu_item_id):
        """Fetch menu item details from Menu Service"""
        try:
            menu_url = f"{settings.MENU_SERVICE_URL}/api/menu/items/{menu_item_id}"
            response = requests.get(menu_url, timeout=5)
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Menu service returned {response.status_code}: {response.text}")
                return None
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to connect to menu service: {str(e)}")
            return None
    
    @staticmethod
    def _add_to_queue(order_id, user_id):
        """Add order to queue service"""
        try:
            queue_url = f"{settings.QUEUE_SERVICE_URL}/api/queue/"
            payload = {
                'order_id': order_id,
                'user_id': user_id
            }
            
            response = requests.post(queue_url, json=payload, timeout=5)
            if response.status_code == 201:
                return response.json()
            else:
                logger.error(f"Queue service returned {response.status_code}: {response.text}")
                return None
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to connect to queue service: {str(e)}")
            return None
    
    @staticmethod
    def _initiate_payment(order_id, user_id, amount):
        """Initiate payment for order"""
        try:
            payment_url = f"{settings.PAYMENT_SERVICE_URL}/api/payments/initiate"
            payload = {
                'order_id': order_id,
                'user_id': user_id,
                'amount': float(amount)
            }
            
            response = requests.post(payment_url, json=payload, timeout=5)
            if response.status_code == 201:
                return response.json()
            else:
                logger.error(f"Payment service returned {response.status_code}: {response.text}")
                return None
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to connect to payment service: {str(e)}")
            return None
    
    @staticmethod
    def update_order_status(order_id, new_status):
        """Update order status and publish async events"""
        try:
            order = Order.objects.get(id=order_id)
            old_status = order.status
            order.status = new_status
            order.save()
            
            logger.info(f"Order {order_id} status updated from {old_status} to {new_status}")
            
            # Prepare order data for messaging
            order_data = {
                'order_id': order.id,
                'user_id': order.user_id,
                'total_amount': order.total_amount,
                'queue_number': order.queue_number,
                'updated_at': order.updated_at.isoformat()
            }
            
            # Publish order status change event
            publish_order_event(
                'order_status_changed',
                order_id=order_id,
                old_status=old_status,
                new_status=new_status,
                order_data=order_data
            )
            
            # Handle specific status transitions asynchronously
            if new_status == 'confirmed' and old_status == 'placed':
                # When order is confirmed (payment successful), add to queue
                logger.info(f"Order {order_id} confirmed - will be added to queue via message")
                
            elif new_status == 'completed':
                # When order is completed, remove from queue
                logger.info(f"Order {order_id} completed - will be removed from queue via message")
            
            return order
            
        except Order.DoesNotExist:
            raise ValueError(f"Order {order_id} not found")
    
    @staticmethod
    def _remove_from_queue(order_id):
        """Remove order from queue"""
        try:
            queue_url = f"{settings.QUEUE_SERVICE_URL}/api/queue/order/{order_id}"
            response = requests.delete(queue_url, timeout=5)
            
            if response.status_code not in [200, 404]:
                logger.error(f"Failed to remove order from queue: {response.status_code} {response.text}")
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to connect to queue service: {str(e)}")
    
    @staticmethod
    def get_user_orders(user_id, status=None):
        """Get orders for a specific user"""
        queryset = Order.objects.filter(user_id=user_id).order_by('-created_at')
        
        if status:
            queryset = queryset.filter(status=status)
        
        return queryset
    
    @staticmethod
    def get_active_orders(user_id):
        """Get active orders for a user (not completed or cancelled)"""
        return Order.objects.filter(
            user_id=user_id,
            status__in=['placed', 'confirmed', 'preparing', 'ready']
        ).order_by('-created_at')