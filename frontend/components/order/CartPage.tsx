"use client";

import { useCartStore } from "@/lib/store";
import { useAuth } from "@/contexts/AuthContext";
import { orderService } from "@/lib/orders";
import { paymentService } from "@/lib/payments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Minus, Trash2, ShoppingCart, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, total } =
    useCartStore();
  const { user } = useAuth();
  const router = useRouter();
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(itemId);
      return;
    }
    updateQuantity(itemId, newQuantity);
  };

  const handlePlaceOrder = async () => {
    if (!user || items.length === 0) return;

    setIsLoading(true);
    try {
      // Create order
      const orderData = {
        user_id: user.id,
        items: items.map((item) => ({
          menu_item_id: item.menuItem._id,
          quantity: item.quantity,
          special_instructions: item.specialInstructions || "",
        })),
        special_instructions: specialInstructions,
      };

      const order = await orderService.createOrder(orderData);

      // Initiate payment
      const paymentData = {
        order_id: order.id,
        user_id: user.id,
        amount: total,
      };

      const payment = await paymentService.initiatePayment(paymentData);

      // Process payment (mock)
      await paymentService.processPayment(payment.payment_id);

      // Clear cart
      clearCart();

      toast.success("Order placed successfully!");
      router.push(`/orders`);
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to place order";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="page-container">
        <div className="text-center py-12">
          <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">
            Add some delicious items from our menu to get started.
          </p>
          <Button onClick={() => router.push("/menu")}>Browse Menu</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="section-heading">Shopping Cart</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.menuItem._id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <h3 className="font-medium">{item.menuItem.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.menuItem.description}
                    </p>
                    {item.specialInstructions && (
                      <p className="text-sm text-blue-600">
                        Special: {item.specialInstructions}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge>₹{item.menuItem.price.toFixed(2)}</Badge>
                      <span className="text-sm text-muted-foreground">
                        each
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        handleUpdateQuantity(
                          item.menuItem._id,
                          item.quantity - 1
                        )
                      }
                    >
                      <Minus className="h-4 w-4" />
                    </Button>

                    <span className="w-12 text-center font-medium">
                      {item.quantity}
                    </span>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        handleUpdateQuantity(
                          item.menuItem._id,
                          item.quantity + 1
                        )
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-right">
                    <div className="font-medium">
                      ₹{(item.menuItem.price * item.quantity).toFixed(2)}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.menuItem._id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.menuItem._id}
                    className="flex justify-between text-sm"
                  >
                    <span>
                      {item.menuItem.name} × {item.quantity}
                    </span>
                    <span>
                      ₹{(item.menuItem.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex justify-between font-medium text-lg">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Special Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Any special requests for your order..."
                value={specialInstructions}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setSpecialInstructions(e.target.value)
                }
                rows={3}
              />
            </CardContent>
          </Card>

          <Button
            onClick={handlePlaceOrder}
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Placing Order...
              </>
            ) : (
              `Place Order - $${total.toFixed(2)}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
