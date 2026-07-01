import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  Wand2,
  Send,
  Gift,
  Brain,
  Type,
  Images,
  Search,
  Layers,
  Sparkles,
  Puzzle,
  Plus,
} from "lucide-react";
import { LiveDemo } from "../components/landing/LiveDemo";
import {
  Reveal,
  GsapButton,
  WordReveal,
} from "../components/landing/motionPrimitives";
import { GiftBox2D } from "../components/landing/GiftBox2D";
import { useSmoothScroll } from "../components/landing/smoothScroll";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/* The marketing site. "Electric Orchid" identity: a near-black violet nocturne
 * with one locked accent (violet) and electric-blue as quiet punctuation. Every
 * colour is a theme token, so `.app-shell` reskins the whole page. Motion is
 * Lenis smooth-scroll + GSAP (parallax, count-up) + Motion (reveals). */
export function Landing() {
  const root = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    document.documentElement.setAttribute("data-round", "1");
  }, []);

  useSmoothScroll();

  // GSAP is reserved for genuine scroll-scrub work: parallax + count-up.
  useGSAP(
    () => {
      if (reduce) return;

      // Count-up stats: reward arrival at the proof section.
      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const target = parseInt(el.dataset.count || "0", 10);
        el.textContent = "0";
        ScrollTrigger.create({
          trigger: el,
          start: "top 90%",
          once: true,
          onEnter: () => {
            const o = { v: 0 };
            gsap.to(o, {
              v: target,
              duration: 1.2,
              ease: "power2.out",
              onUpdate: () => {
                el.textContent = String(Math.round(o.v));
              },
            });
          },
        });
      });
    },
    { scope: root, dependencies: [reduce] },
  );

  return (
    <div
      ref={root}
      className="app-shell grain relative min-h-[100dvh] w-full overflow-x-hidden bg-bg font-body text-text"
    >
      {/* Ambient orchid aurora behind everything. */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="aurora-mesh opacity-60" />
      </div>
      <Nav />
      <Hero />
      <Highlights />
      <HowItWorks />
      <Demo />
      <Games />
      <Occasions />
      <Proof />
      <Faq />
      <Closing />
      <Footer />
    </div>
  );
}

/* ----------------------------------------------------------------- Nav ---- */

function Nav() {
  return (
    <nav className="sticky top-0 z-50 flex h-[68px] items-center justify-between border-b border-border/70 bg-bg/65 px-6 backdrop-blur-xl md:px-10">
      <span className="font-display text-xl font-extrabold tracking-tight text-text">
        Unwrapt
      </span>
      <div className="flex items-center gap-1 sm:gap-3">
        <Link
          to="/receive"
          className="rounded-full px-3 py-2 font-body text-sm font-medium text-text-soft transition-colors hover:text-text sm:px-4"
        >
          I have a code
        </Link>
        <GsapButton className="rounded-full">
          <Link
            to="/app"
            className="block rounded-full bg-accent px-5 py-2 font-body text-sm font-semibold text-bg"
          >
            Start building
          </Link>
        </GsapButton>
      </div>
    </nav>
  );
}

/* ---------------------------------------------------------------- Hero ---- */

function Hero() {
  return (
    <header className="relative mx-auto grid max-w-[1400px] items-center gap-10 px-6 pb-20 pt-16 md:grid-cols-[1.05fr_0.95fr] md:px-10 md:pt-24">
      <div className="relative z-10">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/50 px-3.5 py-1.5 font-body text-xs font-medium text-text-soft backdrop-blur-sm"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_2px_var(--c-glow)]" />
          A gift they unwrap by playing
        </motion.span>

        <h1 className="mt-6 pb-1 font-display text-5xl font-extrabold leading-[1.08] tracking-tight text-text md:text-7xl">
          <WordReveal text="Give a gift they" />
          <br />
          <WordReveal text="get to" delay={0.18} />{" "}
          <span className="text-gradient-accent">play.</span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="mt-6 max-w-md font-body text-lg leading-relaxed text-text-soft"
        >
          Build an adventure of mini-games around your photos. They enter a code,
          type their name, and step inside.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center"
        >
          <GsapButton className="rounded-full">
            <Link
              to="/app"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 font-body text-base font-bold text-bg shadow-[0_16px_44px_-12px_var(--c-glow)]"
            >
              Start building <ArrowRight size={18} strokeWidth={2.4} />
            </Link>
          </GsapButton>
          <Link
            to="/receive"
            className="font-body text-base font-semibold text-text underline decoration-accent decoration-2 underline-offset-[6px] transition-opacity hover:opacity-70"
          >
            I have a code
          </Link>
        </motion.div>
      </div>

      {/* The 2D gift box: click to open, confetti, stays open. */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, delay: 0.1 }}
        className="relative"
      >
        <GiftBox2D />
      </motion.div>
    </header>
  );
}

