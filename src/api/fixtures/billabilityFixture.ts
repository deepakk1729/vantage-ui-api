// Builder-with-overrides for the billability work-split POST payloads.
// Field shapes captured from real staging network calls (Business Comparison >
// Billability, and People > Billability) — not fabricated, so any field not
// listed here was never observed on the wire and should be added only once seen.

export interface BillabilityFilterRequest {
  isBusinessComparisonPage: boolean;
  startDate: string;
  endDate: string;
  dateFilterType: string;
  practiceArea: string[];
  homeOffice: string[];
  path: string[];
  userStatus: string[];
  jobTitle: string[];
  managementModel: string[];
  geoRegion: string[];
  weekPostedDates: string[];
  allWeekPostedDates: string[];
  employeeIdHRO: string;
  selectedUserId: string[];
}

export interface WorkSplitEmployeeRequest extends BillabilityFilterRequest {
  page: number;
  pageSize: number;
}

const DEFAULT_BUSINESS_REQUEST: BillabilityFilterRequest = {
  isBusinessComparisonPage: false,
  startDate: '2026-01-01T00:00:00.000Z',
  endDate: '2026-08-29',
  dateFilterType: 'MONTHLY',
  practiceArea: [],
  homeOffice: [],
  path: [],
  userStatus: [],
  jobTitle: [],
  managementModel: [],
  geoRegion: [],
  weekPostedDates: [],
  allWeekPostedDates: [],
  employeeIdHRO: '99999999',
  selectedUserId: [],
};

const DEFAULT_EMPLOYEE_REQUEST: WorkSplitEmployeeRequest = {
  ...DEFAULT_BUSINESS_REQUEST,
  page: 1,
  pageSize: 20,
};

export function buildWorkSplitBusinessRequest(
  overrides: Partial<BillabilityFilterRequest> = {}
): BillabilityFilterRequest {
  return { ...DEFAULT_BUSINESS_REQUEST, ...overrides };
}

export function buildWorkSplitEmployeeRequest(
  overrides: Partial<WorkSplitEmployeeRequest> = {}
): WorkSplitEmployeeRequest {
  return { ...DEFAULT_EMPLOYEE_REQUEST, ...overrides };
}
