import { cn } from "@/lib/utils";

const sizeClasses: Record<string, string> = {
  sm: "min-h-[2.5rem] px-3 text-sm",
  md: "min-h-[3rem] px-4 text-base",
  lg: "min-h-[3.5rem] px-5 text-lg",
};

export function useFormClasses({
  size = "md",
  disabled = false,
  error = false,
  className = "",
}: any) {
  return cn(
    "appearance-none w-full rounded-md border transition-colors duration-200 outline-none shadow-sm",
    "bg-white text-slate-900 placeholder:text-slate-500 border-slate-200",
    "focus:border-blue-500 focus:ring-blue-500/20",
    error
      ? "border-red-500 text-red-700 focus:border-red-500 focus:ring-red-500/20"
      : "",
    disabled && "bg-slate-100 opacity-60 cursor-not-allowed",
    sizeClasses[size] || sizeClasses.md,
    className,
  );
}
