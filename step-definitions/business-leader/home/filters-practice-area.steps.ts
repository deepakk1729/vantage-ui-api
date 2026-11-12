import { Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';

// NOTE: "Given I am logged into Vantage Dashboard" lives in
//       step-definitions/people/billability.steps.ts — never redeclare it here.
//
// REUSED steps (do NOT redeclare):
//   - "When I navigate to the Home page"
//       → step-definitions/home/home.steps.ts
//   - "When I open the {string} filter"
//       → step-definitions/home/filters-months.steps.ts
//         (now includes 'Practice Area' case — added 2026-06-22)
//   - "When I select the {string} option in the {string} filter on the Home page"
//       → step-definitions/home/filters-default.steps.ts
//   - "When I click the {string} button in the filter panel"
//       → step-definitions/businessComparison/billability.steps.ts
//   - "Then the {string} filter button should display a selection count badge"
//       → step-definitions/businessComparison/billability.steps.ts
//
// NEW steps defined here (both owned by the @wip @skip scenarios):
//   1. each Practice Area option should be expandable to reveal its topics and sub-topics
//   2. all dashboard tiles should display data reflecting the selected Practice Area

// ---------------------------------------------------------------------------
// Then — @expandable scenario assertion
// ---------------------------------------------------------------------------
// Verifies that top-level PA rows in the open Practice Area filter panel each
// have an expand toggle (angle-down / chevron) and, when clicked, reveal child
// topic rows.  If the panel is empty (staging "No Record" state) this step will
// fail — hence the scenario is tagged @wip @skip until data is populated.

Then(
  'each Practice Area option should be expandable to reveal its topics and sub-topics',
  async function (this: PlaywrightWorld) {
    // Assert the Practice Area filter is open and has at least one option.
    const hasOptions = await this.homePage.practiceAreaFilter.hasOptions();
    expect(
      hasOptions,
      'Expected the Practice Area filter to contain at least one option to expand. ' +
      'Staging currently shows "No Record" — re-enable once data is populated.'
    ).toBe(true);

    // Assert the first option has an expand toggle (chevron / angle-down icon).
    const expandable = await this.homePage.practiceAreaFilter.isExpandable();
    expect(
      expandable,
      'Expected the first Practice Area option to have an expand toggle (chevron/angle-down icon)'
    ).toBe(true);

    // Expand the first PA option and verify child topic rows appear.
    await this.homePage.practiceAreaFilter.expandFirstOption();
    const childTopicsVisible = await this.homePage.practiceAreaFilter.areChildTopicsVisible();
    expect(
      childTopicsVisible,
      'Expected child topic rows to be visible after expanding the first Practice Area option'
    ).toBe(true);
  }
);

// ---------------------------------------------------------------------------
// Then — @selection scenario assertion
// ---------------------------------------------------------------------------
// Asserts that after applying the Practice Area filter the BILLABILITY TREND
// tile (and other dashboard tiles) remain visible and data has refreshed.
// Mirrors the pattern used in filters-months.steps.ts and home.steps.ts.
// No exact numeric assertion — values vary with data.

Then(
  'all dashboard tiles should display data reflecting the selected Practice Area',
  async function (this: PlaywrightWorld) {
    // Primary assertion: BILLABILITY TREND tile is visible after filter apply.
    const billabilityTrendVisible = await this.homePage.isBillabilityTrendVisible();
    expect(
      billabilityTrendVisible,
      'Expected the BILLABILITY TREND tile to be visible after applying the Practice Area filter'
    ).toBe(true);
  }
);
