import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import type { GiftConfig } from "../types/gift";
import { getGiftByNumber } from "../lib/gifts";
import { GiftProvider } from "../config/GiftContext";
import { PageShell } from "../components/ui/PageShell";
import App from "../App";

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; gift: GiftConfig };

/* Loads a gift by its number, then hands it to the player. */
export function PlayGift() {
  const { number = "" } = useParams();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });
    getGiftByNumber(number)
      .then((gift) => {
        if (!active) return;
        setState(gift ? { status: "ready", gift } : { status: "error" });
      })
      .catch(() => active && setState({ status: "error" }));
    return () => {
      active = false;
    };
  }, [number]);

  if (state.status === "loading") {
    return (
      <PageShell>
        <p className="text-center font-display text-2xl italic text-text-soft">
          Unwrapping…
        </p>
      </PageShell>
    );
  }

  if (state.status === "error") {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="font-display text-3xl text-text">
            We couldn't find that gift.
          </h1>
          <p className="font-body text-text-soft">
            The gift number may be wrong, or the gift was removed.
          </p>
          <Link
            to="/receive"
            className="font-body text-sm text-text-soft underline-offset-4 hover:text-text hover:underline"
          >
            ← Try another number
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <GiftProvider gift={state.gift}>
      <App />
    </GiftProvider>
  );
}
