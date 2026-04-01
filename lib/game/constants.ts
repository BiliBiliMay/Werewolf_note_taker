import type {
  DaySection,
  PhaseSection,
  PlayerTag,
  QuickActionType,
  RealRole,
  RoleGuess,
} from "@/lib/game/types";

export const STORAGE_KEY = "werewolf-note-assistant/v1/current-game";

export const ROLE_GUESS_SEQUENCE: RoleGuess[] = ["unknown", "good", "wolf", "god"];

export const ROLE_GUESS_META: Record<
  RoleGuess,
  { label: string; className: string }
> = {
  unknown: { label: "未知", className: "border-slate-200 bg-slate-100 text-slate-600" },
  good: { label: "好人", className: "border-emerald-200 bg-emerald-100 text-emerald-700" },
  wolf: { label: "狼人", className: "border-rose-200 bg-rose-100 text-rose-700" },
  god: { label: "神职", className: "border-sky-200 bg-sky-100 text-sky-700" },
};

export const REAL_ROLE_OPTIONS: Array<{ value: RealRole; label: string }> = [
  { value: "unknown", label: "未知" },
  { value: "good", label: "好人" },
  { value: "wolf", label: "狼人" },
  { value: "god", label: "神职" },
];

export const PLAYER_TAG_OPTIONS: Array<{
  value: PlayerTag;
  label: string;
}> = [
  { value: "claim-seer", label: "跳预" },
  { value: "sheriff", label: "警长" },
  { value: "counter-claim", label: "对跳" },
  { value: "verified-good", label: "金水" },
  { value: "accused-wolf", label: "查杀" },
];

export const QUICK_ACTION_OPTIONS: Array<{
  value: QuickActionType;
  label: string;
  needsTargetHint: boolean;
}> = [
  { value: "claim-seer", label: "跳预", needsTargetHint: false },
  { value: "verified-good", label: "金水", needsTargetHint: true },
  { value: "accuse-wolf", label: "查杀", needsTargetHint: true },
  { value: "side-with", label: "站边", needsTargetHint: true },
  { value: "pressure", label: "打", needsTargetHint: true },
  { value: "protect", label: "保", needsTargetHint: true },
  { value: "idle", label: "划水", needsTargetHint: false },
];

export const QUICK_ACTION_LABELS: Record<QuickActionType, string> = {
  "claim-seer": "跳预",
  "verified-good": "金水",
  "accuse-wolf": "查杀",
  "side-with": "站边",
  pressure: "打",
  protect: "保",
  idle: "划水",
};

export const PLAYER_TAG_LABELS: Record<PlayerTag, string> = Object.fromEntries(
  PLAYER_TAG_OPTIONS.map((option) => [option.value, option.label]),
) as Record<PlayerTag, string>;

export const DAY_SECTION_OPTIONS: Array<{ value: DaySection; label: string }> = [
  { value: "speechesUp", label: "警上发言" },
  { value: "speechesDown", label: "警下发言" },
];

export const PHASE_SECTION_LABELS: Record<PhaseSection, string> = {
  speechesUp: "警上发言",
  speechesDown: "警下发言",
  nightNotes: "夜间记录",
};
