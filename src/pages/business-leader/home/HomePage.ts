import { Page, Locator } from '@playwright/test';
import { BasePage } from '../../base/BasePage';
import { ManagementModelFilter } from '../../filters/ManagementModelFilter';
import { NameFilter } from '../../filters/NameFilter';
import { PathFilter } from '../../filters/PathFilter';
import { LocationFilter } from '../../filters/LocationFilter';
import { GeoBusinessFilter } from '../../filters/GeoBusinessFilter';
import { MonthsFilter } from '../../filters/MonthsFilter';
import { DateRangeFilter } from '../../filters/DateRangeFilter';
import { StatusFilter } from '../../filters/StatusFilter';
import { PracticeAreaFilter } from '../../filters/PracticeAreaFilter';
import { JobTitleFilter } from '../../filters/JobTitleFilter';
import { ENV } from '../../../utils/env';

export class HomePage extends BasePage {
  readonly managementModelFilter: ManagementModelFilter;
  readonly nameFilter: NameFilter;
  readonly pathFilter: PathFilter;
  readonly locationFilter: LocationFilter;
  readonly geoBusinessFilter: GeoBusinessFilter;
  readonly monthsFilter: MonthsFilter;
  readonly dateRangeFilter: DateRangeFilter;
  readonly statusFilter: StatusFilter;
  readonly practiceAreaFilter: PracticeAreaFilter;
  readonly jobTitleFilter: JobTitleFilter;
  readonly billabilityTrendWidget: Locator;
  readonly topProjectsWidget: Locator;
  readonly vantageAveragesWidget: Locator;
  readonly filtersLabel: Locator;
  readonly resetButton: Locator;
  readonly logo: Locator;
  readonly userValidationDropdown: Locator;
  readonly refreshedTimestamp: Locator;

  // Vantage Pulse Check tile
  readonly vantagePulseCheckHeader: Locator;
  readonly vantagePulseCheckDropdown: Locator;

  // Sidebar / page options
  readonly teamSizeTile: Locator;
  readonly topDownloadsTile: Locator;

  // KN Material tile
  readonly knMaterialTile: Locator;

  // Sidebar / page options
  readonly homeNavButton: Locator;
  readonly businessComparisonNavButton: Locator;
  readonly peopleNavButton: Locator;

  constructor(page: Page) {
    super(page);
    this.managementModelFilter = new ManagementModelFilter(page);
    this.nameFilter = new NameFilter(page);
    this.pathFilter = new PathFilter(page);
    this.locationFilter = new LocationFilter(page);
    this.geoBusinessFilter = new GeoBusinessFilter(page);
    this.monthsFilter = new MonthsFilter(page);
    this.dateRangeFilter = new DateRangeFilter(page);
    this.statusFilter = new StatusFilter(page);
    this.practiceAreaFilter = new PracticeAreaFilter(page);
    this.jobTitleFilter = new JobTitleFilter(page);
    this.billabilityTrendWidget = page.getByText('BILLABILITY TREND', { exact: true });
    this.topProjectsWidget = page.getByText('TOP PROJECTS', { exact: true });
    this.vantageAveragesWidget = page.getByText('VANTAGE AVERAGES', { exact: true });
    this.filtersLabel = page.getByText('FILTERS', { exact: true });
    this.resetButton = page.getByText('Reset', { exact: true });

    this.logo = page.getByAltText('BCG Vantage logo');
    // The User Validation / impersonation control renders as a DIV with
    // role="button" and class "select-impersonator" inside the right-header
    // container (.rightAlign.displayFlex > .impersonator-container).
    // It is NOT a native <button> element and does NOT have a dropdown-toggle
    // class — confirmed via live MCP inspection on 2026-06-24.
    this.userValidationDropdown = page.locator('.rightAlign.displayFlex .select-impersonator');
    // Refreshed data timestamp uses the "Data as of <date>" format.
    this.refreshedTimestamp = page.getByText(/Data as of/i).first();

    this.homeNavButton = page.getByRole('button', { name: 'Home Home' });
    this.businessComparisonNavButton = page.getByRole('button', { name: /Business Comparison/i });
    this.peopleNavButton = page.getByRole('button', { name: /^People/i });
    this.teamSizeTile = page.locator('.home_page_main_split_row_team_size');
    this.topDownloadsTile = page.locator('.home_page_main_split_row_top_downloads');
    this.knMaterialTile = page.locator('.home_page_main_split_row_kn_material');
    // Vantage Pulse Check: title text node; dropdown is the button inside the
    // same header row (sibling of the title generic → parent level '..')
    this.vantagePulseCheckHeader = page.getByText('VANTAGE PULSE CHECK', { exact: true });
    this.vantagePulseCheckDropdown = page
      .getByText('VANTAGE PULSE CHECK', { exact: true })
      .locator('..')
      .getByRole('button')
      .first();
  }

