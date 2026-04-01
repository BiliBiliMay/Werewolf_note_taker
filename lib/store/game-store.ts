"use client";

import { useStore } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { createStore, type StoreApi } from "zustand/vanilla";
import { STORAGE_KEY } from "@/lib/game/constants";
import {
  createInitialDayPhase,
  createNextPhase,
  createPlayers,
  cycleRoleGuessValue,
  isDayPhase,
  isPlayerEliminatedElsewhere,
} from "@/lib/game/helpers";
import type {
  DaySection,
  GameSessionState,
  Phase,
  PhaseSection,
  PlayerTag,
  QuickActionType,
  RealRole,
} from "@/lib/game/types";

type HydratableStoreApi = StoreApi<GameStore> & {
  persist: {
    rehydrate: () => Promise<void>;
  };
};

const defaultSessionState = (): GameSessionState => ({
  playerCount: 0,
  players: [],
  phases: [],
  currentPhaseIndex: 0,
  selectedPlayerId: null,
  activeSection: "speechesUp",
});

const createInitialSession = (playerCount: number): GameSessionState => ({
  playerCount,
  players: createPlayers(playerCount),
  phases: [createInitialDayPhase()],
  currentPhaseIndex: 0,
  selectedPlayerId: null,
  activeSection: "speechesUp",
});

type StructuredEntryInput = {
  actorId: number;
  actionType: QuickActionType;
  targetId?: number;
};

export interface GameStore extends GameSessionState {
  hasHydrated: boolean;
  hydrateFromStorage: () => Promise<void>;
  startGame: (playerCount: number) => void;
  resetGame: () => void;
  selectPlayer: (playerId: number | null) => void;
  togglePlayerStatus: (playerId: number) => void;
  cycleRoleGuess: (playerId: number) => void;
  togglePlayerTag: (playerId: number, tag: PlayerTag) => void;
  togglePinned: (playerId: number) => void;
  setActiveSection: (section: DaySection) => void;
  addStructuredEntry: (input: StructuredEntryInput) => void;
  setVote: (voterId: number, targetId: number) => void;
  removeVote: (voterId: number) => void;
  setElimination: (playerId: number | null) => void;
  assignRealRole: (playerId: number, realRole: RealRole) => void;
  nextPhase: () => void;
  setCurrentPhaseIndex: (index: number) => void;
  setHasHydrated: (value: boolean) => void;
}

