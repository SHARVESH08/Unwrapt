/* Provides the active GiftConfig to the whole player tree.
 *
 * Slice 1: defaults to the bundled SAMPLE_GIFT.
 * Slice 2: the "Receive a gift" flow will load a real config (by gift number)
 * and render <GiftProvider gift={loaded}>. */

import { createContext, useContext } from "react";
import type { GiftConfig } from "../types/gift";
import { SAMPLE_GIFT } from "./sampleGift";

const GiftContext = createContext<GiftConfig>(SAMPLE_GIFT);

export function GiftProvider({
  gift,
  children,
}: {
  gift: GiftConfig;
  children: React.ReactNode;
}) {
  return <GiftContext.Provider value={gift}>{children}</GiftContext.Provider>;
}

/** The active gift for this play session. */
export function useGift(): GiftConfig {
  return useContext(GiftContext);
}
