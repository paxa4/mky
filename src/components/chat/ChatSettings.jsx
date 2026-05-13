import TestChatPanel from "./TestChatPanel.jsx";

export default function ChatSettings() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 24, alignItems: "start" }}>
      <div style={{
        padding: "18px 20px",
        border: "1px solid #bfdbfe",
        borderRadius: 8,
        background: "#eff6ff",
        color: "#1e3a8a",
        lineHeight: 1.6,
      }}>
        <strong>Помощник помогает посетителям с навигацией по порталу.</strong>{" "}
        На этой странице можно проверить приветствие, быстрые подсказки и ответы для основных разделов сайта.
      </div>
      <TestChatPanel />
    </div>
  );
}
