import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../support/world';
import { ensureApiClient } from '../../support/apiClient';
import { UserAccessService } from '../../src/api/services/userAccessService';
import { createLogger } from '../../src/utils/logger';
import { validateAgainstSchema } from '../../src/api/utils/schemaValidator';
import * as fs from 'fs';
import * as path from 'path';

const log = createLogger('api:user-access-details');

When('I send a GET request to the user access details endpoint', async function (this: PlaywrightWorld) {
  const client = await ensureApiClient(this);
  const service = new UserAccessService(client);
  log.info('GET user access details');
  const { response, durationMs } = await service.getAccessDetails();
  this.apiResponse = response;
  this.apiResponseTimeMs = durationMs;
  log.info(`Response ${response.status()} in ${durationMs} ms`);
});

// ── Shared Then steps ────────────────────────────────────────────────────────
// These are defined here and reused globally by all API feature files.

Then('the response status code should be {int}', async function (this: PlaywrightWorld, expectedStatus: number) {
  expect(this.apiResponse, 'No API response found — did you send the request?').toBeDefined();
  const actual = this.apiResponse!.status();
  log.info(`Status check: expected=${expectedStatus} actual=${actual}`);
  expect(actual).toBe(expectedStatus);
});

Then('the response content type should be {string}', async function (this: PlaywrightWorld, expectedContentType: string) {
  expect(this.apiResponse, 'No API response found — did you send the request?').toBeDefined();
  const actual = this.apiResponse!.headers()['content-type'] ?? '';
  log.info(`Content-Type check: expected contains="${expectedContentType}" actual="${actual}"`);
  expect(actual).toContain(expectedContentType);
});

Then('the response body should be valid JSON', async function (this: PlaywrightWorld) {
  expect(this.apiResponse, 'No API response found — did you send the request?').toBeDefined();
  const text = await this.apiResponse!.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Response body is not valid JSON. Body: ${text.slice(0, 200)}`);
  }
  this.apiResponseBody = parsed;
  log.info('Response body is valid JSON');
});

Then('the response body should match the {string} schema', async function (this: PlaywrightWorld, schemaName: string) {
  expect(this.apiResponseBody, 'Response body not parsed — run "the response body should be valid JSON" first').toBeDefined();
  const schemaPath = path.resolve(__dirname, `../../src/api/schemas/${schemaName}.schema.json`);
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
  const result = validateAgainstSchema(this.apiResponseBody, schema);
  if (!result.valid) {
    throw new Error(`Schema validation failed for "${schemaName}":\n${result.errors.join('\n')}`);
  }
  log.info(`Schema "${schemaName}" validation passed`);
});

Then('the response time should be under {int} ms', async function (this: PlaywrightWorld, maxMs: number) {
  expect(this.apiResponseTimeMs, 'Response time not recorded — did you send the request?').toBeDefined();
  log.info(`Response time check: actual=${this.apiResponseTimeMs} ms limit=${maxMs} ms`);
  expect(this.apiResponseTimeMs!).toBeLessThan(maxMs);
});
