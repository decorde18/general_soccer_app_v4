"use client";

import React, { useState, useTransition, useRef, useEffect } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Users,
  Calendar,
  Layers,
  ArrowRight,
  Loader2,
  HelpCircle,
  ShieldAlert,
  Info,
  Check,
  UserPlus,
  Trophy,
  FileText,
  Paperclip,
  Sliders,
  Settings2,
  HeartHandshake,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import {
  batchImportTeams,
  batchImportSchedule,
  batchImportRoster,
  TeamImportRecord,
  ScheduleImportRecord,
  RosterImportRecord,
  ParentImportRecord,
} from "@/lib/actions/import-actions";

interface BatchImporterClientProps {
  seasons: { id: number; name: string }[];
  leagueNodes?: { id: number; name: string }[];
  teamSeasons?: { id: number; seasonId: number; clubName: string; teamName: string; label: string }[];
}

function normalizeGenderInput(genderStr?: string): "boys" | "girls" | "coed" {
  const g = (genderStr || "").trim().toLowerCase();
  if (["f", "female", "girls", "girl", "w", "women"].includes(g)) return "girls";
  if (["coed", "mixed", "co-ed", "m/f"].includes(g)) return "coed";
  if (["m", "male", "boys", "boy", "men"].includes(g)) return "boys";
  return "boys";
}

function normalizeGenderDisplay(genderStr?: string): string {
  const g = (genderStr || "").trim().toLowerCase();
  if (["f", "female", "girls", "girl", "w", "women"].includes(g)) return "Girls";
  if (["m", "male", "boys", "boy", "men"].includes(g)) return "Boys";
  if (["coed", "mixed", "co-ed", "m/f"].includes(g)) return "Coed";
  return genderStr || "-";
}

function cleanGrade(gradeStr?: string): string | undefined {
  if (!gradeStr) return undefined;
  const cleaned = gradeStr.replace(/[\s\-_]*grade/gi, "").trim();
  return cleaned || gradeStr.trim();
}

// Synchronous Header Auto-Detection
function detectRosterHeaderMapping(headers: string[]) {
  const rMap = {
    firstName: -1,
    lastName: -1,
    gender: -1,
    birthDate: -1,
    jerseyNumber: -1,
    position: -1,
    grade: -1,
    email: -1,
    phone: -1,
    status: -1,
    clubName: -1,
    teamName: -1,
    parent1FirstName: -1,
    parent1LastName: -1,
    parent1Email: -1,
    parent1Phone: -1,
    parent2FirstName: -1,
    parent2LastName: -1,
    parent2Email: -1,
    parent2Phone: -1,
  };

  headers.forEach((header, idx) => {
    const h = header.toLowerCase().trim().replace(/[^a-z0-9]/g, "");

    // PARENT 1 FIELDS
    if (h.startsWith("parent1") || h.includes("guardian1") || h.includes("mom") || h.includes("mother")) {
      if (h.includes("first") || h.includes("fname")) rMap.parent1FirstName = idx;
      else if (h.includes("last") || h.includes("lname")) rMap.parent1LastName = idx;
      else if (h.includes("email") || h.includes("mail")) rMap.parent1Email = idx;
      else if (h.includes("mobile") || h.includes("phone") || h.includes("cell") || h.includes("number")) rMap.parent1Phone = idx;
    }
    // PARENT 2 FIELDS
    else if (h.startsWith("parent2") || h.includes("guardian2") || h.includes("dad") || h.includes("father")) {
      if (h.includes("first") || h.includes("fname")) rMap.parent2FirstName = idx;
      else if (h.includes("last") || h.includes("lname")) rMap.parent2LastName = idx;
      else if (h.includes("email") || h.includes("mail")) rMap.parent2Email = idx;
      else if (h.includes("phone") || h.includes("mobile") || h.includes("cell") || h.includes("number")) rMap.parent2Phone = idx;
    }
    // PLAYER FIELDS
    else {
      if (h.includes("playerfirst") || h === "playername" || (h.includes("first") && !h.includes("parent"))) {
        rMap.firstName = idx;
      } else if (h.includes("playerlast") || (h.includes("last") && !h.includes("parent"))) {
        rMap.lastName = idx;
      } else if (h.includes("gender") || h === "sex" || h === "g") {
        rMap.gender = idx;
      } else if (h.includes("birth") || h.includes("dob")) {
        rMap.birthDate = idx;
      } else if (h.includes("jersey") || h.includes("shirt") || h.includes("number") || h === "num" || h === "no") {
        rMap.jerseyNumber = idx;
      } else if (h.includes("pos") || h.includes("role")) {
        rMap.position = idx;
      } else if (h.includes("grade") || h.includes("class")) {
        rMap.grade = idx;
      } else if (h.includes("email") && !h.includes("parent")) {
        rMap.email = idx;
      } else if ((h.includes("phone") || h.includes("mobile")) && !h.includes("parent")) {
        rMap.phone = idx;
      } else if (h.includes("status")) {
        rMap.status = idx;
      } else if (h.includes("club")) {
        rMap.clubName = idx;
      } else if (h.includes("team") && !h.includes("teamseason") && !h.includes("seasonid")) {
        rMap.teamName = idx;
      }
    }
  });

  return rMap;
}

