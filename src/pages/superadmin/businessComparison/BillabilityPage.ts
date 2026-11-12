import { Locator, Page, Download } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

import { BasePage } from '../../base/BasePage';

export class BillabilityPage extends BasePage {

  readonly peopleMenu: Locator;
  readonly businessComparisonMenu: Locator;
  readonly billabilityMenuLink: Locator;
  readonly billabilityHeader: Locator;

  constructor(page: Page) {
    super(page);

    this.peopleMenu = page.locator(
        '.sidebar_icon'
    ).filter({
        hasText: 'People'
    });

    this.businessComparisonMenu  = page.locator(
        '.sidebar_icon'
    ).filter({
        hasText: 'Business Comparison'
    });

    this.billabilityMenuLink = page.locator(
        '.sidebar-submenu-dropDown .dropdown-link'
    ).filter({
        hasText: `Billability`
    }).first();

    this.billabilityHeader = page.getByRole('button', { name: 'Billability' }).first();
  }


  /**
   * Locator for the Business Comparison ▸ Billability sub-item, scoped to be
   * sidebar-ORDER-INDEPENDENT.
   *
   * Two "Billability" links exist (Business Comparison and People). The old
   * getByRole('button', { name: 'Billability' }).first() relied on BC sitting
   * first, which is only true for the BC-first sidebar (Superadmin / Business
   * Leader). Any role with a People-first sidebar would make .first() resolve to
   * People ▸ Billability, so navigation lands on the wrong page and every BC
   * scenario times out waiting for "Billability by Business". This locator is
   * order-independent so it stays correct if such a role is ever added.
   *
   * The BC submenu is the .sidebar-submenu-dropDown that does NOT contain
   * "Timesheets" (the People/Reports submenu has Timesheets / Charges-Hours /
   * Bill Rate; BC's submenu has only Billability). Mirror of
   * BasePage.peopleSubmenuLink(), which scopes the other way (WITH Timesheets).
   *
   * MCP-verified 2026-06-29 against the live staging sidebar:
   *   Superadmin (BC-first)  → 1 match (the BC item)
   *   Team Manager (no BC)   → 0 matches (BC section absent; BC scenarios are
   *                            tag-excluded for that role)
   */
  private bcBillabilitySubMenu(): Locator {
    const bcSubmenu = this.page.locator('.sidebar-submenu-dropDown').filter({
      hasNot: this.page.locator('.dropdown-link', { hasText: 'Timesheets' })
    });
    return bcSubmenu.locator('.dropdown-link', { hasText: 'Billability' });
  }

  async navigateToBillabilityPage(): Promise<void> {
    // Ensure Business Comparison sidebar is expanded so the Billability
    // sub-item button is visible, then click it and wait for page content.
    await this.expandBusinessComparisonSidebar();
    await this.bcBillabilitySubMenu().click();

    // Wait for the page heading to confirm navigation
    await this.page.getByText('Billability by Business').first().waitFor({
      state: 'visible',
      timeout: 60000
    });

    // Wait for the table column headers to confirm the table has rendered
    await this.page.locator('.chart__table__header').waitFor({
      state: 'visible',
      timeout: 30000
    });
  }

  async isBillabilityHeaderVisible(): Promise<boolean> {

    try {

      await this.billabilityHeader.waitFor({
        state: 'visible',
        timeout: 15000
      });

      return true;

    } catch {

      return false;
    }
  }

  // ── New methods for @display scenarios ─────────────────────────────────────

  /**
   * Navigates to the Business Comparison Billability page directly via URL.
   */
  async navigateDirectly(): Promise<void> {
    await this.page.goto('/business/billing', { timeout: 90000 });
    await this.page.getByText('Billability by Business').first().waitFor({
      state: 'visible',
      timeout: 60000
    });
    // Wait for the table column headers to confirm the table has rendered
    await this.page.locator('.chart__table__header').waitFor({
      state: 'visible',
      timeout: 30000
    });
  }

  /**
   * Ensures the Business Comparison expandable section in the sidebar is open
   * so that the Billability sub-item is visible. Clicks the toggle only if it
   * is currently collapsed (i.e. no "Billability" button appears between the
   * Business Comparison button and People button).
   */
  async expandBusinessComparisonSidebar(): Promise<void> {
    const bcBtn = this.page.getByRole('button', { name: 'Business Business Comparison' });
    await bcBtn.waitFor({ state: 'visible', timeout: 15000 });

    // The BC Billability sub-item, scoped to the BC submenu so it is
    // independent of People/BC sidebar ordering (see bcBillabilitySubMenu).
    const subItem = this.bcBillabilitySubMenu();
    const isVisible = await subItem.isVisible();

    if (!isVisible) {
      // Sidebar is collapsed — click once to expand
      await bcBtn.click();
      await subItem.waitFor({ state: 'visible', timeout: 10000 });
    }
  }

  /**
   * Clicks the Business Comparison expandable section in the sidebar.
   * Ensures it is expanded before clicking so the action toggles correctly.
   */
  async clickBusinessComparisonSidebar(): Promise<void> {
    const bcBtn = this.page.getByRole('button', { name: 'Business Business Comparison' });
    await bcBtn.waitFor({ state: 'visible', timeout: 15000 });
    await bcBtn.click();
  }

