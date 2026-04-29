import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API_BASE } from "../../constants/index.js";
import { AUTH_STORAGE_KEY } from "../../auth.js";
import { generateSlug, genId } from "./adminStore.js";

const STATUS_LABELS = { published: "Опубликована", draft: "Черновик", archive: "Архив" };
const STATUS_COLORS = {
  published: { bg: "#ECFDF5", color: "#047857" },
  draft: { bg: "#FFFBEB", color: "#B45309" },
  archive: { bg: "#F1F5F9", color: "#475569" },
};
const SCOPE_LABELS = {
  imcro_only: "Общая лента",
  dom_uchitelya_only: "Только Дом учителя",
  both: "Обе ленты",
};

const METHODIKA_SUBJECTS = [
  "Астрономия", "Биология", "География", "Иностранные языки", "Информатика", "Иркутсковедение",
  "История", "Литература", "Математика", "Музыка", "Начальная школа", "ОБЖ", "Обществознание",
  "ОДНКНР", "Русский язык", "Технология", "Физика", "Физическая культура", "Химия", "Экология",
  "Экономика", "ИЗО", "Дошкольное образование", "Дополнительное образование", "Воспитательная работа",
  "Психологическая служба", "Логопедия и дефектология", "Библиотека", "Классное руководство",
];

const DOMU_SECTIONS = [
  { value: "master-klassy", label: "Мастер-классы" },
  { value: "molodye-pedagogi", label: "Клуб молодых педагогов" },
  { value: "nastavnichestvo", label: "Наставничество" },
  { value: "klub-pedagogov", label: "Клуб педагогов" },
  { value: "pedagogicheskaya-gostinaya", label: "Педагогическая гостиная" },
  { value: "konkursy", label: "Конкурсы" },
  { value: "itogi", label: "Итоги и результаты" },
  { value: "fotogalereya", label: "Фотогалерея" },
  { value: "programma", label: "Программа мероприятий" },
];

const NOKO_SECTIONS = [
  { value: "operativnaya-informaciya", label: "Оперативная информация" },
  { value: "gia-9", label: "ГИА-9" },
  { value: "gia-11", label: "ГИА-11" },
  { value: "sborniki", label: "Сборники" },
];

const BLOCK_TYPES = [
  { type: "paragraph", label: "Текст", hint: "Обычный абзац", icon: "T" },
  { type: "heading", label: "Заголовок", hint: "Раздел статьи", icon: "H" },
  { type: "list", label: "Список", hint: "Пункты или шаги", icon: "≡" },
  { type: "image", label: "Изображение", hint: "Фото с подписью", icon: "▧" },
  { type: "quote", label: "Цитата", hint: "Выделенная мысль", icon: "“”" },
  { type: "divider", label: "Разделитель", hint: "Пауза между блоками", icon: "—" },
];

const EMPTY_ARTICLE = {
  title: "",
  slug: "",
  status: "draft",
  lead: "",
  body: "",
  blocks: [],
  cover_image_url: "",
  published_at: "",
  is_pinned: false,
  publishing_scope: "imcro_only",
  tags: [],
  methodika_subject: "",
  dom_uchitelya_section: "",
  noko_section: "",
};

function getStoredToken() {
  try {
    const user = JSON.parse(window.localStorage.getItem(AUTH_STORAGE_KEY) || "null");
    return user?.access_token || window.localStorage.getItem("mky_access_token") || "";
  } catch {
    return window.localStorage.getItem("mky_access_token") || "";
  }
}

function toDateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function fromDateInputValue(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function defaultBlock(type = "paragraph") {
  const base = { id: genId(), type, data: {} };
  if (type === "heading") return { ...base, data: { text: "", level: 2 } };
  if (type === "list") return { ...base, data: { ordered: false, items: [""] } };
  if (type === "image") return { ...base, data: { url: "", caption: "" } };
  if (type === "quote") return { ...base, data: { html: "", author: "" } };
  if (type === "divider") return base;
  return { ...base, data: { html: "" } };
}

function normalizeBlock(block) {
  if (!block || typeof block !== "object") return defaultBlock();
  if (block.type === "hero") return { id: block.id || genId(), type: "heading", data: { text: block.data?.title || "", level: 1 } };
  if (block.type === "paragraph") return { id: block.id || genId(), type: "paragraph", data: { html: block.data?.html || block.data?.text || "" } };
  if (block.type === "heading") return { id: block.id || genId(), type: "heading", data: { text: block.data?.text || block.data?.title || "", level: Number(block.data?.level || 2) } };
  if (block.type === "list") return { id: block.id || genId(), type: "list", data: { ordered: Boolean(block.data?.ordered), items: Array.isArray(block.data?.items) ? block.data.items : [""] } };
  if (block.type === "image") return { id: block.id || genId(), type: "image", data: { url: block.data?.url || "", caption: block.data?.caption || "" } };
  if (block.type === "quote") return { id: block.id || genId(), type: "quote", data: { html: block.data?.html || block.data?.text || "", author: block.data?.author || "" } };
  if (block.type === "divider") return { id: block.id || genId(), type: "divider", data: {} };
  return defaultBlock();
}

function parseBodyBlocks(article) {
  if (Array.isArray(article.blocks) && article.blocks.length) return article.blocks.map(normalizeBlock);
  if (typeof article.body === "string" && article.body.trim()) {
    try {
      const parsed = JSON.parse(article.body);
      if (Array.isArray(parsed)) return parsed.map(normalizeBlock);
    } catch {
      return [{ ...defaultBlock("paragraph"), data: { html: article.body } }];
    }
  }
  return [];
}

function normalizeArticle(article, defaultScope) {
  const blocks = parseBodyBlocks(article);
  const firstParagraph = blocks.find((block) => block.type === "paragraph");
  const firstImage = blocks.find((block) => block.type === "image");
  return {
    ...EMPTY_ARTICLE,
    ...article,
    lead: article.lead ?? article.excerpt ?? "",
    blocks,
    body: typeof article.body === "string" ? article.body : JSON.stringify(blocks),
    cover_image_url: article.cover_image_url ?? article.image ?? firstImage?.data?.url ?? "",
    published_at: toDateInputValue(article.published_at ?? article.publishedAt),
    publishing_scope: article.publishing_scope || defaultScope,
    tags: Array.isArray(article.tags) ? article.tags : [],
    methodika_subject: article.methodika_subject || "",
    dom_uchitelya_section: article.dom_uchitelya_section || "",
    noko_section: article.noko_section || "",
    is_pinned: Boolean(article.is_pinned),
    _firstParagraph: firstParagraph?.data?.html || "",
  };
}

function plainTextFromBlocks(blocks) {
  return blocks
    .map((block) => {
      if (block.type === "heading") return block.data.text || "";
      if (block.type === "list") return (block.data.items || []).join(" ");
      return String(block.data.html || block.data.caption || "").replace(/<[^>]*>/g, " ");
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function toPayload(form) {
  const lead = form.lead.trim();
  const cover = form.cover_image_url.trim();
  const blocks = (form.blocks || []).map(normalizeBlock);
  return {
    title: form.title.trim(),
    slug: form.slug.trim() || generateSlug(form.title),
    status: form.status,
    lead,
    excerpt: lead,
    body: JSON.stringify(blocks),
    blocks,
    cover_image_url: cover || null,
    image: cover || null,
    published_at: fromDateInputValue(form.published_at),
    is_pinned: Boolean(form.is_pinned),
    publishing_scope: form.publishing_scope,
    tags: form.tags || [],
    categories: form.categories || [],
    methodika_subject: form.methodika_subject || null,
    dom_uchitelya_section: form.dom_uchitelya_section || null,
    noko_section: form.noko_section || null,
  };
}

function sortArticles(items) {
  return [...items].sort((left, right) => {
    if (Boolean(left.is_pinned) !== Boolean(right.is_pinned)) return left.is_pinned ? -1 : 1;
    const leftDate = Date.parse(left.published_at || left.updated_at || left.updatedAt || left.created_at || left.createdAt || "");
    const rightDate = Date.parse(right.published_at || right.updated_at || right.updatedAt || right.created_at || right.createdAt || "");
    return (Number.isNaN(rightDate) ? 0 : rightDate) - (Number.isNaN(leftDate) ? 0 : leftDate);
  });
}

function ChipInput({ value, onChange }) {
  const [input, setInput] = useState("");
  const add = () => {
    const tag = input.trim();
    if (!tag || value.includes(tag)) return;
    onChange([...value, tag]);
    setInput("");
  };
  return (
    <div className="article-chipbox">
      {value.map((tag) => (
        <span className="article-chip" key={tag}>
          #{tag}
          <button type="button" onClick={() => onChange(value.filter((item) => item !== tag))} aria-label={`Убрать тег ${tag}`}>×</button>
        </span>
      ))}
      <input
        value={input}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            add();
          }
        }}
        onBlur={add}
        placeholder={value.length ? "Добавить тег" : "Добавьте теги"}
      />
    </div>
  );
}

function RichText({ value, onChange, placeholder }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value || "";
  }, [value]);
  const command = (name, arg = null) => {
    ref.current?.focus();
    document.execCommand(name, false, arg);
    onChange(ref.current?.innerHTML || "");
  };
  const addLink = () => {
    const href = window.prompt("Введите ссылку");
    if (href) command("createLink", href);
  };
  return (
    <div className="block-rich">
      <div className="block-rich-toolbar" aria-label="Форматирование текста">
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => command("bold")} title="Жирный">B</button>
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => command("italic")} title="Курсив">I</button>
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={addLink} title="Ссылка">↗</button>
      </div>
      <div
        ref={ref}
        className="block-rich-area"
        contentEditable
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        onPaste={(event) => {
          event.preventDefault();
          const text = event.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
        }}
      />
    </div>
  );
}

