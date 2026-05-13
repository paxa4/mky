/**
 * TestChatPanel — встроенный чат для проверки качества ответов бота.
 * Отдельная сессия admin-test-<uuid>, не пересекающаяся с пользовательским ChatBot.
 * Показывает ответ + переписанный вопрос + источники.
 */
import { useState, useRef, useEffect } from "react";
import { API_BASE } from "../../constants/index.js";
import { cardStyle } from "../certificates/shared/styles.js";
import AlertBanner from "../certificates/shared/AlertBanner.jsx";
import { getLinkHref, linkifyText, shortenUrlLabel } from "../../utils/chatLinks.jsx";
import { authHeaders } from "../../utils/authHeaders.js";

function makeSessionId() {
  return `admin-test-${crypto.randomUUID()}`;
}

export default function TestChatPanel() {
  const [sessionId, setSessionId] = useState(makeSessionId);
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const bottomRef                 = useRef(null);
  const inputRef                  = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setError(null);
    setInput("");
    setMessages(m => [...m, { id: Date.now(), from: "user", text }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/assistant/ask`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ question: text, session_id: sessionId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setMessages(m => [...m, {
        id: Date.now() + 1, from: "bot",
        text: data.answer,
        rewritten: data.rewritten_question,
        sources: data.sources || [],
      }]);
    } catch (e) {
      setError(e.message || "Ошибка связи с сервером");
    } finally {
      setLoading(false);
    }
  };

  const clearSession = async () => {
    try {
      await fetch(`${API_BASE}/assistant/clear/${sessionId}`, {
        method: "POST",
        headers: authHeaders(),
      });
    } catch (e) {
      void e;
    }
    setSessionId(makeSessionId());
    setMessages([]);
    setError(null);
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div style={{ ...cardStyle, display: "flex", flexDirection: "column", minHeight: 600, maxHeight: "80vh" }}>
      {/* Заголовок */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#0F172A" }}>Тестовый чат</h2>
          <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: 13 }}>
            Проверяйте качество ответов и источники. Отдельная сессия, не влияет на пользователей.
          </p>
        </div>
        <button
          type="button"
          onClick={clearSession}
          disabled={loading}
          style={{
            padding: "8px 14px",
            background: "#F1F5F9",
            color: "#475569",
            border: "1px solid #E2E8F0",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            cursor: loading ? "default" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          ↺ Новая сессия
        </button>
      </div>

      {/* Сообщения */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "12px",
        background: "#F8FAFC", borderRadius: 12, border: "1px solid #E2E8F0",
        marginBottom: 12,
      }}>
        {messages.length === 0 && !loading && (
          <div style={{ color: "#94A3B8", fontSize: 14, textAlign: "center", padding: "40px 20px", lineHeight: 1.6 }}>
            Задайте боту вопрос — например,<br/>
            <em>«Как попасть на страницу ТПМПК?»</em><br/>
            или <em>«Какие документы нужны для аттестации?»</em>
          </div>
        )}

        {messages.map(msg => (
          <TestMessage key={msg.id} msg={msg} />
        ))}

        {loading && (
          <div style={{ padding: "12px 16px", color: "#64748B", fontSize: 14, fontStyle: "italic" }}>
            Бот думает…
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && <AlertBanner type="error">{error}</AlertBanner>}

      {/* Ввод */}
      <div style={{
        display: "flex", gap: 8, padding: "10px 12px",
        background: "#F1F5F9", borderRadius: 12,
        border: "1px solid #E2E8F0",
      }}>
        <textarea
          ref={inputRef}
          rows={2}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Напишите вопрос… (Enter — отправить, Shift+Enter — новая строка)"
          disabled={loading}
          style={{
            flex: 1, border: "none", outline: "none", background: "transparent",
            fontFamily: "inherit", fontSize: 14, resize: "none",
            color: "#0F172A",
          }}
        />
        <button
          type="button"
          onClick={send}
          disabled={!input.trim() || loading}
          style={{
            padding: "0 20px",
            background: !input.trim() || loading ? "#CBD5E1" : "#1D4ED8",
            color: "#fff",
            border: "none", borderRadius: 10,
            fontWeight: 700, cursor: !input.trim() || loading ? "default" : "pointer",
            fontSize: 14,
          }}
        >
          Отправить
        </button>
      </div>
    </div>
  );
}

// ── Одно сообщение ────────────────────────────────────────────────────────────

function TestMessage({ msg }) {
  const isBot = msg.from === "bot";

  return (
    <div style={{
      display: "flex",
      justifyContent: isBot ? "flex-start" : "flex-end",
      marginBottom: 12,
    }}>
      <div style={{
        maxWidth: "88%",
        padding: "12px 16px",
        borderRadius: isBot ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
        background: isBot ? "#fff" : "#1D4ED8",
        color: isBot ? "#0F172A" : "#fff",
        fontSize: 14, lineHeight: 1.55,
        whiteSpace: "pre-line",
        border: isBot ? "1px solid #E2E8F0" : "none",
        boxShadow: isBot ? "0 1px 3px rgba(0,0,0,0.04)" : "none",
      }}>
        {linkifyText(msg.text, { isBot })}

        {isBot && msg.rewritten && msg.rewritten !== msg.text && (
          <div style={{
            marginTop: 10, paddingTop: 10,
            borderTop: "1px dashed #CBD5E1",
            fontSize: 12, color: "#64748B",
          }}>
            <strong>Переформулированный вопрос:</strong> {msg.rewritten}
          </div>
        )}

        {isBot && msg.sources?.length > 0 && (
          <div style={{
            marginTop: 10, paddingTop: 10,
            borderTop: "1px solid #E2E8F0",
          }}>
            <div style={{ fontSize: 12, color: "#64748B", marginBottom: 6, fontWeight: 600 }}>
              Источники ({msg.sources.length}):
            </div>
            {msg.sources.map((src, i) => (
              <a
                key={i}
                href={getLinkHref(src.source)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "#1D4ED8",
                  textDecoration: "none",
                  marginBottom: 3,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={getLinkHref(src.source)}
              >
                🔗 {src.title || shortenUrlLabel(src.source)}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
