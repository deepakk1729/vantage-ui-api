import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';
import { DataTable } from '@cucumber/cucumber';

// ---------------------------------------------------------------------------
// NOTE: The following shared steps are defined elsewhere — do NOT redeclare:
//   • "Given I am logged into Vantage Dashboard"              → people/billability.steps.ts
//   • "When I navigate to the Home page"                      → home/home.steps.ts
//   • "When I scroll to the {string} tile"                    → home/kn-material-tile.steps.ts
//   • "Then the {string} tile should be visible on the page"  → home/kn-material-tile.steps.ts
//   • "When I apply the {string} filter selecting {string}"   → home/case-engagement-depth.steps.ts
// ---------------------------------------------------------------------------
// The "I scroll to the {string} tile" step in kn-material-tile.steps.ts has a
// generic fallback that scrolls by text — it handles "VANTAGE AVERAGES" via that
// fallback, so no override is needed here.
// ---------------------------------------------------------------------------

// ── Group headings ─────────────────────────────────────────────────────────────

/**
 * SC-02: "Then the tile should contain the group heading {string}"
 * Verifies that one of the four breakdown group headings is visible inside
 * the VANTAGE AVERAGES tile:
 *   VANTAGE BUSINESS | REGION | CAREER PATH | PRACTICE AREA
 */
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

// ── Dropdown default label ─────────────────────────────────────────────────────

/**
 * SC-03 / SC-07: "Then the utilization category dropdown in the {string} tile should show {string} as the selected option"
 * Confirms the trigger button label of the utilization category dropdown.
 */
Then(
  'the utilization category dropdown in the {string} tile should show {string} as the selected option',
  async function (this: PlaywrightWorld, tileName: string, expectedOption: string) {
    const upper = tileName.trim().toUpperCase();
    let label: string;
    if (upper === 'TOP PROJECTS') {
      label = await this.homePage.getTopProjectsDropdownLabel();
    } else {
      // Default: VANTAGE AVERAGES (and any future tile that reuses this step)
      label = await this.homePage.getVantageAveragesDropdownLabel();
    }
    expect(
      label,
      `Expected the utilization category dropdown in "${tileName}" to show "${expectedOption}" but got "${label}"`
    ).toBe(expectedOption);
  }
);

// ── Data guard (SC-04) ─────────────────────────────────────────────────────────

/**
 * SC-04: "Then if the {string} tile contains data, it should display percentage values for each breakdown row"
 * Soft-skips when the tile is genuinely empty; asserts percentage values when data is present.
 */
Then(
  'if the {string} tile contains data, it should display percentage values for each breakdown row',
  async function (this: PlaywrightWorld, _tileName: string) {
    const hasData = await this.homePage.vantageAveragesTileHasData();
    if (!hasData) {
      // Tile is empty (no-data state in staging) — soft-skip
      return 'skipped';
    }
    // When data is present, at least one percentage value must be visible
    const tile = this.homePage.page.locator('.home_page_main_split_row_kt_billability').first();
    const percentEls = tile.locator('.billabilityValue');
    const count = await percentEls.count();
    expect(count, 'Expected at least one percentage value to be visible in the VANTAGE AVERAGES tile').toBeGreaterThan(0);
  }
);

// ── Breakdown row presence (SC-05) ────────────────────────────────────────────

/**
 * SC-05 (3-row groups): "Then the {string} group should display rows for {string}, {string}, and {string}"
 * Verifies that three named data rows are visible within the VANTAGE AVERAGES tile.
 */
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
      expect(
        visible,
        `Expected the VANTAGE AVERAGES tile to display a row labelled "${rowLabel}"`
      ).toBe(true);
    }
  }
);

/**
 * SC-05 (2-row groups): "And the {string} group should display rows for {string} and {string}"
 * Verifies that two named data rows are visible within the VANTAGE AVERAGES tile.
 */
Then(
  'the {string} group should display rows for {string} and {string}',
  async function (this: PlaywrightWorld, _groupName: string, row1: string, row2: string) {
    for (const rowLabel of [row1, row2]) {
      const visible = await this.homePage.isVantageAveragesRowVisible(rowLabel);
      expect(
        visible,
        `Expected the VANTAGE AVERAGES tile to display a row labelled "${rowLabel}"`
      ).toBe(true);
    }
  }
);

// ── Dropdown open (SC-06) ─────────────────────────────────────────────────────

/**
 * SC-06 / SC-07: "When I open the utilization category dropdown in the {string} tile"
 * Opens the dropdown trigger button inside the VANTAGE AVERAGES tile.
 */
When(
  'I open the utilization category dropdown in the {string} tile',
  async function (this: PlaywrightWorld, tileName: string) {
    const upper = tileName.trim().toUpperCase();
    if (upper === 'TOP PROJECTS') {
      await this.homePage.openTopProjectsDropdown();
    } else {
      // Default: VANTAGE AVERAGES (and any future tile that reuses this step)
      await this.homePage.openVantageAveragesDropdown();
    }
  }
);

