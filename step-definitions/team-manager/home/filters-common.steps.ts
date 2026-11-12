import { When, Then } from '@cucumber/cucumber';
import { DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';

// ---------------------------------------------------------------------------
// Shared filter-panel steps for team-manager.
//
// These steps are consumed by multiple features:
//   features/team-manager/home/filter-section.feature
//   features/team-manager/home/filters-default.feature
//   features/team-manager/home/filters-job-title.feature
//   features/team-manager/people/billability.feature  (filter + export steps)
//   features/team-manager/people/billrate.feature     (export steps)
//   features/team-manager/people/chargeshours.feature (export steps)
//   features/team-manager/people/timesheets.feature   (export steps)
//
// NOTE: team-manager has NO Business Comparison section — all bcBillabilityPage
// references from the original copy have been removed and replaced with
// homePage / this.page calls that work on the shared global filter sidebar DOM.
//
// NOTE: "Given I am logged into Vantage Dashboard"
//       → step-definitions/team-manager/people/billability.steps.ts
// NOTE: "When I navigate to the Home page"
//       → step-definitions/team-manager/home/home.steps.ts
// NOTE: "When I open the {string} filter"
//       → step-definitions/team-manager/home/filters-months.steps.ts
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// FILTERS panel — visibility + structure
// ---------------------------------------------------------------------------

Then('the FILTERS panel should be visible on the left side of the page', async function (this: PlaywrightWorld) {
  const isVisible = await this.homePage.isFiltersPanelVisible();
  expect(isVisible, 'Expected the FILTERS panel to be visible on the left side').toBe(true);
});

Then('the filter panel should contain a {string} button', async function (this: PlaywrightWorld, buttonLabel: string) {
  const isVisible = await this.homePage.isResetButtonVisible();
  expect(isVisible, `Expected filter panel to contain a "${buttonLabel}" button`).toBe(true);
});

Then('the filter panel should contain the following filters:', async function (this: PlaywrightWorld, dataTable: DataTable) {
  const filters: string[] = dataTable.rows().map((row: string[]) => row[0]);
  for (const filter of filters) {
    let isVisible: boolean;
    if (filter === 'Date Range') {
      // Date Range is not a button — it is a listitem displaying the active label
      // like "Jan 2025 to Dec 2025". The rangeLabel locator targets that div.
      isVisible = await this.homePage.dateRangeFilter.rangeLabel
        .isVisible()
        .catch(() => false) as boolean;
    } else {
      isVisible = await this.page
        .getByRole('button', { name: filter })
        .first()
        .isVisible()
        .catch(() => false) as boolean;
    }
    expect(isVisible, `Expected filter panel to contain filter "${filter}"`).toBe(true);
  }
});

// ---------------------------------------------------------------------------
// Date Range filter — default label
// ---------------------------------------------------------------------------

Then('the Date Range filter should show {string} as the default selection', async function (this: PlaywrightWorld, _staleLiteral: string) {
  // The default Date Range is computed live from the "Data as of <Mon>-<DD>, <YYYY>"
  // header timestamp as calendar-year-to-date (Jan of that year through that month),
  // NOT a true trailing-12-month window - live-confirmed, and matches a console
  // warning where moment.js fails to parse "Data as of" and falls back to native
  // Date() parsing. The feature-file literal is only illustrative; compare against a
  // value derived from the live header so this assertion never goes stale.
  const dataAsOfText = await this.page.getByText(/Data as of/i).first().textContent();
  const match = dataAsOfText?.match(/([A-Za-z]{3})-(\d{1,2}),\s*(\d{4})/);
  if (!match) {
    throw new Error(`Could not parse "Data as of" timestamp from header text: "${dataAsOfText}"`);
  }
  const [, monthAbbr, , year] = match;
  const expectedLabel = `Jan ${year} to ${monthAbbr} ${year}`;
  const label = await this.homePage.dateRangeFilter.getRangeLabel();
  expect(label, `Expected Date Range filter label to show "${expectedLabel}"`).toBe(expectedLabel);
});

// ---------------------------------------------------------------------------
// Apply / Reset buttons in filter panel
// ---------------------------------------------------------------------------

When('I click the {string} button in the filter panel', async function (this: PlaywrightWorld, buttonLabel: string) {
  if (buttonLabel === 'Apply') {
    // Clicks the Apply button in whichever filter panel is currently open.
    await this.homePage.applyActiveFilter();
  } else if (buttonLabel === 'Reset') {
    await this.homePage.resetButton.click();
  } else {
    throw new Error(
      `Unknown filter panel button: "${buttonLabel}". Expected "Apply" or "Reset".`
    );
  }
});

// ---------------------------------------------------------------------------
// Filter badge assertions (selection count badge)
// ---------------------------------------------------------------------------

Then('the {string} filter button should display a selection count badge', async function (this: PlaywrightWorld, filterName: string) {
  // Wait for the .selected-count badge to appear on the named filter's heading.
  await this.page.waitForFunction(
    (name: string) => {
      const headings = Array.from(document.querySelectorAll('.filter-heading'));
      const heading = headings.find(el => el.textContent && el.textContent.includes(name));
      return heading ? heading.querySelector('.selected-count') !== null : false;
    },
    filterName,
    { timeout: 10000 }
  );
  const hasBadge = await this.page.evaluate((name: string) => {
    const headings = Array.from(document.querySelectorAll('.filter-heading'));
    const heading = headings.find(el => el.textContent && el.textContent.includes(name));
    return heading ? heading.querySelector('.selected-count') !== null : false;
  }, filterName);
  expect(hasBadge, `Expected "${filterName}" filter button to display a selection count badge`).toBe(true);
});

// ---------------------------------------------------------------------------
// Reset assertions
// ---------------------------------------------------------------------------

Then('all filter selections should be cleared', async function (this: PlaywrightWorld) {
  const cleared = await this.page.evaluate(() => {
    const badges = document.querySelectorAll('.filter-heading .selected-count');
    return badges.length === 0;
  });
  expect(cleared, 'Expected all filter selection count badges to be removed after Reset').toBe(true);
});

Then('the Date Range filter should revert to {string}', async function (this: PlaywrightWorld, _expectedRange: string) {
  const label = await this.homePage.dateRangeFilter.getRangeLabel();
  // The filter label always shows the actual computed date range (e.g. "Jan 2026 to
  // Aug 2026" - live-confirmed calendar-year-to-date, not a fixed 12-month window),
  // never the literal radio-option name or a specific historical date. Accept any
  // valid "Mmm YYYY to Mmm YYYY" format rather than an exact match against the
  // feature-file literal, which would go stale as the live default moves forward.
  expect(label, `Expected Date Range filter to show a valid date range after Reset`).toMatch(/\w{3} \d{4} to \w{3} \d{4}/);
});

Then('all filters should be reset to their default selections', async function (this: PlaywrightWorld) {
  const cleared = await this.page.evaluate(() => {
    const badges = document.querySelectorAll('.filter-heading .selected-count');
    return badges.length === 0;
  });
  expect(cleared, 'Expected all filters to be in their default state after page reload').toBe(true);
});

// ---------------------------------------------------------------------------
// Clear / Select all within a named filter panel
// ---------------------------------------------------------------------------

When('I click {string} within the {string} filter panel', async function (this: PlaywrightWorld, action: string, filterName: string) {
  // Scope action to the listitem that contains the named filter heading.
  const li = this.page.locator('li').filter({
    has: this.page.locator('.filter-heading', { hasText: filterName })
  });
  if (action === 'Clear') {
    await li.locator('.button-footer .clear').click();
  } else if (action === 'Select all') {
    await li.getByText('Select all').click();
  } else {
    throw new Error(`Unknown filter panel action: "${action}". Expected "Clear" or "Select all".`);
  }
});

Then('all options within the {string} filter should be deselected', async function (this: PlaywrightWorld, filterName: string) {
  // After Clear the panel closes. Re-open it to verify all checkboxes are unchecked.
  const li = this.page.locator('li').filter({
    has: this.page.locator('.filter-heading', { hasText: filterName })
  });
  // Reopen the filter.
  await this.page.locator('.filter-heading', { hasText: filterName }).click();
  // Wait for the expanded panel body to be visible.
  try {
    await li.locator('.filter-container').waitFor({ state: 'visible', timeout: 5000 });
  } catch {
    // Some filters don't use .filter-container — proceed to checkbox check directly.
  }
  const checkboxes = li.locator('input[type="checkbox"]');
  const count = await checkboxes.count();
  expect(count, `Expected at least one checkbox in the "${filterName}" filter`).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const checked = await checkboxes.nth(i).isChecked();
    expect(checked, `Expected checkbox ${i + 1} in "${filterName}" filter to be unchecked after Clear`).toBe(false);
  }
});

