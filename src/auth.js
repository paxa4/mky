export const AUTH_STORAGE_KEY = "mky_current_user";
export const AUTH_TOKEN_STORAGE_KEYS = ["access_token", "mky_access_token"];

export const ROLE_LABELS = {
  user: "Пользователь",
  methodist: "Методист",
  operator: "Психолог",
  domu_editor: "Редактор Дома учителя",
  admin: "Администратор",
};

function withoutSensitiveFields(user) {
  if (!user) return null;
  const safeUser = { ...user };
  delete safeUser.password;
  delete safeUser.password_hash;
  return safeUser;
}

function getRoleName(user) {
  if (typeof user?.role === "object") {
    return user.role?.role_name || user.role?.name || user.role?.code;
  }
  return user?.role;
}

export function getRoleLabel(role) {
  return ROLE_LABELS[role] || role || "Пользователь";
}

export function canAccessAdmin(user) {
  const role = getRoleName(user);
  return role === "methodist" || role === "admin";
}

export function canAccessTpmpkAdmin(user) {
  const role = getRoleName(user);
  return role === "operator" || role === "admin";
}

export function canAccessDomuAdmin(user) {
  const role = getRoleName(user);
  return role === "domu_editor" || role === "methodist" || role === "admin";
}

export function getStoredUser() {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeUser(user) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(withoutSensitiveFields(user)));
  if (user?.access_token) {
    AUTH_TOKEN_STORAGE_KEYS.forEach((key) => window.localStorage.setItem(key, user.access_token));
  }
}

export function clearStoredUser() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  AUTH_TOKEN_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
}
