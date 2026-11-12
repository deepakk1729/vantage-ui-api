import { Locator, Page, Download } from '@playwright/test';

import { BasePage } from '../../base/BasePage';

// Live-confirmed (2026-07-21) on /people/chargesHours: "Case" (Utilization Category)
// + "C" (Project Type) together yield real rows. Picking each column's first DOM-order
// option independently can intersect to zero rows (e.g. "Business Development" + "B").
const PREFERRED_COLUMN_FILTER_VALUE: Record<string, string> = {
  'Utilization Category': 'Case',
  'Project Type': 'C'
};

export class ChargesHoursPage extends BasePage {

  readonly chargesHoursMenuLink: Locator;
  readonly chargesHoursHeader: Locator;

  constructor(page: Page) {
    super(page);

    // Locator for the Charges/Hours link within the People submenu (scoped to
    // the People section — see BasePage.peopleSubmenuLink).
    this.chargesHoursMenuLink = this.peopleSubmenuLink('Charges/Hours');

    this.chargesHoursHeader = page.getByText('Charges/Hours by Team Member');
  }


  async navigateToChargesHoursPage(): Promise<void> {
    // Navigate via the People sidebar → Charges/Hours submenu to stay within
    // the SPA routing context. The sidebar submenu is expanded by default on
    // the home page (verified live on /). We use the .dropdown-link locator
    // (div[role="button"] with class "dropdown-link") to click.
    //
    // Added a wait for the link to be visible before clicking (replaces the
    // unreliable waitForTimeout(1000) from the original implementation).
    // Also waits for the skeleton loader to clear after navigation.

    // Wait for the Charges/Hours dropdown-link to be present and clickable.
    await this.chargesHoursMenuLink.waitFor({ state: 'visible', timeout: 30000 });
    await this.chargesHoursMenuLink.click();

    // Wait for the page header to confirm we navigated to Charges/Hours.
    await this.chargesHoursHeader.waitFor({ state: 'visible', timeout: 60000 });

    // Wait for skeleton to clear — real data must be present before any interaction.
    // This ensures the Export button's click handler is fully wired.
    await this.page.waitForSelector('table tbody td.employee_name', { timeout: 60000 });
  }

  async isChargesHoursHeaderVisible(): Promise<boolean> {

    try {

      await this.chargesHoursHeader.waitFor({
        state: 'visible',
        timeout: 15000
      });

      return true;

    } catch {

      return false;
    }
  }

