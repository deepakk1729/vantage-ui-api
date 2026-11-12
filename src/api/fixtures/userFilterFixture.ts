// Builder-with-overrides for the user filter (saved "Name" filter collection) POST payload.
// Field shapes captured from a real staging network call (Home page > Name filter > Save as >
// Save & Apply) — not fabricated, so any field not listed here was never observed on the wire
// and should be added only once seen.

export interface UserFilterSelectedUser {
  employeeName: string;
  employeeIdHRO: string;
}

export interface CreateUserFilterRequest {
  name: string;
  userSelectedFilterDTO: {
    selectedUserDetails: UserFilterSelectedUser[];
  };
}

const DEFAULT_CREATE_USER_FILTER_REQUEST: CreateUserFilterRequest = {
  name: 'API Test Filter Temp',
  userSelectedFilterDTO: {
    selectedUserDetails: [{ employeeName: 'Zhou, Ellie', employeeIdHRO: '386696' }],
  },
};

export function buildCreateUserFilterRequest(
  overrides: Partial<CreateUserFilterRequest> = {}
): CreateUserFilterRequest {
  return {
    ...DEFAULT_CREATE_USER_FILTER_REQUEST,
    ...overrides,
    userSelectedFilterDTO: {
      ...DEFAULT_CREATE_USER_FILTER_REQUEST.userSelectedFilterDTO,
      ...(overrides.userSelectedFilterDTO ?? {}),
    },
  };
}
