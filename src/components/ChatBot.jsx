import { useState, useEffect, useRef } from "react";
import { apiAsk } from "../api";

function Message({ msg }) {
  const isBot = msg.from === "bot";
  return (
    <div style={{ display: "flex", justifyContent: isBot ? "flex-start" : "flex-end", marginBottom: 12 }}>
      {isBot && (
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1D4ED8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 8, marginTop: 2 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5l-2 2V5Z" stroke="white" strokeWidth="1.3"/>
          </svg>
        </div>
      )}
      <div style={{
        maxWidth: "80%",
        padding: "10px 14px",
        borderRadius: isBot ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
        background: isBot ? "#F1F5F9" : "#1D4ED8",
        color: isBot ? "#0F172A" : "#fff",
        fontSize: 13,
        lineHeight: 1.55,
        whiteSpace: "pre-line",
      }}>
        {msg.text}
        {msg.sources && msg.sources.length > 0 && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #CBD5E1" }}>
            {msg.sources.map((src, i) => (
              <div key={i} style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                • <a href={src.source} target="_blank" rel="noreferrer" style={{ color: "#1D4ED8", textDecoration: "none" }}>
                  {src.title?.slice(0, 50)}
                </a>
              </div>
            ))}
          </div>
        )}
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
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { id: Date.now(), from: "user", text: text.trim() };
    setMessages(m => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const result = await apiAsk(text.trim());
      setMessages(m => [...m, {
        id: Date.now() + 1,
        from: "bot",
        text: result.answer,
        sources: result.sources,
      }]);
    } catch (err) {
      setMessages(m => [...m, {
        id: Date.now() + 1,
        from: "bot",
        text: "Произошла ошибка: " + err.message,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  return (
    <>
      <style>{`
        .chat-window {
          position: fixed; bottom: 88px; right: 24px; z-index: 400;
          width: 320px; max-height: 480px;
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
          width: 52px; height: 52px; border-radius: 50%; border: none;
          background: #1D4ED8; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 20px rgba(29,78,216,0.4);
          transition: background 0.15s, transform 0.15s;
        }
        .chat-fab:hover { background: #1E40AF; transform: scale(1.08); }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .typing-dot { width:6px; height:6px; border-radius:50%; background:#94A3B8; animation: pulse 1.2s ease infinite; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
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
                {loading ? "Печатает..." : "Онлайн"}
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Сообщения */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 12px 8px", display: "flex", flexDirection: "column" }}>
            {messages.map(msg => <Message key={msg.id} msg={msg} />)}

            {/* Индикатор загрузки */}
            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 12, marginLeft: 36 }}>
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Поле ввода */}
          <div style={{ padding: "10px 12px 12px", borderTop: "1px solid #F1F5F9" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "9px 10px 9px 14px" }}>
              <textarea
                ref={inputRef}
                className="chat-input"
                rows={1}
                placeholder="Напишите вопрос…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                style={{ maxHeight: 80 }}
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
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 4l12 12M16 4L4 16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M3 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H7l-4 3V5Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="M7 9h8M7 12h5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        )}
      </button>
    </>
  );
}