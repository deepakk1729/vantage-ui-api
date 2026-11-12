# Role-Based Test-Case Analysis & Implementation Report

**Scope:** `Leadership_TC.csv`, `Analyst_TC.csv`, `Topic_Manager_TC.csv`, `Team_Manager_TC.csv`
**Date:** 2026-07-02
**Live env:** https://vantagedashboard-stg.bcg.com/ — **verified live via Playwright MCP, impersonating one representative member per role.**
**Framework state:** Only the `superadmin` profile is wired up today. Role regression (Business Leader / Topic Manager / Team Manager / Analyst) is *not yet implemented* — these CSVs are the spec (`cucumber.js`: "Role-based regression is being restructured").

> ⚠️ **Headline:** Live behaviour differs materially from the CSVs for **Analyst** and **Topic Manager**. Implement to the **live matrix in §2**, not the raw CSVs. See §3 for every deviation.

**Roles verified (impersonated members):**
| Role (CSV file) | Product term | Member impersonated |
|---|---|---|
| Leadership | **Business Leader** | Rejdak, Hauke |
| Topic Manager | Topic Manager | Kumar, Sujit |
| Team Manager | Team Manager | Kwok, Clement |
| Analyst | Analyst | Abraham, Ruth |
| SuperAdmin | Super Admin | Self (base account) |

(Additional members supplied for cross-checking: Business Leader → Tan, Evelyn; Topic Manager → Baxter, Sarah; Analyst → Abarca, Karol.)

---

## 1. How roles are exercised (live-confirmed)

All roles share the **one** superadmin Okta session; the role context is applied at runtime through the **`User Validation`** control (`.select-impersonator`) — search member by **"Last, First"**, select, Apply, page re-renders as that person. This is exactly what `support/impersonation.ts` automates, and it worked live for all four members. `config/roles.ts` is the place to register each role's impersonation target.

---

## 2. Live-verified capability matrix (SOURCE OF TRUTH)

| Capability | Super Admin | Business Leader | Topic Manager | Team Manager | Analyst |
|---|:--:|:--:|:--:|:--:|:--:|
| Reports section nav **label** | People | People | People | People | **Reports** |
| **Business Comparison** (Billability) | ✅ | ✅ | ✅ | ❌ | ❌ |
| People/Reports → Billability | ✅ | ✅ | ✅ | ✅ | ✅ |
| People/Reports → Timesheets | ✅ | ✅ | ✅ | ✅ | ✅ |
| People/Reports → Charges/Hours | ✅ | ✅ | ✅ | ✅ | ✅ |
| **People → Bill Rate** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Filter count** | 10 | 10 | 10 | **7** | **2** |
| — Date Range, Months | ✅ | ✅ | ✅ | ✅ | ✅ |
| — Name | ✅ | ✅ | ✅ | ✅ | ❌ |
| — Path, Management Model, Job Title, Location | ✅ | ✅ | ✅ | ✅ | ❌ |
| — Practice Area | ✅ | ✅ *(pre-scoped)* | ✅ *(pre-scoped)* | ❌ | ❌ |
| — Geo Business | ✅ | ✅ | ✅ | ❌ | ❌ |
| — Status | ✅ | ✅ | ✅ | ❌ | ❌ |
| Home tiles | full 11 | full 11 | full 11 | full 11 | **personal scorecard (different)** |

**Access axes (live):**
- **Business Comparison** → Super Admin, Business Leader, Topic Manager. *(not Team Manager, not Analyst)*
- **Bill Rate** → everyone **except Analyst**.
- **Full 10 filters** → Super Admin, Business Leader, Topic Manager. **Team Manager = 7** (no PA/Geo/Status). **Analyst = 2** (Date Range + Months only).

---

## 3. Deviations: CSV vs. live app (must reconcile before automating)

| # | Role | CSV says | Live app | Action |
|---|---|---|---|---|
| **D1** | **Analyst** | Filter section lists **7** filters (Date Range, Months, Name, Path, Mgmt Model, Job Title, Location) **and** has individual test cases for Practice Area, Geo Business, Status | **Only 2 filters exist: Date Range + Months.** No Name/Path/Mgmt Model/Job Title/Location/PA/Geo/Status | Rewrite Analyst filter suite to **Date Range + Months only**. Delete all other filter cases. |
| **D2** | **Analyst** | Home shows the standard 11 tiles | Home is a **personal scorecard**: Case Billability / CD Billability / Hourly Bill Rate summary + Billability Trend + Vantage Averages (Region / Career Path / Practice Area breakdowns). Layout differs from the shared 11-tile grid | **Re-derive Analyst home tiles live** (do not reuse the generic 11-tile spec). |
| **D3** | **Analyst** | Reports section = "People" (implied) | Nav section labelled **"Reports"** (not "People") | Use "Reports" as the nav label/locator for Analyst. |
| **D4** | **Topic Manager** | **No** Bill Rate page (CSV omits it) | **Bill Rate tab IS present** | Add Bill Rate coverage for Topic Manager (CSV under-specifies). |
| **D5** | **Team Manager** | Section list = 7 filters, **but** file also has individual PA / Geo Business / Status cases | Exactly **7 filters** (no PA/Geo/Status) — section list correct | Delete Team Manager's PA / Geo Business / Status filter cases. |
| **D6** | Business Leader, Topic Manager | Practice Area filter starts empty | **Practice Area is pre-applied ("1")** — role auto-scoped to its own PA | Default-state tests must expect a **non-empty** PA filter (badge "1"), and data already PA-scoped. |
| **D7** | all | Tile-list description column jumps 6→9 (drops Vantage Pulse Check, Team Size) | Both tiles exist | Cosmetic CSV typo; expected-outcome column is correct. |
| **D8** | all | Export expected-outcomes copy-pasted ("business comparison data" / "timesheet data" on wrong pages) | n/a | Reword per page before asserting. |
| **D9** | Business Leader vs Topic Manager | — | Nav **order** differs: Business Leader shows Business Comparison **before** People; Topic Manager shows People **before** Business Comparison | Locate nav items by name, not index. |

