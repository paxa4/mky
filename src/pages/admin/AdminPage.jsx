import { useState } from "react";
import { useAdminStore, generateSlug } from "../../features/admin/adminStore.js";
import { BlockConstructor } from "../../features/admin/BlockEditor.jsx";

const STATUS_LABELS = { published: "Опубликована", draft: "Черновик", archive: "Архив" };
const STATUS_COLORS = {
  published: { bg: "#ECFDF5", color: "#059669" },
  draft:     { bg: "#FFFBEB", color: "#D97706" },
  archive:   { bg: "#F1F5F9", color: "#64748B" },
};

// ─── Мультиселект для категорий/тегов ─────────────────────────────────────────
function MultiSelect({ options, value, onChange, onCreate, placeholder }) {
  const [input, setInput] = useState("");
  const [open,  setOpen]  = useState(false);
  const filtered = options.filter(o => o.name.toLowerCase().includes(input.toLowerCase()) && !value.includes(o.id));

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 10px", border: "1.5px solid #E2E8F0", borderRadius: 10, background: "#F8FAFC", cursor: "text", minHeight: 42 }}
        onClick={() => setOpen(true)}>
        {value.map(id => {
          const opt = options.find(o => o.id === id);
          return opt ? (
            <span key={id} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", background: "#EFF6FF", color: "#1D4ED8", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
              {opt.name}
              <button onClick={e => { e.stopPropagation(); onChange(value.filter(v => v !== id)); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#1D4ED8", padding: 0, lineHeight: 1, fontSize: 14 }}>×</button>
            </span>
          ) : null;
        })}
        <input value={input} onChange={e => { setInput(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder={value.length === 0 ? placeholder : ""}
          style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, color: "#0F172A", minWidth: 80, flex: 1, fontFamily: "inherit" }} />
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", zIndex: 50, overflow: "hidden" }}>
          {filtered.map(o => (
            <div key={o.id} onMouseDown={() => { onChange([...value, o.id]); setInput(""); }}
              style={{ padding: "9px 14px", fontSize: 13, color: "#334155", cursor: "pointer" }}
              onMouseOver={e => e.currentTarget.style.background = "#F1F5F9"}
              onMouseOut={e => e.currentTarget.style.background = "transparent"}>
              {o.name}
            </div>
          ))}
          {onCreate && input.trim() && !options.find(o => o.name.toLowerCase() === input.toLowerCase()) && (
            <div onMouseDown={() => { const id = onCreate(input.trim()); onChange([...value, id]); setInput(""); }}
              style={{ padding: "9px 14px", fontSize: 13, color: "#1D4ED8", fontWeight: 600, cursor: "pointer", borderTop: "1px solid #F1F5F9" }}
              onMouseOver={e => e.currentTarget.style.background = "#EFF6FF"}
              onMouseOut={e => e.currentTarget.style.background = "transparent"}>
              + Создать «{input.trim()}»
            </div>
          )}
          {filtered.length === 0 && !onCreate && <div style={{ padding: "9px 14px", fontSize: 13, color: "#94A3B8" }}>Ничего не найдено</div>}
        </div>
      )}
    </div>
  );
}

