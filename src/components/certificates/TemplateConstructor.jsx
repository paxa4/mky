/**
 * TemplateConstructor — полный конструктор шаблонов.
 * Левая панель: настройки (скроллируется).
 * Правая панель: sticky-превью (всегда видно).
 *
 * Возможности:
 * - Загрузка существующего шаблона для редактирования
 * - Создание нового шаблона
 * - Атомарное сохранение (PUT /templates/{id}/full или POST /templates)
 * - Визуальные предупреждения вместо жёстких ограничений
 * - Containment Logic: умное выравнивание текста по краям рабочей зоны
 */
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { API_BASE } from "../../constants/index.js";
import AlertBanner from "./shared/AlertBanner.jsx";
import { cardStyle, inputStyle, labelStyle, sectionBox, dangerBtn } from "./shared/styles.js";
import AccuratePreview from "./shared/AccuratePreview.jsx";

const PAGE_W = 210; // мм
const PAGE_H = 297; // мм

// ── Утилиты ───────────────────────────────────────────────────────────────────

const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

const smartAlign = (xPct, xMin, xMax) => {
  const range = xMax - xMin;
  if (range <= 0) return "center";
  const rel = (xPct - xMin) / range;
  if (rel < 0.33) return "left";
  if (rel > 0.67) return "right";
  return "center";
};

// ── Компонент ─────────────────────────────────────────────────────────────────

