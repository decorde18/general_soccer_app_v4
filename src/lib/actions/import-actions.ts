"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireSession, verifyAdmin } from "@/lib/auth/auth-utils";

import { resolveOrCreateDivisionHierarchy } from "@/lib/actions/league-actions";
import { deriveClubAbbreviation } from "@/lib/utils/teamName";
import { discernVenueAndField, discernClubAndTeam, isTbdOrSeedTeam } from "@/lib/utils/locationUtils";
import { normalizeGender, GenderValue } from "@/lib/utils/gender";
import { resolveHierarchyGameSettings, SYSTEM_DEFAULT_GAME_SETTINGS } from "@/lib/utils/gameRules";

export interface TeamImportRecord {
  clubName: string;
  teamName: string;
  gender: GenderValue;
  ageGroupName?: string;
  city?: string;
  state?: string;
}

export interface ScheduleImportRecord {
  startDate: string; // YYYY-MM-DD
  startTime?: string; // HH:MM or 10:00 AM
  homeClubName: string;
  homeTeamName: string;
  awayClubName: string;
  awayTeamName: string;
  gender?: GenderValue;
  locationName?: string;
  sublocationName?: string;
  gameType?: string;
  leagueNodeId?: number;
  leagueId?: number;
  divisionName?: string;
  notes?: string;
  isHomeTbd?: boolean;
  isAwayTbd?: boolean;
  rawHomePlaceholder?: string;
  rawAwayPlaceholder?: string;
}

/**
 * Helper to normalize game_type enum inputs from CSV/user text
 */
export async function normalizeGameType(rawStr?: string, defaultType: string = "league"): Promise<any> {
  if (!rawStr || !rawStr.trim()) return defaultType as any;
  const s = rawStr.trim().toLowerCase();

  if (["final", "finals", "championship", "gold final", "silver final"].includes(s)) return "final";
  if (["semifinal", "semi-final", "semifinals", "semi", "semis"].includes(s)) return "semifinal";
  if (["quarterfinal", "quarter-final", "quarterfinals", "quarter"].includes(s)) return "quarterfinal";
  if (["round_of_16", "round of 16", "r16", "sweet 16"].includes(s)) return "round_of_16";
  if (["group_stage", "group", "group play", "group stage", "pool play", "round robin"].includes(s)) return "group_stage";
  if (["playoff", "playoffs", "knockout", "postseason"].includes(s)) return "playoff";
  if (["consolation", "consolation final", "3rd place"].includes(s)) return "consolation";
  if (["showcase"].includes(s)) return "showcase";
  if (["friendly", "scrimmage", "exhibition"].includes(s)) return s as any;
  if (["tournament"].includes(s)) return "tournament";
  if (["league"].includes(s)) return "league";

  return defaultType as any;
}

/**
 * Helper to normalize strings for comparison
 */
function normalizeStr(str?: string | null): string {
  return (str || "").trim().toLowerCase();
}

function mapGenderToEnum(genderStr?: string): GenderValue {
  return normalizeGender(genderStr);
}

async function ensureLeagueNodeSeason(rawNodeId: number, seasonId: number): Promise<{ nodeSeasonId: number; leagueNodeId: number } | null> {
  if (!rawNodeId || !seasonId) return null;

  // 1. Check if rawNodeId is already a valid league_node_seasons.id
  const bySeasonId = await prisma.league_node_seasons.findUnique({
    where: { id: rawNodeId },
  });
  if (bySeasonId) {
    return { nodeSeasonId: bySeasonId.id, leagueNodeId: bySeasonId.league_node_id };
  }

  // 2. Check if rawNodeId is a league_nodes.id, and find existing league_node_seasons for this season
  let nodeSeason = await prisma.league_node_seasons.findFirst({
    where: {
      league_node_id: rawNodeId,
      season_id: seasonId,
    },
  });

  // 3. If not found, verify rawNodeId is in league_nodes and auto-create league_node_seasons
  if (!nodeSeason) {
    const leagueNode = await prisma.league_nodes.findUnique({
      where: { id: rawNodeId },
    });
    if (!leagueNode) return null;

    nodeSeason = await prisma.league_node_seasons.create({
      data: {
        league_node_id: rawNodeId,
        season_id: seasonId,
        status: "active",
        is_active: true,
      },
    });
  }

  return { nodeSeasonId: nodeSeason.id, leagueNodeId: nodeSeason.league_node_id };
}

