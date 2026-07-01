import { motion } from "motion/react";

/* A slow, dreamy aurora made of drifting blurred colour blobs that read from
 * the active chapter palette. Sits behind everything as ambient atmosphere.
 * (A self-contained equivalent of the showy gradient backgrounds.) */
export function AuroraBackground() {
  const blobs = [
    { className: "bg-accent", x: ["-10%", "15%", "-10%"], y: ["-5%", "20%", "-5%"], size: "42vw", delay: 0 },
    { className: "bg-accent-2", x: ["70%", "55%", "70%"], y: ["10%", "35%", "10%"], size: "38vw", delay: 2 },
    { className: "bg-accent", x: ["30%", "45%", "30%"], y: ["60%", "45%", "60%"], size: "46vw", delay: 4 },
  ];

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="scene-backdrop absolute inset-0" />
      {/* Slow, breathing aurora mesh adds depth behind the drifting blobs. */}
      <div className="aurora-mesh opacity-50" />
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-3xl opacity-25 ${b.className}`}
          style={{ width: b.size, height: b.size }}
          initial={{ left: b.x[0], top: b.y[0] }}
          animate={{ left: b.x, top: b.y }}
          transition={{
            duration: 22,
            delay: b.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
