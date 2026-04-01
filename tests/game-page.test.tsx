import { render, screen, within } from "@testing-library/react";
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

    const quickActionSection = screen.getByText("选择动作").closest("section");
    expect(quickActionSection).not.toBeNull();

    await user.click(within(quickActionSection as HTMLElement).getByRole("button", { name: "查杀" }));
    await user.click(screen.getAllByRole("button", { name: "5号" })[0]);
    await user.click(screen.getByRole("button", { name: "记录到当前阶段" }));

    expect(screen.getByText("9号：查杀5号")).toBeInTheDocument();
  });

  it("records typed speech into the current section", async () => {
    const user = userEvent.setup();

    gameStore.getState().selectPlayer(4);
    render(<GamePage />);

    await user.type(screen.getByLabelText("补充发言"), "我先站边2号，再看7号的更新。");
    await user.click(screen.getByRole("button", { name: "记录文字发言" }));

    expect(screen.getByText("4号：我先站边2号，再看7号的更新。")).toBeInTheDocument();
  });
});
