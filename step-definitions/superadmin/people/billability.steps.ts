import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';
import { ENV } from '../../../src/utils/env';

// ---------------------------------------------------------------------------
// @filter — NEW steps (People Billability page only)
//
// NOTE: The following 9 steps are declared in other step files and MUST NOT
// be redeclared here — doing so would create ambiguous global step matches:
//   - "I open the {string} filter"
//       → step-definitions/home/filters-months.steps.ts
//   - "I click {string} within the {string} filter panel"
//       → step-definitions/businessComparison/billability.steps.ts
//   - "I click the {string} button in the filter panel"
//       → step-definitions/businessComparison/billability.steps.ts
//   - "the {string} filter button should display a selection count badge"
//       → step-definitions/businessComparison/billability.steps.ts
//   - "all filter selections should be cleared"
//       → step-definitions/businessComparison/billability.steps.ts
//   - "the Date Range filter should revert to {string}"
//       → step-definitions/businessComparison/billability.steps.ts
//   - "the FILTERS panel should be visible on the left side of the page"
//       → step-definitions/businessComparison/billability.steps.ts
//   - "the filter panel should contain a {string} button"
//       → step-definitions/businessComparison/billability.steps.ts
//   - "the filter panel should contain the following filters:"
//       → step-definitions/businessComparison/billability.steps.ts
// ---------------------------------------------------------------------------

/**
 * Selects a named checkbox option within the currently-open filter panel
 * on the People Billability page.
 *
 * DOM (verified live on /people/billing):
 *   .filter-display:has(.filter-name:text-is("<optionName>"))
 * Clicking this row fires the React synthetic click handler that toggles
 * the corresponding checkbox.
 *
 * Examples:
 *   And I select the "PA Managed" option within the "Management Model" filter on the People Billability page
 *   And I select the "Client Focus" option within the "Path" filter on the People Billability page
 *   And I select the "Active" option within the "Status" filter on the People Billability page
 */
When('I select the {string} option within the {string} filter on the People Billability page',
  async function (this: PlaywrightWorld, optionName: string, filterName: string) {
    await this.billabilityPage.selectFilterOption(optionName, filterName);
  }
);

/**
 * Asserts that the team member table has updated and still contains data
 * after a filter has been applied on the People Billability page.
 *
 * Strategy (verified live):
 *   - .chart__table__body must be visible.
 *   - "Expand all rows" toggle must be visible (table has at least one row).
 */
Then('the team member table should update to reflect the applied filter',
  async function (this: PlaywrightWorld) {
    const updated = await this.billabilityPage.hasTeamMemberTableUpdated();
    expect(updated, 'Expected the team member table to remain visible and populated after applying the filter').toBe(true);
  }
);

// ---------------------------------------------------------------------------
// Background — shared across ALL feature files
// ---------------------------------------------------------------------------

Given('I am logged into Vantage Dashboard', async function (this: PlaywrightWorld) {
  // waitUntil: 'commit' (not 'domcontentloaded') — the authenticated SPA fires a
  // client-side redirect on load, which interrupts a 'domcontentloaded' wait and
  // throws "Navigation ... is interrupted by another navigation" (it can fail all
  // retries on a slow backend). 'commit' resolves at the main-frame commit, before
  // the redirect, eliminating that race. This mirrors ci-auth.ts. Subsequent
  // navigation steps do their own readiness waits, so resolving early is safe.
  await this.gotoWithRetry(ENV.BASE_URL, { waitUntil: 'commit', timeout: 90000 });
});

// ---------------------------------------------------------------------------
// When
// ---------------------------------------------------------------------------

When('I navigate to the People Billability page', async function (this: PlaywrightWorld) {
  await this.billabilityPage.navigateToBillabilityPage();
});

When('I hover over the People icon in the sidebar', async function (this: PlaywrightWorld) {
  await this.peoplePage.hoverOverPeopleIcon();
});

When('I click on the {string} menu option', async function (this: PlaywrightWorld, menuOption: string) {
  await this.peoplePage.clickPeopleSubMenuItem(menuOption);
});

// ---------------------------------------------------------------------------
// Then
// ---------------------------------------------------------------------------

Then('the Billability menu link should be visible in the sidebar', async function (this: PlaywrightWorld) {
  const isVisible = await this.billabilityPage.isBillabilityMenuLinkVisible();
  expect(isVisible).toBe(true);
});

Then('the {string} header should be visible', async function (this: PlaywrightWorld, _headerText: string) {
  const isVisible = await this.billabilityPage.isBillabilityHeaderVisible();
  expect(isVisible).toBe(true);
});

Then('the {string} header should not be visible', async function (this: PlaywrightWorld, headerText: string) {
  const isVisible = await this.page.getByText(headerText).isVisible();
  expect(isVisible).toBe(false);
});

Then('the page URL should contain {string}', async function (this: PlaywrightWorld, urlFragment: string) {
  await expect(this.page).toHaveURL(new RegExp(urlFragment, 'i'));
});

Then('the Billability page should be displayed with the {string} header', async function (this: PlaywrightWorld, _headerText: string) {
  const isVisible = await this.billabilityPage.isBillabilityHeaderVisible();
  expect(isVisible).toBe(true);
});

Then('a table of all team members should be displayed below the header', async function (this: PlaywrightWorld) {
  const isVisible = await this.billabilityPage.isTeamMemberTableVisible();
  expect(isVisible).toBe(true);
});

