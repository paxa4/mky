/**
 * GenerateSingle — одиночная генерация.
 * Поле «Мероприятие» убрано: все переменные шаблона (кроме ФИО и Дата)
 * обнаруживаются автоматически и показываются как отдельные поля.
 */
import { useState, useRef, useEffect } from "react";
import { API_BASE } from "../../constants/index.js";
import { getApiErrorMessage } from "../../utils/apiError.js";
import { authHeaders } from "../../utils/authHeaders.js";
import AlertBanner from "./shared/AlertBanner.jsx";
import PdfPreviewPanel from "./shared/PdfPreviewPanel.jsx";
import { inputStyle, labelStyle, primaryBtn, cardStyle } from "./shared/styles.js";

// Переменные, которые закрываются фиксированными полями формы (не нужны в «доп. данных»)
const COVERED_VARS = new Set(["фио", "fio", "дата", "date"]);

function norm(v) { return String(v || "").trim().toLowerCase().replace(/\s+/g, ""); }

function Tooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-block", marginLeft: 6 }}>
      <button type="button"
        onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)} onBlur={() => setShow(false)}
        style={{
          width: 18, height: 18, borderRadius: "50%", background: "#E2E8F0", border: "none",
          color: "#64748B", fontSize: 11, fontWeight: 700, cursor: "help", lineHeight: 1,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          verticalAlign: "middle", fontFamily: "inherit",
        }}
        aria-label="Подсказка"
      >?</button>
      {show && (
        <div style={{
          position: "absolute", left: "50%", transform: "translateX(-50%)",
          bottom: "calc(100% + 8px)", background: "#0F172A", color: "#fff",
          fontSize: 12, lineHeight: 1.5, padding: "8px 12px", borderRadius: 8,
          width: 220, zIndex: 999, boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
          pointerEvents: "none", whiteSpace: "normal",
        }}>
          {text}
          <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", border: "5px solid transparent", borderTopColor: "#0F172A" }} />
        </div>
      )}
    </span>
  );
}

function StepIndicator({ current, total }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: 4, flex: 1, borderRadius: 99,
          background: i < current ? "#1D4ED8" : "#E2E8F0",
          transition: "background 0.3s",
        }} />
      ))}
    </div>
  );
}

