/**
 * sessionGuard.ts
 *
 * Two-pronged session check — no network calls made:
 *
 *  1. storageSession.json  — Okta browser session (used by UI/BDD tests)
 *  2. BEARER_TOKEN in .env — API JWT (used by ApiClient for direct API calls)
 *
 * Either failure triggers `npm run auth`, which refreshes both the session
 * file AND the BEARER_TOKEN in .env automatically.
 *
 * Total check time: < 5 ms when both are valid.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const SESSION_PATH = path.resolve('src/auth/storageSession.json');
const ENV_PATH     = path.resolve('.env');
const IS_CI        = !!process.env.CI;

/**
 * Treat a token as expired when it has less than this many seconds left.
 * 5 minutes gives a comfortable buffer against clock skew and test run duration.
 */
const EXPIRY_BUFFER_SECONDS = 300;

// ─── Single-flight mid-run re-auth lock ───────────────────────────────────────
// When several role suites run concurrently on ONE runner (same workspace),
// ensureFreshUiSession() must let only ONE process regenerate the session at a
// time; the rest wait for it and reuse the refreshed session. This prevents
// simultaneous "npm run ci:auth" runs racing on storageSession.json / .env and
// firing parallel Okta logins. A single-process run acquires the lock
// uncontended, so it is a no-op there. The lock is machine-local (one runner).
const REAUTH_LOCK_PATH     = path.resolve('src/auth/.reauth.lock');
const REAUTH_LOCK_STALE_MS = 150_000; // a ci:auth run is ~40-60s; older ⇒ abandoned
const REAUTH_WAIT_MAX_MS   = 180_000; // bound a waiter's total block time
const REAUTH_POLL_MS       = 2_000;

export interface SessionStatus {
  valid: boolean;
  reason?: string;
  /** Seconds until the access token actually expires (negative = already expired). */
  expiresInSeconds?: number;
}

/**
 * Inspects the Okta access-token JWT inside storageSession.json.
 * Runs synchronously; < 5 ms on any modern machine.
 */
export function checkSession(): SessionStatus {
  try {
    if (!fs.existsSync(SESSION_PATH)) {
      return { valid: false, reason: 'storageSession.json not found — run "npm run auth" first' };
    }

    const session = JSON.parse(fs.readFileSync(SESSION_PATH, 'utf-8'));

    const tokenEntry = (session.origins ?? [])
      .flatMap(
        (o: { localStorage?: Array<{ name: string; value: string }> }) =>
          o.localStorage ?? []
      )
      .find((e: { name: string }) => e.name === 'okta-token-storage');

    if (!tokenEntry) {
      return { valid: false, reason: 'okta-token-storage key not found in session localStorage' };
    }

    const tokenData = JSON.parse(tokenEntry.value);
    const jwt = tokenData?.accessToken?.accessToken as string | undefined;

    if (!jwt) {
      return { valid: false, reason: 'accessToken JWT not found inside okta-token-storage' };
    }

    const parts = jwt.split('.');
    if (parts.length !== 3) {
      return { valid: false, reason: 'Stored JWT is malformed (expected header.payload.signature)' };
    }

    // Decode payload — base64url → base64 → JSON (works on all Node versions)
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
    const exp = payload.exp as number | undefined;

    if (typeof exp !== 'number') {
      return { valid: false, reason: 'JWT payload has no exp claim' };
    }

    const nowSeconds     = Math.floor(Date.now() / 1000);
    const expiresInSeconds = exp - nowSeconds;

    if (expiresInSeconds <= EXPIRY_BUFFER_SECONDS) {
      const reason = expiresInSeconds <= 0
        ? `Session expired ${Math.abs(expiresInSeconds)}s ago`
        : `Session expires in ${expiresInSeconds}s (under ${EXPIRY_BUFFER_SECONDS}s safety buffer)`;
      return { valid: false, reason, expiresInSeconds };
    }

    return { valid: true, expiresInSeconds };

  } catch (err) {
    return { valid: false, reason: `Session check threw an error: ${(err as Error).message}` };
  }
}

// ─── Helper ─────────────────────────────────────────────────────────────────