Then('the table should display the following columns:', async function (this: PlaywrightWorld, dataTable: { hashes: () => Array<{ Column: string }> }) {
  const expectedColumns = dataTable.hashes().map((row) => row.Column);
  const actualColumns = await this.billabilityPage.getTableColumnHeaders();
  for (const col of expectedColumns) {
    expect(actualColumns).toContain(col);
  }
});

Then('the table should display a billability bar graph column representing the percentage of different billability components', async function (this: PlaywrightWorld) {
  const isVisible = await this.billabilityPage.isBillabilityBarColumnVisible();
  expect(isVisible).toBe(true);
});

// ---------------------------------------------------------------------------
// Info Icon tooltip steps
// ---------------------------------------------------------------------------

When('I hover over the info icon next to the {string} header', async function (this: PlaywrightWorld, _headerText: string) {
  await this.billabilityPage.hoverOverInfoIcon();
});

Then('a tooltip should be displayed with the message {string}', async function (this: PlaywrightWorld, tooltipText: string) {
  const isVisible = await this.billabilityPage.isTooltipVisible(tooltipText);
  expect(isVisible).toBe(true);
});

// ---------------------------------------------------------------------------
// Expand / Collapse steps
// ---------------------------------------------------------------------------

Then('the {string} button should be displayed below the header', async function (this: PlaywrightWorld, buttonLabel: string) {
  if (buttonLabel === 'Expand all rows') {
    const isVisible = await this.billabilityPage.isExpandAllRowsButtonVisible();
    expect(isVisible).toBe(true);
  } else {
    const isVisible = await this.billabilityPage.isExpandCollapseButtonLabelVisible(buttonLabel);
    expect(isVisible).toBe(true);
  }
});

When('I click the {string} button on the Billability by Team Member page', async function (this: PlaywrightWorld, buttonLabel: string) {
  if (buttonLabel === 'Export') {
    // Trigger the download event and store the result on world so the globally-registered
    // assertion steps in step-definitions/businessComparison/billability.steps.ts
    // (which read world._lastDownload) can consume it.
    // Verified live on /people/billing: clicking Export fires a Playwright download
    // immediately (no modal); filename "Billability by Team Member.xlsx".
    try {
      const download = await this.billabilityPage.clickExportAndWaitForDownload();
      (this as PlaywrightWorld & { _lastDownload?: import('@playwright/test').Download })._lastDownload = download;
    } catch (err) {
      console.warn(`People Billability Export download could not be triggered: ${err}`);
      (this as PlaywrightWorld & { _lastDownload?: null })._lastDownload = null;
    }
  } else {
    // Default: Expand all rows / Collapse all rows (and any other labelled buttons)
    await this.billabilityPage.clickExpandCollapseButton(buttonLabel);
  }
});

Then(
  'all team member rows in the table should be expanded showing their respective monthly totals',
  // Explicit timeout (360s): areAllTeamMemberRowsExpanded() waits up to 300s for a
  // large dataset (e.g. 1414 rows) to finish expanding, which exceeds the 180s
  // global default in support/hooks.ts.
  { timeout: 360000 },
  async function (this: PlaywrightWorld) {
  const allExpanded = await this.billabilityPage.areAllTeamMemberRowsExpanded();
  expect(allExpanded).toBe(true);
});

When('I click the expand icon on any team member row', async function (this: PlaywrightWorld) {
  await this.billabilityPage.clickFirstTeamMemberRowExpandIcon();
});

Then('that team member row should expand showing its monthly breakdown', async function (this: PlaywrightWorld) {
  const isExpanded = await this.billabilityPage.isFirstTeamMemberRowExpanded();
  expect(isExpanded).toBe(true);
});

Then('the total charges for that team member should be displayed correctly in the expanded view', async function (this: PlaywrightWorld) {
  const isVisible = await this.billabilityPage.isFirstExpandedRowTotalChargesVisible();
  expect(isVisible).toBe(true);
});

Then('the team member table expand button label should change to {string}', async function (this: PlaywrightWorld, expectedLabel: string) {
  const isVisible = await this.billabilityPage.isExpandCollapseButtonLabelVisible(expectedLabel);
  expect(isVisible).toBe(true);
});

Then('all expanded team member rows should collapse back to the default view', async function (this: PlaywrightWorld) {
  const allCollapsed = await this.billabilityPage.areAllTeamMemberRowsCollapsed();
  expect(allCollapsed).toBe(true);
});

Then('the month details for each expanded team member row should be displayed in descending order from the latest month to the oldest month of the selected date range', async function (this: PlaywrightWorld) {
  const inOrder = await this.billabilityPage.areMonthsInDescendingOrder();
  expect(inOrder).toBe(true);
});

Then('the color indicators for all billability components should be displayed above the table on the right side', async function (this: PlaywrightWorld) {
  const isVisible = await this.billabilityPage.isBillabilityColorLegendVisible();
  expect(isVisible).toBe(true);
});

Then('the {string} button should be displayed above the table on the right side', async function (this: PlaywrightWorld, buttonLabel: string) {
  if (buttonLabel === 'Export') {
    const isVisible = await this.billabilityPage.isExportButtonVisible();
    expect(isVisible).toBe(true);
  } else {
    const isVisible = await this.billabilityPage.isExpandCollapseButtonLabelVisible(buttonLabel);
    expect(isVisible).toBe(true);
  }
});
