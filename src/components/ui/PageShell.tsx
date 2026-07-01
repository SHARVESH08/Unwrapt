/* Shared container for the giver-facing pages (receive / dashboard / builder).
 * Wrapping in `.app-shell` applies the bright, modern site identity — distinct
 * from the dreamy chapter palettes the recipient plays inside. */

import { useEffect } from "react";

export function PageShell({
  children,
  wide = false,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  // The player tints <html> per chapter; reset so nothing bleeds into the shell.
  useEffect(() => {
    document.documentElement.setAttribute("data-round", "1");
  }, []);

  return (
    <div className="app-shell relative min-h-[100dvh] w-full overflow-x-hidden">
      {/* Soft plasma ambient wash — quiet, not the player's full aurora. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(60% 50% at 85% -10%, var(--c-glow) 0%, transparent 60%), radial-gradient(50% 40% at 0% 110%, color-mix(in srgb, var(--c-accent-2) 40%, transparent) 0%, transparent 55%)",
        }}
      />
      <div className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center px-6 py-16">
        <div className={wide ? "w-full max-w-3xl" : "w-full max-w-md"}>
          {children}
        </div>
      </div>
    </div>
  );
}
