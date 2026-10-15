export type PenaltyOutcome = 'goal' | 'scored' | 'saved' | 'missed' | 'post' | 'hit_post';

export function isGoalOutcome(outcome: PenaltyOutcome): boolean {
  return outcome === 'goal' || outcome === 'scored';
}

export interface ShootoutKick {
  id?: number;
  round: number; // 1, 2, 3, 4, 5, 6, ...
  isTop: boolean; // true = Team A (kicks 1st), false = Team B (kicks 2nd)
  teamId: number | string;
  shooterPlayerGameId?: number | null;
  shooterName?: string;
  shooterJersey?: number | string | null;
  gkPlayerGameId?: number | null;
  gkName?: string;
  outcome: PenaltyOutcome;
  timestamp?: number;
}

export interface TeamShootoutInfo {
  teamId: number | string;
  name: string;
  shortName?: string;
}

export type ShootoutScenarioType =
  | 'normal'
  | 'clinch_on_score'
  | 'elimination_on_miss'
  | 'clinch_and_elimination' // Team can clinch if score, and opponent wins if miss
  | 'sudden_death_lead'
  | 'game_over';

export interface ActiveKickConsequence {
  summary: string;
  isDecisive: boolean;
  decisiveType?: 'clinch' | 'elimination';
}

export interface ShootoutDecisionState {
  isDecided: boolean;
  winnerTeamId: number | string | null;
  winnerName: string | null;
  loserTeamId: number | string | null;
  loserName: string | null;
  finalScore: string; // e.g. "4 - 2 PK"
  
  // Current game state
  currentRound: number;
  isSuddenDeath: boolean;
  teamAScore: number;
  teamBScore: number;
  teamAKicksTaken: number;
  teamBKicksTaken: number;
  teamAKicksRemainingIn5: number;
  teamBKicksRemainingIn5: number;
  
  // Who is next
  activeTurn: 'teamA' | 'teamB' | 'none';
  activeTeamId: number | string | null;
  activeTeamName: string;
  waitingTeamName: string;

  // Clinch & Elimination "Distance to Decision" Indicator
  scenarioType: ShootoutScenarioType;
  scenarioTitle: string;
  scenarioDescription: string;
  distanceSummary: string; // e.g. "Independence leads 3-1 in Round 4. Needs 1 more goal or 1 opponent miss to clinch."

  // Precise Distance & Outcome Consequences
  minKicksToDecision: number;
  distanceToDecisionText: string;
  activeKickConsequences: {
    ifScore: ActiveKickConsequence;
    ifMiss: ActiveKickConsequence;
  };
  teamAClinchNeeds: string;
  teamBClinchNeeds: string;
}

/**
 * Calculates the exact minimum number of kicks required from the current state
 * before any team can mathematically clinch or eliminate their opponent.
 */
