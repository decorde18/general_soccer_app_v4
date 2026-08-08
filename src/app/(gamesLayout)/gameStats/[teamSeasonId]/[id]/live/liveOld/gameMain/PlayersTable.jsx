"use client";
/**
 * Universal Players Table Component
 * @param {Object} props
 * @param {Function} props.filterPlayers - Function to filter which players to show
 * @param {string} props.caption - Table caption/title
 * @param {Array} props.columns - Optional custom columns array
 * @param {Function} props.onActionClick - Handler for action button clicks
 * @param {Function} props.getActionButton - Function to render custom action button per row
 * @param {string} props.size - Table size (xxs, xs, sm, md, lg)
 * @param {string} props.timeMode - 'onField' | 'onBench' | 'none' - Which time columns to show
 * @param {Function} props.getRowClassName - Custom row className function
 */

import { useMemo, useState, useEffect } from "react";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import useGameStore from "@/stores/gameStore";
import useGamePlayerTimeStore from "@/stores/gamePlayerTimeStore";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import { formatSecondsToMmss } from "@/lib/dateTimeUtils";

function PlayersTable({
  filterPlayers,
  caption,
  columns: customColumns,
  onActionClick,
  getActionButton,
  size = "xxs",
  timeMode = "onField",
  getRowClassName,
}) {
  const gameStage = useGameStore((s) => s.getGameStage());
  const getGameTime = useGameStore((s) => s.getGameTime);

  // 1. Grab the live event arrays from the game store
  const game = useGameStore((s) => s.game);
  const playerActions = game?.playerActions || [];
  const goalsEvents = game?.gameEventsGoals || [];
  const disciplineEvents = game?.gameEventsDiscipline || [];
  const plusMinus = useGamePlayersStore((s) => s.calculateAllPlusMinus);

  const calculateCurrentTimeOnField = useGamePlayerTimeStore(
    (s) => s.calculateCurrentTimeOnField
  );
  const calculateTotalTimeOnField = useGamePlayerTimeStore(
    (s) => s.calculateTotalTimeOnField
  );
  const calculateCurrentTimeOffField = useGamePlayerTimeStore(
    (s) => s.calculateCurrentTimeOffField
  );

  const allPlayers = useGamePlayersStore((s) => s.players);

  const isGameLive = gameStage === "during_period";
  const isBeforeStart = gameStage === "before_start";

  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isGameLive) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isGameLive]);

  const gameTime = getGameTime();

  const players = useMemo(() => {
    return allPlayers
      .filter((p) =>
        ["dressed", "starter", "goalkeeper"].includes(p.gameStatus)
      )
      .filter(filterPlayers)
      .map((player) => {
        const pId = player.playerGameId;

        // 2. Derive stats from event arrays for real-time/optimistic updates
        const shots = playerActions.filter(
          (a) =>
            a.player_game_id === pId &&
            (a.event_type === "shot" || a.event_type === "shot_on_target")
        ).length;

        const saves = playerActions.filter(
          (a) => a.player_game_id === pId && a.event_type === "save"
        ).length;

        const goals = goalsEvents.filter(
          (g) => g.scorer_player_game_id === pId
        ).length;
        const goalsAgainst = goalsEvents.filter(
          (g) => g.defending_gk_player_game_id === pId
        ).length;

        const assists = goalsEvents.filter(
          (g) => g.assist_player_game_id === pId
        ).length;

        const yellowCards = disciplineEvents.filter(
          (d) => d.player_game_id === pId && d.card_color === "yellow"
        ).length;

        const redCards = disciplineEvents.filter(
          (d) => d.player_game_id === pId && d.card_color === "red"
        ).length;

        // Calculate playing time
        let totalTime = 0;
        let secondaryTime = 0;
        if (timeMode === "onField") {
          totalTime = calculateTotalTimeOnField(player, gameTime);
          secondaryTime = calculateCurrentTimeOnField(player, gameTime);
        } else if (timeMode === "onBench") {
          totalTime = calculateTotalTimeOnField(player, gameTime);
          secondaryTime = calculateCurrentTimeOffField(player, gameTime);
        }
        return {
          id: player.id,
          playerGameId: pId,
          number: player.jerseyNumber ?? "—",
          name: player.fullName || `${player.firstName} ${player.lastName}`,
          position: player.position,
          // Use our derived stats here
          shots,
          saves,
          goals,
          assists,
          yellowCards,
          redCards,
          plusMinus: player.plusMinus,
          goalsAgainst,
          fieldStatus: player.fieldStatus,
          gameStatus: player.gameStatus,
          subStatus: player.subStatus,
          isGoalkeeper: player.gameStatus === "goalkeeper",
          timeIn:
            timeMode !== "none" ? formatSecondsToMmss(totalTime) : undefined,
          timeInRecent:
            timeMode === "onField"
              ? formatSecondsToMmss(secondaryTime)
              : undefined,
          timeOut:
            timeMode === "onBench"
              ? formatSecondsToMmss(secondaryTime)
              : undefined,
        };
      });
  }, [
    allPlayers,
    playerActions, // Trigger re-memo on shot/save
    goalsEvents, // Trigger re-memo on goal
    disciplineEvents,
    filterPlayers,
    gameTime,
    timeMode,
    calculateTotalTimeOnField,
    calculateCurrentTimeOnField,
    calculateCurrentTimeOffField,
  ]);

  // Default columns based on timeMode
  const getDefaultColumns = (isGoalkeeper) => {
    const baseColumns = [
      { name: "number", label: "#", width: "50px" },
      { name: "name", label: "Name", width: "30%" },
    ];

    if (isBeforeStart) return baseColumns;

    if (isGoalkeeper) {
      baseColumns.push(
        { name: "saves", label: "Saves", cellClassName: "text-end" },
        { name: "goalsAgainst", label: "GA", cellClassName: "text-end" },
        { name: "plusMinus", label: "+/-" }
      );
    } else {
      baseColumns.push(
        { name: "shots", label: "Sh", cellClassName: "text-end" },
        { name: "goals", label: "G", cellClassName: "text-end" },
        { name: "assists", label: "A", cellClassName: "text-end" },
        { name: "plusMinus", label: "+/-" }
      );
    }

    if (timeMode === "onField") {
      return [
        ...baseColumns,
        { name: "timeIn", label: "Time", cellClassName: "text-end" },
        { name: "timeInRecent", label: "Last In", cellClassName: "text-end" },
      ];
    } else if (timeMode === "onBench") {
      return [
        ...baseColumns,
        { name: "timeIn", label: "Time In", cellClassName: "text-end" },
        { name: "timeOut", label: "Time Out", cellClassName: "text-end" },
      ];
    }

    return baseColumns;
  };

  // Default row className
  const defaultGetRowClassName = (row) => {
    if (row.subStatus === "pendingOut") {
      return "bg-red-100 border-l-4 border-red-500 p-0";
    }
    if (row.subStatus === "pendingIn") {
      return "bg-green-100 border-l-4 border-green-500 p-0";
    }
    return "p-0";
  };

  const rowClassName = getRowClassName || defaultGetRowClassName;

  // Default action button
  const defaultGetActionButton = (row) => {
    const buttonText = row.subStatus === "pendingOut" ? "Cancel" : "Sub Out";
    const variant = row.subStatus === "pendingOut" ? "danger" : "primary";

    return (
      <Button
        onClick={(e) => {
          e.stopPropagation();
          onActionClick?.(row);
        }}
        size='sm'
        variant={variant}
      >
        {buttonText}
      </Button>
    );
  };

  const actionButton =
    gameStage === "before_start" || gameStage === "end_game"
      ? null
      : getActionButton || defaultGetActionButton;

  // Determine if we need special columns (if table has goalkeepers)
  const hasGoalkeepers = players.some((p) => p.isGoalkeeper);
  const hasFieldPlayers = players.some((p) => !p.isGoalkeeper);

  // Use custom columns or generate based on player types
  const columns =
    customColumns ||
    (() => {
      // If mixed, use field player columns (more common)
      if (hasGoalkeepers && !hasFieldPlayers) {
        return getDefaultColumns(true);
      }
      return getDefaultColumns(false);
    })();

  return (
    <Table
      columns={columns}
      data={players}
      size={size}
      hoverable
      caption={caption}
      onRowClick={(row) => console.log("Clicked:", row)}
      rowClassName={rowClassName}
      actions={actionButton}
      actionsLabel='Action'
      actionsWidth='100px'
    />
  );
}

export default PlayersTable;
