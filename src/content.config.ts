import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { block } from "./content/blocks";

/** Landing pages built from blocks: src/content/pages/<slug>.yaml (home.yaml is "/"). */
const pages = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/pages" }),
  schema: z.object({
    /** Used for <title> and search results. */
    title: z.string(),
    metaTitle: z.string().optional(),
    description: z.string(),
    ogImage: z.string().optional(),
    noindex: z.boolean().default(false),
    blocks: z.array(block),
  }),
});

/**
 * Projects (the portfolio): src/content/projects/<slug>.md
 * A project always shows as a card. It gets its own page at /projects/<slug> only once it has
 * body text (write-up) — set `page: true` to publish it.
 */
const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    /** One line shown on the card. */
    summary: z.string().optional(),
    /** e.g. "Hayfield" — leave out if the client prefers. */
    location: z.string().optional(),
    /** e.g. "Grade II listed", "Extension", "Restoration" */
    tags: z.array(z.string()).default([]),
    image: z.object({ src: z.string(), alt: z.string() }).optional(),
    gallery: z.array(z.object({ src: z.string(), alt: z.string(), caption: z.string().optional() })).default([]),
    /** Lower numbers show first. */
    order: z.number().default(100),
    /** Publish a full project page (needs a write-up in the body). */
    page: z.boolean().default(false),
    description: z.string().optional(),
  }),
});

export const collections = { pages, projects };
