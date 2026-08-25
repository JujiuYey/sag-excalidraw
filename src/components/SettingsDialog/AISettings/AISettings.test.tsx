import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AISettings } from "./AISettings";

vi.mock("@/lib/ai-service", () => ({
  createAIService: vi.fn(),
}));

describe("AISettings", () => {
  it("loads DeepSeek defaults and applies MiniMax preset", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    render(<AISettings />);

    expect(
      screen.getByText("DeepSeek", { selector: ".ant-select-content-value" }),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("https://api.deepseek.com"),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("deepseek-v4-pro")).toBeInTheDocument();

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByText("MiniMax"));

    expect(
      screen.getByDisplayValue("https://api.minimaxi.com/v1"),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("MiniMax-M3")).toBeInTheDocument();
  });
});
