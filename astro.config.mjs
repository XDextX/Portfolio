// @ts-check
import { defineConfig } from 'astro/config';
import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  output: "server",
  site: "https://portfolio-dext.vercel.app",
  adapter: vercel(),
});