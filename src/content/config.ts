import { defineCollection, z } from 'astro:content';

const categories = ['Git', '일상', 'project', 'Study', 'MacOS', 'Algorithm', 'uncategorized'] as const;

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().min(1),
    description: z.string(),
    pubDate: z.coerce.date(),
    category: z.enum(categories),
    tags: z.array(z.string()),
    sourceUrl: z.string().url().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
