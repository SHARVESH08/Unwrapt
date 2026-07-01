import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { makeRng } from "../../game/shuffle";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

const GRID = 11;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIRS = [
  [0, 1], // →
  [1, 0], // ↓
  [1, 1], // ↘
  [-1, 1], // ↗
];

interface Built {
  grid: string[][];
  words: string[];
}

function buildBoard(words: string[], rng: () => number): Built {
  const grid: (string | null)[][] = Array.from({ length: GRID }, () =>
    Array<string | null>(GRID).fill(null),
  );

  const place = (word: string): boolean => {
    for (let attempt = 0; attempt < 200; attempt++) {
      const w = rng() < 0.5 ? word : word.split("").reverse().join("");
      const [dr, dc] = DIRS[Math.floor(rng() * DIRS.length)];
      const r0 = Math.floor(rng() * GRID);
      const c0 = Math.floor(rng() * GRID);
      const rEnd = r0 + dr * (w.length - 1);
      const cEnd = c0 + dc * (w.length - 1);
      if (rEnd < 0 || rEnd >= GRID || cEnd < 0 || cEnd >= GRID) continue;
      let ok = true;
      for (let i = 0; i < w.length; i++) {
        const cell = grid[r0 + dr * i][c0 + dc * i];
        if (cell !== null && cell !== w[i]) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      for (let i = 0; i < w.length; i++) {
        grid[r0 + dr * i][c0 + dc * i] = w[i];
      }
      return true;
    }
    return false;
  };

  const placed: string[] = [];
  for (const raw of words) {
    const word = raw.toUpperCase().replace(/[^A-Z]/g, "");
    if (place(word)) placed.push(word);
  }

  // Fill the gaps with random letters.
  const full: string[][] = grid.map((row) =>
    row.map((c) => c ?? ALPHABET[Math.floor(rng() * 26)]),
  );

  return { grid: full, words: placed };
}

function lineBetween(
  a: [number, number],
  b: [number, number],
): [number, number][] | null {
  const dr = b[0] - a[0];
  const dc = b[1] - a[1];
  const isLine =
    dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc);
  if (!isLine) return null;
  const len = Math.max(Math.abs(dr), Math.abs(dc));
  const sr = Math.sign(dr);
  const sc = Math.sign(dc);
  const cells: [number, number][] = [];
  for (let i = 0; i <= len; i++) {
    cells.push([a[0] + sr * i, a[1] + sc * i]);
  }
  return cells;
}

/* Word search. Click the first and last letter of a word to select it. The set
 * of words she'll love is highlighted as each one is found. */
export function WordSearch({
  words,
  seed,
  onComplete,
}: {
  words: string[];
  seed: number;
  onComplete: () => void;
}) {
  const { grid, words: placed } = useMemo(
    () => buildBoard(words, makeRng(seed + 31)),
    [words, seed],
  );

  const [start, setStart] = useState<[number, number] | null>(null);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [foundCells, setFoundCells] = useState<Set<string>>(new Set());

  const key = (r: number, c: number) => `${r},${c}`;
  const allFound = found.size === placed.length;

  const clickCell = (r: number, c: number) => {
    if (allFound) return;
    if (!start) {
      setStart([r, c]);
      return;
    }
    const cells = lineBetween(start, [r, c]);
    setStart(null);
    if (!cells) return;
    const word = cells.map(([rr, cc]) => grid[rr][cc]).join("");
    const rev = word.split("").reverse().join("");
    const hit = placed.find(
      (w) => (w === word || w === rev) && !found.has(w),
    );
    if (hit) {
      setFound((f) => new Set(f).add(hit));
      setFoundCells((fc) => {
        const n = new Set(fc);
        cells.forEach(([rr, cc]) => n.add(key(rr, cc)));
        return n;
      });
    }
  };

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-6 text-center">
      <h2 className="font-display text-3xl text-text">
        Find the words hidden just for you
      </h2>

      <div className="flex flex-wrap justify-center gap-2">
        {placed.map((w) => (
          <span
            key={w}
            className={cn(
              "flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors",
              found.has(w)
                ? "border-accent bg-accent text-surface line-through"
                : "border-border bg-surface/70 text-text-soft",
            )}
          >
            {found.has(w) && <Check size={14} />}
            {w}
          </span>
        ))}
      </div>

      <div
        className="grid select-none gap-1 rounded-2xl border border-border bg-surface/60 p-3"
        style={{ gridTemplateColumns: `repeat(${GRID}, minmax(0, 1fr))` }}
      >
        {grid.map((row, r) =>
          row.map((ch, c) => {
            const isFound = foundCells.has(key(r, c));
            const isStart = start && start[0] === r && start[1] === c;
            return (
              <button
                key={key(r, c)}
                onClick={() => clickCell(r, c)}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-md font-body text-sm font-semibold uppercase transition-colors",
                  isFound
                    ? "bg-accent text-surface"
                    : isStart
                      ? "bg-accent-2 text-surface"
                      : "text-text hover:bg-bg-soft",
                )}
              >
                {ch}
              </button>
            );
          }),
        )}
      </div>

      {allFound && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4"
        >
          <p className="font-display text-xl italic text-accent">
            Found them all — clever you ✨
          </p>
          <Button size="lg" onClick={onComplete}>
            Continue
          </Button>
        </motion.div>
      )}
    </div>
  );
}
