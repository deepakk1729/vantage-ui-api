import { APIResponse } from '@playwright/test';

export interface TimedResponse {
  response: APIResponse;
  durationMs: number;
}

// Wraps a service call so every service method reports its own timing,
// rather than each step definition re-measuring Date.now() by hand.
export async function withTiming(call: () => Promise<APIResponse>): Promise<TimedResponse> {
  const start = Date.now();
  const response = await call();
  return { response, durationMs: Date.now() - start };
}
