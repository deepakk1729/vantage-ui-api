import { Locator, Page } from '@playwright/test';

/**
 * DateRangeFilter
 *
 * Encapsulates the Date Range filter found at the top of the filter panel on
 * every page that exposes it (Home, People Billability, Timesheets,
 * Charges/Hours, Business Comparison Billability).
 *
 * DOM structure (when expanded):
 *   <li> (the filter item)
 *     <div>          ← shows label like "Jan 2025 to Dec 2025"
 *     <div class="date-calender-container">
 *       <div class="date-calender-container__left">
 *         <div class="date-calender-container__left__list-item active">
 *           <input type="radio" name="dateType">
 *           <span>Last</span>
 *           <input type="text"  name="months">
 *           <span>months</span>
 *         </div>
 *         <div class="date-calender-container__left__list-item">
 *           <input type="radio" name="dateType">
 *           <span>Last</span>
 *           <input type="text" name="weeks">
 *           <span>weeks</span>
 *         </div>
 *         <div class="date-calender-container__left__list-item">
 *           <input type="radio" name="dateType">
 *           <span>Custom</span>
 *         </div>
 *         <!-- "Trailing 12 months" radio removed from the app (live-confirmed) - only
 *              Last months / Last weeks / Custom remain, so Custom is now nth(2). -->
 *         <div class="button-footer">
 *           <div class="apply [disabled]">Apply</div>
 *         </div>
 *       </div>
 *     </div>
 *   </li>
 *
 * Validation behaviour (observed live):
 *   Months:
 *     - Empty input    → Apply button gains class "apply disabled" (no error text)
 *     - 0 / negative / non-numeric → error text "Please enter a value from 1 to N"
 *     - > N            → same error text
 *       N is NOT a fixed constant - live-confirmed it tracks the number of months
 *       in the current (buggy calendar-year-to-date) default range (e.g. "1 to 8"
 *       in August); do not assert against a specific N.
 *     - decimal (e.g. 3.5) → ACCEPTED (app applies the value without error)
 *     - valid integer  → filter closes, date range label updates to "Mmm YYYY to Mmm YYYY"
 *   Weeks:
 *     - Empty input    → Apply button gains class "apply disabled" (no error text)
 *     - 0 / negative / non-numeric → error text "Please enter a value from 1 to N"
 *     - > N            → same error text (N tracks the same dynamic window in weeks,
 *       e.g. "1 to 33" - do not assert against a specific N)
 *     - non-numeric    → Apply disabled when typed; force-click Apply → error text shown
 *     - decimal (e.g. 3.5) → ACCEPTED (app applies the value without error, truncated to integer)
 *     - valid integer  → filter closes, date range label updates to "Mmm-DD-YYYY to Mmm-DD-YYYY"
 */
export class DateRangeFilter {

  /** Playwright Page instance for evaluate() calls */
  private readonly page: Page;

  /** Stable selector for the expandable panel container */
  private readonly container: Locator;

  /** Selector for the entire listitem (including the trigger label) */
  private readonly listItem: Locator;

  /** The "Last N months" radio (first radio inside the container) */
  readonly lastMonthsRadio: Locator;

  /** The months count text input */
  readonly lastMonthsInput: Locator;

  /** The "Last N weeks" radio (second radio inside the container) */
  readonly lastWeeksRadio: Locator;

  /** The weeks count text input */
  readonly lastWeeksInput: Locator;

  /** The "Custom" radio (third radio inside the container - "Trailing 12 months" was removed from the app) */
  readonly customRadio: Locator;

  /** The "From" month-year picker container (data-testid="fromDateCalender") */
  readonly fromPicker: Locator;

  /** The "To" month-year picker container (data-testid="toDateCalender") */
  readonly toPicker: Locator;

  /** The Apply button (may have class "disabled" when input is empty/invalid) */
  readonly applyButton: Locator;

  /**
   * Inline error message rendered beside the months input.
   * Text: "Please enter a value from 1 to N" - N is NOT a fixed constant (was
   * documented as 24) - live-confirmed it tracks the number of months in the
   * current (buggy calendar-year-to-date) default range, e.g. "1 to 8" in
   * August. Matched by pattern so this doesn't go stale as that range moves.
   */
  readonly errorMessage: Locator;

