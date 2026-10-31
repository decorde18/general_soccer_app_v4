"use client";

import React, { useState, useTransition, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Checkbox from "@/components/ui/Checkbox";
import Modal from "@/components/ui/Modal";
import {
  Award,
  Trophy,
  Plus,
  Trash2,
  Shield,
  Star,
  Sparkles,
  CheckCircle2,
  GraduationCap,
  Medal,
  Wand2,
} from "lucide-react";
import {
  upsertAwardAction,
  deleteAwardAction,
  upsertPlayerSeasonLetterAction,
  autoCalculateTeamSeasonLettersAction,
  deletePlayerSeasonLetterAction,
} from "@/lib/actions/awards-actions";
import { toast } from "sonner";

interface Player {
  id: number;
  personId: number;
  firstName: string;
  lastName: string;
  jerseyNumber: number | null;
  grade?: string | null;
  squadLevel?: string | null;
}

interface TeamAwardsAndLettersProps {
  teamSeasonId: number;
  seasonId: number;
  seasonName: string;
  programTeamSeasonIds?: number[];
  players: Player[];
  initialAwards: any[];
  initialLetters: any[];
  canManage?: boolean;
}

const STANDARD_HIGH_SCHOOL_AWARDS = [
  { title: "All-District", category: "district" },
  { title: "All-District Tournament", category: "district" },
  { title: "District Player of the Year", category: "district" },
  { title: "District Offensive MVP", category: "district" },
  { title: "District Defensive MVP", category: "district" },
  { title: "District Goalkeeper of the Year", category: "district" },
  { title: "All-Region", category: "region" },
  { title: "All-State", category: "state" },
  { title: "Overall MVP", category: "team" },
  { title: "Offensive MVP", category: "team" },
  { title: "Defensive MVP", category: "team" },
  { title: "Midfield MVP", category: "team" },
  { title: "Eagle Heart Award", category: "team" },
  { title: "Eagle Tough Award", category: "team" },
  { title: "Most Improved", category: "team" },
  { title: "Most Outstanding JV Athlete", category: "team" },
  { title: "Coaches' Choice", category: "team" },
  { title: "Scholar Athlete / Academic Honor Roll", category: "academic" },
];

export default function TeamAwardsAndLetters({
  teamSeasonId,
  seasonId,
  seasonName,
  programTeamSeasonIds = [],
  players,
  initialAwards = [],
  initialLetters = [],
  canManage = true,
}: TeamAwardsAndLettersProps) {
  const [activeSubTab, setActiveSubTab] = useState<"awards" | "letters">("awards");
  const [awards, setAwards] = useState<any[]>(initialAwards);
  const [letters, setLetters] = useState<any[]>(initialLetters);
  const [isPending, startTransition] = useTransition();

  // Award Modal State
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<string>(
    players[0] ? String(players[0].personId) : ""
  );
  const [awardTitle, setAwardTitle] = useState<string>("All-District");
  const [customAwardTitle, setCustomAwardTitle] = useState<string>("");
  const [awardCategory, setAwardCategory] = useState<string>("district");
  const [awardOrganization, setAwardOrganization] = useState<string>("TSSAA / Team");
  const [awardNotes, setAwardNotes] = useState<string>("");

  // Letter Modal State
  const [isLetterModalOpen, setIsLetterModalOpen] = useState(false);
  const [letterPlayerId, setLetterPlayerId] = useState<string>(
    players[0] ? String(players[0].personId) : ""
  );
  const [varsityLetter, setVarsityLetter] = useState<boolean>(true);
  const [certificate, setCertificate] = useState<boolean>(true);
  const [numberPatch, setNumberPatch] = useState<string>("");
  const [numberPatchNeeded, setNumberPatchNeeded] = useState<boolean>(false);
  const [varsityPatchNeeded, setVarsityPatchNeeded] = useState<boolean>(false);
  const [ball, setBall] = useState<boolean>(false);
  const [bar, setBar] = useState<boolean>(true);
  const [letterNotes, setLetterNotes] = useState<string>("");

  const playerOptions = useMemo(
    () => [
      { value: "", label: "-- Team Achievement (No Single Player) --" },
      ...players.map((p) => ({
        value: String(p.personId),
        label: `${p.lastName}, ${p.firstName}${p.jerseyNumber !== null ? ` (#${p.jerseyNumber})` : ""}`,
      })),
    ],
    [players]
  );

  const awardPresetOptions = useMemo(
    () => [
      ...STANDARD_HIGH_SCHOOL_AWARDS.map((a) => ({
        value: a.title,
        label: `${a.title} (${a.category.toUpperCase()})`,
      })),
      { value: "__custom__", label: "+ Custom Award Title..." },
    ],
    []
  );

  const categoryOptions = [
    { value: "team", label: "Team Award" },
    { value: "district", label: "District Honor" },
    { value: "region", label: "Region Honor" },
    { value: "state", label: "State Honor" },
    { value: "national", label: "National Honor" },
    { value: "academic", label: "Academic / Scholar" },
    { value: "coaching", label: "Coaching Honor" },
    { value: "other", label: "Other" },
  ];

  const handleSaveAward = () => {
    const finalTitle = awardTitle === "__custom__" ? customAwardTitle.trim() : awardTitle;
    if (!finalTitle) {
      toast.error("Please enter an award title");
      return;
    }

    const yearMatch = seasonName.match(/(\d{4})/);
    const yearNum = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

    startTransition(async () => {
      const res = await upsertAwardAction({
        personId: selectedPersonId ? Number(selectedPersonId) : null,
        teamSeasonId,
        seasonId,
        title: finalTitle,
        category: awardCategory as any,
        scope: selectedPersonId ? "individual_player" : "team_achievement",
        organization: awardOrganization,
        year: yearNum,
        notes: awardNotes,
      });

      if (res.success && res.award) {
        setAwards((prev) => [res.award, ...prev]);
        setIsAwardModalOpen(false);
        setCustomAwardTitle("");
        setAwardNotes("");
        toast.success("Award recorded!");
      } else {
        toast.error(res.error || "Failed to save award");
      }
    });
  };

  const handleDeleteAward = (id: number) => {
    const prev = [...awards];
    setAwards((list) => list.filter((a) => a.id !== id));
    startTransition(async () => {
      const res = await deleteAwardAction(id, teamSeasonId);
      if (!res.success) {
        setAwards(prev);
        toast.error(res.error || "Failed to delete award");
      } else {
        toast.success("Award removed");
      }
    });
  };

  const handleAutoCalculateLetters = () => {
    startTransition(async () => {
      const res = await autoCalculateTeamSeasonLettersAction(teamSeasonId, programTeamSeasonIds);
      if (res.success && res.letters) {
        setLetters(res.letters);
        toast.success(`Auto-calculated Varsity Letterman & Patch awards for ${res.count} rostered players!`);
      } else {
        toast.error(res.error || "Failed to auto-calculate letters");
      }
    });
  };

  const handleSaveLetter = () => {
    if (!letterPlayerId) {
      toast.error("Select a player");
      return;
    }

    startTransition(async () => {
      const res = await upsertPlayerSeasonLetterAction({
        playerId: Number(letterPlayerId),
        seasonId,
        teamSeasonId,
        varsityLetter,
        numberPatch: numberPatch ? parseInt(numberPatch, 10) : null,
        certificate,
        bar,
        ball,
        numberPatchNeeded,
        varsityPatchNeeded,
        notes: letterNotes,
      });

      if (res.success && res.letter) {
        setLetters((prev) => {
          const filtered = prev.filter((l) => l.player_id !== Number(letterPlayerId));
          return [...filtered, res.letter];
        });
        setIsLetterModalOpen(false);
        toast.success("Letterman record updated!");
      } else {
        toast.error(res.error || "Failed to save letterman record");
      }
    });
  };

  const handleDeleteLetter = (id: number) => {
    const prev = [...letters];
    setLetters((list) => list.filter((l) => l.id !== id));
    startTransition(async () => {
      const res = await deletePlayerSeasonLetterAction(id, teamSeasonId);
      if (!res.success) {
        setLetters(prev);
        toast.error("Failed to remove letter record");
      } else {
        toast.success("Letter record removed");
      }
    });
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "state":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "region":
        return "bg-purple-500/20 text-purple-300 border-purple-500/40";
      case "district":
        return "bg-indigo-500/20 text-indigo-300 border-indigo-500/40";
      case "academic":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      default:
        return "bg-primary/20 text-primary border-primary/40";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface/60 p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-text flex items-center gap-2">
            <Award className="text-amber-400" size={20} />
            <span>Awards, Honors & Varsity Letters</span>
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Manage end-of-season player honors (All-District, All-Region, Team MVPs) and High School Varsity Letterman patches, certificates, sport balls, and chevron bars.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex bg-background p-1 rounded-xl border border-border">
            <Button
              type="button"
              variant={activeSubTab === "awards" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setActiveSubTab("awards")}
              className="text-xs px-3 py-1.5 rounded-lg"
            >
              <Trophy size={14} className="mr-1.5" />
              <span>Season Honors ({awards.length})</span>
            </Button>
            <Button
              type="button"
              variant={activeSubTab === "letters" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setActiveSubTab("letters")}
              className="text-xs px-3 py-1.5 rounded-lg"
            >
              <GraduationCap size={14} className="mr-1.5" />
              <span>Varsity Letters ({letters.length})</span>
            </Button>
          </div>

          {canManage && activeSubTab === "awards" && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsAwardModalOpen(true)}
              className="text-xs px-3.5 py-2 flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Add Award / Honor</span>
            </Button>
          )}

          {canManage && activeSubTab === "letters" && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                isLoading={isPending}
                disabled={isPending}
                onClick={handleAutoCalculateLetters}
                className="text-xs px-3 py-2 flex items-center gap-1.5"
              >
                <Wand2 size={14} />
                <span>{isPending ? "Calculating..." : "Auto-Calculate Season Letters"}</span>
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setIsLetterModalOpen(true)}
                className="text-xs px-3 py-2 flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Log Player Letter</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* SUB-TAB 1: SEASON AWARDS & HONORS */}
      {activeSubTab === "awards" && (
        <div className="space-y-4">
          {awards.length === 0 ? (
            <Card variant="outlined" padding="lg" className="text-center py-14 bg-surface/20">
              <Trophy size={40} className="mx-auto text-muted/60 mb-3" />
              <h3 className="text-base font-bold text-text mb-1">No Season Awards Recorded Yet</h3>
              <p className="text-xs text-muted max-w-md mx-auto mb-4">
                Record All-District, All-Region, All-State, Offensive/Defensive MVP, Eagle Heart, and Academic honors for {seasonName}.
              </p>
              {canManage && (
                <Button variant="primary" size="sm" onClick={() => setIsAwardModalOpen(true)}>
                  <Plus size={14} className="mr-1.5" />
                  <span>Record First Award</span>
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {awards.map((a) => (
                <Card
                  key={a.id}
                  variant="outlined"
                  padding="md"
                  className="flex flex-col justify-between bg-surface/80 hover:border-primary/40 transition-all"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${getCategoryBadge(
                          a.category
                        )}`}
                      >
                        <Medal size={11} />
                        {a.category}
                      </span>
                      {canManage && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleDeleteAward(a.id)}
                          className="text-muted hover:text-danger p-1 h-auto"
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-extrabold text-text">{a.title}</h3>
                      {a.people ? (
                        <p className="text-sm font-semibold text-primary mt-0.5">
                          {a.people.first_name} {a.people.last_name}
                        </p>
                      ) : (
                        <p className="text-xs font-medium text-muted mt-0.5">Team Achievement</p>
                      )}
                    </div>

                    {a.notes && <p className="text-xs text-muted italic">{a.notes}</p>}
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-border/50 flex items-center justify-between text-[11px] text-muted">
                    <span>{a.organization || "High School Honor"}</span>
                    <span className="font-mono font-semibold">{a.year || seasonName}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: VARSITY LETTERS & PATCHES */}
      {activeSubTab === "letters" && (
        <Card variant="outlined" padding="none" className="overflow-hidden">
          {letters.length === 0 ? (
            <div className="text-center py-14 px-4">
              <GraduationCap size={40} className="mx-auto text-muted/60 mb-3" />
              <h3 className="text-base font-bold text-text mb-1">No Letterman Records for {seasonName}</h3>
              <p className="text-xs text-muted max-w-lg mx-auto mb-4">
                Track Varsity Letters, Graduation Class Number Patches, Participation Certificates, 1st-Year Varsity Sport Balls, and Multi-Year Chevron Bars.
              </p>
              {canManage && (
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    isLoading={isPending}
                    disabled={isPending}
                    onClick={handleAutoCalculateLetters}
                  >
                    <Wand2 size={14} className="mr-1.5" />
                    <span>Auto-Calculate from Roster</span>
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setIsLetterModalOpen(true)}>
                    <Plus size={14} className="mr-1.5" />
                    <span>Add Manually</span>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-surface/90 border-b border-border text-[11px] uppercase tracking-wider font-bold text-muted">
                    <th className="py-3 px-4">Player</th>
                    <th className="py-3 px-3 text-center">Varsity Letter</th>
                    <th className="py-3 px-3 text-center">Certificate</th>
                    <th className="py-3 px-3 text-center">Class # Patch</th>
                    <th className="py-3 px-3 text-center">1st-Yr V Patch</th>
                    <th className="py-3 px-3 text-center">Sport Ball (1st Yr)</th>
                    <th className="py-3 px-3 text-center">Chevron Bar (2+ Yr)</th>
                    {canManage && <th className="py-3 px-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {letters.map((l) => (
                    <tr key={l.id} className="hover:bg-surface-hover/50 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-text">
                        {l.people ? `${l.people.last_name}, ${l.people.first_name}` : `Player #${l.player_id}`}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {l.varsity_letter ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-extrabold">
                            <Star size={12} /> Varsity Letter
                          </span>
                        ) : (
                          <span className="text-xs text-muted">JV / Partic.</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {l.certificate ? (
                          <CheckCircle2 size={16} className="mx-auto text-emerald-400" />
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-xs">
                        {l.number_patch ? (
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${
                              l.number_patch_needed
                                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                : "text-muted"
                            }`}
                          >
                            &apos;{String(l.number_patch).slice(-2)} ({l.number_patch})
                            {l.number_patch_needed ? " ★" : ""}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {l.varsity_patch_needed ? (
                          <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-xs font-bold">
                            Needed
                          </span>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {l.ball ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                            ⚽ Ball Patch
                          </span>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {l.bar ? (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-bold">
                            ══ Chevron Bar
                          </span>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                      {canManage && (
                        <td className="py-2.5 px-3 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleDeleteLetter(l.id)}
                            className="text-muted hover:text-danger p-1 h-auto"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ADD AWARD MODAL */}
      <Modal
        isOpen={isAwardModalOpen}
        onClose={() => setIsAwardModalOpen(false)}
        title="Record Season Award or Honor"
      >
        <div className="space-y-4">
          <Select
            label="Recipient Player"
            options={playerOptions}
            value={selectedPersonId}
            onChange={(e: any) => setSelectedPersonId(e.target?.value ?? e)}
            width="full"
          />

          <Select
            label="Award / Honor Title"
            options={awardPresetOptions}
            value={awardTitle}
            onChange={(e: any) => {
              const val = e.target?.value ?? e;
              setAwardTitle(val);
              const preset = STANDARD_HIGH_SCHOOL_AWARDS.find((a) => a.title === val);
              if (preset) setAwardCategory(preset.category);
            }}
            width="full"
          />

          {awardTitle === "__custom__" && (
            <Input
              label="Custom Award Title"
              placeholder="e.g. Golden Boot, Team Captain Award..."
              value={customAwardTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomAwardTitle(e.target.value)}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Award Category"
              options={categoryOptions}
              value={awardCategory}
              onChange={(e: any) => setAwardCategory(e.target?.value ?? e)}
              width="full"
            />
            <Input
              label="Organization / Presenter"
              placeholder="e.g. TSSAA District 11-AAA"
              value={awardOrganization}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAwardOrganization(e.target.value)}
            />
          </div>

          <Input
            label="Notes (Optional)"
            placeholder="Additional details..."
            value={awardNotes}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAwardNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button variant="ghost" onClick={() => setIsAwardModalOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveAward} isLoading={isPending} disabled={isPending}>
              {isPending ? "Saving..." : "Save Award"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ADD / EDIT VARSITY LETTER MODAL */}
      <Modal
        isOpen={isLetterModalOpen}
        onClose={() => setIsLetterModalOpen(false)}
        title="Log Player Varsity Letter & Patches"
      >
        <div className="space-y-4">
          <Select
            label="Player"
            options={players.map((p) => ({
              value: String(p.personId),
              label: `${p.lastName}, ${p.firstName}`,
            }))}
            value={letterPlayerId}
            onChange={(e: any) => setLetterPlayerId(e.target?.value ?? e)}
            width="full"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-background/60 p-3.5 rounded-xl border border-border">
            <Checkbox
              label="Earned Varsity Letter"
              checked={varsityLetter}
              onChange={(e: any) => setVarsityLetter(Boolean(e.target?.checked ?? e))}
            />
            <Checkbox
              label="Participation Certificate"
              checked={certificate}
              onChange={(e: any) => setCertificate(Boolean(e.target?.checked ?? e))}
            />
            <Checkbox
              label="1st-Yr Varsity Patch Needed"
              checked={varsityPatchNeeded}
              onChange={(e: any) => {
                const checked = Boolean(e.target?.checked ?? e);
                setVarsityPatchNeeded(checked);
                if (checked) {
                  setBall(true);
                  setBar(false);
                }
              }}
            />
            <Checkbox
              label="Sport Ball Patch (1st Yr Varsity)"
              checked={ball}
              onChange={(e: any) => setBall(Boolean(e.target?.checked ?? e))}
            />
            <Checkbox
              label="Chevron Bar (Repeat Varsity)"
              checked={bar}
              onChange={(e: any) => setBar(Boolean(e.target?.checked ?? e))}
            />
            <Checkbox
              label="Grad Year Number Patch Needed"
              checked={numberPatchNeeded}
              onChange={(e: any) => setNumberPatchNeeded(Boolean(e.target?.checked ?? e))}
            />
          </div>

          <Input
            label="Graduation Year Number Patch (e.g. 2026)"
            type="number"
            placeholder="2026"
            value={numberPatch}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumberPatch(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button variant="ghost" onClick={() => setIsLetterModalOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveLetter} isLoading={isPending} disabled={isPending}>
              {isPending ? "Saving..." : "Save Letterman Record"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
