import { Locator, Page, Download } from '@playwright/test';
import { BasePage } from '../../base/BasePage';

export class BillabilityPage extends BasePage {

  readonly billabilityMenuLink: Locator;
  readonly billabilityHeader: Locator;
  readonly tableBody: Locator;
  readonly tableHeaderRow: Locator;
  readonly expandAllRowsButton: Locator;
  readonly billabilityBarColumn: Locator;
  readonly infoIcon: Locator;

  constructor(page: Page) {
    super(page);

    // People > Billability submenu link. "Billability" appears under both the
    // Business Comparison and People sections, so scope to the People submenu
    // (see BasePage.peopleSubmenuLink) instead of the fragile positional .nth(1).
    this.billabilityMenuLink = this.peopleSubmenuLink('Billability');
    this.billabilityHeader = page.getByText('Billability by Team Member');

    // Table structure locators (the table is a custom div grid, not a native <table>)
    this.tableBody = page.locator('.chart__table__body');
    this.tableHeaderRow = page.locator('.chart__table__header');
    this.expandAllRowsButton = page.getByText('Expand all rows');
    this.billabilityBarColumn = page.locator('.bar_chart').first();

    // Info icon inline with the page header
    this.infoIcon = page.locator('img[alt="info"]');
  }

  async navigateToBillabilityPage(): Promise<void> {
    // Wait for the menu link to be clickable before navigating
    await this.billabilityMenuLink.waitFor({ state: 'visible', timeout: 15000 });
    await this.billabilityMenuLink.click();
    // Wait for the page header AND the expand/collapse control to be rendered,
    // confirming the React table has fully mounted before any interaction.
    await this.billabilityHeader.waitFor({ state: 'visible', timeout: 30000 });
    await this.expandAllRowsButton.waitFor({ state: 'visible', timeout: 30000 });
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
   * Returns true when the team member table is visible below the page header.
   * Checks that the table body container is visible and at least one data row
   * (the "Expand all rows" control) is present, indicating data has loaded.
   */
  async isTeamMemberTableVisible(): Promise<boolean> {
    try {
      await this.billabilityHeader.waitFor({ state: 'visible', timeout: 15000 });
      await this.tableBody.waitFor({ state: 'visible', timeout: 15000 });
      await this.expandAllRowsButton.waitFor({ state: 'visible', timeout: 15000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns the text labels of each column header in the Billability table.
   * The last column (billability bar chart) has no text label, so it is excluded.
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
   * Returns true when the billability bar chart column is visible in the table.
   * The bar chart is rendered inside cells with class "bar_chart bar_chart_cell".
   */
  async isBillabilityBarColumnVisible(): Promise<boolean> {
    try {
      await this.billabilityBarColumn.waitFor({ state: 'visible', timeout: 15000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Hovers over the info icon next to the "Billability by Team Member" header
   * to trigger the tooltip display.
   */
  async hoverOverInfoIcon(): Promise<void> {
    await this.infoIcon.waitFor({ state: 'visible', timeout: 15000 });
    await this.infoIcon.hover();
  }

  /**
   * Returns true when the tooltip with the given text is visible on the page.
   * The tooltip has role="tooltip" and appears on hover of the info icon.
   */
  async isTooltipVisible(tooltipText: string): Promise<boolean> {
    try {
      const tooltip = this.page.getByRole('tooltip', { name: tooltipText });
      await tooltip.waitFor({ state: 'visible', timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Expand / Collapse methods
  // ---------------------------------------------------------------------------

  /**
   * Returns true when the "Expand all rows" button is visible below the header.
   * The control is div.chart__table__body__sortby__option with role="button".
   */
  async isExpandAllRowsButtonVisible(): Promise<boolean> {
    try {
      await this.expandAllRowsButton.waitFor({ state: 'visible', timeout: 15000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clicks the expand/collapse toggle button by its current label text.
   * Accepts "Expand all rows" or "Collapse all rows".
   */
  async clickExpandCollapseButton(label: string): Promise<void> {
    const btn = this.page.locator('.chart__table__body__sortby__option');
    await btn.waitFor({ state: 'visible', timeout: 15000 });
    // noWaitAfter: the click expands ~1400 rows and the app schedules something
    // Playwright reads as a navigation, so the default post-click "wait for
    // scheduled navigations to finish" hangs until the action timeout. The label
    // flip below is the authoritative completion signal, so skip that wait.
    await btn.click({ noWaitAfter: true });
    // Wait for the label to change to confirm the action completed.
    // With up to ~1400 rows to expand/collapse, this can take over 30 seconds —
    // use a 60-second timeout to avoid flaky timeouts on large data sets.
    const opposite = label === 'Expand all rows' ? 'Collapse all rows' : 'Expand all rows';
    await this.page.waitForFunction(
      (expectedLabel: string) => {
        const el = document.querySelector('.chart__table__body__sortby__option');
        return el ? el.textContent?.trim() === expectedLabel : false;
      },
      opposite,
      { timeout: 60000 }
    );
  }

  /**
   * Returns true when the expand/collapse toggle button currently shows the
   * given label text ("Expand all rows" or "Collapse all rows").
   */
  async isExpandCollapseButtonLabelVisible(label: string): Promise<boolean> {
    try {
      // Use a 60-second timeout: with ~1400 rows the expand/collapse animation
      // takes well over 15 s before the label updates in the DOM.
      await this.page.waitForFunction(
        (expectedLabel: string) => {
          const el = document.querySelector('.chart__table__body__sortby__option');
          return el ? el.textContent?.trim() === expectedLabel : false;
        },
        label,
        { timeout: 60000 }
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns true when ALL expanded_ sections are visible (no "hide" class).
   * Indicates every team member row has been expanded.
   */
  async areAllTeamMemberRowsExpanded(): Promise<boolean> {
    // BUG FIX: waitForFunction(fn, options) is wrong for a zero-param fn — Playwright's
    // real signature is (fn, arg, options), so the options object was being passed as
    // `arg` (ignored) and this silently fell back to the page's 120000ms default action
    // timeout instead of the declared 30000ms. Pass `null` for arg to fix it.
    return this.page.waitForFunction(
      () => {
        const sections = document.querySelectorAll('[id^="expanded_"]');
        if (sections.length === 0) return false;
        const hidden = Array.from(sections).filter(el => el.classList.contains('hide'));
        return hidden.length === 0;
      },
      null,
      // 300s (was 30s, briefly 120s): the original 30s value was masked by the
      // bug's accidental 120000ms fallback until today. Live-observed team-manager's
      // People Billability view has 1414 rows (same scale as superadmin's whole-
      // company view, not a small team) — even 120s wasn't enough to expand/collapse
      // all rows under staging load, so use the same generous ceiling as the
      // heaviest known case.
      { timeout: 300000 }
    ).then(() => true).catch(() => false);
  }

  /**
   * Returns true when ALL expanded_ sections have the "hide" class
   * (i.e. every team member row is collapsed back to default view).
   */
  async areAllTeamMemberRowsCollapsed(): Promise<boolean> {
    // BUG FIX: waitForFunction(fn, options) is wrong for a zero-param fn — Playwright's
    // real signature is (fn, arg, options), so the options object was being passed as
    // `arg` (ignored) and this silently fell back to the page's 120000ms default action
    // timeout instead of the declared 30000ms. Pass `null` for arg to fix it.
    return this.page.waitForFunction(
      () => {
        const sections = document.querySelectorAll('[id^="expanded_"]');
        if (sections.length === 0) return false;
        const visible = Array.from(sections).filter(el => !el.classList.contains('hide'));
        return visible.length === 0;
      },
      null,
      // 300s (was 30s, briefly 120s): the original 30s value was masked by the
      // bug's accidental 120000ms fallback until today. Live-observed team-manager's
      // People Billability view has 1414 rows (same scale as superadmin's whole-
      // company view, not a small team) — even 120s wasn't enough to expand/collapse
      // all rows under staging load, so use the same generous ceiling as the
      // heaviest known case.
      { timeout: 300000 }
    ).then(() => true).catch(() => false);
  }

  /**
   * Clicks the expand icon on the first team member row using Playwright's
   * native click mechanism. dispatchEvent is avoided because React's synthetic
   * event system does not respond to it reliably in headless mode.
   *
   * DOM notes (verified live):
   * - Direct children of .chart__table__body alternate:
   *     collapsed_<N>  (grey row, class collapsed_section_grey_0)
   *     expanded_<N>   (detail section, has "hide" when collapsed)
   * - The expanded_<N> section contains a child also named collapsed_<N>
   *   (the blue total row) — this is the duplicate-ID the problem describes.
   * - Clicking the outer grey row's .iconContainer removes "hide" from
   *   expanded_<N> and adds "hide" to the grey row itself.
   * - We scope the click to `.chart__table__body > #collapsed_<N> .iconContainer`
   *   so Playwright targets only the outer row's icon, not the inner duplicate.
   */
  async clickFirstTeamMemberRowExpandIcon(): Promise<void> {
    // Step 1: wait for the table to be populated, then read the first grey row's ID
    await this.expandAllRowsButton.waitFor({ state: 'visible', timeout: 30000 });

    const firstGreyRowId = await this.page.evaluate(() => {
      const chartBody = document.querySelector('.chart__table__body');
      if (!chartBody) return null;
      const firstGreyRow = Array.from(chartBody.children).find(el =>
        el.classList.contains('collapsed_section_grey_0')
      );
      return firstGreyRow ? firstGreyRow.id : null;
    });

    if (!firstGreyRowId) {
      throw new Error('BillabilityPage: could not find first grey team-member row in the table');
    }

    // Step 2: use a scoped locator so Playwright clicks only the outer row's
    // icon container — not the identically-named element inside the expanded section
    const iconLocator = this.page.locator(
      `.chart__table__body > #${firstGreyRowId} .iconContainer`
    );
    await iconLocator.waitFor({ state: 'visible', timeout: 15000 });
    await iconLocator.click();

    // Step 3: wait for the corresponding expanded section to drop its "hide" class
    const expandedId = firstGreyRowId.replace('collapsed_', 'expanded_');
    const expandedLocator = this.page.locator(`#${expandedId}`);
    await expandedLocator.waitFor({ state: 'visible', timeout: 15000 });
  }

  /**
   * Returns true when the first team member row's expanded section is visible
   * (i.e. does NOT have the "hide" class).
   * Uses a scoped querySelector from the chart body to avoid being confused by
   * the duplicate collapsed_<N> id that lives inside the expanded section.
   */
  async isFirstTeamMemberRowExpanded(): Promise<boolean> {
    return this.page.evaluate(() => {
      const chartBody = document.querySelector('.chart__table__body');
      if (!chartBody) return false;
      const firstGreyRow = Array.from(chartBody.children).find(el =>
        el.classList.contains('collapsed_section_grey_0')
      );
      if (!firstGreyRow) return false;
      const expandedId = firstGreyRow.id.replace('collapsed_', 'expanded_');
      // Scope to chartBody to avoid getElementById picking up the inner duplicate
      const expandedEl = chartBody.querySelector(`#${expandedId}`);
      return expandedEl ? !expandedEl.classList.contains('hide') : false;
    });
  }

  /**
   * Returns true when the expanded section of the first team member row
   * contains a total row (collapsed_section_blue_0) with non-empty charge values.
   * The total row shows aggregate Case Chgs ($K) and Theo Cap Chgs ($K).
   */
  async isFirstExpandedRowTotalChargesVisible(): Promise<boolean> {
    return this.page.evaluate(() => {
      const chartBody = document.querySelector('.chart__table__body');
      if (!chartBody) return false;
      const directChildren = Array.from(chartBody.children);
      const firstGreyRow = directChildren.find(el =>
        el.classList.contains('collapsed_section_grey_0')
      );
      if (!firstGreyRow) return false;
      const expandedId = firstGreyRow.id.replace('collapsed_', 'expanded_');
      const expandedEl = document.getElementById(expandedId);
      if (!expandedEl || expandedEl.classList.contains('hide')) return false;
      const totalRow = expandedEl.querySelector('.collapsed_section_blue_0');
      if (!totalRow) return false;
      const caseChgs = totalRow.querySelector('.case_charges');
      const theoChgs = totalRow.querySelector('.theo_charges');
      return !!(caseChgs?.textContent?.trim() && theoChgs?.textContent?.trim());
    });
  }

  /**
   * Returns true when the month sub-rows of the first expanded team member row
   * are ordered in descending chronological order (latest month first).
   * Parses the month text (e.g. "Dec 2025") from each sub-row's name cell.
   */
  async areMonthsInDescendingOrder(): Promise<boolean> {
    return this.page.evaluate(() => {
      // Find the first visible expanded section
      const sections = document.querySelectorAll('[id^="expanded_"]');
      const firstVisible = Array.from(sections).find(el => !el.classList.contains('hide'));
      if (!firstVisible) return false;

      // Get all table_row children that are not the blue total row
      const allRows = Array.from(firstVisible.querySelectorAll('.table_row'));
      const monthRows = allRows.filter(row => !row.classList.contains('collapsed_section_blue_0'));
      if (monthRows.length < 2) return true; // Not enough rows to verify ordering

      const monthNames: Record<string, number> = {
        Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
        Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12
      };

      const parsedDates: number[] = [];
      for (const row of monthRows) {
        const nameCell = row.querySelector('.memberName, .name');
        const text = nameCell ? nameCell.textContent?.trim() : '';
        const match = text ? text.match(/^(\w{3}) (\d{4})$/) : null;
        if (match) {
          const month = monthNames[match[1]];
          const year = parseInt(match[2], 10);
          if (month && year) {
            parsedDates.push(year * 100 + month);
          }
        }
      }

      if (parsedDates.length < 2) return true; // Only 1 month, trivially ordered
      for (let i = 1; i < parsedDates.length; i++) {
        if (parsedDates[i] >= parsedDates[i - 1]) return false;
      }
      return true;
    });
  }

  // ---------------------------------------------------------------------------
  // Legend and Export methods
  // ---------------------------------------------------------------------------

  /**
   * Returns true when the billability component color legend is visible above
   * the table. The legend container uses the class
   * .kt-table-container__chart__headers__second_row__legends and contains
   * 6 items: Case, Case w/o #, BD, Investment, Innovation Fund, Other/Admin.
   * (Client w/o # belongs to the separate Utilization Category dropdown on
   * home tiles, not this legend — confirmed live via DOM inspection: 0 matches
   * anywhere on the page.)
   */
  async isBillabilityColorLegendVisible(): Promise<boolean> {
    try {
      const legendContainer = this.page.locator(
        '.kt-table-container__chart__headers__second_row__legends'
      );
      await legendContainer.waitFor({ state: 'visible', timeout: 15000 });
      const items = legendContainer.locator(
        '.kt-table-container__chart__headers__second_row__legends__item'
      );
      const count = await items.count();
      // Live-confirmed: 5 categories (Client, Business Development, Internal
      // Investment, Investment Fund, Admin/Others) - was 6 before the rename.
      return count >= 5;
    } catch {
      return false;
    }
  }

  /**
   * Returns true when the Export button is visible above the table on the right.
   * The button has role="button" and text "Export".
   */
  async isExportButtonVisible(): Promise<boolean> {
    try {
      const btn = this.page.getByRole('button', { name: 'Export' });
      await btn.waitFor({ state: 'visible', timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Filter methods — People Billability page
  //
  // These methods target the shared global filter sidebar DOM that is identical
  // on every page of the application (same class names, same structure).
  // ---------------------------------------------------------------------------

  /**
   * Selects a named checkbox option within the specified filter panel on the
   * People Billability page.
   *
   * DOM structure (verified live on /people/billing):
   *   li (filter listitem, open state)
   *     .filter-heading            — click to open/close
   *     .filter-container          — only present when filter is open
   *       .filter-display          — one per option row
   *         .kt-m-checkbox > input — the checkbox (no id, no label[for])
   *         .filter-name           — the label text (e.g. "PA Managed")
   *
   * After "Clear" is clicked in a filter panel, the panel closes (the
   * .filter-container is removed from the DOM). This method re-opens the
   * filter panel if needed before clicking the option.
   *
   * @param optionName  Exact label text of the option to select,
   *                    e.g. "PA Managed", "Client Focus", "Active".
   * @param filterName  Name of the filter panel that contains the option,
   *                    e.g. "Management Model", "Path", "Status".
   */
  async selectFilterOption(optionName: string, filterName: string): Promise<void> {
    await this.selectGlobalFilterOption(optionName, filterName);
  }

  /**
   * Returns true when the People Billability team member table has updated
   * and still contains data after a filter has been applied.
   *
   * Strategy (verified live):
   *   - The table container `.chart__table__body` must be visible.
   *   - The "Expand all rows" toggle button must be visible inside it,
   *     which confirms the table has at least one data row.
   *
   * After a filter is applied the table re-renders (brief loading state).
   * We wait up to 30 seconds for the table to become populated again.
   * We do NOT assert specific row counts or numeric values (they vary with data).
   */
  async hasTeamMemberTableUpdated(): Promise<boolean> {
    try {
      // Wait for the page header to confirm we're still on the right page.
      await this.billabilityHeader.waitFor({ state: 'visible', timeout: 15000 });
      // Wait for the table body container to be present.
      await this.tableBody.waitFor({ state: 'visible', timeout: 30000 });
      // Wait for the "Expand all rows" button which only appears once data has loaded.
      // BUG FIX: waitForFunction(fn, options) is wrong for a zero-param fn — Playwright's
      // real signature is (fn, arg, options), so the options object was being passed as
      // `arg` (ignored) and this silently fell back to the page's 120000ms default action
      // timeout instead of the declared 30000ms. Pass `null` for arg to fix it.
      await this.page.waitForFunction(
        () => {
          const btn = document.querySelector('.chart__table__body__sortby__option');
          return btn !== null && btn.textContent?.trim() === 'Expand all rows';
        },
        null,
        { timeout: 30000 }
      );
      return true;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // @export methods — People Billability page
  // ---------------------------------------------------------------------------

  // isExportButtonEnabled() is inherited from BasePage (page-agnostic Export button).

  /**
   * Clicks the Export button on the People Billability page and waits for the
   * Playwright download event to fire.
   * Returns the Download object so callers can assert filename and save the file.
   * Uses Promise.all to set up the event listener BEFORE the click fires.
   * Verified live: clicking fires download immediately — no modal or confirmation.
   * Filename: "Billability by Team Member.xlsx".
   * Endpoint: POST /billability/work-split/employee/download (HTTP 200).
   */
  async clickExportAndWaitForDownload(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent('download', { timeout: 60000 }),
      this.page.getByRole('button', { name: 'Export' }).click(),
    ]);
    return download;
  }

  // saveDownload() / getFileSizeBytes() are inherited from BasePage.
}