  /**
   * Inline error message rendered beside the weeks input.
   * Text: "Please enter a value from 1 to N" - N is NOT a fixed constant (was
   * documented as 104) - live-confirmed it tracks the same dynamic window in
   * weeks, e.g. "1 to 33". Matched by pattern so this doesn't go stale.
   */
  readonly errorMessageWeeks: Locator;

  /** The visible date range label, e.g. "Jan 2025 to Dec 2025" */
  readonly rangeLabel: Locator;

  constructor(page: Page) {
    this.page = page;
    // The date-calender-container div is only present once per page.
    this.container = page.locator('.date-calender-container');

    // The listitem that wraps the date range label + expanded panel.
    // Matched by the "Mmm YYYY to Mmm YYYY" pattern that appears in the label.
    this.listItem = page.locator('li').filter({ hasText: /\w{3} \d{4} to \w{3} \d{4}/ }).first();

    this.lastMonthsRadio = this.container.locator('input[name="dateType"]').first();
    this.lastMonthsInput = this.container.locator('input[name="months"]');
    // Weeks radio is the second radio (nth(1)) inside the container.
    this.lastWeeksRadio = this.container.locator('input[name="dateType"]').nth(1);
    this.lastWeeksInput = this.container.locator('input[name="weeks"]');
    // Custom radio is the third radio (nth(2)) inside the container - "Trailing 12 months"
    // was removed from the app (live-confirmed), so this shifted down from nth(3).
    this.customRadio = this.container.locator('input[name="dateType"]').nth(2);
    // Custom mode reveals two react-calendar month-year pickers (From / To).
    this.fromPicker = this.container.locator('[data-testid="fromDateCalender"]');
    this.toPicker = this.container.locator('[data-testid="toDateCalender"]');
    this.applyButton = this.container.locator('.button-footer .apply');
    this.errorMessage = this.container.getByText(/Please enter a value from 1 to \d+/);
    this.errorMessageWeeks = this.container.getByText(/Please enter a value from 1 to \d+/);
    this.rangeLabel = page.locator('li').filter({ hasText: /\w{3} \d{4} to \w{3} \d{4}/ })
      .locator('div')
      .filter({ hasText: /\w{3} \d{4} to \w{3} \d{4}/ })
      .first();
  }

  /**
   * Open (expand) the Date Range filter panel by clicking the listitem trigger.
   * If the panel is already open this is a no-op equivalent (the click would
   * close it, so callers should check first; in practice each scenario starts
   * fresh from the Home page so the panel is always collapsed).
   */
  async open(): Promise<void> {
    await this.listItem.click();
  }

  /**
   * Select the "Last N months" radio option.
   * In all fresh-page states this radio is already checked, but we click it
   * explicitly so the months text input becomes editable.
   */
  async selectLastMonthsRadio(): Promise<void> {
    await this.lastMonthsRadio.click();
  }

  /**
   * Fill the "Last N months" input with the given value (replaces existing).
   */
  async enterLastMonthsValue(value: string): Promise<void> {
    await this.lastMonthsInput.fill(value);
  }

  /**
   * Clear the "Last N months" input completely.
   * When the field is empty the Apply button becomes disabled (no error text).
   */
  async clearLastMonthsInput(): Promise<void> {
    await this.lastMonthsInput.fill('');
  }

  // ── Weeks radio / input ──────────────────────────────────────────────────────

  /**
   * Select the "Last N weeks" radio option (second radio in the container).
   * After clicking the weeks radio, the weeks text input becomes editable.
   */
  async selectLastWeeksRadio(): Promise<void> {
    await this.lastWeeksRadio.click();
  }

  /**
   * Fill the "Last N weeks" input with the given value (replaces existing content).
   */
  async enterLastWeeksValue(value: string): Promise<void> {
    await this.lastWeeksInput.fill(value);
  }

  /**
   * Clear the "Last N weeks" input completely.
   * Uses fill('') to wipe the current value in one atomic operation.
   * When the field is empty the Apply button becomes disabled (no error text).
   */
  async clearLastWeeksInput(): Promise<void> {
    await this.lastWeeksInput.fill('');
  }

  // ── Custom (month-year react-calendar pickers) ───────────────────────────────

