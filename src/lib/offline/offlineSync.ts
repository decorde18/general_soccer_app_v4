"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

export interface QueuedOfflineAction {
  id: string;
  timestamp: number;
  type: "goal" | "discipline" | "substitution" | "player_action" | "team_event" | "period_change";
  endpoint: string;
  method: "POST" | "PUT" | "DELETE";
  payload: any;
}

const STORAGE_KEY = "soccer_app_offline_queue_v1";

/**
 * Get current queued offline actions
 */
export function getOfflineQueue(): QueuedOfflineAction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Error reading offline queue:", err);
    return [];
  }
}

/**
 * Save action to offline queue
 */
export function enqueueOfflineAction(
  type: QueuedOfflineAction["type"],
  endpoint: string,
  method: QueuedOfflineAction["method"],
  payload: any
): QueuedOfflineAction {
  const newAction: QueuedOfflineAction = {
    id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    type,
    endpoint,
    method,
    payload,
  };

  const queue = getOfflineQueue();
  queue.push(newAction);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    toast.info("Offline mode active: Action saved to device queue.", {
      id: "offline-action-enqueued",
    });
  } catch (err) {
    console.error("Error saving to offline queue:", err);
  }

  return newAction;
}

/**
 * Clear queue after successful flush
 */
export function clearOfflineQueue() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Error clearing offline queue:", err);
  }
}

/**
 * Flush all queued offline actions to server
 */
export async function flushOfflineQueue(): Promise<{ synced: number; failed: number }> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;
  const remainingQueue: QueuedOfflineAction[] = [];

  for (const item of queue) {
    try {
      const response = await fetch(`/api/${item.endpoint}`, {
        method: item.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.payload),
      });

      if (response.ok) {
        synced++;
      } else {
        failed++;
        remainingQueue.push(item);
      }
    } catch (err) {
      failed++;
      remainingQueue.push(item);
    }
  }

  try {
    if (remainingQueue.length === 0) {
      clearOfflineQueue();
      toast.success(`Online sync complete: ${synced} offline match events synced!`);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remainingQueue));
      toast.warning(`Partial sync: ${synced} synced, ${failed} remaining in queue.`);
    }
  } catch (err) {
    console.error("Error updating queue post-flush:", err);
  }

  return { synced, failed };
}

/**
 * React Hook for monitoring online status and queued event count
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [queueCount, setQueueCount] = useState<number>(0);

  useEffect(() => {
    const updateQueue = () => {
      setQueueCount(getOfflineQueue().length);
    };

    updateQueue();

    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Network connection restored. Syncing offline events...");
      flushOfflineQueue().then(updateQueue);
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Network connection lost. Operating in Offline Mode.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("storage", updateQueue);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("storage", updateQueue);
    };
  }, []);

  return { isOnline, queueCount };
}
