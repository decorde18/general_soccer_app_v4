"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireSession, verifyAdmin } from "@/lib/auth/auth-utils";

import { resolveOrCreateDivisionHierarchy } from "@/lib/actions/league-actions";
import { deriveClubAbbreviation } from "@/lib/utils/teamName";

export interface TeamImportRecord {
  clubName: string;
  teamName: string;
  gender: "boys" | "girls" | "coed";
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
  gender?: "boys" | "girls" | "coed";
  locationName?: string;
  sublocationName?: string;
  gameType?: string;
  leagueNodeId?: number;
  leagueId?: number;
  divisionName?: string;
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

function mapGenderToEnum(genderStr?: string): "Men" | "Women" | "Mixed" {
  const g = (genderStr || "").trim().toLowerCase();
  if (["girls", "women", "female", "f", "w", "girl"].includes(g)) return "Women";
  if (["coed", "mixed", "co-ed", "m/f"].includes(g)) return "Mixed";
  return "Men";
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
    let team = await prisma.teams.findFirst({
      where: {
        club_id: club.id,
        team_name: { equals: rawTeam },
        gender: genderEnum,
      },
    });

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
    if (!rec.startDate || !rec.homeTeamName || !rec.awayTeamName) continue;

    const genderEnum = mapGenderToEnum(rec.gender);

    // 1. Resolve Home Team & Club
    let homeClub = await prisma.clubs.findFirst({
      where: { name: { equals: rec.homeClubName.trim() } },
    });
    if (!homeClub) {
      homeClub = await prisma.clubs.create({
        data: {
          name: rec.homeClubName.trim(),
          abbreviation: deriveClubAbbreviation(rec.homeClubName.trim()),
          type: "club",
        },
      });
    }

    let homeTeam = await prisma.teams.findFirst({
      where: {
        club_id: homeClub.id,
        team_name: { equals: rec.homeTeamName.trim() },
        gender: genderEnum,
      },
    });
    if (!homeTeam) {
      homeTeam = await prisma.teams.create({
        data: { club_id: homeClub.id, team_name: rec.homeTeamName.trim(), gender: genderEnum },
      });
    }

    let homeTeamSeason = await prisma.team_seasons.findFirst({
      where: { team_id: homeTeam.id, season_id: seasonId },
    });
    if (!homeTeamSeason) {
      homeTeamSeason = await prisma.team_seasons.create({
        data: { team_id: homeTeam.id, season_id: seasonId },
      });
    }

    // 2. Resolve Away Team & Club
    let awayClub = await prisma.clubs.findFirst({
      where: { name: { equals: rec.awayClubName.trim() } },
    });
    if (!awayClub) {
      awayClub = await prisma.clubs.create({
        data: {
          name: rec.awayClubName.trim(),
          abbreviation: deriveClubAbbreviation(rec.awayClubName.trim()),
          type: "club",
        },
      });
    }

    let awayTeam = await prisma.teams.findFirst({
      where: {
        club_id: awayClub.id,
        team_name: { equals: rec.awayTeamName.trim() },
        gender: genderEnum,
      },
    });
    if (!awayTeam) {
      awayTeam = await prisma.teams.create({
        data: { club_id: awayClub.id, team_name: rec.awayTeamName.trim(), gender: genderEnum },
      });
    }

    let awayTeamSeason = await prisma.team_seasons.findFirst({
      where: { team_id: awayTeam.id, season_id: seasonId },
    });
    if (!awayTeamSeason) {
      awayTeamSeason = await prisma.team_seasons.create({
        data: { team_id: awayTeam.id, season_id: seasonId },
      });
    }

    // 3. Resolve Location & Sublocation with smart matching
    let locationId: number | null = null;
    let sublocationId: number | null = null;

    const rawLocName = rec.locationName ? rec.locationName.trim() : "";
    const rawSubName = rec.sublocationName ? rec.sublocationName.trim() : "";

    if (rawLocName) {
      // Check mapped location first
      const mappedLoc = resolvedMappings?.locations?.[rawLocName];
      const mappedSub = resolvedMappings?.sublocations?.[rawSubName || rawLocName];

      if (mappedLoc?.matchedId) {
        locationId = mappedLoc.matchedId;
      } else {
        // Search by Name OR Abbreviation OR Sublocation Code (e.g. OCH1 -> O.C. Hubert Park)
        let location = await prisma.locations.findFirst({
          where: {
            OR: [
              { name: { equals: rawLocName } },
              { abbreviation: { equals: rawLocName } },
              { locations_sublocations: { some: { description: rawLocName } } },
              { locations_sublocations: { some: { name: rawLocName } } },
            ],
          },
          include: { locations_sublocations: true },
        });

        if (!location) {
          location = await prisma.locations.create({
            data: { name: rawLocName },
            include: { locations_sublocations: true },
          });
        }
        locationId = location.id;

        // Try to deduce sublocation automatically if code or name matches (e.g. OCH1 -> Field 1)
        if (location && !sublocationId) {
          const matchingSub = location.locations_sublocations.find(
            (sub) =>
              sub.description?.toLowerCase() === rawLocName.toLowerCase() ||
              sub.name.toLowerCase() === rawLocName.toLowerCase() ||
              (rawSubName && sub.name.toLowerCase() === rawSubName.toLowerCase())
          );
          if (matchingSub) {
            sublocationId = matchingSub.id;
          }
        }
      }

      if (mappedSub?.matchedId) {
        sublocationId = mappedSub.matchedId;
      } else if (rawSubName && locationId && !sublocationId) {
        let subloc = await prisma.locations_sublocations.findFirst({
          where: {
            location_id: locationId,
            OR: [
              { name: { equals: rawSubName } },
              { description: { equals: rawSubName } },
            ],
          },
        });
        if (!subloc) {
          subloc = await prisma.locations_sublocations.create({
            data: { location_id: locationId, name: rawSubName },
          });
        }
        sublocationId = subloc.id;
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
      },
    });

