// Central path registry — add one entry per backend endpoint as services grow.
export const ENDPOINTS = {
  userAccessDetails: '/ktd-user/kd-user-service/api/user/access/details',
  billabilityWorkSplitBusiness: '/ktd-billing/billing/api/billability/work-split/business',
  billabilityWorkSplitEmployee: '/ktd-billing/billing/api/billability/work-split/employee',
  // NOTE: the API genuinely serves POST/DELETE on a double-slash path ("api//userfilter/") while
  // GET (list) uses a single slash ("api/userfilter/") — confirmed via live network capture on the
  // "Name" filter's Save/Delete UI (Home page). Not a typo — do not "fix" the double slash.
  userFilterCreate: '/ktd-user/kd-user-service/api//userfilter/',
  userFilterDelete: '/ktd-user/kd-user-service/api//userfilter/',
  userFilterList: '/ktd-user/kd-user-service/api/userfilter/',
} as const;
