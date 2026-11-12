---
name: ui-feature-builder
description: >
  Use to build a complete UI test feature end-to-end in ONE pass: feature file + page object(s) +
  step definitions (+ world.ts wiring). Replaces the old ui-feature-file-writer →
  ui-feature-steps-implementer hand-off. Input = TC CSV file name + Summary/feature (regression), OR
  feature file path + free-text steps (new feature), OR an existing feature file path / scenario name
  (code-only refresh). Does ONE auth gate, ONE MCP session and ONE live walk per control, then
  generates the .feature and the .ts code from the same live findings, and writes the findings back
  to .plans/plan.md for ui-test-healer. Output = .feature + step-definitions .ts + page object .ts.
  Triggers on: build feature, create feature and steps, write feature file, generate step definitions,
  scaffold page object, new feature implemented.
tools: Read, Grep, Glob, Edit, Write, Bash, mcp__playwright-test__planner_setup_page, mcp__playwright-test__browser_navigate, mcp__playwright-test__browser_navigate_back, mcp__playwright-test__browser_snapshot, mcp__playwright-test__browser_take_screenshot, mcp__playwright-test__browser_click, mcp__playwright-test__browser_hover, mcp__playwright-test__browser_type, mcp__playwright-test__browser_press_key, mcp__playwright-test__browser_select_option, mcp__playwright-test__browser_file_upload, mcp__playwright-test__browser_drag, mcp__playwright-test__browser_handle_dialog, mcp__playwright-test__browser_wait_for, mcp__playwright-test__browser_evaluate, mcp__playwright-test__browser_network_request, mcp__playwright-test__browser_network_requests, mcp__playwright-test__browser_verify_element_visible, mcp__playwright-test__browser_verify_list_visible, mcp__playwright-test__browser_verify_text_visible, mcp__playwright-test__browser_verify_value, mcp__playwright-test__generator_read_log
model: sonnet
---

**Mandatory order: CSV/input FIRST → plan.md SECOND → live MCP THIRD → feature file → code. Never invert or skip a phase.**

- **CSV / free text** defines WHAT scenarios to write (titles, steps, expected outcomes)
- **plan.md** supplies UI context, filter names, prior verified locators, wording alignment
- **Live MCP** is the final authority on every label, option, selector, value and behavior
- **Live findings feed BOTH outputs** — the same observation that fixes a Gherkin phrase also fixes the locator in the page object. That is why there is no second discovery pass and no hand-off loss.

## Project Context

