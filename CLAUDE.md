# Vantage Dashboard — Playwright BDD Framework

## MCP Auth Pre-Flight (MANDATORY — Hard Gate)

> **CRITICAL TRIGGER:** Whenever the user's message contains the word **"mcp"**, OR whenever you are about to call **any tool whose name starts with `mcp__playwright-test__`**, you MUST complete the auth pre-flight below BEFORE calling any MCP tool. No exceptions.

This gate prevents the browser from hanging on Okta redirect indefinitely (the MCP server is a separate subprocess — a hung browser cannot be recovered without killing it manually).

### Step 1 — Validate the session

Run this exact command:

```bash
node -e "try{const s=require('./src/auth/storageSession.json');const o=(s.origins||[])[0]||{};const t=(o.localStorage||[]).find(x=>x.name==='okta-token-storage');const k=t?(JSON.parse(t.value).accessToken||{}):{};const e=k.expiresAt,now=Math.floor(Date.now()/1000),left=e-now;console.log(!e?'INVALID:no-token':(left>60?'VALID:'+left+'s-left':(left>0?'STALE:'+left+'s-left':'EXPIRED:'+(-left)+'s-ago')))}catch(err){console.log('INVALID:'+err.message)}"
```

### Step 2 — Branch on the first word of stdout

| Result starts with | Action |
|---|---|
| `VALID` | Session is live → proceed to Step 3 |
| `STALE` / `EXPIRED` / `INVALID` | Session needs refresh → go to Step 2a |

**Step 2a — Auto-refresh (do NOT ask the user to run it):**

```bash
npm run auth
```

Use timeout ≈ 180000 ms. Tell the user once: *"Session was expired — refreshing via `npm run auth`; a browser will open and close automatically."* After it finishes, re-run the validator from Step 1. If still not `VALID`, **STOP** and report the exact error — do NOT call any MCP tool.

### Step 3 — Post-navigate safety check

After `browser_navigate`, immediately call `browser_snapshot`.
- **Okta / Microsoft sign-in page visible** → session expired mid-run. Re-run `npm run auth` once, retry navigation. If still on Okta, **STOP**.
- **Vantage Dashboard visible** → proceed normally.

### MCP Server Startup

The MCP server starts silently with no output for ~15–30 seconds. This is normal — do not assume it is frozen.

---

## Project Structure

- **Framework**: Playwright + Cucumber BDD (TypeScript)
- **Feature files**: `features/<role>/<domain>/<name>.feature`
- **Step definitions**: `step-definitions/<role>/<name>.steps.ts`
- **Page objects**: `src/pages/<domain>/<PageName>.ts` — extend `BasePage`
- **Auth session**: `src/auth/storageSession.json`
- **Base URL**: read from `.env` → `BASE_URL`
- **Role profiles**: `superadmin`, `business-leader`, `topic-manager` (see `cucumber.js`)

## Role Profiles (cucumber.js)

Each role has its own profile, feature folder, and step-definitions folder. Never glob `step-definitions/**` globally — identical step phrasings across roles cause ambiguous step errors.

| Profile | Feature path | Steps path |
|---|---|---|
| `superadmin` | `features/superadmin` | `step-definitions/superadmin` |
| `business-leader` | `features/business-leader` | `step-definitions/business-leader` |
| `topic-manager` | `features/topic-manager` | `step-definitions/topic-manager` |

Run a role suite: `npx cucumber-js -p <role> features/<role>`
