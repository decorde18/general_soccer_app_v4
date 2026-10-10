"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Swords, Plus, Check } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Toggle from "@/components/ui/Toggle";

import {
  getTerminalCompetitionNodes,
  enrollTeamInCompetitionNode,
  createAndEnrollCompetition,
} from "@/lib/actions/teamEnrollment-actions";

interface AddTeamCompetitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamSeasonId: number;
  seasonId: number;
}

interface CompetitionNodeOption {
  id: number;
  leagueId: number;
  name: string;
  breadcrumbs: string;
  isTournament: boolean;
}

export default function AddTeamCompetitionModal({
  isOpen,
  onClose,
  teamSeasonId,
  seasonId,
}: AddTeamCompetitionModalProps) {
  const router = useRouter();

  const [mode, setMode] = useState<"existing" | "create">("existing");
  const [nodes, setNodes] = useState<CompetitionNodeOption[]>([]);
  const [loadingNodes, setLoadingNodes] = useState(false);

  // Form states - Existing Node
  const [selectedNodeId, setSelectedNodeId] = useState<string>("");

  // Form states - New Competition
  const [compName, setCompName] = useState("");
  const [compAbbr, setCompAbbr] = useState("");
  const [isTournament, setIsTournament] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setLoadingNodes(true);
      getTerminalCompetitionNodes()
        .then((data) => {
          setNodes(data);
          if (data.length > 0) {
            setSelectedNodeId(String(data[0].id));
          }
        })
        .catch((err) => {
          setError(err.message || "Failed to load competition nodes");
        })
        .finally(() => {
          setLoadingNodes(false);
        });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === "existing") {
        if (!selectedNodeId) {
          throw new Error("Please select a competition.");
        }
        await enrollTeamInCompetitionNode({
          teamSeasonId,
          seasonId,
          leagueNodeId: Number(selectedNodeId),
        });
      } else {
        if (!compName.trim()) {
          throw new Error("Please enter a competition name.");
        }
        await createAndEnrollCompetition({
          teamSeasonId,
          seasonId,
          name: compName.trim(),
          abbreviation: compAbbr.trim() || undefined,
          isTournament,
        });
      }

      router.refresh();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to process competition enrollment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Competition">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mode Toggle */}
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/70 bg-background/70 p-1">
          <button
            type="button"
            onClick={() => setMode("existing")}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
              mode === "existing"
                ? "bg-primary text-primary-contrast shadow-sm"
                : "text-muted hover:text-text"
            }`}
          >
            <Trophy size={14} />
            Assign Existing
          </button>
          <button
            type="button"
            onClick={() => setMode("create")}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
              mode === "create"
                ? "bg-primary text-primary-contrast shadow-sm"
                : "text-muted hover:text-text"
            }`}
          >
            <Plus size={14} />
            Create New
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-500">
            {error}
          </div>
        )}

        {mode === "existing" ? (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                Select Competition Division / Node
              </label>
              {loadingNodes ? (
                <div className="rounded-xl border border-border/70 bg-surface/50 p-4 text-center text-xs text-muted">
                  Loading available competitions...
                </div>
              ) : nodes.length === 0 ? (
                <div className="rounded-xl border border-border/70 bg-surface/50 p-4 text-center text-xs text-muted">
                  No existing competition divisions found. Click &quot;Create New&quot; above to create one.
                </div>
              ) : (
                <Select
                  value={selectedNodeId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedNodeId(e.target.value)}
                  disabled={isSubmitting}
                >
                  {nodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.breadcrumbs} ({node.isTournament ? "Tournament" : "League"})
                    </option>
                  ))}
                </Select>
              )}
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Enrolling in an existing competition connects this team season to the division standings, schedule, and league nodes.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              label="Competition Name"
              placeholder="e.g. TSSAA District 11-AAA or Smoky Mountain Cup"
              value={compName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompName(e.target.value)}
              required
              disabled={isSubmitting}
            />

            <Input
              label="Abbreviation (Optional)"
              placeholder="e.g. D11-AAA or SMC"
              value={compAbbr}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompAbbr(e.target.value)}
              disabled={isSubmitting}
            />

            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-surface/50 p-3.5">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-text flex items-center gap-1.5">
                  {isTournament ? <Swords size={14} className="text-primary" /> : <Trophy size={14} className="text-primary" />}
                  Competition Type
                </span>
                <p className="text-xs text-muted">
                  {isTournament ? "Knockout / Group Stage Tournament" : "Regular Season Division League"}
                </p>
              </div>
              <Toggle
                checked={isTournament}
                onChange={(checked: boolean) => setIsTournament(checked)}
                disabled={isSubmitting}
              />
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/40">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isSubmitting || (mode === "existing" && !selectedNodeId)}
          >
            {isSubmitting
              ? mode === "existing"
                ? "Enrolling..."
                : "Creating..."
              : mode === "existing"
              ? "Enroll in Competition"
              : "Create & Enroll"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
