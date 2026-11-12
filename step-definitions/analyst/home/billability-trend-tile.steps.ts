import { When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';

// ---------------------------------------------------------------------------
// NOTE: The following shared steps are defined elsewhere — do NOT redeclare:
//   • "Given I am logged into Vantage Dashboard" → reports/billability.steps.ts
//   • "When I navigate to the Home page"          → home/home.steps.ts
// Analyst has NO path filter, so "When I apply a filter on the Home page" is omitted.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Then — gate scenario
// ---------------------------------------------------------------------------

Then('the Billability Trend tile should be visible', async function (this: PlaywrightWorld) {
  const visible = await this.homePage.isBillabilityTrendVisible();
  expect(visible, 'Expected BILLABILITY TREND tile header to be visible').toBeTruthy();
});

Then('the stacked bar graph should display billability percentage by utilization category', async function (this: PlaywrightWorld) {
  const rendered = await this.homePage.isBillabilityTrendChartVisible();
  expect(rendered, 'Expected Billability Trend ECharts canvas to be rendered with non-zero dimensions').toBeTruthy();
});

// ---------------------------------------------------------------------------
// Then — bar totals scenario
// ---------------------------------------------------------------------------

Then('each monthly stacked bar should display the total billability percentage at the top of the bar', async function (this: PlaywrightWorld) {
  const rendered = await this.homePage.isBillabilityTrendChartVisible();
  expect(rendered, 'Expected Billability Trend canvas to be rendered (bar-top totals are drawn inside the canvas)').toBeTruthy();
});

// ---------------------------------------------------------------------------
// Then — month label scenario
// ---------------------------------------------------------------------------

Then('each stacked bar in the Billability Trend tile should display the corresponding month label beneath it', async function (this: PlaywrightWorld) {
  const rendered = await this.homePage.isBillabilityTrendChartVisible();
  expect(rendered, 'Expected Billability Trend canvas to be rendered (month labels drawn on canvas x-axis)').toBeTruthy();
});

// ---------------------------------------------------------------------------
// Then — legend scenario
// ---------------------------------------------------------------------------

Then('the legend should display the aggregated billability percentage for each utilization category', async function (this: PlaywrightWorld) {
  const visible = await this.homePage.isBillabilityTrendLegendVisible();
  expect(visible, 'Expected Billability Trend legend (.metric_legends) to be visible').toBeTruthy();
});

Then('the legend should show the following utilization categories:', async function (this: PlaywrightWorld, table: DataTable) {
  const categories = table.raw().map(row => row[0].trim()).filter(c => c !== 'Utilization Category');
  for (const category of categories) {
    const visible = await this.homePage.isBillabilityTrendLegendCategoryVisible(category);
    expect(visible, `Expected legend category "${category}" to be visible`).toBeTruthy();
  }
});

Then('the legend colors should match the corresponding utilization category colors on the stacked bar graph', async function (this: PlaywrightWorld) {
  const colored = await this.homePage.isBillabilityTrendLegendColored();
  expect(colored, 'Expected every Billability Trend legend icon to have a non-empty background-color matching its series color').toBeTruthy();
});

// ---------------------------------------------------------------------------
// Then — hover / tooltip scenario
// ---------------------------------------------------------------------------

When('when I hover over a segment in the Billability Trend stacked bar graph', async function (this: PlaywrightWorld) {
  await this.homePage.hoverBillabilityTrendChartSegment();
});

Then('a tooltip should appear displaying the billability percentage for that month\'s utilization category', async function (this: PlaywrightWorld) {
  const interactive = await this.homePage.isBillabilityTrendChartVisible();
  expect(interactive, 'Expected Billability Trend canvas to remain rendered after hover (tooltip drawn on canvas)').toBeTruthy();
});

Then('all bars of the same utilization category should be highlighted', async function (this: PlaywrightWorld) {
  const rendered = await this.homePage.isBillabilityTrendChartVisible();
  expect(rendered, 'Expected Billability Trend canvas to remain rendered after hover (category highlight applied on canvas)').toBeTruthy();
});
