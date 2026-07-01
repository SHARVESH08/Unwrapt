import { StrictMode, useRef } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import "./index.css";
import { AuthProvider } from "./auth/AuthContext";
import { Landing } from "./pages/Landing";
import { Receive } from "./pages/Receive";
import { PlayGift } from "./pages/PlayGift";
import { Demo } from "./pages/Demo";
import { Dashboard } from "./pages/Dashboard";
import { Builder } from "./pages/Builder";

gsap.registerPlugin(useGSAP);

/* Each navigation sweeps a violet panel across the screen; the direction cycles
 * (left, down, right, up) so consecutive moves feel like one continuous sequence
 * rather than the same wipe every time. The panel is `position: fixed`, so it
 * never transforms the pages (that would break their fixed aurora / sticky nav). */
const DIRS = [
  { axis: "xPercent", from: -110, to: 110 },
  { axis: "yPercent", from: -110, to: 110 },
  { axis: "xPercent", from: 110, to: -110 },
  { axis: "yPercent", from: 110, to: -110 },
] as const;

function WipeOverlay() {
  const location = useLocation();
  const ref = useRef<HTMLDivElement>(null);
  const prev = useRef<string | null>(null);
  const idx = useRef(0);
  const reduce = useReducedMotion();

  useGSAP(
    () => {
      const path = location.pathname;
      // First mount (and StrictMode's re-run, where prev === path): no wipe.
      if (prev.current === null) {
        prev.current = path;
        return;
      }
      if (prev.current === path) return;
      prev.current = path;
      if (reduce || !ref.current) return;

      const d = DIRS[idx.current % DIRS.length];
      idx.current++;
      const other = d.axis === "xPercent" ? "yPercent" : "xPercent";

      gsap.killTweensOf(ref.current);
      gsap.set(ref.current, { [d.axis]: d.from, [other]: 0, autoAlpha: 1 });
      gsap
        .timeline()
        .to(ref.current, { [d.axis]: 0, duration: 0.34, ease: "power2.inOut" })
        .to(ref.current, { [d.axis]: d.to, duration: 0.46, ease: "power2.inOut" })
        .set(ref.current, { autoAlpha: 0 });
    },
    { dependencies: [location.pathname] },
  );

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100]"
      style={{
        background: "linear-gradient(120deg, #d96bff, #5b8cff)",
        transform: "translateX(-110%)",
        visibility: "hidden",
      }}
    />
  );
}

/* Sequences the mount: the old page fades out while the wipe covers, the new
 * page mounts behind the cover, then fades in as the wipe reveals it. Opacity
 * only, so nothing that relies on position: fixed / sticky breaks. `initial=
 * false` means the very first page load does NOT animate. */
function AnimatedRoutes() {
  const location = useLocation();
  const reduce = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reduce ? undefined : { opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <Routes location={location}>
          <Route path="/" element={<Landing />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/receive" element={<Receive />} />
          <Route path="/g/:number" element={<PlayGift />} />
          <Route path="/app" element={<Dashboard />} />
          <Route path="/app/new" element={<Builder />} />
          <Route path="/app/edit/:id" element={<Builder />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AnimatedRoutes />
        <WipeOverlay />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
