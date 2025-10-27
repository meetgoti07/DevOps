"use client";

import { MenuItem } from "@/lib/types";
import { useCartStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock } from "lucide-react";
import { toast } from "sonner";

interface MenuItemCardProps {
  item: MenuItem;
}

export function MenuItemCard({ item }: MenuItemCardProps) {
  const { addItem } = useCartStore();

  const handleAddToCart = () => {
    addItem(item);
    toast.success(`${item.name} added to cart!`);
  };

  return (
    <Card className="h-full flex flex-col professional-card hover:shadow-xl transition-all duration-300">
      <CardHeader className="flex-1">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{item.name}</CardTitle>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={item.available ? "default" : "secondary"}>
              ₹{item.price.toFixed(2)}
            </Badge>
            {!item.available && (
              <Badge variant="destructive">Out of Stock</Badge>
            )}
          </div>
        </div>
        <CardDescription className="text-sm text-muted-foreground">
          {item.description}
        </CardDescription>

        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="h-4 w-4 mr-1" />
          {item.preparation_time} min
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Button
          onClick={handleAddToCart}
          disabled={!item.available}
          className="w-full"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>
      </CardContent>
    </Card>
  );
}
