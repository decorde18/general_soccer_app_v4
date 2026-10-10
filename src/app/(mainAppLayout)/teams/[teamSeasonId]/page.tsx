import React from "react";
import {
  getTeamSeasonById,
  getPlayersByTeamSeason,
  getTeamStaff,
  getGames,
  getPlayerStatsByTeamSeason,
  getTeamSeasonRecords,
  getLeaguesForTeamSeason,
} from "@/lib/data/queries";
import {
  getCustomFieldDefinitions,
  getCustomFieldValues,
} from "@/lib/actions/customFields-actions";
import {
  getPerformanceTests,
  getPlayerPerformanceLogs,
} from "@/lib/actions/performance-actions";
import {
  getTeamGroups,
  getPlayerPairings,
} from "@/lib/actions/groups-actions";
import { getPlayerUnavailability } from "@/lib/actions/unavailability-actions";

import TeamPageClient from "@/components/team/TeamPageClient";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";

interface PageProps {
  params: Promise<{ teamSeasonId: string }>;
}

export default async function TeamPage({ params }: PageProps) {
  const { teamSeasonId } = await params;
  const idNumber = Number(teamSeasonId);

  if (isNaN(idNumber)) {
    return (
      <div className='mx-auto max-w-2xl px-4 py-16'>
        <Card
          variant='outlined'
          padding='lg'
          className='text-center bg-surface/30'
        >
          <ShieldAlert size={48} className='mx-auto text-danger mb-4' />
          <h2 className='text-xl font-bold text-text mb-2'>Invalid Team ID</h2>
          <p className='text-sm text-muted mb-6'>
            The team identifier provided is invalid. Please double check the URL
            or return home.
          </p>
          <Link href='/'>
            <Button
              variant='primary'
              className='inline-flex flex-row items-center gap-2 text-sm px-4 py-2'
            >
              <ArrowLeft size={16} />
              <span>Back to Match Center</span>
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  try {
    const teamSeason = await getTeamSeasonById(idNumber);

    if (!teamSeason) {
      return (
        <div className='mx-auto max-w-2xl px-4 py-16'>
          <Card
            variant='outlined'
            padding='lg'
            className='text-center bg-surface/30'
          >
            <ShieldAlert size={48} className='mx-auto text-danger mb-4' />
            <h2 className='text-xl font-bold text-text mb-2'>Team Not Found</h2>
            <p className='text-sm text-muted mb-6'>
              We couldn't find the team season you were looking for.
            </p>
            <Link href='/'>
              <Button
                variant='primary'
                className='inline-flex flex-row items-center gap-2 text-sm px-4 py-2'
              >
                <ArrowLeft size={16} />
                <span>Back to Match Center</span>
              </Button>
            </Link>
          </Card>
        </div>
      );
    }

    // Fetch rest of data in parallel
    const [
      players,
      staff,
      games,
      stats,
      records,
      leagueLinks,
      customDefs,
      customVals,
      perfTests,
      perfLogs,
      groups,
      pairings,
      unavailabilities,
    ] = await Promise.all([
      getPlayersByTeamSeason(idNumber),
      getTeamStaff(idNumber),
      getGames({ teamSeasonId: idNumber }),
      getPlayerStatsByTeamSeason(idNumber),
      getTeamSeasonRecords(undefined, idNumber),
      getLeaguesForTeamSeason(idNumber),
      getCustomFieldDefinitions(idNumber, teamSeason.clubId),
      getCustomFieldValues(idNumber),
      getPerformanceTests(idNumber),
      getPlayerPerformanceLogs(idNumber),
      getTeamGroups(idNumber),
      getPlayerPairings(idNumber),
      getPlayerUnavailability(idNumber),
    ]);

    const safePlayers = players || [];
    const safeStaff = staff || [];
    const safeGames = games || [];
    const safeStats = stats || [];
    const safeRecords = records || [];
    const safeLeagueLinks = leagueLinks || [];

    let record = { wins: 0, losses: 0, draws: 0, points: 0 };
    if (safeRecords && safeRecords.length > 0) {
      safeRecords
        .filter((r) => r.leagueNodeSeasonId === null || r.leagueNodeSeasonId === undefined)
        .forEach((r) => {
          record.wins += r.wins || 0;
          record.losses += r.losses || 0;
          record.draws += r.draws || 0;
          record.points += r.points || 0;
        });
    } else {
      const completedGames = safeGames.filter(
        (g) => g.status === "completed" && (g.homeScore ?? 0) + (g.awayScore ?? 0) > 0,
      );
      completedGames.forEach((g) => {
        const isHome = g.homeTeamSeasonId === idNumber;
        const teamScore = isHome ? g.homeScore : g.awayScore;
        const oppScore = isHome ? g.awayScore : g.homeScore;

        if (teamScore !== null && oppScore !== null && teamScore !== undefined && oppScore !== undefined) {
          if (teamScore > oppScore) {
            record.wins += 1;
            record.points += 3;
          } else if (teamScore < oppScore) {
            record.losses += 1;
          } else {
            record.draws += 1;
            record.points += 1;
          }
        }
      });
    }

    const leagueLinksWithStandings = await Promise.all(
      safeLeagueLinks.map(async (link) => {
        const competitionRecords = (await getTeamSeasonRecords(
          link.leagueNodeSeasonId,
          idNumber,
        )) || [];
        const teamCompetitionRecord = competitionRecords.find(
          (item) => item.teamSeasonId === idNumber,
        );
        const position = teamCompetitionRecord
          ? competitionRecords.findIndex(
              (item) => item.teamSeasonId === idNumber,
            ) + 1
          : null;

        return {
          ...link,
          record: teamCompetitionRecord
            ? {
                wins: teamCompetitionRecord.wins,
                losses: teamCompetitionRecord.losses,
                draws: teamCompetitionRecord.draws,
                points: teamCompetitionRecord.points,
              }
            : null,
          position,
        };
      }),
    );

    return (
      <main className='mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8'>
        <TeamPageClient
          teamSeason={teamSeason}
          players={safePlayers}
          staff={safeStaff}
          games={safeGames}
          stats={safeStats}
          record={record}
          leagueLinks={leagueLinksWithStandings}
          customDefs={customDefs || []}
          customVals={customVals || []}
          perfTests={perfTests || []}
          perfLogs={perfLogs || []}
          groups={groups || []}
          pairings={pairings || []}
          unavailabilities={unavailabilities || []}
        />
      </main>
    );
  } catch (err: any) {
    console.error(`Error loading team season ${idNumber}:`, err);
    return (
      <div className='mx-auto max-w-2xl px-4 py-16'>
        <Card variant='outlined' padding='lg' className='text-center bg-surface/30'>
          <ShieldAlert size={48} className='mx-auto text-danger mb-4' />
          <h2 className='text-xl font-bold text-text mb-2'>Team Data Unavailable</h2>
          <p className='text-sm text-muted mb-6'>
            Unable to load team statistics right now. Please try again later.
          </p>
          <Link href='/'>
            <Button variant='primary' className='inline-flex flex-row items-center gap-2 text-sm px-4 py-2'>
              <ArrowLeft size={16} />
              <span>Back to Match Center</span>
            </Button>
          </Link>
        </Card>
      </div>
    );
  }
}
