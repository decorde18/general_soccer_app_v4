import { describe, it, expect } from 'vitest';
import { evaluateShootoutState, ShootoutKick, TeamShootoutInfo } from '../shootoutUtils';

const teamA: TeamShootoutInfo = { teamId: 1, name: 'Independence High School', shortName: 'IHS' };
const teamB: TeamShootoutInfo = { teamId: 2, name: 'Franklin High School', shortName: 'FHS' };

describe('shootoutUtils - Clinch & Elimination Decision Engine', () => {
  it('evaluates initial fresh shootout state (0 kicks)', () => {
    const kicks: ShootoutKick[] = [];
    const state = evaluateShootoutState(kicks, teamA, teamB);

    expect(state.isDecided).toBe(false);
    expect(state.teamAScore).toBe(0);
    expect(state.teamBScore).toBe(0);
    expect(state.currentRound).toBe(1);
    expect(state.activeTurn).toBe('teamA');
    expect(state.activeTeamName).toBe('Independence High School');
    expect(state.isSuddenDeath).toBe(false);
    expect(state.scenarioType).toBe('normal');
  });

  it('detects clinch opportunity on score (e.g. 3-1 lead entering Round 4)', () => {
    // Round 1: A scores (1-0), B misses (1-0)
    // Round 2: A scores (2-0), B scores (2-1)
    // Round 3: A scores (3-1), B misses (3-1)
    // Round 4 kick 1: Team A is about to kick.
    // Team B has 2 kicks left (kicks 4 and 5).
    // If Team A scores -> 4-1. Team B can score at most 1 + 2 = 3 < 4. Team A clinches!
    const kicks: ShootoutKick[] = [
      { round: 1, isTop: true, teamId: 1, outcome: 'scored' },
      { round: 1, isTop: false, teamId: 2, outcome: 'missed' },
      { round: 2, isTop: true, teamId: 1, outcome: 'scored' },
      { round: 2, isTop: false, teamId: 2, outcome: 'scored' },
      { round: 3, isTop: true, teamId: 1, outcome: 'scored' },
      { round: 3, isTop: false, teamId: 2, outcome: 'missed' },
    ];

    const state = evaluateShootoutState(kicks, teamA, teamB);

    expect(state.isDecided).toBe(false);
    expect(state.teamAScore).toBe(3);
    expect(state.teamBScore).toBe(1);
    expect(state.currentRound).toBe(4);
    expect(state.activeTurn).toBe('teamA');
    expect(state.scenarioType).toBe('clinch_on_score');
    expect(state.scenarioTitle).toContain('MATCH POINT');
    expect(state.scenarioDescription).toContain('If Independence High School scores, Independence High School WINS');
  });

  it('declares winner immediately when Team A clinches 4-1 in Round 4', () => {
    const kicks: ShootoutKick[] = [
      { round: 1, isTop: true, teamId: 1, outcome: 'scored' },
      { round: 1, isTop: false, teamId: 2, outcome: 'missed' },
      { round: 2, isTop: true, teamId: 1, outcome: 'scored' },
      { round: 2, isTop: false, teamId: 2, outcome: 'scored' },
      { round: 3, isTop: true, teamId: 1, outcome: 'scored' },
      { round: 3, isTop: false, teamId: 2, outcome: 'missed' },
      { round: 4, isTop: true, teamId: 1, outcome: 'scored' }, // Team A scores 4th!
    ];

    const state = evaluateShootoutState(kicks, teamA, teamB);

    expect(state.isDecided).toBe(true);
    expect(state.winnerTeamId).toBe(1);
    expect(state.winnerName).toBe('Independence High School');
    expect(state.finalScore).toBe('4 - 1 PK');
    expect(state.scenarioType).toBe('game_over');
  });

  it('detects elimination scenario for Team B (must score to stay alive in Round 4)', () => {
    // Round 1: A scores, B scores (1-1)
    // Round 2: A scores, B misses (2-1)
    // Round 3: A misses, B misses (2-1)
    // Round 4: A scores (3-1).
    // Now Team B kicks in Round 4.
    // If B scores -> 3-2 with 1 kick left (R5) = can tie.
    // If B misses -> 3-1 with 1 kick left (R5) = max 1+1=2 < 3. B is eliminated!
    const kicks: ShootoutKick[] = [
      { round: 1, isTop: true, teamId: 1, outcome: 'scored' },
      { round: 1, isTop: false, teamId: 2, outcome: 'scored' },
      { round: 2, isTop: true, teamId: 1, outcome: 'scored' },
      { round: 2, isTop: false, teamId: 2, outcome: 'missed' },
      { round: 3, isTop: true, teamId: 1, outcome: 'missed' },
      { round: 3, isTop: false, teamId: 2, outcome: 'missed' },
      { round: 4, isTop: true, teamId: 1, outcome: 'scored' },
    ];

    const state = evaluateShootoutState(kicks, teamA, teamB);

    expect(state.isDecided).toBe(false);
    expect(state.activeTurn).toBe('teamB');
    expect(state.teamAScore).toBe(3);
    expect(state.teamBScore).toBe(1);
    expect(state.scenarioType).toBe('elimination_on_miss');
    expect(state.scenarioTitle).toContain('MUST SCORE');
    expect(state.scenarioDescription).toContain('Franklin High School MUST score! If missed, Independence High School WINS');
  });

  it('transitions to sudden death when tied after 5 kicks each', () => {
    // Both score all 5 kicks: 5-5
    const kicks: ShootoutKick[] = [];
    for (let r = 1; r <= 5; r++) {
      kicks.push({ round: r, isTop: true, teamId: 1, outcome: 'scored' });
      kicks.push({ round: r, isTop: false, teamId: 2, outcome: 'scored' });
    }

    const state = evaluateShootoutState(kicks, teamA, teamB);

    expect(state.isDecided).toBe(false);
    expect(state.isSuddenDeath).toBe(true);
    expect(state.currentRound).toBe(6);
    expect(state.teamAScore).toBe(5);
    expect(state.teamBScore).toBe(5);
    expect(state.activeTurn).toBe('teamA');
    expect(state.scenarioType).toBe('sudden_death_lead');
  });

  it('handles Sudden Death elimination when Team A scores in Round 6 and Team B faces kick', () => {
    // 5-5 after 5 rounds
    const kicks: ShootoutKick[] = [];
    for (let r = 1; r <= 5; r++) {
      kicks.push({ round: r, isTop: true, teamId: 1, outcome: 'scored' });
      kicks.push({ round: r, isTop: false, teamId: 2, outcome: 'scored' });
    }
    // Round 6: Team A scores!
    kicks.push({ round: 6, isTop: true, teamId: 1, outcome: 'scored' });

    const state = evaluateShootoutState(kicks, teamA, teamB);

    expect(state.isDecided).toBe(false);
    expect(state.isSuddenDeath).toBe(true);
    expect(state.activeTurn).toBe('teamB');
    expect(state.scenarioType).toBe('elimination_on_miss');
    expect(state.scenarioTitle).toContain('DO OR DIE');
    expect(state.scenarioDescription).toContain('Franklin High School MUST score to stay alive');
  });

  it('handles Sudden Death clinch opportunity when Team A misses in Round 6 and Team B faces kick', () => {
    // 5-5 after 5 rounds
    const kicks: ShootoutKick[] = [];
    for (let r = 1; r <= 5; r++) {
      kicks.push({ round: r, isTop: true, teamId: 1, outcome: 'scored' });
      kicks.push({ round: r, isTop: false, teamId: 2, outcome: 'scored' });
    }
    // Round 6: Team A misses!
    kicks.push({ round: 6, isTop: true, teamId: 1, outcome: 'saved' });

    const state = evaluateShootoutState(kicks, teamA, teamB);

    expect(state.isDecided).toBe(false);
    expect(state.isSuddenDeath).toBe(true);
    expect(state.activeTurn).toBe('teamB');
    expect(state.scenarioType).toBe('clinch_on_score');
    expect(state.scenarioTitle).toContain('GOLDEN CLINCH');
    expect(state.scenarioDescription).toContain('If Franklin High School scores, Franklin High School WINS');
  });

  it('concludes sudden death when Team B scores to win in Round 6', () => {
    // 5-5 after 5 rounds
    const kicks: ShootoutKick[] = [];
    for (let r = 1; r <= 5; r++) {
      kicks.push({ round: r, isTop: true, teamId: 1, outcome: 'scored' });
      kicks.push({ round: r, isTop: false, teamId: 2, outcome: 'scored' });
    }
    // Round 6: Team A misses, Team B scores!
    kicks.push({ round: 6, isTop: true, teamId: 1, outcome: 'saved' });
    kicks.push({ round: 6, isTop: false, teamId: 2, outcome: 'scored' });

    const state = evaluateShootoutState(kicks, teamA, teamB);

    expect(state.isDecided).toBe(true);
    expect(state.winnerTeamId).toBe(2);
    expect(state.winnerName).toBe('Franklin High School');
    expect(state.finalScore).toBe('5 - 6 PK');
    expect(state.scenarioType).toBe('game_over');
  });

  it('calculates minKicksToDecision and exact consequences for clinch and elimination', () => {
    // Round 4, Team A leads 3-1, Team B about to kick (Round 4, kick 2)
    // If Team B misses -> Team A WINS (elimination on miss)
    // If Team B scores -> 3-2, game continues
    const kicks: ShootoutKick[] = [
      { round: 1, isTop: true, teamId: 1, outcome: 'scored' },
      { round: 1, isTop: false, teamId: 2, outcome: 'scored' },
      { round: 2, isTop: true, teamId: 1, outcome: 'scored' },
      { round: 2, isTop: false, teamId: 2, outcome: 'missed' },
      { round: 3, isTop: true, teamId: 1, outcome: 'missed' },
      { round: 3, isTop: false, teamId: 2, outcome: 'missed' },
      { round: 4, isTop: true, teamId: 1, outcome: 'scored' },
    ];

    const state = evaluateShootoutState(kicks, teamA, teamB);

    expect(state.minKicksToDecision).toBe(1);
    expect(state.distanceToDecisionText).toContain('Match Point: Winner can be declared THIS kick');
    expect(state.activeKickConsequences.ifMiss.isDecisive).toBe(true);
    expect(state.activeKickConsequences.ifMiss.decisiveType).toBe('elimination');
    expect(state.activeKickConsequences.ifMiss.summary).toContain('Independence High School WINS THE SHOOTOUT');

    expect(state.activeKickConsequences.ifScore.isDecisive).toBe(false);
  });

  it('calculates clinch consequences when Team A is on match point (if score, then team wins)', () => {
    // 3-1 entering Round 4 kick 1 (Team A kicking)
    const kicks: ShootoutKick[] = [
      { round: 1, isTop: true, teamId: 1, outcome: 'scored' },
      { round: 1, isTop: false, teamId: 2, outcome: 'missed' },
      { round: 2, isTop: true, teamId: 1, outcome: 'scored' },
      { round: 2, isTop: false, teamId: 2, outcome: 'scored' },
      { round: 3, isTop: true, teamId: 1, outcome: 'scored' },
      { round: 3, isTop: false, teamId: 2, outcome: 'missed' },
    ];

    const state = evaluateShootoutState(kicks, teamA, teamB);

    expect(state.minKicksToDecision).toBe(1);
    expect(state.activeKickConsequences.ifScore.isDecisive).toBe(true);
    expect(state.activeKickConsequences.ifScore.decisiveType).toBe('clinch');
    expect(state.activeKickConsequences.ifScore.summary).toContain('CLINCHES THE WIN');
    expect(state.activeKickConsequences.ifMiss.isDecisive).toBe(false);
  });
});

