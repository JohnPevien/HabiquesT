import * as React from "react";

import { cn } from "@/lib/utils";
import { CopyButton } from "./copy-button";

export function CodeBlock({
  code,
  lang = "bash",
  className,
  showCopy = true,
}: {
  code: string;
  lang?: string;
  className?: string;
  showCopy?: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-zinc-950",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-2">
        <span className="text-xs font-medium tracking-wide text-zinc-400">
          {lang}
        </span>
        {showCopy ? (
          <CopyButton
            text={code}
            label={`Copy ${lang} code`}
            className="size-6 border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
          />
        ) : null}
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-6">
        <code className="font-mono text-zinc-100">{code}</code>
      </pre>
    </div>
  );
}

export function InlineCode({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <code
      className={cn(
        "rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-[0.85em] font-medium text-zinc-100 dark:bg-zinc-800",
        "border border-zinc-800 dark:border-zinc-700",
        className,
      )}
    >
      {children}
    </code>
  );
}
