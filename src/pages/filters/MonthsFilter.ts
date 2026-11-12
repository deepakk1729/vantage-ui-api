import { Page } from '@playwright/test';
import { BaseFilter } from './BaseFilter';

export class MonthsFilter extends BaseFilter {

  constructor(page: Page) {
    super(page, 'Months');
  }

  async selectMonth(month: string): Promise<void> {
    // The filter panel is a scrollable container; use JS click to bypass
    // Playwright's viewport boundary check on elements inside overflow:scroll.
    const filterContainer = this.page
      .locator('li')
      .filter({ has: this.filterHeader });
    const label = filterContainer
      .locator('label.reactCustomCheckbox', { hasText: month })
      .first();
    await label.evaluate(el => (el as HTMLElement).click());
  }

  async isMonthOptionVisible(month: string): Promise<boolean> {
    try {
      await this.page
        .locator('label.reactCustomCheckbox', { hasText: month })
        .waitFor({ state: 'visible', timeout: 8000 });
      return true;
    } catch {
      return false;
    }
  }

  async getVisibleMonthLabels(): Promise<string[]> {
    const labels = this.page.locator('label.reactCustomCheckbox');
    const count = await labels.count();
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await labels.nth(i).textContent())?.trim() ?? '';
      if (text) result.push(text);
    }
    return result;
  }

  /**
   * Clear the Months filter, scoped to the Months filter's own button-footer.
   * Overrides BaseFilter.clear() — the unscoped selector would otherwise click
   * the Date Range filter's Clear button (it renders earlier in the DOM),
   * disturbing the date range and the month options. Mirrors the scoped apply().
   */
  async clear(): Promise<void> {
    const filterContainer = this.page
      .locator('li')
      .filter({ has: this.filterHeader });
    await filterContainer.locator('.button-footer .clear').click();
  }

  async clearAndReopen(): Promise<void> {
    // Clicking "Clear" actually closes the Months filter panel (same toggle
    // behaviour as clicking the heading). We must re-open it afterwards so
    // that subsequent selectMonth() calls can find the month checkboxes.
    await this.clear();
    await this.open();
  }

  /**
   * Apply the Months filter by clicking the Apply button scoped to the
   * Months filter's own button-footer (not the Date Range filter's apply).
   * Overrides BaseFilter.apply() to use the correct scoped selector.
   */
  async apply(): Promise<void> {
    const filterContainer = this.page
      .locator('li')
      .filter({ has: this.filterHeader });
    await filterContainer.locator('.button-footer .apply').click();
  }

  async expandMonthOption(): Promise<void> {
    // Click the first month label text (not the checkbox) to expand its week sub-list
    const filterContainer = this.page
      .locator('li')
      .filter({ has: this.filterHeader });
    const firstMonthLabel = filterContainer
      .locator('label.reactCustomCheckbox')
      .first();
    await firstMonthLabel.scrollIntoViewIfNeeded();
    // Click the text span beside the checkbox to toggle expansion
    await firstMonthLabel.locator('span').last().click();
  }

  async clickMonthOption(month: string): Promise<void> {
    await this.page
      .locator('label.reactCustomCheckbox', { hasText: month })
      .click();
  }

  async areAllWeeksSelectedForMonth(_month: string): Promise<boolean> {
    // Week sub-items appear as date labels like "Dec-27", "Dec-20" etc.
    // They are rendered as checked checkboxes nested under the expanded month row.
    const filterContainer = this.page
      .locator('li')
      .filter({ has: this.filterHeader });
    // Sub-items are indented labels that follow the expanded month row
    const subItems = filterContainer
      .locator('label.reactCustomCheckbox')
      .filter({ hasText: /\w{3}-\d{2}/ });
    const count = await subItems.count();
    if (count === 0) return false;
    for (let i = 0; i < count; i++) {
      const checked = await subItems.nth(i).locator('input').isChecked();
      if (!checked) return false;
    }
    return true;
  }
}