---

## 4. Mapping to existing framework artifacts

All pages/steps exist already for the superadmin surface — role work is **gating + a few net-new specs**, not new page objects.

| Area | Existing feature | Existing page object |
|---|---|---|
| Home tiles | `features/home/*-tile.feature`, `tiles-validation.feature` | `src/pages/home/HomePage.ts` |
| Filters | `features/home/filters-*.feature`, `filter-section.feature` | `src/pages/components/filters/*Filter.ts` |
| Business Comparison | `features/businessComparison/billability.feature` | `src/pages/businessComparison/BillabilityPage.ts` |
| People → Billability / Timesheets / Charges-Hours / Bill Rate | `features/people/*.feature` | `src/pages/people/*Page.ts` |
| People nav/tabs | `features/people/people-tab.feature` | `src/pages/people/PeoplePage.ts` |

**Net-new work required:**
- **Analyst is a distinct surface** — needs its own home (personal scorecard) spec + a 2-filter spec + "Reports" nav. Most existing Home/filter features do **not** apply to Analyst.
- **Absence/negative scenarios** — Business Comparison not present (Team Mgr, Analyst); Bill Rate not present (Analyst); PA/Geo/Status filters absent (Team Mgr); only-2-filters (Analyst).
- **Bill Rate for Topic Manager** (D4).

---

## 5. Recommended implementation approach

### 5.1 Register roles + impersonation targets — `config/roles.ts`
```ts
export const roles: Record<string, RoleConfig> = {
  superadmin:     { impersonate: null },
  businessLeader: { impersonate: 'Rejdak, Hauke' },   // alt: 'Tan, Evelyn'
  topicManager:   { impersonate: 'Kumar, Sujit' },    // alt: 'Baxter, Sarah'
  teamManager:    { impersonate: 'Kwok, Clement' },
  analyst:        { impersonate: 'Abraham, Ruth' },   // alt: 'Abarca, Karol'
};
```
`support/impersonation.ts` already drives the `User Validation` control — no new automation needed.

### 5.2 Add cucumber role profiles — `cucumber.js`
Extend `ROLE_PROFILES` and add a profile per role (mirror `superadmin`), passing `worldParameters.role` so `impersonationTarget()` resolves and reports write to `reports/<role>_cucumber.*`.

### 5.3 Gate by capability tags (two independent axes ⇒ not role-linear)
Tag scenarios by capability; exclude per profile:
- `@business-comparison` → exclude for `teamManager`, `analyst`
- `@bill-rate` → exclude for `analyst`
- `@filter-pa @filter-geo @filter-status` → exclude for `teamManager`, `analyst`
- `@filter-name @filter-path @filter-mgmt-model @filter-job-title @filter-location` → exclude for `analyst`
- Tag the whole standard Home grid `@shared-home`; exclude for `analyst` (Analyst uses its own `@analyst-home`).

Example — Analyst profile tags:
`not @skip and not @api and not @business-comparison and not @bill-rate and not @shared-home and not @filter-name and not @filter-path and not @filter-mgmt-model and not @filter-job-title and not @filter-location and not @filter-pa and not @filter-geo and not @filter-status`

### 5.4 Add absence/negative scenarios
One positive "is not visible/present" assertion per excluded capability, per role (new visibility-negative helpers on the nav/page objects).

---

## 6. Execution order

1. ✅ Live matrix confirmed (§2) — done.
2. Reconcile CSVs to §3 with the QA author (esp. D1, D2, D4, D5).
3. Register roles in `config/roles.ts`; add profiles in `cucumber.js`.
4. Apply capability tags to existing features.
5. Author Analyst-specific specs (personal home + 2-filter + "Reports" nav) and all absence scenarios (§5.4); add Topic Manager Bill Rate (D4).
6. Run each profile (`npx cucumber-js -p <role>`) and reconcile.

---

## 7. Status of prior blockers

| # | Blocker | Status |
|---|---|---|
| B1 | Do Analyst / Team Manager see PA / Geo / Status filters? | **RESOLVED (live).** Team Manager: NO (7 filters). Analyst: NO — Analyst has only Date Range + Months (D1). |
| B2 | Role-representative member names | **RESOLVED.** Provided + verified live (see header). |
| B3 | Reword export/expected-outcome copy-paste errors | Open — QA author (D8). |

**Remaining open items:** D1, D2, D4, D5 need the QA author to update the CSVs so automation encodes the live behaviour (not the current CSV text).
