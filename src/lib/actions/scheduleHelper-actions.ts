"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ensureLegacyExtrasMigrated } from "@/lib/db/ensureLegacyExtrasMigrated";

export interface ScheduleLeadEnriched {
  id: number;
  seasonId: number;
  teamSeasonId: number;
  opponentClubId: number;
  opponentClubName: string;
  likelihood: string;
  status: string;
  preferredHomeAway: string;
  preferredDate: string | null;
  notes: string | null;
  seriesHistory: {
    wins: number;
    losses: number;
    draws: number;
    lastGameDate: string | null;
    lastVenueWasHome: boolean | null;
    recommendedVenue: "Home" | "Away" | "Either";
  };
}

function normalizeLikelihood(raw: any): string {
  if (typeof raw === "string") {
    const lower = raw.toLowerCase().trim();
    if (["mandatory", "likely", "hopeful", "unlikely", "unnecessary"].includes(lower)) {
      return lower;
    }
    const asNum = Number(lower);
    if (!isNaN(asNum)) raw = asNum;
  }
  if (typeof raw === "number") {
    if (raw >= 5) return "mandatory";
    if (raw === 4) return "likely";
    if (raw === 3) return "hopeful";
    if (raw === 2) return "unlikely";
    return "unnecessary";
  }
  return "likely";
}

function normalizeStatus(raw: any): string {
  const str = String(raw || "").toLowerCase().trim();
  if (str.includes("sched")) return "scheduled";
  if (str.includes("contact") && !str.includes("no")) return "contacted";
  if (str.includes("pend") || str.includes("negot") || str.includes("confirm")) return "pending";
  if (str.includes("unabl") || str.includes("declin") || str.includes("no ")) {
    if (str === "no contact") return "no contact";
    return "unable";
  }
  return "no contact";
}

export async function getScheduleLeadsForTeamSeason(
  teamSeasonId: number
): Promise<ScheduleLeadEnriched[]> {
  const safeTsId = Number(teamSeasonId) || 0;
  if (!safeTsId) return [];

  await ensureLegacyExtrasMigrated();

  const ts = await prisma.team_seasons.findUnique({
    where: { id: safeTsId },
    include: {
      teams: true,
      seasons: true,
    },
  });

  if (!ts) return [];

  const ourTeamId = ts.team_id;

  const rawLeads = await prisma.$queryRawUnsafe<any[]>(
    `SELECT sl.*, c.name AS opponent_club_name
     FROM \`schedule_leads\` sl
     JOIN \`clubs\` c ON c.id = sl.opponent_club_id
     WHERE sl.team_season_id = ? OR sl.season_id = ?
     ORDER BY sl.id DESC`,
    safeTsId,
    ts.season_id
  );

  const allHistoricalGames = await prisma.games.findMany({
    where: {
      status: "completed",
      game_teams: {
        some: {
          team_seasons: {
            team_id: ourTeamId,
          },
        },
      },
    },
    include: {
      game_teams: {
        include: {
          team_seasons: {
            include: {
              teams: true,
            },
          },
        },
      },
    },
    orderBy: { date: "desc" },
  });

  const h2hByClub = new Map<
    number,
    {
      wins: number;
      losses: number;
      draws: number;
      lastGameDate: string | null;
      lastVenueWasHome: boolean | null;
    }
  >();

  for (const g of allHistoricalGames) {
    const ourGt = g.game_teams.find((gt) => gt.team_seasons?.team_id === ourTeamId);
    const oppGt = g.game_teams.find((gt) => gt.team_seasons?.team_id !== ourTeamId);
    if (!ourGt || !oppGt || !oppGt.team_seasons?.teams) continue;

    const oppClubId = oppGt.team_seasons.teams.club_id;
    const entry = h2hByClub.get(oppClubId) || {
      wins: 0,
      losses: 0,
      draws: 0,
      lastGameDate: null,
      lastVenueWasHome: null,
    };

    const ourScore = ourGt.score ?? 0;
    const oppScore = oppGt.score ?? 0;
    if (ourScore > oppScore) entry.wins++;
    else if (ourScore < oppScore) entry.losses++;
    else entry.draws++;

    if (!entry.lastGameDate) {
      entry.lastGameDate = g.date.toISOString().split("T")[0];
      entry.lastVenueWasHome = (ourGt.role || "").toLowerCase() === "home";
    }

    h2hByClub.set(oppClubId, entry);
  }

  return rawLeads.map((l) => {
    const oppClubId = Number(l.opponent_club_id);
    const h2h = h2hByClub.get(oppClubId);
    const recommendedVenue: "Home" | "Away" | "Either" =
      h2h?.lastVenueWasHome === true
        ? "Away"
        : h2h?.lastVenueWasHome === false
        ? "Home"
        : "Either";

    let prefDateStr: string | null = null;
    if (l.preferred_date) {
      prefDateStr =
        l.preferred_date instanceof Date
          ? l.preferred_date.toISOString().split("T")[0]
          : String(l.preferred_date).split("T")[0];
    }

    return {
      id: Number(l.id),
      seasonId: Number(l.season_id),
      teamSeasonId: l.team_season_id ? Number(l.team_season_id) : safeTsId,
      opponentClubId: oppClubId,
      opponentClubName: String(l.opponent_club_name || "Opponent"),
      likelihood: normalizeLikelihood(l.likelihood),
      status: normalizeStatus(l.status),
      preferredHomeAway: l.preferred_home_away || recommendedVenue,
      preferredDate: prefDateStr,
      notes: l.notes || null,
      seriesHistory: {
        wins: h2h?.wins || 0,
        losses: h2h?.losses || 0,
        draws: h2h?.draws || 0,
        lastGameDate: h2h?.lastGameDate || null,
        lastVenueWasHome: h2h?.lastVenueWasHome ?? null,
        recommendedVenue,
      },
    };
  });
}

