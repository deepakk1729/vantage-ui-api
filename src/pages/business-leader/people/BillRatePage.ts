import { Locator, Page, Download } from '@playwright/test';

import { BasePage } from '../../base/BasePage';

export class BillRatePage extends BasePage {

  readonly billRateMenuLink: Locator;
  readonly billRateHeader: Locator;
  readonly sortByButton: Locator;

  constructor(page: Page) {
    super(page);

    // Locator for the Bill Rate link within the People submenu (scoped to the
    // People section — see BasePage.peopleSubmenuLink).
    this.billRateMenuLink = this.peopleSubmenuLink('Bill Rate');

    this.billRateHeader = page.getByText(/Bill Rate by Team Member/i);

    this.sortByButton = page.getByRole('button', { name: /Bill Rate \(highest → lowest\)/i });
  }


  async navigateToBillRatePage(): Promise<void> {
    // Wait for the Bill Rate menu link to be ready, then click. (Replaces a
    // blind waitForTimeout(1000) that raced a slow submenu — deterministic and
    // consistent with the other People page navigations.)
    await this.billRateMenuLink.waitFor({ state: 'visible', timeout: 30000 });
    await this.billRateMenuLink.click();

    // Wait for the page header to confirm the Bill Rate page has mounted —
    // a real readiness signal (the old waitForLoadState('domcontentloaded')
    // resolved before the SPA route rendered). Downstream methods still wait
    // for the data sentinel (td.team_member_name) before reading the table.
    await this.billRateHeader.waitFor({ state: 'visible', timeout: 30000 });
  }

