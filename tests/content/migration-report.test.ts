import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })));
});

describe('migration report', () => {
  it('flags remote, non-local, and missing Markdown image destinations in the manifest scope', async () => {
    const { inspectManifest } = await import('../../scripts/migration-report.mjs');
    const root = await mkdtemp(join(tmpdir(), 'tistory-report-'));
    temporaryDirectories.push(root);
    await mkdir(join(root, 'src/content/posts'), { recursive: true });
    await mkdir(join(root, 'public/images/posts/fixture-post'), { recursive: true });
    await writeFile(join(root, 'public/images/posts/fixture-post/present.png'), 'present');
    await writeFile(join(root, 'src/content/posts/fixture-post.md'), [
      '![remote](https://example.test/remote.png)',
      '![missing](/images/posts/fixture-post/missing.png)',
      '![present](/images/posts/fixture-post/present.png)',
    ].join('\n'));

    const report = await inspectManifest({
      entries: [{ category: 'Study', markdownPath: 'src/content/posts/fixture-post.md', slug: 'fixture-post', sourceUrl: 'https://0418.tistory.com/fixture' }],
      skippedSources: [],
      sourceUrls: ['https://0418.tistory.com/fixture'],
    }, root);

    expect(report.generatedCount).toBe(1);
    expect(report.assetCount).toBe(3);
    expect(report.numericAssetDirectories).toEqual([]);
    expect(report.missingAssets).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'https://example.test/remote.png' }),
      expect.objectContaining({ path: '/images/posts/fixture-post/missing.png' }),
    ]));
    expect(report.missingAssets).toHaveLength(2);
  });
});