export async function upsertScheduleLeadAction(data: {
  id?: number;
  seasonId: number;
  teamSeasonId: number;
  opponentClubId: number;
  likelihood: string | number;
  status: string;
  preferredHomeAway?: string | null;
  preferredDate?: string | null;
  notes?: string | null;
}) {
  try {
    const safeOpponentId = Number(data.opponentClubId) || 0;
    const safeSeasonId = Number(data.seasonId) || 0;
    const safeTsId = Number(data.teamSeasonId) || 0;
    if (!safeOpponentId || !safeSeasonId) {
      return { success: false, error: "Opponent Club and Season are required." };
    }

    await ensureLegacyExtrasMigrated();

    const likelihoodStr = String(data.likelihood || "likely");
    const statusStr = String(data.status || "no contact");
    const preferredDate = data.preferredDate ? data.preferredDate : null;

    if (data.id) {
      await prisma.$executeRawUnsafe(
        `UPDATE \`schedule_leads\`
         SET \`opponent_club_id\` = ?, \`likelihood\` = ?, \`status\` = ?, \`preferred_home_away\` = ?, \`preferred_date\` = ?, \`notes\` = ?
         WHERE \`id\` = ?`,
        safeOpponentId,
        likelihoodStr,
        statusStr,
        data.preferredHomeAway || null,
        preferredDate,
        data.notes?.trim() || null,
        Number(data.id)
      );
      if (safeTsId) revalidatePath(`/teams/${safeTsId}`);
      return { success: true, id: Number(data.id) };
    } else {
      await prisma.$executeRawUnsafe(
        `INSERT INTO \`schedule_leads\` (\`season_id\`, \`team_season_id\`, \`opponent_club_id\`, \`likelihood\`, \`status\`, \`preferred_home_away\`, \`preferred_date\`, \`notes\`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        safeSeasonId,
        safeTsId || null,
        safeOpponentId,
        likelihoodStr,
        statusStr,
        data.preferredHomeAway || null,
        preferredDate,
        data.notes?.trim() || null
      );
      const inserted = await prisma.$queryRawUnsafe<{ id: number }[]>(
        `SELECT LAST_INSERT_ID() AS id`
      );
      if (safeTsId) revalidatePath(`/teams/${safeTsId}`);
      return { success: true, id: Number(inserted[0]?.id || 0) };
    }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to save schedule lead" };
  }
}

export async function deleteScheduleLeadAction(id: number, teamSeasonId?: number) {
  const safeId = Number(id) || 0;
  if (!safeId) return { success: false };

  await ensureLegacyExtrasMigrated();
  await prisma.$executeRawUnsafe(`DELETE FROM \`schedule_leads\` WHERE \`id\` = ?`, safeId);
  if (teamSeasonId) revalidatePath(`/teams/${teamSeasonId}`);
  return { success: true };
}
