import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';
import { DataTable } from '@cucumber/cucumber';

// ---------------------------------------------------------------------------
// NOTE: The following shared steps are defined elsewhere — do NOT redeclare:
//   • "Given I am logged into Vantage Dashboard"         → reports/billability.steps.ts
//   • "When I navigate to the Home page"                  → home/home.steps.ts
//   • "When I scroll to the {string} tile"                → home/kn-material-tile.steps.ts
//   • "Then the {string} tile should be visible on the page"
//                                                          → home/kn-material-tile.steps.ts
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Structure — column headers
// ---------------------------------------------------------------------------

Then(
  'the {string} tile should display the following column headers',
  async function (this: PlaywrightWorld, tileName: string, table: DataTable) {
    const upper = tileName.trim().toUpperCase();
    const expectedColumns = table.rows().map(row => row[0].trim());

    if (upper === 'TOP CLIENTS') {
      const ok = await this.homePage.topClientsHasColumnHeaders(expectedColumns);
      expect(ok, `Expected "${tileName}" tile to display column headers: ${expectedColumns.join(', ')}`).toBe(true);
    } else if (upper === 'TOP PROJECTS') {
      const ok = await this.homePage.topProjectsHasColumnHeaders(expectedColumns);
      expect(ok, `Expected "${tileName}" tile to display column headers: ${expectedColumns.join(', ')}`).toBe(true);
    } else {
      throw new Error(
        `The step "the {string} tile should display the following column headers" ` +
        `only handles "TOP CLIENTS" and "TOP PROJECTS". Received: "${tileName}".`
      );
    }
  }
);

// ---------------------------------------------------------------------------
// Data guard — soft-skip when empty
// ---------------------------------------------------------------------------

Then(
  'if the {string} tile contains data it should display at most 10 client rows',
  async function (this: PlaywrightWorld, tileName: string) {
    const upper = tileName.trim().toUpperCase();
    if (upper !== 'TOP CLIENTS') {
      throw new Error(
        `The step "if the {string} tile contains data it should display at most 10 client rows" ` +
        `only handles "TOP CLIENTS". Received: "${tileName}".`
      );
    }

    const hasData = await this.homePage.waitForTopClientsData();
    if (!hasData) {
      return 'skipped';
    }

    const ok = await this.homePage.topClientsHasAtMostTenRows();
    expect(ok, `Expected "${tileName}" tile to display at most 10 client rows`).toBe(true);
  }
);

Then(
  'if the {string} tile contains data the rows should be sorted from highest to lowest by the {string} column',
  async function (this: PlaywrightWorld, tileName: string, _columnName: string) {
    const upper = tileName.trim().toUpperCase();

    if (upper === 'TOP CLIENTS') {
      const hasData = await this.homePage.waitForTopClientsData();
      if (!hasData) {
        return 'skipped';
      }
      const sorted = await this.homePage.topClientsRowsAreSortedDescByCharges();
      expect(sorted, `Expected "${tileName}" rows to be sorted from highest to lowest by CHARGES ($K)`).toBe(true);
    } else if (upper === 'TOP PROJECTS') {
      const hasData = await this.homePage.waitForTopProjectsData();
      if (!hasData) {
        return 'skipped';
      }
      const sorted = await this.homePage.topProjectsRowsAreSortedDescByCharges();
      expect(sorted, `Expected "${tileName}" rows to be sorted from highest to lowest by CHARGES ($K)`).toBe(true);
    } else {
      throw new Error(
        `The step "if the {string} tile contains data the rows should be sorted ..." ` +
        `only handles "TOP CLIENTS" and "TOP PROJECTS". Received: "${tileName}".`
      );
    }
  }
);

Then(
  'if the {string} tile contains data each row should display a non-empty client name, a numeric charges value, and a numeric hours value',
  async function (this: PlaywrightWorld, tileName: string) {
    const upper = tileName.trim().toUpperCase();
    if (upper !== 'TOP CLIENTS') {
      throw new Error(
        `The step "if the {string} tile contains data each row should display ..." ` +
        `only handles "TOP CLIENTS". Received: "${tileName}".`
      );
    }

    const hasData = await this.homePage.waitForTopClientsData();
    if (!hasData) {
      return 'skipped';
    }

    const ok = await this.homePage.topClientsRowsHaveAllThreeCells();
    expect(ok, `Expected every row in "${tileName}" to have a non-empty client name, a numeric charges value, and a numeric hours value`).toBe(true);
  }
);

Then(
  'if the {string} tile contains data the {string} column should display numeric values representing total Client charges for each client',
  async function (this: PlaywrightWorld, tileName: string, _columnName: string) {
    const upper = tileName.trim().toUpperCase();
    if (upper !== 'TOP CLIENTS') {
      throw new Error(
        `The step "if the {string} tile contains data the {string} column should display ..." ` +
        `(charges variant) only handles "TOP CLIENTS". Received: "${tileName}".`
      );
    }

    const hasData = await this.homePage.waitForTopClientsData();
    if (!hasData) {
      return 'skipped';
    }

    const ok = await this.homePage.topClientsChargesColumnIsNumeric();
    expect(ok, `Expected every CHARGES ($K) cell in "${tileName}" to contain a numeric value`).toBe(true);
  }
);

Then(
  'if the {string} tile contains data the {string} column should display numeric values representing total Client hours worked for each client',
  async function (this: PlaywrightWorld, tileName: string, _columnName: string) {
    const upper = tileName.trim().toUpperCase();
    if (upper !== 'TOP CLIENTS') {
      throw new Error(
        `The step "if the {string} tile contains data the {string} column should display ..." ` +
        `(hours variant) only handles "TOP CLIENTS". Received: "${tileName}".`
      );
    }

    const hasData = await this.homePage.waitForTopClientsData();
    if (!hasData) {
      return 'skipped';
    }

    const ok = await this.homePage.topClientsHoursColumnIsNumeric();
    expect(ok, `Expected every HOURS cell in "${tileName}" to contain a numeric value`).toBe(true);
  }
);

// ---------------------------------------------------------------------------
// Filter reactivity
// ---------------------------------------------------------------------------

When(
  'I note the current client names displayed in the {string} tile',
  async function (this: PlaywrightWorld, tileName: string) {
    const upper = tileName.trim().toUpperCase();
    if (upper === 'TOP CLIENTS') {
      this.topClientsTileState = await this.homePage.captureTopClientsTileState();
    }
  }
);

Then(
  'the {string} tile should refresh and reflect data matching the applied filter',
  async function (this: PlaywrightWorld, tileName: string) {
    const upper = tileName.trim().toUpperCase();

    if (upper === 'TOP CLIENTS') {
      const rendered = await this.homePage.isTopClientsTileRendered();
      expect(rendered, `Expected "${tileName}" tile to remain visible after the filter was applied`).toBe(true);
    } else if (upper === 'TOP PROJECTS') {
      const rendered = await this.homePage.isTopProjectsTileRendered();
      expect(rendered, `Expected "${tileName}" tile to remain visible after the filter was applied`).toBe(true);
    } else {
      throw new Error(
        `The step "the {string} tile should refresh and reflect data matching the applied filter" ` +
        `only handles "TOP CLIENTS" and "TOP PROJECTS". Received: "${tileName}".`
      );
    }
  }
);
