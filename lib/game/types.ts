export type PlayerStatus = "alive" | "dead";
export type RoleGuess = "unknown" | "good" | "wolf" | "god";
export type RealRole = "unknown" | "good" | "wolf" | "god";
export type PlayerTag =
  | "claim-seer"
  | "sheriff"
  | "counter-claim"
  | "verified-good"
  | "accused-wolf";
export type QuickActionType =
  | "claim-seer"
  | "verified-good"
  | "accuse-wolf"
  | "side-with"
  | "pressure"
  | "protect"
  | "idle";
export type DaySection = "speechesUp" | "speechesDown";
export type PhaseSection = DaySection | "nightNotes";

export interface Player {
  id: number;
  status: PlayerStatus;
  roleGuess: RoleGuess;
  tags: PlayerTag[];
  pinned: boolean;
  realRole?: RealRole;
}

export interface StructuredEntry {
  id: string;
  actorId: number;
  actionType?: QuickActionType;
  targetId?: number;
  content?: string;
  phaseIndex: number;
  section: PhaseSection;
  createdAt: string;
}

export interface VoteEntry {
  voterId: number;
  targetId: number;
}

export interface Elimination {
  playerId: number;
  realRole?: RealRole;
}

export interface DayPhase {
  id: string;
  type: "day";
  day: number;
  speechesUp: StructuredEntry[];
  speechesDown: StructuredEntry[];
  votes: VoteEntry[];
  eliminated: Elimination | null;
}

export interface NightPhase {
  id: string;
  type: "night";
  night: number;
  notes: StructuredEntry[];
}

export type Phase = DayPhase | NightPhase;

export interface GameSessionState {
  playerCount: number;
  players: Player[];
  phases: Phase[];
  currentPhaseIndex: number;
  selectedPlayerId: number | null;
  activeSection: PhaseSection;
}