function BlockPreview({ block }) {
  if (block.type === "heading") {
    const Tag = `h${Math.min(Math.max(Number(block.data.level || 2), 1), 3)}`;
    return <Tag className="preview-heading">{block.data.text || "Заголовок"}</Tag>;
  }
  if (block.type === "paragraph") return <div className="preview-paragraph" dangerouslySetInnerHTML={{ __html: block.data.html || "" }} />;
  if (block.type === "quote") {
    return (
      <blockquote className="preview-quote">
        <div dangerouslySetInnerHTML={{ __html: block.data.html || "" }} />
        {block.data.author && <cite>{block.data.author}</cite>}
      </blockquote>
    );
  }
  if (block.type === "list") {
    const Tag = block.data.ordered ? "ol" : "ul";
    return <Tag className="preview-list">{(block.data.items || []).filter(Boolean).map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</Tag>;
  }
  if (block.type === "image") {
    return (
      <figure className="preview-image">
        {block.data.url ? <img src={block.data.url} alt={block.data.caption || ""} /> : <div>Изображение не загружено</div>}
        {block.data.caption && <figcaption>{block.data.caption}</figcaption>}
      </figure>
    );
  }
  if (block.type === "divider") return <hr className="preview-divider" />;
  return null;
}

function BlockEditor({ block, onChange, onRemove, onMove, index, count, uploadImage }) {
  const updateData = (data) => onChange({ ...block, data: { ...block.data, ...data } });
  const handleImageFile = async (file) => {
    if (!file) return;
    updateData({ url: URL.createObjectURL(file) });
    const uploaded = await uploadImage(file);
    if (uploaded) updateData({ url: uploaded });
  };
  return (
    <article
      className="block-card"
      draggable
      onDragStart={(event) => event.dataTransfer.setData("text/plain", block.id)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const draggedId = event.dataTransfer.getData("text/plain");
        if (draggedId && draggedId !== block.id) onMove(draggedId, block.id);
      }}
    >
      <div className="block-handle" aria-label={`Блок ${index + 1}`}>
        <span>::</span>
        <strong>{BLOCK_TYPES.find((item) => item.type === block.type)?.label}</strong>
        <div />
        <button type="button" onClick={() => onMove(block.id, null, -1)} disabled={index === 0} aria-label="Переместить выше">↑</button>
        <button type="button" onClick={() => onMove(block.id, null, 1)} disabled={index === count - 1} aria-label="Переместить ниже">↓</button>
        <button type="button" className="danger" onClick={() => onRemove(block.id)} aria-label="Удалить блок">×</button>
      </div>
      <div className="block-body">
        {block.type === "heading" && (
          <div className="block-grid-compact">
            <select value={block.data.level || 2} onChange={(event) => updateData({ level: Number(event.target.value) })}>
              <option value={1}>H1</option>
              <option value={2}>H2</option>
              <option value={3}>H3</option>
            </select>
            <input value={block.data.text || ""} onChange={(event) => updateData({ text: event.target.value })} placeholder="Заголовок раздела" />
          </div>
        )}
        {block.type === "paragraph" && <RichText value={block.data.html || ""} onChange={(html) => updateData({ html })} placeholder="Введите текст. Можно выделить фрагмент и нажать B, I или ссылку." />}
        {block.type === "quote" && (
          <>
            <RichText value={block.data.html || ""} onChange={(html) => updateData({ html })} placeholder="Текст цитаты" />
            <input value={block.data.author || ""} onChange={(event) => updateData({ author: event.target.value })} placeholder="Автор или источник" />
          </>
        )}
        {block.type === "list" && (
          <>
            <label className="article-check compact">
              <input type="checkbox" checked={Boolean(block.data.ordered)} onChange={(event) => updateData({ ordered: event.target.checked })} />
              <span>Нумерованный список</span>
            </label>
            {(block.data.items || [""]).map((item, itemIndex) => (
              <div className="list-row" key={itemIndex}>
                <input
                  value={item}
                  onChange={(event) => {
                    const items = [...(block.data.items || [""])];
                    items[itemIndex] = event.target.value;
                    updateData({ items });
                  }}
                  placeholder={`Пункт ${itemIndex + 1}`}
                />
                <button type="button" onClick={() => updateData({ items: (block.data.items || []).filter((_, indexToRemove) => indexToRemove !== itemIndex) })}>×</button>
              </div>
            ))}
            <button type="button" className="mini-add" onClick={() => updateData({ items: [...(block.data.items || []), ""] })}>Добавить пункт</button>
          </>
        )}
        {block.type === "image" && (
          <div
            className="image-drop"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              handleImageFile(event.dataTransfer.files?.[0]);
            }}
          >
            {block.data.url ? <img src={block.data.url} alt="" /> : <div>Перетащите изображение сюда</div>}
            <label>
              Загрузить изображение
              <input type="file" accept="image/*" onChange={(event) => handleImageFile(event.target.files?.[0])} />
            </label>
            <input value={block.data.url || ""} onChange={(event) => updateData({ url: event.target.value })} placeholder="/static/articles/covers/image.jpg" />
            <input value={block.data.caption || ""} onChange={(event) => updateData({ caption: event.target.value })} placeholder="Подпись к изображению" />
          </div>
        )}
        {block.type === "divider" && <div className="divider-editor">Разделитель появится как горизонтальная линия в статье.</div>}
      </div>
    </article>
  );
}

function BlockWorkspace({ blocks, onChange, uploadImage }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const addBlock = (type) => {
    onChange([...blocks, defaultBlock(type)]);
    setPickerOpen(false);
  };
  const updateBlock = (block) => onChange(blocks.map((item) => item.id === block.id ? block : item));
  const removeBlock = (id) => onChange(blocks.filter((item) => item.id !== id));
  const moveBlock = (draggedId, targetId = null, direction = 0) => {
    const currentIndex = blocks.findIndex((item) => item.id === draggedId);
    if (currentIndex < 0) return;
    const next = [...blocks];
    const [item] = next.splice(currentIndex, 1);
    if (direction) {
      const targetIndex = Math.max(0, Math.min(blocks.length - 1, currentIndex + direction));
      next.splice(targetIndex, 0, item);
    } else {
      const targetIndex = next.findIndex((entry) => entry.id === targetId);
      next.splice(targetIndex < 0 ? next.length : targetIndex, 0, item);
    }
    onChange(next);
  };
  const addDroppedImage = async (file) => {
    if (!file?.type?.startsWith("image/")) return;
    const block = defaultBlock("image");
    block.data.url = URL.createObjectURL(file);
    onChange([...blocks, block]);
    const url = await uploadImage(file);
    if (url) onChange([...blocks, { ...block, data: { ...block.data, url } }]);
  };
  return (
    <section
      className="block-workspace"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        if (event.dataTransfer.files?.length) {
          event.preventDefault();
          addDroppedImage(event.dataTransfer.files[0]);
        }
      }}
    >
      <div className="block-toolbar">
        <div>
          <span>Тело статьи</span>
          <strong>{blocks.length} блоков</strong>
        </div>
        <button type="button" onClick={() => setPickerOpen((value) => !value)}>Добавить блок</button>
      </div>
      {pickerOpen && (
        <div className="block-picker">
          {BLOCK_TYPES.map((blockType) => (
            <button type="button" key={blockType.type} onClick={() => addBlock(blockType.type)}>
              <span>{blockType.icon}</span>
              <strong>{blockType.label}</strong>
              <small>{blockType.hint}</small>
            </button>
          ))}
        </div>
      )}
      {!blocks.length && (
        <div className="block-empty">
          <strong>Начните с первого блока</strong>
          <span>Добавьте текст, заголовок или просто перетащите сюда изображение.</span>
        </div>
      )}
      {blocks.map((block, index) => (
        <BlockEditor
          key={block.id}
          block={block}
          index={index}
          count={blocks.length}
          onChange={updateBlock}
          onRemove={removeBlock}
          onMove={moveBlock}
          uploadImage={uploadImage}
        />
      ))}
    </section>
  );
}

function ArticlePreviewModal({ article, onClose }) {
  return (
    <div className="preview-modal" role="dialog" aria-modal="true" aria-label="Предпросмотр статьи">
      <div className="preview-modal-panel">
        <div className="preview-modal-head">
          <strong>Предпросмотр статьи</strong>
          <button type="button" onClick={onClose}>Закрыть</button>
        </div>
        <ArticlePreview article={article} expanded />
      </div>
    </div>
  );
}

