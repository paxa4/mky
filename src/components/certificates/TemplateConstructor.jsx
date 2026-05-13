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
import { getApiErrorMessage } from "../../utils/apiError.js";
import { authHeaders } from "../../utils/authHeaders.js";
import { isObjectUrl, revokeObjectUrl, stripObjectUrls } from "../../utils/objectUrls.js";
import AlertBanner from "./shared/AlertBanner.jsx";
import { cardStyle, inputStyle, labelStyle, sectionBox, dangerBtn } from "./shared/styles.js";
import AccuratePreview from "./shared/AccuratePreview.jsx";
import { smartAlign, clamp } from "./shared/previewMath.js";
import useHotkeys from "./shared/useHotkeys.js";
import ContextMenu from "./shared/ContextMenu.jsx";

const PAGE_W = 210; // мм
const PAGE_H = 297; // мм
const DEFAULT_FONT_FAMILY = "DejaVu";
const BUILTIN_FONTS = [
  { font_family: DEFAULT_FONT_FAMILY, font_url: "/static/fonts/DejaVuSans.ttf" },
  { font_family: "Roboto",            font_url: null },
  { font_family: "Montserrat",       font_url: null },
  { font_family: "Open Sans",        font_url: null },
  { font_family: "Playfair Display", font_url: null },
  { font_family: "Oswald",           font_url: null },
];
const QUICK_VARIABLES = ["ФИО", "Класс", "Школа", "Предмет", "Дата", "Мероприятие", "Награда"];
const QUICK_GENDER_VARIANTS = [
  { label: "ученику / ученице", value: "{род:ученику|ученице}" },
  { label: "награждён / награждена", value: "{род:награждён|награждена}" },
  { label: "победитель / победительница", value: "{род:победитель|победительница}" },
];

// Расширенный список для инлайн-пикера
const PICKER_VARIABLES = [
  { key: "ФИО",        desc: "Имя участника (автосклонение)" },
  { key: "Класс",      desc: "Класс или группа, напр. 8А" },
  { key: "Школа",      desc: "Название учебного заведения" },
  { key: "Предмет",    desc: "Учебный предмет или дисциплина" },
  { key: "Дата",       desc: "Дата мероприятия" },
  { key: "Мероприятие", desc: "Название олимпиады / конкурса" },
  { key: "Награда",    desc: "Тип награды: победитель, призёр…" },
];
const PICKER_GENDER_VARIANTS = [
  { label: "Награждён / Награждена",          value: "{род:Награждён|Награждена}" },
  { label: "Ученик / Ученица",                value: "{род:Ученик|Ученица}" },
  { label: "Победитель / Победительница",     value: "{род:Победитель|Победительница}" },
  { label: "Выпускник / Выпускница",          value: "{род:Выпускник|Выпускница}" },
  { label: "Отличник / Отличница",            value: "{род:Отличник|Отличница}" },
  { label: "Призёр / Призёрка",              value: "{род:Призёр|Призёрка}" },
  { label: "Участник / Участница",            value: "{род:Участник|Участница}" },
];

const VARIABLE_HINTS = {
  "ФИО": "Полное имя участника. Поддерживает склонение: {ФИО:дательный}. Подставляется из колонки «ФИО» в Excel.",
  "Класс": "Класс или группа участника, например: 8А, 10Б. Колонка «Класс» в Excel.",
  "Школа": "Название учебного заведения. Колонка «Школа» в Excel.",
  "Предмет": "Название предмета или дисциплины. Колонка «Предмет» в Excel.",
  "Дата": "Дата мероприятия. Вводится при генерации или в колонке «Дата» Excel.",
  "Мероприятие": "Название мероприятия, олимпиады, конкурса. Колонка «Мероприятие» в Excel.",
  "Награда": "Тип награды: победитель, призёр и т.д. Колонка «Награда» в Excel.",
};
const PREVIEW_STORAGE_PREFIX = "certificate-template-preview-vars:";
const DEFAULT_PREVIEW_VARIABLES = {
  "ФИО": "Григорьев Владислав Дмитриевич",
  "Мероприятие": "Всероссийская олимпиада по информатике",
};

function previewStorageKey(templateId) {
  return `${PREVIEW_STORAGE_PREFIX}${templateId}`;
}

function readStoredPreviewVariables(templateId) {
  if (!templateId || typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(previewStorageKey(templateId));
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeStoredPreviewVariables(templateId, placeholders, values) {
  if (!templateId || typeof window === "undefined") return;
  const picked = {};
  for (const key of placeholders) {
    picked[key] = values[key] ?? "";
  }
  window.localStorage.setItem(previewStorageKey(templateId), JSON.stringify(picked));
}

function normalizeFontOption(font) {
  if (!font?.font_family) return null;
  return {
    font_family: String(font.font_family).trim(),
    font_url: font.font_url || null,
  };
}

function mergeFontOptions(...groups) {
  const seen = new Set();
  const result = [];
  for (const group of groups) {
    for (const raw of group || []) {
      const font = normalizeFontOption(raw);
      if (!font || seen.has(font.font_family)) continue;
      seen.add(font.font_family);
      result.push(font);
    }
  }
  return result;
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function hasRussianWord(text, pattern) {
  return new RegExp(`(^|[^а-яёa-z0-9_])(?:${pattern})($|[^а-яёa-z0-9_])`, "iu").test(text);
}

function isGenderVariantPlaceholder(key) {
  return /^(?:род|пол|gender)\s*:\s*[^|{}]+\|[^{}]+$/i.test(String(key || "").trim());
}

function getPreviewContext(elements) {
  const chunks = [...elements]
    .sort((a, b) => Number(a.y || 0) - Number(b.y || 0))
    .map((el) => String(el.text || "").replace(/\{[^}]+\}/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const joined = chunks.join(" ");
  return joined.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ").slice(0, 220);
}

function detectPreviewGender(fio) {
  const parts = String(fio || "").trim().split(/\s+/).filter(Boolean);
  const surname = (parts[0] || "").toLowerCase();
  const first = (parts[1] || parts[0] || "").toLowerCase();
  const patronymic = (parts[2] || "").toLowerCase();
  if (patronymic.endsWith("ич")) return "male";
  if (patronymic.endsWith("на")) return "female";
  if (surname.endsWith("ова") || surname.endsWith("ева") || surname.endsWith("ина") || surname.endsWith("ая")) return "female";
  if (first.endsWith("а") || first.endsWith("я")) return "female";
  if (surname.endsWith("ов") || surname.endsWith("ев") || surname.endsWith("ин") || surname.endsWith("ын")) return "male";
  return null;
}

function resolvePreviewDeclension(context, fio) {
  const text = normalizeText(context);
  let gender = null;
  if (hasRussianWord(text, "награжд[её]н")) gender = "male";
  if (hasRussianWord(text, "награждена")) gender = "female";
  gender = gender || detectPreviewGender(fio);
  const useDative = hasRussianWord(text, "вручается|выдан[ао]?|присуждается|предоставляется|адресуется");
  return { caseName: useDative ? "dative" : "nominative", gender };
}

function declinePreviewLastnameDative(lastname, gender) {
  const lower = String(lastname || "").toLowerCase();
  if (gender === "female") {
    if (lower.endsWith("ов") || lower.endsWith("ев") || lower.endsWith("ин") || lower.endsWith("ын")) return `${lastname}ой`;
    if (lower.endsWith("ский") || lower.endsWith("цкий")) return `${lastname.slice(0, -2)}ой`;
    if (lower.endsWith("ова") || lower.endsWith("ева") || lower.endsWith("ина")) return `${lastname.slice(0, -1)}ой`;
    if (lower.endsWith("ая")) return `${lastname.slice(0, -2)}ой`;
    if (lower.endsWith("яя")) return `${lastname.slice(0, -2)}ей`;
    return lastname;
  }
  if (lower.endsWith("ов") || lower.endsWith("ев") || lower.endsWith("ин") || lower.endsWith("ын")) return `${lastname}у`;
  if (lower.endsWith("ский") || lower.endsWith("цкий")) return `${lastname.slice(0, -2)}ому`;
  return lastname;
}

function declinePreviewNameDative(firstname, gender) {
  const lower = String(firstname || "").toLowerCase();
  if (gender === "female") {
    if (lower.endsWith("ия")) return `${firstname.slice(0, -1)}и`;
    if (lower.endsWith("а") || lower.endsWith("я")) return `${firstname.slice(0, -1)}е`;
    return firstname;
  }
  if (lower.endsWith("й") || lower.endsWith("ь")) return `${firstname.slice(0, -1)}ю`;
  if (lower.endsWith("а")) return `${firstname.slice(0, -1)}е`;
  return `${firstname}у`;
}

function declinePreviewPatronymicDative(patronymic, gender) {
  const lower = String(patronymic || "").toLowerCase();
  if (gender === "female" && lower.endsWith("на")) return `${patronymic.slice(0, -1)}е`;
  if (gender !== "female" && lower.endsWith("ич")) return `${patronymic}у`;
  return patronymic;
}

function declinePreviewFio(fio, caseName, gender) {
  const parts = String(fio || "").trim().split(/\s+/).filter(Boolean);
  if (caseName !== "dative" || parts.length < 2) return String(fio || "").trim();
  const declined = [
    declinePreviewLastnameDative(parts[0], gender),
    declinePreviewNameDative(parts[1], gender),
  ];
  if (parts[2]) declined.push(declinePreviewPatronymicDative(parts[2], gender));
  return declined.concat(parts.slice(3)).join(" ");
}

function applyGenderVariantsPreview(text, gender) {
  return String(text || "").replace(/\{([^}]+)\}/g, (match, inner) => {
    const key = inner.trim();
    const genderMatch = key.match(/^(?:род|пол|gender)\s*:\s*([^|{}]+)\|([^{}]+)$/i);
    if (!genderMatch) return match;
    return gender === "female" ? genderMatch[2].trim() : genderMatch[1].trim();
  });
}

// ── Маленькая подсказка-иконка ───────────────────────────────────────────────
function Tooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-block", marginLeft: 6 }}>
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        style={{
          width: 18, height: 18, borderRadius: "50%",
          background: "#E2E8F0", border: "none",
          color: "#64748B", fontSize: 11, fontWeight: 700,
          cursor: "help", lineHeight: 1,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          verticalAlign: "middle", fontFamily: "inherit",
        }}
        aria-label="Подсказка"
      >?</button>
      {show && (
        <div style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          bottom: "calc(100% + 8px)",
          background: "#0F172A",
          color: "#fff",
          fontSize: 12,
          lineHeight: 1.5,
          padding: "8px 12px",
          borderRadius: 8,
          width: 240,
          zIndex: 9999,
          boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
          pointerEvents: "none",
          whiteSpace: "normal",
        }}>
          {text}
          <div style={{
            position: "absolute",
            top: "100%", left: "50%",
            transform: "translateX(-50%)",
            border: "5px solid transparent",
            borderTopColor: "#0F172A",
          }} />
        </div>
      )}
    </span>
  );
}

