"use client";

import { useState, useEffect } from "react";
import { QueueItem } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Coffee, Clock, AlertCircle } from "lucide-react";

interface QueueTickerProps {
  queueItems: QueueItem[];
  className?: string;
}

export function QueueTicker({ queueItems, className = "" }: QueueTickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if ((queueItems || []).length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % (queueItems || []).length);
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [(queueItems || []).length]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "waiting":
        return <Clock className="h-4 w-4" />;
      case "preparing":
        return <Coffee className="h-4 w-4" />;
      case "ready":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "preparing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "ready":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  if ((queueItems || []).length === 0) {
    return (
      <Card className={`bg-gray-50 dark:bg-gray-800 ${className}`}>
        <CardContent className="p-4 text-center">
          <p className="text-gray-500 dark:text-gray-400">No orders in queue</p>
        </CardContent>
      </Card>
    );
  }

  const currentItem = queueItems[currentIndex];

  return (
    <Card
      className={`bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 ${className}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              #{currentItem.queue_number}
            </div>
            <div>
              <h3 className="font-semibold">Order #{currentItem.order_id}</h3>
              {currentItem.estimated_wait_time > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  ~{currentItem.estimated_wait_time} min
                </p>
              )}
            </div>
          </div>
          <Badge
            className={`${getStatusColor(
              currentItem.status
            )} flex items-center gap-1`}
          >
            {getStatusIcon(currentItem.status)}
            {currentItem.status}
          </Badge>
        </div>

        {(queueItems || []).length > 1 && (
          <div className="mt-3 flex justify-center gap-1">
            {(queueItems || []).map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex
                    ? "bg-blue-600 dark:bg-blue-400"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
