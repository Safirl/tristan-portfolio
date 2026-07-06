import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const projects = defineCollection({
  loader: glob({ base: "./src/content/projects", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    video: z.string(),
    images: z.array(z.string()),
    published: z.boolean(),
  }),
});

export const collections = {
  projects: projects,
};
