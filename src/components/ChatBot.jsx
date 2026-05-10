import { useState, useEffect, useRef } from "react";
import { getLinkHref, linkifyText, shortenUrlLabel } from "../utils/chatLinks.jsx";

const API_BASE   = import.meta.env.VITE_API_URL || "http://localhost:8000";
const SESSION_ID = crypto.randomUUID();

function Message({ msg }) {
  const isBot = msg.from === "bot";
  return (
    <div style={{ display: "flex", justifyContent: isBot ? "flex-start" : "flex-end", marginBottom: 12, minWidth: 0 }}>
      {isBot && (
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1D4ED8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 8, marginTop: 2 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5l-2 2V5Z" stroke="white" strokeWidth="1.3"/>
          </svg>
        </div>
      )}
      <div style={{
        maxWidth: "80%",
        minWidth: 0,
        padding: "10px 14px",
        borderRadius: isBot ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
        background: isBot ? "#F1F5F9" : "#1D4ED8",
        color: isBot ? "#0F172A" : "#fff",
        fontSize: 13,
        lineHeight: 1.55,
        whiteSpace: "pre-line",
        wordBreak: "break-word",
        overflowWrap: "anywhere",
      }}>
        {linkifyText(msg.text, { isBot })}

        {isBot && msg.sources?.length > 0 && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #CBD5E1" }}>
            <div style={{ fontSize: 11, color: "#64748B", marginBottom: 4 }}>Источники:</div>
            {msg.sources.map((src, i) => (
              <a
                key={i}
                href={getLinkHref(src.source)}
                target="_blank"
                rel="noopener noreferrer"
                className="chat-source-link"
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

function TypingIndicator() {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1D4ED8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 8, marginTop: 2 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5l-2 2V5Z" stroke="white" strokeWidth="1.3"/>
        </svg>
      </div>
      <div style={{ padding: "12px 16px", background: "#F1F5F9", borderRadius: "4px 16px 16px 16px", display: "flex", gap: 5, alignItems: "center" }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 7, height: 7, borderRadius: "50%", background: "#94A3B8",
            display: "inline-block",
            animation: "typing 1.2s infinite",
            animationDelay: `${i * 0.2}s`,
          }}/>
        ))}
      </div>
    </div>
  );
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, from: "bot", text: "Здравствуйте! 👋 Я помощник МКУ развития образования города Иркутска. Задайте ваш вопрос." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    setError(null);

    const userMsg = { id: Date.now(), from: "user", text: text.trim() };
    setMessages(m => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/assistant/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question:   text.trim(),
          session_id: SESSION_ID,
        }),
      });

      if (!res.ok) {
        let detail = `Ошибка сервера (${res.status})`;
        try {
          const err = await res.json();
          detail = err.detail || detail;
        } catch (e) {
          void e;
        }
        throw new Error(detail);
      }

      const data = await res.json();

      setMessages(m => [...m, {
        id:      Date.now() + 1,
        from:    "bot",
        text:    data.answer,
        sources: data.sources || [],
      }]);
    } catch (e) {
      const errText = e.message || "Не удалось подключиться к серверу";
      setError(errText);
      setMessages(m => [...m, {
        id:   Date.now() + 1,
        from: "bot",
        text: `⚠️ ${errText}`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const clearHistory = async () => {
    try {
      await fetch(`${API_BASE}/assistant/clear/${SESSION_ID}`, { method: "POST" });
    } catch (e) {
      void e;
    }
    setMessages([{
      id: Date.now(), from: "bot",
      text: "История очищена. Задайте новый вопрос.",
    }]);
  };

  return (
    <>
      <style>{`
        .chat-window {
          position: fixed; bottom: 94px; right: 24px; z-index: 400;
          width: 340px; height: 500px; max-height: calc(100vh - 120px);
          background: #fff; border-radius: 20px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 16px 48px rgba(0,0,0,0.14);
          display: flex; flex-direction: column;
          animation: chatIn 0.2s ease;
          overflow: hidden;
        }
        @keyframes chatIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes typing {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.4; }
          40%            { transform: scale(1.1); opacity: 1; }
        }
        .chat-link-bot, .chat-link-user {
          text-decoration: underline;
          word-break: break-all;
          overflow-wrap: anywhere;
          font-weight: 600;
        }
        .chat-link-bot  { color: #1D4ED8; }
        .chat-link-bot:hover  { color: #1E40AF; }
        .chat-link-user { color: #fff; }
        .chat-link-user:hover { color: #DBEAFE; }
        .chat-source-link {
          display: block;
          font-size: 11px;
          color: #1D4ED8;
          font-weight: 600;
          text-decoration: none;
          margin-bottom: 4px;
          padding: 4px 8px;
          background: rgba(29,78,216,0.06);
          border-radius: 6px;
          word-break: break-all;
          overflow-wrap: anywhere;
          line-height: 1.4;
          transition: background 0.15s;
        }
        .chat-source-link:hover { background: rgba(29,78,216,0.12); text-decoration: underline; }
        .chat-input {
          flex: 1; border: none; outline: none; background: transparent;
          font-size: 13px; color: #0F172A; font-family: inherit; resize: none;
          line-height: 1.5;
        }
        .chat-input::placeholder { color: #94A3B8; }
        .chat-send {
          width: 32px; height: 32px; border-radius: 9px; border: none;
          background: #1D4ED8; cursor: pointer; display: flex;
          align-items: center; justify-content: center; flex-shrink: 0;
          transition: background 0.15s, transform 0.1s;
        }
        .chat-send:hover { background: #1E40AF; transform: scale(1.05); }
        .chat-send:disabled { background: #CBD5E1; cursor: default; transform: none; }
        .chat-fab {
          position: fixed; bottom: 24px; right: 24px; z-index: 400;
          width: 60px; height: 60px; border-radius: 50%;
          background: #1D4ED8; cursor: pointer; color: #fff;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 24px rgba(29,78,216,0.35);
          border: 4px solid #fff;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
        }
        .chat-fab:hover {
          transform: scale(1.08) translateY(-4px);
          box-shadow: 0 12px 32px rgba(29,78,216,0.45);
        }
        .chat-clear {
          background: none; border: none; cursor: pointer; padding: 4px;
          color: rgba(255,255,255,0.7); font-size: 11px;
          border-radius: 6px; transition: color 0.15s;
        }
        .chat-clear:hover { color: #fff; }
        @media (max-width: 480px) {
          .chat-window { width: calc(100vw - 32px); right: 16px; bottom: 80px; }
          .chat-fab { right: 16px; bottom: 16px; }
        }
      `}</style>

      {open && (
        <div className="chat-window">

          {/* Шапка */}
          <div style={{ background: "#1D4ED8", padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6l-3 2V5Z" stroke="white" strokeWidth="1.5"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Помощник МКУ</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: loading ? "#FCD34D" : "#4ADE80", display: "inline-block", transition: "background 0.3s" }}/>
                {loading ? "Печатает…" : "Онлайн"}
              </div>
            </div>
            <button className="chat-clear" onClick={clearHistory} title="Очистить историю">
              ↺
            </button>
            <button onClick={() => setOpen(false)} style={{ background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Сообщения */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 12px 8px", display: "flex", flexDirection: "column" }}>
            {messages.map(msg => <Message key={msg.id} msg={msg} />)}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Поле ввода */}
          <div style={{ padding: "10px 12px 12px", borderTop: "1px solid #F1F5F9" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, background: "#F8FAFC", border: `1.5px solid ${error ? "#FCA5A5" : "#E2E8F0"}`, borderRadius: 12, padding: "9px 10px 9px 14px", transition: "border-color 0.2s" }}>
              <textarea
                ref={inputRef}
                className="chat-input"
                rows={1}
                placeholder="Напишите вопрос…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                style={{ maxHeight: 80 }}
                disabled={loading}
              />
              <button className="chat-send" onClick={() => sendMessage(input)} disabled={!input.trim() || loading}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M12.5 1.5L1.5 6l4.5 1.5L7.5 12l5-10.5Z" stroke="white" strokeWidth="1.4" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Кнопка открытия */}
      <button className="chat-fab" onClick={() => setOpen(v => !v)} title="Написать нам">
        {open ? (
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
            <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 22 22" fill="none">
            <path d="M3 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H7l-4 3V5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M7 9h8M7 12h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )}
      </button>
    </>
  );
}
