/* The signature element: the "how it works" demo held inside a gilded, glowing
 * keepsake frame — as if you're peeking into a gift. Shows a poster + play
 * button; on play it loads the real <video>. Degrades gracefully when no video
 * file is present yet (drop one at public/assets/how-it-works.mp4). */

import { useState } from "react";
import { motion } from "motion/react";
import { Play } from "lucide-react";

const VIDEO_SRC = "/assets/how-it-works.mp4";
const POSTER_SRC = "/assets/how-it-works-poster.jpg";

export function HowItWorksVideo() {
  const [playing, setPlaying] = useState(false);
  const [posterOk, setPosterOk] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.9, ease: "easeOut" }}
      className="relative mx-auto w-full max-w-3xl"
    >
      {/* Gilded glow frame. */}
      <div className="relative rounded-[1.75rem] bg-gradient-to-br from-[#e6b422]/70 via-[#ff9ec4]/40 to-[#c9a3ff]/50 p-[2px] shadow-[0_30px_120px_-30px_rgba(230,180,34,0.45)]">
        <div className="relative aspect-video overflow-hidden rounded-[1.65rem] bg-[#0d0610]">
          {playing ? (
            <video
              className="h-full w-full object-cover"
              src={VIDEO_SRC}
              poster={posterOk ? POSTER_SRC : undefined}
              controls
              autoPlay
              playsInline
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="group absolute inset-0 flex flex-col items-center justify-center"
              aria-label="Play the demo"
            >
              {/* Poster (falls back to an aurora wash if the image is absent). */}
              {posterOk ? (
                <img
                  src={POSTER_SRC}
                  alt=""
                  onError={() => setPosterOk(false)}
                  className="absolute inset-0 h-full w-full object-cover opacity-80"
                />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_30%_20%,#3a1230_0%,#160a16_55%,#0a0510_100%)]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0610] via-transparent to-transparent" />

              {/* Play button. */}
              <motion.span
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.96 }}
                className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#f6e7d9] text-[#1a0a14] shadow-[0_0_40px_rgba(255,158,196,0.6)]"
              >
                <Play size={30} fill="currentColor" className="ml-1" />
                <span className="absolute -z-10 h-full w-full animate-ping rounded-full bg-[#ff9ec4]/30" />
              </motion.span>
              <span className="relative mt-5 font-body text-sm uppercase tracking-[0.3em] text-[#f6e7d9]/85">
                Watch how it works
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Little frame caption, like a keepsake plaque. */}
      <p className="mt-4 text-center font-display text-lg italic text-[#e9c9b6]/70">
        A two-minute peek inside a finished gift.
      </p>
    </motion.div>
  );
}
