import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';

// NOTE: "Given I am logged into Vantage Dashboard" lives in
//       step-definitions/people/billability.steps.ts — never redeclare it here.
//
// All steps in this file are NEWLY defined for features/home/filters-default.feature.
// All other steps used by this feature are already declared in:
//   - step-definitions/home/home.steps.ts        (I navigate to the Home page)
//   - step-definitions/home/filters-months.steps.ts (I open the {string} filter)
//   - step-definitions/businessComparison/billability.steps.ts
//       (Date Range show/revert, Apply/Reset in filter panel, selection count badge,
//        all filter selections cleared, Clear within filter panel, all options deselected,
//        all filters reset to defaults, left sidebar button, sub-menu option)

// ---------------------------------------------------------------------------
// NEW When — select a named option in a named filter, scoped to the Home page
// ---------------------------------------------------------------------------

When(
  'I select the {string} option in the {string} filter on the Home page',
  async function (this: PlaywrightWorld, optionName: string, filterName: string) {
    await this.homePage.selectFilterOptionInPanel(optionName, filterName);
  }
);

// ---------------------------------------------------------------------------
// NEW When — reload the Home page and wait for filters to settle
// ---------------------------------------------------------------------------

When('I reload the Home page', async function (this: PlaywrightWorld) {
  await this.homePage.reloadPage();
});

// ---------------------------------------------------------------------------
// NEW Then — verify a named filter badge is visible on the current page
// ---------------------------------------------------------------------------

Then(
  'the applied {string} filter should still be shown on the {string} page',
  async function (this: PlaywrightWorld, filterName: string, _pageName: string) {
    // The second parameter (_pageName) is for readability in Gherkin only.
    // The assertion is generic: the .selected-count badge must be present on
    // the .filter-heading that matches filterName on whichever page the browser
    // is currently on (destination page reached via sidebar SPA navigation).
    const hasBadge = await this.page.waitForFunction(
      (name: string) => {
        const headings = Array.from(document.querySelectorAll('.filter-heading'));
        const heading = headings.find(el => el.textContent && el.textContent.includes(name));
        return heading ? heading.querySelector('.selected-count') !== null : false;
      },
      filterName,
      { timeout: 15000 }
    ).then(() => true).catch(() => false);

    expect(
      hasBadge,
      `Expected the "${filterName}" filter to display a selection count badge on the "${_pageName}" page`
    ).toBe(true);
  }
);
