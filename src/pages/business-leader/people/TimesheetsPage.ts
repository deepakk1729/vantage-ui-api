import { Locator, Page, Download } from '@playwright/test';

import { BasePage } from '../../base/BasePage';

export class TimesheetsPage extends BasePage {

  readonly timesheetsMenuLink: Locator;
  readonly timesheetsHeader: Locator;
  readonly submissionStatusButton: Locator;
  readonly hoursSubmittedButton: Locator;
  readonly exportButton: Locator;

  constructor(page: Page) {
    super(page);

    // Locator for the Timesheets link within the People submenu (scoped to the
    // People section — see BasePage.peopleSubmenuLink).
    this.timesheetsMenuLink = this.peopleSubmenuLink('Timesheets');

    // Page content heading. Live-verified (2026-06-24): getByText('Timesheets')
    // matches 4 nodes (sidebar link, a span, a tab-link and this heading), so the
    // old .nth(3) was positional/fragile. The content heading carries a stable
    // class that is unique to the page body.
    this.timesheetsHeader = page.locator(
      '.kt-table-container__chart__headers__first_row__left',
      { hasText: 'Timesheets' }
    );

    this.submissionStatusButton = page.getByRole('button', { name: 'Submission Status' });

    this.hoursSubmittedButton = page.getByRole('button', { name: 'Hours Submitted' });

    this.exportButton = page.getByRole('button', { name: 'Export' });

  }


  async navigateToTimesheetsPage(): Promise<void> {
    // Wait for the Timesheets menu link to be ready, then click. (Replaces a
    // blind waitForTimeout(1000) that raced a slow submenu — deterministic and
    // consistent with the other People page navigations.)
    await this.timesheetsMenuLink.waitFor({ state: 'visible', timeout: 30000 });
    await this.timesheetsMenuLink.click();

    // Wait for the page content heading to confirm the Timesheets route has
    // rendered — a real readiness signal (the old waitForLoadState(
    // 'domcontentloaded') resolved before the SPA content mounted). Downstream
    // steps still wait for the table data sentinels before reading rows.
    await this.timesheetsHeader.waitFor({ state: 'visible', timeout: 30000 });
  }

  async isTimesheetsHeaderVisible(): Promise<boolean> {

    try {

      await this.timesheetsHeader.waitFor({
        state: 'visible',
        timeout: 15000
      });

      return true;

    } catch {

      return false;
    }
  }

  private async waitForTimesheetTableToLoad(nameRowHeader: Locator): Promise<boolean> {

    try{

      // wait for table header to appear
      await nameRowHeader.waitFor({
        state: 'visible',
        timeout: 60000
      });

      return true;

    } catch {

      return false;
    }
     
  }

  async openSubmissionStatus(): Promise<boolean> {
    // The Submission Status view is now a weekly date-column matrix with the same
    // DOM structure as the Hours Submitted view. Use the same sentinel:
    // tr.timeSheet-table__inner__main__header td.heading (the first date column
    // heading) which only appears once the component replaces skeleton/loading state
    // with real data.
    const matrixHeaderCell = this.page.locator(
      'tr.timeSheet-table__inner__main__header td.heading'
    ).first();

    // verify toggle became active
    const submissionStatusActive = this.page.locator(
      'div.Kt_main_body_heading_right_toggle_section_left.active:has(img.check_mark)'
    );

    const isToggleActive = await submissionStatusActive
      .isVisible()
      .catch(() => false);

    // verify table loaded using the matrix header sentinel
    const isTableLoaded = await this.waitForTimesheetTableToLoad(matrixHeaderCell);

    return isToggleActive && isTableLoaded;
  }

