# API Infrastructure — Scalability Plan

Comparison of this repo's `src/api/` against the standalone `api-test-framework`
(a mature, API-only Playwright + Cucumber framework covering 331 scenarios / 27
feature files / 26 service classes), and a phased plan to extend Vantage
Dashboard's API layer to a similar scale.

## Comparison

| Dimension | Vantage Dashboard (`src/api/`) | api-test-framework |
|---|---|---|
| Structure | 3 files total: `ApiClient.ts`, `utils/schemaValidator.ts`, 1 schema | Layered: `clients/`, `services/` (26 classes), `schemas/` (806 files), `fixtures/` (20), `steps/` mirroring services 1:1 |
| Schema validation | Hand-rolled ~100-line Draft-07 subset (no `oneOf`/`format`/`$ref`/ranges) | AJV + ajv-formats, strict mode, compiled+cached, one file per endpoint×status |
| Coverage | 1 endpoint, 1 scenario, tagged `@skip`, never runs in CI | 331 scenarios across 27 feature files, one per backend controller |
| Auth | Single scheme: static Bearer+`x-api-key` from `.env`, sourced only via full Okta **browser** login | 3 interchangeable strategies (static token / Okta UI scrape / OAuth2 client-credentials), singleton token cache, decoupled from UI runs when a static/OAuth token is available |
| Domain layer | None — step defs call `ApiClient` directly, endpoint path hardcoded in the step file | Service-Object layer per controller (`services/pathways/*Service.ts`) — steps never touch HTTP directly |
| Test data | None (only a parameterless GET exists) | Builder-with-overrides fixtures per domain (`fixtures/*.ts`) |
| Reporting | Shares the UI's Cucumber HTML/JSON reports, no separate stream | Cucumber HTML/JSON **+ Allure**, with failure-response attachments |
| CI | Not wired in at all (excluded from every role profile and from the only workflow file) | None either (gap on their side) — local `npm run test*` only |
| Tagging | `@api`, `@skip` only | ~25 tags (`@smoke`, `@regression`, per-domain, `@get`, `@wip`) enabling selective runs |
| Parallelism | N/A (1 scenario) | `parallel: 0` — deliberately sequential even at 331 scenarios (their gap too) |
| Observability | Manual `Date.now()` timing in the step file | `responseTimer.ts` wraps every service call automatically; leveled logger |

The reference framework's core scalability idea isn't AJV or Allure specifically
— it's the **Service-Object layer**: steps never build requests themselves,
they call a typed method on a per-domain service class, which is what lets 26
domains and 331 scenarios coexist without duplicated HTTP/assertion code.
Vantage's API layer skipped that layer entirely because it only ever needed
one endpoint.

Two things the reference framework does **not** solve either (no CI wiring, no
parallelism) — worth avoiding copying those gaps rather than treating it as a
perfect template.

## Proposed Plan

### Phase 0 — Dependencies
- Add `ajv` + `ajv-formats`; delete `schemaValidator.ts`'s hand-rolled
  validator and reimplement `validateAgainstSchema` on top of AJV (keeps the
  existing step-def call signature, so `user-access-details.steps.ts` doesn't
  need to change).
- Add `allure-cucumberjs`/`allure-js-commons` only if richer reports than the
  existing HTML/JSON are wanted — otherwise skip, since role suites already
  have a working report pipeline.

### Phase 1 — Restructure `src/api/`
```
src/api/
├── clients/ApiClient.ts        (move as-is, add patch(), query-param support, configurable timeout)
├── services/<domain>Service.ts (one per dashboard backend domain: home, timesheets, billability, businessComparison, people, exports)
├── schemas/<domain>/*.schema.json
├── fixtures/<domain>.ts        (builder-with-overrides for POST/PUT payloads)
└── endpoints.ts                (central path registry — replaces the hardcoded ENDPOINT constant in the one step file today)
```
Each service method wraps `ApiClient` + a timing wrapper (mirrors their
`responseTimer.ts`) — no HTTP calls originate from step definitions anymore.

### Phase 2 — Auth decoupling
- Keep the current Okta-browser-derived `BEARER_TOKEN` for CI (it already
  works and role suites depend on the same session).
- Add a fallback in `ApiClient.init()`: if `BEARER_TOKEN` is already valid in
  `.env` (checked via the existing `sessionGuard.ts` logic), skip re-deriving
  it — lets an API-only local run skip spinning up Chromium if a token is
  already cached. This is a smaller, safer version of their 3-strategy
  `authHandler` — not worth fully replicating unless the Vantage backend
  actually exposes a client-credentials grant.

### Phase 3 — Expand coverage
- Un-skip `user-access-details.feature` and give it a proper home in the
  CI-wired profile (see Phase 4).
- Write new `features/api/<domain>.feature` files for the endpoints backing
  the dashboard's tiles/exports/filters (one file per domain, using the same
  5 reusable `Then` steps already in `user-access-details.steps.ts` — that
  pattern is sound and just needs volume behind it).
- Adopt a small tagging taxonomy now rather than later: `@smoke`,
  `@regression`, `@<domain>`.

### Phase 4 — CI wiring
(a gap even the reference framework has, but is cheap to close here)
- Add an `api` cucumber profile that isn't excluded from the standard tag
  filters, with its own `require` glob.
- Add `test:bdd:api` npm script and a matching job in
  `.github/workflows/regression-self-hosted-new.yml`, parallel to the role
  jobs, writing to `reports/api_cucumber.*` for a separate artifact stream.

### Phase 5 — Resilience & scale
(once endpoint count grows)
- Add opt-in retry/backoff to `ApiClient` for idempotent GETs only (don't
  blanket-retry, per the reference framework's explicit "fail fast" reasoning
  for mutating calls).
- Turn on Cucumber `parallel: N` for the API profile once there are enough
  scenarios that sequential execution becomes the bottleneck.
