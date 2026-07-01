import { motion } from "motion/react";

/* Animated text reveal: each word floats up and fades in, one after another.
 * (Self-contained equivalent of an animated-text effect.) */
export function RevealText({
  text,
  className,
  delay = 0,
  stagger = 0.08,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ y: "0.5em", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: delay + i * stagger,
            duration: 0.6,
            ease: "easeOut",
          }}
        >
          {w}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </span>
  );
}

/* Slowly shimmering gradient sweeping across large display text. Defaults to the
 * chapter's gold/accent colours; pass `gradient` for a custom one. */
export function ShimmerText({
  children,
  className,
  gradient,
}: {
  children: React.ReactNode;
  className?: string;
  gradient?: string;
}) {
  return (
    <span
      className={className}
      style={{
        backgroundImage:
          gradient ??
          "linear-gradient(110deg, var(--c-accent) 20%, var(--c-accent-2) 40%, #fff6d8 50%, var(--c-accent-2) 60%, var(--c-accent) 80%)",
        backgroundSize: "200% 100%",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        animation: "shimmer-text 5s linear infinite",
      }}
    >
      {children}
      <style>{`@keyframes shimmer-text{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </span>
  );
}
