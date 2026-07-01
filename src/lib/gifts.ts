/* Data access for gifts. The whole GiftConfig round-trips through the `config`
 * jsonb column; gift_number + owner_id are mirrored for indexing/RLS. */

import type { GiftConfig } from "../types/gift";
import { requireSupabase } from "./supabase";
import { generateGiftNumber, normaliseGiftNumber } from "./giftNumber";

const UNIQUE_VIOLATION = "23505";

type NewGiftInput = Omit<
  GiftConfig,
  "id" | "giftNumber" | "ownerId" | "createdAt" | "updatedAt"
>;

/** Create a gift for the signed-in giver. Retries on the rare number collision. */
export async function createGift(input: NewGiftInput): Promise<GiftConfig> {
  const supabase = requireSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to create a gift.");

  const now = new Date().toISOString();

  for (let attempt = 0; attempt < 5; attempt++) {
    const id = crypto.randomUUID();
    const giftNumber = generateGiftNumber();
    const gift: GiftConfig = {
      ...input,
      id,
      giftNumber,
      ownerId: user.id,
      createdAt: now,
      updatedAt: now,
    };

    const { error } = await supabase.from("gifts").insert({
      id,
      gift_number: giftNumber,
      owner_id: user.id,
      config: gift,
    });

    if (!error) return gift;
    if (error.code !== UNIQUE_VIOLATION) throw error;
    // else: number collided — loop and try a fresh one.
  }
  throw new Error("Could not generate a unique gift number. Please try again.");
}

/** List the signed-in giver's gifts, newest first. */
export async function listMyGifts(): Promise<GiftConfig[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("gifts")
    .select("config")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => row.config as GiftConfig);
}

/** Load one of the signed-in giver's own gifts by id (for editing; RLS-scoped). */
export async function getMyGift(id: string): Promise<GiftConfig | null> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("gifts")
    .select("config")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data?.config as GiftConfig | undefined) ?? null;
}

/** Load a single gift for a RECEIVER, by its number (via the RPC). */
export async function getGiftByNumber(rawNumber: string): Promise<GiftConfig | null> {
  const supabase = requireSupabase();
  const p_number = normaliseGiftNumber(rawNumber);
  const { data, error } = await supabase.rpc("get_gift_by_number", { p_number });
  if (error) throw error;
  return (data as GiftConfig | null) ?? null;
}

/** Overwrite a gift's config (owner only — enforced by RLS). */
export async function updateGift(gift: GiftConfig): Promise<GiftConfig> {
  const supabase = requireSupabase();
  const updated: GiftConfig = { ...gift, updatedAt: new Date().toISOString() };
  const { error } = await supabase
    .from("gifts")
    .update({ gift_number: updated.giftNumber, config: updated })
    .eq("id", updated.id);
  if (error) throw error;
  return updated;
}

/** Delete a gift (owner only — enforced by RLS). */
export async function deleteGift(id: string): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase.from("gifts").delete().eq("id", id);
  if (error) throw error;
}
