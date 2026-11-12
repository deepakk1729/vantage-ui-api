import { Page } from 'playwright';
import { ENV } from '../src/utils/env';
import { resolveRole } from '../config/roles';

const controlText = async (page: Page): Promise<string | null> =>
  ((await page.locator('.select-impersonator').textContent().catch(() => null)) || '').trim() || null;

/**
 * Impersonate a team member via the "User Validation" control.
 * In-memory state (lost on full reload) — applied once per scenario, then kept
 * alive by shouldSkipReload() which skips redundant navigations.
 */
/** Transient navigation errors seen on staging (intermittently degraded). */
const isTransientNavError = (msg: string): boolean =>
  /ERR_CONNECTION_CLOSED|ERR_NETWORK_CHANGED|ERR_CONNECTION_RESET|ERR_ABORTED|ERR_CONNECTION_REFUSED|ERR_TIMED_OUT|Timeout .* exceeded/i.test(msg);

export async function impersonateAs(page: Page, name: string): Promise<void> {
  // Retry the initial load: staging drops connections intermittently
  // (net::ERR_CONNECTION_CLOSED), which otherwise fails the whole scenario in the
  // Before hook. Mirrors PlaywrightWorld.gotoWithRetry (which this standalone
  // function can't reach). 3 attempts with linear backoff.
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.goto(ENV.BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
      break;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (attempt === 3 || !isTransientNavError(msg)) throw err;
      await page.waitForTimeout(1000 * attempt);
    }
  }
  // Let the ~1600-member roster load so the dropdown shows the search box (not the bucket fallback).
  await page.getByText('Please wait, while dashboard is loading').first()
    .waitFor({ state: 'hidden', timeout: 90000 }).catch(() => undefined);

  const trigger = page.locator('.select-impersonator');
  await trigger.waitFor({ state: 'visible', timeout: 60000 });
  if ((await controlText(page)) === name) return; // already impersonating

  // Open the dropdown; retry until the roster's search box is ready.
  const search = page.getByPlaceholder('Search Team Members');
  const deadline = Date.now() + 60000;
  while (!(await search.isVisible().catch(() => false))) {
    if (Date.now() > deadline) {
      throw new Error(`Impersonation failed for "${name}": search box never appeared (roster did not load).`);
    }
    await trigger.click();
    if (await search.waitFor({ state: 'visible', timeout: 6000 }).then(() => true).catch(() => false)) break;
    await trigger.click().catch(() => undefined);                 // toggle closed, retry
    await search.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => undefined);
  }

  await search.fill(name);
  const dropdown = page.locator('.impersonator-container');
  const exact = new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
  // Click the matching result (real click — selects the person).
  await dropdown.locator('.kt-searched-item').filter({ hasText: exact }).first().click();
  // Apply is "disabled" until the selection commits — wait for it to enable, then click.
  await dropdown.locator('.button-footer .apply:not(.disabled)').waitFor({ state: 'visible', timeout: 15000 });
  await dropdown.locator('.button-footer .apply').click();
  // Confirm the control now shows the person (React re-rendered as that role).
  await page.waitForFunction(
    (n: string) => document.querySelector('.select-impersonator')?.textContent?.trim() === n,
    name,
    { timeout: 30000 }
  );
}

/** Team member to impersonate for the active role, or null for superadmin. */
export function impersonationTarget(): string | null {
  return resolveRole(process.env.ROLE).impersonate;
}

/** Skip a reload when already on `url` as the active role — avoids wiping impersonation. */
export async function shouldSkipReload(page: Page, url: string): Promise<boolean> {
  const target = impersonationTarget();
  if (!target) return false;
  if (url.replace(/\/+$/, '') !== page.url().replace(/\/+$/, '')) return false;
  return (await controlText(page)) === target;
}
