import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { AccountSection } from "@/components/account-section";
import { SetupWizard } from "@/components/setup-wizard";

// Server actions become no-ops in tests — the components' own logic is the target.
vi.mock("@/app/actions", () => ({
  createCampaign: vi.fn(async () => undefined),
  createGoal: vi.fn(async () => undefined),
  createHabit: vi.fn(async () => undefined),
  createTask: vi.fn(async () => undefined),
  updateProfile: vi.fn(async () => undefined),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));
vi.mock("@/app/account-actions", () => ({
  deleteAccount: vi.fn(async () => ({ deleted: true })),
  exportPlayerData: vi.fn(async () => ({ goals: [], habits: [] })),
}));
vi.mock("@/lib/auth/client", () => ({
  authClient: { signOut: vi.fn(async () => undefined) },
}));

describe("SetupWizard", () => {
  test("steps 1→2: choosing a mode advances after updateProfile", async () => {
    const user = userEvent.setup();
    render(<SetupWizard />);
    expect(
      screen.getByText("Step 1 of 4 — choose your world"),
    ).toBeInTheDocument();
    const advance = screen.getByRole("button", {
      name: "Enter Ember Campaign",
    });
    await user.click(advance);

    expect(
      await screen.findByText("Step 2 of 4 — pick a campaign"),
    ).toBeInTheDocument();
  });
  test("step 2 is skippable — skip lands on the goal step", async () => {
    const user = userEvent.setup();
    render(<SetupWizard />);
    const emberAdvance = screen.getByRole("button", {
      name: "Enter Ember Campaign",
    });
    await user.click(emberAdvance);
    await user.click(
      screen.getByRole("button", { name: "Skip campaign for now" }),
    );
    expect(
      await screen.findByText("Step 3 of 4 — name one goal"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/what do you want to achieve/i),
    ).toBeInTheDocument();
  });

  test("step 3 requires a goal title before continuing", async () => {
    const user = userEvent.setup();
    render(<SetupWizard />);
    const emberAdvance = screen.getByRole("button", {
      name: "Enter Ember Campaign",
    });
    await user.click(emberAdvance);
    await user.click(
      screen.getByRole("button", { name: "Skip campaign for now" }),
    );

    const next = await screen.findByRole("button", {
      name: "Continue to action step",
    });
    expect(next).toBeDisabled();
    await user.type(
      screen.getByLabelText(/what do you want to achieve/i),
      "Run a 10K",
    );
    expect(next).toBeEnabled();
  });

  test("step 4: action title gates the final submit", async () => {
    const user = userEvent.setup();
    render(<SetupWizard />);
    const emberAdvance = screen.getByRole("button", {
      name: "Enter Ember Campaign",
    });
    await user.click(emberAdvance);
    await user.click(
      screen.getByRole("button", { name: "Skip campaign for now" }),
    );
    await user.type(
      await screen.findByLabelText(/what do you want to achieve/i),
      "Run a 10K",
    );
    await user.click(
      await screen.findByRole("button", { name: "Continue to action step" }),
    );

    expect(
      await screen.findByText("Step 4 of 4 — add one action"),
    ).toBeInTheDocument();
    const finish = screen.getByRole("button", { name: /begin your campaign/i });
    expect(finish).toBeDisabled();
    await user.type(screen.getByLabelText(/daily habit title/i), "Morning run");
    expect(finish).toBeEnabled();
  });
});
describe("AccountSection deletion gate", () => {
  test("delete button stays disabled until DELETE is typed exactly", async () => {
    const user = userEvent.setup();
    render(<AccountSection />);

    const button = screen.getByRole("button", { name: /delete permanently/i });
    expect(button).toBeDisabled();

    await user.type(screen.getByLabelText(/type delete to confirm/i), "delete");
    expect(button).toBeDisabled(); // lowercase does not count

    await user.clear(screen.getByLabelText(/type delete to confirm/i));
    await user.type(screen.getByLabelText(/type delete to confirm/i), "DELETE");
    expect(button).toBeEnabled();
  });

  test("wrong token surfaces the server's refusal as an alert", async () => {
    const user = userEvent.setup();
    const { deleteAccount } = await import("@/app/account-actions");
    vi.mocked(deleteAccount).mockRejectedValueOnce(
      new Error("Type DELETE to confirm — deletion is permanent."),
    );
    render(<AccountSection />);

    await user.type(screen.getByLabelText(/type delete to confirm/i), "DELETE");
    await user.click(
      screen.getByRole("button", { name: /delete permanently/i }),
    );

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/deletion is permanent/i);
  });
});
