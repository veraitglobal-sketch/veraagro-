// Invoked by test:browser after an isolated API and database are ready.
const path = require('node:path');
const fs = require('node:fs');
const net = require('node:net');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const web = path.resolve(__dirname, '../../web');
const { chromium, expect } = require(path.join(web, 'node_modules/@playwright/test'));
const api = process.env.BIOVERA_BROWSER_API;
if (process.env.BIOVERA_BROWSER_TEST !== '1' || !api || new URL(api).hostname !== '127.0.0.1') {
  throw new Error('Use npm run test:browser with its isolated API.');
}
const output = path.resolve(__dirname, '../test-results/browser');
fs.mkdirSync(output, { recursive: true });
let server, browser;
let serverExited;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const port = await new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.on('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const selected = probe.address().port;
      probe.close(() => resolve(selected));
    });
  });
  const origin = `http://127.0.0.1:${port}`;
  const log = fs.openSync(path.join(output, 'next.log'), 'w');
  server = spawn(process.execPath, [path.join(web, 'node_modules/next/dist/bin/next'), 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', String(port)], {
    cwd: web, detached: true, stdio: ['ignore', log, log],
    env: { ...process.env, NODE_ENV: 'development', NEXT_PUBLIC_API_URL: api, NEXT_TELEMETRY_DISABLED: '1' },
  });
  fs.closeSync(log);
  serverExited = new Promise((resolve) => server.on('exit', resolve));
  let ready = false;
  for (let n = 0; n < 120; n++) {
    if (server.exitCode !== null) throw new Error('Next exited before ready; see next.log');
    ready = await new Promise((resolve) => {
      const socket = net.connect(port, '127.0.0.1');
      socket.once('connect', () => { socket.destroy(); resolve(true); });
      socket.once('error', () => resolve(false));
    });
    if (ready) break;
    await delay(500);
  }
  assert(ready, 'Next did not listen within 60 seconds');
  browser = await chromium.launch({ headless: true });
  const report = [];
  for (const [name, viewport] of [['desktop', { width: 1440, height: 1000 }], ['mobile', { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport, locale: 'en-US' });
    const blockedExternal = new Set();
    // The application may load third-party assets; never allow production API calls.
    await context.route('**/*', (route) => {
      const host = new URL(route.request().url()).hostname;
      if (['127.0.0.1', 'localhost'].includes(host)) return route.continue();
      blockedExternal.add(route.request().url());
      return route.abort();
    });
    await context.addInitScript(() => {
      localStorage.setItem('biovera-locale', 'en');
      localStorage.setItem('cookie-consent', JSON.stringify({ essential: true, analytics: false, functionality: false, marketing: false }));
    });
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    const errors = [], consoleErrors = [], failedApi = [], dialogs = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error' && !blockedExternal.has(message.location().url)) {
        consoleErrors.push({ text: message.text(), url: message.location().url });
      }
    });
    page.on('response', (response) => {
      if (response.url().startsWith(api) && response.status() >= 400) failedApi.push({ url: new URL(response.url()).pathname, status: response.status() });
    });
    page.on('dialog', async (dialog) => { dialogs.push(dialog.message()); await dialog.accept(); });
    try {
      await page.goto(`${origin}/login/buyer?returnTo=%2Fbuyer%2Fshop`, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await expect(page.locator('#partnerCode')).toBeVisible();
      // SSR includes an initially transparent motion container. Wait for React
      // hydration and its entrance animation before interacting with the form.
      await expect(page.locator('form').locator('..')).toHaveCSS('opacity', '1', { timeout: 30000 });
      await expect(page.locator('[data-nextjs-dialog]')).toHaveCount(0);
      await page.screenshot({ path: path.join(output, `${name}-login.png`), fullPage: true });
      await page.locator('#partnerCode').fill('buyer');
      await page.locator('#password').fill('Buyer-test-2026!');
      await page.locator('button[type="submit"]').click();
      await page.waitForURL('**/buyer/shop', { timeout: 90000 });
      await expect(page.getByRole('heading', { name: 'Tomato', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
      await page.getByRole('button', { name: 'Increase quantity', exact: true }).click();
      await page.getByRole('button', { name: 'Proceed to payment', exact: true }).click();
      const checkout = page.getByRole('dialog');
      await checkout.getByRole('button', { name: 'Confirm order', exact: true }).click();
      assert.deepEqual(dialogs, ['Please fill all required fields']);
      await expect(checkout).toBeVisible();
      await checkout.getByLabel('Street and number', { exact: true }).fill('Test 1');
      await checkout.getByLabel('City', { exact: true }).fill('Berlin');
      await checkout.getByLabel('Postal code', { exact: true }).fill('10115');
      await checkout.getByLabel('Country', { exact: true }).fill('Germany');
      await page.screenshot({ path: path.join(output, `${name}-checkout.png`), fullPage: true });
      const created = page.waitForResponse((res) => res.url() === `${api}/orders` && res.request().method() === 'POST');
      await checkout.getByRole('button', { name: 'Confirm order', exact: true }).click();
      const response = await created;
      assert.equal(response.status(), 201);
      const order = await response.json();
      assert.equal(order.totalAmount, 5);
      await page.waitForURL('**/buyer-portal/orders', { timeout: 90000 });
      await expect(page.getByRole('heading', { name: order.orderNumber, exact: true })).toBeVisible();
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: order.orderNumber, exact: true })).toBeVisible();
      await expect(page.getByText('Test 1, 10115 Berlin, Germany', { exact: true }).first()).toBeVisible();
      await page.screenshot({ path: path.join(output, `${name}-orders.png`), fullPage: true });
      assert.deepEqual(errors, [], 'Uncaught browser exceptions');
      assert.deepEqual(consoleErrors, [], 'Browser console errors');
      assert.deepEqual(failedApi, [], 'API errors in the browser');
      assert.deepEqual(dialogs, ['Please fill all required fields', 'Order created!']);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      assert.equal(overflow, false, 'Orders page overflows the viewport');
      report.push({ viewport: name, orderNumber: order.orderNumber, total: order.totalAmount, errors, consoleErrors, failedApi, blockedExternal: [...blockedExternal].map((url) => new URL(url).origin) });
      console.log(`Browser ${name}: login → cart → checkout → persisted order after reload PASS`);
    } catch (error) {
      await page.screenshot({ path: path.join(output, `${name}-failure.png`), fullPage: true }).catch(() => {});
      fs.writeFileSync(path.join(output, `${name}-failure.txt`), JSON.stringify({ message: error.message, errors, consoleErrors, failedApi, dialogs, body: await page.locator('body').innerText().catch(() => '') }, null, 2));
      throw error;
    } finally {
      await context.close();
    }
  }
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
}

async function cleanup() {
  await browser?.close();
  if (server && server.exitCode === null) {
    try { process.kill(-server.pid, 'SIGTERM'); } catch {}
    await Promise.race([serverExited, delay(5000)]);
    try { process.kill(-server.pid, 'SIGKILL'); } catch {}
  }
}
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.once(signal, () => { void cleanup().finally(() => process.exit(1)); });
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(cleanup);
