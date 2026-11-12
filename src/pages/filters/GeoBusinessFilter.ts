import { Page } from '@playwright/test';
import { BaseFilter } from './BaseFilter';

/**
 * GeoBusinessFilter
 *
 * Wraps the "Geo Business" multi-select filter panel on the Home page
 * (and any other page that shares the global filter sidebar DOM).
 *
 * DOM structure (verified live on staging 2026-06-25):
 *   li (filter listitem)
 *     .filter-heading          — click to open/close; shows .selected-count badge after Apply
 *     .filter-container        — present when open
 *       .filter-list
 *         .filter-display      — "Select all" row (no checkbox)
 *           .filter-name.all   — "Select all" text
 *         .filter-display      — one per option (Geo ME, GRC, IND, LATAM, NEA, SEA)
 *           .kt-m-checkbox
 *             input[type=checkbox]   — React-controlled; input.checked NEVER flips,
 *                                      so use .click({ force: true }) instead of .check()
 *             label.checkbox-label
 *           .filter-name       — the visible option text
 *       .button-footer
 *         .clear               — deselects all; closes panel
 *         .apply               — applies selection; closes panel
 *
 * Live options confirmed 2026-06-25: Geo ME, GRC, IND, LATAM, NEA, SEA
 *
 * Design rules (do NOT regress):
 *  - open(): idempotent — retries until a .filter-display row is visible (45s budget).
 *  - waitForPanelContent(): returns 'no-record' | 'has-options' | 'empty-timeout'.
 *  - select(): THROWS on 'no-record' (loud failure by design).
 *  - apply(): THROWS on 'no-record'.
 *  - Uses input[type=checkbox].click({ force: true }) — NOT .check().
 */
export class GeoBusinessFilter extends BaseFilter {

  constructor(page: Page) {
    super(page, 'Geo Business');
  }

  /**
   * Scopes every filter query to the Geo Business <li> container.
   */
  private get geoBusinessLi() {
    return this.page
      .locator('li')
      .filter({ has: this.page.locator('.filter-heading', { hasText: 'Geo Business' }) });
  }

  /**
   * Opens the Geo Business filter panel.
   * Idempotent: if the panel is already open (a .filter-display row is visible),
   * returns immediately.  Retries the heading click on React state-reset until a
   * .filter-display row is visible, with a 45-second total budget.
   *
   * Key invariant: only click the heading when the panel CONTAINER is closed.
   * Clicking while the container is open-but-loading would toggle it shut (the
   * heading acts as a toggle), causing a 45-second spin.  Instead, when the
   * container is open we simply wait longer for content to appear.
   */
  async open(): Promise<void> {
    const firstDisplay = this.geoBusinessLi.locator('.filter-display').first();

    // Fast-path: options row already visible.
    if (await firstDisplay.isVisible().catch(() => false)) return;

    // Fast-path: filter is already open and showing "No Record" (no data for this role).
    const alreadyNoRecord = await this.geoBusinessLi
      .getByText('No Record', { exact: true })
      .isVisible()
      .catch(() => false);
    if (alreadyNoRecord) return;

    const panelContainer = this.geoBusinessLi.locator('.filter-container');
    const heading = this.geoBusinessLi.locator('.filter-heading');

    // Wait for the heading to appear — the sidebar mounts async.
    // Throw (don't swallow) so a missing heading produces a clear error rather
    // than a silent 90-second spin that looks like a data problem.
    await heading.waitFor({ state: 'visible', timeout: 20000 });

    // Let any in-flight network requests settle before interacting with filters.
    // In the full suite, prior scenarios can leave the server under load; a brief
    // networkidle wait gives the filter API time to become responsive.
    await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => undefined);

    const deadline = Date.now() + 120000;
    let emptyAttempts = 0;

    while (Date.now() < deadline) {
      // Check for "No Record" BEFORE any click decision — "No Record" can appear
      // outside .filter-container, so containerOpen=false wouldn't detect it and
      // a stray heading click would toggle the panel shut and hide the text.
      const noRecordNow = await this.geoBusinessLi
        .getByText('No Record', { exact: true })
        .isVisible()
        .catch(() => false);
      if (noRecordNow) return;

      // Only click when the container is closed — heading is a toggle, clicking
      // while container is open-but-loading would close it again.
      const containerOpen = await panelContainer.isVisible().catch(() => false);
      if (!containerOpen) {
        // force:true bypasses pointer-events / overlap checks that can silently
        // prevent the click while tiles are still loading over the sidebar.
        await heading.click({ force: true }).catch(() => undefined);
        await this.page.waitForTimeout(800);
        emptyAttempts = 0;
      }

      // Use waitForPanelContent — it handles both options and no-record states;
      // checking .filter-display.first() alone misses the no-record case.
      // 10 s per window gives the filter API enough time on a loaded server.
      const state = await this.waitForPanelContent(10000);
      if (state === 'has-options' || state === 'no-record') return;

      // 'empty-timeout': panel is open but still loading. After 3 consecutive
      // empty windows (30 s), force-toggle closed and reopen — this triggers a
      // fresh API call for the filter options which may have silently failed.
      emptyAttempts++;
      if (emptyAttempts >= 3) {
        await heading.click({ force: true }).catch(() => undefined);
        await this.page.waitForTimeout(1000);
        emptyAttempts = 0;
      }
    }

