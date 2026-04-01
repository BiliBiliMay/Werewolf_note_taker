import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GamePage } from "@/components/game/game-page";
import { gameStore } from "@/lib/store/game-store";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("game page", () => {
  beforeEach(() => {
    localStorage.clear();
    gameStore.getState().startGame(9);
    gameStore.setState({ hasHydrated: true });
  });

  it("records a quick action into the current section", async () => {
    const user = userEvent.setup();

    gameStore.getState().selectPlayer(9);
    render(<GamePage />);

    await user.click(screen.getByRole("button", { name: "查杀" }));
    await user.click(screen.getAllByRole("button", { name: "5号" })[0]);
    await user.click(screen.getByRole("button", { name: "记录到当前阶段" }));

    expect(screen.getByText("9号：查杀5号")).toBeInTheDocument();
  });
});