  /**
   * Select the "Custom" radio (third radio in the container). This reveals the
   * "From" and "To" month-year pickers (each a react-calendar in year view).
   * Live-confirmed (2026-06-22): both pickers' `.value` divs render immediately
   * (e.g. "Jan 2025" / "Dec 2025"); each calendar popup is collapsed until its
   * field is clicked, and only one is open at a time.
   */
  async selectCustomRadio(): Promise<void> {
    await this.customRadio.click();
    await this.fromPicker.locator('.value').waitFor({ state: 'visible', timeout: 10000 });
  }

  /** Current "From" picker display value, e.g. "Jan 2025". */
  async getCustomFromValue(): Promise<string> {
    return (await this.fromPicker.locator('.value').first().textContent())?.trim() ?? '';
  }

  /** Current "To" picker display value, e.g. "Dec 2025". */
  async getCustomToValue(): Promise<string> {
    return (await this.toPicker.locator('.value').first().textContent())?.trim() ?? '';
  }

  /** Ensure the given picker's react-calendar popup is open (it toggles on field click). */
  private async ensureCalendarOpen(picker: Locator): Promise<void> {
    const calendar = picker.locator('.react-calendar');
    if (!(await calendar.isVisible().catch(() => false))) {
      await picker.locator('.filterContainer').click();
      await calendar.waitFor({ state: 'visible', timeout: 10000 });
    }
  }

  /**
   * Navigate the open react-calendar (year view) to the target year using the
   * ‹ (prev-button) / › (next-button) arrows. No-op when already on the target year.
   */
  private async navigateToYear(picker: Locator, targetYear: number): Promise<void> {
    const label = picker.locator('.react-calendar__navigation__label');
    for (let i = 0; i < 12; i++) {
      const current = parseInt(((await label.textContent()) ?? '').trim(), 10);
      if (current === targetYear) return;
      const arrow = current > targetYear
        ? picker.locator('.react-calendar__navigation__prev-button')
        : picker.locator('.react-calendar__navigation__next-button');
      await arrow.click();
    }
  }

  /**
   * Set a month-year value ("MMM YYYY", e.g. "Mar 2025") on the given picker:
   * open its calendar, navigate to the year, click the month tile, then wait for
   * the picker's display `.value` to reflect the chosen month.
   */
  private async setPickerDate(picker: Locator, testId: string, label: string): Promise<void> {
    const [monthAbbr, yearStr] = label.trim().split(/\s+/);
    await this.ensureCalendarOpen(picker);
    await this.navigateToYear(picker, parseInt(yearStr, 10));
    // react-calendar month tile is <button><abbr aria-label="November 2025">Nov</abbr></button>,
    // so the button's accessible name is the full "Month YYYY" — match by visible abbr text instead.
    await picker
      .locator('button.react-calendar__tile')
      .filter({ hasText: new RegExp(`^${monthAbbr}$`) })
      .first()
      .click();
    // The calendar closes and the .value updates to the selected month.
    await this.page.waitForFunction(
      ({ id, mon }: { id: string; mon: string }) =>
        document.querySelector(`[data-testid="${id}"] .value`)?.textContent?.trim().startsWith(mon) ?? false,
      { id: testId, mon: monthAbbr },
      { timeout: 10000 }
    );
  }

  /** Set the custom "From" (start) month, e.g. "Mar 2025". */
  async setCustomStartDate(label: string): Promise<void> {
    await this.setPickerDate(this.fromPicker, 'fromDateCalender', label);
  }

  /** Set the custom "To" (end) month, e.g. "Sep 2025". */
  async setCustomEndDate(label: string): Promise<void> {
    await this.setPickerDate(this.toPicker, 'toDateCalender', label);
  }

  /**
   * Returns true when each picker's currently selected month (matching its `.value`)
   * is visually highlighted in its react-calendar (active/range tile class).
   * Opens each calendar in turn to read the highlighted tile.
   */
  async areSelectedMonthsHighlighted(): Promise<boolean> {
    const checkPicker = async (picker: Locator): Promise<boolean> => {
      const value = (await picker.locator('.value').first().textContent())?.trim() ?? '';
      const monthAbbr = value.split(/\s+/)[0];
      if (!monthAbbr) return false;
      await this.ensureCalendarOpen(picker);
      const tile = picker.locator('button.react-calendar__tile', { hasText: new RegExp(`^${monthAbbr}$`) }).first();
      const cls = (await tile.getAttribute('class')) ?? '';
      return /--active|--hasActive|--range/.test(cls);
    };
    const fromOk = await checkPicker(this.fromPicker);
    const toOk = await checkPicker(this.toPicker);
    return fromOk && toOk;
  }

