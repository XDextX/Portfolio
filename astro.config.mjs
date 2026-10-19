// @ts-check
import { defineConfig } from 'astro/config';
import vercel from "@astrojs/vercel";
import { stylesVersion } from "./src/utils/styles-version.ts";
import { CANONICAL_ORIGIN } from "./src/data/site.ts";

// https://astro.build/config
export default defineConfig({
  output: "server",
  site: CANONICAL_ORIGIN,
  adapter: vercel(),
  // Spec 015: every dev server rewrites .astro/data-store.json and types.d.ts on start, and
  // each rewrite reloaded the pages open on the others mid-test (1 reload per file, measured).
  // No content collections here, so watching .astro/ buys nothing.
  // Spec 038: the public sheets are linked with ?v=<content hash>, so a changed sheet gets a new
  // URL and <ClientRouter /> loads it instead of keeping the old one across a deploy.
  vite: {
    server: { watch: { ignored: ["**/.astro/**"] } },
    define: { "import.meta.env.STYLES_VERSION": JSON.stringify(stylesVersion("public/styles")) },
  },
});