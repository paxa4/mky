/**
 * GenerateBatch — форма групповой генерации из Excel.
 * Включает: drag-and-drop, клиентскую валидацию через SheetJS,
 * прогресс-бар (анимированный), скачивание ZIP.
 */
import { useState, useRef, useEffect } from "react";
import { API_BASE } from "../../constants/index.js";
import AlertBanner from "./shared/AlertBanner.jsx";
import { inputStyle, labelStyle, successBtn, cardStyle } from "./shared/styles.js";

const FIO_ALIASES = new Set([
  "фио", "fio", "full_name", "fullname", "полноеимя",
  "фамилияимяотчество", "name", "участник",
]);

function normHeader(v) {
  return String(v ?? "").trim().toLowerCase().replace(/\s+/g, "");
}

/** Клиентский парсинг Excel через SheetJS (динамический импорт для code-splitting) */
async function parseExcelClient(file) {
  const XLSX = await import("xlsx");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        if (!rows.length) return reject(new Error("Файл пустой"));

        const headers = rows[0].map(normHeader);
        const colIdx = headers.findIndex((h) => FIO_ALIASES.has(h));
        if (colIdx === -1) return reject(new Error("Не найден столбец ФИО. Добавьте заголовок «ФИО» или «Участник»."));

        const names = rows
          .slice(1)
          .map((r) => String(r[colIdx] ?? "").trim())
          .filter((value) => value && value.replace(/\s+/g, "").length > 0);

        resolve(names);
      } catch (err) {
        reject(new Error("Не удалось прочитать файл: " + err.message));
      }
    };
    reader.onerror = () => reject(new Error("Ошибка чтения файла"));
    reader.readAsArrayBuffer(file);
  });
}

