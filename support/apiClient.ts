import { PlaywrightWorld } from './world';
import { ApiClient } from '../src/api/clients/ApiClient';
import { createLogger } from '../src/utils/logger';

const log = createLogger('api:client');

// Shared across all @api step-definition files so each scenario reuses one
// initialized ApiClient per world instead of re-authenticating per call.
export async function ensureApiClient(world: PlaywrightWorld): Promise<ApiClient> {
  if (!world.apiClient) {
    log.debug('Initializing ApiClient', { baseURL: world.env.API_BASE_URL });
    world.apiClient = new ApiClient(world.env.API_BASE_URL);
    await world.apiClient.init();
  }
  return world.apiClient;
}
