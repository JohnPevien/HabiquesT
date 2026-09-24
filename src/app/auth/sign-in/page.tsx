"use client";

// Sign-in: Google OAuth + email magic link (ADR: Google and magic link).
// Runs before the wizard so onboarding choices sync immediately.

import { useState } from "react";
import { KeyRound, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function signInWithGoogle() {
    setPending(true);
    setError(null);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    });
    if (error) {
      setPending(false);
      setError(error.message ?? "Google sign-in failed. Try again.");
    }
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { error } = await authClient.signIn.emailOtp({
      email,
      callbackURL: "/",
    });
    setPending(false);
    if (error) {
      setError(error.message ?? "Could not send the link. Try again.");
    } else {
      setSent(true);
    }
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-6 px-6 py-16">
      <header className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
          HabiquesT
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Enter the game</h1>
        <p className="text-sm text-muted-foreground">
          One account, every device. Your world syncs instantly.
        </p>
      </header>

      <Button
        variant="outline"
        size="lg"
        onPress={signInWithGoogle}
        isDisabled={pending}
      >
        <KeyRound aria-hidden className="size-4" /> Continue with Google
      </Button>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span aria-hidden className="h-px flex-1 bg-border" />
        or
        <span aria-hidden className="h-px flex-1 bg-border" />
      </div>

      {sent ? (
        <p className="rounded-xl border bg-card p-4 text-sm">
          Magic link sent to <span className="font-medium">{email}</span>. Check
          your inbox.
        </p>
      ) : (
        <form onSubmit={sendMagicLink} className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-9 rounded-lg border bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <button
            type="submit"
            disabled={pending || !email.trim()}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-all outline-none hover:bg-primary/80 disabled:pointer-events-none disabled:opacity-50"
          >
            <Mail aria-hidden className="size-4" /> Send magic link
          </button>
        </form>
      )}

      {error ? (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <p className="text-xs text-muted-foreground">
        By continuing you agree that your progress lives in your account. All
        worlds are original; HabiquesT is not medical advice.
      </p>
    </main>
  );
}