export default function BatchImporterClient({
  seasons,
  leagueNodes = [],
  teamSeasons = [],
}: BatchImporterClientProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import Mode: Roster Players (default), Clubs & Teams, or Match Schedules
  const [importMode, setImportMode] = useState<"roster" | "teams" | "schedule">("roster");

  // Target Season & Target Team Selection
  const [targetSeasonId, setTargetSeasonId] = useState<number>(seasons[0]?.id || 1);
  const [targetRosterTeamSeasonId, setTargetRosterTeamSeasonId] = useState<number | "">("");

  // Input Data & File State
  const [rawText, setRawText] = useState<string>("");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [hasHeaderRow, setHasHeaderRow] = useState<boolean>(true);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);

  // Schedule Mode Options
  const [defaultScheduleGameType, setDefaultScheduleGameType] = useState<"league" | "tournament" | "friendly" | "playoff">("league");
  const [leagueNodeId, setLeagueNodeId] = useState<number | "">("");

  // --- HEADER-BASED COLUMN MAPPING STATES FOR PLAYERS & PARENTS ---
  const [rosterMapping, setRosterMapping] = useState<{
    firstName: number;
    lastName: number;
    gender: number;
    birthDate: number;
    jerseyNumber: number;
    position: number;
    grade: number;
    email: number;
    phone: number;
    status: number;
    clubName: number;
    teamName: number;
    // Parent 1 Fields
    parent1FirstName: number;
    parent1LastName: number;
    parent1Email: number;
    parent1Phone: number;
    // Parent 2 Fields
    parent2FirstName: number;
    parent2LastName: number;
    parent2Email: number;
    parent2Phone: number;
  }>({
    firstName: -1,
    lastName: -1,
    gender: -1,
    birthDate: -1,
    jerseyNumber: -1,
    position: -1,
    grade: -1,
    email: -1,
    phone: -1,
    status: -1,
    clubName: -1,
    teamName: -1,
    parent1FirstName: -1,
    parent1LastName: -1,
    parent1Email: -1,
    parent1Phone: -1,
    parent2FirstName: -1,
    parent2LastName: -1,
    parent2Email: -1,
    parent2Phone: -1,
  });

  const [teamsMapping, setTeamsMapping] = useState<{
    clubName: number;
    teamName: number;
    gender: number;
    city: number;
    state: number;
  }>({
    clubName: -1,
    teamName: -1,
    gender: -1,
    city: -1,
    state: -1,
  });

  const [scheduleMapping, setScheduleMapping] = useState<{
    startDate: number;
    startTime: number;
    homeClub: number;
    homeTeam: number;
    awayClub: number;
    awayTeam: number;
    gender: number;
    location: number;
    sublocation: number;
    gameType: number;
  }>({
    startDate: -1,
    startTime: -1,
    homeClub: -1,
    homeTeam: -1,
    awayClub: -1,
    awayTeam: -1,
    gender: -1,
    location: -1,
    sublocation: -1,
    gameType: -1,
  });

  // Parsed records state
  const [parsedRoster, setParsedRoster] = useState<RosterImportRecord[]>([]);
  const [parsedTeams, setParsedTeams] = useState<TeamImportRecord[]>([]);
  const [parsedSchedule, setParsedSchedule] = useState<ScheduleImportRecord[]>([]);

  const [importSummary, setImportSummary] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Selected Objects
  const selectedSeason = seasons.find((s) => s.id === targetSeasonId) || seasons[0];
  const availableTeamSeasons = teamSeasons.filter((ts) => ts.seasonId === targetSeasonId);
  const selectedTargetTeam = teamSeasons.find((ts) => ts.id === Number(targetRosterTeamSeasonId));

  // --- HEADER-BASED SMART AUTO-MAPPER FOR PLAYERS & PARENTS ---
  useEffect(() => {
    if (!rawText.trim()) {
      setCsvHeaders([]);
      setParsedRoster([]);
      setParsedTeams([]);
      setParsedSchedule([]);
      return;
    }

    const lines = rawText.trim().split("\n");
    if (lines.length === 0) return;

    const firstLineParts = lines[0].split(/,|\t/).map((p) => p.trim());
    setCsvHeaders(firstLineParts);

    if (hasHeaderRow) {
      const autoMap = detectRosterHeaderMapping(firstLineParts);
      setRosterMapping(autoMap);
    }
  }, [rawText, hasHeaderRow]);

  // Re-parse when target team or mapping changes dynamically
  useEffect(() => {
    if (rawText.trim() && importMode === "roster") {
      parseRosterText(rawText);
    }
  }, [targetRosterTeamSeasonId, rosterMapping, importMode]);

  // Handle Native CSV File Upload (.csv, .tsv, .txt)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setErrorMsg(null);
    setImportSummary(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || "";
      setRawText(text);

      setTimeout(() => {
        if (importMode === "roster") parseRosterText(text);
        else if (importMode === "teams") parseTeamsText(text);
        else if (importMode === "schedule") parseScheduleText(text);
      }, 50);
    };
    reader.readAsText(file);
  };

  // --- PARSE ROSTER PLAYERS & PARENTS ---
  const parseRosterText = (text: string) => {
    setErrorMsg(null);
    setImportSummary(null);

    const lines = text.trim().split("\n");
    if (lines.length === 0) return;

    const firstLineParts = lines[0].split(/,|\t/).map((p) => p.trim());
    const autoMap = hasHeaderRow ? detectRosterHeaderMapping(firstLineParts) : null;

    // Merge manual UI state overrides with autoMap (autoMap takes precedence when header matches)
    const activeMapping = { ...rosterMapping };

    if (autoMap) {
      (Object.keys(autoMap) as Array<keyof typeof autoMap>).forEach((key) => {
        if (autoMap[key] >= 0) {
          activeMapping[key] = autoMap[key];
        }
      });
    }

    const records: RosterImportRecord[] = [];
    const isSpecificTeamSelected = Boolean(targetRosterTeamSeasonId);
    const startIndex = hasHeaderRow ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      const parts = line.split(/,|\t/).map((p) => p.trim());

      let firstName = activeMapping.firstName >= 0 ? parts[activeMapping.firstName] || "" : "";
      let lastName = activeMapping.lastName >= 0 ? parts[activeMapping.lastName] || "" : "";

      if (!lastName && firstName.includes(" ")) {
        const nameParts = firstName.trim().split(/\s+/);
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(" ");
      }

      const rawGender = activeMapping.gender >= 0 ? parts[activeMapping.gender] : undefined;
      const birthDate = activeMapping.birthDate >= 0 ? parts[activeMapping.birthDate] || undefined : undefined;
      const email = activeMapping.email >= 0 ? parts[activeMapping.email] || undefined : undefined;
      const phone = activeMapping.phone >= 0 ? parts[activeMapping.phone] || undefined : undefined;
      const jNum = activeMapping.jerseyNumber >= 0 ? parts[activeMapping.jerseyNumber] : undefined;
      const jerseyNumber = jNum && !isNaN(Number(jNum)) ? Number(jNum) : undefined;
      const position = activeMapping.position >= 0 ? parts[activeMapping.position] || undefined : undefined;
      const rawGrade = activeMapping.grade >= 0 ? parts[activeMapping.grade] || undefined : undefined;
      const grade = cleanGrade(rawGrade);
      const status = activeMapping.status >= 0 ? parts[activeMapping.status] || "rostered" : "rostered";

      // Parent 1 Fields
      const p1First = activeMapping.parent1FirstName >= 0 ? parts[activeMapping.parent1FirstName] : undefined;
      const p1Last = activeMapping.parent1LastName >= 0 ? parts[activeMapping.parent1LastName] : undefined;
      const p1Email = activeMapping.parent1Email >= 0 ? parts[activeMapping.parent1Email] : undefined;
      const p1Phone = activeMapping.parent1Phone >= 0 ? parts[activeMapping.parent1Phone] : undefined;

      const parent1: ParentImportRecord | undefined =
        p1First || p1Last || p1Email || p1Phone
          ? { firstName: p1First, lastName: p1Last, email: p1Email, phone: p1Phone }
          : undefined;

      // Parent 2 Fields
      const p2First = activeMapping.parent2FirstName >= 0 ? parts[activeMapping.parent2FirstName] : undefined;
      const p2Last = activeMapping.parent2LastName >= 0 ? parts[activeMapping.parent2LastName] : undefined;
      const p2Email = activeMapping.parent2Email >= 0 ? parts[activeMapping.parent2Email] : undefined;
      const p2Phone = activeMapping.parent2Phone >= 0 ? parts[activeMapping.parent2Phone] : undefined;

      const parent2: ParentImportRecord | undefined =
        p2First || p2Last || p2Email || p2Phone
          ? { firstName: p2First, lastName: p2Last, email: p2Email, phone: p2Phone }
          : undefined;

      const clubName = isSpecificTeamSelected
        ? selectedTargetTeam?.clubName
        : activeMapping.clubName >= 0
        ? parts[activeMapping.clubName] || undefined
        : undefined;

      const teamName = isSpecificTeamSelected
        ? selectedTargetTeam?.teamName
        : activeMapping.teamName >= 0
        ? parts[activeMapping.teamName] || undefined
        : undefined;

      if (!firstName || !lastName) continue;

      if (!isSpecificTeamSelected && (!clubName || !teamName)) {
        continue;
      }

      records.push({
        firstName,
        lastName,
        gender: rawGender ? normalizeGenderDisplay(rawGender) : undefined,
        birthDate,
        email,
        phone,
        jerseyNumber,
        position,
        grade,
        status,
        targetTeamSeasonId: isSpecificTeamSelected ? Number(targetRosterTeamSeasonId) : undefined,
        clubName,
        teamName,
        parent1,
        parent2,
      });
    }

    if (records.length === 0) {
      if (activeMapping.gender < 0) {
        setErrorMsg("Gender column is required for player import. Please map the Gender column in the matrix below.");
      } else if (!isSpecificTeamSelected && (activeMapping.clubName < 0 || activeMapping.teamName < 0)) {
        setErrorMsg(
          "No Target Team selected in the top dropdown AND Club/Team columns are not mapped. Please select a Target Team at the top OR map Club Name and Team Name columns."
        );
      } else {
        setErrorMsg("No valid player records found. Please check your First Name, Last Name, and Gender column mappings.");
      }
    } else {
      setParsedRoster(records);
    }
  };

  // --- PARSE TEAMS & CLUBS ---
  const parseTeamsText = (text: string) => {
    setErrorMsg(null);
    setImportSummary(null);

    const lines = text.trim().split("\n");
    const records: TeamImportRecord[] = [];
    const startIndex = hasHeaderRow ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      const parts = line.split(/,|\t/).map((p) => p.trim());

      const clubName = teamsMapping.clubName >= 0 ? parts[teamsMapping.clubName] || "" : "";
      const teamName = teamsMapping.teamName >= 0 ? parts[teamsMapping.teamName] || "" : "";
      const gender = teamsMapping.gender >= 0 ? normalizeGenderInput(parts[teamsMapping.gender]) : "boys";
      const city = teamsMapping.city >= 0 ? parts[teamsMapping.city] || "" : "";
      const state = teamsMapping.state >= 0 ? parts[teamsMapping.state] || "" : "";

      if (!clubName || !teamName) continue;
      records.push({ clubName, teamName, gender, city, state });
    }

    if (records.length === 0) {
      setErrorMsg("No valid team records found. Please check your CSV column mapping.");
    } else {
      setParsedTeams(records);
    }
  };

  // --- PARSE MATCH SCHEDULES ---
  const parseScheduleText = (text: string) => {
    setErrorMsg(null);
    setImportSummary(null);

    const lines = text.trim().split("\n");
    const records: ScheduleImportRecord[] = [];
    const startIndex = hasHeaderRow ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      const parts = line.split(/,|\t/).map((p) => p.trim());

      const startDate = scheduleMapping.startDate >= 0 ? parts[scheduleMapping.startDate] || "" : "";
      const startTime = scheduleMapping.startTime >= 0 ? parts[scheduleMapping.startTime] || undefined : undefined;
      const homeClubName = scheduleMapping.homeClub >= 0 ? parts[scheduleMapping.homeClub] || "" : "";
      const homeTeamName = scheduleMapping.homeTeam >= 0 ? parts[scheduleMapping.homeTeam] || "" : "";
      const awayClubName = scheduleMapping.awayClub >= 0 ? parts[scheduleMapping.awayClub] || "" : "";
      const awayTeamName = scheduleMapping.awayTeam >= 0 ? parts[scheduleMapping.awayTeam] || homeTeamName : homeTeamName;
      const gender = scheduleMapping.gender >= 0 ? normalizeGenderInput(parts[scheduleMapping.gender]) : "boys";
      const locationName = scheduleMapping.location >= 0 ? parts[scheduleMapping.location] || undefined : undefined;
      const sublocationName = scheduleMapping.sublocation >= 0 ? parts[scheduleMapping.sublocation] || undefined : undefined;
      const rawType = scheduleMapping.gameType >= 0 ? parts[scheduleMapping.gameType] : undefined;
      const gameType = (rawType || defaultScheduleGameType).toLowerCase() as any;

      if (!startDate || !homeTeamName) continue;

      records.push({
        startDate,
        startTime,
        homeClubName,
        homeTeamName,
        awayClubName,
        awayTeamName,
        gender,
        locationName,
        sublocationName,
        gameType,
        leagueNodeId: leagueNodeId ? Number(leagueNodeId) : undefined,
      });
    }

    if (records.length === 0) {
      setErrorMsg("No valid schedule records found. Please check Date and Team column mappings.");
    } else {
      setParsedSchedule(records);
    }
  };

  // Execute Import Action
  const handleExecuteImport = () => {
    setErrorMsg(null);
    setImportSummary(null);

    startTransition(async () => {
      try {
        if (importMode === "roster") {
          const res = await batchImportRoster(
            targetSeasonId,
            parsedRoster,
            targetRosterTeamSeasonId ? Number(targetRosterTeamSeasonId) : undefined
          );
          setImportSummary(res.summary);
          setParsedRoster([]);
          setRawText("");
          setUploadedFileName(null);
        } else if (importMode === "teams") {
          const res = await batchImportTeams(targetSeasonId, parsedTeams);
          setImportSummary(res.summary);
          setParsedTeams([]);
          setRawText("");
          setUploadedFileName(null);
        } else {
          const res = await batchImportSchedule(targetSeasonId, parsedSchedule);
          setImportSummary(res.summary);
          setParsedSchedule([]);
          setRawText("");
          setUploadedFileName(null);
        }
      } catch (err: any) {
        setErrorMsg(err?.message || "Batch import failed.");
      }
    });
  };

  // Dynamic CSV Header Dropdown Options reading exact CSV Header Names!
  const columnSelectOptions = [
    { value: "-1", label: "— Skip Field (Not in CSV) —" },
    ...csvHeaders.map((header, idx) => ({
      value: String(idx),
      label: header ? `"${header}" (Col ${idx + 1})` : `Column ${idx + 1}`,
    })),
  ];

  return (
    <div className="space-y-8">
      {/* 1. TOP HEADER & TARGET SCOPE CARD */}
      <div className="rounded-2xl border border-slate-700/80 bg-slate-800/80 p-6 md:p-8 backdrop-blur-md shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-indigo-400" />
              Batch Data Importer
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              Import player rosters, parents (`player_relationships`), teams/clubs, and match schedules via CSV file or copy-paste text.
            </p>
          </div>

          {/* Import Mode Selector Tabs */}
          <div className="flex bg-slate-950/90 p-1.5 rounded-xl border border-slate-700/80">
            <button
              onClick={() => {
                setImportMode("roster");
                setErrorMsg(null);
                setImportSummary(null);
              }}
              className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all ${
                importMode === "roster"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <UserPlus className="h-4 w-4" />
              Players & Parents
            </button>
            <button
              onClick={() => {
                setImportMode("teams");
                setErrorMsg(null);
                setImportSummary(null);
              }}
              className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all ${
                importMode === "teams"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Users className="h-4 w-4" />
              Teams & Clubs
            </button>
            <button
              onClick={() => {
                setImportMode("schedule");
                setErrorMsg(null);
                setImportSummary(null);
              }}
              className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all ${
                importMode === "schedule"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Calendar className="h-4 w-4" />
              Schedules
            </button>
          </div>
        </div>

        {/* TARGET SEASON & TARGET TEAM SELECTION GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-700/60">
          {/* Target Season */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-indigo-500/30 space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-indigo-400" />
              Target Season *
            </label>
            <Select
              value={targetSeasonId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setTargetSeasonId(Number(e.target.value));
                setTargetRosterTeamSeasonId("");
              }}
              options={seasons.map((s) => ({
                value: String(s.id),
                label: s.name,
              }))}
            />
            <p className="text-[11px] text-slate-400">
              All imports scope to <strong className="text-white">{selectedSeason?.name}</strong>
            </p>
          </div>

          {/* Target Team Selection (For Players / Roster Mode) */}
          {importMode === "roster" && (
            <div className="bg-slate-950/80 p-4 rounded-xl border border-indigo-500/30 space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-indigo-400" />
                  Target Team for Roster Import
                </span>
                {targetRosterTeamSeasonId ? (
                  <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                    Target Team Set ✓
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                    Read Club/Team from CSV
                  </span>
                )}
              </label>
              <Select
                value={targetRosterTeamSeasonId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setTargetRosterTeamSeasonId(e.target.value ? Number(e.target.value) : "")
                }
                options={availableTeamSeasons.map((ts) => ({
                  value: String(ts.id),
                  label: `${ts.clubName} — ${ts.teamName}`,
                }))}
                placeholder="Select Target Team (Or Read Club & Team Name from CSV)"
                showPlaceholder={true}
              />
              <p className="text-[11px] text-slate-400">
                {targetRosterTeamSeasonId ? (
                  <span>
                    Rostering players directly to <strong className="text-emerald-300">{selectedTargetTeam?.label}</strong>. Club/Team columns are not needed!
                  </span>
                ) : (
                  <span>
                    No team selected. Each CSV row MUST include <strong className="text-amber-300">Club Name</strong> and <strong className="text-amber-300">Team Name</strong> columns.
                  </span>
                )}
              </p>
            </div>
          )}

          {importMode !== "roster" && (
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-700/60 flex items-center">
              <p className="text-xs text-slate-400">
                {importMode === "teams"
                  ? "Importing Clubs & Teams into target season."
                  : "Importing Fixture Schedules into target season."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 2. HEADER MAPPING MATRIX (Displays when CSV Headers exist) */}
      {csvHeaders.length > 0 && (
        <div className="rounded-xl border border-indigo-500/40 bg-slate-900/90 p-5 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/80 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-indigo-400" />
                CSV Header Mapping Matrix ({csvHeaders.length} Columns Detected)
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Match target fields to the actual header names read from your CSV file.
              </p>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-700">
              <input
                type="checkbox"
                checked={hasHeaderRow}
                onChange={(e) => setHasHeaderRow(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <span>Row 1 is Header Name</span>
            </label>
          </div>

          {/* PLAYERS & PARENTS MAPPING SECTIONS */}
          {importMode === "roster" && (
            <div className="space-y-5">
              {/* SECTION A: PLAYER FIELDS */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2.5 flex items-center gap-1.5">
                  <UserPlus className="h-3.5 w-3.5 text-indigo-400" />
                  Player Information Fields
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-red-300 mb-1">
                      Player First Name *
                    </label>
                    <Select
                      value={String(rosterMapping.firstName)}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setRosterMapping((prev) => ({ ...prev, firstName: Number(e.target.value) }))
                      }
                      options={columnSelectOptions}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-red-300 mb-1">
                      Player Last Name *
                    </label>
                    <Select
                      value={String(rosterMapping.lastName)}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setRosterMapping((prev) => ({ ...prev, lastName: Number(e.target.value) }))
                      }
                      options={columnSelectOptions}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-red-300 mb-1">
                      Gender * [Required]
                    </label>
                    <Select
                      value={String(rosterMapping.gender)}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setRosterMapping((prev) => ({ ...prev, gender: Number(e.target.value) }))
                      }
                      options={columnSelectOptions}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Jersey # (`number`)
                    </label>
                    <Select
                      value={String(rosterMapping.jerseyNumber)}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setRosterMapping((prev) => ({ ...prev, jerseyNumber: Number(e.target.value) }))
                      }
                      options={columnSelectOptions}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Position (Optional)
                    </label>
                    <Select
                      value={String(rosterMapping.position)}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setRosterMapping((prev) => ({ ...prev, position: Number(e.target.value) }))
                      }
                      options={columnSelectOptions}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Grade (Optional)
                    </label>
                    <Select
                      value={String(rosterMapping.grade)}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setRosterMapping((prev) => ({ ...prev, grade: Number(e.target.value) }))
                      }
                      options={columnSelectOptions}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Birth Date (Optional)
                    </label>
                    <Select
                      value={String(rosterMapping.birthDate)}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setRosterMapping((prev) => ({ ...prev, birthDate: Number(e.target.value) }))
                      }
                      options={columnSelectOptions}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Player Email (Optional)
                    </label>
                    <Select
                      value={String(rosterMapping.email)}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setRosterMapping((prev) => ({ ...prev, email: Number(e.target.value) }))
                      }
                      options={columnSelectOptions}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION B: PARENT 1 & PARENT 2 OPTIONAL FIELDS */}
              <div className="border-t border-slate-700/80 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-2.5 flex items-center gap-1.5">
                  <HeartHandshake className="h-3.5 w-3.5 text-amber-400" />
                  Parent & Guardian Optional Fields (`player_relationships`)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  {/* Parent 1 */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Parent 1 First Name
                    </label>
                    <Select
                      value={String(rosterMapping.parent1FirstName)}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setRosterMapping((prev) => ({ ...prev, parent1FirstName: Number(e.target.value) }))
                      }
                      options={columnSelectOptions}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Parent 1 Last Name
                    </label>
                    <Select
                      value={String(rosterMapping.parent1LastName)}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setRosterMapping((prev) => ({ ...prev, parent1LastName: Number(e.target.value) }))
                      }
                      options={columnSelectOptions}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Parent 1 Email
                    </label>
                    <Select
                      value={String(rosterMapping.parent1Email)}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setRosterMapping((prev) => ({ ...prev, parent1Email: Number(e.target.value) }))
                      }
                      options={columnSelectOptions}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Parent 1 Mobile Phone
                    </label>
                    <Select
                      value={String(rosterMapping.parent1Phone)}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setRosterMapping((prev) => ({ ...prev, parent1Phone: Number(e.target.value) }))
                      }
                      options={columnSelectOptions}
                    />
                  </div>

                  {/* Parent 2 */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Parent 2 First Name
                    </label>
                    <Select
                      value={String(rosterMapping.parent2FirstName)}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setRosterMapping((prev) => ({ ...prev, parent2FirstName: Number(e.target.value) }))
                      }
                      options={columnSelectOptions}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Parent 2 Last Name
                    </label>
                    <Select
                      value={String(rosterMapping.parent2LastName)}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setRosterMapping((prev) => ({ ...prev, parent2LastName: Number(e.target.value) }))
                      }
                      options={columnSelectOptions}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Parent 2 Email
                    </label>
                    <Select
                      value={String(rosterMapping.parent2Email)}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setRosterMapping((prev) => ({ ...prev, parent2Email: Number(e.target.value) }))
                      }
                      options={columnSelectOptions}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Parent 2 Mobile Phone
                    </label>
                    <Select
                      value={String(rosterMapping.parent2Phone)}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setRosterMapping((prev) => ({ ...prev, parent2Phone: Number(e.target.value) }))
                      }
                      options={columnSelectOptions}
                    />
                  </div>
                </div>
              </div>

              {/* ONLY SHOW Club/Team mapping fields IF Target Team is NOT selected */}
              {!targetRosterTeamSeasonId ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border-t border-slate-700/80 pt-4">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-300 mb-1">
                      Club Name * (Required if no Target Team)
                    </label>
                    <Select
                      value={String(rosterMapping.clubName)}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setRosterMapping((prev) => ({ ...prev, clubName: Number(e.target.value) }))
                      }
                      options={columnSelectOptions}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-amber-300 mb-1">
                      Team Name * (Required if no Target Team)
                    </label>
                    <Select
                      value={String(rosterMapping.teamName)}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setRosterMapping((prev) => ({ ...prev, teamName: Number(e.target.value) }))
                      }
                      options={columnSelectOptions}
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl text-[11px] text-emerald-300 flex items-center gap-2 font-medium">
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>
                    Target Team is set to <strong>{selectedTargetTeam?.label}</strong>. Club Name and Team Name columns are automatically skipped and assigned.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TEAMS MODE TARGET FIELDS */}
          {importMode === "teams" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-red-300 mb-1">Club Name *</label>
                <Select
                  value={String(teamsMapping.clubName)}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setTeamsMapping((prev) => ({ ...prev, clubName: Number(e.target.value) }))
                  }
                  options={columnSelectOptions}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-red-300 mb-1">Team Name *</label>
                <Select
                  value={String(teamsMapping.teamName)}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setTeamsMapping((prev) => ({ ...prev, teamName: Number(e.target.value) }))
                  }
                  options={columnSelectOptions}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Gender</label>
                <Select
                  value={String(teamsMapping.gender)}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setTeamsMapping((prev) => ({ ...prev, gender: Number(e.target.value) }))
                  }
                  options={columnSelectOptions}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">City</label>
                <Select
                  value={String(teamsMapping.city)}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setTeamsMapping((prev) => ({ ...prev, city: Number(e.target.value) }))
                  }
                  options={columnSelectOptions}
                />
              </div>
            </div>
          )}

          {/* SCHEDULE MODE TARGET FIELDS */}
          {importMode === "schedule" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-red-300 mb-1">Match Date *</label>
                <Select
                  value={String(scheduleMapping.startDate)}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setScheduleMapping((prev) => ({ ...prev, startDate: Number(e.target.value) }))
                  }
                  options={columnSelectOptions}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-red-300 mb-1">Home Team *</label>
                <Select
                  value={String(scheduleMapping.homeTeam)}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setScheduleMapping((prev) => ({ ...prev, homeTeam: Number(e.target.value) }))
                  }
                  options={columnSelectOptions}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-red-300 mb-1">Away Team *</label>
                <Select
                  value={String(scheduleMapping.awayTeam)}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setScheduleMapping((prev) => ({ ...prev, awayTeam: Number(e.target.value) }))
                  }
                  options={columnSelectOptions}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Location</label>
                <Select
                  value={String(scheduleMapping.location)}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setScheduleMapping((prev) => ({ ...prev, location: Number(e.target.value) }))
                  }
                  options={columnSelectOptions}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. CSV INPUT & PREVIEW GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: FILE UPLOAD & TEXTAREA */}
        <div className="space-y-5">
          {/* FILE UPLOAD DROPZONE */}
          <div className="rounded-xl border border-indigo-500/30 bg-slate-900/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Upload className="h-4 w-4 text-indigo-400" />
                Upload CSV / TSV File 📁
              </h3>
              {uploadedFileName && (
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <Paperclip className="h-3.5 w-3.5" />
                  {uploadedFileName}
                </span>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-950/60 hover:bg-slate-900/60 rounded-xl p-6 text-center cursor-pointer transition-all space-y-2 group"
            >
              <FileText className="mx-auto h-8 w-8 text-slate-500 group-hover:text-indigo-400 transition-colors" />
              <p className="text-xs font-bold text-slate-200">
                Click to choose `.csv` file or drag & drop
              </p>
              <p className="text-[11px] text-slate-400">
                Supports standard comma or tab-separated exports from Excel / Google Sheets
              </p>
            </div>
          </div>

          {/* SCHEDULE GAME TYPE PROMPT */}
          {importMode === "schedule" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                  <Trophy className="h-3.5 w-3.5 text-amber-400" />
                  Game Play Type Prompt *
                </label>
                <Select
                  value={defaultScheduleGameType}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setDefaultScheduleGameType(e.target.value as any)
                  }
                  options={[
                    { value: "league", label: "League Play 🏆" },
                    { value: "tournament", label: "Tournament Play 🎪" },
                    { value: "friendly", label: "Friendly Match 🤝" },
                    { value: "playoff", label: "Playoff Match 🥇" },
                  ]}
                />
              </div>

              {leagueNodes.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    League / Division Node (Optional)
                  </label>
                  <Select
                    value={leagueNodeId}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setLeagueNodeId(e.target.value ? Number(e.target.value) : "")
                    }
                    options={leagueNodes.map((n) => ({
                      value: String(n.id),
                      label: n.name,
                    }))}
                    placeholder="Choose division node..."
                    showPlaceholder={true}
                  />
                </div>
              )}
            </div>
          )}

          {/* RAW TEXTAREA FALLBACK */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Or Paste Raw CSV Data Below
              </label>
              <span className="text-xs text-slate-400">Commas or Tabs</span>
            </div>

            <textarea
              rows={9}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={
                importMode === "roster"
                  ? targetRosterTeamSeasonId
                    ? "id,team,season_id,season,division,player_first_name,player_last_name,gender,birth_date,grade,age_group,position,number,Foot,parent1_email,parent1_first_name,parent1_last_name,parent1_mobile_number\n1,TSC,1,2026,U15,John,Smith,Boys,2010-05-12,9th,U15,Midfielder,10,Right,john.sr@example.com,John,Smith,555-0192"
                    : "player_first_name,player_last_name,gender,number,position,grade,parent1_first_name,parent1_last_name,parent1_email"
                  : importMode === "teams"
                  ? "Dallas Texans, Texans 08 Boys, boys, Dallas, TX\nSolar SC, Solar 09 Girls, girls, Frisco, TX"
                  : "2026-09-15, 10:00 AM, Dallas Texans, Texans 08 Boys, Solar SC, Solar 08 Boys, boys, Toyota Stadium, Field 1, league"
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 font-mono text-xs text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
            />
          </div>

          <Button
            onClick={() => {
              if (importMode === "roster") parseRosterText(rawText);
              else if (importMode === "teams") parseTeamsText(rawText);
              else if (importMode === "schedule") parseScheduleText(rawText);
            }}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 shadow-lg shadow-indigo-600/20"
          >
            Parse & Validate Records 🔍
          </Button>
        </div>

        {/* Right Column: Mapping Preview & Execution */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center justify-between">
            <span>Validated Field Mapping Preview</span>
            {importMode === "roster" && (
              <span className="text-xs text-indigo-400 font-normal">{parsedRoster.length} players ready</span>
            )}
            {importMode === "teams" && (
              <span className="text-xs text-indigo-400 font-normal">{parsedTeams.length} teams ready</span>
            )}
            {importMode === "schedule" && (
              <span className="text-xs text-indigo-400 font-normal">{parsedSchedule.length} fixtures ready</span>
            )}
          </h3>

          {errorMsg && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {importSummary && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
              <span>{importSummary}</span>
            </div>
          )}

          {/* Table Preview */}
          <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-700/80 bg-slate-950/60 p-1">
            {importMode === "roster" && parsedRoster.length > 0 && (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Target Team</th>
                    <th className="p-2.5">Player Name</th>
                    <th className="p-2.5">Gender</th>
                    <th className="p-2.5">Jersey</th>
                    <th className="p-2.5">Parent 1 Info</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {parsedRoster.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="p-2.5 text-slate-300">
                        {r.clubName || selectedTargetTeam?.clubName} - {r.teamName || selectedTargetTeam?.teamName}
                      </td>
                      <td className="p-2.5 font-bold text-white">{r.firstName} {r.lastName}</td>
                      <td className="p-2.5 text-amber-300 font-semibold">{r.gender || "-"}</td>
                      <td className="p-2.5 text-indigo-400 font-bold">{r.jerseyNumber ? `#${r.jerseyNumber}` : "-"}</td>
                      <td className="p-2.5 text-slate-400">
                        {r.parent1?.firstName || r.parent1?.email ? (
                          <span>
                            {r.parent1.firstName} {r.parent1.lastName} ({r.parent1.email || r.parent1.phone || "No contact"})
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {importMode === "teams" && parsedTeams.length > 0 && (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Club Name</th>
                    <th className="p-2.5">Team Name</th>
                    <th className="p-2.5">Gender</th>
                    <th className="p-2.5">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {parsedTeams.map((t, i) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="p-2.5 font-bold text-white">{t.clubName}</td>
                      <td className="p-2.5 text-indigo-300">{t.teamName}</td>
                      <td className="p-2.5 capitalize">{t.gender}</td>
                      <td className="p-2.5 text-slate-400">{[t.city, t.state].filter(Boolean).join(", ") || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {importMode === "schedule" && parsedSchedule.length > 0 && (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Date & Time</th>
                    <th className="p-2.5">Home Team</th>
                    <th className="p-2.5">Away Team</th>
                    <th className="p-2.5">Play Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {parsedSchedule.map((s, i) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="p-2.5 text-slate-300">{s.startDate} {s.startTime || ""}</td>
                      <td className="p-2.5 font-bold text-emerald-400">{s.homeClubName} {s.homeTeamName}</td>
                      <td className="p-2.5 font-bold text-blue-400">{s.awayClubName} {s.awayTeamName}</td>
                      <td className="p-2.5 font-bold text-amber-300 capitalize">{s.gameType || defaultScheduleGameType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {parsedRoster.length === 0 && parsedTeams.length === 0 && parsedSchedule.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs">
                Upload a `.csv` file or paste data on the left, then click "Parse & Validate Records".
              </div>
            )}
          </div>

          <Button
            onClick={handleExecuteImport}
            disabled={
              isPending ||
              (importMode === "roster" && parsedRoster.length === 0) ||
              (importMode === "teams" && parsedTeams.length === 0) ||
              (importMode === "schedule" && parsedSchedule.length === 0)
            }
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing Records...
              </>
            ) : (
              <>
                {importMode === "roster"
                  ? targetRosterTeamSeasonId
                    ? `Import Players & Parents into ${selectedTargetTeam?.teamName} 🚀`
                    : `Import All Players & Parents 🚀`
                  : importMode === "teams"
                  ? `Import Teams & Clubs into ${selectedSeason?.name} 🚀`
                  : `Import Match Schedules into ${selectedSeason?.name} 🚀`}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
