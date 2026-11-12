import { Page } from '@playwright/test';
import { BaseFilter } from './BaseFilter';

/**
 * PracticeAreaFilter
 *
 * Wraps the "Practice Area" multi-select filter panel on the Home page
 * (and any other page that shares the global filter sidebar DOM).
 *
 * DOM structure (verified live on staging 2026-06-24 — data now populated):
 *   li (filter listitem)
 *     .filter-heading  — click to open/close; shows .selected-count badge after Apply
 *     .treeSelectContainer  — present when open (NOTE: NOT .filter-container)
 *       .react-tree-menu.vertical-wrapper > .vertical-dropdown
 *         .vertical-option                — "Select all" row
 *         .vertical-option.marginL0       — one per top-level PA option
 *           .d-inline-flex.iconContainer  — expand toggle (i.angle.down.icon)
 *           label.reactCustomCheckbox
 *             input[type=checkbox]        — INVISIBLE (opacity:0, 0×0px); use label to interact
 *             label                       — visible option text
 *             span.checkmark
 *         .vertical-option.marginL20     — child topic rows (appear after expanding parent)
 *           label.reactCustomCheckbox
 *             input[type=checkbox]
 *             label                       — child topic text (e.g. EMESA, NAMR, Unaffiliated)
 *       .button-footer
 *         .clear   — deselects all; closes panel
 *         .apply   — applies selection; closes panel (class "apply disabled" when nothing selected)
 *
 * NOTE: The native input[type=checkbox] elements have opacity:0, width:0, height:0 (custom styled).
 * Playwright's waitFor({state:'visible'}) will NEVER resolve for them.
 * Use label.reactCustomCheckbox or .vertical-option.marginL0 for visibility checks.
 *
 * Selecting an option: clicking the label.reactCustomCheckbox (or its inner label) works.
 * Expanding a parent: clicking the .iconContainer div reveals .vertical-option.marginL20 children.
 */
export class PracticeAreaFilter extends BaseFilter {

  constructor(page: Page) {
    super(page, 'Practice Area');
  }

  /**
   * Scopes every filter query to the Practice Area <li> container to avoid
   * accidentally matching other filters that share the same inner classes.
   */
  private get paLi() {
    return this.page
      .locator('li')
      .filter({ has: this.page.locator('.filter-heading', { hasText: 'Practice Area' }) });
  }

