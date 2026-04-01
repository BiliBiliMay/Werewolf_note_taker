import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomePage } from "@/components/home/home-page";
import { gameStore } from "@/lib/store/game-store";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe("home page", () => {
  beforeEach(() => {
    localStorage.clear();
    pushMock.mockReset();
    gameStore.getState().resetGame();
    gameStore.setState({ hasHydrated: true });
  });

  it("starts a new game from the modal", async () => {
    const user = userEvent.setup();

    render(<HomePage />);

    await user.click(screen.getByRole("button", { name: "新建对局" }));
    await user.click(screen.getByRole("button", { name: "10" }));
    await user.click(screen.getByRole("button", { name: "开始记录" }));

    expect(gameStore.getState().playerCount).toBe(10);
    expect(gameStore.getState().phases[0]?.type).toBe("day");
    expect(pushMock).toHaveBeenCalledWith("/game");
  });
});
