import { Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';

// NOTE: "Given I am logged into Vantage Dashboard" lives in step-definitions/analyst/reports/billability.steps.ts
// NOTE: "When I navigate to the Home page" lives in step-definitions/analyst/home/home.steps.ts

Then(
  'the following tiles should be visible:',
  async function (this: PlaywrightWorld, dataTable: DataTable) {
    const tileNames: string[] = dataTable.rows().map((row: string[]) => row[0]);
    for (const tileName of tileNames) {
      const visible = await this.homePage.isTileVisible(tileName);
      expect(visible, `Expected tile "${tileName}" to be visible`).toBe(true);
    }
  }
);

Then(
  'the {string} tile should display months within the default LTM date range',
  async function (this: PlaywrightWorld, tileName: string) {
    const visible = await this.homePage.tileShowsMonthsInLastTwelveMonths(tileName);
    expect(visible, `Expected tile "${tileName}" to display months within the LTM date range`).toBe(true);
  }
);

Then(
  'the {string} tile should reflect the default utilization category {string}',
  async function (this: PlaywrightWorld, tileName: string, category: string) {
    const reflects = await this.homePage.tileReflectsUtilizationCategory(tileName, category);
    expect(reflects, `Expected tile "${tileName}" to reflect utilization category "${category}"`).toBe(true);
  }
);

Then(
  'the sidebar should display the following page options:',
  async function (this: PlaywrightWorld, dataTable: DataTable) {
    const options: string[] = dataTable.rows().map((row: string[]) => row[0]);
    for (const option of options) {
      const visible = await this.homePage.isPageOptionVisible(option);
      expect(visible, `Expected sidebar option "${option}" to be visible`).toBe(true);
    }
  }
);

Then(
  'the filters panel should be visible on the left side of the page',
  async function (this: PlaywrightWorld) {
    const visible = await this.homePage.isFiltersPanelVisible();
    expect(visible, 'Expected the FILTERS panel to be visible').toBe(true);
  }
);

Then(
  'the filters panel should appear below the page navigation options',
  async function (this: PlaywrightWorld) {
    const result = await this.homePage.isFiltersPanelBelowPageOptions();
    expect(result, 'Expected the filters panel to appear below page navigation options').toBe(true);
  }
);
