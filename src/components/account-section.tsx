"use client";

// Account settings — export, permanent deletion (typed DELETE, ADR:
// deliberate not hidden), plus the disclaimer's permanent home.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2 } from "lucide-react";

import { deleteAccount, exportPlayerData } from "@/app/account-actions";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

export function AccountSection() {
  const [, startTransition] = useTransition();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [exported, setExported] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function downloadExport() {
    startTransition(async () => {
      const data = await exportPlayerData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `habiquest-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExported(
        `Exported ${data.goals.length} goals, ${data.habits.length} habits.`,
      );
    });
  }

  function destroy() {
    setError(null);
    startTransition(async () => {
      try {
        await deleteAccount({ confirmationToken: token });
        await authClient.signOut();
        router.push("/");
        router.refresh();
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Deletion failed. Try again.",
        );
      }
    });
  }

  return (
    <section aria-labelledby="account-h" className="space-y-4">
      <h2 id="account-h" className="text-lg font-semibold">
        Account
      </h2>

      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm font-medium">Export your data</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Everything you own, as JSON — goals, habits, history, tasks.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onPress={downloadExport}
        >
          <Download aria-hidden className="size-3.5" /> Download export
        </Button>
        {exported ? (
          <p className="mt-2 text-xs text-primary">{exported}</p>
        ) : null}
      </div>

      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm font-medium text-destructive">Delete account</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Permanently removes your account, goals, habits, and full history.
          This cannot be undone. Type{" "}
          <span className="font-mono font-semibold">DELETE</span> to confirm.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <label htmlFor="delete-token" className="sr-only">
            Type DELETE to confirm permanent deletion
          </label>
          <input
            id="delete-token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="DELETE"
            autoComplete="off"
            className="h-8 w-32 rounded-lg border bg-input/30 px-2.5 font-mono text-sm uppercase outline-none focus-visible:border-destructive focus-visible:ring-3 focus-visible:ring-destructive/20"
          />
          <Button
            variant="destructive"
            size="sm"
            isDisabled={token !== "DELETE"}
            onPress={destroy}
          >
            <Trash2 aria-hidden className="size-3.5" /> Delete permanently
          </Button>
        </div>
        {error ? (
          <p role="alert" className="mt-2 text-xs text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        HabiquesT — all worlds, names, and characters are original and not
        affiliated with any game, anime, or franchise. This is a personal
        productivity tool, not medical or mental-health treatment. Your data is
        visible only to you.
      </p>
    </section>
  );
}
