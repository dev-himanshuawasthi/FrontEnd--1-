// Reshapes Vite's build output into Vercel's Build Output API format (version 3).
// Required because Vercel doesn't auto-detect TanStack Start as a framework, so it
// would otherwise treat the entire project as a static site and return 404 for all routes.
//
// Why Node.js runtime (not Edge):
//   TanStack Start's server bundle uses node:events and other Node.js built-ins that
//   are unavailable in Vercel's Edge Runtime, causing "unsupported modules" errors.
//
// Why the _server.js wrapper:
//   TanStack Start exports `export default { fetch(request) }` (Cloudflare Workers style).
//   Vercel's Node.js runtime expects `export default (request: Request) => Response`.
//   The wrapper bridges both formats.

import { cpSync, mkdirSync, writeFileSync, rmSync, renameSync, existsSync } from 'node:fs';

const out = '.vercel/output';

rmSync(out, { recursive: true, force: true });
mkdirSync(`${out}/functions/index.func`, { recursive: true });
mkdirSync(`${out}/static`, { recursive: true });

// Static client bundle → CDN
cpSync('dist/client', `${out}/static`, { recursive: true });

// Server bundle → Vercel Serverless Function (Node.js 20)
cpSync('dist/server', `${out}/functions/index.func`, { recursive: true });

const entryPath = `${out}/functions/index.func/index.js`;
if (!existsSync(entryPath)) {
  console.error('ERROR: dist/server/index.js not found — build may have failed or changed output paths.');
  process.exit(1);
}

// Rename original entry so the wrapper can import it
renameSync(entryPath, `${out}/functions/index.func/_server.js`);

// Adapter: TanStack Start exports { fetch(request) }, Vercel Node.js needs (request) => Response
writeFileSync(
  entryPath,
  "import h from './_server.js';\n" +
  "export default (req) => typeof h.fetch === 'function' ? h.fetch(req) : h(req);\n"
);

writeFileSync(
  `${out}/functions/index.func/.vc-config.json`,
  JSON.stringify({
    runtime: 'nodejs20.x',
    handler: 'index.js',
    maxDuration: 60,
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
      // Everything else (HTML routes, API paths) → SSR serverless function
      { src: '/(.*)', dest: '/index' },
    ],
  })
);

console.log('✓ .vercel/output/ created: Node.js serverless function + static assets configured');
