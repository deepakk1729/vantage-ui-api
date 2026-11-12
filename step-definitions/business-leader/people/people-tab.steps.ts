import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../../support/world';
import { DataTable } from '@cucumber/cucumber';

// ---------------------------------------------------------------------------
// When
// ---------------------------------------------------------------------------

When(
  'I click on the {string} button in the left sidebar',
  async function (this: PlaywrightWorld, buttonLabel: string) {
    if (buttonLabel === 'People') {
      await this.peoplePage.clickPeopleButton();
    } else {
      await this.page.getByRole('button', { name: buttonLabel }).click();
    }
  }
);

When(
  'I click on the {string} sub-menu option under People',
  async function (this: PlaywrightWorld, subMenuLabel: string) {
    if (subMenuLabel === 'Billability') {
      await this.peoplePage.clickBillabilitySubMenu();
    } else {
      // Generic fallback for other sub-menu labels
      await this.page.getByRole('button', { name: subMenuLabel }).click();
      await this.page.waitForLoadState('domcontentloaded');
    }
  }
);

// ---------------------------------------------------------------------------
// Then
// ---------------------------------------------------------------------------

Then(
  'a dropdown should appear with the following menu options:',
  async function (this: PlaywrightWorld, dataTable: DataTable) {
    const expectedOptions = dataTable.rows().map((row: string[]) => row[0]);
    const isVisible = await this.peoplePage.isPeopleSubMenuVisible();
    expect(isVisible).toBe(true);

    const actualOptions = await this.peoplePage.getPeopleSubMenuOptions();
    for (const option of expectedOptions) {
      expect(actualOptions).toContain(option);
    }
  }
);

Then(
  'the People page should display all menu options as tabs:',
  async function (this: PlaywrightWorld, dataTable: DataTable) {
    const expectedTabs = dataTable.rows().map((row: string[]) => row[0]);
    const tabsVisible = await this.peoplePage.arePeopleTabsVisible();
    expect(tabsVisible).toBe(true);

    const actualTabs = await this.peoplePage.getPeopleTabLabels();
    for (const tab of expectedTabs) {
      expect(actualTabs).toContain(tab);
    }
  }
);

Then(
  'the {string} tab should be active',
  async function (this: PlaywrightWorld, tabName: string) {
    const isActive = await this.peoplePage.isTabActive(tabName);
    expect(isActive).toBe(true);
  }
);
