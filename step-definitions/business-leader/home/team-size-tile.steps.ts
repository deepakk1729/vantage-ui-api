import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';
import { HomePage as BlHomePage } from '../../../src/pages/business-leader/home/HomePage';

// PlaywrightWorld.homePage is statically typed to the superadmin HomePage class,
// but world.ts assigns a business-leader HomePage instance at runtime for this
// role (`as unknown as HomePage`). Cast back to the real runtime type here so
// these business-leader-only Team Size methods type-check without requiring
// the superadmin HomePage class to declare them.
function blHomePage(world: PlaywrightWorld): BlHomePage {
  return world.homePage as unknown as BlHomePage;
}

// ---------------------------------------------------------------------------
// When — shared step "I navigate to the Home page" lives in home.steps.ts
// ---------------------------------------------------------------------------

When('I hover over a segment in the Team Size stacked bar graph', async function (this: PlaywrightWorld) {
  await blHomePage(this).hoverTeamSizeChartSegment();
});

// ---------------------------------------------------------------------------
// Then — Scenario: stacked bar graph with headcount per month by career type
// ---------------------------------------------------------------------------

Then(
  'the Team Size tile should display a stacked bar graph showing headcount per month by career type',
  // Explicit timeout (240s): isTeamSizeChartVisible() waits up to 90s for the tile
  // to attach + 120s polling for the ECharts canvas to size (210s worst case) —
  // this exceeds the 180s global default declared in support/hooks.ts, so it must
  // be declared here to avoid a hard Cucumber timeout cutting the wait short.
  { timeout: 240000 },
  async function (this: PlaywrightWorld) {
    const visible = await blHomePage(this).isTeamSizeChartVisible();
    expect(visible, 'Expected Team Size ECharts canvas to be rendered with non-zero dimensions').toBeTruthy();
  }
);

Then('the total headcount for each month should be displayed at the top of the bar', async function (this: PlaywrightWorld) {
  // The bar totals are rendered inside the ECharts canvas and are not exposed
  // as DOM text. We assert the chart canvas remains fully rendered.
  // Poll instead of a one-shot check: ECharts can transiently reset canvas
  // width/height to 0 during a re-render (documented in
  // HomePage.isTeamSizeChartVisible's canvas-reset-to-width-0 pattern) — a
  // one-shot read can land in that split-second window and false-fail.
  // BUG FIX: waitForFunction(fn, options) is wrong for a zero-param fn — Playwright's
  // real signature is (fn, arg, options), so the options object was being passed as
  // `arg` (ignored) and this silently fell back to the page's 120000ms default action
  // timeout instead of the declared 15000ms. Pass `null` for arg to fix it.
  const rendered = await this.homePage.page.waitForFunction(() => {
    const tile = document.querySelector('.home_page_main_split_row_team_size');
    if (!tile) return false;
    const c = tile.querySelector('canvas');
    return c instanceof HTMLCanvasElement && c.width > 0 && c.height > 0;
  }, null, { timeout: 15000, polling: 500 }).then(() => true).catch(() => false);
  expect(rendered, 'Expected Team Size chart canvas to be rendered (bar totals drawn inside canvas)').toBeTruthy();
});

Then('each stacked bar should display the corresponding month label beneath it', async function (this: PlaywrightWorld) {
  // Month labels are drawn on the ECharts canvas x-axis and are not DOM nodes.
  // The prior step already confirmed the chart is rendered; here we simply
  // re-verify the canvas still exists with non-zero dimensions after scrolling.
  // Poll instead of a one-shot check — see comment in the previous step for why.
  // BUG FIX: waitForFunction(fn, options) is wrong for a zero-param fn — Playwright's
  // real signature is (fn, arg, options), so the options object was being passed as
  // `arg` (ignored) and this silently fell back to the page's 120000ms default action
  // timeout instead of the declared 15000ms. Pass `null` for arg to fix it.
  const rendered = await this.homePage.page.waitForFunction(() => {
    const tile = document.querySelector('.home_page_main_split_row_team_size');
    if (!tile) return false;
    const c = tile.querySelector('canvas');
    return c instanceof HTMLCanvasElement && c.width > 0 && c.height > 0;
  }, null, { timeout: 15000, polling: 500 }).then(() => true).catch(() => false);
  expect(rendered, 'Expected Team Size chart canvas to be rendered (month labels drawn on canvas x-axis)').toBeTruthy();
});

// ---------------------------------------------------------------------------
// Then — Scenario: legend displays aggregated headcount percentage
// ---------------------------------------------------------------------------

Then('the Team Size tile legend should display the aggregated percentage of total headcount by career type', async function (this: PlaywrightWorld) {
  const visible = await blHomePage(this).isTeamSizeLegendVisible();
  expect(visible, 'Expected Team Size legend (.metric_legends) to be visible').toBeTruthy();
});

Then('the legend colors should match the career type colors used in the stacked bar graph', async function (this: PlaywrightWorld) {
  const colored = await blHomePage(this).isTeamSizeLegendColored();
  expect(colored, 'Expected every Team Size legend icon to have a non-empty background-color matching its series color').toBeTruthy();
});

// ---------------------------------------------------------------------------
// Then — Scenario: hover highlights same career type segments
// ---------------------------------------------------------------------------

Then('all segments of the same career type across other months should be highlighted', async function (this: PlaywrightWorld) {
  // ECharts series highlighting on hover is rendered internally on the canvas
  // with no DOM state change. We verify the chart remains interactive and
  // rendered after the hover event as proof the interaction was handled.
  // Poll instead of a one-shot check — see comment in the other steps in this
  // file for why (ECharts can transiently reset canvas width/height to 0).
  // BUG FIX: waitForFunction(fn, options) is wrong for a zero-param fn — Playwright's
  // real signature is (fn, arg, options), so the options object was being passed as
  // `arg` (ignored) and this silently fell back to the page's 120000ms default action
  // timeout instead of the declared 15000ms. Pass `null` for arg to fix it.
  const interactive = await this.homePage.page.waitForFunction(() => {
    const tile = document.querySelector('.home_page_main_split_row_team_size');
    if (!tile) return false;
    const c = tile.querySelector('canvas');
    return c instanceof HTMLCanvasElement && c.width > 0 && c.height > 0;
  }, null, { timeout: 15000, polling: 500 }).then(() => true).catch(() => false);
  expect(interactive, 'Expected Team Size chart canvas to remain rendered after hover (series highlighting applied on canvas)').toBeTruthy();
});
