import { Page } from '@playwright/test';
import { BaseFilter } from './BaseFilter';

export class StatusFilter extends BaseFilter {

  constructor(page: Page) {
    super(page, 'Status');
  }

  /**
   * Scopes every filter query to the Status <li> container to avoid
   * accidentally matching other filters that share the same inner classes.
   */
  private get statusLi() {
    return this.page
      .locator('li')
      .filter({ has: this.page.locator('.filter-heading', { hasText: 'Status' }) });
  }

  /**
   * Returns true when the filter panel is open but shows "No Record"
   * (i.e. no Status options are available in this environment).
   */
  async hasNoRecord(): Promise<boolean> {
    try {
      await this.statusLi
        .getByText('No Record')
        .waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns true when at least one checkbox option is rendered inside
   * the open Status filter panel.
   */
  async hasOptions(): Promise<boolean> {
    try {
      await this.statusLi
        .locator('input[type="checkbox"]')
        .first()
        .waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns true if the filter panel is currently open (filter-container present).
   */
  async isPanelVisible(): Promise<boolean> {
    try {
      await this.statusLi
        .locator('.filter-container')
        .waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns true if the filter panel is currently closed.
   */
  async isClosed(): Promise<boolean> {
    try {
      await this.statusLi
        .locator('.filter-container')
        .waitFor({ state: 'hidden', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns true if the given option label is visible in the open panel.
   * Uses an anchored regex to avoid partial matches (e.g. "Active" inside "Inactive").
   */
  async isOptionVisible(option: string): Promise<boolean> {
    return this.statusLi
      .locator('.filter-display', { hasText: new RegExp(`^${option}$`) })
      .isVisible();
  }

  /**
   * Selects the option row identified by the given label text.
   * Uses an anchored regex to avoid partial matches (e.g. "Active" inside "Inactive").
   */
  async select(option: string): Promise<void> {
    const row = this.statusLi
      .locator('.filter-display')
      .filter({ has: this.page.locator('.filter-name', { hasText: new RegExp(`^${option}$`) }) });
    await row.locator('input[type="checkbox"]').check({ force: true });
  }

  /**
   * Clicks the "Select all" control inside the Status filter panel.
   */
  async selectAll(): Promise<void> {
    await this.statusLi.getByText('Select all').click();
  }

  /**
   * Clicks the "Clear" button in the filter footer.
   * Note: Clear closes the filter panel on the live app.
   */
  async clear(): Promise<void> {
    await this.statusLi.locator('.button-footer .clear').click();
  }

  /**
   * Clicks the "Apply" button in the filter footer.
   * After applying, the panel closes automatically.
   */
  async apply(): Promise<void> {
    await this.statusLi.locator('.button-footer .apply').click();
  }

  /**
   * Returns true when every checkbox inside the open panel is checked.
   */
  async areAllOptionsChecked(): Promise<boolean> {
    const checkboxes = this.statusLi.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    if (count === 0) return false;
    for (let i = 0; i < count; i++) {
      if (!(await checkboxes.nth(i).isChecked())) return false;
    }
    return true;
  }
}
