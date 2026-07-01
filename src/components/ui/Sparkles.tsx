import { useMemo } from "react";
import { motion } from "motion/react";

/* A scatter of gently twinkling sparkles. Decorative; sits above the backdrop
 * but below content. (Self-contained equivalent of a particle/sparkle effect.) */
export function Sparkles({ count = 28 }: { count?: number }) {
  const dots = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 2 + Math.random() * 4,
        delay: Math.random() * 4,
        duration: 2.5 + Math.random() * 3,
      })),
    [count],
  );

  return (
    <div className="pointer-events-none fixed inset-0 -z-[5] overflow-hidden">
      {dots.map((d) => (
        <motion.span
          key={d.id}
          className="absolute rounded-full bg-accent"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: d.size,
            height: d.size,
            boxShadow: "0 0 8px 1px var(--c-glow)",
          }}
          animate={{ opacity: [0, 0.9, 0], scale: [0.4, 1, 0.4] }}
          transition={{
            duration: d.duration,
            delay: d.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
