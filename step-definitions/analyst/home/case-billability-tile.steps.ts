import { Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';
import { HomePage as AnHomePage } from '../../../src/pages/analyst/home/HomePage';

// NOTE: "Given I am logged into Vantage Dashboard" → reports/billability.steps.ts
// NOTE: "When I navigate to the Home page"          → home/home.steps.ts

Then('the Case Billability tile should be visible on the Home page', async function (this: PlaywrightWorld) {
  const visible = await (this.homePage as unknown as AnHomePage).isCaseBillabilityTileVisible();
  expect(visible, 'Expected the Case Billability tile to be visible on the Home page').toBe(true);
});

Then('the Case Billability tile should display a percentage value', async function (this: PlaywrightWorld) {
  const value = await (this.homePage as unknown as AnHomePage).getCaseBillabilityValue();
  expect(value, 'Expected the Case Billability tile to display a percentage value').toMatch(/\d+%?/);
});
