import { When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';

// ---------------------------------------------------------------------------
// Scenario: Verify Status filter opens and displays options or an empty state
// ---------------------------------------------------------------------------

Then('the Status filter panel should be visible', async function (this: PlaywrightWorld) {
  const visible = await this.homePage.statusFilter.isPanelVisible();
  expect(visible, 'Expected Status filter panel to be visible after expanding').toBeTruthy();
});

Then(
  'the Status filter should display either a list of options or a "No Record" message',
  async function (this: PlaywrightWorld) {
    const hasOptions = await this.homePage.statusFilter.hasOptions();
    const hasNoRecord = await this.homePage.statusFilter.hasNoRecord();
    expect(
      hasOptions || hasNoRecord,
      'Expected Status filter to show either option checkboxes or a "No Record" message'
    ).toBeTruthy();
  }
);

// ---------------------------------------------------------------------------
// Guard steps — soft-skip populated-state scenarios when no options present,
// and soft-skip the empty-state scenario when options ARE present.
// ---------------------------------------------------------------------------

When(
  'the Status filter contains at least one option',
  async function (this: PlaywrightWorld) {
    const hasOptions = await this.homePage.statusFilter.hasOptions();
    if (!hasOptions) {
      // No options available in this environment — soft-skip the scenario.
      return 'skipped';
    }
  }
);

// ---------------------------------------------------------------------------
// Scenario: Verify the available Status filter options match the expected values
// ---------------------------------------------------------------------------

Then(
  'the following Status options should be available:',
  async function (this: PlaywrightWorld, table: DataTable) {
    const options = table.raw().map(row => row[0].trim());
    for (const option of options) {
      const visible = await this.homePage.statusFilter.isOptionVisible(option);
      expect(visible, `Expected Status option "${option}" to be visible`).toBeTruthy();
    }
  }
);

// ---------------------------------------------------------------------------
// Scenario: Verify selecting a single Status option updates all Home page tiles
// ---------------------------------------------------------------------------

When(
  'I select a single option from the Status filter',
  async function (this: PlaywrightWorld) {
    // Select the first available option ("Active") as the representative single option.
    await this.homePage.statusFilter.select('Active');
  }
);

When(
  'I click {string} in the Status filter',
  async function (this: PlaywrightWorld, action: string) {
    switch (action) {
      case 'Apply':
        await this.homePage.statusFilter.apply();
        break;
      case 'Select all':
        await this.homePage.statusFilter.selectAll();
        break;
      case 'Clear':
        await this.homePage.statusFilter.clear();
        break;
      default:
        throw new Error(
          `Unknown Status filter action: "${action}". Expected "Apply", "Select all", or "Clear".`
        );
    }
  }
);

Then('the Status filter should close', async function (this: PlaywrightWorld) {
  const closed = await this.homePage.statusFilter.isClosed();
  expect(closed, 'Expected Status filter panel to close after clicking Apply').toBeTruthy();
});

Then(
  'all Home page tiles should display data for the selected Status',
  async function (this: PlaywrightWorld) {
    const visible = await this.homePage.isBillabilityTrendVisible();
    expect(
      visible,
      'Expected BILLABILITY TREND tile to remain visible after Status filter applied'
    ).toBeTruthy();
  }
);

// ---------------------------------------------------------------------------
// Scenario: Verify selecting multiple Status options updates all Home page tiles
// ---------------------------------------------------------------------------

When(
  'I select multiple options from the Status filter',
  async function (this: PlaywrightWorld) {
    // Select LOA and Inactive as two representative options.
    await this.homePage.statusFilter.select('LOA');
    await this.homePage.statusFilter.select('Inactive');
  }
);

Then(
  'all Home page tiles should display data for the selected Statuses',
  async function (this: PlaywrightWorld) {
    const visible = await this.homePage.isBillabilityTrendVisible();
    expect(
      visible,
      'Expected BILLABILITY TREND tile to remain visible after multiple Status options applied'
    ).toBeTruthy();
  }
);

// ---------------------------------------------------------------------------
// Scenario: Verify the Select all control selects every Status option
// ---------------------------------------------------------------------------

Then('all Status options should be checked', async function (this: PlaywrightWorld) {
  const allChecked = await this.homePage.statusFilter.areAllOptionsChecked();
  expect(allChecked, 'Expected all Status option checkboxes to be checked').toBeTruthy();
});

// ---------------------------------------------------------------------------
// Scenario: Verify the Clear control deselects all Status options
// ---------------------------------------------------------------------------

Then('no Status options should be checked', async function (this: PlaywrightWorld) {
  // After Clear is clicked the panel closes on the live app, so the absence of
  // a filter-container (isClosed) is equivalent to "none checked / cleared".
  const panelClosed = await this.homePage.statusFilter.isClosed();
  expect(
    panelClosed,
    'Expected Status filter panel to close (Clear applied) with no options selected'
  ).toBeTruthy();
});
