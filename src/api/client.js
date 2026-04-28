/**
 * API-клиент для бэкенда ИМЦРО
 * BASE_URL: http://localhost:8000
 */

const BASE_URL = "http://localhost:8000";

// ─── Токен ────────────────────────────────────────────────────────────────────
let _token = null;
export const setToken   = t  => { _token = t; };
export const clearToken = () => { _token = null; };
export const getToken   = () => _token;

// ─── Инициализация из localStorage ───────────────────────────────────────────
// Ключ "access_token" — тот же, что использует AuthPage при логине.
const saved = typeof localStorage !== "undefined" && localStorage.getItem("access_token");
if (saved) _token = saved;

// ─── Базовый fetch ────────────────────────────────────────────────────────────
async function req(method, path, body = null, isForm = false) {
  const headers = {};
  if (_token) headers["Authorization"] = `Bearer ${_token}`;
  if (body && !isForm) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: isForm ? body : (body ? JSON.stringify(body) : null),
  });

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);
  return data;
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export async function authLogin({ email, password }) {
  const body = new URLSearchParams({ username: email, password });
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);
  return data; // { access_token, token_type }
}

export async function authRegister({ email, password }) {
  return req("POST", "/auth/register", { email, password });
}

export async function authMe() {
  return req("GET", "/auth/me");
}

// ─── ARTICLES ─────────────────────────────────────────────────────────────────
// blocks конвертируются в content на бэкенде (blocks_to_content в routers/articles.py)
export async function getArticles(status = null) {
  return req("GET", `/articles/${status ? `?status=${status}` : ""}`);
}
export async function getArticle(id) {
  return req("GET", `/articles/${id}`);
}
export async function createArticle(data) {
  return req("POST", "/articles/", data);
}
export async function updateArticle(id, data) {
  return req("PUT", `/articles/${id}`, data);
}
export async function changeArticleStatus(id, status) {
  return req("PATCH", `/articles/${id}/status`, { status });
}
export async function deleteArticle(id) {
  return req("DELETE", `/articles/${id}`);
}

// ─── CATEGORIES ───────────────────────────────────────────────────────────────
export async function getCategories()        { return req("GET",    "/articles/meta/categories"); }
export async function createCategory(data)   { return req("POST",   "/articles/meta/categories", data); }
export async function updateCategory(id, d)  { return req("PUT",    `/articles/meta/categories/${id}`, d); }
export async function deleteCategory(id)     { return req("DELETE", `/articles/meta/categories/${id}`); }

// ─── TAGS ─────────────────────────────────────────────────────────────────────
export async function getTags()        { return req("GET",    "/articles/meta/tags"); }
export async function createTag(data)  { return req("POST",   "/articles/meta/tags", data); }
export async function updateTag(id, d) { return req("PUT",    `/articles/meta/tags/${id}`, d); }
export async function deleteTag(id)    { return req("DELETE", `/articles/meta/tags/${id}`); }

// ─── CERTIFICATES ─────────────────────────────────────────────────────────────
export async function getCertificateTemplates() {
  return req("GET", "/certificates/templates");
}
export async function generateCertificate(body) {
  return req("POST", "/certificates/generate", body);
}
export async function uploadCertificateBackground(file) {
  const fd = new FormData(); fd.append("file", file);
  return req("POST", "/certificates/upload-background", fd, true);
}
export async function saveTemplate(body) {
  return req("POST", "/certificates/templates", body);
}
export async function saveTemplateElement(templateId, el) {
  return req("POST", `/certificates/templates/${templateId}/elements`, el);
}