/**
 * Batch import teams and clubs with deduplication
 */
export async function batchImportTeams(
  seasonId: number,
  records: TeamImportRecord[]
) {
  await requireSession();
  await verifyAdmin();

  if (!records || records.length === 0) {
    throw new Error("No team records provided for import.");
  }

  let clubsCreated = 0;
  let teamsCreated = 0;
  let teamSeasonsCreated = 0;

  for (const rec of records) {
    const rawClub = rec.clubName.trim();
    const rawTeam = rec.teamName.trim();
    const genderEnum = mapGenderToEnum(rec.gender);

    if (!rawClub || !rawTeam) continue;

    // 1. Find or create club
    let club = await prisma.clubs.findFirst({
      where: {
        name: { equals: rawClub },
      },
    });

    if (!club) {
      const locStr = [rec.city, rec.state].filter(Boolean).join(", ") || null;
      club = await prisma.clubs.create({
        data: {
          name: rawClub,
          location: locStr,
          type: "club",
        },
      });
      clubsCreated++;
    }

    // 2. Find or create team
    let team: any = null;
    if (rec.gender) {
      team = await prisma.teams.findFirst({
        where: {
          club_id: club.id,
          team_name: { equals: rawTeam },
          gender: genderEnum,
        },
      });
    }
    if (!team) {
      team = await prisma.teams.findFirst({
        where: {
          club_id: club.id,
          team_name: { equals: rawTeam },
        },
      });
    }

    if (!team) {
      team = await prisma.teams.create({
        data: {
          club_id: club.id,
          team_name: rawTeam,
          gender: genderEnum,
        },
      });
      teamsCreated++;
    }

    // 3. Find or create team_season
    let teamSeason = await prisma.team_seasons.findFirst({
      where: {
        team_id: team.id,
        season_id: seasonId,
      },
    });

    if (!teamSeason) {
      await prisma.team_seasons.create({
        data: {
          team_id: team.id,
          season_id: seasonId,
        },
      });
      teamSeasonsCreated++;
    }
  }

  revalidatePath("/admin/clubs");
  revalidatePath("/dashboard");

  return {
    success: true,
    summary: `Import complete. Created ${clubsCreated} new clubs, ${teamsCreated} new teams, and ${teamSeasonsCreated} team-season registrations.`,
  };
}

import { parseGameDatesAndTimesUTC } from "@/lib/utils/dateTimeUtils";

function parseGameDatesAndTimes(dateStr: string, timeStr?: string, defaultDurationMinutes: number = 90) {
  return parseGameDatesAndTimesUTC(dateStr, timeStr, defaultDurationMinutes);
}

/**
 * Batch import schedule fixtures with deduplication & auto-resolving teams/venues
 */
