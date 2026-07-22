"use client";

import { AlertTriangle } from "lucide-react";
import Button from "@/components/ui/Button";

interface FullScreenLoaderProps {
  message?: string;
}

/**
 * Full-viewport spinner + message. Used for auth checks, game data loads,
 * and anywhere else a page-level "waiting on something" state is needed.
 */
export function FullScreenLoader({ message = "Loading..." }: FullScreenLoaderProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
        <p className="font-medium text-slate-500">{message}</p>
      </div>
    </div>
  );
}

interface FullScreenErrorProps {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction: () => void;
}

/**
 * Full-viewport error card with a single recovery action
 * (e.g. "Back to Games"). Same shape as GameMenuPage's original error UI.
 */
export function FullScreenError({
  title = "Something went wrong",
  message,
  actionLabel = "Go Back",
  onAction,
}: FullScreenErrorProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-500">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="mb-2 text-lg font-bold text-slate-800">{title}</h3>
        <p className="mb-6 text-slate-500">{message}</p>
        <Button variant="primary" size="md" onClick={onAction} className="w-full">
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}