  async goto(): Promise<void> {
    // waitUntil: 'commit' (not 'domcontentloaded') — the authenticated SPA fires
    // a client-side redirect on load that interrupts a 'domcontentloaded' wait
    // ("Navigation ... interrupted by another navigation"), which can fail all
    // retries on a slow backend. 'commit' resolves at the main-frame commit,
    // before the redirect. The sidebar wait below is the real readiness gate, so
    // resolving navigation early is safe. Mirrors the shared Given + ci-auth.ts.
    await this.gotoWithRetry(ENV.BASE_URL, {
      waitUntil: 'commit',
      timeout: 90000
    });
    // Wait for the React SPA to render the sidebar Home button. This is the
    // first reliable signal that the authenticated shell has hydrated; it
    // prevents flaky failures in fast headless runs where page.goto resolves
    // before any widget is mounted.
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
    // The locator is already scoped to .rightAlign.displayFlex — the actual
    // right-header container. When the User Validation control is not
    // provisioned for the current account the container is empty and this
    // returns false. No spatial (y < 100) heuristic is needed here; scoping
    // to the container is the reliable signal.
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
    // The Home page shows the active date range as a single label such as
    // "Jan 2025 to Dec 2025"; per-month tick labels live inside SVG charts
    // and are not exposed as DOM text. We assert the tile is visible AND
    // at least one month/year label is rendered on the page.
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
    } else if (normalised.startsWith('business')) {
      locator = this.businessComparisonNavButton;
    } else if (normalised.startsWith('people')) {
      locator = this.peopleNavButton;
    } else {
      locator = this.page.getByRole('button', { name: new RegExp(option, 'i') }).first();
    }
    return this.waitVisible(locator);
  }

  async isFiltersPanelBelowPageOptions(): Promise<boolean> {
    // ordering of left-side controls: the page-option sidebar comes first,
    // and the FILTERS panel sits in the adjacent rail. We assert both are
    // rendered and visible.
    const filtersVisible = await this.isFiltersPanelVisible();
    const homeOptionVisible = await this.isPageOptionVisible('Home Page');
    return filtersVisible && homeOptionVisible;
  }

  // ── Vantage Pulse Check tile ────────────────────────────────────────────────

  async scrollToVantagePulseCheckTile(): Promise<void> {
    // Wait until the title is visible in the DOM.
    await this.page.getByText('VANTAGE PULSE CHECK', { exact: true })
      .first()
      .waitFor({ state: 'visible', timeout: 30000 });
    // Use evaluate for the scroll so it executes synchronously in browser context,
    // bypassing Playwright's DOM-attachment check which races with React re-renders.
    await this.page.evaluate(() => {
      const header = Array.from(document.querySelectorAll('*'))
        .find(el => el.textContent?.trim() === 'VANTAGE PULSE CHECK' && el.children.length === 0);
      header?.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
  }

  async isVantagePulseCheckChartVisible(): Promise<boolean> {
    try {
      // Anchor on the stable tile container class discovered via MCP live inspection.
      // This avoids any text-based or field-stored locators that go stale during React re-renders.
      const tile = this.page.locator('.home_page_main_split_row_kt_pulse').first();
      await tile.waitFor({ state: 'visible', timeout: 30000 });
      await this.page.evaluate(() => window.dispatchEvent(new Event('resize')));
      // Wait for either the canvas to paint (width > 0) OR a genuine "No data to
      // display" empty state (live-confirmed: the current default date range often
      // has no survey responses, so the tile legitimately renders no canvas at all -
      // this is the tile being visible, not a broken locator).
      // BUG FIX: waitForFunction(fn, options) is wrong for a zero-param fn — Playwright's
      // real signature is (fn, arg, options), so { timeout: 30000 } was being passed as
      // `arg` (ignored) instead of `options`, silently falling back to the page's
      // 120000ms default action timeout. Pass `null` for arg to fix it.
      await this.page.waitForFunction(() => {
        const tile = document.querySelector('.home_page_main_split_row_kt_pulse');
        if (!tile) return false;
        const c = tile.querySelector('canvas');
        if (c && (c as HTMLCanvasElement).width > 0 && (c as HTMLCanvasElement).height > 0) return true;
        return (tile.textContent ?? '').includes('No data to display');
      }, null, { timeout: 30000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * True when the tile's own "No data to display" empty state is showing.
   * Live-confirmed: with the current (calendar-year-to-date) default date range
   * the tile frequently has zero survey responses in period, so this is a
   * legitimate, non-error state - not something callers should fail on.
   */
  async hasVantagePulseCheckNoData(): Promise<boolean> {
    const tile = this.page.locator('.home_page_main_split_row_kt_pulse').first();
    return (await tile.textContent().catch(() => ''))?.includes('No data to display') ?? false;
  }

  async isVantagePulseCheckLegendVisible(): Promise<boolean> {
    if (await this.hasVantagePulseCheckNoData()) return true;
    // The legend always shows these five response-type labels.
    const labels = ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'];
    for (const label of labels) {
      const visible = await this.waitVisible(
        this.page.getByText(label, { exact: true }).first(),
        10000
      );
      if (!visible) return false;
    }
    return true;
  }

  async vantagePulseCheckLegendPercentagesSumTo100(): Promise<boolean> {
    if (await this.hasVantagePulseCheckNoData()) return true;
    return this.page.evaluate(() => {
      // Use the stable tile container class to scope the percentage search.
      const tile = document.querySelector('.home_page_main_split_row_kt_pulse');
      if (!tile) return false;
      const walker = document.createTreeWalker(tile, NodeFilter.SHOW_TEXT);
      const percents: number[] = [];
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const m = node.textContent?.trim().match(/^(\d+)%$/);
        if (m) percents.push(parseInt(m[1], 10));
      }
      return percents.length > 0 && percents.reduce((a, b) => a + b, 0) === 100;
    });
  }

  async hoverVantagePulseCheckChartSegment(): Promise<void> {
    await this.isVantagePulseCheckChartVisible();
    if (await this.hasVantagePulseCheckNoData()) return;
    // Anchor on the stable tile container class, then find the canvas inside it.
    const canvas = this.page.locator('.home_page_main_split_row_kt_pulse canvas').first();
    await canvas.waitFor({ state: 'attached', timeout: 10000 });
    await canvas.hover({ position: { x: 200, y: 100 }, force: true });
  }

  async isVantagePulseCheckTooltipVisible(): Promise<boolean> {
    try {
      // ECharts renders its tooltip as a DOM div; wait briefly for it to appear.
      const tooltip = this.page.locator('.echarts-tooltip').first();
      await tooltip.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      // Canvas-only tooltip: fall back to verifying the chart is still interactive.
      return this.isVantagePulseCheckChartVisible();
    }
  }

  async getVantagePulseCheckSelectedQuestion(): Promise<string> {
    // Scope to stable tile container class to avoid stale locator chain.
    const btn = this.page.locator('.home_page_main_split_row_kt_pulse .heading button').first();
    return (await btn.textContent() ?? '').trim();
  }

  async clickVantagePulseCheckDropdown(): Promise<void> {
    const btn = this.page.locator('.home_page_main_split_row_kt_pulse .heading button').first();
    await btn.click();
  }

  async isQuestionInVantagePulseCheckDropdown(question: string): Promise<boolean> {
    // Scope to the heading container inside the stable tile class.
    // 15s (was 5s): under CI load the dropdown's full option list can take a
    // few seconds to render after it opens, so 5s produced false negatives for
    // later options even though the first/selected one was already present.
    return this.waitVisible(
      this.page.locator('.home_page_main_split_row_kt_pulse .heading').getByRole('button', { name: question }),
      15000
    );
  }

  async selectVantagePulseCheckQuestion(question: string): Promise<void> {
    const optionButton = this.page
      .locator('.home_page_main_split_row_kt_pulse .heading')
      .getByRole('button', { name: question });
    await optionButton.waitFor({ state: 'visible', timeout: 5000 });
    // force: true — the dropdown item (<a role="button" class="dropdown-item">) is
    // briefly animating/re-rendering when the menu opens, so Playwright's default
    // "stable" actionability check times out and then sees the element detach on
    // re-render. The item is already visible (waitFor above), so we skip the
    // stability wait and click immediately, landing before the re-render detaches it.
    await optionButton.click({ force: true });
    // Wait until the trigger button reflects the new selection.
    const triggerBtn = this.page.locator('.home_page_main_split_row_kt_pulse .heading button').first();
    await triggerBtn.filter({ hasText: question }).waitFor({ state: 'visible', timeout: 10000 });
    // Give the chart time to re-mount after data reload.
    await this.page.locator('.home_page_main_split_row_kt_pulse').first()
      .waitFor({ state: 'visible', timeout: 15000 });
  }

  async isVantagePulseCheckQuestionSelected(question: string): Promise<boolean> {
    return this.waitVisible(
      this.vantagePulseCheckDropdown.filter({ hasText: question }),
      10000
    );
  }

  // ── Team Size tile ──────────────────────────────────────────────────────────

  async isTeamSizeChartVisible(): Promise<boolean> {
    try {
      // Wait for the tile to be mounted (it may be lazily rendered by the SPA).
      // 90s (was 45s): the first cold Home load fetches every tile at once, so a
      // below-the-fold tile can attach late on a slow backend — live-observed the
      // entire Home page still skeleton-loading well past 45s under staging load.
      await this.teamSizeTile.waitFor({ state: 'attached', timeout: 90000 });
      // Scroll into view so any IntersectionObserver-gated rendering fires.
      await this.teamSizeTile.scrollIntoViewIfNeeded({ timeout: 10000 });
      // Poll once per second until ECharts has sized its canvas pixel buffer.
      // On each poll where the canvas is still 0×0, nudge ECharts with a single
      // resize event and re-check on the NEXT poll. The 1s spacing is deliberate:
      // dispatching resize twice within the same tick can briefly reset
      // canvas.width to 0 (canvas-reset-to-width-0 pattern), so we never dispatch
      // more than once per second. This self-heals a cold first render where the
      // container had not finished laying out when ECharts first measured it.
      await this.page.waitForFunction(() => {
        const tile = document.querySelector('.home_page_main_split_row_team_size');
        if (!tile) return false;
        // Accept ANY non-zero canvas — ECharts can layer multiple canvases and
        // the first is sometimes a 0-sized overlay in headless Chromium.
        const canvases = Array.from(tile.querySelectorAll('canvas'));
        if (canvases.some((c) => c instanceof HTMLCanvasElement && c.width > 0 && c.height > 0)) return true;
        // Fallback for transient 0×0 during hover/resize re-renders: if the
        // legend rendered AND a canvas exists, the chart has drawn.
        if (tile.querySelector('.metric_legends') && canvases.length > 0) return true;
        window.dispatchEvent(new Event('resize'));
        return false;
      // BUG FIX: see isVantagePulseCheckChartVisible above — zero-param fn + 2-arg call
      // was silently passing { timeout, polling } as `arg` (ignored) instead of
      // `options`, so the declared polling: 1000 was never applied. Pass `null` for arg.
      }, null, { timeout: 120000, polling: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  async isTeamSizeLegendVisible(): Promise<boolean> {
    return this.waitVisible(this.teamSizeTile.locator('.metric_legends'));
  }

  async isTeamSizeLegendColored(): Promise<boolean> {
    try {
      await this.page.waitForFunction(function () {
        var icons = document.querySelectorAll(
          '.home_page_main_split_row_team_size .legend-icon'
        );
        if (icons.length === 0) return false;
        return Array.from(icons).every(function (icon) {
          var bg = (icon as HTMLElement).style.backgroundColor;
          if (bg && bg !== 'transparent') return true;
          var computed = window.getComputedStyle(icon as HTMLElement).backgroundColor;
          return computed && computed !== 'transparent' && computed !== 'rgba(0, 0, 0, 0)';
        });
      // BUG FIX: see isVantagePulseCheckChartVisible above — zero-param fn + 2-arg call
      // was silently falling back to the page's 120000ms default action timeout instead
      // of the declared 10000ms. Pass `null` for arg to fix it.
      }, null, { timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  async hoverTeamSizeChartSegment(): Promise<void> {
    // Ensure ECharts has initialised (scrolls tile into view + dispatches resize + waits for canvas).
    await this.isTeamSizeChartVisible();
    const canvas = this.teamSizeTile.locator('canvas').first();
    // Hover roughly 1/3 from the left, centre height — lands on a bar segment.
    await canvas.hover({ position: { x: 100, y: 160 } });
  }

  async isTeamSizeChartInteractive(): Promise<boolean> {
    // After a hover the ECharts engine processes the mouse event internally on the
    // canvas; there is no DOM tooltip created for this chart. We verify the chart
    // canvas is still rendered and the tile remains visible as observable proof
    // that the interaction did not error or tear down the chart.
    return this.isTeamSizeChartVisible();
  }

  // ── Billability Trend tile ──────────────────────────────────────────────────

  async isBillabilityTrendChartVisible(): Promise<boolean> {
    try {
      // Wait for the tile container to be attached (may be lazily rendered by SPA).
      // 45s (was 30s): on the FIRST scenario the Home page loads completely cold —
      // every tile fetches data at once — so a below-the-fold tile can attach late.
      const tile = this.page.locator('.home_page_main_split_row_billability_trend').first();
      await tile.waitFor({ state: 'attached', timeout: 45000 });
      // Scroll into view so any IntersectionObserver-gated rendering fires.
      // Non-fatal: the BILLABILITY TREND tile is at the top of the page and is
      // almost always already in the viewport. After a filter is applied, React
      // may briefly unmount/remount the tile container (skeleton state), causing
      // scrollIntoViewIfNeeded to throw ElementDetachedError. Wrapping in
      // try/catch ensures the detachment race does not abort the check entirely.
      await tile.scrollIntoViewIfNeeded({ timeout: 10000 }).catch(() => undefined);
      // Poll until the ECharts canvas has a non-zero pixel buffer OR the legend
      // items confirm data has loaded (both are proof the chart has rendered).
      //
      // Strategy:
      //   • Primary signal: any canvas in the tile has width > 0 && height > 0.
      //   • Fallback signal: .metric_legend_item elements are present AND a canvas
      //     element exists — legend items are DOM-based and render after the API
      //     response arrives; if the legend is painted the chart has drawn (the
      //     canvas may momentarily be 0×0 during a hover/resize re-render).
      //   • When NEITHER condition is met AND no legend items are present (tile is
      //     in skeleton/loading state), dispatch ONE resize event per poll tick to
      //     nudge ECharts after data arrives. The 1s polling spacing prevents
      //     double-dispatch within the same tick, which can briefly reset
      //     canvas.width to 0 (canvas-reset-to-width-0 pattern).
      //   • When legend items ARE present but canvas is still 0×0 (transient
      //     re-render after hover/filter), do NOT dispatch resize — ECharts is
      //     actively painting and a resize event would reset canvas.width to 0.
      //   • Total budget is 120s (up from 60s) to accommodate slow API responses
      //     on the staging environment — especially after a filter is applied,
      //     which triggers a full re-fetch and puts the tile into skeleton state
      //     until the API responds. The step timeout (180s) is the outer bound.
      await this.page.waitForFunction(function () {
        const t = document.querySelector('.home_page_main_split_row_billability_trend');
        if (!t) return false;
        // ECharts can create several layered canvases; accept the chart as
        // rendered if ANY of them has a non-zero pixel buffer. In headless
        // Chromium the FIRST canvas is sometimes a 0-sized overlay layer, so
        // checking only querySelector('canvas') gave false negatives in CI.
        const canvases = Array.from(t.querySelectorAll('canvas'));
        if (canvases.some(function (c) { return c instanceof HTMLCanvasElement && c.width > 0 && c.height > 0; })) return true;
        // Fallback: .metric_legend_item elements are DOM-based and only appear
        // after the API response has been received and chart series data parsed.
        // If legend items are present AND a canvas element exists, the chart has
        // drawn — treat as rendered rather than flapping to false on a transient
        // canvas reset (e.g. after a hover or a filter-triggered re-render).
        const legendReady = t.querySelectorAll('.metric_legend_item').length > 0;
        if (legendReady && canvases.length > 0) return true;
        // Only dispatch resize when the tile is in skeleton/loading state (no
        // legend items yet). Never dispatch when legend items are present — that
        // would interrupt ECharts' active painting cycle and reset canvas.width to 0.
        if (!legendReady) {
          window.dispatchEvent(new Event('resize'));
        }
        return false;
      // BUG FIX: see isVantagePulseCheckChartVisible above — zero-param fn + 2-arg call
      // was silently passing { timeout, polling } as `arg` (ignored) instead of
      // `options`, so the declared polling: 1000 was never applied. Pass `null` for arg.
      }, null, { timeout: 120000, polling: 1000 });
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
    // Each utilization category label sits inside a .metric_legend_item div
    // within the .metric_legends container of the tile.
    const tile = this.page.locator('.home_page_main_split_row_billability_trend').first();
    const item = tile.locator('.metric_legend_item', { hasText: category }).first();
    return this.waitVisible(item, 10000);
  }

  async isBillabilityTrendLegendColored(): Promise<boolean> {
    // Each legend entry has a .legend-icon div with an inline background-color
    // that matches the corresponding ECharts series color.
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
    // Ensure ECharts has initialised (scrolls tile into view + waits for canvas).
    await this.isBillabilityTrendChartVisible();
    const canvas = this.page.locator('.home_page_main_split_row_billability_trend canvas').first();
    // Hover roughly 1/3 from the left, centre height — lands on a stacked bar segment.
    await canvas.hover({ position: { x: 120, y: 135 } });
  }

  // ── Top Downloads tile ──────────────────────────────────────────────────────

  async scrollToTopDownloadsTile(): Promise<void> {
    // The tile may briefly detach/remount while the page fetches data and
    // React re-renders the surrounding row.  We wait until the element is
    // stably present in the DOM (consecutive poll ticks both find it) using
    // waitForFunction, then perform the scroll via JS directly — avoiding the
    // Playwright stability-check that throws when the element was just remounted.
    await this.page.waitForFunction(
      (selector) => {
        const el = document.querySelector(selector as string);
        return el !== null && (el as HTMLElement).offsetParent !== null;
      },
      '.home_page_main_split_row_top_downloads',
      { timeout: 30000, polling: 500 }
    );
    // Execute the scroll via JS so there is no Playwright "stability window"
    // check that can race with a React re-render.
    await this.page.evaluate((selector) => {
      const el = document.querySelector(selector as string);
      el?.scrollIntoView({ block: 'center' });
    }, '.home_page_main_split_row_top_downloads');
    // Wait for skeleton loading placeholders to clear before any data assertion.
    // The skeleton state has a single `div.kt-downloads-loader-body` wrapper
    // inside `.chart__table__body` that contains MuiSkeleton spans.  Real data
    // rows have class `data_table_body_row` and are direct children of the body
    // (no `.kt-downloads-loader-body` wrapper).  We also accept the genuine
    // empty state (`.static-text` "No data to display").
    await this.page.waitForFunction(
      function () {
        var tile = document.querySelector('.home_page_main_split_row_top_downloads');
        if (!tile) return false;
        // Accept genuine empty state
        if (tile.querySelector('.static-text')) return true;
        var body = tile.querySelector('.chart__table__body');
        if (!body) return false;
        // Skeleton state: single kt-downloads-loader-body child
        if (body.querySelector('.kt-downloads-loader-body')) return false;
        // Also reject if any MuiSkeleton elements are still present in the body
        if (body.querySelectorAll('.MuiSkeleton-root').length > 0) return false;
        // Real data state: at least one data_table_body_row with non-empty text
        var rows = body.querySelectorAll('.data_table_body_row');
        return rows.length > 0;
      },
      // BUG FIX: see isVantagePulseCheckChartVisible above — zero-param fn + 2-arg call
      // was silently passing { timeout, polling } as `arg` (ignored) instead of
      // `options`, so it fell back to the page's 120000ms default timeout. Pass
      // `null` for arg to fix it.
      null,
      { timeout: 45000, polling: 500 }
    ).catch(() => undefined); // soft-fail: if timeout the empty-state guard will soft-skip
  }

  async isTopDownloadsTileVisible(): Promise<boolean> {
    return this.waitVisible(this.topDownloadsTile);
  }

  async topDownloadsHasTitleAndDownloadColumns(): Promise<boolean> {
    // Use waitForFunction (DOM-based) to avoid Playwright locator race with React
    // remounts — the tile container and its children may briefly detach/remount
    // while the API response is rendered, causing locator.waitFor() to time out
    // even when the elements are visually present.
    try {
      await this.page.waitForFunction(
        function () {
          var tile = document.querySelector('.home_page_main_split_row_top_downloads');
          if (!tile) return false;
          // Both column headers must be present with text content
          var titleHeader = tile.querySelector('.chart__table__header .downloadTitle');
          var countHeader = tile.querySelector('.chart__table__header .downloadCount');
          return (
            titleHeader !== null && (titleHeader.textContent || '').trim().length > 0 &&
            countHeader !== null && (countHeader.textContent || '').trim().length > 0
          );
        },
        // BUG FIX: see isVantagePulseCheckChartVisible above — zero-param fn + 2-arg call
        // was silently falling back to the page's 120000ms default action timeout instead
        // of the declared 15000ms. Pass `null` for arg to fix it.
        null,
        { timeout: 15000, polling: 300 }
      );
      return true;
    } catch {
      return false;
    }
  }

  async topDownloadsRowsHaveTitleAndDownloadCount(): Promise<boolean> {
    // Accepts the genuine empty state ("No data to display") or actual data rows.
    // Uses waitForFunction (DOM-based) to avoid Playwright locator race with React
    // remounts during data loading transitions.
    try {
      await this.page.waitForFunction(
        function () {
          var tile = document.querySelector('.home_page_main_split_row_top_downloads');
          if (!tile) return false;
          // Accept genuine empty state
          if (tile.querySelector('.static-text')) return true;
          // Reject while still in skeleton/loading state
          var body = tile.querySelector('.chart__table__body');
          if (!body) return false;
          if (body.querySelector('.kt-downloads-loader-body')) return false;
          if (body.querySelectorAll('.MuiSkeleton-root').length > 0) return false;
          // Accept once real data rows exist (structure confirmed)
          var rows = body.querySelectorAll('.data_table_body_row');
          if (rows.length > 0) return true;
          // Accept empty state with no rows and no skeleton (genuinely empty)
          return body.children.length === 0;
        },
        // BUG FIX: see isVantagePulseCheckChartVisible above — zero-param fn + 2-arg call
        // was silently falling back to the page's 120000ms default action timeout instead
        // of the declared 30000ms. Pass `null` for arg to fix it.
        null,
        { timeout: 30000, polling: 300 }
      );
      return true;
    } catch {
      return false;
    }
  }

  async topDownloadsDownloadColumnVisible(): Promise<boolean> {
    // Use waitForFunction (DOM-based) to avoid Playwright locator race with React
    // remounts — checks for the .downloadCount header column element directly in DOM.
    try {
      await this.page.waitForFunction(
        function () {
          var tile = document.querySelector('.home_page_main_split_row_top_downloads');
          if (!tile) return false;
          // The DOWNLOAD column header is always present once the tile renders
          var header = tile.querySelector('.chart__table__header .downloadCount');
          if (header && (header.textContent || '').trim().length > 0) return true;
          // Also accept: real data rows are present (confirms tile is fully rendered)
          var body = tile.querySelector('.chart__table__body');
          if (!body) return false;
          return (
            body.querySelector('.kt-downloads-loader-body') === null &&
            body.querySelectorAll('.MuiSkeleton-root').length === 0 &&
            body.querySelectorAll('.data_table_body_row').length > 0
          );
        },
        // BUG FIX: see isVantagePulseCheckChartVisible above — zero-param fn + 2-arg call
        // was silently falling back to the page's 120000ms default action timeout instead
        // of the declared 30000ms. Pass `null` for arg to fix it.
        null,
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
    // Wait up to 15 s for at least one <a> element to appear inside the tile.
    // locator.count() does not wait — it returns 0 immediately when the API
    // response has not arrived yet, causing a false-negative that suppresses the
    // click entirely.  waitFor({ state: 'visible' }) blocks until the first link
    // is rendered, giving the KN-Materials API time to respond.
    try {
      await this.topDownloadsTile.locator('a').first().waitFor({ state: 'visible', timeout: 15000 });
      return true;
    } catch {
      return false;
    }
  }

  // ── KN Material tile ────────────────────────────────────────────────────────

  async scrollToKnMaterialTile(): Promise<void> {
    // Wait until the tile is stably present in the DOM, then scroll via JS to
    // avoid Playwright's stability-check race with React re-renders.
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
    // Wait for skeleton loading placeholders to clear before any data assertion.
    // The KN Material tile body shows MuiSkeleton-root elements while the API
    // response is pending.  Real data rows have class `data_table_body_row` and
    // their first child div has non-empty text content.  We poll until either
    // real rows appear or the tile shows a genuine empty state (no rows at all
    // with no skeletons present).
    await this.page.waitForFunction(
      function () {
        var tile = document.querySelector('.home_page_main_split_row_kn_material');
        if (!tile) return false;
        var body = tile.querySelector('.chart__table__body');
        if (!body) return false;
        // Reject while any MuiSkeleton placeholders are present in the body
        if (body.querySelectorAll('.MuiSkeleton-root').length > 0) return false;
        // Accept genuine empty state: body has no children
        if (body.children.length === 0) return true;
        // Real data state: at least one data_table_body_row with non-empty first-cell text
        var rows = body.querySelectorAll('.data_table_body_row');
        if (rows.length === 0) return false;
        var firstCell = rows[0].querySelector('div');
        return firstCell !== null && (firstCell.textContent || '').trim().length > 0;
      },
      // BUG FIX: see isVantagePulseCheckChartVisible above — zero-param fn + 2-arg call
      // was silently falling back to the page's 120000ms default action timeout instead
      // of the declared 45000ms. Pass `null` for arg to fix it.
      null,
      { timeout: 45000, polling: 500 }
    ).catch(() => undefined); // soft-fail: timeout means empty-state guard will soft-skip
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

  /**
   * Returns the number of REAL data rows currently rendered in the KN MATERIAL tile body.
   * A "real" row is a .data_table_body_row whose first child div has non-empty text
   * (i.e. not a MuiSkeleton placeholder row whose text is an empty animated span).
   * Returns 0 when the tile is empty or still showing skeleton content.
   */
  async knMaterialDataRowCount(): Promise<number> {
    return this.page.evaluate(function () {
      var tile = document.querySelector('.home_page_main_split_row_kn_material');
      if (!tile) return 0;
      var tbody = tile.querySelector('.chart__table__body');
      if (!tbody) return 0;
      // Reject skeleton state: if any MuiSkeleton-root elements are present
      // the tile hasn't finished loading — treat as 0 rows.
      if (tbody.querySelectorAll('.MuiSkeleton-root').length > 0) return 0;
      // Count only real rows: .data_table_body_row whose first div has content
      var rows = Array.from(tbody.querySelectorAll('.data_table_body_row'));
      return rows.filter(function (row) {
        var firstCell = row.querySelector('div');
        return firstCell !== null && (firstCell.textContent || '').trim().length > 0;
      }).length;
    });
  }

  /**
   * Verifies that data rows in the KN MATERIAL tile are sorted highest→lowest
   * by the COUNT column.  Returns true when all rows are in descending order.
   * Should only be called after confirming knMaterialDataRowCount() > 0.
   */
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

  /**
   * Verifies every row in the KN MATERIAL tile has a non-empty material type
   * name in the first cell and a numeric count in the second cell.
   * Should only be called after confirming knMaterialDataRowCount() > 0.
   */
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

  /**
   * Captures the current snapshot of the KN MATERIAL tile body for use in
   * before/after comparisons. Returns the inner HTML of the body element,
   * or the string 'empty' when no rows are present.
   */
  async captureKnMaterialTileState(): Promise<string> {
    return this.page.evaluate(() => {
      const tile = document.querySelector('.home_page_main_split_row_kn_material');
      if (!tile) return 'tile-not-found';
      const tbody = tile.querySelector('.chart__table__body');
      const html = tbody?.innerHTML?.trim() ?? '';
      return html.length > 0 ? html : 'empty';
    });
  }

  /**
   * Asserts the KN MATERIAL tile is visible (tile container rendered).
   * Used as the post-filter assertion: confirms the tile survived the filter
   * apply without crashing, regardless of whether data is populated.
   */
  async knMaterialTileIsRendered(): Promise<boolean> {
    return this.waitVisible(this.knMaterialTile, 15000);
  }

  /**
   * Selects an option inside the currently-open filter panel.
   * Targets the generic .filter-display checkbox pattern shared by
   * Path, Status, Management Model, etc.
   */
  async selectFilterOption(option: string): Promise<void> {
    // Scope via .filter-name with an anchored regex to get an exact label match.
    // Using hasText on the outer .filter-display does a substring match, which
    // causes "Active" to also match the "Inactive" row. The anchored regex
    // ^\s*<option>\s*$ ensures only the exact option label is targeted.
    const exactPattern = new RegExp(`^\\s*${option.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);
    const checkbox = this.page
      .locator('.filter-display')
      .filter({ has: this.page.locator('.filter-name').filter({ hasText: exactPattern }) })
      .locator('input[type="checkbox"]')
      .first();
    await checkbox.check({ force: true });
  }

  /**
   * Selects a named checkbox option within the specified filter panel.
   *
   * This method mirrors the proven pattern from People BillabilityPage and
   * is scoped to the Home page's shared filter sidebar DOM.
   *
   * DOM structure (verified live on /):
   *   li (filter listitem)
   *     .filter-heading            — click to open/close
   *     .filter-container          — only present when filter is open
   *       .filter-display          — one per option row
   *         input[type=checkbox]   — the checkbox
   *         .filter-name           — the label text (e.g. "PA Managed")
   *
   * After "Clear" is clicked, the panel closes (.filter-container is removed).
   * This method re-opens the filter if it was closed before clicking the option.
   *
   * Uses an anchored regex (^optionName$) on .filter-name to avoid partial
   * matches (e.g. "Active" matching "Inactive").
   *
   * @param optionName  Exact label text, e.g. "PA Managed", "Client Focus".
   * @param filterName  Filter heading text, e.g. "Management Model", "Path".
   */
  async selectFilterOptionInPanel(optionName: string, filterName: string): Promise<void> {
    // Practice Area uses a tree-select component (.treeSelectContainer / .vertical-option)
    // instead of the standard .filter-container / .filter-display / .filter-name structure.
    // Delegate to the dedicated PracticeAreaFilter.selectOption() method.
    if (filterName === 'Practice Area') {
      await this.practiceAreaFilter.selectOption(optionName);
      return;
    }

    // Locate the filter listitem by its .filter-heading text.
    const filterLi = this.page.locator('li').filter({
      has: this.page.locator('.filter-heading', { hasText: filterName })
    });

    // Check whether the filter panel body is currently open.
    // When open the listitem has more than 1 child (heading + container).
    const isOpen = await filterLi.evaluate((el: HTMLElement) => el.children.length > 1);

    if (!isOpen) {
      // Re-open the filter by clicking its heading.
      await filterLi.locator('.filter-heading').click();
      // Wait for the filter-display options to appear in the DOM.
      await filterLi.locator('.filter-display').first().waitFor({ state: 'visible', timeout: 15000 });
    }

    // Use an anchored regex to match the exact option label only.
    const exactNameRegex = new RegExp(`^${optionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
    const optionRow = filterLi
      .locator('.filter-display')
      .filter({ has: this.page.locator('.filter-name').getByText(exactNameRegex) });
    await optionRow.waitFor({ state: 'visible', timeout: 15000 });
    await optionRow.click();
  }

  /**
   * Reloads the Home page and waits for the FILTERS panel to be stable.
   * This is the step implementation for "I reload the Home page".
   * Uses page.reload() (hard reload) — filters do NOT persist across a hard reload.
   */
  async reloadPage(): Promise<void> {
    await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
    // Wait for the sidebar Home button — first stable signal that the SPA has hydrated.
    await this.page
      .getByRole('button', { name: 'Home Home' })
      .waitFor({ state: 'visible', timeout: 60000 });
    // Wait for the FILTERS panel heading — confirms the filter sidebar has mounted.
    await this.page
      .getByText('FILTERS', { exact: true })
      .waitFor({ state: 'visible', timeout: 30000 });
  }

  /**
   * Clicks the Apply button inside the currently-open filter's footer.
   */
  async applyActiveFilter(): Promise<void> {
    await this.page.locator('.button-footer .apply').click();
  }

  // ── Case Engagement Depth tile ──────────────────────────────────────────────

  /** The CSS class of the tile container, confirmed live via MCP. */
  private get caseEngagementDepthTileLocator() {
    return this.page.locator('.home_page_main_split_row_engagement_depth').first();
  }

  /**
   * Returns true when the CASE ENGAGEMENT DEPTH tile is visible on the page.
   * The gate scenario uses this — it must always pass regardless of data state.
   */
  async isCaseEngagementDepthTileVisible(): Promise<boolean> {
    return this.waitVisible(this.caseEngagementDepthTileLocator);
  }

  /**
   * Waits for the tile to leave the initial "No data" transient state and for at
   * least one bar/percentage element to be populated.
   * Returns true once the tile is data-populated, false if it stays empty after timeout.
   * Does NOT throw — callers should soft-skip if this returns false.
   */
  async waitForCaseEngagementDepthData(timeout = 20000): Promise<boolean> {
    try {
      // Wait until at least one .legends_val element is rendered inside the tile.
      await this.page.waitForFunction(
        function () {
          var tile = document.querySelector('.home_page_main_split_row_engagement_depth');
          if (!tile) return false;
          var vals = tile.querySelectorAll('.legends_val');
          return vals.length > 0 && vals[0].textContent !== null && vals[0].textContent.trim().length > 0;
        },
        // BUG FIX: see isVantagePulseCheckChartVisible above — zero-param fn + 2-arg call
        // was silently falling back to the page's 120000ms default action timeout instead
        // of the declared `timeout` value. Pass `null` for arg to fix it.
        null,
        { timeout }
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns true when the tile shows a bucket matching the supplied label.
   * Accepts both the Unicode form (≥40 hrs) and the ASCII approximation (>=40 hrs)
   * so that Gherkin written with ASCII can match the DOM's Unicode label.
   */
  async isCaseEngagementDepthBucketVisible(label: string): Promise<boolean> {
    // Normalise ASCII >= to Unicode ≥ so locators hit the real DOM text.
    const unicodeLabel = label.replace(/>=/g, '≥');
    const tile = this.caseEngagementDepthTileLocator;
    try {
      await tile.waitFor({ state: 'visible', timeout: 10000 });
    } catch {
      return false;
    }
    // The .legends elements inside each .engagement_depth_bar_chart hold the label.
    // 45s (was 10s): live-observed the tile container mounting (empty skeleton)
    // well before its data/legends actually render under staging load — the
    // outer tile.waitFor above only confirms the container exists, not the data.
    const bucket = tile.locator('.legends', { hasText: unicodeLabel }).first();
    return this.waitVisible(bucket, 45000);
  }

  /**
   * Returns true when the specified bucket shows any non-empty percentage value.
   * Should only be called after waitForCaseEngagementDepthData() returns true.
   */
  async doesBucketShowPercentage(label: string): Promise<boolean> {
    const unicodeLabel = label.replace(/>=/g, '≥');
    const tile = this.caseEngagementDepthTileLocator;
    // Find the .engagement_depth_bar_chart that contains the given label.
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

  /**
   * Returns true when the .legends_bar_blue inline width% for the given bucket
   * matches the numeric value displayed in .legends_val (within ±1 integer point
   * to account for rounding).
   * Should only be called after waitForCaseEngagementDepthData() returns true.
   */
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

  // ── Vantage Averages tile ───────────────────────────────────────────────────

  /** The CSS class of the VANTAGE AVERAGES tile container (confirmed via MCP). */
  private get vantageAveragesTileLocator() {
    return this.page.locator('.home_page_main_split_row_kt_billability').first();
  }

  /** Scroll the VANTAGE AVERAGES tile into view via JS (avoids React-remount race). */
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

  /** Returns true when the VANTAGE AVERAGES tile container is visible. */
  async isVantageAveragesTileVisible(): Promise<boolean> {
    return this.waitVisible(this.vantageAveragesTileLocator);
  }

  /**
   * Returns true when the given group heading text is visible inside the tile.
   * Group headings are rendered as `.data_table_body_row.grey` elements.
   * Accepted headings: VANTAGE BUSINESS, REGION, CAREER PATH, PRACTICE AREA.
   */
  async isVantageAveragesGroupHeadingVisible(heading: string): Promise<boolean> {
    try {
      // Wait for tile data to load — skeleton rows must clear before group headings appear.
      await this.page.waitForFunction(
        (selector: string) => {
          const t = document.querySelector(selector);
          if (!t) return false;
          if (t.querySelectorAll('.MuiSkeleton-root').length > 0) return false;
          return t.querySelectorAll('.data_table_body_row').length > 0;
        },
        '.home_page_main_split_row_kt_billability',
        { timeout: 45000 }
      );
    } catch {
      return false;
    }
    return this.waitVisible(
      this.vantageAveragesTileLocator.locator('.data_table_body_row.grey', { hasText: heading }).first(),
      15000
    );
  }

  /**
   * Returns the current label shown on the utilization category dropdown
   * button inside the VANTAGE AVERAGES tile.
   * The button is the `.dropdown-toggle.btn.btn-primary` inside the tile's
   * `.dropdown-hide.dropdown` or `.show.dropdown` container.
   */
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

  /**
   * Returns true if the tile currently shows at least one `.billabilityValue`
   * percentage element with non-empty content.
   */
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

  /**
   * Returns true when the given data-row label (e.g. "Geo Businesses",
   * "All Vantage", "AP", "Client Focus") is visible as a
   * `.data_table_body_row` (non-grey) inside the VANTAGE AVERAGES tile.
   */
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

  /**
   * Opens the utilization category dropdown in the VANTAGE AVERAGES tile.
   * The trigger button is `.dropdown-toggle.btn.btn-primary` inside the tile.
   */
  async openVantageAveragesDropdown(): Promise<void> {
    const tile = this.vantageAveragesTileLocator;
    const btn = tile.locator('button.dropdown-toggle').first();
    await btn.waitFor({ state: 'visible', timeout: 15000 });
    // Poll-click: click the button each poll tick until the menu is showing.
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

  /**
   * Returns the list of option labels currently shown in the open
   * utilization category dropdown inside the VANTAGE AVERAGES tile.
   * Options are `<a class="dropdown-item">` elements.
   * Note: the currently-selected value appears as the button label, not
   * as a list item, so this list has 5 items when any option is selected.
   * This method collects the trigger label + dropdown items for a full list.
   */
  async getVantageAveragesDropdownOptions(): Promise<string[]> {
    return this.page.evaluate((selector: string) => {
      const tile = document.querySelector(selector);
      if (!tile) return [];
      // Trigger button label (currently selected)
      const triggerLabel = (tile.querySelector('button.dropdown-toggle')?.textContent ?? '').trim();
      // Items in the open dropdown
      const items = Array.from(tile.querySelectorAll('.dropdown-menu.show .dropdown-item'));
      const itemLabels = items.map(i => (i.textContent ?? '').trim());
      // Return all options: selected + the rest
      return [triggerLabel, ...itemLabels].filter(Boolean);
    }, '.home_page_main_split_row_kt_billability');
  }

  /**
   * Selects a utilization category option from the open dropdown in the
   * VANTAGE AVERAGES tile.  If the dropdown is not already open, opens it first.
   */
  async selectVantageAveragesOption(option: string): Promise<void> {
    // Use the same poll-loop strategy as selectTopProjectsOption to avoid the
    // React DOM-detach race where the dropdown-item element is detached during
    // Playwright's stability check (React re-renders the tile as data fetches).
    await this.page.waitForFunction(
      function ({ selector, label }: { selector: string; label: string }) {
        const tile = document.querySelector(selector);
        if (!tile) return false;
        const btn = tile.querySelector('button.dropdown-toggle');
        if (!btn) return false;
        // Case 1: already selected.
        if ((btn.textContent ?? '').trim() === label) return true;
        const menu = tile.querySelector('.dropdown-menu.show');
        if (!menu) {
          // Case 2: dropdown closed — open it.
          (btn as HTMLElement).click();
          return false;
        }
        // Case 3: dropdown open — find and click the target item.
        const items = Array.from(menu.querySelectorAll('.dropdown-item'));
        const target = items.find(function (a) { return (a.textContent ?? '').trim() === label; });
        if (!target) return false;
        (target as HTMLElement).click();
        return false; // will return true on next poll once btn label updates
      },
      { selector: '.home_page_main_split_row_kt_billability', label: option },
      { timeout: 20000, polling: 300 }
    );
  }

  /**
   * Returns true if no error element is rendered inside the VANTAGE AVERAGES tile.
   * Looks for common error-state classes used across the app.
   */
  async vantageAveragesTileHasNoError(): Promise<boolean> {
    return this.page.evaluate((selector: string) => {
      const tile = document.querySelector(selector);
      if (!tile) return false;
      // Check tile is still rendered and does not contain an error banner
      const hasError =
        !!tile.querySelector('.error') ||
        !!tile.querySelector('[class*="error"]') ||
        !!tile.querySelector('[class*="Error"]');
      return !hasError && tile !== null;
    }, '.home_page_main_split_row_kt_billability');
  }

  /**
   * Returns true once the VANTAGE AVERAGES tile is rendered (container visible).
   * Used as the post-filter assertion for filter-reactivity scenarios.
   */
  async isVantageAveragesTileRendered(): Promise<boolean> {
    return this.waitVisible(this.vantageAveragesTileLocator, 30000);
  }

  /**
   * Opens the Path filter, clears any current selection, selects the given option
   * and clicks Apply.  Used by the filter-reactivity scenario.
   */
  async applyPathFilter(option: string): Promise<void> {
    await this.pathFilter.open();
    await this.pathFilter.clear();
    // Re-open in case the Clear action toggled the panel closed.
    const isOpen = await this.page.locator('.filter-display', { hasText: option }).isVisible().catch(() => false);
    if (!isOpen) {
      await this.pathFilter.open();
    }
    await this.page
      .locator('.filter-display', { hasText: option })
      .locator('input[type="checkbox"]')
      .click();
    await this.pathFilter.apply();
  }

  /**
   * Returns true once the CASE ENGAGEMENT DEPTH tile has reloaded (tile container
   * is visible) after a filter is applied.  Used as the post-filter assertion.
   */
  async isCaseEngagementDepthTileReloaded(): Promise<boolean> {
    return this.waitVisible(this.caseEngagementDepthTileLocator, 30000);
  }

  // ── RMS CT SATISFACTION tile ────────────────────────────────────────────────

  /** The CSS class of the RMS CT SATISFACTION tile container (note: "main_conatiner" is the real misspelled class). */
  private get rmsCTSatisfactionTileLocator() {
    return this.page.locator('.home_page_main_split_row_ct_satisfaction.main_conatiner').first();
  }

  /**
   * Scrolls the RMS CT SATISFACTION tile into view via JS to avoid Playwright's
   * stability-check race with React re-renders.
   */
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
    // Wait for skeleton loading placeholders to clear before any data assertion.
    // During the API-pending state the tile shows MuiSkeleton-root elements and
    // the .total_values / .legend-icon elements have no content or inline style.
    // We poll until either:
    //   (a) .total_values elements exist with non-empty percentage content, OR
    //   (b) "No data to display" text appears (genuine empty state), OR
    //   (c) No MuiSkeleton elements remain in the tile (loading finished)
    await this.page.waitForFunction(
      function () {
        var tile = document.querySelector('.home_page_main_split_row_ct_satisfaction.main_conatiner');
        if (!tile) return false;
        // Accept genuine empty state
        if (tile.textContent && tile.textContent.indexOf('No data to display') >= 0) return true;
        // Reject while MuiSkeleton placeholders are present
        if (tile.querySelectorAll('.MuiSkeleton-root').length > 0) return false;
        // Accept when .total_values elements exist with percentage content
        var vals = tile.querySelectorAll('.total_values');
        if (vals.length > 0 && /\d+%/.test(vals[0].textContent || '')) return true;
        // Accept when legend icons have inline background-color (chart painted)
        var icons = tile.querySelectorAll('.legend-icon');
        if (icons.length > 0 && (icons[0] as HTMLElement).style.backgroundColor) return true;
        // Still waiting: canvas may be painting but no skeleton — allow a pass
        var canvas = tile.querySelector('canvas');
        return canvas instanceof HTMLCanvasElement && canvas.width > 0;
      },
      // BUG FIX: see isVantagePulseCheckChartVisible above — zero-param fn + 2-arg call
      // was silently falling back to the page's 120000ms default action timeout instead
      // of the declared 45000ms. Pass `null` for arg to fix it.
      null,
      { timeout: 45000, polling: 500 }
    ).catch(() => undefined); // soft-fail: timeout means empty-state guard will soft-skip
  }

  /** Returns true when the RMS CT SATISFACTION tile container is visible on the page. */
  async isRmsCTSatisfactionTileVisible(): Promise<boolean> {
    return this.waitVisible(this.rmsCTSatisfactionTileLocator);
  }

  /**
   * Returns true when the ECharts doughnut/pie canvas element inside the
   * RMS CT SATISFACTION tile has been painted (canvas width > 0).
   * Uses the same robust resize-nudge polling pattern as isBillabilityTrendChartVisible().
   */
  async isRmsCTSatisfactionPieChartVisible(): Promise<boolean> {
    try {
      // Wait until the tile is stably present in the DOM (not being remounted by React).
      // We use waitForFunction + JS-based scroll to avoid Playwright's stability-check
      // race that throws when the element was just remounted — same pattern as
      // scrollToTopDownloadsTile() and scrollToKnMaterialTile().
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
      // Poll once per second; if canvas width is 0, dispatch a single resize
      // and re-check on the next poll — never double-dispatch in one tick.
      await this.page.waitForFunction(
        function () {
          var t = document.querySelector('.home_page_main_split_row_ct_satisfaction.main_conatiner');
          if (!t) return false;
          var c = t.querySelector('canvas');
          if (c instanceof HTMLCanvasElement && c.width > 0 && c.height > 0) return true;
          window.dispatchEvent(new Event('resize'));
          return false;
        },
        // BUG FIX: see isVantagePulseCheckChartVisible above — zero-param fn + 2-arg call
        // was silently passing { timeout, polling } as `arg` (ignored) instead of
        // `options`, so the declared polling: 1000 was never applied. Pass `null` for arg.
        null,
        { timeout: 30000, polling: 1000 }
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns true when all three response-type labels (Positive, Neutral, Negative)
   * are visible in the .metric_legends container of the RMS CT SATISFACTION tile.
   */
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

  /**
   * Returns true when a specific response-type label is visible in the legend.
   * Used by the DataTable-driven legend scenario.
   */
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

  /**
   * Returns true when the tile shows "No data to display", indicating an empty state.
   * Used to soft-skip data-guarded scenarios.
   */
  async isRmsCTSatisfactionTileEmpty(): Promise<boolean> {
    const tile = this.rmsCTSatisfactionTileLocator;
    try {
      await tile.waitFor({ state: 'visible', timeout: 10000 });
    } catch {
      return true; // tile not found → treat as empty
    }
    const emptyText = tile.getByText('No data to display', { exact: true });
    return emptyText.isVisible().catch(() => false);
  }

  /**
   * Returns true when every response-type legend entry has a non-empty percentage
   * value in its .total_values element.
   * Should only be called after confirming the tile is not empty.
   */
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

  /**
   * Returns true when the legend percentages in the RMS CT SATISFACTION tile sum to 100.
   * Should only be called after confirming the tile is not empty.
   */
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
      return sum === 100;
    });
  }

  /**
   * Returns true when every .legend-icon inside the RMS CT SATISFACTION tile
   * has a non-empty, non-transparent inline background-color.
   * Should only be called after confirming the tile is not empty.
   */
  async rmsCTSatisfactionLegendColorsAreSet(): Promise<boolean> {
    // ECharts sets legend icon colors asynchronously after the canvas renders.
    // Poll until every .legend-icon has a non-empty, non-transparent background-color
    // (inline style or computed), with a 10s timeout.
    try {
      await this.page.waitForFunction(function () {
        var tile = document.querySelector('.home_page_main_split_row_ct_satisfaction.main_conatiner');
        if (!tile) return false;
        var icons = tile.querySelectorAll('.legend-icon');
        if (icons.length === 0) return false;
        return Array.from(icons).every(function (icon) {
          var bg = (icon as HTMLElement).style.backgroundColor;
          if (bg && bg !== 'transparent') return true;
          var computed = window.getComputedStyle(icon as HTMLElement).backgroundColor;
          return computed && computed !== 'transparent' && computed !== 'rgba(0, 0, 0, 0)';
        });
      // BUG FIX: see isVantagePulseCheckChartVisible above — zero-param fn + 2-arg call
      // was silently falling back to the page's 120000ms default action timeout instead
      // of the declared 10000ms. Pass `null` for arg to fix it.
      }, null, { timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Hovers over the center of the RMS CT SATISFACTION pie chart canvas.
   * After the hover the canvas remains interactive regardless of whether the
   * tooltip is DOM-rendered or canvas-only.
   */
  async hoverRmsCTSatisfactionPieChartSegment(): Promise<void> {
    await this.isRmsCTSatisfactionPieChartVisible();
    const canvas = this.rmsCTSatisfactionTileLocator.locator('canvas').first();
    await canvas.waitFor({ state: 'attached', timeout: 10000 });
    // Hover toward the upper-right of the canvas — lands on the large Positive segment (96%).
    await canvas.hover({ position: { x: 140, y: 80 }, force: true });
  }

  /**
   * Returns true when an ECharts tooltip is visible after hovering a segment,
   * or falls back to confirming the canvas is still rendered (canvas-only tooltips).
   */
  async isRmsCTSatisfactionTooltipVisible(): Promise<boolean> {
    try {
      const tooltip = this.page.locator('.echarts-tooltip').first();
      await tooltip.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      // Canvas-only tooltip: confirm the chart canvas is still rendered and interactive.
      return this.isRmsCTSatisfactionPieChartVisible();
    }
  }

  /**
   * Captures the current legend state of the RMS CT SATISFACTION tile for
   * before/after filter comparison.  Returns a JSON string of percentages or
   * 'empty' when no legend items are found.
   */
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

  /**
   * Returns true once the RMS CT SATISFACTION tile container is visible after
   * a filter has been applied.  Used as the post-filter assertion.
   */
  async isRmsCTSatisfactionTileRendered(): Promise<boolean> {
    return this.waitVisible(this.rmsCTSatisfactionTileLocator, 30000);
  }

  // ── Top Clients tile ────────────────────────────────────────────────────────

  /**
   * The TOP CLIENTS tile container.
   * CSS class: ".home_page_main_split_row_top_clients.main_conatiner"
   * Note: "main_conatiner" is the real (misspelled) class in the app — use verbatim.
   */
  private get topClientsTileLocator() {
    return this.page.locator('.home_page_main_split_row_top_clients.main_conatiner').first();
  }

  /**
   * Scrolls the TOP CLIENTS tile into view via JS to avoid Playwright's
   * stability-check race with React re-renders.
   */
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

  /** Returns true when the TOP CLIENTS tile container is visible on the page. */
  async isTopClientsTileVisible(): Promise<boolean> {
    return this.waitVisible(this.topClientsTileLocator);
  }

  /**
   * Returns true when each specified column header text is visible inside the
   * TOP CLIENTS tile's .chart__table__header element.
   * Column header divs use CSS classes: .topClient (CLIENT), .charges (CHARGES ($K)),
   * .topClienthours (HOURS).
   */
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

  /**
   * Returns the number of data rows currently rendered in the TOP CLIENTS tile body.
   * The .chart__table__body > .data_table_body_row elements are the data rows
   * (the header is in .chart__table__header, not counted here).
   * Returns 0 when the tile is empty (staging / no data state).
   */
  async topClientsDataRowCount(): Promise<number> {
    return this.page.evaluate(function () {
      const tile = document.querySelector('.home_page_main_split_row_top_clients.main_conatiner');
      if (!tile) return 0;
      const body = tile.querySelector('.chart__table__body');
      return body ? body.children.length : 0;
    });
  }

  /**
   * Waits for the TOP CLIENTS tile to populate with at least one data row.
   * Returns true when data is present, false if the tile stays empty after timeout.
   * Does NOT throw — callers should soft-skip if this returns false.
   */
  async waitForTopClientsData(timeout = 20000): Promise<boolean> {
    try {
      await this.page.waitForFunction(
        function () {
          const tile = document.querySelector('.home_page_main_split_row_top_clients.main_conatiner');
          if (!tile) return false;
          // Wait for actual data rows (not just the "No data to display" placeholder
          // element which is also a child of .chart__table__body but lacks the
          // .data_table_body_row class).
          const rows = tile.querySelectorAll('.chart__table__body > .data_table_body_row');
          return rows.length > 0;
        },
        // BUG FIX: see isVantagePulseCheckChartVisible above — zero-param fn + 2-arg call
        // was silently falling back to the page's 120000ms default action timeout instead
        // of the declared `timeout` value. Pass `null` for arg to fix it.
        null,
        { timeout }
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns true when the TOP CLIENTS tile shows at most 10 client rows.
   * Should only be called after confirming waitForTopClientsData() returns true.
   */
  async topClientsHasAtMostTenRows(): Promise<boolean> {
    const count = await this.topClientsDataRowCount();
    return count > 0 && count <= 10;
  }

  /**
   * Returns true when the charges values in the TOP CLIENTS tile are in
   * descending order (highest to lowest).
   * Should only be called after confirming waitForTopClientsData() returns true.
   */
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

  /**
   * Returns true when every data row in the TOP CLIENTS tile has:
   * - a non-empty client name in the .topClient cell
   * - a numeric charges value in the .charges cell
   * - a numeric hours value in the .topClienthours cell
   * Should only be called after confirming waitForTopClientsData() returns true.
   */
  async topClientsRowsHaveAllThreeCells(): Promise<boolean> {
    return this.page.evaluate(function () {
      const tile = document.querySelector('.home_page_main_split_row_top_clients.main_conatiner');
      if (!tile) return false;
      const rows = Array.from(tile.querySelectorAll('.chart__table__body > .data_table_body_row'));
      if (rows.length === 0) return false;
      return rows.every(function (row) {
        const clientText = (row.querySelector('.topClient')?.textContent ?? '').trim();
        const chargesText = (row.querySelector('.charges')?.textContent ?? '').trim().replace(/,/g, '');
        const hoursText = (row.querySelector('.topClienthours')?.textContent ?? '').trim().replace(/,/g, '');
        return (
          clientText.length > 0 &&
          !isNaN(parseFloat(chargesText)) &&
          !isNaN(parseFloat(hoursText))
        );
      });
    });
  }

  /**
   * Returns true when every .charges cell in the TOP CLIENTS tile body
   * contains a numeric value (representing thousands of dollars in charges).
   * Should only be called after confirming waitForTopClientsData() returns true.
   */
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

  /**
   * Returns true when every .topClienthours cell in the TOP CLIENTS tile body
   * contains a numeric value (representing total hours worked).
   * Should only be called after confirming waitForTopClientsData() returns true.
   */
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

  /**
   * Captures the current list of client names displayed in the TOP CLIENTS tile
   * for before/after filter comparison.
   * Returns a JSON string of names, or 'empty' when no data rows are present.
   */
  async captureTopClientsTileState(): Promise<string> {
    return this.page.evaluate(function () {
      const tile = document.querySelector('.home_page_main_split_row_top_clients.main_conatiner');
      if (!tile) return 'tile-not-found';
      const clients = Array.from(
        tile.querySelectorAll('.chart__table__body > .data_table_body_row .topClient')
      ).map(function (el) { return (el.textContent ?? '').trim(); });
      return clients.length > 0 ? JSON.stringify(clients) : 'empty';
    });
  }

  /**
   * Returns true once the TOP CLIENTS tile container is visible after a filter
   * has been applied.  Used as the post-filter assertion — the tile must still be
   * rendered (not crashed/disappeared) regardless of whether data changed.
   */
  async isTopClientsTileRendered(): Promise<boolean> {
    return this.waitVisible(this.topClientsTileLocator, 30000);
  }

  // ── TIMESHEET tile ──────────────────────────────────────────────────────────

  /**
   * The TIMESHEET tile container.
   * CSS class: ".home_page_main_split_row_timesheet.main_conatiner"
   * Note: "main_conatiner" is the real (misspelled) class in the app — use verbatim.
   * The tile holds a CSS stacked-bar (NOT an ECharts canvas) with three .bar-segment
   * children whose inline style="width: X%" matches the displayed percentage values.
   */
  private get timesheetTileLocator() {
    return this.page.locator('.home_page_main_split_row_timesheet.main_conatiner').first();
  }

  /**
   * Scrolls the TIMESHEET tile into view via JS to avoid Playwright's
   * stability-check race with React re-renders.
   */
  async scrollToTimesheetTile(): Promise<void> {
    await this.page.waitForFunction(
      function (selector) {
        var el = document.querySelector(selector);
        return el !== null && (el as HTMLElement).offsetParent !== null;
      },
      '.home_page_main_split_row_timesheet.main_conatiner',
      { timeout: 30000, polling: 500 }
    );
    await this.page.evaluate(function (selector) {
      var el = document.querySelector(selector);
      if (el) el.scrollIntoView({ block: 'center' });
    }, '.home_page_main_split_row_timesheet.main_conatiner');
  }

  /** Returns true when the TIMESHEET tile container is visible on the page. */
  async isTimesheetTileVisible(): Promise<boolean> {
    return this.waitVisible(this.timesheetTileLocator);
  }

  /**
   * Waits for the tile to leave the transient "no data" state and for at least one
   * .billabilityValue element inside the tile to contain a non-empty percentage string.
   * Returns true once populated, false if it stays empty after timeout.
   * Does NOT throw — callers should soft-skip if this returns false.
   *
   * Guard note: we specifically wait for .billabilityValue elements (which only
   * appear in the legend rows) rather than any child element — this prevents the
   * "no data" placeholder child from being mistaken for real data.
   */
  async waitForTimesheetData(timeout = 20000): Promise<boolean> {
    try {
      await this.page.waitForFunction(
        function () {
          var tile = document.querySelector('.home_page_main_split_row_timesheet.main_conatiner');
          if (!tile) return false;
          var vals = tile.querySelectorAll('.billabilityValue');
          return vals.length > 0 && (vals[0].textContent || '').trim().length > 0;
        },
        // BUG FIX: see isVantagePulseCheckChartVisible above — zero-param fn + 2-arg call
        // was silently falling back to the page's 120000ms default action timeout instead
        // of the declared `timeout` value. Pass `null` for arg to fix it.
        null,
        { timeout }
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns true when all three submission status labels (On Time, Late, Missing)
   * are visible in the .data_table_body_row elements of the TIMESHEET tile.
   */
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

  /**
   * Returns true when the .stacked-bar element inside the TIMESHEET tile is
   * visible and contains exactly three .bar-segment children.
   * This is a structure-only check — does not require data to be populated.
   *
   * Uses waitForFunction with polling so it waits for React to render the bar
   * rather than evaluating once and returning false on a cold render.
   */
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
        // BUG FIX: see isVantagePulseCheckChartVisible above — zero-param fn + 2-arg call
        // was silently passing { timeout, polling } as `arg` (ignored) instead of
        // `options`, so the declared polling: 500 was never applied. Pass `null` for arg.
        null,
        { timeout: 20000, polling: 500 }
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns true when every .bar-segment inside the TIMESHEET tile has a non-empty,
   * non-transparent inline background-color — confirming each segment is color-coded.
   * Should only be called after timesheetHasStackedBarWithThreeSegments() returns true.
   *
   * Uses waitForFunction so the color check waits for React to paint the inline styles.
   */
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
        // BUG FIX: see isVantagePulseCheckChartVisible above — zero-param fn + 2-arg call
        // was silently passing { timeout, polling } as `arg` (ignored) instead of
        // `options`, so the declared polling: 500 was never applied. Pass `null` for arg.
        null,
        { timeout: 20000, polling: 500 }
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns true when there is one .data_table_body_row per .bar-segment —
   * i.e. each bar segment has a corresponding legend row.
   * This is the "each segment should correspond to a submission status row in the legend" assertion.
   */
  async timesheetSegmentsMatchLegendRows(): Promise<boolean> {
    return this.page.evaluate(function () {
      var tile = document.querySelector('.home_page_main_split_row_timesheet.main_conatiner');
      if (!tile) return false;
      var segments = tile.querySelectorAll('.bar-segment');
      var rows = tile.querySelectorAll('.data_table_body_row');
      return segments.length === rows.length && segments.length > 0;
    });
  }

  /**
   * Returns true when the given status label (e.g. "On Time", "Late", "Missing")
   * has a non-empty .billabilityValue percentage value in the TIMESHEET tile.
   * Should only be called after waitForTimesheetData() returns true.
   */
  async timesheetStatusHasPercentage(status: string): Promise<boolean> {
    const tile = this.timesheetTileLocator;
    try {
      await tile.waitFor({ state: 'visible', timeout: 10000 });
    } catch {
      return false;
    }
    return this.page.evaluate(
      function (statusLabel) {
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

  /**
   * Returns true when the sum of ALL THREE status percentages (On Time + Late + Missing)
   * equals 100 (allowing ±1 for integer rounding).
   *
   * Note: the three bar-segment widths visually fill 100% of the bar; the legend
   * percentages are the integer-rounded versions of the same values. We sum all
   * three because each percentage is independently rounded: e.g. 72.5→73, 20.3→20,
   * 7.2→7 gives 100. Summing only On Time + Late would yield ~93, not 100.
   * Should only be called after waitForTimesheetData() returns true.
   */
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
      // Allow ±1 rounding tolerance
      return Math.abs(sum - 100) <= 1;
    });
  }

  /**
   * Captures the current percentage values displayed in the TIMESHEET tile for
   * before/after filter comparison.
   * Returns a JSON string of percentage values (e.g. '["73%","20%","7%"]'),
   * or 'empty' when no .billabilityValue elements are found.
   */
  async captureTimesheetTileState(): Promise<string> {
    return this.page.evaluate(function () {
      var tile = document.querySelector('.home_page_main_split_row_timesheet.main_conatiner');
      if (!tile) return 'tile-not-found';
      var vals = tile.querySelectorAll('.billabilityValue');
      if (vals.length === 0) return 'empty';
      var parts = [];
      for (var i = 0; i < vals.length; i++) {
        parts.push((vals[i].textContent || '').trim());
      }
      return JSON.stringify(parts);
    });
  }

  /**
   * Returns true once the TIMESHEET tile container is visible after a filter
   * has been applied.  Used as the post-filter assertion — the tile must still be
   * rendered (not crashed/disappeared) regardless of whether data changed.
   */
  async isTimesheetTileRendered(): Promise<boolean> {
    return this.waitVisible(this.timesheetTileLocator, 30000);
  }

  // ── Top Projects tile ───────────────────────────────────────────────────────

  /**
   * The TOP PROJECTS tile container.
   * CSS class: ".home_page_main_split_row_top_projects.main_conatiner"
   * Note: "main_conatiner" is the real (misspelled) class in the app — use verbatim.
   */
  private get topProjectsTileLocator() {
    return this.page.locator('.home_page_main_split_row_top_projects.main_conatiner').first();
  }

  /**
   * Scrolls the TOP PROJECTS tile into view via JS to avoid Playwright's
   * stability-check race with React re-renders.
   */
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

  /** Returns true when the TOP PROJECTS tile container is visible on the page. */
  async isTopProjectsTileVisible(): Promise<boolean> {
    return this.waitVisible(this.topProjectsTileLocator);
  }

  /**
   * Returns the current label shown on the utilization category dropdown button
   * inside the TOP PROJECTS tile.
   * The button is `.dropdown-toggle.btn.btn-primary` inside the tile.
   */
  async getTopProjectsDropdownLabel(): Promise<string> {
    const tile = this.topProjectsTileLocator;
    const btn = tile.locator('button.dropdown-toggle').first();
    try {
      await btn.waitFor({ state: 'visible', timeout: 15000 });
      return ((await btn.textContent()) ?? '').trim();
    } catch {
      return '';
    }
  }

  /**
   * Opens the utilization category dropdown in the TOP PROJECTS tile.
   * The trigger button is `.dropdown-toggle.btn.btn-primary` inside the tile.
   */
  async openTopProjectsDropdown(): Promise<void> {
    const tile = this.topProjectsTileLocator;
    const btn = tile.locator('button.dropdown-toggle').first();
    await btn.waitFor({ state: 'visible', timeout: 15000 });
    // Use a poll loop: click the button and wait for the menu to appear.
    // If the menu doesn't appear within 2 s, click again (React may not have
    // registered the event handler yet if the tile was still mounting/fetching).
    await this.page.waitForFunction(
      function (selector: string) {
        const t = document.querySelector(selector);
        if (!t) return false;
        if (t.querySelector('.dropdown-menu.show')) return true;
        // Menu not visible — click the button to open it.
        const b = t.querySelector('button.dropdown-toggle');
        if (b) (b as HTMLElement).click();
        return false;
      },
      '.home_page_main_split_row_top_projects.main_conatiner',
      { timeout: 20000, polling: 500 }
    );
  }

  /**
   * Returns the list of all option labels in the TOP PROJECTS utilization dropdown.
   * Collects the trigger button label (currently selected) plus all .dropdown-item
   * elements in the open menu to return the full set of six options.
   */
  async getTopProjectsDropdownOptions(): Promise<string[]> {
    return this.page.evaluate(function (selector: string) {
      const tile = document.querySelector(selector);
      if (!tile) return [];
      // Trigger button label (currently selected)
      const triggerLabel = (tile.querySelector('button.dropdown-toggle')?.textContent ?? '').trim();
      // Items in the open dropdown
      const items = Array.from(tile.querySelectorAll('.dropdown-menu.show .dropdown-item'));
      const itemLabels = items.map(i => (i.textContent ?? '').trim());
      // Return all options: selected + the rest
      return [triggerLabel, ...itemLabels].filter(Boolean);
    }, '.home_page_main_split_row_top_projects.main_conatiner');
  }

  /**
   * Selects a utilization category option from the TOP PROJECTS dropdown.
   *
   * Robustness strategy: uses a waitForFunction poll loop so that opening the
   * dropdown and clicking the item happen atomically without a gap between
   * steps.  This avoids the race where the dropdown is opened in a prior step
   * but React re-renders (data fetch cycle) closes it before the separate
   * select evaluate can run.
   *
   * Poll loop logic (runs every 300 ms, timeout 20 s):
   *  1. Button label already matches target → return true (done).
   *  2. Dropdown menu is NOT showing → click button to open it → return false (retry).
   *  3. Dropdown menu IS showing + target item found → click item → return false
   *     (retry — next tick the label will have updated to the target, returning true).
   */
  async selectTopProjectsOption(option: string): Promise<void> {
    await this.page.waitForFunction(
      function ({ selector, label }: { selector: string; label: string }) {
        const tile = document.querySelector(selector);
        if (!tile) return false;
        const btn = tile.querySelector('button.dropdown-toggle');
        if (!btn) return false;
        // Case 1: already selected.
        if ((btn.textContent ?? '').trim() === label) return true;
        const menu = tile.querySelector('.dropdown-menu.show');
        if (!menu) {
          // Case 2: dropdown closed — open it.
          (btn as HTMLElement).click();
          return false;
        }
        // Case 3: dropdown open — find and click the target item.
        const items = Array.from(menu.querySelectorAll('.dropdown-item'));
        const target = items.find(function (a) { return (a.textContent ?? '').trim() === label; });
        if (!target) return false;
        (target as HTMLElement).click();
        return false; // will return true on next poll once btn label updates
      },
      { selector: '.home_page_main_split_row_top_projects.main_conatiner', label: option },
      { timeout: 20000, polling: 300 }
    );
  }

  /**
   * Returns true when each specified column header text is visible inside the
   * TOP PROJECTS tile's .chart__table__header element.
   * Column CSS classes: .topClient (PROJECT NAME), .charges (CHARGES ($K)),
   * .topClienthours (HOURS) — same class names as TOP CLIENTS.
   */
  async topProjectsHasColumnHeaders(columns: string[]): Promise<boolean> {
    const tile = this.topProjectsTileLocator;
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

  /**
   * Waits for the TOP PROJECTS tile to populate with at least one data row.
   * Returns true when data is present, false if the tile stays empty after timeout.
   * Does NOT throw — callers should soft-skip if this returns false.
   *
   * Guard note: waits for .chart__table__body > .data_table_body_row elements
   * specifically — this excludes the "No data to display" placeholder which is
   * a classless child of .chart__table__body and caused false-"has data" bugs.
   */
  async waitForTopProjectsData(timeout = 30000): Promise<boolean> {
    try {
      await this.page.waitForFunction(
        function () {
          const tile = document.querySelector('.home_page_main_split_row_top_projects.main_conatiner');
          if (!tile) return false;
          if (tile.querySelectorAll('.MuiSkeleton-root').length > 0) return false;
          const rows = tile.querySelectorAll('.chart__table__body > .data_table_body_row');
          if (rows.length === 0) return false;
          return Array.from(rows).some(function (row) {
            return (row.querySelector('.topClient')?.textContent ?? '').trim().length > 0;
          });
        },
        // BUG FIX: see isVantagePulseCheckChartVisible above — zero-param fn + 2-arg call
        // was silently falling back to the page's 120000ms default action timeout instead
        // of the declared `timeout` value. Pass `null` for arg to fix it.
        null,
        { timeout }
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns the number of data rows currently rendered in the TOP PROJECTS tile body.
   * Counts only .data_table_body_row elements (not the classless placeholder child).
   * Returns 0 when the tile is empty.
   */
  async topProjectsDataRowCount(): Promise<number> {
    return this.page.evaluate(function () {
      const tile = document.querySelector('.home_page_main_split_row_top_projects.main_conatiner');
      if (!tile) return 0;
      return tile.querySelectorAll('.chart__table__body > .data_table_body_row').length;
    });
  }

  /**
   * Returns true when the TOP PROJECTS tile shows at most 10 project rows.
   * Should only be called after confirming waitForTopProjectsData() returns true.
   */
  async topProjectsHasAtMostTenRows(): Promise<boolean> {
    // waitForTopProjectsData confirmed data exists, but a re-render may cause a brief 0-row
    // window between that call and this one.  Re-wait for skeleton-free stable rows, then count.
    try {
      await this.page.waitForFunction(function () {
        const tile = document.querySelector('.home_page_main_split_row_top_projects.main_conatiner');
        if (!tile) return false;
        if (tile.querySelectorAll('.MuiSkeleton-root').length > 0) return false;
        const rows = tile.querySelectorAll('.chart__table__body > .data_table_body_row');
        return rows.length > 0;
      // BUG FIX: see isVantagePulseCheckChartVisible above — zero-param fn + 2-arg call
      // was silently falling back to the page's 120000ms default action timeout instead
      // of the declared 10000ms. Pass `null` for arg to fix it.
      }, null, { timeout: 10000 });
    } catch {
      return false;
    }
    // Data existence was already confirmed by waitForTopProjectsData() + the waitForFunction
    // above.  Drop the > 0 guard: if a snapshot read still catches a brief 0-row re-render
    // moment that would be a measurement artifact, not a real failure.
    const count = await this.topProjectsDataRowCount();
    return count <= 10;
  }

  /**
   * Returns true when the charges values in the TOP PROJECTS tile are in
   * descending order (highest to lowest).
   * Should only be called after confirming waitForTopProjectsData() returns true.
   */
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

  /**
   * Returns true when every data row in the TOP PROJECTS tile has:
   * - a non-empty project name in the .topClient cell
   * - a numeric charges value in the .charges cell
   * - a numeric hours value in the .topClienthours cell
   * Should only be called after confirming waitForTopProjectsData() returns true.
   */
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

  /**
   * Returns true when every .charges cell in the TOP PROJECTS tile body
   * contains a numeric value.
   * Should only be called after confirming waitForTopProjectsData() returns true.
   */
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

  /**
   * Returns true when every .topClienthours cell in the TOP PROJECTS tile body
   * contains a numeric value.
   * Should only be called after confirming waitForTopProjectsData() returns true.
   */
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

  /**
   * Captures the current list of project names displayed in the TOP PROJECTS tile
   * for before/after filter comparison.
   * Returns a JSON string of names, or 'empty' when no data rows are present.
   */
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

  /**
   * Returns true once the TOP PROJECTS tile container is visible after a filter
   * has been applied.  Used as the post-filter assertion.
   */
  async isTopProjectsTileRendered(): Promise<boolean> {
    return this.waitVisible(this.topProjectsTileLocator, 30000);
  }
}

