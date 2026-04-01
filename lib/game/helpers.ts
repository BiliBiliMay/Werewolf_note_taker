import {
  PHASE_SECTION_LABELS,
  QUICK_ACTION_LABELS,
  ROLE_GUESS_SEQUENCE,
} from "@/lib/game/constants";
import type {
  DayPhase,
  Phase,
  Player,
  RoleGuess,
  StructuredEntry,
  VoteEntry,
} from "@/lib/game/types";

export function createId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createPlayers(playerCount: number): Player[] {
  return Array.from({ length: playerCount }, (_, index) => ({
    id: index + 1,
    status: "alive",
    roleGuess: "unknown",
    tags: [],
    pinned: false,
  }));
}

export function createInitialDayPhase(): DayPhase {
  return {
    id: createId("day"),
    type: "day",
    day: 1,
    speechesUp: [],
    speechesDown: [],
    votes: [],
    eliminated: null,
  };
}

export function createNextPhase(phases: Phase[]): Phase {
  const lastPhase = phases[phases.length - 1];

  if (!lastPhase) {
    return createInitialDayPhase();
  }

  if (lastPhase.type === "day") {
    return {
      id: createId("night"),
      type: "night",
      night: lastPhase.day,
      notes: [],
    };
  }

  return {
    id: createId("day"),
    type: "day",
    day: lastPhase.night + 1,
    speechesUp: [],
    speechesDown: [],
    votes: [],
    eliminated: null,
  };
}

export function cycleRoleGuessValue(current: RoleGuess): RoleGuess {
  const currentIndex = ROLE_GUESS_SEQUENCE.indexOf(current);
  const nextIndex = (currentIndex + 1) % ROLE_GUESS_SEQUENCE.length;
  return ROLE_GUESS_SEQUENCE[nextIndex];
}

export function isDayPhase(phase: Phase): phase is DayPhase {
  return phase.type === "day";
}

export function getPhaseLabel(phase: Phase) {
  return phase.type === "day" ? `第${phase.day}天` : `第${phase.night}夜`;
}

export function getPhaseLabelZh(phase: Phase) {
  return phase.type === "day" ? `第${phase.day}天` : `第${phase.night}夜`;
}

export function formatStructuredEntry(entry: StructuredEntry) {
  const actionLabel = QUICK_ACTION_LABELS[entry.actionType];
  const targetText = entry.targetId ? `${entry.targetId}号` : "";
  return `${entry.actorId}号：${actionLabel}${targetText}`;
}

export function formatStructuredEntryCompact(entry: StructuredEntry) {
  const actionLabel = QUICK_ACTION_LABELS[entry.actionType];
  const targetText = entry.targetId ? ` -> ${entry.targetId}号` : "";
  return `[${entry.actorId}号] [${actionLabel}]${targetText}`;
}

export function getAliveCount(players: Player[]) {
  return players.filter((player) => player.status === "alive").length;
}

export function getSheriff(players: Player[]) {
  return players.find((player) => player.tags.includes("sheriff")) ?? null;
}

export function getEliminatedPlayers(players: Player[]) {
  return players.filter((player) => player.status === "dead");
}

export function computeVoteLeader(votes: VoteEntry[]) {
  if (votes.length === 0) {
    return {
      status: "empty" as const,
      leaderId: null,
      voteCount: 0,
    };
  }

  const tally = new Map<number, number>();

  for (const vote of votes) {
    tally.set(vote.targetId, (tally.get(vote.targetId) ?? 0) + 1);
  }

  const sorted = [...tally.entries()].sort((left, right) => right[1] - left[1]);
  const [leaderId, voteCount] = sorted[0];
  const secondVoteCount = sorted[1]?.[1] ?? 0;

  if (voteCount === secondVoteCount) {
    return {
      status: "tie" as const,
      leaderId: null,
      voteCount,
    };
  }

  return {
    status: "leader" as const,
    leaderId,
    voteCount,
  };
}

export function sectionLabel(section: StructuredEntry["section"]) {
  return PHASE_SECTION_LABELS[section];
}

export function isPlayerEliminatedElsewhere(
  phases: Phase[],
  playerId: number,
  excludePhaseIndex: number,
) {
  return phases.some((phase, index) => {
    if (index === excludePhaseIndex || !isDayPhase(phase) || !phase.eliminated) {
      return false;
    }

    return phase.eliminated.playerId === playerId;
  });
}