export function computeMinKicksToDecision(
  scoreA: number,
  scoreB: number,
  kicksA: number,
  kicksB: number,
  activeTurn: 'teamA' | 'teamB' | 'none',
  regularRounds = 5
): number {
  if (activeTurn === 'none') return 0;

  const inSuddenDeath = (kicksA >= regularRounds && kicksB >= regularRounds) || kicksA > regularRounds || kicksB > regularRounds;
  if (inSuddenDeath) {
    if (activeTurn === 'teamB') {
      // Team B responds in sudden death: this kick can decide immediately (1 kick)
      return 1;
    } else {
      // Team A shoots in sudden death: requires Team A + Team B kick (2 kicks) to decide
      return 2;
    }
  }

  // BFS across binary outcome tree (scores vs miss)
  type State = { sA: number; sB: number; kA: number; kB: number; turn: 'teamA' | 'teamB'; depth: number };
  const queue: State[] = [{ sA: scoreA, sB: scoreB, kA: kicksA, kB: kicksB, turn: activeTurn, depth: 0 }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const cur = queue.shift()!;
    const key = `${cur.sA},${cur.sB},${cur.kA},${cur.kB},${cur.turn}`;
    if (visited.has(key)) continue;
    visited.add(key);

    const remA = Math.max(0, regularRounds - cur.kA);
    const remB = Math.max(0, regularRounds - cur.kB);

    if (cur.depth > 0) {
      const aClinched = cur.kA <= regularRounds && cur.kB <= regularRounds && cur.sA > cur.sB + remB;
      const bClinched = cur.kA <= regularRounds && cur.kB <= regularRounds && cur.sB > cur.sA + remA;
      if (aClinched || bClinched) {
        return cur.depth;
      }
      if (cur.kA >= regularRounds && cur.kB >= regularRounds && cur.kA === cur.kB && cur.sA !== cur.sB) {
        return cur.depth;
      }
      if (cur.kA >= regularRounds && cur.kB >= regularRounds) {
        return cur.depth + (cur.turn === 'teamB' ? 1 : 2);
      }
    }

    if (cur.depth >= 10) continue;

    if (cur.turn === 'teamA') {
      queue.push({ sA: cur.sA + 1, sB: cur.sB, kA: cur.kA + 1, kB: cur.kB, turn: 'teamB', depth: cur.depth + 1 });
      queue.push({ sA: cur.sA, sB: cur.sB, kA: cur.kA + 1, kB: cur.kB, turn: 'teamB', depth: cur.depth + 1 });
    } else {
      queue.push({ sA: cur.sA, sB: cur.sB + 1, kA: cur.kA, kB: cur.kB + 1, turn: 'teamA', depth: cur.depth + 1 });
      queue.push({ sA: cur.sA, sB: cur.sB, kA: cur.kA, kB: cur.kB + 1, turn: 'teamA', depth: cur.depth + 1 });
    }
  }

  return 1;
}

/**
 * Evaluates the full state of a penalty shootout given the list of kicks taken,
 * including sudden death rules and exact mathematical clinch/elimination scenarios.
 */
