import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';
import { DataTable } from '@cucumber/cucumber';

// ---------------------------------------------------------------------------
// NOTE: The following shared steps are defined elsewhere — do NOT redeclare:
//   • "Given I am logged into Vantage Dashboard"             → reports/billability.steps.ts
//   • "When I navigate to the Home page"                     → home/home.steps.ts
//   • "When I scroll to the {string} tile"                   → home/kn-material-tile.steps.ts
//   • "Then the {string} tile should be visible on the page" → home/kn-material-tile.steps.ts
// Analyst has NO path filter, so filter-reactivity step is omitted.
// ---------------------------------------------------------------------------

// ── Group headings ──────────────────────────────────────────────────────────

Then(
  'the tile should contain the group heading {string}',
  async function (this: PlaywrightWorld, heading: string) {
    const visible = await this.homePage.isVantageAveragesGroupHeadingVisible(heading);
    expect(
      visible,
      `Expected the VANTAGE AVERAGES tile to contain the group heading "${heading}"`
    ).toBe(true);
  }
);

// ── Dropdown default label ────────────────────────────────────────────────────

Then(
  'the utilization category dropdown in the {string} tile should show {string} as the selected option',
  async function (this: PlaywrightWorld, tileName: string, expectedOption: string) {
    const upper = tileName.trim().toUpperCase();
    let label: string;
    if (upper === 'TOP PROJECTS') {
      label = await this.homePage.getTopProjectsDropdownLabel();
    } else {
      label = await this.homePage.getVantageAveragesDropdownLabel();
    }
    expect(
      label,
      `Expected the utilization category dropdown in "${tileName}" to show "${expectedOption}" but got "${label}"`
    ).toBe(expectedOption);
  }
);

// ── Data guard ──────────────────────────────────────────────────────────────

Then(
  'if the {string} tile contains data, it should display percentage values for each breakdown row',
  async function (this: PlaywrightWorld, _tileName: string) {
    const hasData = await this.homePage.vantageAveragesTileHasData();
    if (!hasData) {
      return 'skipped';
    }
    const tile = this.homePage.page.locator('.home_page_main_split_row_kt_billability').first();
    const percentEls = tile.locator('.billabilityValue');
    const count = await percentEls.count();
    expect(count, 'Expected at least one percentage value to be visible in the VANTAGE AVERAGES tile').toBeGreaterThan(0);
  }
);

// ── Breakdown row presence ────────────────────────────────────────────────────

Then(
  'the {string} group should display rows for {string}, {string}, and {string}',
  async function (
    this: PlaywrightWorld,
    _groupName: string,
    row1: string,
    row2: string,
    row3: string
  ) {
    for (const rowLabel of [row1, row2, row3]) {
      const visible = await this.homePage.isVantageAveragesRowVisible(rowLabel);
      expect(visible, `Expected the VANTAGE AVERAGES tile to display a row labelled "${rowLabel}"`).toBe(true);
    }
  }
);

Then(
  'the {string} group should display rows for {string} and {string}',
  async function (this: PlaywrightWorld, _groupName: string, row1: string, row2: string) {
    for (const rowLabel of [row1, row2]) {
      const visible = await this.homePage.isVantageAveragesRowVisible(rowLabel);
      expect(visible, `Expected the VANTAGE AVERAGES tile to display a row labelled "${rowLabel}"`).toBe(true);
    }
  }
);

// ── Dropdown open ─────────────────────────────────────────────────────────────

When(
  'I open the utilization category dropdown in the {string} tile',
  async function (this: PlaywrightWorld, tileName: string) {
    const upper = tileName.trim().toUpperCase();
    if (upper === 'TOP PROJECTS') {
      await this.homePage.openTopProjectsDropdown();
    } else {
      await this.homePage.openVantageAveragesDropdown();
    }
  }
);

// ── Dropdown options list ─────────────────────────────────────────────────────

Then(
  'the dropdown should contain the following options:',
  async function (this: PlaywrightWorld, table: DataTable) {
    const expectedOptions = table.rows().map(row => row[0].trim());
    const actualOptions = await this.homePage.getVantageAveragesDropdownOptions();
    for (const option of expectedOptions) {
      expect(
        actualOptions,
        `Expected dropdown to contain option "${option}" but actual options are: ${actualOptions.join(', ')}`
      ).toContain(option);
    }
  }
);

// ── Select a specific option ─────────────────────────────────────────────────

When(
  'I select {string} from the utilization category dropdown',
  async function (this: PlaywrightWorld, option: string) {
    await this.homePage.selectVantageAveragesOption(option);
  }
);

// ── Tile data refresh assertion ──────────────────────────────────────────────

Then(
  'the {string} tile should refresh its percentage values',
  async function (this: PlaywrightWorld, _tileName: string) {
    const rendered = await this.homePage.isVantageAveragesTileRendered();
    expect(rendered, 'Expected the VANTAGE AVERAGES tile to remain visible after changing the utilization category').toBe(true);
    const hasData = await this.homePage.vantageAveragesTileHasData();
    if (!hasData) {
      return 'skipped';
    }
    const tile = this.homePage.page.locator('.home_page_main_split_row_kt_billability').first();
    const percentEls = tile.locator('.billabilityValue');
    const count = await percentEls.count();
    expect(count, 'Expected at least one percentage value to be visible after category selection').toBeGreaterThan(0);
  }
);

// ── Cycle all options ─────────────────────────────────────────────────────────

When(
  'I select each utilization category option in the {string} tile in sequence:',
  async function (this: PlaywrightWorld, _tileName: string, table: DataTable) {
    const options = table.rows().map(row => row[0].trim());
    for (const option of options) {
      await this.homePage.openVantageAveragesDropdown();
      await this.homePage.selectVantageAveragesOption(option);
      const rendered = await this.homePage.isVantageAveragesTileRendered();
      expect(rendered, `Expected the VANTAGE AVERAGES tile to remain visible after selecting "${option}"`).toBe(true);
    }
  }
);

Then(
  'no error should be displayed in the {string} tile after each selection',
  async function (this: PlaywrightWorld, _tileName: string) {
    const noError = await this.homePage.vantageAveragesTileHasNoError();
    expect(noError, 'Expected no error element to be rendered in the VANTAGE AVERAGES tile after cycling all utilization category options').toBe(true);
  }
);
