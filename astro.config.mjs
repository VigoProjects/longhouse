// @ts-check
import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import seoPostprocess from "./src/integrations/seo-postprocess.mjs";

export default defineConfig({
  site: "https://www.conservationbuilder.com",
  // Static by default; routes that set `export const prerender = false`
  // (the contact form API) run as Vercel serverless functions.
  output: "static",
  adapter: vercel({ webAnalytics: { enabled: true } }),
  trailingSlash: "never",
  build: { format: "file" },
  integrations: [mdx(), sitemap(), seoPostprocess()],
  vite: { plugins: [tailwindcss()] },
});