  /**
   * Inclusive month span between two "MMM YYYY" labels (e.g. "Jan 2025" → "Dec 2025" = 12).
   */
  static monthSpanInclusive(from: string, to: string): number {
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const parse = (s: string): number => {
      const [m, y] = s.trim().split(/\s+/);
      return parseInt(y, 10) * 12 + MONTHS.indexOf(m);
    };
    return parse(to) - parse(from) + 1;
  }

  // ── Shared apply / assertions ────────────────────────────────────────────────

  /**
   * Click the Apply button inside the Date Range filter.
   * Uses evaluate(el.click()) instead of a Playwright click — the Apply button
   * can sit below the 720 px viewport when an error message pushes the panel
   * taller than the sidebar area.  el.click() fires a proper bubbling DOM event
   * that React's synthetic-event system picks up, unlike dispatchEvent which
   * produces an un-trusted event that React may ignore.
   */
  async apply(): Promise<void> {
    await this.applyButton.evaluate((el: Element) => (el as HTMLElement).click());
  }

  /**
   * Returns true when the Apply button is disabled (empty-input state).
   */
  async isApplyDisabled(): Promise<boolean> {
    try {
      const cls = await this.applyButton.getAttribute('class');
      return (cls ?? '').includes('disabled');
    } catch {
      return false;
    }
  }

  /**
   * Returns true when either the months error message ("Please enter a value from 1 to 24")
   * or the weeks error message ("Please enter a value from 1 to 104") is visible.
   * Triggered by 0, negative, out-of-range, or non-numeric input for either mode.
   */
  async isErrorMessageVisible(): Promise<boolean> {
    try {
      // Check months error first, then weeks error. Use Promise.race to accept whichever
      // appears first within the timeout window.
      await Promise.race([
        this.errorMessage.waitFor({ state: 'visible', timeout: 5000 }),
        this.errorMessageWeeks.waitFor({ state: 'visible', timeout: 5000 }),
      ]);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns the current date range label text shown on the collapsed filter trigger.
   *
   * The collapsed-state label uses different formats depending on the active mode:
   *   - Months: "Jan 2025 to Dec 2025"  (Mmm YYYY)
   *   - Weeks:  "Nov-23-2025 to Dec-27-2025"  (Mmm-DD-YYYY)
   *
   * Reads the `.dropdown-selected-option` span inside the date range listitem.
   * Works whether the panel is open (container present in DOM) or closed.
   */
  async getRangeLabel(): Promise<string> {
    return this.page.evaluate(() => {
      // Strategy 1: find the li that contains the date-calender-container (panel open).
      const panel = document.querySelector('.date-calender-container');
      if (panel) {
        const li = panel.closest('li');
        if (li) {
          const span = li.querySelector('.dropdown-selected-option span.flex1');
          if (span) return (span as HTMLElement).textContent?.trim() ?? '';
          const opt = li.querySelector('.dropdown-selected-option');
          if (opt) return (opt as HTMLElement).textContent?.trim() ?? '';
        }
      }
      // Strategy 2: panel is closed — find the <li> that owns the date range trigger
      // by looking for the .dropdown-selected-option span whose text contains " to ".
      const allSpans = Array.from(document.querySelectorAll('li .dropdown-selected-option span.flex1'));
      const found = allSpans.find(s => / to /.test(s.textContent ?? ''));
      if (found) return (found as HTMLElement).textContent?.trim() ?? '';
      // Fallback: any .dropdown-selected-option that contains " to ".
      const allOpts = Array.from(document.querySelectorAll('li .dropdown-selected-option'));
      const opt2 = allOpts.find(o => / to /.test(o.textContent ?? ''));
      return opt2 ? (opt2 as HTMLElement).textContent?.trim() ?? '' : '';
    });
  }

  /**
   * Returns true when the filter panel is no longer open (Apply was accepted
   * and the panel collapsed), indicating the filter was applied.
   */
  async isPanelClosed(): Promise<boolean> {
    try {
      // The container becomes hidden after a successful Apply.
      await this.container.waitFor({ state: 'hidden', timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }
}
