import { Building2 } from "lucide-react";
import Select from "@/components/ui/Select";
import type { Club } from "@/types/nav";

interface ClubSelectorProps {
  clubs: Club[];
  selectedClubId: string;
  onChange: (e: any) => void;
}

export default function ClubSelector({ clubs, selectedClubId, onChange }: ClubSelectorProps) {
  if (clubs.length === 0) return null;

  if (clubs.length === 1) {
    return (
      <div className="p-4 border-b border-border space-y-1.5">
        <span className="text-xs font-semibold text-muted uppercase tracking-wider block">
          Current Club
        </span>
        <div className="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-surface/50">
          <Building2 size={16} className="text-primary flex-shrink-0" />
          <span className="text-sm font-semibold text-text truncate">{clubs[0].name}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-b border-border">
      <Select
        label="Current Club"
        value={selectedClubId}
        onChange={onChange}
        options={clubs.map((club) => ({ value: String(club.id), label: club.name }))}
        width="full"
        showPlaceholder={true}
        placeholder="Select Club..."
      />
    </div>
  );
}