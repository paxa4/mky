import { API_BASE } from "./constants/index.js";
import { AUTH_STORAGE_KEY, AUTH_TOKEN_STORAGE_KEYS } from "./auth.js";

const TOKEN_STORAGE_KEY = "access_token";
const MKY_TOKEN_STORAGE_KEY = "mky_access_token";
export const AUTH_SESSION_EXPIRED_EVENT = "mky:auth-session-expired";

function getToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(MKY_TOKEN_STORAGE_KEY);
}

export function getAuthHeaders(headers = {}) {
  const token = getToken();
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
}

function saveToken(token) {
  if (!token) return;
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  localStorage.setItem(MKY_TOKEN_STORAGE_KEY, token);
}

function removeToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(MKY_TOKEN_STORAGE_KEY);
}

function clearStoredAuthSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  AUTH_TOKEN_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
}

function notifyAuthSessionExpired() {
  clearStoredAuthSession();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED_EVENT));
  }
}

async function readJson(response) {
  return response.json().catch(() => null);
}

function formatApiDetail(detail) {
  if (!detail) return "";
  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const path = Array.isArray(item.loc) ? item.loc.join(".") : "";
          const message = item.msg || item.message || JSON.stringify(item);
          return path ? `${path}: ${message}` : message;
        }
        return String(item);
      })
      .join("; ");
  }

  if (typeof detail === "object") {
    return detail.msg || detail.message || JSON.stringify(detail);
  }

  return String(detail);
}

function getErrorMessage(data, fallback) {
  return formatApiDetail(data?.detail) || formatApiDetail(data) || fallback;
}

function normalizeRegisterPayload(input, password) {
  if (input && typeof input === "object") return input;
  return { email: input, password };
}

async function postRegister(payload) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { res, data: await readJson(res) };
}

export async function apiRegister(input, password) {
  const rawPayload = normalizeRegisterPayload(input, password);
  const fullName = String(rawPayload.full_name || rawPayload.fullName || rawPayload.name || "").trim();
  const basePayload = {
    email: String(rawPayload.email || "").trim(),
    password: rawPayload.password || "",
  };
  const payload = fullName ? { ...basePayload, full_name: fullName } : basePayload;

  let { res, data } = await postRegister(payload);

  if (!res.ok && res.status === 422 && fullName) {
    ({ res, data } = await postRegister(basePayload));
  }

  if (!res.ok) throw new Error(getErrorMessage(data, "Ошибка регистрации"));
  return data;
}

export async function apiLogin(email, password) {
  const body = new URLSearchParams({ username: email, password });
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await readJson(res);
  if (!res.ok) throw new Error(getErrorMessage(data, "Неверный email или пароль"));
  if (!data?.access_token) throw new Error("Сервер не вернул токен авторизации");
  saveToken(data.access_token);
  return data;
}

export async function apiLoginWithProfile(email, password) {
  const token = await apiLogin(email, password);
  let profile;
  try {
    profile = await apiMe(token.access_token);
  } catch (e) {
    removeToken();
    throw e;
  }
  return {
    ...profile,
    access_token: token.access_token,
    token_type: token.token_type,
  };
}

export function apiLogout() {
  removeToken();
}

export async function apiMe(token = getToken()) {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const data = await readJson(res);
    if (res.status === 401) notifyAuthSessionExpired();
    const error = new Error(getErrorMessage(data, "Не авторизован"));
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export async function authFetch(input, options = {}) {
  const response = await fetch(input, {
    ...options,
    headers: getAuthHeaders(options.headers || {}),
  });
  if (response.status === 401) notifyAuthSessionExpired();
  return response;
}

export function isLoggedIn() {
  return Boolean(getToken());
}

function normalizeSourceItem(item) {
  if (!item) return null;
  if (typeof item === "string") return { title: item, source: item };
  if (typeof item !== "object") return null;

  const source = item.source || item.url || item.href || item.link || "";
  const title = item.title || item.name || source;
  return { ...item, title, source };
}

function normalizeSources(sources) {
  if (!Array.isArray(sources)) return [];
  return sources.map(normalizeSourceItem).filter(Boolean);
}

function normalizeAssistantPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return { answer: typeof payload === "string" ? payload : "", sources: [], rewritten_question: "" };
  }

  return {
    answer: payload.answer || payload.response || payload.message || payload.text || payload.content || "",
    sources: normalizeSources(payload.sources),
    rewritten_question: payload.rewritten_question || payload.rewrittenQuestion || "",
    answer_id: payload.answer_id || payload.answerId || payload.id || "",
    message_id: payload.message_id || payload.messageId || "",
    request_id: payload.request_id || payload.requestId || payload.trace_id || payload.traceId || "",
    conversation_id: payload.conversation_id || payload.conversationId || "",
    access_scope: payload.access_scope,
    user_role: payload.user_role,
  };
}

