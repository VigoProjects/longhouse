/**
 * Block schemas — the single source of truth for what each page block accepts.
 * A page's `blocks:` list is validated against these at build time, so a typo or a
 * missing field fails the build instead of breaking the live site.
 *
 * To add a block type:
 *   1. add a schema here and include it in `block` below
 *   2. create src/components/blocks/<Name>.astro
 *   3. register it in src/components/BlockRenderer.astro
 *   4. add it to the block table in CLAUDE.md
 */
import { z } from "astro/zod";

const link = z.object({ label: z.string(), href: z.string() });
const image = z.object({ src: z.string(), alt: z.string().default("") });

/** Optional section anchor (for in-page nav like /#services) and background tone. */
const common = {
  id: z.string().optional(),
  background: z.enum(["paper", "stone", "moss"]).default("paper"),
};

export const hero = z.object({
  type: z.literal("hero"),
  ...common,
  eyebrow: z.string().optional(),
  heading: z.string(),
  body: z.string().optional(),
  cta: link.optional(),
  secondaryCta: link.optional(),
  image: image.optional(),
  /** `split`: text on a plain background beside the image. `overlay`: text over a full-bleed image. */
  layout: z.enum(["split", "overlay"]).default("split"),
});

export const pageHeader = z.object({
  type: z.literal("pageHeader"),
  ...common,
  eyebrow: z.string().optional(),
  heading: z.string(),
  body: z.string().optional(),
});

/** Numbered stages, each with a list of what's included. */
export const services = z.object({
  type: z.literal("services"),
  ...common,
  eyebrow: z.string().optional(),
  heading: z.string(),
  body: z.string().optional(),
  items: z.array(z.object({ title: z.string(), items: z.array(z.string()), note: z.string().optional() })),
});

export const quote = z.object({
  type: z.literal("quote"),
  ...common,
  quote: z.string(),
  name: z.string(),
  context: z.string().optional(),
});

/** Grid of projects from src/content/projects. Omit `featured` to show them all. */
export const projects = z.object({
  type: z.literal("projects"),
  ...common,
  eyebrow: z.string().optional(),
  heading: z.string(),
  body: z.string().optional(),
  featured: z.array(z.string()).optional(),
  cta: link.optional(),
});

export const logos = z.object({
  type: z.literal("logos"),
  ...common,
  heading: z.string().optional(),
  items: z.array(image),
});

/** Text (Markdown) with an optional image alongside. */
export const prose = z.object({
  type: z.literal("prose"),
  ...common,
  eyebrow: z.string().optional(),
  heading: z.string().optional(),
  body: z.string(),
  image: image.optional(),
  imageSide: z.enum(["left", "right"]).default("right"),
});

/** Contact details + enquiry form (emails via /api/contact). */
export const contact = z.object({
  type: z.literal("contact"),
  ...common,
  eyebrow: z.string().optional(),
  heading: z.string(),
  body: z.string().optional(),
});

export const cta = z.object({
  type: z.literal("cta"),
  ...common,
  heading: z.string(),
  body: z.string().optional(),
  cta: link,
});

export const block = z.discriminatedUnion("type", [hero, pageHeader, services, quote, projects, logos, prose, contact, cta]);
export type Block = z.infer<typeof block>;
