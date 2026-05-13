import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE } from "../constants/index.js";
import Header from "../features/nav/Header.jsx";
import Footer from "../components/Footer.jsx";
import GenerateSingle from "../components/certificates/GenerateSingle.jsx";
import GenerateBatch from "../components/certificates/GenerateBatch.jsx";
import TemplateConstructor from "../components/certificates/TemplateConstructor.jsx";
import ChatSettings from "../components/chat/ChatSettings.jsx";
import ArticlesModule from "../features/admin/ArticlesModule.jsx";
import { authHeaders, getStoredAccessToken } from "../utils/authHeaders.js";

function IssueModule({ templates }) {
  const [subTab, setSubTab] = useState("single");

  const subTabs = [
    {
      key: "single",
      label: "Одному участнику",
      hint: "Введите ФИО вручную, чтобы получить PDF за несколько секунд",
    },
    {
      key: "batch",
      label: "Группе участников",
      hint: "Загрузите Excel-список и получите ZIP-архив со всеми грамотами",
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: "0 0 6px" }}>
          Выпуск грамот и сертификатов
        </h2>
        <p style={{ fontSize: 15, color: "#64748B", margin: 0 }}>
          Выберите способ создания документов: для одного человека или для целой группы.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 36, maxWidth: 700 }}>
        {subTabs.map(({ key, label, hint }) => (
          <button
            key={key}
            type="button"
            onClick={() => setSubTab(key)}
            style={{
              padding: "20px 24px",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
              border: subTab === key ? "2px solid #1D4ED8" : "2px solid #E2E8F0",
              fontSize: 14,
              textAlign: "left",
              background: subTab === key ? "rgba(239, 246, 255, 0.9)" : "rgba(255,255,255,0.8)",
              color: subTab === key ? "#1D4ED8" : "#475569",
              transition: "all 0.2s",
              fontFamily: "inherit",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 12, color: subTab === key ? "#3B82F6" : "#94A3B8", lineHeight: 1.5, fontWeight: 400 }}>
              {hint}
            </div>
          </button>
        ))}
      </div>

      {templates.length === 0 && (
        <div style={{ marginBottom: 24, padding: "16px 20px", background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 8, color: "#7C2D12", fontSize: 14 }}>
          Нет ни одного шаблона. Сначала создайте шаблон во вкладке "Конструктор шаблонов".
        </div>
      )}

      {subTab === "single" && <GenerateSingle templates={templates} />}
      {subTab === "batch" && <GenerateBatch templates={templates} />}
    </div>
  );
}

export default function AdminPage({
  currentUser,
  articles = [],
  saveArticle,
  deleteArticle,
  changeArticleStatus,
  onArticlesChanged,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const adminModules = [
    { key: "issue", path: "/admin/certificates", label: "Выпуск грамот" },
    { key: "editor", path: "/admin/templates", label: "Конструктор шаблонов" },
    { key: "articles", path: "/admin/articles", label: "Статьи" },
    { key: "chat", path: "/admin/chat", label: "Настройки чата" },
  ];
  const moduleOrder = ["articles", "issue", "editor", "chat"];
  const orderedAdminModules = [...adminModules].sort(
    (left, right) => moduleOrder.indexOf(left.key) - moduleOrder.indexOf(right.key),
  );
  const activeModule = orderedAdminModules.find((module) => location.pathname.startsWith(module.path))?.key || "articles";
  const needsTemplates = activeModule === "issue" || activeModule === "editor";

  const loadTemplates = useCallback(async () => {
    if (!needsTemplates || !getStoredAccessToken()) {
      setLoadingTemplates(false);
      return;
    }
    setLoadingTemplates(true);
    try {
      const res = await fetch(`${API_BASE}/certificates/templates`, {
        headers: authHeaders(),
      });
      if (res.ok) setTemplates(await res.json());
    } catch (e) {
      console.error("Ошибка загрузки шаблонов:", e);
    } finally {
      setLoadingTemplates(false);
    }
  }, [needsTemplates]);

  useEffect(() => {
    document.title = "Генератор грамот - ИМЦРО";
    loadTemplates();
    return () => {
      document.title = "МКУ развития образования города Иркутска";
    };
  }, [loadTemplates]);

  useEffect(() => {
    if (location.pathname === "/admin" || location.pathname === "/admin/") {
      navigate("/admin/articles", { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #FFFFFF 0%, #EFF6FF 100%)", display: "flex", flexDirection: "column" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <Header
        onGoAuth={(tab) => navigate(`/auth?tab=${tab || "login"}`)}
        onGoAdmin={() => navigate("/admin")}
        onGoProfile={() => navigate("/profile")}
        currentUser={currentUser}
      />

      <div style={{ position: "sticky", top: 72, zIndex: 100, background: "rgba(255, 255, 255, 0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(226, 232, 240, 0.8)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "12px 24px", display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 8, padding: 4, gap: 4, flexWrap: "wrap" }}>
            {orderedAdminModules.map(({ key, path, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => navigate(path)}
                style={{
                  padding: "10px 20px",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 14,
                  background: activeModule === key ? "#fff" : "transparent",
                  color: activeModule === key ? "#1D4ED8" : "#64748B",
                  transition: "all 0.2s",
                  fontFamily: "inherit",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main style={{ flex: 1 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "40px 24px 64px" }}>
          {needsTemplates && loadingTemplates ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 16 }}>
              <div style={{ width: 44, height: 44, border: "3px solid #E2E8F0", borderTop: "3px solid #1D4ED8", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <div style={{ color: "#94A3B8", fontSize: 15, fontWeight: 500 }}>Загрузка данных...</div>
            </div>
          ) : (
            <>
              {activeModule === "issue" && <IssueModule templates={templates} />}
              {activeModule === "editor" && <TemplateConstructor templates={templates} onTemplatesSaved={loadTemplates} />}
              {activeModule === "articles" && (
                <ArticlesModule
                  currentUser={currentUser}
                  articles={articles}
                  saveArticle={saveArticle}
                  deleteArticle={deleteArticle}
                  changeArticleStatus={changeArticleStatus}
                  onArticlesChanged={onArticlesChanged}
                />
              )}
              {activeModule === "chat" && <ChatSettings />}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
