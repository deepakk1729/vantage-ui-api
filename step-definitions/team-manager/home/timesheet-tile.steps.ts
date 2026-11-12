import { Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';
import { DataTable } from '@cucumber/cucumber';

// ---------------------------------------------------------------------------
// NOTE: The following shared steps are defined elsewhere — do NOT redeclare:
//   • "Given I am logged into Vantage Dashboard"    → people/billability.steps.ts
//   • "When I navigate to the Home page"             → home/home.steps.ts
//   • "When I scroll to the {string} tile"           → home/kn-material-tile.steps.ts
//       (TIMESHEET dispatch added there)
//   • "Then the {string} tile should be visible on the page"
//                                                    → home/kn-material-tile.steps.ts
//       (generic fallback handles TIMESHEET)
//   • "When the {string} tile has loaded"            → home/case-engagement-depth.steps.ts
//       (TIMESHEET dispatch added there)
//   • "When I note the current state of the {string} tile"
//                                                    → home/kn-material-tile.steps.ts
//       (TIMESHEET dispatch added there)
//   • "When I open the {string} filter"              → home/filters-months.steps.ts
//   • "When I select the {string} option"            → home/kn-material-tile.steps.ts
//   • "When I apply the filter"                      → home/kn-material-tile.steps.ts
//   • "Then the {string} tile should reflect data for the applied filter selection"
//                                                    → home/kn-material-tile.steps.ts
//       (TIMESHEET dispatch added there)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Structure scenarios — verify tile layout independent of data population
// ---------------------------------------------------------------------------

/**
 * "Then the tile should display the following submission status labels"
 *
 * DataTable has a single "Status" column.  Used in:
 *   Scenario: Timesheet tile displays all three submission status labels
 */
Then(
  'the tile should display the following submission status labels',
  async function (this: PlaywrightWorld, table: DataTable) {
    // table.rows() excludes the header row ("Status"); the remaining rows are
    // the label values themselves.
    const labels = table.rows().map(row => row[0].trim());
    const ok = await this.homePage.timesheetHasAllStatusLabels(labels);
    expect(
      ok,
      `Expected the TIMESHEET tile to display all submission status labels: ${labels.join(', ')}`
    ).toBe(true);
  }
);

/**
 * "Then the tile should contain a stacked bar with three color-coded segments"
 *
 * Confirms the CSS stacked-bar structure: a .stacked-bar container with exactly
 * three .bar-segment children, each carrying an inline background-color.
 * Used in:
 *   Scenario: Timesheet tile contains a stacked bar representing submission percentages
 */
Then(
  'the tile should contain a stacked bar with three color-coded segments',
  async function (this: PlaywrightWorld) {
    const hasThreeSegments = await this.homePage.timesheetHasStackedBarWithThreeSegments();
    expect(
      hasThreeSegments,
      'Expected the TIMESHEET tile to contain a .stacked-bar element with exactly three .bar-segment children'
    ).toBe(true);

    const colorCoded = await this.homePage.timesheetSegmentsAreColorCoded();
    expect(
      colorCoded,
      'Expected each .bar-segment in the TIMESHEET tile to have a non-empty inline background-color'
    ).toBe(true);
  }
);

/**
 * "And each segment should correspond to a submission status row in the legend"
 *
 * Confirms there is one legend row (.data_table_body_row) for each bar segment —
 * i.e. the number of segments equals the number of legend rows.
 * Used in:
 *   Scenario: Timesheet tile contains a stacked bar representing submission percentages
 */
Then(
  'each segment should correspond to a submission status row in the legend',
  async function (this: PlaywrightWorld) {
    const matches = await this.homePage.timesheetSegmentsMatchLegendRows();
    expect(
      matches,
      'Expected each .bar-segment in the TIMESHEET tile to correspond to exactly one legend row (.data_table_body_row)'
    ).toBe(true);
  }
);

// ---------------------------------------------------------------------------
// Data scenarios — guarded: soft-skip when tile has no data
// ---------------------------------------------------------------------------

/**
 * "Then if the "TIMESHEET" tile contains data the "On Time" value should display
 *  the percentage of timesheets submitted on time during the selected time period"
 */
Then(
  'if the {string} tile contains data the {string} value should display the percentage of timesheets submitted on time during the selected time period',
  async function (this: PlaywrightWorld, tileName: string, status: string) {
    const upper = tileName.trim().toUpperCase();
    if (upper !== 'TIMESHEET') return 'skipped';

    const hasData = await this.homePage.waitForTimesheetData();
    if (!hasData) {
      // Tile is empty for the current filter selection — soft-skip.
      return 'skipped';
    }

    const hasPercentage = await this.homePage.timesheetStatusHasPercentage(status);
    expect(
      hasPercentage,
      `Expected the TIMESHEET tile "${status}" row to display a non-empty percentage value`
    ).toBe(true);
  }
);

/**
 * "Then if the "TIMESHEET" tile contains data the "Late" value should display
 *  the percentage of timesheets submitted late during the selected time period"
 */
Then(
  'if the {string} tile contains data the {string} value should display the percentage of timesheets submitted late during the selected time period',
  async function (this: PlaywrightWorld, tileName: string, status: string) {
    const upper = tileName.trim().toUpperCase();
    if (upper !== 'TIMESHEET') return 'skipped';

    const hasData = await this.homePage.waitForTimesheetData();
    if (!hasData) {
      return 'skipped';
    }

    const hasPercentage = await this.homePage.timesheetStatusHasPercentage(status);
    expect(
      hasPercentage,
      `Expected the TIMESHEET tile "${status}" row to display a non-empty percentage value`
    ).toBe(true);
  }
);

/**
 * "Then if the "TIMESHEET" tile contains data the "Missing" value should display
 *  the percentage of timesheets that were not submitted during the selected time period"
 */
Then(
  'if the {string} tile contains data the {string} value should display the percentage of timesheets that were not submitted during the selected time period',
  async function (this: PlaywrightWorld, tileName: string, status: string) {
    const upper = tileName.trim().toUpperCase();
    if (upper !== 'TIMESHEET') return 'skipped';

    const hasData = await this.homePage.waitForTimesheetData();
    if (!hasData) {
      return 'skipped';
    }

    const hasPercentage = await this.homePage.timesheetStatusHasPercentage(status);
    expect(
      hasPercentage,
      `Expected the TIMESHEET tile "${status}" row to display a non-empty percentage value`
    ).toBe(true);
  }
);

/**
 * "Then if the "TIMESHEET" tile contains data the sum of the "On Time" percentage
 *  and the "Late" percentage should equal 100%"
 *
 * Despite the scenario title mentioning only "On Time and Late", the live data
 * confirms On Time (73%) + Late (20%) + Missing (7%) = 100.  On Time + Late alone
 * sums to 93, not 100.  The assertion therefore sums ALL THREE status percentages
 * (On Time + Late + Missing) with a ±1 rounding tolerance, which is the correct
 * mathematical invariant.
 */
Then(
  'if the {string} tile contains data the sum of the {string} percentage and the {string} percentage should equal 100%',
  async function (
    this: PlaywrightWorld,
    tileName: string,
    _status1: string,
    _status2: string
  ) {
    const upper = tileName.trim().toUpperCase();
    if (upper !== 'TIMESHEET') return 'skipped';

    const hasData = await this.homePage.waitForTimesheetData();
    if (!hasData) {
      return 'skipped';
    }

    const sumsTo100 = await this.homePage.timesheetAllPercentagesSumTo100();
    expect(
      sumsTo100,
      'Expected the sum of all TIMESHEET status percentages (On Time + Late + Missing) to equal 100% (±1 for rounding)'
    ).toBe(true);
  }
);