export default function TemplateConstructor({ templates, onTemplatesSaved }) {
  // Режим: "new" | "edit"
  const [mode, setMode] = useState("new");
  const [editingId, setEditingId] = useState(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  // Метаданные шаблона
  const [name, setName] = useState("Новый шаблон");
  const [bgUrl, setBgUrl] = useState(null);       // URL уже загруженного фона
  const [bgFile, setBgFile] = useState(null);     // Файл для загрузки

  // Поля грамоты
  const [margins, setMargins] = useState({ left: 12, right: 12, top: 12, bottom: 12 });

  // Блок подписантов
  const [signersLayout, setSignersLayout] = useState({
    y_mm: 248, x_mm: 105, row_h_mm: 32, band_mm: 168,
    font_size: 10, text_color: "#1e293b", font_weight: "400",
  });

  // Текстовые элементы
  const [elements, setElements] = useState([
    { id: 1, text: "Сертификат", x: 50, y: 14, size: 48, color: "#0F172A", weight: "700" },
    { id: 2, text: "награждается", x: 50, y: 24, size: 22, color: "#64748B", weight: "400" },
    { id: 3, text: "{ФИО}", x: 50, y: 38, size: 38, color: "#1D4ED8", weight: "700" },
    { id: 4, text: "за участие в {Мероприятие}", x: 50, y: 54, size: 18, color: "#475569", weight: "400" },
  ]);

  // Подписанты
  const [signers, setSigners] = useState([{
    id: "s1", position: "Директор", fullName: "",
    facFile: null, facPreview: null,
    offsetY: 0, facOffsetX: 0, facOffsetY: 0, facScale: 1,
  }]);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState("info");
  const [previewPinned, setPreviewPinned] = useState(false);
  const [previewBottomLocked, setPreviewBottomLocked] = useState(false);
  const [previewWidth, setPreviewWidth] = useState(0);

  const bgInputRef = useRef(null);
  const layoutRef = useRef(null);
  const previewColRef = useRef(null);
  const previewCardRef = useRef(null);

  // Вычисляем безопасную зону в %
  const safePct = useMemo(() => ({
    xMin: (margins.left / PAGE_W) * 100,
    xMax: ((PAGE_W - margins.right) / PAGE_W) * 100,
    yMin: (margins.top / PAGE_H) * 100,
    yMax: ((PAGE_H - margins.bottom) / PAGE_H) * 100,
  }), [margins]);

  // Фиксация предпросмотра при скролле
  useEffect(() => {
    const updatePreviewPosition = () => {
      const layoutEl = layoutRef.current;
      const previewColEl = previewColRef.current;
      const previewCardEl = previewCardRef.current;
      if (!layoutEl || !previewColEl || !previewCardEl) return;

      const topOffset = 20;
      const layoutRect = layoutEl.getBoundingClientRect();
      const colRect = previewColEl.getBoundingClientRect();
      const cardHeight = previewCardEl.offsetHeight;
      const shouldPin = window.innerWidth >= 1100 && layoutRect.top <= topOffset;
      const shouldLockBottom = shouldPin && layoutRect.bottom <= cardHeight + topOffset;

      setPreviewPinned(shouldPin && !shouldLockBottom);
      setPreviewBottomLocked(shouldLockBottom);
      setPreviewWidth(colRect.width);
    };

    updatePreviewPosition();
    window.addEventListener("scroll", updatePreviewPosition, { passive: true });
    window.addEventListener("resize", updatePreviewPosition);
    return () => {
      window.removeEventListener("scroll", updatePreviewPosition);
      window.removeEventListener("resize", updatePreviewPosition);
    };
  }, []);

  // ── Загрузка шаблона для редактирования ──────────────────────────────────
  const loadTemplate = useCallback(async (id) => {
    if (!id) { resetToNew(); return; }
    setLoadingTemplate(true);
    try {
      const res = await fetch(`${API_BASE}/certificates/templates/${id}/full`);
      if (!res.ok) throw new Error("Не удалось загрузить шаблон");
      const data = await res.json();
      const t = data.template;

      setMode("edit");
      setEditingId(id);
      setName(t.name);
      setBgUrl(t.background_url ? `${API_BASE}${t.background_url}` : null);
      setBgFile(null);
      setMargins({ left: t.margin_left_mm, right: t.margin_right_mm, top: t.margin_top_mm, bottom: t.margin_bottom_mm });
      setSignersLayout({
        y_mm: t.signers_y_mm, x_mm: t.signers_block_x_mm,
        row_h_mm: t.signers_row_height_mm, band_mm: t.signers_band_width_mm,
        font_size: t.signers_font_size, text_color: t.signers_text_color,
        font_weight: t.signers_font_weight,
      });

      // Конвертируем элементы из мм в %
      setElements(data.elements.map((el, i) => ({
        id: el.id || i + 1,
        text: el.text,
        x: (el.x_mm / PAGE_W) * 100,
        y: (el.y_mm / PAGE_H) * 100,
        size: el.font_size,
        color: "#0F172A",
        weight: "400",
        align: el.align,
        maxWidthMm: el.max_width_mm,
      })));

      setSigners(data.signers.length > 0 ? data.signers.map((s) => ({
        id: s.id,
        position: s.position,
        fullName: s.full_name,
        facFile: null,
        facPreview: s.facsimile_url ? `${API_BASE}${s.facsimile_url}` : null,
        facUrl: s.facsimile_url,
        offsetY: s.offset_y_mm,
        facOffsetX: s.facsimile_offset_x_mm,
        facOffsetY: s.facsimile_offset_y_mm,
        facScale: s.facsimile_scale,
      })) : [{
        id: "s1", position: "Директор", fullName: "",
        facFile: null, facPreview: null, offsetY: 0, facOffsetX: 0, facOffsetY: 0, facScale: 1,
      }]);

      setMsg(null);
    } catch (e) {
      setMsg(e.message); setMsgType("error");
    } finally {
      setLoadingTemplate(false);
    }
  }, []);

  const resetToNew = () => {
    setMode("new"); setEditingId(null);
    setName("Новый шаблон"); setBgUrl(null); setBgFile(null);
    setMargins({ left: 12, right: 12, top: 12, bottom: 12 });
    setSignersLayout({ y_mm: 248, x_mm: 105, row_h_mm: 32, band_mm: 168, font_size: 10, text_color: "#1e293b", font_weight: "400" });
    setElements([
      { id: 1, text: "Сертификат", x: 50, y: 14, size: 48, color: "#0F172A", weight: "700" },
      { id: 2, text: "награждается", x: 50, y: 24, size: 22, color: "#64748B", weight: "400" },
      { id: 3, text: "{ФИО}", x: 50, y: 38, size: 38, color: "#1D4ED8", weight: "700" },
      { id: 4, text: "за участие в {Мероприятие}", x: 50, y: 54, size: 18, color: "#475569", weight: "400" },
    ]);
    setSigners([{ id: "s1", position: "Директор", fullName: "", facFile: null, facPreview: null, offsetY: 0, facOffsetX: 0, facOffsetY: 0, facScale: 1 }]);
    setMsg(null);
  };

  const handleDeleteTemplate = async () => {
    if (!editingId) return;
    if (!window.confirm(`Удалить шаблон «${name}»? Это действие нельзя отменить.`)) return;

    setLoadingTemplate(true);
    setMsg(null);
    try {
      const res = await fetch(`${API_BASE}/certificates/templates/${editingId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Не удалось удалить шаблон");

      resetToNew();
      setMsg("Шаблон удалён");
      setMsgType("success");
      onTemplatesSaved?.();
    } catch (e) {
      setMsg(e.message || "Не удалось удалить шаблон");
      setMsgType("error");
    } finally {
      setLoadingTemplate(false);
    }
  };

  // ── Элементы ──────────────────────────────────────────────────────────────
  const addElement = () => {
    const newId = Math.max(0, ...elements.map((e) => e.id)) + 1;
    const cx = (safePct.xMin + safePct.xMax) / 2;
    const cy = (safePct.yMin + safePct.yMax) / 2;
    setElements((prev) => [...prev, { id: newId, text: "Новый текст", x: cx, y: cy, size: 24, color: "#000000", weight: "400", maxWidthMm: null }]);
  };
  const updateEl = (id, field, val) => setElements((prev) => prev.map((e) => e.id === id ? { ...e, [field]: val } : e));
  const removeEl = (id) => setElements((prev) => prev.filter((e) => e.id !== id));

  // ── Подписанты ────────────────────────────────────────────────────────────
  const addSigner = () => {
    if (signers.length >= 3) return;
    setSigners((prev) => [...prev, { id: `s_${Date.now()}`, position: "Должность", fullName: "", facFile: null, facPreview: null, offsetY: 0, facOffsetX: 0, facOffsetY: 0, facScale: 1 }]);
  };
  const updateSigner = (id, field, val) => setSigners((prev) => prev.map((s) => s.id === id ? { ...s, [field]: val } : s));
  const removeSigner = (id) => setSigners((prev) => prev.length > 1 ? prev.filter((s) => s.id !== id) : prev);
  const handleFacsimile = (id, e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const preview = URL.createObjectURL(file);
    setSigners((prev) => prev.map((s) => {
      if (s.id !== id) return s;
      if (s.facPreview && s.facFile) URL.revokeObjectURL(s.facPreview);
      return { ...s, facFile: file, facPreview: preview };
    }));
  };

  // ── Сохранение ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!bgUrl && !bgFile) { setMsg("Выберите фон для шаблона"); setMsgType("error"); return; }
    setSaving(true); setMsg(null);
    try {
      // 1. Загружаем фон если новый файл
      let finalBgUrl = bgUrl?.startsWith("blob:") || bgFile ? null : (bgUrl?.replace(API_BASE, "") || null);
      if (bgFile) {
        const fd = new FormData(); fd.append("file", bgFile);
        const r = await fetch(`${API_BASE}/certificates/upload-background`, { method: "POST", body: fd });
        if (!r.ok) throw new Error("Ошибка загрузки фона");
        finalBgUrl = (await r.json()).background_url;
      }

      // 2. Загружаем факсимиле для новых подписантов
      const signersData = [];
      for (let i = 0; i < Math.min(signers.length, 3); i++) {
        const s = signers[i];
        let facUrl = s.facUrl || null;
        if (s.facFile) {
          const fd = new FormData(); fd.append("file", s.facFile);
          const r = await fetch(`${API_BASE}/certificates/upload-facsimile`, { method: "POST", body: fd });
          if (!r.ok) throw new Error("Ошибка загрузки факсимиле");
          facUrl = (await r.json()).facsimile_url;
        }
        signersData.push({
          order: i + 1,
          position: (s.position || "").trim() || "—",
          full_name: (s.fullName || "").trim() || "—",
          facsimile_url: facUrl,
          offset_y_mm: Number(s.offsetY) || 0,
          facsimile_offset_x_mm: Number(s.facOffsetX) || 0,
          facsimile_offset_y_mm: Number(s.facOffsetY) || 0,
          facsimile_scale: Math.min(5, Math.max(0.1, Number(s.facScale) || 1)),
        });
      }

      // 3. Конвертируем элементы из % в мм
      const elementsData = elements.map((el) => {
        const align = el.align || smartAlign(el.x, safePct.xMin, safePct.xMax);
        return {
          text: el.text,
          is_variable: el.text.includes("{"),
          x_mm: (el.x / 100) * PAGE_W,
          y_mm: (el.y / 100) * PAGE_H,
          font_size: el.size,
          align,
          max_width_mm: el.maxWidthMm ? Number(el.maxWidthMm) : null,
        };
      });

      const payload = {
        name, background_url: finalBgUrl,
        signers_y_mm: signersLayout.y_mm, signers_block_x_mm: signersLayout.x_mm,
        signers_row_height_mm: signersLayout.row_h_mm, signers_band_width_mm: signersLayout.band_mm,
        signers_font_size: signersLayout.font_size, signers_text_color: signersLayout.text_color,
        signers_font_weight: signersLayout.font_weight,
        margin_left_mm: margins.left, margin_right_mm: margins.right,
        margin_top_mm: margins.top, margin_bottom_mm: margins.bottom,
        elements: elementsData, signers: signersData,
      };

      let res;
      if (mode === "edit" && editingId) {
        // Атомарное обновление
        res = await fetch(`${API_BASE}/certificates/templates/${editingId}/full`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
      } else {
        // Создание нового шаблона
        res = await fetch(`${API_BASE}/certificates/templates`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, elements: undefined, signers: undefined }),
        });
        if (res.ok) {
          const newT = await res.json();
          // Добавляем элементы и подписантов
          await Promise.all(elementsData.map((el) =>
            fetch(`${API_BASE}/certificates/templates/${newT.id}/elements`, {
              method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(el),
            })
          ));
          for (const s of signersData) {
            await fetch(`${API_BASE}/certificates/templates/${newT.id}/signers`, {
              method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s),
            });
          }
          setMode("edit"); setEditingId(newT.id);
          setMsg("Шаблон создан и сохранён!"); setMsgType("success");
          onTemplatesSaved?.();
          return;
        }
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Ошибка сохранения");
      }
      setMsg(mode === "edit" ? "Шаблон обновлён!" : "Шаблон сохранён!"); setMsgType("success");
      onTemplatesSaved?.();
    } catch (e) {
      setMsg(e.message); setMsgType("error");
    } finally {
      setSaving(false);
    }
  };

  // ── Рендер ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={layoutRef}
      style={{ display: "grid", gridTemplateColumns: "minmax(380px, 1fr) minmax(360px, 560px)", gap: 40, alignItems: "start" }}
    >

      {/* ═══ ЛЕВАЯ ПАНЕЛЬ — настройки (скроллируется) ═══ */}
      <div>

        {/* Выбор шаблона для редактирования */}
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0F172A" }}>
              {mode === "edit" ? "Редактирование шаблона" : "Новый шаблон"}
            </h2>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "10px 20px", background: saving ? "#CBD5E1" : "#10B981",
                color: "#fff", border: "none", borderRadius: 10,
                fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 14,
              }}
            >
              {saving ? "Сохранение…" : mode === "edit" ? "Сохранить изменения" : "Сохранить шаблон"}
            </button>
          </div>

          {/* Библиотека шаблонов */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Загрузить существующий шаблон для редактирования</label>
            <div style={{ display: "flex", gap: 8 }}>
              <select
                disabled={loadingTemplate}
                onChange={(e) => loadTemplate(Number(e.target.value) || null)}
                value={editingId ?? ""}
                style={{ ...inputStyle, flex: 1, background: "#fff" }}
              >
                <option value="">— Создать новый —</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {mode === "edit" && (
                <>
                  <button type="button" onClick={resetToNew}
                    style={{ padding: "0 16px", background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 10, cursor: "pointer", fontWeight: 600, color: "#475569", whiteSpace: "nowrap" }}>
                    + Новый
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteTemplate}
                    disabled={loadingTemplate}
                    style={{ padding: "0 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, cursor: loadingTemplate ? "not-allowed" : "pointer", fontWeight: 700, color: "#B91C1C", whiteSpace: "nowrap", opacity: loadingTemplate ? 0.7 : 1 }}>
                    Удалить
                  </button>
                </>
              )}
            </div>
            {loadingTemplate && <div style={{ fontSize: 14, color: "#94A3B8", marginTop: 6 }}>Загрузка шаблона…</div>}
          </div>

          {/* Миниатюры шаблонов */}
          {templates.length > 0 && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
              {templates.map((t) => (
                <div
                  key={t.id}
                  onClick={() => loadTemplate(t.id)}
                  title={t.name}
                  style={{
                    width: 72, height: 100, borderRadius: 8, overflow: "hidden", cursor: "pointer",
                    border: editingId === t.id ? "3px solid #1D4ED8" : "2px solid #E2E8F0",
                    background: "#F1F5F9", flexShrink: 0, position: "relative",
                    transition: "border-color 0.15s, transform 0.1s",
                    transform: editingId === t.id ? "scale(1.05)" : "scale(1)",
                  }}
                >
                  {t.background_url ? (
                    <img src={`${API_BASE}${t.background_url}`} alt={t.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📄</div>
                  )}
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    background: "rgba(0,0,0,0.55)", color: "#fff",
                    fontSize: 9, padding: "3px 4px", textAlign: "center",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{t.name}</div>
                </div>
              ))}
            </div>
          )}

          {msg && <AlertBanner type={msgType}>{msg}</AlertBanner>}
        </div>

        {/* Основные настройки */}
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Название шаблона</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Фон (PNG, JPG)</label>
            <div
              onClick={() => bgInputRef.current?.click()}
              style={{
                border: `2px dashed ${bgUrl ? "#059669" : "#CBD5E1"}`,
                borderRadius: 12, padding: "20px", textAlign: "center",
                cursor: "pointer", background: bgUrl ? "#F0FDF4" : "#F8FAFC",
              }}
            >
              <input ref={bgInputRef} type="file" accept="image/png,image/jpeg" style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { setBgFile(f); setBgUrl(URL.createObjectURL(f)); }
                }} />
              {bgUrl ? (
                <div style={{ fontSize: 14, color: "#059669", fontWeight: 600 }}>✅ Фон загружен — нажмите для замены</div>
              ) : (
                <div style={{ fontSize: 14, color: "#64748B" }}>📁 Нажмите для выбора фона</div>
              )}
            </div>
          </div>
        </div>

        {/* Поля грамоты */}
        <div style={{ ...sectionBox("#FEF2F2", "#FECACA"), marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700 }}>Поля грамоты (рабочая зона)</h3>
          <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 14px" }}>
            Текстовые блоки автоматически удерживаются внутри рабочей зоны.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[["left", "Слева"], ["right", "Справа"], ["top", "Сверху"], ["bottom", "Снизу"]].map(([k, label]) => (
              <label key={k} style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>
                {label}: {margins[k]} мм
                <input
                  type="range"
                  min={0}
                  max={120}
                  value={margins[k]}
                  onChange={(e) => setMargins((p) => ({ ...p, [k]: Number(e.target.value) }))}
                  style={{ width: "100%", marginTop: 4 }}
                />
              </label>
            ))}
          </div>
        </div>

        {/* Блок подписей */}
        <div style={{ ...sectionBox("#F0FDF4", "#BBF7D0"), marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700 }}>Блок подписей</h3>
          <div style={{ display: "grid", gap: 12 }}>
            {[
              ["y_mm", "Верх первой строки от верха листа", -50, 350],
              ["x_mm", "Центр блока по X", -50, 300],
              ["row_h_mm", "Высота строки подписанта", 5, 200],
              ["band_mm", "Ширина полосы подписей", 10, 280],
            ].map(([k, label, lo, hi]) => (
              <label key={k} style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>
                {label}: {signersLayout[k]} мм
                <input
                  type="range"
                  min={lo}
                  max={hi}
                  value={signersLayout[k]}
                  onChange={(e) => setSignersLayout((p) => ({ ...p, [k]: Number(e.target.value) }))}
                  style={{ width: "100%", marginTop: 4 }}
                />
              </label>
            ))}

            <label style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>
              Размер: {signersLayout.font_size} pt
              <input
                type="range"
                min={5}
                max={72}
                step={0.5}
                value={signersLayout.font_size}
                onChange={(e) => setSignersLayout((p) => ({ ...p, font_size: Number(e.target.value) }))}
                style={{ width: "100%", marginTop: 4 }}
              />
            </label>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>
                Цвет
                <input
                  type="color"
                  value={signersLayout.text_color}
                  onChange={(e) => setSignersLayout((p) => ({ ...p, text_color: e.target.value }))}
                  style={{ display: "block", marginTop: 4, width: 52, height: 36, borderRadius: 8, border: "1px solid #CBD5E1", cursor: "pointer" }}
                />
              </label>
              <label style={{ fontSize: 14, fontWeight: 600, color: "#334155", flex: "1 1 140px" }}>
                Начертание
                <select
                  value={signersLayout.font_weight}
                  onChange={(e) => setSignersLayout((p) => ({ ...p, font_weight: e.target.value }))}
                  style={{ display: "block", marginTop: 4, width: "100%", padding: "8px", borderRadius: 8, border: "1px solid #CBD5E1" }}
                >
                  <option value="400">Обычный</option>
                  <option value="600">Полужирный</option>
                  <option value="700">Жирный</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        {/* Подписанты */}
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Подписанты (до 3)</h3>
            {signers.length < 3 && (
              <button type="button" onClick={addSigner}
                style={{ padding: "7px 16px", background: "#DCFCE7", color: "#166534", border: "1px solid #86EFAC", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
                + Добавить
              </button>
            )}
          </div>
          {signers.map((s, idx) => (
            <div key={s.id} style={{ border: "1px solid #E2E8F0", borderRadius: 12, padding: 14, marginBottom: 10, background: "#FAFAFA", position: "relative" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#475569", marginBottom: 10 }}>Подписант {idx + 1}</div>
              {signers.length > 1 && (
                <button type="button" onClick={() => removeSigner(s.id)}
                  style={{ ...dangerBtn, position: "absolute", top: 10, right: 10 }}>Удалить</button>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ ...labelStyle, fontSize: 14 }}>Должность</label>
                  <input type="text" value={s.position} onChange={(e) => updateSigner(s.id, "position", e.target.value)}
                    placeholder="Директор" style={{ ...inputStyle, padding: "10px 12px", fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: 14 }}>ФИО</label>
                  <input type="text" value={s.fullName} onChange={(e) => updateSigner(s.id, "fullName", e.target.value)}
                    placeholder="Иванов И.И." style={{ ...inputStyle, padding: "10px 12px", fontSize: 14 }} />
                </div>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={{ ...labelStyle, fontSize: 14 }}>Факсимиле (PNG с прозрачным фоном)</label>
                <input type="file" accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => handleFacsimile(s.id, e)}
                  style={{ width: "100%", padding: "6px", background: "#fff", borderRadius: 8, border: "1px solid #CBD5E1" }} />
                {s.facPreview && <img src={s.facPreview} alt="" style={{ marginTop: 6, maxHeight: 40, objectFit: "contain" }} />}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>
                  X факсимиле: {s.facOffsetX} мм
                  <input
                    type="range"
                    min={-150}
                    max={150}
                    value={s.facOffsetX}
                    onChange={(e) => updateSigner(s.id, "facOffsetX", Number(e.target.value))}
                    style={{ width: "100%", marginTop: 4 }}
                  />
                </label>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>
                  Y факсимиле: {s.facOffsetY} мм
                  <input
                    type="range"
                    min={-150}
                    max={150}
                    value={s.facOffsetY}
                    onChange={(e) => updateSigner(s.id, "facOffsetY", Number(e.target.value))}
                    style={{ width: "100%", marginTop: 4 }}
                  />
                </label>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>
                  Масштаб: {Number(s.facScale).toFixed(1)}x
                  <input
                    type="range"
                    min={0.1}
                    max={6}
                    step={0.1}
                    value={s.facScale}
                    onChange={(e) => updateSigner(s.id, "facScale", Number(e.target.value))}
                    style={{ width: "100%", marginTop: 4 }}
                  />
                </label>
              </div>
              <label style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>
                Сдвиг строки вниз: {s.offsetY} мм
                <input type="range" min={-150} max={200} value={s.offsetY}
                  onChange={(e) => updateSigner(s.id, "offsetY", Number(e.target.value))}
                  style={{ width: "100%", marginTop: 4 }} />
              </label>
            </div>
          ))}
        </div>

        {/* Текстовые блоки */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Текстовые блоки</h3>
            <button type="button" onClick={addElement}
              style={{ padding: "7px 16px", background: "#E0E7FF", color: "#4338CA", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
              + Добавить
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {elements.map((el) => (
              <div key={el.id} style={{
                background: "#fff",
                border: "1px solid #E2E8F0",
                borderRadius: 12, padding: 16, position: "relative",
              }}>
                <button type="button" onClick={() => removeEl(el.id)}
                  style={{ position: "absolute", top: 10, right: 10, background: "#FEE2E2", color: "#EF4444", border: "none", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontWeight: "bold", fontSize: 16 }}>
                  ×
                </button>
                <div style={{ marginBottom: 12, paddingRight: 36 }}>
                  <label style={{ ...labelStyle, fontSize: 14 }}>Текст</label>
                  <textarea value={el.text} onChange={(e) => updateEl(el.id, "text", e.target.value)}
                    style={{ ...inputStyle, padding: "10px", resize: "vertical", minHeight: 56, fontSize: 14 }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <label style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>
                    X: {el.x.toFixed(1)}%
                    <input type="range" min={0} max={100} step={0.5} value={el.x}
                      onChange={(e) => {
                        const clamped = clamp(Number(e.target.value), safePct.xMin, safePct.xMax);
                        updateEl(el.id, "x", clamped);
                      }}
                      style={{ width: "100%", marginTop: 4 }} />
                  </label>
                  <label style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>
                    Y: {el.y.toFixed(1)}%
                    <input type="range" min={0} max={100} step={0.5} value={el.y}
                      onChange={(e) => {
                        const clamped = clamp(Number(e.target.value), safePct.yMin, safePct.yMax);
                        updateEl(el.id, "y", clamped);
                      }}
                      style={{ width: "100%", marginTop: 4 }} />
                  </label>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>Размер (pt)</label>
                    <input type="number" min={6} max={120} value={el.size}
                      onChange={(e) => updateEl(el.id, "size", Number(e.target.value))}
                      style={{ ...inputStyle, padding: "8px 10px", fontSize: 14 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>Начертание</label>
                    <select value={el.weight} onChange={(e) => updateEl(el.id, "weight", e.target.value)}
                      style={{ ...inputStyle, padding: "8px 10px", fontSize: 14, background: "#fff" }}>
                      <option value="400">Обычный</option>
                      <option value="600">Полужирный</option>
                      <option value="700">Жирный</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>Цвет</label>
                    <input type="color" value={el.color} onChange={(e) => updateEl(el.id, "color", e.target.value)}
                      style={{ width: "100%", height: 38, padding: 0, border: "none", cursor: "pointer", borderRadius: 6 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ ПРАВАЯ ПАНЕЛЬ — Фиксированный Preview ═══
           Переключается между relative / fixed / absolute в зависимости от позиции скролла.
           layoutRef на внешнем grid-контейнере нужен для расчёта нижней границы. */}
      <div ref={previewColRef} style={{ position: "relative", alignSelf: "start", minHeight: 240 }}>
        <div
          ref={previewCardRef}
          style={{
            ...cardStyle,
            padding: 24,
            position: previewPinned ? "fixed" : previewBottomLocked ? "absolute" : "relative",
            top: previewPinned ? 20 : "auto",
            bottom: previewBottomLocked ? 0 : "auto",
            width: previewPinned ? `${previewWidth}px` : "auto",
            zIndex: 20,
          }}
        >
          <h3 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 700, color: "#0F172A" }}>
            Предпросмотр шаблона
          </h3>
          <AccuratePreview
            bgUrl={bgUrl}
            elements={elements}
            signers={signers}
            signersLayout={signersLayout}
            margins={margins}
          />
          <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 10, textAlign: "center", marginBottom: 0 }}>
            Красная рамка — рабочая зона. Сетка показывает мм. 1pt ≈ 1.33px.
          </p>
        </div>
      </div>
    </div>
  );
}
