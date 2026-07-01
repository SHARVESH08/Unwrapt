import { motion } from "motion/react";
import { Volume2, VolumeX } from "lucide-react";

/* Always-visible mute/unmute control in the top corner. */
export function SoundToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.button
      onClick={onToggle}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.92 }}
      aria-label={enabled ? "Mute sound" : "Unmute sound"}
      className="fixed right-6 top-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface/70 text-text-soft backdrop-blur-md transition-colors hover:text-accent"
    >
      {enabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
    </motion.button>
  );
}
