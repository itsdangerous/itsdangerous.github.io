import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkDirective from 'remark-directive';
import remarkCallouts from './src/shared/markdown/remark-callouts.js';

export default defineConfig({
  site: 'https://itsdangerous.github.io',
  base: '/',
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [remarkDirective, remarkCallouts],
  },
});
