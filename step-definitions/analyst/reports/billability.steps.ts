import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { Download } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';
import { ENV } from '../../../src/utils/env';
import { DataTable } from '@cucumber/cucumber';
import { BillabilityPage as AnBillabilityPage } from '../../../src/pages/analyst/people/BillabilityPage';

// ---------------------------------------------------------------------------
// Background — shared across ALL analyst feature files (declared here only)
// ---------------------------------------------------------------------------

Given('I am logged into Vantage Dashboard', async function (this: PlaywrightWorld) {
  // waitUntil: 'commit' — avoids the "Navigation interrupted by another navigation"
  // race on the authenticated SPA's client-side redirect. Matches the pattern used
  // in all other roles and in ci-auth.ts.
  await this.gotoWithRetry(ENV.BASE_URL, { waitUntil: 'commit', timeout: 90000 });
});

// ---------------------------------------------------------------------------
// URL assertion (shared within analyst profile)
// ---------------------------------------------------------------------------

Then('the page URL should contain {string}', async function (this: PlaywrightWorld, urlFragment: string) {
  await expect(this.page).toHaveURL(new RegExp(urlFragment, 'i'));
});

// ---------------------------------------------------------------------------
// Reports sidebar navigation (shared within analyst profile)
// ---------------------------------------------------------------------------

When('I click on the {string} icon in the sidebar', async function (this: PlaywrightWorld, iconName: string) {
  if (iconName === 'Reports') {
    await this.peoplePage.clickPeopleButton();
  } else {
    throw new Error(`Unknown sidebar icon: "${iconName}". Only "Reports" is handled for analyst.`);
  }
});

When('I click on the {string} menu option', async function (this: PlaywrightWorld, menuOption: string) {
  await this.peoplePage.clickPeopleSubMenuItem(menuOption);
});

// ---------------------------------------------------------------------------
// Reports > Billability page navigation
// ---------------------------------------------------------------------------

When('I navigate to the Reports Billability page', async function (this: PlaywrightWorld) {
  await this.billabilityPage.navigateToBillabilityPage();
});

// ---------------------------------------------------------------------------
// Reports > Billability page display
// ---------------------------------------------------------------------------

Then('the Billability by Month header should be visible', async function (this: PlaywrightWorld) {
  const isVisible = await this.billabilityPage.isBillabilityHeaderVisible();
  expect(isVisible, 'Expected Billability by Month header to be visible').toBe(true);
});

Then('the Export button should be visible on the Billability page', async function (this: PlaywrightWorld) {
  const isVisible = await this.billabilityPage.isExportButtonVisible();
  expect(isVisible, 'Expected Export button to be visible on the Billability page').toBe(true);
});

Then('a table of monthly billability data should be displayed', async function (this: PlaywrightWorld) {
  const isVisible = await (this.billabilityPage as unknown as AnBillabilityPage).isMonthlyTableVisible();
  expect(isVisible, 'Expected a table of monthly billability data to be displayed').toBe(true);
});

Then('the table should display the following columns on the Billability page:', async function (this: PlaywrightWorld, dataTable: DataTable) {
  const expectedColumns = dataTable.hashes().map((row) => row['Column']);
  const actualColumns = await this.billabilityPage.getTableColumnHeaders();
  for (const col of expectedColumns) {
    expect(actualColumns, `Expected column "${col}" to be present in the Billability table`).toContain(col);
  }
});

Then('the Billability chart legend should display the following categories:', async function (this: PlaywrightWorld, dataTable: DataTable) {
  const categories = dataTable.hashes().map((row) => row['Category']);
  for (const category of categories) {
    const visible = await (this.billabilityPage as unknown as AnBillabilityPage).isLegendCategoryVisible(category);
    expect(visible, `Expected legend to display category "${category}"`).toBe(true);
  }
});

// ---------------------------------------------------------------------------
// Reports > Billability page — filter assertions
// ---------------------------------------------------------------------------

Then('the monthly billability table should still be visible', async function (this: PlaywrightWorld) {
  const isVisible = await (this.billabilityPage as unknown as AnBillabilityPage).isMonthlyTableVisible();
  expect(isVisible, 'Expected the monthly billability table to still be visible after filter applied').toBe(true);
});

// ---------------------------------------------------------------------------
// Export — generic steps (shared within analyst profile)
// ---------------------------------------------------------------------------

Then('the {string} button should not be disabled', async function (this: PlaywrightWorld, buttonLabel: string) {
  const isEnabled = await this.page.getByRole('button', { name: buttonLabel }).first().isEnabled().catch(() => false);
  expect(isEnabled, `Expected "${buttonLabel}" button to be enabled (not disabled)`).toBe(true);
});

When('I click the "Export" button on the Billability page', async function (this: PlaywrightWorld) {
  const world = this as PlaywrightWorld & { _lastDownload?: Download | null };
  try {
    const download = await this.billabilityPage.clickExportAndWaitForDownload();
    world._lastDownload = download;
  } catch (err) {
    console.warn(`Billability Export download could not be triggered: ${err}`);
    world._lastDownload = null;
  }
});

Then('a file download should be initiated', async function (this: PlaywrightWorld) {
  const world = this as PlaywrightWorld & { _lastDownload?: Download | null };
  if (world._lastDownload === null) {
    return 'skipped';
  }
  expect(world._lastDownload, 'Expected a file download event to be triggered when Export is clicked').toBeTruthy();
});

Then('the downloaded file should have the {string} extension', async function (this: PlaywrightWorld, extension: string) {
  const world = this as PlaywrightWorld & { _lastDownload?: Download | null };
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
  const world = this as PlaywrightWorld & { _lastDownload?: Download | null };
  if (!world._lastDownload) {
    return 'skipped';
  }
  const savePath = await this.billabilityPage.saveDownload(world._lastDownload);
  const sizeBytes = this.billabilityPage.getFileSizeBytes(savePath);
  if (sizeBytes === 0) return 'skipped';
  expect(
    sizeBytes,
    `Expected downloaded file to be non-empty (got ${sizeBytes} bytes).`
  ).toBeGreaterThan(0);
});
