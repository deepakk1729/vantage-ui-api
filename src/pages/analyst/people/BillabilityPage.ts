import { Locator, Page, Download } from '@playwright/test';
import { BasePage } from '../../base/BasePage';

/**
 * Analyst Reports > Billability page.
 *
 * Shows "Billability by Month" — a personal monthly view (not by team member).
 * URL: /people/billing
 * Columns: Month | Case Billability | CD Billability | Case Chgs ($K) | Theo Cap Chgs ($K)
 * Legend: Case | Case w/o # | BD | Investment | Innovation Fund | Other/Admin
 * ("Client w/o #" belongs to the separate Utilization Category dropdown on home
 * tiles, not this legend — confirmed live via DOM inspection: 0 matches anywhere
 * on the page.)
 * No "Expand all rows" button — personal data only.
 */
export class BillabilityPage extends BasePage {

  readonly billabilityMenuLink: Locator;
  readonly billabilityHeader: Locator;
  readonly tableBody: Locator;
  readonly tableHeaderRow: Locator;
  readonly exportButton: Locator;
  readonly infoIcon: Locator;

  constructor(page: Page) {
    super(page);

    // Scoped to the People/Reports submenu (unique by "Timesheets" link presence)
    this.billabilityMenuLink = this.peopleSubmenuLink('Billability');

    // Analyst sees "Billability by Month" (not "Billability by Team Member")
    this.billabilityHeader = page.getByText('Billability by Month');

    // Table structure — analyst's billability page uses the same div-grid pattern
    this.tableBody = page.locator('.chart__table__body');
    this.tableHeaderRow = page.locator('.chart__table__header');

    this.exportButton = page.getByRole('button', { name: /Export/i });
    this.infoIcon = page.locator('img[alt="info"]');
  }

  async navigateToBillabilityPage(): Promise<void> {
    await this.billabilityMenuLink.waitFor({ state: 'visible', timeout: 15000 });
    await this.billabilityMenuLink.click();
    // Wait for the "Billability by Month" header to confirm navigation
    await this.billabilityHeader.waitFor({ state: 'visible', timeout: 30000 });
  }

  async isBillabilityHeaderVisible(): Promise<boolean> {
    try {
      await this.billabilityHeader.waitFor({ state: 'visible', timeout: 15000 });
      return true;
    } catch {
      return false;
    }
  }

  async isBillabilityMenuLinkVisible(): Promise<boolean> {
    try {
      await this.billabilityMenuLink.waitFor({ state: 'visible', timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns true when the monthly billability table is visible.
   * Unlike the team-member view there is no "Expand all rows" button —
   * we simply wait for the table body to contain at least one row.
   */
  async isMonthlyTableVisible(): Promise<boolean> {
    try {
      await this.billabilityHeader.waitFor({ state: 'visible', timeout: 15000 });
      await this.tableBody.waitFor({ state: 'visible', timeout: 30000 });
      // Wait for at least one data row to appear
      // BUG FIX: waitForFunction(fn, options) is wrong for a zero-param fn — Playwright's
      // real signature is (fn, arg, options), so the options object was being passed as
      // `arg` (ignored) and this silently fell back to the page's 120000ms default action
      // timeout instead of the declared 30000ms. Pass `null` for arg to fix it.
      await this.page.waitForFunction(
        () => {
          const body = document.querySelector('.chart__table__body');
          return body !== null && body.children.length > 0;
        },
        null,
        { timeout: 30000 }
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns the text labels of each column header in the Billability table.
   */
  async getTableColumnHeaders(): Promise<string[]> {
    await this.tableHeaderRow.waitFor({ state: 'visible', timeout: 15000 });
    const headerCells = this.tableHeaderRow.locator('> *');
    const count = await headerCells.count();
    const headers: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = ((await headerCells.nth(i).textContent()) ?? '').trim();
      if (text) {
        headers.push(text);
      }
    }
    return headers;
  }

  /**
   * Returns an array of month strings from the first column of the table.
   * e.g. ["Dec 2025", "Nov 2025", ...]
   */
  async getTableMonths(): Promise<string[]> {
    await this.tableBody.waitFor({ state: 'visible', timeout: 30000 });
    return this.page.evaluate(() => {
      const body = document.querySelector('.chart__table__body');
      if (!body) return [];
      const rows = Array.from(body.children);
      return rows.map(row => {
        // First child div in each row is the month column
        const firstCell = row.querySelector('div, td') as HTMLElement | null;
        return firstCell ? (firstCell.textContent ?? '').trim() : '';
      }).filter(t => t.length > 0);
    });
  }

  async isExportButtonVisible(): Promise<boolean> {
    try {
      await this.exportButton.first().waitFor({ state: 'visible', timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns true when the billability legend is visible above the table.
   * Analyst sees 6 categories: Case, Case w/o #, BD, Investment, Innovation Fund,
   * Other/Admin.
   */
  async isBillabilityColorLegendVisible(): Promise<boolean> {
    try {
      const legendContainer = this.page.locator(
        '.kt-table-container__chart__headers__second_row__legends'
      );
      await legendContainer.waitFor({ state: 'visible', timeout: 15000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns true when the named legend category is visible.
   */
  async isLegendCategoryVisible(category: string): Promise<boolean> {
    try {
      const legendContainer = this.page.locator(
        '.kt-table-container__chart__headers__second_row__legends'
      );
      await legendContainer.waitFor({ state: 'visible', timeout: 15000 });
      const item = legendContainer.getByText(category, { exact: true }).first();
      await item.waitFor({ state: 'visible', timeout: 10000 });
      return true;
    } catch {
      // Fallback: search page-wide for the category text
      try {
        const item = this.page.getByText(category, { exact: true }).first();
        await item.waitFor({ state: 'visible', timeout: 5000 });
        return true;
      } catch {
        return false;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Export methods
  // ---------------------------------------------------------------------------

  /**
   * Clicks the Export button on the Billability page and waits for the
   * Playwright download event to fire.
   */
  async clickExportAndWaitForDownload(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent('download', { timeout: 60000 }),
      this.exportButton.first().click(),
    ]);
    return download;
  }
}
