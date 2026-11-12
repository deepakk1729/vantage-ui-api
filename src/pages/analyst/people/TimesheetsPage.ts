import { Locator, Page, Download } from '@playwright/test';
import { BasePage } from '../../base/BasePage';

/**
 * Analyst Reports > Timesheets page.
 *
 * Shows "Submission Status by Timesheet" — personal single-row view.
 * URL: /people/timesheet
 * Toggle: Submission Status | Hours Submitted
 * Table: 1 row (Abraham, Ruth), weekly date column headers
 * Status cells: Missing (red) / On Time (green)
 */
export class TimesheetsPage extends BasePage {

  readonly timesheetsMenuLink: Locator;
  readonly header: Locator;
  readonly exportButton: Locator;
  readonly submissionStatusButton: Locator;
  readonly hoursSubmittedButton: Locator;

  // Alias for compatibility with world.ts (typed as topic-manager's TimesheetsPage)
  readonly timesheetsHeader: Locator;

  constructor(page: Page) {
    super(page);

    this.timesheetsMenuLink = this.peopleSubmenuLink('Timesheets');

    // Analyst sees "Submission Status by Timesheet" header
    // The standard .kt-table-container heading may also just say "Timesheets" —
    // try both so we match either rendering.
    this.header = page.getByText(/Submission Status by Timesheet|Timesheets/i).first();
    this.timesheetsHeader = this.header; // alias

    this.exportButton = page.getByRole('button', { name: /Export/i });
    this.submissionStatusButton = page.getByRole('button', { name: 'Submission Status' });
    this.hoursSubmittedButton = page.getByRole('button', { name: 'Hours Submitted' });
  }

  async navigateToTimesheetsPage(): Promise<void> {
    await this.timesheetsMenuLink.waitFor({ state: 'visible', timeout: 30000 });
    await this.timesheetsMenuLink.click();
    // Wait for URL to contain the timesheets route
    await this.page.waitForURL(/\/people\/timesheet/, { timeout: 30000 });
    // Wait for the header to confirm the page has loaded
    await this.header.waitFor({ state: 'visible', timeout: 30000 });
  }

  async isTimesheetsHeaderVisible(): Promise<boolean> {
    try {
      // Try the specific analyst header first
      const specificHeader = this.page.getByText('Submission Status by Timesheet').first();
      await specificHeader.waitFor({ state: 'visible', timeout: 10000 });
      return true;
    } catch {
      // Fallback to generic header
      try {
        await this.header.waitFor({ state: 'visible', timeout: 5000 });
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * Returns true when the personal timesheet submission status row is visible.
   * For analyst, the table has exactly 1 row (their own data).
   * The row body sentinel is: tr.timeSheet-table__inner__main__body
   */
  async isPersonalTimesheetRowVisible(): Promise<boolean> {
    try {
      await this.page.waitForURL(/\/people\/timesheet/, { timeout: 30000 });
      // Wait for the timesheet table body row to appear
      await this.page.waitForSelector(
        'tr.timeSheet-table__inner__main__body',
        { timeout: 60000 }
      );
      const rowCount = await this.page.locator('tr.timeSheet-table__inner__main__body').count();
      return rowCount >= 1;
    } catch {
      return false;
    }
  }

  /**
   * Returns true when the weekly date column headers are visible.
   * Headers look like "Dec-27 2025", "Dec-20 2025", etc.
   */
  async isSubmissionStatusWeeklyHeadersVisible(): Promise<boolean> {
    try {
      await this.page.waitForSelector(
        'tr.timeSheet-table__inner__main__header td.heading',
        { timeout: 60000 }
      );
      return true;
    } catch {
      return false;
    }
  }

  async isExportButtonVisible(): Promise<boolean> {
    try {
      await this.exportButton.first().waitFor({ state: 'visible', timeout: 15000 });
      return true;
    } catch {
      return false;
    }
  }

  async isTimesheetsPageDisplayed(): Promise<boolean> {
    try {
      await this.page.waitForURL(/\/people\/timesheet/, { timeout: 30000 });
      await this.header.waitFor({ state: 'visible', timeout: 30000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns all unique status values present in the Submission Status table.
   * For analyst (single row), possible values: "On Time", "Late", "Missing".
   */
  async getSubmissionStatusColumnValues(): Promise<string[]> {
    await this.page.waitForURL(/\/people\/timesheet/, { timeout: 60000 });
    await this.page.waitForSelector(
      'tr.timeSheet-table__inner__main__body td.value',
      { timeout: 90000 }
    );
    return this.page.evaluate(() => {
      const cells = Array.from(
        document.querySelectorAll('tr.timeSheet-table__inner__main__body td.value')
      );
      const found = new Set<string>();
      for (const cell of cells) {
        if (cell.classList.contains('on_time')) found.add('On Time');
        else if (cell.classList.contains('Late')) found.add('Late');
        else if (cell.classList.contains('Missing')) found.add('Missing');
      }
      return Array.from(found);
    });
  }

  // ---------------------------------------------------------------------------
  // Export methods
  // ---------------------------------------------------------------------------

  async clickExportAndWaitForDownload(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent('download', { timeout: 60000 }),
      this.exportButton.first().click(),
    ]);
    return download;
  }
}
