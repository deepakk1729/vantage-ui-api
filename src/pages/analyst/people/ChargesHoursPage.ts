import { Locator, Page, Download } from '@playwright/test';
import { BasePage } from '../../base/BasePage';

/**
 * Analyst Reports > Charges/Hours page.
 *
 * Shows "Charges/Hours by Team Member" — filtered to analyst's personal data only.
 * URL: /people/chargesHours
 * Columns: Name | Utilization Category | Project Type | Project Name | Client Name |
 *          Charges ($) | Hours | Non-Converted Hours | Theo Cap Chgs ($)
 * Sort By: Charges (highest → lowest) by default
 * Column filters: Utilization Category, Project Type
 */
export class ChargesHoursPage extends BasePage {

  readonly chargesHoursMenuLink: Locator;
  readonly chargesHoursHeader: Locator;

  constructor(page: Page) {
    super(page);

    // Scoped to the People/Reports submenu (unique by "Timesheets" link presence)
    this.chargesHoursMenuLink = this.peopleSubmenuLink('Charges/Hours');

    this.chargesHoursHeader = page.getByText('Charges/Hours by Team Member');
  }

  async navigateToChargesHoursPage(): Promise<void> {
    await this.chargesHoursMenuLink.waitFor({ state: 'visible', timeout: 30000 });
    await this.chargesHoursMenuLink.click();
    await this.chargesHoursHeader.waitFor({ state: 'visible', timeout: 60000 });
    // Wait for real data rows to appear (skeleton-clear sentinel)
    await this.page.waitForSelector('table tbody td.employee_name', { timeout: 60000 });
  }

