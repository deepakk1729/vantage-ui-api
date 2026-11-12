import { Page } from '@playwright/test';
import { BaseFilter } from './BaseFilter';

/**
 * LocationFilter
 *
 * Wraps the "Location" multi-select filter panel on the Home page
 * (and any other page that shares the global filter sidebar DOM).
 *
 * DOM structure (verified live on staging 2026-06-25):
 *   li (filter listitem)
 *     .filter-heading  — click to open/close; shows .selected-count badge after Apply
 *     .treeSelectContainer  — present when open (same structure as Practice Area)
 *       .react-tree-menu.vertical-wrapper > .vertical-dropdown
 *         .vertical-option                — "Select all" row
 *         .vertical-option.marginL0       — one per option (AP, EMESA, NAMR)
 *           .d-inline-flex.iconContainer  — expand toggle (not used for flat options)
 *           label.reactCustomCheckbox
 *             input[type=checkbox]        — invisible (opacity:0, 0×0px); use span.checkmark
 *             label                       — visible option text
 *             span.checkmark              — click this to toggle selection
 *       .button-footer
 *         .clear   — deselects all; closes panel
 *         .apply   — applies selection; closes panel ("apply disabled" when nothing selected)
 *
 * NOTE: The Location filter uses the SAME tree-select component as Practice Area,
 * NOT the flat .filter-display/.filter-name structure used by Path/Status/Management Model.
 */
export class LocationFilter extends BaseFilter {

  constructor(page: Page) {
    super(page, 'Location');
  }

  /**
   * Scopes every filter query to the Location <li> container to avoid
   * accidentally matching other filters that share the same inner classes.
   */
  private get locationLi() {
    return this.page
      .locator('li')
      .filter({ has: this.page.locator('.filter-heading', { hasText: 'Location' }) });
  }

  /**
   * Returns true when the open filter panel shows "No Record"
   * (i.e. no Location options are available in this environment).
   */
  private async hasNoRecord(): Promise<boolean> {
    try {
      await this.locationLi
        .getByText('No Record')
        .waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns true when the named option is visible in the open Location filter panel.
   * Checks the label text inside .vertical-option.marginL0 rows.
   * Returns false (not skipped) when the filter has no data — callers should assert
   * the option is present if they expect it.
   */
  async isOptionVisible(option: string): Promise<boolean> {
    if (await this.hasNoRecord()) return false;
    const exactPattern = new RegExp(`^${option.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
    try {
      await this.locationLi
        .locator('.vertical-option.marginL0')
        .filter({ has: this.page.locator('label label', { hasText: exactPattern }) })
        .waitFor({ state: 'visible', timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Selects the named option by clicking its span.checkmark element.
   * The native input[type=checkbox] is invisible; span.checkmark is the
   * interactable element that toggles the checkbox state.
   */
  async select(option: string): Promise<void> {
    // Fail loudly when the filter has no data — a selection scenario that
    // expected options but found "No Record" is a real failure, not a skip.
    if (await this.hasNoRecord()) {
      throw new Error(
        `Location filter shows "No Record" — cannot select "${option}". ` +
        `The filter has no data in this environment.`
      );
    }
    const exactPattern = new RegExp(`^${option.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
    const optionRow = this.locationLi
      .locator('.vertical-option.marginL0')
      .filter({ has: this.page.locator('label label', { hasText: exactPattern }) });
    await optionRow.waitFor({ state: 'visible', timeout: 15000 });
    await optionRow.locator('span.checkmark').click();
  }

  /**
   * Clicks the Apply button in the filter footer.
   * Waits for Apply to be enabled (at least one option selected) before clicking.
   */
  async apply(): Promise<void> {
    if (await this.hasNoRecord()) {
      throw new Error(
        'Location filter shows "No Record" — cannot Apply. ' +
        'The filter has no data in this environment.'
      );
    }
    await this.locationLi
      .locator('.button-footer .apply:not(.disabled)')
      .waitFor({ state: 'visible', timeout: 10000 });
    await this.locationLi.locator('.button-footer .apply').click();
  }
}
