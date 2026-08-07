"use client";

import React, { useState, useTransition } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  Users,
  Calendar,
  Layers,
  ArrowRight,
  Loader2,
  HelpCircle,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import {
  batchImportTeams,
  batchImportSchedule,
  TeamImportRecord,
  ScheduleImportRecord,
} from "@/lib/actions/import-actions";

interface BatchImporterClientProps {
  seasons: { id: number; name: string }[];
  leagueNodes?: { id: number; name: string }[];
}

export default function BatchImporterClient({
  seasons,
  leagueNodes = [],
}: BatchImporterClientProps) {
  const [activeTab, setActiveTab] = useState<"teams" | "schedule">("teams");
  const [seasonId, setSeasonId] = useState<number>(seasons[0]?.id || 1);
  const [rawText, setRawText] = useState<string>("");
  const [leagueNodeId, setLeagueNodeId] = useState<number | "">("");

  const [parsedTeams, setParsedTeams] = useState<TeamImportRecord[]>([]);
  const [parsedSchedule, setParsedSchedule] = useState<ScheduleImportRecord[]>([]);

  const [importSummary, setImportSummary] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Parse Raw Text for Teams Mode
  const handleParseTeams = () => {
    setErrorMsg(null);
    setImportSummary(null);

    const lines = rawText.trim().split("\n");
    const records: TeamImportRecord[] = [];

    lines.forEach((line, idx) => {
      if (!line.trim()) return;

      // Handle CSV or tab separated
      const parts = line.split(/,|\t/).map((p) => p.trim());
      if (parts.length < 2) return;

      // Skip header if present
      if (idx === 0 && (parts[0].toLowerCase().includes("club") || parts[1].toLowerCase().includes("team"))) {
        return;
      }

      const clubName = parts[0];
      const teamName = parts[1];
      const gender = (parts[2] || "boys").toLowerCase() as any;
      const city = parts[3] || "";
      const state = parts[4] || "";

      records.push({
        clubName,
        teamName,
        gender: ["boys", "girls", "coed"].includes(gender) ? gender : "boys",
        city,
        state,
      });
    });

    if (records.length === 0) {
      setErrorMsg("No valid team records found. Ensure CSV format: Club Name, Team Name, Gender, City, State");
    } else {
      setParsedTeams(records);
    }
  };

  // Parse Raw Text for Schedule Mode
  const handleParseSchedule = () => {
    setErrorMsg(null);
    setImportSummary(null);

    const lines = rawText.trim().split("\n");
    const records: ScheduleImportRecord[] = [];

    lines.forEach((line, idx) => {
      if (!line.trim()) return;

      const parts = line.split(/,|\t/).map((p) => p.trim());
      if (parts.length < 5) return;

      // Skip header if present
      if (idx === 0 && (parts[0].toLowerCase().includes("date") || parts[2].toLowerCase().includes("home"))) {
        return;
      }

      const startDate = parts[0]; // YYYY-MM-DD
      const startTime = parts[1] || "10:00 AM";
      const homeClubName = parts[2];
      const homeTeamName = parts[3];
      const awayClubName = parts[4];
      const awayTeamName = parts[5] || parts[3];
      const locationName = parts[6] || "";
      const sublocationName = parts[7] || "";
      const gameType = (parts[8] || "league").toLowerCase() as any;

      records.push({
        startDate,
        startTime,
        homeClubName,
        homeTeamName,
        awayClubName,
        awayTeamName,
        locationName,
        sublocationName,
        gameType: ["league", "tournament", "friendly", "playoff"].includes(gameType) ? gameType : "league",
        leagueNodeId: leagueNodeId ? Number(leagueNodeId) : undefined,
      });
    });

    if (records.length === 0) {
      setErrorMsg("No valid schedule records found. Ensure format: Date, Time, Home Club, Home Team, Away Club, Away Team, Location, Field, Type");
    } else {
      setParsedSchedule(records);
    }
  };

  // Submit Teams Import
  const handleExecuteTeamsImport = () => {
    if (parsedTeams.length === 0) return;
    setErrorMsg(null);

    startTransition(async () => {
      try {
        const res = await batchImportTeams(seasonId, parsedTeams);
        if (res.success) {
          setImportSummary(res.summary);
          setParsedTeams([]);
          setRawText("");
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to import teams.");
      }
    });
  };

  // Submit Schedule Import
  const handleExecuteScheduleImport = () => {
    if (parsedSchedule.length === 0) return;
    setErrorMsg(null);

    startTransition(async () => {
      try {
        const res = await batchImportSchedule(seasonId, parsedSchedule);
        if (res.success) {
          setImportSummary(res.summary);
          setParsedSchedule([]);
          setRawText("");
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to import schedule.");
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-md">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
              <FileSpreadsheet size={14} />
              <span>Batch Data Importer</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
              Teams & Schedule Batch Importer
            </h1>
            <p className="text-xs text-muted max-w-2xl">
              Import teams, clubs, and match schedules from CSV or spreadsheets into leagues/tournaments. Existing clubs, teams, and games are automatically deduplicated.
            </p>
          </div>
        </div>
      </div>

      {/* MODE TABS */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          onClick={() => {
            setActiveTab("teams");
            setRawText("");
            setParsedTeams([]);
            setParsedSchedule([]);
            setErrorMsg(null);
            setImportSummary(null);
          }}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === "teams"
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-text"
          }`}
        >
          <Users size={16} />
          <span>Import Teams & Clubs</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("schedule");
            setRawText("");
            setParsedTeams([]);
            setParsedSchedule([]);
            setErrorMsg(null);
            setImportSummary(null);
          }}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === "schedule"
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-text"
          }`}
        >
          <Calendar size={16} />
          <span>Import Schedule Fixtures</span>
        </button>
      </div>

      {/* SUCCESS / ERROR ALERTS */}
      {importSummary && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center gap-3 text-xs font-semibold">
          <CheckCircle size={18} className="shrink-0" />
          <span>{importSummary}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center gap-3 text-xs font-semibold">
          <AlertTriangle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* INPUT FORM SECTION */}
      <Card variant="default" padding="lg" className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Target Season"
            value={seasonId}
            onChange={(e: any) => setSeasonId(Number(e.target.value))}
            options={seasons.map((s) => ({ value: s.id, label: s.name }))}
            width="full"
            showPlaceholder={false}
          />

          {activeTab === "schedule" && (
            <Select
              label="Assign to League/Division (Optional)"
              value={leagueNodeId}
              onChange={(e: any) => setLeagueNodeId(e.target.value ? Number(e.target.value) : "")}
              options={leagueNodes.map((n) => ({ value: n.id, label: n.name }))}
              placeholder="Select Division / Bracket (Optional)"
              showPlaceholder={true}
              width="full"
            />
          )}
        </div>

        {/* CSV Format Helper Box */}
        <div className="p-3 bg-background/50 border border-border/60 rounded-xl text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-text">
            <HelpCircle size={14} className="text-primary" />
            <span>Format Guidelines (CSV or Tab-Separated)</span>
          </div>
          {activeTab === "teams" ? (
            <p className="text-[11px] text-muted">
              Paste rows with columns: <strong className="text-text font-mono">Club Name, Team Name, Gender (boys/girls), City, State</strong>
              <br />
              Example: <code className="bg-background px-1 rounded text-primary">TSC, TSC U14 Boys, boys, Nashville, TN</code>
            </p>
          ) : (
            <p className="text-[11px] text-muted">
              Paste rows with columns: <strong className="text-text font-mono">Date (YYYY-MM-DD), Time, Home Club, Home Team, Away Club, Away Team, Location, Field, Type</strong>
              <br />
              Example: <code className="bg-background px-1 rounded text-primary">2026-09-15, 10:00 AM, TSC, TSC U14, Nashville SC, NSC U14, Down River Complex, Field 1, league</code>
            </p>
          )}
        </div>

        {/* Text Area */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted uppercase">
            Paste Data Rows
          </label>
          <textarea
            rows={8}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={
              activeTab === "teams"
                ? "Club Name, Team Name, Gender, City, State\nTSC, TSC U14 Premier, boys, Franklin, TN"
                : "Date, Time, Home Club, Home Team, Away Club, Away Team, Location, Field, Type\n2026-09-15, 10:00 AM, TSC, TSC U14, NSC, NSC U14, Down River Park, Field 3, league"
            }
            className="w-full p-3 font-mono text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-text placeholder:text-muted/50"
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={activeTab === "teams" ? handleParseTeams : handleParseSchedule}
            disabled={!rawText.trim()}
          >
            Preview & Verify Import Data
          </Button>
        </div>
      </Card>

      {/* PREVIEW TABLE FOR TEAMS */}
      {activeTab === "teams" && parsedTeams.length > 0 && (
        <Card variant="outlined" padding="lg" className="space-y-4 bg-surface shadow-sm">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <h3 className="font-bold text-sm text-text flex items-center gap-2">
              <Users size={16} className="text-primary" />
              <span>Parsed Teams Preview ({parsedTeams.length} Records)</span>
            </h3>

            <Button
              variant="success"
              size="sm"
              onClick={handleExecuteTeamsImport}
              disabled={isPending}
              className="flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={14} />
                  <span>Confirm & Run Teams Import</span>
                </>
              )}
            </Button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-background/60 text-[10px] font-bold uppercase text-muted">
                  <th className="p-3">#</th>
                  <th className="p-3">Club Name</th>
                  <th className="p-3">Team Name</th>
                  <th className="p-3">Gender</th>
                  <th className="p-3">City / State</th>
                </tr>
              </thead>
              <tbody>
                {parsedTeams.map((row, i) => (
                  <tr key={i} className="border-b border-border/40 hover:bg-background/25">
                    <td className="p-3 text-muted">{i + 1}</td>
                    <td className="p-3 font-bold text-text">{row.clubName}</td>
                    <td className="p-3 font-semibold text-text">{row.teamName}</td>
                    <td className="p-3 uppercase text-muted font-bold text-[10px]">{row.gender}</td>
                    <td className="p-3 text-muted">{row.city || "--"}, {row.state || "--"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* PREVIEW TABLE FOR SCHEDULE */}
      {activeTab === "schedule" && parsedSchedule.length > 0 && (
        <Card variant="outlined" padding="lg" className="space-y-4 bg-surface shadow-sm">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <h3 className="font-bold text-sm text-text flex items-center gap-2">
              <Calendar size={16} className="text-primary" />
              <span>Parsed Schedule Preview ({parsedSchedule.length} Matches)</span>
            </h3>

            <Button
              variant="success"
              size="sm"
              onClick={handleExecuteScheduleImport}
              disabled={isPending}
              className="flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={14} />
                  <span>Confirm & Run Schedule Import</span>
                </>
              )}
            </Button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-background/60 text-[10px] font-bold uppercase text-muted">
                  <th className="p-3">Date / Time</th>
                  <th className="p-3">Home Club & Team</th>
                  <th className="p-3">Away Club & Team</th>
                  <th className="p-3">Location & Field</th>
                  <th className="p-3">Match Type</th>
                </tr>
              </thead>
              <tbody>
                {parsedSchedule.map((row, i) => (
                  <tr key={i} className="border-b border-border/40 hover:bg-background/25">
                    <td className="p-3 font-semibold text-text">{row.startDate} {row.startTime}</td>
                    <td className="p-3 font-bold text-text">{row.homeClubName} {row.homeTeamName}</td>
                    <td className="p-3 font-bold text-text">{row.awayClubName} {row.awayTeamName}</td>
                    <td className="p-3 text-muted">{row.locationName || "TBD"} {row.sublocationName ? `(${row.sublocationName})` : ""}</td>
                    <td className="p-3 uppercase text-muted font-bold text-[10px]">{row.gameType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
