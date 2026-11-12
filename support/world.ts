import { IWorldOptions, setWorldConstructor, World } from '@cucumber/cucumber';
import { APIResponse } from '@playwright/test';
import { Browser, BrowserContext, Page } from 'playwright';

import { ApiClient } from '../src/api/clients/ApiClient';
import { HomePage } from '../src/pages/superadmin/home/HomePage';
import { ContactSupportPage } from '../src/pages/superadmin/home/ContactSupportPage';
import { BillabilityPage } from '../src/pages/superadmin/people/BillabilityPage';
import { BillRatePage } from '../src/pages/superadmin/people/BillRatePage';
import { ChargesHoursPage } from '../src/pages/superadmin/people/ChargesHoursPage';
import { TimesheetsPage } from '../src/pages/superadmin/people/TimesheetsPage';
import { PeoplePage } from '../src/pages/superadmin/people/PeoplePage';
import { BillabilityPage as BcBillabilityPage } from '../src/pages/superadmin/businessComparison/BillabilityPage';
import { LoginPage } from '../src/pages/login/LoginPage';

// Business Leader page objects (own copies — role-owned per the per-role folder layout).
import { HomePage as BlHomePage } from '../src/pages/business-leader/home/HomePage';
import { ContactSupportPage as BlContactSupportPage } from '../src/pages/business-leader/home/ContactSupportPage';
import { BillabilityPage as BlBillabilityPage } from '../src/pages/business-leader/people/BillabilityPage';
import { BillRatePage as BlBillRatePage } from '../src/pages/business-leader/people/BillRatePage';
import { ChargesHoursPage as BlChargesHoursPage } from '../src/pages/business-leader/people/ChargesHoursPage';
import { TimesheetsPage as BlTimesheetsPage } from '../src/pages/business-leader/people/TimesheetsPage';
import { PeoplePage as BlPeoplePage } from '../src/pages/business-leader/people/PeoplePage';
import { BillabilityPage as BlBcBillabilityPage } from '../src/pages/business-leader/businessComparison/BillabilityPage';

// Topic Manager page objects (own copies — role-owned per the per-role folder layout).
import { HomePage as TmHomePage } from '../src/pages/topic-manager/home/HomePage';
import { ContactSupportPage as TmContactSupportPage } from '../src/pages/topic-manager/home/ContactSupportPage';
import { BillabilityPage as TmBillabilityPage } from '../src/pages/topic-manager/people/BillabilityPage';
import { BillRatePage as TmBillRatePage } from '../src/pages/topic-manager/people/BillRatePage';
import { ChargesHoursPage as TmChargesHoursPage } from '../src/pages/topic-manager/people/ChargesHoursPage';
import { TimesheetsPage as TmTimesheetsPage } from '../src/pages/topic-manager/people/TimesheetsPage';
import { PeoplePage as TmPeoplePage } from '../src/pages/topic-manager/people/PeoplePage';
import { BillabilityPage as TmBcBillabilityPage } from '../src/pages/topic-manager/businessComparison/BillabilityPage';

// Analyst page objects (own copies — role-owned per the per-role folder layout).
import { HomePage as AnHomePage } from '../src/pages/analyst/home/HomePage';
import { ContactSupportPage as AnContactSupportPage } from '../src/pages/analyst/home/ContactSupportPage';
import { PeoplePage as AnPeoplePage } from '../src/pages/analyst/people/PeoplePage';
import { BillabilityPage as AnBillabilityPage } from '../src/pages/analyst/people/BillabilityPage';
import { TimesheetsPage as AnTimesheetsPage } from '../src/pages/analyst/people/TimesheetsPage';
import { ChargesHoursPage as AnChargesHoursPage } from '../src/pages/analyst/people/ChargesHoursPage';

