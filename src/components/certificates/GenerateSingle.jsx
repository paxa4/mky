/**
 * GenerateSingle — форма одиночной генерации сертификата.
 * Поля: шаблон, ФИО, мероприятие, дата.
 * Справа: предпросмотр PDF.
 */
import { useState, useRef, useEffect } from "react";
import { API_BASE } from "../../constants/index.js";
import AlertBanner from "./shared/AlertBanner.jsx";
import PdfPreviewPanel from "./shared/PdfPreviewPanel.jsx";
import { inputStyle, labelStyle, primaryBtn, cardStyle } from "./shared/styles.js";

export default function GenerateSingle({ templates }) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? null);
  const [fio, setFio] = useState("");
  const [event, setEvent] = useState("");
  const [date, setDate] = useState("");
  const [fileUrl, setFileUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState("info");
  const abortRef = useRef(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const disabled = loading || !templateId || !fio.trim() || !event.trim();

  const handleGenerate = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setMsg(null);
    setFileUrl(null);
    const variables = { ФИО: fio.trim(), Мероприятие: event.trim() };
    if (date.trim()) variables["Дата"] = date.trim();
    try {
      const res = await fetch(`${API_BASE}/certificates/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: templateId, variables }),
        signal: controller.signal,
      });
      if (res.ok) {
        const data = await res.json();
        setFileUrl(data.file_url);
        setMsg("Сертификат готов! Посмотрите предпросмотр справа и скачайте.");
        setMsgType("success");
      } else {
        const err = await res.json().catch(() => ({}));
        setMsg(err.detail || "Ошибка генерации");
        setMsgType("error");
      }
    } catch (e) {
      if (e.name === "AbortError") {
        setMsg("Генерация отменена");
        setMsgType("info");
      } else {
        setMsg("Не удалось связаться с сервером");
        setMsgType("error");
      }
    } finally {
      setLoading(false);
      if (abortRef.current === controller) abortRef.current = null;
    }
  };

  const handleDownload = async () => {
    if (!fileUrl) return;
    try {
      const url = `${API_BASE}${fileUrl}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Не удалось скачать PDF");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `Сертификат_${fio.replace(/[^а-яёА-ЯЁa-zA-Z0-9 ]/g, "_").slice(0, 60)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      setMsg(e.message || "Ошибка скачивания PDF");
      setMsgType("error");
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))", gap: 32, alignItems: "start" }}>
      {/* Левая панель — форма */}
      <div style={{ ...cardStyle, position: "relative" }}>
        <h2 style={{ margin: "0 0 24px", fontSize: 22, fontWeight: 700, color: "#0F172A" }}>
          Одиночная генерация
        </h2>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Шаблон</label>
          <select
            value={templateId ?? ""}
            onChange={(e) => setTemplateId(Number(e.target.value) || null)}
            style={{ ...inputStyle, background: "#fff" }}
          >
            {templates.length === 0 ? (
              <option value="">Нет шаблонов — создайте во вкладке «Конструктор»</option>
            ) : (
              <>
                <option value="">— Выберите шаблон —</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </>
            )}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>
            ФИО получателя <span style={{ color: "#EF4444" }}>*</span>
          </label>
          <input
            type="text"
            value={fio}
            onChange={(e) => setFio(e.target.value)}
            placeholder="Иванов Иван Иванович"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>
            Название мероприятия <span style={{ color: "#EF4444" }}>*</span>
          </label>
          <input
            type="text"
            value={event}
            onChange={(e) => setEvent(e.target.value)}
            placeholder="Городская олимпиада по математике"
            style={inputStyle}
          />
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "#94A3B8" }}>
            Подставится в {"{Мероприятие}"} в тексте шаблона
          </p>
        </div>

        <div style={{ marginBottom: 28 }}>
          <label style={labelStyle}>Дата (необязательно)</label>
          <input
            type="text"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder="15 апреля 2026"
            style={inputStyle}
          />
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={disabled}
          style={primaryBtn(disabled)}
        >
          {loading ? "Генерация…" : "Сгенерировать PDF"}
        </button>

        {msg && <AlertBanner type={msgType}>{msg}</AlertBanner>}
      </div>

      {/* Правая панель — предпросмотр */}
      <div style={cardStyle}>
        <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700, color: "#0F172A" }}>
          Предпросмотр PDF
        </h3>
        <PdfPreviewPanel
          fileUrl={fileUrl}
          onDownload={handleDownload}
          accentColor="#1D4ED8"
          emptyText="Заполните форму и нажмите «Сгенерировать PDF»"
          emptyIcon="📄"
        />
      </div>
    </div>
  );
}
