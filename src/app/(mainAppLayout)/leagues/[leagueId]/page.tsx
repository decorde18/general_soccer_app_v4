import React from "react";
import { getLeagueById, getLeagueNodeSeasons, getTeamSeasonRecords, getGames } from "@/lib/data/queries";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import LeaguePageClient from "@/components/league/LeaguePageClient";

interface PageProps {
  params: Promise<{ leagueId: string }>;
}

export default async function LeagueDetailsPage({ params }: PageProps) {
  const { leagueId } = await params;
  const idNumber = Number(leagueId);

  if (isNaN(idNumber)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Card variant="outlined" padding="lg" className="text-center bg-surface/30">
          <ShieldAlert size={48} className="mx-auto text-danger mb-4" />
          <h2 className="text-xl font-bold text-text mb-2">Invalid League ID</h2>
          <p className="text-sm text-muted mb-6">
            The league identifier provided is invalid. Please return to the homepage.
          </p>
          <Link href="/">
            <Button variant="primary" className="inline-flex flex-row items-center gap-2 text-sm px-4 py-2">
              <ArrowLeft size={16} />
              <span>Back to Match Center</span>
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const [league, nodeSeasons, allGames] = await Promise.all([
    getLeagueById(idNumber),
    getLeagueNodeSeasons(idNumber),
    getGames({ leagueId: idNumber }),
  ]);

  if (!league) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Card variant="outlined" padding="lg" className="text-center bg-surface/30">
          <ShieldAlert size={48} className="mx-auto text-danger mb-4" />
          <h2 className="text-xl font-bold text-text mb-2">League Not Found</h2>
          <p className="text-sm text-muted mb-6">
            We couldn't find the league you were looking for. It may have been removed or the ID is incorrect.
          </p>
          <Link href="/">
            <Button variant="primary" className="inline-flex flex-row items-center gap-2 text-sm px-4 py-2">
              <ArrowLeft size={16} />
              <span>Back to Match Center</span>
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Load standings for each active division/node season
  const allDivisionsData = await Promise.all(
    nodeSeasons.map(async (ns) => {
      const standings = await getTeamSeasonRecords(ns.id);
      
      // Filter games for this specific node season/division
      const enrolledTeamIds = new Set(standings.map(t => teamSeasonIdToNumber(t.teamSeasonId)));
      const divisionGames = allGames.filter((g) => {
        // If BOTH teams are in this division, it's a division match
        return enrolledTeamIds.has(g.homeTeamSeasonId) && enrolledTeamIds.has(g.awayTeamSeasonId);
      });

      return {
        id: ns.id,
        leagueNodeName: ns.leagueNodeName,
        seasonName: ns.seasonName,
        standings: standings.map(s => ({
          teamSeasonId: s.teamSeasonId,
          teamName: s.teamName,
          clubName: s.clubName,
          gamesPlayed: s.gamesPlayed,
          wins: s.wins,
          losses: s.losses,
          draws: s.draws,
          goalsFor: s.goalsFor,
          goalsAgainst: s.goalsAgainst,
          points: s.points,
        })),
        games: divisionGames.map(g => ({
          id: g.id,
          startDate: g.startDate,
          startTime: g.startTime,
          status: g.status,
          gameType: g.gameType,
          homeTeamName: g.homeTeamName,
          homeClubName: g.homeClubName,
          awayTeamName: g.awayTeamName,
          awayClubName: g.awayClubName,
          homeScore: g.homeScore,
          awayScore: g.awayScore,
          locationName: g.locationName,
        })).slice(0, 12),
      };
    })
  );

  // Helper function to cast IDs safely
  function teamSeasonIdToNumber(id: any): number {
    return Number(id);
  }

  // Only display divisions that have teams enrolled (filters out parent nodes like "South Atlantic Premier League")
  const activeDivisions = allDivisionsData.filter(d => d.standings.length > 0);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Button */}
      <div>
        <Link href="/">
          <Button variant="outline" className="flex flex-row items-center gap-2 text-xs py-1.5 px-3">
            <ArrowLeft size={14} />
            <span>Back to Match Center</span>
          </Button>
        </Link>
      </div>

      <LeaguePageClient
        leagueName={league.name}
        governingBodyName={league.governingBodyName}
        abbreviation={league.abbreviation}
        description={league.description}
        divisions={activeDivisions}
      />
    </main>
  );
}
