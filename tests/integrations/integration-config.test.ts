import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('external integrations', () => {
  it('keeps credentials out of source and documents required config', () => {
    const source = readFileSync('src/shared/components/GiscusComments.astro', 'utf8');

    expect(source).toContain('PUBLIC_GISCUS_REPO');
    expect(source).toContain('PUBLIC_GISCUS_REPO_ID');
    expect(readFileSync('src/domains/blog/layouts/PostLayout.astro', 'utf8')).toContain('PUBLIC_GISCUS_COMMENTS_CATEGORY');
    expect(readFileSync('src/domains/blog/layouts/PostLayout.astro', 'utf8')).toContain('PUBLIC_GISCUS_COMMENTS_CATEGORY_ID');
    expect(source).not.toContain('G-123');
  });

  it('maps articles by pathname and keeps the guestbook on its configured discussion', () => {
    const postLayout = readFileSync('src/domains/blog/layouts/PostLayout.astro', 'utf8');
    const guestbook = readFileSync('src/pages/guestbook.astro', 'utf8');

    expect(postLayout).toContain('mapping="pathname"');
    expect(postLayout).toContain('category={commentsCategory}');
    expect(guestbook).toContain('PUBLIC_GUESTBOOK_DISCUSSION_NUMBER');
    expect(guestbook).toContain('mapping="specific"');
    expect(guestbook).toContain('discussionNumber={discussionNumber}');
    expect(guestbook).toContain('category={guestbookCategory}');
    expect(readFileSync('src/shared/components/GiscusComments.astro', 'utf8')).toContain(
      "const giscusMapping = mapping === 'specific' ? 'number' : mapping;",
    );
    expect(readFileSync('src/shared/components/GiscusComments.astro', 'utf8')).toContain('data-mapping={giscusMapping}');
    expect(readFileSync('src/shared/components/GiscusComments.astro', 'utf8')).toContain("root.dataset.mapping === 'number'");
  });

  it('propagates theme changes, provides a discussion fallback, and keeps GA4 opt-in', () => {
    const giscus = readFileSync('src/shared/components/GiscusComments.astro', 'utf8');
    const analytics = readFileSync('src/shared/components/Analytics.astro', 'utf8');

    expect(giscus).toContain('getTheme(document.documentElement.dataset.theme).giscusTheme');
    expect(giscus).toContain("window.addEventListener('themechange', updateGiscusTheme)");
    expect(giscus).toContain('https://github.com/${repo}/discussions');
    expect(analytics).toContain('PUBLIC_GA_MEASUREMENT_ID');
    expect(analytics).toContain('{measurementId && (');
    expect(analytics).not.toContain('G-123');
  });
});
