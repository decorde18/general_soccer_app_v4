"use client";
import { useEffect } from "react";
import useGameStore from "@/stores/gameStore";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import useGameEventsStore from "@/stores/gameEventsStore";

function TeamStatsBetweenPeriods() {
  const game = useGameStore((s) => s.game);
  const players = useGamePlayersStore((s) => s.players);

  // Use store state
  const gameEvents = game.gameEventsMajor;
  const teamStats = game.teamStatTotals;
  const isLoading = useGameEventsStore((s) => s.isLoadingEvents);

  // Use store method
  // const fetchGameEvents = useGameEventsStore((s) => s.fetchGameEvents);

  // Fetch stats on mount and when game changes
  // useEffect(() => {
  //   if (game?.game_id) {
  //     fetchGameEvents(game.game_id);
  //   }
  // }, [game?.game_id]);

  if (isLoading) {
    return <div className='text-center text-muted py-4'>Loading stats...</div>;
  }

  return (
    <div className='w-full'>
      <h2 className='text-base font-bold text-text mb-3'>Game Statistics</h2>

      {/* Stat Summary - Compact table-like display */}
      <div className='bg-surface rounded-lg border border-border p-3'>
        <div className='space-y-1.5'>
          {/* Corner Kicks */}
          <div className='flex items-center justify-between py-1'>
            <span className='text-xs font-medium text-text'>Corners</span>
            <div className='flex items-center gap-2'>
              <span className='text-sm font-bold text-primary w-6 text-right'>
                {teamStats.corner.us}
              </span>
              <span className='text-xs text-muted'>-</span>
              <span className='text-sm font-bold text-accent w-6 text-left'>
                {teamStats.corner.them}
              </span>
            </div>
          </div>

          {/* Offsides */}
          <div className='flex items-center justify-between py-1'>
            <span className='text-xs font-medium text-text'>Offsides</span>
            <div className='flex items-center gap-2'>
              <span className='text-sm font-bold text-primary w-6 text-right'>
                {teamStats.offside.us}
              </span>
              <span className='text-xs text-muted'>-</span>
              <span className='text-sm font-bold text-accent w-6 text-left'>
                {teamStats.offside.them}
              </span>
            </div>
          </div>

          {/* Fouls */}
          <div className='flex items-center justify-between py-1'>
            <span className='text-xs font-medium text-text'>Fouls</span>
            <div className='flex items-center gap-2'>
              <span className='text-sm font-bold text-primary w-6 text-right'>
                {teamStats.foul.us}
              </span>
              <span className='text-xs text-muted'>-</span>
              <span className='text-sm font-bold text-accent w-6 text-left'>
                {teamStats.foul.them}
              </span>
            </div>
          </div>

          <div className='border-t border-border my-1'></div>

          {/* Shots (Our Team Only) */}
          <div className='flex items-center justify-between py-1'>
            <span className='text-xs font-medium text-text'>Shots</span>
            <span className='text-sm font-bold text-primary'>
              {teamStats.shot}
            </span>
          </div>

          {/* Saves (Our Team Only) */}
          <div className='flex items-center justify-between py-1'>
            <span className='text-xs font-medium text-text'>Saves</span>
            <span className='text-sm font-bold text-primary'>
              {teamStats.save}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Events List */}
      <div className='border-t-2 border-border pt-3 mt-3'>
        <h3 className='text-xs font-semibold text-text-label mb-2 uppercase'>
          Recent Events
        </h3>
        <div className='space-y-1.5 max-h-[180px] overflow-y-auto pr-1'>
          {gameEvents.length === 0 ? (
            <div className='text-xs text-muted text-center py-3 bg-surface rounded border border-border'>
              No events yet
            </div>
          ) : (
            gameEvents
              .slice()
              .reverse()
              .map((stat) => {
                const player = players.find(
                  (p) => p.playerGameId === stat.player_game_id
                );
                const yourTeamSeasonId = game.isHome
                  ? game.home_team_season_id
                  : game.away_team_season_id;
                const isOurTeam = stat.team_season_id === yourTeamSeasonId;

                return (
                  <div
                    key={stat.id}
                    className='flex items-center gap-2 p-2 bg-surface rounded border border-border'
                  >
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2'>
                        <span className='text-xs font-semibold text-text capitalize'>
                          {stat.event_type.replace("_", " ")}
                        </span>
                        {!player && (
                          <span
                            className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                              isOurTeam
                                ? "bg-primary text-white"
                                : "bg-accent text-white"
                            }`}
                          >
                            {isOurTeam ? "Us" : "Them"}
                          </span>
                        )}
                        {stat.opponent_jersey_number && (
                          <span className='text-xs text-muted'>
                            #{stat.opponent_jersey_number}
                          </span>
                        )}
                      </div>
                      {player && (
                        <div className='text-xs text-muted truncate mt-0.5'>
                          #{player.jerseyNumber} {player.fullName}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
}

export default TeamStatsBetweenPeriods;
