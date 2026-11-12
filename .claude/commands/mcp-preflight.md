# MCP Auth Pre-Flight

Run this before any MCP browser tool call to validate (and if needed, refresh) the Okta session.

## Procedure

**Step 1 — Validate session expiry:**

```bash
node -e "try{const s=require('./src/auth/storageSession.json');const o=(s.origins||[])[0]||{};const t=(o.localStorage||[]).find(x=>x.name==='okta-token-storage');const k=t?(JSON.parse(t.value).accessToken||{}):{};const e=k.expiresAt,now=Math.floor(Date.now()/1000),left=e-now;console.log(!e?'INVALID:no-token':(left>60?'VALID:'+left+'s-left':(left>0?'STALE:'+left+'s-left':'EXPIRED:'+(-left)+'s-ago')))}catch(err){console.log('INVALID:'+err.message)}"
```

**Step 2 — Branch:**
- First word is `VALID` → report to user: "Session is live (Xs remaining). Ready to launch MCP." Then proceed.
- First word is `STALE` / `EXPIRED` / `INVALID` → tell user "Session expired — running `npm run auth` to refresh." Run:

```bash
npm run auth
```

(timeout: 180000 ms). Re-run Step 1 after it finishes.
- Now `VALID` → report: "Session refreshed. Ready to launch MCP." Proceed.
- Still not `VALID` → STOP. Report the exact stdout from both commands. Do NOT call any MCP tool.

**Step 3 — After navigating** call `browser_snapshot` immediately. If Okta appears → STOP and tell user to re-run `/mcp-preflight`.
