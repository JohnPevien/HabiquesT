"use client";

// Calendar review panel (ADR: review and correct days). Shows the last
// 28 days per habit as a heatmap — the non-punitive trend layer — and lets
// the player correct today plus the previous two closed days. Older days
// lock. This is a review surface, not a scheduling product.
import { useMemo, useState, useTransition } from "react";
import { Check, Moon } from "lucide-react";

import { setOccurrence, setRest } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { correctionWindowDates } from "@/lib/local-time";
import type { Effort, Occurrence, Schedule } from "@/lib/engine";
import { cn } from "@/lib/utils";

export interface CalendarHabit {
  id: string;
  title: string;
  effort: Effort;
  schedule: Schedule;
}

export interface CalendarPanelProps {
  habits: CalendarHabit[];
  occurrences: Occurrence[];
  timezone: string;
  /** Day keys present in the visible grid — server computes with today's date. */
  dayKeys: string[];
  todayKey: string;
}

export function CalendarPanel({
  habits,
  occurrences,
  timezone,
  dayKeys,
  todayKey,
}: CalendarPanelProps) {
  const [, startTransition] = useTransition();
  const [selectedDay, setSelectedDay] = useState<string>(todayKey);

  // Editable = today + previous two closed days, in the player's timezone.
  const editableDays = useMemo(
    () => new Set(correctionWindowDates(new Date(), timezone)),
    [timezone],
  );

  const occByHabitAndDate = useMemo(() => {
    const map = new Map<string, Occurrence>();
    for (const o of occurrences) map.set(`${o.habitId}:${o.date}`, o);
    return map;
  }, [occurrences]);

  const selectedOccs = habits.map((habit) => ({
    habit,
    occ: occByHabitAndDate.get(`${habit.id}:${selectedDay}`) ?? null,
  }));

  if (habits.length === 0) return null;

  return (
    <section aria-labelledby="calendar-h" className="mb-10">
      <h2 id="calendar-h" className="mb-3 text-lg font-semibold">
        Last 28 days
      </h2>

      {/* Heatmap — the 28-day non-punitive trend (ADR: momentum horizon) */}
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-y-1 text-xs">
          <caption className="sr-only">
            Habit adherence over the last 28 days. Green: met. Amber: partial.
            Red: missed. Blue: rest day. Select a recent day to correct it.
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="w-40 min-w-32 text-left font-medium text-muted-foreground"
              >
                Habit
              </th>
              <th scope="colgroup" className="sr-only">
                Last 28 days
              </th>
            </tr>
          </thead>
          <tbody>
            {habits.map((habit) => (
              <tr key={habit.id}>
                <th
                  scope="row"
                  className="max-w-40 truncate pr-3 text-left font-normal"
                >
                  {habit.title}
                </th>
                <td>
                  <div className="flex gap-0.5">
                    {dayKeys.map((dayKey) => {
                      const occ =
                        occByHabitAndDate.get(`${habit.id}:${dayKey}`) ?? null;
                      const state = cellState(occ, dayKey, todayKey);
                      const editable = editableDays.has(dayKey);
                      const isToday = dayKey === todayKey;
                      return (
                        <button
                          key={dayKey}
                          type="button"
                          aria-label={`${habit.title} — ${dayKey}${state.label ? `: ${state.label}` : ""}${editable ? " (editable)" : ""}`}
                          onClick={() => editable && setSelectedDay(dayKey)}
                          disabled={!editable}
                          className={cn(
                            "size-3.5 shrink-0 rounded-[4px] border border-transparent outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                            state.className,
                            editable && "cursor-pointer hover:scale-110",
                            isToday && "ring-2 ring-ring/60",
                          )}
                        />
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Day detail + correction */}
      <div className="mt-4 rounded-xl border bg-card p-4">
        <p className="mb-2 text-sm font-medium">
          {selectedDay === todayKey ? "Today" : selectedDay}
          {!editableDays.has(selectedDay) ? " — locked" : ""}
        </p>
        <ul className="grid gap-2">
          {selectedOccs.map(({ habit, occ }) => {
            const met = occ?.metCount ?? 0;
            const rest = occ?.isRest ?? false;
            const editable = editableDays.has(selectedDay);
            return (
              <li key={habit.id} className="flex items-center gap-3 text-sm">
                <span className="min-w-0 flex-1 truncate">{habit.title}</span>
                <span
                  className={cn(
                    "text-xs",
                    rest && "text-primary",
                    !rest && met > 0 && "text-primary",
                    !rest && occ && met === 0 && "text-destructive",
                    !occ && "text-muted-foreground",
                  )}
                >
                  {rest ? "Rest" : occ ? (met > 0 ? "Done" : "Missed") : "—"}
                </span>
                {editable ? (
                  <span className="flex items-center gap-1">
                    <Button
                      aria-label={`${met > 0 ? "Undo" : "Mark"} ${habit.title} on ${selectedDay}`}
                      variant="ghost"
                      size="icon-sm"
                      onPress={() =>
                        startTransition(async () => {
                          const next = met > 0 ? 0 : 1;
                          await setOccurrence({
                            habitId: habit.id,
                            date: selectedDay,
                            metCount: next,
                          });
                        })
                      }
                    >
                      <Check aria-hidden className="size-3.5" />
                    </Button>
                    <Button
                      aria-label={`Mark ${habit.title} as rest on ${selectedDay}`}
                      variant="ghost"
                      size="icon-sm"
                      onPress={() =>
                        startTransition(async () => {
                          await setRest({
                            habitId: habit.id,
                            date: selectedDay,
                          });
                        })
                      }
                    >
                      <Moon aria-hidden className="size-3.5" />
                    </Button>
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
        {!editableDays.has(selectedDay) ? (
          <p className="mt-3 text-xs text-muted-foreground">
            History locks after two days — the score is honest about what
            actually happened.
          </p>
        ) : null}
      </div>
    </section>
  );
}

/** Heatmap cell styling per occurrence state. */
function cellState(
  occ: Occurrence | null,
  dayKey: string,
  todayKey: string,
): { className: string; label: string } {
  if (dayKey > todayKey) return { className: "bg-muted/40", label: "" };
  if (!occ) return { className: "bg-muted", label: "not scheduled" };
  if (occ.isRest) return { className: "bg-primary/30", label: "rest day" };
  if (occ.metCount === null)
    return {
      className: "bg-muted/60",
      label: dayKey === todayKey ? "pending today" : "open",
    };
  if (occ.metCount === 0)
    return { className: "bg-destructive/60", label: "missed" };
  if (occ.metCount >= occ.targetCount)
    return { className: "bg-primary/70", label: "done" };
  return { className: "bg-primary/40", label: "partially done" };
}
