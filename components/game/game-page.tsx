"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  DAY_SECTION_OPTIONS,
  PLAYER_TAG_LABELS,
  PLAYER_TAG_OPTIONS,
  QUICK_ACTION_OPTIONS,
  REAL_ROLE_OPTIONS,
  ROLE_GUESS_META,
} from "@/lib/game/constants";
import {
  formatStructuredEntry,
  formatStructuredEntryCompact,
  getAliveCount,
  getEliminatedPlayers,
  getPhaseLabel,
  getPhaseLabelZh,
  isDayPhase,
} from "@/lib/game/helpers";
import type {
  DayPhase,
  DaySection,
  Player,
  QuickActionType,
  RealRole,
  StructuredEntry,
} from "@/lib/game/types";
import { useGameStore } from "@/lib/store/game-store";
import { useHydrateGameStore } from "@/lib/store/use-hydrate-game-store";
import { cn } from "@/lib/utils/cn";

function StructuredEntryList({
  entries,
  emptyLabel,
}: {
  entries: StructuredEntry[];
  emptyLabel: string;
}) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-black/10 bg-white/55 px-4 py-5 text-sm text-slate-500">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="rounded-2xl border border-black/10 bg-white/75 px-4 py-3 shadow-sm"
        >
          <div className="text-sm font-semibold text-slate-900">{formatStructuredEntry(entry)}</div>
          <div className="mt-1 text-xs text-slate-500">{formatStructuredEntryCompact(entry)}</div>
        </div>
      ))}
    </div>
  );
}

function PlayerNumberChips({
  players,
  selectedId,
  onSelect,
  excludeId,
}: {
  players: Player[];
  selectedId: number | null;
  onSelect: (playerId: number) => void;
  excludeId?: number;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {players.map((player) => {
        const isDisabled = excludeId === player.id;

        return (
          <button
            key={player.id}
            className={cn(
              "rounded-full border px-3 py-2 text-sm font-semibold transition",
              selectedId === player.id
                ? "border-amber-500 bg-amber-500 text-white"
                : "border-black/10 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-950",
              isDisabled && "cursor-not-allowed opacity-40 hover:border-black/10 hover:text-slate-700",
            )}
            disabled={isDisabled}
            onClick={() => onSelect(player.id)}
            type="button"
          >
            {player.id}号
          </button>
        );
      })}
    </div>
  );
}

