/**
 * GenerateBatch — групповая генерация из Excel.
 * Поле «Мероприятие» убрано. Недостающие переменные шаблона
 * появляются автоматически после загрузки Excel.
 */
import { useState, useRef, useEffect } from "react";
import { API_BASE } from "../../constants/index.js";
import { getApiErrorMessage } from "../../utils/apiError.js";
import AlertBanner from "./shared/AlertBanner.jsx";
import { inputStyle, labelStyle, successBtn, cardStyle } from "./shared/styles.js";

const FIO_ALIASES = new Set(["фио","fio","full_name","fullname","полноеимя","фамилияимяотчество","name","участник"]);

function norm(v) { return String(v ?? "").trim().toLowerCase().replace(/\s+/g, ""); }

function Tooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-block", marginLeft: 6 }}>
      <button type="button"
        onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)} onBlur={() => setShow(false)}
        style={{ width: 18, height: 18, borderRadius: "50%", background: "#E2E8F0", border: "none", color: "#64748B", fontSize: 11, fontWeight: 700, cursor: "help", lineHeight: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", verticalAlign: "middle", fontFamily: "inherit" }}
        aria-label="Подсказка"
      >?</button>
      {show && (
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: "calc(100% + 8px)", background: "#0F172A", color: "#fff", fontSize: 12, lineHeight: 1.5, padding: "8px 12px", borderRadius: 8, width: 240, zIndex: 999, boxShadow: "0 4px 16px rgba(0,0,0,0.25)", pointerEvents: "none", whiteSpace: "normal" }}>
          {text}
          <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", border: "5px solid transparent", borderTopColor: "#0F172A" }} />
        </div>
      )}
    </span>
  );
}

