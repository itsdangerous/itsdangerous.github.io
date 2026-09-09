import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('external integrations', () => {
  it('keeps the comment secret on the Worker side', () => {
    const component = readFileSync('src/shared/components/Comments.astro', 'utf8');
    const client = readFileSync('src/shared/scripts/comments.ts', 'utf8');

    expect(component).toContain('PUBLIC_COMMENTS_API_URL');
    expect(component + client).not.toContain('COMMENTS_SECRET');
    expect(component + client).not.toContain('giscus.app');
  });

  it('keeps post comments and guestbook on distinct page keys', () => {
    const postLayout = readFileSync('src/domains/blog/layouts/PostLayout.astro', 'utf8');
    const guestbook = readFileSync('src/pages/guestbook.astro', 'utf8');

    expect(postLayout).toContain('<Comments page={`/blog/posts/${slug}/`} />');
    expect(guestbook).toContain('<Comments page="/guestbook/" guestbook />');
  });

  it('uses matching embroidered assets for both post-like states', () => {
    const component = readFileSync('src/shared/components/Comments.astro', 'utf8');
    const styles = readFileSync('src/shared/styles/comments.css', 'utf8');

    expect(existsSync('public/images/heart-embroidered-empty.webp')).toBe(true);
    expect(existsSync('public/images/heart-embroidered-filled.webp')).toBe(true);
    expect(component).toContain('heart-embroidered-empty.webp');
    expect(component).toContain('heart-embroidered-filled.webp');
    expect(styles).toContain("[data-post-like][aria-pressed='true']");
  });

  it('offers the same public or private comment controls on both surfaces', () => {
    const component = readFileSync('src/shared/components/Comments.astro', 'utf8');
    const worker = readFileSync('admin/worker/comments.ts', 'utf8');

    expect(component).toContain('name="visibility"');
    expect(component).toContain('minlength="4"');
    expect(worker).toContain("value === 'public' || value === 'private'");
    expect(worker).toContain("CASE WHEN c.visibility='private' THEN NULL");
  });

  it('keeps replies scoped to one parent comment', () => {
    const worker = readFileSync('admin/worker/comments.ts', 'utf8');
    const client = readFileSync('src/shared/scripts/comments.ts', 'utf8');
    const migration = readFileSync('admin/worker/migrations/0004_comment_replies.sql', 'utf8');

    expect(migration).toContain('parent_id');
    expect(worker).toContain('parent.parent_id');
    expect(client).toContain('data-action="reply"');
    expect(client).toContain('parentId: item.id');
  });

  it('keeps GA4 opt-in', () => {
    const analytics = readFileSync('src/shared/components/Analytics.astro', 'utf8');

    expect(analytics).toContain('PUBLIC_GA_MEASUREMENT_ID');
    expect(analytics).toContain('{measurementId && (');
    expect(analytics).not.toContain('G-123');
  });
});
