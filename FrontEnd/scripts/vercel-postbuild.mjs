// Reshapes Vite's build output into Vercel's Build Output API format (version 3).
// Required because Vercel doesn't auto-detect TanStack Start as a framework, so it
// would otherwise treat the entire project as a static site and return 404 for all routes.
//
// Why Edge Runtime (not nodejs20.x):
//   TanStack Start's server exports `export default { fetch(request) }` — the Web
//   Workers / Service Workers pattern. Vercel Edge Runtime is the Web API environment
//   that natively supports this. Node.js runtime would receive the handler with
//   (IncomingMessage, ServerResponse) arguments, creating a type mismatch that causes
//   the Promise returned by handler.fetch() to hang silently → 504 timeout.
//
//   The previous "unsupported modules" error on Edge was caused by the old Cloudflare
//   Workers build format (wrangler.json). With cloudflare:false in vite.config.ts the
//   bundle is standard Web API–compatible and runs fine on Edge.
//
// Why vite.config.ts entry:"server" → server.js (not index.js):
//   TanStack Start names the server output file after the entry config value.

import { cpSync, mkdirSync, writeFileSync, rmSync, renameSync, existsSync } from 'node:fs';

const out = '.vercel/output';

rmSync(out, { recursive: true, force: true });
mkdirSync(`${out}/functions/index.func`, { recursive: true });
mkdirSync(`${out}/static`, { recursive: true });

// Static client bundle → CDN
cpSync('dist/client', `${out}/static`, { recursive: true });

// Server bundle → Vercel Edge Function
cpSync('dist/server', `${out}/functions/index.func`, { recursive: true });

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

// Edge Runtime uses the Vercel Edge entrypoint convention: the file must be named index.js.
// Rename the TanStack Start server entry to index.js so Edge can find it.
// No wrapper needed — Edge Runtime natively supports `export default { fetch(request) }`.
if (entryName !== 'index.js') {
  renameSync(`${funcDir}/${entryName}`, `${funcDir}/index.js`);
}

writeFileSync(
  `${funcDir}/.vc-config.json`,
  JSON.stringify({
    runtime: 'edge',
    entrypoint: 'index.js',
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
      // Everything else (HTML routes, API paths) → SSR Edge Function
      { src: '/(.*)', dest: '/index' },
    ],
  })
);

console.log(`✓ .vercel/output/ created (entry: ${entryName} → index.js): Edge function + static assets`);
