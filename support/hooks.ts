import {
  After,
  AfterAll,
  Before,
  BeforeAll,
  Status,
  setDefaultTimeout
} from '@cucumber/cucumber';

import { Browser, chromium, LaunchOptions } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import type { ITestCaseHookParameter } from '@cucumber/cucumber';
import { PlaywrightWorld } from './world';
import { ensureUiSession, ensureApiToken, ensureFreshUiSession } from '../src/utils/sessionGuard';
import { resolveRole, roles } from '../config/roles';
import { impersonateAs } from './impersonation';

import * as dotenv from 'dotenv';
dotenv.config();

// ---------------------------------------------------------------------------
// GLOBAL TIMEOUT — single source of truth.
//
// setDefaultTimeout is process-global and "last call wins", so it must live in
// exactly ONE place. Previously three step files each called it (180000 /
// 240000 / 180000); the effective value therefore depended on step-file LOAD
// ORDER, and timesheets.steps.ts (loaded last) silently won at 180000 — which
// clobbered the Charges/Hours export's intended 240000 and made that step time
// out at exactly its internal download wait. 180000 here matches that previous
// effective value, so no step loses any budget. Steps that need MORE declare a
// per-step `{ timeout }` (e.g. the Charges/Hours export step at 240000).
// ---------------------------------------------------------------------------
setDefaultTimeout(180000);

// ---------------------------------------------------------------------------
// CI-aware launch options
// ---------------------------------------------------------------------------
// - In CI (or when HEADED is not set) we run headless and skip slowMo so
//   tests are fast and do not require a display server.
// - `channel: 'chrome'` is only used when explicitly requested via env so
//   that GitHub Actions runners (which only have bundled Chromium) do not
//   fail to launch.
const IS_CI = !!process.env.CI;
const IS_HEADED = process.env.HEADED === '1' || process.env.HEADED === 'true';
const SLOW_MO = Number(process.env.SLOW_MO || 0);
const BROWSER_CHANNEL = process.env.BROWSER_CHANNEL;

const STORAGE_STATE_PATH = path.resolve(
  __dirname,
  '../src/auth/storageSession.json'
);

// ---------------------------------------------------------------------------
// Shared Browser Instance
// ---------------------------------------------------------------------------
let sharedBrowser: Browser;

// ---------------------------------------------------------------------------
// BeforeAll → launch browser once
// ---------------------------------------------------------------------------
BeforeAll(
  { timeout: 300000 }, // 5 min — covers a potential "npm run auth" re-auth run
  async function () {

    // ── Session guard ────────────────────────────────────────────────────────
    // Validates storageSession.json JWT (< 5 ms, no network).
    // UI-only check — BEARER_TOKEN is NOT required here; it is validated
    // lazily per @api scenario in the tagged Before hook below.
    ensureUiSession();
    // ─────────────────────────────────────────────────────────────────────────

    const launchOptions: LaunchOptions = {
      // Default: headed locally (preserves original developer workflow),
      // headless on CI so it runs on Linux runners without a display.
      // Force either way explicitly with HEADED=1 or HEADLESS=1.
      headless: process.env.HEADLESS === '1'
        ? true
        : IS_HEADED
          ? false
          : IS_CI,
      slowMo: SLOW_MO,
      args: [
        // Suppress Chrome's "site wants to access other devices on your
        // system" Local Network Access prompt that otherwise blocks the
        // dashboard from loading.
        '--disable-features=LocalNetworkAccessChecks,LocalNetworkAccessChecksWarning,PrivateNetworkAccessRespectPreflightResults'
      ]
    };

    if (BROWSER_CHANNEL) {
      launchOptions.channel = BROWSER_CHANNEL;
    }

    sharedBrowser = await chromium.launch(launchOptions);

  }
);

// ---------------------------------------------------------------------------
// AfterAll → close browser
// ---------------------------------------------------------------------------
AfterAll(
  { timeout: 30000 },
  async function () {

    await sharedBrowser?.close();

  }
);

