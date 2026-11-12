import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';
import { DataTable } from '@cucumber/cucumber';

// ---------------------------------------------------------------------------
// NOTE: The following shared steps are defined elsewhere — do NOT redeclare:
//   • "Given I am logged into Vantage Dashboard"                 → reports/billability.steps.ts
//   • "When I navigate to the Home page"                          → home/home.steps.ts
//   • "When I scroll to the {string} tile"                        → home/kn-material-tile.steps.ts
//   • "Then the {string} tile should be visible on the page"      → home/kn-material-tile.steps.ts
//   • "Then the utilization category dropdown in the {string} tile should show {string} as the selected option"
//                                                                  → home/vantage-averages-tile.steps.ts
//   • "When I open the utilization category dropdown in the {string} tile"
//                                                                  → home/vantage-averages-tile.steps.ts
//   • "Then the {string} tile should display the following column headers"
//                                                                  → home/top-clients-tile.steps.ts
//   • "Then if the {string} tile contains data the rows should be sorted from highest to lowest by the {string} column"
//                                                                  → home/top-clients-tile.steps.ts
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Dropdown options (no-colon variant)
// ---------------------------------------------------------------------------

Then(
  'the dropdown should contain the following options',
  async function (this: PlaywrightWorld, table: DataTable) {
    const expectedOptions = table.rows().map(row => row[0].trim());
    const actualOptions = await this.homePage.getTopProjectsDropdownOptions();
    for (const option of expectedOptions) {
      expect(
        actualOptions,
        `Expected TOP PROJECTS dropdown to contain option "${option}" but actual options are: ${actualOptions.join(', ')}`
      ).toContain(option);
    }
  }
);

// ---------------------------------------------------------------------------
// Select a specific option (scoped to a named tile)
// ---------------------------------------------------------------------------

When(
  'I select {string} from the utilization category dropdown in the {string} tile',
  async function (this: PlaywrightWorld, option: string, tileName: string) {
    const upper = tileName.trim().toUpperCase();
    if (upper === 'TOP PROJECTS') {
      await this.homePage.selectTopProjectsOption(option);
    } else {
      throw new Error(
        `The step "I select {string} from the utilization category dropdown in the {string} tile" ` +
        `only handles "TOP PROJECTS". Received: "${tileName}".`
      );
    }
  }
);

// ---------------------------------------------------------------------------
// Tile data refresh after utilization category change
// ---------------------------------------------------------------------------

Then(
  'the {string} tile should display project data for the {string} utilization category',
  async function (this: PlaywrightWorld, tileName: string, category: string) {
    const upper = tileName.trim().toUpperCase();
    if (upper !== 'TOP PROJECTS') {
      throw new Error(
        `The step "the {string} tile should display project data for the {string} utilization category" ` +
        `only handles "TOP PROJECTS". Received: "${tileName}".`
      );
    }

    const rendered = await this.homePage.isTopProjectsTileRendered();
    expect(rendered, `Expected "${tileName}" tile to remain visible after selecting utilization category "${category}"`).toBe(true);

    const label = await this.homePage.getTopProjectsDropdownLabel();
    expect(label, `Expected the TOP PROJECTS dropdown button to show "${category}" but got "${label}"`).toBe(category);
  }
);

// ---------------------------------------------------------------------------
// Data guard — at most 10 project rows
// ---------------------------------------------------------------------------

Then(
  'if the {string} tile contains data it should display at most 10 project rows',
  async function (this: PlaywrightWorld, tileName: string) {
    const upper = tileName.trim().toUpperCase();
    if (upper !== 'TOP PROJECTS') {
      throw new Error(
        `The step "if the {string} tile contains data it should display at most 10 project rows" ` +
        `only handles "TOP PROJECTS". Received: "${tileName}".`
      );
    }

    const hasData = await this.homePage.waitForTopProjectsData();
    if (!hasData) {
      return 'skipped';
    }

    const ok = await this.homePage.topProjectsHasAtMostTenRows();
    expect(ok, `Expected "${tileName}" tile to display at most 10 project rows`).toBe(true);
  }
);

// ---------------------------------------------------------------------------
// Data guard — each row has project name, charges, hours
// ---------------------------------------------------------------------------

Then(
  'if the {string} tile contains data each row should display a non-empty project name, a numeric charges value, and a numeric hours value',
  async function (this: PlaywrightWorld, tileName: string) {
    const upper = tileName.trim().toUpperCase();
    if (upper !== 'TOP PROJECTS') {
      throw new Error(
        `The step "if the {string} tile contains data each row should display a non-empty project name ..." ` +
        `only handles "TOP PROJECTS". Received: "${tileName}".`
      );
    }

    const hasData = await this.homePage.waitForTopProjectsData();
    if (!hasData) {
      return 'skipped';
    }

    const ok = await this.homePage.topProjectsRowsHaveAllThreeCells();
    expect(ok, `Expected every row in "${tileName}" to have a non-empty project name, a numeric charges value, and a numeric hours value`).toBe(true);
  }
);

// ---------------------------------------------------------------------------
// Data guard — CHARGES ($K) column is numeric
// ---------------------------------------------------------------------------

Then(
  'if the {string} tile contains data the {string} column should display numeric values representing total Client charges for each project',
  async function (this: PlaywrightWorld, tileName: string, _columnName: string) {
    const upper = tileName.trim().toUpperCase();
    if (upper !== 'TOP PROJECTS') {
      throw new Error(
        `The step "if the {string} tile contains data the {string} column should display ..." ` +
        `(charges/project variant) only handles "TOP PROJECTS". Received: "${tileName}".`
      );
    }

    const hasData = await this.homePage.waitForTopProjectsData();
    if (!hasData) {
      return 'skipped';
    }

    const ok = await this.homePage.topProjectsChargesColumnIsNumeric();
    expect(ok, `Expected every CHARGES ($K) cell in "${tileName}" to contain a numeric value`).toBe(true);
  }
);

// ---------------------------------------------------------------------------
// Data guard — HOURS column is numeric
// ---------------------------------------------------------------------------

Then(
  'if the {string} tile contains data the {string} column should display numeric values representing total Client hours worked for each project',
  async function (this: PlaywrightWorld, tileName: string, _columnName: string) {
    const upper = tileName.trim().toUpperCase();
    if (upper !== 'TOP PROJECTS') {
      throw new Error(
        `The step "if the {string} tile contains data the {string} column should display ..." ` +
        `(hours/project variant) only handles "TOP PROJECTS". Received: "${tileName}".`
      );
    }

    const hasData = await this.homePage.waitForTopProjectsData();
    if (!hasData) {
      return 'skipped';
    }

    const ok = await this.homePage.topProjectsHoursColumnIsNumeric();
    expect(ok, `Expected every HOURS cell in "${tileName}" to contain a numeric value`).toBe(true);
  }
);

// ---------------------------------------------------------------------------
// Filter reactivity — capture current project names
// ---------------------------------------------------------------------------

When(
  'I note the current project names displayed in the {string} tile',
  async function (this: PlaywrightWorld, tileName: string) {
    const upper = tileName.trim().toUpperCase();
    if (upper === 'TOP PROJECTS') {
      this.topProjectsTileState = await this.homePage.captureTopProjectsTileState();
    }
  }
);
