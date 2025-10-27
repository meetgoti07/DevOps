"use client";

import { useEffect, useRef, useState } from "react";
import { QueueItem } from "@/lib/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";

interface QueueNotificationProps {
  userQueueItems: QueueItem[];
  enabled?: boolean;
}

export function QueueNotification({
  userQueueItems,
  enabled = true,
}: QueueNotificationProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastReadyOrders, setLastReadyOrders] = useState<Set<number>>(
    new Set()
  );
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize audio context for notification sounds
    if (typeof window !== "undefined") {
      try {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn("Audio context not supported");
      }
    }
  }, []);

  const playNotificationSound = () => {
    if (!audioContextRef.current || !soundEnabled) return;

    try {
      const context = audioContextRef.current;
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.frequency.setValueAtTime(800, context.currentTime);
      oscillator.frequency.setValueAtTime(600, context.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, context.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.3, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        context.currentTime + 0.3
      );

      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.3);
    } catch (error) {
      console.warn("Failed to play notification sound:", error);
    }
  };

  useEffect(() => {
    if (!enabled || !soundEnabled) return;

    const currentReadyOrders = new Set(
      userQueueItems
        .filter((item) => item.status === "ready")
        .map((item) => item.order_id)
    );

    // Check for newly ready orders
    const newlyReadyOrders = Array.from(currentReadyOrders).filter(
      (orderId) => !lastReadyOrders.has(orderId)
    );

    if (newlyReadyOrders.length > 0) {
      // Show toast notification
      newlyReadyOrders.forEach((orderId) => {
        toast.success(`Order #${orderId} is ready for pickup!`, {
          duration: 10000,
          action: {
            label: "View",
            onClick: () => {
              // Scroll to user orders section or handle navigation
              const element = document.getElementById("user-orders");
              element?.scrollIntoView({ behavior: "smooth" });
            },
          },
        });
      });

      // Play sound notification
      playNotificationSound();

      // Vibrate on mobile devices
      if ("vibrator" in navigator || "webkitVibrate" in navigator) {
        navigator.vibrate?.([200, 100, 200]);
      }

      // Update the last ready orders only when there are new ones
      setLastReadyOrders(currentReadyOrders);
    }
  }, [userQueueItems, enabled, soundEnabled]); // Removed lastReadyOrders from dependencies

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setSoundEnabled(!soundEnabled)}
      className={`flex items-center gap-2 ${
        soundEnabled ? "text-blue-600" : "text-gray-400"
      }`}
      title={soundEnabled ? "Disable notifications" : "Enable notifications"}
    >
      {soundEnabled ? (
        <Volume2 className="h-4 w-4" />
      ) : (
        <VolumeX className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">
        {soundEnabled ? "Notifications On" : "Notifications Off"}
      </span>
    </Button>
  );
}
