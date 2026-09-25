"use client";

// Setup wizard — 4 steps (ADR Q41): mode → campaign (skippable) → one goal →
// one habit or task. Runs after sign-in; every choice syncs immediately.
// Shown when the player has no goals AND no habits (first run).

import { useState, useTransition } from "react";
import { ArrowRight, SkipForward } from "lucide-react";

import {
  createCampaign,
  createGoal,
  createHabit,
  createTask,
  updateProfile,
} from "@/app/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import type { ModeId } from "@/lib/modes";
import { MODES, MODE_IDS } from "@/lib/modes";
import { cn } from "@/lib/utils";

const STEP_DESCRIPTIONS = [
  "choose your world",
  "pick a campaign",
  "name one goal",
  "add one action",
] as const;

export function SetupWizard() {
  const [step, setStep] = useState(0); // 0 mode · 1 campaign · 2 goal · 3 action
  const [, startTransition] = useTransition();
  const [mode, setMode] = useState<ModeId>("rpg");
  const [campaignLength, setCampaignLength] = useState<30 | 60 | 90>(30);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalTag, setGoalTag] = useState("");
  const [actionTitle, setActionTitle] = useState("");
  const [actionIsHabit, setActionIsHabit] = useState(true);

  const modeCopy = MODES[mode];

  function finish() {
    startTransition(async () => {
      const tags = goalTag.trim()
        ? goalTag.trim().replace(/^#/, "").split(/\s+/)
        : [];
      await createGoal({ title: goalTitle.trim(), watchedTags: tags });
      if (actionIsHabit) {
        await createHabit({
          title: actionTitle.trim(),
          tags: tags.length ? tags : ["general"],
          effort: "medium",
          schedule: { kind: "daily" },
        });
      } else {
        await createTask({
          title: actionTitle.trim(),
          tags: tags.length ? tags : ["general"],
          effort: "small",
          dueDate: null,
        });
      }
    });
  }

  return (
    <section
      aria-labelledby="wizard-h"
      className="mx-auto w-full max-w-xl rounded-2xl border bg-card p-6"
    >
      <h2 id="wizard-h" className="mb-1 text-xl font-bold">
        Set up your {MODES[mode].campaign.toLowerCase()}
      </h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Step {step + 1} of 4 — {STEP_DESCRIPTIONS[step]}
      </p>

      {step === 0 ? (
        <div className="grid gap-3">
          <div
            role="radiogroup"
            aria-label="Choose your fantasy mode"
            className="grid gap-2 sm:grid-cols-3"
          >
            {MODE_IDS.map((id) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={mode === id}
                onClick={() => setMode(id)}
                className={cn(
                  "rounded-xl border p-4 text-left transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  mode === id
                    ? "border-primary bg-primary/10"
                    : "hover:bg-muted/50",
                )}
              >
                <span className="block text-sm font-semibold">
                  {MODES[id].label}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {MODES[id].tagline}
                </span>
              </button>
            ))}
          </div>
          <Button
            variant="default"
            size="lg"
            onPress={() =>
              startTransition(async () => {
                await updateProfile({ mode });
                setStep(1);
              })
            }
          >
            Enter {MODES[mode].label}{" "}
            <ArrowRight aria-hidden className="size-4" />
          </Button>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">
            A {modeCopy.campaign.toLowerCase()} groups your{" "}
            {modeCopy.goals.toLowerCase()} under one arc. You can skip this and
            go straight to play.
          </p>
          <div
            role="radiogroup"
            aria-label="Campaign length"
            className="flex gap-2"
          >
            {([30, 60, 90] as const).map((len) => (
              <button
                key={len}
                type="button"
                role="radio"
                aria-checked={campaignLength === len}
                onClick={() => setCampaignLength(len)}
                className={cn(
                  "flex-1 rounded-xl border p-3 text-center text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  campaignLength === len
                    ? "border-primary bg-primary/10"
                    : "hover:bg-muted/50",
                )}
              >
                {len} days
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Skip campaign for now"
              onClick={() => setStep(2)}
              className={cn(
                buttonVariants({ variant: "ghost", size: "lg" }),
                "flex-1",
              )}
            >
              <SkipForward aria-hidden className="size-4" /> Skip
            </button>
            <Button
              variant="default"
              size="lg"
              onPress={() =>
                startTransition(async () => {
                  await createCampaign({
                    title: `${modeCopy.label} — ${campaignLength} days`,
                    lengthDays: campaignLength,
                  });
                  setStep(2);
                })
              }
            >
              Start {campaignLength}-day {modeCopy.campaign.toLowerCase()}{" "}
              <ArrowRight aria-hidden className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (goalTitle.trim()) setStep(3);
          }}
        >
          <label htmlFor="wizard-goal" className="text-sm font-medium">
            What do you want to achieve?
          </label>
          <input
            id="wizard-goal"
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            placeholder="Run a 10K"
            className="h-9 rounded-lg border bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <label htmlFor="wizard-tag" className="text-sm font-medium">
            Tag to watch{" "}
            <span className="font-normal text-muted-foreground">
              (actions with this tag move it)
            </span>
          </label>
          <input
            id="wizard-tag"
            value={goalTag}
            onChange={(e) => setGoalTag(e.target.value)}
            placeholder="fitness"
            className="h-9 rounded-lg border bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <Button
            aria-label="Continue to action step"
            variant="default"
            size="lg"
            isDisabled={!goalTitle.trim()}
            type="submit"
          >
            Next <ArrowRight aria-hidden className="size-4" />
          </Button>
        </form>
      ) : null}

      {step === 3 ? (
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!actionTitle.trim()) return;
            finish();
          }}
        >
          <p className="text-sm text-muted-foreground">
            One action to start.{" "}
            {actionIsHabit ? "Daily habit —" : "One-off task —"} tags connect it
            to “{goalTitle}”.
          </p>
          <div
            role="radiogroup"
            aria-label="Action type"
            className="flex gap-2"
          >
            {(["habit", "task"] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                role="radio"
                aria-checked={actionIsHabit === (kind === "habit")}
                onClick={() => setActionIsHabit(kind === "habit")}
                className={cn(
                  "flex-1 rounded-xl border p-3 text-center text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  actionIsHabit === (kind === "habit")
                    ? "border-primary bg-primary/10"
                    : "hover:bg-muted/50",
                )}
              >
                {kind === "habit" ? "Recurring habit" : "One-off task"}
              </button>
            ))}
          </div>
          <label htmlFor="wizard-action" className="text-sm font-medium">
            {actionIsHabit ? "Daily habit" : "Task"} title
          </label>
          <input
            id="wizard-action"
            value={actionTitle}
            onChange={(e) => setActionTitle(e.target.value)}
            placeholder={actionIsHabit ? "Morning run" : "Book race entry"}
            className="h-9 rounded-lg border bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <Button
            variant="default"
            size="lg"
            isDisabled={!actionTitle.trim()}
            type="submit"
          >
            Begin your {modeCopy.campaign.toLowerCase()}
          </Button>
        </form>
      ) : null}
    </section>
  );
}
