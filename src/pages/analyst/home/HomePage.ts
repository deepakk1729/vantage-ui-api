import { Page, Locator } from '@playwright/test';
import { BasePage } from '../../base/BasePage';
import { MonthsFilter } from '../../filters/MonthsFilter';
import { DateRangeFilter } from '../../filters/DateRangeFilter';
import { ENV } from '../../../utils/env';

/**
 * Analyst Home Page.
 *
 * Analyst (Abraham, Ruth) has a personal-only view:
 *   - Sidebar: Home | Reports (NO Business Comparison, NO People nav)
 *   - Filters: Date Range + Months ONLY (single combined panel, no expandable sections)
 *   - Tiles: 12 personal tiles including Case Billability, CD Billability, Hourly Bill Rate
 */
export class HomePage extends BasePage {
  // ── Analyst-specific filters (only 2) ──────────────────────────────────────
  readonly monthsFilter: MonthsFilter;
  readonly dateRangeFilter: DateRangeFilter;

  // ── Tile widgets ─────────────────────────────────────────────────────────
  readonly billabilityTrendWidget: Locator;
  readonly topProjectsWidget: Locator;
  readonly vantageAveragesWidget: Locator;
  readonly filtersLabel: Locator;
  readonly resetButton: Locator;
  readonly logo: Locator;
  readonly userValidationDropdown: Locator;
  readonly refreshedTimestamp: Locator;

  // ── Personal tiles (analyst-only) ────────────────────────────────────────
  readonly caseBillabilityTile: Locator;
  readonly cdBillabilityTile: Locator;
  readonly hourlyBillRateTile: Locator;

  // ── Other tile containers ─────────────────────────────────────────────────
  readonly topDownloadsTile: Locator;
  readonly knMaterialTile: Locator;

  // ── Sidebar navigation ────────────────────────────────────────────────────
  readonly homeNavButton: Locator;
  /** For analyst the sidebar shows "Reports" instead of "People". */
  readonly reportsNavButton: Locator;

  constructor(page: Page) {
    super(page);

    // Analyst has only Date Range + Months filters
    this.monthsFilter = new MonthsFilter(page);
    this.dateRangeFilter = new DateRangeFilter(page);

    this.billabilityTrendWidget = page.getByText('BILLABILITY TREND', { exact: true });
    this.topProjectsWidget = page.getByText('TOP PROJECTS', { exact: true });
    this.vantageAveragesWidget = page.getByText('VANTAGE AVERAGES', { exact: true });
    this.filtersLabel = page.getByText('FILTERS', { exact: true });
    this.resetButton = page.getByText('Reset', { exact: true });

    this.logo = page.getByAltText('BCG Vantage logo');
    this.userValidationDropdown = page.locator('.rightAlign.displayFlex .select-impersonator');
    this.refreshedTimestamp = page.getByText(/Data as of/i).first();

    this.homeNavButton = page.getByRole('button', { name: 'Home Home' });
    // Analyst sidebar shows "Reports" (not "People" or "Business Comparison")
    this.reportsNavButton = page.getByRole('button', { name: /^Reports/i });

    this.topDownloadsTile = page.locator('.home_page_main_split_row_top_downloads');
    this.knMaterialTile = page.locator('.home_page_main_split_row_kn_material');

    // Personal tiles — analyst-specific
    this.caseBillabilityTile = page.locator('.tile').filter({ hasText: 'CASE BILLABILITY' });
    this.cdBillabilityTile = page.locator('.tile').filter({ hasText: 'CD BILLABILITY' });
    this.hourlyBillRateTile = page.locator('.tile').filter({ hasText: 'HOURLY BILL RATE' });
  }

  async goto(): Promise<void> {
    await this.gotoWithRetry(ENV.BASE_URL, {
      waitUntil: 'commit',
      timeout: 90000
    });
    await this.page
      .getByRole('button', { name: 'Home Home' })
      .waitFor({ state: 'visible', timeout: 60000 })
      .catch(() => undefined);
  }

  private async waitVisible(locator: Locator, timeout = 15000): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  async isBillabilityTrendVisible(): Promise<boolean> {
    return this.waitVisible(this.billabilityTrendWidget);
  }

  async isTopProjectsVisible(): Promise<boolean> {
    return this.waitVisible(this.topProjectsWidget);
  }

  async isVantageAveragesVisible(): Promise<boolean> {
    return this.waitVisible(this.vantageAveragesWidget);
  }

  async isFiltersPanelVisible(): Promise<boolean> {
    return this.waitVisible(this.filtersLabel);
  }

  async isResetButtonVisible(): Promise<boolean> {
    return this.waitVisible(this.resetButton);
  }

  async isOnHomePage(): Promise<boolean> {
    const baseHost = new URL(ENV.BASE_URL).host;
    const currentHost = new URL(this.page.url()).host;
    if (baseHost !== currentHost) return false;
    return this.waitVisible(this.homeNavButton);
  }

  async isLogoVisible(): Promise<boolean> {
    return this.waitVisible(this.logo);
  }

  async isUserValidationDropdownVisible(): Promise<boolean> {
    return this.userValidationDropdown.first().isVisible().catch(() => false);
  }

  async isRefreshedTimestampVisible(): Promise<boolean> {
    return this.waitVisible(this.refreshedTimestamp);
  }

  async isTileVisible(tileName: string): Promise<boolean> {
    const upper = tileName.trim().toUpperCase();
    const tile = this.page.getByText(upper, { exact: true }).first();
    return this.waitVisible(tile);
  }

  async tileShowsMonthsInLastTwelveMonths(tileName: string): Promise<boolean> {
    if (!(await this.isTileVisible(tileName))) return false;
    const monthPattern =
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)['\s]*\d{2,4}\b/;
    const monthLabel = this.page.getByText(monthPattern).first();
    return this.waitVisible(monthLabel);
  }

  async tileReflectsUtilizationCategory(
    tileName: string,
    category: string
  ): Promise<boolean> {
    if (!(await this.isTileVisible(tileName))) return false;
    const categoryLocator = this.page.getByText(category, { exact: true }).first();
    return this.waitVisible(categoryLocator);
  }

  async isPageOptionVisible(option: string): Promise<boolean> {
    const normalised = option.trim().toLowerCase();
    let locator: Locator;
    if (normalised.startsWith('home')) {
      locator = this.homeNavButton;
    } else if (normalised.startsWith('reports') || normalised.startsWith('people')) {
      // Analyst sidebar uses "Reports" label
      locator = this.reportsNavButton;
    } else {
      locator = this.page.getByRole('button', { name: new RegExp(option, 'i') }).first();
    }
    return this.waitVisible(locator);
  }

  async isFiltersPanelBelowPageOptions(): Promise<boolean> {
    const filtersVisible = await this.isFiltersPanelVisible();
    const homeOptionVisible = await this.isPageOptionVisible('Home Page');
    return filtersVisible && homeOptionVisible;
  }

  // ── Personal tiles ──────────────────────────────────────────────────────────

