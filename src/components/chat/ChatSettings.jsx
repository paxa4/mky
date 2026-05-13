/**
 * ChatSettings — модуль админ-панели «Настройки чата».
 * Три блока:
 *   1. Состояние системы      — статус планировщика + фоновых задач
 *   2. Управление индексом    — инкрементальное обновление / полная переиндексация
 *   3. Тестовый чат           — быстрая проверка качества ответов бота
 *
 * Ендпоинты:
 *   GET  /admin/update/status
 *   POST /admin/update/run
 *   POST /admin/reindex
 *   POST /assistant/ask
 *   POST /assistant/clear/{session_id}
 */
import { useState, useEffect, useCallback } from "react";
import { API_BASE } from "../../constants/index.js";
import StatusPanel from "./StatusPanel.jsx";
import UpdatePanel from "./UpdatePanel.jsx";
import TestChatPanel from "./TestChatPanel.jsx";
import { authHeaders } from "../../utils/authHeaders.js";

const POLL_INTERVAL = 3000;   // 3 сек между опросами статуса

export default function ChatSettings() {
  const [status, setStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [statusError, setStatusError] = useState(null);

  // ── Опрос статуса (раз в 3 сек, пока открыта страница) ─────────────────────
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/update/status`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStatus(data);
      setStatusError(null);
    } catch (e) {
      setStatusError(e.message || "Не удалось получить статус");
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchStatus]);

  // ── Запуск задачи обновления ────────────────────────────────────────────────
  const runTask = useCallback(async (endpoint) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: authHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    await fetchStatus();
    return await res.json();
  }, [fetchStatus]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>

      {/* Левая колонка: статус + управление */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <StatusPanel
          status={status}
          loading={loadingStatus}
          error={statusError}
        />
        <UpdatePanel
          status={status}
          onRun={runTask}
        />
      </div>

      {/* Правая колонка: тестовый чат */}
      <TestChatPanel />
    </div>
  );
}
