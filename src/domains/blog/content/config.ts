import { z } from 'astro:content';

const categories = ['Git', '일상', 'project', 'Study', 'MacOS', 'Algorithm', 'uncategorized'] as const;

export const postSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  pubDate: z.coerce.date(),
  category: z.enum(categories),
  tags: z.array(z.string()),
  draft: z.boolean().default(false),
});
