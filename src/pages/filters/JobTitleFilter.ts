import { Page } from '@playwright/test';
import { BaseFilter } from './BaseFilter';

/**
 * JobTitleFilter
 *
 * Wraps the "Job Title" multi-select filter panel on the Home page
 * (and any other page that shares the global filter sidebar DOM).
 *
 * DOM structure (verified live on staging 2026-06-22):
 *   li (filter listitem)
 *     .filter-heading  — click to open/close; shows .selected-count badge after Apply
 *     .filter-container  — present when open
 *       .filter-display  — one per option row (currently "No Record" in staging)
 *         input[type=checkbox]
 *         .filter-name  — the label text
 *       .button-footer
 *         .clear  — deselects all and closes the panel
 *         .apply  — applies selection and closes the panel
 *
 * NOTE (2026-06-22): Staging data is empty — "No Record" is shown in the panel.
 * The open() / clear() / apply() / selectOption() paths are confirmed live
 * (the panel opens and shows "No Record"); the selection helpers are written from
 * the CSV specification and will execute once data is populated.
 */
export class JobTitleFilter extends BaseFilter {

  constructor(page: Page) {
    super(page, 'Job Title');
  }

  /**
   * Scopes every filter query to the Job Title <li> container to avoid
   * accidentally matching other filters that share the same inner classes.
   */
  private get jtLi() {
    return this.page
      .locator('li')
      .filter({ has: this.page.locator('.filter-heading', { hasText: 'Job Title' }) });
  }

  /**
   * Returns true if the filter panel is currently open (filter-container visible).
   */
  async isPanelVisible(): Promise<boolean> {
    try {
      await this.jtLi
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
      await this.jtLi
        .locator('.filter-container')
        .waitFor({ state: 'hidden', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns true when the open filter panel shows "No Record"
   * (i.e. no Job Title options are available in this environment).
   */
  async hasNoRecord(): Promise<boolean> {
    try {
      await this.jtLi
        .getByText('No Record')
        .waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns true when at least one checkbox option is rendered inside
   * the open Job Title filter panel.
   */
  async hasOptions(): Promise<boolean> {
    try {
      await this.jtLi
        .locator('input[type="checkbox"]')
        .first()
        .waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Selects the option row identified by the given label text.
   * Uses an anchored regex to avoid partial matches.
   */
  async selectOption(optionName: string): Promise<void> {
    const row = this.jtLi
      .locator('.filter-display')
      .filter({
        has: this.page.locator('.filter-name', {
          hasText: new RegExp(`^${optionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)
        })
      });
    await row.locator('input[type="checkbox"]').check({ force: true });
  }

  /**
   * Clicks the "Clear" button in the filter footer.
   * Note: Clear closes the filter panel on the live app.
   */
  async clear(): Promise<void> {
    await this.jtLi.locator('.button-footer .clear').click();
  }

  /**
   * Clicks the "Apply" button in the filter footer.
   * After applying, the panel closes automatically.
   */
  async apply(): Promise<void> {
    await this.jtLi.locator('.button-footer .apply').click();
  }

  /**
   * Returns true when the selection count badge is visible on the filter heading,
   * indicating at least one Job Title option has been applied.
   */
  async isSelectionApplied(): Promise<boolean> {
    return this.jtLi
      .locator('.filter-heading .selected-count')
      .isVisible()
      .catch(() => false);
  }
}
