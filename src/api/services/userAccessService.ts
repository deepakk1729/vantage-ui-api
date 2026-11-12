import { ApiClient } from '../clients/ApiClient';
import { ENDPOINTS } from '../endpoints';
import { TimedResponse, withTiming } from '../utils/responseTimer';

// Wraps the user-access-details endpoint — steps call this, never ApiClient directly.
export class UserAccessService {
  constructor(private readonly client: ApiClient) {}

  async getAccessDetails(): Promise<TimedResponse> {
    return withTiming(() => this.client.get(ENDPOINTS.userAccessDetails));
  }
}