// ─── Форма редактирования статьи ──────────────────────────────────────────────
function ArticleForm({ article, store, onSave, onCancel }) {
  const isNew = !article?.id;
  const [form, setForm] = useState(article || {
    title: "", slug: "", status: "draft", categories: [], tags: [], blocks: [],
  });

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleTitle = (val) => {
    set("title", val);
    if (isNew || !form._slugEdited) set("slug", generateSlug(val));
  };

  const handleSave = () => {
    if (!form.title.trim()) { alert("Заполните заголовок"); return; }
    store.saveArticle(form);
    onSave();
  };

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={onCancel} style={{ padding: "8px 14px", borderRadius: 9, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#64748B", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
          ← Назад
        </button>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A" }}>{isNew ? "Новая статья" : "Редактировать статью"}</h2>
        <div style={{ flex: 1 }} />
        <button onClick={handleSave} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "#1D4ED8", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "inherit" }}>
          {isNew ? "Создать" : "Сохранить"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "start" }}>
        {/* Main area */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Title */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #F1F5F9", padding: "20px 24px" }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Заголовок *</label>
            <input value={form.title} onChange={e => handleTitle(e.target.value)}
              placeholder="Введите заголовок статьи"
              style={{ width: "100%", fontSize: 20, fontWeight: 700, border: "none", outline: "none", color: "#0F172A", fontFamily: "inherit", background: "transparent" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, paddingTop: 10, borderTop: "1px solid #F1F5F9" }}>
              <span style={{ fontSize: 12, color: "#94A3B8" }}>Slug:</span>
              <input value={form.slug} onChange={e => { set("slug", e.target.value); set("_slugEdited", true); }}
                style={{ flex: 1, fontSize: 12, border: "none", outline: "none", color: "#64748B", fontFamily: "inherit", background: "transparent" }} />
            </div>
          </div>

          {/* Block constructor */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #F1F5F9", padding: "20px 24px" }}>
            <BlockConstructor blocks={form.blocks || []} onChange={blocks => set("blocks", blocks)} />
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Status */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #F1F5F9", padding: "16px 18px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Статус</div>
            {["published", "draft", "archive"].map(s => (
              <label key={s} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", cursor: "pointer" }}>
                <input type="radio" name="status" value={s} checked={form.status === s} onChange={() => set("status", s)} style={{ accentColor: "#1D4ED8" }} />
                <span style={{ fontSize: 13, fontWeight: 500, ...STATUS_COLORS[s] ? { color: STATUS_COLORS[s].color } : {} }}>
                  {STATUS_LABELS[s]}
                </span>
              </label>
            ))}
          </div>

          {/* Categories */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #F1F5F9", padding: "16px 18px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Категории</div>
            <MultiSelect options={store.categories} value={form.categories} onChange={v => set("categories", v)} placeholder="Выберите категории..." />
          </div>

          {/* Tags */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #F1F5F9", padding: "16px 18px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Теги</div>
            <MultiSelect options={store.tags} value={form.tags} onChange={v => set("tags", v)} onCreate={store.addTag} placeholder="Теги (можно создать новый)..." />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Таблица статей ───────────────────────────────────────────────────────────
function ArticlesList({ store, onNew, onEdit }) {
  const [search,     setSearch]     = useState("");
  const [filterSt,   setFilterSt]   = useState("all");
  const [filterCat,  setFilterCat]  = useState("all");
  const [filterTag,  setFilterTag]  = useState("all");
  const [filterAuth, setFilterAuth] = useState("all");

  const authors = [...new Set(store.articles.map(a => a.author))];

  const filtered = store.articles.filter(a => {
    if (search     && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterSt  !== "all" && a.status !== filterSt) return false;
    if (filterCat !== "all" && !a.categories.includes(Number(filterCat))) return false;
    if (filterTag !== "all" && !a.tags.includes(Number(filterTag))) return false;
    if (filterAuth !== "all" && a.author !== filterAuth) return false;
    return true;
  });

  const selStyle = { padding: "7px 10px", borderRadius: 8, border: "1.5px solid #E2E8F0", fontSize: 13, color: "#334155", background: "#F8FAFC", outline: "none", fontFamily: "inherit", cursor: "pointer" };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A" }}>Статьи</h2>
        <div style={{ flex: 1 }} />
        <button onClick={onNew} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: "#1D4ED8", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
          + Новая статья
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Поиск по заголовку..."
          style={{ ...selStyle, flex: 1, minWidth: 200 }} />
        <select value={filterSt} onChange={e => setFilterSt(e.target.value)} style={selStyle}>
          <option value="all">Все статусы</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={selStyle}>
          <option value="all">Все категории</option>
          {store.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterTag} onChange={e => setFilterTag(e.target.value)} style={selStyle}>
          <option value="all">Все теги</option>
          {store.tags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={filterAuth} onChange={e => setFilterAuth(e.target.value)} style={selStyle}>
          <option value="all">Все авторы</option>
          {authors.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #F1F5F9", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #F1F5F9" }}>
              {["Заголовок", "Категории", "Статус", "Автор", "Создана", "Изменена", ""].map(h => (
                <th key={h} style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#64748B", textAlign: "left", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#94A3B8", fontSize: 14 }}>Статьи не найдены</td></tr>
            )}
            {filtered.map(a => {
              const sc = STATUS_COLORS[a.status] || {};
              return (
                <tr key={a.id} style={{ borderBottom: "1px solid #F8FAFC" }}
                  onMouseOver={e => e.currentTarget.style.background = "#FAFAFA"}
                  onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, color: "#0F172A", maxWidth: 280 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>/{a.slug}</div>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {a.categories.map(cid => {
                        const c = store.categories.find(x => x.id === cid);
                        return c ? <span key={cid} style={{ fontSize: 11, padding: "2px 7px", background: "#F1F5F9", borderRadius: 5, color: "#475569" }}>{c.name}</span> : null;
                      })}
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 9px", borderRadius: 6, ...sc }}>{STATUS_LABELS[a.status]}</span>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 13, color: "#475569", whiteSpace: "nowrap" }}>{a.author}</td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: "#94A3B8", whiteSpace: "nowrap" }}>{a.createdAt}</td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: "#94A3B8", whiteSpace: "nowrap" }}>{a.updatedAt}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => onEdit(a)} style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#1D4ED8", fontFamily: "inherit" }}>Ред.</button>
                      <select value={a.status} onChange={e => store.changeArticleStatus(a.id, e.target.value)}
                        style={{ padding: "5px 8px", borderRadius: 7, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", fontSize: 12, color: "#475569", fontFamily: "inherit", outline: "none" }}>
                        {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                      <button onClick={() => { if (window.confirm(`Удалить «${a.title}»?`)) store.deleteArticle(a.id); }}
                        style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #FECACA", background: "#FEF2F2", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#EF4444", fontFamily: "inherit" }}>Удалить</button>
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

// ─── Управление категориями ───────────────────────────────────────────────────
function CategoriesManager({ store }) {
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState(null); // { id, name }

  const usageCount = (catId) => store.articles.filter(a => a.categories.includes(catId)).length;

  return (
    <div style={{ maxWidth: 560 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 20 }}>Категории</h2>

      {/* Add */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && newName.trim()) { store.addCategory(newName.trim()); setNewName(""); } }}
          placeholder="Название новой категории"
          style={{ flex: 1, padding: "9px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", background: "#F8FAFC" }} />
        <button onClick={() => { if (newName.trim()) { store.addCategory(newName.trim()); setNewName(""); } }}
          style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: "#1D4ED8", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "inherit" }}>
          Добавить
        </button>
      </div>

      {/* List */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #F1F5F9", overflow: "hidden" }}>
        {store.categories.map((cat, i) => {
          const count = usageCount(cat.id);
          const isEdit = editing?.id === cat.id;
          return (
            <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: i < store.categories.length - 1 ? "1px solid #F8FAFC" : "none" }}>
              {isEdit ? (
                <input value={editing.name} onChange={e => setEditing(v => ({ ...v, name: e.target.value }))}
                  onKeyDown={e => { if (e.key === "Enter") { store.renameCategory(cat.id, editing.name); setEditing(null); } if (e.key === "Escape") setEditing(null); }}
                  autoFocus style={{ flex: 1, padding: "6px 10px", border: "1.5px solid #93C5FD", borderRadius: 8, fontSize: 14, fontFamily: "inherit", outline: "none" }} />
              ) : (
                <span style={{ flex: 1, fontSize: 14, color: "#0F172A", fontWeight: 500 }}>{cat.name}</span>
              )}
              <span style={{ fontSize: 12, color: "#94A3B8", minWidth: 80, textAlign: "right" }}>
                {count > 0 ? `${count} статей` : "не используется"}
              </span>
              {isEdit ? (
                <>
                  <button onClick={() => { store.renameCategory(cat.id, editing.name); setEditing(null); }}
                    style={{ padding: "5px 10px", borderRadius: 7, border: "none", background: "#1D4ED8", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>✓</button>
                  <button onClick={() => setEditing(null)}
                    style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>✕</button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditing({ id: cat.id, name: cat.name })}
                    style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#1D4ED8", fontFamily: "inherit" }}>Ред.</button>
                  <button onClick={() => {
                    if (count > 0 && !window.confirm(`Категория используется в ${count} статьях. Удалить всё равно?`)) return;
                    store.deleteCategory(cat.id);
                  }}
                    style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #FECACA", background: "#FEF2F2", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#EF4444", fontFamily: "inherit" }}>Удалить</button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Управление тегами ────────────────────────────────────────────────────────
function TagsManager({ store }) {
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState(null);

  const usageCount = (tagId) => store.articles.filter(a => a.tags.includes(tagId)).length;

  return (
    <div style={{ maxWidth: 560 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 20 }}>Теги</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && newName.trim()) { store.addTag(newName.trim()); setNewName(""); } }}
          placeholder="Название нового тега"
          style={{ flex: 1, padding: "9px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", background: "#F8FAFC" }} />
        <button onClick={() => { if (newName.trim()) { store.addTag(newName.trim()); setNewName(""); } }}
          style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: "#1D4ED8", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "inherit" }}>
          Добавить
        </button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {store.tags.map(tag => {
          const count = usageCount(tag.id);
          const isEdit = editing?.id === tag.id;
          return (
            <div key={tag.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: "#F1F5F9", borderRadius: 20, border: "1px solid #E2E8F0" }}>
              {isEdit ? (
                <input value={editing.name} onChange={e => setEditing(v => ({ ...v, name: e.target.value }))}
                  onKeyDown={e => { if (e.key === "Enter") { store.renameTag(tag.id, editing.name); setEditing(null); } if (e.key === "Escape") setEditing(null); }}
                  autoFocus style={{ width: 100, padding: "2px 6px", border: "1px solid #93C5FD", borderRadius: 6, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
              ) : (
                <span style={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>#{tag.name}</span>
              )}
              <span style={{ fontSize: 11, color: "#94A3B8" }}>{count}</span>
              {isEdit ? (
                <>
                  <button onClick={() => { store.renameTag(tag.id, editing.name); setEditing(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#059669", fontSize: 14, padding: 0 }}>✓</button>
                  <button onClick={() => setEditing(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 14, padding: 0 }}>✕</button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditing({ id: tag.id, name: tag.name })} style={{ background: "none", border: "none", cursor: "pointer", color: "#1D4ED8", fontSize: 12, padding: 0 }}>✏️</button>
                  <button onClick={() => {
                    if (count > 0 && !window.confirm(`Тег используется в ${count} статьях. Удалить?`)) return;
                    store.deleteTag(tag.id);
                  }} style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", fontSize: 14, padding: 0 }}>×</button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Главная страница администратора ──────────────────────────────────────────
const SECTIONS = [
  { id: "articles",   label: "Статьи",     icon: "📝" },
  { id: "categories", label: "Категории",  icon: "🗂️" },
  { id: "tags",       label: "Теги",       icon: "🏷️" },
];

export default function AdminPage({ onBack }) {
  const store = useAdminStore();
  const [section,  setSection]  = useState("articles");
  const [editing,  setEditing]  = useState(null); // null | "new" | article object

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'PT Sans', system-ui, sans-serif" }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>

      {/* Admin header */}
      <div style={{ background: "#0F172A", padding: "0 24px", height: 56, display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", cursor: "pointer", padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
          ← На сайт
        </button>
        <span style={{ color: "#94A3B8", fontSize: 13 }}>/</span>
        <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>Администратор</span>
        <div style={{ flex: 1 }} />
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1D4ED8", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 700 }}>А</div>
      </div>

      <div style={{ display: "flex", minHeight: "calc(100vh - 56px)" }}>
        {/* Sidebar */}
        <div style={{ width: 220, background: "#fff", borderRight: "1px solid #F1F5F9", padding: "20px 12px", flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.1em", textTransform: "uppercase", padding: "0 8px", marginBottom: 8 }}>Контент</div>
          {SECTIONS.map(s => (
            <button key={s.id}
              onClick={() => { setSection(s.id); setEditing(null); }}
              style={{
                width: "100%", padding: "9px 12px", borderRadius: 9, border: "none",
                background: section === s.id ? "#EFF6FF" : "transparent",
                color: section === s.id ? "#1D4ED8" : "#475569",
                cursor: "pointer", fontSize: 14, fontWeight: section === s.id ? 700 : 500,
                display: "flex", alignItems: "center", gap: 8, textAlign: "left",
                marginBottom: 2, fontFamily: "inherit",
                transition: "background 0.12s",
              }}
              onMouseOver={e => { if (section !== s.id) e.currentTarget.style.background = "#F8FAFC"; }}
              onMouseOut={e => { if (section !== s.id) e.currentTarget.style.background = "transparent"; }}
            >
              <span>{s.icon}</span> {s.label}
              {s.id === "articles" && <span style={{ marginLeft: "auto", fontSize: 11, background: "#E2E8F0", borderRadius: 10, padding: "1px 7px" }}>{store.articles.length}</span>}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: "28px 32px", overflow: "auto" }}>
          {section === "articles" && (
            editing ? (
              <ArticleForm
                article={editing === "new" ? null : editing}
                store={store}
                onSave={() => setEditing(null)}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <ArticlesList
                store={store}
                onNew={() => setEditing("new")}
                onEdit={a => setEditing(a)}
              />
            )
          )}
          {section === "categories" && <CategoriesManager store={store} />}
          {section === "tags" && <TagsManager store={store} />}
        </div>
      </div>
    </div>
  );
}
