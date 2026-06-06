// Reshapes Vite's build output into Vercel's Build Output API format (version 3).
// Required because Vercel doesn't auto-detect TanStack Start as a framework, so it
// would otherwise treat the entire project as a static site and return 404 for all routes.
//
// Why Edge Runtime:
//   TanStack Start's server exports `export default { fetch(request) }` — the Web
//   Workers pattern. Edge Runtime is the Web API environment that natively supports it.
//
// Why ssr.noExternal:true in vite.config.ts is required:
//   Without it, Vite externalises ALL npm packages (assumes node_modules at runtime).
//   Edge Runtime has no node_modules — everything must be bundled into the output.
//   noExternal:true inlines all deps; the chunks become self-contained.
//
// Why we do NOT rename server.js:
//   The asset chunks inside dist/server/assets/ import ../server.js via relative path.
//   Renaming server.js breaks those imports. We point the Edge entrypoint directly at
//   the real filename instead.

import { cpSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';

const out = '.vercel/output';

rmSync(out, { recursive: true, force: true });
mkdirSync(`${out}/functions/index.func`, { recursive: true });
mkdirSync(`${out}/static`, { recursive: true });

// Static client bundle → CDN
cpSync('dist/client', `${out}/static`, { recursive: true });

// Server bundle → Vercel Edge Function (fully self-contained with noExternal:true)
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

// Point the Edge entrypoint at the real file — no renaming so that ../server.js
// relative imports from inside assets/ continue to resolve correctly.
writeFileSync(
  `${funcDir}/.vc-config.json`,
  JSON.stringify({
    runtime: 'edge',
    entrypoint: entryName,
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

console.log(`✓ .vercel/output/ created (entry: ${entryName}): Edge function + static assets`);
