from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Order
from .serializers import OrderSerializer, CreateOrderSerializer, UpdateOrderStatusSerializer
from .services import OrderService
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
def create_order(request):
    """Create a new order"""
    serializer = CreateOrderSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    try:
        user_id = serializer.validated_data['user_id']
        items_data = serializer.validated_data['items']
        special_instructions = serializer.validated_data.get('special_instructions')

        # Create order using service
        order = OrderService.create_order(user_id, items_data, special_instructions)

        # Return order details
        order_serializer = OrderSerializer(order)
        return Response(order_serializer.data, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"Error creating order: {str(e)}")
        return Response({'error': 'Failed to create order'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_order(request, order_id):
    """Get order by ID"""
    try:
        order = get_object_or_404(Order, id=order_id)
        serializer = OrderSerializer(order)
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Error fetching order {order_id}: {str(e)}")
        return Response({'error': 'Failed to fetch order'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_user_orders(request, user_id):
    """Get all orders for a user"""
    try:
        status_filter = request.query_params.get('status')
        orders = OrderService.get_user_orders(user_id, status_filter)
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Error fetching orders for user {user_id}: {str(e)}")
        return Response({'error': 'Failed to fetch orders'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_user_active_orders(request, user_id):
    """Get active orders for a user"""
    try:
        orders = OrderService.get_active_orders(user_id)
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Error fetching active orders for user {user_id}: {str(e)}")
        return Response({'error': 'Failed to fetch active orders'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
def update_order_status(request, order_id):
    """Update order status"""
    try:
        serializer = UpdateOrderStatusSerializer(data=request.data)
        if serializer.is_valid():
            new_status = serializer.validated_data['status']
            
            # Update order status using service
            order = OrderService.update_order_status(order_id, new_status)
            
            # Return updated order
            order_serializer = OrderSerializer(order)
            return Response(order_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error updating order {order_id} status: {str(e)}")
        return Response({'error': 'Failed to update order status'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def health_check(request):
    """Health check endpoint"""
    return Response({
        'status': 'OK',
        'service': 'Order Service',
        'timestamp': request.META.get('HTTP_DATE', 'N/A')
    })
