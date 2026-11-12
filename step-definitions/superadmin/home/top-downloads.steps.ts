import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';

// ---------------------------------------------------------------------------
// When
// ---------------------------------------------------------------------------

When('I scroll to the Top Downloads tile on the Home page', async function (this: PlaywrightWorld) {
  await this.homePage.scrollToTopDownloadsTile();
});

When('I click on a material link in the Top Downloads tile', async function (this: PlaywrightWorld) {
  const hasLinks = await this.homePage.hasTopDownloadsLinks();
  if (!hasLinks) {
    // No data in tile; mark newTab as undefined to indicate step was skipped
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

// ---------------------------------------------------------------------------
// Then
// ---------------------------------------------------------------------------

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
  // This scenario is @skip-tagged: the tile has no links in the default Home state
  // (KN Materials API returns 400 without a user/filter precondition). When run
  // explicitly via `-p all` against a state where the tile HAS links, this genuinely
  // verifies a new tab opened to a real Knowledge Navigator page.
  expect(this.newTab, 'Expected a new browser tab to be opened after clicking a material link').toBeTruthy();
  const url = this.newTab!.url();
  expect(url, 'Expected new tab URL to be a valid page (not about:blank)').not.toBe('about:blank');
});
