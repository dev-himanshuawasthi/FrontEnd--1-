// Reshapes Vite's build output into Vercel's Build Output API format (version 3).
// Required because Vercel doesn't auto-detect TanStack Start as a framework, so it
// would otherwise treat the entire project as a static site and return 404 for all routes.
//
// Vite produces:
//   dist/client/   → hashed JS/CSS bundles
//   dist/server/   → SSR bundle, entry at index.js, exports default { fetch(request) }
//
// This script produces:
//   .vercel/output/static/          → served by Vercel CDN (cache-forever assets)
//   .vercel/output/functions/       → Edge Function that runs the SSR server
//   .vercel/output/config.json      → routing: static first, then Edge Function

import { cpSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';

const out = '.vercel/output';

rmSync(out, { recursive: true, force: true });
mkdirSync(`${out}/functions/index.func`, { recursive: true });
mkdirSync(`${out}/static`, { recursive: true });

// Static client bundle → CDN
cpSync('dist/client', `${out}/static`, { recursive: true });

// Server bundle → Vercel Edge Function
// dist/server/index.js exports default { fetch(request) } — standard Web API handler
// compatible with Vercel Edge Runtime (same interface as Cloudflare Workers)
cpSync('dist/server', `${out}/functions/index.func`, { recursive: true });

writeFileSync(
  `${out}/functions/index.func/.vc-config.json`,
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
      // Serve any matching file from the static CDN layer (assets, favicon, etc.)
      { handle: 'filesystem' },
      // Everything else (HTML routes, API paths) → SSR Edge Function
      { src: '/(.*)', dest: '/index' },
    ],
  })
);

console.log('✓ .vercel/output/ created: Edge function + static assets configured');
