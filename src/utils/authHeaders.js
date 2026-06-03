import { AUTH_STORAGE_KEY, AUTH_TOKEN_STORAGE_KEYS } from "../auth.js";

export function getStoredAccessToken() {
  try {
    const user = JSON.parse(window.localStorage.getItem(AUTH_STORAGE_KEY) || "null");
    if (user?.access_token) return user.access_token;
  } catch {
    // Fall back to the token keys already used by the current auth flow.
  }

  for (const key of AUTH_TOKEN_STORAGE_KEYS) {
    const token = window.localStorage.getItem(key);
    if (token) return token;
  }

  return "";
}

export function authHeaders(headers = {}) {
  const token = getStoredAccessToken();
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
}