function ArticlePreview({ article, expanded = false }) {
  const title = article.title.trim() || "Заголовок статьи";
  const lead = article.lead.trim() || "Лид появится здесь и поможет читателю понять, о чем материал.";
  const date = article.published_at ? new Date(article.published_at).toLocaleString("ru-RU") : "Дата публикации не выбрана";
  return (
    <aside className={expanded ? "article-preview expanded" : "article-preview"} aria-label="Предпросмотр статьи">
      <section className="article-preview-card">
        {article.cover_image_url ? <img src={article.cover_image_url} alt="" /> : <div className="article-preview-image">Обложка</div>}
        <div className="article-preview-meta">
          <span>{SCOPE_LABELS[article.publishing_scope]}</span>
          <span>{date}</span>
          {article.is_pinned && <span>Закреплена</span>}
        </div>
        <h1>{title}</h1>
        <p>{lead}</p>
        <div className="block-preview-stack">
          {(article.blocks || []).length
            ? article.blocks.map((block) => <BlockPreview key={block.id} block={block} />)
            : <div className="article-preview-empty">Добавьте блоки, чтобы увидеть статью.</div>
          }
        </div>
      </section>
      <section className="seo-preview">
        <div className="seo-title">{title}</div>
        <div className="seo-url">imcro.ru/news/{article.slug || "slug-materiala"}</div>
        <p>{lead.slice(0, 160)}</p>
      </section>
      <section className="feed-preview">
        <strong>Карточка в ленте</strong>
        <div>{article.is_pinned ? "Закрепленная новость" : "Обычная новость"}</div>
        <p>{title}</p>
      </section>
    </aside>
  );
}

function ValidationPanel({ errors, modeLabel }) {
  if (!errors.length) {
    return <div className="article-ok">Готово к сохранению: обязательные поля заполнены для раздела {modeLabel}.</div>;
  }
  return (
    <div className="article-errors" role="alert">
      {errors.map((error) => <div key={error}>{error}</div>)}
    </div>
  );
}

