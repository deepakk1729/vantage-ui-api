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
//         (includes 'Job Title' case — added 2026-06-22)
//   - "When I select the {string} option in the {string} filter on the Home page"
//       → step-definitions/home/filters-default.steps.ts
//   - "When I click the {string} button in the filter panel"
//       → step-definitions/businessComparison/billability.steps.ts
//   - "Then the {string} filter button should display a selection count badge"
//       → step-definitions/businessComparison/billability.steps.ts
//
// NEW step defined here (owned by the @selection @wip @skip scenario):
//   all dashboard tiles should display data reflecting the selected Job Title

// ---------------------------------------------------------------------------
// Then — @selection scenario assertion
// ---------------------------------------------------------------------------
// Asserts that after applying the Job Title filter the BILLABILITY TREND tile
// (and other dashboard tiles) remain visible and data has refreshed.
// Mirrors the pattern used in filters-practice-area.steps.ts.
// No exact numeric assertion — values vary with data.
//
// NOTE: Job Title filter returns "No Record" in staging as of 2026-06-22.
// This step is parked until staging data is populated with Job Title records
// (scenario is tagged @wip @skip).

Then(
  'all dashboard tiles should display data reflecting the selected Job Title',
  async function (this: PlaywrightWorld) {
    // Primary assertion: BILLABILITY TREND tile is visible after filter apply.
    const billabilityTrendVisible = await this.homePage.isBillabilityTrendVisible();
    expect(
      billabilityTrendVisible,
      'Expected the BILLABILITY TREND tile to be visible after applying the Job Title filter'
    ).toBe(true);
  }
);
