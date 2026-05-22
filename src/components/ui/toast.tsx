/**
 * Toast Component - Uses Global Theme Variables
 *
 * @example
 * import { useToast } from "@/components/ui/toast"
 *
 * export function MyComponent() {
 *   const { toast } = useToast()
 *
 *   return (
 *     <button onClick={() => {
 *       toast({ type: "success", title: "Success!", description: "Operation completed" })
 *     }}>
 *       Show Toast
 *     </button>
 *   )
 * }
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";

export type ToastType = "default" | "success" | "error" | "warning";

interface Toast {
  id: string;
  title?: string;
  description?: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (options: Omit<Toast, "id">) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(
  undefined,
);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback(
    ({ title, description, type = "default" }: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, description, type }]);

      // Auto dismiss after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    [],
  );

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className='fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]'>
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all mb-4 data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
              t.type === "default" && "bg-surface border-border text-text",
              t.type === "success" &&
                "bg-success/10 border-success text-success",
              t.type === "error" && "bg-danger/10 border-danger text-danger",
              t.type === "warning" &&
                "bg-warning-bg border-warning-border text-warning-text",
            )}
          >
            <div className='grid gap-1'>
              {t.title && (
                <div className='text-sm font-semibold'>{t.title}</div>
              )}
              {t.description && (
                <div className='text-sm opacity-90'>{t.description}</div>
              )}
            </div>
            <Button
              variant='outline'
              size='xs'
              onClick={() => dismissToast(t.id)}
              className='absolute right-2 top-2 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100'
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
