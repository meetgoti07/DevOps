from rest_framework import serializers
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        coerce_to_string=False,
    )
    total_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True,
        coerce_to_string=False,
    )

    class Meta:
        model = OrderItem
        fields = ["id", "menu_item_id", "item_name", "quantity", "price", "special_instructions", "total_price"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    total_amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        coerce_to_string=False,
    )

    class Meta:
        model = Order
        fields = [
            "id",
            "user_id",
            "total_amount",
            "status",
            "payment_id",
            "queue_number",
            "special_instructions",
            "created_at",
            "updated_at",
            "items",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class OrderItemInputSerializer(serializers.Serializer):
    menu_item_id = serializers.CharField()
    quantity = serializers.IntegerField(min_value=1)
    special_instructions = serializers.CharField(required=False, allow_blank=True)


class CreateOrderSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(min_value=1)
    items = OrderItemInputSerializer(many=True)
    special_instructions = serializers.CharField(required=False, allow_blank=True)


class UpdateOrderStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.STATUS_CHOICES)
