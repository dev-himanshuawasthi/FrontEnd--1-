// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import type { ConfigEnv } from "vite";
import { loadEnv } from "vite";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// cloudflare: false — without this, @cloudflare/vite-plugin produces a Cloudflare Workers bundle
// (dist/server/wrangler.json) that Vercel cannot execute as a Node.js serverless function.
//
// Env strategy: loadEnv() reads the local .env file; process.env holds vars injected by the
// Vercel build environment (populated via `vercel env push .env` or the Vercel dashboard).
// Both are merged so the same vite.config works locally and on Vercel without any dashboard
// configuration, as long as `vercel env push .env` is run once to seed Vercel's secure store.
export default async (configEnv: ConfigEnv) => {
  // loadEnv with prefix '' loads ALL variables (not just VITE_*) from .env files.
  const envFromFile = loadEnv(configEnv.mode, process.cwd(), "");

  // Merge: process.env = Vercel-injected vars at build time; envFromFile = local .env overrides.
  const env: Record<string, string> = Object.fromEntries(
    Object.entries({ ...process.env, ...envFromFile })
      .filter(([, v]) => v != null)
      .map(([k, v]) => [k, String(v)])
  );

  return defineConfig({
    cloudflare: false,
    tanstackStart: {
      server: { entry: "server" },
    },
    vite: {
      define: {
        // Bake all server-side env vars into the server bundle at build time.
        // This means process.env.X in server code resolves without any runtime env lookup.
        "process.env.SUPABASE_URL": JSON.stringify(env.SUPABASE_URL ?? ""),
        "process.env.SUPABASE_PUBLISHABLE_KEY": JSON.stringify(env.SUPABASE_PUBLISHABLE_KEY ?? ""),
        "process.env.GROQ_API_KEY": JSON.stringify(env.GROQ_API_KEY ?? ""),
        "process.env.DIFY_ANALYST_API_KEY": JSON.stringify(env.DIFY_ANALYST_API_KEY ?? ""),
        "process.env.DIFY_SCIENTIST_API_KEY": JSON.stringify(env.DIFY_SCIENTIST_API_KEY ?? ""),
        "process.env.DIFY_ENGINEER_API_KEY": JSON.stringify(env.DIFY_ENGINEER_API_KEY ?? ""),
        "process.env.DIFY_API_URL": JSON.stringify(env.DIFY_API_URL ?? "https://api.dify.ai/v1"),
        "process.env.NEXT_PUBLIC_DIFY_API_URL": JSON.stringify(env.NEXT_PUBLIC_DIFY_API_URL ?? "https://api.dify.ai/v1"),
        "process.env.NODE_ENV": JSON.stringify(env.NODE_ENV ?? "production"),
      },
    },
  })(configEnv);
};
