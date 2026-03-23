import { useState, useEffect, useRef } from "react";

const QUICK_QUESTIONS = [
  "Как записаться на курсы?",
  "Как пройти аттестацию?",
  "Расписание мероприятий",
  "Контакты организации",
];

const BOT_ANSWERS = {
  "как записаться на курсы":    "Для записи на курсы повышения квалификации перейдите в раздел «Деятельность → Курсы» или позвоните по номеру +7 (3952) 201 985.",
  "как пройти аттестацию":      "Аттестация педагогов проводится в соответствии с Порядком, утверждённым Минпросвещения. Для подачи заявления обратитесь в раздел «Деятельность → Аттестация».",
  "расписание мероприятий":     "Актуальное расписание мероприятий доступно в разделе «Мероприятия → Календарь» на сайте.",
  "контакты организации":       "📍 664025, Иркутск, ул. Ленина, 26\n📞 +7 (3952) 201 985\n✉️ irk_imcro@bk.ru\n🕐 Пн–Пт: 09:00–18:00",
};

function getBotReply(text) {
  const lower = text.toLowerCase().trim();
  for (const [key, val] of Object.entries(BOT_ANSWERS)) {
    if (lower.includes(key) || key.includes(lower)) return val;
  }
  if (lower.includes("привет") || lower.includes("здравствуй")) return "Здравствуйте! Я помощник МКУ развития образования. Чем могу помочь?";
  if (lower.includes("спасибо")) return "Пожалуйста! Если есть ещё вопросы — обращайтесь.";
  return "Я не совсем понял вопрос. Попробуйте выбрать один из вариантов ниже или позвоните нам: +7 (3952) 201 985.";
}

function Message({ msg }) {
  const isBot = msg.from === "bot";
  return (
    <div style={{ display: "flex", justifyContent: isBot ? "flex-start" : "flex-end", marginBottom: 12 }}>
      {isBot && (
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1D4ED8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 8, marginTop: 2 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="2" y="4" width="10" height="7" rx="2" stroke="white" strokeWidth="1.3"/>
            <path d="M5 4V3a2 2 0 0 1 4 0v1" stroke="white" strokeWidth="1.3"/>
            <circle cx="5" cy="7.5" r="1" fill="white"/>
            <circle cx="9" cy="7.5" r="1" fill="white"/>
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
      </div>
    </div>
  );
}

export default function ChatBot() {
  const [open,    setOpen]    = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, from: "bot", text: "Здравствуйте! 👋 Я помощник МКУ развития образования города Иркутска. Чем могу помочь?" }
  ]);
  const [input,   setInput]   = useState("");
  const [typing,  setTyping]  = useState(false);
  const [unread,  setUnread]  = useState(0);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = (text) => {
    if (!text.trim()) return;
    const userMsg = { id: Date.now(), from: "user", text: text.trim() };
    setMessages(m => [...m, userMsg]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const reply = getBotReply(text);
      setTyping(false);
      setMessages(m => [...m, { id: Date.now() + 1, from: "bot", text: reply }]);
      if (!open) setUnread(n => n + 1);
    }, 800 + Math.random() * 400);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  return (
    <>
      <style>{`
        .chat-window {
          position: fixed; bottom: 88px; right: 24px; z-index: 400;
          width: 340px; max-height: 520px;
          background: #fff; border-radius: 20px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 16px 48px rgba(0,0,0,0.14);
          display: flex; flex-direction: column;
          animation: chatIn 0.22s ease;
          overflow: hidden;
        }
        @keyframes chatIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
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
        .quick-chip {
          font-size: 12px; padding: 6px 12px; border-radius: 20px;
          border: 1px solid #BFDBFE; background: #EFF6FF; color: #1D4ED8;
          cursor: pointer; white-space: nowrap; font-family: inherit;
          transition: background 0.15s; flex-shrink: 0;
        }
        .quick-chip:hover { background: #DBEAFE; }
        @media (max-width: 480px) {
          .chat-window { width: calc(100vw - 32px); right: 16px; bottom: 80px; }
          .chat-fab { right: 16px; bottom: 16px; }
        }
      `}</style>

      {/* Chat window */}
      {open && (
        <div className="chat-window">

          {/* Header */}
          <div style={{ background: "#1D4ED8", padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="5" width="14" height="9" rx="3" stroke="white" strokeWidth="1.5"/>
                <path d="M6 5V4a3 3 0 0 1 6 0v1" stroke="white" strokeWidth="1.5"/>
                <circle cx="6.5" cy="9.5" r="1.2" fill="white"/>
                <circle cx="11.5" cy="9.5" r="1.2" fill="white"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Помощник МКУ</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80", display: "inline-block" }}/>
                Онлайн
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 12px 8px", display: "flex", flexDirection: "column" }}>
            {messages.map(msg => <Message key={msg.id} msg={msg} />)}
            {typing && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1D4ED8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="2" y="4" width="10" height="7" rx="2" stroke="white" strokeWidth="1.3"/>
                    <circle cx="5" cy="7.5" r="1" fill="white"/>
                    <circle cx="9" cy="7.5" r="1" fill="white"/>
                  </svg>
                </div>
                <div style={{ background: "#F1F5F9", borderRadius: "4px 16px 16px 16px", padding: "10px 14px", display: "flex", gap: 4, alignItems: "center" }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#94A3B8", animation: `bounce 1s ease ${i * 0.15}s infinite` }}/>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick chips */}
          <div style={{ padding: "0 12px 8px", display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
            {QUICK_QUESTIONS.map(q => (
              <button key={q} className="quick-chip" onClick={() => sendMessage(q)}>{q}</button>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: "10px 12px 12px", borderTop: "1px solid #F1F5F9" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "9px 10px 9px 14px", transition: "border-color 0.2s" }}
              onFocus={e => e.currentTarget.style.borderColor = "#93C5FD"}
              onBlur={e => e.currentTarget.style.borderColor = "#E2E8F0"}
            >
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
              <button className="chat-send" onClick={() => sendMessage(input)} disabled={!input.trim()}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M12.5 1.5L1.5 6l4.5 1.5L7.5 12l5-10.5Z" stroke="white" strokeWidth="1.4" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div style={{ fontSize: 10, color: "#CBD5E1", textAlign: "center", marginTop: 6 }}>
              МКУ развития образования · ИИ-помощник
            </div>
          </div>
        </div>
      )}

      {/* FAB button */}
      <button className="chat-fab" onClick={() => setOpen(v => !v)} title="Чат с помощником">
        <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }`}</style>
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
        {unread > 0 && !open && (
          <div style={{ position: "absolute", top: 0, right: 0, width: 18, height: 18, borderRadius: "50%", background: "#EF4444", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }}>
            {unread}
          </div>
        )}
      </button>
    </>
  );
}
