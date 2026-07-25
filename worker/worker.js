/**
 * Chicken Spicy Image Proxy — Cloudflare Worker
 *
 * Routes:
 *   GET  /*                        → Serve image from R2 (existing behaviour)
 *   POST /upload/:productId/:file  → Upload image to R2 (requires X-Auth-Token)
 *   DELETE /delete/:key            → Delete single R2 object (requires X-Auth-Token)
 *   DELETE /delete-folder/:id      → Delete all objects under products/:id/ (requires X-Auth-Token)
 *
 * Worker environment variables required (set in Cloudflare dashboard or wrangler.toml):
 *   MY_BUCKET              — R2 bucket binding
 *   R2_WORKER_AUTH_SECRET  — shared secret; must match VITE_R2_UPLOAD_SECRET in dashboard .env
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method.toUpperCase();

    // ── CORS preflight ──────────────────────────────────────────────────────
    if (method === 'OPTIONS') {
      return corsResponse(new Response(null, { status: 204 }));
    }

    // ── Root health check ───────────────────────────────────────────────────
    if (pathname === '/' || pathname === '') {
      return new Response('Chicken Spicy Image Proxy is Running!', { status: 200 });
    }

    // ── POST /upload/:productId/:filename ───────────────────────────────────
    if (method === 'POST' && pathname.startsWith('/upload/')) {
      return handleUpload(request, env, pathname);
    }

    // ── DELETE /delete-folder/:productId  (checked before /delete/) ─────────
    if (method === 'DELETE' && pathname.startsWith('/delete-folder/')) {
      return handleDeleteFolder(request, env, pathname);
    }

    // ── DELETE /delete/:key ─────────────────────────────────────────────────
    if (method === 'DELETE' && pathname.startsWith('/delete/')) {
      return handleDelete(request, env, pathname);
    }

    // ── GET /* — serve image (original behaviour) ───────────────────────────
    if (method === 'GET') {
      return handleServe(request, env, pathname);
    }

    return corsResponse(new Response('Method Not Allowed', { status: 405 }));
  },
};

// ── Auth ──────────────────────────────────────────────────────────────────────
function isAuthorized(request, env) {
  const token = request.headers.get('X-Auth-Token');
  return token !== null && token === env.R2_WORKER_AUTH_SECRET;
}

// ── Serve ─────────────────────────────────────────────────────────────────────
async function handleServe(_request, env, pathname) {
  const key = pathname.slice(1); // strip leading "/"
  if (!key) {
    return new Response('Chicken Spicy Image Proxy is Running!', { status: 200 });
  }

  const object = await env.MY_BUCKET.get(key);
  if (object === null) {
    return corsResponse(new Response('Image Not Found', { status: 404 }));
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000');

  return corsResponse(new Response(object.body, { headers }));
}

// ── Upload ────────────────────────────────────────────────────────────────────
async function handleUpload(request, env, pathname) {
  if (!isAuthorized(request, env)) {
    return corsResponse(new Response('Unauthorized', { status: 401 }));
  }

  // pathname: /upload/:productId/:filename
  const rest = pathname.slice('/upload/'.length); // e.g. "123/uuid.jpg"
  const slashIndex = rest.indexOf('/');
  if (slashIndex === -1 || !rest.slice(0, slashIndex) || !rest.slice(slashIndex + 1)) {
    return corsResponse(
      new Response('Bad Request: expected /upload/:productId/:filename', { status: 400 }),
    );
  }

  const productId = rest.slice(0, slashIndex);
  const filename = decodeURIComponent(rest.slice(slashIndex + 1));
  const key = `products/${productId}/${filename}`;
  const contentType = request.headers.get('Content-Type') ?? 'application/octet-stream';

  const body = await request.arrayBuffer();
  await env.MY_BUCKET.put(key, body, { httpMetadata: { contentType } });

  const workerOrigin = new URL(request.url).origin;
  const publicUrl = `${workerOrigin}/${key}`;

  return corsResponse(
    new Response(JSON.stringify({ url: publicUrl, key }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

// ── Delete single object ──────────────────────────────────────────────────────
async function handleDelete(request, env, pathname) {
  if (!isAuthorized(request, env)) {
    return corsResponse(new Response('Unauthorized', { status: 401 }));
  }

  // pathname: /delete/products%2F123%2Fuuid.jpg  OR  /delete/products/123/uuid.jpg
  const encodedKey = pathname.slice('/delete/'.length);
  if (!encodedKey) {
    return corsResponse(new Response('Bad Request: missing object key', { status: 400 }));
  }

  const key = decodeURIComponent(encodedKey);
  await env.MY_BUCKET.delete(key);

  return corsResponse(
    new Response(JSON.stringify({ success: true, key }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

// ── Delete entire product folder ──────────────────────────────────────────────
async function handleDeleteFolder(request, env, pathname) {
  if (!isAuthorized(request, env)) {
    return corsResponse(new Response('Unauthorized', { status: 401 }));
  }

  const productId = decodeURIComponent(pathname.slice('/delete-folder/'.length));
  if (!productId) {
    return corsResponse(new Response('Bad Request: missing productId', { status: 400 }));
  }

  const prefix = `products/${productId}/`;
  const listed = await env.MY_BUCKET.list({ prefix, limit: 1000 });
  const keys = listed.objects.map((obj) => obj.key);

  if (keys.length > 0) {
    // R2 native binding accepts an array for bulk delete
    await env.MY_BUCKET.delete(keys);
  }

  return corsResponse(
    new Response(JSON.stringify({ success: true, deleted: keys.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

// ── CORS wrapper ──────────────────────────────────────────────────────────────
function corsResponse(response) {
  const r = new Response(response.body, response);
  r.headers.set('Access-Control-Allow-Origin', '*');
  r.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  r.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Auth-Token');
  return r;
}
