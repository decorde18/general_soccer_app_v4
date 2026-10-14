import React, { useMemo } from "react";
import { Users, Loader2 } from "lucide-react";
import Select from "@/components/ui/Select";
import type { TeamSeason } from "@/types/nav";
import { getProgramLevelTeamName } from "./TeamSelector";

interface SidebarTeamSelectorProps {
  teams: TeamSeason[];
  currentTeamId: string;
  onChange: (e: any) => void;
  isLoading?: boolean;
}

interface ProgramGroup {
  primaryId: number;
  memberIds: number[];
  displayName: string;
  seasonName?: string;
}

export default function SidebarTeamSelector({
  teams,
  currentTeamId,
  onChange,
  isLoading = false,
}: SidebarTeamSelectorProps) {
  const programOptions = useMemo(() => {
    const groups = new Map<string, ProgramGroup>();

    teams.forEach((ts) => {
      const progName = getProgramLevelTeamName(ts.teamName, ts.clubType);
      const groupKey = `${ts.clubId}_${ts.seasonId || 0}_${progName}`;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          primaryId: ts.id,
          memberIds: [ts.id],
          displayName: progName,
          seasonName: ts.seasonName,
        });
      } else {
        const grp = groups.get(groupKey)!;
        grp.memberIds.push(ts.id);
        const isVarsity =
          ts.teamName.toLowerCase().includes("varsity") &&
          !ts.teamName.toLowerCase().includes("jv");
        if (isVarsity) {
          grp.primaryId = ts.id;
        }
      }
    });

    return Array.from(groups.values()).sort((a, b) =>
      a.displayName.localeCompare(b.displayName)
    );
  }, [teams]);

  if (programOptions.length === 0) {
    return (
      <div className="p-4 border-b border-border">
        <Select
          label="Current Team"
          value=""
          disabled={true}
          options={[]}
          width="full"
          showPlaceholder={true}
          placeholder="No teams found"
        />
      </div>
    );
  }

  const activeProgram = programOptions.find((p) =>
    currentTeamId ? p.memberIds.includes(Number(currentTeamId)) : false
  );
  const activeTeamValue = activeProgram ? String(activeProgram.primaryId) : "";

  if (programOptions.length === 1) {
    const isSelected = activeProgram?.memberIds.includes(Number(currentTeamId));
    return (
      <div className="p-4 border-b border-border space-y-1.5">
        <span className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center justify-between">
          <span>Current Team</span>
          {isLoading && <Loader2 size={12} className="animate-spin text-primary" />}
        </span>
        <div
          onClick={() => {
            if (!isSelected) {
              onChange({ target: { value: String(programOptions[0].primaryId) } });
            }
          }}
          className={`flex items-center gap-2.5 p-3 rounded-lg border border-border bg-surface/50 ${
            !isSelected ? "cursor-pointer hover:border-primary/50 transition-colors" : ""
          }`}
        >
          <Users size={16} className="text-primary flex-shrink-0" />
          <span className="text-sm font-semibold text-text truncate">
            {programOptions[0].displayName}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-b border-border relative">
      <Select
        label="Current Team"
        value={activeTeamValue}
        onChange={onChange}
        isLoading={isLoading}
        disabled={isLoading}
        options={programOptions.map((prog) => ({
          value: String(prog.primaryId),
          label: prog.displayName,
        }))}
        width="full"
        showPlaceholder={true}
        placeholder="Select Team..."
      />
    </div>
  );
}