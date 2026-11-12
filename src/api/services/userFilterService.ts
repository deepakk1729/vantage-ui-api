import { ApiClient } from '../clients/ApiClient';
import { ENDPOINTS } from '../endpoints';
import { CreateUserFilterRequest } from '../fixtures/userFilterFixture';
import { TimedResponse, withTiming } from '../utils/responseTimer';

// Shape of the GET userfilter list response — used internally (not schema-validated via a
// feature scenario) purely to look up the id of a just-created filter collection before
// exercising the DELETE endpoint. Captured from a real staging response.
export interface UserFilterListResponse {
  employeeIdHRO: number;
  userFilterCollectionDTO: Array<{
    id: number;
    name: string;
    userSelectedFilterDTO: {
      selectedUserDetails: Array<{ employeeIdHRO: string; employeeName: string }>;
    };
  }>;
}

// Wraps the userfilter (saved "Name" filter collection) endpoints — steps call this, never
// ApiClient directly.
export class UserFilterService {
  constructor(private readonly client: ApiClient) {}

  async createUserFilter(payload: CreateUserFilterRequest): Promise<TimedResponse> {
    return withTiming(() => this.client.post(ENDPOINTS.userFilterCreate, payload));
  }

  async listUserFilters(): Promise<TimedResponse> {
    return withTiming(() => this.client.get(ENDPOINTS.userFilterList));
  }

  async deleteUserFilter(id: number): Promise<TimedResponse> {
    return withTiming(() => this.client.delete(`${ENDPOINTS.userFilterDelete}${id}`));
  }
}
