/* Ambient, occasion-themed surprises that pop in from the sides, drift, and
 * fade — a birthday cake here, a rose there. Purely decorative: a fixed,
 * pointer-events-none overlay that never blocks the activities. Toggled by the
 * gift's `settings.surprises`. */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Occasion } from "../types/gift";

const SETS: Record<Occasion, string[]> = {
  birthday: ["🎂", "🕯️", "🎈", "🎉", "🧁", "🎁", "🎀"],
  anniversary: ["💍", "🥂", "🌹", "❤️", "💞", "🕊️", "💐"],
  proposal: ["💍", "❤️", "🌹", "💐", "💝", "✨", "💖"],
  justBecause: ["✨", "🌟", "☀️", "🌸", "🍀", "🦋", "🌈"],
  custom: ["✨", "🎈", "⭐", "🌸", "🎊", "💫"],
};

type Item = {
  id: number;
  emoji: string;
  side: "left" | "right";
  top: number;
  size: number;
};

let nextId = 0;

export function OccasionSurprises({
  occasion,
  active,
  customEmojis,
  contained = false,
  rate = 1,
}: {
  occasion: Occasion;
  active: boolean;
  /** Extra emojis to mix in with the occasion set. */
  customEmojis?: string[];
  /** Render absolutely within a parent box instead of fixed full-screen. */
  contained?: boolean;
  /** Spawn-rate multiplier (preview uses a faster rate). */
  rate?: number;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const customKey = (customEmojis ?? []).join("");

  useEffect(() => {
    if (!active) return;
    const extra = (customEmojis ?? []).map((e) => e.trim()).filter(Boolean);
    const emojis = [...(SETS[occasion] ?? SETS.custom), ...extra];
    let alive = true;
    let timer = 0;

    const spawn = () => {
      if (!alive) return;
      const id = nextId++;
      const item: Item = {
        id,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        side: Math.random() < 0.5 ? "left" : "right",
        top: 12 + Math.random() * 66,
        size: 30 + Math.random() * 26,
      };
      setItems((s) => [...s.slice(-6), item]); // keep at most a handful on screen
      window.setTimeout(() => {
        if (alive) setItems((s) => s.filter((i) => i.id !== id));
      }, 3800);
      timer = window.setTimeout(spawn, (1400 + Math.random() * 2000) / rate);
    };

    timer = window.setTimeout(spawn, 700 / rate);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [active, occasion, customKey, rate]);

  return (
    <div
      className={`pointer-events-none overflow-hidden ${
        contained ? "absolute inset-0" : "fixed inset-0 z-30"
      }`}
    >
      <AnimatePresence>
        {items.map((it) => (
          <motion.div
            key={it.id}
            initial={{ opacity: 0, x: it.side === "left" ? -70 : 70, scale: 0.5 }}
            animate={{
              opacity: [0, 1, 1, 0],
              x:
                it.side === "left"
                  ? [-70, 12, 12, -24]
                  : [70, -12, -12, 24],
              y: [0, -14, -24, -38],
              scale: [0.5, 1, 1, 0.85],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3.8, times: [0, 0.18, 0.7, 1], ease: "easeInOut" }}
            style={
              {
                top: `${it.top}%`,
                [it.side]: "2%",
                fontSize: it.size,
              } as React.CSSProperties
            }
            className="absolute select-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
          >
            {it.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
