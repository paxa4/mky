/**
 * AdminPage — корневой компонент админ-панели.
 * Три модуля:
 *   "issue"  — Выпуск документов (одиночная + групповая генерация)
 *   "editor" — Конструктор шаблонов
 *   "chat"   — Настройки чата (статус RAG, обновление индекса, тестирование)
 */
import { useState, useEffect, useCallback } from "react";
import { API_BASE } from "../constants/index.js";
import GenerateSingle from "../components/certificates/GenerateSingle.jsx";
import GenerateBatch from "../components/certificates/GenerateBatch.jsx";
import TemplateConstructor from "../components/certificates/TemplateConstructor.jsx";
import ChatSettings from "../components/chat/ChatSettings.jsx";
import ArticlesModule from "../features/admin/ArticlesModule.jsx";

// ── Компонент модуля «Выпуск документов» ─────────────────────────────────────

function IssueModule({ templates }) {
  const [subTab, setSubTab] = useState("single");
  return (
    <div>
      {/* Внутренний переключатель */}
      <div style={{ display: "flex", gap: 2, background: "#F1F5F9", borderRadius: 10, padding: 4, marginBottom: 28, width: "fit-content" }}>
        {[
          { key: "single", label: "Одиночная генерация" },
          { key: "batch",  label: "Групповая генерация" },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setSubTab(key)}
            style={{
              padding: "10px 22px",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              fontSize: 14,
              transition: "all 0.15s",
              background: subTab === key ? "#fff" : "transparent",
              color: subTab === key ? "#1D4ED8" : "#64748B",
              boxShadow: subTab === key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {subTab === "single" && <GenerateSingle templates={templates} />}
      {subTab === "batch"  && <GenerateBatch  templates={templates} />}
    </div>
  );
}

// ── Главный компонент ─────────────────────────────────────────────────────────

export default function AdminPage({ onBack }) {
  const [activeModule, setActiveModule] = useState("issue");
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  const loadTemplates = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/certificates/templates`);
      if (res.ok) setTemplates(await res.json());
    } catch (e) {
      console.error("Ошибка загрузки шаблонов:", e);
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>

        {/* Шапка */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 32, flexWrap: "wrap", gap: 16,
        }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0F172A", margin: 0 }}>
              Генератор грамот и сертификатов
            </h1>
            <p style={{ color: "#64748B", marginTop: 6, marginBottom: 0, fontSize: 15 }}>
              ИМЦРО — Информационно-методический центр развития образования
            </p>
          </div>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              style={{
                padding: "10px 20px", background: "#fff",
                border: "1px solid #E2E8F0", borderRadius: 10,
                fontWeight: 600, cursor: "pointer", fontSize: 14, color: "#475569",
              }}
            >
              ← На главную
            </button>
          )}
        </div>

        {/* Главные вкладки — два модуля */}
        <div style={{ display: "flex", gap: 4, background: "#F1F5F9", borderRadius: 14, padding: 5, marginBottom: 32, width: "fit-content" }}>
          {[
            { key: "issue",    label: "Выпуск документов" },
            { key: "editor",   label: "Конструктор шаблонов" },
            { key: "articles", label: "Статьи" },
            { key: "chat",     label: "Настройки чата" },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveModule(key)}
              style={{
                padding: "13px 28px",
                borderRadius: 10,
                fontWeight: 700,
                cursor: "pointer",
                border: "none",
                fontSize: 15,
                transition: "all 0.15s",
                background: activeModule === key ? "#fff" : "transparent",
                color: activeModule === key ? "#1D4ED8" : "#64748B",
                boxShadow: activeModule === key ? "0 2px 8px rgba(0,0,0,0.10)" : "none",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Контент */}
        {loadingTemplates ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#94A3B8", fontSize: 16 }}>
            Загрузка шаблонов…
          </div>
        ) : (
          <>
            {activeModule === "issue"    && <IssueModule templates={templates} />}
            {activeModule === "editor"   && (
              <TemplateConstructor
                templates={templates}
                onTemplatesSaved={loadTemplates}
              />
            )}
            {activeModule === "articles" && <ArticlesModule />}
            {activeModule === "chat"     && <ChatSettings />}
          </>
        )}
      </div>
    </div>
  );
}
