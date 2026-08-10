import { Player } from "@/stores/gamePlayersStore";
import { GameSettings } from "@/types/game";

export interface SubEligibilityResult {
  isEligible: boolean;
  reason?: string;
  isInitialEntry: boolean;
  outsCountTotal: number;
  outsCountPeriod: number;
}

export function checkPlayerSubEligibility(
  player: Player,
  settings?: GameSettings,
  currentPeriodNumber: number = 1,
  overridePlayerIds: Set<string | number> = new Set()
): SubEligibilityResult {
  // If player has been granted a referee/injury override, they are eligible
  if (overridePlayerIds.has(player.id) || overridePlayerIds.has(player.playerGameId)) {
    return {
      isEligible: true,
      isInitialEntry: (player.outs || []).length === 0,
      outsCountTotal: (player.outs || []).length,
      outsCountPeriod: (player.outs || []).filter((o) => o.period === currentPeriodNumber).length,
    };
  }

  // Red Card check
  const redCards = (player as any).redCards || 0;
  if (redCards > 0) {
    return {
      isEligible: false,
      reason: "Sent Off (Red Card)",
      isInitialEntry: false,
      outsCountTotal: (player.outs || []).length,
      outsCountPeriod: 0,
    };
  }

  const outs = player.outs || [];
  const outsCountTotal = outs.length;
  const outsCountPeriod = outs.filter((o) => o.period === currentPeriodNumber).length;
  const isInitialEntry = outsCountTotal === 0;

  // Initial Entry into the game is ALWAYS allowed for dressed bench players (unless red-carded)
  if (isInitialEntry) {
    return {
      isEligible: true,
      isInitialEntry: true,
      outsCountTotal: 0,
      outsCountPeriod: 0,
    };
  }

  // RE-ENTRY EVALUATION (Player has subbed out at least once)
  const reentryRule = settings?.reentryRule || "unlimited";

  switch (reentryRule) {
    case "no_reentry":
      return {
        isEligible: false,
        reason: "No Re-Entry Allowed Once Subbed Out",
        isInitialEntry: false,
        outsCountTotal,
        outsCountPeriod,
      };

    case "one_per_half":
      // 1 Re-entry per period/half (cannot re-enter in the same period after subbing out)
      if (outsCountPeriod > 0) {
        return {
          isEligible: false,
          reason: `No Re-Entry in Period ${currentPeriodNumber} After Subbing Out`,
          isInitialEntry: false,
          outsCountTotal,
          outsCountPeriod,
        };
      }
      break;

    case "one_per_game":
      // Player can re-enter ONCE per game (i.e. at most 1 exit allowed before re-entering; 2nd exit disables re-entry)
      if (outsCountTotal >= 2) {
        return {
          isEligible: false,
          reason: "Max Re-Entry Limit Reached for Game",
          isInitialEntry: false,
          outsCountTotal,
          outsCountPeriod,
        };
      }
      break;

    case "ncaa_college":
      // NCAA Rules:
      // - 1st Half (Period 1): No re-entry once subbed out in 1st half
      // - 2nd Half (Period 2): 1 re-entry allowed in 2nd half
      // - Overtime (Period > 2): No re-entry in overtime
      if (currentPeriodNumber === 1 && outsCountPeriod > 0) {
        return {
          isEligible: false,
          reason: "No 1st Half Re-Entry (NCAA Rules)",
          isInitialEntry: false,
          outsCountTotal,
          outsCountPeriod,
        };
      }
      if (currentPeriodNumber === 2 && outsCountPeriod >= 2) {
        return {
          isEligible: false,
          reason: "2nd Half Re-Entry Used (NCAA Rules)",
          isInitialEntry: false,
          outsCountTotal,
          outsCountPeriod,
        };
      }
      if (currentPeriodNumber > 2 && outsCountPeriod > 0) {
        return {
          isEligible: false,
          reason: "No Overtime Re-Entry (NCAA Rules)",
          isInitialEntry: false,
          outsCountTotal,
          outsCountPeriod,
        };
      }
      break;

    case "unlimited":
    default:
      break;
  }

  return {
    isEligible: true,
    isInitialEntry: false,
    outsCountTotal,
    outsCountPeriod,
  };
}