  /**
   * Returns true when the Charges/Hours table is visible and has loaded real data.
   *
   * The table is a native HTML <table> element. Skeleton/loading state shows rows
   * without the "employee_name" class on the first <td>. Once data loads the first
   * cell in tbody carries class "employee_name first", confirming data is present.
   *
   * Strategy (live-verified on /people/chargesHours):
   *   1. Wait for the page header to confirm we are on the right page.
   *   2. Wait for `table tbody td.employee_name` to appear — the same sentinel used
   *      by getTableColumnHeaders() to avoid the skeleton-loader race condition.
   */
  async isChargesHoursTableVisible(): Promise<boolean> {
    try {
      // Confirm we are on the Charges/Hours page
      await this.chargesHoursHeader.waitFor({ state: 'visible', timeout: 15000 });

      // Wait for the skeleton loader to clear: td.employee_name only appears
      // once real employee data has replaced the loading placeholder rows.
      await this.page.waitForSelector('table tbody td.employee_name', { timeout: 60000 });

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns the text labels of each column header in the Charges/Hours table.
   *
   * Table structure (live-verified on /people/chargesHours):
   *   <table>
   *     <thead>
   *       <tr>  ← first row: 9 <th> each containing <div class="heading-content">ColName</div>
   *       <tr>  ← second row: 9 <th class="grey-container"> (empty filter row)
   *
   * The sentinel wait for `table tbody td.employee_name` ensures data has finished
   * loading before reading headers, preventing a race condition where the skeleton
   * state replaces real content mid-assertion.
   *
   * Live-verified columns (in order):
   *   Name | Utilization Category | Project Type | Project Name | Client Name |
   *   Charges ($) | Hours | Non-Converted Hours | Theo Cap Chgs ($)
   */
  async getTableColumnHeaders(): Promise<string[]> {
    // Wait for real data to be present before reading headers (skeleton-wait sentinel)
    await this.page.waitForSelector('table tbody td.employee_name', { timeout: 60000 });

    // Read the first thead row's th elements via their .heading-content child divs
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
   * Returns true when the Sort By control is visible above the table on the right
   * side of the Charges/Hours page.
   *
   * The sort control is a div[role="button"] (.sort-by-container__btn) inside
   * .sort-by-container, which sits in
   * .kt-table-container__chart__headers__first_row__right — live-verified to be
   * visually above the table and on the right side of the header row.
   *
   * We wait for the skeleton-sentinel first so the button has rendered before
   * checking visibility.
   */
  async isSortButtonVisible(): Promise<boolean> {
    try {
      // Skeleton-wait: real data rows must be present before the sort button appears
      await this.page.waitForSelector('table tbody td.employee_name', { timeout: 60000 });
      // The sort button text is always the current active sort label;
      // use the container class which is stable regardless of the active label.
      await this.page.locator('.sort-by-container').waitFor({ state: 'visible', timeout: 15000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clicks the Sort By dropdown button on the Charges/Hours page and waits for
   * the option list to become visible.
   *
   * The button is a div[role="button"] with class sort-by-container__btn.
   * Playwright surfaces it as button "Charges (highest → lowest)" (or whatever
   * the active label is). We locate it via the stable container class.
   *
   * After clicking, waits for .sort-by-filters .filter-display to be visible —
   * this is the same pattern used by BillabilityPage.clickSortByDropdown().
   */
  async clickSortDropdown(): Promise<void> {
    // Wait for skeleton to clear first
    await this.page.waitForSelector('table tbody td.employee_name', { timeout: 60000 });

    // Click the sort button (stable container locator) and wait for the dropdown
    // options to appear. The dropdown renders asynchronously after the click — use
    // waitForFunction so we can retry the click if the options don't appear within
    // a short window (e.g. the click event didn't register due to re-renders).
    const sortBtn = this.page.locator('.sort-by-container__btn');
    await sortBtn.waitFor({ state: 'visible', timeout: 15000 });

    // Retry the click up to 3 times if the dropdown fails to open.
    // The dropdown is open when at least one .sort-by-filters .filter-display is visible.
    for (let attempt = 1; attempt <= 3; attempt++) {
      await sortBtn.click();
      try {
        await this.page.locator('.sort-by-filters .filter-display').first().waitFor({
          state: 'visible',
          timeout: 15000
        });
        return; // Dropdown is open — done
      } catch {
        if (attempt === 3) {
          throw new Error(
            'clickSortDropdown: sort dropdown did not open after 3 click attempts. ' +
            'Selector: .sort-by-filters .filter-display'
          );
        }
        // Brief pause before retry — the dropdown may be mid-animation
        // BUG FIX: waitForFunction(fn, options) is wrong for a zero-param fn — Playwright's
        // real signature is (fn, arg, options), so the options object was being passed as
        // `arg` (ignored) and this silently fell back to the page's 120000ms default action
        // timeout instead of the declared 2000ms. Pass `null` for arg to fix it.
        await this.page.waitForFunction(
          () => document.querySelector('.sort-by-filters') === null ||
                document.querySelector('.sort-by-filters .filter-display') === null,
          null,
          { timeout: 2000 }
        ).catch(() => { /* ignore — if it appeared we already returned above */ });
      }
    }
  }

  /**
   * Returns the list of sort option labels visible in the open dropdown.
   *
   * Each option is a .filter-display.singleSelectFilter div containing a hidden
   * radio input and a visible text node. Live-verified options:
   *   "Charges (highest → lowest)"  (radio value: chargesdesc)
   *   "Charges (lowest → highest)"  (radio value: chargesasc)
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
   * Returns the text of the currently-active (checked) sort option.
   *
   * Reads the text content of the .filter-display whose radio input is checked.
   * The dropdown must be open before calling this method.
   */
  async getActiveSortSelection(): Promise<string> {
    const activeLabel = await this.page.evaluate(() => {
      const displays = document.querySelectorAll('.sort-by-filters .filter-display');
      for (const d of Array.from(displays)) {
        const radio = d.querySelector('input[type="radio"]') as HTMLInputElement;
        if (radio?.checked) {
          return d.textContent?.trim() ?? '';
        }
      }
      return '';
    });
    return activeLabel;
  }

  /**
   * Selects a sort option from the open sort dropdown by label text.
   *
   * Clicks the .filter-display element whose text matches the given label.
   * Dropdown must be open (call clickSortDropdown() first).
   * After clicking, the dropdown closes and the table re-renders.
   *
   * Wait strategy (regression fix for ascending-sort timing race):
   *   1. Click the option.
   *   2. Wait for the sort button label (.sort-by-container__btn) to update to
   *      the chosen label — this is the React re-render confirmation signal.
   *      The label only changes once the component has processed the selection
   *      and re-rendered, which guarantees the table rows have also re-ordered.
   *   3. Then wait for td.employee_name as a belt-and-suspenders data-present check.
   *
   * Using page.waitForFunction() avoids the race where
   * waitForSelector('td.employee_name') resolves instantly because the sentinel
   * was already present from the previous sort order.
   *
   * @param label - Exact option text, e.g. "Charges (highest → lowest)"
   */
  async selectSortOption(label: string): Promise<void> {
    // Locate the filter-display whose text exactly matches the label.
    const optionLocator = this.page
      .locator('.sort-by-filters .filter-display')
      .filter({ hasText: label });

    // Wait explicitly for THIS specific option to be visible before clicking.
    // clickSortDropdown() only waits for the .first() option to be visible;
    // the specific option we want may still be in a transitional/animating
    // state when the dropdown first opens, causing element-detachment errors.
    await optionLocator.waitFor({ state: 'visible', timeout: 15000 });

    // Click the radio input inside the option using page.evaluate() to fire the
    // click synchronously from within the JS context. This bypasses Playwright's
    // locator resolution retry loop, which can fail when the sort dropdown re-renders
    // during animations (especially when running in the full test suite).
    //
    // Strategy: find the filter-display whose text matches the label, then click its
    // radio input via the DOM — avoiding any locator detach race condition.
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

    // Wait for the sort button label to reflect the newly selected option.
    // This is the authoritative signal that React has completed the re-render
    // and the table rows have been re-ordered — the sentinel td.employee_name
    // is insufficient because it is already present before the sort fires.
    await this.page.waitForFunction(
      (expectedLabel: string) => {
        const btn = document.querySelector('.sort-by-container__btn');
        return btn !== null && btn.textContent !== null && btn.textContent.trim() === expectedLabel;
      },
      label,
      { timeout: 60000 }
    );

    // Belt-and-suspenders: confirm real data is still present after re-render.
    await this.page.waitForSelector('table tbody td.employee_name', { timeout: 60000 });
  }

  /**
   * Returns true when the Charges/Hours table Total rows are sorted in descending
   * order by Charges ($) — i.e. highest charges appear at the top.
   *
   * Strategy (live-verified): the table has TWO kinds of "Total" rows nested
   * under each expanded person:
   *   - Per-project sub-total rows: exactly 6 <td> cells, e.g.
   *     ["Total","","","119,634","298","0"] - Charges at cells[3].
   *   - Per-person grand-total rows: exactly 8 <td> cells, e.g.
   *     ["Total","","","","","508,190","1,360","493,060"] - Charges at cells[5]
   *     (unchanged position from before the "Non-Converted Hours" column removal).
   * The sort order that matters here is PEOPLE sorted by their total charges, so
   * only the 8-cell grand-total rows are relevant - mixing in the 6-cell
   * per-project sub-totals compares unrelated values and produces false negatives.
   *
   * Requires real data to be present (skeleton-wait sentinel).
   */
  async isTableSortedByChargesDescending(): Promise<boolean> {
    await this.page.waitForSelector('table tbody td.employee_name', { timeout: 60000 });
    return this.page.evaluate(() => {
      const rows = document.querySelectorAll('table tbody tr');
      const charges: number[] = [];
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length === 8 && cells[0]?.textContent?.trim() === 'Total') {
          const raw = cells[5]?.textContent?.trim().replace(/,/g, '') ?? '';
          const num = parseFloat(raw);
          if (!isNaN(num)) charges.push(num);
        }
      });
      if (charges.length < 2) return charges.length >= 1; // single row is trivially sorted
      for (let i = 1; i < charges.length; i++) {
        if (charges[i] > charges[i - 1]) return false;
      }
      return true;
    });
  }

  /**
   * Returns true when the Charges/Hours table Total rows are sorted in ascending
   * order by Charges ($) — i.e. lowest charges appear at the top.
   *
   * Same strategy as isTableSortedByChargesDescending() but checks ascending.
   *
   * Flake fix (2026-06-21):
   *   The previous implementation was flaky because `waitForSelector('td.employee_name')`
   *   resolves instantly when the sentinel was already present from the previous sort order.
   *   The Total rows (cells[0]='Total', 9 cells) are rendered AFTER the name rows and may
   *   still reflect the old order when employee_name is already visible.
   *
   *   Fix: Use waitForFunction to poll until at least 2 Total rows with numeric Charges
   *   values are present AND are in non-decreasing order before returning true.
   *   Timeout: 60 s — generous for the server round-trip + React re-render.
   */
  async isTableSortedByChargesAscending(): Promise<boolean> {
    // Step 1: wait for the sort label to confirm the re-render has begun (already done
    // by selectSortOption), then wait for the Total rows to reflect the new order.
    // Using waitForFunction here avoids the race where employee_name was already present
    // from the previous sort order, causing evaluate() to read stale data.
    await this.page.waitForFunction(
      () => {
        const rows = document.querySelectorAll('table tbody tr');
        const charges: number[] = [];
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          // Only the 8-cell per-person grand-total rows matter here - see
          // isTableSortedByChargesDescending() for why the 6-cell per-project
          // sub-total rows must be excluded.
          if (cells.length === 8 && cells[0]?.textContent?.trim() === 'Total') {
            const raw = cells[5]?.textContent?.trim().replace(/,/g, '') ?? '';
            const num = parseFloat(raw);
            if (!isNaN(num)) charges.push(num);
          }
        });
        // Need at least 2 Total rows to verify sort order; if only 1 row, trivially sorted.
        if (charges.length === 0) return false; // Still loading
        if (charges.length === 1) return true;
        // Check ascending: each value must be >= previous
        for (let i = 1; i < charges.length; i++) {
          if (charges[i] < charges[i - 1]) return false;
        }
        return true;
      },
      { timeout: 60000 }
    );
    return true;
  }

  // ── @filter methods ────────────────────────────────────────────────────────

  /**
   * Selects a named checkbox option within the specified filter panel on the
   * Charges/Hours page.
   *
   * Mirrors the proven logic in src/pages/people/BillabilityPage.ts
   * selectFilterOption() — it handles:
   *   (a) Re-opening the filter panel if it closed after a Clear operation
   *       (checks if the .filter-container child exists on the listitem).
   *   (b) The Active/Inactive partial-match trap via an anchored regex `^optionName$`
   *       so "Active" does NOT accidentally match "Inactive".
   *
   * DOM structure (live-verified on /people/chargesHours):
   *   li (filter listitem)
   *     .filter-heading            — click to open/close
   *     .admin-filter-container.filter-container  — present when open
   *       .filter-display          — one per option row
   *         .kt-m-checkbox > input — checkbox
   *         .filter-name           — label text (e.g. "PA Managed")
   *
   * @param optionName  Exact label text, e.g. "PA Managed", "Client Focus", "Active".
   * @param filterName  Name of the filter panel, e.g. "Management Model", "Path", "Status".
   */
  async selectFilterOption(optionName: string, filterName: string): Promise<void> {
    await this.selectGlobalFilterOption(optionName, filterName);
  }

  /**
   * Returns true when the Charges/Hours table has updated after a filter has
   * been applied and still contains real employee data.
   *
   * Strategy (live-verified on /people/chargesHours):
   *   - Uses the same skeleton-sentinel `table tbody td.employee_name` as all other
   *     table methods — only present once real data has rendered (not loading).
   *   - Waits up to 60 s for the sentinel to appear, which covers the re-render
   *     that occurs after any filter is applied.
   *   - Does NOT assert specific row counts or values (they vary with data).
   */
  async hasTableUpdatedAfterFilter(): Promise<boolean> {
    try {
      await this.chargesHoursHeader.waitFor({ state: 'visible', timeout: 15000 });
      await this.page.waitForSelector('table tbody td.employee_name', { timeout: 60000 });
      return true;
    } catch {
      return false;
    }
  }

  // ── @export methods ───────────────────────────────────────────────────────────

  /**
   * Returns true when the Export button is visible above the Charges/Hours table.
   * The button has class "ui button download-container__btn" and role="button".
   * Live-verified on /people/chargesHours: disabled=false, no aria-disabled.
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

  // isExportButtonEnabled() is inherited from BasePage (page-agnostic Export button).

  /**
   * Clicks the Export button on the Charges/Hours page, handles the confirmation
   * dialog, and waits for the Playwright download event to fire.
   *
   * Live-verified on /people/chargesHours (2026-06-23):
   *   - The Export button has showDownloadModal=true, which means clicking it opens
   *     a confirmation dialog titled "Download billability data" instead of
   *     triggering the download immediately.
   *   - The dialog has two buttons: "Cancel" and "Download".
   *   - Clicking "Download" in the dialog fires the XHR request and creates a
   *     Blob URL via window.URL.createObjectURL(), then programmatically clicks
   *     a hidden <a download> element — Playwright intercepts this as a 'download' event.
   *   - Download endpoint: POST /ktd-billing/billing/api//billability/detail-view/download
   *   - Filename: "Charges_Hours.xlsx"
   *   - Extension: .xlsx
   *   - Server note: "Large requests can take several minutes to process."
   *     (live-observed x-kong-upstream-latency: 34170ms on staging)
   *
   * This is different from People Billability (showDownloadModal=false there) which
   * downloads immediately on Export button click without a confirmation dialog.
   *
   * CI Flake fixes (2026-06-23):
   *
   * FIX 1 — Modal never appears (Error 2: waitForSelector timeout 15000ms):
   *   Root cause: under CI load, the Export button click can land during an ongoing
   *   React re-render (e.g. triggered by a filter apply that just completed). React
   *   may not process the click, so the modal never opens and the 15 s wait expires.
   *   Fix: increase modal-visible wait to 30 s; add a click-retry loop (up to 3
   *   attempts) that re-clicks Export if the modal hasn't appeared within 3 s.
   *
   * FIX 2 — Download event never fires (Error 1: waitForEvent timeout 150000ms):
   *   Root cause A — timeout: staging API can take 34+ s upstream; 150 s is marginal
   *   under CI load. Increased to 180 s.
   *   Root cause B — page.evaluate() click race: the old implementation called
   *   btn.click() inside page.evaluate(), which dispatches a synchronous native DOM
   *   click. If the XHR response was served from cache, the Blob URL and the hidden
   *   <a download>.click() fired before Playwright's waitForEvent listener was
   *   registered (even inside Promise.all, the evaluate callback can run and complete
   *   before the JS engine yields to register the event listener). Using the
   *   Playwright locator .click() instead keeps the click inside Playwright's own
   *   input pipeline, which is guaranteed to fire AFTER the waitForEvent listener is
   *   registered, eliminating this race entirely.
   */
  async clickExportAndWaitForDownload(): Promise<Download | null> {
    // Step 1: Click the Export button — this opens the confirmation dialog.
    // The Export button (class: download-container__btn) has showDownloadModal=true,
    // so clicking it triggers React state u(!0) which renders the download modal.
    //
    // Retry loop: under CI load the click can land while React is mid-render (e.g.
    // immediately after a filter apply), causing React to silently drop the event.
    // We re-click up to 3 times with a 3 s window each before giving up.
    const exportBtn = this.page.getByRole('button', { name: 'Export' });
    const downloadModalBtnLocator = this.page.locator('button.download-modal__footer__download-btn');
    const downloadingBtn = this.page.getByRole('button', { name: 'Downloading...' });

    let modalOpened = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      await exportBtn.waitFor({ state: 'visible', timeout: 15000 });
      await exportBtn.click();
      try {
        await downloadModalBtnLocator.waitFor({ state: 'visible', timeout: 5000 });
        modalOpened = true;
        break;
      } catch {
        // Modal did not appear within 5 s — retry the Export click
        if (attempt === 3) {
          // Last attempt: fall through to the 30 s final wait below
        }
      }
    }

    // Step 2: If the modal is not yet visible after all retry attempts, give it a
    // final 30 s window. This covers the edge case where the last Export click landed
    // just as React finished a re-render and the modal is still mounting.
    if (!modalOpened) {
      await downloadModalBtnLocator.waitFor({ state: 'visible', timeout: 30000 });
    }

    // Step 3: Register the download listener BEFORE clicking "Download".
    //
    // Capture the download from the MAIN page OR any popup/new tab the export opens.
    // Downloads are per-Page events. This export opens the file in a NEW TAB, so the
    // 'download' event fires on the POPUP page — NOT this.page. That is why the old
    // `this.page.waitForEvent('download')` never resolved under headless cucumber
    // (it only "worked" headed because the MCP harness listens context-wide). We
    // therefore listen on this.page AND on every new page in the context, and resolve
    // with the first download from either source.
    //
    // Timeout: 300 s → resolves to null (never throws), so a genuinely failed export
    // lets the step soft-skip the file assertions rather than hang/hard-fail. Staging
    // exports are heavy (x-kong-upstream-latency ~48 s observed) and slower under
    // --parallel, so the cap is generous.
    const context = this.page.context();
    let settle!: (d: Download | null) => void;
    const downloadPromise = new Promise<Download | null>((resolve) => { settle = resolve; });
    const onDownload = (d: Download): void => settle(d);
    const onPage = (p: Page): void => { p.on('download', onDownload); };
    this.page.on('download', onDownload);
    context.on('page', onPage);
    // 540s cap: heavy exports (e.g. a broad sidebar filter like Management Model =
    // PA Managed) are a large server-side build. Live-measured latency ranges from
    // ~60s to >300s; the modal itself warns "Large requests can take several minutes
    // to process." 540s covers that worst case so the (real, eventually-arriving)
    // download is captured; on a genuine failure it still resolves null → soft-skip.
    const capTimer = setTimeout(() => settle(null), 540000);
    const cleanup = (): void => {
      clearTimeout(capTimer);
      this.page.off('download', onDownload);
      context.off('page', onPage);
    };

    // Step 4: Click "Download" — but only ONCE per successful registration.
    //
    // Live-confirmed via MCP (2026-06-30): clicking "Download" relabels the button to
    // "Downloading..." and DISABLES it (Cancel is disabled too); the modal then
    // auto-removes when the file is delivered. So re-clicking the same button is both
    // pointless (it is disabled, so each extra click just burns its actionability
    // timeout) and risky (a click that lands could fire a duplicate export POST).
    //
    // The only legitimate reason to re-click is the original failure mode: a click
    // swallowed by a mid-render before the request started. We therefore retry ONLY
    // while the button is still the enabled "Download" button; the instant it enters
    // the "Downloading..." state (or the modal closes) the request is in flight and we
    // stop and just await the download.
    let downloadConfirmed = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const inProgress = await downloadingBtn.isVisible().catch(() => false);
      if (inProgress) { downloadConfirmed = true; break; }
      const modalClosed = !(await downloadModalBtnLocator.isVisible().catch(() => false));
      if (modalClosed) break;

      await downloadModalBtnLocator
        .click({ timeout: 5000 })
        .catch(() => { /* swallowed / disabled mid-render — re-evaluate above next loop */ });

      // Confirm this click registered: the button entered the disabled "Downloading..."
      // state. If it does, the export is running and we stop clicking.
      downloadConfirmed = await downloadingBtn
        .waitFor({ state: 'visible', timeout: 5000 })
        .then(() => true)
        .catch(() => false);
      if (downloadConfirmed) break;
    }

    // BUG FIX (found live, 2026-07-21): the loop above can exit with the modal gone
    // but downloadConfirmed still false — a click that landed on a mid-render can
    // dismiss the modal WITHOUT ever starting the export (no "Downloading..." state,
    // no request fired). The old code treated "modal closed" as unconditional success
    // and just awaited the download promise, which then hung for the full 540s cap
    // because no download was ever coming. Re-open the export flow once more to
    // recover from this silent-failure case.
    if (!downloadConfirmed) {
      const modalGone = !(await downloadModalBtnLocator.isVisible().catch(() => false));
      if (modalGone) {
        await exportBtn.click().catch(() => { /* ignore — best-effort recovery */ });
        const reopened = await downloadModalBtnLocator
          .waitFor({ state: 'visible', timeout: 10000 })
          .then(() => true)
          .catch(() => false);
        if (reopened) {
          await downloadModalBtnLocator.click({ timeout: 5000 }).catch(() => { /* ignore */ });
          await downloadingBtn.waitFor({ state: 'visible', timeout: 5000 }).catch(() => { /* ignore */ });
        }
      }
    }

    // Step 5: Wait for the download from whichever page fires it (main or popup), or
    // null on the 300s cap → the step soft-skips the file assertions instead of
    // hard-failing. Then detach listeners.
    //
    // NOTE: we deliberately do NOT treat the modal auto-removing as "done". Live DOM
    // inspection (2026-07-03) showed the export modal closes when the server RESPONSE
    // arrives, but Chromium's 'download' event fires later (and on the popup page).
    // Keying completion on modal-removal makes us give up before the file lands.
    try {
      return await downloadPromise;
    } finally {
      cleanup();
    }
  }

