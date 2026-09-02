import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: '**/release.spec.ts',
  use: {
    baseURL: 'http://127.0.0.1:4321',
  },
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1',
    env: {
      ...process.env,
      PUBLIC_GISCUS_REPO: 'itsdangerous/test-discussions',
      PUBLIC_GISCUS_REPO_ID: 'R_kgDOtest',
      PUBLIC_GISCUS_CATEGORY: 'Announcements',
      PUBLIC_GISCUS_CATEGORY_ID: 'DIC_kwDOtest',
      PUBLIC_GUESTBOOK_DISCUSSION_NUMBER: '42',
      TZ: 'UTC',
    },
    port: 4321,
    reuseExistingServer: false,
  },
});