function parseJsonMaybe(value) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function parseSseEvent(rawEvent) {
  const data = [];
  let event = "message";

  rawEvent.split(/\r?\n/).forEach((line) => {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
  });

  return {
    event,
    data: parseJsonMaybe(data.length ? data.join("\n") : rawEvent),
  };
}

function applyAssistantEvent(result, eventName, payload, onDelta) {
  const event = eventName || payload?.event || payload?.type || "message";

  if (event === "error") {
    throw new Error(getErrorMessage(payload, "Не удалось получить ответ ассистента"));
  }

  if (event === "token") {
    const chunk = typeof payload === "string"
      ? payload
      : payload?.content || payload?.token || payload?.delta || payload?.text || "";
    if (chunk) {
      result.answer += chunk;
      onDelta?.(chunk, payload);
    }
    return;
  }

  if (event === "sources") {
    result.sources = normalizeSources(payload?.sources || payload);
    return;
  }

  if (event === "rewritten_question") {
    result.rewritten_question = payload?.rewritten_question || payload?.rewrittenQuestion || "";
    return;
  }

  if (event === "status") {
    result.status = payload;
    return;
  }

  const normalized = normalizeAssistantPayload(payload);
  if (normalized.answer) result.answer = normalized.answer;
  if (normalized.sources.length) result.sources = normalized.sources;
  if (normalized.rewritten_question) result.rewritten_question = normalized.rewritten_question;
  if (normalized.answer_id) result.answer_id = normalized.answer_id;
  if (normalized.message_id) result.message_id = normalized.message_id;
  if (normalized.request_id) result.request_id = normalized.request_id;
  if (normalized.conversation_id) result.conversation_id = normalized.conversation_id;
  if (normalized.access_scope) result.access_scope = normalized.access_scope;
  if (normalized.user_role !== undefined) result.user_role = normalized.user_role;
}

async function readAssistantStream(response, { onDelta } = {}) {
  const contentType = response.headers.get("Content-Type") || "";
  if (!response.body || contentType.includes("application/json")) {
    return normalizeAssistantPayload(await readJson(response));
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const result = { answer: "", sources: [], rewritten_question: "" };
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop() || "";

    events.forEach((rawEvent) => {
      const trimmed = rawEvent.trim();
      if (!trimmed) return;
      const { event, data } = parseSseEvent(trimmed);
      if (data === "[DONE]") return;
      applyAssistantEvent(result, event, data, onDelta);
    });
  }

  buffer += decoder.decode();
  if (buffer.trim()) {
    const { event, data } = parseSseEvent(buffer.trim());
    if (data !== "[DONE]") applyAssistantEvent(result, event, data, onDelta);
  }

  return result;
}

export async function apiAsk(question, sessionId = "default", options = {}) {
  const res = await fetch(`${API_BASE}/assistant/ask/stream`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ question, session_id: sessionId }),
    signal: options.signal,
  });

  if (!res.ok) {
    const data = await readJson(res);
    throw new Error(getErrorMessage(data, "Ошибка запроса к ассистенту"));
  }

  return readAssistantStream(res, options);
}

export async function apiClearChat(sessionId = "default") {
  const res = await fetch(`${API_BASE}/assistant/clear/${encodeURIComponent(sessionId)}`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await readJson(res);
    throw new Error(getErrorMessage(data, "Не удалось очистить историю чата"));
  }
}

export async function apiGetChatHistory(sessionId = "default", limit = 50) {
  const params = new URLSearchParams({ limit: String(limit) });
  const res = await fetch(`${API_BASE}/assistant/history/${encodeURIComponent(sessionId)}?${params}`, {
    headers: getAuthHeaders(),
  });
  const data = await readJson(res);
  if (!res.ok) throw new Error(getErrorMessage(data, "Не удалось загрузить историю чата"));
  return data;
}

