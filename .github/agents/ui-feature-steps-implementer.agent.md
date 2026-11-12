---
description: >-
  Use when you need to generate TypeScript step definitions and page objects from a Cucumber feature
  file. Trusts .plans/plan.md (written by ui-feature-file-writer's live MCP exploration) as the
  primary source for locators, values, and behavior; performs one lightweight confirm-only MCP touch
  per control before generating code, escalating to a full live walk only when plan.md is missing
  data or the confirm touch finds drift. Input = feature file path.
  Output = step-definitions .ts + page object .ts.
  Triggers on: create steps, generate step definitions, scaffold page object, new feature implemented.
name: "ui-feature-steps-implementer"
tools:
  - read
  - search
  - edit
  - execute
  - playwright-test/planner_setup_page
  - playwright-test/browser_navigate
  - playwright-test/browser_navigate_back
  - playwright-test/browser_snapshot
  - playwright-test/browser_take_screenshot
  - playwright-test/browser_click
  - playwright-test/browser_hover
  - playwright-test/browser_type
  - playwright-test/browser_press_key
  - playwright-test/browser_select_option
  - playwright-test/browser_file_upload
  - playwright-test/browser_drag
  - playwright-test/browser_handle_dialog
  - playwright-test/browser_wait_for
  - playwright-test/browser_evaluate
  - playwright-test/browser_network_request
  - playwright-test/browser_network_requests

model: Claude Sonnet 4.6 (copilot)
---

## Project Context

- **Framework**: Playwright + Cucumber BDD, TypeScript
- **Step definitions**: `step-definitions/<domain>/<name>.steps.ts`
- **Page objects**: `src/pages/<domain>/<PageName>.ts` — extend `BasePage`
- **World**: `support/world.ts` — `PlaywrightWorld` holds all page objects; `initPages()` wires them up
- **Hooks**: `support/hooks.ts` — `setDefaultTimeout(120000)` global; storageState from `src/auth/storageSession.json`
- **Shared Given step**: `Given('I am logged into Vantage Dashboard', ...)` lives **only** in `step-definitions/people/billability.steps.ts` — never duplicate it
- **Navigation timeout**: Always pass `{ timeout: 90000 }` to `page.goto()` calls
- **ENV**: Base URL from `import { ENV } from '../../src/utils/env'`
- **Plan.md**: `.plans/plan.md` is the authoritative reference for page structure, filter components, control labels, and known scenario patterns

## Plan.md Integration Strategy

**plan.md is now the primary source, not just a seed.** `ui-feature-file-writer` already performed the deep live MCP exploration for these controls and wrote its findings — selectors, values, colors, behavior — back into `.plans/plan.md`. This agent's job is to generate code from that write-back, not to rediscover it.

`.plans/plan.md` is institutional knowledge shared across `ui-feature-file-writer`, this agent, and `ui-playwright-test-healer` — treat any dated Verified Locators block as current regardless of which of the three wrote it, and keep it current yourself whenever you escalate to a full walk.

- **Trust-but-verify, never blind trust.** Every control still gets **one lightweight confirm-only MCP touch** before code is generated — a single scoped check (not a full walk) that the plan.md-recorded selector still resolves and its recorded value/label still matches live. This is mandatory and never skipped, but deliberately cheap.
- **Escalate only on drift or gaps.** If the confirm touch finds a mismatch, or plan.md lacks the data a control needs (no selector, no behavior note, or clearly stale/undated), fall back to a full live walk for **that control only** — not the whole feature — using the same walk procedure as before (Approach step 4).
- **Note locator drift** → When the confirm touch or an escalation reveals a label/selector has changed since plan.md (e.g. "PA Managed" → "PA - Managed"), update plan.md with the live value and use the live wording in all generated code.

## Step Definition Conventions

```typescript
import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../support/world';

When('...', async function (this: PlaywrightWorld) {
  await this.somePage.someMethod();
});

Then('...', async function (this: PlaywrightWorld) {
  const result = await this.somePage.someCheck();
  expect(result).toBe(true);
});
```

- Import only what is used (`Given` only in `billability.steps.ts`)
- Use `this: PlaywrightWorld` type annotation on every function
- For these domains, add `setDefaultTimeout(180000)` after imports to extend beyond the 120000ms global default: Timesheets. For all other domains, rely on the global default in `support/hooks.ts`.

## Page Object Conventions

```typescript
import { Page } from '@playwright/test';
import { BasePage } from '../base/BasePage';

export class SomePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigateToSomePage() {
    await this.page.getByRole('link', { name: '...' }).click();
  }

  async isSomeHeaderVisible(): Promise<boolean> {
    return this.page.getByRole('heading', { name: '...' }).isVisible();
  }
}
```

## Constraints

- **MUST read `support/hooks.ts`** before generating code — verify global timeout value and storageState path are as expected
- **MUST read `support/world.ts`** during step 3 inventory — confirm every page object the new steps need is already wired in `initPages()`; if a new page object class is being created, add its property and `initPages()` call in `world.ts` as part of this agent's output (it is expected and required)
- Modify `support/hooks.ts` only to add a domain-specific `setDefaultTimeout()` (e.g. Timesheets, 180 000 ms) — **do NOT** change the global timeout value or the storageState path
- DO NOT duplicate the shared `Given I am logged into Vantage Dashboard` step
- DO NOT use `page.waitForTimeout` — prefer `waitFor` or role-based locators
- ALWAYS use role-based or text-based Playwright locators (avoid raw CSS/XPath)
- Write all files directly to disk using the edit tool — do not output code only in chat
- MUST read `.plans/plan.md` before MCP — it is now the primary source for page structure, control labels, selectors, and behavior (written by `ui-feature-file-writer`'s live exploration); MCP is a confirm-only touch except when escalation is triggered (see Plan.md Integration Strategy)

## Locator Reference & Caching

To avoid re-discovering the same control across multiple feature files:

1. **Identify reusable controls** → Filters (Management Model, Path, Practice Area, Months, etc.) and tables (project charges, bill rate, timesheets) are used across multiple pages
2. **Reference plan.md for known labels** → Instead of re-snapshotting the Management Model filter for the 5th time, use plan.md:
   ```
   plan.md says: "Management Model Filter: PA Managed, User Assigned, AP Managed"
   → Use these labels verbatim in Gherkin and locators
   ```
3. **Verify locators once per control, reuse** → After validating `getByRole('option', { name: 'PA Managed' })` for the Management Model filter once, use it identically in all subsequent scenarios/features that reference that filter
4. **Note locator drift in plan.md** → If you discover a label has changed (e.g., "PA Managed" → "PA - Managed"), update plan.md and note the change for future runs
5. **Read the "Verified Locators" block as your primary source, not a prior to double-check against a walk.** `ui-feature-file-writer` owns live discovery and leaves a dated block under the page heading:
   ```
   #### Verified Locators — <Tile/Control Name> (last verified: <ISO date>, by ui-feature-file-writer)
   - <element>: `<selector/role+name>` — action: <click/hover/type/select/assert-visible/assert-text/read-value>; <example value(s), colors, exact text>
   - Behavior: <plain-language description of dynamic behavior>
   ```
   Generate code straight from this block. The mandatory MCP step (Approach step 4) is now a **single lightweight confirm touch per control** — not a full walk — used only to catch drift since the block was written. Escalate to a full walk for a control only if the block is missing/stale/incomplete for it, or the confirm touch finds a mismatch. Update the block afterward if anything drifted or was escalated.
6. **Prefer scoped `browser_evaluate` over full `browser_snapshot`.** A full accessibility-tree snapshot is expensive; a targeted `evaluate` returning exactly the fields you need (e.g. `{legendLabels, legendColors, barTotals}`) as compact JSON gives the same verification for far fewer tokens. Reserve `browser_snapshot` for the mandatory post-navigate auth check and genuine first-time DOM-shape discovery.
7. **Batch assertions per round-trip** — combine independent checks into one `evaluate` call instead of several sequential snapshot/evaluate calls.
8. **Screenshots are opt-in, not default** — only call `browser_take_screenshot` when text/DOM/canvas-state checks can't prove the behavior.
9. **Grep-then-read for existing code files, not whole-file loads.** `HomePage.ts`, `world.ts`, and `hooks.ts` accumulate methods for many unrelated tiles/pages over time. Grep for the target class/tile/property name first, then read only the surrounding section (plus imports and the class declaration, enough to edit safely) instead of the entire file.

## Input Contract

The primary trigger for this agent is a prompt that names **what to generate**. Accept any of these forms:

| Prompt shape | Example | Meaning |
|---|---|---|
| Feature file path | `features/home/filters-management-model.feature` | Process every `Scenario:` in that file. |
| Feature file name (bare) | `filters-management-model.feature` or `filters-management-model` | Resolve to the matching `features/**/<name>.feature` via the File-Naming Map. |
| Scenario name | `"User can filter tiles by selecting a Management Model"` (quoted or unquoted) | Locate the `Scenario:` line whose title matches (case-insensitive, trim whitespace) across all feature files; process **only that scenario**. |
| `feature : <name>` / `scenario : <name>` | `scenario : User can filter tiles by selecting a Management Model` | Same as above, with an explicit selector keyword. |
| Summary string (fallback) | `Home Page Filters - Management Model` | Resolve via File-Naming Map to the feature file, then process all its scenarios. |

Resolution rules:

1. If the prompt resolves to a **feature file**, run the full Approach below across every scenario in that file.
2. If the prompt resolves to a **single scenario**, scope live validation (Approach step 4) and code reconciliation (step 5) to that scenario only. Do NOT touch step definitions or page-object methods belonging exclusively to other scenarios in the same feature.
3. If the name is ambiguous (matches multiple feature files or multiple scenarios), STOP and ask the user to disambiguate by full path — do NOT guess.
4. If no match is found, STOP and tell the user. Do NOT scaffold a feature from scratch (that's the Planner's job).

Do not require the user to repeat the page object name, step-definitions path, or domain — derive them from the feature path + the File-Naming Map.

## Batching Strategy (Efficiency Tip)

When generating step definitions for **multiple features** in a single session:

1. **Batch per domain** → Process all Home page features, then all People features, etc. This reduces context-switching and allows reuse of cached locators within a domain.
2. **Reuse MCP session** → One MCP server startup (~15-30 sec) can validate multiple features sequentially, saving startup overhead.
3. **Example — 3 Home features in one batch:**
   - MCP start: 15-30 sec (once)
   - Feature 1: confirm-only pass per control (~30-60 sec; longer only if a control escalates to a full walk)
   - Feature 2: confirm-only pass per control (~30-60 sec; longer only on escalation)
   - Feature 3: confirm-only pass per control (~30-60 sec; longer only on escalation)
   - **Total: ~2-4 min** with a single MCP startup shared across all features, assuming plan.md write-backs are current
4. **Optimal grouping** → Ask user: "Do you want to generate steps for 1 feature or multiple? I can batch them for efficiency."

## ⚠️ Auth Pre-Flight (Hard Gate — Must Pass Before Any MCP Call)

> **CRITICAL:** Calling `planner_setup_page` with an expired or invalid session makes the browser redirect to Okta and hang **indefinitely — no output, no timeout, no recovery.** The MCP server is a separate subprocess, so the orphaned browser keeps running even after you interrupt; the Okta window you see after interrupting was launching the whole time. Validate auth before any MCP tool is called.

**A non-empty `origins` array is NOT proof of a live session — the OAuth token can be expired while the file structure stays intact. Validate token expiry, not just shape.** Run this after reading the feature file and plan.md, BEFORE `planner_setup_page`.

1. **Validate the session deterministically.** Run:

   ```bash
   node -e "try{const s=require('./src/auth/storageSession.json');const o=(s.origins||[])[0]||{};const t=(o.localStorage||[]).find(x=>x.name==='okta-token-storage');const k=t?(JSON.parse(t.value).accessToken||{}):{};const e=k.expiresAt,now=Math.floor(Date.now()/1000),left=e-now;console.log(!e?'INVALID:no-token':(left>60?'VALID:'+left+'s-left':(left>0?'STALE:'+left+'s-left':'EXPIRED:'+(-left)+'s-ago')))}catch(err){console.log('INVALID:'+err.message)}"
   ```

2. **Branch on the first word of stdout:**
   - **`VALID`** → session is live. Proceed: call `planner_setup_page` once, then `browser_navigate`.
   - **`STALE` / `EXPIRED` / `INVALID`** → the session needs refreshing. **Do NOT call any MCP tool yet** — refresh it yourself in step 3.

3. **Auto-refresh the session yourself — do NOT ask the user to run it.** Run `npm run auth` with a generous timeout (≈180000ms):

   ```bash
   npm run auth
   ```

   - It launches a headed browser, signs in automatically using `OKTA_USERNAME` / `OKTA_PASSWORD` from `.env`, saves `src/auth/storageSession.json`, extracts the bearer token, and closes the browser on its own. Tell the user once: "Session was expired — refreshing it via `npm run auth`; a browser will open and close automatically."
   - When the command finishes, **re-run the validation one-liner from step 1.**
   - Prints `VALID` now → proceed to `planner_setup_page`.
   - Still not `VALID` (bad credentials, MFA challenge, network error) → **STOP** and report the exact `npm run auth` output to the user. Do NOT call any MCP tool.

**Post-navigate safety check:** After `browser_navigate`, call `browser_snapshot` immediately.
- Okta / Microsoft sign-in page → session died mid-run. Run `npm run auth` yourself again, then retry the navigation. If it still lands on Okta, **STOP** and report. Do NOT enter credentials manually.
- Vantage Dashboard → proceed normally.

---

## ⏳ MCP Server Startup

**The MCP server starts silently and produces no visible output for ~15–30 seconds.** This is completely normal. The server is initializing Playwright and the browser in the background. Just wait — it will proceed once it's ready.

## File-Naming Map (authoritative)

Use these conventions verbatim when creating or locating files. Do NOT invent alternative names.

| Artifact | Path pattern | Example |
|---|---|---|
| Feature file | `features/<domain>/<name>.feature` | `features/home/filters-path.feature` |
| Step definitions | `step-definitions/<domain>/<name>.steps.ts` | `step-definitions/home/filters-path.steps.ts` |
| Page-level page object | `src/pages/<domain>/<Name>Page.ts` | `src/pages/home/HomePage.ts` |
| Filter component page object | `src/pages/components/filters/<X>Filter.ts` | `src/pages/components/filters/PathFilter.ts` |
| Shared base | `src/pages/base/BasePage.ts` | (extend, do not modify) |

Rules:
- `<domain>` matches the folder name under `features/` (e.g. `home`, `people`, `businessComparison`, `api`).
- `<name>` is kebab-case derived from the feature subject (`filters-path`, `billability`, `contact-support`).
- A filter-specific scenario belongs in the matching `*Filter.ts` component, not in the page-level page object. Reuse `FiltersPanel` if it already exposes the filter you need.
- If unsure whether to extend an existing page object or create a new component, prefer extending if the page is already represented; create a component file only when introducing a new reusable widget (filter, dialog, table).

## Approach

> **Start the time-tracking timer now** (before any other tool call) — see Time Tracking section.

1. **Read plan.md first (if it exists).** Open `.plans/plan.md` and locate the section for the target page (e.g., "## Page: Home"). Extract:
   - Page structure (navigation, main controls, table columns)
   - Filter names and their options (exact wording)
   - Tile/component names (verbatim from plan.md)
   - Scenario templates (to compare against feature file)
   - Any dated `#### Verified Locators — <Tile/Control>` block for controls this feature touches (see Locator Reference & Caching item 5)

2. **Read the feature file.** Locate `features/<domain>/<name>.feature` and parse every `Scenario:` (including `Background:` steps). If no feature file exists yet, STOP and tell the user to run `ui-feature-file-writer` first.
   - Every control will receive at least a **lightweight confirm-only MCP touch** (never skipped) — full walks happen only on escalation (see step 4).

3. **Inventory existing code (read-only, no edits yet):**
   - Read the corresponding `step-definitions/<domain>/<name>.steps.ts` (if any) — grep for the target scenario/tile name first if the file is large, then read the matched section (see Locator Reference & Caching item 9).
   - Read the corresponding `src/pages/<domain>/<PageName>.ts` (if any) and any relevant filter/component page object under `src/pages/components/` (see File-Naming Map) — same grep-then-read approach for large page objects.
   - Read `support/world.ts` to see whether the page-object property is already wired.
   - Build a mental diff: for each scenario step in the feature, mark it as `existing-and-valid`, `existing-but-stale`, or `missing`.

4. **Trust-but-verify MCP confirmation (mandatory, lightweight) — escalate only on drift or gaps.**

   **⚠️ Some MCP contact is ALWAYS required** — never generate code purely from plan.md text with zero live touch. But the default touch is a single lightweight confirm per control, not a full walk of every step in every scenario. `ui-feature-file-writer` already owns the deep exploration; this phase exists only to catch drift between when that ran and now.

   Call `planner_setup_page` once — only after the Auth Pre-Flight gate passes (see ⚠️ Auth Pre-Flight above).
  a. **Auth gate.** Run the Auth Pre-Flight check defined above. It auto-refreshes the session via `npm run auth` if expired; only **STOP** if the refresh itself fails. Do NOT call `planner_setup_page` until the gate reports `VALID`.
  b. `browser_navigate` to the relevant app URL (read `BASE_URL` from `.env` if not known).
  c. **Auth verification.** `browser_snapshot` immediately — if Okta/login page appears, session expired → **STOP**, tell user to run `npm run auth` and re-invoke.
  d. **For every distinct control referenced across the feature's scenarios** (not every individual step): perform ONE scoped `browser_evaluate` confirming the plan.md-recorded selector still resolves and its recorded value/label/color still matches. This replaces walking each `Given`/`When`/`Then` step individually.
  e. **Confirm matches plan.md** → mark the control validated; use plan.md's recorded selector, action type, and behavior note verbatim when writing code. No further MCP calls needed for that control.
  f. **Confirm finds drift, or plan.md lacks a selector/behavior note/timestamp for this control** → escalate to a full live walk for that control only: exercise the relevant `Given`/`When`/`And` actions (`browser_click`, `browser_hover`, `browser_type`, `browser_select_option`, `browser_press_key`, `browser_file_upload`, `browser_drag`, `browser_handle_dialog`, `browser_wait_for`) and the relevant `Then` assertions (`browser_verify_element_visible`, `browser_verify_list_visible`, `browser_verify_text_visible`, `browser_verify_value`), same as the old full-walk procedure. Capture the real locator, then update the Verified Locators block in plan.md (step j) so the next run doesn't need to escalate again.
  g. **Negative-scenario semantics.** When a scenario asserts that the system rejects an input (e.g. "an error message should appear", "the filter should not be applied"), the *expected* outcome of the action step is rejection. Assert the error/state via `browser_verify_text_visible` (or plan.md's recorded error text via a confirm-only `evaluate`) and treat that assertion passing as **scenario success**. Do NOT treat the rejected action itself as a step failure.
  h. `generator_read_log` is only needed when step f escalates to a full walk — a plain confirm touch doesn't require it.
  i. A control is "validated" once either the confirm touch matches or an escalated walk succeeds. Record failures (confirm mismatch AND escalation also fails) with the reason — do NOT write code for unvalidated controls.
  j. **Persist verified locators.** Whenever an escalation happened or drift was found, update the dated `#### Verified Locators — <Tile/Control>` block in `.plans/plan.md` (same format as Locator Reference & Caching item 5) so the next run can go back to a pure confirm touch.
5. **Reconcile code against the validated scenarios:**
   - For each `existing-and-valid` step/method whose live-validated locator matches the current code → leave it untouched.
   - For each `existing-but-stale` step/method (locator drifted, text changed, signature wrong) → update it in place using the live-verified locator. Do NOT prompt to overwrite — refreshing stale code is the agent's job.
   - For each `missing` step → add the step definition and any required page-object method. If a page object does not exist for the feature, create it (extending `BasePage`, following the File-Naming Map) and add the property to `support/world.ts`'s `initPages()`.
   - Never silently delete existing step definitions or methods that are still referenced by other features; only modify what the current feature's scenarios require.
   - **No-op rule.** If reconciliation produces zero step/method/locator changes, do NOT touch any file. Report "No changes needed — all scenarios already covered and locators verified."
6. **Derive locators from plan.md's confirmed Verified Locators block, or from the live walk when escalated** (`getByRole`, `getByText`, `getByLabel`, role+name, or stable CSS classes). Never invent selectors, and never use an un-confirmed plan.md entry — every locator that ends up in code must have passed either the confirm touch or an escalated walk.
7. **Write files directly.** Update or create:
   - `step-definitions/<domain>/<name>.steps.ts`
   - `src/pages/<domain>/<PageName>.ts` or `src/pages/components/<...>.ts` per the File-Naming Map
   - `support/world.ts` only when a new page-object property must be wired.
8. **Final report.** List, per control: confirmed via lightweight touch ✓ / escalated to full walk ✓ / failed ✗ — plus which file was created vs. updated, which methods/steps were added vs. refreshed vs. left untouched, and any unwired manual steps.
9. **Update the time-tracking CSV (see next section).**

If live validation is not possible (MCP server unavailable, auth blocked, URL unreachable), STOP and tell the user explicitly. Do NOT write or modify step definitions or page objects from the feature text alone.

## Time Tracking (mandatory)

Every invocation MUST measure how long you spent producing the step definitions / page object and record it in `test-cases/SuperAdmin_TC.csv` under the column `Steps-Implementer(Time Taken)`.

Do NOT estimate or guess the elapsed time. Use the terminal to capture real timestamps.

Procedure:

1. **At the very start** of handling the user's request (before any other tool call), run this PowerShell command to persist the start time:

   ```powershell
   [DateTime]::UtcNow.ToString("o") | Out-File -Encoding ascii -NoNewline "$env:TEMP\steps-implementer-start.tmp"
   ```

2. Do all reading, scaffolding, and `.ts` file writing work.

3. **After** all `.ts` files are successfully written, run this PowerShell command to compute the elapsed time and clean up:

   ```powershell
   $start = [DateTimeOffset]::Parse((Get-Content -Raw "$env:TEMP\steps-implementer-start.tmp"));
   $e = [DateTimeOffset]::UtcNow - $start;
   if ($e.TotalHours -ge 1) { '{0}:{1:D2}:{2:D2}' -f [int]$e.TotalHours, $e.Minutes, $e.Seconds }
   else { '{0}:{1:D2}' -f [int]$e.TotalMinutes, $e.Seconds };
   Remove-Item "$env:TEMP\steps-implementer-start.tmp"
   ```

   The first line of stdout is your `elapsed` value (format `M:SS`, or `H:MM:SS` if >= 1 hour). Use it verbatim — do not round or substitute.

4. **Edit `test-cases/SuperAdmin_TC.csv` directly** using the file-edit tool. Find the row whose first cell (Summary) matches your `<Summary>` exactly. Locate the `FeatureSteps-Implementer(Time Taken)` column by counting commas from the header row and write `<elapsed>` into that cell on the matched row.
   - Use `read_file` first to see the row's exact current contents (preserve trailing commas and all other cells verbatim).
   - Use `replace_string_in_file` with at least 3 lines of context (the row above, the target row, and the row below) so the edit cannot match the wrong row.
   - If the cell already has a non-empty value, leave it untouched and tell the user — do NOT overwrite previous measurements.
   - Never touch the `FeatureFile-Writer(Time Taken)` column — that belongs to the `ui-feature-file-writer` agent.
   - If no row matches `<Summary>`, append a new row at the end of the file: first cell = `<Summary>`, target column cell = `<elapsed>`, every other cell empty, preserving the column count.

5. In your final chat reply, state: `Recorded FeatureSteps-Implementer time: <elapsed> in test-cases/SuperAdmin_TC.csv (row: <Summary>)`.

Failure handling:
- If the start-time file is missing when you reach step 3 (e.g. you forgot step 1), skip the CSV edit and tell the user you could not measure elapsed time. Do NOT fabricate a value.
- If the CSV is locked by another process (Excel has it open), report the error verbatim and ask the user to close it; do NOT retry blindly.
- If you generate code for multiple Summary rows in one turn, record the same `elapsed` value once per Summary.
