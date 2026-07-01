/* The hero's centrepiece: the exact flat 2D gift from the palette chooser, a
 * `linear-gradient(150deg, accent, accent2)` square with a white ribbon cross
 * and a dark round knot at the centre. The knot is a draggable handle: slide it
 * down to the end and the lid lifts off, a beam of light rises, and confetti
 * bursts out of the box. Double-click to close it again. Pure CSS + GSAP
 * (Draggable) + canvas-confetti, no WebGL. Colours are palette tokens. */

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { useReducedMotion } from "motion/react";
import confetti from "canvas-confetti";

gsap.registerPlugin(useGSAP, Draggable);

const GRADIENT = "linear-gradient(150deg, var(--c-accent), var(--c-accent-2))";
const RIBBON = "rgba(255,255,255,0.85)";
const INTERIOR = "#160a22";
const LID_PCT = 34; // lid covers the top 34% of the square

export function GiftBox2D() {
  const box = useRef<HTMLDivElement>(null);
  const lid = useRef<HTMLDivElement>(null);
  const beam = useRef<HTMLDivElement>(null);
  const heart = useRef<HTMLDivElement>(null);
  const knot = useRef<HTMLButtonElement>(null);
  const drag = useRef<Draggable | null>(null);
  const opened = useRef(false);
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  // Confetti fired from the box's real on-screen position.
  const popConfetti = () => {
    const el = box.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const origin = {
      x: (r.left + r.width / 2) / window.innerWidth,
      y: (r.top + r.height * 0.28) / window.innerHeight,
    };
    const colors = ["#d96bff", "#5b8cff", "#ff9ec9", "#ffd479", "#f6efff"];
    confetti({ particleCount: 110, spread: 90, startVelocity: 44, origin, colors, scalar: 1.05, ticks: 220 });
    confetti({ particleCount: 40, spread: 120, startVelocity: 30, decay: 0.92, scalar: 0.9, origin, colors });
  };

  const liftPx = () => (box.current?.clientHeight ?? 320) * 0.42;
  const trackPx = () => (box.current?.clientHeight ?? 320) * 0.5;

  const setProgress = (p: number) => {
    gsap.set(lid.current, { y: -p * liftPx(), rotate: -p * 7 });
    gsap.set(beam.current, { scaleY: Math.max(0.001, p), autoAlpha: p * 0.55 });
  };

  const openBox = () => {
    if (opened.current) return;
    opened.current = true;
    setOpen(true);
    if (reduce) {
      popConfetti();
      return;
    }
    const lift = liftPx();
    gsap.killTweensOf([lid.current, beam.current, heart.current, knot.current]);
    gsap
      .timeline()
      .to(lid.current, { y: -lift, rotate: -9, duration: 0.5, ease: "back.out(1.7)" }, 0)
      .to(beam.current, { autoAlpha: 0.6, scaleY: 1, duration: 0.5, ease: "power2.out" }, 0)
      .to(knot.current, { autoAlpha: 0, duration: 0.3 }, 0)
      .fromTo(heart.current, { y: 0, scale: 0.3, autoAlpha: 0 }, { y: -lift * 1.15, scale: 1.1, autoAlpha: 1, duration: 0.7, ease: "back.out(1.4)" }, 0.18)
      .add(popConfetti, 0.4)
      // gentle floating heart + hovering lid while it stays open
      .to(heart.current, { y: "-=12", rotation: 6, duration: 1.9, ease: "sine.inOut", repeat: -1, yoyo: true }, 0.9)
      .to(lid.current, { y: -lift * 0.92, duration: 1.5, ease: "sine.inOut", repeat: -1, yoyo: true }, 0.9);
  };

  const resetBox = () => {
    if (!opened.current) return;
    opened.current = false;
    setOpen(false);
    if (reduce) return;
    gsap.killTweensOf([lid.current, heart.current]);
    gsap
      .timeline()
      .to(lid.current, { y: 0, rotate: 0, duration: 0.45, ease: "power3.inOut" })
      .to(heart.current, { y: 0, scale: 0, autoAlpha: 0, rotation: 0, duration: 0.35 }, "<")
      .to(beam.current, { autoAlpha: 0, scaleY: 0, duration: 0.3 }, "<")
      .to(knot.current, { autoAlpha: 1, y: 0, duration: 0.4, onUpdate: () => drag.current?.update() }, "<");
  };

  useGSAP(
    () => {
      gsap.set(beam.current, { scaleY: 0, autoAlpha: 0, transformOrigin: "50% 100%" });
      gsap.set(heart.current, { y: 0, scale: 0, autoAlpha: 0, transformOrigin: "50% 50%" });
      if (reduce) return;

      gsap.to(box.current, { y: -10, duration: 2.4, ease: "sine.inOut", repeat: -1, yoyo: true });

      drag.current = Draggable.create(knot.current, {
        type: "y",
        bounds: { minY: 0, maxY: trackPx() },
        cursor: "grab",
        activeCursor: "grabbing",
        onDrag(this: Draggable) {
          if (opened.current) return;
          setProgress(this.y / trackPx());
        },
        onDragEnd(this: Draggable) {
          if (opened.current) return;
          const p = this.y / trackPx();
          if (p > 0.7) {
            openBox();
          } else {
            gsap.to(this.target, { y: 0, duration: 0.4, ease: "power2.out", onUpdate: () => this.update() });
            const proxy = { v: p };
            gsap.to(proxy, { v: 0, duration: 0.4, ease: "power2.out", onUpdate: () => setProgress(proxy.v) });
          }
        },
      })[0];
    },
    { scope: box, dependencies: [reduce] },
  );

  const onClick = () => {
    if (!reduce) return;
    opened.current ? resetBox() : openBox();
  };
  const onDoubleClick = () => {
    if (reduce) return;
    resetBox();
  };

  return (
    <div className="flex h-[clamp(280px,38vw,460px)] w-full items-center justify-center select-none">
      <div
        ref={box}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        className="relative aspect-square w-[min(74%,340px)]"
      >
        {/* Aura behind the box. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[-14%] rounded-[40%] opacity-60 blur-2xl"
          style={{ background: "radial-gradient(circle at 50% 45%, var(--c-glow), transparent 68%)" }}
        />

        {/* ---- Box base: gradient square + ribbon cross (the palette look) ---- */}
        <div
          className="absolute inset-0 overflow-hidden rounded-[1.6rem] shadow-[0_30px_70px_-24px_var(--c-glow)]"
          style={{ background: GRADIENT }}
        >
          {/* dark interior at the top, revealed when the lid lifts */}
          <div className="absolute inset-x-0 top-0" style={{ height: `${LID_PCT}%`, background: INTERIOR }} />
          {/* vertical ribbon (below the lid line) */}
          <div className="absolute left-[43%] right-[43%] bottom-0" style={{ top: `${LID_PCT}%`, background: RIBBON }} />
          {/* horizontal ribbon */}
          <div className="absolute inset-x-0" style={{ top: "38%", height: "14%", background: RIBBON }} />
          {/* gloss */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent" />
        </div>

        {/* ---- Light beam pouring out of the opening when open ---- */}
        <div
          ref={beam}
          aria-hidden
          className="pointer-events-none absolute bottom-[66%] left-1/2 h-[70%] w-[44%] -translate-x-1/2 opacity-0"
          style={{
            background: "linear-gradient(to top, var(--c-accent), transparent 78%)",
            clipPath: "polygon(34% 100%, 66% 100%, 100% 0, 0 0)",
            filter: "blur(6px)",
          }}
        />

        {/* ---- Lid: a clipped window onto the full-box gradient, so it is a
             seamless slice when closed and lifts off as one piece on open. ---- */}
        <div
          ref={lid}
          className="absolute inset-x-0 top-0 overflow-hidden rounded-[1.6rem] rounded-b-none will-change-transform"
          style={{ height: `${LID_PCT}%` }}
        >
          <div
            className="absolute inset-x-0 top-0"
            style={{ height: `${(100 / LID_PCT) * 100}%`, background: GRADIENT }}
          >
            <div className="absolute left-[43%] right-[43%] top-0 bottom-0" style={{ background: RIBBON }} />
            <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent" />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-black/15" />
        </div>

        {/* ---- Heart that floats up and out of the opening ---- */}
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div ref={heart} className="w-[30%] opacity-0 drop-shadow-[0_8px_24px_var(--c-glow)]">
            <svg viewBox="0 0 24 24" className="h-auto w-full">
              <defs>
                <linearGradient id="gb2dHeart" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ff9ec9" />
                  <stop offset="100%" stopColor="#d96bff" />
                </linearGradient>
              </defs>
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                fill="url(#gb2dHeart)"
              />
            </svg>
          </div>
        </div>

        {/* ---- Knot (the dark bow dot at centre, draggable handle) ---- */}
        <button
          ref={knot}
          type="button"
          aria-label="Slide the knot down to open the gift"
          className="absolute z-30 cursor-grab rounded-full bg-surface shadow-[0_6px_16px_rgba(0,0,0,0.25)] will-change-transform active:cursor-grabbing"
          style={{ width: "26%", height: "26%", left: "37%", top: "30%" }}
        />

        {/* Hint. */}
        <span
          className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-border bg-surface/50 px-3 py-1 font-body text-[11px] tracking-wide text-text-soft backdrop-blur-sm transition-opacity duration-500"
          style={{ opacity: open ? 0 : 1 }}
        >
          {reduce ? "tap to open" : "slide the knot down to open"}
        </span>
        {open && !reduce && (
          <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-border bg-surface/50 px-3 py-1 font-body text-[11px] tracking-wide text-text-soft backdrop-blur-sm">
            double-click to close
          </span>
        )}
      </div>
    </div>
  );
}