export function createGameStore(storage?: StateStorage) {
  return createStore<GameStore>()(
    persist(
      (set, get, store) => ({
        ...defaultSessionState(),
        hasHydrated: false,
        hydrateFromStorage: async () => {
          await (store as HydratableStoreApi).persist.rehydrate();
        },
        startGame: (playerCount) => {
          set({
            ...createInitialSession(playerCount),
            hasHydrated: true,
          });
        },
        resetGame: () => {
          set({
            ...defaultSessionState(),
            hasHydrated: true,
          });
        },
        selectPlayer: (playerId) => {
          set({ selectedPlayerId: playerId });
        },
        togglePlayerStatus: (playerId) => {
          set((state) => ({
            players: state.players.map((player) =>
              player.id === playerId
                ? {
                    ...player,
                    status: player.status === "alive" ? "dead" : "alive",
                  }
                : player,
            ),
          }));
        },
        cycleRoleGuess: (playerId) => {
          set((state) => ({
            players: state.players.map((player) =>
              player.id === playerId
                ? { ...player, roleGuess: cycleRoleGuessValue(player.roleGuess) }
                : player,
            ),
          }));
        },
        togglePlayerTag: (playerId, tag) => {
          set((state) => {
            const player = state.players.find((item) => item.id === playerId);

            if (!player) {
              return state;
            }

            const alreadyEnabled = player.tags.includes(tag);
            let players = state.players.map((item) => {
              if (item.id !== playerId) {
                return item;
              }

              return {
                ...item,
                tags: alreadyEnabled
                  ? item.tags.filter((value) => value !== tag)
                  : [...item.tags, tag],
              };
            });

            if (tag === "sheriff" && !alreadyEnabled) {
              players = players.map((item) =>
                item.id === playerId
                  ? item
                  : {
                      ...item,
                      tags: item.tags.filter((value) => value !== "sheriff"),
                    },
              );
            }

            return { players };
          });
        },
        togglePinned: (playerId) => {
          set((state) => ({
            players: state.players.map((player) =>
              player.id === playerId ? { ...player, pinned: !player.pinned } : player,
            ),
          }));
        },
        setActiveSection: (section) => {
          set({ activeSection: section });
        },
        addStructuredEntry: ({ actorId, actionType, targetId }) => {
          set((state) => {
            const phase = state.phases[state.currentPhaseIndex];

            if (!phase) {
              return state;
            }

            const section: PhaseSection = isDayPhase(phase)
              ? state.activeSection === "nightNotes"
                ? "speechesUp"
                : state.activeSection
              : "nightNotes";

            const entry = {
              id: createId("entry"),
              actorId,
              actionType,
              targetId,
              phaseIndex: state.currentPhaseIndex,
              section,
              createdAt: new Date().toISOString(),
            };

            const phases = state.phases.map((currentPhase, index): Phase => {
              if (index !== state.currentPhaseIndex) {
                return currentPhase;
              }

              if (isDayPhase(currentPhase)) {
                if (section === "speechesDown") {
                  return {
                    ...currentPhase,
                    speechesDown: [...currentPhase.speechesDown, entry],
                  };
                }

                return {
                  ...currentPhase,
                  speechesUp: [...currentPhase.speechesUp, entry],
                };
              }

              return {
                ...currentPhase,
                notes: [...currentPhase.notes, entry],
              };
            });

            return { phases };
          });
        },
        setVote: (voterId, targetId) => {
          set((state) => {
            const phase = state.phases[state.currentPhaseIndex];

            if (!phase || !isDayPhase(phase)) {
              return state;
            }

            const votes = [
              ...phase.votes.filter((vote) => vote.voterId !== voterId),
              { voterId, targetId },
            ].sort((left, right) => left.voterId - right.voterId);

            const phases = state.phases.map((item, index) =>
              index === state.currentPhaseIndex && isDayPhase(item)
                ? { ...item, votes }
                : item,
            );

            return { phases };
          });
        },
        removeVote: (voterId) => {
          set((state) => {
            const phase = state.phases[state.currentPhaseIndex];

            if (!phase || !isDayPhase(phase)) {
              return state;
            }

            const phases = state.phases.map((item, index) =>
              index === state.currentPhaseIndex && isDayPhase(item)
                ? {
                    ...item,
                    votes: item.votes.filter((vote) => vote.voterId !== voterId),
                  }
                : item,
            );

            return { phases };
          });
        },
        setElimination: (playerId) => {
          set((state) => {
            const phase = state.phases[state.currentPhaseIndex];

            if (!phase || !isDayPhase(phase)) {
              return state;
            }

            const previousPlayerId = phase.eliminated?.playerId;
            let players = state.players;

            if (
              previousPlayerId &&
              previousPlayerId !== playerId &&
              !isPlayerEliminatedElsewhere(
                state.phases,
                previousPlayerId,
                state.currentPhaseIndex,
              )
            ) {
              players = players.map((player) =>
                player.id === previousPlayerId ? { ...player, status: "alive" } : player,
              );
            }

            if (playerId !== null) {
              players = players.map((player) =>
                player.id === playerId ? { ...player, status: "dead" } : player,
              );
            }

            const eliminated =
              playerId === null
                ? null
                : {
                    playerId,
                    realRole:
                      phase.eliminated?.playerId === playerId
                        ? phase.eliminated.realRole
                        : undefined,
                  };

            const phases = state.phases.map((item, index) =>
              index === state.currentPhaseIndex && isDayPhase(item)
                ? {
                    ...item,
                    eliminated,
                  }
                : item,
            );

            return { players, phases };
          });
        },
        assignRealRole: (playerId, realRole) => {
          set((state) => {
            const players = state.players.map((player) =>
              player.id === playerId ? { ...player, realRole } : player,
            );

            const phases = state.phases.map((phase, index) => {
              if (
                index !== state.currentPhaseIndex ||
                !isDayPhase(phase) ||
                phase.eliminated?.playerId !== playerId
              ) {
                return phase;
              }

              return {
                ...phase,
                eliminated: {
                  ...phase.eliminated,
                  realRole,
                },
              };
            });

            return { players, phases };
          });
        },
        nextPhase: () => {
          set((state) => {
            const phase = createNextPhase(state.phases);

            return {
              phases: [...state.phases, phase],
              currentPhaseIndex: state.phases.length,
              activeSection: phase.type === "day" ? "speechesUp" : "nightNotes",
            };
          });
        },
        setCurrentPhaseIndex: (index) => {
          const phase = get().phases[index];

          if (!phase) {
            return;
          }

          set({
            currentPhaseIndex: index,
            activeSection: phase.type === "day" ? "speechesUp" : "nightNotes",
          });
        },
        setHasHydrated: (value) => {
          set({ hasHydrated: value });
        },
      }),
      {
        name: STORAGE_KEY,
        version: 1,
        storage: createJSONStorage(() => storage ?? localStorage),
        skipHydration: true,
        partialize: (state) => ({
          playerCount: state.playerCount,
          players: state.players,
          phases: state.phases,
          currentPhaseIndex: state.currentPhaseIndex,
          selectedPlayerId: state.selectedPlayerId,
          activeSection: state.activeSection,
        }),
        onRehydrateStorage: () => (state) => {
          state?.setHasHydrated(true);
        },
      },
    ),
  );
}

export const gameStore = createGameStore();

export function useGameStore<T>(selector: (state: GameStore) => T) {
  return useStore(gameStore, selector);
}


