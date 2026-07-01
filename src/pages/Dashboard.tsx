import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import type { GiftConfig } from "../types/gift";
import { useAuth } from "../auth/AuthContext";
import { listMyGifts, deleteGift } from "../lib/gifts";
import { PageShell } from "../components/ui/PageShell";
import { Button } from "../components/ui/button";

export function Dashboard() {
  const { user, loading, configured, signInWithGoogle, signOut } = useAuth();

  if (!configured) {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="font-display text-3xl text-text">Backend not configured</h1>
          <p className="font-body text-text-soft">
            Set <code>VITE_SUPABASE_URL</code> and{" "}
            <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> in <code>.env</code>, then
            restart the dev server.
          </p>
          <Link to="/" className="font-body text-sm text-text-soft hover:text-text hover:underline">
            ← Home
          </Link>
        </div>
      </PageShell>
    );
  }

  if (loading) {
    return (
      <PageShell>
        <p className="text-center font-display text-2xl italic text-text-soft">Loading…</p>
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-8 text-center">
          <h1 className="font-display text-4xl text-text">Your gifts</h1>
          <p className="font-body text-text-soft">
            Sign in to create and manage the gifts you send.
          </p>
          <Button size="lg" onClick={signInWithGoogle}>
            Continue with Google
          </Button>
          <Link to="/" className="font-body text-sm text-text-soft hover:text-text hover:underline">
            ← Home
          </Link>
        </div>
      </PageShell>
    );
  }

  return <GiftList onSignOut={signOut} email={user.email ?? ""} />;
}

function GiftList({ onSignOut, email }: { onSignOut: () => void; email: string }) {
  const [gifts, setGifts] = useState<GiftConfig[] | null>(null);
  const [error, setError] = useState("");

  const refresh = () => {
    setError("");
    listMyGifts()
      .then(setGifts)
      .catch(() => setError("Could not load your gifts."));
  };

  useEffect(refresh, []);

  const remove = async (g: GiftConfig) => {
    if (!confirm(`Delete the gift for ${g.recipientName}? This cannot be undone.`)) return;
    await deleteGift(g.id);
    refresh();
  };

  return (
    <PageShell wide>
      <div className="flex flex-col gap-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl text-text">Your gifts</h1>
            <p className="font-body text-sm text-text-soft">{email}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/app/new">
              <Button>+ New gift</Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={onSignOut}>
              Sign out
            </Button>
          </div>
        </header>

        {error && <p className="font-display italic text-accent-2">{error}</p>}

        {gifts === null ? (
          <p className="font-body text-text-soft">Loading…</p>
        ) : gifts.length === 0 ? (
          <div className="rounded-3xl border border-border bg-surface/50 p-10 text-center backdrop-blur-sm">
            <p className="font-display text-2xl text-text-soft">No gifts yet.</p>
            <p className="mt-2 font-body text-text-soft">
              Create your first one — it takes a minute.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {gifts.map((g) => (
              <GiftRow key={g.id} gift={g} onDelete={() => remove(g)} />
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  );
}

function GiftRow({ gift, onDelete }: { gift: GiftConfig; onDelete: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(gift.giftNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface/60 p-5 backdrop-blur-sm"
    >
      <div className="min-w-0">
        <p className="font-display text-xl text-text">
          For {gift.recipientName || "someone"}
        </p>
        <p className="font-body text-sm capitalize text-text-soft">
          {gift.occasion}
          {gift.mode === "proposal" ? " · proposal" : ""}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={copy}
          title="Copy gift number"
          className="rounded-full border border-border bg-surface/70 px-4 py-2 font-body text-sm tracking-[0.2em] text-text transition-colors hover:border-accent"
        >
          {copied ? "Copied!" : gift.giftNumber}
        </button>
        <Link to={`/g/${gift.giftNumber}`}>
          <Button size="sm" variant="outline">
            Preview
          </Button>
        </Link>
        <Link to={`/app/edit/${gift.id}`}>
          <Button size="sm" variant="outline">
            Edit
          </Button>
        </Link>
        <Button size="sm" variant="ghost" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </motion.li>
  );
}