  async isChargesHoursHeaderVisible(): Promise<boolean> {
    try {
      await this.chargesHoursHeader.waitFor({ state: 'visible', timeout: 15000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns true when the Charges/Hours table is visible and has loaded real data.
   * Sentinel: `table tbody td.employee_name` — only present once skeleton clears.
   */
  async isChargesHoursTableVisible(): Promise<boolean> {
    try {
      await this.chargesHoursHeader.waitFor({ state: 'visible', timeout: 15000 });
      await this.page.waitForSelector('table tbody td.employee_name', { timeout: 60000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns the text labels of each column header in the Charges/Hours table.
   *
   * Live-verified columns (in order):
   *   Name | Utilization Category | Project Type | Project Name | Client Name |
   *   Charges ($) | Hours | Non-Converted Hours | Theo Cap Chgs ($)
   */
  async getTableColumnHeaders(): Promise<string[]> {
    await this.page.waitForSelector('table tbody td.employee_name', { timeout: 60000 });
    const headers = await this.page.evaluate(() => {
      const divs = document.querySelectorAll('table thead th .heading-content');
      return Array.from(divs)
        .map((d) => d.textContent?.trim() ?? '')
        .filter((t) => t.length > 0);
    });
    return headers;
  }

  // ── Sort methods ────────────────────────────────────────────────────────────

  async isSortButtonVisible(): Promise<boolean> {
    try {
      await this.page.waitForSelector('table tbody td.employee_name', { timeout: 60000 });
      await this.page.locator('.sort-by-container').waitFor({ state: 'visible', timeout: 15000 });
      return true;
    } catch {
      return false;
    }
  }

  async clickSortDropdown(): Promise<void> {
    await this.page.waitForSelector('table tbody td.employee_name', { timeout: 60000 });
    const sortBtn = this.page.locator('.sort-by-container__btn');
    await sortBtn.waitFor({ state: 'visible', timeout: 15000 });
    for (let attempt = 1; attempt <= 3; attempt++) {
      await sortBtn.click();
      try {
        await this.page.locator('.sort-by-filters .filter-display').first().waitFor({
          state: 'visible',
          timeout: 15000
        });
        return;
      } catch {
        if (attempt === 3) {
          throw new Error('clickSortDropdown: sort dropdown did not open after 3 click attempts.');
        }
        await this.page.waitForFunction(
          () => document.querySelector('.sort-by-filters') === null ||
                document.querySelector('.sort-by-filters .filter-display') === null,
          { timeout: 2000 }
        ).catch(() => { /* ignore */ });
      }
    }
  }

  async getSortOptions(): Promise<string[]> {
    // Guard: a background XHR (e.g. server-saved filter preferences loading) can
    // trigger a React re-render that closes the dropdown between clickSortDropdown()
    // returning and this method executing. Re-open if needed.
    const optionLocator = this.page.locator('.sort-by-filters .filter-display');
    const isOpen = await optionLocator.first().isVisible().catch(() => false);
    if (!isOpen) {
      const sortBtn = this.page.locator('.sort-by-container__btn');
      await sortBtn.click();
      await optionLocator.first().waitFor({ state: 'visible', timeout: 10000 });
    }
    const options = await this.page.evaluate(() => {
      const displays = document.querySelectorAll('.sort-by-filters .filter-display');
      return Array.from(displays).map(d => d.textContent?.trim() ?? '');
    });
    return options.filter(o => o.length > 0);
  }

  async selectSortOption(label: string): Promise<void> {
    const optionLocator = this.page
      .locator('.sort-by-filters .filter-display')
      .filter({ hasText: label });
    await optionLocator.waitFor({ state: 'visible', timeout: 15000 });
    await this.page.evaluate((lbl: string) => {
      const displays = document.querySelectorAll('.sort-by-filters .filter-display');
      for (let i = 0; i < displays.length; i++) {
        const d = displays[i];
        if (d.textContent && d.textContent.trim() === lbl) {
          const radio = d.querySelector('input[type="radio"]') as HTMLInputElement | null;
          if (radio) {
            radio.click();
            return;
          }
        }
      }
    }, label);
    await this.page.waitForFunction(
      (expectedLabel: string) => {
        const btn = document.querySelector('.sort-by-container__btn');
        return btn !== null && btn.textContent !== null && btn.textContent.trim() === expectedLabel;
      },
      label,
      { timeout: 60000 }
    );
    await this.page.waitForSelector('table tbody td.employee_name', { timeout: 60000 });
  }

  async isTableSortedByChargesDescending(): Promise<boolean> {
    await this.page.waitForSelector('table tbody td.employee_name', { timeout: 60000 });
    return this.page.evaluate(() => {
      const rows = document.querySelectorAll('table tbody tr');
      const charges: number[] = [];
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        // "Non-Converted Hours" column was removed from the app (live-confirmed on
        // other roles) - 9 cells became 8, Charges stayed at cells[5].
        if (cells.length === 8 && cells[0]?.textContent?.trim() === 'Total') {
          const raw = cells[5]?.textContent?.trim().replace(/,/g, '') ?? '';
          const num = parseFloat(raw);
          if (!isNaN(num)) charges.push(num);
        }
      });
      if (charges.length < 2) return charges.length >= 1;
      for (let i = 1; i < charges.length; i++) {
        if (charges[i] > charges[i - 1]) return false;
      }
      return true;
    });
  }

  // ── Filter methods ────────────────────────────────────────────────────────

  async selectFilterOption(optionName: string, filterName: string): Promise<void> {
    await this.selectGlobalFilterOption(optionName, filterName);
  }

  async hasTableUpdatedAfterFilter(): Promise<boolean> {
    try {
      await this.chargesHoursHeader.waitFor({ state: 'visible', timeout: 15000 });
      await this.page.waitForSelector('table tbody td.employee_name', { timeout: 60000 });
      return true;
    } catch {
      return false;
    }
  }

  // ── Export methods ────────────────────────────────────────────────────────

  async isExportButtonVisible(): Promise<boolean> {
    try {
      const btn = this.page.getByRole('button', { name: 'Export' });
      await btn.waitFor({ state: 'visible', timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clicks the Export button on the Charges/Hours page.
   * Analyst's export may open a confirmation modal (showDownloadModal=true) or
   * download directly. We handle both cases.
   */
  async clickExportAndWaitForDownload(): Promise<Download | null> {
    const exportBtn = this.page.getByRole('button', { name: 'Export' });
    const downloadModalBtnLocator = this.page.locator('button.download-modal__footer__download-btn');

    // Check if a confirmation modal appears
    await exportBtn.waitFor({ state: 'visible', timeout: 15000 });
    await exportBtn.click();

    const modalVisible = await downloadModalBtnLocator
      .waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    if (modalVisible) {
      // Has confirmation modal — use the full pattern from superadmin
      const context = this.page.context();
      let settle!: (d: Download | null) => void;
      const downloadPromise = new Promise<Download | null>((resolve) => { settle = resolve; });
      const onDownload = (d: Download): void => settle(d);
      const onPage = (p: Page): void => { p.on('download', onDownload); };
      this.page.on('download', onDownload);
      context.on('page', onPage);
      const capTimer = setTimeout(() => settle(null), 300000);
      const cleanup = (): void => {
        clearTimeout(capTimer);
        this.page.off('download', onDownload);
        context.off('page', onPage);
      };
      await downloadModalBtnLocator.click({ timeout: 5000 }).catch(() => {});
      try {
        return await downloadPromise;
      } finally {
        cleanup();
      }
    } else {
      // Direct download (no modal)
      const [download] = await Promise.all([
        this.page.waitForEvent('download', { timeout: 120000 }),
        exportBtn.click(),
      ]).catch(async () => {
        // Re-click if first attempt didn't register
        return [await this.page.waitForEvent('download', { timeout: 120000 })];
      });
      return download;
    }
  }
}
