module.exports = {
  use: {
    baseURL: 'http://127.0.0.1:8081',
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true
  },
  webServer: {
    command: 'npx http-server dist -p 8081',
    port: 8081,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI
  },
  testDir: 'tests/e2e',
  timeout: 30000
};