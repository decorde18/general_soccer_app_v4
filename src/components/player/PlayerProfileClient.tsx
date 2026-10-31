"use client";

import React, { useState } from "react";
import {
  User,
  Trophy,
  Activity,
  Calendar,
  Shield,
  Filter,
  CheckCircle,
  Clock,
  Target,
  Award,
  TrendingUp,
} from "lucide-react";
import { PlayerProfileData } from "@/lib/data/queries";
import Select from "@/components/ui/Select";

interface PlayerProfileClientProps {
  playerData: PlayerProfileData;
}

export default function PlayerProfileClient({
  playerData,
}: PlayerProfileClientProps) {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("all");

  const { firstName, lastName, email, phone, seasonStats, careerTotals, awards = [], letters = [] } = playerData;

  // Filter stats based on selected season
  const activeSeasonStat =
    selectedSeasonId === "all"
      ? null
      : seasonStats.find((s) => s.seasonId === Number(selectedSeasonId));

  const displayStats = activeSeasonStat
    ? {
        gamesPlayed: activeSeasonStat.gamesPlayed,
        gamesStarted: activeSeasonStat.gamesStarted,
        goals: activeSeasonStat.goals,
        assists: activeSeasonStat.assists,
        yellowCards: activeSeasonStat.yellowCards,
        redCards: activeSeasonStat.redCards,
        shots: activeSeasonStat.shots,
        saves: activeSeasonStat.saves,
        cleanSheets: activeSeasonStat.cleanSheets,
        minutesPlayed: activeSeasonStat.minutesPlayed,
        plusMinus: activeSeasonStat.plusMinus,
      }
    : careerTotals;

  // Season dropdown options
  const seasonOptions = [
    { value: "all", label: "Career Totals (All Seasons)" },
    ...seasonStats.map((s) => ({
      value: String(s.seasonId),
      label: `${s.seasonName} — ${s.clubName} ${s.teamName}`,
    })),
  ];

  return (
    <div className="space-y-8">
      {/* Player Header Banner */}
      <div className="rounded-2xl border border-slate-700/80 bg-slate-800/80 p-6 md:p-8 backdrop-blur-md shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-extrabold text-2xl md:text-3xl shadow-inner">
            {firstName.charAt(0)}
            {lastName.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {firstName} {lastName}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-300">
              {email && (
                <span>
                  📧 <strong className="text-slate-200">{email}</strong>
                </span>
              )}
              {phone && (
                <span>
                  📞 <strong className="text-slate-200">{phone}</strong>
                </span>
              )}
              <span>
                ⚽ <strong className="text-slate-200">{seasonStats.length} Season(s)</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Season Filter Dropdown */}
        <div className="w-full md:w-72 bg-slate-950/60 p-3 rounded-xl border border-slate-700/60">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-indigo-400" />
            Filter Stats by Season
          </label>
          <Select
            value={selectedSeasonId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedSeasonId(e.target.value)}
            options={seasonOptions}
          />
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
        <div className="rounded-xl border border-slate-700/80 bg-slate-800/70 p-4 backdrop-blur-sm shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1">
            <Trophy className="h-3.5 w-3.5 text-amber-400" /> Goals
          </p>
          <p className="mt-2 text-3xl font-extrabold text-white">{displayStats.goals}</p>
        </div>

        <div className="rounded-xl border border-slate-700/80 bg-slate-800/70 p-4 backdrop-blur-sm shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1">
            <Target className="h-3.5 w-3.5 text-indigo-400" /> Assists
          </p>
          <p className="mt-2 text-3xl font-extrabold text-indigo-300">{displayStats.assists}</p>
        </div>

        <div className="rounded-xl border border-slate-700/80 bg-slate-800/70 p-4 backdrop-blur-sm shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 text-cyan-400" /> +/- Net
          </p>
          <p className="mt-2 text-3xl font-extrabold text-cyan-300">
            {displayStats.plusMinus > 0 ? `+${displayStats.plusMinus}` : displayStats.plusMinus}
          </p>
        </div>

        <div className="rounded-xl border border-slate-700/80 bg-slate-800/70 p-4 backdrop-blur-sm shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1">
            <Activity className="h-3.5 w-3.5 text-emerald-400" /> Games Played
          </p>
          <p className="mt-2 text-3xl font-extrabold text-emerald-400">
            {displayStats.gamesPlayed}
            <span className="text-xs font-normal text-slate-400 ml-1">({displayStats.gamesStarted} GS)</span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-700/80 bg-slate-800/70 p-4 backdrop-blur-sm shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-blue-400" /> Minutes
          </p>
          <p className="mt-2 text-3xl font-extrabold text-blue-300">{displayStats.minutesPlayed}'</p>
        </div>

        <div className="rounded-xl border border-slate-700/80 bg-slate-800/70 p-4 backdrop-blur-sm shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1">
            🟨 Discipline
          </p>
          <p className="mt-2 text-3xl font-extrabold text-amber-300">
            {displayStats.yellowCards}
            <span className="text-xs font-normal text-red-400 ml-1">/ {displayStats.redCards} R</span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-700/80 bg-slate-800/70 p-4 backdrop-blur-sm shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1">
            🧤 Saves / Clean
          </p>
          <p className="mt-2 text-3xl font-extrabold text-teal-300">
            {displayStats.saves}
            <span className="text-xs font-normal text-slate-400 ml-1">({displayStats.cleanSheets} CS)</span>
          </p>
        </div>
      </div>

      {/* Season-by-Season Career Breakdown Table */}
      <div className="overflow-hidden rounded-xl border border-slate-700/80 bg-slate-800/80 shadow-xl backdrop-blur-md">
        <div className="border-b border-slate-700/80 px-6 py-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-400" />
            Season-by-Season Performance History
          </h2>
          <span className="text-xs text-slate-400">{seasonStats.length} seasons</span>
        </div>

        {seasonStats.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No season performance records found for this player.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Season</th>
                  <th className="px-6 py-3.5">Club & Team</th>
                  <th className="px-6 py-3.5">Age Group</th>
                  <th className="px-6 py-3.5 text-center">Jersey</th>
                  <th className="px-6 py-3.5 text-center">Pos</th>
                  <th className="px-6 py-3.5 text-center">GP (GS)</th>
                  <th className="px-6 py-3.5 text-center">Goals</th>
                  <th className="px-6 py-3.5 text-center">Assists</th>
                  <th className="px-6 py-3.5 text-center">+/-</th>
                  <th className="px-6 py-3.5 text-center">Cards</th>
                  <th className="px-6 py-3.5 text-center">Minutes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {seasonStats.map((stat) => (
                  <tr
                    key={stat.teamSeasonId}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                      {stat.seasonName}
                      <span className="block text-[11px] font-normal text-slate-400">
                        {stat.seasonStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-200">{stat.clubName}</span>
                      <span className="block text-xs text-slate-400">{stat.teamName}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                      {stat.ageGroupName || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap font-mono font-bold text-indigo-400">
                      {stat.jerseyNumber ? `#${stat.jerseyNumber}` : "-"}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap text-xs font-medium text-slate-300">
                      {stat.position || "-"}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap font-mono text-slate-200">
                      {stat.gamesPlayed} <span className="text-slate-500">({stat.gamesStarted})</span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap font-bold text-emerald-400 font-mono">
                      {stat.goals}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap font-semibold text-indigo-300 font-mono">
                      {stat.assists}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap font-mono font-bold">
                      {stat.plusMinus > 0 ? (
                        <span className="text-emerald-400 font-semibold">+{stat.plusMinus}</span>
                      ) : stat.plusMinus < 0 ? (
                        <span className="text-rose-400 font-semibold">{stat.plusMinus}</span>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap text-xs font-mono">
                      <span className="text-amber-400">{stat.yellowCards}Y</span> /{" "}
                      <span className="text-red-400">{stat.redCards}R</span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap text-xs font-mono text-slate-300">
                      {stat.minutesPlayed}'
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Career Awards, Honors & Varsity Letters Showcase */}
      {(awards.length > 0 || letters.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Honors & Awards */}
          <div className="overflow-hidden rounded-xl border border-slate-700/80 bg-slate-800/80 shadow-xl backdrop-blur-md">
            <div className="border-b border-slate-700/80 px-6 py-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-400" />
                Career Honors & Awards
              </h2>
              <span className="text-xs text-slate-400">{awards.length} honor(s)</span>
            </div>
            <div className="p-4 space-y-2.5">
              {awards.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No individual honors recorded.</p>
              ) : (
                awards.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-700/60"
                  >
                    <div>
                      <p className="text-sm font-bold text-white">{a.title}</p>
                      <p className="text-xs text-slate-400">
                        {a.organization || a.category.toUpperCase()}
                        {a.notes ? ` • ${a.notes}` : ""}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">
                      {a.seasonName || a.year || "Honor"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Varsity Letters & Patches */}
          <div className="overflow-hidden rounded-xl border border-slate-700/80 bg-slate-800/80 shadow-xl backdrop-blur-md">
            <div className="border-b border-slate-700/80 px-6 py-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-indigo-400" />
                Varsity Letterman & Patch History
              </h2>
              <span className="text-xs text-slate-400">
                {letters.filter((l) => l.varsityLetter).length} Varsity Letter(s)
              </span>
            </div>
            <div className="p-4 space-y-2.5">
              {letters.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No letterman records logged.</p>
              ) : (
                letters.map((l) => (
                  <div
                    key={l.id}
                    className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-slate-900/60 border border-slate-700/60"
                  >
                    <span className="text-sm font-bold text-white">{l.seasonName}</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {l.varsityLetter && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-bold">
                          ★ Varsity Letter
                        </span>
                      )}
                      {l.certificate && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
                          Certificate
                        </span>
                      )}
                      {l.numberPatch && (
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-xs font-mono font-bold">
                          Class &apos;{String(l.numberPatch).slice(-2)}
                        </span>
                      )}
                      {l.ball && (
                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-xs font-semibold">
                          ⚽ Ball Patch
                        </span>
                      )}
                      {l.bar && (
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-xs font-semibold">
                          ══ Chevron Bar
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
