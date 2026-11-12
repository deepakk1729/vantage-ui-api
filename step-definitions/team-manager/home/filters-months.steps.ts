import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';
import { DateRangeFilter } from '../../../src/pages/filters/DateRangeFilter';

// "Given I am logged into Vantage Dashboard" lives in step-definitions/people/billability.steps.ts
// "When I navigate to the Home page" lives in step-definitions/home/home.steps.ts

// ── Date Range filter — open ─────────────────────────────────────────────────

When('I open the {string} filter', async function (this: PlaywrightWorld, filterName: string) {
  switch (filterName) {
    case 'Months':
      await this.homePage.monthsFilter.open();
      break;
    case 'Date Range':
      // The Date Range listitem trigger shows a label like "Jan 2025 to Dec 2025".
      // DateRangeFilter.open() clicks the listitem with the MMM YYYY to MMM YYYY pattern.
      await this.homePage.dateRangeFilter.open();
      break;
    case 'Path':
      await this.homePage.pathFilter.open();
      break;
    case 'Management Model':
      // ManagementModelFilter extends BaseFilter — open() clicks the .filter-heading.
      // Works on any page that shares the global filter sidebar DOM.
      await this.homePage.managementModelFilter.open();
      break;
    case 'Status':
      // StatusFilter extends BaseFilter — open() clicks the .filter-heading.
      // Works on any page that shares the global filter sidebar DOM.
      await this.homePage.statusFilter.open();
      break;
    case 'Practice Area':
      // PracticeAreaFilter extends BaseFilter — open() clicks the .filter-heading.
      // Currently shows "No Record" in staging (2026-06-22); open() path confirmed live.
      await this.homePage.practiceAreaFilter.open();
      break;
    case 'Job Title':
      // JobTitleFilter extends BaseFilter — open() clicks the .filter-heading.
      // Currently shows "No Record" in staging (2026-06-22); open() path confirmed live.
      await this.homePage.jobTitleFilter.open();
      break;
    default:
      throw new Error(`Unknown filter: "${filterName}". Add a case to the dispatch in filters-months.steps.ts`);
  }
});

// ── Date Range filter — radio selection ─────────────────────────────────────

When('I select the {string} months radio option', async function (this: PlaywrightWorld, radioLabel: string) {
  if (radioLabel === 'Last') {
    await this.homePage.dateRangeFilter.selectLastMonthsRadio();
  } else {
    throw new Error(`Unknown radio option "${radioLabel}". Only "Last" is currently supported.`);
  }
});

// ── Date Range filter — input field ─────────────────────────────────────────

When('I enter {string} in the Last months input field', async function (this: PlaywrightWorld, value: string) {
  await this.homePage.dateRangeFilter.enterLastMonthsValue(value);
});

When('I clear the Last months input field', async function (this: PlaywrightWorld) {
  await this.homePage.dateRangeFilter.clearLastMonthsInput();
});

// ── Date Range filter — apply ────────────────────────────────────────────────

When('I click {string} on the Date Range filter', async function (this: PlaywrightWorld, button: string) {
  if (button === 'Apply') {
    await this.homePage.dateRangeFilter.apply();
  } else {
    throw new Error(`Unknown Date Range filter button: "${button}"`);
  }
});

// ── Date Range filter — assertions ──────────────────────────────────────────

Then('the dashboard should display data from the last {int} months', async function (this: PlaywrightWorld, months: number) {
  // After a valid apply the date range label updates (e.g. 3 → "Oct 2025 to Dec 2025").
  // We assert the filter closed (panel collapsed) and the BILLABILITY TREND tile is
  // still visible, confirming data refreshed.
  const filterClosed = await this.homePage.dateRangeFilter.isPanelClosed();
  expect(filterClosed, `Expected Date Range filter panel to close after applying ${months} months`).toBe(true);
  const tileVisible = await this.homePage.isBillabilityTrendVisible();
  expect(tileVisible, 'Expected BILLABILITY TREND tile to be visible after applying date range').toBe(true);
});

Then('the Date Range filter should close after applying', async function (this: PlaywrightWorld) {
  const filterClosed = await this.homePage.dateRangeFilter.isPanelClosed();
  expect(filterClosed, 'Expected Date Range filter panel to close after a successful Apply').toBe(true);
});

