import { When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';

When('I expand the Management Model filter', async function (this: PlaywrightWorld) {
  await this.homePage.managementModelFilter.open();
});

Then('the following Management Model options should be displayed:', async function (this: PlaywrightWorld, table: DataTable) {
  const options = table.raw().map(row => row[0].trim());
  for (const option of options) {
    const visible = await this.homePage.managementModelFilter.isOptionVisible(option);
    expect(visible, `Expected Management Model option "${option}" to be visible`).toBeTruthy();
  }
});

When('I select {string} from the Management Model options', async function (this: PlaywrightWorld, option: string) {
  await this.homePage.managementModelFilter.select(option);
});

When('I click Apply', async function (this: PlaywrightWorld) {
  await this.homePage.managementModelFilter.apply();
});

Then('all Home page tiles should display data for the selected Management Model', async function (this: PlaywrightWorld) {
  const visible = await this.homePage.isBillabilityTrendVisible();
  expect(visible, 'Expected Billability Trend tile to remain visible after Management Model filter applied').toBeTruthy();
});

Then('all Home page tiles should display data for the selected Management Models', async function (this: PlaywrightWorld) {
  const visible = await this.homePage.isBillabilityTrendVisible();
  expect(visible, 'Expected Billability Trend tile to remain visible after Management Models filter applied').toBeTruthy();
});