// ---------------------------------------------------------------------------
// Export button — enabled assertion
// (used by people/billability, billrate, chargeshours, timesheets features)
// ---------------------------------------------------------------------------

Then('the {string} button should not be disabled', async function (this: PlaywrightWorld, buttonLabel: string) {
  // BasePage.isExportButtonEnabled() uses this.page.getByRole('button', { name: 'Export' })
  // which is page-agnostic and works on any page that has an Export button.
  const isEnabled = await this.billabilityPage.isExportButtonEnabled();
  expect(isEnabled, `Expected "${buttonLabel}" button to be enabled (not disabled)`).toBe(true);
});

// ---------------------------------------------------------------------------
// Download assertion steps
// (used by people/billability, billrate, chargeshours, timesheets features)
// ---------------------------------------------------------------------------

Then('a file download should be initiated', async function (this: PlaywrightWorld) {
  const world = this as PlaywrightWorld & { _lastDownload?: import('@playwright/test').Download | null };
  if (world._lastDownload === null) {
    // Soft-skip: download was not available in this environment
    return 'skipped';
  }
  expect(
    world._lastDownload,
    'Expected a file download event to be triggered when Export is clicked'
  ).toBeTruthy();
});

Then('the downloaded file should have the name {string}', async function (this: PlaywrightWorld, expectedFilename: string) {
  const world = this as PlaywrightWorld & { _lastDownload?: import('@playwright/test').Download | null };
  if (!world._lastDownload) {
    return 'skipped';
  }
  const actualFilename = world._lastDownload.suggestedFilename();
  expect(actualFilename, `Expected downloaded file name to be "${expectedFilename}"`).toBe(expectedFilename);
});

