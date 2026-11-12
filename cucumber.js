// ── Per-role report naming ────────────────────────────────────────────────────
// When a role profile is active (e.g. `cucumber-js -p superadmin`) the JSON
// and HTML reports are written to reports/<role>_cucumber.{json,html} so that
// concurrent role runs on the same runner never overwrite each other and each can
// be uploaded as its own `<role>_cucumber` CI artifact. A normal run (no role
// profile) keeps the original reports/cucumber-report.* names — existing scripts
// (report:bdd) and workflows are unaffected. `REPORT_NAME` overrides explicitly.
const ROLE_PROFILES = ['superadmin', 'business-leader', 'topic-manager', 'team-manager', 'analyst'];

function activeRoleProfile() {
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if ((a === '-p' || a === '--profile') && ROLE_PROFILES.includes(argv[i + 1])) return argv[i + 1];
    const m = a.match(/^(?:-p|--profile)=(.+)$/);
    if (m && ROLE_PROFILES.includes(m[1])) return m[1];
  }
  return null;
}

const reportName =
  process.env.REPORT_NAME ||
  (activeRoleProfile() ? `${activeRoleProfile()}_cucumber` : 'cucumber-report');

const common = {
  // NOTE: does NOT glob step-definitions/** — with one folder per role, identical
  // step phrasings live in every role folder, so a global glob makes every step
  // "ambiguous". The default/all profiles therefore load only the BASE role
  // (superadmin) + shared api steps. Each ROLE suite must be run via its own
  // profile (e.g. `-p business-leader`), which requires only that role's steps.
  require: [
    'support/**/*.ts',
    'step-definitions/superadmin/**/*.ts',
    'step-definitions/api/**/*.ts'
  ],
  requireModule: ['ts-node/register'],
  format: [
    'progress',
    `json:reports/${reportName}.json`,
    `html:reports/${reportName}.html`
  ],
  // paths is intentionally omitted here so the CLI argument controls
  // which feature files are run (e.g. cucumber-js features/people)
  publishQuiet: true
};

module.exports = {
  // Default profile excludes anything tagged @skip (e.g. work-in-progress or
  // intentionally parked features). Composes with CLI --tags via AND, so the
  // existing @date-range / @months-filter scripts still work unchanged.
  default: {
    ...common,
    tags: 'not @skip'
  },
  // Use `-p all` to include @skip-tagged features (e.g. to run a parked feature
  // explicitly): npx cucumber-js -p all features/api/user-access-details.feature
  all: {
    ...common
  },

  // ── Regression profile ──────────────────────────────────────────────────────
  // Role-based regression is being restructured; only the base superadmin suite
  // is wired up. The active role is passed to the World via `worldParameters.role`
  // and consumed in support/hooks.ts. @api scenarios are excluded here because the
  // (superadmin) API client uses the base bearer token via the @api Before hook.
  // Per-role isolation: each role profile requires ONLY the shared support glue
  // plus its OWN step-definitions folder, so identically-phrased steps in
  // different roles never collide ("ambiguous step"). Run its own feature folder:
  //   npx cucumber-js -p superadmin features/superadmin
  superadmin: {
    ...common,
    require: [
      'support/**/*.ts',
      'step-definitions/superadmin/**/*.ts'
    ],
    tags: 'not @skip and not @api',
    worldParameters: { role: 'superadmin' }
  },

  // Business Leader — impersonates "Rejdak, Hauke" (config/roles.ts) via the Before
  // hook. Requires ONLY its own step-definitions folder (per-role isolation). Run:
  //   npx cucumber-js -p business-leader features/business-leader
  'business-leader': {
    ...common,
    require: [
      'support/**/*.ts',
      'step-definitions/business-leader/**/*.ts'
    ],
    tags: 'not @skip and not @api',
    worldParameters: { role: 'business-leader' }
  },

  //   npx cucumber-js -p topic-manager features/topic-manager
  'topic-manager': {
    ...common,
    require: [
      'support/**/*.ts',
      'step-definitions/topic-manager/**/*.ts'
    ],
    tags: 'not @skip and not @api',
    worldParameters: { role: 'topic-manager' }
  },

  //   npx cucumber-js -p team-manager features/team-manager
  'team-manager': {
    ...common,
    require: [
      'support/**/*.ts',
      'step-definitions/team-manager/**/*.ts'
    ],
    tags: 'not @skip and not @api',
    worldParameters: { role: 'team-manager' }
  },

  //   npx cucumber-js -p analyst features/analyst
  analyst: {
    ...common,
    require: [
      'support/**/*.ts',
      'step-definitions/analyst/**/*.ts'
    ],
    tags: 'not @skip and not @api',
    worldParameters: { role: 'analyst' }
  }
};