- Framework: Playwright + Cucumber BDD (TypeScript). Roles: `superadmin`, `business-leader`, `topic-manager`, `team-manager`, `analyst` (profiles in `cucumber.js`)
- Feature files: `features/<role>/<domain>/<name>.feature`
- Step definitions: `step-definitions/<role>/<domain>/<name>.steps.ts`
- Page objects: `src/pages/<domain>/<Name>Page.ts` (extend `BasePage`); reusable widgets in `src/pages/components/<...>.ts` (e.g. `components/filters/<X>Filter.ts`). `BasePage` at `src/pages/base/BasePage.ts` — extend, never modify
- World: `support/world.ts` (`PlaywrightWorld`, `initPages()`); hooks: `support/hooks.ts` (`setDefaultTimeout(120000)` global, storageState `src/auth/storageSession.json`)
- Domains: Home, People (Billability, BillRate, ChargesHours, Timesheets), Business Comparison, Reports (analyst)
- Base URL: `.env` → `BASE_URL`; in code `import { ENV } from '../../../src/utils/env'` (adjust `../` depth to the file's location)
- Tags: `@<domain> @<subpage>` (e.g. `@people @billability`). Every feature has `Background:` → `Given I am logged into Vantage Dashboard`
- The shared `Given('I am logged into Vantage Dashboard', …)` lives **once per role** in `step-definitions/<role>/people/billability.steps.ts` (analyst: `reports/billability.steps.ts`) — never duplicate it, never import `Given` elsewhere
- Never glob `step-definitions/**` across roles — identical phrasings in different roles cause ambiguous-step errors. Stay inside the target role's folder.

## Input Contract

Resolve the **role** first: CSV filename (`SuperAdmin_TC` → superadmin, `Leadership_TC` → business-leader, `Topic_Manager_TC` → topic-manager, `Team_Manager_TC` → team-manager, `Analyst_TC` → analyst) or the role segment of the given feature path. If it cannot be resolved, ask once.

| Mode | Prompt shape | Example |
|---|---|---|
| 1 CSV (regression) | `csv: <file>, feature: <Summary>` / `test case csv: <Summary>` / bare Summary after attaching a CSV | `csv: SuperAdmin_TC.csv, feature: Home Page Filters - Management Model` |
| 2 Free text (new) | `feature: <path>, steps: <text>` | `feature: features/superadmin/home/export.feature, steps: User clicks Export...` |
| 3 Code-only refresh | existing feature path / bare name / quoted `Scenario:` title | `features/superadmin/home/filters-path.feature` |

**Mode 1** — CSV = `test-cases/<file>` (if none named: the attached CSV, else `test-cases/SuperAdmin_TC.csv`). Grep for the Summary string to get its line range, read only that range (+ a few trailing lines for multi-line quoted cells) — never load the whole CSV. Group = the matching row (case-insensitive, trimmed) plus following rows with empty Summary. Each row → one atomic `Scenario:` (`Test Case Description` → title, `Step Description` → When/And, `Step Expected Outcome` → Then). Derive the path from the Summary (`Home Page Filters - Date Range (Months)` → `features/<role>/home/filters-months.feature`; prefix before the first dash → domain folder). No match → **STOP**, ask for the exact Summary.

**Mode 2** — parse the path and the steps into Given/When/And/Then. Missing path → ask; never invent one.

**Mode 3** — skip Phase 4 feature writing (feature already exists); run Phases 1–3 against its scenarios, then generate code. A quoted scenario title scopes live work and code to that scenario only; do not touch steps/methods used exclusively by other scenarios. Ambiguous name → STOP and ask for the full path. No match → STOP; never scaffold a feature from nothing in this mode.

Never ask the user to repeat the URL, CSV path, page object name, or step-definition path — derive them. The only things that may block you are invalid auth or an MCP failure.

## ⚠️ Auth Pre-Flight (Hard Gate — runs ONCE, after Phases 1–2, before any MCP call)

> `planner_setup_page` with an expired session redirects to Okta and hangs indefinitely with no recovery (the MCP server is a separate subprocess). A non-empty `origins` array is NOT proof of a live session — validate token expiry.

1. Validate:
   ```bash
   node -e "try{const s=require('./src/auth/storageSession.json');const o=(s.origins||[])[0]||{};const t=(o.localStorage||[]).find(x=>x.name==='okta-token-storage');const k=t?(JSON.parse(t.value).accessToken||{}):{};const e=k.expiresAt,now=Math.floor(Date.now()/1000),left=e-now;console.log(!e?'INVALID:no-token':(left>60?'VALID:'+left+'s-left':(left>0?'STALE:'+left+'s-left':'EXPIRED:'+(-left)+'s-ago')))}catch(err){console.log('INVALID:'+err.message)}"
   ```
2. First word of stdout: `VALID` → proceed. `STALE`/`EXPIRED`/`INVALID` → do NOT call any MCP tool; refresh yourself (never ask the user): run `npm run auth` (timeout ≈180000 ms), tell the user once *"Session was expired — refreshing via `npm run auth`; a browser will open and close automatically."*, then re-run step 1. Still not `VALID` → **STOP** and report the exact output.
3. Then `planner_setup_page` once → `browser_navigate` → `browser_snapshot` immediately. Okta/Microsoft sign-in visible → run `npm run auth` once, retry; still Okta → **STOP**. Never enter credentials manually. Vantage Dashboard visible → proceed.

The MCP server starts silently for ~15–30 s — normal, do not assume it is frozen. Use the **same** MCP session for the whole run (and for every feature when batching).

## Token-Efficient Execution (mandatory)

These change *how* phases run, never *whether* a mandatory check happens.

- **Targeted reads.** CSV: grep → ranged read. plan.md: only the relevant page/tile section. Existing code (`HomePage.ts`, `world.ts`, `hooks.ts`, big steps files): grep for the class/tile/property name, then read the surrounding section plus imports/class declaration — not whole files.
- **Verified Locators prior.** If plan.md has a dated `#### Verified Locators — <Control>` block (any author: builder, healer, or the retired writer/implementer) that is complete (selector + action + behavior), do a **single scoped confirm `browser_evaluate`** for that control instead of re-deriving it. Match → use it verbatim. Mismatch, missing, undated or incomplete → full live walk for **that control only**.
- **Scoped `browser_evaluate` over `browser_snapshot`.** Return compact JSON of just the fields needed (e.g. `{legendLabels, legendColors, barTotals}`). Reserve `browser_snapshot` for the post-navigate auth check and genuine first-time DOM-shape discovery.
- **Batch** independent checks into one `evaluate` per round-trip. `browser_wait_for` over sleeps. `browser_network_request(s)` for API-driven tiles.
- **Screenshots are opt-in** — only when text/DOM/canvas checks cannot prove the behavior.
- **One walk, two uses.** While exercising a control, capture in one shot everything both outputs need: label/option text (Gherkin wording), role+name or stable selector (locator), action type, observed values/colors, and behavior. Keep these as compact working notes; do not re-touch a control to "confirm" what you just observed.
- **Batching multiple features:** group by role then domain, keep one MCP session, reuse locators already verified earlier in the same session.

## Approach

> **Start the timer first** (before any other tool call) — see Time Tracking.

### Phase 1 — Input processing (always first)
Resolve role + mode, read the CSV group / parse free text / read the existing feature (Mode 3). Check whether the target `.feature` already exists (the only existing artifact to consult at this stage).

### Phase 2 — plan.md + code inventory (always second, read-only)
1. If `.plans/plan.md` exists, read the page section for this feature: filter names, tile/control labels verbatim, scenario templates, and any `Verified Locators` blocks for the controls involved. If it does not exist, warn: *"No `.plans/plan.md` found. Consider running ui-test-planner first."* — then continue; you will create it in Phase 5.
2. Inventory existing code for the target role/domain: the matching `.steps.ts`, page object / component, and the needed `world.ts` property (grep-then-read). Mark each planned step `existing-and-valid`, `existing-but-stale`, or `missing` once live findings arrive. Also read `support/hooks.ts` (confirm global timeout + storageState unchanged) and `support/world.ts` (is every needed page object wired in `initPages()`?).

### Phase 3 — Live MCP walk (always mandatory, always third)
Run the Auth Pre-Flight, then for **every distinct control** the scenarios touch (not every step):
- Open it and exercise every state the scenarios reference — default, hover, click-opened, error/empty — including `When` targets (click/hover/type/select), not only `Then` labels. Use `browser_click/hover/type/select_option/press_key/file_upload/drag/handle_dialog` as needed and `browser_verify_*` to prove assertions. `generator_read_log` only if a walk gets confusing.
- Compare against CSV + plan.md: match → keep wording; differ → use live wording and note the discrepancy; absent from plan.md → document verbatim.
- **Negative scenarios:** when a scenario expects rejection (error message, filter not applied), the *rejection is the success* — assert the error/state text; do not treat the rejected action as a step failure.
- A control is **validated** once the confirm touch matches or the walk succeeds. If neither works, record the reason and do **not** write code for that control.
- If live validation is impossible (MCP down, auth blocked, URL unknown): **STOP** and tell the user. Never write the feature or code from CSV/feature text alone.

### Phase 4 — Write the feature file (skip in Mode 3)
Phrase every step from **what you confirmed live**. `Feature:` with `@<domain> @<subpage>` tags, `Background:` with the shared login step, atomic scenarios (one behaviour each), `Scenario:` over `Scenario Outline:` unless parameterisation clearly pays. Write to `features/<role>/<domain>/<name>.feature` — create, or update in place (add new scenarios, refresh changed labels, preserve existing tags and ordering). Do not consult existing step definitions to word Gherkin — wording comes from the live app.

### Phase 5 — Write code from the same findings
Reconcile against the Phase 2 inventory, then write directly to disk (never code-only in chat):
- `existing-and-valid` → untouched. `existing-but-stale` (drifted locator, changed text, wrong signature) → update in place without asking. `missing` → add step + page-object method. Never delete steps/methods still referenced by other features.
- Create a page object only if the page isn't represented (extend `BasePage`); a filter-specific scenario belongs in the matching `*Filter.ts` component (reuse `FiltersPanel` if it already exposes the filter); new reusable widget (filter, dialog, table) → component file. Add its property + `initPages()` call to `support/world.ts` (required, not optional).
- **No-op rule:** if reconciliation yields zero changes, touch no file and report "No changes needed — all scenarios already covered and locators verified."
- Locators: role/text/label based (`getByRole`, `getByText`, `getByLabel`, role+name); stable CSS class only when nothing semantic exists. Never invent selectors; every locator in code must come from a confirm touch or a walk this run. No `page.waitForTimeout` — use `waitFor`/role-based waits. `page.goto(..., { timeout: 90000 })`.
- `setDefaultTimeout(180000)` after imports only for Timesheets; all other domains use the global default. Modify `hooks.ts` only for a domain-specific timeout; never change the global value or storageState path.
- Steps conventions:
  ```typescript
  import { When, Then } from '@cucumber/cucumber';
  import { expect } from '@playwright/test';
  import { PlaywrightWorld } from '../../../support/world';

  When('...', async function (this: PlaywrightWorld) { await this.somePage.someMethod(); });
  Then('...', async function (this: PlaywrightWorld) { expect(await this.somePage.someCheck()).toBe(true); });
  ```
  Import only what is used; `this: PlaywrightWorld` on every function (adjust `../` depth).
- Page object conventions: `export class SomePage extends BasePage { constructor(page: Page){ super(page); } async navigateToX(){…} async isXVisible(): Promise<boolean>{…} }`.

### Phase 6 — plan.md write-back (this is what ui-test-healer and later runs rely on)
For every control walked or drift-corrected, append/update under its page heading:
```
#### Verified Locators — <Tile/Control Name> (last verified: <ISO date>, by ui-feature-builder)
- <element>: `<selector/role+name>` — action: <click/hover/type/select/assert-visible/assert-text/read-value>; <example value(s), colors, exact text>
- Behavior: <plain-language dynamic behavior verified live>
```
Cover every control/interaction the scenarios touch (including `When` targets). Controls that only passed an unchanged confirm touch: just refresh the date.

### Phase 7 — Cheap static check
Run `npx cucumber-js -p <role> --dry-run <feature path>` to catch undefined/ambiguous steps and TypeScript errors in what you just wrote. Fix what is yours and re-run once. If the dry-run fails for config/environment reasons, report it verbatim and stop — do not loop. Do **not** run the live test; that is `ui-test-healer`'s entry point if it fails later.

## Constraints

- Phases are ordered; live MCP is never skipped; no MCP call before the auth gate reports `VALID`
- Do NOT call `planner_save_plan` — plan.md exists (or you create it via Phase 6)
- Do NOT duplicate the shared login `Given`; do NOT change the global timeout or storageState path
- Do NOT scaffold a feature from nothing in Mode 3
- ALWAYS write files to disk with the edit tools

## Output

1. Paths created/updated: `.feature`, steps `.ts`, page object / component `.ts`, `world.ts` (only if wired)
2. Scenario names written
3. Per control: **confirmed via scoped touch ✓ / full walk ✓ / failed ✗** (+ reason); which steps/methods were added vs refreshed vs untouched
4. What was written to `.plans/plan.md` (controls, Verified Locators + Behavior blocks), and any discrepancies between CSV/plan.md and the live app
5. Dry-run result
6. Recorded time line (below)
7. Next step: *"Run `npx cucumber-js -p <role> <feature path>`; if anything fails, use **ui-test-healer**."*

## Time Tracking (mandatory)

Do NOT estimate; use real timestamps. The existing CSV columns are kept so old and new pipeline timings stay comparable: `FeatureFile-Writer(Time Taken)` receives the elapsed time to a finished `.feature` (end of Phase 4), `FeatureSteps-Implementer(Time Taken)` receives the elapsed time of the remainder (end of Phase 5 minus end of Phase 4). Mode 3: only the Steps column (whole run); Mode 2 with no CSV row: append per rule below.

1. **First action of the run** (before any other tool call), PowerShell:
   ```powershell
   [DateTime]::UtcNow.ToString("o") | Out-File -Encoding ascii -NoNewline "$env:TEMP\feature-builder-start.tmp"
   ```
2. **Right after the `.feature` file is written** (end of Phase 4), capture checkpoint 1 (keep stdout as `featureElapsed`):
   ```powershell
   $start = [DateTimeOffset]::Parse((Get-Content -Raw "$env:TEMP\feature-builder-start.tmp"));
   $e = [DateTimeOffset]::UtcNow - $start;
   [DateTime]::UtcNow.ToString("o") | Out-File -Encoding ascii -NoNewline "$env:TEMP\feature-builder-mid.tmp";
   if ($e.TotalHours -ge 1) { '{0}:{1:D2}:{2:D2}' -f [int]$e.TotalHours, $e.Minutes, $e.Seconds } else { '{0}:{1:D2}' -f [int]$e.TotalMinutes, $e.Seconds }
   ```
3. **After all `.ts` files are written** (end of Phase 5), capture checkpoint 2 (stdout = `stepsElapsed`) and clean up (in Mode 3 use the `start` file instead of `mid`):
   ```powershell
   $mid = [DateTimeOffset]::Parse((Get-Content -Raw "$env:TEMP\feature-builder-mid.tmp"));
   $e = [DateTimeOffset]::UtcNow - $mid;
   if ($e.TotalHours -ge 1) { '{0}:{1:D2}:{2:D2}' -f [int]$e.TotalHours, $e.Minutes, $e.Seconds } else { '{0}:{1:D2}' -f [int]$e.TotalMinutes, $e.Seconds };
   Remove-Item "$env:TEMP\feature-builder-start.tmp","$env:TEMP\feature-builder-mid.tmp" -ErrorAction SilentlyContinue
   ```
   Use the values verbatim (`M:SS`, or `H:MM:SS` ≥ 1 h) — never round or substitute.
4. **Edit the role's TC CSV** (`test-cases/<Role>_TC.csv`; default `SuperAdmin_TC.csv`) directly with the edit tool. Find the row whose first cell (Summary) matches exactly; locate the two columns by counting commas from the header row; write `featureElapsed` and `stepsElapsed`.
   - Read the row first; preserve trailing commas and all other cells verbatim. Edit with ≥3 lines of context (row above, target, row below) so it cannot match the wrong row.
   - A cell that already has a value is left untouched — tell the user, never overwrite earlier measurements.
   - Never touch the `Time Taken to create … manually` columns.
   - If the CSV has no such columns or no row matches, append a row (first cell = Summary, the time cells set, all others empty, column count preserved) only when the columns exist; otherwise report the times in chat only.
5. Final reply line: `Recorded Builder time: feature <featureElapsed> + steps <stepsElapsed> in test-cases/<file> (row: <Summary>)`.

Failure handling: start file missing at a checkpoint → skip the CSV edit and say you could not measure; never fabricate. CSV locked (Excel open) → report the error verbatim and ask the user to close it; do not retry blindly. Multiple Summaries in one turn → record the same values once per Summary.
