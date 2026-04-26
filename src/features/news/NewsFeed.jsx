import { useState } from "react";
import FeaturedCard from "./FeaturedCard.jsx";
import NewsCard from "./NewsCard.jsx";
import { NEWS } from "./newsData.js";

const PER_PAGE = 4; // 1 featured + 3 cards

export default function NewsFeed({ publishedNews, onOpenArticle }) {
  const [page, setPage] = useState(1);

  const allNews    = publishedNews && publishedNews.length > 0 ? publishedNews : NEWS;
  const totalPages = Math.max(1, Math.ceil(allNews.length / PER_PAGE));
  const start      = (page - 1) * PER_PAGE;
  const items      = allNews.slice(start, start + PER_PAGE);

  const goTo = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [1];
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  return (
    <section style={{
      position: "relative",
      overflow: "hidden",
      background: "linear-gradient(135deg, #FFFFFF 0%, #EFF6FF 100%)",
      padding: "60px 24px",
    }}>
      <div style={{ position: "absolute", top: "-20%", right: "-10%", width: "50%", height: "80%", background: "radial-gradient(circle, rgba(147, 197, 253, 0.15) 0%, rgba(255, 255, 255, 0) 70%)", zIndex: 0, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-30%", left: "-10%", width: "60%", height: "100%", background: "radial-gradient(circle, rgba(199, 210, 254, 0.2) 0%, rgba(255, 255, 255, 0) 70%)", zIndex: 0, pointerEvents: "none" }} />

      <style>{`
        .news-container { max-width: 1200px; margin: 0 auto; width: 100%; }
        .news-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: auto auto;
          gap: 20px;
        }
        .featured-cell { grid-row: 1 / 3; grid-column: 1 / 2; }
        .right-top-cells {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .right-bottom-cell { grid-column: 2 / 3; }

        @media (max-width: 900px) {
          .news-grid { grid-template-columns: 1fr; }
          .featured-cell { grid-column: 1; grid-row: auto; min-height: 400px; }
          .right-bottom-cell { grid-column: 1; }
        }
        @media (max-width: 580px) {
          .right-top-cells { grid-template-columns: 1fr; }
        }

        .page-btn {
          width: 36px; height: 36px;
          border-radius: 8px;
          border: 1px solid #E2E8F0;
          background: #fff;
          color: #64748B;
          font-size: 14px;
          font-weight: 600;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }
        .page-btn:hover:not(:disabled) { border-color: #1D4ED8; color: #1D4ED8; }
        .page-btn.active { background: #1D4ED8; color: #fff; border-color: #1D4ED8; }
        .page-btn:disabled { opacity: 0.5; cursor: default; background: #F8FAFC; }
      `}</style>

      <div className="news-container" style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 30, gap: 16 }}>
          <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.02em", lineHeight: 1 }}>
            Новости
          </h2>
          <a href="#" style={{ fontSize: 14, fontWeight: 600, color: "#94A3B8", textDecoration: "none" }}>
            Все новости
          </a>
        </div>

        <div className="news-grid">
          {items[0] && (
            <div className="featured-cell">
              <FeaturedCard news={items[0]} onClick={() => onOpenArticle?.(items[0])} />
            </div>
          )}

          <div className="right-top-cells">
            {items[1] && <NewsCard news={items[1]} onClick={() => onOpenArticle?.(items[1])} />}
            {items[2] && <NewsCard news={items[2]} onClick={() => onOpenArticle?.(items[2])} />}
          </div>

          {items[3] && (
            <div className="right-bottom-cell">
              <NewsCard news={items[3]} horizontal onClick={() => onOpenArticle?.(items[3])} />
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 40 }}>
          <button className="page-btn" disabled={page === 1} onClick={() => goTo(page - 1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>

          {getPageNumbers().map((p, i) =>
            p === "..." ? (
              <span key={`d${i}`} style={{ color: "#94A3B8", margin: "0 4px", fontSize: 14, fontWeight: 700 }}>...</span>
            ) : (
              <button key={p} className={`page-btn${page === p ? " active" : ""}`} onClick={() => goTo(p)}>{p}</button>
            )
          )}

          <button className="page-btn" disabled={page === totalPages} onClick={() => goTo(page + 1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
