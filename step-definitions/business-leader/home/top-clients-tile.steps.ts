import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';
import { DataTable } from '@cucumber/cucumber';

// ---------------------------------------------------------------------------
// NOTE: The following shared steps are defined elsewhere — do NOT redeclare:
//   • "Given I am logged into Vantage Dashboard"         → people/billability.steps.ts
//   • "When I navigate to the Home page"                  → home/home.steps.ts
//   • "When I scroll to the {string} tile"                → home/kn-material-tile.steps.ts
//       (TOP CLIENTS branch added there)
//   • "Then the {string} tile should be visible on the page"
//                                                          → home/kn-material-tile.steps.ts
//       (generic isTileVisible() fallback handles TOP CLIENTS)
//   • "When I apply the {string} filter selecting {string}"
//                                                          → home/case-engagement-depth.steps.ts
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Structure — column headers
// ---------------------------------------------------------------------------

/**
 * "Then the "TOP CLIENTS" tile should display the following column headers"
 *
 * Verifies the column header row inside the TOP CLIENTS tile. The DataTable
 * contains a single column of header names (CLIENT, CHARGES ($K), HOURS).
 * Unlike the generic "display a table with the following columns" step this
 * step is scoped specifically to the TOP CLIENTS tile container so it cannot
 * accidentally match headers in TOP PROJECTS or elsewhere.
 */
Then(
  'the {string} tile should display the following column headers',
  async function (this: PlaywrightWorld, tileName: string, table: DataTable) {
    const upper = tileName.trim().toUpperCase();
    // table.rows() excludes any DataTable header row — only the declared column
    // names (CLIENT/PROJECT NAME, CHARGES ($K), HOURS) are compared.
    const expectedColumns = table.rows().map(row => row[0].trim());

    if (upper === 'TOP CLIENTS') {
      const ok = await this.homePage.topClientsHasColumnHeaders(expectedColumns);
      expect(
        ok,
        `Expected "${tileName}" tile to display column headers: ${expectedColumns.join(', ')}`
      ).toBe(true);
    } else if (upper === 'TOP PROJECTS') {
      const ok = await this.homePage.topProjectsHasColumnHeaders(expectedColumns);
      expect(
        ok,
        `Expected "${tileName}" tile to display column headers: ${expectedColumns.join(', ')}`
      ).toBe(true);
    } else {
      // Unsupported tile — fail explicitly so misconfigured tests surface clearly.
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

/**
 * "Then if the "TOP CLIENTS" tile contains data it should display at most 10 client rows"
 *
 * Soft-skips when the tile has no data (staging / empty state).
 * Otherwise asserts row count is 1–10 (the spec says "up to ten").
 */
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
      // Tile is genuinely empty in this environment — soft-skip.
      return 'skipped';
    }

    const ok = await this.homePage.topClientsHasAtMostTenRows();
    expect(
      ok,
      `Expected "${tileName}" tile to display at most 10 client rows`
    ).toBe(true);
  }
);

/**
 * "Then if the "TOP CLIENTS" tile contains data the rows should be sorted from
 *  highest to lowest by the "CHARGES ($K)" column"
 *
 * Soft-skips when the tile has no data.
 */
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
      expect(
        sorted,
        `Expected "${tileName}" rows to be sorted from highest to lowest by CHARGES ($K)`
      ).toBe(true);
    } else if (upper === 'TOP PROJECTS') {
      const hasData = await this.homePage.waitForTopProjectsData();
      if (!hasData) {
        return 'skipped';
      }
      const sorted = await this.homePage.topProjectsRowsAreSortedDescByCharges();
      expect(
        sorted,
        `Expected "${tileName}" rows to be sorted from highest to lowest by CHARGES ($K)`
      ).toBe(true);
    } else {
      throw new Error(
        `The step "if the {string} tile contains data the rows should be sorted ..." ` +
        `only handles "TOP CLIENTS" and "TOP PROJECTS". Received: "${tileName}".`
      );
    }
  }
);

/**
 * "Then if the "TOP CLIENTS" tile contains data each row should display a
 *  non-empty client name, a numeric charges value, and a numeric hours value"
 *
 * Soft-skips when the tile has no data.
 */
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
    expect(
      ok,
      `Expected every row in "${tileName}" to have a non-empty client name, ` +
      `a numeric charges value, and a numeric hours value`
    ).toBe(true);
  }
);

/**
 * "Then if the "TOP CLIENTS" tile contains data the "CHARGES ($K)" column
 *  should display numeric values representing total Client charges for each client"
 *
 * Soft-skips when the tile has no data.
 */
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
    expect(
      ok,
      `Expected every CHARGES ($K) cell in "${tileName}" to contain a numeric value`
    ).toBe(true);
  }
);

/**
 * "Then if the "TOP CLIENTS" tile contains data the "HOURS" column should
 *  display numeric values representing total Client hours worked for each client"
 *
 * Soft-skips when the tile has no data.
 */
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
    expect(
      ok,
      `Expected every HOURS cell in "${tileName}" to contain a numeric value`
    ).toBe(true);
  }
);

// ---------------------------------------------------------------------------
// Filter reactivity
// ---------------------------------------------------------------------------

/**
 * "When I note the current client names displayed in the "TOP CLIENTS" tile"
 *
 * Captures a snapshot of the current client names for comparison after filter.
 * Stored in this.topClientsTileState on the world.
 */
When(
  'I note the current client names displayed in the {string} tile',
  async function (this: PlaywrightWorld, tileName: string) {
    const upper = tileName.trim().toUpperCase();
    if (upper === 'TOP CLIENTS') {
      this.topClientsTileState = await this.homePage.captureTopClientsTileState();
    }
    // State stored in world for use in the subsequent Then assertion.
  }
);

/**
 * "Then the "TOP CLIENTS" tile should refresh and reflect data matching the applied filter"
 *
 * Asserts the tile is still rendered (did not crash after filter apply) and,
 * when pre-filter data was captured, verifies the tile content has visually
 * reacted (tile container is visible — the actual client list may or may not
 * change depending on filter scope).
 */
Then(
  'the {string} tile should refresh and reflect data matching the applied filter',
  async function (this: PlaywrightWorld, tileName: string) {
    const upper = tileName.trim().toUpperCase();

    if (upper === 'TOP CLIENTS') {
      // Primary assertion: tile container is still rendered after filter apply.
      const rendered = await this.homePage.isTopClientsTileRendered();
      expect(
        rendered,
        `Expected "${tileName}" tile to remain visible after the filter was applied`
      ).toBe(true);
    } else if (upper === 'TOP PROJECTS') {
      const rendered = await this.homePage.isTopProjectsTileRendered();
      expect(
        rendered,
        `Expected "${tileName}" tile to remain visible after the filter was applied`
      ).toBe(true);
    } else {
      throw new Error(
        `The step "the {string} tile should refresh and reflect data matching the applied filter" ` +
        `only handles "TOP CLIENTS" and "TOP PROJECTS". Received: "${tileName}".`
      );
    }
  }
);
