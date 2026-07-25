/**
 * r2.ts — Cloudflare R2 image client for the dashboard.
 *
 * All storage operations are forwarded to the Cloudflare Worker proxy, which
 * holds the R2 credentials server-side. The shared secret (VITE_R2_UPLOAD_SECRET)
 * authenticates every mutating request via the X-Auth-Token header.
 *
 * Required env vars (dashboard .env):
 *   VITE_R2_WORKER_BASE_URL  — e.g. https://chickenspicy-image-proxy.obitachi3840.workers.dev
 *   VITE_R2_UPLOAD_SECRET    — must match R2_WORKER_AUTH_SECRET in the Worker's env vars
 */

const WORKER_BASE_URL = (import.meta.env.VITE_R2_WORKER_BASE_URL as string)?.replace(/\/$/, '');
const UPLOAD_SECRET = import.meta.env.VITE_R2_UPLOAD_SECRET as string;

if (!WORKER_BASE_URL) {
  throw new Error('Missing VITE_R2_WORKER_BASE_URL in .env');
}
if (!UPLOAD_SECRET) {
  throw new Error('Missing VITE_R2_UPLOAD_SECRET in .env');
}

// ── Upload ────────────────────────────────────────────────────────────────────

/**
 * Upload a file to R2 via the Worker proxy.
 * The object will be stored at key: `products/{productId}/{filename}`
 * Returns the public Worker URL for the uploaded image.
 */
export async function uploadToR2(
  file: File | Blob,
  productId: string,
  filename: string,
): Promise<string> {
  const url = `${WORKER_BASE_URL}/upload/${encodeURIComponent(productId)}/${encodeURIComponent(filename)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-Auth-Token': UPLOAD_SECRET,
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`R2 upload failed (${response.status}): ${text}`);
  }

  const json = (await response.json()) as { url: string };
  return json.url;
}

// ── Delete single object ──────────────────────────────────────────────────────

/**
 * Delete a single R2 object by its full key (e.g. "products/123/uuid.jpg").
 * 404 responses are silently ignored (object may have already been deleted).
 */
export async function deleteFromR2(key: string): Promise<void> {
  const url = `${WORKER_BASE_URL}/delete/${encodeURIComponent(key)}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: { 'X-Auth-Token': UPLOAD_SECRET },
  });

  // 404 = already gone — treat as success
  if (!response.ok && response.status !== 404) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`R2 delete failed (${response.status}): ${text}`);
  }
}

// ── Delete entire product folder ──────────────────────────────────────────────

/**
 * Delete all R2 objects under `products/{productId}/`.
 * Uses the Worker's /delete-folder/:productId route (single HTTP call).
 */
export async function deleteR2Folder(productId: string): Promise<void> {
  const url = `${WORKER_BASE_URL}/delete-folder/${encodeURIComponent(productId)}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: { 'X-Auth-Token': UPLOAD_SECRET },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`R2 folder delete failed (${response.status}): ${text}`);
  }
}

// ── URL parsing ───────────────────────────────────────────────────────────────

/**
 * Extract the R2 object key from a Worker public URL.
 *
 * Example:
 *   "https://chickenspicy-image-proxy.obitachi3840.workers.dev/products/123/uuid.jpg"
 *   → "products/123/uuid.jpg"
 */
export function parseR2KeyFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const key = parsed.pathname.slice(1); // remove leading "/"
    return key || null;
  } catch {
    return null;
  }
}
