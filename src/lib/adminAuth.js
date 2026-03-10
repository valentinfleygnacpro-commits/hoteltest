const ROLE_LEVEL = {
  readonly: 1,
  operator: 2,
  admin: 3,
};

function getConfiguredTokens() {
  return {
    admin: process.env.ADMIN_DASHBOARD_TOKEN || "",
    operator: process.env.ADMIN_OPERATOR_TOKEN || "",
    readonly: process.env.ADMIN_READONLY_TOKEN || "",
  };
}

function hasAnyTokenConfigured(tokens) {
  return Boolean(tokens.admin || tokens.operator || tokens.readonly);
}

function resolveAdminRole(token) {
  const normalized = String(token || "").trim();
  const tokens = getConfiguredTokens();

  if (!hasAnyTokenConfigured(tokens)) {
    return "admin";
  }
  if (tokens.admin && normalized === tokens.admin) return "admin";
  if (tokens.operator && normalized === tokens.operator) return "operator";
  if (tokens.readonly && normalized === tokens.readonly) return "readonly";
  return null;
}

function hasRoleAtLeast(role, minRole) {
  const roleLevel = ROLE_LEVEL[role] || 0;
  const minLevel = ROLE_LEVEL[minRole] || 0;
  return roleLevel >= minLevel;
}

module.exports = {
  resolveAdminRole,
  hasRoleAtLeast,
};

