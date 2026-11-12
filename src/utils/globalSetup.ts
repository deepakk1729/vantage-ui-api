/**
 * globalSetup.ts
 *
 * Playwright global setup — runs once before any spec test executes.
 * Delegates to sessionGuard which checks JWT expiry (< 5 ms, no network)
 * and automatically re-runs "npm run auth" when the session is stale.
 */

import { ensureUiSession } from './sessionGuard';

export default async function globalSetup(): Promise<void> {
  ensureUiSession();
}
