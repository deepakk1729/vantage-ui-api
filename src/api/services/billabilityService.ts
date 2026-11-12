import { ApiClient } from '../clients/ApiClient';
import { ENDPOINTS } from '../endpoints';
import { BillabilityFilterRequest, WorkSplitEmployeeRequest } from '../fixtures/billabilityFixture';
import { TimedResponse, withTiming } from '../utils/responseTimer';

// Wraps the billability work-split endpoints — steps call this, never ApiClient directly.
export class BillabilityService {
  constructor(private readonly client: ApiClient) {}

  async postWorkSplitBusiness(payload: BillabilityFilterRequest): Promise<TimedResponse> {
    return withTiming(() => this.client.post(ENDPOINTS.billabilityWorkSplitBusiness, payload));
  }

  async postWorkSplitEmployee(payload: WorkSplitEmployeeRequest): Promise<TimedResponse> {
    return withTiming(() => this.client.post(ENDPOINTS.billabilityWorkSplitEmployee, payload));
  }
}