    if (existingGame) {
      gamesSkipped++;
      continue;
    }

    // 6. Create game
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
        game_type: await normalizeGameType(rec.gameType, "league"),
        status: "scheduled",
      },
    });

    gamesCreated++;

    // 7. Attach to league node if specified OR auto-deduce hierarchy if leagueId provided
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

    if (targetNodeSeasonId) {
      const resolved = await ensureLeagueNodeSeason(targetNodeSeasonId, seasonId);
      if (resolved) {
        const existingGln = await prisma.game_league_nodes.findFirst({
          where: { game_id: game.id, league_node_id: resolved.nodeSeasonId },
        });
        if (!existingGln) {
          await prisma.game_league_nodes.create({
            data: {
              game_id: game.id,
              league_node_id: resolved.nodeSeasonId,
              is_primary: true,
            },
          });
        }

        const existingGsi = await prisma.game_standings_inclusions.findFirst({
          where: { game_id: game.id, league_node_id: resolved.leagueNodeId },
        });
        if (!existingGsi) {
          await prisma.game_standings_inclusions.create({
            data: {
              game_id: game.id,
              league_node_id: resolved.leagueNodeId,
              counts_for_standings: rec.gameType !== "friendly",
            },
          });
        }

        // Auto-enroll Home and Away teams into Team League Enrollments
        const homeEnrollment = await prisma.team_league_enrollments.findFirst({
          where: { team_season_id: homeTeamSeason.id, league_node_season_id: resolved.nodeSeasonId },
        });
        if (!homeEnrollment) {
          await prisma.team_league_enrollments.create({
            data: { team_season_id: homeTeamSeason.id, league_node_season_id: resolved.nodeSeasonId, is_active: true },
          });
        }

        const awayEnrollment = await prisma.team_league_enrollments.findFirst({
          where: { team_season_id: awayTeamSeason.id, league_node_season_id: resolved.nodeSeasonId },
        });
        if (!awayEnrollment) {
          await prisma.team_league_enrollments.create({
            data: { team_season_id: awayTeamSeason.id, league_node_season_id: resolved.nodeSeasonId, is_active: true },
          });
        }
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
        const teamGender = rec.gender && mapGenderToEnum(rec.gender) === "Women" ? "Women" : "Men";
        team = await prisma.teams.create({
          data: { club_id: club.id, team_name: rawTeam, gender: teamGender as any },
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

    const genderCode = rec.gender ? (mapGenderToEnum(rec.gender) === "Women" ? "F" : "M") : null;
    const parsedBirthDate = rec.birthDate ? new Date(rec.birthDate) : null;
    const sanitizedGrade = cleanGrade(rec.grade);

    if (!person) {
      person = await prisma.people.create({
        data: {
          first_name: rawFirst,
          last_name: rawLast,
          email: rec.email ? rec.email.trim() : null,
          phone: rec.phone ? rec.phone.trim() : null,
          gender: genderCode,
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
          gender: genderCode || person.gender,
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
  const locations = await prisma.locations.findMany({
    include: {
      addresses: true,
      locations_sublocations: true,
    },
    orderBy: { name: "asc" },
  });

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

  return { existingLocations, existingSublocations };
}
