import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import NewsCard from "./NewsCard.jsx";

const NEWS_PER_PAGE = 4;

export default function NewsFeed({ publishedNews, onOpenArticle, onOpenAuthor }) {
  const sectionRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [animKey, setAnimKey] = useState(0);
  const allNewsItems = useMemo(() => publishedNews || [], [publishedNews]);
  const pageCount = Math.max(1, Math.ceil(allNewsItems.length / NEWS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, pageCount);
  const startIndex = (safeCurrentPage - 1) * NEWS_PER_PAGE;
  const newsItems = allNewsItems.slice(startIndex, startIndex + NEWS_PER_PAGE);

  function switchPage(nextPage) {
    setCurrentPage(nextPage);
    setAnimKey((prev) => prev + 1);
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section
      ref={sectionRef}
      style={{ position: "relative", overflow: "hidden", background: "#EAF7FA", padding: "38px 20px" }}
    >
      <style>{`
        .news-container { max-width: 1200px; margin: 0 auto; width: 100%; }
        .news-layout { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; align-items: stretch; }
        .news-card-cell { width: 100%; animation: newsSlideIn .38s cubic-bezier(.2,.8,.2,1); }
        .news-pagination { margin-top: 22px; display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; }
        .news-page-btn {
          min-width: 36px;
          height: 36px;
          border: 1px solid rgba(25, 120, 156, .2);
          border-radius: 10px;
          background: transparent;
          color: #334155;
          font: 700 13px/1 inherit;
          cursor: pointer;
          padding: 0 10px;
          transition: all 0.16s ease;
        }
        .news-page-btn:hover:not(:disabled) {
          border-color: #78C2D8;
          color: #19789C;
          background: #EAF7FA;
        }
        .news-page-btn:disabled { opacity: 0.5; cursor: default; }
        .news-page-btn.active {
          border-color: #19789C;
          background: #19789C;
          color: #fff;
        }
        @keyframes newsSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 980px) {
          .news-layout { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 560px) {
          .news-layout { grid-template-columns: 1fr; }
        }
      `}</style>
      <div className="news-container">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 22, gap: 16, flexWrap: "wrap" }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: "#0F172A", letterSpacing: 0, lineHeight: 1 }}>Новости</h2>
          <Link to="/novosti/" style={{ fontSize: 14, fontWeight: 700, color: "#19789C", textDecoration: "none" }}>Все новости</Link>
        </div>

        <div className="news-layout" key={animKey}>
          {newsItems.map((news) => (
            <div className="news-card-cell" key={news.id}>
              <NewsCard news={news} onClick={() => onOpenArticle?.(news)} onAuthorClick={onOpenAuthor} />
            </div>
          ))}
        </div>

        <div className="news-pagination" aria-label="Пагинация новостей">
          <button
            type="button"
            className="news-page-btn"
            onClick={() => switchPage(Math.max(1, safeCurrentPage - 1))}
            disabled={safeCurrentPage === 1}
            aria-label="Предыдущая страница"
          >
            ←
          </button>

          {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
            <button
              key={page}
              type="button"
              className={`news-page-btn${page === safeCurrentPage ? " active" : ""}`}
              onClick={() => switchPage(page)}
              disabled={page === safeCurrentPage}
              aria-current={page === safeCurrentPage ? "page" : undefined}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            className="news-page-btn"
            onClick={() => switchPage(Math.min(pageCount, safeCurrentPage + 1))}
            disabled={safeCurrentPage === pageCount}
            aria-label="Следующая страница"
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}
