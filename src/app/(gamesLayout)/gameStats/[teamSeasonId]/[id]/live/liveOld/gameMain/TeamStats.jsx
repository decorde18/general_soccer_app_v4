"use client";
import { useMemo, useState } from "react";
import useGameStore from "@/stores/gameStore";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import useGameEventsStore from "@/stores/gameEventsStore";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import { formatSecondsToMmss } from "@/lib/dateTimeUtils";
import EventTypeSelectionModal from "./EventTypeSelectionModal";

function TeamStats({ onOpenLiveGameModal }) {
  const game = useGameStore((s) => s.game);
  const players = useGamePlayersStore((s) => s.players);

  const teamStats = game?.teamStatTotals || {
    corner: { us: 0, them: 0 },
    offside: { us: 0, them: 0 },
    foul: { us: 0, them: 0 },
    shots: 0,
    saves: 0,
  };

  const isRecording = useGameEventsStore((s) => s.isRecording);
  const recordPlayerAction = useGameEventsStore((s) => s.recordPlayerAction);
  const recordTeamEvent = useGameEventsStore((s) => s.recordTeamEvent);
  const deleteEvent = useGameEventsStore((s) => s.deleteEvent);

  const [showEventTypeModal, setShowEventTypeModal] = useState(false);
  const [showShotModal, setShowShotModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  const availablePlayers = useMemo(() => {
    return players
      .filter(
        (p) =>
          p.fieldStatus === "onField" ||
          p.fieldStatus === "onFieldGk" ||
          p.fieldStatus === "subbingOut",
      )
      .map((p) => ({
        value: p.playerGameId,
        label: `#${p.jerseyNumber} ${p.fullName}`,
      }));
  }, [players]);

  // Quick stat handlers with optimistic updates
  const handleQuickStat = async (statType, forYourTeam) => {
    try {
      await recordTeamEvent({
        eventType: statType,
        forYourTeam,
      });
    } catch (error) {
      console.error("Error recording stat:", error);
      alert("Failed to record stat. Please try again.");
    }
  };

  const handleSaveClick = async () => {
    const currentGK = players.find(
      (p) => p.fieldStatus === "onFieldGk" || p.gameStatus === "goalkeeper",
    );
    if (!currentGK) {
      alert("No goalkeeper found on field");
      return;
    }

    try {
      await recordPlayerAction({
        playerGameId: currentGK.playerGameId,
        eventType: "save",
      });
    } catch (error) {
      console.error("Error recording save:", error);
      alert("Failed to record save. Please try again.");
    }
  };

  const handleShotClick = () => {
    setShowShotModal(true);
  };

  const handleShotPlayerSelect = async (playerGameId) => {
    setShowShotModal(false);

    try {
      await recordPlayerAction({
        playerGameId: parseInt(playerGameId),
        eventType: "shot_on_target",
      });
    } catch (error) {
      console.error("Error recording shot:", error);
      alert("Failed to record shot. Please try again.");
    }
  };

  const handleMajorEventClick = () => {
    setShowEventTypeModal(true);
  };

  // Handle event type selection from first modal
  const handleEventTypeSelected = async (eventType, shouldStopClock) => {
    // Await to ensure loading states work
    await onOpenLiveGameModal(eventType, shouldStopClock);

    // Close only after modal opening sequence completes
    setShowEventTypeModal(false);
  };

  // Get recent events for display
  const recentEvents = useMemo(() => {
    if (!game) return [];

    const events = [];
    const teamSeasonId = game.isHome
      ? game.home_team_season_id
      : game.away_team_season_id;

    // Major events
    game.gameEventsMajor?.forEach((e) => {
      let label = e.event_type.replace(/_/g, " ");
      let details = null;
      let playerInfo = null;

      const goal = game.gameEventsGoals?.find((g) => g.major_event_id === e.id);
      if (goal) {
        const scorer = players.find(
          (p) => p.playerGameId === goal.scorer_player_game_id,
        );
        if (scorer) {
          playerInfo = `#${scorer.jerseyNumber} ${scorer.fullName}`;
        } else if (goal.opponent_jersey_number) {
          playerInfo = `#${goal.opponent_jersey_number}`;
        }
        details = goal.team_season_id === teamSeasonId ? "Us" : "Them";
      }

      const card = game.gameEventsDiscipline?.find(
        (d) => d.major_event_id === e.id,
      );
      if (card) {
        label = `${card.card_type} card`;
        const cardPlayer = players.find(
          (p) => p.playerGameId === card.player_game_id,
        );
        if (cardPlayer) {
          playerInfo = `#${cardPlayer.jerseyNumber} ${cardPlayer.fullName}`;
        }
      }

      const penalty = game.gameEventsPenalties?.find(
        (p) => p.major_event_id === e.id,
      );
      if (penalty) {
        const shooter = players.find(
          (p) => p.playerGameId === penalty.shooter_player_game_id,
        );
        if (shooter) {
          playerInfo = `#${shooter.jerseyNumber} ${shooter.fullName}`;
        }
        details = penalty.outcome;
      }

      events.push({
        id: e.id,
        type: "major",
        eventType: e.event_type,
        label,
        gameTime: e.game_time,
        period: e.period,
        clockStopped: e.clock_should_run === 0,
        playerInfo,
        details: details || e.details,
        canEdit: true,
        rawEvent: e,
      });
    });

    // Team events (corners, offsides, fouls, etc.)
    game.gameEventsTeam?.forEach((e) => {
      let label = e.event_type.replace(/_/g, " ");
      let details = e.team_season_id === teamSeasonId ? "Us" : "Them";

      events.push({
        id: e.id,
        type: "team",
        eventType: e.event_type,
        label,
        gameTime: e.game_time,
        period: e.period,
        clockStopped: false,
        playerInfo: null,
        details,
        canEdit: true,
        rawEvent: e,
      });
    });

    // Player actions (shots, saves, etc.)
    game.playerActions?.forEach((e) => {
      let label = e.event_type.replace(/_/g, " ");
      let playerInfo = null;

      const actionPlayer = players.find(
        (p) => p.playerGameId === e.player_game_id,
      );
      if (actionPlayer) {
        playerInfo = `#${actionPlayer.jerseyNumber} ${actionPlayer.fullName}`;
      }

      events.push({
        id: e.id,
        type: "player_action",
        eventType: e.event_type,
        label,
        gameTime: e.game_time,
        period: e.period,
        clockStopped: false,
        playerInfo,
        details: null,
        canEdit: true,
        rawEvent: e,
      });
    });

    // Sort by game time descending
    return events.sort((a, b) => b.gameTime - a.gameTime).slice(0, 20);
  }, [game, players]);

  const handleDeleteEvent = (event) => {
    setEventToDelete(event);
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;

    try {
      if (eventToDelete.type === "major") {
        await deleteEvent(eventToDelete.id, "major", true);
      } else {
        await deleteEvent(eventToDelete.id, eventToDelete.type);
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event");
    } finally {
      setEventToDelete(null);
    }
  };

  if (!game) {
    return <div className='text-center text-muted py-4'>No active game</div>;
  }

  return (
    <div className='w-[290px] min-w-[290px]'>
      {/* Major Event Button */}
      <div className='mb-3'>
        <Button
          onClick={handleMajorEventClick}
          variant='primary'
          className='w-full'
          size='md'
          disabled={isRecording}
        >
          {isRecording ? "Recording..." : "Record Major Event"}
        </Button>
      </div>

      {/* Stat Counters */}
      <div className='space-y-2 mb-3'>
        {/* Corners */}
        <div className='flex items-center justify-between py-2 px-3 bg-surface rounded-lg border border-border'>
          <span className='text-xs font-medium text-text'>Corners</span>
          <div className='flex items-center gap-3'>
            <button
              onClick={() => handleQuickStat("corner", true)}
              disabled={isRecording}
              className='w-7 h-7 flex items-center justify-center rounded bg-primary text-white hover:bg-accent-hover transition-colors disabled:opacity-50'
            >
              +
            </button>
            <div className='flex items-center gap-2 min-w-[50px] justify-center'>
              <span className='text-sm font-bold text-primary'>
                {teamStats.corner?.us || 0}
              </span>
              <span className='text-xs text-muted'>-</span>
              <span className='text-sm font-bold text-accent'>
                {teamStats.corner?.them || 0}
              </span>
            </div>
            <button
              onClick={() => handleQuickStat("corner", false)}
              disabled={isRecording}
              className='w-7 h-7 flex items-center justify-center rounded bg-accent text-white hover:bg-error-hover transition-colors disabled:opacity-50'
            >
              +
            </button>
          </div>
        </div>

        {/* Offsides */}
        <div className='flex items-center justify-between py-2 px-3 bg-surface rounded-lg border border-border'>
          <span className='text-xs font-medium text-text'>Offsides</span>
          <div className='flex items-center gap-3'>
            <button
              onClick={() => handleQuickStat("offside", true)}
              disabled={isRecording}
              className='w-7 h-7 flex items-center justify-center rounded bg-primary text-white hover:bg-accent-hover transition-colors disabled:opacity-50'
            >
              +
            </button>
            <div className='flex items-center gap-2 min-w-[50px] justify-center'>
              <span className='text-sm font-bold text-primary'>
                {teamStats.offside?.us || 0}
              </span>
              <span className='text-xs text-muted'>-</span>
              <span className='text-sm font-bold text-accent'>
                {teamStats.offside?.them || 0}
              </span>
            </div>
            <button
              onClick={() => handleQuickStat("offside", false)}
              disabled={isRecording}
              className='w-7 h-7 flex items-center justify-center rounded bg-accent text-white hover:bg-error-hover transition-colors disabled:opacity-50'
            >
              +
            </button>
          </div>
        </div>

        {/* Fouls */}
        <div className='flex items-center justify-between py-2 px-3 bg-surface rounded-lg border border-border'>
          <span className='text-xs font-medium text-text'>Fouls</span>
          <div className='flex items-center gap-3'>
            <button
              onClick={() => handleQuickStat("foul", true)}
              disabled={isRecording}
              className='w-7 h-7 flex items-center justify-center rounded bg-primary text-white hover:bg-accent-hover transition-colors disabled:opacity-50'
            >
              +
            </button>
            <div className='flex items-center gap-2 min-w-[50px] justify-center'>
              <span className='text-sm font-bold text-primary'>
                {teamStats.foul?.us || 0}
              </span>
              <span className='text-xs text-muted'>-</span>
              <span className='text-sm font-bold text-accent'>
                {teamStats.foul?.them || 0}
              </span>
            </div>
            <button
              onClick={() => handleQuickStat("foul", false)}
              disabled={isRecording}
              className='w-7 h-7 flex items-center justify-center rounded bg-accent text-white hover:bg-error-hover transition-colors disabled:opacity-50'
            >
              +
            </button>
          </div>
        </div>

        {/* Shots */}
        <div className='flex items-center justify-between py-2 px-3 bg-surface rounded-lg border border-border'>
          <span className='text-xs font-medium text-text'>Shots</span>
          <div className='flex items-center gap-3'>
            <Button
              onClick={handleShotClick}
              variant='outline'
              size='sm'
              disabled={isRecording}
            >
              +
            </Button>
            <span className='text-sm font-bold text-primary min-w-[30px] text-center'>
              {teamStats.shots || 0}
            </span>
          </div>
        </div>

        {/* Saves */}
        <div className='flex items-center justify-between py-2 px-3 bg-surface rounded-lg border border-border'>
          <span className='text-xs font-medium text-text'>Saves</span>
          <div className='flex items-center gap-3'>
            <Button
              onClick={handleSaveClick}
              variant='outline'
              size='sm'
              disabled={isRecording}
            >
              +
            </Button>
            <span className='text-sm font-bold text-primary min-w-[30px] text-center'>
              {teamStats.saves || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Events List */}
      <div className='border-t-2 border-border pt-3'>
        <h3 className='text-xs font-semibold text-text-label mb-2 uppercase'>
          Recent Events
        </h3>
        <div className='space-y-1.5 h-[105px] overflow-y-auto pr-1'>
          {recentEvents.length === 0 ? (
            <div className='text-xs text-muted text-center py-4 bg-surface rounded border border-border'>
              No events yet
            </div>
          ) : (
            recentEvents.map((event) => (
              <div
                key={`${event.type}-${event.id}`}
                className='flex items-center gap-2 p-2 bg-surface rounded-lg border border-border'
              >
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <span className='text-xs font-semibold text-text capitalize'>
                      {event.label}
                    </span>
                    {event.clockStopped && (
                      <span className='px-1.5 py-0.5 text-xs font-medium rounded bg-red-500 text-white'>
                        ⏸
                      </span>
                    )}
                    {event.details && (
                      <span
                        className={`px-1.5 py-0.5 text-xs font-medium rounded ${event.details === "Us"
                          ? "bg-primary text-white"
                          : event.details === "Them"
                            ? "bg-accent text-white"
                            : "bg-gray-500 text-white"
                          }`}
                      >
                        {event.details}
                      </span>
                    )}
                    <span className='text-xs text-muted'>
                      {formatSecondsToMmss(event.gameTime)}
                    </span>
                  </div>
                  {event.playerInfo && (
                    <div className='text-xs text-muted truncate mt-0.5'>
                      {event.playerInfo}
                    </div>
                  )}
                </div>
                <div className='flex gap-1 flex-shrink-0'>
                  <button
                    onClick={() => handleDeleteEvent(event)}
                    disabled={isRecording}
                    className='w-6 h-6 flex items-center justify-center rounded bg-danger text-white hover:bg-error-hover transition-colors text-sm font-bold disabled:opacity-50'
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Event Type Selection Modal */}
      <EventTypeSelectionModal
        isOpen={showEventTypeModal}
        onClose={() => setShowEventTypeModal(false)}
        onEventTypeSelected={handleEventTypeSelected}
        isRecording={isRecording}
      />

      {/* Shot Player Selection Modal - Simple version */}
      {showShotModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto'>
            <h3 className='text-lg font-semibold mb-4'>
              Select Player (Shot on Target)
            </h3>
            <div className='space-y-2'>
              {availablePlayers.map((player) => (
                <button
                  key={player.value}
                  onClick={() => handleShotPlayerSelect(player.value)}
                  className='w-full text-left px-4 py-3 rounded-lg bg-surface hover:bg-primary hover:text-white transition-colors border border-border'
                >
                  {player.label}
                </button>
              ))}
              <Button
                onClick={() => setShowShotModal(false)}
                variant='outline'
                className='w-full mt-4'
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={!!eventToDelete}
        onClose={() => setEventToDelete(null)}
        title="Delete Event"
        message={`Are you sure you want to delete this ${eventToDelete?.label}?`}
        type="warning"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteEvent}
      />
    </div>
  );
}

export default TeamStats;