function ArticleForm({
  article,
  currentUser,
  allowedScopes,
  defaultScope,
  uploadCover,
  onSave,
  onCancel,
  isDomuMode,
  apiMode,
}) {
  const isNew = !article?.id;
  const [form, setForm] = useState(() => normalizeArticle(article || { publishing_scope: defaultScope }, defaultScope));
  const [slugLocked, setSlugLocked] = useState(Boolean(article?.slug));
  const [saving, setSaving] = useState(false);
  const [draftNotice, setDraftNotice] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const draftKey = `mky_article_block_draft_${article?.id || form.slug || "new"}_${isDomuMode ? "domu" : "common"}`;
  const role = currentUser?.role?.role_name || currentUser?.role || "user";
  const allowedSubjects = role === "methodist" && Array.isArray(currentUser?.allowed_methodika_subjects) && currentUser.allowed_methodika_subjects.length
    ? METHODIKA_SUBJECTS.filter((subject) => currentUser.allowed_methodika_subjects.includes(subject))
    : METHODIKA_SUBJECTS;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (!raw) return;
      const draft = JSON.parse(raw);
      const serverTime = Date.parse(article?.updated_at || article?.updatedAt || 0);
      if (!article?.id || Date.parse(draft.savedAt || 0) > serverTime) setDraftNotice("Найден локальный автосохраненный черновик.");
    } catch {
      setDraftNotice("");
    }
  }, [article?.id, article?.updated_at, article?.updatedAt, draftKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(draftKey, JSON.stringify({ savedAt: new Date().toISOString(), form }));
      } catch {
        // Autosave is best-effort; explicit save remains primary.
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [draftKey, form]);

  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updateTitle = (value) => {
    setForm((current) => ({
      ...current,
      title: value,
      slug: slugLocked ? current.slug : generateSlug(value),
    }));
  };
  const updateScope = (scope) => {
    setForm((current) => ({
      ...current,
      publishing_scope: scope,
      dom_uchitelya_section: scope === "imcro_only" ? "" : current.dom_uchitelya_section,
      methodika_subject: scope === "dom_uchitelya_only" ? "" : current.methodika_subject,
      noko_section: scope === "dom_uchitelya_only" ? "" : current.noko_section,
    }));
  };
  const restoreDraft = () => {
    try {
      const draft = JSON.parse(window.localStorage.getItem(draftKey) || "{}");
      if (draft.form) {
        setForm(draft.form);
        setDraftNotice("");
      }
    } catch {
      setDraftNotice("");
    }
  };
  const handleCoverUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    set("cover_image_url", URL.createObjectURL(file));
    if (!apiMode) return;
    const url = await uploadCover(file);
    if (url) set("cover_image_url", url);
  };

  const errors = useMemo(() => {
    const list = [];
    const hasText = plainTextFromBlocks(form.blocks).length > 0 || form.blocks.some((block) => block.type === "image" && block.data.url);
    if (!form.title.trim()) list.push("Заполните заголовок.");
    if (!form.slug.trim()) list.push("Заполните slug.");
    if (!form.lead.trim()) list.push("Добавьте лид/анонс.");
    if (!hasText) list.push("Добавьте хотя бы один содержательный блок.");
    if (!allowedScopes.includes(form.publishing_scope)) list.push("Выберите допустимую область публикации.");
    if (form.publishing_scope === "dom_uchitelya_only" && !form.dom_uchitelya_section) list.push("Для Дома учителя нужен раздел.");
    if (isDomuMode && !form.dom_uchitelya_section) list.push("Для админки Дома учителя раздел обязателен.");
    if (form.publishing_scope === "imcro_only" && !form.methodika_subject && !form.noko_section) list.push("Для общей ленты выберите предмет Методики или раздел НОКО.");
    if (form.methodika_subject && !allowedSubjects.includes(form.methodika_subject)) list.push("Этот предмет недоступен текущему методисту.");
    return list;
  }, [allowedScopes, allowedSubjects, form, isDomuMode]);

  const handleSave = async () => {
    if (errors.length) return;
    setSaving(true);
    try {
      await onSave(toPayload(form), article?.id);
      window.localStorage.removeItem(draftKey);
      onCancel();
    } catch {
      // Error text is shown by the parent module; keep the local draft in place.
    } finally {
      setSaving(false);
    }
  };

  const showDomu = form.publishing_scope !== "imcro_only" || isDomuMode;
  const showCommonTargets = !isDomuMode && form.publishing_scope !== "dom_uchitelya_only";

  return (
    <div className="article-editor-shell">
      <div className="article-editor-topbar">
        <button type="button" className="article-btn article-btn-muted" onClick={onCancel}>Назад</button>
        <div className="article-editor-title">
          <span>{apiMode ? "Серверный блочный редактор" : "Демо-редактор"}</span>
          <h2>{isNew ? "Новая статья" : "Редактирование статьи"}</h2>
        </div>
        <button type="button" className="article-btn article-btn-muted" onClick={() => setPreviewOpen(true)}>Предпросмотр</button>
        <button type="button" className="article-btn article-btn-primary" onClick={handleSave} disabled={saving || errors.length > 0}>
          {saving ? "Сохраняю..." : "Сохранить"}
        </button>
      </div>

      {draftNotice && (
        <div className="article-draft-banner">
          <span>{draftNotice}</span>
          <button type="button" onClick={restoreDraft}>Восстановить</button>
        </div>
      )}

      <div className="article-editor-grid">
        <main className="article-editor-main">
          <section className="article-panel">
            <label className="article-label" htmlFor="article-title">Заголовок</label>
            <input id="article-title" className="article-title-input" value={form.title} onChange={(event) => updateTitle(event.target.value)} placeholder="Например: Городской семинар для педагогов" />
            <label className="article-slug-row">
              <span>Slug</span>
              <input value={form.slug} onChange={(event) => { setSlugLocked(true); set("slug", generateSlug(event.target.value) || event.target.value); }} placeholder="slug-materiala" />
              <button type="button" onClick={() => { setSlugLocked(false); set("slug", generateSlug(form.title)); }}>Сгенерировать</button>
            </label>
          </section>

          <section className="article-panel">
            <label className="article-label" htmlFor="article-lead">Лид</label>
            <textarea id="article-lead" className="article-lead-input" rows={3} value={form.lead} onChange={(event) => set("lead", event.target.value)} placeholder="Короткий анонс для карточки и SEO-превью" />
          </section>

          <BlockWorkspace blocks={form.blocks || []} onChange={(blocks) => set("blocks", blocks)} uploadImage={uploadCover} />
        </main>

        <aside className="article-editor-side">
          <section className="article-panel article-panel-compact">
            <ValidationPanel errors={errors} modeLabel={isDomuMode ? "Дома учителя" : "общей админки"} />
          </section>
          <section className="article-panel article-panel-compact">
            <div className="article-label">Публикация</div>
            <select className="article-select" value={form.status} onChange={(event) => set("status", event.target.value)}>
              {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <label className="article-check">
              <input type="checkbox" checked={form.is_pinned} onChange={(event) => set("is_pinned", event.target.checked)} />
              <span>Закрепить в начале ленты</span>
            </label>
            <label className="article-stack-label">
              <span>Дата и время публикации</span>
              <input type="datetime-local" value={form.published_at} onChange={(event) => set("published_at", event.target.value)} />
            </label>
          </section>

          <section className="article-panel article-panel-compact">
            <div className="article-label">Область и раздел</div>
            <select className="article-select" value={form.publishing_scope} onChange={(event) => updateScope(event.target.value)}>
              {allowedScopes.map((scope) => <option key={scope} value={scope}>{SCOPE_LABELS[scope]}</option>)}
            </select>
            {showDomu && (
              <label className="article-stack-label">
                <span>Раздел Дома учителя</span>
                <select value={form.dom_uchitelya_section} onChange={(event) => set("dom_uchitelya_section", event.target.value)}>
                  <option value="">Выберите раздел</option>
                  {DOMU_SECTIONS.map((section) => <option key={section.value} value={section.value}>{section.label}</option>)}
                </select>
              </label>
            )}
            {showCommonTargets && (
              <>
                <label className="article-stack-label">
                  <span>Предмет Методического пространства</span>
                  <select value={form.methodika_subject} onChange={(event) => { set("methodika_subject", event.target.value); if (event.target.value) set("noko_section", ""); }}>
                    <option value="">Не выбрано</option>
                    {allowedSubjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
                  </select>
                </label>
                <label className="article-stack-label">
                  <span>Раздел НОКО</span>
                  <select value={form.noko_section} onChange={(event) => { set("noko_section", event.target.value); if (event.target.value) set("methodika_subject", ""); }}>
                    <option value="">Не выбрано</option>
                    {NOKO_SECTIONS.map((section) => <option key={section.value} value={section.value}>{section.label}</option>)}
                  </select>
                </label>
              </>
            )}
          </section>

          <section className="article-panel article-panel-compact">
            <div className="article-label">Главное изображение</div>
            {form.cover_image_url && <img className="article-cover-preview" src={form.cover_image_url} alt="" />}
            <input className="article-file" type="file" accept="image/*" onChange={handleCoverUpload} />
            <input className="article-select" value={form.cover_image_url} onChange={(event) => set("cover_image_url", event.target.value)} placeholder="/images/news1.jpg" />
          </section>

          <section className="article-panel article-panel-compact">
            <div className="article-label">Теги</div>
            <ChipInput value={form.tags} onChange={(value) => set("tags", value)} />
          </section>
        </aside>

        <ArticlePreview article={form} />
      </div>
      {previewOpen && <ArticlePreviewModal article={form} onClose={() => setPreviewOpen(false)} />}
    </div>
  );
}

function ArticlesList({ articles, onNew, onEdit, onDelete, onStatus }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = sortArticles(articles).filter((article) => {
    if (search && !article.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (status !== "all" && article.status !== status) return false;
    return true;
  });
  return (
    <div className="article-list">
      <div className="article-list-head">
        <div>
          <span>Контент</span>
          <h2>Статьи</h2>
        </div>
        <button type="button" className="article-btn article-btn-primary" onClick={onNew}>Новая статья</button>
      </div>
      <div className="article-filters">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск по заголовку" />
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">Все статусы</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <div className="article-table-wrap">
        <table className="article-table">
          <thead>
            <tr>
              <th>Материал</th>
              <th>Размещение</th>
              <th>Статус</th>
              <th>Раздел</th>
              <th>Обновлена</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {!filtered.length && <tr><td colSpan={6} className="article-empty-row">Статьи не найдены</td></tr>}
            {filtered.map((article) => {
              const statusStyle = STATUS_COLORS[article.status] || STATUS_COLORS.draft;
              return (
                <tr key={article.id}>
                  <td>
                    <strong>{article.is_pinned ? "★ " : ""}{article.title}</strong>
                    <span>/{article.slug}</span>
                  </td>
                  <td>{SCOPE_LABELS[article.publishing_scope || "imcro_only"]}</td>
                  <td><mark style={statusStyle}>{STATUS_LABELS[article.status]}</mark></td>
                  <td>{article.dom_uchitelya_section || article.methodika_subject || article.noko_section || "Не задан"}</td>
                  <td>{toDateInputValue(article.updated_at || article.updatedAt || article.created_at || article.createdAt).replace("T", " ")}</td>
                  <td>
                    <div className="article-row-actions">
                      <button type="button" onClick={() => onEdit(article)}>Редактировать</button>
                      <select value={article.status} onChange={(event) => onStatus(article, event.target.value)}>
                        {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                      <button type="button" className="danger" onClick={() => window.confirm(`Удалить "${article.title}"?`) && onDelete(article)}>
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ArticlesModule({
  currentUser,
  articles: localArticles = [],
  saveArticle: saveLocalArticle,
  deleteArticle: deleteLocalArticle,
  changeArticleStatus: changeLocalArticleStatus,
  allowedScopes = ["imcro_only", "dom_uchitelya_only", "both"],
  defaultScope = "imcro_only",
  apiPath = "/api/admin/news/",
  uploadPath = "/api/admin/news/upload-cover/",
  isDomuMode = false,
}) {
  const [articles, setArticles] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = getStoredToken();
  const apiMode = Boolean(token);
  const authHeaders = useMemo(() => token ? { Authorization: `Bearer ${token}` } : {}, [token]);

  const loadArticles = useCallback(async () => {
    if (!apiMode) {
      setArticles(localArticles.map((article) => normalizeArticle(article, defaultScope)));
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}${apiPath}`, { headers: authHeaders });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setArticles((data.items || []).map((article) => normalizeArticle(article, defaultScope)));
    } catch {
      setError("Не удалось загрузить статьи с сервера. Показан локальный демо-список.");
      setArticles(localArticles.map((article) => normalizeArticle(article, defaultScope)));
    } finally {
      setLoading(false);
    }
  }, [apiMode, apiPath, authHeaders, defaultScope, localArticles]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const saveArticle = async (payload, id) => {
    const nextPayload = { ...payload, publishing_scope: payload.publishing_scope || defaultScope };
    if (!apiMode) {
      saveLocalArticle?.({ ...nextPayload, id, updatedAt: new Date().toISOString(), createdAt: new Date().toISOString() });
      return;
    }
    const response = await fetch(`${API_BASE}${apiPath}${id ? `${id}/` : ""}`, {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(nextPayload),
    });
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      setError(detail.detail || "Не удалось сохранить статью.");
      throw new Error("Article save failed");
    }
    await loadArticles();
  };

  const deleteArticle = async (article) => {
    if (!apiMode) {
      deleteLocalArticle?.(article.id);
      return;
    }
    const response = await fetch(`${API_BASE}${apiPath}${article.id}/`, { method: "DELETE", headers: authHeaders });
    if (!response.ok) {
      setError("Не удалось удалить статью.");
      return;
    }
    await loadArticles();
  };

  const changeStatus = async (article, status) => {
    if (!apiMode) {
      changeLocalArticleStatus?.(article.id, status);
      return;
    }
    const response = await fetch(`${API_BASE}${apiPath}${article.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) setError("Не удалось изменить статус.");
    await loadArticles();
  };

  const uploadCover = async (file) => {
    if (!apiMode) return "";
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_BASE}${uploadPath}`, { method: "POST", headers: authHeaders, body: formData });
    if (!response.ok) {
      setError("Не удалось загрузить изображение.");
      return "";
    }
    const data = await response.json();
    return `${API_BASE}${data.url}`;
  };

  return (
    <div className="articles-module">
      <style>{ARTICLE_CSS}</style>
      {error && <div className="article-errors article-global-error" role="alert">{error}</div>}
      {!apiMode && <div className="article-demo-mode">Нет JWT-токена: редактор работает в локальном демо-режиме, автосохранение и создание не исчезают при переходах.</div>}
      {loading ? (
        <div className="article-loading">Загрузка статей...</div>
      ) : editing ? (
        <ArticleForm
          article={editing === "new" ? null : editing}
          currentUser={currentUser}
          allowedScopes={allowedScopes}
          defaultScope={defaultScope}
          uploadCover={uploadCover}
          onSave={saveArticle}
          onCancel={() => setEditing(null)}
          isDomuMode={isDomuMode}
          apiMode={apiMode}
        />
      ) : (
        <ArticlesList
          articles={articles}
          onNew={() => setEditing("new")}
          onEdit={(article) => setEditing(article)}
          onDelete={deleteArticle}
          onStatus={changeStatus}
        />
      )}
    </div>
  );
}

const ARTICLE_CSS = `
.articles-module { color: #0f172a; }
.article-btn, .article-row-actions button, .article-row-actions select { min-height: 40px; border-radius: 8px; border: 1px solid #cbd5e1; background: #fff; color: #334155; padding: 0 14px; font: inherit; font-size: 13px; font-weight: 800; cursor: pointer; }
.article-btn:disabled { opacity: .55; cursor: not-allowed; }
.article-btn-primary { background: #1d4ed8; border-color: #1d4ed8; color: #fff; }
.article-btn-muted { background: #fff; color: #475569; }
.article-editor-topbar, .article-list-head { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; flex-wrap: wrap; }
.article-editor-title { flex: 1; min-width: 220px; }
.article-editor-title span, .article-list-head span { display: block; color: #64748b; font-size: 12px; font-weight: 900; text-transform: uppercase; margin-bottom: 3px; }
.article-editor-title h2, .article-list-head h2 { margin: 0; font-size: 24px; line-height: 1.1; }
.article-editor-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; align-items: start; }
.article-editor-main, .article-editor-side { display: grid; gap: 14px; min-width: 0; }
.article-panel, .block-workspace { border: 1px solid #dbe6f5; border-radius: 8px; background: #fff; padding: 18px; box-shadow: 0 12px 32px rgba(15, 23, 42, .05); }
.article-panel-compact { padding: 16px; }
.article-label { display: block; color: #64748b; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 9px; }
.article-title-input { width: 100%; border: 0; outline: 0; background: transparent; color: #0f172a; font: inherit; font-size: clamp(24px, 5vw, 38px); font-weight: 900; line-height: 1.05; }
.article-slug-row { display: flex; align-items: center; gap: 8px; margin-top: 14px; padding-top: 12px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 13px; font-weight: 800; flex-wrap: wrap; }
.article-slug-row input { flex: 1; min-width: 180px; border: 0; outline: 0; background: transparent; color: #475569; font: inherit; }
.article-slug-row button, .block-toolbar button, .mini-add { min-height: 34px; border: 1px solid #bfdbfe; border-radius: 8px; background: #eff6ff; color: #1d4ed8; font: inherit; font-size: 12px; font-weight: 900; cursor: pointer; padding: 0 10px; }
.article-lead-input { width: 100%; resize: vertical; border: 1.5px solid #cbd5e1; border-radius: 8px; background: #f8fafc; color: #0f172a; padding: 12px; font: inherit; font-size: 15px; line-height: 1.6; }
.article-select, .article-filters input, .article-filters select, .article-stack-label input, .article-stack-label select, .block-body input, .block-body select { width: 100%; min-height: 42px; border: 1.5px solid #cbd5e1; border-radius: 8px; background: #f8fafc; color: #0f172a; padding: 0 12px; font: inherit; font-size: 14px; }
.article-select:focus, .article-filters input:focus, .article-filters select:focus, .article-stack-label input:focus, .article-stack-label select:focus, .article-lead-input:focus, .block-body input:focus, .block-body select:focus, .block-rich-area:focus { outline: 3px solid rgba(29, 78, 216, .18); border-color: #1d4ed8; }
.article-stack-label { display: grid; gap: 7px; margin-top: 12px; color: #475569; font-size: 13px; font-weight: 800; }
.article-check { display: flex; align-items: center; gap: 9px; min-height: 38px; margin-top: 12px; font-weight: 800; color: #334155; }
.article-check.compact { margin: 0 0 10px; min-height: 30px; }
.block-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.block-toolbar div { flex: 1; display: grid; gap: 2px; }
.block-toolbar span { color: #64748b; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .04em; }
.block-toolbar strong { color: #0f172a; font-size: 18px; }
.block-picker { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; margin-bottom: 14px; }
.block-picker button { min-height: 82px; border: 1px solid #dbe6f5; border-radius: 8px; background: #f8fafc; display: grid; align-content: center; gap: 3px; text-align: left; padding: 12px; cursor: pointer; font: inherit; }
.block-picker span { color: #1d4ed8; font-weight: 900; }
.block-picker strong { color: #0f172a; font-size: 13px; }
.block-picker small { color: #64748b; font-size: 12px; }
.block-empty { border: 1.5px dashed #bfdbfe; border-radius: 8px; background: #f8fbff; color: #475569; padding: 28px; display: grid; gap: 6px; text-align: center; margin-bottom: 12px; }
.block-card { border: 1px solid #dbe6f5; border-radius: 8px; background: #fff; margin-bottom: 10px; overflow: hidden; }
.block-handle { display: grid; grid-template-columns: auto auto 1fr auto auto auto; align-items: center; gap: 8px; min-height: 42px; padding: 8px 10px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.block-handle span { color: #94a3b8; cursor: grab; font-weight: 900; }
.block-handle strong { font-size: 13px; color: #334155; }
.block-handle button { width: 30px; height: 30px; border: 1px solid #cbd5e1; border-radius: 7px; background: #fff; color: #334155; cursor: pointer; }
.block-handle button:disabled { opacity: .35; cursor: not-allowed; }
.block-handle .danger { border-color: #fecaca; color: #b91c1c; background: #fef2f2; }
.block-body { display: grid; gap: 10px; padding: 12px; }
.block-grid-compact { display: grid; grid-template-columns: 90px minmax(0, 1fr); gap: 8px; }
.block-rich { border: 1.5px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #fff; }
.block-rich-toolbar { display: flex; gap: 4px; padding: 6px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.block-rich-toolbar button { width: 32px; height: 30px; border: 1px solid #cbd5e1; border-radius: 7px; background: #fff; color: #334155; font: inherit; font-weight: 900; cursor: pointer; }
.block-rich-area { min-height: 96px; padding: 12px; line-height: 1.65; outline: 0; overflow-wrap: anywhere; }
.block-rich-area:empty::before { content: attr(data-placeholder); color: #94a3b8; }
.list-row { display: grid; grid-template-columns: minmax(0, 1fr) 38px; gap: 8px; }
.list-row button { border: 1px solid #fecaca; border-radius: 8px; background: #fef2f2; color: #b91c1c; cursor: pointer; font-weight: 900; }
.image-drop { display: grid; gap: 10px; border: 1.5px dashed #bfdbfe; border-radius: 8px; background: #f8fbff; padding: 12px; }
.image-drop img { width: 100%; max-height: 300px; object-fit: cover; border-radius: 8px; }
.image-drop div { min-height: 150px; display: grid; place-items: center; color: #64748b; font-weight: 800; }
.image-drop label { width: fit-content; min-height: 36px; display: inline-flex; align-items: center; border: 1px solid #bfdbfe; border-radius: 8px; background: #eff6ff; color: #1d4ed8; padding: 0 12px; cursor: pointer; font-size: 13px; font-weight: 900; }
.image-drop label input { display: none; }
.divider-editor { color: #64748b; font-size: 13px; padding: 10px 0; }
.article-preview { display: grid; gap: 12px; position: static; min-width: 0; }
.article-preview-card, .seo-preview, .feed-preview { border: 1px solid #dbe6f5; border-radius: 8px; background: #fff; padding: 18px; box-shadow: 0 18px 46px rgba(15, 23, 42, .08); }
.article-preview-card img, .article-cover-preview { width: 100%; border-radius: 8px; object-fit: cover; background: #e2e8f0; }
.article-preview-card img { aspect-ratio: 16 / 9; margin-bottom: 14px; }
.article-cover-preview { aspect-ratio: 16 / 9; margin-bottom: 10px; }
.article-preview-image { aspect-ratio: 16 / 9; display: grid; place-items: center; border-radius: 8px; background: #e2e8f0; color: #64748b; font-weight: 900; margin-bottom: 14px; }
.article-preview-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.article-preview-meta span { border-radius: 6px; background: #ecfdf5; color: #047857; padding: 4px 8px; font-size: 12px; font-weight: 900; }
.article-preview-card h1 { margin: 0 0 10px; font-size: clamp(25px, 5vw, 40px); line-height: 1.08; }
.article-preview-card p { color: #475569; line-height: 1.6; font-weight: 650; }
.block-preview-stack { display: grid; gap: 14px; line-height: 1.7; color: #1f2937; overflow-wrap: anywhere; }
.preview-heading { margin: 12px 0 2px; line-height: 1.2; color: #0f172a; }
.preview-paragraph { color: #334155; line-height: 1.75; }
.preview-paragraph a { color: #1d4ed8; }
.preview-quote { border-left: 4px solid #1d4ed8; background: #eff6ff; color: #1e3a8a; padding: 14px 16px; margin: 0; border-radius: 0 8px 8px 0; }
.preview-quote cite { display: block; margin-top: 8px; color: #64748b; font-size: 13px; }
.preview-list { margin: 0; padding-left: 22px; }
.preview-image { margin: 0; }
.preview-image img { width: 100%; max-height: 460px; object-fit: cover; border-radius: 8px; }
.preview-image div { min-height: 160px; display: grid; place-items: center; background: #f1f5f9; border-radius: 8px; color: #64748b; }
.preview-image figcaption { text-align: center; color: #64748b; font-size: 13px; margin-top: 7px; }
.preview-divider { border: 0; border-top: 2px solid #e2e8f0; width: 100%; }
.seo-title { color: #1a0dab; font-size: 18px; line-height: 1.3; }
.seo-url { color: #047857; font-size: 13px; margin: 4px 0; overflow-wrap: anywhere; }
.seo-preview p, .feed-preview p { margin: 6px 0 0; color: #4b5563; line-height: 1.5; }
.article-chipbox { min-height: 42px; display: flex; align-items: center; flex-wrap: wrap; gap: 6px; border: 1.5px solid #cbd5e1; border-radius: 8px; background: #f8fafc; padding: 6px 8px; }
.article-chipbox input { min-width: 110px; flex: 1; border: 0; outline: 0; background: transparent; font: inherit; }
.article-chip { display: inline-flex; align-items: center; gap: 5px; border-radius: 6px; background: #dbeafe; color: #1d4ed8; padding: 4px 8px; font-size: 12px; font-weight: 900; }
.article-chip button { border: 0; background: transparent; color: inherit; cursor: pointer; font-weight: 900; }
.article-ok, .article-demo-mode { border: 1px solid #bbf7d0; background: #f0fdf4; color: #047857; border-radius: 8px; padding: 12px; font-size: 13px; font-weight: 800; line-height: 1.5; }
.article-errors { border: 1px solid #fecaca; background: #fef2f2; color: #b91c1c; border-radius: 8px; padding: 12px; font-size: 13px; font-weight: 800; line-height: 1.5; }
.article-global-error, .article-demo-mode, .article-draft-banner { margin-bottom: 14px; }
.article-draft-banner { display: flex; align-items: center; justify-content: space-between; gap: 10px; border: 1px solid #fde68a; background: #fffbeb; color: #92400e; border-radius: 8px; padding: 12px; font-size: 13px; font-weight: 800; }
.article-draft-banner button { border: 1px solid #f59e0b; background: #fff; border-radius: 8px; min-height: 34px; padding: 0 10px; color: #92400e; font: inherit; font-weight: 900; cursor: pointer; }
.article-file { width: 100%; margin-bottom: 10px; }
.article-filters { display: grid; grid-template-columns: 1fr; gap: 8px; margin-bottom: 14px; }
.article-table-wrap { overflow-x: auto; border: 1px solid #dbe6f5; border-radius: 8px; background: #fff; }
.article-table { width: 100%; min-width: 900px; border-collapse: collapse; }
.article-table th { background: #f8fafc; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; text-align: left; padding: 13px 14px; }
.article-table td { border-top: 1px solid #edf2f7; padding: 13px 14px; color: #334155; font-size: 13px; vertical-align: middle; }
.article-table td strong { display: block; color: #0f172a; margin-bottom: 3px; }
.article-table td span { color: #94a3b8; font-size: 12px; }
.article-table mark { border-radius: 6px; padding: 4px 8px; font-size: 12px; font-weight: 900; }
.article-row-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.article-row-actions .danger { border-color: #fecaca; color: #b91c1c; background: #fef2f2; }
.article-empty-row, .article-loading { text-align: center; color: #64748b; padding: 34px !important; }
.preview-modal { position: fixed; inset: 0; z-index: 1000; background: rgba(15, 23, 42, .58); display: grid; place-items: center; padding: 18px; }
.preview-modal-panel { width: min(980px, 100%); max-height: 92vh; overflow: auto; background: #f8fafc; border-radius: 8px; padding: 16px; }
.preview-modal-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.preview-modal-head button { min-height: 38px; border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; color: #334155; padding: 0 12px; cursor: pointer; font: inherit; font-weight: 800; }
.article-preview.expanded { position: static; max-width: 820px; margin: 0 auto; }
@media (min-width: 760px) { .article-filters { grid-template-columns: minmax(220px, 1fr) 180px; } }
@media (min-width: 1180px) { .article-editor-grid { grid-template-columns: minmax(0, 1.15fr) 310px minmax(330px, .85fr); } .article-preview { position: sticky; top: 148px; } }
@media (max-width: 640px) { .article-panel, .block-workspace { padding: 14px; } .article-editor-topbar, .article-list-head, .article-draft-banner, .block-toolbar { align-items: stretch; flex-direction: column; } .article-btn { width: 100%; } .block-grid-compact, .block-handle { grid-template-columns: 1fr; } }
`;
