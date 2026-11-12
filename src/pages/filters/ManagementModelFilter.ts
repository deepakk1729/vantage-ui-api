import { Page } from '@playwright/test';
import { BaseFilter } from './BaseFilter';

export class ManagementModelFilter extends BaseFilter {

  constructor(page: Page) {
    super(page, 'Management Model');
  }

  async select(option: string): Promise<void> {
    // Management Model uses native checkboxes inside .filter-display rows.
    // Structure: <div class="filter-display"><div class="kt-m-checkbox"><input/></div><div class="filter-name">PA Managed</div></div>
    const row = this.page
      .locator('.filter-display')
      .filter({ has: this.page.locator('.filter-name', { hasText: option }) });
    await row.locator('input[type="checkbox"]').check({ force: true });
  }

  async isOptionVisible(option: string): Promise<boolean> {
    return this.page
      .locator('.filter-display', { hasText: option })
      .isVisible();
  }

  private get selectedCountBadge() {
    return this.page
      .locator('.filter-heading', { hasText: 'Management Model' })
      .locator('.selected-count');
  }

  async isSelectionApplied(): Promise<boolean> {
    return this.selectedCountBadge.isVisible();
  }
}