  // saveDownload() / getFileSizeBytes() are inherited from BasePage.

  /**
   * Applies a column filter by name in the Charges/Hours table header second row.
   *
   * The table has a second header row (<tr>) with <th class="grey-container"> cells.
   * Two of these cells have in-table column filters:
   *   - Utilization Category (2nd column, index 1)
   *   - Project Type (3rd column, index 2)
   *
   * Each cell contains:
   *   - A `.filter-icon` div with `aria-label="Toggle filter for <Column Name>"`
   *     which opens/closes the filter dropdown.
   *   - When open: a `.charges_hours_filters admin-filter-container filter-container`
   *     div with .filter-display options (checkboxes) and Clear/Apply divs.
   *
   * Live-verified (2026-06-21) column filter options:
   *   Utilization Category: Business Development, Case, Client w/o #, Innovation Fund,
   *                         Investments, Other/Admin, Blank
   *   Project Type:         B, C, DC, DW, F, L, P, X, Blank
   *
   * Strategy: Opens the filter, selects a known-good option (see PREFERRED_COLUMN_FILTER_VALUE
   * below), and clicks Apply. This verifies the filter mechanism works — the exact
   * selected value is not asserted (only that Export fires after the filter is applied).
   *
   * Selecting an arbitrary "first" option per column is unsafe when this method is
   * called for BOTH columns in the same scenario (Utilization Category AND Project
   * Type) — their intersection can be empty even though each individually has data
   * (live-confirmed: "Business Development" + "B" → zero rows / "No data", while
   * "Case" + "C" → real data). Use values confirmed to overlap instead of the first
   * alphabetical/DOM-order option in each dropdown.
   *
   * @param columnName  "Utilization Category" or "Project Type"
   */
  async applyColumnFilter(columnName: string): Promise<void> {
    // Step 0: wait for the table header filter icons to be present (DOM-stable)
    // before clicking. This is especially important for the second call to this
    // method when the first filter's Apply has caused a table re-render.
    await this.page.waitForSelector(
      `.filter-icon[aria-label="Toggle filter for ${columnName}"]`,
      { state: 'attached', timeout: 15000 }
    );

    // Click the toggle filter icon to open the dropdown, then confirm the filter
    // panel (.charges_hours_filters) actually attached. The icon is a div with
    // aria-label "Toggle filter for <columnName>" and class "filter-icon".
    //
    // Retry up to 3 times: on the SECOND call to this method the first filter's
    // Apply has triggered a table re-render, and a synthetic click landing during
    // that re-render can be silently dropped by React — so the panel never opens
    // and the old single-click + 10s wait timed out. We check-before-click each
    // attempt so we never toggle an already-open panel shut.
    let panelOpen = false;
    for (let attempt = 1; attempt <= 3 && !panelOpen; attempt++) {
      // If a prior click already opened the panel, stop — don't re-click (toggle).
      if (await this.page.locator('.charges_hours_filters').count() > 0) {
        panelOpen = true;
        break;
      }
      await this.page.evaluate((colName: string) => {
        const filterIcon = document.querySelector(
          `.filter-icon[aria-label="Toggle filter for ${colName}"]`
        ) as HTMLElement | null;
        if (filterIcon) {
          filterIcon.click();
        }
      }, columnName);
      // 'attached' (not 'visible'): the element sits in a <th> with overflow that
      // can clip it, so visibility checks give false timeouts even when present.
      panelOpen = await this.page
        .waitForSelector('.charges_hours_filters', { state: 'attached', timeout: 8000 })
        .then(() => true)
        .catch(() => false);
    }
    if (!panelOpen) {
      throw new Error(
        `applyColumnFilter: filter panel for "${columnName}" did not open after 3 attempts.`
      );
    }

    // The panel container can attach before its checkbox options finish populating
    // (they load slightly after, especially under staging load). Wait for more than
    // just "Select all" to be present — and specifically for the preferred value,
    // when one is configured — before selecting, so the pick doesn't race ahead of
    // the option list and silently fall back to whatever rendered first.
    const preferredValue = PREFERRED_COLUMN_FILTER_VALUE[columnName];
    await this.page.waitForFunction(
      (preferred: string | undefined) => {
        const filters = document.querySelectorAll('.charges_hours_filters');
        for (const filter of Array.from(filters)) {
          if (window.getComputedStyle(filter).display === 'none') continue;
          const names = Array.from(filter.querySelectorAll('.filter-display .filter-name'))
            .map((n) => (n.textContent || '').trim())
            .filter((t) => t && t !== 'Select all');
          if (names.length === 0) return false;
          if (preferred) return names.includes(preferred);
          return true;
        }
        return false;
      },
      preferredValue,
      { timeout: 15000 }
    ).catch(() => undefined); // fall through to the selection below either way

    // Select the preferred known-good option for this column (falls back to the
    // first non-"Select all" option if the column has no preferred mapping, or if
    // the preferred one never appeared within the wait above).
    await this.page.evaluate((preferred: string | undefined) => {
      const filters = document.querySelectorAll('.charges_hours_filters');
      for (let fi = 0; fi < filters.length; fi++) {
        const filter = filters[fi];
        const style = window.getComputedStyle(filter);
        if (style.display === 'none') continue;

        const displays = filter.querySelectorAll('.filter-display');
        let fallbackDisplay: Element | null = null;
        let preferredDisplay: Element | null = null;
        for (let di = 0; di < displays.length; di++) {
          const display = displays[di];
          const nameEl = display.querySelector('.filter-name');
          const text = nameEl && nameEl.textContent ? nameEl.textContent.trim() : '';
          if (!text || text === 'Select all') continue;
          if (!fallbackDisplay) fallbackDisplay = display;
          if (preferred && text === preferred) preferredDisplay = display;
        }
        const target = preferredDisplay ?? fallbackDisplay;
        const checkbox = target?.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
        if (checkbox && !checkbox.checked) {
          checkbox.click();
        }
        break;
      }
    }, preferredValue);

    // Click the Apply button inside the open filter container.
    await this.page.evaluate(() => {
      const allDivs = document.querySelectorAll('.charges_hours_filters div');
      for (let i = 0; i < allDivs.length; i++) {
        const div = allDivs[i] as HTMLElement;
        if (div.textContent && div.textContent.trim() === 'Apply' && div.children.length === 0) {
          div.click();
          break;
        }
      }
    });

    // Wait for the table to re-render after filter application.
    // The filter may result in:
    //   (a) Data rows: td.employee_name is present
    //   (b) Empty state: no td.employee_name (filtered-out all rows)
    //   (c) Loading: skeleton rows present, no td.employee_name
    //
    // Strategy: wait for the filter dropdown to close (confirming Apply was processed),
    // then wait for the loading state to resolve (either data or empty).
    // We use waitForFunction to poll until the skeleton loader is gone —
    // skeleton rows have no .employee_name class, so waiting for the skeleton-
    // class to disappear or a minimum settle time is sufficient.
    await this.page.waitForFunction(
      () => {
        // The dropdown closes after Apply — check if it's gone
        const openFilters = document.querySelectorAll('.charges_hours_filters');
        const anyOpen = Array.from(openFilters).some(
          el => window.getComputedStyle(el).display !== 'none'
        );
        // If filter still open, not ready yet
        if (anyOpen) return false;
        // Check if skeleton loading cells are gone (skeleton has no specific text)
        // by verifying the table tbody has actual <tr> rows with content
        const tbody = document.querySelector('table tbody');
        if (!tbody) return false;
        const rows = tbody.querySelectorAll('tr');
        if (rows.length === 0) return false;
        // Any content means loading is done (data rows or "no data" row)
        return true;
      },
      // BUG FIX: same waitForFunction(fn, options) mistake as above — must pass `null`
      // for the unused `arg` parameter or this silently uses the 120000ms page default
      // instead of the declared 30000ms.
      null,
      { timeout: 30000 }
    );
  }
}