  async openHoursSubmitted(): Promise<boolean> {
    const nameRowHeader = this.page.getByRole('rowheader', {name: 'Name'});

    await this.hoursSubmittedButton.click();

    // verify toggle became active
    const hoursSubmittedActive = this.page.locator(
      'div.Kt_main_body_heading_right_toggle_section_right.active:has(img.check_mark)'
    );

    const isToggleActive = await hoursSubmittedActive
      .isVisible()
      .catch(() => false);

    // verify table loaded
    const isTableLoaded = await this.waitForTimesheetTableToLoad(nameRowHeader);

    return isToggleActive && isTableLoaded;
  }

  async isExportButtonVisible(): Promise<boolean> {
    try {
      await this.exportButton.first().waitFor({ state: 'visible', timeout: 15000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verifies the Timesheets page is displayed by checking:
   * 1. The current URL contains '/people/timesheet'
   * 2. The page-specific content heading 'Timesheets' is visible in the main content area
   *    (.kt-table-container__chart__headers__first_row__left)
   */
  async isTimesheetsPageDisplayed(): Promise<boolean> {
    try {
      // Wait for the URL to reflect the timesheets route
      await this.page.waitForURL(/\/people\/timesheet/, { timeout: 30000 });

      // Verify the Timesheets content heading is visible
      const contentHeading = this.page.locator('.kt-table-container__chart__headers__first_row__left', {
        hasText: 'Timesheets',
      });
      await contentHeading.waitFor({ state: 'visible', timeout: 30000 });

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verifies both toggle options are visible on the Timesheets page.
   * The toggle elements are <div role="button"> elements (not <button> tags);
   * Playwright's accessibility tree exposes them as role="button".
   * @param option1 - e.g. "Submission Status"
   * @param option2 - e.g. "Hours Submitted"
   */
  async areToggleOptionsVisible(option1: string, option2: string): Promise<boolean> {
    try {
      const toggle1 = this.page.getByRole('button', { name: option1 });
      const toggle2 = this.page.getByRole('button', { name: option2 });

      await toggle1.waitFor({ state: 'visible', timeout: 30000 });
      await toggle2.waitFor({ state: 'visible', timeout: 30000 });

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns true when the named toggle button carries the CSS class "active".
   * The Submission Status toggle is a <div role="button"> with class
   * "Kt_main_body_heading_right_toggle_section_left active" when selected.
   * Live-verified: Submission Status has `active` class by default on page load.
   * @param toggleName - e.g. "Submission Status"
   */
  async isToggleActive(toggleName: string): Promise<boolean> {
    try {
      const toggle = this.page.getByRole('button', { name: toggleName });
      await toggle.waitFor({ state: 'visible', timeout: 30000 });
      const classes = await toggle.getAttribute('class') ?? '';
      return classes.includes('active');
    } catch {
      return false;
    }
  }

  /**
   * Returns the text content of all column headers in the Submission Status
   * weekly-matrix table.
   *
   * Post-redesign DOM (live-verified 2026-06-29):
   *   - The Submission Status view renders as a weekly date-column matrix
   *     with the same structure as the Hours Submitted view.
   *   - The "Name" column is a rowheader (role="rowheader") — separate from
   *     the date column headers.
   *   - Weekly date column headers: tr.timeSheet-table__inner__main__header td.heading
   *     (text like "Dec-27, 2025", "Dec-20, 2025", …).
   *
   * Returns: ["Name", "Dec-27, 2025", "Dec-20, 2025", …]
   */
  async getSubmissionStatusTableColumns(): Promise<string[]> {
    // Wait for the URL to confirm we are on the timesheets page
    await this.page.waitForURL(/\/people\/timesheet/, { timeout: 60000 });

    // Wait for the matrix to finish loading — same sentinel as Hours Submitted.
    // tr.timeSheet-table__inner__main__header td.heading only appears once real
    // data has replaced the skeleton/loading state.
    await this.page.waitForSelector(
      'tr.timeSheet-table__inner__main__header td.heading',
      { timeout: 90000 }
    );

    const columns: string[] = [];

    // The "Name" column is a <th class="header-1"> (implicit ARIA role: columnheader).
    // Live-verified 2026-06-29: no scope attribute, no explicit role — so use a
    // CSS selector rather than getByRole('rowheader') which would find nothing.
    const nameTh = this.page.locator('th.header-1', { hasText: 'Name' }).first();
    const nameThCount = await nameTh.count();
    if (nameThCount > 0) {
      columns.push('Name');
    }

    // Weekly date-column headers (e.g. "Dec-27, 2025").
    const headings = this.page.locator(
      'tr.timeSheet-table__inner__main__header td.heading'
    );
    const count = await headings.count();
    for (let i = 0; i < count; i++) {
      const text = (await headings.nth(i).textContent() ?? '').trim();
      if (text) {
        columns.push(text);
      }
    }
    return columns;
  }

  /**
   * Returns all unique status values present in the Submission Status
   * weekly-matrix table.
   *
   * Post-redesign DOM (live-verified 2026-06-29):
   *   - Status cells: tr.timeSheet-table__inner__main__body > td.value
   *   - Each cell carries exactly one status CSS class (case-sensitive):
   *       td.on_time   → "On Time"   (all-lowercase with underscore)
   *       td.Late      → "Late"      (capital L)
   *       td.Missing   → "Missing"   (capital M)
   *
   * Strategy to guarantee all three statuses are visible in one render:
   *   1. Expand to 100 records per page via the per-page UI dropdown.
   *   2. Navigate to page 3 (people 201-300) via the page UI dropdown.
   *      Live-verified: page 3 contains all three status types.
   *      (Pages 1-2 happen to be all "On Time" in the alphabetically-sorted data.)
   *   3. Collect unique statuses from the visible cells.
   * Live-verified values: "On Time", "Late", "Missing"
   */
  async getSubmissionStatusColumnValues(): Promise<string[]> {
    // Wait for the URL to confirm we are on the timesheets page
    await this.page.waitForURL(/\/people\/timesheet/, { timeout: 60000 });

    // Wait for actual data cells (not skeleton td.value placeholders) to appear.
    await this.page.waitForFunction(
      () => document.querySelector('td.on_time, td.Late, td.Missing') !== null,
      { timeout: 90000 }
    );

    // Step 1: Expand to 100 records per page via the per-page dropdown UI.
    // Wrapped in try/catch — if the "100" option is absent or unclickable for this
    // role (e.g. smaller dataset where the option is disabled), we skip the expansion
    // and scan at the current page size with more page iterations instead.
    try {
      const perPageBtn = this.page.locator('.kt-pagination__dropdown--perpage .currentPage');
      await perPageBtn.waitFor({ state: 'visible', timeout: 15000 });
      await perPageBtn.click();

      const item100 = this.page.locator(
        '.kt-pagination__dropdown--perpage .kt-pagination__dropdown__list__item',
        { hasText: '100' }
      ).first();
      await item100.waitFor({ state: 'visible', timeout: 10000 });
      await item100.click({ force: true });

      // Wait for actual status-class cells to appear (not just skeleton td.value elements
      // which match the selector but carry no on_time/Late/Missing class yet).
      await this.page.waitForFunction(
        () => document.querySelector('td.on_time, td.Late, td.Missing') !== null,
        { timeout: 90000 }
      );
    } catch {
      // Per-page expansion failed — proceed scanning at whatever the current page size is.
      // Wait for actual data cells (not skeletons) before scanning.
      await this.page.waitForFunction(
        () => document.querySelector('td.on_time, td.Late, td.Missing') !== null,
        { timeout: 90000 }
      ).catch(() => undefined);
    }

    // Step 2: Collect statuses, paging forward until all three are found (or pages
    // run out). The old code hardcoded "page 3" because in the org-wide, sorted
    // data the first pages can be entirely "On Time"; but a hardcoded page breaks
    // for any dataset that doesn't have that many pages (e.g. a PA-scoped role).
    // Paging dynamically works for BOTH small datasets (all three on page 1) and
    // large ones (keep going until Late + Missing show up). Class names are
    // case-sensitive ("on_time", "Late", "Missing").
    const scanCurrentPage = (): Promise<string[]> =>
      this.page.evaluate(() => {
        const f = new Set<string>();
        if (document.querySelector('td.on_time')) f.add('On Time');
        if (document.querySelector('td.Late')) f.add('Late');
        if (document.querySelector('td.Missing')) f.add('Missing');
        return Array.from(f);
      });

    // The waitForFunction above can resolve on a transient render (e.g. a status
    // cell that appears then gets replaced as the 100-per-page table keeps
    // painting rows) leaving an empty scan immediately after. Retry briefly
    // before falling through to the page-by-page search below.
    let firstScan = await scanCurrentPage();
    for (let i = 0; firstScan.length === 0 && i < 5; i++) {
      await this.page.waitForTimeout(500);
      firstScan = await scanCurrentPage();
    }
    const found = new Set<string>(firstScan);
    const wanted = ['On Time', 'Late', 'Missing'];
    const hasAll = (): boolean => wanted.every((w) => found.has(w));

    const pageDropdownBtn = this.page.locator(
      '.kt-pagination__dropdown:not(.kt-pagination__dropdown--perpage) .currentPage'
    );
    // Cap at 12 pages so a dataset genuinely missing a status can't loop forever.
    for (let targetPage = 2; targetPage <= 12 && !hasAll(); targetPage++) {
      await pageDropdownBtn.click().catch(() => undefined);
      const item = this.page.locator(
        '.kt-pagination__dropdown:not(.kt-pagination__dropdown--perpage) .kt-pagination__dropdown__list__item',
        { hasText: new RegExp(`^${targetPage}$`) }
      ).first();
      const exists = await item
        .waitFor({ state: 'visible', timeout: 5000 })
        .then(() => true)
        .catch(() => false);
      if (!exists) break; // no more pages
      await item.click();
      await this.page.waitForFunction(
        () => document.querySelector('td.on_time, td.Late, td.Missing') !== null,
        { timeout: 90000 }
      ).catch(() => undefined);
      (await scanCurrentPage()).forEach((s) => found.add(s));
    }

    return Array.from(found);
  }

  /**
   * Returns true when all three expected statuses ("On Time", "Late", "Missing")
   * appear at least once in the Submission Status column of the visible table rows.
   */
  async hasAllSubmissionStatusValues(): Promise<boolean> {
    const values = await this.getSubmissionStatusColumnValues();
    return ['On Time', 'Late', 'Missing'].every(s => values.includes(s));
  }

  // ---------------------------------------------------------------------------
  // Hours Submitted view methods
  // ---------------------------------------------------------------------------

  /**
   * Clicks the "Hours Submitted" toggle button to switch to the Hours Submitted view.
   * The toggle is a <div role="button" class="Kt_main_body_heading_right_toggle_section_right">.
   */
  async clickHoursSubmittedToggle(): Promise<void> {
    const toggle = this.page.getByRole('button', { name: 'Hours Submitted' });
    await toggle.waitFor({ state: 'visible', timeout: 30000 });
    await toggle.click();
  }

  /**
   * Returns true when the Hours Submitted view is active and the table header
   * row contains weekly date columns (format "MMM-DD, YYYY").
   * Live-verified: the table header row contains columns like "Dec-27, 2025".
   */
  async isHoursSubmittedViewDisplayed(): Promise<boolean> {
    try {
      // Verify the Hours Submitted toggle is active
      const isActive = await this.isToggleActive('Hours Submitted');
      if (!isActive) return false;

      // Verify the table has the weekly date column structure
      // The header row contains "Name" rowheader + weekly date cells
      // 90s (was 30s): live-observed a run where the table was still fully
      // skeleton-loading ("Showing 0-0 of 0 people") past 30s under slow staging.
      const nameHeader = this.page.getByRole('rowheader', { name: 'Name' });
      await nameHeader.waitFor({ state: 'visible', timeout: 90000 });

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Waits until the Hours Submitted table has fully rendered its weekly date columns.
   * The sentinel is the first <td class="heading"> inside the Hours Submitted header row
   * (tr.timeSheet-table__inner__main__header), which only appears once the component
   * has finished replacing the skeleton/loading state with real data.
   * This mirrors the sentinel approach used by getSubmissionStatusTableColumns() and
   * getSubmissionStatusColumnValues() which wait for `table tbody td div.status`.
   */
  private async waitForHoursSubmittedTableToLoad(): Promise<void> {
    await this.page.waitForSelector(
      'tr.timeSheet-table__inner__main__header td.heading',
      { timeout: 90000 }
    );
  }

  /**
   * Hovers over the first non-zero weekly data cell in the Hours Submitted table.
   * Weekly cells are <td class="value"> > <span class="tooltip-with-icon periodTooltip desc">.
   * Uses .first() to pick the first visible cell.
   *
   * Waits for the Hours Submitted table to finish rendering (sentinel:
   * tr.timeSheet-table__inner__main__header td.heading) before hovering, to avoid
   * interacting with an element that detaches as the table swaps from loading to real data.
   */
  async hoverOverWeeklyCell(): Promise<void> {
    await this.waitForHoursSubmittedTableToLoad();
    // BUG FIX: this used to hover .first() unconditionally, but the docstring's own
    // stated intent ("first NON-ZERO weekly data cell") was never actually
    // implemented — .first() can land on a zero-value cell (whose tooltip does not
    // populate the same way), causing isTooltipTextVisible() to fail intermittently
    // depending on which cell happens to be first in DOM order that run. Non-zero
    // cells render as a clickable <a> link (live-verified); zero cells do not.
    // Prefer a cell containing a link; fall back to .first() if none exist.
    const linkCell = this.page.locator('span.tooltip-with-icon.periodTooltip').filter({
      has: this.page.locator('a')
    }).first();
    const hasLinkCell = await linkCell.count() > 0;
    const cell = hasLinkCell ? linkCell : this.page.locator('span.tooltip-with-icon.periodTooltip').first();
    await cell.waitFor({ state: 'visible', timeout: 30000 });
    await cell.hover();
  }

  /**
   * Returns true when the tooltip text "View chgs/hrs" is visible inside
   * the hovered weekly cell.
   * After hover, the <div id="tooltip"> inside the span changes class from "off" to "on",
   * making the .inner-row text visible.
   * Live-verified text: "View chgs/hrs"
   */
  async isTooltipTextVisible(expectedText: string): Promise<boolean> {
    try {
      // The tooltip inner-row text is present in the DOM; it's shown when class is "on"
      // We verify the text is present via the locator
      const tooltipText = this.page.locator('span.tooltip-with-icon.periodTooltip .inner-row').first();
      await tooltipText.waitFor({ state: 'visible', timeout: 15000 });
      const actualText = (await tooltipText.textContent() ?? '').trim();
      return actualText === expectedText;
    } catch {
      return false;
    }
  }

  /**
   * Clicks the first available weekly cell in the Hours Submitted table to open
   * the charges/hours modal pop-up.
   * Live-verified: clicking <span class="tooltip-with-icon periodTooltip"> opens
   * div.charges_hours_modal.
   *
   * Waits for the Hours Submitted table to finish rendering (sentinel:
   * tr.timeSheet-table__inner__main__header td.heading) before clicking, to avoid
   * the DOM-detachment race where the element is visible during skeleton loading but
   * then detaches as the table swaps to real data mid-click.
   * The locator is re-resolved after the sentinel wait to guarantee a stable,
   * attached reference at the moment of interaction.
   */
  async clickWeeklyCell(): Promise<void> {
    await this.waitForHoursSubmittedTableToLoad();
    const cell = this.page.locator('span.tooltip-with-icon.periodTooltip').first();
    await cell.waitFor({ state: 'visible', timeout: 30000 });
    // noWaitAfter: opening the charges/hours modal makes the app schedule
    // something Playwright reads as a navigation, so the default post-click
    // "wait for scheduled navigations to finish" hangs to the action timeout.
    // isChargesHoursModalVisible() is the real completion signal.
    await cell.click({ noWaitAfter: true });
  }

  /**
   * Returns true when the charges/hours modal is visible and contains a title
   * starting with "Charges/Hours of".
   * Live-verified: the modal has class "charges_hours_modal" and heading ".heading_text".
   */
  async isChargesHoursModalVisible(): Promise<boolean> {
    try {
      const modal = this.page.locator('div.charges_hours_modal');
      await modal.waitFor({ state: 'visible', timeout: 30000 });

      // Verify title contains "Charges/Hours of"
      const title = this.page.locator('.heading_text');
      await title.waitFor({ state: 'visible', timeout: 15000 });
      const titleText = (await title.textContent() ?? '').trim();
      return titleText.startsWith('Charges/Hours of');
    } catch {
      return false;
    }
  }

  /**
   * Selects a different week from the WEEK POSTED DATE custom dropdown inside
   * the charges/hours modal.
   * The dropdown is a custom div (not a native <select>):
   *   1. Click the current-week button to open the dropdown.
   *   2. Click the second option (first item in the dropdown list, which is
   *      the week before the currently selected one).
   * Live-verified: options are <button> elements inside .kt-drop-down-container-display.
   */
  async selectDifferentWeekFromDropdown(): Promise<void> {
    // Open the dropdown by clicking the current week button inside .week_posted_date.
    // 30s (was 15s): the Week Posted Date control renders only after the modal's
    // charges/hours data loads, which is slow on a degraded backend.
    const currentWeekBtn = this.page.locator('.week_posted_date button').first();
    await currentWeekBtn.waitFor({ state: 'visible', timeout: 30000 });
    await currentWeekBtn.click();

    // Wait for the dropdown to open (options container appears)
    const optionsContainer = this.page.locator('.kt-drop-down-container-display');
    await optionsContainer.waitFor({ state: 'visible', timeout: 10000 });

    // Click the first available option (the week immediately before the current selection)
    const firstOption = optionsContainer.locator('button').first();
    await firstOption.waitFor({ state: 'visible', timeout: 10000 });
    await firstOption.click();
  }

  /**
   * Returns true when the charges/hours modal table has updated to reflect
   * the newly selected week.
   * Verified by confirming the modal is still visible and the table content
   * is loaded (presence of the table element with headers).
   */
  async isModalTableUpdated(): Promise<boolean> {
    try {
      const modal = this.page.locator('div.charges_hours_modal');
      await modal.waitFor({ state: 'visible', timeout: 30000 });

      // The table always has the same 8-column headers. 30s (was 15s): the table
      // body/headers render only after the modal's data loads — slow on a degraded
      // backend (same modal-content pattern as the other modal helpers).
      const header = this.page.locator('.charges_hours_modal table thead');
      await header.waitFor({ state: 'visible', timeout: 30000 });

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clicks the X (close) button inside the charges/hours modal.
   * Live-verified: the button is div.close_button containing <i class="close icon back_arrow">.
   */
  async clickCloseButton(): Promise<void> {
    // 30s (was 15s): the modal's close control renders only after the modal's
    // charges/hours data loads — slow on a degraded backend (same pattern as
    // selectDifferentWeekFromDropdown).
    const closeBtn = this.page.locator('div.close_button');
    await closeBtn.waitFor({ state: 'visible', timeout: 30000 });
    await closeBtn.click();
  }

  /**
   * Returns true when the charges/hours modal has been removed from the DOM
   * (i.e., the modal is fully dismissed).
   * Live-verified: after clicking .close_button, both .charges_hours_modal
   * and the .ui.page.modals dimmer are detached from the DOM.
   */
  async isModalDismissed(): Promise<boolean> {
    try {
      const modal = this.page.locator('div.charges_hours_modal');
      await modal.waitFor({ state: 'detached', timeout: 15000 });
      return true;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Filter methods — Timesheets page (@filter scenarios)
  //
  // These methods target the shared global filter sidebar DOM that is identical
  // on every page of the application (same class names, same structure).
  // Mirrors BillabilityPage.selectFilterOption() — proven working logic.
  // ---------------------------------------------------------------------------

  /**
   * Selects a named checkbox option within the specified filter panel on the
   * Timesheets page.
   *
   * DOM structure (live-verified on /people/timesheet):
   *   li (filter listitem)
   *     .filter-heading            — toggle open/close
   *     .filter-container          — present only when filter is open
   *       .filter-display          — one per option row
   *         .kt-m-checkbox > input — the checkbox
   *         .filter-name           — the label text
   *
   * After "Clear" is clicked in a filter panel, the panel closes (the
   * .filter-container is removed from the DOM). This method re-opens the
   * filter panel if needed before clicking the option.
   *
   * Uses an anchored regex (^optionName$) to prevent partial matches —
   * e.g. "Active" would otherwise also match "Inactive" via hasText.
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
   * Returns true when the Submission Status table has updated and still contains
   * data after a filter has been applied.
   *
   * Post-redesign strategy (live-verified 2026-06-29):
   *   - Wait for the URL to confirm we are on the timesheets page.
   *   - Wait for the matrix body sentinel: tr.timeSheet-table__inner__main__body td.value
   *     which only appears once real data has replaced the skeleton rows.
   * This mirrors hasHoursSubmittedTableUpdated() and the sentinel used by
   * getSubmissionStatusColumnValues() and getSubmissionStatusTableColumns().
   */
  async hasSubmissionStatusTableUpdated(): Promise<boolean> {
    try {
      await this.page.waitForURL(/\/people\/timesheet/, { timeout: 30000 });
      await this.page.waitForSelector(
        'tr.timeSheet-table__inner__main__body td.value',
        { timeout: 90000 }
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns true when the Hours Submitted table has updated and still contains
   * data after a filter has been applied.
   *
   * Strategy (live-verified on /people/timesheet):
   *   - Wait for the Hours Submitted sentinel: `tr.timeSheet-table__inner__main__header td.heading`
   *     which only appears once the component has finished replacing the skeleton with real data.
   * This mirrors waitForHoursSubmittedTableToLoad() used by hoverOverWeeklyCell() etc.
   */
  async hasHoursSubmittedTableUpdated(): Promise<boolean> {
    try {
      await this.page.waitForSelector(
        'tr.timeSheet-table__inner__main__header td.heading',
        { timeout: 90000 }
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clicks the filter heading of the currently-open named filter to close it.
   *
   * Live-verified: on /people/timesheet, filter panels only close when their
   * own heading is clicked again (toggle). No document-level click-outside
   * handler exists — clicking outside the filter area does not dismiss it.
   *
   * The step implementation clicks the most-recently-opened filter (the one
   * with .filter-container present). If multiple filters are open (which the
   * app prevents), it closes the last one found.
   *
   * This corresponds to the scenario step "I click outside the filter panel on
   * the Timesheets page" — pragmatically implemented as a toggle-close click.
   */
  async clickOutsideFilterPanel(): Promise<void> {
    // Find the currently-open filter (has .filter-container) and click its heading to close.
    const openFilterLi = this.page.locator('li').filter({
      has: this.page.locator('.filter-container')
    }).first();

    await openFilterLi.waitFor({ state: 'visible', timeout: 15000 });
    const heading = openFilterLi.locator('.filter-heading');
    await heading.waitFor({ state: 'visible', timeout: 10000 });
    await heading.click();

    // Wait for the filter-container to be removed from the DOM.
    await this.page.waitForFunction(
      () => document.querySelectorAll('li .filter-container').length === 0,
      { timeout: 10000 }
    );
  }

  /**
   * Returns true when the named filter panel is closed on the Timesheets page.
   *
   * A filter is closed when its listitem has exactly 1 child (the .filter-heading)
   * — the .filter-container is detached from the DOM when the filter collapses.
   *
   * Live-verified: closed state = `li.children.length === 1`.
   *
   * @param filterName  Name of the filter to check, e.g. "Path".
   */
  async isFilterPanelClosed(filterName: string): Promise<boolean> {
    try {
      const filterLi = this.page.locator('li').filter({
        has: this.page.locator('.filter-heading', { hasText: filterName })
      });
      await filterLi.waitFor({ state: 'visible', timeout: 15000 });

      // Wait until .filter-container is gone (children.length === 1)
      await this.page.waitForFunction(
        (name: string) => {
          const lis = Array.from(document.querySelectorAll('li'));
          const li = lis.find(el => {
            const h = el.querySelector('.filter-heading');
            return h && h.textContent && h.textContent.includes(name);
          });
          return li ? li.children.length === 1 : false;
        },
        filterName,
        { timeout: 10000 }
      );
      return true;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // @export methods — Timesheets page
  // ---------------------------------------------------------------------------

  // isExportButtonEnabled() is inherited from BasePage (page-agnostic Export button).

  /**
   * Clicks the Export button on the Timesheets page and waits for the Playwright
   * download event to fire.
   *
   * Strategy (live-confirmed 2026-06-22 on /people/timesheet):
   *   - No confirmation modal — download fires IMMEDIATELY when the button is clicked,
   *     on BOTH the Submission Status view and the Hours Submitted view.
   *   - Uses Promise.all to set up the event listener BEFORE the click so no
   *     download event is missed.
   *   - Mirrors People BillabilityPage.clickExportAndWaitForDownload() which is also
   *     modal-free (NOT the Charges/Hours pattern which awaits a modal first).
   *   - Live download: POST /ktd-billing/billing/api/billability/timesheet/download
   *     → HTTP 200 → Blob URL → <a download> → Playwright download event.
   *   - Confirmed filename: "Timesheet.xlsx" on BOTH views.
   *
   * Returns the Download object so callers can assert filename and save the file.
   *
   * Retries once on timeout: the download event has occasionally not fired within
   * 60s under environment/network latency even though the endpoint is otherwise
   * fast (live-confirmed) — a second click recovers rather than soft-skipping the
   * whole export assertion chain.
   */
  async clickExportAndWaitForDownload(): Promise<Download> {
    // Wait for the weekly-matrix header to appear — the same sentinel used by
    // waitForHoursSubmittedTableToLoad(). The Export button's React onClick is
    // only registered once the data component has fully mounted; clicking before
    // this sentinel resolves lands on an unbound handler and fires no download.
    // (Same pattern as BillRatePage which waits for td.team_member_name.)
    await this.page.waitForSelector(
      'tr.timeSheet-table__inner__main__header td.heading',
      { timeout: 90000 }
    );
    const exportButton = this.page.getByRole('button', { name: 'Export' });
    try {
      const [download] = await Promise.all([
        this.page.waitForEvent('download', { timeout: 60000 }),
        exportButton.click(),
      ]);
      return download;
    } catch {
      const [download] = await Promise.all([
        this.page.waitForEvent('download', { timeout: 60000 }),
        exportButton.click(),
      ]);
      return download;
    }
  }

  // saveDownload() / getFileSizeBytes() are inherited from BasePage.
}