function DayPhasePanel({
  phase,
  players,
  activeSection,
  onSelectSection,
  onSetElimination,
  onAssignRealRole,
}: {
  phase: DayPhase;
  players: Player[];
  activeSection: DaySection;
  onSelectSection: (section: DaySection) => void;
  onSetElimination: (playerId: number | null) => void;
  onAssignRealRole: (playerId: number, role: RealRole) => void;
}) {
  const eliminationCandidates = players.filter(
    (player) => player.status === "alive" || phase.eliminated?.playerId === player.id,
  );
  const usesSheriffSpeechSections = phase.day === 1;
  const generalSpeechEntries = [...phase.speechesUp, ...phase.speechesDown].sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt),
  );

  return (
    <div className="space-y-5">
      {usesSheriffSpeechSections ? (
        <>
          <section className="panel p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="section-title">当前写入位置</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">白天记录分区</h2>
                <p className="mt-2 text-sm text-slate-600">
                  第1天保留警上和警下两个发言分区。
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {DAY_SECTION_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-semibold transition",
                      activeSection === option.value
                        ? "border-amber-500 bg-amber-500 text-white"
                        : "border-black/10 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900",
                    )}
                    onClick={() => onSelectSection(option.value)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section
            className={cn("panel p-5", activeSection === "speechesUp" && "ring-1 ring-amber-200")}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-title">警上发言</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">警上发言记录</h3>
              </div>
              <div className="flex items-center gap-2">
                {activeSection === "speechesUp" ? (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                    当前写入
                  </span>
                ) : null}
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {phase.speechesUp.length} 条
                </span>
              </div>
            </div>
            <div className="mt-4">
              <StructuredEntryList entries={phase.speechesUp} emptyLabel="还没有警上发言记录。" />
            </div>
          </section>

          <section
            className={cn("panel p-5", activeSection === "speechesDown" && "ring-1 ring-amber-200")}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-title">警下发言</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">警下发言记录</h3>
              </div>
              <div className="flex items-center gap-2">
                {activeSection === "speechesDown" ? (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                    当前写入
                  </span>
                ) : null}
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {phase.speechesDown.length} 条
                </span>
              </div>
            </div>
            <div className="mt-4">
              <StructuredEntryList entries={phase.speechesDown} emptyLabel="还没有警下发言记录。" />
            </div>
          </section>
        </>
      ) : (
        <section className="panel p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-title">发言记录</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">白天发言记录</h3>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {generalSpeechEntries.length} 条
            </span>
          </div>
          <div className="mt-4">
            <StructuredEntryList entries={generalSpeechEntries} emptyLabel="还没有发言记录。" />
          </div>
        </section>
      )}

      <section className="panel p-5">
        <div>
          <p className="section-title">出局信息</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">白天出局信息</h3>
          <p className="mt-2 text-sm text-slate-600">设置出局玩家和真实身份后，右侧摘要会立刻同步。</p>
        </div>

        <div className="mt-5 space-y-5">
          <div>
            <p className="text-sm font-medium text-slate-600">选择出局玩家</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {eliminationCandidates.map((player) => (
                <button
                  key={player.id}
                  className={cn(
                    "rounded-full border px-3 py-2 text-sm font-semibold transition",
                    phase.eliminated?.playerId === player.id
                      ? "border-rose-500 bg-rose-500 text-white"
                      : "border-black/10 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900",
                  )}
                  onClick={() => onSetElimination(player.id)}
                  type="button"
                >
                  {player.id}号
                </button>
              ))}
              <button
                className="rounded-full border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                onClick={() => onSetElimination(null)}
                type="button"
              >
                清空
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-600">真实身份</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {REAL_ROLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={cn(
                    "rounded-full border px-3 py-2 text-sm font-semibold transition",
                    phase.eliminated?.realRole === option.value
                      ? "border-amber-500 bg-amber-500 text-white"
                      : "border-black/10 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900",
                  )}
                  disabled={!phase.eliminated}
                  onClick={() => {
                    if (phase.eliminated) {
                      onAssignRealRole(phase.eliminated.playerId, option.value);
                    }
                  }}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function GamePage() {
  const hasHydrated = useHydrateGameStore();
  const playerCount = useGameStore((state) => state.playerCount);
  const players = useGameStore((state) => state.players);
  const phases = useGameStore((state) => state.phases);
  const currentPhaseIndex = useGameStore((state) => state.currentPhaseIndex);
  const selectedPlayerId = useGameStore((state) => state.selectedPlayerId);
  const activeSection = useGameStore((state) => state.activeSection);
  const selectPlayer = useGameStore((state) => state.selectPlayer);
  const cycleRoleGuess = useGameStore((state) => state.cycleRoleGuess);
  const togglePlayerStatus = useGameStore((state) => state.togglePlayerStatus);
  const togglePlayerTag = useGameStore((state) => state.togglePlayerTag);
  const togglePinned = useGameStore((state) => state.togglePinned);
  const setActiveSection = useGameStore((state) => state.setActiveSection);
  const addStructuredEntry = useGameStore((state) => state.addStructuredEntry);
  const setElimination = useGameStore((state) => state.setElimination);
  const assignRealRole = useGameStore((state) => state.assignRealRole);
  const nextPhase = useGameStore((state) => state.nextPhase);
  const setCurrentPhaseIndex = useGameStore((state) => state.setCurrentPhaseIndex);

  const [selectedAction, setSelectedAction] = useState<QuickActionType | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<number | null>(null);
  const [speechDraft, setSpeechDraft] = useState("");

  const currentPhase = phases[currentPhaseIndex];
  const selectedPlayer = players.find((player) => player.id === selectedPlayerId) ?? null;
  const aliveCount = getAliveCount(players);
  const eliminatedPlayers = getEliminatedPlayers(players);
  const pinnedPlayers = players.filter((player) => player.pinned);
  const currentSection: DaySection = activeSection === "speechesDown" ? "speechesDown" : "speechesUp";
  const selectedActionOption =
    QUICK_ACTION_OPTIONS.find((option) => option.value === selectedAction) ?? null;
  const currentSectionLabel =
    !isDayPhase(currentPhase)
      ? "夜间流程"
      : currentPhase.day > 1
        ? "发言记录"
        : DAY_SECTION_OPTIONS.find((option) => option.value === currentSection)?.label ?? "警上发言";
  const trimmedSpeechDraft = speechDraft.trim();
  const hasIncompleteAction =
    Boolean(selectedAction) &&
    Boolean(selectedActionOption?.needsTargetHint) &&
    selectedTargetId === null;

  const entryPreview = useMemo(() => {
    if (!selectedPlayer || !currentPhase || !isDayPhase(currentPhase)) {
      return null;
    }

    if (hasIncompleteAction) {
      return `为 ${selectedPlayer.id}号 选择目标玩家后再记录。`;
    }

    if (!selectedAction && !trimmedSpeechDraft) {
      return null;
    }

    return formatStructuredEntry({
      id: "preview",
      actorId: selectedPlayer.id,
      actionType: selectedAction ?? undefined,
      targetId: selectedAction ? selectedTargetId ?? undefined : undefined,
      content: trimmedSpeechDraft || undefined,
      phaseIndex: currentPhaseIndex,
      section: currentSection,
      createdAt: new Date().toISOString(),
    });
  }, [
    currentPhase,
    currentPhaseIndex,
    currentSection,
    hasIncompleteAction,
    selectedAction,
    selectedPlayer,
    selectedTargetId,
    trimmedSpeechDraft,
  ]);

  const canSaveEntry =
    Boolean(selectedPlayer) &&
    Boolean(currentPhase && isDayPhase(currentPhase)) &&
    !hasIncompleteAction &&
    (Boolean(selectedAction) || trimmedSpeechDraft.length > 0);

  useEffect(() => {
    setSelectedAction(null);
    setSelectedTargetId(null);
    setSpeechDraft("");
  }, [currentPhaseIndex, selectedPlayerId]);

  if (!hasHydrated) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-10">
        <div className="panel w-full max-w-2xl p-8 text-center">
          <p className="section-title">载入中</p>
          <h1 className="mt-3 font-display text-4xl text-slate-950">正在同步自动保存对局</h1>
        </div>
      </main>
    );
  }

  if (!playerCount || phases.length === 0 || !currentPhase) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-10">
        <div className="panel w-full max-w-2xl p-8 text-center">
          <p className="section-title">暂无对局</p>
          <h1 className="mt-3 font-display text-4xl text-slate-950">还没有开始对局</h1>
          <p className="mt-4 text-slate-600">先从首页创建一个新对局，系统会自动从第1天开始记录。</p>
          <Link
            className="mt-6 inline-flex rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            href="/"
          >
            返回首页
          </Link>
        </div>
      </main>
    );
  }

  const handleSelectAction = (action: QuickActionType) => {
    if (selectedAction === action) {
      setSelectedAction(null);
      setSelectedTargetId(null);
      return;
    }

    setSelectedAction(action);

    const option = QUICK_ACTION_OPTIONS.find((item) => item.value === action);
    if (!option?.needsTargetHint) {
      setSelectedTargetId(null);
    }
  };

  const handleSaveEntry = () => {
    if (!selectedPlayer || !currentPhase || !isDayPhase(currentPhase) || hasIncompleteAction) {
      return;
    }

    if (!selectedAction && !trimmedSpeechDraft) {
      return;
    }

    addStructuredEntry({
      actorId: selectedPlayer.id,
      actionType: selectedAction ?? undefined,
      targetId: selectedAction ? selectedTargetId ?? undefined : undefined,
      content: trimmedSpeechDraft || undefined,
    });
    setSelectedAction(null);
    setSelectedTargetId(null);
    setSpeechDraft("");
  };

  return (
    <main className="min-h-screen px-4 py-5 lg:px-6 lg:py-6">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <header className="panel flex flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="section-title">简化记录版</p>
            <h1 className="mt-2 font-display text-3xl text-slate-950">狼人杀笔记助手</h1>
            <p className="mt-2 text-sm text-slate-600">
              {playerCount} 人局 · 当前阶段 {getPhaseLabelZh(currentPhase)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span className="rounded-full border border-black/10 bg-white/70 px-4 py-2 font-semibold">
              存活 {aliveCount}
            </span>
            <span className="rounded-full border border-black/10 bg-white/70 px-4 py-2 font-semibold">
              当前写入 {currentSectionLabel}
            </span>
            <Link
              className="rounded-full border border-black/10 bg-white/70 px-4 py-2 font-semibold transition hover:border-slate-300 hover:text-slate-950"
              href="/"
            >
              首页
            </Link>
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
          <aside className="panel h-fit p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-title">玩家列表</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">左侧玩家面板</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {playerCount} 人局
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {players.map((player) => {
                const roleMeta = ROLE_GUESS_META[player.roleGuess];
                const isSelected = selectedPlayerId === player.id;
                const isDead = player.status === "dead";

                return (
                  <article
                    key={player.id}
                    className={cn(
                      "rounded-3xl border bg-white/80 p-4 transition",
                      isSelected
                        ? "border-amber-400 shadow-lg shadow-amber-100"
                        : "border-black/10 hover:border-slate-300",
                      isDead && "opacity-70",
                    )}
                    onClick={() => selectPlayer(player.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        selectPlayer(player.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs tracking-[0.24em] text-slate-400">玩家</div>
                        <div className="mt-1 text-2xl font-semibold text-slate-950">{player.id}号</div>
                      </div>
                      <button
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-semibold transition",
                          player.pinned
                            ? "border-amber-500 bg-amber-500 text-white"
                            : "border-black/10 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-900",
                        )}
                        onClick={(event) => {
                          event.stopPropagation();
                          togglePinned(player.id);
                        }}
                        type="button"
                      >
                        盯
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-semibold transition",
                          isDead
                            ? "border-rose-200 bg-rose-100 text-rose-700"
                            : "border-emerald-200 bg-emerald-100 text-emerald-700",
                        )}
                        onClick={(event) => {
                          event.stopPropagation();
                          togglePlayerStatus(player.id);
                        }}
                        type="button"
                      >
                        {isDead ? "已出局" : "存活"}
                      </button>

                      <button
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-semibold transition",
                          roleMeta.className,
                        )}
                        onClick={(event) => {
                          event.stopPropagation();
                          cycleRoleGuess(player.id);
                        }}
                        type="button"
                      >
                        {roleMeta.label}
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {PLAYER_TAG_OPTIONS.map((tag) => {
                        const active = player.tags.includes(tag.value);

                        return (
                          <button
                            key={tag.value}
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition",
                              active
                                ? "border-slate-950 bg-slate-950 text-white"
                                : "border-black/10 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-900",
                            )}
                            onClick={(event) => {
                              event.stopPropagation();
                              togglePlayerTag(player.id, tag.value);
                            }}
                            type="button"
                          >
                            {tag.label}
                          </button>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </div>
          </aside>

          <section className="space-y-5">
            <div className="panel p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                  {phases.map((phase, index) => (
                    <button
                      key={phase.id}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm font-semibold transition",
                        index === currentPhaseIndex
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-black/10 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900",
                      )}
                      onClick={() => setCurrentPhaseIndex(index)}
                      type="button"
                    >
                      {getPhaseLabel(phase)}
                    </button>
                  ))}
                </div>
                <button
                  className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                  onClick={() => nextPhase()}
                  type="button"
                >
                  进入下一阶段
                </button>
              </div>
            </div>

            <div className="panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="section-title">快捷记录</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    {selectedPlayer ? `${selectedPlayer.id}号快捷操作` : "先选择一个玩家"}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {isDayPhase(currentPhase)
                      ? `当前会写入 ${currentSectionLabel}。`
                      : "夜晚阶段只保留流程占位，不记录发言。"}
                  </p>
                </div>
                {selectedPlayer ? (
                  <button
                    className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                    onClick={() => selectPlayer(null)}
                    type="button"
                  >
                    取消选中
                  </button>
                ) : null}
              </div>

              {selectedPlayer ? (
                <section className="mt-5 rounded-3xl border border-black/10 bg-white/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-600">快捷动作</p>
                    <button
                      className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
                      onClick={() => {
                        setSelectedAction(null);
                        setSelectedTargetId(null);
                      }}
                      type="button"
                    >
                      清空动作
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {QUICK_ACTION_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        className={cn(
                          "rounded-full border px-4 py-2 text-sm font-semibold transition",
                          selectedAction === option.value
                            ? "border-amber-500 bg-amber-500 text-white"
                            : "border-black/10 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900",
                        )}
                        disabled={!isDayPhase(currentPhase)}
                        onClick={() => handleSelectAction(option.value)}
                        type="button"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {selectedActionOption?.needsTargetHint ? (
                    <div className="mt-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-slate-600">目标玩家</p>
                        <button
                          className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
                          onClick={() => setSelectedTargetId(null)}
                          type="button"
                        >
                          清空目标
                        </button>
                      </div>
                      <div className="mt-2">
                        <PlayerNumberChips
                          excludeId={selectedPlayer.id}
                          onSelect={setSelectedTargetId}
                          players={players}
                          selectedId={selectedTargetId}
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <label className="text-sm font-medium text-slate-600" htmlFor="speech-draft">
                      发言内容
                    </label>
                    <button
                      className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
                      onClick={() => setSpeechDraft("")}
                      type="button"
                    >
                      清空输入
                    </button>
                  </div>
                  <textarea
                    className="mt-3 min-h-28 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    disabled={!isDayPhase(currentPhase)}
                    id="speech-draft"
                    onChange={(event) => setSpeechDraft(event.target.value)}
                    placeholder={`输入 ${selectedPlayer.id}号 的具体发言，例如：我先站边2号，警徽流看7号。`}
                    rows={4}
                    value={speechDraft}
                  />

                  <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                    {isDayPhase(currentPhase)
                      ? entryPreview ?? "可以只记动作、只记发言，或把动作和发言一起记成一条。"
                      : "当前是夜晚阶段，发言记录会在白天阶段恢复。"}
                  </div>

                  <button
                    className="mt-3 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    disabled={!canSaveEntry}
                    onClick={handleSaveEntry}
                    type="button"
                  >
                    记录当前发言
                  </button>
                </section>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-black/10 bg-white/50 px-4 py-5 text-sm leading-7 text-slate-500">
                  从左侧点选一个玩家卡片，然后直接选择 跳预 / 金水 / 查杀 / 站边 / 打 / 保 / 划水，再把发言内容一起记成一条。
                </div>
              )}
            </div>

            {isDayPhase(currentPhase) ? (
              <DayPhasePanel
                activeSection={currentSection}
                onAssignRealRole={assignRealRole}
                onSelectSection={setActiveSection}
                onSetElimination={setElimination}
                phase={currentPhase}
                players={players}
              />
            ) : (
              <section className="panel p-6">
                <div>
                  <p className="section-title">夜晚阶段</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">{getPhaseLabelZh(currentPhase)}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    当前简化版只保留白天发言和出局信息。夜晚阶段用于流程推进，点击
                    <span className="px-1 font-semibold text-slate-950">进入下一阶段</span>
                    即可继续到下一个白天。
                  </p>
                </div>
              </section>
            )}
          </section>

          <aside className="panel h-fit p-5">
            <div>
              <p className="section-title">局势摘要</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">右侧摘要区</h2>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-black/10 bg-white/70 p-4">
                <div className="text-sm text-slate-500">当前阶段</div>
                <div className="mt-2 text-xl font-semibold text-slate-950">{getPhaseLabelZh(currentPhase)}</div>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white/70 p-4">
                <div className="text-sm text-slate-500">存活人数</div>
                <div className="mt-2 text-xl font-semibold text-slate-950">{aliveCount}</div>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white/70 p-4">
                <div className="text-sm text-slate-500">当前写入</div>
                <div className="mt-2 text-xl font-semibold text-slate-950">{currentSectionLabel}</div>
              </div>
            </div>

            <section className="mt-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-950">出局名单</h3>
                <span className="text-sm text-slate-500">{eliminatedPlayers.length} 人</span>
              </div>
              <div className="mt-3 space-y-3">
                {eliminatedPlayers.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-black/10 bg-white/50 px-4 py-5 text-sm text-slate-500">
                    还没有出局玩家。
                  </div>
                ) : (
                  eliminatedPlayers.map((player) => (
                    <div
                      key={player.id}
                      className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3"
                    >
                      <div className="text-sm font-semibold text-slate-950">
                        {player.id}号 · {ROLE_GUESS_META[player.realRole ?? "unknown"].label}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        标签：
                        {player.tags.length > 0
                          ? player.tags.map((tag) => PLAYER_TAG_LABELS[tag]).join(" / ")
                          : "无"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="mt-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-950">重点怀疑对象</h3>
                <span className="text-sm text-slate-500">{pinnedPlayers.length} 人</span>
              </div>
              <div className="mt-3 space-y-3">
                {pinnedPlayers.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-black/10 bg-white/50 px-4 py-5 text-sm text-slate-500">
                    在左侧点“盯”即可加入重点观察列表。
                  </div>
                ) : (
                  pinnedPlayers.map((player) => (
                    <button
                      key={player.id}
                      className="flex w-full items-center justify-between rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-left transition hover:border-slate-300"
                      onClick={() => selectPlayer(player.id)}
                      type="button"
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-950">{player.id}号</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {ROLE_GUESS_META[player.roleGuess].label}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-amber-700">查看</span>
                    </button>
                  ))
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
