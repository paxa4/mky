import Badge from "../components/Badge.jsx";
import { BlockPreview } from "../features/admin/BlockEditor.jsx";

// Для статичных новостей из newsData (нет блоков, только текст)
function StaticContent({ article }) {
  return (
    <p style={{ fontSize: 16, color: "#334155", lineHeight: 1.8 }}>
      {article.excerpt || article.content || ""}
    </p>
  );
}

export default function ArticlePage({ article, onBack }) {
  const hasBlocks = article.blocks && article.blocks.length > 0;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F8FAFC",
      fontFamily: "'PT Sans', system-ui, sans-serif",
    }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .article-back-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 10px;
          border: 1.5px solid #E2E8F0; background: #fff;
          cursor: pointer; font-size: 13px; font-weight: 600;
          color: #475569; font-family: inherit; transition: border-color 0.15s, color 0.15s;
        }
        .article-back-btn:hover { border-color: #93C5FD; color: #1D4ED8; }
        .article-back-btn-bottom {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 22px; border-radius: 12px;
          border: 1.5px solid #BFDBFE; background: #EFF6FF;
          cursor: pointer; font-size: 14px; font-weight: 600;
          color: #1D4ED8; font-family: inherit; transition: background 0.15s;
        }
        .article-back-btn-bottom:hover { background: #DBEAFE; }
      `}</style>

      {/* ── Шапка ─────────────────────────────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #F1F5F9",
        boxShadow: "0 1px 12px rgba(0,0,0,0.06)",
      }}>
        <div style={{
          maxWidth: 860, margin: "0 auto", padding: "0 24px",
          height: 60, display: "flex", alignItems: "center", gap: 16,
        }}>
          <button className="article-back-btn" onClick={onBack}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            На главную
          </button>
          <span style={{
            flex: 1, fontSize: 13, color: "#94A3B8",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {article.title}
          </span>
        </div>
      </header>

      {/* ── Основной контент ───────────────────────────────────────────────── */}
      <main style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* Hero-изображение — показываем ТОЛЬКО для статичных новостей (без блоков) */}
        {!hasBlocks && article.image && (
          <div style={{
            width: "100%",
            borderRadius: 16,
            overflow: "hidden",
            marginBottom: 32,
            boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
            maxHeight: 420,
          }}>
            <img
              src={article.image}
              alt={article.title}
              style={{
                width: "100%",
                height: "420px",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>
        )}

        {/* Мета: категория, дата, автор */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          {article.category && (
            <Badge
              label={article.category}
              color={article.categoryColor || "#1D4ED8"}
              bg={article.categoryBg || "#EFF6FF"}
            />
          )}
          {article.date && (
            <span style={{ fontSize: 13, color: "#94A3B8" }}>{article.date}</span>
          )}
          {article.author && (
            <span style={{ fontSize: 13, color: "#94A3B8" }}>· {article.author}</span>
          )}
        </div>

        {/* Заголовок — только если нет блоков (блоки сами могут рисовать заголовок) */}
        {!hasBlocks && (
          <h1 style={{
            fontSize: 30, fontWeight: 800, color: "#0F172A",
            lineHeight: 1.25, letterSpacing: "-0.02em", marginBottom: 24,
          }}>
            {article.title}
          </h1>
        )}

        <div style={{ height: 1, background: "#F1F5F9", marginBottom: 32 }} />

        {/* Содержимое статьи */}
        <div style={{ fontSize: 15, lineHeight: 1.8, color: "#334155" }}>
          {hasBlocks
            ? article.blocks.map(block => (
                <BlockPreview key={block.id} block={block} />
              ))
            : <StaticContent article={article} />
          }
        </div>

        {/* Кнопка «Назад» внизу */}
        <div style={{ marginTop: 56, paddingTop: 32, borderTop: "1px solid #F1F5F9" }}>
          <button className="article-back-btn-bottom" onClick={onBack}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Вернуться к новостям
          </button>
        </div>
      </main>
    </div>
  );
}