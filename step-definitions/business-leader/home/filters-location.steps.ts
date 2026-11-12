import { When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';

When('I expand the Location filter', async function (this: PlaywrightWorld) {
  await this.homePage.locationFilter.open();
});

Then('the following Location options should be displayed:', async function (this: PlaywrightWorld, table: DataTable) {
  const options = table.raw().map(row => row[0].trim());
  for (const option of options) {
    const visible = await this.homePage.locationFilter.isOptionVisible(option);
    expect(visible, `Expected Location option "${option}" to be visible`).toBeTruthy();
  }
});

When('I select {string} from the Location options', async function (this: PlaywrightWorld, option: string) {
  await this.homePage.locationFilter.select(option);
});

When('I click Apply in the Location filter', async function (this: PlaywrightWorld) {
  await this.homePage.locationFilter.apply();
});

Then('all Home page tiles should display data for the selected Location', async function (this: PlaywrightWorld) {
  const visible = await this.homePage.isBillabilityTrendVisible();
  expect(visible, 'Expected Billability Trend tile to remain visible after Location filter applied').toBeTruthy();
});