export default function GenerateBatch({ templates }) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? null);
  const [event, setEvent] = useState("");
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const dragCounter = useRef(0); // Для корректной работы drag-and-drop подсветки
  const [preview, setPreview] = useState(null); // { names: [], warnings: [] }
  const [parseError, setParseError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0); // 0–100
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState("info");
  const [archiveName, setArchiveName] = useState("");
  const [abortController, setAbortController] = useState(null);
  const inputRef = useRef(null);
  const progressRef = useRef(null);

  const pickFile = async (f) => {
    if (!f) return;
    if (!f.name.toLowerCase().match(/\.(xlsx|xlsm)$/)) {
      setParseError("Нужен файл Excel в формате .xlsx или .xlsm");
      return;
    }
    setFile(f);
    setParseError(null);
    setPreview(null);
    setMsg(null);
    try {
      const names = await parseExcelClient(f);
      const warnings = names.filter((n) => n.length > 80).map((n) => `«${n.slice(0, 40)}…» — слишком длинное ФИО`);
      setPreview({ names, warnings });
    } catch (err) {
      setParseError(err.message);
      setFile(null);
    }
  };

  // Анимированный прогресс-бар во время генерации
  useEffect(() => {
    if (!loading) { setProgress(0); return; }
    const total = preview?.names?.length || 10;
    const step = 100 / (total * 0.3 + 5); // ~0.3 сек на грамоту
    progressRef.current = setInterval(() => {
      setProgress((p) => Math.min(p + step, 92)); // до 92% — остаток при получении ответа
    }, 300);
    return () => clearInterval(progressRef.current);
  }, [loading, preview]);

  useEffect(() => () => clearInterval(progressRef.current), []);

  const handleGenerate = async () => {
    if (!templateId || !file) return;
    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("template_id", String(templateId));
      fd.append("event_name", event.trim());
      if (archiveName.trim()) {
        fd.append("archive_name", archiveName.trim());
      }

      const res = await fetch(`${API_BASE}/certificates/batch`, {
        method: "POST",
        body: fd,
        signal: controller.signal,
      });
      clearInterval(progressRef.current);
      setProgress(100);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Ошибка сервера");
      }

      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition");
      const m = cd && /filename="?([^";]+)"?/i.exec(cd);
      const fallbackName = (archiveName.trim() || `certificates_${new Date().toISOString().slice(2,16).replace(/[-T:]/g,"").replace(/(\d{6})(\d{4})/, "$1_$2")}`) + ".zip";
      const filename = m ? m[1] : fallbackName;

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      setMsg(`Готово! Скачано ${preview?.names?.length ?? "?"} грамот в ZIP-архиве.`);
      setMsgType("success");
    } catch (e) {
      if (e.name === "AbortError") {
        setMsg("Генерация отменена");
        setMsgType("info");
      } else {
        setMsg(e.message || "Ошибка пакетной генерации");
        setMsgType("error");
      }
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  };

  const handleCancel = () => {
    if (abortController) {
      clearInterval(progressRef.current);
      abortController.abort();
      setAbortController(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (preview?.names?.length) {
      const now = new Date();
      const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
      setArchiveName((prev) => prev || `certificates_${stamp}`);
    }
  }, [preview]);

  const disabled = loading || !templateId || !file || !!parseError;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))", gap: 32, alignItems: "start" }}>
      {/* Левая панель — форма */}
      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 24px", fontSize: 22, fontWeight: 700, color: "#0F172A" }}>
          Групповая генерация
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

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Название мероприятия (одно для всех)</label>
          <input
            type="text"
            value={event}
            onChange={(e) => setEvent(e.target.value)}
            placeholder="Городская олимпиада по математике"
            style={inputStyle}
          />
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "#94A3B8" }}>
            Подставится в {"{Мероприятие}"} для каждой грамоты
          </p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Название ZIP архива</label>
          <input
            type="text"
            value={archiveName}
            onChange={(e) => setArchiveName(e.target.value)}
            placeholder="certificates_20250412_0930"
            style={inputStyle}
          />
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "#94A3B8" }}>
            Будет скачан как {archiveName || "certificates_..."}.zip
          </p>
        </div>

        {/* Drag-and-drop зона */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Список участников (.xlsx)</label>
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
            onDragEnter={(e) => {
              e.preventDefault();
              dragCounter.current++;
              if (dragCounter.current === 1) setDrag(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              dragCounter.current--;
              if (dragCounter.current === 0) setDrag(false);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              dragCounter.current = 0; // Сброс счетчика при дропе
              setDrag(false);
              pickFile(e.dataTransfer.files?.[0]);
            }}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${drag ? "#1D4ED8" : file ? "#059669" : "#CBD5E1"}`,
              borderRadius: 16,
              padding: "28px 20px",
              textAlign: "center",
              cursor: "pointer",
              background: drag ? "#EEF2FF" : file ? "#F0FDF4" : "#F8FAFC",
              transition: "all 0.15s",
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xlsm"
              style={{ display: "none" }}
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
            <div style={{ fontSize: 14, marginBottom: 8, color: "#64748B" }}>{file ? "Файл выбран" : "Выбор файла"}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
              {file ? file.name : "Перетащите .xlsx сюда или нажмите для выбора"}
            </div>
            <div style={{ fontSize: 13, color: "#64748B" }}>
              Столбец с заголовком «ФИО» или «Участник». До 500 строк.
            </div>
          </div>
        </div>

        {parseError && <AlertBanner type="error">{parseError}</AlertBanner>}

        {/* Превью данных из Excel */}
        {preview && !parseError && (
          <div style={{ marginBottom: 20, padding: 16, background: "#F0FDF4", borderRadius: 12, border: "1px solid #BBF7D0" }}>
            <div style={{ fontWeight: 700, color: "#059669", marginBottom: 8, fontSize: 14 }}>
              Найдено {preview.names.length} участников
            </div>
            <div style={{ fontSize: 13, color: "#475569", marginBottom: preview.warnings.length ? 8 : 0 }}>
              {preview.names.slice(0, 5).map((n, i) => (
                <div key={i} style={{ padding: "2px 0" }}>• {n}</div>
              ))}
              {preview.names.length > 5 && (
                <div style={{ color: "#94A3B8", marginTop: 4 }}>…и ещё {preview.names.length - 5}</div>
              )}
            </div>
            {preview.warnings.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {preview.warnings.slice(0, 3).map((w, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#D97706", padding: "2px 0" }}>{w}</div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => { setFile(null); setPreview(null); if (inputRef.current) inputRef.current.value = ""; }}
              style={{ marginTop: 10, fontSize: 12, color: "#64748B", background: "none", border: "1px solid #CBD5E1", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}
            >
              Сбросить файл
            </button>
          </div>
        )}

        {/* Прогресс-бар */}
        {loading && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#475569", marginBottom: 6 }}>
              <span>Генерация грамот…</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div style={{ height: 8, background: "#E2E8F0", borderRadius: 99, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${progress}%`,
                background: "linear-gradient(90deg, #059669, #10B981)",
                borderRadius: 99,
                transition: "width 0.3s ease",
              }} />
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={disabled}
            style={successBtn(disabled)}
          >
            {loading ? "Формирование архива…" : `Скачать ZIP${preview ? ` (${preview.names.length} грамот)` : ""}`}
          </button>
          {loading && (
            <button
              type="button"
              onClick={handleCancel}
              style={{
                padding: "10px 20px",
                background: "#FEF2F2",
                color: "#B91C1C",
                border: "1px solid #FECACA",
                borderRadius: 10,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Отмена
            </button>
          )}
        </div>

        {msg && <AlertBanner type={msgType}>{msg}</AlertBanner>}
      </div>

      {/* Правая панель — инструкция */}
      <div style={cardStyle}>
        <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700, color: "#0F172A" }}>
          Как подготовить файл
        </h3>
        <ol style={{ margin: 0, paddingLeft: 20, color: "#475569", fontSize: 14, lineHeight: 1.8 }}>
          <li style={{ marginBottom: 12 }}>
            Создайте таблицу Excel (.xlsx) с одним листом.
          </li>
          <li style={{ marginBottom: 12 }}>
            В <strong>первой строке</strong> укажите заголовок столбца: <code style={{ background: "#F1F5F9", padding: "2px 6px", borderRadius: 4 }}>ФИО</code> или <code style={{ background: "#F1F5F9", padding: "2px 6px", borderRadius: 4 }}>Участник</code>.
          </li>
          <li style={{ marginBottom: 12 }}>
            Со второй строки — по одному ФИО в каждой строке.
          </li>
          <li style={{ marginBottom: 12 }}>
            Укажите <strong>название мероприятия</strong> выше — оно будет одинаковым для всех грамот.
          </li>
          <li>
            Нажмите «Скачать ZIP» — получите архив с PDF-грамотами.
          </li>
        </ol>

        <div style={{ marginTop: 24, padding: 16, background: "#FFF7ED", borderRadius: 12, border: "1px solid #FED7AA" }}>
          <div style={{ fontWeight: 600, color: "#C2410C", marginBottom: 8, fontSize: 14 }}>💡 Советы</div>
          <ul style={{ margin: 0, paddingLeft: 16, color: "#7C2D12", fontSize: 13, lineHeight: 1.7 }}>
            <li>Максимум 500 участников за один раз</li>
            <li>ФИО длиннее 80 символов — предупреждение (шрифт уменьшится)</li>
            <li>Файл проверяется сразу после загрузки — ошибки видны до отправки</li>
          </ul>
        </div>
      </div>
    </div>
  );
}