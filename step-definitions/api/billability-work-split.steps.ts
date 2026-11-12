import { When } from '@cucumber/cucumber';
import { PlaywrightWorld } from '../../support/world';
import { ensureApiClient } from '../../support/apiClient';
import { BillabilityService } from '../../src/api/services/billabilityService';
import { buildWorkSplitBusinessRequest, buildWorkSplitEmployeeRequest } from '../../src/api/fixtures/billabilityFixture';
import { createLogger } from '../../src/utils/logger';

const log = createLogger('api:billability-work-split');

When('I send a POST request to the billability work-split business endpoint', async function (this: PlaywrightWorld) {
  const client = await ensureApiClient(this);
  const service = new BillabilityService(client);
  const payload = buildWorkSplitBusinessRequest();
  log.info('POST billability work-split business');
  const { response, durationMs } = await service.postWorkSplitBusiness(payload);
  this.apiResponse = response;
  this.apiResponseTimeMs = durationMs;
  log.info(`Response ${response.status()} in ${durationMs} ms`);
});

When('I send a POST request to the billability work-split employee endpoint', async function (this: PlaywrightWorld) {
  const client = await ensureApiClient(this);
  const service = new BillabilityService(client);
  const payload = buildWorkSplitEmployeeRequest();
  log.info('POST billability work-split employee');
  const { response, durationMs } = await service.postWorkSplitEmployee(payload);
  this.apiResponse = response;
  this.apiResponseTimeMs = durationMs;
  log.info(`Response ${response.status()} in ${durationMs} ms`);
});

When(
  'I send a POST request to the billability work-split employee endpoint for page {int}',
  async function (this: PlaywrightWorld, page: number) {
    const client = await ensureApiClient(this);
    const service = new BillabilityService(client);
    const payload = buildWorkSplitEmployeeRequest({ page });
    log.info(`POST billability work-split employee (page ${page})`);
    const { response, durationMs } = await service.postWorkSplitEmployee(payload);
    this.apiResponse = response;
    this.apiResponseTimeMs = durationMs;
    log.info(`Response ${response.status()} in ${durationMs} ms`);
  }
);
