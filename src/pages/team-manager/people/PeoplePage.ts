import { Locator, Page } from '@playwright/test';
import { BasePage } from '../../base/BasePage';

export class PeoplePage extends BasePage {

  readonly peopleButton: Locator;
  readonly peopleBillabilitySubMenu: Locator;
  readonly peopleTimesheetsSubMenu: Locator;
  readonly peopleChargesHoursSubMenu: Locator;
  readonly peopleBillRateSubMenu: Locator;
  readonly tabList: Locator;

  constructor(page: Page) {
    super(page);

    // Section toggle — "People" for most roles, "Reports" for the Analyst role.
    this.peopleButton = page.getByRole('button', { name: /People|Reports/ });

    // Scope to the People/Reports submenu by content: "Timesheets" is unique to it
    // (Business Comparison's submenu only has "Billability"), so this works regardless
    // of BC presence or order — including the Analyst layout (renamed "Reports", no BC).
    const peopleSubmenu = page.locator('.sidebar-submenu-dropDown')
      .filter({ has: page.locator('.dropdown-link', { hasText: 'Timesheets' }) });
    this.peopleBillabilitySubMenu = peopleSubmenu.locator('.dropdown-link', { hasText: 'Billability' });
    this.peopleTimesheetsSubMenu = peopleSubmenu.locator('.dropdown-link', { hasText: 'Timesheets' });
    this.peopleChargesHoursSubMenu = peopleSubmenu.locator('.dropdown-link', { hasText: 'Charges/Hours' });
    this.peopleBillRateSubMenu = peopleSubmenu.locator('.dropdown-link', { hasText: 'Bill Rate' });

    // The horizontal tab list rendered on People sub-pages (Billability, Timesheets, etc.)
    // Each tab is a <link> element inside a <list>
    this.tabList = page.getByRole('list').filter({ has: page.getByRole('link', { name: 'Billability' }) });
  }

  /**
   * Ensures the People sub-menu is expanded in the left sidebar.
   * The menu starts expanded by default on page load; clicking it toggles (collapses) it.
   * This method only clicks if the sub-menu is NOT currently visible, so calling it
   * always leaves the menu in an open state.
   */
  async clickPeopleButton(): Promise<void> {
    // Wait for the sidebar People button to be present in the DOM before acting.
    await this.peopleButton.waitFor({ state: 'visible', timeout: 15000 });

    // Open only if the People/Reports submenu (the one containing "Timesheets")
    // isn't already shown. When collapsed its container is removed from the DOM.
    const peopleSubmenu = this.page.locator('.sidebar-submenu-dropDown')
      .filter({ has: this.page.locator('.dropdown-link', { hasText: 'Timesheets' }) });

    if (!(await peopleSubmenu.isVisible().catch(() => false))) {
      await this.peopleButton.click();
      await peopleSubmenu.waitFor({ state: 'visible', timeout: 10000 });
    }
  }

  /**
   * Returns true if the People sidebar sub-menu is visible
   * (i.e. all four sub-items are in the DOM and visible).
   */
  async isPeopleSubMenuVisible(): Promise<boolean> {
    try {
      await this.peopleBillabilitySubMenu.waitFor({ state: 'visible', timeout: 10000 });
      await this.peopleTimesheetsSubMenu.waitFor({ state: 'visible', timeout: 5000 });
      await this.peopleChargesHoursSubMenu.waitFor({ state: 'visible', timeout: 5000 });
      await this.peopleBillRateSubMenu.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns the text labels of every visible People sidebar sub-menu button.
   */
  async getPeopleSubMenuOptions(): Promise<string[]> {
    await this.peopleBillabilitySubMenu.waitFor({ state: 'visible', timeout: 10000 });
    const buttons = [
      this.peopleBillabilitySubMenu,
      this.peopleTimesheetsSubMenu,
      this.peopleChargesHoursSubMenu,
      this.peopleBillRateSubMenu,
    ];
    const labels: string[] = [];
    for (const btn of buttons) {
      labels.push(((await btn.textContent()) ?? '').trim());
    }
    return labels;
  }

  /**
   * Clicks the "Billability" sub-menu option under the People section.
   */
  async clickBillabilitySubMenu(): Promise<void> {
    await this.peopleBillabilitySubMenu.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Hovers over the People icon button in the left sidebar.
   * The sub-menu is already open by default on page load; hovering ensures
   * the sub-menu is visible before subsequent clicks.
   */
  async hoverOverPeopleIcon(): Promise<void> {
    await this.peopleButton.waitFor({ state: 'visible', timeout: 15000 });
    await this.peopleButton.hover();
    // Ensure the People sub-menu container is visible after hover
    await this.peopleBillabilitySubMenu.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Clicks a named sub-menu item in the People section of the sidebar.
   * @param itemName - The visible text of the sub-menu item (e.g. "Billability", "Timesheets")
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
   * Returns true if the horizontal tab list on the People page is visible and
   * contains all four expected tab labels.
   */
  async arePeopleTabsVisible(): Promise<boolean> {
    try {
      await this.tabList.waitFor({ state: 'visible', timeout: 15000 });
      const billabilityTab = this.page.getByRole('link', { name: 'Billability' });
      const timesheetsTab = this.page.getByRole('link', { name: 'Timesheets' });
      const chargesHoursTab = this.page.getByRole('link', { name: 'Charges/Hours' });
      const billRateTab = this.page.getByRole('link', { name: 'Bill Rate' });
      await billabilityTab.waitFor({ state: 'visible', timeout: 10000 });
      await timesheetsTab.waitFor({ state: 'visible', timeout: 5000 });
      await chargesHoursTab.waitFor({ state: 'visible', timeout: 5000 });
      await billRateTab.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns the text of each tab link on the People horizontal tab bar.
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
   * Returns the text label of the currently active tab on the People page.
   * The active tab's parent <li> element carries the CSS class "active".
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
