"use client";

import { useEffect } from "react";
import { useGameStore } from "@/lib/store/game-store";

export function useHydrateGameStore() {
  const hasHydrated = useGameStore((state) => state.hasHydrated);
  const hydrateFromStorage = useGameStore((state) => state.hydrateFromStorage);

  useEffect(() => {
    if (!hasHydrated) {
      void hydrateFromStorage();
    }
  }, [hasHydrated, hydrateFromStorage]);

  return hasHydrated;
}
