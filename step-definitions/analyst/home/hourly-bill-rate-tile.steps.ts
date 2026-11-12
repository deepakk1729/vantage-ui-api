import { Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';
import { HomePage as AnHomePage } from '../../../src/pages/analyst/home/HomePage';

// NOTE: "Given I am logged into Vantage Dashboard" → reports/billability.steps.ts
// NOTE: "When I navigate to the Home page"          → home/home.steps.ts

Then('the Hourly Bill Rate tile should be visible on the Home page', async function (this: PlaywrightWorld) {
  const visible = await (this.homePage as unknown as AnHomePage).isHourlyBillRateTileVisible();
  expect(visible, 'Expected the Hourly Bill Rate tile to be visible on the Home page').toBe(true);
});

Then('the Hourly Bill Rate tile should display a dollar value in USD', async function (this: PlaywrightWorld) {
  const value = await (this.homePage as unknown as AnHomePage).getHourlyBillRateValue();
  expect(value, 'Expected the Hourly Bill Rate tile to display a USD dollar value').toMatch(/\$[\d,]+/);
});
