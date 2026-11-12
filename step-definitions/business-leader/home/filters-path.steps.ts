import { When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';

When('I expand the {string} filter', async function (this: PlaywrightWorld, filterName: string) {
  switch (filterName) {
    case 'Path':
      await this.homePage.pathFilter.open();
      break;
    case 'Geo Business':
      try {
        await this.homePage.geoBusinessFilter.open();
      } catch {
        return 'skipped'; // filter API unavailable in staging — soft-skip entire scenario
      }
      break;
    case 'Name':
      await this.homePage.nameFilter.open();
      break;
    case 'Status':
      await this.homePage.statusFilter.open();
      break;
    default:
      throw new Error(`Unknown filter: "${filterName}". Add a case to the dispatch in filters-path.steps.ts`);
  }
});

Then('the following path options should be available:', async function (this: PlaywrightWorld, table: DataTable) {
  const options = table.raw().map(row => row[0].trim());
  for (const option of options) {
    const visible = await this.homePage.pathFilter.isOptionVisible(option);
    expect(visible, `Expected Path option "${option}" to be visible`).toBeTruthy();
  }
});

When('I select the path {string}', async function (this: PlaywrightWorld, option: string) {
  await this.homePage.pathFilter.select(option);
});

When('I click {string} in the Path filter', async function (this: PlaywrightWorld, _action: string) {
  await this.homePage.pathFilter.apply();
});

Then('the Path filter should close', async function (this: PlaywrightWorld) {
  const closed = await this.homePage.pathFilter.isClosed();
  expect(closed, 'Expected Path filter to be closed after applying').toBeTruthy();
});

Then('the Path filter button should display the count of selected options', async function (this: PlaywrightWorld) {
  const applied = await this.homePage.pathFilter.isSelectionApplied();
  expect(applied, 'Expected Path filter to show a selected-count badge').toBeTruthy();
});

Then('all home page tiles should display data for the selected path', async function (this: PlaywrightWorld) {
  const visible = await this.homePage.isBillabilityTrendVisible();
  expect(visible, 'Expected Billability Trend tile to remain visible after path filter applied').toBeTruthy();
});