// ---------------------------------------------------------------------------
// Before each UI scenario → new browser context + page (Okta storageState)
// Skipped for @api scenarios which use ApiClient directly (no browser needed)
// ---------------------------------------------------------------------------
Before(
  { tags: 'not @api', timeout: 120000 },
  async function (this: PlaywrightWorld, { pickle }: ITestCaseHookParameter) {

    // ── Role/profile guard ─────────────────────────────────────────────────────
    // Each role's suite lives under features/<role>/ and MUST run via its profile
    // (`-p <role>`), which both isolates its step definitions and drives
    // impersonation. If a role's feature is run WITHOUT the matching profile, the
    // default profile silently resolves the steps against the base (superadmin)
    // definitions and runs with NO impersonation — a misleading pass. Fail fast
    // with the exact command instead.
    const activeRole = (this.parameters as { role?: string })?.role ?? process.env.ROLE ?? 'superadmin';
    const pathRole = /(?:^|\/)features\/([^/]+)\//.exec(pickle.uri.replace(/\\/g, '/'))?.[1];
    if (pathRole && pathRole !== activeRole && Object.prototype.hasOwnProperty.call(roles, pathRole)) {
      throw new Error(
        `Scenario "${pickle.name}" lives under features/${pathRole}/ but the active role is ` +
        `"${activeRole}". Run this suite with its profile so it isolates the right steps and ` +
        `impersonates correctly:\n    npx cucumber-js -p ${pathRole} ${pickle.uri}`
      );
    }
    // ────────────────────────────────────────────────────────────────────────────

    this.browser = sharedBrowser;

    // CI-only self-heal: if the Okta token has dropped under the safety buffer
    // mid-run, regenerate storageSession.json (+ BEARER_TOKEN) before building
    // this scenario's context. No-op locally and on a healthy session.
    ensureFreshUiSession();

    // Guard: storage state file MUST exist before any UI scenario runs.
    // Without it, every test that relies on Okta auth will fail with a
    // confusing redirect-loop error. Surfacing this clearly here avoids
    // wasted CI minutes and points the user at the right command.
    if (!fs.existsSync(STORAGE_STATE_PATH)) {
      throw new Error(
        `Authenticated storage state not found at ${STORAGE_STATE_PATH}. ` +
        `Run "npm run auth" locally (or restore the session artifact in CI) ` +
        `before executing BDD scenarios.`
      );
    }

    this.context = await sharedBrowser.newContext({

      storageState: STORAGE_STATE_PATH,

      ignoreHTTPSErrors: true,

      viewport: {
        width: 1280,
        height: 720
      }

    });

    this.page = await this.context.newPage();

    // Raise Playwright's per-action timeout to 120s so that individual clicks,
    // waitFor calls, and other actions without explicit timeouts don't hit the
    // 30s Playwright default under staging load (4 parallel suites can saturate
    // the server, causing elements to take >30s to stabilise before a click).
    this.page.setDefaultTimeout(120000);

    // IMPORTANT: initialize page objects here
    this.initPages();

    // ── Role impersonation ─────────────────────────────────────────────────────
    // The active role is injected via cucumber profile `worldParameters.role`
    // (falls back to the ROLE env var, then "superadmin"). For any role with an
    // `impersonate` target we apply it via the User Validation control before the
    // scenario's own steps run; impersonation persists for the life of this
    // context. Superadmin (impersonate: null) is a no-op — existing behaviour.
    const role = (this.parameters as { role?: string })?.role ?? process.env.ROLE;
    if (role) process.env.ROLE = role; // so shouldSkipReload (in gotoWithRetry) sees it
    const target = resolveRole(role);
    if (target.impersonate) {
      await impersonateAs(this.page, target.impersonate);
    }
    // ───────────────────────────────────────────────────────────────────────────

  }
);

// ---------------------------------------------------------------------------
// Before each @api scenario → validate BEARER_TOKEN only (no browser needed)
// ---------------------------------------------------------------------------
Before(
  { tags: '@api', timeout: 30000 },
  async function (this: PlaywrightWorld) {
    // API tests use ApiClient directly with BEARER_TOKEN.
    // No browser context or storageSession.json required.
    ensureApiToken();
  }
);

// ---------------------------------------------------------------------------
// After each scenario → cleanup + screenshot
// ---------------------------------------------------------------------------
After(
  { timeout: 60000 },
  async function (this: PlaywrightWorld, scenario) {

    try {

      if (scenario.result?.status === Status.FAILED && this.page) {

        const scenarioName = scenario.pickle.name
          .replace(/\s+/g, '_')
          .replace(/[^a-zA-Z0-9_]/g, '');

        const screenshotDir = path.resolve(__dirname, '../test-results');
        if (!fs.existsSync(screenshotDir)) {
          fs.mkdirSync(screenshotDir, { recursive: true });
        }

        const screenshotPath = path.resolve(
          screenshotDir,
          `bdd_${scenarioName}.png`
        );

        // 15s (was 5s): this is the failure-diagnostic screenshot. On a slow or
        // heavy page (exactly when a scenario fails) a fullPage capture can take
        // longer than 5s, which made the After hook itself emit a noisy
        // "page.screenshot: Timeout 5000ms exceeded". A larger budget lets the
        // diagnostic succeed; it's still wrapped in try/catch so a genuinely
        // unresponsive page never fails the hook.
        await this.page.screenshot({
          path: screenshotPath,
          timeout: 15000,
          fullPage: true
        });

        await this.attach(
          `Screenshot saved: ${screenshotPath}`,
          'text/plain'
        );

      }

    } catch (err) {
      console.log('After hook error ignored:', err);
    }

    await this.page?.close();
    await this.context?.close();
    await this.apiClient?.dispose();

  }
);