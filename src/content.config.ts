import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { postSchema } from './domains/blog/content/config';

const posts = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/domains/blog/content/posts',
  }),
  schema: postSchema,
});

export const collections = { posts };
