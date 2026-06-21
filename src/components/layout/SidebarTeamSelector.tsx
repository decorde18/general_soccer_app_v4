import { Users } from "lucide-react";
import Select from "@/components/ui/Select";
import type { TeamSeason } from "@/types/nav";

interface SidebarTeamSelectorProps {
  teams: TeamSeason[];
  currentTeamId: string;
  onChange: (e: any) => void;
}

export default function SidebarTeamSelector({
  teams,
  currentTeamId,
  onChange,
}: SidebarTeamSelectorProps) {
  if (teams.length === 0) return null;

  if (teams.length === 1) {
    return (
      <div className="p-4 border-b border-border space-y-1.5">
        <span className="text-xs font-semibold text-muted uppercase tracking-wider block">
          Current Team
        </span>
        <div className="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-surface/50">
          <Users size={16} className="text-primary flex-shrink-0" />
          <span className="text-sm font-semibold text-text truncate">{teams[0].teamName}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-b border-border">
      <Select
        label="Current Team"
        value={currentTeamId}
        onChange={onChange}
        options={teams.map((team) => ({ value: String(team.id), label: team.teamName }))}
        width="full"
        showPlaceholder={true}
        placeholder="Select Team..."
      />
    </div>
  );
}