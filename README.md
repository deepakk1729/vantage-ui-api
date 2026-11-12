# Vantage Dashboard Playwright Framework

A comprehensive end-to-end testing framework combining **Playwright** and **Cucumber BDD** for the BCG Vantage Dashboard, with **custom AI agents** for autonomous test planning, generation, and healing.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Role Profiles](#role-profiles)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup & Installation](#setup--installation)
- [Environment Configuration](#environment-configuration)
- [Running Tests](#running-tests)
- [BDD Workflow](#bdd-workflow)
- [AI Agents](#ai-agents)
- [CI/CD Pipeline](#cicd-pipeline)
- [Troubleshooting](#troubleshooting)

---

## Overview

This framework is **BDD-only** using **Playwright + Cucumber**, structured around **role-based profiles** that map to distinct Vantage Dashboard user personas.

### Testing Strategy
- **Human-readable** Gherkin feature files per role (`features/<role>/`)
- **Role-isolated** step definitions — no cross-role step conflicts
- **Page Object Model** with a shared `BasePage` and role-specific extensions
- **Impersonation support** — automated user switching via the UI's User Validation control
- **AI-assisted** test planning, generation, and healing via custom VS Code agents
- **Session auto-refresh** — expired Okta sessions are detected and renewed automatically

### Covered Roles

| Role | Impersonates | Access |
|---|---|---|
| `superadmin` | Native session | All pages + admin controls |
| `business-leader` | Native session | Home, People, Business Comparison |
| `topic-manager` | Kumar, Sujit | Home, People (incl. Bill Rate) |
| `team-manager` | Kwok, Clement | Home, People (no Bill Rate, no BC) |
| `analyst` | Abraham, Ruth | Home, Reports only (2 filters) |

---

## Tech Stack

| Component | Technology | Version |
|---|---|---|
| Language | TypeScript | ~5.x |
| UI Testing | Playwright | ^1.60.0 |
| BDD | Cucumber-JS | ^12.9.0 |
| Runtime | Node.js | LTS (v18+) |
| Auth | Okta (OAuth 2.0) | — |
| Environment | dotenv / dotenvx | ^17.x |
| Dev Runner | ts-node | ^10.9.2 |

---

## Role Profiles

Each role has its own Cucumber profile in `cucumber.js` with isolated feature and step-definition paths. This prevents ambiguous step errors from identical phrasings across roles.

| Profile | Feature path | Step-defs path | Run command |
|---|---|---|---|
| `superadmin` | `features/superadmin` | `step-definitions/superadmin` | `npx cucumber-js -p superadmin` |
| `business-leader` | `features/business-leader` | `step-definitions/business-leader` | `npx cucumber-js -p business-leader` |
| `topic-manager` | `features/topic-manager` | `step-definitions/topic-manager` | `npx cucumber-js -p topic-manager` |
| `team-manager` | `features/team-manager` | `step-definitions/team-manager` | `npx cucumber-js -p team-manager` |
| `analyst` | `features/analyst` | `step-definitions/analyst` | `npx cucumber-js -p analyst` |

---

## Project Structure

```
PlaywrightFrameworkVantageDashboard/
│
├── features/                          # Gherkin feature files (per role)
│   ├── business-leader/
│   │   ├── home/                      # 24 home feature files (tiles, filters, etc.)
│   │   ├── people/
│   │   │   ├── billability.feature
│   │   │   ├── billrate.feature
│   │   │   ├── chargeshours.feature
│   │   │   └── timesheets.feature
│   │   └── businessComparison/
│   │       └── billability.feature
│   ├── topic-manager/
│   │   └── people/
│   │       ├── billability.feature
│   │       ├── billrate.feature
│   │       ├── chargeshours.feature
│   │       └── timesheets.feature
│   ├── team-manager/
│   │   └── people/
│   │       ├── billability.feature
│   │       ├── chargeshours.feature
│   │       └── timesheets.feature
│   ├── superadmin/
│   │   └── people/
│   │       ├── billability.feature
│   │       ├── billrate.feature
│   │       ├── chargeshours.feature
│   │       └── timesheets.feature
│   └── analyst/
│       └── people/
│           └── billability.feature
│
├── step-definitions/                  # Cucumber step implementations (per role)
│   ├── business-leader/
│   │   ├── home/
│   │   ├── people/
│   │   └── businessComparison/
│   ├── topic-manager/
│   │   ├── people/
│   │   └── businessComparison/
│   ├── team-manager/
│   │   └── people/
│   ├── superadmin/
│   │   └── people/
│   └── analyst/
│       └── people/
│
├── src/
│   ├── auth/
│   │   ├── auth.setup.ts              # Okta login + session generation
│   │   └── storageSession.json        # Cached Okta session (auto-generated)
│   ├── pages/                         # Page Object Model (per role)
│   │   ├── base/
│   │   │   └── BasePage.ts            # Shared base: sidebar nav, export, filters
│   │   ├── business-leader/
│   │   │   ├── home/HomePage.ts
│   │   │   ├── people/
│   │   │   │   ├── BillabilityPage.ts
│   │   │   │   ├── BillRatePage.ts
│   │   │   │   ├── ChargesHoursPage.ts
│   │   │   │   └── TimesheetsPage.ts
│   │   │   └── businessComparison/BillabilityPage.ts
│   │   ├── topic-manager/
│   │   │   └── people/ (same structure)
│   │   ├── team-manager/
│   │   │   └── people/ (same structure)
│   │   ├── superadmin/
│   │   │   └── people/ (same structure)
│   │   ├── analyst/
│   │   │   └── people/ (same structure)
│   │   └── filters/
│   │       └── PracticeAreaFilter.ts  # Shared filter component
│   ├── test-results/                  # Downloaded Excel exports (auto-generated)
│   └── utils/
│       ├── env.ts                     # Validated environment variables
│       ├── globalSetup.ts             # Playwright global setup
│       ├── logger.ts                  # Scoped logger
│       └── sessionGuard.ts            # JWT expiry check + auto-reauth
│
├── support/
│   ├── hooks.ts                       # BeforeAll / Before / After / AfterAll
│   │                                  # page.setDefaultTimeout(120000) set here
│   ├── world.ts                       # PlaywrightWorld (shared test state)
│   └── impersonation.ts               # User Validation dropdown automation
│
├── config/
│   └── roles.ts                       # Role → impersonation target mapping
│
├── .plans/
│   └── plan.md                        # AI agent live-exploration plan
│
├── test-cases/
│   ├── SuperAdmin_TC.csv              # UI test cases (BDD Planner source)
│   └── API_TC.csv                     # API test cases
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                     # GitHub-hosted pipeline (push/PR)
│   │   └── regression-self-hosted.yml # Self-hosted runner (scheduled)
│   └── WORKFLOWS.md
│
├── .env.example                       # Environment template
├── .env                               # Local secrets (git-ignored)
├── cucumber.js                        # Role profiles configuration
├── playwright.config.ts               # Playwright configuration
├── tsconfig.json
└── README.md
```

---

## Prerequisites

- **Node.js** LTS (v18+)
- **npm** 9+
- **Git**
- Okta account with access to `vantagedashboard-stg.bcg.com`

---

## Setup & Installation

### 1. Clone & Install
```bash
git clone https://github.com/your-org/PlaywrightFrameworkVantageDashboard.git
cd PlaywrightFrameworkVantageDashboard
npm ci
npx playwright install --with-deps
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
BASE_URL=https://vantagedashboard-stg.bcg.com/
OKTA_USERNAME=your.email@bcg.com
OKTA_PASSWORD=your-password
BEARER_TOKEN=           # auto-populated by npm run auth
```

### 3. Generate Authenticated Session
```bash
npm run auth
```

Opens a headed browser for Okta login. On success:
- `src/auth/storageSession.json` is written (contains Okta cookies + localStorage)
- `.env` is updated with `BEARER_TOKEN`

**Session expires after ~1 hour.** Re-run `npm run auth` when needed. During test runs, the session guard auto-refreshes if expiry is detected.

---

## Environment Configuration

### Required Variables

| Variable | Description |
|---|---|
| `BASE_URL` | `https://vantagedashboard-stg.bcg.com/` |
| `OKTA_USERNAME` | Okta test account email |
| `OKTA_PASSWORD` | Okta test account password |
| `BEARER_TOKEN` | Okta JWT — auto-populated by `npm run auth` |

### Optional Variables

| Variable | Description | Default |
|---|---|---|
| `HEADED` | Run browser headed | `0` |
| `SLOW_MO` | Slow down actions (ms) | `0` |
| `HEADLESS` | Force headless | `false` locally |
| `CI` | Set by GitHub Actions | — |

---

## Running Tests

### By Role (recommended)

```bash
# Full suite for a role
npx cucumber-js -p business-leader features/business-leader

# Single domain within a role
npx cucumber-js -p business-leader features/business-leader/home
npx cucumber-js -p business-leader features/business-leader/people
npx cucumber-js -p topic-manager  features/topic-manager/people

# Single feature file
npx cucumber-js -p business-leader features/business-leader/people/timesheets.feature
npx cucumber-js -p topic-manager   features/topic-manager/people/chargeshours.feature

# By tag within a role
npx cucumber-js -p business-leader features/business-leader/people --tags "@sort"
npx cucumber-js -p business-leader features/business-leader/people --tags "@export"
```

### All Roles (parallel — note: staging load)

Running multiple roles simultaneously will stress the staging server. Run sequentially for reliable results, or accept occasional 120s-timeout retries.

```bash
# Run all roles sequentially
for role in superadmin business-leader topic-manager team-manager analyst; do
  npx cucumber-js -p $role features/$role
done
```

### Reports

```bash
npm run report       # Open Playwright HTML report
npm run report:bdd   # Open Cucumber HTML report
```

---

## Current Test Suite Status

| Role | Suite | Scenarios | Notes |
|---|---|---|---|
| business-leader | Home | 33 passed, 2 skipped | Geo Business skip = staging data |
| business-leader | People | All passed | |
| business-leader | BC Billability | All passed | |
| topic-manager | People | 3 passed / 1 skipped per feature | @filter skips = staging data (PA Managed yields no data for Kumar, Sujit) |
| team-manager | People | 2–3 passed / 1–2 skipped per feature | @export skips = expected (no BC access) |
| superadmin | People | All passed | |

Skipped scenarios are **by design** — they soft-skip when staging data doesn't satisfy filter conditions, rather than failing.

---

## BDD Workflow

```
CSV Test Case  (or free-text steps / existing feature)
      ↓
 ui-feature-builder agent  (one live MCP session → feature + page objects + steps)
      ↓
 features/<role>/<domain>/<name>.feature
 step-definitions/<role>/...steps.ts   +   src/pages/...Page.ts   (+ support/world.ts wiring)
      ↓
 npx cucumber-js -p <role> features/<role>/...
      ↓
 [Fail?] → ui-test-healer agent  (diagnose + minimal fix)
```

### Step 1 — Build the Feature (feature file + page objects + steps)

Use the **`ui-feature-builder`** agent:
- Input: CSV file name + Summary (regression), OR feature path + free-text steps (new), OR an existing feature path / scenario name (code-only refresh)
- One auth gate, one MCP session, one live walk per control — the same findings produce the Gherkin wording and the locators, and are written back to `.plans/plan.md`
- Output: `.feature` + `step-definitions/<role>/...steps.ts` + `src/pages/...Page.ts` (+ `world.ts` wiring), followed by a `cucumber-js --dry-run` check

### Step 2 — Run & Fix

```bash
npx cucumber-js -p <role> features/<role>/<domain>/<name>.feature
```

If a step fails, use **`ui-test-healer`** agent:
- Input: failing feature file + error message
- The agent navigates the live app to reproduce the failure
- Output: fixed step def or page object (minimal change)

---

## AI Agents

Custom agents automate the BDD lifecycle. All are invoked via VS Code Copilot Chat.

### `ui-test-planner`
Scans the full application once and produces `.plans/plan.md` — a comprehensive map of all pages, controls, and navigation paths. Used as source-of-truth by all other agents.

**Trigger:** New project setup or major UI change.

---

### `ui-feature-builder`
Builds the whole UI test product in one pass from CSV test cases (regression), free-text steps (new features) or an existing feature file: feature file, page objects and step definitions. Walks each control live once, uses `.plans/plan.md` Verified Locators as a prior, and writes findings back to plan.md.

**Triggers:** `build feature`, `write feature file`, `generate step definitions`, `scaffold page object`

---

### `ui-test-healer`
Fixes failing BDD tests. Consults `.plans/plan.md` to diagnose root cause; applies the smallest possible fix. Handles: broken locators, selector changes, navigation timeouts, undefined steps, flaky timing.

**Triggers:** `fix failing test`, `heal broken step`, `locator not found`, `timeout error`

---

### `statusline-setup`
Configures the Claude Code status line setting. Internal utility agent.

---

## CI/CD Pipeline

### GitHub Actions Workflows

#### `ci.yml` — GitHub-Hosted (Push / PR)
- **Triggers:** Push to `main`/`master`, pull requests, manual dispatch
- **Runner:** `ubuntu-latest`
- **Duration:** ~50–60 min
- **Tests:** Full BDD suite with 2x retry
- **Artifacts:** HTML report (30 days), screenshots on failure (3 days)

#### `regression-self-hosted.yml` — Self-Hosted (Scheduled)
- **Triggers:** Weekdays 5:30 AM UTC (11:00 AM IST), manual dispatch
- **Runner:** `kd-actions-runner`
- **Duration:** ~60–75 min
- **Notifications:** Slack via Azure KeyVault
- **Artifacts:** HTML report (30 days)

### Required GitHub Secrets

```
BASE_URL              https://vantagedashboard-stg.bcg.com/
OKTA_USERNAME         your.email@bcg.com
OKTA_PASSWORD         your-password
BEARER_TOKEN_CI       auto-populated by auth job
AKV_SECRET            Azure service principal (self-hosted runner only)
AKV_VAULT_NAME        Azure KeyVault name (self-hosted runner only)
```

---

## Troubleshooting

### Session expired / storageSession.json not found
```bash
npm run auth
```
Log in via Okta. The session guard in `support/hooks.ts` also auto-refreshes mid-run if expiry is detected.

---

### Step is undefined
1. Check that the step text matches exactly (spacing, punctuation, regex vs Cucumber Expression)
2. Verify the step file is under the correct role path (e.g. `step-definitions/topic-manager/`)
3. Never glob `step-definitions/**` globally — identical phrasings across roles cause ambiguous step errors; each role profile points only to its own steps folder

---

### Locator timeout / element not found
- Check if the UI changed: run `npm run auth`, open the page manually, inspect the selector
- Use the **`ui-test-healer`** agent to auto-diagnose and fix
- Increase explicit timeouts if the page is genuinely slow under load

---

### Tests pass in isolation but fail when running all roles in parallel
Running 4+ browser instances against staging simultaneously can saturate the server. The framework uses `page.setDefaultTimeout(120000)` (set in `support/hooks.ts`) to give each action 120 seconds instead of Playwright's 30s default. If failures persist under parallel load, run roles sequentially.

---

### Okta sign-in page appears instead of app
`storageSession.json` has expired. Run:
```bash
npm run auth
```

---

### "Cannot find module" / TypeScript errors
```bash
npm ci
npx playwright install --with-deps
```

---

## Support & Documentation

- **Playwright Docs:** https://playwright.dev/docs/intro
- **Cucumber.js Docs:** https://github.com/cucumber/cucumber-js
- **Project Issues:** [GitHub Issues](https://github.com/your-org/repo/issues)

---

**Last Updated:** July 20, 2026
**Framework Version:** 1.0.0
**Maintainer:** Kumar Deepak