// Team Manager page objects (own copies — role-owned per the per-role folder layout).
import { HomePage as TeamHomePage } from '../src/pages/team-manager/home/HomePage';
import { BillabilityPage as TeamBillabilityPage } from '../src/pages/team-manager/people/BillabilityPage';
import { BillRatePage as TeamBillRatePage } from '../src/pages/team-manager/people/BillRatePage';
import { ChargesHoursPage as TeamChargesHoursPage } from '../src/pages/team-manager/people/ChargesHoursPage';
import { TimesheetsPage as TeamTimesheetsPage } from '../src/pages/team-manager/people/TimesheetsPage';
import { PeoplePage as TeamPeoplePage } from '../src/pages/team-manager/people/PeoplePage';


import { ENV } from '../src/utils/env';
import { shouldSkipReload } from './impersonation';

/**
 * PlaywrightWorld
 * Shared state container for each scenario
 */
export class PlaywrightWorld extends World {

  // Playwright core
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;

  // Page Objects
  homePage!: HomePage;
  contactSupportPage!: ContactSupportPage;
  billabilityPage!: BillabilityPage;
  billRatePage!: BillRatePage;
  chargesHoursPage!: ChargesHoursPage;
  timesheetsPage!: TimesheetsPage;
  bcBillabilityPage!: BcBillabilityPage;
  loginPage!: LoginPage;
  peoplePage!: PeoplePage;

  // Misc shared state
  newTab?: Page;
  knMaterialTileState?: string;
  rmsCTSatisfactionTileState?: string;
  topClientsTileState?: string;
  topProjectsTileState?: string;
  timesheetTileState?: string;

  // API
  apiClient?: ApiClient;
  apiResponse?: APIResponse;
  apiResponseBody?: unknown;
  apiResponseTimeMs?: number;
  createdUserFilterName?: string;

  // Environment
  env = ENV;

  constructor(options: IWorldOptions) {
    super(options);
  }

  /**
   * Initialize page objects AFTER page creation
   */
  initPages() {
    // Role-aware: each role owns its page objects (src/pages/<role>/...). The active
    // role comes from the cucumber profile (worldParameters.role) → ROLE env fallback →
    // superadmin. LoginPage is shared (role-agnostic, pre-impersonation).
    const role = (this.parameters as { role?: string })?.role ?? process.env.ROLE ?? 'superadmin';

    if (role === 'business-leader') {
      // Business Leader owns structurally-identical copies of the page objects; the
      // World fields are typed to the superadmin (canonical) classes, which are
      // nominally distinct only because of `private` members. The casts are safe
      // (identical public API); revisit with role-typed fields if a role's page
      // object ever diverges in its public surface.
      this.homePage = new BlHomePage(this.page) as unknown as HomePage;
      this.contactSupportPage = new BlContactSupportPage(this.page) as unknown as ContactSupportPage;
      this.billabilityPage = new BlBillabilityPage(this.page) as unknown as BillabilityPage;
      this.billRatePage = new BlBillRatePage(this.page) as unknown as BillRatePage;
      this.chargesHoursPage = new BlChargesHoursPage(this.page) as unknown as ChargesHoursPage;
      this.timesheetsPage = new BlTimesheetsPage(this.page) as unknown as TimesheetsPage;
      this.bcBillabilityPage = new BlBcBillabilityPage(this.page) as unknown as BcBillabilityPage;
      this.peoplePage = new BlPeoplePage(this.page) as unknown as PeoplePage;
    } else if (role === 'topic-manager') {
      this.homePage = new TmHomePage(this.page) as unknown as HomePage;
      this.contactSupportPage = new TmContactSupportPage(this.page) as unknown as ContactSupportPage;
      this.billabilityPage = new TmBillabilityPage(this.page) as unknown as BillabilityPage;
      this.billRatePage = new TmBillRatePage(this.page) as unknown as BillRatePage;
      this.chargesHoursPage = new TmChargesHoursPage(this.page) as unknown as ChargesHoursPage;
      this.timesheetsPage = new TmTimesheetsPage(this.page) as unknown as TimesheetsPage;
      this.bcBillabilityPage = new TmBcBillabilityPage(this.page) as unknown as BcBillabilityPage;
      this.peoplePage = new TmPeoplePage(this.page) as unknown as PeoplePage;
    } else if (role === 'analyst') {
      // Analyst (Abraham, Ruth): personal-only view, Reports sidebar, 2 filters, no BC, no Bill Rate.
      this.homePage = new AnHomePage(this.page) as unknown as HomePage;
      this.contactSupportPage = new AnContactSupportPage(this.page) as unknown as ContactSupportPage;
      this.billabilityPage = new AnBillabilityPage(this.page) as unknown as BillabilityPage;
      // Analyst has no Bill Rate page — use superadmin's as a placeholder (never navigated to)
      this.billRatePage = new BillRatePage(this.page);
      this.chargesHoursPage = new AnChargesHoursPage(this.page) as unknown as ChargesHoursPage;
      this.timesheetsPage = new AnTimesheetsPage(this.page) as unknown as TimesheetsPage;
      // Analyst has no Business Comparison — use superadmin's as a placeholder (never navigated to)
      this.bcBillabilityPage = new BcBillabilityPage(this.page);
      this.peoplePage = new AnPeoplePage(this.page) as unknown as PeoplePage;
    } else if (role === 'team-manager') {
      this.homePage = new TeamHomePage(this.page) as unknown as HomePage;
      this.billabilityPage = new TeamBillabilityPage(this.page) as unknown as BillabilityPage;
      this.billRatePage = new TeamBillRatePage(this.page) as unknown as BillRatePage;
      this.chargesHoursPage = new TeamChargesHoursPage(this.page) as unknown as ChargesHoursPage;
      this.timesheetsPage = new TeamTimesheetsPage(this.page) as unknown as TimesheetsPage;
      this.peoplePage = new TeamPeoplePage(this.page) as unknown as PeoplePage;
    } else {
      this.homePage = new HomePage(this.page);
      this.contactSupportPage = new ContactSupportPage(this.page);
      this.billabilityPage = new BillabilityPage(this.page);
      this.billRatePage = new BillRatePage(this.page);
      this.chargesHoursPage = new ChargesHoursPage(this.page);
      this.timesheetsPage = new TimesheetsPage(this.page);
      this.bcBillabilityPage = new BcBillabilityPage(this.page);
      this.peoplePage = new PeoplePage(this.page);
    }

    this.loginPage = new LoginPage(this.page);
  }