    throw new Error(
      'GeoBusinessFilter.open(): panel did not open within 120 s. ' +
      'No .filter-display row became visible after repeated heading clicks.'
    );
  }

  /**
   * Waits for the panel content to resolve to one of three states:
   *  - 'no-record'  : the panel shows "No Record" (no data available)
   *  - 'has-options': at least one selectable option is visible
   *  - 'empty-timeout': neither state appeared within the timeout
   *
   * @param timeout  Maximum wait in milliseconds (default 10 000 ms).
   */
  async waitForPanelContent(timeout = 10000): Promise<'no-record' | 'has-options' | 'empty-timeout'> {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      // Check for "No Record" text anywhere in the filter li — the exact wrapper
      // class differs between filter states, so scope to the whole li not .filter-container.
      const noRecord = await this.geoBusinessLi
        .getByText('No Record', { exact: true })
        .isVisible()
        .catch(() => false);
      if (noRecord) return 'no-record';

      // Check for selectable options (filter-display rows with a checkbox).
      const hasOptions = await this.geoBusinessLi
        .locator('.filter-display .kt-m-checkbox')
        .first()
        .isVisible()
        .catch(() => false);
      if (hasOptions) return 'has-options';

      await this.page.waitForTimeout(300);
    }
    return 'empty-timeout';
  }

  /**
   * Returns true when the named option is visible in the open filter panel.
   * Opens the panel first (idempotent).  Returns false on 'no-record'.
   */
  async isOptionVisible(option: string): Promise<boolean> {
    await this.open();
    const state = await this.waitForPanelContent();
    if (state === 'no-record') return false;
    try {
      // Use getByText on the filter container — robust against CSS class changes.
      await this.geoBusinessLi
        .locator('.filter-container')
        .getByText(option, { exact: false })
        .first()
        .waitFor({ state: 'visible', timeout: 15000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Selects the named option by clicking its input[type=checkbox] with force: true.
   * Opens the panel first (idempotent).
   * THROWS on 'no-record' — a selection scenario that expected options but found
   * "No Record" is a real failure, not a silent skip.
   */
  async select(option: string): Promise<void> {
    await this.open();
    const state = await this.waitForPanelContent();
    if (state === 'no-record') {
      throw new Error(
        `GeoBusinessFilter.select("${option}"): filter shows "No Record" — ` +
        'cannot select an option. The filter has no data in this environment.'
      );
    }
    const optionRow = this.geoBusinessLi
      .locator('.filter-display')
      .filter({ has: this.page.locator('.filter-name', { hasText: option }) })
      .first();
    await optionRow.waitFor({ state: 'visible', timeout: 15000 });
    // Use input[type=checkbox].click({ force: true }).
    // The React .kt-checkbox native input.checked never flips, so .check() hangs.
    await optionRow.locator('input[type="checkbox"]').click({ force: true });
  }

  /**
   * Clicks the Apply button in the filter footer.
   * THROWS on 'no-record' (consistent with select()).
   */
  async apply(): Promise<void> {
    await this.open();
    const state = await this.waitForPanelContent();
    if (state === 'no-record') {
      throw new Error(
        'GeoBusinessFilter.apply(): filter shows "No Record" — ' +
        'cannot Apply. The filter has no data in this environment.'
      );
    }
    await this.geoBusinessLi
      .locator('.button-footer .apply')
      .click();
  }

  /**
   * Returns true when the filter panel is closed (no .filter-container present).
   */
  async isClosed(): Promise<boolean> {
    const hasContainer = await this.geoBusinessLi
      .locator('.filter-container')
      .isVisible()
      .catch(() => false);
    return !hasContainer;
  }

  /**
   * Returns true when the filter heading shows a .selected-count badge
   * (i.e. at least one option has been applied).
   */
  async isSelectionApplied(): Promise<boolean> {
    return this.geoBusinessLi
      .locator('.filter-heading .selected-count')
      .isVisible()
      .catch(() => false);
  }
}