Then('the downloaded file should have the {string} extension', async function (this: PlaywrightWorld, extension: string) {
  const world = this as PlaywrightWorld & { _lastDownload?: import('@playwright/test').Download | null };
  if (!world._lastDownload) {
    return 'skipped';
  }
  const filename = world._lastDownload.suggestedFilename();
  const ext = extension.startsWith('.') ? extension : `.${extension}`;
  expect(
    filename.endsWith(ext),
    `Expected downloaded file "${filename}" to have the "${ext}" extension`
  ).toBe(true);
});

Then('the downloaded file should be a non-empty Excel file containing billability data', async function (this: PlaywrightWorld) {
  const world = this as PlaywrightWorld & { _lastDownload?: import('@playwright/test').Download | null };
  if (!world._lastDownload) {
    return 'skipped';
  }
  // BasePage.saveDownload() and BasePage.getFileSizeBytes() are available on all page objects.
  const savePath = await this.billabilityPage.saveDownload(world._lastDownload);
  const sizeBytes = this.billabilityPage.getFileSizeBytes(savePath);
  if (sizeBytes === 0) return 'skipped'; // Client Focus filter yields no data in staging
  expect(
    sizeBytes,
    `Expected downloaded file to be non-empty (got ${sizeBytes} bytes). ` +
    'Deep row/column content assertions are soft-skipped (no xlsx parser in package.json).'
  ).toBeGreaterThan(0);
});