  /**
   * Navigates to a URL with retry logic for transient network errors.
   * Retries up to 3 times with exponential backoff (500ms → 1s → 2s).
   * @param url URL to navigate to
   * @param options Navigation options (waitUntil, timeout, etc.)
   */
  async gotoWithRetry(
    url: string,
    options?: { waitUntil?: 'commit' | 'domcontentloaded' | 'load' | 'networkidle'; timeout?: number }
  ): Promise<void> {
    // Skip reload if already on this URL as the active role (keeps impersonation).
    if (await shouldSkipReload(this.page, url)) return;

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000, ...options });
        return; // Success
      } catch (error) {
        lastError = error as Error;
        const msg = lastError.message ?? '';
        const isConnectionError =
          msg.includes('net::ERR_CONNECTION_CLOSED') ||
          msg.includes('net::ERR_NETWORK_CHANGED') ||
          msg.includes('net::ERR_SOCKET_NOT_CONNECTED') ||
          // Transient navigation race: the initial load hit Chrome's error page
          // (network/redirect blip) and a second navigation interrupted goto().
          // Re-navigating almost always succeeds, so treat it as retryable.
          msg.includes('chrome-error://chromewebdata') ||
          msg.includes('interrupted by another navigation');

        if (!isConnectionError || attempt === maxRetries) {
          throw lastError; // Not a retryable error or last attempt
        }

        // Exponential backoff: 500ms → 1s → 2s
        const delayMs = 500 * Math.pow(2, attempt - 1);
        console.warn(
          `⚠ Attempt ${attempt}/${maxRetries}: ${lastError.message}. ` +
          `Retrying in ${delayMs}ms...`
        );
        await this.page.waitForTimeout(delayMs);
      }
    }

    throw lastError; // Should never reach here, but for type safety
  }
}

setWorldConstructor(PlaywrightWorld);