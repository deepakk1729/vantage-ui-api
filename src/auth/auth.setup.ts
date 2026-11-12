import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

import { LoginPage } from '../pages/login/LoginPage';

import { ENV } from '../utils/env';

const IS_CI = !!process.env.CI;

async function generateAuthSession() {

  // In CI, auth is handled by ci-auth.ts (headless browser) before tests run.
  // Local development uses headed browser below.
  if (IS_CI) {
    console.error('✗ npm run auth is for local development only.');
    console.error('  In CI, authentication is handled automatically by the workflow.');
    process.exit(1);
  }

  const browser = await chromium.launch({
    headless: false,
    args: [
      // Suppress Chrome's new "site wants to access other devices on your
      // system" Local Network Access prompt that otherwise blocks the
      // dashboard from loading and forces a manual Allow click.
      '--disable-features=LocalNetworkAccessChecks,LocalNetworkAccessChecksWarning,PrivateNetworkAccessRespectPreflightResults',
      // On a BCG-managed Windows machine Chromium would otherwise use
      // Integrated Windows Authentication (Kerberos / SPNEGO) and silently
      // hand Okta the *Windows* user identity (e.g. kumar.deepak@bcg.com).
      // That bypasses the username/password screen entirely and prevents the
      // test account in .env (OKTA_USERNAME / OKTA_PASSWORD) from being used.
      // Pointing the allowlists at a non-existent host disables IWA so Okta
      // always shows the username step.
      '--auth-server-allowlist=_disabled_',
      '--auth-negotiate-delegate-allowlist=_disabled_'
    ]
  });

  const context = await browser.newContext({

    storageState: undefined

  });

  const page = await context.newPage();

  const loginPage = new LoginPage(page);

  await page.goto(ENV.BASE_URL, {
    waitUntil: 'commit'
  });

  await loginPage.login(
    ENV.OKTA_USERNAME,
    ENV.OKTA_PASSWORD
  );

  // Wait until Okta redirects back to the application origin. The origin is
  // derived from BASE_URL, so switching environments (stg → qa → prod) needs
  // no change here — it is fully driven by .env.
  const appOrigin = new URL(ENV.BASE_URL).origin;
  await page.waitForURL((url) => url.origin === appOrigin, {
    timeout: 60000
  });

  // Wait for the Okta PKCE token exchange to complete client-side.
  // The React app populates okta-token-storage asynchronously after the URL
  // changes — waitForTimeout(5000) is not reliable. Poll localStorage instead.
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

  await context.storageState({

    path: 'src/auth/storageSession.json'

  });

  console.log('Authenticated session saved successfully');

  // ── Auto-extract Bearer token from Okta session ──────────────────────────
  try {
    const sessionRaw = fs.readFileSync('src/auth/storageSession.json', 'utf-8');
    const session    = JSON.parse(sessionRaw);

    const tokenEntry = (session.origins ?? [])
      .flatMap((o: { localStorage?: Array<{ name: string; value: string }> }) => o.localStorage ?? [])
      .find((e: { name: string }) => e.name === 'okta-token-storage');

    if (tokenEntry) {
      const tokenData   = JSON.parse(tokenEntry.value);
      const accessToken = tokenData?.accessToken?.accessToken as string | undefined;

      if (accessToken) {
        const envPath    = path.resolve('.env');
        let   envContent = fs.readFileSync(envPath, 'utf-8');

        if (/^BEARER_TOKEN=.*/m.test(envContent)) {
          envContent = envContent.replace(/^BEARER_TOKEN=.*/m, `BEARER_TOKEN=${accessToken}`);
        } else {
          envContent += `\nBEARER_TOKEN=${accessToken}`;
        }

        fs.writeFileSync(envPath, envContent, 'utf-8');
        console.log('✓ BEARER_TOKEN auto-updated in .env from Okta session');
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

  await browser.close();

}

generateAuthSession();