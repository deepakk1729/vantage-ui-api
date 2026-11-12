import { Locator, Page } from '@playwright/test';
import { BasePage } from '../../base/BasePage';

/**
 * Analyst People/Reports Page.
 *
 * Analyst has Reports (not People) in the sidebar, with 3 sub-menu items:
 *   Billability | Timesheets | Charges/Hours
 * (NO Bill Rate — analyst is not a manager)
 */
export class PeoplePage extends BasePage {

  readonly peopleButton: Locator;
  readonly peopleBillabilitySubMenu: Locator;
  readonly peopleTimesheetsSubMenu: Locator;
  readonly peopleChargesHoursSubMenu: Locator;
  readonly tabList: Locator;

  constructor(page: Page) {
    super(page);

    // For analyst the sidebar shows "Reports" (not "People").
    // The regex /People|Reports/ matches both labels for compatibility.
    this.peopleButton = page.getByRole('button', { name: /People|Reports/ });

    // Scope to the Reports submenu by content: "Timesheets" is unique to it
    // (Business Comparison's submenu only has "Billability"), so this works
    // regardless of BC presence or order.
    const peopleSubmenu = page.locator('.sidebar-submenu-dropDown')
      .filter({ has: page.locator('.dropdown-link', { hasText: 'Timesheets' }) });
    this.peopleBillabilitySubMenu = peopleSubmenu.locator('.dropdown-link', { hasText: 'Billability' });
    this.peopleTimesheetsSubMenu = peopleSubmenu.locator('.dropdown-link', { hasText: 'Timesheets' });
    this.peopleChargesHoursSubMenu = peopleSubmenu.locator('.dropdown-link', { hasText: 'Charges/Hours' });
    // NOTE: analyst has NO Bill Rate sub-menu item.

    // The horizontal tab list rendered on Reports sub-pages (Billability, Timesheets, etc.)
    this.tabList = page.getByRole('list').filter({ has: page.getByRole('link', { name: 'Billability' }) });
  }

  /**
   * Ensures the Reports sub-menu is expanded in the left sidebar.
   */
  async clickPeopleButton(): Promise<void> {
    await this.peopleButton.waitFor({ state: 'visible', timeout: 15000 });

    const peopleSubmenu = this.page.locator('.sidebar-submenu-dropDown')
      .filter({ has: this.page.locator('.dropdown-link', { hasText: 'Timesheets' }) });

    if (!(await peopleSubmenu.isVisible().catch(() => false))) {
      await this.peopleButton.click();
      await peopleSubmenu.waitFor({ state: 'visible', timeout: 10000 });
    }
  }

  /**
   * Returns true if the Reports sidebar sub-menu is visible
   * (i.e. all three sub-items are in the DOM and visible — analyst has no Bill Rate).
   */
  async isPeopleSubMenuVisible(): Promise<boolean> {
    try {
      await this.peopleBillabilitySubMenu.waitFor({ state: 'visible', timeout: 10000 });
      await this.peopleTimesheetsSubMenu.waitFor({ state: 'visible', timeout: 5000 });
      await this.peopleChargesHoursSubMenu.waitFor({ state: 'visible', timeout: 5000 });
      // Analyst has no Bill Rate — only check the 3 items above
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns the text labels of every visible Reports sidebar sub-menu item.
   * Analyst has 3 items: Billability, Timesheets, Charges/Hours.
   */
  async getPeopleSubMenuOptions(): Promise<string[]> {
    await this.peopleBillabilitySubMenu.waitFor({ state: 'visible', timeout: 10000 });
    const buttons = [
      this.peopleBillabilitySubMenu,
      this.peopleTimesheetsSubMenu,
      this.peopleChargesHoursSubMenu,
    ];
    const labels: string[] = [];
    for (const btn of buttons) {
      labels.push(((await btn.textContent()) ?? '').trim());
    }
    return labels;
  }

  /**
   * Clicks the "Billability" sub-menu option under the Reports section.
   */
  async clickBillabilitySubMenu(): Promise<void> {
    await this.peopleBillabilitySubMenu.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Hovers over the Reports icon button in the left sidebar.
   */
  async hoverOverPeopleIcon(): Promise<void> {
    await this.peopleButton.waitFor({ state: 'visible', timeout: 15000 });
    await this.peopleButton.hover();
    await this.peopleBillabilitySubMenu.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Clicks a named sub-menu item in the Reports section of the sidebar.
   */
  async clickPeopleSubMenuItem(itemName: string): Promise<void> {
    const peopleSubmenu = this.page.locator('.sidebar-submenu-dropDown')
      .filter({ has: this.page.locator('.dropdown-link', { hasText: 'Timesheets' }) });
    const menuItem = peopleSubmenu.locator('.dropdown-link', { hasText: itemName });
    await menuItem.waitFor({ state: 'visible', timeout: 10000 });
    await menuItem.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Returns true if the horizontal tab list on the Reports page is visible and
   * contains the 3 expected tab labels (analyst has NO Bill Rate tab).
   */
  async arePeopleTabsVisible(): Promise<boolean> {
    try {
      await this.tabList.waitFor({ state: 'visible', timeout: 15000 });
      const billabilityTab = this.page.getByRole('link', { name: 'Billability' });
      const timesheetsTab = this.page.getByRole('link', { name: 'Timesheets' });
      const chargesHoursTab = this.page.getByRole('link', { name: 'Charges/Hours' });
      await billabilityTab.waitFor({ state: 'visible', timeout: 10000 });
      await timesheetsTab.waitFor({ state: 'visible', timeout: 5000 });
      await chargesHoursTab.waitFor({ state: 'visible', timeout: 5000 });
      // No Bill Rate tab for analyst
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns the text of each tab link on the Reports horizontal tab bar.
   */
  async getPeopleTabLabels(): Promise<string[]> {
    await this.tabList.waitFor({ state: 'visible', timeout: 15000 });
    const tabLinks = this.page.locator('.tab-link');
    const count = await tabLinks.count();
    const labels: string[] = [];
    for (let i = 0; i < count; i++) {
      labels.push(((await tabLinks.nth(i).textContent()) ?? '').trim());
    }
    return labels;
  }

  /**
   * Returns the text label of the currently active tab on the Reports page.
   */
  async getActiveTabLabel(): Promise<string> {
    const activeTabLink = this.page.locator('li.active .tab-link');
    await activeTabLink.waitFor({ state: 'visible', timeout: 10000 });
    return ((await activeTabLink.textContent()) ?? '').trim();
  }

  /**
   * Returns true if the named tab is currently the active tab.
   */
  async isTabActive(tabName: string): Promise<boolean> {
    const activeLabel = await this.getActiveTabLabel();
    return activeLabel === tabName;
  }
}
