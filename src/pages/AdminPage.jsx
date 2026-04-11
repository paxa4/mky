import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { API_BASE } from "../constants/index.js";

function formatApiError(data) {
  if (!data || data.detail == null) return "Неизвестная ошибка";
  const d = data.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d))
    return d
      .map((e) => (typeof e === "object" && e.msg ? e.msg : JSON.stringify(e)))
      .join("; ");
  return String(d);
}

function AlertBanner({ type, children }) {
  const styles = {
    success: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
    error: { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
    info: { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
  };
  const s = styles[type] || styles.info;
  return (
    <div
      role="status"
      style={{
        marginTop: 16,
        padding: "14px 16px",
        borderRadius: 12,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        fontWeight: 500,
        fontSize: 14,
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  );
}

const pillBtn = (active) => ({
  padding: "10px 20px",
  borderRadius: 10,
  fontWeight: 600,
  cursor: "pointer",
  border: "none",
  fontSize: 14,
  transition: "background 0.15s, color 0.15s",
  background: active ? "#1D4ED8" : "transparent",
  color: active ? "#fff" : "#475569",
});

export default function AdminPage({ onBack }) {
  const [activeTab, setActiveTab] = useState("generate");

  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [eventName, setEventName] = useState("");
  const [variableFio, setVariableFio] = useState("");
  const [variableDate, setVariableDate] = useState("");
  const [generatedFileUrl, setGeneratedFileUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState("info");

  const [genMode, setGenMode] = useState("single");
  const [batchFile, setBatchFile] = useState(null);
  const [batchDrag, setBatchDrag] = useState(false);
  const batchInputRef = useRef(null);

  const [editorName, setEditorName] = useState("Новый шаблон");
  const [editorBgUrl, setEditorBgUrl] = useState(null);
  const [editorBgFile, setEditorBgFile] = useState(null);
  const [editorElements, setEditorElements] = useState([
    { id: 1, text: "Сертификат", x: 50, y: 14, size: 48, color: "#0F172A", weight: "800" },
    { id: 2, text: "награждается", x: 50, y: 24, size: 24, color: "#64748B", weight: "400" },
    { id: 3, text: "{fio}", x: 50, y: 38, size: 40, color: "#1D4ED8", weight: "700" },
    {
      id: 4,
      text: "за участие в мероприятии {мероприятие}",
      x: 50,
      y: 54,
      size: 20,
      color: "#475569",
      weight: "400",
    },
  ]);

  const [signersLayout, setSignersLayout] = useState({
    signers_y_mm: 248,
    signers_block_x_mm: 105,
    signers_row_height_mm: 32,
    signers_band_width_mm: 168,
  });

  const [templateMargins, setTemplateMargins] = useState({
    margin_left_mm: 12,
    margin_right_mm: 12,
    margin_top_mm: 12,
    margin_bottom_mm: 12,
  });

  const [signersTextStyle, setSignersTextStyle] = useState({
    signers_font_size: 10,
    signers_text_color: "#1e293b",
    signers_font_weight: "400",
  });

  const [editorSigners, setEditorSigners] = useState(() => [
    {
      id: "s1",
      position: "Директор",
      fullName: "",
      facsimileFile: null,
      facsimilePreview: null,
      offsetY: 0,
      facsimileOffsetX: 0,
      facsimileOffsetY: 0,
      facsimileScale: 1,
    },
  ]);

  const safePct = useMemo(
    () => ({
      xMin: (templateMargins.margin_left_mm / 210) * 100,
      xMax: ((210 - templateMargins.margin_right_mm) / 210) * 100,
      yMin: (templateMargins.margin_top_mm / 297) * 100,
      yMax: ((297 - templateMargins.margin_bottom_mm) / 297) * 100,
    }),
    [templateMargins]
  );

  const loadTemplates = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/certificates/templates`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
        setSelectedTemplateId((prev) => {
          if (prev != null && data.some((t) => t.id === prev)) return prev;
          return data[0]?.id ?? null;
        });
      }
    } catch (err) {
      console.error("Ошибка загрузки шаблонов:", err);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    setEditorElements((els) =>
      els.map((el) => ({
        ...el,
        x: Math.min(safePct.xMax, Math.max(safePct.xMin, el.x)),
        y: Math.min(safePct.yMax, Math.max(safePct.yMin, el.y)),
      }))
    );
  }, [
    safePct.xMin,
    safePct.xMax,
    safePct.yMin,
    safePct.yMax,
  ]);

  const setMsg = (text, type = "info") => {
    setMessage(text);
    setMessageType(type);
  };

  const handleGenerate = async () => {
    if (!selectedTemplateId) {
      setMsg("Выберите шаблон", "error");
      return;
    }
    if (!variableFio.trim()) {
      setMsg("Укажите ФИО получателя", "error");
      return;
    }
    if (!eventName.trim()) {
      setMsg("Введите название мероприятия", "error");
      return;
    }
    setLoading(true);
    setMessage(null);
    setGeneratedFileUrl(null);
    const variables = {
      ФИО: variableFio.trim(),
      Мероприятие: eventName.trim(),
    };
    if (variableDate.trim()) variables["Дата"] = variableDate.trim();
    try {
      const res = await fetch(`${API_BASE}/certificates/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: selectedTemplateId,
          variables,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedFileUrl(data.file_url);
        setMsg("Сертификат успешно сгенерирован. Можно скачать или посмотреть предпросмотр.", "success");
      } else {
        const errData = await res.json().catch(() => ({}));
        setMsg(formatApiError(errData), "error");
      }
    } catch {
      setMsg("Не удалось связаться с сервером. Проверьте, что API запущен.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fullUrl = generatedFileUrl ? `${API_BASE}${generatedFileUrl}` : null;

  const handleDownload = async () => {
    if (!fullUrl) return;
    try {
      const response = await fetch(fullUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      const safe = (variableFio || eventName).replace(/[^a-zA-Z0-9А-Яа-яёЁ ]/g, "_").slice(0, 80);
      link.download = `Сертификат_${safe || "preview"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      setMsg("Ошибка при скачивании файла", "error");
    }
  };

  const pickBatchFile = (file) => {
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".xlsx") && !lower.endsWith(".xlsm")) {
      setMsg("Нужен файл Excel в формате .xlsx или .xlsm", "error");
      return;
    }
    setBatchFile(file);
    setMessage(null);
  };

  const handleBatchGenerate = async () => {
    if (!selectedTemplateId) {
      setMsg("Выберите шаблон", "error");
      return;
    }
    if (!batchFile) {
      setMsg("Выберите Excel-файл со столбцом «ФИО»", "error");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", batchFile);
      formData.append("template_id", String(selectedTemplateId));
      formData.append("event_name", eventName.trim());

      const res = await fetch(`${API_BASE}/certificates/batch`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(formatApiError(errData));
      }

      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition");
      let filename = "certificates.zip";
      const m = cd && /filename="?([^";]+)"?/i.exec(cd);
      if (m) filename = m[1];

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      setMsg("Архив с грамотами скачан. Проверьте папку загрузок.", "success");
    } catch (e) {
      setMsg(e.message || "Ошибка пакетной генерации", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBgUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditorBgFile(file);
      setEditorBgUrl(URL.createObjectURL(file));
    }
  };

  const addTextElement = () => {
    const newId =
      editorElements.length > 0 ? Math.max(...editorElements.map((e) => e.id)) + 1 : 1;
    const cx = (safePct.xMin + safePct.xMax) / 2;
    const cy = (safePct.yMin + safePct.yMax) / 2;
    setEditorElements([
      ...editorElements,
      {
        id: newId,
        text: "Новый текст",
        x: cx,
        y: cy,
        size: 24,
        color: "#000000",
        weight: "400",
      },
    ]);
  };

  const updateElement = (id, field, value) => {
    setEditorElements(
      editorElements.map((el) => (el.id === id ? { ...el, [field]: value } : el))
    );
  };

  const removeElement = (id) => {
    setEditorElements(editorElements.filter((el) => el.id !== id));
  };

  const addSigner = () => {
    setEditorSigners((prev) => [
      ...prev,
      {
        id: `s_${Date.now()}`,
        position: "Должность",
        fullName: "",
        facsimileFile: null,
        facsimilePreview: null,
        offsetY: 0,
        facsimileOffsetX: 0,
        facsimileOffsetY: 0,
        facsimileScale: 1,
      },
    ]);
  };

  const removeSigner = (id) => {
    setEditorSigners((prev) => (prev.length <= 1 ? prev : prev.filter((s) => s.id !== id)));
  };

  const updateSigner = (id, field, value) => {
    setEditorSigners((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleSignerFacsimile = (id, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const preview = URL.createObjectURL(file);
    setEditorSigners((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        if (s.facsimilePreview) URL.revokeObjectURL(s.facsimilePreview);
        return { ...s, facsimileFile: file, facsimilePreview: preview };
      })
    );
  };

  const handleSaveTemplate = async () => {
    if (!editorBgFile && !editorBgUrl) {
      alert("Пожалуйста, выберите фон для шаблона");
      return;
    }

    setLoading(true);
    try {
      let finalBgUrl = editorBgUrl;

      if (editorBgFile) {
        const formData = new FormData();
        formData.append("file", editorBgFile);

        const uploadRes = await fetch(`${API_BASE}/certificates/upload-background`, {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) throw new Error("Ошибка при загрузке фона");
        const uploadData = await uploadRes.json();
        finalBgUrl = uploadData.background_url;
      }

      const templateRes = await fetch(`${API_BASE}/certificates/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editorName,
          background_url: finalBgUrl,
          signers_y_mm: signersLayout.signers_y_mm,
          signers_block_x_mm: signersLayout.signers_block_x_mm,
          signers_row_height_mm: signersLayout.signers_row_height_mm,
          signers_band_width_mm: signersLayout.signers_band_width_mm,
          signers_font_size: signersTextStyle.signers_font_size,
          signers_text_color: signersTextStyle.signers_text_color,
          signers_font_weight: signersTextStyle.signers_font_weight,
          margin_left_mm: templateMargins.margin_left_mm,
          margin_right_mm: templateMargins.margin_right_mm,
          margin_top_mm: templateMargins.margin_top_mm,
          margin_bottom_mm: templateMargins.margin_bottom_mm,
        }),
      });

      if (!templateRes.ok) throw new Error("Ошибка при сохранении шаблона");
      const newTemplate = await templateRes.json();

      const PAGE_WIDTH_MM = 210;
      const PAGE_HEIGHT_MM = 297;

      const elementPromises = editorElements.map((el) =>
        fetch(`${API_BASE}/certificates/templates/${newTemplate.id}/elements`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: el.text,
            is_variable: el.text.includes("{"),
            x_mm: (el.x / 100) * PAGE_WIDTH_MM,
            y_mm: (el.y / 100) * PAGE_HEIGHT_MM,
            font_size: el.size,
            align: "center",
          }),
        })
      );

      await Promise.all(elementPromises);

      for (let i = 0; i < editorSigners.length; i++) {
        const s = editorSigners[i];
        let facsimile_url = null;
        if (s.facsimileFile) {
          const fd = new FormData();
          fd.append("file", s.facsimileFile);
          const facRes = await fetch(`${API_BASE}/certificates/upload-facsimile`, {
            method: "POST",
            body: fd,
          });
          if (!facRes.ok) throw new Error("Ошибка при загрузке факсимиле");
          const facData = await facRes.json();
          facsimile_url = facData.facsimile_url;
        }
        const sigRes = await fetch(
          `${API_BASE}/certificates/templates/${newTemplate.id}/signers`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              order: i + 1,
              position: (s.position || "").trim() || "—",
              full_name: (s.fullName || "").trim() || "—",
              facsimile_url,
              offset_y_mm: Number(s.offsetY) || 0,
              facsimile_offset_x_mm: Number(s.facsimileOffsetX) || 0,
              facsimile_offset_y_mm: Number(s.facsimileOffsetY) || 0,
              facsimile_scale: Math.min(3, Math.max(0.2, Number(s.facsimileScale) || 1)),
            }),
          }
        );
        if (!sigRes.ok) throw new Error("Ошибка при сохранении подписанта");
      }

      alert("Шаблон успешно сохранен!");
      await loadTemplates();
      setSelectedTemplateId(newTemplate.id);
      setActiveTab("generate");
      setGenMode("single");
    } catch (err) {
      console.error(err);
      alert(`Ошибка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = {
    background: "#fff",
    borderRadius: 20,
    padding: 40,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  };

  const gridGenerate = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
    gap: 32,
    alignItems: "start",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 40,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0F172A", margin: 0 }}>
              Админ-панель
            </h1>
            <p style={{ color: "#64748B", marginTop: 8, marginBottom: 0 }}>
              Генерация наградной продукции
            </p>
          </div>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              style={{
                padding: "12px 24px",
                background: "#fff",
                border: "1px solid #E2E8F0",
                borderRadius: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ← На главную
            </button>
          )}
        </div>

        <div
          style={{
            display: "flex",
            background: "#F1F5F9",
            borderRadius: 12,
            padding: 6,
            marginBottom: 32,
            width: "fit-content",
            flexWrap: "wrap",
          }}
        >
          <button type="button" onClick={() => setActiveTab("generate")} style={pillBtn(activeTab === "generate")}>
            Генерация
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("templates")}
            style={pillBtn(activeTab === "templates")}
          >
            Управление шаблонами
          </button>
        </div>

        {activeTab === "generate" && (
          <div style={gridGenerate}>
            <div style={cardStyle}>
              <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 24px" }}>Грамоты</h2>

              <div
                style={{
                  display: "flex",
                  background: "#EEF2FF",
                  borderRadius: 12,
                  padding: 4,
                  marginBottom: 28,
                  width: "100%",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setGenMode("single");
                    setMessage(null);
                  }}
                  style={{
                    ...pillBtn(genMode === "single"),
                    flex: 1,
                    background: genMode === "single" ? "#4338CA" : "transparent",
                    color: genMode === "single" ? "#fff" : "#475569",
                  }}
                >
                  Одиночный PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGenMode("batch");
                    setMessage(null);
                  }}
                  style={{
                    ...pillBtn(genMode === "batch"),
                    flex: 1,
                    background: genMode === "batch" ? "#4338CA" : "transparent",
                    color: genMode === "batch" ? "#fff" : "#475569",
                  }}
                >
                  Пакет из Excel
                </button>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label
                  style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#475569", fontSize: 14 }}
                >
                  Шаблон
                </label>
                <select
                  value={selectedTemplateId ?? ""}
                  onChange={(e) => setSelectedTemplateId(Number(e.target.value) || null)}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: 12,
                    border: "1px solid #E2E8F0",
                    fontSize: 16,
                    background: "#fff",
                  }}
                >
                  {templates.length === 0 ? (
                    <option value="">Нет шаблонов — создайте во вкладке «Управление»</option>
                  ) : (
                    <>
                      <option value="">— Выберите шаблон —</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              {genMode === "single" && (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <label
                      style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#475569", fontSize: 14 }}
                    >
                      ФИО получателя
                    </label>
                    <input
                      type="text"
                      value={variableFio}
                      onChange={(e) => setVariableFio(e.target.value)}
                      placeholder="Иванов Иван Иванович"
                      style={{
                        width: "100%",
                        padding: "14px",
                        borderRadius: 12,
                        border: "1px solid #E2E8F0",
                        fontSize: 16,
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label
                      style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#475569", fontSize: 14 }}
                    >
                      Дата (необязательно)
                    </label>
                    <input
                      type="text"
                      value={variableDate}
                      onChange={(e) => setVariableDate(e.target.value)}
                      placeholder="15 апреля 2026"
                      style={{
                        width: "100%",
                        padding: "14px",
                        borderRadius: 12,
                        border: "1px solid #E2E8F0",
                        fontSize: 16,
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </>
              )}

              <div style={{ marginBottom: 24 }}>
                <label
                  style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#475569", fontSize: 14 }}
                >
                  Название мероприятия
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Подставится в {Мероприятие} / {event}"
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: 12,
                    border: "1px solid #E2E8F0",
                    fontSize: 16,
                    boxSizing: "border-box",
                  }}
                />
                <p style={{ margin: "8px 0 0", fontSize: 12, color: "#94A3B8" }}>
                  {genMode === "batch"
                    ? "Одно и то же для всех строк из таблицы."
                    : "Подставляется в шаблон вместо плейсхолдера мероприятия."}
                </p>
              </div>

              {genMode === "single" && (
                <>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={loading || !selectedTemplateId || !eventName.trim() || !variableFio.trim()}
                    style={{
                      width: "100%",
                      marginTop: 8,
                      padding: "16px",
                      fontSize: 17,
                      fontWeight: 700,
                      background:
                        loading || !selectedTemplateId || !eventName.trim() || !variableFio.trim()
                          ? "#94A3B8"
                          : "#1D4ED8",
                      color: "#fff",
                      border: "none",
                      borderRadius: 12,
                      cursor:
                        loading || !selectedTemplateId || !eventName.trim() || !variableFio.trim()
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {loading ? "Генерация…" : "Сгенерировать PDF"}
                  </button>
                </>
              )}

              {genMode === "batch" && (
                <>
                  <label
                    style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#475569", fontSize: 14 }}
                  >
                    Таблица со списком ФИО
                  </label>
                  <div
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        batchInputRef.current?.click();
                      }
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setBatchDrag(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setBatchDrag(false);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      setBatchDrag(false);
                      const f = e.dataTransfer.files?.[0];
                      pickBatchFile(f);
                    }}
                    onClick={() => batchInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${batchDrag ? "#4338CA" : "#CBD5E1"}`,
                      borderRadius: 16,
                      padding: "28px 20px",
                      textAlign: "center",
                      cursor: "pointer",
                      background: batchDrag ? "#EEF2FF" : "#F8FAFC",
                      marginBottom: 12,
                      transition: "border-color 0.15s, background 0.15s",
                    }}
                  >
                    <input
                      ref={batchInputRef}
                      type="file"
                      accept=".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      style={{ display: "none" }}
                      onChange={(e) => pickBatchFile(e.target.files?.[0])}
                    />
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                      {batchFile ? batchFile.name : "Перетащите .xlsx сюда или нажмите для выбора"}
                    </div>
                    <div style={{ fontSize: 13, color: "#64748B" }}>
                      Столбец с заголовком «ФИО» (или FIO, Участник). До 500 строк за раз.
                    </div>
                  </div>
                  {batchFile && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBatchFile(null);
                        if (batchInputRef.current) batchInputRef.current.value = "";
                      }}
                      style={{
                        marginBottom: 16,
                        padding: "6px 12px",
                        fontSize: 13,
                        background: "transparent",
                        border: "1px solid #E2E8F0",
                        borderRadius: 8,
                        cursor: "pointer",
                        color: "#64748B",
                      }}
                    >
                      Сбросить файл
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleBatchGenerate}
                    disabled={loading || !selectedTemplateId || !batchFile}
                    style={{
                      width: "100%",
                      padding: "16px",
                      fontSize: 17,
                      fontWeight: 700,
                      background:
                        loading || !selectedTemplateId || !batchFile ? "#94A3B8" : "#059669",
                      color: "#fff",
                      border: "none",
                      borderRadius: 12,
                      cursor:
                        loading || !selectedTemplateId || !batchFile ? "not-allowed" : "pointer",
                    }}
                  >
                    {loading ? "Формирование архива…" : "Скачать ZIP с грамотами"}
                  </button>
                </>
              )}

              {message && <AlertBanner type={messageType}>{message}</AlertBanner>}
            </div>

            <div style={cardStyle}>
              <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 20, fontWeight: 700 }}>
                {genMode === "single" ? "Предпросмотр" : "Подсказка"}
              </h3>
              {genMode === "single" ? (
                generatedFileUrl ? (
                  <div>
                    <div
                      style={{
                        marginBottom: 24,
                        border: "1px solid #E2E8F0",
                        borderRadius: 12,
                        overflow: "hidden",
                        background: "#F8FAFC",
                      }}
                    >
                      <iframe
                        src={fullUrl}
                        style={{ width: "100%", height: "min(520px, 70vh)", border: "none", minHeight: 360 }}
                        title="Предпросмотр сертификата"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleDownload}
                      style={{
                        width: "100%",
                        padding: "16px",
                        background: "#334155",
                        color: "#fff",
                        border: "none",
                        borderRadius: 12,
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: 16,
                      }}
                    >
                      Скачать PDF
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      minHeight: 360,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#94A3B8",
                      fontSize: 15,
                      textAlign: "center",
                      padding: 24,
                      border: "2px dashed #CBD5E1",
                      borderRadius: 16,
                      lineHeight: 1.5,
                    }}
                  >
                    Сгенерируйте PDF — здесь появится предпросмотр и кнопка скачивания
                  </div>
                )
              ) : (
                <div
                  style={{
                    fontSize: 14,
                    color: "#475569",
                    lineHeight: 1.65,
                    padding: "4px 0",
                  }}
                >
                  <ol style={{ margin: 0, paddingLeft: 20 }}>
                    <li style={{ marginBottom: 10 }}>Создайте в Excel первый лист со списком участников.</li>
                    <li style={{ marginBottom: 10 }}>
                      В первой строке укажите заголовок столбца, например <strong>ФИО</strong>.
                    </li>
                    <li style={{ marginBottom: 10 }}>Укажите шаблон и название мероприятия — они будут одинаковы для всех грамот.</li>
                    <li>Нажмите «Скачать ZIP» — в архиве будет по одному PDF на каждую строку.</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "templates" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
              gap: 32,
            }}
          >
            <div style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 24,
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Конструктор</h2>
                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  disabled={loading}
                  style={{
                    padding: "10px 20px",
                    background: loading ? "#94A3B8" : "#10B981",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  Сохранить шаблон
                </button>
              </div>

              <div style={{ background: "#F8FAFC", padding: 20, borderRadius: 12, marginBottom: 24 }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                    Название шаблона
                  </label>
                  <input
                    type="text"
                    value={editorName}
                    onChange={(e) => setEditorName(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #CBD5E1", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                    Фон (изображение)
                  </label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleBgUpload}
                    style={{ width: "100%", padding: "8px", background: "#fff", borderRadius: 8, border: "1px solid #CBD5E1" }}
                  />
                </div>
              </div>

              <div
                style={{
                  background: "#FEF2F2",
                  padding: 20,
                  borderRadius: 12,
                  marginBottom: 24,
                  border: "1px solid #FECACA",
                }}
              >
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>
                  Поля грамоты (рабочая зона)
                </h3>
                <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 16px" }}>
                  Текст и подписи не выходят за эти отступы от краёв листа; в конструкторе блоки текста можно
                  двигать только внутри красной рамки в предпросмотре.
                </p>
                <div style={{ display: "grid", gap: 12 }}>
                  {[
                    ["margin_left_mm", "Слева", 0, 70],
                    ["margin_right_mm", "Справа", 0, 70],
                    ["margin_top_mm", "Сверху", 0, 100],
                    ["margin_bottom_mm", "Снизу", 0, 100],
                  ].map(([key, label, lo, hi]) => (
                    <label key={key} style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                      {label}: {templateMargins[key]} мм
                      <input
                        type="range"
                        min={lo}
                        max={hi}
                        value={templateMargins[key]}
                        onChange={(e) =>
                          setTemplateMargins((p) => ({ ...p, [key]: Number(e.target.value) }))
                        }
                        style={{ width: "100%", marginTop: 6 }}
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div
                style={{
                  background: "#F0FDF4",
                  padding: 20,
                  borderRadius: 12,
                  marginBottom: 24,
                  border: "1px solid #BBF7D0",
                }}
              >
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>
                  Положение блока подписей
                </h3>
                <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 16px" }}>
                  Координаты в мм (лист А4: 210×297). Центр блока — середина полосы подписей по горизонтали.
                </p>
                <div style={{ display: "grid", gap: 14 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                    Верх первой строки от верха листа: {signersLayout.signers_y_mm} мм
                    <input
                      type="range"
                      min={0}
                      max={297}
                      value={signersLayout.signers_y_mm}
                      onChange={(e) =>
                        setSignersLayout((p) => ({ ...p, signers_y_mm: Number(e.target.value) }))
                      }
                      style={{ width: "100%", marginTop: 6 }}
                    />
                  </label>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                    Центр блока по X: {signersLayout.signers_block_x_mm} мм
                    <input
                      type="range"
                      min={0}
                      max={210}
                      value={signersLayout.signers_block_x_mm}
                      onChange={(e) =>
                        setSignersLayout((p) => ({ ...p, signers_block_x_mm: Number(e.target.value) }))
                      }
                      style={{ width: "100%", marginTop: 6 }}
                    />
                  </label>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                    Высота строки подписанта: {signersLayout.signers_row_height_mm} мм
                    <input
                      type="range"
                      min={10}
                      max={160}
                      value={signersLayout.signers_row_height_mm}
                      onChange={(e) =>
                        setSignersLayout((p) => ({ ...p, signers_row_height_mm: Number(e.target.value) }))
                      }
                      style={{ width: "100%", marginTop: 6 }}
                    />
                  </label>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                    Ширина полосы подписей: {signersLayout.signers_band_width_mm} мм
                    <input
                      type="range"
                      min={25}
                      max={210}
                      value={signersLayout.signers_band_width_mm}
                      onChange={(e) =>
                        setSignersLayout((p) => ({ ...p, signers_band_width_mm: Number(e.target.value) }))
                      }
                      style={{ width: "100%", marginTop: 6 }}
                    />
                  </label>
                </div>
              </div>

              <div
                style={{
                  background: "#EFF6FF",
                  padding: 20,
                  borderRadius: 12,
                  marginBottom: 24,
                  border: "1px solid #BFDBFE",
                }}
              >
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>
                  Шрифт подписей (должность и ФИО)
                </h3>
                <div style={{ display: "grid", gap: 14 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                    Размер (макс., мм подгоняется автоматически): {signersTextStyle.signers_font_size} pt
                    <input
                      type="range"
                      min={5}
                      max={28}
                      step={0.5}
                      value={signersTextStyle.signers_font_size}
                      onChange={(e) =>
                        setSignersTextStyle((p) => ({
                          ...p,
                          signers_font_size: Number(e.target.value),
                        }))
                      }
                      style={{ width: "100%", marginTop: 6 }}
                    />
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                      Цвет
                      <input
                        type="color"
                        value={signersTextStyle.signers_text_color}
                        onChange={(e) =>
                          setSignersTextStyle((p) => ({ ...p, signers_text_color: e.target.value }))
                        }
                        style={{
                          display: "block",
                          marginTop: 6,
                          width: 52,
                          height: 36,
                          border: "1px solid #CBD5E1",
                          borderRadius: 8,
                          cursor: "pointer",
                        }}
                      />
                    </label>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", flex: "1 1 160px" }}>
                      Начертание
                      <select
                        value={signersTextStyle.signers_font_weight}
                        onChange={(e) =>
                          setSignersTextStyle((p) => ({
                            ...p,
                            signers_font_weight: e.target.value,
                          }))
                        }
                        style={{
                          display: "block",
                          marginTop: 6,
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: "1px solid #CBD5E1",
                        }}
                      >
                        <option value="400">Обычный (400)</option>
                        <option value="500">Средний (500)</option>
                        <option value="600">Полужирный (600)</option>
                        <option value="700">Жирный (700)</option>
                        <option value="800">Очень жирный (800)</option>
                      </select>
                    </label>
                  </div>
                  <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>
                    Жирное начертание для кириллицы — при наличии файла DejaVuSans-Bold.ttf в static/fonts.
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                    Подписанты и факсимиле
                  </h3>
                  <button
                    type="button"
                    onClick={addSigner}
                    style={{
                      padding: "6px 12px",
                      background: "#DCFCE7",
                      color: "#166534",
                      border: "1px solid #86EFAC",
                      borderRadius: 8,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: 14,
                    }}
                  >
                    + Ещё подпись
                  </button>
                </div>
                <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 12px" }}>
                  Слева — должность, по центру — изображение подписи/печати, справа — ФИО. Можно добавить
                  несколько строк (например, директор и завуч).
                </p>
                {editorSigners.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      border: "1px solid #E2E8F0",
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 12,
                      background: "#FAFAFA",
                      position: "relative",
                    }}
                  >
                    {editorSigners.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSigner(s.id)}
                        style={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          background: "#FEE2E2",
                          color: "#DC2626",
                          border: "none",
                          borderRadius: 6,
                          padding: "4px 10px",
                          fontSize: 12,
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        Удалить
                      </button>
                    )}
                    <div style={{ marginBottom: 10, paddingRight: editorSigners.length > 1 ? 72 : 0 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>
                        Должность (слева)
                      </label>
                      <input
                        type="text"
                        value={s.position}
                        onChange={(e) => updateSigner(s.id, "position", e.target.value)}
                        placeholder="Директор"
                        style={{
                          width: "100%",
                          marginTop: 4,
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: "1px solid #CBD5E1",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>
                        ФИО (справа)
                      </label>
                      <input
                        type="text"
                        value={s.fullName}
                        onChange={(e) => updateSigner(s.id, "fullName", e.target.value)}
                        placeholder="Иванов Иван Иванович"
                        style={{
                          width: "100%",
                          marginTop: 4,
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: "1px solid #CBD5E1",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>
                        Факсимиле (PNG, JPG)
                      </label>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => handleSignerFacsimile(s.id, e)}
                        style={{
                          width: "100%",
                          marginTop: 4,
                          padding: "6px",
                          background: "#fff",
                          borderRadius: 8,
                          border: "1px solid #CBD5E1",
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>
                        Сдвиг факсимиле вправо: {s.facsimileOffsetX} мм
                      </label>
                      <input
                        type="range"
                        min={-40}
                        max={40}
                        value={s.facsimileOffsetX}
                        onChange={(e) =>
                          updateSigner(s.id, "facsimileOffsetX", Number(e.target.value))
                        }
                        style={{ width: "100%", marginTop: 6 }}
                      />
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>
                        Сдвиг факсимиле вниз: {s.facsimileOffsetY} мм
                      </label>
                      <input
                        type="range"
                        min={-40}
                        max={40}
                        value={s.facsimileOffsetY}
                        onChange={(e) =>
                          updateSigner(s.id, "facsimileOffsetY", Number(e.target.value))
                        }
                        style={{ width: "100%", marginTop: 6 }}
                      />
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>
                        Масштаб факсимиле: {s.facsimileScale.toFixed(2)}×
                      </label>
                      <input
                        type="range"
                        min={20}
                        max={300}
                        value={Math.round(s.facsimileScale * 100)}
                        onChange={(e) =>
                          updateSigner(s.id, "facsimileScale", Number(e.target.value) / 100)
                        }
                        style={{ width: "100%", marginTop: 6 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>
                        Сдвиг всей строки подписи вниз: {s.offsetY} мм
                      </label>
                      <input
                        type="range"
                        min={-120}
                        max={160}
                        value={s.offsetY}
                        onChange={(e) => updateSigner(s.id, "offsetY", Number(e.target.value))}
                        style={{ width: "100%", marginTop: 6 }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Текстовые блоки</h3>
                <button
                  type="button"
                  onClick={addTextElement}
                  style={{
                    padding: "6px 12px",
                    background: "#E0E7FF",
                    color: "#4338CA",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  + Добавить текст
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  maxHeight: "500px",
                  overflowY: "auto",
                  paddingRight: 8,
                }}
              >
                {editorElements.map((el) => (
                  <div
                    key={el.id}
                    style={{
                      background: "#fff",
                      border: "1px solid #E2E8F0",
                      borderRadius: 12,
                      padding: 16,
                      position: "relative",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => removeElement(el.id)}
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        background: "#FEE2E2",
                        color: "#EF4444",
                        border: "none",
                        borderRadius: 6,
                        width: 28,
                        height: 28,
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                      title="Удалить"
                    >
                      ×
                    </button>

                    <div style={{ marginBottom: 12, paddingRight: 32 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>
                        Текст (переменные: {"{ФИО}"}, {"{Мероприятие}"})
                      </label>
                      <textarea
                        value={el.text}
                        onChange={(e) => updateElement(el.id, "text", e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px",
                          borderRadius: 8,
                          border: "1px solid #CBD5E1",
                          marginTop: 4,
                          resize: "vertical",
                          minHeight: "60px",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    <div
                      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}
                    >
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>
                          Ось X: {el.x}% (внутри полей)
                        </label>
                        <input
                          type="range"
                          min={safePct.xMin}
                          max={safePct.xMax}
                          step={0.2}
                          value={Math.min(safePct.xMax, Math.max(safePct.xMin, el.x))}
                          onChange={(e) => updateElement(el.id, "x", Number(e.target.value))}
                          style={{ width: "100%" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>
                          Ось Y: {el.y}% (внутри полей)
                        </label>
                        <input
                          type="range"
                          min={safePct.yMin}
                          max={safePct.yMax}
                          step={0.2}
                          value={Math.min(safePct.yMax, Math.max(safePct.yMin, el.y))}
                          onChange={(e) => updateElement(el.id, "y", Number(e.target.value))}
                          style={{ width: "100%" }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>Размер</label>
                        <input
                          type="number"
                          value={el.size}
                          onChange={(e) => updateElement(el.id, "size", Number(e.target.value))}
                          style={{ width: "100%", padding: "6px", borderRadius: 6, border: "1px solid #CBD5E1", boxSizing: "border-box" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>Начертание</label>
                        <select
                          value={el.weight}
                          onChange={(e) => updateElement(el.id, "weight", e.target.value)}
                          style={{ width: "100%", padding: "6px", borderRadius: 6, border: "1px solid #CBD5E1" }}
                        >
                          <option value="400">Обычный</option>
                          <option value="600">Полужирный</option>
                          <option value="700">Жирный</option>
                          <option value="800">Очень жирный</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>Цвет</label>
                        <input
                          type="color"
                          value={el.color}
                          onChange={(e) => updateElement(el.id, "color", e.target.value)}
                          style={{
                            width: "100%",
                            height: 32,
                            padding: 0,
                            border: "none",
                            cursor: "pointer",
                            borderRadius: 6,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...cardStyle, display: "flex", flexDirection: "column" }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, marginTop: 0 }}>
                Предпросмотр шаблона
              </h3>

              <div
                style={{
                  flex: 1,
                  width: "100%",
                  minHeight: "500px",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "center",
                  background: "#F1F5F9",
                  borderRadius: 12,
                  padding: "20px",
                  overflow: "auto",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    maxWidth: "100%",
                    backgroundImage: editorBgUrl ? `url(${editorBgUrl})` : "none",
                    backgroundColor: editorBgUrl ? "transparent" : "#E2E8F0",
                    backgroundSize: "contain",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center top",
                    position: "relative",
                    borderRadius: 4,
                    boxShadow: editorBgUrl ? "0 4px 20px rgba(0,0,0,0.15)" : "none",
                    aspectRatio: "auto",
                  }}
                >
                  {editorBgUrl ? (
                    <img src={editorBgUrl} style={{ width: "100%", display: "block", visibility: "hidden" }} alt="" />
                  ) : (
                    <div
                      style={{
                        height: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#94A3B8",
                      }}
                    >
                      Загрузите фон
                    </div>
                  )}

                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
                    <div
                      style={{
                        position: "absolute",
                        left: `${(templateMargins.margin_left_mm / 210) * 100}%`,
                        right: `${(templateMargins.margin_right_mm / 210) * 100}%`,
                        top: `${(templateMargins.margin_top_mm / 297) * 100}%`,
                        bottom: `${(templateMargins.margin_bottom_mm / 297) * 100}%`,
                        border: "2px dashed rgba(220, 38, 38, 0.65)",
                        borderRadius: 4,
                        pointerEvents: "none",
                        zIndex: 0,
                        boxSizing: "border-box",
                      }}
                    />
                    {editorElements.map((el) => (
                      <div
                        key={el.id}
                        style={{
                          position: "absolute",
                          left: `${el.x}%`,
                          top: `${el.y}%`,
                          transform: "translate(-50%, -50%)",
                          fontSize: `${el.size}px`,
                          color: el.color,
                          fontWeight: el.weight,
                          whiteSpace: "pre-wrap",
                          textAlign: "center",
                          pointerEvents: "none",
                          lineHeight: 1.2,
                          zIndex: 1,
                        }}
                      >
                        {el.text}
                      </div>
                    ))}
                    {editorSigners.map((s, i) => {
                      const yMm =
                        signersLayout.signers_y_mm +
                        i * signersLayout.signers_row_height_mm +
                        (Number(s.offsetY) || 0);
                      const topPct = (yMm / 297) * 100;
                      const leftPct =
                        ((signersLayout.signers_block_x_mm - signersLayout.signers_band_width_mm / 2) /
                          210) *
                        100;
                      const widthPct = (signersLayout.signers_band_width_mm / 210) * 100;
                      const rowHPct = Math.max((signersLayout.signers_row_height_mm / 297) * 100, 3.5);
                      const prevSize = Math.min(
                        13,
                        Math.max(7, signersTextStyle.signers_font_size * 0.85)
                      );
                      return (
                        <div
                          key={s.id}
                          style={{
                            position: "absolute",
                            top: `${topPct}%`,
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                            minHeight: `${rowHPct}%`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: `${prevSize}px`,
                            color: signersTextStyle.signers_text_color,
                            fontWeight: signersTextStyle.signers_font_weight,
                            pointerEvents: "none",
                            boxSizing: "border-box",
                            padding: "2px 4px",
                            borderTop: "1px dashed rgba(99, 102, 241, 0.45)",
                            zIndex: 1,
                          }}
                        >
                          <span
                            style={{
                              flex: "0 0 38%",
                              textAlign: "right",
                              paddingRight: 4,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {s.position}
                          </span>
                          <span
                            style={{
                              flex: "0 0 24%",
                              textAlign: "center",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              maxHeight: "95%",
                            }}
                          >
                            {s.facsimilePreview ? (
                              <img
                                src={s.facsimilePreview}
                                alt=""
                                style={{
                                  maxHeight: 36 * (s.facsimileScale || 1),
                                  maxWidth: "100%",
                                  objectFit: "contain",
                                  transform: `translate(${Number(s.facsimileOffsetX) * 0.4}px, ${-Number(s.facsimileOffsetY) * 0.4}px)`,
                                }}
                              />
                            ) : (
                              <span style={{ opacity: 0.35, fontSize: 14 }}>✒</span>
                            )}
                          </span>
                          <span
                            style={{
                              flex: "0 0 38%",
                              textAlign: "left",
                              paddingLeft: 4,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {s.fullName || "ФИО"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 16, textAlign: "center", marginBottom: 0 }}>
                Красная пунктирная рамка — рабочая зона (поля грамоты). Текст в PDF не выходит за неё.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
