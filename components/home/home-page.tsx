"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useGameStore } from "@/lib/store/game-store";
import { useHydrateGameStore } from "@/lib/store/use-hydrate-game-store";
import { cn } from "@/lib/utils/cn";

const PLAYER_COUNTS = [9, 10, 12] as const;

export function HomePage() {
  const router = useRouter();
  const hasHydrated = useHydrateGameStore();
  const startGame = useGameStore((state) => state.startGame);
  const players = useGameStore((state) => state.players);
  const phases = useGameStore((state) => state.phases);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlayerCount, setSelectedPlayerCount] = useState<number>(12);

  const hasExistingGame = useMemo(() => players.length > 0 && phases.length > 0, [phases.length, players.length]);

  const handleStartGame = () => {
    if (
      hasExistingGame &&
      typeof window !== "undefined" &&
      !window.confirm("开始新对局会覆盖当前自动保存记录，确定继续吗？")
    ) {
      return;
    }

    startGame(selectedPlayerCount);
    setIsModalOpen(false);
    router.push("/game");
  };

  if (!hasHydrated) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-10">
        <div className="panel w-full max-w-xl p-8 text-center">
          <p className="text-sm tracking-[0.3em] text-slate-500">狼人杀第二屏笔记工具</p>
          <h1 className="mt-4 font-display text-4xl text-slate-900">狼人杀笔记助手</h1>
          <p className="mt-4 text-slate-600">正在载入当前对局记录...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="panel relative overflow-hidden p-8 lg:p-12">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-100/80 via-transparent to-rose-100/50" />
          <div className="relative space-y-8">
            <div className="space-y-4">
              <p className="text-sm font-semibold tracking-[0.32em] text-slate-500">狼人杀第二屏笔记工具</p>
              <h1 className="max-w-3xl font-display text-5xl leading-tight text-slate-900 lg:text-6xl">
                狼人杀笔记助手
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-700">
                给手机局玩家准备的第二屏笔记台。点一点就能记录跳预、金水、查杀、站边、划水和出局进程，节奏快的时候也不容易漏信息。
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-slate-700">
              <span className="chip chip-muted">结构化发言</span>
              <span className="chip chip-muted">快捷玩家标签</span>
              <span className="chip chip-muted">本地自动保存</span>
              <span className="chip chip-muted">桌面优先布局</span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                className="rounded-full bg-slate-950 px-7 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                onClick={() => setIsModalOpen(true)}
                type="button"
              >
                新建对局
              </button>
              {hasExistingGame ? (
                <Link
                  className="rounded-full border border-black/10 bg-white/70 px-7 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                  href="/game"
                >
                  继续当前对局
                </Link>
              ) : null}
            </div>

            {hasExistingGame ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm leading-7 text-amber-900">
                当前已有自动保存的对局记录。开始新对局会覆盖这份记录。
              </div>
            ) : null}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-rows-[auto_auto_1fr]">
          <div className="panel p-6">
            <p className="section-title">核心能力</p>
            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-700">
              <p>1. 点击玩家卡片，立刻打开快捷记录面板。</p>
              <p>2. 当前阶段、警上警下和出局信息都保持结构化。</p>
              <p>3. 所有状态保存在浏览器本地，不依赖后端。</p>
            </div>
          </div>

          <div className="panel p-6">
            <p className="section-title">推荐流程</p>
            <div className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
              <p>开局先设置人数。</p>
              <p>发言时点选玩家与动作，再决定写入警上还是警下。</p>
              <p>白天结束后点 <span className="font-semibold text-slate-950">进入下一阶段</span> 推进流程。</p>
            </div>
          </div>

          <div className="panel flex flex-col justify-between p-6">
            <div>
              <p className="section-title">适用场景</p>
              <h2 className="mt-4 font-display text-3xl text-slate-900">快节奏复盘视图</h2>
              <p className="mt-4 text-sm leading-7 text-slate-700">
                左边盯玩家状态，中间管阶段推进，右边始终能看到警长、存活数、出局名单和重点怀疑对象。
              </p>
            </div>
            <div className="mt-6 rounded-2xl border border-black/10 bg-slate-950 p-5 text-sm leading-7 text-slate-100">
              适合和手机麦序/发言并行使用，尽量把输入变成点选而不是敲字。
            </div>
          </div>
        </section>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-10 backdrop-blur-sm">
          <div className="panel w-full max-w-md p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-title">新建对局</p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-950">选择玩家人数</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">支持 9 / 10 / 12 人局，默认从第1天开始。</p>
              </div>
              <button
                aria-label="关闭开始新局弹窗"
                className="rounded-full border border-black/10 px-3 py-1 text-sm text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                onClick={() => setIsModalOpen(false)}
                type="button"
              >
                关闭
              </button>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {PLAYER_COUNTS.map((count) => (
                <button
                  key={count}
                  className={cn(
                    "rounded-2xl border px-4 py-4 text-center text-lg font-semibold transition",
                    selectedPlayerCount === count
                      ? "border-amber-500 bg-amber-500 text-white shadow-sm"
                      : "border-black/10 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-950",
                  )}
                  onClick={() => setSelectedPlayerCount(count)}
                  type="button"
                >
                  {count}
                </button>
              ))}
            </div>

            <button
              className="mt-6 w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              onClick={handleStartGame}
              type="button"
            >
              开始记录
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