  /**
   * Returns true when the "Bill Rate by Team Member" header becomes visible
   * within the given timeout. Shared by isBillRateHeaderVisible() (15 s) and
   * isBillRatePageDisplayed() (30 s).
   */
  private async waitForBillRateHeader(timeout: number): Promise<boolean> {
    try {
      await this.billRateHeader.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  async isBillRateHeaderVisible(): Promise<boolean> {
    return this.waitForBillRateHeader(15000);
  }

  async isSortByButtonVisible(): Promise<boolean> {
    try {
      await this.sortByButton.first().waitFor({ state: 'visible', timeout: 15000 });
      return true;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Display scenarios — new methods
  // ---------------------------------------------------------------------------

  /**
   * Returns true when the "Bill Rate by Team Member" page header is visible,
   * confirming the Bill Rate page has fully loaded after sidebar navigation.
   *
   * Live-verified: header is a text node inside a generic container (not a
   * semantic heading) at /people/billRate.
   */
  async isBillRatePageDisplayed(): Promise<boolean> {
    return this.waitForBillRateHeader(30000);
  }

  /**
   * Returns true when the Bill Rate data table is visible and contains real
   * team member rows (skeleton-loader has finished).
   *
   * Strategy (live-verified on /people/billRate):
   *   - The table is a native HTML <table> element.
   *   - Skeleton/loading state shows rows without the "team_member_name" class
   *     on the first <td>. Once data loads the first cell carries classes
   *     "name_columns team_member_name", confirming data is present.
   *   - Mirrors the sentinel pattern used by ChargesHoursPage
   *     (table tbody td.employee_name) adapted to the Bill Rate DOM.
   */
  /**
   * Returns true if the page shows the "No data to display" empty-state message
   * instead of a data table. Genuine per-user staging data gap (e.g. this
   * impersonated user has zero Bill Rate rows this run) — distinct from a page
   * that is still loading.
   */
  async hasNoDataMessage(): Promise<boolean> {
    return this.page.getByText('No data to display', { exact: true }).isVisible().catch(() => false);
  }

  async isBillRateTableVisible(): Promise<boolean> {
    try {
      // Confirm we are on the Bill Rate page
      await this.billRateHeader.waitFor({ state: 'visible', timeout: 15000 });
      // Wait for the skeleton loader to clear: td.team_member_name only appears
      // once real employee data has replaced the loading placeholder rows.
      // 120s (was 60s): live-observed a run where the table was still fully
      // skeleton-loading ("Showing 0-0 of 0 people") past 60s under slow staging.
      await this.page.waitForSelector('table tbody tr td.team_member_name', { timeout: 120000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns the text labels of each column header in the Bill Rate table.
   *
   * Table structure (live-verified on /people/billRate):
   *   <table>
   *     <thead>
   *       <tr>  ← 6 <th> each containing <div class="heading-content">ColName</div>
   *
   * The sentinel wait for `table tbody tr td.team_member_name` ensures data has
   * finished loading before reading headers, preventing a skeleton-loader race
   * condition where real column headers could be replaced mid-assertion.
   *
   * Live-verified columns (in order):
   *   Name | Job Title | Home Office | Hourly Bill Rate (USD) |
   *   Hourly Bill Rate (Local) | Local Currency
   */
  async getTableColumnHeaders(): Promise<string[]> {
    // Wait for real data to be present before reading headers (skeleton-wait sentinel)
    await this.page.waitForSelector('table tbody tr td.team_member_name', { timeout: 60000 });

    // Read the thead th elements via their .heading-content child divs
    const headers = await this.page.evaluate(() => {
      const divs = document.querySelectorAll('table thead th .heading-content');
      return Array.from(divs)
        .map((d) => d.textContent?.trim() ?? '')
        .filter((t) => t.length > 0);
    });

    return headers;
  }

  // ── @sort methods ────────────────────────────────────────────────────────────

  /**
   * Returns true when the "Sort By:" label is visible on the Bill Rate page.
   *
   * Live-verified: the label is a div with class "sort-by-container__label"
   * containing the text "Sort By:" — present once data has loaded.
   */
  async isSortByLabelVisible(): Promise<boolean> {
    try {
      // BUG FIX: this used to gate on a data-row sentinel that never appears when
      // the team has zero Bill Rate rows (genuine "No data to display" state) —
      // but the Sort By label is static UI chrome that renders regardless of data.
      // Wait for the page header instead, which is data-independent.
      await this.billRateHeader.waitFor({ state: 'visible', timeout: 30000 });
      await this.page.locator('.sort-by-container__label').waitFor({ state: 'visible', timeout: 15000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clicks the Sort By dropdown button on the Bill Rate page and waits for the
   * option list to become visible.
   *
   * Live-verified: the button is a div with class "sort-by-container__btn"
   * (not a semantic <button> element — it is a div[role not set]).
   * Playwright surfaces it as button "Bill Rate (highest → lowest)" (or the
   * current active label). We click it via page.evaluate() to avoid Playwright's
   * locator resolution issues with non-semantic div buttons.
   *
   * Retry strategy (mirrors ChargesHoursPage.clickSortDropdown):
   *   - Retries the click up to 3 times if the dropdown fails to open.
   *   - The dropdown is open when .sort-by-filters .filter-display is visible.
   */
  async clickSortDropdown(): Promise<void> {
    // Wait for skeleton to clear first
    await this.page.waitForSelector('table tbody tr td.team_member_name', { timeout: 60000 });

    const sortBtn = this.page.locator('.sort-by-container__btn');
    await sortBtn.waitFor({ state: 'visible', timeout: 15000 });

    // Retry the click up to 3 times if the dropdown fails to open.
    for (let attempt = 1; attempt <= 3; attempt++) {
      await this.page.evaluate(() => {
        const btn = document.querySelector('.sort-by-container__btn');
        if (btn) (btn as HTMLElement).click();
      });
      try {
        await this.page.locator('.sort-by-filters .filter-display').first().waitFor({
          state: 'visible',
          timeout: 15000
        });
        return; // Dropdown is open — done
      } catch {
        if (attempt === 3) {
          throw new Error(
            'BillRatePage.clickSortDropdown: sort dropdown did not open after 3 click attempts. ' +
            'Selector: .sort-by-filters .filter-display'
          );
        }
        // Brief wait before retry
        await this.page.waitForFunction(
          () => document.querySelector('.sort-by-filters') === null ||
                document.querySelector('.sort-by-filters .filter-display') === null,
          { timeout: 2000 }
        ).catch(() => { /* ignore */ });
      }
    }
  }

  /**
   * Returns the list of sort option labels visible in the open dropdown.
   *
   * Each option is a .filter-display div containing a hidden radio input and
   * a visible text node.
   *
   * Live-verified options (in order):
   *   "Bill Rate (highest → lowest)"  (radio value: billratedesc)
   *   "Bill Rate (lowest → highest)"  (radio value: billrateasc)
   *   "Job Title (Descending)"        (radio value: jobtitledesc)
   *   "Job Title (Ascending)"         (radio value: jobtitleasc)
   *   "Home Office (Descending)"      (radio value: homeofficedesc)
   *   "Home Office (Ascending)"       (radio value: homeofficeasc)
   *
   * Prerequisite: dropdown must be open (call clickSortDropdown() first).
   */
  async getSortOptions(): Promise<string[]> {
    // Guard: a background XHR (e.g. server-saved filter preferences loading) can
    // trigger a React re-render that closes the dropdown between clickSortDropdown()
    // returning and this method executing. Re-open if needed.
    // BUG FIX: a single reopen attempt isn't always enough — the same background
    // re-render can close the dropdown again right after reopening it. Retry up
    // to 3 times, matching the pattern already used by clickSortDropdown().
    const optionLocator = this.page.locator('.sort-by-filters .filter-display');
    const sortBtn = this.page.locator('.sort-by-container__btn');
    for (let attempt = 1; attempt <= 3; attempt++) {
      const isOpen = await optionLocator.first().isVisible().catch(() => false);
      if (isOpen) break;
      await sortBtn.click();
      const reopened = await optionLocator.first()
        .waitFor({ state: 'visible', timeout: 10000 })
        .then(() => true)
        .catch(() => false);
      if (reopened) break;
    }
    const options = await this.page.evaluate(() => {
      const displays = document.querySelectorAll('.sort-by-filters .filter-display');
      return Array.from(displays).map(d => d.textContent?.trim() ?? '');
    });
    return options.filter(o => o.length > 0);
  }

  /**
   * Returns the text of the currently-active sort selection.
   *
   * Strategy (live-verified on /people/billRate):
   *   - When dropdown is closed: .sort-by-filters .filter-display returns 0 elements.
   *     In this case, read the button text directly from .sort-by-container__btn.
   *   - When dropdown is open: read the text of the .filter-display whose radio is checked.
   *
   * This method works correctly in both states (open and closed dropdown).
   */
  async getActiveSortSelection(): Promise<string> {
    return this.page.evaluate(() => {
      // First try: read from open dropdown (checked radio)
      const displays = document.querySelectorAll('.sort-by-filters .filter-display');
      for (const d of Array.from(displays)) {
        const radio = d.querySelector('input[type="radio"]') as HTMLInputElement;
        if (radio?.checked) {
          return d.textContent?.trim() ?? '';
        }
      }
      // Fallback: dropdown is closed — read button text directly
      const btn = document.querySelector('.sort-by-container__btn');
      return btn?.textContent?.trim() ?? '';
    });
  }

  /**
   * Selects a sort option from the open sort dropdown by label text.
   *
   * Clicks the radio input inside the matching .filter-display element via
   * page.evaluate() to bypass Playwright's locator resolution retry loop,
   * which can fail when the sort dropdown re-renders during animations.
   *
   * Wait strategy (mirrors ChargesHoursPage.selectSortOption flake fix):
   *   1. Click the option radio via page.evaluate().
   *   2. Wait for the sort button label (.sort-by-container__btn) to update to
   *      the chosen label — this is the authoritative React re-render signal.
   *   3. Belt-and-suspenders: wait for td.team_member_name to confirm data is present.
   *
   * @param label Exact option text, e.g. "Bill Rate (highest → lowest)"
   */
  async selectSortOption(label: string): Promise<void> {
    // Wait for the dropdown option to be present in the DOM via waitForFunction.
    // This is more robust than locator.waitFor() because it polls from within
    // the JS context and avoids Playwright's locator resolution retry loop, which
    // can fail when the dropdown is in an animating/transitional state.
    //
    // We also retry the click here (up to 2 times) in case the dropdown closed
    // briefly between clickSortDropdown() and selectSortOption() — e.g. if a
    // preceding scenario left the page in a state where the dropdown auto-closes.
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        // Wait for the specific option to appear in the DOM (dropdown open).
        await this.page.waitForFunction(
          (lbl: string) => {
            const displays = document.querySelectorAll('.sort-by-filters .filter-display');
            return Array.from(displays).some(d => d.textContent?.trim() === lbl);
          },
          label,
          { timeout: 20000 }
        );
        break; // option is visible — proceed to click
      } catch {
        if (attempt === 2) throw new Error(
          `BillRatePage.selectSortOption: option "${label}" did not appear after re-opening dropdown.`
        );
        // Re-open the dropdown and retry
        await this.page.evaluate(() => {
          const btn = document.querySelector('.sort-by-container__btn');
          if (btn) (btn as HTMLElement).click();
        });
      }
    }

    // Click the option radio via evaluate to avoid the locator-detach race during
    // dropdown animations.
    const clickOptionRadio = () => this.page.evaluate((lbl: string) => {
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

    // Click, then confirm the selection registered by watching the sort button
    // label update — the authoritative signal that React processed the selection
    // and re-ordered the rows. Under CI load React can silently drop a synthetic
    // click that lands mid-re-render, leaving the label unchanged; the old
    // single-click version then waited out the full timeout. Re-click and
    // re-check up to 3 times (~20s each, same overall budget) so a dropped click
    // recovers instead of timing out. Same end signal — just retried.
    for (let selectAttempt = 1; selectAttempt <= 3; selectAttempt++) {
      await clickOptionRadio();
      try {
        await this.page.waitForFunction(
          (expectedLabel: string) => {
            const btn = document.querySelector('.sort-by-container__btn');
            return btn !== null && btn.textContent !== null && btn.textContent.trim() === expectedLabel;
          },
          label,
          { timeout: 20000 }
        );
        break;
      } catch {
        if (selectAttempt === 3) {
          throw new Error(
            `BillRatePage.selectSortOption: sort button label did not update to "${label}" ` +
            'after 3 click attempts (selection did not register).'
          );
        }
        // Dropdown is still open — re-click on the next iteration.
      }
    }

    // Belt-and-suspenders: confirm real data is still present after re-render.
    await this.page.waitForSelector('table tbody tr td.team_member_name', { timeout: 60000 });
  }

  /**
   * Returns true when the Bill Rate table column at `columnIndex` (0-based td
   * index) is sorted in the requested `direction`.
   *
   * Uses waitForFunction to poll until the values are present AND ordered —
   * this avoids the race where td.team_member_name is already present from the
   * previous sort order but the rows have not re-ordered yet.
   *
   * @param columnIndex 0-based td index to read from each tbody row.
   * @param direction   'asc' (non-decreasing) or 'desc' (non-increasing).
   * @param numeric     true → compare as numbers (strip commas); false → localeCompare text.
   *
   * Live-verified columns on /people/billRate:
   *   index 1 = Job Title (text), index 2 = Home Office (text),
   *   index 3 = Hourly Bill Rate USD (numeric).
   */
  private async isTableSortedBy(
    columnIndex: number,
    direction: 'asc' | 'desc',
    numeric: boolean
  ): Promise<boolean> {
    await this.page.waitForFunction(
      (args: { columnIndex: number; direction: 'asc' | 'desc'; numeric: boolean }) => {
        const { columnIndex, direction, numeric } = args;
        const rows = document.querySelectorAll('table tbody tr');
        const values: Array<number | string> = [];
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= columnIndex + 1) {
            const raw = cells[columnIndex]?.textContent?.trim() ?? '';
            if (numeric) {
              const num = parseFloat(raw.replace(/,/g, ''));
              if (!isNaN(num)) values.push(num);
            } else if (raw) {
              values.push(raw);
            }
          }
        });
        if (values.length === 0) return false;
        if (values.length === 1) return true;
        for (let i = 1; i < values.length; i++) {
          const cmp = numeric
            ? (values[i] as number) - (values[i - 1] as number)
            : (values[i] as string).localeCompare(values[i - 1] as string);
          if (direction === 'desc' && cmp > 0) return false;
          if (direction === 'asc' && cmp < 0) return false;
        }
        return true;
      },
      { columnIndex, direction, numeric },
      { timeout: 60000 }
    );
    return true;
  }

  /** Hourly Bill Rate (USD, index 3) descending — highest at top (live: 1500,1500,1300...). */
  async isTableSortedByBillRateDescending(): Promise<boolean> {
    return this.isTableSortedBy(3, 'desc', true);
  }

  /** Hourly Bill Rate (USD, index 3) ascending — lowest at top (live: 20,22,23...). */
  async isTableSortedByBillRateAscending(): Promise<boolean> {
    return this.isTableSortedBy(3, 'asc', true);
  }

  /** Job Title (index 1) descending Z→A (live: "VSC Senior Associate Director" ...). */
  async isTableSortedByJobTitleDescending(): Promise<boolean> {
    return this.isTableSortedBy(1, 'desc', false);
  }

  /** Job Title (index 1) ascending A→Z (live: "Analyst" ...). */
  async isTableSortedByJobTitleAscending(): Promise<boolean> {
    return this.isTableSortedBy(1, 'asc', false);
  }

  /** Home Office (index 2) descending Z→A (live: "Washington, D.C." ...). */
  async isTableSortedByHomeOfficeDescending(): Promise<boolean> {
    return this.isTableSortedBy(2, 'desc', false);
  }

  /** Home Office (index 2) ascending A→Z (live: "ACC - Bengaluru" ...). */
  async isTableSortedByHomeOfficeAscending(): Promise<boolean> {
    return this.isTableSortedBy(2, 'asc', false);
  }

  // ── @filter methods ──────────────────────────────────────────────────────────

  /**
   * Returns true when the Bill Rate table has updated (reloaded) after a filter
   * has been applied.
   *
   * Strategy (live-verified on /people/billRate — mirror of ChargesHoursPage
   * hasTableUpdatedAfterFilter):
   *   - Wait for the skeleton sentinel `table tbody tr td.team_member_name` to be
   *     present. This is the same sentinel used throughout BillRatePage: it only
   *     appears once real employee data has replaced the skeleton/loading rows.
   *   - No sleep — uses waitForSelector which polls the DOM.
   *
   * Live-confirmed after applying Management Model PA Managed: table shows 1289 rows
   * with td.team_member_name — confirming the sentinel works for filtered data too.
   */
  async hasTableUpdatedAfterFilter(): Promise<boolean> {
    try {
      await this.page.waitForSelector('table tbody tr td.team_member_name', { timeout: 60000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns true when no filter selection count badges are present on the page.
   *
   * Used by scenario 2 (no filters applied by default) to assert the clean state.
   * The badge appears as .selected-count inside a .filter-heading after a filter
   * option has been applied. Absence of all badges means no filters are active.
   *
   * Live-confirmed on /people/billRate default load: 0 `.selected-count` elements.
   */
  async areNoFiltersApplied(): Promise<boolean> {
    try {
      await this.page.waitForSelector('table tbody tr td.team_member_name', { timeout: 60000 });
      const badgeCount = await this.page.evaluate(
        () => document.querySelectorAll('.filter-heading .selected-count').length
      );
      return badgeCount === 0;
    } catch {
      return false;
    }
  }

  // NOTE: clickOutsideFilterPanel() / isFilterPanelClosed() were removed — the
  // Bill Rate feature has no scenario that calls them (live-verified: the page has
  // no document-level click-outside handler, so no @filter scenario asserts a
  // close-on-outside-click). The Timesheets page retains its own copies which its
  // scenarios do use.

  // ── @export methods ──────────────────────────────────────────────────────────

  /**
   * Returns true when the Export button is visible above the Bill Rate table.
   *
   * Live-confirmed: the button has class "ui button download-container__btn",
   * role=button, text "Export". Shares the same DOM structure as the Export
   * button on every other page in the app.
   */
  async isExportButtonVisible(): Promise<boolean> {
    try {
      // BUG FIX: same as isSortByLabelVisible above — Export is static UI chrome
      // that renders regardless of data; don't gate it on a data-row sentinel.
      await this.billRateHeader.waitFor({ state: 'visible', timeout: 30000 });
      const btn = this.page.getByRole('button', { name: 'Export' });
      await btn.waitFor({ state: 'visible', timeout: 15000 });
      return true;
    } catch {
      return false;
    }
  }

  // isExportButtonEnabled() is inherited from BasePage (page-agnostic Export button).

  /**
   * Clicks the Export button on the Bill Rate page and waits for the Playwright
   * download event to fire.
   *
   * Strategy (live-confirmed 2026-06-21 on /people/billRate):
   *   - No confirmation modal — download fires IMMEDIATELY when the button is clicked.
   *   - Uses Promise.all to set up the event listener BEFORE the click so no
   *     download event is missed.
   *   - Mirrors People Billability clickExportAndWaitForDownload() which is also
   *     modal-free (NOT the Charges/Hours pattern which awaits a modal first).
   *   - Live download: POST /ktd-billing/billing/api//billability/bill-rate/download
   *     → HTTP 200 → Blob URL → <a download> → Playwright download event.
   *   - Confirmed filename: "Bill Rate.xlsx"
   */
  async clickExportAndWaitForDownload(): Promise<Download> {
    await this.page.waitForSelector('table tbody tr td.team_member_name', { timeout: 60000 });
    try {
      const [download] = await Promise.all([
        this.page.waitForEvent('download', { timeout: 60000 }),
        this.page.getByRole('button', { name: 'Export' }).click(),
      ]);
      return download;
    } catch {
      const [download] = await Promise.all([
        this.page.waitForEvent('download', { timeout: 60000 }),
        this.page.getByRole('button', { name: 'Export' }).click(),
      ]);
      return download;
    }
  }

  // saveDownload() / getFileSizeBytes() are inherited from BasePage.

  // ── @export filter method ────────────────────────────────────────────────────

  /**
   * Selects a named checkbox option within the specified filter panel on the
   * Bill Rate page. Delegates to the shared global-filter helper in BasePage
   * (live-confirmed identical DOM on /people/billRate).
   *
   * @param optionName  Exact label text of the option to select.
   * @param filterName  Name of the filter panel (e.g. "Management Model", "Path").
   */
  async selectFilterOption(optionName: string, filterName: string): Promise<void> {
    await this.selectGlobalFilterOption(optionName, filterName);
  }
}
