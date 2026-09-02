import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context: { site: URL | undefined }) {
  const posts = (await getCollection('posts', ({ data }) => !data.draft))
    .sort((left, right) => right.data.pubDate.valueOf() - left.data.pubDate.valueOf());

  return rss({
    title: 'itsdangerous',
    description: '기록하고, 더 나은 답을 찾습니다.',
    site: context.site ?? 'https://itsdangerous.github.io',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/posts/${post.slug}/`,
    })),
  });
}
