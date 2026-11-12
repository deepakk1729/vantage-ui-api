import { Page, Locator, Download, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { shouldSkipReload } from '../../../support/impersonation';

export abstract class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigateTo(url: string): Promise<void> {
    await this.gotoWithRetry(url);
  }

  /**
   * Navigates to a URL with retry logic for transient network errors.
   * Retries up to 3 times with exponential backoff (500ms → 1s → 2s).
   * @param url URL to navigate to
   * @param options Navigation options (waitUntil, timeout, etc.)
   */
  protected async gotoWithRetry(
    url: string,
    options?: { waitUntil?: 'commit' | 'domcontentloaded' | 'load' | 'networkidle'; timeout?: number }
  ): Promise<void> {
    // Skip reload if already on this URL as the active role (keeps impersonation).
    if (await shouldSkipReload(this.page, url)) return;

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000, ...options });
        return; // Success
      } catch (error) {
        lastError = error as Error;
        const msg = lastError.message ?? '';
        // Mirror the retryable set in world.ts gotoWithRetry so navigation is
        // equally resilient everywhere (this was previously net::ERR-only here,
        // but the login/SPA redirect race throws the latter two — they are
        // transient and re-navigating succeeds).
        const isRetryable =
          msg.includes('net::ERR_CONNECTION_CLOSED') ||
          msg.includes('net::ERR_NETWORK_CHANGED') ||
          msg.includes('net::ERR_SOCKET_NOT_CONNECTED') ||
          msg.includes('chrome-error://chromewebdata') ||
          msg.includes('interrupted by another navigation');

        if (!isRetryable || attempt === maxRetries) {
          throw lastError; // Not a retryable error or last attempt
        }

        // Exponential backoff: 500ms → 1s → 2s
        const delayMs = 500 * Math.pow(2, attempt - 1);
        console.warn(
          `⚠ Attempt ${attempt}/${maxRetries}: ${lastError.message}. ` +
          `Retrying in ${delayMs}ms...`
        );
        await this.page.waitForTimeout(delayMs);
      }
    }

    throw lastError; // Should never reach here, but for type safety
  }

  async click(locator: Locator): Promise<void> {
    await locator.click();
  }

  async fill(locator: Locator, value: string): Promise<void> {
    await locator.fill(value);
  }

  async getText(locator: Locator): Promise<string> {
    return (await locator.textContent()) ?? '';
  }

  async isVisible(locator: Locator): Promise<boolean> {
    return await locator.isVisible();
  }

  async scrollTo(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
  }

  async waitForUrl(urlText: string): Promise<void> {
    await this.page.waitForURL(`**/*${urlText}*`);
  }

  async verifyTitle(expectedTitle: string): Promise<void> {
    await expect(this.page).toHaveTitle(expectedTitle);
  }

  async verifyUrlContains(urlText: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(urlText));
  }

  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `test-results/${name}.png`,
      fullPage: true,
    });
  }

  // ---------------------------------------------------------------------------
  // Shared sidebar navigation helper
  // ---------------------------------------------------------------------------

  /**
   * Returns the People-section sidebar submenu link for the given page name.
   *
   * The sidebar renders two `.sidebar-submenu-dropDown` containers (Business
   * Comparison and People) whose items all share the `.dropdown-link` class
   * (div[role="button"]). "Billability" appears under BOTH sections, so an
   * unscoped lookup is ambiguous (this is what the old `.nth(1)` worked around).
   * We scope to the People submenu — the only one that contains the unique
   * "Bill Rate" link — so every People page name resolves to exactly one link.
   *
   * Live-verified 2026-06-24: scoped match count = 1 for Billability,
   * Timesheets, Charges/Hours and Bill Rate.
   *
   * @param name  Submenu item text, e.g. "Billability", "Bill Rate".
   */
  protected peopleSubmenuLink(name: string): Locator {
    // Scope by "Timesheets" (unique to People/Reports, present for all roles incl.
    // Analyst which has no "Bill Rate"); BC's submenu has only "Billability".
    const peopleSubmenu = this.page.locator('.sidebar-submenu-dropDown').filter({
      has: this.page.locator('.dropdown-link', { hasText: 'Timesheets' })
    });
    return peopleSubmenu.locator('.dropdown-link', { hasText: name });
  }

  // ---------------------------------------------------------------------------
  // Shared Export/Download helpers
  //
  // Page-agnostic: every page in the app renders the same Export button
  // (button.download-container__btn, role=button, text "Export") and all page
  // objects previously duplicated these three helpers verbatim. Consolidated here
  // as the single source of truth.
  // ---------------------------------------------------------------------------

  /**
   * Returns true when the global "Export" button is present and not disabled.
   */
  async isExportButtonEnabled(): Promise<boolean> {
    const btn = this.page.getByRole('button', { name: 'Export' });
    if (!(await btn.isVisible())) return false;
    return !(await btn.isDisabled());
  }

  /**
   * Saves a Playwright Download to test-results/ and returns the full path,
   * creating the directory if it does not exist.
   */
  async saveDownload(download: Download): Promise<string> {
    const dir = path.resolve(__dirname, '../../../test-results');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const savePath = path.join(dir, download.suggestedFilename());
    await download.saveAs(savePath);
    return savePath;
  }

  /**
   * Returns the file size in bytes of the given path (0 if it does not exist).
   */
  getFileSizeBytes(filePath: string): number {
    try {
      return fs.statSync(filePath).size;
    } catch {
      return 0;
    }
  }

  // ---------------------------------------------------------------------------
  // Shared global-filter sidebar helper
  //
  // The global filter sidebar has identical DOM on every page:
  //   li (filter listitem)
  //     .filter-heading            — click to open/close (closed => li.children===1)
  //     .filter-container          — present only when open
  //       .filter-display          — one per option row
  //         .kt-m-checkbox > input — the checkbox
  //         .filter-name           — the label text
  // All four People page objects previously duplicated this method.
  // ---------------------------------------------------------------------------

  /**
   * Selects a named checkbox option within a named global-filter panel.
   *
   * Re-opens the panel if it closed (e.g. after a Clear) and uses an anchored
   * regex (^optionName$) so "Active" never matches "Inactive". Clicks the
   * checkbox input directly with `{ force: true }` — live-validated (2026-06-24
   * on /people/billing) as the most deterministic interaction: it toggles the
   * React-controlled checkbox regardless of row-coordinate overlap.
   *
   * @param optionName  Exact label text, e.g. "PA Managed", "Active".
   * @param filterName  Filter panel name, e.g. "Management Model", "Status".
   */
  async selectGlobalFilterOption(optionName: string, filterName: string): Promise<void> {
    const filterLi = this.page.locator('li').filter({
      has: this.page.locator('.filter-heading', { hasText: filterName })
    });

    // Re-open the panel if closed (li has only the heading child).
    const isOpen = await filterLi.evaluate((el: HTMLElement) => el.children.length > 1);
    if (!isOpen) {
      await filterLi.locator('.filter-heading').click();
      await filterLi.locator('.filter-display').first().waitFor({ state: 'visible', timeout: 15000 });
    }

    const exactNameRegex = new RegExp(`^${optionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
    const optionRow = filterLi
      .locator('.filter-display')
      .filter({ has: this.page.locator('.filter-name').getByText(exactNameRegex) });
    await optionRow.waitFor({ state: 'visible', timeout: 15000 });
    await optionRow.locator('input[type="checkbox"]').click({ force: true });
  }
}