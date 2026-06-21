import { User } from "lucide-react";

interface LogoProps {
  formattedDate: string;
}

export default function Logo({ formattedDate }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-md">
        <User size={20} />
      </div>
      <div>
        <p className="text-sm font-bold text-text">Soccer Stats</p>
        <p className="text-xs text-muted hidden sm:block">{formattedDate}</p>
      </div>
    </div>
  );
}