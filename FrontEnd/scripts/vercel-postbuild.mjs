// Reshapes Vite's build output into Vercel's Build Output API format (version 3).
// Required because Vercel doesn't auto-detect TanStack Start as a framework, so it
// would otherwise treat the entire project as a static site and return 404 for all routes.
//
// Why Node.js runtime (not Edge):
//   The bundled npm dependencies (h3-v2, @supabase/supabase-js, xlsx, etc.) use
//   node:stream, node:path, node:process — Node.js built-ins that Vercel's Edge
//   Runtime does not support. Node.js 20.x runtime has all of these natively.
//
// Why ssr.noExternal:true in vite.config.ts is required:
//   Vite SSR externalises npm packages by default (assumes node_modules at runtime).
//   Our Build Output API function directory contains only dist/server/ — no node_modules.
//   noExternal:true inlines every npm dep so the output is fully self-contained.
//
// Why we write an HTTP adapter (index.js):
//   Vercel's Node.js runtime invokes handlers as (IncomingMessage, ServerResponse) —
//   the classic Node.js HTTP pattern. TanStack Start's server exports
//   `{ fetch(request: Request) }` — the Web Workers / Service Workers pattern.
//   The adapter converts between the two so Vercel calls res.end() as expected,
//   and TanStack Start receives a proper Web API Request object.
//
// Why we add package.json { "type":"module" }:
//   dist/server/ contains ESM files (import/export). Without a package.json declaring
//   type:module, Node.js treats .js files as CommonJS and chokes on ESM syntax.

import { cpSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';

const out = '.vercel/output';

rmSync(out, { recursive: true, force: true });
mkdirSync(`${out}/functions/index.func`, { recursive: true });
mkdirSync(`${out}/static`, { recursive: true });

// Static client bundle → CDN
cpSync('dist/client', `${out}/static`, { recursive: true });

// Server bundle → Vercel Node.js Serverless Function (self-contained via noExternal)
cpSync('dist/server', `${out}/functions/index.func`, { recursive: true });

// ESM declaration — without this Node.js treats .js as CommonJS and crashes on
// the import/export syntax produced by Vite's SSR build.
writeFileSync(
  `${out}/functions/index.func/package.json`,
  JSON.stringify({ type: 'module' })
);

// Locate the server entry — TanStack Start names it after the entry config value.
// entry:"server" → server.js; entry:"index" (default) → index.js.
const funcDir = `${out}/functions/index.func`;
const entryName =
  existsSync(`${funcDir}/server.js`) ? 'server.js' :
  existsSync(`${funcDir}/index.js`)  ? 'index.js'  : null;

if (!entryName) {
  const { readdirSync } = await import('node:fs');
  const files = readdirSync(funcDir);
  console.error(`ERROR: could not locate server entry in dist/server/. Found: ${files.join(', ')}`);
  process.exit(1);
}

// Node.js HTTP adapter ─────────────────────────────────────────────────────────
// Vercel Node.js runtime calls:  handler(req: IncomingMessage, res: ServerResponse)
// TanStack Start expects:         handler.fetch(request: Request): Promise<Response>
// The adapter bridges the two.
//
// We import the TanStack Start entry as a side-effect-free named import so that
// the relative ../server.js path inside the asset chunks is never disturbed.
writeFileSync(
  `${funcDir}/index.js`,
  `import serverHandler from './${entryName}';
const h = typeof serverHandler.fetch === 'function' ? serverHandler : { fetch: serverHandler };

export default async function handler(req, res) {
  // Reconstruct absolute URL from Vercel-injected forwarded headers
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host  = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const url   = new URL(req.url, proto + '://' + host);

  // Convert Node.js headers → Web API Headers
  const headers = new Headers();
  for (const [key, val] of Object.entries(req.headers)) {
    if (val == null) continue;
    if (Array.isArray(val)) val.forEach(v => headers.append(key, v));
    else headers.set(key, val);
  }

  // Buffer the request body (POST/PUT/PATCH etc.)
  let body = null;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    if (chunks.length > 0) body = Buffer.concat(chunks);
  }

  const webReq = new Request(url.toString(), { method: req.method, headers, body });

  // Call TanStack Start SSR handler
  let webRes;
  try {
    webRes = await h.fetch(webReq, undefined, undefined);
  } catch (err) {
    console.error('[SSR handler error]', err);
    res.statusCode = 500;
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.end('<h1>500 Internal Server Error</h1>');
    return;
  }

  // Write status + headers to Node.js response
  res.statusCode = webRes.status;
  for (const [key, val] of webRes.headers.entries()) {
    res.setHeader(key, val);
  }

  // Stream the response body (TanStack Start uses streaming SSR)
  if (webRes.body) {
    const reader = webRes.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    } finally {
      reader.releaseLock();
    }
  }
  res.end();
}
`
);

writeFileSync(
  `${funcDir}/.vc-config.json`,
  JSON.stringify({
    runtime: 'nodejs20.x',
    handler: 'index.js',
    maxDuration: 30,
  })
);

writeFileSync(
  `${out}/config.json`,
  JSON.stringify({
    version: 3,
    routes: [
      // Long-lived cache for content-hashed JS/CSS bundles
      {
        src: '^/assets/(.*)$',
        headers: { 'cache-control': 'public, max-age=31536000, immutable' },
        continue: true,
      },
      // No-cache for TanStack Start server-function RPC calls
      {
        src: '^/_serverFn/(.*)$',
        headers: { 'cache-control': 'no-store' },
        continue: true,
      },
      // Serve any matching file from the static CDN layer first
      { handle: 'filesystem' },
      // Everything else (HTML routes, API paths) → SSR Node.js function
      { src: '/(.*)', dest: '/index' },
    ],
  })
);

console.log(`✓ .vercel/output/ created (entry: ${entryName}): Node.js function + static assets`);
