import { Page, Locator } from '@playwright/test';
import { BasePage } from '../../base/BasePage';

export class ContactSupportPage extends BasePage {
  readonly contactSupportLink: Locator;
  readonly otherSectionLabel: Locator;

  constructor(page: Page) {
    super(page);
    this.contactSupportLink = page.getByRole('link', { name: /Contact Support/i });
    // The sidebar renders section headers in upper-case ("OTHER"), but be
    // case-insensitive so a UI tweak to "Other" does not break the suite.
    this.otherSectionLabel = page.getByText(/^Other$/i);
  }

  async isContactSupportLinkVisible(): Promise<boolean> {
    try {
      await this.contactSupportLink.waitFor({ state: 'visible', timeout: 15000 });
      return true;
    } catch {
      return false;
    }
  }

  async isContactSupportInOtherSection(): Promise<boolean> {
    try {
      await this.otherSectionLabel.waitFor({ state: 'visible', timeout: 15000 });
      return true;
    } catch {
      return false;
    }
  }

  async getContactSupportHref(): Promise<string | null> {
    return this.contactSupportLink.getAttribute('href');
  }
}
