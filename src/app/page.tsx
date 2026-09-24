import Link from "next/link";

import { CopyButton } from "@/components/copy-button";
import { LinkButton } from "@/components/ui/button";
import {
  ArrowUpRight,
  Beaker,
  BookOpen,
  Check,
  Code2,
  FolderTree,
  GitBranch,
  Layers,
  Palette,
  ShieldCheck,
  Terminal,
  Zap,
} from "lucide-react";

/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- scrollable code blocks and tables must be keyboard-accessible per axe scrollable-region-focusable */
// ─────────────────────────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────────────────────────

function AnchorHeading({
  id,
  level = 2,
  children,
  eyebrow,
}: {
  id: string;
  level?: 2 | 3;
  children: React.ReactNode;
  eyebrow?: string;
}) {
  const Tag = level === 3 ? "h3" : "h2";
  return (
    <div>
      {eyebrow ? (
        <p className="mb-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          {eyebrow}
        </p>
      ) : null}
      <Tag
        id={`${id}-heading`}
        className="text-2xl font-semibold tracking-tight text-balance sm:text-[1.7rem]"
      >
        <a href={`#${id}`} className="no-underline hover:underline">
          {children}
        </a>
      </Tag>
    </div>
  );
}

function Section({
  id,
  children,
  className,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-heading` : undefined}
      className={className}
    >
      {children}
    </section>
  );
}

function CodeInline({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md border bg-muted px-1.5 py-0.5 font-mono text-[0.85em] font-medium text-foreground">
      {children}
    </code>
  );
}

function Pre({
  code,
  lang = "bash",
  copyLabel,
}: {
  code: string;
  lang?: string;
  copyLabel?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border bg-zinc-950">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-2">
        <span className="text-xs font-medium tracking-wide text-zinc-400">
          {lang}
        </span>
        <CopyButton
          text={code}
          label={copyLabel ?? `Copy ${lang} code`}
          className="size-6 border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
        />
      </div>
      <pre
        tabIndex={0}
        aria-label={`${lang} code`}
        className="overflow-x-auto p-4 text-[13px] leading-6 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
      >
        <code className="font-mono text-zinc-100">{code}</code>
      </pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// page
// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans">
      {/* skip link */}
      <a
        href="#main"
        className="sr-only z-[100] focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
      >
        Skip to content
      </a>

      {/* ── header ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-semibold tracking-tight"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG logo is vector; next/image optimization not beneficial */}
            <img
              src="/next.svg"
              alt=""
              width={100}
              height={20}
              className="dark:invert"
              aria-hidden="true"
            />
            <span className="text-sm">
              next-starter{" "}
              <span className="font-normal text-muted-foreground">/ guide</span>
            </span>
            <span className="hidden rounded-full border bg-muted px-2 py-0.5 text-[11px] font-medium tracking-widest text-foreground uppercase sm:inline-flex">
              Next 16 · React 19
            </span>
          </Link>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 text-sm md:flex"
          >
            <a
              href="#philosophy"
              className="rounded-md px-2.5 py-1.5 hover:bg-muted"
            >
              Philosophy
            </a>
            <a
              href="#structure"
              className="rounded-md px-2.5 py-1.5 hover:bg-muted"
            >
              Structure
            </a>
            <a
              href="#scripts"
              className="rounded-md px-2.5 py-1.5 hover:bg-muted"
            >
              Scripts
            </a>
            <a
              href="#testing"
              className="rounded-md px-2.5 py-1.5 hover:bg-muted"
            >
              Testing
            </a>
            <a
              href="#accessibility"
              className="rounded-md px-2.5 py-1.5 hover:bg-muted"
            >
              A11y
            </a>
            <a
              href="#customize"
              className="rounded-md px-2.5 py-1.5 hover:bg-muted"
            >
              Customize
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <LinkButton
              href="https://github.com/JohnPevien/next-starter"
              target="_blank"
              rel="noreferrer"
              variant="outline"
              size="sm"
              aria-label="Open GitHub repository (opens in new tab)"
            >
              GitHub{" "}
              <ArrowUpRight
                className="ml-1 size-3.5 opacity-70"
                aria-hidden="true"
              />
            </LinkButton>
            <LinkButton
              href="#quick-start"
              size="sm"
              className="hidden sm:inline-flex"
            >
              Get started
            </LinkButton>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-6xl px-6">
        {/* ── hero — homage to create-next-app scaffold ─────────────────── */}
        <section
          aria-labelledby="hero-heading"
          className="relative mt-6 overflow-hidden rounded-[28px] border bg-card sm:mt-8"
        >
          {/* subtle grid */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,theme(colors.border)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.border)_1px,transparent_1px)] [mask-image:linear-gradient(to_bottom,black_40%,transparent_90%)] bg-[size:32px_32px] opacity-[0.18]"
          />
          <div className="relative flex flex-col gap-8 px-6 py-10 sm:px-10 sm:py-12 lg:flex-row lg:items-center lg:justify-between lg:px-12 lg:py-14">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs font-medium">
                <span
                  className="size-1.5 rounded-full bg-emerald-500"
                  aria-hidden="true"
                />
                Opinionated · Production-ready · Clone & ship
              </div>
              <div className="mb-4 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- SVG logo */}
                <img
                  src="/next.svg"
                  alt="Next.js"
                  width={92}
                  height={18}
                  className="dark:invert"
                />
                <span className="text-sm text-muted-foreground">
                  plus React 19 · Tailwind 4 · shadcn
                </span>
              </div>

              <h1
                id="hero-heading"
                className="max-w-xl text-3xl leading-[1.05] font-semibold tracking-tight text-pretty sm:text-4xl lg:text-[2.6rem]"
              >
                To get started, edit{" "}
                <code className="rounded-lg border bg-muted px-2 py-1 font-mono text-[0.9em]">
                  src/app/page.tsx
                </code>
              </h1>

              <p className="mt-4 max-w-xl text-[15px] leading-7 text-pretty text-muted-foreground sm:text-base">
                <strong className="font-medium text-foreground">
                  Next Starter
                </strong>{" "}
                is not a demo. Linting, formatting, type safety, accessibility,
                unit + E2E testing and Git hooks are already wired — so you can
                focus on product, not config.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <LinkButton
                  href="#quick-start"
                  size="lg"
                  className="rounded-full"
                >
                  Quick start{" "}
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </LinkButton>
                <LinkButton
                  href="#structure"
                  variant="outline"
                  size="lg"
                  className="rounded-full"
                >
                  Explore structure
                </LinkButton>
                <LinkButton
                  href="https://nextjs.org/docs"
                  target="_blank"
                  rel="noreferrer"
                  variant="ghost"
                  size="lg"
                  className="rounded-full"
                >
                  Next.js docs{" "}
                  <ArrowUpRight
                    className="size-4 opacity-60"
                    aria-hidden="true"
                  />
                </LinkButton>
              </div>

              <div className="mt-6 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1">
                  <Check
                    className="size-3.5 text-emerald-600"
                    aria-hidden="true"
                  />{" "}
                  pnpm 11.6
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1">
                  <Check
                    className="size-3.5 text-emerald-600"
                    aria-hidden="true"
                  />{" "}
                  Node 20+
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1">
                  <Check
                    className="size-3.5 text-emerald-600"
                    aria-hidden="true"
                  />{" "}
                  Turbopack + React Compiler
                </span>
              </div>
            </div>

            {/* code card — homage to “edit page.tsx” scaffold */}
            <div className="w-full max-w-[420px] shrink-0">
              <div className="rounded-2xl border bg-zinc-950 p-4 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5" aria-hidden="true">
                    <span className="size-3 rounded-full bg-red-500/80" />
                    <span className="size-3 rounded-full bg-yellow-500/80" />
                    <span className="size-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[11px] text-zinc-300">
                    pnpm
                  </span>
                </div>
                <Pre
                  lang="bash"
                  copyLabel="Copy quick start commands"
                  code={`git clone https://github.com/JohnPevien/next-starter.git
cd next-starter
pnpm install
pnpm exec playwright install
pnpm dev  # → http://127.0.0.1:3000`}
                />
                <p className="mt-3 text-xs leading-5 text-zinc-400">
                  Dev server uses <CodeInline>http://127.0.0.1:3000</CodeInline>{" "}
                  (see <CodeInline>playwright.config.ts</CodeInline> &{" "}
                  <CodeInline>next.config.ts → allowedDevOrigins</CodeInline>).
                </p>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl border bg-card p-3">
                  <div className="font-mono text-sm font-semibold">16.3.1</div>
                  <div className="text-muted-foreground">Next</div>
                </div>
                <div className="rounded-xl border bg-card p-3">
                  <div className="font-mono text-sm font-semibold">19.2.8</div>
                  <div className="text-muted-foreground">React</div>
                </div>
                <div className="rounded-xl border bg-card p-3">
                  <div className="font-mono text-sm font-semibold">v4</div>
                  <div className="text-muted-foreground">Tailwind</div>
                </div>
              </div>
            </div>
          </div>

          {/* bottom bar */}
          <div className="flex flex-wrap items-center gap-3 border-t bg-muted/40 px-6 py-3 text-xs sm:px-10">
            <span className="font-medium">Included:</span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5" aria-hidden="true" /> jsx-a11y
              31 rules
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Beaker className="size-3.5" aria-hidden="true" /> Vitest +
              Playwright + axe
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="inline-flex items-center gap-1.5">
              <GitBranch className="size-3.5" aria-hidden="true" /> Husky
              pre-commit / pre-push
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Palette className="size-3.5" aria-hidden="true" /> shadcn
              aria-nova · neutral
            </span>
          </div>
        </section>

        {/* ── table of contents + intro ─────────────────────────────────── */}
        <div className="mt-10 grid gap-8 lg:grid-cols-[220px_1fr] lg:gap-10">
          <nav
            aria-label="On this page"
            className="sticky top-[72px] hidden h-fit rounded-xl border bg-card p-4 lg:block"
          >
            <p className="mb-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              On this page
            </p>
            <ol className="space-y-1.5 text-sm">
              {[
                ["philosophy", "Philosophy"],
                ["quick-start", "Quick start"],
                ["structure", "Project structure"],
                ["scripts", "Scripts"],
                ["styling", "Styling & components"],
                ["quality", "Code quality"],
                ["testing", "Testing"],
                ["hooks", "Git hooks"],
                ["accessibility", "Accessibility"],
                ["customize", "Customization"],
                ["deploy", "Deploy"],
              ].map(([id, label]) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="block rounded-md px-2 py-1 hover:bg-muted"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ol>
            <div className="mt-4 rounded-lg bg-muted p-3 text-xs leading-5">
              <p className="font-medium">New to App Router?</p>
              <p className="text-zinc-700 dark:text-zinc-300">
                Folder = route, <CodeInline>page.tsx</CodeInline> = UI,{" "}
                <CodeInline>layout.tsx</CodeInline> = shared shell.
              </p>
            </div>
          </nav>

          <div className="min-w-0 space-y-16">
            {/* ── philosophy ───────────────────────────────────────────── */}
            <Section id="philosophy" className="scroll-mt-24">
              <AnchorHeading id="philosophy" eyebrow="Why this starter exists">
                Philosophy
              </AnchorHeading>
              <p className="mt-3 max-w-prose leading-7 text-pretty text-muted-foreground">
                Starter kits should remove decisions you’ll remake anyway — not
                add ones you’ll rip out. This one is{" "}
                <strong className="font-medium text-foreground">
                  opinionated but boring
                </strong>
                : one way to lint, one way to test, one way to ship. No build
                dashboards, no extra abstractions.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  {
                    icon: Zap,
                    title: "Correctness first, then maintainability",
                    body: "typecheck + tests block push. Lint + a11y errors fail, not warn. You can’t ignore the safety net.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Accessibility is a requirement",
                    body: "jsx-a11y (31 rules, error), axe + Playwright, and accessible Testing Library queries — not optional enhancements.",
                  },
                  {
                    icon: Beaker,
                    title: "Test behavior, not implementation",
                    desc: "getByRole → userEvent → toBeInTheDocument. If a test needs getByTestId, the UI needs a better role or label.",
                  },
                  {
                    icon: Code2,
                    title: "TDD by default",
                    body: "Red → Green → Refactor (AGENTS.md). Write the smallest failing test, confirm it fails for the right reason, then make it pass.",
                  },
                ].map((c) => (
                  <div key={c.title} className="rounded-xl border bg-card p-5">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      <span className="inline-flex size-8 items-center justify-center rounded-lg border bg-muted">
                        <c.icon className="size-4" aria-hidden="true" />
                      </span>
                      {c.title}
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {c.body ?? c.desc}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-xl border bg-muted/40 p-4 text-sm leading-6">
                <p className="font-medium">
                  Design taste: delete weightless code, refuse needless
                  abstractions.
                </p>
                <p className="text-muted-foreground">
                  Prefer boring APIs, single-file updates over new files, and
                  semantic HTML before ARIA. <CodeInline>AGENTS.md</CodeInline>{" "}
                  encodes this for agents and humans — the TDD and
                  query-priority rules are load-bearing, not suggestions.
                </p>
              </div>
            </Section>

            {/* ── quick start ──────────────────────────────────────────── */}
            <Section id="quick-start" className="scroll-mt-24">
              <AnchorHeading id="quick-start" eyebrow="Clone → install → dev">
                Quick start
              </AnchorHeading>

              <div className="mt-4 grid gap-4">
                <Pre
                  code={`# 1. Clone (or Use this template)
git clone https://github.com/JohnPevien/next-starter.git
cd next-starter

# 2. Install — pnpm 11.6+ and Node 20+ required
pnpm install

# 3. Playwright browsers (first run only)
pnpm exec playwright install

# 4. Dev — Turbopack + React Compiler
pnpm dev
# → http://127.0.0.1:3000  — edit src/app/page.tsx`}
                />

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      k: "Verify",
                      code: "pnpm lint\npnpm typecheck\npnpm test:run\npnpm test:e2e:chromium",
                    },
                    {
                      k: "All browsers",
                      code: "pnpm test:e2e\n# chromium · firefox · webkit",
                    },
                    {
                      k: "A11y only",
                      code: "pnpm test:a11y\n# axe on rendered DOM",
                    },
                  ].map((b) => (
                    <div key={b.k} className="rounded-xl border bg-card p-4">
                      <div className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                        {b.k}
                      </div>
                      <pre className="mt-2 font-mono text-xs leading-5 whitespace-pre-wrap">
                        {b.code}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            {/* ── structure ─────────────────────────────────────────────── */}
            <Section id="structure" className="scroll-mt-24">
              <AnchorHeading id="structure" eyebrow="Where things live">
                Project structure
              </AnchorHeading>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                <CodeInline>src/app</CodeInline> is the App Router. Every folder
                is a route. Start at <CodeInline>src/app/page.tsx</CodeInline>{" "}
                (this page) and <CodeInline>src/app/layout.tsx</CodeInline>{" "}
                (fonts, html lang, global shell).
              </p>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="overflow-hidden rounded-xl border bg-card">
                  <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-2 text-xs font-medium">
                    <FolderTree className="size-4" aria-hidden="true" />{" "}
                    Repository
                  </div>
                  <pre
                    tabIndex={0}
                    aria-label="Repository file tree"
                    className="overflow-x-auto p-4 font-mono text-xs leading-5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
                  >
                    {`. 
├── src/
│   ├── app/
│   │   ├── layout.tsx       # <html lang="en">, Geist fonts, metadata
│   │   ├── page.tsx         # "/" — this guide (replace with your product)
│   │   ├── globals.css      # Tailwind 4 + shadcn tokens (+ .dark)
│   │   └── favicon.ico
│   ├── components/
│   │   ├── ui/button.tsx    # shadcn + react-aria-components + cva
│   │   └── copy-button.tsx  # clipboard helper (this page)
│   ├── lib/utils.ts         # cn() — clsx + tailwind-merge
│   └── __tests__/
│       └── testing-setup.test.tsx
├── e2e/
│   ├── home.spec.ts         # smoke: page.goto("/") → body visible
│   └── a11y.spec.ts         # @a11y — AxeBuilder().analyze()
├── docs/                    # delete after you’re up to speed
│   ├── testing.md
│   ├── accessibility.md
│   ├── git-hooks.md
│   └── README.md
├── public/                  # /next.svg, /vercel.svg, /globe.svg …
├── playwright.config.ts     # 127.0.0.1:3000, 3 projects, webServer: pnpm dev
├── vitest.config.mts        # jsdom, vite-tsconfig-paths, @/* alias
├── vitest.setup.ts          # jest-dom/vitest
├── eslint.config.mjs        # Next + TS + jsx-a11y (31 rules error)
├── lint-staged.config.mjs   # staged: eslint --fix + prettier --write
├── components.json          # shadcn — style aria-nova, neutral, @/* aliases
├── next.config.ts           # reactCompiler: true, allowedDevOrigins
├── tsconfig.json            # strict, bundler, @/* → ./src/*
└── postcss.config.mjs       # @tailwindcss/postcss`}
                  </pre>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border bg-card p-4">
                    <h3 className="text-sm font-semibold">
                      Where do I put things?
                    </h3>
                    <dl className="mt-3 space-y-2.5 text-sm">
                      <div>
                        <dt className="font-medium">New page</dt>
                        <dd className="text-muted-foreground">
                          <CodeInline>src/app/about/page.tsx</CodeInline> →{" "}
                          <CodeInline>/about</CodeInline>
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium">New component</dt>
                        <dd className="text-muted-foreground">
                          <CodeInline>src/components/my-card.tsx</CodeInline> or{" "}
                          <CodeInline>src/components/ui/*</CodeInline> +{" "}
                          <CodeInline>
                            pnpm dlx shadcn@latest add dialog
                          </CodeInline>
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium">New utility</dt>
                        <dd className="text-muted-foreground">
                          <CodeInline>src/lib/*</CodeInline> → import via{" "}
                          <CodeInline>@/lib/utils</CodeInline>
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium">New unit test</dt>
                        <dd className="text-muted-foreground">
                          <CodeInline>src/components/foo.test.tsx</CodeInline> —
                          use <CodeInline>getByRole</CodeInline> +{" "}
                          <CodeInline>userEvent</CodeInline>
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium">New E2E test</dt>
                        <dd className="text-muted-foreground">
                          <CodeInline>e2e/checkout.spec.ts</CodeInline> — copy{" "}
                          <CodeInline>e2e/home.spec.ts</CodeInline>
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium">Static asset</dt>
                        <dd className="text-muted-foreground">
                          <CodeInline>public/logo.svg</CodeInline> →{" "}
                          <CodeInline>/logo.svg</CodeInline>
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-xl border bg-muted/40 p-4 text-sm leading-6">
                    <p className="font-medium">Path alias</p>
                    <p className="text-muted-foreground">
                      <CodeInline>
                        import {"{ Button }"} from
                        &quot;@/components/ui/button&quot;
                      </CodeInline>{" "}
                      works everywhere via{" "}
                      <CodeInline>tsconfig.json → @/*</CodeInline>.
                    </p>
                  </div>

                  <div className="rounded-xl border bg-card p-4 text-sm leading-6">
                    <p className="font-medium">Delete what you don’t need</p>
                    <p className="text-muted-foreground">
                      <CodeInline>docs/</CodeInline> is learning material only.
                      Your app runs without it — keep or delete after
                      onboarding.
                    </p>
                  </div>
                </div>
              </div>
            </Section>

            {/* ── scripts ───────────────────────────────────────────────── */}
            <Section id="scripts" className="scroll-mt-24">
              <AnchorHeading id="scripts" eyebrow="One command per task">
                Scripts
              </AnchorHeading>

              <div className="mt-4 overflow-hidden rounded-xl border bg-card">
                <div
                  tabIndex={0}
                  role="region"
                  aria-label="Scripts table"
                  className="overflow-x-auto focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
                >
                  <table className="w-full text-left text-sm">
                    <caption className="sr-only">
                      Available pnpm scripts
                    </caption>
                    <thead className="bg-muted/50 text-xs tracking-widest text-muted-foreground uppercase">
                      <tr>
                        <th scope="col" className="px-4 py-3 font-medium">
                          Command
                        </th>
                        <th scope="col" className="px-4 py-3 font-medium">
                          What it does
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {[
                        [
                          "pnpm dev",
                          "Next dev with Turbopack + React Compiler at http://127.0.0.1:3000",
                        ],
                        [
                          "pnpm build",
                          "Production build (route types + optimization)",
                        ],
                        ["pnpm start", "Serve production build on :3000"],
                        [
                          "pnpm lint",
                          "ESLint — Next core-web-vitals + TS + jsx-a11y (fails on a11y)",
                        ],
                        [
                          "pnpm lint:staged",
                          "lint-staged — same ESLint + Prettier on staged files only",
                        ],
                        [
                          "pnpm typecheck",
                          "next typegen && tsc --noEmit — route-aware, fast, hook-friendly",
                        ],
                        [
                          "pnpm format",
                          "Prettier write — also sorts Tailwind classes via globals.css",
                        ],
                        ["pnpm format:check", "Prettier check (CI)"],
                        ["pnpm test", "Vitest watch — interactive, jsdom"],
                        ["pnpm test:run", "Vitest run once — pre-push + CI"],
                        [
                          "pnpm test:e2e",
                          "Playwright — chromium + firefox + webkit (6 tests)",
                        ],
                        [
                          "pnpm test:e2e:chromium",
                          "Fast everyday E2E — Chromium only",
                        ],
                        [
                          "pnpm test:e2e:ui",
                          "Playwright UI mode — watch + time travel",
                        ],
                        [
                          "pnpm test:e2e:headed",
                          "Playwright headed — see the browser",
                        ],
                        [
                          "pnpm test:a11y",
                          "axe on rendered DOM — @a11y tagged specs only",
                        ],
                      ].map(([cmd, desc]) => (
                        <tr key={cmd} className="hover:bg-muted/40">
                          <th
                            scope="row"
                            className="px-4 py-2.5 font-mono text-xs font-medium whitespace-nowrap"
                          >
                            {cmd}
                          </th>
                          <td className="px-4 py-2.5 leading-6 text-muted-foreground">
                            {desc}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="border-t bg-muted/30 px-4 py-2.5 text-xs leading-5 text-muted-foreground">
                  <CodeInline>pnpm prepare</CodeInline> runs{" "}
                  <CodeInline>husky</CodeInline> on install so hooks work after
                  clone.
                </div>
              </div>
            </Section>

            {/* ── styling ───────────────────────────────────────────────── */}
            <Section id="styling" className="scroll-mt-24">
              <AnchorHeading id="styling" eyebrow="Tailwind 4 + shadcn">
                Styling & components
              </AnchorHeading>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border bg-card p-5">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <Palette className="size-4" aria-hidden="true" /> Tokens in
                    globals.css
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Design variables live in{" "}
                    <CodeInline>src/app/globals.css</CodeInline> — light in{" "}
                    <CodeInline>:root</CodeInline>, dark in{" "}
                    <CodeInline>.dark</CodeInline>. Change{" "}
                    <CodeInline>--primary</CodeInline> or{" "}
                    <CodeInline>--radius</CodeInline> and the whole system
                    updates via <CodeInline>@theme inline</CodeInline>.
                  </p>
                  <Pre
                    lang="css"
                    code={`@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";`}
                  />
                </div>

                <div className="rounded-xl border bg-card p-5">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <Layers className="size-4" aria-hidden="true" /> shadcn —
                    you own the code
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    <CodeInline>components.json</CodeInline>: style{" "}
                    <CodeInline>aria-nova</CodeInline>, base{" "}
                    <CodeInline>neutral</CodeInline>, aliases{" "}
                    <CodeInline>@/components</CodeInline>. Add primitives with
                    the CLI — they’re copied into your repo, not a dependency.
                  </p>
                  <Pre code="pnpm dlx shadcn@latest add dialog" lang="bash" />
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Variants via <CodeInline>cva</CodeInline> in{" "}
                    <CodeInline>src/components/ui/button.tsx</CodeInline>:{" "}
                    <CodeInline>
                      {'<Button variant="outline" size="lg">'}
                    </CodeInline>
                    . Merge with{" "}
                    <CodeInline>{'cn("px-2 px-4") // → "px-4"'}</CodeInline>{" "}
                    from <CodeInline>@/lib/utils</CodeInline>.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border bg-card px-3 py-1">
                  Icons: <CodeInline>lucide-react</CodeInline>
                </span>
                <span className="rounded-full border bg-card px-3 py-1">
                  Headless a11y: <CodeInline>react-aria-components</CodeInline>
                </span>
                <span className="rounded-full border bg-card px-3 py-1">
                  Fonts: <CodeInline>next/font — Geist / Geist Mono</CodeInline>
                </span>
              </div>
            </Section>

            {/* ── quality ───────────────────────────────────────────────── */}
            <Section id="quality" className="scroll-mt-24">
              <AnchorHeading id="quality" eyebrow="Fail loudly, fix quickly">
                Code quality
              </AnchorHeading>

              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl border bg-card p-5">
                  <h3 className="text-sm font-semibold">ESLint</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    <CodeInline>eslint.config.mjs</CodeInline> — layers:
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-5 text-muted-foreground">
                    <li>
                      <CodeInline>next/core-web-vitals</CodeInline>
                    </li>
                    <li>
                      <CodeInline>next/typescript</CodeInline>
                    </li>
                    <li>
                      <CodeInline>jsx-a11y/recommended</CodeInline> — 31 rules
                      as <CodeInline>error</CodeInline> (Next only enables ~6 as
                      warnings)
                    </li>
                    <li>
                      <CodeInline>eslint-config-prettier</CodeInline> last
                    </li>
                  </ul>
                  <Pre code="pnpm lint         # check\npnpm lint --fix   # autofix" />
                </div>

                <div className="rounded-xl border bg-card p-5">
                  <h3 className="text-sm font-semibold">Prettier</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    <CodeInline>.prettierrc</CodeInline> +{" "}
                    <CodeInline>prettier-plugin-tailwindcss</CodeInline>{" "}
                    (stylesheet: <CodeInline>globals.css</CodeInline>).
                  </p>
                  <Pre
                    code={`pnpm format        # write\npnpm format:check # CI`}
                  />
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Tailwind classes are auto-sorted — e.g.{" "}
                    <CodeInline>flex min-h-full</CodeInline> in that order,
                    deterministically.
                  </p>
                </div>

                <div className="rounded-xl border bg-card p-5">
                  <h3 className="text-sm font-semibold">Type safety</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    <CodeInline>pnpm typecheck</CodeInline> →{" "}
                    <CodeInline>next typegen</CodeInline> +{" "}
                    <CodeInline>tsc --noEmit</CodeInline>. Catches both plain TS
                    and route-aware Next errors without a full{" "}
                    <CodeInline>next build</CodeInline>.
                  </p>
                  <Pre
                    code={`pnpm typecheck\n# try: const x: number = "hello" → fails`}
                  />
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Why not <CodeInline>build</CodeInline> in pre-push? Too slow
                    — you’d bypass it.
                  </p>
                </div>
              </div>
            </Section>

            {/* ── testing ───────────────────────────────────────────────── */}
            <Section id="testing" className="scroll-mt-24">
              <AnchorHeading id="testing" eyebrow="TDD is the workflow">
                Testing
              </AnchorHeading>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 dark:border-amber-900 dark:bg-amber-950/30">
                <p className="font-medium text-amber-950 dark:text-amber-100">
                  AGENTS.md → Red-Green-Refactor
                </p>
                <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-zinc-700 dark:text-zinc-300">
                  <li>Write the smallest failing test first</li>
                  <li>Run it — confirm it fails for the expected reason</li>
                  <li>Implement the minimum to make it pass</li>
                  <li>
                    Refactor only after green, then lint + typecheck + tests
                  </li>
                </ol>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border bg-card p-5">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <Beaker className="size-4" aria-hidden="true" /> Unit —
                    Vitest + Testing Library
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    <CodeInline>vitest.config.mts</CodeInline>:{" "}
                    <CodeInline>jsdom</CodeInline>,{" "}
                    <CodeInline>vite-tsconfig-paths</CodeInline>,{" "}
                    <CodeInline>@vitejs/plugin-react</CodeInline>, include{" "}
                    <CodeInline>src/**/*</CodeInline> (excludes{" "}
                    <CodeInline>e2e/</CodeInline>). Setup:{" "}
                    <CodeInline>vitest.setup.ts</CodeInline> →{" "}
                    <CodeInline>jest-dom/vitest</CodeInline>
                  </p>
                  <div className="mt-3 rounded-lg border bg-muted/40 p-3">
                    <p className="text-xs font-medium">
                      Query priority (AGENTS.md)
                    </p>
                    <ol className="mt-1 list-decimal pl-5 font-mono text-xs leading-5">
                      <li>getByRole</li>
                      <li>getByLabelText</li>
                      <li>getByText</li>
                      <li>other semantic queries</li>
                    </ol>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      Use <CodeInline>getByTestId</CodeInline> only when no
                      semantic query exists. Use{" "}
                      <CodeInline>userEvent.setup()</CodeInline>, not{" "}
                      <CodeInline>fireEvent</CodeInline>.
                    </p>
                  </div>
                  <Pre
                    lang="tsx"
                    code={`test("supports accessible user interaction", async () => {
  const user = userEvent.setup();
  render(<Example />);
  const email = screen.getByRole("textbox", { name: "Email" });
  await user.type(email, "john@example.com");
  expect(email).toHaveValue("john@example.com");
});`}
                  />
                </div>

                <div className="rounded-xl border bg-card p-5">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <Terminal className="size-4" aria-hidden="true" /> E2E —
                    Playwright + axe
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    <CodeInline>playwright.config.ts</CodeInline>:{" "}
                    <CodeInline>testDir: ./e2e</CodeInline>,{" "}
                    <CodeInline>baseURL: 127.0.0.1:3000</CodeInline>,{" "}
                    <CodeInline>webServer: pnpm dev</CodeInline>, projects{" "}
                    <CodeInline>chromium</CodeInline> ·{" "}
                    <CodeInline>firefox</CodeInline> ·{" "}
                    <CodeInline>webkit</CodeInline>,{" "}
                    <CodeInline>trace: on-first-retry</CodeInline>.
                  </p>
                  <Pre
                    lang="tsx"
                    code={`// e2e/home.spec.ts — smoke
test("homepage loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
});

// e2e/a11y.spec.ts — axe on rendered DOM
test("homepage has no detectable a11y violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});`}
                  />
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Reports gitignored:{" "}
                    <CodeInline>/playwright-report</CodeInline>,{" "}
                    <CodeInline>/test-results</CodeInline>,{" "}
                    <CodeInline>/playwright/.cache</CodeInline>.
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border bg-muted/40 p-4 text-xs leading-6">
                <p className="font-medium">Server Components?</p>
                <p className="text-muted-foreground">
                  Vitest can’t reliably test async Server Components — test
                  those via Playwright in <CodeInline>e2e/</CodeInline>. Client
                  components, hooks and utils are ideal for Vitest.
                </p>
              </div>
            </Section>

            {/* ── hooks ─────────────────────────────────────────────────── */}
            <Section id="hooks" className="scroll-mt-24">
              <AnchorHeading id="hooks" eyebrow="Fast feedback, never heavy">
                Git hooks
              </AnchorHeading>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border bg-card p-5">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <GitBranch className="size-4" aria-hidden="true" />{" "}
                    pre-commit
                  </h3>
                  <p className="mt-1 font-mono text-xs">
                    Husky → <CodeInline>lint-staged</CodeInline>
                  </p>
                  <Pre
                    code={`# .husky/pre-commit
pnpm exec lint-staged

# lint-staged.config.mjs
"**/*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"]
"**/*.{json,css,md,mdx,yml,yaml}": "prettier --write"`}
                  />
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Only staged files. ESLint+Prettier run sequentially for{" "}
                    <CodeInline>js/ts</CodeInline> to avoid concurrent edits.
                    Fixes formatting, blocks on unfixable{" "}
                    <CodeInline>jsx-a11y</CodeInline>.
                  </p>
                </div>

                <div className="rounded-xl border bg-card p-5">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <GitBranch className="size-4" aria-hidden="true" /> pre-push
                  </h3>
                  <p className="mt-1 font-mono text-xs">
                    Husky → typecheck + tests
                  </p>
                  <Pre
                    code={`# .husky/pre-push
pnpm typecheck
pnpm test:run`}
                  />
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Blocks push on TS errors or failing Vitest. Heavy work
                    (lint, Prettier check, full Playwright, build) stays in CI —
                    pre-push must stay fast.
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border bg-card px-3 py-1 font-mono">
                  pnpm lint:staged
                </span>
                <span className="text-muted-foreground">
                  debug pre-commit without committing
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="rounded-full border bg-card px-3 py-1 font-mono">
                  pnpm typecheck
                </span>
                <span className="text-muted-foreground">
                  debug pre-push (first half)
                </span>
              </div>
            </Section>

            {/* ── accessibility ─────────────────────────────────────────── */}
            <Section id="accessibility" className="scroll-mt-24">
              <AnchorHeading id="accessibility" eyebrow="A11y is a requirement">
                Accessibility — 5-layer stack
              </AnchorHeading>

              <div className="mt-4 overflow-hidden rounded-xl border bg-card">
                <div
                  tabIndex={0}
                  role="region"
                  aria-label="Accessibility layers table"
                  className="overflow-x-auto focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
                >
                  <table className="w-full text-left text-sm">
                    <caption className="sr-only">Accessibility layers</caption>
                    <thead className="bg-muted/50 text-xs tracking-widest text-muted-foreground uppercase">
                      <tr>
                        <th scope="col" className="px-4 py-2.5">
                          Layer
                        </th>
                        <th scope="col" className="px-4 py-2.5">
                          Tool
                        </th>
                        <th scope="col" className="px-4 py-2.5">
                          When
                        </th>
                        <th scope="col" className="px-4 py-2.5">
                          Run
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-xs">
                      <tr>
                        <td className="px-4 py-2.5 font-medium">1. Source</td>
                        <td className="px-4 py-2.5">
                          eslint-plugin-jsx-a11y (31 rules, error)
                        </td>
                        <td className="px-4 py-2.5">on save / CI</td>
                        <td className="px-4 py-2.5 font-mono">pnpm lint</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-medium">2. Unit</td>
                        <td className="px-4 py-2.5">
                          Vitest + getByRole + userEvent
                        </td>
                        <td className="px-4 py-2.5">on save / pre-push / CI</td>
                        <td className="px-4 py-2.5 font-mono">pnpm test</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-medium">3. E2E</td>
                        <td className="px-4 py-2.5">
                          Playwright + @axe-core/playwright
                        </td>
                        <td className="px-4 py-2.5">CI + locally</td>
                        <td className="px-4 py-2.5 font-mono">
                          pnpm test:a11y
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-medium">4. Inspect</td>
                        <td className="px-4 py-2.5">axe DevTools, a11y tree</td>
                        <td className="px-4 py-2.5">during dev</td>
                        <td className="px-4 py-2.5">manual</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-medium">5. Manual</td>
                        <td className="px-4 py-2.5">
                          keyboard, screen reader, zoom
                        </td>
                        <td className="px-4 py-2.5">before ship</td>
                        <td className="px-4 py-2.5">manual</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-amber-200 bg-amber-50 px-4 py-2.5 text-xs leading-5 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                  Automated axe catches ~30–50% of issues. Layers 4–5 are still
                  required. This starter uses{" "}
                  <CodeInline>@axe-core/playwright</CodeInline> (OSS, no
                  license) — not{" "}
                  <CodeInline>@axe-devtools/playwright</CodeInline>.
                </div>
              </div>

              <div className="mt-4 rounded-xl border bg-card p-4">
                <h3 className="text-sm font-semibold">When you build UI</h3>
                <ul className="mt-2 grid gap-1.5 text-sm leading-6 text-muted-foreground sm:grid-cols-2">
                  <li className="flex gap-2">
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-emerald-600"
                      aria-hidden="true"
                    />
                    Prefer semantic HTML before adding ARIA
                  </li>
                  <li className="flex gap-2">
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-emerald-600"
                      aria-hidden="true"
                    />
                    Keyboard accessible, with visible focus
                  </li>
                  <li className="flex gap-2">
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-emerald-600"
                      aria-hidden="true"
                    />
                    Controls have accessible names (label / aria-label)
                  </li>
                  <li className="flex gap-2">
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-emerald-600"
                      aria-hidden="true"
                    />
                    Form fields have associated labels
                  </li>
                  <li className="flex gap-2">
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-emerald-600"
                      aria-hidden="true"
                    />
                    Focus management for dialogs/menus/popovers
                  </li>
                  <li className="flex gap-2">
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-emerald-600"
                      aria-hidden="true"
                    />
                    Never suppress a11y lint without a documented reason
                  </li>
                </ul>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <a
                  href="https://chrome.google.com/webstore/detail/axe-devtools-web-accessib/lhdoppojpmngadmnindnejefpokejbdd"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border px-3 py-1 hover:bg-muted"
                >
                  axe DevTools extension{" "}
                  <ArrowUpRight
                    className="size-3.5 opacity-60"
                    aria-hidden="true"
                  />
                </a>
                <span className="inline-flex items-center rounded-full border px-3 py-1">
                  Chrome DevTools → Elements → Accessibility
                </span>
                <span className="inline-flex items-center rounded-full border px-3 py-1">
                  VoiceOver / NVDA spot-check
                </span>
              </div>
            </Section>

            {/* ── customize ─────────────────────────────────────────────── */}
            <Section id="customize" className="scroll-mt-24">
              <AnchorHeading id="customize" eyebrow="Make it yours">
                Customization checklist
              </AnchorHeading>

              <div className="mt-4 rounded-xl border bg-card p-5">
                <p className="text-sm leading-6 text-muted-foreground">
                  Clone for a new product? Run through this — then delete this
                  page and write your real homepage.
                </p>
                <ul className="mt-4 grid gap-2">
                  {[
                    {
                      label: "Update metadata",
                      detail: "src/app/layout.tsx → title, description, lang",
                    },
                    {
                      label: "Replace this page",
                      detail: "src/app/page.tsx — your product’s homepage",
                    },
                    {
                      label: "Tune design tokens",
                      detail:
                        "src/app/globals.css → --primary, --radius, --chart-* …",
                    },
                    {
                      label: "Pick shadcn style",
                      detail:
                        "components.json → style / baseColor (currently aria-nova · neutral)",
                    },
                    {
                      label: "Update README",
                      detail:
                        "Top section — project name + purpose (replace Next Starter intro)",
                    },
                    {
                      label: "Decide on React Compiler",
                      detail:
                        "next.config.ts → reactCompiler: true — set false if you don’t want it",
                    },
                    {
                      label: "Delete docs/ if you want",
                      detail:
                        "docs/ is learning material only — safe to remove after onboarding",
                    },
                  ].map((item) => (
                    <li
                      key={item.label}
                      className="flex gap-3 rounded-lg border bg-muted/20 px-3 py-2.5"
                    >
                      <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border bg-background">
                        <Check className="size-3" aria-hidden="true" />
                      </span>
                      <span className="text-sm">
                        <span className="font-medium">{item.label}</span>{" "}
                        <span className="text-muted-foreground">
                          — {item.detail}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Section>

            {/* ── deploy ────────────────────────────────────────────────── */}
            <Section id="deploy" className="scroll-mt-24">
              <AnchorHeading id="deploy" eyebrow="Ship it">
                Deploy
              </AnchorHeading>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border bg-card p-5">
                  <h3 className="text-sm font-semibold">
                    Vercel (recommended)
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Creators of Next.js. Connect the repo and deploy — or click
                    deploy.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <LinkButton
                      href="https://vercel.com/new?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
                      target="_blank"
                      rel="noreferrer"
                      size="sm"
                    >
                      Deploy to Vercel{" "}
                      <ArrowUpRight className="size-3.5" aria-hidden="true" />
                    </LinkButton>
                  </div>
                </div>
                <div className="rounded-xl border bg-card p-5">
                  <h3 className="text-sm font-semibold">Anywhere else</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Any platform that runs{" "}
                    <CodeInline>pnpm build &amp;&amp; pnpm start</CodeInline>{" "}
                    works. Verify locally first:
                  </p>
                  <Pre code="pnpm build  # static + type check\npnpm start  # :3000 prod" />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-2 border-t pt-6 text-xs text-muted-foreground">
                <span>Learn more:</span>
                <a
                  href="https://nextjs.org/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  Next.js Docs
                </a>
                <span>·</span>
                <a
                  href="https://nextjs.org/learn"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  Learn Next.js
                </a>
                <span>·</span>
                <a
                  href="https://tailwindcss.com/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  Tailwind
                </a>
                <span>·</span>
                <a
                  href="https://ui.shadcn.com/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  shadcn/ui
                </a>
                <span>·</span>
                <a
                  href="https://react-spectrum.adobe.com/react-aria/components.html"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  React Aria
                </a>
                <span>·</span>
                <a
                  href="https://playwright.dev/docs/intro"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  Playwright
                </a>
              </div>
            </Section>

            {/* footer */}
            <footer className="border-t pt-8 text-xs leading-6 text-muted-foreground">
              <p>
                Bootstrapped with <CodeInline>create-next-app</CodeInline> and
                evolved with accessibility, quality and DX as first-class
                concerns. Edit <CodeInline>src/app/page.tsx</CodeInline> to
                replace this guide with your product. Keep{" "}
                <CodeInline>AGENTS.md</CodeInline> — it’s load-bearing for
                agents.
              </p>
              <p className="mt-3 flex items-center gap-2">
                <BookOpen className="size-3.5" aria-hidden="true" /> Docs in{" "}
                <CodeInline>docs/</CodeInline>:{" "}
                <Link href="/#" className="hover:underline">
                  testing
                </Link>{" "}
                ·{" "}
                <Link href="/#" className="hover:underline">
                  accessibility
                </Link>{" "}
                ·{" "}
                <Link href="/#" className="hover:underline">
                  git-hooks
                </Link>
              </p>
            </footer>
          </div>
        </div>

        {/* bottom spacer */}
        <div aria-hidden="true" className="h-10" />
      </main>
    </div>
  );
}