export default function GenerateBatch({ templates }) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? null);
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const dragCounter = useRef(0);
  const [preview, setPreview] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState("info");
  const [archiveName, setArchiveName] = useState("");
  const [abortController, setAbortController] = useState(null);
  // Переменные шаблона, не покрытые Excel — заполняются один раз для всех
  const [extraVariables, setExtraVariables] = useState({});
  const inputRef = useRef(null);
  const progressRef = useRef(null);

  const pickFile = async (f) => {
    if (!f) return;
    if (!f.name.toLowerCase().match(/\.(xlsx|xlsm)$/)) {
      setParseError("Нужен файл Excel в формате .xlsx. Другие форматы (.csv, .ods, .xls) не поддерживаются.");
      return;
    }
    setFile(f); setParseError(null); setPreview(null); setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", f);
      if (templateId) fd.append("template_id", String(templateId));
      const res = await fetch(`${API_BASE}/certificates/excel/inspect`, { method: "POST", body: fd });
      if (!res.ok) throw new Error(await getApiErrorMessage(res, "Не удалось проверить Excel"));
      const data = await res.json();
      const names = data.fio_column
        ? data.preview_rows.map((row) => String(row[data.fio_column] || "").trim()).filter(Boolean)
        : [];
      setPreview({
        names,
        warnings: names.filter((n) => n.length > 80).map((n) => `«${n.slice(0, 40)}…» — очень длинное имя`),
        headers: data.headers || [],
        rows: data.preview_rows || [],
        rowCount: data.row_count || 0,
        fioColumn: data.fio_column || null,
        templateVariables: data.template_variables || [],
        matchedColumns: data.matched_columns || [],
        missingColumns: data.missing_columns || [],
      });
      // Строим extraVariables из переменных, не покрытых Excel и не являющихся ФИО/Дата
      const excelNorms = new Set((data.matched_columns || []).map(norm));
      const covered = new Set([...FIO_ALIASES, "дата", "date", ...excelNorms]);
      setExtraVariables((prev) => {
        const next = {};
        for (const key of (data.missing_columns || [])) {
          if (!covered.has(norm(key))) next[key] = prev[key] ?? "";
        }
        return next;
      });
    } catch (err) {
      setParseError(err.message); setFile(null);
    }
  };

  useEffect(() => {
    if (!loading) { setProgress(0); return; }
    const total = preview?.rowCount || 10;
    const step = 100 / (total * 0.3 + 5);
    progressRef.current = setInterval(() => setProgress((p) => Math.min(p + step, 92)), 300);
    return () => clearInterval(progressRef.current);
  }, [loading, preview]);

  useEffect(() => { if (file && !loading) pickFile(file); }, [templateId]);
  useEffect(() => () => clearInterval(progressRef.current), []);

  useEffect(() => {
    if (preview?.rowCount) {
      const now = new Date();
      const stamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}_${String(now.getHours()).padStart(2,"0")}${String(now.getMinutes()).padStart(2,"0")}`;
      setArchiveName((prev) => prev || `certificates_${stamp}`);
    }
  }, [preview]);

  const handleGenerate = async () => {
    if (!templateId || !file) return;
    const controller = new AbortController();
    setAbortController(controller); setLoading(true); setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("template_id", String(templateId));
      if (archiveName.trim()) fd.append("archive_name", archiveName.trim());
      // Передаём дополнительные переменные как JSON
      if (Object.keys(extraVariables).length > 0) {
        fd.append("extra_variables", JSON.stringify(extraVariables));
      }
      const res = await fetch(`${API_BASE}/certificates/batch`, { method: "POST", body: fd, signal: controller.signal });
      clearInterval(progressRef.current); setProgress(100);
      if (!res.ok) throw new Error(await getApiErrorMessage(res, "Ошибка на сервере"));
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition");
      const m = cd && /filename="?([^";]+)"?/i.exec(cd);
      const fallback = (archiveName.trim() || `certificates_${new Date().toISOString().slice(2,16).replace(/[-T:]/g,"")}`) + ".zip";
      const filename = m ? m[1] : fallback;
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl; a.download = filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      setMsg(`Готово! Скачано ${preview?.rowCount ?? "?"} грамот ZIP-архивом.`);
      setMsgType("success");
    } catch (e) {
      if (e.name === "AbortError") { setMsg("Создание отменено"); setMsgType("info"); }
      else { setMsg(e.message || "Ошибка при создании архива"); setMsgType("error"); }
    } finally { setLoading(false); setAbortController(null); }
  };

  const handleCancel = () => {
    clearInterval(progressRef.current);
    abortController?.abort(); setAbortController(null); setLoading(false);
  };

  const extraKeys = Object.keys(extraVariables);
  const hasUnfilledExtra = extraKeys.some((k) => !extraVariables[k]?.trim());
  const disabled = loading || !templateId || !file || !!parseError || hasUnfilledExtra;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: 32, alignItems: "start" }}>
      {/* ── Левая панель ── */}
      <div style={cardStyle}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800, color: "#0F172A" }}>Создать грамоты для группы участников</h2>
          <p style={{ margin: 0, fontSize: 14, color: "#64748B", lineHeight: 1.5 }}>Загрузите список из Excel — система сама создаст по одной грамоте для каждого</p>
        </div>

        {/* Шаблон */}
        <div style={{ marginBottom: 22 }}>
          <label style={labelStyle}>
            <span style={{ display: "flex", alignItems: "center" }}>
              Оформление грамоты
              <Tooltip text="Выберите внешний вид — он будет одинаковым для всех участников." />
            </span>
          </label>
          <select value={templateId ?? ""} onChange={(e) => setTemplateId(Number(e.target.value) || null)} style={{ ...inputStyle, background: "#fff", marginTop: 8 }}>
            {templates.length === 0
              ? <option value="">Нет шаблонов — сначала создайте в разделе «Конструктор»</option>
              : (<><option value="">— Выберите оформление —</option>{templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</>)
            }
          </select>
        </div>

        {/* Название архива */}
        <div style={{ marginBottom: 22 }}>
          <label style={{ ...labelStyle, color: "#94A3B8" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              Название ZIP-архива (необязательно)
              <Tooltip text="Имя скачиваемого файла. Если пусто — назовётся автоматически по дате." />
            </span>
          </label>
          <div style={{ position: "relative", marginTop: 8 }}>
            <input type="text" value={archiveName} onChange={(e) => setArchiveName(e.target.value)} placeholder="certificates_20260415_1030" style={{ ...inputStyle, borderColor: "#F1F5F9", paddingRight: 60 }} />
            <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#94A3B8", fontWeight: 600 }}>.zip</span>
          </div>
        </div>

        {/* Drag-and-drop */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>
            <span style={{ display: "flex", alignItems: "center" }}>
              Список участников (Excel .xlsx)
              <span style={{ color: "#EF4444", marginLeft: 4 }}>*</span>
              <Tooltip text="Файл Excel (.xlsx). В первой строке заголовки колонок, ФИО в обязательной колонке «ФИО». Остальные колонки подставляются автоматически." />
            </span>
          </label>
          <div
            role="button" tabIndex={0} aria-label="Загрузить Excel-файл"
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
            onDragEnter={(e) => { e.preventDefault(); dragCounter.current++; if (dragCounter.current === 1) setDrag(true); }}
            onDragLeave={(e) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setDrag(false); }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); dragCounter.current = 0; setDrag(false); pickFile(e.dataTransfer.files?.[0]); }}
            onClick={() => inputRef.current?.click()}
            style={{ border: `2px dashed ${drag ? "#1D4ED8" : file ? "#059669" : "#CBD5E1"}`, borderRadius: 16, padding: "32px 24px", textAlign: "center", cursor: "pointer", background: drag ? "#EEF2FF" : file ? "#F0FDF4" : "#F8FAFC", transition: "all 0.15s", marginTop: 8 }}
          >
            <input ref={inputRef} type="file" accept=".xlsx,.xlsm" style={{ display: "none" }} onChange={(e) => pickFile(e.target.files?.[0])} />
            <div style={{ fontSize: 32, marginBottom: 10 }}>{file ? "✓" : drag ? "📂" : "📊"}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
              {file ? file.name : drag ? "Отпустите файл здесь" : "Перетащите .xlsx сюда или нажмите для выбора"}
            </div>
            <div style={{ fontSize: 13, color: "#94A3B8" }}>
              {file ? "Нажмите, чтобы заменить файл" : "Поддерживается: Excel (.xlsx) — до 500 участников"}
            </div>
          </div>
        </div>

        {parseError && <AlertBanner type="error">{parseError}</AlertBanner>}

        {/* Превью Excel */}
        {preview && !parseError && (
          <div style={{ marginBottom: 20, padding: 16, background: "#F0FDF4", borderRadius: 12, border: "1px solid #BBF7D0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 700, color: "#059669", fontSize: 14 }}>Файл принят — найдено {preview.rowCount} строк</div>
              <button type="button" onClick={() => { setFile(null); setPreview(null); setExtraVariables({}); if (inputRef.current) inputRef.current.value = ""; }}
                style={{ fontSize: 12, color: "#64748B", background: "none", border: "1px solid #CBD5E1", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontFamily: "inherit" }}>
                Заменить
              </button>
            </div>

            {/* Колонки Excel */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {preview.headers.map((h) => (
                <span key={h} style={{ padding: "3px 8px", borderRadius: 7, background: "#fff", border: "1px solid #BBF7D0", color: "#047857", fontSize: 12, fontWeight: 700 }}>{h}</span>
              ))}
            </div>

            {/* Переменные шаблона — статус */}
            {preview.templateVariables.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700, marginBottom: 6 }}>Переменные шаблона</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {preview.templateVariables.map((key) => {
                    const inExcel = preview.matchedColumns.some((c) => norm(c) === norm(key));
                    const isCovered = inExcel || FIO_ALIASES.has(norm(key)) || norm(key) === "дата" || norm(key) === "date";
                    const inExtra = key in extraVariables;
                    const matched = isCovered || inExtra;
                    return (
                      <span key={key} style={{ padding: "4px 8px", borderRadius: 8, background: matched ? "#ECFDF5" : "#FFF7ED", color: matched ? "#047857" : "#C2410C", border: `1px solid ${matched ? "#A7F3D0" : "#FED7AA"}`, fontSize: 12, fontWeight: 700 }}>
                        {`{${key}}`} {inExcel ? "✓ Excel" : isCovered ? "✓ поле" : inExtra ? "✓ заполните ниже" : "⚠ не найдена"}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Предпросмотр строк */}
            <div style={{ fontSize: 13, color: "#475569" }}>
              {preview.rows.slice(0, 5).map((row, i) => (
                <div key={i} style={{ padding: "5px 0", borderTop: i ? "1px solid #DCFCE7" : "none" }}>
                  {preview.headers.slice(0, 4).map((h) => (
                    <span key={h} style={{ marginRight: 12 }}><strong>{h}:</strong> {row[h] || "—"}</span>
                  ))}
                </div>
              ))}
              {preview.rowCount > preview.rows.length && (
                <div style={{ color: "#94A3B8", marginTop: 4 }}>…и ещё {preview.rowCount - preview.rows.length}</div>
              )}
            </div>
            {preview.warnings.slice(0, 3).map((w, i) => (
              <div key={i} style={{ fontSize: 12, color: "#D97706", marginTop: 4 }}>{w}</div>
            ))}
          </div>
        )}

        {/* Блок дополнительных переменных */}
        {extraKeys.length > 0 && (
          <div style={{ marginBottom: 24, padding: 18, background: "linear-gradient(135deg, #F0F7FF 0%, #F8FAFC 100%)", border: "1px solid #BFDBFE", borderRadius: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 16 }}>📋</span>
              <span style={{ fontWeight: 800, color: "#1D4ED8", fontSize: 15 }}>Данные для шаблона</span>
              <span style={{ fontSize: 11, background: "#FEE2E2", color: "#B91C1C", border: "1px solid #FECACA", borderRadius: 4, padding: "1px 7px", fontWeight: 700 }}>обязательно</span>
            </div>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: "#64748B", lineHeight: 1.5 }}>
              Эти переменные не найдены в Excel — заполните их, чтобы сгенерировать грамоты.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {extraKeys.map((key) => {
                const empty = !extraVariables[key]?.trim();
                return (
                  <label key={key} style={{ display: "block" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 5 }}>
                      <code style={{ background: "#DBEAFE", color: "#1D4ED8", padding: "2px 7px", borderRadius: 5, fontFamily: "monospace", fontSize: 12 }}>{`{${key}}`}</code>
                      {key}
                      <span style={{ color: "#EF4444" }}>*</span>
                    </span>
                    <input
                      type="text"
                      value={extraVariables[key] ?? ""}
                      onChange={(e) => setExtraVariables((prev) => ({ ...prev, [key]: e.target.value }))}
                      placeholder={`Значение для «${key}»`}
                      style={{ ...inputStyle, fontSize: 14, borderColor: empty ? "#FCA5A5" : undefined, background: empty ? "#FFF5F5" : undefined }}
                    />
                  </label>
                );
              })}
            </div>
            {hasUnfilledExtra && (
              <div style={{ marginTop: 12, padding: "8px 12px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, fontSize: 12, color: "#B91C1C", fontWeight: 600 }}>
                ⚠ Заполните все поля выше — без них генерация недоступна
              </div>
            )}
          </div>
        )}

        {/* Прогресс */}
        {loading && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#475569", marginBottom: 8 }}>
              <span>Создаём грамоты…</span>
              <span style={{ fontWeight: 700, color: "#059669" }}>{Math.round(progress)}%</span>
            </div>
            <div style={{ height: 10, background: "#E2E8F0", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #059669, #10B981)", borderRadius: 99, transition: "width 0.3s ease" }} />
            </div>
            <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 6, textAlign: "center" }}>Пожалуйста, не закрывайте страницу…</div>
          </div>
        )}

        {/* Кнопки */}
        <div style={{ display: "flex", gap: 12 }}>
          <button type="button" onClick={handleGenerate} disabled={disabled}
            style={{ ...successBtn(disabled), flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {loading ? (
              <>
                <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin2 0.7s linear infinite" }} />
                <style>{`@keyframes spin2 { to { transform: rotate(360deg); } }`}</style>
                Создаём архив…
              </>
            ) : <>Скачать ZIP{preview ? ` (${preview.rowCount} грамот)` : ""}</>}
          </button>
          {loading && (
            <button type="button" onClick={handleCancel}
              style={{ padding: "10px 20px", background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>
              Отмена
            </button>
          )}
        </div>

        {msg && <AlertBanner type={msgType}>{msg}</AlertBanner>}
      </div>

      {/* ── Правая панель — инструкция ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700, color: "#0F172A" }}>Как это работает</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { step: 1, title: "Подготовьте таблицу Excel", desc: "В первой строке — заголовки колонок. Обязательная колонка «ФИО». Дополнительные колонки (Класс, Школа и т.д.) подставятся в шаблон автоматически." },
              { step: 2, title: "Сохраните как .xlsx", desc: "Файл → Сохранить как → «Excel Книга (.xlsx)»." },
              { step: 3, title: "Загрузите файл и выберите шаблон", desc: "Система проверит данные и покажет, какие переменные покрыты Excel, а какие нужно заполнить вручную." },
              { step: 4, title: "Нажмите «Скачать ZIP»", desc: "Получите архив с готовыми PDF — по одной грамоте на каждого участника." },
            ].map(({ step, title, desc }) => (
              <div key={step} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1D4ED8", color: "#fff", fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{step}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#0F172A", marginBottom: 3 }}>{title}</div>
                  <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 14, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#334155", marginBottom: 12 }}>Пример правильной таблицы Excel</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "inherit" }}>
            <thead>
              <tr>
                <th style={{ background: "#1D4ED8", color: "#fff", padding: "8px 12px", textAlign: "left", borderRadius: "6px 0 0 6px" }}>ФИО</th>
                <th style={{ background: "#E2E8F0", color: "#64748B", padding: "8px 12px", textAlign: "left" }}>Класс</th>
                <th style={{ background: "#E2E8F0", color: "#64748B", padding: "8px 12px", textAlign: "left", borderRadius: "0 6px 6px 0" }}>Школа</th>
              </tr>
            </thead>
            <tbody>
              {[["Иванов Иван Иванович","8А","Школа №1"],["Петрова Мария Сергеевна","10Б","Лицей №3"]].map((r,i) => (
                <tr key={i} style={{ background: i % 2 ? "#F8FAFC" : "#fff" }}>
                  {r.map((c,j) => <td key={j} style={{ padding: "7px 12px", color: "#334155", border: "1px solid #E2E8F0" }}>{c}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 14, padding: 20 }}>
          <div style={{ fontWeight: 700, color: "#C2410C", marginBottom: 12, fontSize: 14 }}>💡 Советы</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {["Максимум 500 участников за один раз","Любая колонка Excel автоматически становится переменной — называйте как в шаблоне","Очень длинные имена уменьшатся в шрифте автоматически","Пустые строки игнорируются"].map((tip, i) => (
              <div key={i} style={{ fontSize: 13, color: "#7C2D12", lineHeight: 1.5, display: "flex", gap: 8 }}>
                <span style={{ flexShrink: 0 }}>•</span><span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
