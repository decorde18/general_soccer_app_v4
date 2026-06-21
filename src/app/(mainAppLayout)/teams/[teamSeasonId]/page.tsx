import React from "react";
import { 
  getTeamSeasonById, 
  getPlayersByTeamSeason, 
  getTeamStaff, 
  getGames, 
  getPlayerStatsByTeamSeason, 
  getTeamSeasonRecords 
} from "@/lib/data/queries";
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
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Card variant="outlined" padding="lg" className="text-center bg-surface/30">
          <ShieldAlert size={48} className="mx-auto text-danger mb-4" />
          <h2 className="text-xl font-bold text-text mb-2">Invalid Team ID</h2>
          <p className="text-sm text-muted mb-6">
            The team identifier provided is invalid. Please double check the URL or return home.
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

  // Fetch all necessary data in parallel
  const [
    teamSeason,
    players,
    staff,
    games,
    stats,
    records,
  ] = await Promise.all([
    getTeamSeasonById(idNumber),
    getPlayersByTeamSeason(idNumber),
    getTeamStaff(idNumber),
    getGames({ teamSeasonId: idNumber }),
    getPlayerStatsByTeamSeason(idNumber),
    getTeamSeasonRecords(undefined, idNumber),
  ]);

  // Handle case where team season doesn't exist
  if (!teamSeason) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Card variant="outlined" padding="lg" className="text-center bg-surface/30">
          <ShieldAlert size={48} className="mx-auto text-danger mb-4" />
          <h2 className="text-xl font-bold text-text mb-2">Team Not Found</h2>
          <p className="text-sm text-muted mb-6">
            We couldn't find the team season you were looking for. It may have been removed or the ID is incorrect.
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

  // Consolidate standings record or calculate as a fallback from games
  let record = { wins: 0, losses: 0, draws: 0, points: 0 };
  if (records && records.length > 0) {
    records.forEach((r) => {
      record.wins += r.wins;
      record.losses += r.losses;
      record.draws += r.draws;
      record.points += r.points;
    });
  } else {
    // Fallback: Compute record from games in case records aren't generated yet
    const completedGames = games.filter((g) => g.status === "completed");
    completedGames.forEach((g) => {
      const isHome = g.homeTeamSeasonId === idNumber;
      const teamScore = isHome ? g.homeScore : g.awayScore;
      const oppScore = isHome ? g.awayScore : g.homeScore;

      if (teamScore !== null && oppScore !== null) {
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

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      <TeamPageClient
        teamSeason={teamSeason}
        players={players}
        staff={staff}
        games={games}
        stats={stats}
        record={record}
      />
    </main>
  );
}
