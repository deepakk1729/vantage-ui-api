import { Locator, Page } from '@playwright/test';


export class BaseFilter {

  constructor(
    protected page: Page,
    protected filterName: string
  ) {}

  get filterHeader(): Locator {

    return this.page.locator(
      '.filter-heading',
      {
        hasText: this.filterName
      }
    );
  }

  async open(): Promise<void> {

    await this.filterHeader.click();
  }

  getOption(option: string): Locator {

    return this.page.locator(
      'label.reactCustomCheckbox',
      {
        hasText: option
      }
    ).locator('input');
  }

  async select(option: string): Promise<void> {

    await this.getOption(option).check({
      force: true
    });
  }

  async clear(): Promise<void> {

    await this.page.locator('.button-footer .clear').click();
  }

  async apply(): Promise<void> {

    await this.page.locator('.button-footer .apply').click();
  }

  async close(): Promise<void> {

    await this.filterHeader.click();
  }
}