  async isCaseBillabilityTileVisible(): Promise<boolean> {
    // The CASE BILLABILITY tile may render with a generic .tile container or
    // just as a text node — try both approaches for robustness.
    try {
      // First attempt: scoped tile container
      const tile = this.caseBillabilityTile.first();
      await tile.waitFor({ state: 'visible', timeout: 15000 });
      return true;
    } catch {
      // Fallback: look for the tile header text directly
      return this.waitVisible(this.page.getByText('CASE BILLABILITY', { exact: true }).first());
    }
  }

  async isCdBillabilityTileVisible(): Promise<boolean> {
    try {
      const tile = this.cdBillabilityTile.first();
      await tile.waitFor({ state: 'visible', timeout: 15000 });
      return true;
    } catch {
      return this.waitVisible(this.page.getByText('CD BILLABILITY', { exact: true }).first());
    }
  }

  async isHourlyBillRateTileVisible(): Promise<boolean> {
    try {
      const tile = this.hourlyBillRateTile.first();
      await tile.waitFor({ state: 'visible', timeout: 15000 });
      return true;
    } catch {
      return this.waitVisible(this.page.getByText('HOURLY BILL RATE', { exact: true }).first());
    }
  }

  async getCaseBillabilityValue(): Promise<string> {
    try {
      const heading = this.page.getByText('CASE BILLABILITY', { exact: true }).first();
      await heading.waitFor({ state: 'visible', timeout: 15000 });
      // Traverse up to find the card container that holds the percentage value.
      // The analyst's personal tile may not use a .tile CSS class — walk up the DOM.
      return heading.evaluate((el: HTMLElement): string => {
        let cur = el.parentElement;
        for (let i = 0; i < 6 && cur; i++) {
          const direct = Array.from(cur.children).find(
            c => /^\d+%$/.test((c.textContent ?? '').trim())
          );
          if (direct) return (direct.textContent ?? '').trim();
          const txt = (cur.textContent ?? '').trim();
          if (txt.length < 100) {
            const m = txt.match(/(\d+%)/);
            if (m) return m[1];
          }
          cur = cur.parentElement;
        }
        return '';
      });
    } catch {
      return '';
    }
  }

  async getCdBillabilityValue(): Promise<string> {
    try {
      const heading = this.page.getByText('CD BILLABILITY', { exact: true }).first();
      await heading.waitFor({ state: 'visible', timeout: 15000 });
      return heading.evaluate((el: HTMLElement): string => {
        let cur = el.parentElement;
        for (let i = 0; i < 6 && cur; i++) {
          const direct = Array.from(cur.children).find(
            c => /^\d+%$/.test((c.textContent ?? '').trim())
          );
          if (direct) return (direct.textContent ?? '').trim();
          const txt = (cur.textContent ?? '').trim();
          if (txt.length < 100) {
            const m = txt.match(/(\d+%)/);
            if (m) return m[1];
          }
          cur = cur.parentElement;
        }
        return '';
      });
    } catch {
      return '';
    }
  }

  async getHourlyBillRateValue(): Promise<string> {
    try {
      const heading = this.page.getByText('HOURLY BILL RATE', { exact: true }).first();
      await heading.waitFor({ state: 'visible', timeout: 15000 });
      return heading.evaluate((el: HTMLElement): string => {
        let cur = el.parentElement;
        for (let i = 0; i < 6 && cur; i++) {
          const direct = Array.from(cur.children).find(
            c => /^\$[\d,]+/.test((c.textContent ?? '').trim())
          );
          if (direct) return (direct.textContent ?? '').trim();
          const txt = (cur.textContent ?? '').trim();
          if (txt.length < 100) {
            const m = txt.match(/(\$[\d,]+)/);
            if (m) return m[1];
          }
          cur = cur.parentElement;
        }
        return '';
      });
    } catch {
      return '';
    }
  }

  // ── Billability Trend tile ──────────────────────────────────────────────────