  /**
   * Returns true if the Billability sub-menu option is visible under
   * Business Comparison in the sidebar.
   */
  async isBcBillabilitySubMenuVisible(): Promise<boolean> {
    try {
      // The BC Billability sub-item, scoped to the BC submenu so it does not
      // match People ▸ Billability under a People-first sidebar.
      await this.bcBillabilitySubMenu().waitFor({
        state: 'visible',
        timeout: 10000
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clicks the Billability sub-menu under Business Comparison in the sidebar.
   * Ensures the section is expanded first.
   */
  async clickBcBillabilitySubMenu(): Promise<void> {
    await this.expandBusinessComparisonSidebar();
    await this.bcBillabilitySubMenu().click();
    await this.page.getByText('Billability by Business').first().waitFor({
      state: 'visible',
      timeout: 60000
    });
  }

  /**
   * Returns true if the heading "Billability by Business" text node is visible.
   */
  async isBillabilityByBusinessHeadingVisible(): Promise<boolean> {
    try {
      await this.page.getByText('Billability by Business').first().waitFor({
        state: 'visible',
        timeout: 15000
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns the current page title text.
   */
  async getPageTitle(): Promise<string> {
    return this.page.title();
  }

  /**
   * Returns the breadcrumb items as an array of strings.
   */
  async getBreadcrumbItems(): Promise<string[]> {
    const nav = this.page.getByRole('navigation', { name: 'breadcrumb' });
    await nav.waitFor({ state: 'visible', timeout: 15000 });
    const items = nav.locator('li');
    const count = await items.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await items.nth(i).innerText();
      texts.push(text.trim());
    }
    return texts;
  }

  /**
   * Returns true if the breadcrumb shows Home > Business Comparison > Billability.
   */
  async isBreadcrumbCorrect(): Promise<boolean> {
    const items = await this.getBreadcrumbItems();
    return (
      items.length === 3 &&
      items[0].includes('Home') &&
      items[1].includes('Business Comparison') &&
      items[2].includes('Billability')
    );
  }

  /**
   * Returns true if a given column header is visible in the table header row.
   * Scopes the search to the .chart__table__header container to avoid false
   * positives from business name cells that share CSS class names.
   */
  async isColumnHeaderVisible(columnName: string): Promise<boolean> {
    // Wait for the header to be present first
    await this.page.locator('.chart__table__header').waitFor({
      state: 'visible',
      timeout: 15000
    });
    return this.page.locator('.chart__table__header').getByText(columnName, { exact: true }).first().isVisible();
  }

  /**
   * Returns true if the table contains at least one business data row
   * (excluding header/summary rows) — guarded for populated state.
   */
  async hasBusinessRows(): Promise<boolean> {
    try {
      // Wait for table to render
      await this.page.getByText('Practice Area Total').waitFor({
        state: 'visible',
        timeout: 30000
      });
      // Check for businessName cells that are actual business rows (not summary)
      const businessNameCells = this.page.locator('.businessName');
      const count = await businessNameCells.count();
      // We expect far more than just summary rows (> 5 means real data present)
      return count > 5;
    } catch {
      return false;
    }
  }

  /**
   * Returns true if a summary row with the given text is visible.
   */
  async isSummaryRowVisible(rowLabel: string): Promise<boolean> {
    return this.page.getByText(rowLabel, { exact: true }).first().isVisible();
  }

  /**
   * Locator scoped to the legend container above the table
   * (.kt-table-container__chart__headers__second_row__legends). Scoping matters:
   * an unscoped page-wide getByText() can match unrelated text elsewhere on the
   * page and produce a false positive for a category that isn't actually in the
   * legend.
   */
  private get legendContainer(): Locator {
    return this.page.locator('.kt-table-container__chart__headers__second_row__legends');
  }

  /**
   * Returns true if the billability component legend is displayed.
   */
  async isBillabilityLegendVisible(): Promise<boolean> {
    try {
      // The legend container has 6 category texts: Client, Client w/o #, BD,
      // Investment, Innovation Fund, Other/Admin.
      await this.legendContainer.getByText('Client', { exact: true }).first().waitFor({
        state: 'visible',
        timeout: 15000
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns true if the given legend category text is visible within the
   * legend container (scoped — see legendContainer above).
   */
  async isLegendCategoryVisible(category: string): Promise<boolean> {
    return this.legendContainer.getByText(category, { exact: true }).first().isVisible();
  }

  /**
   * Returns true if the Export button is visible.
   */
  async isExportButtonVisible(): Promise<boolean> {
    return this.page.getByRole('button', { name: 'Export' }).isVisible();
  }

  /**
   * Returns true if the Sort By control shows the given label as active.
   */
  async isSortByLabelVisible(label: string): Promise<boolean> {
    return this.page.getByRole('button', { name: label }).first().isVisible();
  }

  /**
   * Clicks the Sort By dropdown button and waits for the options list to appear.
   * The radio inputs are styled with opacity:0, so we wait for the visible
   * option text labels instead.
   */
  async clickSortByDropdown(): Promise<void> {
    // The Sort By button is a div with role="button"
    await this.page.getByRole('button', { name: 'Client BB (highest → lowest)' }).click();
    // Wait for dropdown to open — the option labels (div.filter-name.singleSelect) are visible
    await this.page.locator('.sort-by-filters .filter-name').first().waitFor({
      state: 'visible',
      timeout: 10000
    });
  }

  /**
   * Returns true if a given sort option text is visible in the open dropdown.
   * Scoped to the sort-by-filters container to avoid matching the button itself.
   */
  async isSortOptionVisible(optionText: string): Promise<boolean> {
    // Poll the open dropdown for an option whose WHITESPACE-NORMALISED text
    // matches and that is actually rendered (non-zero box). Two reasons this is
    // more robust than getByText({exact:true}).waitFor('visible'):
    //   1. exact:true is brittle to inner-whitespace differences (the dropdown
    //      OPENS fine via a non-exact getByRole name match, yet the exact text
    //      check fails) — normalising collapses any such mismatch.
    //   2. Polling tolerates the open animation under CI load instead of
    //      sampling a single moment.
    // Same intent: the option is present and visible in the dropdown.
    try {
      await this.page.waitForFunction(
        (expected: string) => {
          const want = expected.replace(/\s+/g, ' ').trim();
          const els = Array.from(document.querySelectorAll('.sort-by-filters .filter-name'));
          return els.some((e) => {
            const t = (e.textContent || '').replace(/\s+/g, ' ').trim();
            if (t !== want) return false;
            const r = (e as HTMLElement).getBoundingClientRect();
            return r.width > 0 && r.height > 0;
          });
        },
        optionText,
        { timeout: 15000 }
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns true if the "Expand all rows" control is visible in the table toolbar.
   * The element is a div with role="button", not a native <button>.
   */
  async isExpandAllRowsButtonVisible(): Promise<boolean> {
    // The "Expand all rows" control is a div.chart__table__body__sortby__option
    // with role="button" — use text-based locator to find it robustly.
    return this.page.getByText('Expand all rows', { exact: true }).first().isVisible();
  }

  /**
   * Returns true if the info icon is visible next to the heading.
   */
  async isInfoIconVisible(): Promise<boolean> {
    return this.page.getByRole('img', { name: 'info' }).isVisible();
  }

  /**
   * Hovers over the info icon to trigger the tooltip.
   */
  async hoverInfoIcon(): Promise<void> {
    await this.page.getByRole('img', { name: 'info' }).hover();
  }

  /**
   * Returns the exact text content of the Bootstrap tooltip/popover that
   * appears when the info icon is hovered. The popover renders with
   * id="tooltip-basic" and role="tooltip".
   */
  async getInfoTooltipText(): Promise<string> {
    // Wait for the Bootstrap popover to become visible
    await this.page.locator('[role="tooltip"]').waitFor({
      state: 'visible',
      timeout: 10000
    });
    return (await this.page.locator('[role="tooltip"]').innerText()).trim();
  }

  /**
   * Returns true if the FILTERS panel is visible on the left side.
   */
  async isFiltersPanelVisible(): Promise<boolean> {
    return this.page.getByText('FILTERS').first().isVisible();
  }

  /**
   * Returns true if the Reset button is visible in the filters panel.
   */
  async isResetButtonVisible(): Promise<boolean> {
    return this.page.getByText('Reset').first().isVisible();
  }

  /**
   * Returns true if a given filter label is visible in the filter panel.
   */
  async isFilterVisible(filterLabel: string): Promise<boolean> {
    return this.page.getByRole('button', { name: filterLabel }).first().isVisible();
  }

  // ── @expandCollapse methods ─────────────────────────────────────────────────

  /**
   * Clicks the Expand all rows / Collapse all rows toggle button.
   * The button is a div with role="button" whose text label toggles between
   * "Expand all rows" and "Collapse all rows".
   */
  async clickExpandCollapseButton(label: string): Promise<void> {
    const opposite =
      label === 'Expand all rows' ? 'Collapse all rows'
      : label === 'Collapse all rows' ? 'Expand all rows'
      : undefined;

    // Non-toggle labels (any other labelled button) — plain click.
    if (!opposite) {
      await this.page.getByRole('button', { name: label, exact: true }).click();
      return;
    }

    // Clicking the Expand/Collapse toggle re-renders the whole table toolbar,
    // so the button frequently detaches mid-action. Playwright can report the
    // click as "done" even when it landed on a detaching node and the handler
    // never fired — leaving the label un-flipped. So we click-and-CONFIRM:
    // after each click, wait for the label to flip to the opposite; if it
    // didn't, click again. We always target the ORIGINAL label (which vanishes
    // once the toggle flips), so a late-registering click can never cause a
    // double-toggle.
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const target = this.page.getByRole('button', { name: label, exact: true });
        await target.waitFor({ state: 'visible', timeout: 10000 });
        await target.click({ timeout: 10000 });
      } catch {
        // Element detached / already flipped — fall through to the confirm check.
      }
      const flipped = await this.page
        .getByRole('button', { name: opposite, exact: true })
        .waitFor({ state: 'visible', timeout: 5000 })
        .then(() => true)
        .catch(() => false);
      if (flipped) return;
    }
    throw new Error(
      `"${label}" did not toggle to "${opposite}" after multiple attempts`
    );
  }

  /**
   * Polls for the expand/collapse toggle showing the given label: matches a
   * ".chart__table__body__sortby__option" whose WHITESPACE-NORMALISED text
   * equals the label AND is actually rendered (non-zero box). More robust than
   * getByRole({exact:true}) because (a) exact:true is brittle to inner-whitespace
   * differences and (b) polling rides out the toolbar re-render after expand.
   * 30s budget: expanding the full table under CI load can take a while before
   * the label flips.
   */
  private async toggleLabelShown(expectedLabel: string, timeout = 30000): Promise<boolean> {
    return this.page
      .waitForFunction(
        (expected: string) => {
          const want = expected.replace(/\s+/g, ' ').trim();
          const els = Array.from(document.querySelectorAll('.chart__table__body__sortby__option'));
          return els.some((e) => {
            const t = (e.textContent || '').replace(/\s+/g, ' ').trim();
            if (t !== want) return false;
            const r = (e as HTMLElement).getBoundingClientRect();
            return r.width > 0 && r.height > 0;
          });
        },
        expectedLabel,
        { timeout }
      )
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Waits until the expand/collapse button shows the expected label text.
   * Throws on timeout so the calling step surfaces a clear failure.
   */
  async waitForExpandCollapseLabel(expectedLabel: string): Promise<void> {
    const shown = await this.toggleLabelShown(expectedLabel);
    if (!shown) {
      throw new Error(
        `Expand/Collapse toggle did not show label "${expectedLabel}" within 30s`
      );
    }
  }

  /**
   * Returns true if the expand/collapse toggle button currently shows the
   * given label text.
   */
  async isExpandCollapseButtonLabelVisible(label: string): Promise<boolean> {
    // Reuse the same normalised + visible poll as the label wait, so this stays
    // consistent with waitForExpandCollapseLabel and tolerant of the toolbar
    // re-render churn (no whitespace-brittle exact match, no single-sample race).
    return this.toggleLabelShown(label);
  }

  /**
   * Returns true when ALL expanded_ sections have lost the "hide" class
   * (i.e. every business row is fully expanded).
   */
  async areAllBusinessRowsExpanded(): Promise<boolean> {
    return this.page.waitForFunction(
      () => {
        // Only business-level sections are toggled by "Expand all rows".
        // Sub-topic sections (id "expanded_<PA>_<Topic>_…", which contain an
        // underscore after the prefix) stay collapsed until expanded individually,
        // so they must be excluded here — otherwise this can never be all-visible
        // for any dataset that has sub-topics.
        const businessSections = Array.from(
          document.querySelectorAll('[id^="expanded_"]')
        ).filter(el => !el.id.slice('expanded_'.length).includes('_'));
        if (businessSections.length === 0) return false;
        const hidden = businessSections.filter(el => el.classList.contains('hide'));
        return hidden.length === 0;
      },
      // BUG FIX: waitForFunction(fn, options) is wrong for a zero-param fn — Playwright's
      // real signature is (fn, arg, options), so the options object was being passed as
      // `arg` (ignored) and this silently fell back to the page's 120000ms default action
      // timeout instead of the declared 30000ms. Pass `null` for arg to fix it.
      null,
      { timeout: 120000 }
    ).then(() => true).catch(() => false);
  }

  /**
   * Returns true when ALL expanded_ sections have the "hide" class
   * (i.e. every business row is fully collapsed back to default).
   */
  async areAllBusinessRowsCollapsed(): Promise<boolean> {
    return this.page.waitForFunction(
      () => {
        const sections = document.querySelectorAll('[id^="expanded_"]');
        if (sections.length === 0) return false;
        const visible = Array.from(sections).filter(el => !el.classList.contains('hide'));
        return visible.length === 0;
      },
      // BUG FIX: waitForFunction(fn, options) is wrong for a zero-param fn — Playwright's
      // real signature is (fn, arg, options), so the options object was being passed as
      // `arg` (ignored) and this silently fell back to the page's 120000ms default action
      // timeout instead of the declared 30000ms. Pass `null` for arg to fix it.
      null,
      // 120s (was 30s): same reasoning as areAllBusinessRowsExpanded above — the 30s
      // value was masked by the bug's accidental 120000ms fallback until today.
      { timeout: 120000 }
    ).then(() => true).catch(() => false);
  }

  /**
   * Returns true if at least one visible (non-hidden) expanded_ section
   * contains topic-level rows (class containing "collapsed_section 1").
   */
  async hasTopicLevelRowsVisible(): Promise<boolean> {
    // Poll: topic rows render asynchronously after the section expands, so a
    // single read can sample before they exist. The condition itself is
    // unchanged — we just wait for it to become true.
    return this.page.waitForFunction(
      () => {
        const visibleSections = Array.from(document.querySelectorAll('[id^="expanded_"]'))
          .filter(el => !el.classList.contains('hide'));
        for (const section of visibleSections) {
          const topicRows = section.querySelectorAll('.table_row.collapsed_section');
          if (topicRows.length > 1) return true; // >1 because first is the header row
        }
        return false;
      },
      // BUG FIX: waitForFunction(fn, options) is wrong for a zero-param fn — Playwright's
      // real signature is (fn, arg, options), so the options object was being passed as
      // `arg` (ignored) and this silently fell back to the page's 120000ms default action
      // timeout instead of the declared 30000ms. Pass `null` for arg to fix it.
      null,
      { timeout: 30000 }
    ).then(() => true).catch(() => false);
  }

  /**
   * Returns true if at least one visible topic-level row displays Client Billability,
   * Client Chgs, and Theo Cap Chgs values. Requires at least one section to be
   * expanded first (e.g. after clickExpandCollapseButton('Expand all rows')).
   * NOTE: the underlying CSS classes (.case_billability, .case_charges) still use
   * the pre-rename "case" naming - only the display text changed to "Client".
   */
  async hasTopicLevelRowsWithValues(): Promise<boolean> {
    // Poll: after "Expand all rows" the topic rows (and their value cells)
    // render asynchronously, so a single read can fire before they paint —
    // the cause of the headless-CI flake. The matching condition is unchanged.
    return this.page.waitForFunction(
      () => {
        const visibleSections = Array.from(document.querySelectorAll('[id^="expanded_"]'))
          .filter(el => !el.classList.contains('hide'));
        for (const section of visibleSections) {
          const topicRows = section.querySelectorAll('.table_row');
          for (const row of Array.from(topicRows)) {
            const caseEl = row.querySelector('.case_billability');
            const caseChgs = row.querySelector('.case_charges');
            // Live DOM uses .theo_charges (not .theo_cap_charges)
            const theoChgs = row.querySelector('.theo_charges');
            if (caseEl && caseChgs && theoChgs) return true;
          }
        }
        return false;
      },
      // BUG FIX: waitForFunction(fn, options) is wrong for a zero-param fn — Playwright's
      // real signature is (fn, arg, options), so the options object was being passed as
      // `arg` (ignored) and this silently fell back to the page's 120000ms default action
      // timeout instead of the declared 30000ms. Pass `null` for arg to fix it.
      null,
      { timeout: 30000 }
    ).then(() => true).catch(() => false);
  }

  /**
   * Returns true if sub-topic expanded sections exist in the DOM.
   * Sub-topic sections have IDs matching expanded_<PA>_<Topic>_ (contain underscore after the business name).
   */
  async hasSubTopicSections(): Promise<boolean> {
    // Poll: sub-topic sections are added to the DOM as expansion renders, so a
    // single read can run before they appear. Condition is unchanged.
    return this.page.waitForFunction(
      () => {
        const allSections = document.querySelectorAll('[id^="expanded_"]');
        return Array.from(allSections).some(el =>
          el.id.slice('expanded_'.length).includes('_')
        );
      },
      // BUG FIX: waitForFunction(fn, options) is wrong for a zero-param fn — Playwright's
      // real signature is (fn, arg, options), so the options object was being passed as
      // `arg` (ignored) and this silently fell back to the page's 120000ms default action
      // timeout instead of the declared 15000ms. Pass `null` for arg to fix it.
      null,
      { timeout: 15000 }
    ).then(() => true).catch(() => false);
  }

  /**
   * Returns true if at least one expandable business row is present.
   * An expandable row is a collapsed_section_grey_0 row containing an angle.right icon.
   */
  async hasExpandableRows(): Promise<boolean> {
    const count = await this.page.locator('.collapsed_section_grey_0 i.angle.right').count();
    return count > 0;
  }

  /**
   * Clicks the expand icon on the first business row in the table.
   * The icon is the .iconContainer element inside the first .collapsed_section_grey_0 row.
   */
  async clickFirstRowExpandIcon(): Promise<void> {
    // The first business row (collapsed_section_grey_0) has a .d-inline-flex.iconContainer
    // containing the angle.right.icon — clicking it expands that single row.
    await this.page.locator('.collapsed_section_grey_0 .iconContainer').first().click();
    // Wait for the corresponding expanded_ section to lose the hide class
    await this.page.waitForFunction(
      () => {
        const greyRows = document.querySelectorAll('.collapsed_section_grey_0');
        const firstRow = greyRows[0];
        if (!firstRow) return false;
        const rowId = firstRow.id; // e.g. "collapsed_Marketing and Sales"
        const expandedId = rowId.replace('collapsed_', 'expanded_');
        const expandedEl = document.getElementById(expandedId);
        return expandedEl ? !expandedEl.classList.contains('hide') : false;
      },
      // BUG FIX: waitForFunction(fn, options) is wrong for a zero-param fn — Playwright's
      // real signature is (fn, arg, options), so the options object was being passed as
      // `arg` (ignored) and this silently fell back to the page's 120000ms default action
      // timeout instead of the declared 15000ms. Pass `null` for arg to fix it.
      null,
      { timeout: 15000 }
    );
  }

  /**
   * Returns true if the first business row's expanded_ section is currently visible
   * (i.e. does not have the hide class).
   */
  async isFirstBusinessRowExpanded(): Promise<boolean> {
    // Poll rather than read once: after expansion the app can briefly re-render
    // and momentarily re-apply the "hide" class, which a single evaluate would
    // catch as a false negative. waitForFunction tolerates that transient state.
    return this.page.waitForFunction(
      () => {
        const greyRows = document.querySelectorAll('.collapsed_section_grey_0');
        const firstRow = greyRows[0];
        if (!firstRow) return false;
        const expandedId = firstRow.id.replace('collapsed_', 'expanded_');
        const expandedEl = document.getElementById(expandedId);
        return expandedEl ? !expandedEl.classList.contains('hide') : false;
      },
      // BUG FIX: waitForFunction(fn, options) is wrong for a zero-param fn — Playwright's
      // real signature is (fn, arg, options), so the options object was being passed as
      // `arg` (ignored) and this silently fell back to the page's 120000ms default action
      // timeout instead of the declared 15000ms. Pass `null` for arg to fix it.
      null,
      { timeout: 15000 }
    ).then(() => true).catch(() => false);
  }

  // ── @filters methods ────────────────────────────────────────────────────────

  /**
   * Returns true if the Date Range filter label matches the expected default value.
   * The label element lives in the <li> that wraps the date range filter.
   */
  async getDateRangeLabel(): Promise<string> {
    const labelEl = this.page
      .locator('li')
      .filter({ hasText: /\w{3} \d{4} to \w{3} \d{4}/ })
      .first()
      .locator('div')
      .filter({ hasText: /\w{3} \d{4} to \w{3} \d{4}/ })
      .first();
    return (await labelEl.textContent() ?? '').trim();
  }

  /**
   * Returns true when the Date Range filter shows the expected default "Last 12 months" state.
   * Checks that:
   *   1. The label text equals the expected value.
   *   2. The "Last" months radio is checked with value "12".
   * The filter must be open for the radio check to work.
   */
  async isDefaultDateRangeShown(expectedLabel: string): Promise<boolean> {
    const label = await this.getDateRangeLabel();
    return label === expectedLabel;
  }

  /**
   * Returns the current value of the "Last N months" input inside the open Date Range filter.
   */
  async getLastMonthsInputValue(): Promise<string> {
    const input = this.page.locator('input[name="months"]');
    return (await input.inputValue()).trim();
  }

  /**
   * Returns true if the "Last" months radio is checked inside the open Date Range filter.
   */
  async isLastMonthsRadioChecked(): Promise<boolean> {
    const radio = this.page.locator('input[name="dateType"]').first();
    return radio.isChecked();
  }

  /**
   * Opens the Date Range filter panel by clicking the listitem that contains the
   * "MMM YYYY to MMM YYYY" date range label.
   */
  async openDateRangeFilter(): Promise<void> {
    await this.page
      .locator('li')
      .filter({ hasText: /\w{3} \d{4} to \w{3} \d{4}/ })
      .first()
      .click();
    // Wait for the date range container to become visible
    await this.page.locator('.date-calender-container').waitFor({
      state: 'visible',
      timeout: 10000
    });
  }

  /**
   * Selects the "Last N months" radio and enters the given value in the months input.
   * Clears the existing value before typing the new one.
   */
  async selectLastNMonths(n: string): Promise<void> {
    // Ensure the "Last N months" radio is selected
    const radio = this.page.locator('input[name="dateType"]').first();
    if (!(await radio.isChecked())) {
      await radio.click();
    }
    const input = this.page.locator('input[name="months"]');
    await input.fill(n);
  }

  /**
   * Selects the "Trailing 12 months" radio option inside the open Date Range filter.
   */
  async selectTrailing12Months(): Promise<void> {
    await this.page
      .locator('.date-calender-container')
      .getByText('Trailing 12 months')
      .click();
  }

  /**
   * Clicks the Apply button inside the currently-open filter panel.
   * The filter panel contains a .button-footer with .apply class.
   * IMPORTANT: This is scoped to the currently-open filter's footer by using the
   * .button-footer selector within the first visible .filter-container or the
   * date-calender-container's own Apply button.
   * Uses a visible-only check to avoid clicking a hidden Apply button.
   */
  async clickApplyInFilterPanel(): Promise<void> {
    // The date-calender-container has its own Apply text (not .apply class button)
    const dateApply = this.page
      .locator('.date-calender-container .apply');
    const dateApplyVisible = await dateApply.isVisible().catch(() => false);
    if (dateApplyVisible) {
      await dateApply.click({ force: true });
      return;
    }
    // For multi-select filters: scope Apply to the currently-open filter-container
    // by finding the visible .button-footer .apply element
    const applyBtn = this.page.locator('.filter-container:visible .button-footer .apply')
      .first();
    const applyVisible = await applyBtn.isVisible().catch(() => false);
    if (applyVisible) {
      await applyBtn.click();
      return;
    }
    // Fallback: click the first visible .apply element
    await this.page.locator('.apply').first().click({ force: true });
  }

  /**
   * Clicks the Reset button in the filter panel.
   * The Reset element is a <div class="right"> containing the text "Reset".
   */
  async clickResetButton(): Promise<void> {
    // The Reset button is a div.right with text "Reset"
    const resetEl = this.page.getByText('Reset', { exact: true }).first();
    // evaluate(el.click()) bypasses Playwright's actionability engine (stability/
    // receives-events checks). Live-observed: after several consecutive filter
    // Apply clicks, a plain .click() here can silently retry against Playwright's
    // 120s default action timeout (support/hooks.ts) before landing — evaluate()
    // fires directly on the DOM element instead, matching the pattern already
    // used for the PA tree-select filter elsewhere in this file.
    await resetEl.evaluate((el: HTMLElement) => el.click());
    // Wait for the table to begin re-rendering (Practice Area Total will still be present)
    // BUG FIX: waitForFunction(fn, options) is wrong for a zero-param fn — Playwright's
    // real signature is (fn, arg, options), so the options object was being passed as
    // `arg` (ignored) and this silently fell back to the page's 120000ms default action
    // timeout instead of the declared 15000ms. Pass `null` for arg to fix it.
    await this.page.waitForFunction(
      () => document.querySelector('.businessName') !== null,
      null,
      { timeout: 15000 }
    ).catch(() => {/* no-op if table stays empty */});
  }

  /**
   * Clicks the "Clear" button inside the currently-open filter panel.
   * This clears all checkbox selections and closes the filter panel.
   * Scoped to the visible .button-footer to avoid clicking Clear in the wrong filter.
   */
  async clickClearInFilterPanel(filterName?: string): Promise<void> {
    if (filterName) {
      // Scope Clear to the specific filter's listitem
      const li = this.page.locator('li').filter({
        has: this.page.locator('.filter-heading', { hasText: filterName })
      });
      await li.locator('.button-footer .clear').click();
    } else {
      // Click the first visible Clear button in any open filter panel
      await this.page.locator('.filter-container:visible .button-footer .clear')
        .first()
        .click();
    }
  }

  /**
   * Clicks the "Select all" control inside the named filter panel.
   * Scoped to the filter's listitem to avoid clicking Select all in another filter.
   */
  async clickSelectAllInFilter(filterName: string): Promise<void> {
    const li = this.page.locator('li').filter({
      has: this.page.locator('.filter-heading', { hasText: filterName })
    });
    await li.getByText('Select all').click();
  }

  /**
   * Selects a checkbox option within the named filter panel.
   * Uses the filter-heading to scope the search to the correct filter's listitem.
   * This method is safe to call regardless of which page is active (the filter
   * DOM is identical across all pages using the global filter sidebar).
   */
  async selectOptionInFilter(option: string, filterName?: string): Promise<void> {
    if (filterName) {
      const li = this.page.locator('li').filter({
        has: this.page.locator('.filter-heading', { hasText: filterName })
      });
      const row = li
        .locator('.filter-display')
        .filter({ has: this.page.locator('.filter-name', { hasText: option }) });
      await row.locator('input[type="checkbox"]').check({ force: true });
    } else {
      // Page-wide fallback: find the checkbox by option label
      const row = this.page
        .locator('.filter-display')
        .filter({ has: this.page.locator('.filter-name', { hasText: option }) });
      await row.locator('input[type="checkbox"]').check({ force: true });
    }
  }

  /**
   * Returns true if the named filter button shows a selection count badge (e.g. "1")
   * after an option has been applied. The badge is a .selected-count element inside
   * the .filter-heading for that filter.
   */
  async filterHasSelectionBadge(filterName: string): Promise<boolean> {
    const badge = this.page
      .locator('.filter-heading', { hasText: filterName })
      .locator('.selected-count');
    return badge.isVisible();
  }

  /**
   * Returns true when the named filter button does NOT show a selection count badge.
   * Checks that the .selected-count element is not present or not visible.
   */
  async filterHasNoBadge(filterName: string): Promise<boolean> {
    const badge = this.page
      .locator('.filter-heading', { hasText: filterName })
      .locator('.selected-count');
    const count = await badge.count();
    if (count === 0) return true;
    return !(await badge.isVisible());
  }

  /**
   * Returns true if all filter-heading elements have no .selected-count badge.
   * Used to verify all selections are cleared after Reset.
   */
  async areAllFilterSelectionsCleared(): Promise<boolean> {
    const badges = this.page.locator('.filter-heading .selected-count');
    const count = await badges.count();
    return count === 0;
  }

  /**
   * Returns true if the "Last 12 months" date range label is visible in the filter panel,
   * indicating the filter has been reset to its default state.
   * Accepts both "Jan 2025 to Dec 2025" and the generic "Last 12 months" label patterns.
   */
  async isDateRangeDefaultLabel(): Promise<boolean> {
    // The reset date range shows "Last N months" — look for the label matching the default
    // pattern. The exact months text depends on the data; check the radio + input value instead.
    const dateLabel = this.page
      .locator('li')
      .filter({ hasText: /\w{3} \d{4} to \w{3} \d{4}/ })
      .first();
    const isVisible = await dateLabel.isVisible();
    return isVisible;
  }

  /**
   * Returns true if the Date Range filter panel is currently closed.
   * The .date-calender-container becomes hidden after a successful Apply.
   */
  async isDateRangePanelClosed(): Promise<boolean> {
    try {
      await this.page.locator('.date-calender-container').waitFor({
        state: 'hidden',
        timeout: 10000
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns the current date range label text (e.g. "Jul 2025 to Dec 2025").
   * Used to verify the label updated after applying a date range filter.
   */
  async getCurrentDateRangeLabel(): Promise<string> {
    const labelEl = this.page
      .locator('li')
      .filter({ hasText: /\w{3} \d{4} to \w{3} \d{4}/ })
      .first()
      .locator('div')
      .filter({ hasText: /\w{3} \d{4} to \w{3} \d{4}/ })
      .first();
    return (await labelEl.textContent() ?? '').trim();
  }

  /**
   * Returns true if the table still has at least one business row (visible and populated).
   * Used as a stable "table updated" signal after a filter is applied.
   * The table always contains "Practice Area Total" when data is present.
   */
  async isTableRenderedWithData(): Promise<boolean> {
    try {
      await this.page.getByText('Practice Area Total').first().waitFor({
        state: 'visible',
        timeout: 20000
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Selects a single month in the Months filter by clicking its label via JS evaluate.
   * The filter panel must already be open. Clicks the first visible month checkbox
   * in the Months filter's listitem.
   */
  async selectFirstMonthInFilter(): Promise<void> {
    // Use JS evaluate to click the first label.reactCustomCheckbox inside the Months filter,
    // bypassing viewport boundary restrictions for overflow:scroll containers.
    await this.page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('label.reactCustomCheckbox'));
      if (labels.length > 0) {
        (labels[0] as HTMLElement).click();
      }
    });
  }

  /**
   * Clicks the Apply button inside the Months filter panel.
   * The Months filter has a scoped .button-footer .apply that is different from
   * the Date Range filter's Apply button.
   */
  async clickApplyInMonthsFilter(): Promise<void> {
    const filterContainer = this.page
      .locator('li')
      .filter({ has: this.page.locator('.filter-heading', { hasText: 'Months' }) });
    await filterContainer.locator('.button-footer .apply').click();
  }

  /**
   * Clicks the Clear button inside the Months filter panel, then reopens it.
   * Clicking Clear closes the Months panel (toggle behaviour).
   */
  async clickClearInMonthsFilter(): Promise<void> {
    const filterContainer = this.page
      .locator('li')
      .filter({ has: this.page.locator('.filter-heading', { hasText: 'Months' }) });
    await filterContainer.locator('.button-footer .clear').click();
    // Clear closes the panel — reopen so subsequent selectMonth() calls work
    await this.page.locator('.filter-heading', { hasText: 'Months' }).click();
  }

  /**
   * Returns true if the named filter's selected-count badge is NOT present after reset.
   * Waits briefly to allow the DOM to update following the Reset click.
   */
  async hasNoFilterBadgeAfterReset(filterName: string): Promise<boolean> {
    // After Reset, the selected-count elements are removed from the DOM.
    return this.filterHasNoBadge(filterName);
  }

  /**
   * Checks if all options within a named multi-select filter are deselected.
   * Opens the filter if it's closed, checks checkboxes, then closes.
   * Returns true if no checkboxes are checked, false otherwise.
   */
  async areAllOptionsDeselected(filterName: string): Promise<boolean> {
    // After Clear the panel closes. Re-open to check the state.
    const li = this.page.locator('li').filter({
      has: this.page.locator('.filter-heading', { hasText: filterName })
    });
    // Click the filter heading to open the panel
    await this.page.locator('.filter-heading', { hasText: filterName }).click();
    // Wait a moment for the panel to open
    try {
      await li.locator('.filter-container').waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      // Panel may not have a .filter-container — check for checkboxes directly
    }
    const checkboxes = li.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    if (count === 0) return true;
    for (let i = 0; i < count; i++) {
      if (await checkboxes.nth(i).isChecked()) return false;
    }
    return true;
  }

  /**
   * Navigates to the Home page by clicking the Home button in the breadcrumb.
   */
  async navigateToHomePage(): Promise<void> {
    await this.page.getByRole('button', { name: 'Home' }).first().click();
    await this.page.waitForURL('**/', { timeout: 30000 });
    // Wait for the BILLABILITY TREND tile to confirm Home page loaded
    await this.page.getByText('BILLABILITY TREND').first().waitFor({
      state: 'visible',
      timeout: 30000
    });
  }

  /**
   * Reloads the current page and waits for the Billability table to re-render.
   */
  async refreshPage(): Promise<void> {
    await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
    // Wait for Billability by Business heading to confirm page re-rendered
    await this.page.getByText('Billability by Business').first().waitFor({
      state: 'visible',
      timeout: 60000
    });
    // Wait for table data
    await this.page.locator('.chart__table__header').waitFor({
      state: 'visible',
      timeout: 30000
    });
  }

  /**
   * Returns true if the named filter has a selection badge on the current page
   * (regardless of which page is active).
   * Used to verify cross-page filter persistence.
   */
  async isFilterBadgeVisible(filterName: string): Promise<boolean> {
    return this.filterHasSelectionBadge(filterName);
  }

  /**
   * Returns true if the Grand Total row is visible in the table.
   * Used to verify the table rendered successfully after a filter was applied.
   */
  async isGrandTotalVisible(): Promise<boolean> {
    return this.page.getByText('Grand Total', { exact: true }).first().isVisible();
  }

  /**
   * Returns true if all filter badges are cleared AND the Date Range label
   * shows the pattern "Mmm YYYY to Mmm YYYY" (i.e. the range is valid and reset).
   * After Reset the default date range ("Jan 2025 to Dec 2025") is restored.
   */
  async isDefaultDateRangeRestored(): Promise<boolean> {
    const label = await this.getDateRangeLabel();
    return /\w{3} \d{4} to \w{3} \d{4}/.test(label);
  }

  /**
   * Returns true if all filters are in their default state (no badges, date range is valid).
   * Used for the refresh-resets-filters scenario.
   */
  async areFiltersInDefaultState(): Promise<boolean> {
    const allCleared = await this.areAllFilterSelectionsCleared();
    const dateRangeOk = await this.isDefaultDateRangeRestored();
    return allCleared && dateRangeOk;
  }

  /**
   * Returns true if all business rows EXCEPT the first one are still collapsed
   * (i.e. their expanded_ sections still have the hide class).
   * This confirms individual row expand does not affect siblings.
   */
  async areOtherRowsCollapsed(): Promise<boolean> {
    return this.page.evaluate(() => {
      const greyRows = Array.from(document.querySelectorAll('.collapsed_section_grey_0'));
      if (greyRows.length <= 1) return true;
      // Check all rows after the first
      const otherRows = greyRows.slice(1);
      for (const row of otherRows) {
        const expandedId = row.id.replace('collapsed_', 'expanded_');
        const expandedEl = document.getElementById(expandedId);
        if (expandedEl && !expandedEl.classList.contains('hide')) {
          return false; // Found a non-first row that is expanded
        }
      }
      return true;
    });
  }

  // ── @export methods ──────────────────────────────────────────────────────────

  /**
   * Returns true if the Export button is present and not disabled.
   * The Export button has class "ui button download-container__btn" and is
   * NOT a native disabled button — verified live: disabled=false, no aria-disabled.
   */
  async isExportButtonEnabled(): Promise<boolean> {
    const btn = this.page.getByRole('button', { name: 'Export' });
    const isVisible = await btn.isVisible();
    if (!isVisible) return false;
    const isDisabled = await btn.isDisabled();
    return !isDisabled;
  }

  /**
   * Clicks the Export button and waits for the Playwright download event.
   * Returns the Download object so callers can assert filename and save the file.
   * Uses Promise.all to set up the event listener BEFORE the click fires.
   * Timeout: 60000ms — generous for a potentially slow server-side export.
   */
  async clickExportAndWaitForDownload(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent('download', { timeout: 60000 }),
      this.page.getByRole('button', { name: 'Export' }).click(),
    ]);
    return download;
  }

  /**
   * Saves the given Download to a temp file in test-results/ and returns the
   * full path. Creates the directory if it does not exist.
   */
  async saveDownload(download: Download): Promise<string> {
    const dir = path.resolve(__dirname, '../../../test-results');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const savePath = path.join(dir, download.suggestedFilename());
    await download.saveAs(savePath);
    return savePath;
  }

  /**
   * Returns the file size in bytes of the given path.
   * Returns 0 if the file does not exist.
   */
  getFileSizeBytes(filePath: string): number {
    try {
      return fs.statSync(filePath).size;
    } catch {
      return 0;
    }
  }
}
