import { useState } from "react";
import { motion } from "motion/react";
import { Camera } from "lucide-react";
import { cn } from "../../lib/utils";

/* The signature photo container.
 *
 * The frame sizes itself to the photo: the image shows at its natural size and
 * only scales down — keeping its shape — if it would exceed `maxClass`. So small
 * and large, portrait and landscape photos all look right, with the background
 * still visible around them. Until the photo loads (or if one is missing) a
 * pretty glowing placeholder is shown. */
export function GlowFrame({
  src,
  alt,
  maxClass = "max-h-[60vh] max-w-[85vw]",
  className,
  vignette = false,
  rounded = "rounded-3xl",
}: {
  src: string;
  alt: string;
  maxClass?: string;
  className?: string;
  vignette?: boolean;
  rounded?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const filename = decodeURIComponent(src.split("/").pop() ?? src);
  const ok = src !== "" && !failed;

  return (
    <div
      className={cn(
        "relative inline-flex min-h-[12rem] min-w-[12rem] items-center justify-center overflow-hidden border border-border bg-surface soft-pulse",
        rounded,
        className,
      )}
    >
      {/* The real photo drives the frame's size. */}
      {ok && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            "block h-auto w-auto object-contain transition-opacity duration-700",
            maxClass,
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      )}

      {/* Placeholder while the photo loads, or if it's missing. */}
      {(!ok || !loaded) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-bg-soft to-surface text-center">
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            className="text-accent"
          >
            <Camera size={42} strokeWidth={1.4} />
          </motion.div>
          {!ok && (
            <span className="px-4 font-body text-xs uppercase tracking-[0.2em] text-text-soft">
              {filename}
            </span>
          )}
        </div>
      )}

      {/* Shimmer sweep across the frame. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="shimmer-sweep absolute -inset-y-4 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      </div>

      {vignette && (
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_40px_rgba(0,0,0,0.45)]" />
      )}
    </div>
  );
}