export async function apiAssistantStatus() {
  const res = await fetch(`${API_BASE}/assistant/status`, {
    headers: getAuthHeaders(),
  });
  const data = await readJson(res);
  if (!res.ok) throw new Error(getErrorMessage(data, "Не удалось получить статус ассистента"));
  return data;
}

function normalizeHistoryMessage(message) {
  if (!message || typeof message !== "object") return null;

  return {
    ...message,
    messageId: message.db_id || message.message_id || message.messageId || message.id,
    text: message.content || message.text || message.answer || "",
    role: message.role,
  };
}

export async function apiGetLatestAssistantAnswer(sessionId = "default", { answer = "" } = {}) {
  const history = await apiGetChatHistory(sessionId, 20);
  const messages = Array.isArray(history?.messages)
    ? history.messages.map(normalizeHistoryMessage).filter(Boolean)
    : [];
  const assistantMessages = messages.filter((message) => message.role === "assistant").reverse();

  if (!assistantMessages.length) return null;

  const normalizedAnswer = String(answer || "").trim();
  if (!normalizedAnswer) return assistantMessages[0];

  return assistantMessages.find((message) => String(message.text || "").trim() === normalizedAnswer) || assistantMessages[0];
}

export async function apiRateAssistantAnswer(feedback) {
  const messageId = Number(feedback.messageId || feedback.message_id || feedback.answerId || feedback.answer_id);
  if (!Number.isInteger(messageId) || messageId < 1) {
    throw new Error("Не удалось определить ID ответа для оценки");
  }

  const score = Math.max(1, Math.min(5, Math.round(Number(feedback.score || feedback.rating || 0))));
  if (!score) {
    throw new Error("Оценка должна быть от 1 до 5");
  }

  const res = await authFetch(`${API_BASE}/assistant/quality/${messageId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      score,
      comment: feedback.comment || null,
      tags: Array.isArray(feedback.tags) ? feedback.tags.slice(0, 10) : [],
    }),
  });
  const data = await readJson(res);
  if (!res.ok) {
    const fallback = res.status === 401
      ? "Войдите в аккаунт, чтобы оценить ответ"
      : "Не удалось сохранить оценку ответа";
    throw new Error(getErrorMessage(data, fallback));
  }

  return data;
}

export async function apiGetAssistantAnswerQuality(messageId) {
  const normalizedMessageId = Number(messageId);
  if (!Number.isInteger(normalizedMessageId) || normalizedMessageId < 1) {
    throw new Error("Не удалось определить ID ответа");
  }

  const res = await authFetch(`${API_BASE}/assistant/quality/${normalizedMessageId}`);
  const data = await readJson(res);
  if (!res.ok) {
    const fallback = res.status === 401
      ? "Нужна авторизация для просмотра качества ответа"
      : "Не удалось загрузить качество ответа";
    throw new Error(getErrorMessage(data, fallback));
  }

  return data;
}

export async function apiAssistantQualityStats(params = {}) {
  const query = new URLSearchParams();
  query.set("limit", String(params.limit || 100));

  const sessionId = params.sessionId || params.session_id;
  if (sessionId) query.set("session_id", sessionId);

  if (params.ratedOnly !== undefined) {
    query.set("rated_only", String(Boolean(params.ratedOnly)));
  } else if (params.rated_only !== undefined) {
    query.set("rated_only", String(Boolean(params.rated_only)));
  }

  const minScore = params.minScore ?? params.min_score;
  const maxScore = params.maxScore ?? params.max_score;
  if (minScore !== "" && minScore !== undefined && minScore !== null) {
    query.set("min_score", String(minScore));
  }
  if (maxScore !== "" && maxScore !== undefined && maxScore !== null) {
    query.set("max_score", String(maxScore));
  }

  const res = await authFetch(`${API_BASE}/assistant/quality?${query}`);
  const data = await readJson(res);
  if (!res.ok) {
    const fallback = res.status === 401
      ? "Нужна авторизация для просмотра качества ответов"
      : "Не удалось загрузить качество ответов";
    throw new Error(getErrorMessage(data, fallback));
  }

  return data;
}