/* ---------------------------------------------------------- Highlights ---- */

const HIGHLIGHTS = [
  { icon: Wand2, label: "Ready in minutes" },
  { icon: Send, label: "No app, just a code" },
  { icon: Sparkles, label: "Occasion surprises" },
  { icon: Gift, label: "A secret ending" },
];

function Highlights() {
  return (
    <section className="border-y border-border/70 bg-bg-soft/30">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6 py-5 md:justify-between md:px-10">
        {HIGHLIGHTS.map((h) => (
          <div key={h.label} className="inline-flex items-center gap-2.5 font-body text-sm text-text-soft">
            <h.icon size={18} className="text-accent" strokeWidth={1.9} />
            {h.label}
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------- How it works ---- */

const BEATS = [
  { icon: Wand2, title: "Build it", body: "Pick the games, drop in your photos, write the finale. Reorder every moment or let it shuffle." },
  { icon: Send, title: "Send a code", body: "Save, and you get a short gift code. Text it. No app to install, no account for them." },
  { icon: Gift, title: "They play", body: "They type the code and their name, then play through to an ending you wrote yourself." },
];

function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-[1400px] px-6 py-24 md:px-10 md:py-28">
      <Reveal>
        <h2 className="mx-auto max-w-2xl text-center font-display text-4xl font-extrabold leading-tight tracking-tight text-text md:text-5xl">
          You build it like a little story.
        </h2>
      </Reveal>
      {/* A connected timeline: the line threads the three beats and stops at the last. */}
      <div className="relative mt-16 grid gap-10 md:grid-cols-3">
        <div className="absolute left-[16.67%] right-[16.67%] top-7 hidden h-px bg-border md:block" />
        {BEATS.map((b, i) => (
          <Reveal key={b.title} delay={i * 0.12}>
            <div className="relative flex flex-col items-center gap-4 text-center">
              <span className="relative z-10 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface text-accent shadow-[0_0_30px_-6px_var(--c-glow)]">
                <b.icon size={24} strokeWidth={1.9} />
              </span>
              <h3 className="font-display text-2xl font-bold text-text">{b.title}</h3>
              <p className="mx-auto max-w-xs font-body leading-relaxed text-text-soft">{b.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Demo ---- */

function Demo() {
  return (
    <section className="border-y border-border bg-bg-soft/40 px-6 py-24 md:px-10 md:py-28">
      <div className="mx-auto grid max-w-[1400px] items-center gap-12 md:grid-cols-2">
        <Reveal>
          <h2 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-text md:text-5xl">
            This is the actual thing.
          </h2>
          <p className="mt-5 max-w-md font-body text-lg leading-relaxed text-text-soft">
            No signup. Answer a question, get one wrong on purpose, switch the
            occasion and watch the little surprises change. Theirs will be full of
            your own photos and inside jokes.
          </p>
          <GsapButton className="mt-7 rounded-full">
            <Link
              to="/demo"
              className="inline-flex items-center gap-2 rounded-full border border-text/60 px-6 py-3 font-body text-base font-semibold text-text transition-colors hover:bg-text hover:text-bg"
            >
              Open the full demo <ArrowRight size={17} strokeWidth={2.4} />
            </Link>
          </GsapButton>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="glass-card rounded-[2rem] p-3">
            <LiveDemo />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- Games ---- */

function Games() {
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-24 md:px-10 md:py-28">
      <Reveal>
        <h2 className="max-w-2xl font-display text-4xl font-extrabold leading-tight tracking-tight text-text md:text-5xl">
          Seven ways to make them smile.
        </h2>
        <p className="mt-4 max-w-md font-body text-lg text-text-soft">
          Mix and reorder freely. Every one wears your photos.
        </p>
      </Reveal>

      <div className="mt-12 grid auto-rows-[150px] grid-cols-2 gap-4 md:grid-cols-4">
        {/* Big feature cell with a brand gradient wash. */}
        <Reveal className="col-span-2 row-span-2">
          <article
            className="relative flex h-full flex-col justify-end overflow-hidden rounded-3xl border border-border p-6"
            style={{ background: "linear-gradient(150deg, color-mix(in srgb, var(--c-accent) 32%, var(--c-surface)), var(--c-surface))" }}
          >
            <div
              aria-hidden
              className="absolute inset-0 opacity-50"
              style={{ background: "radial-gradient(60% 60% at 76% 18%, var(--c-glow), transparent 62%)" }}
            />
            <div className="relative">
              <Images size={24} className="mb-3 text-accent" strokeWidth={1.9} />
              <h3 className="font-display text-2xl font-bold text-text">Photo memory match</h3>
              <p className="mt-1 max-w-xs font-body text-sm text-text-soft">
                Flip the cards, find the pair, unlock the picture underneath.
              </p>
            </div>
          </article>
        </Reveal>

        {/* Wide cell with electric-blue accent line. */}
        <Reveal className="col-span-2">
          <article className="glass-card relative flex h-full flex-col justify-center overflow-hidden rounded-3xl p-6">
            <span className="absolute left-0 top-0 h-full w-1 bg-accent-2" />
            <Brain size={22} className="mb-2 text-accent" strokeWidth={1.9} />
            <h3 className="font-display text-xl font-bold text-text">Trivia about the two of you</h3>
            <p className="mt-1 font-body text-sm text-text-soft">Your questions, their funny wrong answers.</p>
          </article>
        </Reveal>

        <GameTile icon={Search} title="Word search" />
        <GameTile icon={Layers} title="Card match" />

        {/* Wide violet gradient block. */}
        <Reveal className="col-span-2">
          <article
            className="relative flex h-full flex-col justify-center overflow-hidden rounded-3xl border border-border p-6"
            style={{ background: "linear-gradient(120deg, var(--c-accent), var(--c-accent-2))" }}
          >
            <Sparkles size={22} className="mb-2 text-bg" strokeWidth={2} />
            <h3 className="font-display text-xl font-bold text-bg">Balloon pop</h3>
            <p className="mt-1 font-body text-sm text-bg/80">Pop each one to reveal a sweet little word.</p>
          </article>
        </Reveal>

        <GameTile icon={Type} title="Fill the blank" />
        <GameTile icon={Puzzle} title="Jigsaw" />
      </div>
    </section>
  );
}

function GameTile({ icon: Icon, title }: { icon: typeof Search; title: string }) {
  return (
    <Reveal>
      <article className="glass-card flex h-full flex-col justify-center rounded-3xl p-5">
        <Icon size={20} className="mb-2 text-accent" strokeWidth={1.9} />
        <h3 className="font-display text-lg font-bold leading-tight text-text">{title}</h3>
      </article>
    </Reveal>
  );
}

/* ----------------------------------------------------------- Occasions ---- */

const OCCASIONS = [
  "Anniversary", "Birthday", "Long distance", "Proposal",
  "Just because", "Graduation", "Valentine's", "Reunion",
];

function Occasions() {
  // Duplicated once so the -50% marquee loops seamlessly.
  const row = [...OCCASIONS, ...OCCASIONS];
  return (
    <section className="overflow-hidden py-20 md:py-24">
      <Reveal className="mx-auto max-w-[1400px] px-6 md:px-10">
        <h2 className="max-w-xl font-display text-3xl font-extrabold leading-tight tracking-tight text-text md:text-4xl">
          For the moments worth more than a card.
        </h2>
      </Reveal>
      <div className="relative mt-12 flex">
        <div className="marquee-track gap-4 pr-4">
          {row.map((o, i) => (
            <span
              key={i}
              className="whitespace-nowrap rounded-full border border-border bg-surface/60 px-6 py-3 font-display text-xl font-semibold text-text-soft backdrop-blur-sm"
            >
              {o}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Proof --- */

const STATS = [
  { n: 8, unit: "min", label: "to build a gift" },
  { n: 1, unit: "code", label: "to play, nothing to install" },
  { n: 0, unit: "apps", label: "for them to download" },
];

function Proof() {
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-24 md:px-10 md:py-32">
      <Reveal>
        <h2 className="mx-auto max-w-2xl text-center font-display text-4xl font-extrabold leading-tight tracking-tight text-text md:text-5xl">
          No app. No fuss. Just press play.
        </h2>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-6 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="font-display text-5xl font-extrabold text-text md:text-6xl">
                <span data-count={s.n}>{s.n}</span>
                <span className="text-accent"> {s.unit}</span>
              </div>
              <p className="mt-2 font-body text-sm text-text-soft">{s.label}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ FAQ --- */

const FAQS = [
  { q: "Do they need to install an app?", a: "No. You send a short code, they open the link, type their name, and start playing. Nothing to download, no account to make." },
  { q: "Can I use my own photos?", a: "Yes. Paste links or import a whole Google Drive folder, and your pictures fill the games, the memories, and the final reveal." },
  { q: "What is the secret proposal ending?", a: "A hidden finale that only unlocks with a code they type at the start. Everyone else sees the normal ending you wrote." },
  { q: "How long does it take to make one?", a: "A few minutes. Pick the occasion, add photos and your own questions or start from ready-made ones, then save to get your code." },
  { q: "How much does it cost?", a: "Start free. Build a gift, get your code, and send it to someone worth the effort." },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const reduce = useReducedMotion();

  return (
    <section className="mx-auto max-w-[1400px] px-6 py-24 md:px-10 md:py-28">
      <Reveal>
        <h2 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-text md:text-5xl">
          Questions, answered.
        </h2>
      </Reveal>
      <div className="mx-auto mt-12 max-w-3xl">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q} className="border-b border-border">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 py-5 text-left"
              >
                <span className="font-display text-lg font-bold text-text md:text-xl">{f.q}</span>
                <Plus
                  size={20}
                  strokeWidth={2.2}
                  className={`shrink-0 text-accent transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}
                />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: reduce ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="max-w-2xl pb-5 font-body leading-relaxed text-text-soft">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- Closing ---- */

function Closing() {
  return (
    <section className="relative overflow-hidden px-6 py-32 text-center md:px-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(70% 60% at 50% 120%, var(--c-glow) 0%, transparent 60%)" }}
      />
      <div className="relative z-10 mx-auto max-w-2xl">
        <Reveal>
          <h2 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-text md:text-6xl">
            Make the gift they will replay.
          </h2>
          <p className="mt-6 font-body text-lg text-text-soft">
            Start free. It takes about eight minutes.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <GsapButton className="rounded-full">
              <Link
                to="/app"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 font-body text-base font-bold text-bg shadow-[0_16px_44px_-12px_var(--c-glow)]"
              >
                Start building <ArrowRight size={18} strokeWidth={2.4} />
              </Link>
            </GsapButton>
            <Link
              to="/receive"
              className="inline-flex items-center rounded-full border border-text/60 px-8 py-4 font-body text-base font-semibold text-text transition-colors hover:bg-text hover:text-bg"
            >
              I have a code
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border px-6 py-10 text-center md:px-10">
      <p className="font-display text-lg font-bold text-text">Unwrapt</p>
      <p className="mt-1 font-body text-xs text-text-soft">
        Made for the people worth the effort.
      </p>
    </footer>
  );
}
