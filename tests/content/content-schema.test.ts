import { describe, expect, it } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

describe('post content', () => {
  it('accepts the migrated frontmatter contract', async () => {
    const directory = join(process.cwd(), 'src/content/posts');
    const filename = (await readdir(directory)).find((file) => file.endsWith('.md'));
    expect(filename).toBeDefined();
    const content = await readFile(join(directory, filename!), 'utf8');
    const frontmatter = content.match(/^---\n([\s\S]*?)\n---/m)?.[1] ?? '';

    expect(frontmatter).toMatch(/^title: .+/m);
    expect(frontmatter).toMatch(/^description: .+/m);
    expect(frontmatter).toMatch(/^pubDate: \d{4}-\d{2}-\d{2}T/m);
    expect(frontmatter).toMatch(/^category: ("(?:Git|일상|project|Study|MacOS|Algorithm|uncategorized)")$/m);
    expect(frontmatter).toMatch(/^tags: \[/m);
    expect(frontmatter).toMatch(/^slug: "[a-z0-9]+(?:-[a-z0-9]+)*"$/m);
    expect(frontmatter).toMatch(/^sourceUrl: "https:\/\/0418\.tistory\.com\//m);
    expect(frontmatter).toMatch(/^draft: false$/m);
  });
});