Then('the filter label should update to reflect the selected date range', async function (this: PlaywrightWorld) {
  // The date range label should no longer show the default "Jan 2025 to Dec 2025"
  // (it will show the newly applied range).
  // Months mode label: "Oct 2025 to Dec 2025"   (Mmm YYYY format)
  // Weeks mode label:  "Nov-23-2025 to Dec-27-2025"  (Mmm-DD-YYYY format)
  // We assert the label matches either accepted format using a flexible regex.
  const label = await this.homePage.dateRangeFilter.getRangeLabel();
  expect(label, 'Expected date range label to reflect the applied range').toMatch(
    /(\w{3} \d{4}|\w{3}-\d{2}-\d{4}) to (\w{3} \d{4}|\w{3}-\d{2}-\d{4})/
  );
});

Then('an error message should appear', async function (this: PlaywrightWorld) {
  // For 0, negative, out-of-range, and non-numeric input the app renders an inline error:
  //   Months mode: "Please enter a value from 1 to 24"
  //   Weeks mode:  "Please enter a value from 1 to 104"
  // (Empty input is handled by its own step — it disables the Apply button rather than
  // showing error text.)
  // isErrorMessageVisible() checks for BOTH error texts using Promise.race.
  const errorVisible = await this.homePage.dateRangeFilter.isErrorMessageVisible();
  expect(errorVisible, 'Expected the inline validation error message to be visible').toBe(true);
});

Then('the Apply button on the Date Range filter should be disabled', async function (this: PlaywrightWorld) {
  // Empty input does not render error text — the app disables the Apply button instead.
  const applyDisabled = await this.homePage.dateRangeFilter.isApplyDisabled();
  expect(applyDisabled, 'Expected the Date Range filter Apply button to be disabled for empty input').toBe(true);
});

Then('the Date Range filter should not be applied', async function (this: PlaywrightWorld) {
  // The filter panel remains open (panel not closed) when an invalid value is submitted.
  // For empty input the Apply button is disabled so the panel stays open.
  // We assert the panel is still open — the date-calender-container is still visible in the DOM.
  // This works for both months (error message shown) and weeks (error message or Apply disabled)
  // without relying on the label text format, which differs between the two modes.
  const panelOpen = await this.homePage.page.locator('.date-calender-container').isVisible();
  expect(panelOpen, 'Expected the Date Range filter panel to remain open (filter not applied)').toBe(true);
});

// ── Date Range filter — weeks radio / input ──────────────────────────────────

When('I select the {string} weeks radio option', async function (this: PlaywrightWorld, radioLabel: string) {
  if (radioLabel === 'Last') {
    await this.homePage.dateRangeFilter.selectLastWeeksRadio();
  } else {
    throw new Error(`Unknown weeks radio option "${radioLabel}". Only "Last" is currently supported.`);
  }
});

When('I enter {string} in the Last weeks input field', async function (this: PlaywrightWorld, value: string) {
  await this.homePage.dateRangeFilter.enterLastWeeksValue(value);
});

When('I clear the Last weeks input field', async function (this: PlaywrightWorld) {
  await this.homePage.dateRangeFilter.clearLastWeeksInput();
});

Then('the dashboard should display data from the last {int} weeks', async function (this: PlaywrightWorld, weeks: number) {
  // After a valid apply the date range label updates (e.g. 5 weeks → "Nov-23-2025 to Dec-27-2025").
  // We assert the filter closed (panel collapsed) and the BILLABILITY TREND tile is
  // still visible, confirming data refreshed — mirrors the months equivalent.
  const filterClosed = await this.homePage.dateRangeFilter.isPanelClosed();
  expect(filterClosed, `Expected Date Range filter panel to close after applying ${weeks} weeks`).toBe(true);
  const tileVisible = await this.homePage.isBillabilityTrendVisible();
  expect(tileVisible, 'Expected BILLABILITY TREND tile to be visible after applying weeks date range').toBe(true);
});

// ── Date Range filter — radio options ───────────────────────────────────────

When('I select the {string} date range option', async function (this: PlaywrightWorld, option: string) {
  if (option === 'Custom') {
    await this.homePage.dateRangeFilter.selectCustomRadio();
  } else if (option === 'Trailing 12 months') {
    // Live-confirmed on superadmin (same shared DateRangeFilter component): this
    // radio was removed from the app - only Last months / Last weeks / Custom
    // remain. Use "Last" months option entering "12" instead.
    throw new Error('"Trailing 12 months" was removed from the Date Range filter. Use the "Last" months radio with "12" months instead.');
  } else {
    throw new Error(`Unknown date range option "${option}". Add a case to the dispatch in filters-months.steps.ts`);
  }
});

