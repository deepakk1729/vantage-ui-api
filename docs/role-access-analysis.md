# Vantage Dashboard — Role Access Analysis

Live-verified on **staging** (`https://vantagedashboard-stg.bcg.com`) on **2026-06-24** via the
**User Validation** (impersonation) control, using the same superadmin automation session.
Data snapshot: *Data as of Dec-27, 2025*.

## Precondition to test a non-superadmin role

```
Log in  →  Home  →  open "User Validation" dropdown (top-right header)
        →  search "Search Team Members" for the person  →  select  →  Apply
```

After Apply, the header control shows the impersonated person's name and the whole app
re-renders in that person's role context. This control is only available to accounts that
have been granted the User Validation entitlement (the automation account now has it).

| Role | Representative user |
|---|---|
| Superadmin | (base automation account) |
| Business Leader | Rejdak, Hauke |
| Topic Manager | Kumar, Sujit |
| Team Manager | Kwok, Clement |
| Analyst | Abarca, Karol |

---

## Summary matrix

| Aspect | Superadmin | Business Leader | Topic Manager | Team Manager | Analyst |
|---|---|---|---|---|---|
| **Sidebar sections** | Home, Business Comparison, People | Home, Business Comparison, People | Home, **People, Business Comparison** (People-first) | Home, People | Home, **Reports** |
| **Business Comparison** | ✅ Billability | ✅ Billability | ✅ Billability | ❌ absent | ❌ absent |
| **People / Reports sub-items** | Billability, Timesheets, Charges/Hours, Bill Rate | same (4) | same (4) | same (4) | Billability, Timesheets, Charges/Hours (**no Bill Rate**) — section labelled **"Reports"** |
| **Home tiles** | 11 (all) | 11 (all) | 9 | 9 | 9 |
| → Vantage Pulse Check | ✅ | ✅ | ❌ | ❌ | ❌ |
| → Team Size | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Filters** | 9 | 9 | 9 | 6 | 1 |
| → Name | ✅ | ✅ | ✅ | ✅ | ❌ |
| → Practice Area | ✅ | ✅ | ✅ | ❌ | ❌ |
| → Geo Business | ✅ | ✅ | ✅ | ❌ | ❌ |
| → Path | ✅ | ✅ | ✅ | ✅ | ❌ |
| → Management Model | ✅ | ✅ | ✅ | ✅ | ❌ |
| → Job Title | ✅ | ✅ | ✅ | ✅ | ❌ |
| → Location | ✅ | ✅ | ✅ | ✅ | ❌ |
| → Status | ✅ | ✅ | ✅ | ❌ | ❌ |
| → Months | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Name filter size (data scope)** | full org | 1633 | 1633 | 1633 | n/a (no Name filter) |

Tiles common to **all** roles (9): Billability Trend, Vantage Averages, Case Engagement Depth,
Top Projects, Top Clients, Timesheet, Top Downloads, KN Material, RMS CT Satisfaction.

---

## Per-role detail

### Superadmin (base account)
- Full access. Sidebar: Home → Business Comparison (Billability) → People (Billability, Timesheets, Charges/Hours, Bill Rate).
- All 11 home tiles. All 9 filters.
- Owns the **User Validation** control to impersonate any team member.

### Business Leader — Rejdak, Hauke
- **Identical surface to superadmin**: same 3 sections, same submenus, all 11 tiles, all 9 filters.
- Name filter = **1633** members (org-wide visibility).
- Conclusion: Business Leader == Superadmin for the Home / BC / People feature set — the superadmin
  regression scenarios apply unchanged after impersonation.

### Topic Manager — Kumar, Sujit
- Sections same set but **re-ordered People-first**: Home → People → Business Comparison.
- **Loses 2 tiles**: Vantage Pulse Check, Team Size (9 tiles).
- All 9 filters present; Name = **1633** (org-wide).
- BC (Billability) still available.