export function evaluateShootoutState(
  kicks: ShootoutKick[],
  teamA: TeamShootoutInfo,
  teamB: TeamShootoutInfo,
  regularRounds = 5
): ShootoutDecisionState {
  let scoreA = 0;
  let scoreB = 0;
  let kicksA = 0;
  let kicksB = 0;

  for (const kick of kicks) {
    if (kick.isTop) {
      kicksA++;
      if (isGoalOutcome(kick.outcome)) scoreA++;
    } else {
      kicksB++;
      if (isGoalOutcome(kick.outcome)) scoreB++;
    }
  }

  const remA = Math.max(0, regularRounds - kicksA);
  const remB = Math.max(0, regularRounds - kicksB);

  // 1. Check if already decided within regular rounds
  // Team A clinches if Team B cannot catch up
  const aClinchedRegular = kicksA <= regularRounds && kicksB <= regularRounds && scoreA > scoreB + remB;
  // Team B clinches if Team A cannot catch up
  const bClinchedRegular = kicksA <= regularRounds && kicksB <= regularRounds && scoreB > scoreA + remA;

  // 2. Check if decided after both took all regular rounds (or in sudden death)
  let decided = false;
  let winnerId: number | string | null = null;
  let winnerName: string | null = null;
  let loserId: number | string | null = null;
  let loserName: string | null = null;

  if (aClinchedRegular) {
    decided = true;
    winnerId = teamA.teamId;
    winnerName = teamA.name;
    loserId = teamB.teamId;
    loserName = teamB.name;
  } else if (bClinchedRegular) {
    decided = true;
    winnerId = teamB.teamId;
    winnerName = teamB.name;
    loserId = teamA.teamId;
    loserName = teamA.name;
  } else if (kicksA >= regularRounds && kicksB >= regularRounds && kicksA === kicksB) {
    // Both took equal kicks >= 5
    if (scoreA > scoreB) {
      decided = true;
      winnerId = teamA.teamId;
      winnerName = teamA.name;
      loserId = teamB.teamId;
      loserName = teamB.name;
    } else if (scoreB > scoreA) {
      decided = true;
      winnerId = teamB.teamId;
      winnerName = teamB.name;
      loserId = teamA.teamId;
      loserName = teamA.name;
    }
  }

  const isSuddenDeath = (kicksA >= regularRounds && kicksB >= regularRounds && !decided) || (kicksA > regularRounds || kicksB > regularRounds);
  const currentRound = kicksA === kicksB ? kicksA + 1 : kicksA;
  const activeTurn: 'teamA' | 'teamB' | 'none' = decided ? 'none' : (kicksA === kicksB ? 'teamA' : 'teamB');

  const activeTeamName = activeTurn === 'teamA' ? teamA.name : (activeTurn === 'teamB' ? teamB.name : '');
  const waitingTeamName = activeTurn === 'teamA' ? teamB.name : (activeTurn === 'teamB' ? teamA.name : '');
  const activeTeamId = activeTurn === 'teamA' ? teamA.teamId : (activeTurn === 'teamB' ? teamB.teamId : null);

  const finalScore = `${scoreA} - ${scoreB} PK`;



  if (decided) {
    return {
      isDecided: true,
      winnerTeamId: winnerId,
      winnerName,
      loserTeamId: loserId,
      loserName,
      finalScore,
      currentRound: Math.max(kicksA, kicksB),
      isSuddenDeath,
      teamAScore: scoreA,
      teamBScore: scoreB,
      teamAKicksTaken: kicksA,
      teamBKicksTaken: kicksB,
      teamAKicksRemainingIn5: remA,
      teamBKicksRemainingIn5: remB,
      activeTurn: 'none',
      activeTeamId: null,
      activeTeamName: '',
      waitingTeamName: '',
      scenarioType: 'game_over',
      scenarioTitle: 'SHOOTOUT CONCLUDED',
      scenarioDescription: `${winnerName} wins the penalty shootout ${finalScore}!`,
      distanceSummary: `Final Result: ${winnerName} defeated ${loserName} ${finalScore}.`,
      minKicksToDecision: 0,
      distanceToDecisionText: 'Shootout Concluded',
      activeKickConsequences: {
        ifScore: { summary: '', isDecisive: false },
        ifMiss: { summary: '', isDecisive: false },
      },
      teamAClinchNeeds: scoreA > scoreB ? 'Won Shootout' : 'Eliminated',
      teamBClinchNeeds: scoreB > scoreA ? 'Won Shootout' : 'Eliminated',
    };
  }

  // 3. Compute Clinch & Elimination "Distance to Decision" for the UPCOMING kick
  let scenarioType: ShootoutScenarioType = 'normal';
  let scenarioTitle = `ROUND ${currentRound}`;
  let scenarioDescription = `${activeTeamName} preparing to kick.`;
  let distanceSummary = '';

  let ifScoreConsequence: ActiveKickConsequence = { summary: '', isDecisive: false };
  let ifMissConsequence: ActiveKickConsequence = { summary: '', isDecisive: false };

  if (activeTurn === 'teamA') {
    // Team A is about to kick
    if (!isSuddenDeath) {
      // Hypothesize Team A scores:
      const hypScoreA_ifScore = scoreA + 1;
      const hypRemA_ifScore = remA - 1;
      const clinchIfScore = hypScoreA_ifScore > scoreB + remB;

      // Hypothesize Team A misses:
      const hypScoreA_ifMiss = scoreA;
      const hypRemA_ifMiss = remA - 1;
      const eliminatedIfMiss = scoreB > hypScoreA_ifMiss + hypRemA_ifMiss;

      if (clinchIfScore && eliminatedIfMiss) {
        scenarioType = 'clinch_and_elimination';
        scenarioTitle = 'CRUCIAL MATCH POINT';
        scenarioDescription = `If ${teamA.name} scores, they CLINCH the win. If ${teamA.name} misses, ${teamB.name} clinches!`;
      } else if (clinchIfScore) {
        scenarioType = 'clinch_on_score';
        scenarioTitle = 'MATCH POINT: CLINCH OPPORTUNITY';
        scenarioDescription = `If ${teamA.name} scores, ${teamA.name} WINS the shootout!`;
      } else if (eliminatedIfMiss) {
        scenarioType = 'elimination_on_miss';
        scenarioTitle = 'MUST SCORE TO STAY ALIVE';
        scenarioDescription = `${teamA.name} MUST score! If missed, ${teamB.name} WINS the shootout!`;
      } else {
        scenarioType = 'normal';
        scenarioTitle = `ROUND ${currentRound} (KICK 1 OF 2)`;
        scenarioDescription = `${teamA.name} shoots first in Round ${currentRound}.`;
      }

      // Distance summary
      if (scoreA === scoreB) {
        distanceSummary = `Tied ${scoreA} - ${scoreB}. Both teams have ${remA} kicks remaining in regulation.`;
      } else if (scoreA > scoreB) {
        const lead = scoreA - scoreB;
        distanceSummary = `${teamA.name} leads ${scoreA}-${scoreB} (+${lead}). ${teamA.name} needs ${Math.max(1, remB - lead + 1)} point(s) or opponent stop(s) to clinch.`;
      } else {
        const deficit = scoreB - scoreA;
        distanceSummary = `${teamB.name} leads ${scoreB}-${scoreA} (+${deficit}). ${teamA.name} trails with ${remA} kicks left.`;
      }

      // Outcome consequences
      if (clinchIfScore) {
        ifScoreConsequence = {
          summary: `${teamA.name} CLINCHES THE WIN! (${hypScoreA_ifScore}-${scoreB} PK)`,
          isDecisive: true,
          decisiveType: 'clinch',
        };
      } else {
        const nextDist = computeMinKicksToDecision(hypScoreA_ifScore, scoreB, kicksA + 1, kicksB, 'teamB', regularRounds);
        ifScoreConsequence = {
          summary: `${teamA.name} takes ${hypScoreA_ifScore}-${scoreB} lead (${nextDist === 1 ? 'Next kick could decide!' : nextDist + ' kicks to earliest decision'})`,
          isDecisive: false,
        };
      }

      if (eliminatedIfMiss) {
        ifMissConsequence = {
          summary: `${teamB.name} WINS THE SHOOTOUT! (${teamA.name} cannot catch up)`,
          isDecisive: true,
          decisiveType: 'elimination',
        };
      } else {
        const nextDist = computeMinKicksToDecision(hypScoreA_ifMiss, scoreB, kicksA + 1, kicksB, 'teamB', regularRounds);
        ifMissConsequence = {
          summary: `${teamA.name} stays at ${scoreA}-${scoreB} (${nextDist === 1 ? 'Opponent gains match point!' : nextDist + ' kicks to earliest decision'})`,
          isDecisive: false,
        };
      }
    } else {
      // Sudden Death: Team A shoots first in round >= 6
      scenarioType = 'sudden_death_lead';
      scenarioTitle = `SUDDEN DEATH — ROUND ${currentRound}`;
      scenarioDescription = `${teamA.name} shoots first. If scored, ${teamB.name} faces elimination. If missed, ${teamB.name} gains a clinch opportunity!`;
      distanceSummary = `Sudden Death: 1-for-1 alternate kicks. First team to lead at the end of a round wins.`;

      ifScoreConsequence = {
        summary: `${teamA.name} takes 1-goal advantage; ${teamB.name} MUST score on their kick to survive!`,
        isDecisive: false,
      };
      ifMissConsequence = {
        summary: `${teamA.name} misses! Gives ${teamB.name} an immediate chance to win on next kick!`,
        isDecisive: false,
      };
    }
  } else if (activeTurn === 'teamB') {
    // Team B is about to kick (bottom of the round)
    if (!isSuddenDeath) {
      // Team A has already kicked in this round
      // Hypothesize Team B scores:
      const hypScoreB_ifScore = scoreB + 1;
      const hypRemB_ifScore = remB - 1;
      const clinchIfScore = hypScoreB_ifScore > scoreA + remA;

      // Hypothesize Team B misses:
      const hypScoreB_ifMiss = scoreB;
      const hypRemB_ifMiss = remB - 1;
      const eliminatedIfMiss = scoreA > hypScoreB_ifMiss + hypRemB_ifMiss;

      if (clinchIfScore) {
        scenarioType = 'clinch_on_score';
        scenarioTitle = 'MATCH POINT: CLINCH OPPORTUNITY';
        scenarioDescription = `If ${teamB.name} scores, ${teamB.name} WINS the shootout!`;
      } else if (eliminatedIfMiss) {
        scenarioType = 'elimination_on_miss';
        scenarioTitle = 'DO OR DIE: MUST SCORE';
        scenarioDescription = `${teamB.name} MUST score! If missed, ${teamA.name} WINS the shootout!`;
      } else {
        scenarioType = 'normal';
        scenarioTitle = `ROUND ${currentRound} (KICK 2 OF 2)`;
        scenarioDescription = `${teamB.name} shooting to complete Round ${currentRound}.`;
      }

      if (scoreB > scoreA) {
        const lead = scoreB - scoreA;
        distanceSummary = `${teamB.name} leads ${scoreB}-${scoreA} (+${lead}) with ${remB} kick(s) remaining.`;
      } else if (scoreA > scoreB) {
        const deficit = scoreA - scoreB;
        distanceSummary = `${teamA.name} leads ${scoreA}-${scoreB} (+${deficit}). ${teamB.name} must score to close the gap.`;
      } else {
        distanceSummary = `Level at ${scoreA}-${scoreB}. ${teamB.name} kick to take the lead.`;
      }

      // Outcome consequences
      if (clinchIfScore) {
        ifScoreConsequence = {
          summary: `${teamB.name} CLINCHES THE WIN! (${scoreA}-${hypScoreB_ifScore} PK)`,
          isDecisive: true,
          decisiveType: 'clinch',
        };
      } else {
        const nextDist = computeMinKicksToDecision(scoreA, hypScoreB_ifScore, kicksA, kicksB + 1, 'teamA', regularRounds);
        ifScoreConsequence = {
          summary: `${teamB.name} pulls to ${scoreA}-${hypScoreB_ifScore} (${nextDist === 1 ? 'Next kick could decide!' : nextDist + ' kicks to earliest decision'})`,
          isDecisive: false,
        };
      }

      if (eliminatedIfMiss) {
        ifMissConsequence = {
          summary: `${teamA.name} WINS THE SHOOTOUT! (${teamB.name} cannot catch up)`,
          isDecisive: true,
          decisiveType: 'elimination',
        };
      } else {
        const nextDist = computeMinKicksToDecision(scoreA, hypScoreB_ifMiss, kicksA, kicksB + 1, 'teamA', regularRounds);
        ifMissConsequence = {
          summary: `${teamB.name} stays at ${scoreB} (Score: ${scoreA}-${scoreB}). Advances to Round ${currentRound + 1}`,
          isDecisive: false,
        };
      }
    } else {
      // Sudden Death: Team B responds!
      const lastKickA = kicks[kicks.length - 1];
      const teamAScoredInThisRound = lastKickA && isGoalOutcome(lastKickA.outcome);

      if (teamAScoredInThisRound) {
        scenarioType = 'elimination_on_miss';
        scenarioTitle = 'DO OR DIE: MUST SCORE';
        scenarioDescription = `${teamA.name} scored! ${teamB.name} MUST score to stay alive and force Round ${currentRound + 1}. If missed, ${teamA.name} WINS!`;
        distanceSummary = `${teamA.name} holds a 1-goal advantage in Sudden Death Round ${currentRound}.`;

        ifScoreConsequence = {
          summary: `${teamB.name} scores to tie! Forces Sudden Death Round ${currentRound + 1}.`,
          isDecisive: false,
        };
        ifMissConsequence = {
          summary: `${teamA.name} WINS THE SHOOTOUT! (${teamB.name} missed elimination kick)`,
          isDecisive: true,
          decisiveType: 'elimination',
        };
      } else {
        scenarioType = 'clinch_on_score';
        scenarioTitle = 'GOLDEN CLINCH: MATCH POINT';
        scenarioDescription = `${teamA.name} missed! If ${teamB.name} scores, ${teamB.name} WINS the match immediately!`;
        distanceSummary = `${teamA.name} missed in Sudden Death Round ${currentRound}. Golden opportunity for ${teamB.name}.`;

        ifScoreConsequence = {
          summary: `${teamB.name} SCORES AND WINS THE SHOOTOUT IMMEDIATELY!`,
          isDecisive: true,
          decisiveType: 'clinch',
        };
        ifMissConsequence = {
          summary: `Both teams missed in Round ${currentRound}. Forces Sudden Death Round ${currentRound + 1}.`,
          isDecisive: false,
        };
      }
    }
  }

  const minKicksToDecision = computeMinKicksToDecision(scoreA, scoreB, kicksA, kicksB, activeTurn, regularRounds);
  const distanceToDecisionText =
    minKicksToDecision === 1
      ? 'Match Point: Winner can be declared THIS kick!'
      : minKicksToDecision === 2
      ? '2 kicks away from earliest possible decision'
      : `${minKicksToDecision} kicks away from earliest possible decision`;

  let teamAClinchNeeds = '';
  let teamBClinchNeeds = '';

  if (!isSuddenDeath) {
    if (scoreA > scoreB + remB) {
      teamAClinchNeeds = 'Clinched victory';
    } else {
      const neededA = scoreB + remB + 1 - scoreA;
      teamAClinchNeeds = neededA <= remA
        ? `Needs ${neededA} goal${neededA > 1 ? 's' : ''} (or opponent miss${neededA > 1 ? 'es' : ''})`
        : `Needs opponent misses to win in regulation`;
    }

    if (scoreB > scoreA + remA) {
      teamBClinchNeeds = 'Clinched victory';
    } else {
      const neededB = scoreA + remA + 1 - scoreB;
      teamBClinchNeeds = neededB <= remB
        ? `Needs ${neededB} goal${neededB > 1 ? 's' : ''} (or opponent miss${neededB > 1 ? 'es' : ''})`
        : `Needs opponent misses to win in regulation`;
    }
  } else {
    teamAClinchNeeds = 'Outscore opponent in round';
    teamBClinchNeeds = 'Outscore opponent in round';
  }

  return {
    isDecided: false,
    winnerTeamId: null,
    winnerName: null,
    loserTeamId: null,
    loserName: null,
    finalScore: `${scoreA} - ${scoreB} PK`,
    currentRound,
    isSuddenDeath,
    teamAScore: scoreA,
    teamBScore: scoreB,
    teamAKicksTaken: kicksA,
    teamBKicksTaken: kicksB,
    teamAKicksRemainingIn5: remA,
    teamBKicksRemainingIn5: remB,
    activeTurn,
    activeTeamId,
    activeTeamName,
    waitingTeamName,
    scenarioType,
    scenarioTitle,
    scenarioDescription,
    distanceSummary,
    minKicksToDecision,
    distanceToDecisionText,
    activeKickConsequences: {
      ifScore: ifScoreConsequence,
      ifMiss: ifMissConsequence,
    },
    teamAClinchNeeds,
    teamBClinchNeeds,
  };
}