export async function batchImportSchedule(
  seasonId: number,
  records: ScheduleImportRecord[],
  resolvedMappings?: any
) {
  await requireSession();
  await verifyAdmin();

  if (!records || records.length === 0) {
    throw new Error("No schedule records provided for import.");
  }

  let gamesCreated = 0;
  let gamesSkipped = 0;

  for (const rec of records) {
    const isHomeTbd = Boolean(rec.isHomeTbd || isTbdOrSeedTeam(rec.homeTeamName));
    const isAwayTbd = Boolean(rec.isAwayTbd || isTbdOrSeedTeam(rec.awayTeamName));

    if (!rec.startDate || (!rec.homeTeamName && !isHomeTbd) || (!rec.awayTeamName && !isAwayTbd)) continue;

    const genderEnum = mapGenderToEnum(rec.gender);

    // Helper to get or create TBD team_seasons record
    const getTbdTeamSeason = async () => {
      let tbdClub = await prisma.clubs.findFirst({
        where: { name: { equals: "TBD" } },
      });
      if (!tbdClub) {
        tbdClub = await prisma.clubs.create({
          data: { name: "TBD", abbreviation: "TBD", type: "club" },
        });
      }

      let tbdTeam = await prisma.teams.findFirst({
        where: { club_id: tbdClub.id, team_name: { equals: "TBD" }, gender: genderEnum },
      });
      if (!tbdTeam) {
        tbdTeam = await prisma.teams.create({
          data: { club_id: tbdClub.id, team_name: "TBD", gender: genderEnum },
        });
      }

      let ts = await prisma.team_seasons.findFirst({
        where: { team_id: tbdTeam.id, season_id: seasonId },
      });
      if (!ts) {
        ts = await prisma.team_seasons.create({
          data: { team_id: tbdTeam.id, season_id: seasonId },
        });
      }
      return ts;
    };

    // 1. Resolve Home Team & Club
    let homeTeamSeason: any = null;
    if (isHomeTbd) {
      homeTeamSeason = await getTbdTeamSeason();
    } else {
      const discernedHome = discernClubAndTeam(rec.homeTeamName, rec.homeClubName);
      const homeClubName = discernedHome.clubName || rec.homeClubName || rec.homeTeamName;
      const homeTeamName = discernedHome.teamName || rec.homeTeamName;

      let homeClub: any = null;
      const mappedHomeClub = resolvedMappings?.[homeClubName] || resolvedMappings?.[rec.homeClubName];
      if (mappedHomeClub?.matchedId) {
        homeClub = await prisma.clubs.findUnique({ where: { id: mappedHomeClub.matchedId } });
      }
      if (!homeClub && homeClubName) {
        homeClub = await prisma.clubs.findFirst({
          where: { name: { equals: homeClubName.trim() } },
        });
      }
      if (!homeClub && homeClubName) {
        homeClub = await prisma.clubs.create({
          data: {
            name: homeClubName.trim(),
            abbreviation: deriveClubAbbreviation(homeClubName.trim()),
            type: "club",
          },
        });
      }

      let homeTeam: any = null;
      const mappedHomeTeam = resolvedMappings?.[homeTeamName] || resolvedMappings?.[rec.homeTeamName];

      if (mappedHomeTeam?.matchedId) {
        homeTeamSeason = await prisma.team_seasons.findUnique({
          where: { id: mappedHomeTeam.matchedId },
          include: { teams: true },
        });
        if (homeTeamSeason) {
          homeTeam = homeTeamSeason.teams;
        }
      }

      if (!homeTeam && homeClub) {
        if (rec.gender) {
          homeTeam = await prisma.teams.findFirst({
            where: {
              club_id: homeClub.id,
              team_name: { equals: homeTeamName.trim() },
              gender: genderEnum,
            },
          });
        }
        if (!homeTeam) {
          homeTeam = await prisma.teams.findFirst({
            where: {
              club_id: homeClub.id,
              team_name: { equals: homeTeamName.trim() },
            },
          });
        }
      }
      if (!homeTeam && homeClub) {
        homeTeam = await prisma.teams.create({
          data: { club_id: homeClub.id, team_name: homeTeamName.trim(), gender: genderEnum },
        });
      }

      if (!homeTeamSeason && homeTeam) {
        homeTeamSeason = await prisma.team_seasons.findFirst({
          where: { team_id: homeTeam.id, season_id: seasonId },
        });
      }
      if (!homeTeamSeason && homeTeam) {
        homeTeamSeason = await prisma.team_seasons.create({
          data: { team_id: homeTeam.id, season_id: seasonId },
        });
      }
    }

    // 2. Resolve Away Team & Club
    let awayTeamSeason: any = null;
    if (isAwayTbd) {
      awayTeamSeason = await getTbdTeamSeason();
    } else {
      const discernedAway = discernClubAndTeam(rec.awayTeamName, rec.awayClubName);
      const awayClubName = discernedAway.clubName || rec.awayClubName || rec.awayTeamName;
      const awayTeamName = discernedAway.teamName || rec.awayTeamName;

      let awayClub: any = null;
      const mappedAwayClub = resolvedMappings?.[awayClubName] || resolvedMappings?.[rec.awayClubName];
      if (mappedAwayClub?.matchedId) {
        awayClub = await prisma.clubs.findUnique({ where: { id: mappedAwayClub.matchedId } });
      }
      if (!awayClub && awayClubName) {
        awayClub = await prisma.clubs.findFirst({
          where: { name: { equals: awayClubName.trim() } },
        });
      }
      if (!awayClub && awayClubName) {
        awayClub = await prisma.clubs.create({
          data: {
            name: awayClubName.trim(),
            abbreviation: deriveClubAbbreviation(awayClubName.trim()),
            type: "club",
          },
        });
      }

      let awayTeam: any = null;
      const mappedAwayTeam = resolvedMappings?.[awayTeamName] || resolvedMappings?.[rec.awayTeamName];

      if (mappedAwayTeam?.matchedId) {
        awayTeamSeason = await prisma.team_seasons.findUnique({
          where: { id: mappedAwayTeam.matchedId },
          include: { teams: true },
        });
        if (awayTeamSeason) {
          awayTeam = awayTeamSeason.teams;
        }
      }

      if (!awayTeam && awayClub) {
        if (rec.gender) {
          awayTeam = await prisma.teams.findFirst({
            where: {
              club_id: awayClub.id,
              team_name: { equals: awayTeamName.trim() },
              gender: genderEnum,
            },
          });
        }
        if (!awayTeam) {
          awayTeam = await prisma.teams.findFirst({
            where: {
              club_id: awayClub.id,
              team_name: { equals: awayTeamName.trim() },
            },
          });
        }
      }
      if (!awayTeam && awayClub) {
        awayTeam = await prisma.teams.create({
          data: { club_id: awayClub.id, team_name: awayTeamName.trim(), gender: genderEnum },
        });
      }

      if (!awayTeamSeason && awayTeam) {
        awayTeamSeason = await prisma.team_seasons.findFirst({
          where: { team_id: awayTeam.id, season_id: seasonId },
        });
      }
      if (!awayTeamSeason && awayTeam) {
        awayTeamSeason = await prisma.team_seasons.create({
          data: { team_id: awayTeam.id, season_id: seasonId },
        });
      }
    }

    // 3. Resolve Location & Sublocation with smart matching and discernment
    let locationId: number | null = null;
    let sublocationId: number | null = null;

    const rawLocName = rec.locationName ? rec.locationName.trim() : "";
    const rawSubName = rec.sublocationName ? rec.sublocationName.trim() : "";
    const discerned = discernVenueAndField(rawLocName, rawSubName);
    const venueName = discerned.venueName || rawLocName;
    const fieldName = discerned.sublocationName || rawSubName;

    if (venueName) {
      // Check mapped location first
      const mappedLoc =
        resolvedMappings?.[venueName] ||
        resolvedMappings?.[rawLocName] ||
        resolvedMappings?.locations?.[venueName] ||
        resolvedMappings?.locations?.[rawLocName];

      if (mappedLoc?.matchedId) {
        locationId = mappedLoc.matchedId;
      } else {
        // Search by Name OR Abbreviation OR Sublocation Code
        let location = await prisma.locations.findFirst({
          where: {
            OR: [
              { name: { equals: venueName } },
              { abbreviation: { equals: venueName } },
              { locations_sublocations: { some: { description: venueName } } },
              { locations_sublocations: { some: { name: venueName } } },
            ],
          },
          include: { locations_sublocations: true },
        });

        if (!location) {
          location = await prisma.locations.create({
            data: { name: venueName },
            include: { locations_sublocations: true },
          });
        }
        locationId = location.id;

        // Try to deduce sublocation automatically if code or name matches
        if (location && !sublocationId) {
          const matchingSub = location.locations_sublocations.find(
            (sub) =>
              sub.description?.toLowerCase() === venueName.toLowerCase() ||
              sub.name.toLowerCase() === venueName.toLowerCase() ||
              (fieldName && sub.name.toLowerCase() === fieldName.toLowerCase())
          );
          if (matchingSub) {
            sublocationId = matchingSub.id;
          }
        }
      }

      if (fieldName && locationId) {
        const mappedSub =
          resolvedMappings?.[fieldName] ||
          resolvedMappings?.[rawSubName] ||
          resolvedMappings?.sublocations?.[fieldName] ||
          resolvedMappings?.sublocations?.[rawSubName];

        if (mappedSub?.matchedId) {
          sublocationId = mappedSub.matchedId;
        } else if (!sublocationId) {
          let subloc = await prisma.locations_sublocations.findFirst({
            where: {
              location_id: locationId,
              OR: [
                { name: { equals: fieldName } },
                { description: { equals: fieldName } },
              ],
            },
          });
          if (!subloc) {
            subloc = await prisma.locations_sublocations.create({
              data: { location_id: locationId, name: fieldName },
            });
          }
          sublocationId = subloc.id;
        }
      }
    }

    // 4. Format start and end date & times
    const { startDate, startTime, endDate, endTime } = parseGameDatesAndTimes(rec.startDate, rec.startTime);

    // 5. Check if game already exists (deduplication)
    const existingGame = await prisma.games.findFirst({
      where: {
        season_id: seasonId,
        start_date: startDate,
        home_team_season_id: homeTeamSeason.id,
        away_team_season_id: awayTeamSeason.id,
        start_time: startTime,
        location_id: locationId,
        sublocation_id: sublocationId,
      },
    });

    if (existingGame) {
      gamesSkipped++;
      continue;
    }

    // Determine default game type
    let gameTypeEnum = await normalizeGameType(rec.gameType, "league");
    if ((isHomeTbd || isAwayTbd) && (gameTypeEnum === "league" || !rec.gameType)) {
      gameTypeEnum = "playoff";
    }

    let notes: string | null = rec.notes || null;
    if ((isHomeTbd || isAwayTbd) && !notes) {
      const hLabel = rec.rawHomePlaceholder || rec.homeTeamName || "TBD";
      const aLabel = rec.rawAwayPlaceholder || rec.awayTeamName || "TBD";
      notes = `Playoff Matchup: ${hLabel} vs ${aLabel}`;
    }

    // 6. Attach to league node if specified OR auto-deduce hierarchy if leagueId provided
    let targetNodeSeasonId = rec.leagueNodeId;
    if (!targetNodeSeasonId && rec.leagueId && (rec.divisionName || rec.homeTeamName)) {
      try {
        const autoResolved = await resolveOrCreateDivisionHierarchy(
          rec.divisionName || rec.homeTeamName,
          rec.leagueId,
          seasonId
        );
        if (autoResolved) {
          targetNodeSeasonId = autoResolved.nodeSeasonId;
        }
      } catch (err) {
        console.error("Failed to auto-deduce division hierarchy for row:", err);
      }
    }

    let resolvedNodeSeason: { leagueNodeId: number; nodeSeasonId: number } | null = null;
    if (targetNodeSeasonId) {
      resolvedNodeSeason = await ensureLeagueNodeSeason(targetNodeSeasonId, seasonId);
    }

    // Resolve hierarchical match settings (e.g. 9v9 30m halves for U11/U12 or NFHS for HS)
    let matchSettings = SYSTEM_DEFAULT_GAME_SETTINGS;
    try {
      const allNodes = await prisma.league_nodes.findMany({
        select: { id: true, name: true, parent_id: true, league_id: true, match_rules: true },
      });
      const allLeagues = await prisma.leagues.findMany({
        select: { id: true, name: true, match_rules: true, reg_periods: true, period_duration: true, ot_if_tied: true, ot_duration: true, so_if_tied: true },
      });
      const hierarchyRes = resolveHierarchyGameSettings({
        nodeId: resolvedNodeSeason?.leagueNodeId || rec.leagueNodeId,
        allNodes: allNodes.map((n) => ({
          id: n.id,
          name: n.name,
          parentId: n.parent_id,
          leagueId: n.league_id,
          matchRules: n.match_rules,
        })),
        leagueId: rec.leagueId,
        allLeagues,
      });
      matchSettings = hierarchyRes.resolvedRules;
    } catch (err) {
      console.error("Failed to resolve hierarchy match rules for imported game:", err);
    }

    let parsedNotes: Record<string, any> = {};
    if (notes) {
      parsedNotes = { rawNotes: notes };
    }
    parsedNotes = { ...parsedNotes, ...matchSettings };
    const finalNotesStr = JSON.stringify(parsedNotes);

    // 7. Create game with resolved settings
    const game = await prisma.games.create({
      data: {
        season_id: seasonId,
        home_team_season_id: homeTeamSeason.id,
        away_team_season_id: awayTeamSeason.id,
        start_date: startDate,
        start_time: startTime,
        end_date: endDate,
        end_time: endTime,
        location_id: locationId,
        sublocation_id: sublocationId,
        game_type: gameTypeEnum,
        default_reg_periods: matchSettings.periodCount,
        period_duration: matchSettings.periodDuration,
        ot_if_tied: matchSettings.hasOvertime,
        ot_duration: matchSettings.overtimeDuration,
        so_if_tied: matchSettings.hasShootout,
        notes: finalNotesStr,
        status: "scheduled",
      },
    });

    gamesCreated++;

    if (resolvedNodeSeason) {
      const existingGln = await prisma.game_league_nodes.findFirst({
        where: { game_id: game.id, league_node_id: resolvedNodeSeason.nodeSeasonId },
      });
      if (!existingGln) {
        await prisma.game_league_nodes.create({
          data: {
            game_id: game.id,
            league_node_id: resolvedNodeSeason.nodeSeasonId,
            is_primary: true,
          },
        });
      }

      const existingGsi = await prisma.game_standings_inclusions.findFirst({
        where: { game_id: game.id, league_node_id: resolvedNodeSeason.leagueNodeId },
      });
      if (!existingGsi) {
        await prisma.game_standings_inclusions.create({
          data: {
            game_id: game.id,
            league_node_id: resolvedNodeSeason.leagueNodeId,
            counts_for_standings: rec.gameType !== "friendly",
          },
        });
      }

        // Auto-enroll Home and Away teams into Team League Enrollments
        const homeEnrollment = await prisma.team_league_enrollments.findFirst({
          where: { team_season_id: homeTeamSeason.id, league_node_season_id: resolvedNodeSeason.nodeSeasonId },
        });
        if (!homeEnrollment) {
          await prisma.team_league_enrollments.create({
            data: { team_season_id: homeTeamSeason.id, league_node_season_id: resolvedNodeSeason.nodeSeasonId, is_active: true },
          });
        }

        const awayEnrollment = await prisma.team_league_enrollments.findFirst({
          where: { team_season_id: awayTeamSeason.id, league_node_season_id: resolvedNodeSeason.nodeSeasonId },
        });
        if (!awayEnrollment) {
          await prisma.team_league_enrollments.create({
            data: { team_season_id: awayTeamSeason.id, league_node_season_id: resolvedNodeSeason.nodeSeasonId, is_active: true },
          });
        }
      }
    }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/scores");

  return {
    success: true,
    summary: `Schedule import complete. Created ${gamesCreated} new matches (${gamesSkipped} existing matches skipped as duplicates).`,
  };
}