/** Decode a JWT payload without verifying signature. Pure string ops, ~0 ms. */
function decodeJwtExp(jwt: string): number | undefined {
  const parts = jwt.split('.');
  if (parts.length !== 3) return undefined;
  try {
    const base64  = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
    return typeof payload.exp === 'number' ? payload.exp : undefined;
  } catch {
    return undefined;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Checks BEARER_TOKEN in .env:
 *  - Missing → invalid
 *  - Not a JWT (no exp claim) → treated as valid (opaque token)
 *  - Has exp → checked against now + EXPIRY_BUFFER_SECONDS
 */
export function checkBearerToken(): SessionStatus {
  try {
    if (!fs.existsSync(ENV_PATH)) {
      return { valid: false, reason: '.env file not found' };
    }

    const envContent = fs.readFileSync(ENV_PATH, 'utf-8');
    const match      = envContent.match(/^BEARER_TOKEN=(.+)$/m);

    if (!match || !match[1].trim()) {
      return { valid: false, reason: 'BEARER_TOKEN is missing or empty in .env' };
    }

    const token = match[1].trim();
    const exp   = decodeJwtExp(token);

    if (exp === undefined) {
      // Opaque token (no exp) — can't validate expiry, assume valid
      return { valid: true };
    }

    const nowSeconds      = Math.floor(Date.now() / 1000);
    const expiresInSeconds = exp - nowSeconds;

    if (expiresInSeconds <= EXPIRY_BUFFER_SECONDS) {
      const reason = expiresInSeconds <= 0
        ? `BEARER_TOKEN expired ${Math.abs(expiresInSeconds)}s ago`
        : `BEARER_TOKEN expires in ${expiresInSeconds}s (under ${EXPIRY_BUFFER_SECONDS}s safety buffer)`;
      return { valid: false, reason, expiresInSeconds };
    }

    return { valid: true, expiresInSeconds };

  } catch (err) {
    return { valid: false, reason: `BEARER_TOKEN check threw an error: ${(err as Error).message}` };
  }
}

/**
 * Ensures the Okta browser session (storageSession.json) is valid.
 * Use this before UI / BDD tests — it does NOT check BEARER_TOKEN.
 *
 * In CI with a valid BEARER_TOKEN: generates storageSession.json automatically.
 * Locally when session is missing/expired: runs "npm run auth".
 */
export function ensureUiSession(): void {
  const t0      = Date.now();
  const session = checkSession();
  const ms      = Date.now() - t0;

  if (session.valid) {
    const mins = Math.floor(session.expiresInSeconds! / 60);
    console.log(`✓ UI session valid — expires in ~${mins}m  [check: ${ms}ms]`);
    return;
  }

  // In CI the session is pre-generated by the auth job and passed as an artifact.
  // If it's missing or invalid here, the workflow setup is broken.
  if (IS_CI) {
    throw new Error(
      `CI session invalid: ${session.reason}\n` +
      'The auth job should have generated storageSession.json before this job runs.'
    );
  }

  console.warn(`\n⚠  Browser session invalid: ${session.reason}`);
  console.log('⟳  Running "npm run auth" to refresh UI session automatically...\n');
  execSync('npm run auth', { stdio: 'inherit', cwd: path.resolve('.') });
  console.log('\n✓  UI session refreshed. Continuing test run.\n');
}

/**
 * CI-only mid-run self-heal for the UI session.
 *
 * Called from the per-scenario Before hook. On a healthy session it is a near
 * no-op (one offline JWT decode, ~5 ms). When the Okta token has dropped under
 * the safety buffer it regenerates storageSession.json AND the BEARER_TOKEN in
 * .env via "npm run ci:auth" — so every subsequent scenario (which builds its
 * context from storageSession.json) picks up the fresh session automatically.
 *
 * Scoped to CI on purpose: locally this is a no-op so the developer flow is
 * unchanged — BeforeAll's ensureUiSession() already handles local refresh.
 */
/** Synchronous sleep without busy-spin — keeps ensureFreshUiSession() sync. */
function sleepSync(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** True if a process with the given PID is currently alive on this machine. */
function isPidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0); // signal 0 = liveness probe; does not actually signal
    return true;
  } catch (err) {
    // ESRCH = no such process (dead); EPERM = exists but not ours (alive)
    return (err as NodeJS.ErrnoException).code === 'EPERM';
  }
}

/**
 * Removes the re-auth lock if it is abandoned — older than REAUTH_LOCK_STALE_MS
 * OR owned by a process that is no longer running. Prevents a crashed lock
 * holder from blocking every other process forever (no deadlock).
 */
