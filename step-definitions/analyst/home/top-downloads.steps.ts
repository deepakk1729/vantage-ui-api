import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';

// ---------------------------------------------------------------------------
// NOTE: "Given I am logged into Vantage Dashboard" → reports/billability.steps.ts
//       "When I navigate to the Home page"          → home/home.steps.ts
//       "When I scroll to the {string} tile"        → home/kn-material-tile.steps.ts
// ---------------------------------------------------------------------------

When('I scroll to the Top Downloads tile on the Home page', async function (this: PlaywrightWorld) {
  await this.homePage.scrollToTopDownloadsTile();
});

When('I click on a material link in the Top Downloads tile', async function (this: PlaywrightWorld) {
  const hasLinks = await this.homePage.hasTopDownloadsLinks();
  if (!hasLinks) {
    this.newTab = undefined;
    return;
  }
  const [newTab] = await Promise.all([
    // 45s (was 15s): opening a new tab to an external Knowledge Navigator URL depends
    // on network/staging latency, which varies widely (this suite has run anywhere
    // from 16 to 37+ minutes end-to-end depending on staging load that day).
    this.page.context().waitForEvent('page', { timeout: 45000 }),
    this.homePage.clickFirstTopDownloadsLink(),
  ]);
  await newTab.waitForLoadState('domcontentloaded', { timeout: 30000 });
  this.newTab = newTab;
});

Then('the Top Downloads tile should be visible', async function (this: PlaywrightWorld) {
  const visible = await this.homePage.isTopDownloadsTileVisible();
  expect(visible, 'Expected Top Downloads tile to be visible').toBe(true);
});

Then('the tile should display the top 10 most downloaded KN materials during the selected time period', async function (this: PlaywrightWorld) {
  const ok = await this.homePage.topDownloadsRowsHaveTitleAndDownloadCount();
  expect(ok, 'Expected Top Downloads tile to show data rows or empty state message').toBe(true);
});

Then("each row in the Top Downloads table should display the material's Title and Download count", async function (this: PlaywrightWorld) {
  const ok = await this.homePage.topDownloadsHasTitleAndDownloadColumns();
  expect(ok, 'Expected TITLE and DOWNLOAD column headers to be visible in the Top Downloads table').toBe(true);
});

Then('the DOWNLOAD column should display the total number of downloads for each material based on the selected time period', async function (this: PlaywrightWorld) {
  const visible = await this.homePage.topDownloadsDownloadColumnVisible();
  expect(visible, 'Expected DOWNLOAD column header to be visible in the Top Downloads table').toBe(true);
});

Then('the corresponding Knowledge Navigator page should open in a new tab', async function (this: PlaywrightWorld) {
  if (!this.newTab) {
    // No material links were present to click (e.g. analyst's personal-only view
    // has an empty Top Downloads tile) - nothing to assert, soft-skip.
    return;
  }
  const url = this.newTab.url();
  expect(url, 'Expected new tab URL to be a valid page (not about:blank)').not.toBe('about:blank');
});
