import { Player } from "@/stores/gamePlayersStore";
import { GameSettings } from "@/types/game";

export interface SubWindowMinimal {
  period?: number;
  sub_time: number | null;
  [key: string]: any;
}

export interface SubEligibilityResult {
  isEligible: boolean;
  reason?: string;
  isInitialEntry: boolean;
  outsCountTotal: number;
  outsCountPeriod: number;
  subWindowsCountTotal?: number;
  subWindowsCountPeriod?: number;
}

export function calculateSubWindowsUsed(
  teamSubs: SubWindowMinimal[] = [],
  targetPeriod?: number
): number {
  if (!teamSubs || teamSubs.length === 0) return 0;

  const validSubs = teamSubs.filter((s) => {
    if (s.sub_time === null || s.sub_time === undefined) return false;
    // Exclude halftime/pre-game subs (sub_time === 0, is_halftime, or is_break)
    if (s.sub_time === 0 || s.is_halftime || s.is_break) return false;
    const subP = s.period ?? 1;
    if (targetPeriod !== undefined && subP !== targetPeriod) return false;
    return true;
  });

  if (validSubs.length === 0) return 0;

  // Group subs by period and cluster timestamps within 15 seconds (same stoppage opportunity)
  const subsByPeriod: Record<number, number[]> = {};
  validSubs.forEach((s) => {
    const subP = s.period ?? 1;
    if (!subsByPeriod[subP]) subsByPeriod[subP] = [];
    subsByPeriod[subP].push(Number(s.sub_time));
  });

  let totalWindows = 0;
  for (const periodKey of Object.keys(subsByPeriod)) {
    const times = subsByPeriod[Number(periodKey)].sort((a, b) => a - b);
    let periodWindows = 0;
    let lastWindowTime: number | null = null;

    for (const time of times) {
      if (lastWindowTime === null || Math.abs(time - lastWindowTime) > 15) {
        periodWindows++;
        lastWindowTime = time;
      }
    }
    totalWindows += periodWindows;
  }

  return totalWindows;
}

export function checkPlayerSubEligibility(
  player: Player,
  settings?: GameSettings,
  currentPeriodNumber: number = 1,
  overridePlayerIds: Set<string | number> = new Set(),
  teamSubs?: SubWindowMinimal[],
  isPeriodBreak: boolean = false
): SubEligibilityResult {
  const outs = player.outs || [];
  const outsCountTotal = outs.length;
  const outsCountPeriod = outs.filter((o) => o.period === currentPeriodNumber).length;
  const isInitialEntry = outsCountTotal === 0;

  const subWindowsCountTotal = calculateSubWindowsUsed(teamSubs || []);
  const subWindowsCountPeriod = calculateSubWindowsUsed(teamSubs || [], currentPeriodNumber);

  // If player has been granted a referee/injury override, they are eligible
  if (overridePlayerIds.has(player.id) || overridePlayerIds.has(player.playerGameId)) {
    return {
      isEligible: true,
      isInitialEntry,
      outsCountTotal,
      outsCountPeriod,
      subWindowsCountTotal,
      subWindowsCountPeriod,
    };
  }

  // Red Card check
  const redCards = (player as any).redCards || 0;
  if (redCards > 0) {
    return {
      isEligible: false,
      reason: "Sent Off (Red Card)",
      isInitialEntry: false,
      outsCountTotal,
      outsCountPeriod: 0,
      subWindowsCountTotal,
      subWindowsCountPeriod,
    };
  }

  // SUB WINDOW LIMIT CHECKS (Per Game & Per Half)
  // Break substitutions (e.g. halftime) do not consume a window and are exempt from window limits
  const maxWindowsHalf = settings?.maxSubWindowsPerHalf;
  const maxWindowsGame = settings?.maxSubWindowsPerGame;

  if (!isPeriodBreak && maxWindowsHalf && maxWindowsHalf > 0 && subWindowsCountPeriod >= maxWindowsHalf) {
    return {
      isEligible: false,
      reason: `Max Sub Windows Reached for Half (${subWindowsCountPeriod}/${maxWindowsHalf} Used)`,
      isInitialEntry,
      outsCountTotal,
      outsCountPeriod,
      subWindowsCountTotal,
      subWindowsCountPeriod,
    };
  }

  if (!isPeriodBreak && maxWindowsGame && maxWindowsGame > 0 && subWindowsCountTotal >= maxWindowsGame) {
    return {
      isEligible: false,
      reason: `Max Sub Windows Reached for Game (${subWindowsCountTotal}/${maxWindowsGame} Used)`,
      isInitialEntry,
      outsCountTotal,
      outsCountPeriod,
      subWindowsCountTotal,
      subWindowsCountPeriod,
    };
  }

  // Initial Entry into the game is allowed for dressed bench players (unless red-carded or windows maxed out)
  if (isInitialEntry) {
    return {
      isEligible: true,
      isInitialEntry: true,
      outsCountTotal: 0,
      outsCountPeriod: 0,
      subWindowsCountTotal,
      subWindowsCountPeriod,
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
        subWindowsCountTotal,
        subWindowsCountPeriod,
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
          subWindowsCountTotal,
          subWindowsCountPeriod,
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
          subWindowsCountTotal,
          subWindowsCountPeriod,
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
          subWindowsCountTotal,
          subWindowsCountPeriod,
        };
      }
      if (currentPeriodNumber === 2 && outsCountPeriod >= 2) {
        return {
          isEligible: false,
          reason: "2nd Half Re-Entry Used (NCAA Rules)",
          isInitialEntry: false,
          outsCountTotal,
          outsCountPeriod,
          subWindowsCountTotal,
          subWindowsCountPeriod,
        };
      }
      if (currentPeriodNumber > 2 && outsCountPeriod > 0) {
        return {
          isEligible: false,
          reason: "No Overtime Re-Entry (NCAA Rules)",
          isInitialEntry: false,
          outsCountTotal,
          outsCountPeriod,
          subWindowsCountTotal,
          subWindowsCountPeriod,
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
    subWindowsCountTotal,
    subWindowsCountPeriod,
  };
}
