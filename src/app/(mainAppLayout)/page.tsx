import React from "react";
import { format, parseISO } from "date-fns";
import {
  Calendar,
  MapPin,
  Clock,
  Trophy,
  Users,
  ShieldAlert,
  Activity,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  getTeamSeasons,
  getLeagues,
  getGames,
  getTeamSeasonById,
  getLeagueById,
  getLeaguesForTeamSeason,
} from "@/lib/data/queries";
import LandingSelectors from "@/components/layout/LandingSelectors";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { getServerAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{
    teamSeasonId?: string;
    leagueId?: string;
    clubType?: string;
  }>;
}

// Safely format date strings
function formatGameDate(dateStr: string) {
  try {
    return format(new Date(dateStr), "EEE, MMM d, yyyy");
  } catch (e) {
    return dateStr;
  }
}

// Safely format time strings
function formatGameTime(timeStr: string | null) {
  if (!timeStr) return "TBD";
  try {
    // If the database time is a full ISO date-time, extract time
    const date = new Date(timeStr);
    if (!isNaN(date.getTime())) {
      return format(date, "h:mm a");
    }
    return timeStr;
  } catch (e) {
    return timeStr;
  }
}

export default async function LandingPage({ searchParams }: PageProps) {
  const session = await getServerAuthSession();
  if (session?.user) {
    redirect("/dashboard");
  }

  const resolvedParams = await searchParams;
  const selectedTeamSeasonId = resolvedParams.teamSeasonId
    ? Number(resolvedParams.teamSeasonId)
    : undefined;
  const selectedLeagueId = resolvedParams.leagueId
    ? Number(resolvedParams.leagueId)
    : undefined;
  const selectedClubType = resolvedParams.clubType || "";

  // Fetch data for dropdowns
  let rawTeamSeasons = await getTeamSeasons();
  if (selectedClubType) {
    rawTeamSeasons = rawTeamSeasons.filter(
      (ts) => ts.clubType === selectedClubType,
    );
  }

  let rawLeagues;
  if (selectedTeamSeasonId) {
    const enrolled = await getLeaguesForTeamSeason(selectedTeamSeasonId);
    rawLeagues = enrolled.map((e) => ({
      id: e.leagueId,
      name: e.leagueName,
      abbreviation: e.leagueAbbreviation || null,
    }));
    // Remove duplicates
    const seen = new Set();
    rawLeagues = rawLeagues.filter((l) => {
      const isDup = seen.has(l.id);
      seen.add(l.id);
      return !isDup;
    });
  } else {
    rawLeagues = await getLeagues();
  }

  // Map data to selector format
  const teamSeasonOptions = rawTeamSeasons.map((ts) => ({
    value: String(ts.id),
    label: `${ts.clubName} - ${ts.teamName} (${ts.seasonName})`,
  }));

  const leagueOptions = rawLeagues.map((l) => ({
    value: String(l.id),
    label: l.name + (l.abbreviation ? ` (${l.abbreviation})` : ""),
  }));

  // Determine current active filter details
  let filterTitle = "Public Match Center";
  let filterSubtitle =
    "All recent results and upcoming games across the organization.";

  if (selectedTeamSeasonId) {
    const ts = await getTeamSeasonById(selectedTeamSeasonId);
    if (ts) {
      filterTitle = `${ts.teamName}`;
      filterSubtitle = `${ts.seasonName} Season - Schedule & Results`;
    }
  } else if (selectedLeagueId) {
    const l = await getLeagueById(selectedLeagueId);
    if (l) {
      filterTitle = `${l.name}`;
      filterSubtitle = `${l.abbreviation || "League"} - Schedule & Results`;
    }
  } else if (selectedClubType) {
    filterTitle =
      selectedClubType === "high_school"
        ? "High School Matches"
        : "Club Matches";
    filterSubtitle = `Showing fixtures and results for ${selectedClubType === "high_school" ? "high school" : "club / travel"} teams.`;
  }

  // Fetch games based on filters
  let games = await getGames({
    teamSeasonId: selectedTeamSeasonId,
    leagueId: selectedLeagueId,
    clubType: selectedClubType ? selectedClubType : undefined,
  });

  // Split games into schedule (upcoming/in-progress) and results (completed)
  let recentResults = games
    .filter((g) => g.status === "completed")
    .sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    ); // newest results first

  let upcomingFixtures = games
    .filter((g) => g.status !== "completed")
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(a.startDate).getTime(),
    ); // nearest fixtures first

  // If no filters are active, show a curated dashboard (top 5 results and top 5 fixtures)
  const isFiltered = !!(
    selectedTeamSeasonId ||
    selectedLeagueId ||
    selectedClubType
  );
  if (!isFiltered) {
    recentResults = recentResults.slice(0, 5);
    upcomingFixtures = upcomingFixtures.slice(0, 5);
  }

  return (
    <main className='min-h-screen bg-background pb-12'>
      {/* Premium Hero Section */}
      <section className='relative overflow-hidden py-12 sm:py-16 text-center border-b border-border/40 bg-surface/30 backdrop-blur-sm'>
        <div className='absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80'>
          <div className='relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-accent opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.187rem]' />
        </div>

        <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
          <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-4 uppercase tracking-wider animate-pulse'>
            <Sparkles size={12} />
            <span>Interactive Match Center</span>
          </div>
          <h1 className='bg-gradient-to-r from-text via-primary to-accent bg-clip-text text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent mb-4'>
            Cordero Soccer Stats
          </h1>
          <p className='text-lg text-muted/90 max-w-2xl mx-auto leading-relaxed'>
            Follow your favorite teams, browse league standings, track upcoming
            schedules, and view complete game results instantly.
          </p>
        </div>
      </section>

      {/* Selectors and Filters */}
      <section className='px-4 sm:px-6 lg:px-8 -mt-6 relative z-10'>
        <LandingSelectors
          teamSeasons={teamSeasonOptions}
          leagues={leagueOptions}
        />
      </section>

      {/* Match Center Section */}
      <section className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mt-6'>
        <div className='flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-border/60 gap-4'>
          <div>
            <h2 className='text-2xl font-bold text-text flex items-center gap-2'>
              <Activity className='text-primary animate-pulse' size={24} />
              {filterTitle}
            </h2>
            <p className='text-sm text-muted mt-1'>{filterSubtitle}</p>
          </div>
          {!isFiltered && (
            <span className='text-xs bg-primary/10 text-primary border border-primary/20 font-semibold px-3 py-1 rounded-full uppercase tracking-wider'>
              Preview Mode
            </span>
          )}
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* Upcoming Fixtures Column */}
          <div className='space-y-6'>
            <h3 className='text-lg font-bold text-text flex items-center gap-2 px-1'>
              <Calendar size={18} className='text-primary' />
              <span>Upcoming Fixtures</span>
              <span className='text-xs font-normal text-muted bg-surface border border-border px-2 py-0.5 rounded-full ml-auto'>
                {upcomingFixtures.length}{" "}
                {upcomingFixtures.length === 1 ? "Game" : "Games"}
              </span>
            </h3>

            {upcomingFixtures.length === 0 ? (
              <Card
                variant='outlined'
                padding='lg'
                className='text-center py-12'
              >
                <ShieldAlert size={40} className='mx-auto text-muted/60 mb-3' />
                <p className='text-muted font-medium'>
                  No upcoming games scheduled.
                </p>
              </Card>
            ) : (
              <div className='space-y-4'>
                {upcomingFixtures.map((game) => (
                  <Card
                    key={game.id}
                    variant='hover'
                    padding='md'
                    className='border-border/80 bg-surface/50'
                  >
                    <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                      {/* Game Context/Meta */}
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 text-xs text-muted mb-2'>
                          <span className='font-semibold text-primary'>
                            {game.seasonName}
                          </span>
                          <span>•</span>
                          <span className='capitalize'>
                            {game.gameType} Match
                          </span>
                          {game.status !== "scheduled" && (
                            <>
                              <span>•</span>
                              <span className='text-accent font-semibold uppercase'>
                                {game.status.replace("_", " ")}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Matchup Teams */}
                        <div className='space-y-2'>
                          <div className='flex items-center gap-2.5'>
                            <div className='h-6 w-6 rounded bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary'>
                              H
                            </div>
                            <span className='font-semibold text-text text-sm sm:text-base truncate'>
                              {game.homeClubName} {game.homeTeamName}
                            </span>
                          </div>
                          <div className='flex items-center gap-2.5'>
                            <div className='h-6 w-6 rounded bg-accent/10 border border-accent/20 flex items-center justify-center font-bold text-xs text-accent'>
                              A
                            </div>
                            <span className='font-semibold text-text text-sm sm:text-base truncate'>
                              {game.awayClubName} {game.awayTeamName}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Schedule details */}
                      <div className='flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-border/50 pt-3 sm:pt-0 sm:pl-6 gap-2 text-right'>
                        <div className='flex items-center gap-1.5 text-xs font-semibold text-text/80 bg-background sm:bg-transparent px-2.5 py-1 sm:p-0 rounded border sm:border-0 border-border'>
                          <Calendar size={14} className='text-primary' />
                          <span>{formatGameDate(game.startDate)}</span>
                        </div>
                        <div className='flex items-center gap-1.5 text-xs text-muted'>
                          <Clock size={14} />
                          <span>{formatGameTime(game.startTime)}</span>
                        </div>
                        {game.locationName && (
                          <div className='flex items-center gap-1.5 text-xs text-muted max-w-[150px] truncate'>
                            <MapPin size={14} />
                            <span title={game.locationName}>
                              {game.locationName}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Recent Results Column */}
          <div className='space-y-6'>
            <h3 className='text-lg font-bold text-text flex items-center gap-2 px-1'>
              <Trophy size={18} className='text-accent' />
              <span>Recent Results</span>
              <span className='text-xs font-normal text-muted bg-surface border border-border px-2 py-0.5 rounded-full ml-auto'>
                {recentResults.length}{" "}
                {recentResults.length === 1 ? "Result" : "Results"}
              </span>
            </h3>

            {recentResults.length === 0 ? (
              <Card
                variant='outlined'
                padding='lg'
                className='text-center py-12'
              >
                <ShieldAlert size={40} className='mx-auto text-muted/60 mb-3' />
                <p className='text-muted font-medium'>
                  No match results available.
                </p>
              </Card>
            ) : (
              <div className='space-y-4'>
                {recentResults.map((game) => {
                  const isHomeWinner =
                    (game.homeScore ?? 0) > (game.awayScore ?? 0);
                  const isAwayWinner =
                    (game.awayScore ?? 0) > (game.homeScore ?? 0);

                  let cardClass = "border-border/80 bg-surface/50";
                  let resultBadge = null;

                  if (
                    selectedTeamSeasonId &&
                    game.homeScore !== null &&
                    game.awayScore !== null
                  ) {
                    const isHome =
                      game.homeTeamSeasonId === selectedTeamSeasonId;
                    const won = isHome ? isHomeWinner : isAwayWinner;
                    const lost = isHome ? isAwayWinner : isHomeWinner;

                    if (won) {
                      cardClass =
                        "border-success/30 hover:border-success/60 bg-success/[0.03] shadow-sm";
                      resultBadge = (
                        <span className='text-[9px] font-extrabold uppercase tracking-wider text-success bg-success/15 border border-success/30 px-2 py-0.5 rounded'>
                          Win
                        </span>
                      );
                    } else if (lost) {
                      cardClass =
                        "border-danger/25 hover:border-danger/50 bg-danger/[0.02] shadow-sm";
                      resultBadge = (
                        <span className='text-[9px] font-extrabold uppercase tracking-wider text-danger bg-danger/15 border border-danger/30 px-2 py-0.5 rounded'>
                          Loss
                        </span>
                      );
                    } else {
                      cardClass = "border-border/80 bg-surface/50";
                      resultBadge = (
                        <span className='text-[9px] font-extrabold uppercase tracking-wider text-muted bg-muted/15 border border-border px-2 py-0.5 rounded'>
                          Draw
                        </span>
                      );
                    }
                  }

                  return (
                    <Card
                      key={game.id}
                      variant='hover'
                      padding='md'
                      className={`transition-all duration-200 ${cardClass}`}
                    >
                      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                        {/* Matchup and Scores */}
                        <div className='flex-1 min-w-0 space-y-3'>
                          <div className='flex items-center justify-between gap-2'>
                            <div className='flex items-center gap-2 text-xs text-muted'>
                              <span className='font-semibold text-primary'>
                                {game.seasonName}
                              </span>
                              <span>•</span>
                              <span className='capitalize'>
                                {game.gameType} Match
                              </span>
                              {resultBadge && (
                                <>
                                  <span>•</span>
                                  {resultBadge}
                                </>
                              )}
                            </div>
                            <span className='text-[10px] font-bold uppercase tracking-wider text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded'>
                              Final
                            </span>
                          </div>

                          <div className='space-y-2'>
                            {/* Home Team Row */}
                            <div className='flex items-center justify-between gap-4'>
                              <div className='flex items-center gap-2.5 min-w-0'>
                                <div className='h-6 w-6 rounded bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary flex-shrink-0'>
                                  H
                                </div>
                                <span
                                  className={`text-sm sm:text-base truncate ${isHomeWinner ? "font-bold text-text" : "font-medium text-text/75"}`}
                                >
                                  {game.homeClubName} {game.homeTeamName}
                                </span>
                              </div>
                              <span
                                className={`text-base font-extrabold px-2.5 py-0.5 rounded-md ${isHomeWinner ? "bg-primary text-white" : "bg-background text-muted"}`}
                              >
                                {game.homeScore !== null ? game.homeScore : "-"}
                              </span>
                            </div>

                            {/* Away Team Row */}
                            <div className='flex items-center justify-between gap-4'>
                              <div className='flex items-center gap-2.5 min-w-0'>
                                <div className='h-6 w-6 rounded bg-accent/10 border border-accent/20 flex items-center justify-center font-bold text-xs text-accent flex-shrink-0'>
                                  A
                                </div>
                                <span
                                  className={`text-sm sm:text-base truncate ${isAwayWinner ? "font-bold text-text" : "font-medium text-text/75"}`}
                                >
                                  {game.awayClubName} {game.awayTeamName}
                                </span>
                              </div>
                              <span
                                className={`text-base font-extrabold px-2.5 py-0.5 rounded-md ${isAwayWinner ? "bg-primary text-white" : "bg-background text-muted"}`}
                              >
                                {game.awayScore !== null ? game.awayScore : "-"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Location and Info */}
                        <div className='flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-border/50 pt-3 sm:pt-0 sm:pl-6 gap-2 text-right'>
                          <div className='text-xs font-semibold text-text/80 bg-background sm:bg-transparent px-2.5 py-1 sm:p-0 rounded border sm:border-0 border-border'>
                            {formatGameDate(game.startDate)}
                          </div>
                          {game.finalStatus &&
                            game.finalStatus !== "regulation" && (
                              <span className='text-[10px] text-primary font-bold uppercase tracking-wider'>
                                ({game.finalStatus})
                              </span>
                            )}
                          {game.locationName && (
                            <div className='flex items-center gap-1 text-xs text-muted max-w-[150px] truncate'>
                              <MapPin size={12} />
                              <span title={game.locationName}>
                                {game.locationName}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* View Admin Panel CTA */}
        <div className='mt-12 text-center border-t border-border/60 pt-8'>
          <Card
            variant='outlined'
            padding='lg'
            className='max-w-2xl mx-auto bg-surface/30'
          >
            <h4 className='font-bold text-text text-base sm:text-lg mb-2'>
              Are you a Coach, Manager, or Admin?
            </h4>
            <p className='text-sm text-muted mb-4 max-w-lg mx-auto'>
              Log in to report scores, update event schedules, manage player
              rosters, and access admin tools.
            </p>
            <div className='flex justify-center'>
              <Link href='/login'>
                <Button
                  variant='primary'
                  className='flex flex-row items-center gap-2 text-sm px-5 py-2.5'
                >
                  <span>Go to Dashboard Login</span>
                  <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
