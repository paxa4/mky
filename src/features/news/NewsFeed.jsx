import { useState } from "react";
import FeaturedCard from "./FeaturedCard.jsx";
import NewsCard from "./NewsCard.jsx";

const ITEMS_PER_PAGE = 5; // 1 featured + 4 cards

// Преобразует статью из редактора в формат карточки новости
function articleToNews(article) {
  return {
    id:            article.id,
    date:          article.updatedAt || article.createdAt || "",
    category:      Array.isArray(article.categories) && article.categories.length > 0
                     ? article.categories[0]
                     : "Новости",
    categoryColor: article.categoryColor || "#2563EB",
    categoryBg:    article.categoryBg    || "#EFF6FF",
    title:         article.title,
    excerpt:       article.excerpt || (article.blocks?.find(b => b.type === "hero")?.data?.intro) || "",
    image:         article.image || (article.blocks?.find(b => b.type === "image")?.data?.url) || "/mky/images/news1.jpg",
  };
}

export default function NewsFeed({ articles }) {
  const [page, setPage] = useState(1);

  // Принимаем статьи как пропс (из appStore) или пустой массив
  const news = (articles || []).map(articleToNews);
  const totalPages = Math.max(1, Math.ceil(news.length / ITEMS_PER_PAGE));
  const start = (page - 1) * ITEMS_PER_PAGE;
  const pageNews = news.slice(start, start + ITEMS_PER_PAGE);

  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [1];
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  const goTo = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section>
      <style>{`
        .news-grid {
          display: grid;
          grid-template-columns: 1.6fr 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          gap: 18px;
          min-height: 520px;
        }
        .featured-cell { grid-row: 1 / 3; }
        @media (max-width: 920px) {
          .news-grid { grid-template-columns: 1fr 1fr; grid-template-rows: auto; min-height: unset; }
          .featured-cell { grid-row: auto; grid-column: 1 / 3; min-height: 340px; }
        }
        @media (max-width: 580px) {
          .news-grid { grid-template-columns: 1fr; }
          .featured-cell { grid-column: auto; min-height: 280px; }
        }
        .pagination { display: flex; align-items: center; justify-content: center; gap: 4px; margin-top: 36px; flex-wrap: wrap; }
        .page-btn { min-width: 36px; height: 36px; border: 1px solid #E2E8F0; background: #fff; border-radius: 8px; font-size: 14px; font-weight: 500; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0 10px; transition: all 0.15s; font-family: inherit; }
        .page-btn:hover:not(:disabled) { border-color: #93C5FD; color: #1D4ED8; background: #EFF6FF; }
        .page-btn.active { background: #1D4ED8; color: #fff; border-color: #1D4ED8; }
        .page-btn.dots { cursor: default; border-color: transparent; background: none; }
        .nav-btn { height: 36px; border: 1px solid #E2E8F0; background: #fff; border-radius: 8px; font-size: 13px; font-weight: 600; color: #475569; cursor: pointer; display: flex; align-items: center; gap: 6px; padding: 0 14px; transition: all 0.15s; font-family: inherit; }
        .nav-btn:hover:not(:disabled) { border-color: #93C5FD; color: #1D4ED8; background: #EFF6FF; }
        .nav-btn:disabled { opacity: 0.4; cursor: default; }
      `}</style>

      {/* Заголовок */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em", lineHeight: 1 }}>Новости</h1>
          <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 5 }}>Актуальные события и достижения</p>
        </div>
        <button style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: "#1D4ED8", padding: "8px 16px", borderRadius: 10, border: "1.5px solid #BFDBFE", background: "#EFF6FF", cursor: "pointer", whiteSpace: "nowrap" }}>
          Все новости
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Сетка */}
      {pageNews.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#94A3B8", fontSize: 15 }}>
          Опубликованных новостей пока нет
        </div>
      ) : (
        <div className="news-grid">
          <div className="featured-cell"><FeaturedCard news={pageNews[0]} /></div>
          {pageNews.slice(1).map(n => <NewsCard key={n.id} news={n} />)}
        </div>
      )}

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="pagination">
          <button className="nav-btn" disabled={page === 1} onClick={() => goTo(page - 1)}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Предыдущая
          </button>
          {getPageNumbers().map((p, i) =>
            p === "..." ? (
              <button key={`d${i}`} className="page-btn dots">...</button>
            ) : (
              <button key={p} className={`page-btn${page === p ? " active" : ""}`} onClick={() => goTo(p)}>{p}</button>
            )
          )}
          <button className="nav-btn" disabled={page === totalPages} onClick={() => goTo(page + 1)}>
            Следующая
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      )}
    </section>
  );
}