// ── Компонент ───────────────────────────────────────────────────────────────

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
    font_family: DEFAULT_FONT_FAMILY, position_color: "", name_color: "",
  });

  // Текстовые элементы
  const [elements, setElements] = useState([
    { id: 1, text: "Сертификат", x: 50, y: 14, size: 48, color: "#0F172A", weight: "700", fontFamily: DEFAULT_FONT_FAMILY },
    { id: 2, text: "награждается", x: 50, y: 24, size: 22, color: "#64748B", weight: "400", fontFamily: DEFAULT_FONT_FAMILY },
    { id: 3, text: "{ФИО}", x: 50, y: 38, size: 38, color: "#1D4ED8", weight: "700", fontFamily: DEFAULT_FONT_FAMILY },
    { id: 4, text: "за участие в {Мероприятие}", x: 50, y: 54, size: 18, color: "#475569", weight: "400", fontFamily: DEFAULT_FONT_FAMILY },
  ]);

  // Подписанты
  const [signers, setSigners] = useState([{
    id: "s1", position: "Директор", fullName: "",
    facFile: null, facPreview: null,
    offsetY: 0, facOffsetX: 0, facOffsetY: 0, facScale: 1,
  }]);

  const objectUrlsRef = useRef([]);
  const [saving, setSaving] = useState(false);
  const [uploadingFont, setUploadingFont] = useState(false);
  const [availableFonts, setAvailableFonts] = useState(BUILTIN_FONTS);
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState("info");
  // Переменные для превью — пользователь вводит значения для реалистичного предпросмотра
  const [previewVariables, setPreviewVariables] = useState(DEFAULT_PREVIEW_VARIABLES);

  // ── UX: выделение, контекстное меню, автосохранение ──────────────────────
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [ctxMenu, setCtxMenu] = useState(null); // { x, y, elementId }
  const [autoSaveStatus, setAutoSaveStatus] = useState(""); // "", "saving", "saved"
  const autoSaveTimerRef = useRef(null);
  const [, setUndoStack] = useState([]);
  const [, setRedoStack] = useState([]);
  const MAX_UNDO = 40;
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return !window.localStorage.getItem("constructor-onboarding-v1-dismissed"); } catch { return true; }
  });
  // Инлайн-пикер переменных
  const [pickerOpenId, setPickerOpenId] = useState(null); // id элемента у которого открыт пикер
  const textareaRefs = useRef({}); // { [elId]: HTMLTextAreaElement }

  const bgInputRef = useRef(null);
  const bgDragCounter = useRef(0);
  const [bgDrag, setBgDrag] = useState(false);

  const createTrackedObjectUrl = useCallback((file) => {
    const url = URL.createObjectURL(file);
    objectUrlsRef.current.push(url);
    return url;
  }, []);

  useEffect(() => () => {
    objectUrlsRef.current.forEach(revokeObjectUrl);
    objectUrlsRef.current = [];
  }, []);

  // Вычисляем безопасную зону в %
  const safePct = useMemo(() => ({
    xMin: (margins.left / PAGE_W) * 100,
    xMax: ((PAGE_W - margins.right) / PAGE_W) * 100,
    yMin: (margins.top / PAGE_H) * 100,
    yMax: ((PAGE_H - margins.bottom) / PAGE_H) * 100,
  }), [margins]);

  // Авто-определяем плейсхолдеры из всех элементов
  const detectedPlaceholders = useMemo(() => {
    const found = new Set();
    for (const el of elements) {
      const matches = el.text.matchAll(/\{([^}]+)\}/g);
      for (const m of matches) {
        const key = m[1].trim();
        if (!isGenderVariantPlaceholder(key)) found.add(key);
      }
    }
    return [...found];
  }, [elements]);

  const fioDeclensionPreview = useMemo(() => {
    const originalFio = previewVariables["ФИО"] || previewVariables["фио"] || previewVariables.fio || DEFAULT_PREVIEW_VARIABLES["ФИО"];
    const context = getPreviewContext(elements);
    const resolved = resolvePreviewDeclension(context, originalFio);
    const declinedFio = declinePreviewFio(originalFio, resolved.caseName, resolved.gender);
    return {
      context,
      originalFio,
      declinedFio,
      caseLabel: resolved.caseName === "dative" ? "дательный падеж" : "именительный падеж",
      genderLabel: resolved.gender === "female" ? "женский род" : resolved.gender === "male" ? "мужской род" : "род не определён",
      gender: resolved.gender,
      changed: declinedFio !== originalFio,
    };
  }, [elements, previewVariables]);

  const effectivePreviewVariables = useMemo(() => ({
    ...previewVariables,
    __gender: fioDeclensionPreview.gender || "",
    "ФИО": fioDeclensionPreview.declinedFio,
    "фио": fioDeclensionPreview.declinedFio,
    fio: fioDeclensionPreview.declinedFio,
    FIO: fioDeclensionPreview.declinedFio,
  }), [previewVariables, fioDeclensionPreview]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/certificates/fonts`, { headers: authHeaders() })
      .then((res) => res.ok ? res.json() : Promise.reject(new Error("fonts")))
      .then((data) => {
        if (!cancelled) setAvailableFonts(mergeFontOptions(BUILTIN_FONTS, data.fonts));
      })
      .catch(() => {
        if (!cancelled) setAvailableFonts(BUILTIN_FONTS);
      });
    return () => { cancelled = true; };
  }, []);

  // При появлении нового плейсхолдера — добавляем пустое поле (пользователь заполнит сам)
  useEffect(() => {
    setPreviewVariables(prev => {
      const next = { ...prev };
      let changed = false;
      for (const key of detectedPlaceholders) {
        if (!(key in next)) { next[key] = ""; changed = true; }
      }
      return changed ? next : prev;
    });
  }, [detectedPlaceholders]);

  // ── Загрузка шаблона для редактирования ──────────────────────────────────
  const loadTemplate = useCallback(async (id) => {
    if (!id) { resetToNew(); return; }
    setLoadingTemplate(true);
    try {
      const res = await fetch(`${API_BASE}/certificates/templates/${id}/full`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(await getApiErrorMessage(res, "Не удалось загрузить шаблон"));
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
        font_family: t.signers_font_family || DEFAULT_FONT_FAMILY,
        position_color: t.signers_position_color || "",
        name_color: t.signers_name_color || "",
      });

      // Конвертируем элементы из мм в %
      setElements(data.elements.map((el, i) => ({
        id: el.id || i + 1,
        text: el.text,
        x: (el.x_mm / PAGE_W) * 100,
        y: (el.y_mm / PAGE_H) * 100,
        size: el.font_size,
        color: el.color || "#0F172A",
        weight: el.font_weight || "400",
        fontFamily: el.font_family || DEFAULT_FONT_FAMILY,
        align: el.align,
        maxWidthMm: el.max_width_mm,
      })));

      setPreviewVariables({
        ...DEFAULT_PREVIEW_VARIABLES,
        ...readStoredPreviewVariables(id),
      });

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
    setSignersLayout({ y_mm: 248, x_mm: 105, row_h_mm: 32, band_mm: 168, font_size: 10, text_color: "#1e293b", font_weight: "400", font_family: DEFAULT_FONT_FAMILY, position_color: "", name_color: "" });
    setElements([
      { id: 1, text: "Сертификат", x: 50, y: 14, size: 48, color: "#0F172A", weight: "700", fontFamily: DEFAULT_FONT_FAMILY },
      { id: 2, text: "награждается", x: 50, y: 24, size: 22, color: "#64748B", weight: "400", fontFamily: DEFAULT_FONT_FAMILY },
      { id: 3, text: "{ФИО}", x: 50, y: 38, size: 38, color: "#1D4ED8", weight: "700", fontFamily: DEFAULT_FONT_FAMILY },
      { id: 4, text: "за участие в {Мероприятие}", x: 50, y: 54, size: 18, color: "#475569", weight: "400", fontFamily: DEFAULT_FONT_FAMILY },
    ]);
    setPreviewVariables(DEFAULT_PREVIEW_VARIABLES);
    setSigners([{ id: "s1", position: "Директор", fullName: "", facFile: null, facPreview: null, offsetY: 0, facOffsetX: 0, facOffsetY: 0, facScale: 1 }]);
    setMsg(null);
  };

  const handleDeleteTemplate = async () => {
    if (!editingId) return;
    if (!window.confirm(`Удалить шаблон «${name}»? Это действие нельзя отменить.`)) return;

    setLoadingTemplate(true);
    setMsg(null);
    try {
      const res = await fetch(`${API_BASE}/certificates/templates/${editingId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(await getApiErrorMessage(res, "Не удалось удалить шаблон"));

      if (typeof window !== "undefined") {
        window.localStorage.removeItem(previewStorageKey(editingId));
      }
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
    setElements((prev) => [...prev, { id: newId, text: "Новый текст", x: cx, y: cy, size: 24, color: "#000000", weight: "400", fontFamily: DEFAULT_FONT_FAMILY, maxWidthMm: null }]);
  };
  const insertVariableBlock = (key) => {
    const newId = Math.max(0, ...elements.map((e) => e.id)) + 1;
    const cx = (safePct.xMin + safePct.xMax) / 2;
    const cy = Math.min(safePct.yMax, Math.max(safePct.yMin, 44 + (detectedPlaceholders.length % 4) * 6));
    setElements((prev) => [...prev, {
      id: newId,
      text: `{${key}}`,
      x: cx,
      y: cy,
      size: key === "ФИО" ? 34 : 20,
      color: key === "ФИО" ? "#1D4ED8" : "#334155",
      weight: key === "ФИО" ? "700" : "500",
      fontFamily: DEFAULT_FONT_FAMILY,
      maxWidthMm: null,
    }]);
  };

  const insertGenderVariantBlock = (variantText) => {
    const newId = Math.max(0, ...elements.map((e) => e.id)) + 1;
    const cx = (safePct.xMin + safePct.xMax) / 2;
    const cy = Math.min(safePct.yMax, Math.max(safePct.yMin, 50 + (elements.length % 4) * 6));
    setElements((prev) => [...prev, {
      id: newId,
      text: variantText,
      x: cx,
      y: cy,
      size: 18,
      color: "#475569",
      weight: "400",
      fontFamily: DEFAULT_FONT_FAMILY,
      maxWidthMm: 168,
    }]);
  };

  /** Вставить текст в позицию курсора выбранного textarea */
  const insertAtCursor = useCallback((elId, insertText) => {
    const ta = textareaRefs.current[elId];
    setElements((prev) => {
      const el = prev.find((e) => e.id === elId);
      if (!el) return prev;
      let newText;
      if (ta && document.activeElement === ta) {
        const start = ta.selectionStart ?? ta.value.length;
        const end = ta.selectionEnd ?? ta.value.length;
        newText = ta.value.slice(0, start) + insertText + ta.value.slice(end);
        requestAnimationFrame(() => {
          ta.focus();
          const pos = start + insertText.length;
          ta.setSelectionRange(pos, pos);
        });
      } else {
        newText = (el.text || "") + insertText;
      }
      return prev.map((e) => e.id === elId ? { ...e, text: newText } : e);
    });
    setPickerOpenId(null);
  }, []);

  const updateEl = (id, field, val) => setElements((prev) => prev.map((e) => e.id === id ? { ...e, [field]: val } : e));
  const removeEl = (id) => {
    setElements((prev) => prev.filter((e) => e.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  /** Дублирование элемента */
  const duplicateEl = (id) => {
    setElements((prev) => {
      const src = prev.find((e) => e.id === id);
      if (!src) return prev;
      const newId = Math.max(0, ...prev.map((e) => e.id)) + 1;
      return [...prev, { ...src, id: newId, y: Math.min(safePct.yMax, src.y + 3) }];
    });
  };

  /** Выравнивание элемента по центру X */
  const centerEl = (id) => {
    const cx = (safePct.xMin + safePct.xMax) / 2;
    updateEl(id, "x", cx);
  };

  /** Drag & Drop: обновление позиции элемента из превью */
  const handleElementMove = useCallback((id, newX, newY) => {
    const clampedX = clamp(newX, safePct.xMin, safePct.xMax);
    const clampedY = clamp(newY, safePct.yMin, safePct.yMax);
    setElements((prev) => prev.map((e) => e.id === id ? { ...e, x: clampedX, y: clampedY } : e));
  }, [safePct]);

  /** Контекстное меню: правый клик на элементе в превью */
  const handleElementContextMenu = useCallback((id, clientX, clientY) => {
    setSelectedElementId(id);
    setCtxMenu({ x: clientX, y: clientY, elementId: id });
  }, []);

  /** Drag блока подписантов на превью */
  const handleSignersMove = useCallback((newXmm, newYmm) => {
    setSignersLayout((p) => ({
      ...p,
      x_mm: Math.round(newXmm * 10) / 10,
      y_mm: Math.round(newYmm * 10) / 10,
    }));
  }, []);

  // ── Undo / Redo (snapshot elements) ─────────────────────────────────────
  const pushUndo = useCallback(() => {
    setUndoStack((prev) => [...prev.slice(-(MAX_UNDO - 1)), JSON.stringify(elements)]);
    setRedoStack([]);
  }, [elements]);

  const undo = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const snapshot = prev[prev.length - 1];
      setRedoStack((r) => [...r, JSON.stringify(elements)]);
      setElements(JSON.parse(snapshot));
      return prev.slice(0, -1);
    });
  }, [elements]);

  const redo = useCallback(() => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const snapshot = prev[prev.length - 1];
      setUndoStack((u) => [...u, JSON.stringify(elements)]);
      setElements(JSON.parse(snapshot));
      return prev.slice(0, -1);
    });
  }, [elements]);

  // ── Двойной клик → прокрутить к карточке элемента ───────────────────────
  const handleElementDoubleClick = useCallback((id) => {
    setSelectedElementId(id);
    setTimeout(() => {
      const card = document.querySelector(`[data-element-card-id="${id}"]`);
      if (!card) return;
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      card.setAttribute("data-pulsing", "1");
      setTimeout(() => card.removeAttribute("data-pulsing"), 900);
    }, 50);
  }, []);

  // ── Hotkeys ─────────────────────────────────────────────────────────────
  useHotkeys({
    "ctrl+z": () => undo(),
    "ctrl+shift+z": () => redo(),
    "ctrl+s": () => { handleSave(); },
    "delete": () => { if (selectedElementId) { pushUndo(); removeEl(selectedElementId); } },
    "ctrl+d": () => { if (selectedElementId) { pushUndo(); duplicateEl(selectedElementId); } },
    "escape": () => { setSelectedElementId(null); setCtxMenu(null); setPickerOpenId(null); },
  });

  // Закрываем пикер по клику вне — bubble-phase на document (capture вызывал гонку с onClick кнопок)
  useEffect(() => {
    if (!pickerOpenId) return;
    const handleClick = () => setPickerOpenId(null);
    const handleKey = (e) => { if (e.key === "Escape") setPickerOpenId(null); };
    document.addEventListener("click", handleClick);        // bubble — пикер сам stopPropagation-ит внутренние клики
    window.addEventListener("keydown", handleKey, true);    // capture — чтобы Escape всегда работал
    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleKey, true);
    };
  }, [pickerOpenId]);

  // ── Автосохранение (localStorage backup, каждые 15с) ─────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `cert-constructor-autosave:${editingId || "new"}`;
    clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      try {
        const snapshot = JSON.stringify(stripObjectUrls({ name, elements, signers, margins, signersLayout, bgUrl }));
        window.localStorage.setItem(key, snapshot);
        setAutoSaveStatus("saved");
        setTimeout(() => setAutoSaveStatus(""), 2000);
      } catch { /* ignore */ }
    }, 15000);
    return () => clearTimeout(autoSaveTimerRef.current);
  }, [name, elements, signers, margins, signersLayout, bgUrl, editingId]);

  // ── Подписанты ────────────────────────────────────────────────────────────
  const addSigner = () => {
    if (signers.length >= 3) return;
    setSigners((prev) => [...prev, { id: `s_${Date.now()}`, position: "Должность", fullName: "", facFile: null, facPreview: null, offsetY: 0, facOffsetX: 0, facOffsetY: 0, facScale: 1 }]);
  };
  const updateSigner = (id, field, val) => setSigners((prev) => prev.map((s) => s.id === id ? { ...s, [field]: val } : s));
  const removeSigner = (id) => setSigners((prev) => prev.length > 1 ? prev.filter((s) => s.id !== id) : prev);

  /** Простая загрузка факсимиле — локальный blob-превью без сетевых вызовов */
  const handleFacsimile = (id, e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setSigners((prev) => prev.map((s) => {
      if (s.id !== id) return s;
      if (s.facPreview && s.facFile) revokeObjectUrl(s.facPreview);
      return { ...s, facFile: file, facPreview: createTrackedObjectUrl(file), facUrl: null };
    }));
    // Сбрасываем значение input, чтобы можно было загрузить тот же файл ещё раз
    e.target.value = "";
  };

  /** Удалить факсимиле */
  const clearFacsimile = (id) => {
    if (!window.confirm("Удалить факсимиле этого подписанта?")) return;
    setSigners((prev) => prev.map((s) => {
      if (s.id !== id) return s;
      if (s.facPreview && s.facFile) revokeObjectUrl(s.facPreview);
      return { ...s, facFile: null, facPreview: null, facUrl: null };
    }));
  };

  const handleFontUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["ttf", "otf"].includes(ext)) {
      setMsg("Загрузите файл шрифта .ttf или .otf");
      setMsgType("error");
      return;
    }

    setUploadingFont(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_BASE}/certificates/upload-font`, {
        method: "POST",
        headers: authHeaders(),
        body: fd,
      });
      if (!res.ok) throw new Error(await getApiErrorMessage(res, "Ошибка загрузки шрифта"));
      const uploaded = await res.json();
      setAvailableFonts((prev) => mergeFontOptions(prev, [uploaded]));
      setMsg(`Шрифт «${uploaded.font_family}» загружен`);
      setMsgType("success");
    } catch (err) {
      setMsg(err.message || "Не удалось загрузить шрифт");
      setMsgType("error");
    } finally {
      setUploadingFont(false);
    }
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
        const r = await fetch(`${API_BASE}/certificates/upload-background`, {
          method: "POST",
          headers: authHeaders(),
          body: fd,
        });
        if (!r.ok) throw new Error(await getApiErrorMessage(r, "Ошибка загрузки фона"));
        finalBgUrl = (await r.json()).background_url;
      }

      // 2. Загружаем факсимиле для новых подписантов
      const signersData = [];
      for (let i = 0; i < Math.min(signers.length, 3); i++) {
        const s = signers[i];
        let facUrl = s.facUrl || null;
        if (s.facFile) {
          const fd = new FormData(); fd.append("file", s.facFile);
          const r = await fetch(`${API_BASE}/certificates/upload-facsimile`, {
            method: "POST",
            headers: authHeaders(),
            body: fd,
          });
          if (!r.ok) throw new Error(await getApiErrorMessage(r, "Ошибка загрузки факсимиле"));
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
          color: el.color,
          font_weight: el.weight,
          font_family: el.fontFamily || DEFAULT_FONT_FAMILY,
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
        signers_font_family: signersLayout.font_family || DEFAULT_FONT_FAMILY,
        signers_position_color: signersLayout.position_color || null,
        signers_name_color: signersLayout.name_color || null,
        margin_left_mm: margins.left, margin_right_mm: margins.right,
        margin_top_mm: margins.top, margin_bottom_mm: margins.bottom,
        elements: elementsData, signers: signersData,
      };

      let res;
      if (mode === "edit" && editingId) {
        // Атомарное обновление
        res = await fetch(`${API_BASE}/certificates/templates/${editingId}/full`, {
          method: "PUT", headers: authHeaders({ "Content-Type": "application/json" }), body: JSON.stringify(payload),
        });
      } else {
        // Атомарное создание нового шаблона
        res = await fetch(`${API_BASE}/certificates/templates/full`, {
          method: "POST", headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setMode("edit"); setEditingId(created.template.id);
          writeStoredPreviewVariables(created.template.id, detectedPlaceholders, previewVariables);
          setMsg("Шаблон создан и сохранён!"); setMsgType("success");
          onTemplatesSaved?.();
          return;
        }
      }

      if (!res.ok) {
        throw new Error(await getApiErrorMessage(res, "Ошибка сохранения"));
      }
      if (mode === "edit" && editingId) {
        writeStoredPreviewVariables(editingId, detectedPlaceholders, previewVariables);
      }
      setMsg(mode === "edit" ? "Шаблон обновлён!" : "Шаблон сохранён!"); setMsgType("success");
      onTemplatesSaved?.();
    } catch (e) {
      setMsg(e.message || "Ошибка сохранения"); setMsgType("error");
    } finally {
      setSaving(false);
    }
  };

  // ── Рендер ────────────────────────────────────────────────────────────────
  return (
    <div
      className="certificate-constructor-grid"
      onKeyDown={(e) => {
        // Блокируем браузерные перехватчики на уровне DOM-обёртки конструктора
        if ((e.ctrlKey || e.metaKey) && ["s", "d", "z"].includes(e.key.toLowerCase())) {
          e.preventDefault();
        }
      }}
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(380px, 1fr) minmax(360px, 560px)",
        gap: 40,
        alignItems: "start",
      }}
    >
      <style>{`
        @keyframes certificatePreviewIn {
          from { opacity: 0; transform: translate3d(0, 10px, 0); filter: saturate(0.92); }
          to { opacity: 1; transform: translate3d(0, 0, 0); filter: saturate(1); }
        }
        @keyframes elCardIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes elCardPulse {
          0%, 100% { box-shadow: 0 0 0 0px rgba(59,130,246,0); }
          40% { box-shadow: 0 0 0 8px rgba(59,130,246,0.35); }
        }
        [data-pulsing="1"] {
          animation: elCardPulse 0.9s ease-out;
        }
        @keyframes pickerIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 1099px) {
          .certificate-constructor-grid {
            grid-template-columns: 1fr !important;
          }
          .certificate-preview-card {
            position: relative !important;
            top: auto !important;
            max-height: none !important;
          }
        }
      `}</style>
      {/* Описание модуля + полоса горячих клавиш */}
      <div style={{ gridColumn: "1 / -1", marginBottom: 8 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: "0 0 6px" }}>
          Конструктор шаблонов
        </h2>
        <p style={{ fontSize: 15, color: "#64748B", margin: "0 0 8px" }}>
          Создайте или отредактируйте внешний вид грамоты. Справа отображается предпросмотр — он обновляется в реальном времени.
          Перетаскивайте элементы прямо на превью. Правый клик — контекстное меню.
        </p>
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center",
          padding: "6px 12px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0",
        }}>
          {[
            ["Ctrl+S", "Сохранить"],
            ["Ctrl+Z", "Отмена"],
            ["Ctrl+Shift+Z", "Повтор"],
            ["Ctrl+D", "Дублировать"],
            ["Del", "Удалить"],
            ["Esc", "Снять выделение"],
            ["2×клик", "Открыть настройки"],
          ].map(([key, label]) => (
            <span key={key} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748B" }}>
              <kbd style={{
                background: "#fff", border: "1px solid #D1D5DB", borderRadius: 4,
                padding: "1px 5px", fontSize: 10, fontWeight: 700, fontFamily: "inherit",
                boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
              }}>{key}</kbd>
              <span style={{ fontWeight: 500 }}>{label}</span>
            </span>
          ))}
          {autoSaveStatus === "saved" && (
            <span style={{ marginLeft: "auto", fontSize: 11, color: "#059669", fontWeight: 600 }}>✓ Автосохранено</span>
          )}
        </div>
      </div>

      {/* Онбординг — показывается при первом открытии */}
      {showOnboarding && (
        <div style={{
          gridColumn: "1 / -1", marginBottom: 4,
          background: "linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)",
          border: "1px solid #BFDBFE",
          borderRadius: 12,
          padding: "16px 20px",
          position: "relative",
        }}>
          <button
            type="button"
            onClick={() => {
              setShowOnboarding(false);
              try { window.localStorage.setItem("constructor-onboarding-v1-dismissed", "1"); } catch { /* ignore */ }
            }}
            style={{ position: "absolute", top: 10, right: 12, background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#94A3B8", lineHeight: 1 }}
            title="Закрыть подсказку"
          >Г—</button>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#1D4ED8", marginBottom: 10 }}>
            Быстрый старт
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
            {[
              ["1️⃣", "Загрузите фон грамоты", "PNG или JPG с бланком"],
              ["2️⃣", "Добавьте текстовые блоки", "Кнопка «+ Добавить блок»"],
              ["3️⃣", "Используйте переменные", "{ФИО}, {Класс} — заменятся при генерации"],
              ["4️⃣", "Перетаскивайте блоки", "Прямо на превью справа"],
              ["5️⃣", "2× клик на блоке", "Откроет его настройки в панели"],
              ["6️⃣", "Сохраните шаблон", "Ctrl+S или кнопка «Сохранить»"],
            ].map(([icon, title, desc]) => (
              <div key={title} style={{ background: "rgba(255,255,255,0.7)", borderRadius: 8, padding: "8px 10px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1E40AF", marginBottom: 2 }}>{icon} {title}</div>
                <div style={{ fontSize: 11, color: "#64748B" }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>

        {/* Выбор шаблона для редактирования */}
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0F172A" }}>
              {mode === "edit" ? `Редактирование: «${name}»` : "Создать новый шаблон"}
            </h3>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "10px 24px",
                background: saving ? "#CBD5E1" : "linear-gradient(135deg,#059669,#10B981)",
                color: "#fff", border: "none", borderRadius: 10,
                fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 14,
                boxShadow: saving ? "none" : "0 4px 12px rgba(5,150,105,0.3)",
                fontFamily: "inherit",
              }}
            >
              {saving ? "Сохраняем…" : mode === "edit" ? "Сохранить изменения" : "Сохранить шаблон"}
            </button>
          </div>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "#94A3B8" }}>
            {mode === "edit"
              ? "Вносите изменения — предпросмотр обновляется автоматически. Нажмите «Сохранить изменения» когда всё готово."
              : "Создайте оформление с нуля или выберите существующий шаблон для редактирования ниже."}
          </p>

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
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#0F172A" }}>Основные настройки</h3>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>
              <span style={{ display: "flex", alignItems: "center" }}>
                Название шаблона
                <Tooltip text="Внутреннее название для вашего удобства. Будет отображаться в списке при выборе оформления грамоты." />
              </span>
            </label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={{ ...inputStyle, marginTop: 8 }} />
          </div>
          <div>
            <label style={labelStyle}>
              <span style={{ display: "flex", alignItems: "center" }}>
                Фоновое изображение грамоты
                <Tooltip text="Загрузите PNG или JPG-файл с бланком грамоты. Текст и подписи будут добавлены поверх этого изображения. Рекомендуемый размер: 2480×3508 пикселей (A4 @ 300 DPI)." />
              </span>
            </label>
            <div
              role="button"
              tabIndex={0}
              aria-label="Загрузить фоновое изображение"
              onClick={() => bgInputRef.current?.click()}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") bgInputRef.current?.click(); }}
              onDragEnter={(e) => {
                e.preventDefault();
                bgDragCounter.current++;
                if (bgDragCounter.current === 1) setBgDrag(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                bgDragCounter.current--;
                if (bgDragCounter.current === 0) setBgDrag(false);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                bgDragCounter.current = 0;
                setBgDrag(false);
                const f = e.dataTransfer.files?.[0];
                if (f && f.type.startsWith("image/")) {
                  if (isObjectUrl(bgUrl)) revokeObjectUrl(bgUrl);
                  setBgFile(f);
                  setBgUrl(createTrackedObjectUrl(f));
                }
              }}
              style={{
                border: `2px dashed ${bgDrag ? "#059669" : bgUrl ? "#059669" : "#CBD5E1"
                  }`,
                borderRadius: 12,
                padding: "28px 20px",
                textAlign: "center",
                cursor: "pointer",
                background: bgDrag ? "#F0FDF4" : bgUrl ? "#F0FDF4" : "#F8FAFC",
                marginTop: 8,
                transition: "border-color 0.15s, background 0.15s",
                outline: "none",
              }}
            >
              <input
                ref={bgInputRef}
                type="file"
                accept="image/png,image/jpeg"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    if (isObjectUrl(bgUrl)) revokeObjectUrl(bgUrl);
                    setBgFile(f);
                    setBgUrl(createTrackedObjectUrl(f));
                  }
                }}
              />
              {bgDrag ? (
                <>
                  <div style={{ fontSize: 28, marginBottom: 6, color: "#059669" }}>↓</div>
                  <div style={{ fontSize: 14, color: "#059669", fontWeight: 700 }}>Отпустите файл здесь</div>
                  <div style={{ fontSize: 12, color: "#10B981", marginTop: 4 }}>PNG или JPG</div>
                </>
              ) : bgUrl ? (
                <>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
                  <div style={{ fontSize: 14, color: "#059669", fontWeight: 700 }}>Фон загружен</div>
                  <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>Нажмите или перетащите новый файл для замены</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>🖼️</div>
                  <div style={{ fontSize: 14, color: "#334155", fontWeight: 600 }}>Перетащите файл или нажмите для выбора</div>
                  <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>PNG или JPG, рекомендуется A4 @ 300 DPI</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Шрифты */}
        <div style={{ ...sectionBox("#F8FAFC", "#CBD5E1"), marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700 }}>Шрифты</h3>
          <p style={{ fontSize: 13, color: "#475569", margin: "0 0 14px", lineHeight: 1.5 }}>
            Загрузите TTF или OTF, затем выберите его в любом текстовом блоке или в блоке подписей.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <label style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "9px 14px",
              background: uploadingFont ? "#E2E8F0" : "#fff",
              border: "1px solid #CBD5E1",
              borderRadius: 8,
              cursor: uploadingFont ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 700,
              color: "#334155",
            }}>
              {uploadingFont ? "Загрузка…" : "Загрузить шрифт"}
              <input
                type="file"
                accept=".ttf,.otf,font/ttf,font/otf"
                disabled={uploadingFont}
                onChange={handleFontUpload}
                style={{ display: "none" }}
              />
            </label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {availableFonts.map((font) => (
                <span
                  key={font.font_family}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 6,
                    background: "#fff",
                    border: "1px solid #E2E8F0",
                    fontSize: 12,
                    color: "#475569",
                    fontFamily: `"${font.font_family}", DejaVu Sans, Arial, sans-serif`,
                  }}
                >
                  {font.font_family}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Поля грамоты */}
        <div style={{ ...sectionBox("#FEF2F2", "#FECACA"), marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700 }}>Отступы по краям</h3>
          <p style={{ fontSize: 13, color: "#7F1D1D", margin: "0 0 14px", lineHeight: 1.5 }}>
            Задайте «безопасную зону» — текст не выйдет за эти границы.
            Красная рамка в предпросмотре показывает рабочую область.
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
          <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700 }}>Расположение блока подписей</h3>
          <p style={{ fontSize: 13, color: "#14532D", margin: "0 0 14px", lineHeight: 1.5 }}>
            Настройте положение подписей, расстояние между должностью и ФИО и единый размер шрифта.
            Должность всегда слева, ФИО — всегда справа.
          </p>
          <div style={{ display: "grid", gap: 12 }}>
            {[
              ["x_mm", "Положение блока по X", -50, 300, "мм"],
              ["y_mm", "Положение блока по Y", -50, 350, "мм"],
              ["band_mm", "Расстояние между «Должность» и «ФИО»", 40, 280, "мм"],
              ["font_size", "Размер шрифта", 5, 72, "pt"],
            ].map(([k, label, lo, hi, unit]) => (
              <label key={k} style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>
                {label}: {signersLayout[k]} {unit}
                <input
                  type="range"
                  min={lo}
                  max={hi}
                  step={k === "font_size" ? 0.5 : 1}
                  value={signersLayout[k]}
                  onChange={(e) => setSignersLayout((p) => ({ ...p, [k]: Number(e.target.value) }))}
                  style={{ width: "100%", marginTop: 4 }}
                />
              </label>
            ))}
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: "#334155", display: "block", marginBottom: 6 }}>
              Шрифт подписей
            </label>
            <select
              value={signersLayout.font_family || DEFAULT_FONT_FAMILY}
              onChange={(e) => setSignersLayout((p) => ({ ...p, font_family: e.target.value }))}
              style={{ ...inputStyle, padding: "8px 10px", fontSize: 14, background: "#fff" }}
            >
              {availableFonts.map((font) => (
                <option key={font.font_family} value={font.font_family}>{font.font_family}</option>
              ))}
            </select>
          </div>

          {/* Цвета текста подписантов */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#334155", marginBottom: 10 }}>Цвет текста подписантов</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 4 }}>Общий цвет</label>
                <input type="color" value={signersLayout.text_color} onChange={(e) => setSignersLayout((p) => ({ ...p, text_color: e.target.value }))}
                  style={{ width: "100%", height: 36, padding: 0, border: "1px solid #D1D5DB", cursor: "pointer", borderRadius: 6 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 4 }}>Должность
                  <Tooltip text="Оставьте пустым — будет использоваться общий цвет. Если задать — переопределит общий цвет только для должности." />
                </label>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  <input type="color" value={signersLayout.position_color || signersLayout.text_color} onChange={(e) => setSignersLayout((p) => ({ ...p, position_color: e.target.value }))}
                    style={{ width: "100%", height: 36, padding: 0, border: "1px solid #D1D5DB", cursor: "pointer", borderRadius: 6 }} />
                  {signersLayout.position_color && (
                    <button type="button" onClick={() => setSignersLayout((p) => ({ ...p, position_color: "" }))}
                      title="Сбросить на общий цвет"
                      style={{ background: "#FEE2E2", border: "none", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontWeight: "bold", fontSize: 14, color: "#EF4444", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>Г—</button>
                  )}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 4 }}>ФИО
                  <Tooltip text="Оставьте пустым — будет использоваться общий цвет. Если задать — переопределит общий цвет только для ФИО." />
                </label>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  <input type="color" value={signersLayout.name_color || signersLayout.text_color} onChange={(e) => setSignersLayout((p) => ({ ...p, name_color: e.target.value }))}
                    style={{ width: "100%", height: 36, padding: 0, border: "1px solid #D1D5DB", cursor: "pointer", borderRadius: 6 }} />
                  {signersLayout.name_color && (
                    <button type="button" onClick={() => setSignersLayout((p) => ({ ...p, name_color: "" }))}
                      title="Сбросить на общий цвет"
                      style={{ background: "#FEE2E2", border: "none", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontWeight: "bold", fontSize: 14, color: "#EF4444", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>Г—</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Подписанты */}
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                Подписанты
                <Tooltip text="Руководители, которые подписывают грамоту. Укажите их должность и ФИО. Можно добавить факсимиле — изображение подписи в формате PNG с прозрачным фоном." />
              </span>
            </h3>
          </div>
          <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 14px", lineHeight: 1.5 }}>
            Максимум 3 подписанта. У каждого: должность, ФИО и (опционально) факсимиле.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            {signers.length < 3 && (
              <button type="button" onClick={addSigner}
                style={{ padding: "8px 18px", background: "#DCFCE7", color: "#166534", border: "1px solid #86EFAC", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>
                + Добавить подписанта
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ ...labelStyle, fontSize: 14 }}>Факсимиле</label>
                  {(s.facPreview || s.facUrl) && (
                    <button
                      type="button"
                      onClick={() => clearFacsimile(s.id)}
                      title="Удалить факсимиле"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "4px 10px", background: "#FEE2E2", color: "#B91C1C",
                        border: "1px solid #FECACA", borderRadius: 6,
                        cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit",
                      }}
                    >
                      🗑️ Удалить
                    </button>
                  )}
                </div>
                <input type="file" accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => handleFacsimile(s.id, e)}
                  style={{ width: "100%", padding: "6px", background: "#fff", borderRadius: 8, border: "1px solid #CBD5E1" }} />
                {s.facPreview && (
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      borderRadius: 8, padding: 6, border: "1px solid #E2E8F0", background: "#F8FAFC",
                      backgroundImage: "linear-gradient(45deg,#e5e7eb 25%,transparent 25%),linear-gradient(-45deg,#e5e7eb 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e5e7eb 75%),linear-gradient(-45deg,transparent 75%,#e5e7eb 75%)",
                      backgroundSize: "10px 10px", backgroundPosition: "0 0,0 5px,5px -5px,-5px 0",
                    }}>
                      <img src={s.facPreview} alt="факсимиле" style={{ maxHeight: 48, maxWidth: 120, objectFit: "contain", display: "block" }} />
                    </div>
                    <span style={{ fontSize: 11, color: "#94A3B8" }}>Загружено</span>
                  </div>
                )}
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

        <div style={{ ...sectionBox("#F8FAFC", "#E2E8F0"), marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Переменные шаблона</h3>
            <Tooltip text={
              "Переменные заменяются на данные при генерации грамоты.\n\n" +
              "Формат: {НазваниеКолонки} — берётся из Excel.\n\n" +
              "Склонение:\n" +
              "• {ФИО:дательный} → Иванову Ивану\n" +
              "• {ФИО:родительный} → Иванова Ивана\n" +
              "• {ФИО:именительный} → Иванов Иван\n\n" +
              "Слова по полу:\n" +
              "• {род:ученику|ученице}\n" +
              "• {род:награждён|награждена}\n\n" +
              "Пол определяется автоматически по окончанию ФИО."
            } />
          </div>
          <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.8, marginBottom: 12, padding: "10px 14px", background: "#EFF6FF", borderRadius: 8, border: "1px solid #BFDBFE" }}>
            <div style={{ fontWeight: 700, color: "#1E40AF", marginBottom: 6, fontSize: 13 }}>Как вставлять переменные</div>
            <div>Вставьте переменную в текст блока — она автоматически заменится на реальные данные при генерации.</div>
            <div style={{ marginTop: 6 }}>
              📊 <strong>Из Excel:</strong> имя переменной должно точно совпадать с заголовком колонки.
              Пример: колонка «Класс» → <code style={{ background: "#DBEAFE", padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>{"{Класс}"}</code>
            </div>
            <div style={{ marginTop: 6 }}>
              🔤 <strong>Склонение ФИО:</strong> по умолчанию система автоматически склоняет ФИО в зависимости от текста грамоты.
              При необходимости можно явно указать падеж:{" "}
              <code style={{ background: "#DBEAFE", padding: "1px 4px", borderRadius: 3 }}>{"{ФИО:дательный}"}</code>,{" "}
              <code style={{ background: "#DBEAFE", padding: "1px 4px", borderRadius: 3 }}>{"{ФИО:родительный}"}</code>,{" "}
              <code style={{ background: "#DBEAFE", padding: "1px 4px", borderRadius: 3 }}>{"{ФИО:винительный}"}</code> и т.д.
            </div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 8 }}>
            🚀 Быстрая вставка — нажмите для добавления блока:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {QUICK_VARIABLES.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => insertVariableBlock(key)}
                title={VARIABLE_HINTS[key] || `Вставить переменную {${key}}`}
                style={{
                  padding: "7px 10px",
                  border: "1px solid #CBD5E1",
                  background: "#fff",
                  color: "#334155",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "inherit",
                  transition: "border-color 150ms, background 150ms",
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = "#EFF6FF"; e.currentTarget.style.borderColor = "#93C5FD"; }}
                onMouseOut={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#CBD5E1"; }}
              >
                {`{${key}}`}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 14, padding: "10px 12px", background: "#F0FDF4", borderRadius: 8, border: "1px solid #BBF7D0" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#15803D", marginBottom: 8 }}>
              ⚥ Слова по полу — выбираются автоматически по ФИО участника:
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {QUICK_GENDER_VARIANTS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => insertGenderVariantBlock(item.value)}
                  title={`Вставить: ${item.value}\nПри генерации выберет нужный вариант по полу ФИО`}
                  style={{
                    padding: "7px 10px",
                    border: "1px solid #86EFAC",
                    background: "#fff",
                    color: "#166534",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "inherit",
                    transition: "border-color 150ms, background 150ms",
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = "#F0FDF4"; e.currentTarget.style.borderColor = "#4ADE80"; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#86EFAC"; }}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 8 }}>
              Формат: <code style={{ background: "#DCFCE7", padding: "1px 4px", borderRadius: 3 }}>{"{род:вариантМ|вариантЖ}"}</code> — при генерации выбирает нужный по полу ФИО.
            </div>
          </div>
        </div>

        {/* ── Переменные для предпросмотра ── */}
        {detectedPlaceholders.length > 0 && (
          <div style={{ ...sectionBox("#FFF7ED", "#FED7AA"), marginBottom: 24 }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700 }}>Тестовые данные для предпросмотра</h3>
            <p style={{ fontSize: 13, color: "#92400E", margin: "0 0 14px", lineHeight: 1.5 }}>
              Введите любые примерные значения — справа сразу будет виден реальный вид грамоты.
              Проверьте, что длинные имена нормально вписываются в шаблон.
            </p>
            {detectedPlaceholders.some((key) => key.toLowerCase().replace(/\s+/g, "") === "фио" || key.toLowerCase() === "fio") && (
              <div style={{
                marginBottom: 14,
                padding: "12px 14px",
                background: "#FFFFFF",
                border: "1px solid #FED7AA",
                borderRadius: 8,
                color: "#7C2D12",
                fontSize: 13,
                lineHeight: 1.5,
              }}>
                <div style={{ fontWeight: 800, marginBottom: 4 }}>Склонение ФИО применяется автоматически</div>
                <div>
                  По началу текста выбрано: <strong>{fioDeclensionPreview.caseLabel}</strong>, {fioDeclensionPreview.genderLabel}.
                </div>
                <div>
                  Пример: <strong>{fioDeclensionPreview.declinedFio || fioDeclensionPreview.originalFio}</strong>
                </div>
                <div style={{ color: "#A16207", marginTop: 4 }}>
                  Контекст: {fioDeclensionPreview.context || "добавьте формулировку вроде «Вручается» или «Награждается»"}
                </div>
                <div style={{ color: "#A16207", marginTop: 4 }}>
                  Слова по полу: {applyGenderVariantsPreview("{род:ученику|ученице}", fioDeclensionPreview.gender || "male")}
                </div>
              </div>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              {detectedPlaceholders.map((key) => (
                <span
                  key={key}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "5px 9px",
                    borderRadius: 8,
                    background: "#FFFFFF",
                    border: "1px solid #FED7AA",
                    color: "#9A3412",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {`{${key}}`}
                </span>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {detectedPlaceholders.map((key) => (
                <label key={key} style={{ fontSize: 14, fontWeight: 600, color: "#78350F" }}>
                  {`{${key}}`}
                  <input
                    type="text"
                    value={previewVariables[key] ?? ""}
                    onChange={(e) => setPreviewVariables(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={`Пример значения для ${key}…`}
                    style={{ ...inputStyle, marginTop: 4, fontSize: 14 }}
                  />
                  <span style={{ display: "block", marginTop: 4, fontSize: 12, color: "#A16207", fontWeight: 500 }}>
                    На грамоте: {effectivePreviewVariables[key] || `{${key}}`}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Текстовые блоки */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                Текстовые блоки
                <Tooltip text="Каждый блок — отдельная строка текста на грамоте. Настройте текст, размер, цвет и положение. Используйте {ФИО} и {Мероприятие} — они подставятся автоматически." />
              </span>
            </h3>
            <button type="button" onClick={addElement}
              style={{ padding: "8px 18px", background: "#E0E7FF", color: "#4338CA", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>
              Добавить блок
            </button>
          </div>
          <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 16px", lineHeight: 1.5 }}>
            Текст <code style={{ background: "#F1F5F9", padding: "1px 6px", borderRadius: 4, fontSize: 12 }}>{'{' + 'ФИО}'}</code> и{" "}
            <code style={{ background: "#F1F5F9", padding: "1px 6px", borderRadius: 4, fontSize: 12 }}>{'{' + 'Мероприятие' + '}'}</code>{" "}
            будут автоматически заменяться при выпуске каждой грамоты.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {elements.map((el) => (
              <div key={el.id}
                data-element-card-id={el.id}
                style={{
                background: selectedElementId === el.id ? "#EFF6FF" : "#fff",
                border: selectedElementId === el.id ? "2px solid #3B82F6" : "1px solid #E2E8F0",
                borderRadius: 12, padding: 16, position: "relative",
                animation: "elCardIn 200ms ease-out",
                transition: "border-color 150ms, background 150ms, box-shadow 150ms",
                boxShadow: selectedElementId === el.id ? "0 0 0 3px rgba(59,130,246,0.15)" : undefined,
                cursor: "pointer",
              }}
                onClick={() => setSelectedElementId(el.id === selectedElementId ? null : el.id)}
                onContextMenu={(e) => { e.preventDefault(); handleElementContextMenu(el.id, e.clientX, e.clientY); }}
              >
                <button type="button" onClick={(e) => { e.stopPropagation(); pushUndo(); removeEl(el.id); }}
                  title="Удалить блок (Del)"
                  style={{ position: "absolute", top: 10, right: 10, background: "#FEE2E2", color: "#EF4444", border: "none", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontWeight: "bold", fontSize: 16 }}>
                  Г—
                </button>
                <div style={{ marginBottom: 12, paddingRight: 36, position: "relative" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <label style={{ ...labelStyle, fontSize: 14 }}>Текст</label>
                    <button
                      type="button"
                      title="Вставить переменную или слово по полу"
                      onClick={(e) => { e.stopPropagation(); setPickerOpenId((prev) => prev === el.id ? null : el.id); }}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "4px 10px", background: pickerOpenId === el.id ? "#EFF6FF" : "#F8FAFC",
                        border: `1px solid ${pickerOpenId === el.id ? "#93C5FD" : "#CBD5E1"}`,
                        borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 700,
                        color: pickerOpenId === el.id ? "#1D4ED8" : "#475569",
                        fontFamily: "inherit", transition: "background 150ms, border-color 150ms",
                      }}
                    >
                      <span style={{ fontSize: 14, fontFamily: "monospace", fontWeight: 900 }}>{"{}"}</span>
                      Вставить
                    </button>
                  </div>
                  <textarea
                    ref={(node) => { if (node) textareaRefs.current[el.id] = node; else delete textareaRefs.current[el.id]; }}
                    value={el.text}
                    onFocus={() => setSelectedElementId(el.id)}
                    onChange={(e) => updateEl(el.id, "text", e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ ...inputStyle, padding: "10px", resize: "vertical", minHeight: 56, fontSize: 14 }}
                  />
                  {/* Инлайн-пикер переменных */}
                  {pickerOpenId === el.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: "absolute", top: "100%", left: 0, right: 0, zIndex: 9000,
                        background: "#fff", borderRadius: 12, border: "1px solid #BFDBFE",
                        boxShadow: "0 8px 32px rgba(30,64,175,0.13)",
                        overflow: "hidden", animation: "pickerIn 180ms ease-out",
                        marginTop: 4,
                      }}
                    >
                      {/* Заголовок */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px 8px", borderBottom: "1px solid #EFF6FF" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#1D4ED8" }}>Вставить переменную в текст</span>
                        <button type="button" onClick={() => setPickerOpenId(null)}
                          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#94A3B8", lineHeight: 1, padding: "0 2px" }}
                        >Г—</button>
                      </div>

                      <div style={{ padding: "10px 14px 12px" }}>
                        {/* --- Произвольная переменная --- */}
                        <div style={{ marginBottom: 12, display: "flex", gap: 6 }}>
                          <input
                            type="text"
                            placeholder='Своя переменная, напр. {Результат}'
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const raw = e.target.value.trim();
                                if (!raw) return;
                                const text = raw.startsWith("{") ? raw : `{${raw.replace(/[{}]/g, "")}}`;
                                insertAtCursor(el.id, text);
                                e.target.value = "";
                              }
                            }}
                            style={{
                              flex: 1, padding: "7px 10px", border: "1px solid #E2E8F0",
                              borderRadius: 7, fontSize: 13, fontFamily: "monospace", outline: "none",
                            }}
                          />
                          <button
                            type="button"
                            title="Вставить (Enter)"
                            onMouseDown={(e) => {
                              e.preventDefault(); // не уводим фокус с textarea
                              const inp = e.currentTarget.previousSibling;
                              const raw = inp.value.trim();
                              if (!raw) return;
                              const text = raw.startsWith("{") ? raw : `{${raw.replace(/[{}]/g, "")}}`;
                              insertAtCursor(el.id, text);
                              inp.value = "";
                            }}
                            style={{
                              padding: "7px 12px", background: "#1D4ED8", color: "#fff",
                              border: "none", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit",
                            }}
                          >↵</button>
                        </div>

                        {/* --- Примеры переменных --- */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em" }}>Примеры переменных</div>
                          <span style={{ fontSize: 10, background: "#FEF9C3", color: "#854D0E", border: "1px solid #FDE68A", borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>пример</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 8 }}>
                          Переменная должна совпадать с заголовком колонки в Excel
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                          {PICKER_VARIABLES.map(({ key, desc }) => (
                            <button
                              key={key}
                              type="button"
                              title={desc}
                              onClick={() => insertAtCursor(el.id, `{${key}}`)}
                              style={{
                                padding: "6px 11px",
                                background: "#EFF6FF", color: "#1D4ED8",
                                border: "1px solid #BFDBFE", borderRadius: 7,
                                cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit",
                                display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1,
                              }}
                            >
                              <span style={{ fontFamily: "monospace", fontWeight: 900 }}>{`{${key}}`}</span>
                              <span style={{ fontSize: 10, fontWeight: 400, color: "#60A5FA" }}>{desc}</span>
                            </button>
                          ))}
                        </div>

                        {/* --- Слова по полу --- */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em" }}>Слова по полу</div>
                          <span style={{ fontSize: 10, background: "#F0FDF4", color: "#166534", border: "1px solid #86EFAC", borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>пример</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 8 }}>
                          Нужное слово выбирается автоматически по полу участника (по ФИО)
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {PICKER_GENDER_VARIANTS.map(({ label, value }) => (
                            <button
                              key={value}
                              type="button"
                              title={`Вставить: ${value}`}
                              onClick={() => insertAtCursor(el.id, value)}
                              style={{
                                padding: "6px 10px",
                                background: "#F0FDF4", color: "#166534",
                                border: "1px solid #86EFAC", borderRadius: 7,
                                cursor: "pointer", fontFamily: "inherit",
                                display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2,
                              }}
                            >
                              <span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
                              <span style={{ fontSize: 10, fontFamily: "monospace", color: "#15803D", opacity: 0.8 }}>{value}</span>
                            </button>
                          ))}
                        </div>
                        <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 8 }}>
                          Можно добавить своё: <code style={{ background: "#F1F5F9", padding: "1px 4px", borderRadius: 3 }}>{"{род:Слово1|Слово2}"}</code>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <label style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>
                    X: {el.x.toFixed(1)}%
                    <input type="range" min={0} max={100} step={0.5} value={el.x}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={() => setSelectedElementId(el.id)}
                      onChange={(e) => {
                        const clamped = clamp(Number(e.target.value), safePct.xMin, safePct.xMax);
                        updateEl(el.id, "x", clamped);
                      }}
                      style={{ width: "100%", marginTop: 4 }} />
                  </label>
                  <label style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>
                    Y: {el.y.toFixed(1)}%
                    <input type="range" min={0} max={100} step={0.5} value={el.y}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={() => setSelectedElementId(el.id)}
                      onChange={(e) => {
                        const clamped = clamp(Number(e.target.value), safePct.yMin, safePct.yMax);
                        updateEl(el.id, "y", clamped);
                      }}
                      style={{ width: "100%", marginTop: 4 }} />
                  </label>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>Шрифт</label>
                    <select
                      value={el.fontFamily || DEFAULT_FONT_FAMILY}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={() => setSelectedElementId(el.id)}
                      onChange={(e) => updateEl(el.id, "fontFamily", e.target.value)}
                      style={{ ...inputStyle, padding: "8px 10px", fontSize: 14, background: "#fff" }}
                    >
                      {availableFonts.map((font) => (
                        <option key={font.font_family} value={font.font_family}>{font.font_family}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>Размер (pt)</label>
                    <input type="number" min={6} max={120} value={el.size}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={() => setSelectedElementId(el.id)}
                      onChange={(e) => updateEl(el.id, "size", Number(e.target.value))}
                      style={{ ...inputStyle, padding: "8px 10px", fontSize: 14 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>Начертание</label>
                    <select value={el.weight}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={() => setSelectedElementId(el.id)}
                      onChange={(e) => updateEl(el.id, "weight", e.target.value)}
                      style={{ ...inputStyle, padding: "8px 10px", fontSize: 14, background: "#fff" }}>
                      <option value="400">Обычный</option>
                      <option value="600">Полужирный</option>
                      <option value="700">Жирный</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>Цвет</label>
                    <input type="color" value={el.color}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={() => setSelectedElementId(el.id)}
                      onChange={(e) => updateEl(el.id, "color", e.target.value)}
                      style={{ width: "100%", height: 38, padding: 0, border: "none", cursor: "pointer", borderRadius: 6 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ ПРАВАЯ ПАНЕЛЬ — sticky preview ═══ */}
      <div style={{ position: "relative", alignSelf: "stretch", minHeight: 240 }}>
        <div
          className="certificate-preview-card"
          style={{
            ...cardStyle,
            padding: 24,
            position: "sticky",
            top: 148,
            maxHeight: "calc(100vh - 172px)",
            overflow: "auto",
            transform: "translate3d(0, 0, 0)",
            willChange: "transform, opacity",
            transition: "transform 280ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 280ms ease, opacity 200ms ease, filter 280ms ease",
            zIndex: 20,
            animation: "certificatePreviewIn 320ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0F172A" }}>
              Предпросмотр
            </h3>
            <span style={{
              background: "#F0FDF4", color: "#059669",
              border: "1px solid #BBF7D0",
              fontSize: 11, fontWeight: 700,
              padding: "3px 10px", borderRadius: 99,
              letterSpacing: "0.04em",
            }}>● LIVE</span>
          </div>
          <AccuratePreview
            bgUrl={bgUrl}
            elements={elements}
            signers={signers}
            signersLayout={signersLayout}
            margins={margins}
            previewVariables={effectivePreviewVariables}
            fontFaces={availableFonts}
            selectedElementId={selectedElementId}
            onElementSelect={setSelectedElementId}
            onElementMove={handleElementMove}
            onElementContextMenu={handleElementContextMenu}
            onElementDoubleClick={handleElementDoubleClick}
            onSignersMove={handleSignersMove}
          />
          <div style={{ marginTop: 12, padding: "8px 12px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: 10.5, color: "#94A3B8", lineHeight: 1.5, fontWeight: 500, letterSpacing: "0.01em" }}>
              <span style={{ fontWeight: 600, color: "#64748B" }}>Легенда:</span>{" "}
              <span style={{ color: "#EF4444" }}>■ </span> рабочая зона{" · "}
              пунктир = переменная{" · "}
              сетка = мм{" · "}
              1pt ≈ 1.33px
            </div>
          </div>
        </div>
      </div>

      {/* Контекстное меню */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
          items={[
            { icon: "📋", label: "Дублировать", shortcut: "Ctrl+D", onClick: () => { pushUndo(); duplicateEl(ctxMenu.elementId); } },
            { icon: "↔️", label: "Выровнять по центру X", onClick: () => { pushUndo(); centerEl(ctxMenu.elementId); } },
            { separator: true },
            { icon: "🗑️", label: "Удалить", shortcut: "Del", danger: true, onClick: () => { pushUndo(); removeEl(ctxMenu.elementId); } },
          ]}
        />
      )}
    </div>
  );
}