### Team Manager — Kwok, Clement
- **No Business Comparison** section (Home + People only).
- 9 tiles (no Vantage Pulse Check, no Team Size).
- **6 filters only** — loses **Practice Area, Geo Business, Status**. Keeps Months, Name, Path, Management Model, Job Title, Location.
- Name = **1633** (org-wide).

### Analyst — Abarca, Karol  (most restricted)
- Sidebar: Home → **"Reports"** → Contact Support. The People section is **renamed "Reports"**.
- **No Business Comparison**.
- Reports sub-items: Billability, Timesheets, Charges/Hours — **no Bill Rate**.
- 9 tiles (no Vantage Pulse Check, no Team Size).
- **Only 1 filter: Months.** No Name filter at all → strong indicator the Analyst view is
  self-scoped (own data only) rather than org-wide.

---

## Key differences (deep analysis)

1. **Section access narrows by seniority**
   - Superadmin / Business Leader / Topic Manager: Home + Business Comparison + People.
   - Team Manager: drops **Business Comparison**.
   - Analyst: drops Business Comparison **and** Bill Rate; "People" becomes **"Reports"**.

2. **Sidebar ordering encodes the role's focus**
   - Superadmin & Business Leader: Business-Comparison-first.
   - Topic Manager & below: **People-first** (People/Reports promoted above BC).

3. **Tiles split into two tiers**
   - Superadmin & Business Leader see **Vantage Pulse Check** and **Team Size**; everyone Topic-Manager-and-below does not.
   - The other 9 tiles are universal.

4. **Filters shrink with role**
   - 9 filters (Superadmin, Business Leader, Topic Manager) → 6 (Team Manager, minus Practice Area / Geo Business / Status) → 1 (Analyst, Months only).
   - The disappearance of the **Name** filter for the Analyst is the clearest data-scope signal: with no way to pick another person, the Analyst sees only their own data.

5. **Data scope vs. UI scope**
   - For Business Leader, Topic Manager and Team Manager the **Name** filter still lists the full **1633**-person roster — i.e. these roles retain org-wide *data* visibility; what changes between them is the *UI surface* (sections / tiles / filters), not the underlying population.
   - The Analyst is the only role with no roster access (self-only).

6. **Business Leader ≡ Superadmin** for the in-scope feature areas — confirming the premise that the
   superadmin regression suite can be reused verbatim for the Business Leader role after the
   impersonation precondition.

---

## Implications for test automation

- **Business Leader** suite = superadmin scenarios + one impersonation precondition (Rejdak, Hauke). No scenario changes needed.
- **Topic Manager** suite = superadmin scenarios **minus** Vantage Pulse Check and Team Size tile scenarios; expect People-first sidebar ordering.
- **Team Manager** suite = drop all **Business Comparison** scenarios; drop Practice Area / Geo Business / Status filter scenarios; drop the two tiles above.
- **Analyst** suite = Home + Reports only; drop Business Comparison, Bill Rate, all filters except **Months**, and the two tiles; navigation label is **"Reports"**, not "People".
- A per-role tag/profile (e.g. `@business-leader`, `@topic-manager`, `@team-manager`, `@analyst`) plus a
  shared impersonation `Before` hook keyed off the tag would let the same step library serve all roles.

---

## Caveats

- Staging was intermittently degraded during capture (frequent `net::ERR_CONNECTION_CLOSED`); snapshots were taken after full load.
- Filter **population** is data-dependent and changed during the day: Geo Business and Job Title were empty (“No Record”) earlier on 2026-06-24 and were populated later; Practice Area / Location read empty at capture time for some roles. Treat populated/empty as a *data* state, not a fixed *role* property, unless re-confirmed.
- Data-scope was inferred primarily from the **Name** filter roster size and the presence/absence of filters; per-page row-level scoping (e.g. People ▸ Billability table contents per role) was **not** exhaustively walked.
- All findings are from impersonation via a superadmin session; a native login as each role was not performed.
