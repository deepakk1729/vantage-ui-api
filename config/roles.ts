/**
 * Role registry — the team member each role impersonates.
 *
 * Every role uses the SAME superadmin Okta session (storageSession.json); the role
 * context is applied at runtime by UI impersonation via the "User Validation"
 * control (support/impersonation.ts). `impersonate: null` = base superadmin.
 *
 * This is a PURE impersonation registry: role name → who to become. Roles are kept
 * separate by their own feature/step/page folders (one folder per role), so there is
 * NO capability-tag gating here — a role simply doesn't own the scenarios it can't run.
 */
export interface RoleConfig {
  /** Team member to impersonate, or null to stay as the base superadmin account. */
  impersonate: string | null;
}

export const roles: Record<string, RoleConfig> = {
  superadmin:       { impersonate: null },
  'business-leader': { impersonate: 'Rejdak, Hauke' },
  'topic-manager':  { impersonate: 'Kumar, Sujit' },
  'team-manager':   { impersonate: 'Kwok, Clement' },
  analyst:          { impersonate: 'Abraham, Ruth' },
};

/** Resolve a role config, defaulting to superadmin for unknown/empty input. */
export function resolveRole(role?: string): RoleConfig {
  return roles[role ?? 'superadmin'] ?? roles.superadmin;
}
