/**
 * Runs after every build, over the generated HTML:
 *  - adds width/height to <img> tags that lack them (prevents layout shift, a Core Web Vitals metric)
 *  - adds decoding="async" to images
 * Content editors don't need to do anything — dimensions are read from the files in /public.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const walk = (d) => readdirSync(d).flatMap((f) => {
  const p = join(d, f);
  return statSync(p).isDirectory() ? walk(p) : p.endsWith(".html") ? [p] : [];
});

export default function seoPostprocess() {
  return {
    name: "longhouse-seo-postprocess",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const out = fileURLToPath(dir);
        const cache = new Map();
        const dims = async (src) => {
          if (cache.has(src)) return cache.get(src);
          let path;
          try { path = join("public", decodeURIComponent(src.split(/[?#]/)[0])); } catch { path = ""; }
          let v = null;
          if (path && existsSync(path)) {
            try {
              const m = await sharp(path).metadata();
              if (m.width && m.height) v = { w: m.width, h: m.height };
            } catch { /* unsupported file: leave as is */ }
          }
          cache.set(src, v);
          return v;
        };
        let pages = 0, images = 0;
        for (const file of walk(out)) {
          const html = readFileSync(file, "utf8");
          let next = html;
          for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
            let t = tag;
            const src = t.match(/\ssrc="(\/[^"]+)"/)?.[1];
            if (src && !/\swidth=/.test(t)) {
              const d = await dims(src);
              if (d) { t = t.replace(/^<img/, `<img width="${d.w}" height="${d.h}"`); images++; }
            }
            if (!/\sdecoding=/.test(t)) t = t.replace(/^<img/, `<img decoding="async"`);
            if (t !== tag) next = next.split(tag).join(t);
          }
          if (next !== html) { writeFileSync(file, next); pages++; }
        }
        logger.info(`added image dimensions to ${images} images across ${pages} pages`);
      },
    },
  };
}
