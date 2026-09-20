import { describe, it, expect, beforeEach } from "vitest";
import useGamePlayersStore, { Player } from "../gamePlayersStore";

describe("gamePlayersStore - GK Subs and Player Stats", () => {
  beforeEach(() => {
    useGamePlayersStore.setState({ players: [], isLoading: false, error: null });
  });

  it("correctly identifies subbed-in goalkeeper as onFieldGk fieldStatus", () => {
    const store = useGamePlayersStore.getState();

    const startingGk: Player = {
      id: "p1",
      playerGameId: "pg1",
      firstName: "Starting",
      lastName: "GK",
      fullName: "Starting GK",
      gameStatus: "goalkeeper",
      fieldStatus: "onFieldGk",
      ins: [],
      outs: [{ gameTime: 600, subId: "sub1", gkSub: true }],
      subStatus: null,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
    } as any as Player;

    const subGk: Player = {
      id: "p2",
      playerGameId: "pg2",
      firstName: "Backup",
      lastName: "GK",
      fullName: "Backup GK",
      gameStatus: "dressed",
      fieldStatus: "onBench",
      ins: [{ gameTime: 600, subId: "sub1", gkSub: true }],
      outs: [],
      subStatus: null,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
    } as any as Player;

    const statusStartingGk = store.calculateFieldStatus(startingGk);
    const statusSubGk = store.calculateFieldStatus(subGk);

    expect(statusStartingGk).toBe("onBench");
    expect(statusSubGk).toBe("onFieldGk");
  });

  it("recalculates player goals and assists matching IDs as strings", () => {
    useGamePlayersStore.setState({
      players: [
        {
          id: "101",
          playerGameId: "1001",
          fullName: "Player One",
          goals: 0,
          assists: 0,
          goalsAgainst: 0,
          yellowCards: 0,
          redCards: 0,
        } as any as Player,
      ],
    });

    const goalsEvents = [
      { scorer_player_game_id: 1001, assist_player_game_id: null }, // Numeric match
      { scorer_player_game_id: "1001", assist_player_game_id: null }, // String match
      { scorer_player_game_id: "other", assist_player_game_id: "1001" }, // Assist match
    ];

    useGamePlayersStore.getState().recalculatePlayerStatsFromEvents(goalsEvents, []);

    const updatedPlayer = useGamePlayersStore.getState().players[0];
    expect(updatedPlayer.goals).toBe(2);
    expect(updatedPlayer.assists).toBe(1);
  });
});