function stealStaleReauthLock(): void {
  try {
    const [pidStr, tsStr] = fs.readFileSync(REAUTH_LOCK_PATH, 'utf-8').split(':');
    const pid = Number(pidStr);
    const ts  = Number(tsStr);
    const abandoned =
      !Number.isFinite(ts) ||
      Date.now() - ts > REAUTH_LOCK_STALE_MS ||
      (Number.isFinite(pid) && !isPidAlive(pid));
    if (abandoned) {
      fs.rmSync(REAUTH_LOCK_PATH, { force: true });
    }
  } catch {
    // Lock vanished while inspecting it — nothing to steal.
  }
}

export function ensureFreshUiSession(): void {
  if (!IS_CI) return;

  const session = checkSession();
  // Only log as the token approaches expiry (under 10 min) so we don't print a
  // line on every scenario. A re-auth, when triggered, is always logged below.
  const left = session.expiresInSeconds;
  const NOTICE_SECONDS = 600;
  if (typeof left === 'number' && left <= NOTICE_SECONDS) {
    console.log(`↻ [session-guard] UI session expires in ${Math.floor(left / 60)}m ${left % 60}s`);
  }
  if (session.valid) return;

  console.warn(`\n⚠  CI session near/at expiry: ${session.reason}`);

  // Single-flight re-auth. With multiple role suites running on the same runner
  // (Option A), only ONE process regenerates the session at a time; the others
  // wait and then reuse it. A single-process run acquires the lock uncontended,
  // so behaviour there is unchanged. The loop always terminates: either the
  // session becomes valid (a peer refreshed it) or we acquire the lock (after
  // reclaiming a stale one) and refresh it ourselves.
  const startedWaiting = Date.now();
  for (;;) {
    let fd: number;
    try {
      // Atomic acquire: 'wx' fails with EEXIST if the lock already exists.
      fd = fs.openSync(REAUTH_LOCK_PATH, 'wx');
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'EEXIST') throw err;

      // Lock held by another process. If it already refreshed the session, reuse it.
      if (checkSession().valid) {
        console.log('✓  CI session refreshed by another process. Continuing.\n');
        return;
      }
      // Reclaim an abandoned lock (dead owner / too old) so we can never deadlock.
      stealStaleReauthLock();
      if (Date.now() - startedWaiting > REAUTH_WAIT_MAX_MS) {
        console.warn('⚠  Waited too long for a peer re-auth; will attempt to acquire the lock.');
      }
      sleepSync(REAUTH_POLL_MS);
      continue;
    }

    // We hold the lock.
    try {
      fs.writeSync(fd, `${process.pid}:${Date.now()}`);
      fs.closeSync(fd);

      // Double-checked: a peer may have refreshed between our initial check and here.
      if (checkSession().valid) {
        console.log('✓  CI session already refreshed. Continuing.\n');
        return;
      }

      console.log('⟳  Regenerating session mid-run via "npm run ci:auth"...\n');
      execSync('npm run ci:auth', { stdio: 'inherit', cwd: path.resolve('.') });
      console.log('\n✓  CI session regenerated mid-run. Continuing test run.\n');
      return;
    } finally {
      fs.rmSync(REAUTH_LOCK_PATH, { force: true });
    }
  }
}

/**
 * Ensures BEARER_TOKEN is present and (when it is a JWT) not expired.
 * Use this before API tests — it does NOT touch storageSession.json.
 *
 * Throws immediately if the token is missing or expired so the failure
 * is surfaced at the top of the run rather than inside a test step.
 */
export function ensureApiToken(): void {
  const t0     = Date.now();
  const bearer = checkBearerToken();
  const ms     = Date.now() - t0;

  if (bearer.valid) {
    console.log(`✓ API token valid  [check: ${ms}ms]`);
    return;
  }

  throw new Error(
    `API token invalid: ${bearer.reason}\n` +
    'Set BEARER_TOKEN in .env (local) or BEARER_TOKEN_CI in GitHub Secrets (CI).'
  );
}

/**
 * @deprecated Use ensureUiSession() for UI/BDD tests or ensureApiToken() for API tests.
 * Kept for backward compatibility — checks both and refreshes via "npm run auth".
 */
export function ensureSession(): void {
  ensureUiSession();
}
