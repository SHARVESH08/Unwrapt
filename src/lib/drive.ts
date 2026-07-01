/* Google Drive folder → image URLs.
 *
 * A giver shares ONE folder ("anyone with the link can view") and pastes its
 * link. We list the folder's images via the Drive API (free key) and convert
 * each file to a hotlinkable image URL.
 *
 * RELIABILITY NOTE (spec §6/§11 — the #1 risk): Google throttles/blocks several
 * Drive image endpoints. The most reliable for embedding today is the thumbnail
 * endpoint:  https://drive.google.com/thumbnail?id=<ID>&sz=w<width>
 * It serves a CDN (googleusercontent) image and respects a width. We resolve to
 * that and STORE the resulting URLs at save time, so playback never depends on a
 * live folder listing. If Google ever changes this, only `driveThumbUrl` moves.
 *
 * The API key is referrer-restricted and public by design (listing only). */

const API_BASE = "https://www.googleapis.com/drive/v3/files";

export const DRIVE_API_KEY = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY as
  | string
  | undefined;

export const isDriveConfigured = Boolean(DRIVE_API_KEY);

/** Pull a folder id out of the many Drive link shapes (or a bare id). */
export function extractFolderId(input: string): string | null {
  const s = input.trim();
  const folder = s.match(/\/folders\/([A-Za-z0-9_-]{10,})/);
  if (folder) return folder[1];
  const open = s.match(/[?&]id=([A-Za-z0-9_-]{10,})/);
  if (open) return open[1];
  if (/^[A-Za-z0-9_-]{20,}$/.test(s)) return s; // looks like a bare id
  return null;
}

/** Pull a single file id out of a Drive file link (or a bare id). */
export function extractFileId(input: string): string | null {
  const s = input.trim();
  const file = s.match(/\/file\/d\/([A-Za-z0-9_-]{10,})/);
  if (file) return file[1];
  const idParam = s.match(/[?&]id=([A-Za-z0-9_-]{10,})/);
  if (idParam) return idParam[1];
  if (/^[A-Za-z0-9_-]{20,}$/.test(s)) return s;
  return null;
}

/** A hotlinkable image URL for a Drive file id. */
export function driveThumbUrl(fileId: string, width = 1600): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${width}`;
}

/** If `link` is a Drive file link, convert it to a thumbnail URL; else pass it
 * through unchanged (so plain direct image URLs still work). */
export function normalizeImageLink(link: string, width = 1600): string {
  const trimmed = link.trim();
  if (!trimmed) return "";
  if (/drive\.google\.com|docs\.google\.com/.test(trimmed)) {
    const id = extractFileId(trimmed);
    if (id) return driveThumbUrl(id, width);
  }
  return trimmed;
}

export interface DriveImage {
  id: string;
  name: string;
}

/** List image files in a shared folder (handles pagination). */
export async function listFolderImages(folderId: string): Promise<DriveImage[]> {
  if (!DRIVE_API_KEY) {
    throw new Error("Google Drive API key is not configured (VITE_GOOGLE_DRIVE_API_KEY).");
  }

  const images: DriveImage[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
      key: DRIVE_API_KEY,
      fields: "nextPageToken,files(id,name)",
      pageSize: "1000",
      orderBy: "name_natural",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(`${API_BASE}?${params.toString()}`);
    if (!res.ok) {
      let detail = "";
      try {
        const body = await res.json();
        detail = body?.error?.message ?? "";
      } catch {
        /* ignore */
      }
      if (res.status === 403)
        throw new Error(detail || "Access denied. Is the folder shared “anyone with the link”, and the key allowed for the Drive API?");
      if (res.status === 404) throw new Error("Folder not found. Check the link.");
      throw new Error(detail || `Drive API error (${res.status}).`);
    }

    const data = (await res.json()) as {
      files?: DriveImage[];
      nextPageToken?: string;
    };
    if (data.files) images.push(...data.files);
    pageToken = data.nextPageToken;
  } while (pageToken);

  return images;
}

/** Resolve a folder link straight to stored-ready image URLs. */
export async function resolveFolderToUrls(
  folderLink: string,
  width = 1600,
): Promise<{ urls: string[]; count: number }> {
  const folderId = extractFolderId(folderLink);
  if (!folderId) throw new Error("That doesn't look like a Google Drive folder link.");
  const images = await listFolderImages(folderId);
  return { urls: images.map((f) => driveThumbUrl(f.id, width)), count: images.length };
}
