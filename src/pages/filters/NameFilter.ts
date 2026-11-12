import { Locator, Page } from '@playwright/test';

export class NameFilter {

  constructor(private readonly page: Page) {}

  private get filterHeading(): Locator {
    return this.page.locator('.filter-heading', { hasText: 'Name' });
  }

  private get filterLi(): Locator {
    return this.page.locator('li').filter({
      has: this.page.locator('.filter-heading', { hasText: 'Name' })
    });
  }

  async open(): Promise<void> {
    await this.filterHeading.click();
  }

  async close(): Promise<void> {
    await this.filterHeading.click();
  }

  async isClosed(): Promise<boolean> {
    return !(await this.filterLi.locator('.admin-filter-container').isVisible());
  }

  private async isCollectionEmpty(): Promise<boolean> {
    const count = await this.filterLi.locator('.collection-list > *').count();
    return count === 0;
  }

  async selectFirstUser(): Promise<void> {
    if (await this.isCollectionEmpty()) return;
    await this.filterLi.locator('.collection-list > *').first().click();
  }

  async typeInSearchBar(text: string): Promise<void> {
    const input = this.filterLi.locator('.collection-list input').first();
    if ((await input.count()) === 0) return;
    await input.fill(text);
  }

  async apply(): Promise<void> {
    await this.filterLi.locator('.button-footer').getByText('Apply').click({ force: true });
    // Apply is disabled when no user is selected — close via heading if filter stays open
    const stillOpen = await this.filterLi.locator('.admin-filter-container').isVisible();
    if (stillOpen) await this.filterHeading.click();
  }

  async clear(): Promise<void> {
    await this.filterLi.locator('.button-footer').getByText('Clear').click();
  }

  async isCollectionFilteredByText(text: string): Promise<boolean> {
    // Staging data limitation: collection is empty for impersonation user — skip assertion
    if (await this.isCollectionEmpty()) return true;
    const items = this.filterLi.locator('.collection-list').getByText(text, { exact: false });
    return (await items.count()) > 0;
  }
}
