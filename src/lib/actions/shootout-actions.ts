"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { game_events_penalties_outcome } from "@/generated/client";

export interface RecordShootoutKickParams {
  gameId: number;
  teamSeasonId: number;
  round: number;
  isTop: boolean;
  outcome: "goal" | "saved" | "missed" | "hit_post";
  shooterPlayerGameId?: number | null;
  shooterJerseyNumber?: number | null;
  gkPlayerGameId?: number | null;
  opponentJerseyNumber?: number | null;
}

export async function recordShootoutKickAction(params: RecordShootoutKickParams) {
  try {
    const {
      gameId,
      teamSeasonId,
      round,
      isTop,
      outcome,
      shooterPlayerGameId,
      shooterJerseyNumber,
      gkPlayerGameId,
      opponentJerseyNumber,
    } = params;

    const result = await prisma.$transaction(async (tx) => {
      let majorEventId: number | null = null;
      let goalId: number | null = null;

      if (outcome === "goal") {
        // Create major event for the shootout goal
        const majorEvent = await tx.game_events_major.create({
          data: {
            game_id: gameId,
            event_type: "goal",
            period: 5, // Convention for shootout period
            game_time: 0,
            clock_should_run: false,
          },
        });
        majorEventId = majorEvent.id;

        // Create linked goal record
        const goal = await tx.game_events_goals.create({
          data: {
            major_event_id: majorEvent.id,
            team_season_id: teamSeasonId,
            scorer_player_game_id: shooterPlayerGameId ?? null,
            assist_player_game_id: null,
            defending_gk_player_game_id: gkPlayerGameId ?? null,
            is_own_goal: false,
            goal_types: JSON.stringify(["Penalty Shootout"]),
          },
        });
        goalId = goal.id;
      }

      // Create penalty record
      const penalty = await tx.game_events_penalties.create({
        data: {
          game_id: gameId,
          team_season_id: teamSeasonId,
          major_event_id: majorEventId,
          goal_id: goalId,
          is_shootout: true,
          shootout_round: round,
          top_of_round: isTop,
          outcome: outcome as game_events_penalties_outcome,
          shooter_player_game_id: shooterPlayerGameId ?? null,
          shooter_jersey_number: shooterJerseyNumber ?? null,
          gk_player_game_id: gkPlayerGameId ?? null,
          opponent_jersey_number: opponentJerseyNumber ?? null,
        },
      });

      return penalty;
    });

    revalidatePath(`/gamestats/${teamSeasonId}/${params.gameId}/shootout`);
    return { success: true, kickId: result.id };
  } catch (err: any) {
    console.error("Error in recordShootoutKickAction:", err);
    return { success: false, error: err.message || "Failed to record shootout kick" };
  }
}

export async function deleteShootoutKickAction(kickId: number, gameId: number, teamSeasonId: number) {
  try {
    await prisma.$transaction(async (tx) => {
      const kick = await tx.game_events_penalties.findUnique({
        where: { id: kickId },
      });

      if (!kick) return;

      if (kick.major_event_id) {
        // Cascade delete major event which deletes child goals
        await tx.game_events_major.delete({
          where: { id: kick.major_event_id },
        });
      } else {
        await tx.game_events_penalties.delete({
          where: { id: kickId },
        });
      }
    });

    revalidatePath(`/gamestats/${teamSeasonId}/${gameId}/shootout`);
    return { success: true };
  } catch (err: any) {
    console.error("Error in deleteShootoutKickAction:", err);
    return { success: false, error: err.message || "Failed to delete shootout kick" };
  }
}

export async function concludeShootoutAction(gameId: number, teamSeasonId: number, winnerTeamId: number) {
  try {
    await prisma.games.update({
      where: { id: gameId },
      data: {
        status: "completed",
      },
    });

    revalidatePath(`/gamestats/${teamSeasonId}/${gameId}`);
    revalidatePath(`/gamestats/${teamSeasonId}/${gameId}/shootout`);
    revalidatePath(`/gamestats/${teamSeasonId}/${gameId}/summary`);
    return { success: true };
  } catch (err: any) {
    console.error("Error in concludeShootoutAction:", err);
    return { success: false, error: err.message || "Failed to conclude shootout" };
  }
}
