import { describe, expect, it } from "vitest";
import { computeVoteLeader } from "@/lib/game/helpers";
import { createGameStore } from "@/lib/store/game-store";

function createMemoryStorage() {
  const storage = new Map<string, string>();

  return {
    getItem: (name: string) => storage.get(name) ?? null,
    removeItem: (name: string) => {
      storage.delete(name);
    },
    setItem: (name: string, value: string) => {
      storage.set(name, value);
    },
  };
}

describe("game store", () => {
  it.each([9, 10, 12])("starts a new %i player game", (playerCount) => {
    const store = createGameStore(createMemoryStorage());

    store.getState().startGame(playerCount);

    const state = store.getState();
    expect(state.playerCount).toBe(playerCount);
    expect(state.players).toHaveLength(playerCount);
    expect(state.phases).toHaveLength(1);
    expect(state.phases[0]?.type).toBe("day");
  });

  it("alternates day and night phases", () => {
    const store = createGameStore(createMemoryStorage());

    store.getState().startGame(12);
    store.getState().nextPhase();
    store.getState().nextPhase();

    const phases = store.getState().phases;
    expect(phases.map((phase) => phase.type)).toEqual(["day", "night", "day"]);
  });

  it("inserts structured entries into the active section", () => {
    const store = createGameStore(createMemoryStorage());

    store.getState().startGame(9);
    store.getState().setActiveSection("speechesDown");
    store.getState().addStructuredEntry({
      actorId: 9,
      actionType: "accuse-wolf",
      targetId: 5,
    });

    const dayPhase = store.getState().phases[0];
    expect(dayPhase.type).toBe("day");

    if (dayPhase.type === "day") {
      expect(dayPhase.speechesDown).toHaveLength(1);
      expect(dayPhase.speechesDown[0]).toMatchObject({
        actorId: 9,
        targetId: 5,
      });
    }
  });

  it("stores free-form speech content in the active section", () => {
    const store = createGameStore(createMemoryStorage());

    store.getState().startGame(9);
    store.getState().addStructuredEntry({
      actorId: 4,
      content: "我先站边2号，再看7号。",
    });

    const dayPhase = store.getState().phases[0];
    expect(dayPhase.type).toBe("day");

    if (dayPhase.type === "day") {
      expect(dayPhase.speechesUp).toHaveLength(1);
      expect(dayPhase.speechesUp[0]).toMatchObject({
        actorId: 4,
        content: "我先站边2号，再看7号。",
      });
    }
  });

  it("replaces votes by voter and exposes leader or tie states", () => {
    const store = createGameStore(createMemoryStorage());

    store.getState().startGame(9);
    store.getState().setVote(1, 3);
    store.getState().setVote(2, 3);
    store.getState().setVote(4, 5);
    store.getState().setVote(5, 5);

    const dayPhase = store.getState().phases[0];
    expect(dayPhase.type).toBe("day");

    if (dayPhase.type === "day") {
      expect(computeVoteLeader(dayPhase.votes)).toMatchObject({ status: "tie", leaderId: null });
      store.getState().setVote(5, 3);
      expect(computeVoteLeader(store.getState().phases[0].type === "day" ? store.getState().phases[0].votes : [])).toMatchObject({
        status: "leader",
        leaderId: 3,
      });
    }
  });

  it("tracks elimination and revealed real role", () => {
    const store = createGameStore(createMemoryStorage());

    store.getState().startGame(9);
    store.getState().setElimination(3);
    store.getState().assignRealRole(3, "wolf");

    const state = store.getState();
    expect(state.players.find((player) => player.id === 3)?.status).toBe("dead");
    expect(state.players.find((player) => player.id === 3)?.realRole).toBe("wolf");

    const dayPhase = state.phases[0];
    expect(dayPhase.type).toBe("day");
    if (dayPhase.type === "day") {
      expect(dayPhase.eliminated).toMatchObject({ playerId: 3, realRole: "wolf" });
    }
  });

  it("rehydrates persisted state from storage", async () => {
    const storage = createMemoryStorage();
    const firstStore = createGameStore(storage);

    firstStore.getState().startGame(10);
    firstStore.getState().selectPlayer(4);
    firstStore.getState().setActiveSection("speechesDown");

    const rehydratedStore = createGameStore(storage);
    await rehydratedStore.getState().hydrateFromStorage();

    const state = rehydratedStore.getState();
    expect(state.playerCount).toBe(10);
    expect(state.selectedPlayerId).toBe(4);
    expect(state.activeSection).toBe("speechesDown");
    expect(state.hasHydrated).toBe(true);
  });
});
