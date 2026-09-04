import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('Pagefind', () => {
  it('is part of the production build command', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    expect(packageJson.scripts.build).toContain('pagefind --site dist');
  });

  it('places Pagefind assets in the shared layout slots and explains dev-server availability', () => {
    const source = readFileSync('src/pages/blog/search.astro', 'utf8');
    const layout = readFileSync('src/shared/layouts/SiteLayout.astro', 'utf8');

    expect(source).toContain('<Fragment slot="head">');
    expect(source).toContain('<Fragment slot="body-end">');
    expect(source).toContain('개발 서버에서는 Pagefind 색인이 생성되지 않습니다');
    expect(layout).toContain('<slot name="head" />');
    expect(layout).toContain('<slot name="body-end" />');
  });

  it('keeps long modal results scrollable while the page behind it is locked', () => {
    const modal = readFileSync('src/shared/components/SearchModal.astro', 'utf8');

    expect(modal).toContain('max-height: calc(100dvh - var(--search-modal-top-padding) - 2rem)');
    expect(modal).toContain('.search-modal__body { min-height: 0;');
    expect(modal).toContain('overflow-y: auto;');
  });

  it('keeps the home search field custom while using the same Pagefind search engine', () => {
    const modal = readFileSync('src/shared/components/SearchModal.astro', 'utf8');
    const home = readFileSync('src/pages/blog/index.astro', 'utf8');

    expect(home).toContain('data-home-search-input');
    expect(home).toContain('data-home-search-results');
    expect(modal).toContain("#pagefind-search-home");
    expect(modal).toContain('initializeHomeSearch');
    expect(modal).toContain('triggerSearch(latestTerm)');
    expect(modal).toContain("element: '#pagefind-search-home'");
    expect(modal).toContain('showImages: false');
  });

  it('opens the modal with the home query when the home search form is submitted', () => {
    const modal = readFileSync('src/shared/components/SearchModal.astro', 'utf8');

    expect(modal).toContain("const term = homeSearchInput?.value.trim() ?? ''");
    expect(modal).toContain('if (term) void openSearch(term);');
    expect(modal).toContain('modalPagefind?.triggerSearch(searchTerm);');
    expect(modal).toContain("button.addEventListener('click', () => { void openSearch(); })");
  });

  it('ignores non-string values before passing an initial query to Pagefind', () => {
    const modal = readFileSync('src/shared/components/SearchModal.astro', 'utf8');

    expect(modal).toContain("const searchTerm = typeof initialTerm === 'string' ? initialTerm : '';");
    expect(modal).toContain('if (modalInput && searchTerm)');
    expect(modal).toContain('modalPagefind?.triggerSearch(searchTerm);');
  });

  it('styles the modal search field like the home search control', () => {
    const modal = readFileSync('src/shared/components/SearchModal.astro', 'utf8');

    expect(modal).toContain('.search-modal .pagefind-ui .pagefind-ui__search-input');
    expect(modal).toContain('min-height: 3.75rem');
    expect(modal).toContain('border-radius: 999px');
    expect(modal).toContain('.search-modal .pagefind-ui .pagefind-ui__search-input:focus');
    expect(modal).toContain('.search-modal .pagefind-ui .pagefind-ui__search-clear');
  });

  it('keeps the modal search field self-explanatory with an inline clear icon', () => {
    const modal = readFileSync('src/shared/components/SearchModal.astro', 'utf8');

    expect(modal).not.toContain('Enter로 결과를 열고, Esc로 닫습니다.');
    expect(modal).toContain("content: '×';");
    expect(modal).toContain('font-size: 0;');
    expect(modal).toContain('.search-modal .pagefind-ui .pagefind-ui__search-clear {\n    position: absolute;');
    expect(modal).toContain('top: .875rem;');
    expect(modal).not.toContain('transform: translateY(-50%);');
    expect(modal).toContain('border: 0;');
    expect(modal).toContain('background: transparent;');
    expect(modal).toContain('font: 1.2rem/2rem var(--font-ui);');
    expect(modal).not.toContain('transform: translateY(1px);');
  });
});
