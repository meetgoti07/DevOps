"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Coffee, Clock, Users, Utensils } from "lucide-react";

interface EmptyQueueStateProps {
  type: "user" | "general";
  className?: string;
}

export function EmptyQueueState({
  type,
  className = "",
}: EmptyQueueStateProps) {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  if (type === "user") {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`text-center py-16 ${className}`}
      >
        <motion.div variants={itemVariants}>
          <Coffee className="h-16 w-16 text-blue-400 mx-auto mb-6" />
        </motion.div>
        <motion.h3
          variants={itemVariants}
          className="text-2xl font-semibold text-gray-900 dark:text-white mb-3"
        >
          No Active Orders
        </motion.h3>
        <motion.p
          variants={itemVariants}
          className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto"
        >
          You don't have any orders in the queue right now. Browse our menu and
          place an order to get started!
        </motion.p>
        <motion.div
          variants={itemVariants}
          className="flex justify-center gap-2"
        >
          <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse"></div>
          <div
            className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <div
            className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
            style={{ animationDelay: "0.4s" }}
          ></div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`text-center py-16 ${className}`}
    >
      <motion.div variants={itemVariants}>
        <Utensils className="h-16 w-16 text-green-400 mx-auto mb-6" />
      </motion.div>
      <motion.h3
        variants={itemVariants}
        className="text-2xl font-semibold text-gray-900 dark:text-white mb-3"
      >
        Queue is Clear
      </motion.h3>
      <motion.p
        variants={itemVariants}
        className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto"
      >
        All orders have been processed! The kitchen is ready for new orders.
      </motion.p>
      <motion.div variants={itemVariants} className="flex justify-center gap-4">
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <Clock className="h-4 w-4" />
          <span className="text-sm">Ready to serve</span>
        </div>
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <Users className="h-4 w-4" />
          <span className="text-sm">0 waiting</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
