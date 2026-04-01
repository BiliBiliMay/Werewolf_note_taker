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

  it("records action and speech together into one entry", async () => {
    const user = userEvent.setup();

    gameStore.getState().selectPlayer(9);
    render(<GamePage />);

    const quickActionSection = screen.getByText("快捷动作").closest("section");
    expect(quickActionSection).not.toBeNull();

    await user.click(within(quickActionSection as HTMLElement).getByRole("button", { name: "查杀" }));
    await user.click(screen.getAllByRole("button", { name: "5号" })[0]);
    await user.type(screen.getByLabelText("发言内容"), "我先听3号更新。");
    await user.click(screen.getByRole("button", { name: "记录当前发言" }));

    expect(screen.getByText("9号：查杀5号；我先听3号更新。")).toBeInTheDocument();
  });

  it("records typed speech into the current section", async () => {
    const user = userEvent.setup();

    gameStore.getState().selectPlayer(4);
    render(<GamePage />);

    await user.type(screen.getByLabelText("发言内容"), "我先站边2号，再看7号的更新。");
    await user.click(screen.getByRole("button", { name: "记录当前发言" }));

    expect(screen.getByText("4号：我先站边2号，再看7号的更新。")).toBeInTheDocument();
  });

  it("uses a single speech list from day 2 onward", () => {
    gameStore.getState().nextPhase();
    gameStore.getState().nextPhase();
    render(<GamePage />);

    expect(screen.getByText("白天发言记录")).toBeInTheDocument();
    expect(screen.queryByText("警上发言记录")).not.toBeInTheDocument();
    expect(screen.queryByText("警下发言记录")).not.toBeInTheDocument();
  });
});