export interface ParentImportRecord {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface RosterImportRecord {
  clubName?: string;
  teamName?: string;
  firstName: string;
  lastName: string;
  gender?: string;
  birthDate?: string;
  email?: string;
  phone?: string;
  jerseyNumber?: number;
  position?: string;
  grade?: string;
  status?: string;
  targetTeamSeasonId?: number;
  parent1?: ParentImportRecord;
  parent2?: ParentImportRecord;
}

function cleanGrade(gradeStr?: string): string | undefined {
  if (!gradeStr) return undefined;
  const cleaned = gradeStr.replace(/[\s\-_]*grade/gi, "").trim();
  return cleaned || gradeStr.trim();
}

/**
 * Batch import roster players & parent relationships with strict deduplication
 */
export async function batchImportRoster(
  seasonId: number,
  records: RosterImportRecord[],
  targetTeamSeasonId?: number
) {
  await requireSession();
  await verifyAdmin();

  if (!records || records.length === 0) {
    throw new Error("No roster records provided for import.");
  }

  let playersCreated = 0;
  let parentsCreated = 0;
  let rosterEntriesCreated = 0;
  let rosterEntriesUpdated = 0;
  let rosterEntriesSkipped = 0;

  for (const rec of records) {
    const rawFirst = rec.firstName ? rec.firstName.trim() : "";
    const rawLast = rec.lastName ? rec.lastName.trim() : "";

    if (!rawFirst || !rawLast) continue;

    let resolvedTeamSeasonId = rec.targetTeamSeasonId || targetTeamSeasonId;

    // If no explicit targetTeamSeasonId provided, resolve via club & team names
    if (!resolvedTeamSeasonId) {
      const rawClub = (rec.clubName || "").trim();
      const rawTeam = (rec.teamName || "").trim();

      if (!rawClub || !rawTeam) continue;

      // 1. Find or create club
      let club = await prisma.clubs.findFirst({
        where: { name: { equals: rawClub } },
      });
      if (!club) {
        club = await prisma.clubs.create({
          data: { name: rawClub, type: "club" },
        });
      }

      // 2. Find or create team
      let team = await prisma.teams.findFirst({
        where: { club_id: club.id, team_name: { equals: rawTeam } },
      });
      if (!team) {
        const teamGender = rec.gender ? normalizeGender(rec.gender) : "MIXED";
        team = await prisma.teams.create({
          data: { club_id: club.id, team_name: rawTeam, gender: teamGender },
        });
      }

      // 3. Find or create team_season
      let teamSeason = await prisma.team_seasons.findFirst({
        where: { team_id: team.id, season_id: seasonId },
      });
      if (!teamSeason) {
        teamSeason = await prisma.team_seasons.create({
          data: { team_id: team.id, season_id: seasonId, is_active: true },
        });
      }
      resolvedTeamSeasonId = teamSeason.id;
    }

    if (!resolvedTeamSeasonId) continue;

    // 4. Find or create player person record
    let person: any = null;

    if (rec.email && rec.email.trim()) {
      person = await prisma.people.findFirst({
        where: { email: { equals: rec.email.trim() } },
      });
    }

    if (!person) {
      person = await prisma.people.findFirst({
        where: {
          first_name: { equals: rawFirst },
          last_name: { equals: rawLast },
        },
      });
    }

    const normalizedPersonGender = rec.gender ? normalizeGender(rec.gender) : null;
    const parsedBirthDate = rec.birthDate ? new Date(rec.birthDate) : null;
    const sanitizedGrade = cleanGrade(rec.grade);

    if (!person) {
      person = await prisma.people.create({
        data: {
          first_name: rawFirst,
          last_name: rawLast,
          email: rec.email ? rec.email.trim() : null,
          phone: rec.phone ? rec.phone.trim() : null,
          gender: normalizedPersonGender,
          birth_date: parsedBirthDate && !isNaN(parsedBirthDate.getTime()) ? parsedBirthDate : null,
        },
      });
      playersCreated++;
    } else {
      // Always update person's names and metadata if new information is provided
      await prisma.people.update({
        where: { id: person.id },
        data: {
          first_name: rawFirst,
          last_name: rawLast,
          gender: normalizedPersonGender || person.gender,
          birth_date: (parsedBirthDate && !isNaN(parsedBirthDate.getTime())) ? parsedBirthDate : person.birth_date,
          phone: rec.phone ? rec.phone.trim() : person.phone,
          email: rec.email ? rec.email.trim() : person.email,
        },
      });
    }

    // 5. Process Parent 1 and Parent 2 Optional Relationships
    const parentList = [rec.parent1, rec.parent2].filter(Boolean) as ParentImportRecord[];

    for (const pRecord of parentList) {
      const pFirst = pRecord.firstName ? pRecord.firstName.trim() : "";
      const pLast = pRecord.lastName ? pRecord.lastName.trim() : "";
      const pEmail = pRecord.email ? pRecord.email.trim() : "";
      const pPhone = pRecord.phone ? pRecord.phone.trim() : "";

      if (!pFirst && !pLast && !pEmail) continue;

      let parentPerson: any = null;

      if (pEmail) {
        parentPerson = await prisma.people.findFirst({
          where: { email: { equals: pEmail } },
        });
      }

      if (!parentPerson && pFirst && pLast) {
        parentPerson = await prisma.people.findFirst({
          where: {
            first_name: { equals: pFirst },
            last_name: { equals: pLast },
          },
        });
      }

      if (!parentPerson) {
        parentPerson = await prisma.people.create({
          data: {
            first_name: pFirst || "Parent",
            last_name: pLast || rawLast,
            email: pEmail || null,
            phone: pPhone || null,
          },
        });
        parentsCreated++;
      } else {
        if (pPhone && !parentPerson.phone) {
          await prisma.people.update({
            where: { id: parentPerson.id },
            data: { phone: pPhone },
          });
        }
      }

      // Link player to parent in player_relationships table
      const existingRel = await prisma.player_relationships.findFirst({
        where: {
          player_id: person.id,
          related_person_id: parentPerson.id,
        },
      });

      if (!existingRel) {
        await prisma.player_relationships.create({
          data: {
            player_id: person.id,
            related_person_id: parentPerson.id,
            relationship: "Parent",
          },
        });
      }
    }

    // 6. Find or create player_teams record
    let playerTeam = await prisma.player_teams.findFirst({
      where: {
        player_id: person.id,
        team_season_id: resolvedTeamSeasonId,
      },
    });

    if (!playerTeam) {
      await prisma.player_teams.create({
        data: {
          player_id: person.id,
          team_season_id: resolvedTeamSeasonId,
          jersey_number: rec.jerseyNumber ?? null,
          position: rec.position ?? null,
          grade: sanitizedGrade ?? null,
          status: (rec.status as any) || "rostered",
          is_active: true,
        },
      });
      rosterEntriesCreated++;
    } else {
      const hasChanges =
        (rec.jerseyNumber !== undefined && rec.jerseyNumber !== playerTeam.jersey_number) ||
        (rec.position !== undefined && rec.position !== playerTeam.position) ||
        (sanitizedGrade !== undefined && sanitizedGrade !== playerTeam.grade) ||
        (rec.status !== undefined && rec.status !== playerTeam.status);

      if (hasChanges) {
        await prisma.player_teams.update({
          where: { id: playerTeam.id },
          data: {
            jersey_number: rec.jerseyNumber ?? playerTeam.jersey_number,
            position: rec.position ?? playerTeam.position,
            grade: sanitizedGrade ?? playerTeam.grade,
            status: (rec.status as any) || playerTeam.status,
          },
        });
        rosterEntriesUpdated++;
      } else {
        rosterEntriesSkipped++;
      }
    }
  }

  revalidatePath("/admin/clubs");
  revalidatePath("/dashboard");

  return {
    success: true,
    summary: `Roster import complete. Created ${playersCreated} players, ${parentsCreated} parent records linked via player_relationships, ${rosterEntriesCreated} team roster entries (${rosterEntriesUpdated} updated, ${rosterEntriesSkipped} existing duplicates skipped).`,
  };
}

/**
 * Fetch existing locations & sublocations for importer entity matching
 */
export async function getImportLocationsData() {
  await requireSession();
  const clubs = await prisma.clubs.findMany({
    select: {
      id: true,
      name: true,
      abbreviation: true,
    },
    orderBy: { name: "asc" },
  });

  const locations = await prisma.locations.findMany({
    include: {
      addresses: true,
      locations_sublocations: true,
    },
    orderBy: { name: "asc" },
  });

  const existingClubs = clubs.map((c) => ({
    id: c.id,
    name: c.name,
    abbreviation: c.abbreviation ?? "",
  }));

  const existingLocations = locations.map((loc) => ({
    id: loc.id,
    name: loc.name,
    abbreviation: loc.abbreviation ?? "",
    address: loc.addresses
      ? `${loc.addresses.address_line1 || ""}, ${loc.addresses.city || ""}, ${loc.addresses.state || ""} ${loc.addresses.postal_code || ""}`.trim()
      : null,
  }));

  const existingSublocations = locations.flatMap((loc) =>
    loc.locations_sublocations.map((sub) => ({
      id: sub.id,
      name: sub.name,
      code: sub.description || "",
      locationId: loc.id,
      locationName: loc.name,
    }))
  );

  return { existingClubs, existingLocations, existingSublocations };
}
