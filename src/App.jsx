import { useState, useCallback } from "react";
import HomePage     from "./pages/HomePage.jsx";
import AuthPage     from "./pages/AuthPage.jsx";
import AdminPage    from "./pages/admin/AdminPage.jsx";
import ArticlePage  from "./pages/ArticlePage.jsx";
import ChatBot      from "./components/ChatBot.jsx";
import { INITIAL_ARTICLES } from "./features/admin/adminStore.js";
import { NEWS } from "./features/news/newsData.js";

// ── Цвета по имени категории ──────────────────────────────────────────────────
const CATEGORY_STYLE = {
  "Мероприятия": { categoryColor: "#fff",    categoryBg: "rgba(255,255,255,0.18)" },
  "Курсы":       { categoryColor: "#7C3AED", categoryBg: "#F5F3FF"               },
  "Достижения":  { categoryColor: "#059669", categoryBg: "#ECFDF5"               },
  "Новости":     { categoryColor: "#D97706", categoryBg: "#FFFBEB"               },
  "Проекты":     { categoryColor: "#2563EB", categoryBg: "#EFF6FF"               },
  "Семинары":    { categoryColor: "#D97706", categoryBg: "#FFFBEB"               },
  "События":     { categoryColor: "#059669", categoryBg: "#ECFDF5"               },
};

const FALLBACK_IMAGES = [
  "/mky/images/news1.jpg",
  "/mky/images/news2.jpg",
  "/mky/images/news3.jpg",
  "/mky/images/news4.jpg",
];

const DEFAULT_CATEGORIES = [
  { id: 1, name: "Мероприятия" }, { id: 2, name: "Курсы"      },
  { id: 3, name: "Достижения"  }, { id: 4, name: "Новости"    },
  { id: 5, name: "Проекты"     }, { id: 6, name: "Семинары"   },
];

// Статья adminStore → карточка новости (формат для FeaturedCard / NewsCard)
function articleToNewsItem(article) {
  const catObj  = DEFAULT_CATEGORIES.find(c => article.categories?.includes(c.id));
  const catName = catObj?.name ?? "Новости";
  const style   = CATEGORY_STYLE[catName] ?? CATEGORY_STYLE["Новости"];

  const heroBlock = article.blocks?.find(b => b.type === "hero");
  const paraBlock = article.blocks?.find(b => b.type === "paragraph");
  const excerpt   = heroBlock?.data?.intro || paraBlock?.data?.text || article.excerpt || "";

  const imgBlock = article.blocks?.find(b => b.type === "image" || b.type === "imagetext");
  const image    = imgBlock?.data?.url || article.image
    || FALLBACK_IMAGES[(article.id - 1) % FALLBACK_IMAGES.length];

  return {
    id:            article.id,
    date:          article.updatedAt || article.createdAt || "",
    category:      catName,
    categoryColor: style.categoryColor,
    categoryBg:    style.categoryBg,
    title:         article.title,
    excerpt:       String(excerpt).slice(0, 220),
    image,
    // Для ArticlePage: полные блоки + автор
    blocks:        article.blocks || [],
    author:        article.author || "",
    _isAdmin:      true,   // пометка: статья из редактора (есть blocks)
  };
}

// Статичные новости (newsData) → добавляем поля для ArticlePage
function staticNewsToItem(news) {
  return {
    ...news,
    blocks:   [],
    author:   "",
    _isAdmin: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [page,           setPage]          = useState("home");
  const [openedArticle,  setOpenedArticle] = useState(null); // объект карточки для чтения
  const [isAdmin]                          = useState(true);
  const [articles,       setArticles]      = useState(INITIAL_ARTICLES);

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const saveArticle = useCallback((article) => {
    const now = new Date().toISOString().slice(0, 10);
    setArticles(prev => {
      const exists = prev.find(a => a.id === article.id);
      if (exists) return prev.map(a => a.id === article.id ? { ...article, updatedAt: now } : a);
      return [...prev, { ...article, id: Date.now(), createdAt: now, updatedAt: now, author: "Администратор" }];
    });
  }, []);

  const deleteArticle = useCallback((id) => {
    setArticles(prev => prev.filter(a => a.id !== id));
  }, []);

  const changeArticleStatus = useCallback((id, status) => {
    setArticles(prev => prev.map(a =>
      a.id === id ? { ...a, status, updatedAt: new Date().toISOString().slice(0, 10) } : a
    ));
  }, []);

  // ── Новостная лента ───────────────────────────────────────────────────────
  // Опубликованные из редактора — первыми, затем статичные (без дублей по заголовку)
  const adminNews = articles
    .filter(a => a.status === "published")
    .map(articleToNewsItem);

  const adminTitles = new Set(adminNews.map(n => n.title));
  const staticNews  = NEWS
    .filter(n => !adminTitles.has(n.title))
    .map(staticNewsToItem);

  const publishedNews = [...adminNews, ...staticNews];

  // ── Открыть статью для чтения ─────────────────────────────────────────────
  const handleOpenArticle = useCallback((newsItem) => {
    setOpenedArticle(newsItem);
    setPage("article");
    window.scrollTo({ top: 0 });
  }, []);

  const handleBackFromArticle = useCallback(() => {
    setOpenedArticle(null);
    setPage("home");
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <>
      {page === "home" && (
        <HomePage
          onGoAuth={() => setPage("auth")}
          onGoAdmin={isAdmin ? () => setPage("admin") : null}
          publishedNews={publishedNews}
          onOpenArticle={handleOpenArticle}
        />
      )}

      {page === "auth" && (
        <AuthPage onBack={() => setPage("home")} />
      )}

      {page === "article" && openedArticle && (
        <ArticlePage
          article={openedArticle}
          onBack={handleBackFromArticle}
        />
      )}

      {page === "admin" && (
        <AdminPage
          onBack={() => setPage("home")}
          articles={articles}
          saveArticle={saveArticle}
          deleteArticle={deleteArticle}
          changeArticleStatus={changeArticleStatus}
        />
      )}

      {page !== "admin" && <ChatBot />}
    </>
  );
}