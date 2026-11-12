import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';

When('I select a user from the Name filter collection list', async function (this: PlaywrightWorld) {
  await this.homePage.nameFilter.selectFirstUser();
});

When('I click {string} in the Name filter', async function (this: PlaywrightWorld, _action: string) {
  await this.homePage.nameFilter.apply();
});

Then('the Name filter should close', async function (this: PlaywrightWorld) {
  const closed = await this.homePage.nameFilter.isClosed();
  expect(closed, 'Expected Name filter to be closed after applying').toBeTruthy();
});

Then('all home page tiles should display data for the selected user', async function (this: PlaywrightWorld) {
  const visible = await this.homePage.isBillabilityTrendVisible();
  expect(visible, 'Expected Billability Trend tile to remain visible after Name filter applied').toBeTruthy();
});

When('I type a partial name into the Name filter search bar', async function (this: PlaywrightWorld) {
  await this.homePage.nameFilter.typeInSearchBar('a');
});

Then('the Name filter collection list should filter results based on each letter typed', async function (this: PlaywrightWorld) {
  const filtered = await this.homePage.nameFilter.isCollectionFilteredByText('a');
  expect(filtered, 'Expected Name filter collection list to show results matching typed text').toBeTruthy();
});
