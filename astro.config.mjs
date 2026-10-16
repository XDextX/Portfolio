// @ts-check
import { defineConfig } from 'astro/config';
import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  output: "server",
  site: "https://portfolio-dext.vercel.app",
  adapter: vercel(),
  // Spec 015: every dev server rewrites .astro/data-store.json and types.d.ts on start, and
  // each rewrite reloaded the pages open on the others mid-test (1 reload per file, measured).
  // No content collections here, so watching .astro/ buys nothing.
  vite: { server: { watch: { ignored: ["**/.astro/**"] } } },
});