"use client";

import { motion } from "framer-motion";
import { QueueItem } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Clock, Coffee, CheckCircle, AlertCircle } from "lucide-react";

interface AnimatedQueueItemProps {
  queueItem: QueueItem;
  index: number;
}

export function AnimatedQueueItem({
  queueItem,
  index,
}: AnimatedQueueItemProps) {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center gap-3">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2, delay: index * 0.1 + 0.2 }}
          className="text-xl font-bold text-gray-900 dark:text-white bg-blue-50 dark:bg-blue-900 rounded-full w-10 h-10 flex items-center justify-center"
        >
          {queueItem.queue_number}
        </motion.div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">
            Order #{queueItem.order_id}
          </p>
          {queueItem.estimated_wait_time > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ~{queueItem.estimated_wait_time} min
            </p>
          )}
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: index * 0.1 + 0.3 }}
      >
        <Badge
          className={`${getStatusColor(
            queueItem.status
          )} flex items-center gap-1`}
          variant="secondary"
        >
          {getStatusIcon(queueItem.status)}
          {queueItem.status}
        </Badge>
      </motion.div>
    </motion.div>
  );
}
