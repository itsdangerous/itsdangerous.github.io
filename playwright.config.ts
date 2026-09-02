import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: '**/release.spec.ts',
  use: {
    baseURL: 'http://127.0.0.1:4321',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    env: {
      ...process.env,
      TZ: 'UTC',
    },
    port: 4321,
    reuseExistingServer: !process.env.CI,
  },
});
