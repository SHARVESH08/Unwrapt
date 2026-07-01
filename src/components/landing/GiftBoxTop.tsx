/* Top-down hero gift: you look straight down onto the wrapped box (gradient
 * square + ribbon cross + centre knot, the palette look). Slide the knot down and
 * the four lid flaps unfold in sequence (top first, then the sides, then the
 * bottom), revealing a box with real depth, and a heart floats up and out as
 * confetti bursts. Double-click to close. Pure CSS 3D + GSAP (Draggable) +
 * canvas-confetti. Reversible: the front-view version still lives in GiftBox2D.tsx. */

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { useReducedMotion } from "motion/react";
import confetti from "canvas-confetti";

gsap.registerPlugin(useGSAP, Draggable);

const GRADIENT = "linear-gradient(150deg, var(--c-accent), var(--c-accent-2))";
const RIBBON = "rgba(255,255,255,0.85)";
const ANGLE = 145; // how far each flap folds open

const seg = (p: number, a: number, b: number) => Math.min(1, Math.max(0, (p - a) / (b - a)));

export function GiftBoxTop() {
  const box = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const left = useRef<HTMLDivElement>(null);
  const right = useRef<HTMLDivElement>(null);
  const core = useRef<HTMLDivElement>(null);
  const beam = useRef<HTMLDivElement>(null);
  const heart = useRef<HTMLDivElement>(null);
  const knot = useRef<HTMLButtonElement>(null);
  const drag = useRef<Draggable | null>(null);
  const opened = useRef(false);
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  const popConfetti = () => {
    const el = box.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const origin = {
      x: (r.left + r.width / 2) / window.innerWidth,
      y: (r.top + r.height * 0.4) / window.innerHeight,
    };
    const colors = ["#d96bff", "#5b8cff", "#ff9ec9", "#ffd479", "#f6efff"];
    confetti({ particleCount: 120, spread: 100, startVelocity: 46, origin, colors, scalar: 1.05, ticks: 220 });
    confetti({ particleCount: 45, spread: 130, startVelocity: 32, decay: 0.92, scalar: 0.9, origin, colors });
  };

  const trackPx = () => (box.current?.clientHeight ?? 320) * 0.5;
  const liftPx = () => (box.current?.clientHeight ?? 320) * 0.58;

  // Staggered unfold driven by a single 0..1 progress: top first, then sides,
  // then bottom; the interior + heart arrive at the end.
  const setProgress = (p: number) => {
    gsap.set(top.current, { rotationX: -seg(p, 0, 0.5) * ANGLE });
    gsap.set(left.current, { rotationY: seg(p, 0.25, 0.8) * ANGLE });
    gsap.set(right.current, { rotationY: -seg(p, 0.25, 0.8) * ANGLE });
    gsap.set(bottom.current, { rotationX: seg(p, 0.5, 1) * ANGLE });
    const inside = seg(p, 0.55, 1);
    gsap.set(core.current, { scale: inside, autoAlpha: inside });
    gsap.set(beam.current, { scaleY: Math.max(0.001, inside), autoAlpha: inside * 0.5 });
    gsap.set(heart.current, { y: -inside * liftPx() * 0.7, scale: inside, autoAlpha: inside });
  };

  const openBox = () => {
    if (opened.current) return;
    opened.current = true;
    setOpen(true);
    if (reduce) {
      setProgress(1);
      popConfetti();
      return;
    }
    const lift = liftPx();
    gsap.killTweensOf([top.current, bottom.current, left.current, right.current, core.current, beam.current, heart.current, knot.current]);
    gsap
      .timeline()
      .to(knot.current, { autoAlpha: 0, duration: 0.25 }, 0)
      .to(top.current, { rotationX: -ANGLE, duration: 0.45, ease: "back.out(1.5)" }, 0)
      .to([left.current, right.current], { rotationY: (i: number) => (i === 0 ? ANGLE : -ANGLE), duration: 0.45, ease: "back.out(1.5)" }, 0.16)
      .to(bottom.current, { rotationX: ANGLE, duration: 0.45, ease: "back.out(1.5)" }, 0.32)
      .to(core.current, { scale: 1, autoAlpha: 1, duration: 0.4, ease: "back.out(1.7)" }, 0.34)
      .to(beam.current, { scaleY: 1, autoAlpha: 0.5, duration: 0.4, ease: "power2.out" }, 0.34)
      .fromTo(heart.current, { y: 0, scale: 0.3, autoAlpha: 0 }, { y: -lift, scale: 1.15, autoAlpha: 1, duration: 0.75, ease: "back.out(1.4)" }, 0.38)
      .add(popConfetti, 0.46)
      // gentle floating heart + breathing core while it stays open
      .to(heart.current, { y: `-=12`, rotation: 6, duration: 1.9, ease: "sine.inOut", repeat: -1, yoyo: true }, ">-0.1")
      .to(core.current, { scale: 1.07, duration: 1.7, ease: "sine.inOut", repeat: -1, yoyo: true }, "<");
  };

  const resetBox = () => {
    if (!opened.current) return;
    opened.current = false;
    setOpen(false);
    if (reduce) {
      setProgress(0);
      return;
    }
    gsap.killTweensOf([heart.current, core.current]);
    gsap
      .timeline()
      .to([top.current, bottom.current, left.current, right.current], { rotationX: 0, rotationY: 0, duration: 0.5, ease: "power3.inOut" })
      .to(heart.current, { y: 0, scale: 0, autoAlpha: 0, rotation: 0, duration: 0.35 }, "<")
      .to(core.current, { scale: 0, autoAlpha: 0, duration: 0.35 }, "<")
      .to(beam.current, { scaleY: 0, autoAlpha: 0, duration: 0.35 }, "<")
      .to(knot.current, { autoAlpha: 1, y: 0, duration: 0.4, onUpdate: () => drag.current?.update() }, "<");
  };

  useGSAP(
    () => {
      gsap.set([top.current, bottom.current, left.current, right.current], { rotationX: 0, rotationY: 0 });
      gsap.set(core.current, { scale: 0, autoAlpha: 0 });
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
          setProgress(Math.min(1, this.y / trackPx()));
        },
        onDragEnd(this: Draggable) {
          if (opened.current) return;
          const p = this.y / trackPx();
          if (p > 0.6) {
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

  const flap = (
    r: React.RefObject<HTMLDivElement | null>,
    clip: string,
    origin: string,
    ribbon: React.CSSProperties,
  ) => (
    <div
      ref={r}
      className="absolute inset-0 will-change-transform"
      style={{ background: GRADIENT, clipPath: clip, transformOrigin: origin }}
    >
      <div className="absolute" style={{ background: RIBBON, ...ribbon }} />
      <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent" />
    </div>
  );

  return (
    <div className="flex h-[clamp(280px,38vw,460px)] w-full items-center justify-center select-none">
      <div
        ref={box}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        className="relative aspect-square w-[min(74%,340px)]"
        style={{ perspective: "1000px" }}
      >
        {/* Aura. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[-14%] rounded-[40%] opacity-60 blur-2xl"
          style={{ background: "radial-gradient(circle at 50% 50%, var(--c-glow), transparent 68%)" }}
        />

        {/* Interior with depth: dark well, inset floor (smaller = perspective),
            wall shading and a glowing core. */}
        <div className="absolute inset-0 overflow-hidden rounded-[1.4rem]" style={{ background: "#160a22" }}>
          <div className="absolute inset-0 shadow-[inset_0_0_50px_14px_rgba(0,0,0,0.65)]" />
          <div
            className="absolute inset-[13%] rounded-[0.7rem]"
            style={{
              background: "radial-gradient(circle at 50% 45%, color-mix(in srgb, var(--c-accent) 26%, #1c0e2e), #160a22)",
              boxShadow: "0 0 30px 4px rgba(0,0,0,0.45)",
            }}
          />
          <div className="absolute inset-x-0 top-0 h-[16%]" style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.07), transparent)" }} />
          <div
            ref={core}
            className="absolute left-1/2 top-1/2 h-[40%] w-[40%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 blur-md"
            style={{ background: "radial-gradient(circle, var(--c-accent), transparent 70%)" }}
          />
        </div>

        {/* Light beam rising from the open box. */}
        <div
          ref={beam}
          aria-hidden
          className="pointer-events-none absolute bottom-1/2 left-1/2 h-[78%] w-[50%] -translate-x-1/2 opacity-0"
          style={{
            background: "linear-gradient(to top, var(--c-accent), transparent 80%)",
            clipPath: "polygon(36% 100%, 64% 100%, 100% 0, 0 0)",
            filter: "blur(7px)",
          }}
        />

        {/* The four lid flaps. */}
        {flap(top, "polygon(0 0, 100% 0, 50% 50%)", "50% 0%", { left: "43%", right: "43%", top: 0, height: "50%" })}
        {flap(bottom, "polygon(0 100%, 100% 100%, 50% 50%)", "50% 100%", { left: "43%", right: "43%", bottom: 0, height: "50%" })}
        {flap(left, "polygon(0 0, 0 100%, 50% 50%)", "0% 50%", { top: "43%", bottom: "43%", left: 0, width: "50%" })}
        {flap(right, "polygon(100% 0, 100% 100%, 50% 50%)", "100% 50%", { top: "43%", bottom: "43%", right: 0, width: "50%" })}

        {/* Heart that floats up and out. */}
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div ref={heart} className="w-[34%] opacity-0 drop-shadow-[0_8px_24px_var(--c-glow)]">
            <svg viewBox="0 0 24 24" className="h-auto w-full">
              <defs>
                <linearGradient id="giftHeart" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ff9ec9" />
                  <stop offset="100%" stopColor="#d96bff" />
                </linearGradient>
              </defs>
              <path
                d="M12 21s-7.5-4.6-7.5-10.4A4.1 4.1 0 0 1 12 7.2a4.1 4.1 0 0 1 7.5 3.4C19.5 16.4 12 21 12 21z"
                fill="url(#giftHeart)"
              />
            </svg>
          </div>
        </div>

        {/* Knot (draggable handle) at the centre. */}
        <button
          ref={knot}
          type="button"
          aria-label="Slide the knot down to open the gift"
          className="absolute z-30 cursor-grab rounded-full bg-surface shadow-[0_6px_16px_rgba(0,0,0,0.3)] will-change-transform active:cursor-grabbing"
          style={{ width: "24%", height: "24%", left: "38%", top: "38%" }}
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
