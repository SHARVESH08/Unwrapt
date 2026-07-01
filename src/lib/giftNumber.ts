/* Shareable gift numbers.
 *
 * 8 characters from a non-ambiguous alphabet (no 0/O/1/I/L) → ~1.1e12 codes,
 * random and not enumerable (spec §9). Collisions are vanishingly rare and
 * handled by the unique constraint + retry on insert. */

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const LENGTH = 8;

export function generateGiftNumber(): string {
  const bytes = new Uint32Array(LENGTH);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < LENGTH; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

/** Normalise user input (uppercase, strip spaces/dashes) before lookup. */
export function normaliseGiftNumber(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s-]/g, "");
}
