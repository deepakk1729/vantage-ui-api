/**
 * ci-auth.ts
 *
 * Generates a fresh storageSession.json for CI/GitHub Actions.
 * Runs a real headless Okta login using the same LoginPage flow as local auth.
 * No static tokens — always generates a fresh session on every CI run.
 * 
 * Also extracts the Okta accessToken and writes it to .env as BEARER_TOKEN
 * for API tests.
 */

import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { LoginPage } from '../pages/login/LoginPage';
import { ENV } from '../utils/env';

const SESSION_PATH = path.resolve('src/auth/storageSession.json');
const SCREENSHOT_PATH = path.resolve('ci-auth-failure.png');

async function generateCiAuthSession(): Promise<void> {
  if (!ENV.OKTA_USERNAME || !ENV.OKTA_PASSWORD) {
    throw new Error(
      'OKTA_USERNAME or OKTA_PASSWORD is missing.\n' +
      'Add them to GitHub Secrets: Settings → Secrets and variables → Actions'
    );
  }

  if (!ENV.BASE_URL) {
    throw new Error(
      'BASE_URL is missing.\n' +
      'Add it to GitHub Secrets: Settings → Secrets and variables → Actions'
    );
  }

  console.log('Launching headless browser...');

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-features=LocalNetworkAccessChecks,LocalNetworkAccessChecksWarning,PrivateNetworkAccessRespectPreflightResults',
      '--auth-server-allowlist=_disabled_',
      '--auth-negotiate-delegate-allowlist=_disabled_',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true
  });

  const page = await context.newPage();

  try {
    console.log(`Navigating to ${ENV.BASE_URL}...`);
    await page.goto(ENV.BASE_URL, { waitUntil: 'commit', timeout: 30000 });

    const loginPage = new LoginPage(page);

    console.log('Performing Okta login...');
    await loginPage.login(ENV.OKTA_USERNAME, ENV.OKTA_PASSWORD);

    console.log('Waiting for dashboard...');
    // Wait until Okta redirects back to the application origin (derived from
    // BASE_URL), so switching environments is driven entirely by .env.
    const appOrigin = new URL(ENV.BASE_URL).origin;
    await page.waitForURL((url) => url.origin === appOrigin, { timeout: 60000 });

    // Wait for the Okta PKCE token exchange to complete client-side.
    // The React app populates okta-token-storage asynchronously after URL change.
    console.log('Waiting for Okta token exchange to complete...');
    await page.waitForFunction(
      () => {
        try {
          const raw = localStorage.getItem('okta-token-storage');
          if (!raw) return false;
          const data = JSON.parse(raw);
          return typeof data?.accessToken?.accessToken === 'string' && data.accessToken.accessToken.length > 0;
        } catch {
          return false;
        }
      },
      // BUG FIX: waitForFunction(fn, options) is wrong for a zero-param fn — Playwright's
      // real signature is (fn, arg, options). Pass `null` for the unused arg so the options
      // object lands correctly instead of being silently ignored.
      null,
      { timeout: 30000 }
    );

    console.log('Saving session...');
    await context.storageState({ path: SESSION_PATH });

    console.log(`Session saved to ${SESSION_PATH}`);

    // ── Auto-extract Bearer token from Okta session ──────────────────────────
    try {
      const sessionRaw = fs.readFileSync(SESSION_PATH, 'utf-8');
      const session    = JSON.parse(sessionRaw);

      const tokenEntry = (session.origins ?? [])
        .flatMap((o: { localStorage?: Array<{ name: string; value: string }> }) => o.localStorage ?? [])
        .find((e: { name: string }) => e.name === 'okta-token-storage');

      if (tokenEntry) {
        const tokenData   = JSON.parse(tokenEntry.value);
        const accessToken = tokenData?.accessToken?.accessToken as string | undefined;

        if (accessToken) {
          const envPath    = path.resolve('.env');
          let   envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';

          if (/^BEARER_TOKEN=.*/m.test(envContent)) {
            envContent = envContent.replace(/^BEARER_TOKEN=.*/m, `BEARER_TOKEN=${accessToken}`);
          } else {
            envContent += `\nBEARER_TOKEN=${accessToken}`;
          }

          fs.writeFileSync(envPath, envContent, 'utf-8');
          console.log('✓ BEARER_TOKEN auto-extracted from Okta session and written to .env');
        } else {
          console.warn('⚠ accessToken not found in okta-token-storage — BEARER_TOKEN not updated');
        }
      } else {
        console.warn('⚠ okta-token-storage key not found in session — BEARER_TOKEN not updated');
      }
    } catch (err) {
      console.warn('⚠ Failed to extract Bearer token:', (err as Error).message);
    }
    // ─────────────────────────────────────────────────────────────────────────

  } catch (error) {
    console.error('Login failed — saving screenshot for debugging...');
    await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true });
    console.error(`Screenshot saved to ${SCREENSHOT_PATH}`);
    throw new Error(
      `CI auth failed: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    await context.close();
    await browser.close();
  }
}

generateCiAuthSession()
  .then(() => {
    console.log('CI authentication successful!');
    process.exit(0);
  })
  .catch(error => {
    console.error('CI authentication failed:', error.message);
    process.exit(1);
  });
