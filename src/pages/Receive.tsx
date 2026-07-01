import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import { PageShell } from "../components/ui/PageShell";
import { Button } from "../components/ui/button";
import { getGiftByNumber } from "../lib/gifts";
import { normaliseGiftNumber } from "../lib/giftNumber";
import { isSupabaseConfigured } from "../lib/supabase";

export function Receive() {
  const navigate = useNavigate();
  const [number, setNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const code = normaliseGiftNumber(number);
    if (!code) return;
    setLoading(true);
    setError("");
    try {
      const gift = await getGiftByNumber(code);
      if (!gift) {
        setError("No gift found with that number. Double-check and try again.");
        setLoading(false);
        return;
      }
      navigate(`/g/${code}`);
    } catch {
      setError("Something went wrong looking that up. Please try again.");
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="flex flex-col items-center gap-8 text-center"
      >
        <p className="font-body text-sm uppercase tracking-[0.4em] text-text-soft">
          Receive a gift
        </p>
        <h1 className="font-display text-4xl leading-tight text-text">
          Someone made something for you.
        </h1>
        <p className="font-body text-text-soft">
          Enter the gift number they sent you.
        </p>

        <div className="flex w-full flex-col items-center gap-4">
          <input
            autoFocus
            value={number}
            onChange={(e) => {
              setNumber(e.target.value.toUpperCase());
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="GIFT CODE"
            maxLength={12}
            className="w-full rounded-full border border-border bg-surface/70 px-7 py-4 text-center font-body text-2xl tracking-[0.3em] text-text outline-none backdrop-blur-sm transition-colors focus:border-accent"
          />
          <Button size="lg" onClick={submit} disabled={!number.trim() || loading}>
            {loading ? "Opening…" : "Open my gift"}
          </Button>

          <div className="min-h-[1.5rem]">
            {error && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-display text-lg italic text-accent-2"
              >
                {error}
              </motion.p>
            )}
          </div>

          {!isSupabaseConfigured && (
            <p className="font-body text-xs text-text-soft/70">
              (Backend not configured — set up .env to receive real gifts.)
            </p>
          )}
        </div>

        <Link
          to="/"
          className="font-body text-sm text-text-soft underline-offset-4 transition-colors hover:text-text hover:underline"
        >
          ← Back
        </Link>
      </motion.div>
    </PageShell>
  );
}
