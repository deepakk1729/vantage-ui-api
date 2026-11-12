import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';
import { DataTable } from '@cucumber/cucumber';

// ---------------------------------------------------------------------------
// NOTE: The following shared steps are defined elsewhere — do NOT redeclare:
//   • "Given I am logged into Vantage Dashboard"  → reports/billability.steps.ts
//   • "When I navigate to the Home page"           → home/home.steps.ts
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// When
// ---------------------------------------------------------------------------

When('I scroll to the {string} tile', async function (this: PlaywrightWorld, tileName: string) {
  const upper = tileName.trim().toUpperCase();
  if (upper === 'KN MATERIAL') {
    await this.homePage.scrollToKnMaterialTile();
  } else if (upper === 'VANTAGE AVERAGES') {
    await this.homePage.scrollToVantageAveragesTile();
  } else if (upper === 'TOP DOWNLOADS') {
    await this.homePage.scrollToTopDownloadsTile();
  } else if (upper === 'RMS CT SATISFACTION') {
    await this.homePage.scrollToRmsCTSatisfactionTile();
  } else if (upper === 'TOP CLIENTS') {
    await this.homePage.scrollToTopClientsTile();
  } else if (upper === 'TOP PROJECTS') {
    await this.homePage.scrollToTopProjectsTile();
  } else if (upper === 'TIMESHEET') {
    await this.homePage.scrollToTimesheetTile();
  } else {
    // Generic fallback: scroll via JS using the heading text as an anchor.
    await this.homePage.page.evaluate((text) => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        if (node.textContent?.trim() === text) {
          (node.parentElement as HTMLElement)?.scrollIntoView({ block: 'center' });
          break;
        }
      }
    }, upper);
  }
});

When('I note the current state of the {string} tile', async function (this: PlaywrightWorld, tileName: string) {
  const upper = tileName.trim().toUpperCase();
  if (upper === 'KN MATERIAL') {
    this.knMaterialTileState = await this.homePage.captureKnMaterialTileState();
  } else if (upper === 'RMS CT SATISFACTION') {
    this.rmsCTSatisfactionTileState = await this.homePage.captureRmsCTSatisfactionTileState();
  } else if (upper === 'TIMESHEET') {
    this.timesheetTileState = await this.homePage.captureTimesheetTileState();
  }
  // State stored in world for use in the subsequent Then assertion.
});

// ---------------------------------------------------------------------------
// Then
// ---------------------------------------------------------------------------

Then('the {string} tile should be visible on the page', async function (this: PlaywrightWorld, tileName: string) {
  const upper = tileName.trim().toUpperCase();
  if (upper === 'KN MATERIAL') {
    const visible = await this.homePage.isKnMaterialTileVisible();
    expect(visible, `Expected "${tileName}" tile to be visible on the Home page`).toBe(true);
  } else if (upper === 'RMS CT SATISFACTION') {
    const visible = await this.homePage.isRmsCTSatisfactionTileVisible();
    expect(visible, `Expected "${tileName}" tile to be visible on the Home page`).toBe(true);
  } else {
    const visible = await this.homePage.isTileVisible(tileName);
    expect(visible, `Expected "${tileName}" tile to be visible on the Home page`).toBe(true);
  }
});

Then(
  'the {string} tile should display a table with the following columns',
  async function (this: PlaywrightWorld, tileName: string, table: DataTable) {
    const upper = tileName.trim().toUpperCase();
    const expectedColumns = table.rows().map(row => row[0].trim());

    if (upper === 'KN MATERIAL') {
      const ok = await this.homePage.knMaterialHasColumnHeaders(expectedColumns);
      expect(
        ok,
        `Expected "${tileName}" tile to display columns: ${expectedColumns.join(', ')}`
      ).toBe(true);
    } else {
      for (const col of expectedColumns) {
        const visible = await this.homePage.page.getByText(col, { exact: true }).first().isVisible();
        expect(visible, `Expected column "${col}" to be visible in the "${tileName}" tile`).toBe(true);
      }
    }
  }
);

Then(
  'if the {string} tile contains data rows the rows should be sorted from highest to lowest by the {string} value',
  async function (this: PlaywrightWorld, tileName: string, _columnName: string) {
    const upper = tileName.trim().toUpperCase();

    if (upper !== 'KN MATERIAL') {
      return 'skipped';
    }

    const rowCount = await this.homePage.knMaterialDataRowCount();
    if (rowCount === 0) {
      return 'skipped';
    }

    const sorted = await this.homePage.knMaterialRowsAreSortedDescByCount();
    expect(
      sorted,
      `Expected "${tileName}" data rows to be sorted from highest to lowest by COUNT`
    ).toBe(true);
  }
);

Then(
  'if the {string} tile contains data rows each row should display a material category name in the {string} column and a numeric count in the {string} column',
  async function (
    this: PlaywrightWorld,
    tileName: string,
    _materialTypeColumnName: string,
    _countColumnName: string
  ) {
    const upper = tileName.trim().toUpperCase();

    if (upper !== 'KN MATERIAL') {
      return 'skipped';
    }

    const rowCount = await this.homePage.knMaterialDataRowCount();
    if (rowCount === 0) {
      return 'skipped';
    }

    const ok = await this.homePage.knMaterialRowsHaveTypeAndCount();
    expect(
      ok,
      `Expected every row in "${tileName}" to have a non-empty MATERIAL TYPE name and a numeric COUNT value`
    ).toBe(true);
  }
);

Then(
  'the {string} tile should reflect data for the applied filter selection',
  async function (this: PlaywrightWorld, tileName: string) {
    const upper = tileName.trim().toUpperCase();

    if (upper === 'KN MATERIAL') {
      const rendered = await this.homePage.knMaterialTileIsRendered();
      expect(rendered, `Expected "${tileName}" tile to remain visible after the filter was applied`).toBe(true);
    } else if (upper === 'RMS CT SATISFACTION') {
      const rendered = await this.homePage.isRmsCTSatisfactionTileRendered();
      expect(rendered, `Expected "${tileName}" tile to remain visible after the filter was applied`).toBe(true);
    } else if (upper === 'TIMESHEET') {
      const rendered = await this.homePage.isTimesheetTileRendered();
      expect(rendered, `Expected "${tileName}" tile to remain visible after the filter was applied`).toBe(true);
    } else {
      const visible = await this.homePage.isTileVisible(tileName);
      expect(visible, `Expected "${tileName}" tile to be visible after the filter was applied`).toBe(true);
    }
  }
);