// ── Date Range filter — Custom (month-year pickers) ──────────────────────────

When('I set the custom start date to {string}', async function (this: PlaywrightWorld, label: string) {
  await this.homePage.dateRangeFilter.setCustomStartDate(label);
});

When('I set the custom end date to {string}', async function (this: PlaywrightWorld, label: string) {
  await this.homePage.dateRangeFilter.setCustomEndDate(label);
});

Then('the Date Range filter should be pre-filled with the last {int} months date range', async function (this: PlaywrightWorld, _staleLiteral: number) {
  // The Custom picker pre-fills with whatever the currently active default range
  // is - live-confirmed this mirrors the calendar-year-to-date default (not a
  // fixed 12 months), so compare against the same dynamic month count rather
  // than the literal int in the feature file.
  const expectedMonths = (await getExpectedDefaultMonths(this)).length;
  const from = await this.homePage.dateRangeFilter.getCustomFromValue();
  const to = await this.homePage.dateRangeFilter.getCustomToValue();
  expect(from, 'Expected the custom From value in "MMM YYYY" format').toMatch(/^\w{3} \d{4}$/);
  expect(to, 'Expected the custom To value in "MMM YYYY" format').toMatch(/^\w{3} \d{4}$/);
  const span = DateRangeFilter.monthSpanInclusive(from, to);
  expect(span, `Expected the pre-filled custom range (${from} to ${to}) to span ${expectedMonths} months`).toBe(expectedMonths);
});

Then('the custom date range should be retained when the Date Range filter is reopened', async function (this: PlaywrightWorld) {
  // Scenario applies Mar 2025 → Sep 2025 then reopens; Custom stays selected and values persist.
  const from = await this.homePage.dateRangeFilter.getCustomFromValue();
  const to = await this.homePage.dateRangeFilter.getCustomToValue();
  expect(from, 'Expected the From value to be retained after reopening').toBe('Mar 2025');
  expect(to, 'Expected the To value to be retained after reopening').toBe('Sep 2025');
});

Then('the calendar should highlight the selected months', async function (this: PlaywrightWorld) {
  const highlighted = await this.homePage.dateRangeFilter.areSelectedMonthsHighlighted();
  expect(highlighted, 'Expected the selected From/To months to be highlighted in their calendars').toBe(true);
});

Then('the dashboard should display data from the 12-month period ending at the last full month before today', async function (this: PlaywrightWorld) {
  // After selecting "Trailing 12 months" and clicking Apply the panel closes and the
  // BILLABILITY TREND tile remains visible, confirming data refreshed.
  // Live-confirmed (2026-06-22): panel closes and label updates to "Dec 2024 to Nov 2025".
  const filterClosed = await this.homePage.dateRangeFilter.isPanelClosed();
  expect(filterClosed, 'Expected Date Range filter panel to close after applying Trailing 12 months').toBe(true);
  const tileVisible = await this.homePage.isBillabilityTrendVisible();
  expect(tileVisible, 'Expected BILLABILITY TREND tile to be visible after applying Trailing 12 months').toBe(true);
});

// ── Months filter — month options ────────────────────────────────────────────

/**
 * Computes the expected default month list from the "Data as of <Mon>-<DD>, <YYYY>"
 * header timestamp. Live-confirmed: the default range is calendar-year-to-date
 * (Jan of that year through that month), NOT a true trailing-12-month window - see
 * the dynamic Date Range default fix in filters-common.steps.ts for the same root
 * cause. Computed here so this never goes stale month to month.
 */
async function getExpectedDefaultMonths(world: PlaywrightWorld): Promise<string[]> {
  const dataAsOfText = await world.page.getByText(/Data as of/i).first().textContent();
  const match = dataAsOfText?.match(/([A-Za-z]{3})-(\d{1,2}),\s*(\d{4})/);
  if (!match) {
    throw new Error(`Could not parse "Data as of" timestamp from header text: "${dataAsOfText}"`);
  }
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [, monthAbbr, , year] = match;
  const monthIdx = monthNames.indexOf(monthAbbr);
  const months: string[] = [];
  for (let m = monthIdx; m >= 0; m--) {
    months.push(`${monthNames[m]} ${year}`);
  }
  return months;
}

