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
      let payloadToSend = item.payload;

      // Handle dual major + child event payloads
      if (item.payload?.majorPayload && (item.payload?.goalPayload || item.payload?.cardPayload)) {
        const majorRes = await fetch("/api/game_events_major", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.payload.majorPayload),
        }).then((r) => r.json());

        if (majorRes?.id) {
          const childPayload = item.payload.goalPayload || item.payload.cardPayload;
          payloadToSend = {
            ...childPayload,
            major_event_id: Number(majorRes.id),
          };
        }
      }

      const response = await fetch(`/api/${item.endpoint}`, {
        method: item.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadToSend),
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
 * Save complete live game snapshot to local storage
 */
export function saveGameCache(gameId: string | number, game: any, players: any[]) {
  if (typeof window === "undefined" || !gameId) return;
  try {
    const key = `live_game_cache_${gameId}`;
    const data = {
      game,
      players,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error("Error saving live game cache:", err);
  }
}

/**
 * Retrieve cached live game snapshot from local storage
 */
export function loadGameCache(gameId: string | number): { game: any; players: any[]; timestamp: number } | null {
  if (typeof window === "undefined" || !gameId) return null;
  try {
    const key = `live_game_cache_${gameId}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("Error reading live game cache:", err);
    return null;
  }
}

// Simulated offline testing mode state
let simulatedOffline = false;

export function setSimulatedOfflineMode(enabled: boolean) {
  simulatedOffline = enabled;
  if (typeof window !== "undefined") {
    localStorage.setItem("soccer_app_simulated_offline", enabled ? "true" : "false");
    window.dispatchEvent(new Event(enabled ? "offline" : "online"));
  }
}

export function isSimulatedOfflineMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("soccer_app_simulated_offline") === "true";
}

/**
 * React Hook for monitoring online status and queued event count
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    if (isSimulatedOfflineMode()) return false;
    return navigator.onLine;
  });
  const [queueCount, setQueueCount] = useState<number>(0);

  useEffect(() => {
    const updateQueue = () => {
      setQueueCount(getOfflineQueue().length);
    };

    updateQueue();

    const handleOnline = () => {
      if (isSimulatedOfflineMode()) {
        setIsOnline(false);
        return;
      }
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
