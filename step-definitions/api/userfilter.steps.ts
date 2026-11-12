import { When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../support/world';
import { ensureApiClient } from '../../support/apiClient';
import { UserFilterService, UserFilterListResponse } from '../../src/api/services/userFilterService';
import { buildCreateUserFilterRequest } from '../../src/api/fixtures/userFilterFixture';
import { createLogger } from '../../src/utils/logger';

const log = createLogger('api:userfilter');

// Looks up the id of a filter collection by name via the GET list endpoint. Used to discover
// the id assigned to a just-created record before exercising the DELETE endpoint — the POST
// create response itself is just a bare confirmation string and never echoes the new id.
async function findUserFilterIdByName(service: UserFilterService, name: string): Promise<number> {
  const { response } = await service.listUserFilters();
  const body = (await response.json()) as UserFilterListResponse;
  const match = body.userFilterCollectionDTO.find((entry) => entry.name === name);
  expect(match, `Could not find user filter collection "${name}" in the list response`).toBeDefined();
  return match!.id;
}

When('I send a POST request to create a user filter collection', async function (this: PlaywrightWorld) {
  const client = await ensureApiClient(this);
  const service = new UserFilterService(client);
  const filterName = `API Automation Filter ${Date.now()}`;
  const payload = buildCreateUserFilterRequest({ name: filterName });
  log.info(`POST create user filter collection "${filterName}"`);
  const { response, durationMs } = await service.createUserFilter(payload);
  this.apiResponse = response;
  this.apiResponseTimeMs = durationMs;
  this.createdUserFilterName = filterName;
  log.info(`Response ${response.status()} in ${durationMs} ms`);
});

When('I delete the user filter collection created in this scenario', async function (this: PlaywrightWorld) {
  const client = await ensureApiClient(this);
  const service = new UserFilterService(client);
  const filterName = this.createdUserFilterName;
  expect(filterName, 'No user filter collection was created in this scenario to clean up').toBeDefined();

  const id = await findUserFilterIdByName(service, filterName!);
  log.info(`Cleaning up user filter collection id=${id}`);
  const { response } = await service.deleteUserFilter(id);
  expect(response.status(), `Cleanup DELETE for user filter collection id=${id} failed`).toBe(200);
});

When('I create a disposable user filter collection and then delete it', async function (this: PlaywrightWorld) {
  const client = await ensureApiClient(this);
  const service = new UserFilterService(client);
  const filterName = `API Automation Filter ${Date.now()}`;
  const payload = buildCreateUserFilterRequest({ name: filterName });

  log.info(`POST create disposable user filter collection "${filterName}"`);
  const { response: createResponse } = await service.createUserFilter(payload);
  expect(createResponse.status(), 'Setup failed: could not create disposable user filter collection').toBe(201);

  const id = await findUserFilterIdByName(service, filterName);

  log.info(`DELETE user filter collection id=${id}`);
  const { response, durationMs } = await service.deleteUserFilter(id);
  this.apiResponse = response;
  this.apiResponseTimeMs = durationMs;
  log.info(`Response ${response.status()} in ${durationMs} ms`);
});
