import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';

// ---------------------------------------------------------------------------
// Given — "I am logged into Vantage Dashboard" lives in
// step-definitions/superadmin/people/billability.steps.ts (shared, not duplicated here)
// ---------------------------------------------------------------------------

When('I scroll to view the Team Size tile', async function (this: PlaywrightWorld) {
  await this.homePage.scrollToTeamSizeTile();
});

// ---------------------------------------------------------------------------
// Then — stacked bar graph scenario (canvas-only, declarative guards)
// ---------------------------------------------------------------------------

Then('the Team Size tile should display a stacked bar graph showing headcount per month by career type', async function (this: PlaywrightWorld) {
  const rendered = await this.homePage.isTeamSizeChartVisible();
  expect(rendered, 'Expected Team Size ECharts canvas to be rendered with non-zero dimensions').toBeTruthy();
});

Then('the total headcount for each month should be displayed at the top of the bar', async function (this: PlaywrightWorld) {
  const rendered = await this.homePage.isTeamSizeBarTotalsVisible();
  expect(rendered, 'Expected Team Size canvas to be rendered (bar-top headcount totals are drawn inside the canvas)').toBeTruthy();
});

Then('each stacked bar should display the corresponding month label beneath it', async function (this: PlaywrightWorld) {
  const rendered = await this.homePage.isTeamSizeMonthLabelsVisible();
  expect(rendered, 'Expected Team Size canvas to be rendered (month labels drawn on canvas x-axis)').toBeTruthy();
});

// ---------------------------------------------------------------------------
// Then — legend scenario
// ---------------------------------------------------------------------------

Then('the Team Size tile legend should display the aggregated percentage of total headcount by career type', async function (this: PlaywrightWorld) {
  const visible = await this.homePage.isTeamSizeLegendVisible();
  expect(visible, 'Expected Team Size legend (.metric_legends) to be visible').toBeTruthy();
});

Then('the legend should show the following career types:', async function (this: PlaywrightWorld, table: DataTable) {
  const careerTypes = table.raw().map((row) => row[0].trim()).filter((c) => c !== 'Career Type');
  for (const careerType of careerTypes) {
    const visible = await this.homePage.isTeamSizeLegendCategoryVisible(careerType);
    expect(visible, `Expected legend career type "${careerType}" to be visible with an aggregated percentage`).toBeTruthy();
  }
});

Then('the legend colors should match the career type colors used in the stacked bar graph', async function (this: PlaywrightWorld) {
  const matched = await this.homePage.isTeamSizeLegendColorsMatchChart();
  expect(matched, 'Expected every Team Size legend swatch color to be found among the stacked bar segment colors').toBeTruthy();
});

// ---------------------------------------------------------------------------
// Given / When / Then — hover cross-month highlight scenario
// ---------------------------------------------------------------------------

Given('the Team Size tile has loaded', async function (this: PlaywrightWorld) {
  await this.homePage.scrollToTeamSizeTile();
  const rendered = await this.homePage.isTeamSizeChartVisible();
  expect(rendered, 'Expected Team Size tile to finish loading (canvas rendered) before hovering').toBeTruthy();
});

When('I hover over a segment in the Team Size stacked bar graph', async function (this: PlaywrightWorld) {
  await this.homePage.hoverTeamSizeChartSegment();
});

Then('all segments of the same career type across other months should be highlighted', async function (this: PlaywrightWorld) {
  const highlighted = await this.homePage.isTeamSizeCrossMonthHighlightApplied();
  expect(
    highlighted,
    'Expected Team Size stacked-bar segments of the hovered career type to remain opaque across other months while other career types fade'
  ).toBeTruthy();
});