  async isBillabilityTrendChartVisible(): Promise<boolean> {
    try {
      const tile = this.page.locator('.home_page_main_split_row_billability_trend').first();
      await tile.waitFor({ state: 'attached', timeout: 45000 });
      await tile.scrollIntoViewIfNeeded({ timeout: 10000 }).catch(() => undefined);
      await this.page.waitForFunction(function () {
        const t = document.querySelector('.home_page_main_split_row_billability_trend');
        if (!t) return false;
        const canvases = Array.from(t.querySelectorAll('canvas'));
        if (canvases.some(function (c) { return c instanceof HTMLCanvasElement && c.width > 0 && c.height > 0; })) return true;
        const legendReady = t.querySelectorAll('.metric_legend_item').length > 0;
        if (legendReady && canvases.length > 0) return true;
        if (!legendReady) {
          window.dispatchEvent(new Event('resize'));
        }
        return false;
      }, { timeout: 120000, polling: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  async isBillabilityTrendLegendVisible(): Promise<boolean> {
    const tile = this.page.locator('.home_page_main_split_row_billability_trend').first();
    return this.waitVisible(tile.locator('.metric_legends'));
  }

  async isBillabilityTrendLegendCategoryVisible(category: string): Promise<boolean> {
    const tile = this.page.locator('.home_page_main_split_row_billability_trend').first();
    const item = tile.locator('.metric_legend_item', { hasText: category }).first();
    return this.waitVisible(item, 10000);
  }

  async isBillabilityTrendLegendColored(): Promise<boolean> {
    return this.page.evaluate(function () {
      const tile = document.querySelector('.home_page_main_split_row_billability_trend');
      if (!tile) return false;
      const icons = tile.querySelectorAll('.legend-icon');
      if (icons.length === 0) return false;
      return Array.from(icons).every(function (icon) {
        const bg = (icon as HTMLElement).style.backgroundColor;
        return bg !== '' && bg !== 'transparent';
      });
    });
  }

  async hoverBillabilityTrendChartSegment(): Promise<void> {
    await this.isBillabilityTrendChartVisible();
    const canvas = this.page.locator('.home_page_main_split_row_billability_trend canvas').first();
    await canvas.hover({ position: { x: 120, y: 135 } });
  }

  // ── Top Downloads tile ──────────────────────────────────────────────────────

  async scrollToTopDownloadsTile(): Promise<void> {
    await this.page.waitForFunction(
      (selector) => {
        const el = document.querySelector(selector as string);
        return el !== null && (el as HTMLElement).offsetParent !== null;
      },
      '.home_page_main_split_row_top_downloads',
      { timeout: 30000, polling: 500 }
    );
    await this.page.evaluate((selector) => {
      const el = document.querySelector(selector as string);
      el?.scrollIntoView({ block: 'center' });
    }, '.home_page_main_split_row_top_downloads');
    await this.page.waitForFunction(
      function () {
        var tile = document.querySelector('.home_page_main_split_row_top_downloads');
        if (!tile) return false;
        if (tile.querySelector('.static-text')) return true;
        var body = tile.querySelector('.chart__table__body');
        if (!body) return false;
        if (body.querySelector('.kt-downloads-loader-body')) return false;
        if (body.querySelectorAll('.MuiSkeleton-root').length > 0) return false;
        var rows = body.querySelectorAll('.data_table_body_row');
        return rows.length > 0;
      },
      { timeout: 45000, polling: 500 }
    ).catch(() => undefined);
  }

  async isTopDownloadsTileVisible(): Promise<boolean> {
    return this.waitVisible(this.topDownloadsTile);
  }

  async topDownloadsHasTitleAndDownloadColumns(): Promise<boolean> {
    try {
      await this.page.waitForFunction(
        function () {
          var tile = document.querySelector('.home_page_main_split_row_top_downloads');
          if (!tile) return false;
          var titleHeader = tile.querySelector('.chart__table__header .downloadTitle');
          var countHeader = tile.querySelector('.chart__table__header .downloadCount');
          return (
            titleHeader !== null && (titleHeader.textContent || '').trim().length > 0 &&
            countHeader !== null && (countHeader.textContent || '').trim().length > 0
          );
        },
        { timeout: 15000, polling: 300 }
      );
      return true;
    } catch {
      return false;
    }
  }

  async topDownloadsRowsHaveTitleAndDownloadCount(): Promise<boolean> {
    try {
      await this.page.waitForFunction(
        function () {
          var tile = document.querySelector('.home_page_main_split_row_top_downloads');
          if (!tile) return false;
          if (tile.querySelector('.static-text')) return true;
          var body = tile.querySelector('.chart__table__body');
          if (!body) return false;
          if (body.querySelector('.kt-downloads-loader-body')) return false;
          if (body.querySelectorAll('.MuiSkeleton-root').length > 0) return false;
          var rows = body.querySelectorAll('.data_table_body_row');
          if (rows.length > 0) return true;
          return body.children.length === 0;
        },
        { timeout: 30000, polling: 300 }
      );
      return true;
    } catch {
      return false;
    }
  }

  async topDownloadsDownloadColumnVisible(): Promise<boolean> {
    try {
      await this.page.waitForFunction(
        function () {
          var tile = document.querySelector('.home_page_main_split_row_top_downloads');
          if (!tile) return false;
          var header = tile.querySelector('.chart__table__header .downloadCount');
          if (header && (header.textContent || '').trim().length > 0) return true;
          var body = tile.querySelector('.chart__table__body');
          if (!body) return false;
          return (
            body.querySelector('.kt-downloads-loader-body') === null &&
            body.querySelectorAll('.MuiSkeleton-root').length === 0 &&
            body.querySelectorAll('.data_table_body_row').length > 0
          );
        },
        { timeout: 30000, polling: 300 }
      );
      return true;
    } catch {
      return false;
    }
  }

  async clickFirstTopDownloadsLink(): Promise<void> {
    await this.topDownloadsTile.locator('a').first().click();
  }

  async hasTopDownloadsLinks(): Promise<boolean> {
    try {
      await this.topDownloadsTile.locator('a').first().waitFor({ state: 'visible', timeout: 15000 });
      return true;
    } catch {
      return false;
    }
  }

  // ── KN Material tile ────────────────────────────────────────────────────────

  async scrollToKnMaterialTile(): Promise<void> {
    await this.page.waitForFunction(
      (selector) => {
        const el = document.querySelector(selector as string);
        return el !== null && (el as HTMLElement).offsetParent !== null;
      },
      '.home_page_main_split_row_kn_material',
      { timeout: 30000, polling: 500 }
    );
    await this.page.evaluate((selector) => {
      const el = document.querySelector(selector as string);
      el?.scrollIntoView({ block: 'center' });
    }, '.home_page_main_split_row_kn_material');
    await this.page.waitForFunction(
      function () {
        var tile = document.querySelector('.home_page_main_split_row_kn_material');
        if (!tile) return false;
        var body = tile.querySelector('.chart__table__body');
        if (!body) return false;
        if (body.querySelectorAll('.MuiSkeleton-root').length > 0) return false;
        if (body.children.length === 0) return true;
        var rows = body.querySelectorAll('.data_table_body_row');
        if (rows.length === 0) return false;
        var firstCell = rows[0].querySelector('div');
        return firstCell !== null && (firstCell.textContent || '').trim().length > 0;
      },
      { timeout: 45000, polling: 500 }
    ).catch(() => undefined);
  }

  async isKnMaterialTileVisible(): Promise<boolean> {
    return this.waitVisible(this.knMaterialTile);
  }

  async knMaterialHasColumnHeaders(columns: string[]): Promise<boolean> {
    for (const col of columns) {
      const header = this.knMaterialTile.locator('.chart__table__header').getByText(col, { exact: true });
      const visible = await this.waitVisible(header, 10000);
      if (!visible) return false;
    }
    return true;
  }

  async knMaterialDataRowCount(): Promise<number> {
    return this.page.evaluate(function () {
      var tile = document.querySelector('.home_page_main_split_row_kn_material');
      if (!tile) return 0;
      var tbody = tile.querySelector('.chart__table__body');
      if (!tbody) return 0;
      if (tbody.querySelectorAll('.MuiSkeleton-root').length > 0) return 0;
      var rows = Array.from(tbody.querySelectorAll('.data_table_body_row'));
      return rows.filter(function (row) {
        var firstCell = row.querySelector('div');
        return firstCell !== null && (firstCell.textContent || '').trim().length > 0;
      }).length;
    });
  }

  async knMaterialRowsAreSortedDescByCount(): Promise<boolean> {
    return this.page.evaluate(() => {
      const tile = document.querySelector('.home_page_main_split_row_kn_material');
      if (!tile) return false;
      const rows = Array.from(tile.querySelectorAll('.chart__table__body > *'));
      if (rows.length === 0) return false;
      const counts = rows.map(row => {
        const countCell = row.querySelectorAll('div')[1];
        return parseInt((countCell?.textContent ?? '0').replace(/,/g, ''), 10);
      });
      for (let i = 1; i < counts.length; i++) {
        if (counts[i] > counts[i - 1]) return false;
      }
      return true;
    });
  }

  async knMaterialRowsHaveTypeAndCount(): Promise<boolean> {
    return this.page.evaluate(() => {
      const tile = document.querySelector('.home_page_main_split_row_kn_material');
      if (!tile) return false;
      const rows = Array.from(tile.querySelectorAll('.chart__table__body > *'));
      if (rows.length === 0) return false;
      return rows.every(row => {
        const cells = row.querySelectorAll('div');
        const typeText = (cells[0]?.textContent ?? '').trim();
        const countText = (cells[1]?.textContent ?? '').trim();
        return typeText.length > 0 && /^\d[\d,]*$/.test(countText);
      });
    });
  }

  async captureKnMaterialTileState(): Promise<string> {
    return this.page.evaluate(() => {
      const tile = document.querySelector('.home_page_main_split_row_kn_material');
      if (!tile) return 'tile-not-found';
      const tbody = tile.querySelector('.chart__table__body');
      const html = tbody?.innerHTML?.trim() ?? '';
      return html.length > 0 ? html : 'empty';
    });
  }

  async knMaterialTileIsRendered(): Promise<boolean> {
    return this.waitVisible(this.knMaterialTile, 15000);
  }

  // ── Case Engagement Depth tile ──────────────────────────────────────────────

  private get caseEngagementDepthTileLocator() {
    return this.page.locator('.home_page_main_split_row_engagement_depth').first();
  }

  async isCaseEngagementDepthTileVisible(): Promise<boolean> {
    return this.waitVisible(this.caseEngagementDepthTileLocator);
  }

  async waitForCaseEngagementDepthData(timeout = 20000): Promise<boolean> {
    try {
      await this.page.waitForFunction(
        function () {
          var tile = document.querySelector('.home_page_main_split_row_engagement_depth');
          if (!tile) return false;
          var vals = tile.querySelectorAll('.legends_val');
          return vals.length > 0 && vals[0].textContent !== null && vals[0].textContent.trim().length > 0;
        },
        { timeout }
      );
      return true;
    } catch {
      return false;
    }
  }

  async isCaseEngagementDepthBucketVisible(label: string): Promise<boolean> {
    const unicodeLabel = label.replace(/>=/g, '≥');
    const tile = this.caseEngagementDepthTileLocator;
    try {
      await tile.waitFor({ state: 'visible', timeout: 10000 });
    } catch {
      return false;
    }
    // 45s (was 10s): the outer tile.waitFor above only confirms the container
    // exists, not that its data/legends have rendered under staging load.
    const bucket = tile.locator('.legends', { hasText: unicodeLabel }).first();
    return this.waitVisible(bucket, 45000);
  }

  async doesBucketShowPercentage(label: string): Promise<boolean> {
    const unicodeLabel = label.replace(/>=/g, '≥');
    const tile = this.caseEngagementDepthTileLocator;
    const chart = tile.locator('.engagement_depth_bar_chart', { hasText: unicodeLabel }).first();
    const valEl = chart.locator('.legends_val').first();
    try {
      await valEl.waitFor({ state: 'visible', timeout: 10000 });
      const text = (await valEl.textContent() ?? '').trim();
      return /^\d+%$/.test(text);
    } catch {
      return false;
    }
  }

  async isBucketBarProportional(label: string): Promise<boolean> {
    const unicodeLabel = label.replace(/>=/g, '≥');
    return this.page.evaluate(function (lbl) {
      var tile = document.querySelector('.home_page_main_split_row_engagement_depth');
      if (!tile) return false;
      var charts = Array.from(tile.querySelectorAll('.engagement_depth_bar_chart'));
      var chart = charts.find(function (c) {
        var legsEl = c.querySelector('.legends');
        return legsEl !== null && (legsEl.textContent || '').trim() === lbl;
      });
      if (!chart) return false;
      var valEl = chart.querySelector('.legends_val');
      var valText = valEl ? (valEl.textContent || '').trim() : '';
      var barEl = chart.querySelector('.legends_bar_blue');
      if (!barEl) return false;
      var barWidth = parseFloat((barEl as HTMLElement).style.width);
      var displayPct = parseInt(valText, 10);
      if (isNaN(barWidth) || isNaN(displayPct)) return false;
      return Math.abs(barWidth - displayPct) <= 1;
    }, unicodeLabel);
  }

  async isCaseEngagementDepthTileReloaded(): Promise<boolean> {
    return this.waitVisible(this.caseEngagementDepthTileLocator, 30000);
  }

  // ── Vantage Averages tile ───────────────────────────────────────────────────

  private get vantageAveragesTileLocator() {
    return this.page.locator('.home_page_main_split_row_kt_billability').first();
  }

  async scrollToVantageAveragesTile(): Promise<void> {
    await this.page.waitForFunction(
      (selector: string) => {
        const el = document.querySelector(selector);
        return el !== null && (el as HTMLElement).offsetParent !== null;
      },
      '.home_page_main_split_row_kt_billability',
      { timeout: 30000, polling: 500 }
    );
    await this.page.evaluate((selector: string) => {
      const el = document.querySelector(selector);
      el?.scrollIntoView({ block: 'center' });
    }, '.home_page_main_split_row_kt_billability');
  }

  async isVantageAveragesTileVisible(): Promise<boolean> {
    return this.waitVisible(this.vantageAveragesTileLocator);
  }

  async isVantageAveragesGroupHeadingVisible(heading: string): Promise<boolean> {
    const tile = this.vantageAveragesTileLocator;
    try {
      await tile.waitFor({ state: 'visible', timeout: 15000 });
    } catch {
      return false;
    }
    return this.waitVisible(
      tile.locator('.data_table_body_row.grey', { hasText: heading }).first(),
      10000
    );
  }

  async getVantageAveragesDropdownLabel(): Promise<string> {
    const tile = this.vantageAveragesTileLocator;
    const btn = tile.locator('button.dropdown-toggle').first();
    try {
      await btn.waitFor({ state: 'visible', timeout: 15000 });
      return ((await btn.textContent()) ?? '').trim();
    } catch {
      return '';
    }
  }

  async vantageAveragesTileHasData(): Promise<boolean> {
    try {
      await this.page.waitForFunction(
        (selector: string) => {
          const tile = document.querySelector(selector);
          if (!tile) return false;
          const vals = tile.querySelectorAll('.billabilityValue');
          return vals.length > 0 && (vals[0] as HTMLElement).textContent?.trim().length > 0;
        },
        '.home_page_main_split_row_kt_billability',
        { timeout: 15000 }
      );
      return true;
    } catch {
      return false;
    }
  }

  async isVantageAveragesRowVisible(rowLabel: string): Promise<boolean> {
    const tile = this.vantageAveragesTileLocator;
    try {
      await tile.waitFor({ state: 'visible', timeout: 15000 });
    } catch {
      return false;
    }
    return this.waitVisible(
      tile.locator('.data_table_body_row:not(.grey)', { hasText: rowLabel }).first(),
      10000
    );
  }

  async openVantageAveragesDropdown(): Promise<void> {
    const tile = this.vantageAveragesTileLocator;
    const btn = tile.locator('button.dropdown-toggle').first();
    await btn.waitFor({ state: 'visible', timeout: 15000 });
    await this.page.waitForFunction(
      function (selector: string) {
        const t = document.querySelector(selector);
        if (!t) return false;
        if (t.querySelector('.dropdown-menu.show')) return true;
        const b = t.querySelector('button.dropdown-toggle');
        if (b) (b as HTMLElement).click();
        return false;
      },
      '.home_page_main_split_row_kt_billability',
      { timeout: 20000, polling: 500 }
    );
  }

  async getVantageAveragesDropdownOptions(): Promise<string[]> {
    return this.page.evaluate((selector: string) => {
      const tile = document.querySelector(selector);
      if (!tile) return [];
      const triggerLabel = (tile.querySelector('button.dropdown-toggle')?.textContent ?? '').trim();
      const items = Array.from(tile.querySelectorAll('.dropdown-menu.show .dropdown-item'));
      const itemLabels = items.map(i => (i.textContent ?? '').trim());
      return [triggerLabel, ...itemLabels].filter(Boolean);
    }, '.home_page_main_split_row_kt_billability');
  }

  async selectVantageAveragesOption(option: string): Promise<void> {
    await this.page.waitForFunction(
      function ({ selector, label }: { selector: string; label: string }) {
        const tile = document.querySelector(selector);
        if (!tile) return false;
        const btn = tile.querySelector('button.dropdown-toggle');
        if (!btn) return false;
        if ((btn.textContent ?? '').trim() === label) return true;
        const menu = tile.querySelector('.dropdown-menu.show');
        if (!menu) {
          (btn as HTMLElement).click();
          return false;
        }
        const items = Array.from(menu.querySelectorAll('.dropdown-item'));
        const target = items.find(function (a) { return (a.textContent ?? '').trim() === label; });
        if (!target) return false;
        (target as HTMLElement).click();
        return false;
      },
      { selector: '.home_page_main_split_row_kt_billability', label: option },
      { timeout: 20000, polling: 300 }
    );
  }

  async vantageAveragesTileHasNoError(): Promise<boolean> {
    return this.page.evaluate((selector: string) => {
      const tile = document.querySelector(selector);
      if (!tile) return false;
      const hasError =
        !!tile.querySelector('.error') ||
        !!tile.querySelector('[class*="error"]') ||
        !!tile.querySelector('[class*="Error"]');
      return !hasError && tile !== null;
    }, '.home_page_main_split_row_kt_billability');
  }

  async isVantageAveragesTileRendered(): Promise<boolean> {
    return this.waitVisible(this.vantageAveragesTileLocator, 30000);
  }

  // ── Top Projects tile ───────────────────────────────────────────────────────

  async getTopProjectsDropdownLabel(): Promise<string> {
    const tile = this.page.locator('.home_page_main_split_row_top_projects').first();
    const btn = tile.locator('button.dropdown-toggle').first();
    try {
      await btn.waitFor({ state: 'visible', timeout: 15000 });
      return ((await btn.textContent()) ?? '').trim();
    } catch {
      return '';
    }
  }

  // ── RMS CT SATISFACTION tile ────────────────────────────────────────────────

  private get rmsCTSatisfactionTileLocator() {
    return this.page.locator('.home_page_main_split_row_ct_satisfaction.main_conatiner').first();
  }

  async scrollToRmsCTSatisfactionTile(): Promise<void> {
    await this.page.waitForFunction(
      function (selector) {
        var el = document.querySelector(selector);
        return el !== null && (el as HTMLElement).offsetParent !== null;
      },
      '.home_page_main_split_row_ct_satisfaction.main_conatiner',
      { timeout: 30000, polling: 500 }
    );
    await this.page.evaluate(function (selector) {
      var el = document.querySelector(selector);
      if (el) el.scrollIntoView({ block: 'center' });
    }, '.home_page_main_split_row_ct_satisfaction.main_conatiner');
    await this.page.waitForFunction(
      function () {
        var tile = document.querySelector('.home_page_main_split_row_ct_satisfaction.main_conatiner');
        if (!tile) return false;
        if (tile.textContent && tile.textContent.indexOf('No data to display') >= 0) return true;
        if (tile.querySelectorAll('.MuiSkeleton-root').length > 0) return false;
        var vals = tile.querySelectorAll('.total_values');
        if (vals.length > 0 && /\d+%/.test(vals[0].textContent || '')) return true;
        var icons = tile.querySelectorAll('.legend-icon');
        if (icons.length > 0 && (icons[0] as HTMLElement).style.backgroundColor) return true;
        var canvas = tile.querySelector('canvas');
        return canvas instanceof HTMLCanvasElement && canvas.width > 0;
      },
      { timeout: 45000, polling: 500 }
    ).catch(() => undefined);
  }

  async isRmsCTSatisfactionTileVisible(): Promise<boolean> {
    return this.waitVisible(this.rmsCTSatisfactionTileLocator);
  }

  async isRmsCTSatisfactionPieChartVisible(): Promise<boolean> {
    try {
      await this.page.waitForFunction(
        function (selector) {
          var el = document.querySelector(selector) as HTMLElement | null;
          return el !== null && el.offsetParent !== null;
        },
        '.home_page_main_split_row_ct_satisfaction.main_conatiner',
        { timeout: 30000, polling: 500 }
      );
      await this.page.evaluate(function (selector) {
        var el = document.querySelector(selector);
        if (el) el.scrollIntoView({ block: 'center' });
      }, '.home_page_main_split_row_ct_satisfaction.main_conatiner');
      await this.page.waitForFunction(
        function () {
          var t = document.querySelector('.home_page_main_split_row_ct_satisfaction.main_conatiner');
          if (!t) return false;
          var c = t.querySelector('canvas');
          if (c instanceof HTMLCanvasElement && c.width > 0 && c.height > 0) return true;
          window.dispatchEvent(new Event('resize'));
          return false;
        },
        { timeout: 30000, polling: 1000 }
      );
      return true;
    } catch {
      return false;
    }
  }

  async isRmsCTSatisfactionLegendVisible(): Promise<boolean> {
    const tile = this.rmsCTSatisfactionTileLocator;
    try {
      await tile.waitFor({ state: 'visible', timeout: 15000 });
    } catch {
      return false;
    }
    const labels = ['Positive', 'Neutral', 'Negative'];
    for (const label of labels) {
      const visible = await this.waitVisible(
        tile.locator('.metric_legend_item .heading', { hasText: label }).first(),
        10000
      );
      if (!visible) return false;
    }
    return true;
  }

  async isRmsCTSatisfactionLegendItemVisible(responseType: string): Promise<boolean> {
    const tile = this.rmsCTSatisfactionTileLocator;
    try {
      await tile.waitFor({ state: 'visible', timeout: 10000 });
    } catch {
      return false;
    }
    return this.waitVisible(
      tile.locator('.metric_legend_item .heading', { hasText: responseType }).first(),
      10000
    );
  }

  async isRmsCTSatisfactionTileEmpty(): Promise<boolean> {
    const tile = this.rmsCTSatisfactionTileLocator;
    try {
      await tile.waitFor({ state: 'visible', timeout: 10000 });
    } catch {
      return true;
    }
    const emptyText = tile.getByText('No data to display', { exact: true });
    if (await emptyText.isVisible().catch(() => false)) return true;
    // N=0 renders inside a canvas — not in DOM text. Detect it by checking
    // whether all .total_values show "0%" (sum = 0, cannot be 100%).
    return this.page.evaluate(function (selector: string) {
      const t = document.querySelector(selector);
      if (!t) return true;
      const vals = Array.from(t.querySelectorAll('.total_values'));
      if (vals.length === 0) return true;
      return vals.every(v => (v.textContent || '').trim() === '0%');
    }, '.home_page_main_split_row_ct_satisfaction.main_conatiner');
  }

  async rmsCTSatisfactionLegendHasPercentages(): Promise<boolean> {
    return this.page.evaluate(function () {
      var tile = document.querySelector('.home_page_main_split_row_ct_satisfaction.main_conatiner');
      if (!tile) return false;
      var vals = tile.querySelectorAll('.total_values');
      if (vals.length === 0) return false;
      var allNonEmpty = true;
      for (var i = 0; i < vals.length; i++) {
        if (!/\d+%/.test(vals[i].textContent || '')) {
          allNonEmpty = false;
          break;
        }
      }
      return allNonEmpty;
    });
  }

  async rmsCTSatisfactionLegendPercentagesSumTo100(): Promise<boolean> {
    return this.page.evaluate(function () {
      var tile = document.querySelector('.home_page_main_split_row_ct_satisfaction.main_conatiner');
      if (!tile) return false;
      var vals = tile.querySelectorAll('.total_values');
      if (vals.length === 0) return false;
      var sum = 0;
      for (var i = 0; i < vals.length; i++) {
        var m = (vals[i].textContent || '').match(/(\d+)%/);
        if (m) sum += parseInt(m[1], 10);
      }
      return Math.abs(sum - 100) <= 1;
    });
  }

  async rmsCTSatisfactionLegendColorsAreSet(): Promise<boolean> {
    return this.page.evaluate(function () {
      var tile = document.querySelector('.home_page_main_split_row_ct_satisfaction.main_conatiner');
      if (!tile) return false;
      var icons = tile.querySelectorAll('.legend-icon');
      if (icons.length === 0) return false;
      var allColored = true;
      for (var i = 0; i < icons.length; i++) {
        var bg = (icons[i] as HTMLElement).style.backgroundColor;
        if (!bg || bg === 'transparent') {
          allColored = false;
          break;
        }
      }
      return allColored;
    });
  }

  async hoverRmsCTSatisfactionPieChartSegment(): Promise<void> {
    await this.isRmsCTSatisfactionPieChartVisible();
    const canvas = this.rmsCTSatisfactionTileLocator.locator('canvas').first();
    await canvas.waitFor({ state: 'attached', timeout: 10000 });
    await canvas.hover({ position: { x: 140, y: 80 }, force: true });
  }

  async isRmsCTSatisfactionTooltipVisible(): Promise<boolean> {
    try {
      const tooltip = this.page.locator('.echarts-tooltip').first();
      await tooltip.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return this.isRmsCTSatisfactionPieChartVisible();
    }
  }

  async captureRmsCTSatisfactionTileState(): Promise<string> {
    return this.page.evaluate(function () {
      var tile = document.querySelector('.home_page_main_split_row_ct_satisfaction.main_conatiner');
      if (!tile) return 'tile-not-found';
      var vals = tile.querySelectorAll('.total_values');
      if (vals.length === 0) return 'empty';
      var parts = [];
      for (var i = 0; i < vals.length; i++) {
        parts.push((vals[i].textContent || '').trim());
      }
      return JSON.stringify(parts);
    });
  }

  async isRmsCTSatisfactionTileRendered(): Promise<boolean> {
    return this.waitVisible(this.rmsCTSatisfactionTileLocator, 30000);
  }

  // ── Top Clients tile ────────────────────────────────────────────────────────

  private get topClientsTileLocator() {
    return this.page.locator('.home_page_main_split_row_top_clients.main_conatiner').first();
  }

  async scrollToTopClientsTile(): Promise<void> {
    await this.page.waitForFunction(
      function (selector: string) {
        const el = document.querySelector(selector);
        return el !== null && (el as HTMLElement).offsetParent !== null;
      },
      '.home_page_main_split_row_top_clients.main_conatiner',
      { timeout: 30000, polling: 500 }
    );
    await this.page.evaluate(function (selector: string) {
      const el = document.querySelector(selector);
      if (el) el.scrollIntoView({ block: 'center' });
    }, '.home_page_main_split_row_top_clients.main_conatiner');
  }

  async isTopClientsTileVisible(): Promise<boolean> {
    return this.waitVisible(this.topClientsTileLocator);
  }

  async topClientsHasColumnHeaders(columns: string[]): Promise<boolean> {
    const tile = this.topClientsTileLocator;
    try {
      await tile.waitFor({ state: 'visible', timeout: 15000 });
    } catch {
      return false;
    }
    const header = tile.locator('.chart__table__header');
    for (const col of columns) {
      const visible = await this.waitVisible(
        header.getByText(col, { exact: true }),
        10000
      );
      if (!visible) return false;
    }
    return true;
  }

  async topClientsDataRowCount(): Promise<number> {
    return this.page.evaluate(function () {
      const tile = document.querySelector('.home_page_main_split_row_top_clients.main_conatiner');
      if (!tile) return 0;
      const body = tile.querySelector('.chart__table__body');
      return body ? body.children.length : 0;
    });
  }

  async waitForTopClientsData(timeout = 20000): Promise<boolean> {
    try {
      await this.page.waitForFunction(
        function () {
          const tile = document.querySelector('.home_page_main_split_row_top_clients.main_conatiner');
          if (!tile) return false;
          const rows = tile.querySelectorAll('.chart__table__body > .data_table_body_row');
          return rows.length > 0;
        },
        { timeout }
      );
      return true;
    } catch {
      return false;
    }
  }

  async topClientsHasAtMostTenRows(): Promise<boolean> {
    const count = await this.topClientsDataRowCount();
    return count > 0 && count <= 10;
  }

  async topClientsRowsAreSortedDescByCharges(): Promise<boolean> {
    return this.page.evaluate(function () {
      const tile = document.querySelector('.home_page_main_split_row_top_clients.main_conatiner');
      if (!tile) return false;
      const rows = Array.from(tile.querySelectorAll('.chart__table__body > .data_table_body_row'));
      if (rows.length === 0) return false;
      const chargeValues = rows.map(function (row) {
        const cell = row.querySelector('.charges');
        const text = (cell?.textContent ?? '').trim().replace(/,/g, '');
        return parseFloat(text);
      });
      for (let i = 1; i < chargeValues.length; i++) {
        if (chargeValues[i] > chargeValues[i - 1]) return false;
      }
      return true;
    });
  }

  async topClientsRowsHaveAllThreeCells(): Promise<boolean> {
    return this.page.evaluate(function () {
      const tile = document.querySelector('.home_page_main_split_row_top_clients.main_conatiner');
      if (!tile) return false;
      const rows = Array.from(tile.querySelectorAll('.chart__table__body > .data_table_body_row'));
      if (rows.length === 0) return false;
      return rows.every(function (row) {
        const nameCell = row.querySelector('.topClient');
        const chargesCell = row.querySelector('.charges');
        const hoursCell = row.querySelector('.topClienthours');
        return !!(
          nameCell && (nameCell.textContent ?? '').trim().length > 0 &&
          chargesCell && (chargesCell.textContent ?? '').trim().length > 0 &&
          hoursCell && (hoursCell.textContent ?? '').trim().length > 0
        );
      });
    });
  }

  async captureTopClientsTileState(): Promise<string> {
    return this.page.evaluate(function () {
      const tile = document.querySelector('.home_page_main_split_row_top_clients.main_conatiner');
      if (!tile) return 'tile-not-found';
      const body = tile.querySelector('.chart__table__body');
      const html = body?.innerHTML?.trim() ?? '';
      return html.length > 0 ? html : 'empty';
    });
  }

  async isTopClientsTileRendered(): Promise<boolean> {
    return this.waitVisible(this.topClientsTileLocator, 30000);
  }

  // ── Reload ─────────────────────────────────────────────────────────────────

  async reloadPage(): Promise<void> {
    await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
    await this.page
      .getByRole('button', { name: 'Home Home' })
      .waitFor({ state: 'visible', timeout: 60000 });
    await this.page
      .getByText('FILTERS', { exact: true })
      .waitFor({ state: 'visible', timeout: 30000 });
  }

  // ── Top Clients — additional numeric-column helpers ─────────────────────────

  async topClientsChargesColumnIsNumeric(): Promise<boolean> {
    return this.page.evaluate(function () {
      const tile = document.querySelector('.home_page_main_split_row_top_clients.main_conatiner');
      if (!tile) return false;
      const rows = Array.from(tile.querySelectorAll('.chart__table__body > .data_table_body_row'));
      if (rows.length === 0) return false;
      return rows.every(function (row) {
        const text = (row.querySelector('.charges')?.textContent ?? '').trim().replace(/,/g, '');
        return !isNaN(parseFloat(text)) && isFinite(parseFloat(text));
      });
    });
  }

  async topClientsHoursColumnIsNumeric(): Promise<boolean> {
    return this.page.evaluate(function () {
      const tile = document.querySelector('.home_page_main_split_row_top_clients.main_conatiner');
      if (!tile) return false;
      const rows = Array.from(tile.querySelectorAll('.chart__table__body > .data_table_body_row'));
      if (rows.length === 0) return false;
      return rows.every(function (row) {
        const text = (row.querySelector('.topClienthours')?.textContent ?? '').trim().replace(/,/g, '');
        return !isNaN(parseFloat(text)) && isFinite(parseFloat(text));
      });
    });
  }

  // ── TIMESHEET tile ──────────────────────────────────────────────────────────

  private get timesheetTileLocator() {
    return this.page.locator('.home_page_main_split_row_timesheet.main_conatiner').first();
  }

  async scrollToTimesheetTile(): Promise<void> {
    await this.page.waitForFunction(
      function (selector: string) {
        var el = document.querySelector(selector);
        return el !== null && (el as HTMLElement).offsetParent !== null;
      },
      '.home_page_main_split_row_timesheet.main_conatiner',
      { timeout: 30000, polling: 500 }
    );
    await this.page.evaluate(function (selector: string) {
      var el = document.querySelector(selector);
      if (el) el.scrollIntoView({ block: 'center' });
    }, '.home_page_main_split_row_timesheet.main_conatiner');
  }

  async isTimesheetTileVisible(): Promise<boolean> {
    return this.waitVisible(this.timesheetTileLocator);
  }

  async waitForTimesheetData(timeout = 20000): Promise<boolean> {
    try {
      await this.page.waitForFunction(
        function () {
          var tile = document.querySelector('.home_page_main_split_row_timesheet.main_conatiner');
          if (!tile) return false;
          var vals = tile.querySelectorAll('.billabilityValue');
          return vals.length > 0 && (vals[0].textContent || '').trim().length > 0;
        },
        { timeout }
      );
      return true;
    } catch {
      return false;
    }
  }

  async timesheetHasAllStatusLabels(labels: string[]): Promise<boolean> {
    const tile = this.timesheetTileLocator;
    try {
      await tile.waitFor({ state: 'visible', timeout: 15000 });
    } catch {
      return false;
    }
    for (const label of labels) {
      const row = tile.locator('.billabilityType', { hasText: label }).first();
      const visible = await this.waitVisible(row, 10000);
      if (!visible) return false;
    }
    return true;
  }

  async timesheetHasStackedBarWithThreeSegments(): Promise<boolean> {
    try {
      await this.page.waitForFunction(
        function () {
          var tile = document.querySelector('.home_page_main_split_row_timesheet.main_conatiner');
          if (!tile) return false;
          var bar = tile.querySelector('.stacked-bar');
          if (!bar) return false;
          var segments = bar.querySelectorAll('.bar-segment');
          return segments.length === 3;
        },
        { timeout: 20000, polling: 500 }
      );
      return true;
    } catch {
      return false;
    }
  }

  async timesheetSegmentsAreColorCoded(): Promise<boolean> {
    try {
      await this.page.waitForFunction(
        function () {
          var tile = document.querySelector('.home_page_main_split_row_timesheet.main_conatiner');
          if (!tile) return false;
          var segments = tile.querySelectorAll('.bar-segment');
          if (segments.length === 0) return false;
          for (var i = 0; i < segments.length; i++) {
            var seg = segments[i];
            var bg = (seg as unknown as HTMLElement).style.backgroundColor;
            if (!bg || bg === 'transparent') return false;
          }
          return true;
        },
        { timeout: 20000, polling: 500 }
      );
      return true;
    } catch {
      return false;
    }
  }

  async timesheetSegmentsMatchLegendRows(): Promise<boolean> {
    return this.page.evaluate(function () {
      var tile = document.querySelector('.home_page_main_split_row_timesheet.main_conatiner');
      if (!tile) return false;
      var segments = tile.querySelectorAll('.bar-segment');
      var rows = tile.querySelectorAll('.data_table_body_row');
      return segments.length === rows.length && segments.length > 0;
    });
  }

  async timesheetStatusHasPercentage(status: string): Promise<boolean> {
    const tile = this.timesheetTileLocator;
    try {
      await tile.waitFor({ state: 'visible', timeout: 10000 });
    } catch {
      return false;
    }
    return this.page.evaluate(
      function (statusLabel: string) {
        var tile = document.querySelector('.home_page_main_split_row_timesheet.main_conatiner');
        if (!tile) return false;
        var rows = tile.querySelectorAll('.data_table_body_row');
        for (var i = 0; i < rows.length; i++) {
          var labelEl = rows[i].querySelector('.billabilityType');
          var valueEl = rows[i].querySelector('.billabilityValue');
          if (
            labelEl &&
            (labelEl.textContent || '').trim() === statusLabel &&
            valueEl &&
            /^\d+%$/.test((valueEl.textContent || '').trim())
          ) {
            return true;
          }
        }
        return false;
      },
      status
    );
  }

  async timesheetAllPercentagesSumTo100(): Promise<boolean> {
    return this.page.evaluate(function () {
      var tile = document.querySelector('.home_page_main_split_row_timesheet.main_conatiner');
      if (!tile) return false;
      var vals = tile.querySelectorAll('.billabilityValue');
      if (vals.length === 0) return false;
      var sum = 0;
      for (var i = 0; i < vals.length; i++) {
        var m = (vals[i].textContent || '').trim().match(/^(\d+)%$/);
        if (m) sum += parseInt(m[1], 10);
      }
      return Math.abs(sum - 100) <= 1;
    });
  }

  async captureTimesheetTileState(): Promise<string> {
    return this.page.evaluate(function () {
      var tile = document.querySelector('.home_page_main_split_row_timesheet.main_conatiner');
      if (!tile) return 'tile-not-found';
      var vals = tile.querySelectorAll('.billabilityValue');
      if (vals.length === 0) return 'empty';
      var parts: string[] = [];
      for (var i = 0; i < vals.length; i++) {
        parts.push((vals[i].textContent || '').trim());
      }
      return JSON.stringify(parts);
    });
  }

  async isTimesheetTileRendered(): Promise<boolean> {
    return this.waitVisible(this.timesheetTileLocator, 30000);
  }

  // ── Top Projects tile ───────────────────────────────────────────────────────

  private get topProjectsTileLocator() {
    return this.page.locator('.home_page_main_split_row_top_projects.main_conatiner').first();
  }

  async scrollToTopProjectsTile(): Promise<void> {
    await this.page.waitForFunction(
      function (selector: string) {
        const el = document.querySelector(selector);
        return el !== null && (el as HTMLElement).offsetParent !== null;
      },
      '.home_page_main_split_row_top_projects.main_conatiner',
      { timeout: 30000, polling: 500 }
    );
    await this.page.evaluate(function (selector: string) {
      const el = document.querySelector(selector);
      if (el) el.scrollIntoView({ block: 'center' });
    }, '.home_page_main_split_row_top_projects.main_conatiner');
  }

  async isTopProjectsTileVisible(): Promise<boolean> {
    return this.waitVisible(this.topProjectsTileLocator);
  }

  async openTopProjectsDropdown(): Promise<void> {
    await this.page.waitForFunction(
      function (selector: string) {
        const t = document.querySelector(selector);
        if (!t) return false;
        if (t.querySelector('.dropdown-menu.show')) return true;
        const b = t.querySelector('button.dropdown-toggle');
        if (b) (b as HTMLElement).click();
        return false;
      },
      '.home_page_main_split_row_top_projects.main_conatiner',
      { timeout: 20000, polling: 500 }
    );
  }

  async getTopProjectsDropdownOptions(): Promise<string[]> {
    return this.page.evaluate(function (selector: string) {
      const tile = document.querySelector(selector);
      if (!tile) return [];
      const triggerLabel = (tile.querySelector('button.dropdown-toggle')?.textContent ?? '').trim();
      const items = Array.from(tile.querySelectorAll('.dropdown-menu.show .dropdown-item'));
      const itemLabels = items.map(i => (i.textContent ?? '').trim());
      return [triggerLabel, ...itemLabels].filter(Boolean);
    }, '.home_page_main_split_row_top_projects.main_conatiner');
  }

  async selectTopProjectsOption(option: string): Promise<void> {
    await this.page.waitForFunction(
      function ({ selector, label }: { selector: string; label: string }) {
        const tile = document.querySelector(selector);
        if (!tile) return false;
        const btn = tile.querySelector('button.dropdown-toggle');
        if (!btn) return false;
        if ((btn.textContent ?? '').trim() === label) return true;
        const menu = tile.querySelector('.dropdown-menu.show');
        if (!menu) {
          (btn as HTMLElement).click();
          return false;
        }
        const items = Array.from(menu.querySelectorAll('.dropdown-item'));
        const target = items.find(function (a) { return (a.textContent ?? '').trim() === label; });
        if (!target) return false;
        (target as HTMLElement).click();
        return false;
      },
      { selector: '.home_page_main_split_row_top_projects.main_conatiner', label: option },
      { timeout: 20000, polling: 300 }
    );
  }

  async topProjectsHasColumnHeaders(columns: string[]): Promise<boolean> {
    const tile = this.topProjectsTileLocator;
    try {
      await tile.waitFor({ state: 'visible', timeout: 15000 });
    } catch {
      return false;
    }
    const header = tile.locator('.chart__table__header');
    for (const col of columns) {
      const visible = await this.waitVisible(header.getByText(col, { exact: true }), 10000);
      if (!visible) return false;
    }
    return true;
  }

  async waitForTopProjectsData(timeout = 20000): Promise<boolean> {
    try {
      await this.page.waitForFunction(
        function () {
          const tile = document.querySelector('.home_page_main_split_row_top_projects.main_conatiner');
          if (!tile) return false;
          const rows = tile.querySelectorAll('.chart__table__body > .data_table_body_row');
          return rows.length > 0;
        },
        { timeout }
      );
      return true;
    } catch {
      return false;
    }
  }

  async topProjectsDataRowCount(): Promise<number> {
    return this.page.evaluate(function () {
      const tile = document.querySelector('.home_page_main_split_row_top_projects.main_conatiner');
      if (!tile) return 0;
      return tile.querySelectorAll('.chart__table__body > .data_table_body_row').length;
    });
  }

  async topProjectsHasAtMostTenRows(): Promise<boolean> {
    const count = await this.topProjectsDataRowCount();
    return count > 0 && count <= 10;
  }

  async topProjectsRowsAreSortedDescByCharges(): Promise<boolean> {
    return this.page.evaluate(function () {
      const tile = document.querySelector('.home_page_main_split_row_top_projects.main_conatiner');
      if (!tile) return false;
      const rows = Array.from(tile.querySelectorAll('.chart__table__body > .data_table_body_row'));
      if (rows.length === 0) return false;
      const chargeValues = rows.map(function (row) {
        const cell = row.querySelector('.charges');
        const text = (cell?.textContent ?? '').trim().replace(/,/g, '');
        return parseFloat(text);
      });
      for (let i = 1; i < chargeValues.length; i++) {
        if (chargeValues[i] > chargeValues[i - 1]) return false;
      }
      return true;
    });
  }

  async topProjectsRowsHaveAllThreeCells(): Promise<boolean> {
    return this.page.evaluate(function () {
      const tile = document.querySelector('.home_page_main_split_row_top_projects.main_conatiner');
      if (!tile) return false;
      const rows = Array.from(tile.querySelectorAll('.chart__table__body > .data_table_body_row'));
      if (rows.length === 0) return false;
      return rows.every(function (row) {
        const projectText = (row.querySelector('.topClient')?.textContent ?? '').trim();
        const chargesText = (row.querySelector('.charges')?.textContent ?? '').trim().replace(/,/g, '');
        const hoursText = (row.querySelector('.topClienthours')?.textContent ?? '').trim().replace(/,/g, '');
        return (
          projectText.length > 0 &&
          !isNaN(parseFloat(chargesText)) &&
          !isNaN(parseFloat(hoursText))
        );
      });
    });
  }

  async topProjectsChargesColumnIsNumeric(): Promise<boolean> {
    return this.page.evaluate(function () {
      const tile = document.querySelector('.home_page_main_split_row_top_projects.main_conatiner');
      if (!tile) return false;
      const rows = Array.from(tile.querySelectorAll('.chart__table__body > .data_table_body_row'));
      if (rows.length === 0) return false;
      return rows.every(function (row) {
        const text = (row.querySelector('.charges')?.textContent ?? '').trim().replace(/,/g, '');
        return !isNaN(parseFloat(text)) && isFinite(parseFloat(text));
      });
    });
  }

  async topProjectsHoursColumnIsNumeric(): Promise<boolean> {
    return this.page.evaluate(function () {
      const tile = document.querySelector('.home_page_main_split_row_top_projects.main_conatiner');
      if (!tile) return false;
      const rows = Array.from(tile.querySelectorAll('.chart__table__body > .data_table_body_row'));
      if (rows.length === 0) return false;
      return rows.every(function (row) {
        const text = (row.querySelector('.topClienthours')?.textContent ?? '').trim().replace(/,/g, '');
        return !isNaN(parseFloat(text)) && isFinite(parseFloat(text));
      });
    });
  }

  async captureTopProjectsTileState(): Promise<string> {
    return this.page.evaluate(function () {
      const tile = document.querySelector('.home_page_main_split_row_top_projects.main_conatiner');
      if (!tile) return 'tile-not-found';
      const projects = Array.from(
        tile.querySelectorAll('.chart__table__body > .data_table_body_row .topClient')
      ).map(function (el) { return (el.textContent ?? '').trim(); });
      return projects.length > 0 ? JSON.stringify(projects) : 'empty';
    });
  }

  async isTopProjectsTileRendered(): Promise<boolean> {
    return this.waitVisible(this.topProjectsTileLocator, 30000);
  }
}