  /**
   * Returns true if the filter panel is currently open (.treeSelectContainer visible).
   */
  async isPanelVisible(): Promise<boolean> {
    try {
      await this.paLi
        .locator('.treeSelectContainer')
        .waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns true if the filter panel is currently closed (.treeSelectContainer hidden/absent).
   */
  async isClosed(): Promise<boolean> {
    try {
      await this.paLi
        .locator('.treeSelectContainer')
        .waitFor({ state: 'hidden', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns true when the open filter panel shows "No Record"
   * (i.e. no Practice Area options are available in this environment).
   */
  async hasNoRecord(): Promise<boolean> {
    try {
      await this.paLi
        .getByText('No Record')
        .waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns true when at least one top-level option row (.vertical-option.marginL0)
   * is visible inside the open Practice Area filter panel.
   *
   * NOTE: The native input[type=checkbox] elements are invisible (opacity:0, 0×0).
   * We check the visible .vertical-option.marginL0 container rows instead.
   */
  async hasOptions(): Promise<boolean> {
    try {
      await this.paLi
        .locator('.vertical-option.marginL0')
        .first()
        .waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Selects the option row identified by the given label text.
   *
   * DOM: each top-level PA row is .vertical-option.marginL0 containing:
   *   .d-inline-flex.iconContainer  — expand toggle (clicking expands children but does NOT check)
   *   label.reactCustomCheckbox     — outer label wrapper
   *     input[type=checkbox]        — invisible (opacity:0, 0×0px)
   *     label                       — visible text (clicking this EXPANDS, does NOT check)
   *     span.checkmark              — visible styled checkbox indicator; clicking this CHECKS it
   *
   * We click span.checkmark to toggle the checkbox. Clicking the outer label.reactCustomCheckbox
   * or the inner <label> text element only expands the tree node; it does NOT toggle the checkbox.
   * Clicking span.checkmark fires via the outer label → toggles the hidden input → enables Apply.
   *
   * Live-verified (2026-06-24): clicking span.checkmark sets checkboxChecked=true and
   * changes Apply button class from "apply disabled" to "apply ".
   */
  async selectOption(optionName: string): Promise<void> {
    // Find the .vertical-option.marginL0 whose inner label text exactly matches optionName.
    const exactPattern = new RegExp(`^${optionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
    const optionRow = this.paLi
      .locator('.vertical-option.marginL0')
      .filter({ has: this.page.locator('label label', { hasText: exactPattern }) });
    await optionRow.waitFor({ state: 'visible', timeout: 15000 });

    // Read the checkbox state BEFORE clicking. This is the ground truth — Apply-enabled
    // alone is insufficient because for BL accounts all PAs start pre-checked, so Apply
    // is already enabled before any interaction and gives no feedback about a deselect.
    const checkbox = optionRow.locator('input[type=checkbox]');
    const stateBefore = await checkbox.evaluate((el: HTMLInputElement) => el.checked);

    for (let attempt = 0; attempt < 3; attempt++) {
      await optionRow.locator('span.checkmark').evaluate((el: HTMLElement) => el.click());
      await this.page.waitForTimeout(400);
      const stateAfter = await checkbox.evaluate((el: HTMLInputElement) => el.checked);
      if (stateAfter !== stateBefore) return;
    }
    // Checkbox state unchanged after 3 attempts — proceed anyway and let Apply decide.
  }

  /**
   * Clicks the "Clear" button in the filter footer.
   * Note: Clear closes the filter panel on the live app.
   * Uses evaluate(el.click()) — the button may sit above the viewport when the tree is
   * fully expanded, and Playwright's pointer-event dispatch would miss it.
   */
  async clear(): Promise<void> {
    await this.paLi.locator('.button-footer .clear').evaluate((el: HTMLElement) => el.click());
    // Wait for the panel to fully close — confirms React processed the Clear action.
    // An additional settle wait prevents a race where the next open() click fires before
    // React has finished committing the cleared filter state.
    await this.paLi.locator('.treeSelectContainer').waitFor({ state: 'hidden', timeout: 5000 });
    await this.page.waitForTimeout(400);
  }

  /**
   * Clicks the "Apply" button in the filter footer.
   * Waits for the Apply button to be enabled (i.e. at least one option selected)
   * before clicking. After applying, the panel closes automatically.
   *
   * Note: the Apply div has class "apply disabled" when nothing is selected and
   * just "apply " when enabled. We wait for the :not(.disabled) state.
   */
  async apply(): Promise<void> {
    await this.paLi.locator('.button-footer .apply:not(.disabled)').waitFor({ state: 'visible', timeout: 10000 });
    await this.paLi.locator('.button-footer .apply').evaluate((el: HTMLElement) => el.click());
  }

  /**
   * Returns true when the selection count badge (.selected-count) is visible
   * on the filter heading, indicating at least one PA option has been applied.
   */
  async isSelectionApplied(): Promise<boolean> {
    return this.paLi
      .locator('.filter-heading .selected-count')
      .isVisible()
      .catch(() => false);
  }

  // ── Expandable hierarchy helpers ─────────────────────────────────────────────
  // Used by the @expandable scenario.
  //
  // DOM (live-verified 2026-06-24):
  //   Each .vertical-option.marginL0 contains:
  //     .d-inline-flex.iconContainer > i.angle.down.icon  — the expand toggle
  //     label.reactCustomCheckbox                          — the checkbox + label
  //   After clicking the iconContainer, child rows appear as .vertical-option.marginL20.

  /**
   * Returns true when the first top-level PA option in the open panel has an
   * expand toggle (.iconContainer) indicating it has child topics.
   */
  async isExpandable(): Promise<boolean> {
    try {
      // Wait for at least one top-level option row to be visible.
      await this.paLi
        .locator('.vertical-option.marginL0')
        .first()
        .waitFor({ state: 'visible', timeout: 10000 });

      // Check whether the first row has an .iconContainer (expand toggle).
      const hasExpandToggle = await this.paLi
        .locator('.vertical-option.marginL0')
        .first()
        .locator('.iconContainer')
        .isVisible()
        .catch(() => false);

      return hasExpandToggle;
    } catch {
      return false;
    }
  }

  /**
   * Clicks the expand toggle (.iconContainer) on the first top-level PA option
   * to reveal its child topic rows (.vertical-option.marginL20).
   * Should only be called after confirming isExpandable() returns true.
   *
   * Accounts scoped to few practice areas (e.g. a single business leader's own
   * PAs) render every top-level option pre-expanded (icon already "angle up") —
   * unlike the broad/admin view where the list starts collapsed ("angle down").
   * Clicking an already-expanded toggle collapses it instead, so this is a no-op
   * when children are already visible.
   */
  async expandFirstOption(): Promise<void> {
    const firstOption = this.paLi.locator('.vertical-option.marginL0').first();
    const expandToggle = firstOption.locator('.iconContainer');
    await expandToggle.waitFor({ state: 'visible', timeout: 10000 });

    const alreadyExpanded = await firstOption
      .locator('.iconContainer i')
      .evaluate((el) => el.className.includes('up'));
    if (alreadyExpanded) return;

    await expandToggle.click();
  }

  /**
   * Returns true when child topic rows (.vertical-option.marginL20) are visible
   * below the expanded first PA option.
   * Live-verified (2026-06-24): expanding "BCG Transform" reveals
   * EMESA, NAMR, Unaffiliated as .vertical-option.marginL20 rows.
   */
  async areChildTopicsVisible(): Promise<boolean> {
    try {
      await this.paLi
        .locator('.vertical-option.marginL20')
        .first()
        .waitFor({ state: 'visible', timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }
}
