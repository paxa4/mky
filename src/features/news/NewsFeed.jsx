import { useState } from "react";
import FeaturedCard from "./FeaturedCard.jsx";
import NewsCard from "./NewsCard.jsx";
import { NEWS } from "./newsData.js";

const TOTAL_PAGES = 5;

export default function NewsFeed() {
  const [page, setPage] = useState(1);

  const getPageNumbers = () => {
    if (TOTAL_PAGES <= 7) return Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1);
    const pages = [1];
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(TOTAL_PAGES - 1, page + 1); i++) pages.push(i);
    if (page < TOTAL_PAGES - 2) pages.push("...");
    pages.push(TOTAL_PAGES);
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
          grid-template-columns: 1.5fr 1fr 1fr;
          grid-template-rows: auto auto;
          gap: 16px;
          min-height: 500px;
        }
        .featured-cell { grid-row: 1 / 3; }

        @media (max-width: 960px) {
          .news-grid { grid-template-columns: 1fr 1fr; grid-template-rows: auto; min-height: unset; }
          .featured-cell { grid-row: auto; grid-column: 1 / 3; min-height: 320px; }
        }
        @media (max-width: 580px) {
          .news-grid { grid-template-columns: 1fr; }
          .featured-cell { grid-column: auto; min-height: 260px; }
        }

        .pagination {
          display: flex; align-items: center; justify-content: center;
          gap: 4px; margin-top: 36px; flex-wrap: wrap;
        }
        .page-btn {
          min-width: 36px; height: 36px; border: 1px solid #E2E8F0;
          background: #fff; border-radius: 50%; font-size: 14px;
          font-weight: 500; color: #475569; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          padding: 0 10px; transition: all 0.15s; font-family: inherit;
        }
        .page-btn:hover:not(:disabled) { border-color: #93C5FD; color: #1D4ED8; background: #EFF6FF; }
        .page-btn.active { background: #1D4ED8; color: #fff; border-color: #1D4ED8; }
        .page-btn.dots { cursor: default; border-color: transparent; background: none; }
        .page-btn.dots:hover { background: none; color: #475569; border-color: transparent; }
        .nav-btn {
          height: 36px; border: 1px solid #E2E8F0; background: #fff;
          border-radius: 20px; font-size: 13px; font-weight: 600; color: #475569;
          cursor: pointer; display: flex; align-items: center; gap: 6px;
          padding: 0 14px; transition: all 0.15s; font-family: inherit;
        }
        .nav-btn:hover:not(:disabled) { border-color: #93C5FD; color: #1D4ED8; background: #EFF6FF; }
        .nav-btn:disabled { opacity: 0.4; cursor: default; }
      `}</style>

      {/* Section header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20, gap: 16, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", textTransform: "uppercase" }}>
          Новости
        </h1>
        <button style={{ fontSize: 13, fontWeight: 600, color: "#1D4ED8", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit" }}>
          Все новости
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Grid */}
      <div className="news-grid">
        <div className="featured-cell"><FeaturedCard news={NEWS[0]} /></div>
        {NEWS.slice(1, 3).map(n => <NewsCard key={n.id} news={n} />)}
        {NEWS.slice(3, 5).map(n => <NewsCard key={n.id} news={n} />)}
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button className="nav-btn" disabled={page === 1} onClick={() => goTo(page - 1)}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Предыдущая
        </button>

        {getPageNumbers().map((p, i) =>
          p === "..." ? (
            <button key={`d${i}`} className="page-btn dots">...</button>
          ) : (
            <button key={p} className={`page-btn${page === p ? " active" : ""}`} onClick={() => goTo(p)}>{p}</button>
          )
        )}

        <button className="nav-btn" disabled={page === TOTAL_PAGES} onClick={() => goTo(page + 1)}>
          Следующая
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </section>
  );
}