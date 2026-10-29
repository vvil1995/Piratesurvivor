import { defineConfig, devices } from '@playwright/test';
const executablePath = process.env.CHROMIUM_EXECUTABLE;
export default defineConfig({
  testDir: './tests/browser', timeout: 30000, fullyParallel: false, workers: 1,
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:5173', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: { command: 'npm run dev -- --port 5173 --strictPort', url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 }, launchOptions: { executablePath, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] } } },
    { name: 'mobile-chromium', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium', launchOptions: { executablePath, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] } } },
    ...(process.env.QA_WEBKIT ? [{ name: 'mobile-webkit', use: { ...devices['iPhone 13'], browserName: 'webkit' as const } }] : []),
  ],
});