export default function GenerateSingle({ templates }) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? null);
  const [fio, setFio] = useState("");
  const [date, setDate] = useState("");
  const [fileUrl, setFileUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState("info");
  const [extraVariables, setExtraVariables] = useState({});   // { ключ: значение }
  const [allVariables, setAllVariables] = useState([]);        // все переменные шаблона
  const abortRef = useRef(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Загружаем переменные шаблона при смене шаблона
  useEffect(() => {
    let cancelled = false;
    if (!templateId) { setExtraVariables({}); setAllVariables([]); return; }

    fetch(`${API_BASE}/certificates/templates/${templateId}/variables`, {
      headers: authHeaders(),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await getApiErrorMessage(res, "Не удалось загрузить переменные"));
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const vars = Array.isArray(data.variables) ? data.variables : [];
        setAllVariables(vars);
        // Оставляем только «незакрытые» переменные
        setExtraVariables((prev) => {
          const next = {};
          for (const key of vars) {
            if (!COVERED_VARS.has(norm(key))) next[key] = prev[key] ?? "";
          }
          return next;
        });
      })
      .catch(() => { if (!cancelled) { setExtraVariables({}); setAllVariables([]); } });

    return () => { cancelled = true; };
  }, [templateId]);

  const extraKeys = Object.keys(extraVariables);
  const filledSteps = [!!templateId, !!fio.trim()].filter(Boolean).length;
  const disabled = loading || !templateId || !fio.trim();

  const handleGenerate = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true); setMsg(null); setFileUrl(null);

    const variables = { ФИО: fio.trim() };
    if (date.trim()) variables["Дата"] = date.trim();
    for (const [key, value] of Object.entries(extraVariables)) {
      variables[key] = String(value || "").trim();
    }

    try {
      const res = await fetch(`${API_BASE}/certificates/generate`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ template_id: templateId, variables }),
        signal: controller.signal,
      });
      if (res.ok) {
        const data = await res.json();
        setFileUrl(data.file_url);
        setMsg("Грамота готова! Посмотрите предпросмотр справа и нажмите «Скачать PDF».");
        setMsgType("success");
      } else {
        setMsg(await getApiErrorMessage(res, "Не удалось создать грамоту. Попробуйте ещё раз."));
        setMsgType("error");
      }
    } catch (e) {
      if (e.name === "AbortError") { setMsg("Создание отменено"); setMsgType("info"); }
      else { setMsg("Нет связи с сервером. Проверьте подключение."); setMsgType("error"); }
    } finally {
      setLoading(false);
      if (abortRef.current === controller) abortRef.current = null;
    }
  };

  const handleDownload = async () => {
    if (!fileUrl) return;
    try {
      const res = await fetch(`${API_BASE}${fileUrl}`);
      if (!res.ok) throw new Error(await getApiErrorMessage(res, "Не удалось скачать PDF"));
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `Грамота_${fio.replace(/[^а-яёА-ЯЁa-zA-Z0-9 ]/g, "_").slice(0, 60)}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 0);
    } catch (e) { setMsg(e.message || "Ошибка скачивания PDF"); setMsgType("error"); }
  };

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))",
      gap: 32, alignItems: "start",
    }}>
      {/* ── Левая панель — форма ── */}
      <div style={{ ...cardStyle, position: "relative" }}>
        <StepIndicator current={filledSteps} total={2} />

        <div style={{ marginBottom: 28 }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800, color: "#0F172A" }}>
            Создать грамоту для одного участника
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: "#64748B", lineHeight: 1.5 }}>
            Выберите шаблон, введите ФИО — остальные данные определяются по шаблону
          </p>
        </div>

        {/* Шаблон */}
        <div style={{ marginBottom: 22 }}>
          <label style={labelStyle}>
            <span style={{ display: "flex", alignItems: "center" }}>
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 22, height: 22, borderRadius: "50%",
                background: templateId ? "#1D4ED8" : "#E2E8F0",
                color: templateId ? "#fff" : "#94A3B8",
                fontSize: 11, fontWeight: 800, marginRight: 8, flexShrink: 0,
              }}>1</span>
              Выберите оформление грамоты
              <Tooltip text="Оформление — внешний вид грамоты: фон, шрифты, подписи. Шаблоны создаются в разделе «Конструктор шаблонов»." />
            </span>
          </label>
          <select
            value={templateId ?? ""}
            onChange={(e) => setTemplateId(Number(e.target.value) || null)}
            style={{ ...inputStyle, background: "#fff", marginTop: 8 }}
          >
            {templates.length === 0 ? (
              <option value="">Нет шаблонов — сначала создайте шаблон</option>
            ) : (
              <>
                <option value="">— Выберите оформление —</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </>
            )}
          </select>
        </div>

        {/* ФИО */}
        <div style={{ marginBottom: 22 }}>
          <label style={labelStyle}>
            <span style={{ display: "flex", alignItems: "center" }}>
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 22, height: 22, borderRadius: "50%",
                background: fio.trim() ? "#1D4ED8" : "#E2E8F0",
                color: fio.trim() ? "#fff" : "#94A3B8",
                fontSize: 11, fontWeight: 800, marginRight: 8, flexShrink: 0,
              }}>2</span>
              ФИО получателя
              <span style={{ color: "#EF4444", marginLeft: 4 }}>*</span>
              <Tooltip text="Введите полное имя — Фамилия Имя Отчество. Если имя длинное, шрифт автоматически уменьшится." />
            </span>
          </label>
          <input
            type="text" value={fio} onChange={(e) => setFio(e.target.value)}
            placeholder="Иванов Иван Иванович"
            style={{ ...inputStyle, marginTop: 8 }}
          />
        </div>

        {/* Дата — только если шаблон использует {Дата} */}
        {allVariables.some((v) => norm(v) === "дата" || norm(v) === "date") && (
          <div style={{ marginBottom: 22 }}>
            <label style={{ ...labelStyle, color: "#94A3B8" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                Дата (не обязательно)
                <Tooltip text="Вставится вместо {Дата} в тексте грамоты." />
              </span>
            </label>
            <input
              type="text" value={date} onChange={(e) => setDate(e.target.value)}
              placeholder="15 апреля 2026"
              style={{ ...inputStyle, marginTop: 8, borderColor: "#F1F5F9" }}
            />
          </div>
        )}

        {/* Блок дополнительных переменных шаблона */}
        {extraKeys.length > 0 && (
          <div style={{
            marginBottom: 24, padding: 18,
            background: "linear-gradient(135deg, #F0F7FF 0%, #F8FAFC 100%)",
            border: "1px solid #BFDBFE", borderRadius: 14,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 16 }}>📋</span>
              <span style={{ fontWeight: 800, color: "#1D4ED8", fontSize: 15 }}>
                Данные для шаблона
              </span>
            </div>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: "#64748B", lineHeight: 1.5 }}>
              Шаблон использует эти переменные — заполните их один раз, они подставятся в грамоту.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {extraKeys.map((key) => (
                <label key={key} style={{ display: "block" }}>
                  <span style={{
                    display: "flex", alignItems: "center", gap: 6,
                    fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 5,
                  }}>
                    <code style={{
                      background: "#DBEAFE", color: "#1D4ED8", padding: "2px 7px",
                      borderRadius: 5, fontFamily: "monospace", fontSize: 12,
                    }}>{`{${key}}`}</code>
                    {key}
                  </span>
                  <input
                    type="text"
                    value={extraVariables[key] ?? ""}
                    onChange={(e) => setExtraVariables((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder={`Значение для «${key}»`}
                    style={{ ...inputStyle, fontSize: 14 }}
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Кнопка */}
        <button
          type="button" onClick={handleGenerate} disabled={disabled}
          style={{
            ...primaryBtn(disabled),
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {loading ? (
            <>
              <span style={{
                display: "inline-block", width: 16, height: 16,
                border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff",
                borderRadius: "50%", animation: "spin 0.7s linear infinite",
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              Создаём грамоту…
            </>
          ) : <>Создать грамоту</>}
        </button>

        {!disabled && !loading && (
          <p style={{ margin: "10px 0 0", fontSize: 12, color: "#94A3B8", textAlign: "center" }}>
            Обычно занимает 2–5 секунд
          </p>
        )}

        {msg && <AlertBanner type={msgType}>{msg}</AlertBanner>}
      </div>

      {/* ── Правая панель — предпросмотр ── */}
      <div style={cardStyle}>
        <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700, color: "#0F172A" }}>
          Предпросмотр грамоты
        </h3>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: "#94A3B8" }}>
          После создания здесь появится готовый документ
        </p>
        <PdfPreviewPanel
          fileUrl={fileUrl} onDownload={handleDownload}
          accentColor="#1D4ED8"
          emptyText="Заполните форму слева и нажмите «Создать грамоту» — здесь появится предпросмотр"
          emptyIcon="📄"
        />
      </div>
    </div>
  );
}