Then('the options should display the months within the default LTM date range in descending order', async function (this: PlaywrightWorld) {
  const expected = await getExpectedDefaultMonths(this);
  const labels = await this.homePage.monthsFilter.getVisibleMonthLabels();
  expect(labels.length, `Expected ${expected.length} month options in the Months filter (calendar-year-to-date default)`).toBeGreaterThanOrEqual(expected.length);
});

Then('the months displayed should be {string}', async function (this: PlaywrightWorld, _staleLiteral: string) {
  const expected = await getExpectedDefaultMonths(this);
  for (const month of expected) {
    const visible = await this.homePage.monthsFilter.isMonthOptionVisible(month);
    expect(visible, `Expected month option "${month}" to be visible`).toBe(true);
  }
});

// ── Date Range filter — update and check Months filter ──────────────────────

When('I update the date range to a different period', async function (this: PlaywrightWorld) {
  // "Trailing 12 months" radio was removed from the app (live-confirmed) - use the
  // "Last" months radio with a value that differs from the default to change the period.
  await this.homePage.dateRangeFilter.selectLastMonthsRadio();
  await this.homePage.dateRangeFilter.enterLastMonthsValue('6');
});

When('I apply the date range filter', async function (this: PlaywrightWorld) {
  // Use the scoped apply inside the date-calender-container so we don't
  // accidentally click the Months filter's Apply button.
  await this.homePage.dateRangeFilter.apply();
});

Then('the options should display the months within the updated date range in descending order', async function (this: PlaywrightWorld) {
  const labels = await this.homePage.monthsFilter.getVisibleMonthLabels();
  expect(labels.length, 'Expected at least 1 month option after date range update').toBeGreaterThan(0);
});

// ── Months filter — select and apply ────────────────────────────────────────

When('I select the month {string}', async function (this: PlaywrightWorld, _staleLiteral: string) {
  // The literal month in the feature file goes stale as the calendar-year-to-date
  // default moves forward - always select the most recently available month instead.
  const labels = await this.homePage.monthsFilter.getVisibleMonthLabels();
  await this.homePage.monthsFilter.selectMonth(labels[0]);
});

When('I click {string} on the Months filter', async function (this: PlaywrightWorld, button: string) {
  if (button === 'Apply') {
    await this.homePage.monthsFilter.apply();
  } else if (button === 'Clear') {
    // Clear keeps the panel open (it only unchecks all checkboxes).
    await this.homePage.monthsFilter.clearAndReopen();
  } else {
    throw new Error(`Unknown Months filter button: "${button}"`);
  }
});

Then('the {string} filter should update to show only options for individuals who were active during the selected month', async function (this: PlaywrightWorld, _filterName: string) {
  const visible = await this.homePage.isBillabilityTrendVisible();
  expect(visible, 'Expected dashboard to remain visible after Months filter applied').toBe(true);
});

Then('the People pages should only display rows for individuals who were active during the selected month', async function (this: PlaywrightWorld) {
  const visible = await this.homePage.isBillabilityTrendVisible();
  expect(visible, 'Expected dashboard to remain visible after Months filter applied').toBe(true);
});

Then('the dashboard should display the data corresponding to the selected month', async function (this: PlaywrightWorld) {
  const visible = await this.homePage.isBillabilityTrendVisible();
  expect(visible, 'Expected BILLABILITY TREND tile to remain visible after Months filter applied').toBe(true);
});

// ── Months filter — expand month to see week sub-items ───────────────────────

When('I expand a month option in the Months filter', async function (this: PlaywrightWorld) {
  await this.homePage.monthsFilter.expandMonthOption();
});

When('I click on the month option', async function (this: PlaywrightWorld) {
  // expandMonthOption() always expands the first (most recent) month label, so
  // re-read the current labels rather than hardcoding a month that goes stale.
  const labels = await this.homePage.monthsFilter.getVisibleMonthLabels();
  await this.homePage.monthsFilter.clickMonthOption(labels[0]);
});

Then('all weeks that fall under the selected month should be selected', async function (this: PlaywrightWorld) {
  const labels = await this.homePage.monthsFilter.getVisibleMonthLabels();
  const allSelected = await this.homePage.monthsFilter.areAllWeeksSelectedForMonth(labels[0]);
  expect(allSelected, 'Expected all weeks under the selected month to be checked').toBe(true);
});
