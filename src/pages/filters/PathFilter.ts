import { Page } from '@playwright/test';
import { BaseFilter } from './BaseFilter';

export class PathFilter extends BaseFilter {

  constructor(page: Page) {
    super(page, 'Path');
  }

  getOption(option: string) {
    return this.page
      .locator('.filter-display', { hasText: option })
      .locator('input[type="checkbox"]');
  }

  async select(option: string): Promise<void> {
    await this.getOption(option).click();
  }

  async isOptionVisible(option: string): Promise<boolean> {
    return this.page
      .locator('.filter-display', { hasText: option })
      .isVisible();
  }

  async isClosed(): Promise<boolean> {
    const isOpen = await this.page
      .locator('.filter-heading', { hasText: this.filterName })
      .evaluate(el => {
        const li = el.closest('li');
        return li ? li.querySelector('.filter-container') !== null : false;
      });
    return !isOpen;
  }

  private get selectedCountBadge() {
    return this.page
      .locator('.filter-heading', { hasText: 'Path' })
      .locator('.selected-count');
  }

  async isSelectionApplied(): Promise<boolean> {
    return this.selectedCountBadge.isVisible();
  }
}