// ── Dropdown options list (SC-06) ─────────────────────────────────────────────

/**
 * SC-06: "Then the dropdown should contain the following options:"
 * Verifies that the open dropdown includes all expected utilization category options.
 * The DataTable has a single "Option" column.
 */
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

// ── Select a specific option (SC-07) ─────────────────────────────────────────

/**
 * SC-07: "And I select {string} from the utilization category dropdown"
 * Clicks a named option inside the open VANTAGE AVERAGES dropdown.
 */
When(
  'I select {string} from the utilization category dropdown',
  async function (this: PlaywrightWorld, option: string) {
    await this.homePage.selectVantageAveragesOption(option);
  }
);

// ── Tile data refresh assertion (SC-07) ───────────────────────────────────────

/**
 * SC-07: "Then the {string} tile should refresh its percentage values"
 * Confirms the tile is still rendered and contains at least one percentage value.
 * Soft-skips when the tile has no data (empty state in staging).
 */
Then(
  'the {string} tile should refresh its percentage values',
  async function (this: PlaywrightWorld, _tileName: string) {
    const rendered = await this.homePage.isVantageAveragesTileRendered();
    expect(
      rendered,
      'Expected the VANTAGE AVERAGES tile to remain visible after changing the utilization category'
    ).toBe(true);
    // Soft-skip count assertion when tile is empty
    const hasData = await this.homePage.vantageAveragesTileHasData();
    if (!hasData) {
      return 'skipped';
    }
    const tile = this.homePage.page.locator('.home_page_main_split_row_kt_billability').first();
    const percentEls = tile.locator('.billabilityValue');
    const count = await percentEls.count();
    expect(
      count,
      'Expected at least one percentage value to be visible after category selection'
    ).toBeGreaterThan(0);
  }
);

// ── Cycle all options (SC-08) ─────────────────────────────────────────────────

/**
 * SC-08: "When I select each utilization category option in the {string} tile in sequence:"
 * Iterates through each option in the DataTable, selects it, and waits for the tile
 * to remain visible.  The DataTable has a single "Option" column.
 */
When(
  'I select each utilization category option in the {string} tile in sequence:',
  async function (this: PlaywrightWorld, _tileName: string, table: DataTable) {
    const options = table.rows().map(row => row[0].trim());
    for (const option of options) {
      await this.homePage.openVantageAveragesDropdown();
      await this.homePage.selectVantageAveragesOption(option);
      // Confirm tile is still rendered after each selection
      const rendered = await this.homePage.isVantageAveragesTileRendered();
      expect(
        rendered,
        `Expected the VANTAGE AVERAGES tile to remain visible after selecting "${option}"`
      ).toBe(true);
    }
  }
);

/**
 * SC-08: "Then no error should be displayed in the {string} tile after each selection"
 * Verifies the tile container does not contain any error state element.
 */
Then(
  'no error should be displayed in the {string} tile after each selection',
  async function (this: PlaywrightWorld, _tileName: string) {
    const noError = await this.homePage.vantageAveragesTileHasNoError();
    expect(
      noError,
      'Expected no error element to be rendered in the VANTAGE AVERAGES tile after cycling all utilization category options'
    ).toBe(true);
  }
);

// ── Filter reactivity (SC-09) ─────────────────────────────────────────────────

/**
 * SC-09: "And I apply the {string} filter with option {string}"
 * Opens the named filter, clears it, selects the given option, and clicks Apply.
 * Currently handles the "Path" filter; extend the switch for other filters.
 */
When(
  'I apply the {string} filter with option {string}',
  async function (this: PlaywrightWorld, filterName: string, option: string) {
    if (filterName === 'Path') {
      await this.homePage.applyPathFilter(option);
    } else {
      throw new Error(
        `Filter "${filterName}" is not handled in the "I apply the {string} filter with option {string}" step. ` +
        `Only "Path" is currently wired.`
      );
    }
  }
);

/**
 * SC-09: "Then the {string} tile should reflect updated percentage values corresponding to the applied filter"
 * Asserts the tile is still rendered after filter application.
 * Soft-skips the percentage count assertion when tile is empty.
 */
Then(
  'the {string} tile should reflect updated percentage values corresponding to the applied filter',
  async function (this: PlaywrightWorld, _tileName: string) {
    const rendered = await this.homePage.isVantageAveragesTileRendered();
    expect(
      rendered,
      'Expected the VANTAGE AVERAGES tile to remain visible after applying the filter'
    ).toBe(true);
    const hasData = await this.homePage.vantageAveragesTileHasData();
    if (!hasData) {
      return 'skipped';
    }
    const tile = this.homePage.page.locator('.home_page_main_split_row_kt_billability').first();
    const percentEls = tile.locator('.billabilityValue');
    const count = await percentEls.count();
    expect(
      count,
      'Expected at least one percentage value to remain visible in the VANTAGE AVERAGES tile after filter applied'
    ).toBeGreaterThan(0);
  }
);
