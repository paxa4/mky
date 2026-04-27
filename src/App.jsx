import { useState, useCallback, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import HomePage     from "./pages/HomePage.jsx";
import AuthPage     from "./pages/AuthPage.jsx";
import AdminPage    from "./pages/AdminPage.jsx";
import ArticlePage  from "./pages/ArticlePage.jsx";
import ProfilePage  from "./pages/ProfilePage.jsx";
import ChatBot      from "./components/ChatBot.jsx";
// TPMPK-страницы из rudak-frontend (роутятся через /tpmpk/*)
import TpmpkPage         from "./pages/TpmpkPage.jsx";
import TpmpkZapisPage    from "./pages/TpmpkZapisPage.jsx";
import BlankiPage        from "./pages/tpmpk/BlankiPage.jsx";
import DlyaPedagogovPage from "./pages/tpmpk/DlyaPedagogovPage.jsx";
import DlyaRoditeleyPage from "./pages/tpmpk/DlyaRoditeleyPage.jsx";
import DokumentyPage     from "./pages/tpmpk/DokumentyPage.jsx";
import FaqPage           from "./pages/tpmpk/FaqPage.jsx";
import GrafikPage        from "./pages/tpmpk/GrafikPage.jsx";
import KontaktyPage      from "./pages/tpmpk/KontaktyPage.jsx";
import NpaPage           from "./pages/tpmpk/NpaPage.jsx";
import SostavPage        from "./pages/tpmpk/SostavPage.jsx";
import { INITIAL_ARTICLES } from "./features/admin/adminStore.js";
import { NEWS } from "./features/news/newsData.js";

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
    blocks:        article.blocks || [],
    author:        article.author || "",
    _isAdmin:      true,
  };
}

function staticNewsToItem(news) {
  return {
    ...news,
    blocks:   [],
    author:   "",
    _isAdmin: false,
  };
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [page,           setPage]          = useState("home");
  const [openedArticle,  setOpenedArticle] = useState(null);
  const [currentUser,    setCurrentUser]   = useState(() => {
    try {
      const raw = localStorage.getItem("currentUser");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [articles,       setArticles]      = useState(INITIAL_ARTICLES);

  // Роль определяется только из объекта пользователя
  const isAdmin = currentUser?.role === "admin";

  // Синхронизация пользователя с localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("currentUser");
    }
  }, [currentUser]);

  const handleLogin = useCallback((user) => {
    setCurrentUser(user);
    setPage("home");
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("access_token");
    setCurrentUser(null);
    setPage("home");
  }, []);

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

  const adminNews = articles
    .filter(a => a.status === "published")
    .map(articleToNewsItem);

  const adminTitles = new Set(adminNews.map(n => n.title));
  const staticNews  = NEWS
    .filter(n => !adminTitles.has(n.title))
    .map(staticNewsToItem);

  const publishedNews = [...adminNews, ...staticNews];

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

  // Мост между URL-роутингом (TPMPK) и нашей state-навигацией.
  // Если ссылка из TPMPK ведёт «На главную»/«Войти»/«Админка»/«Профиль» —
  // переключаем URL обратно на "/" и поднимаем нужное значение page.
  const goHomeAs = useCallback((targetPage) => {
    setPage(targetPage);
    if (location.pathname !== "/") navigate("/");
  }, [location.pathname, navigate]);

  const tpmpkProps = {
    currentUser,
    onGoAuth:    () => goHomeAs("auth"),
    onGoAdmin:   isAdmin ? () => goHomeAs("admin") : null,
    onGoProfile: currentUser ? () => goHomeAs("profile") : null,
    onBack:      () => goHomeAs("home"),
  };

  // /tpmpk/* — рендерим Routes из rudak-frontend, остальное — старая state-нав.
  if (location.pathname.startsWith("/tpmpk")) {
    return (
      <>
        <Routes>
          <Route path="/tpmpk"                 element={<TpmpkPage         {...tpmpkProps} />} />
          <Route path="/tpmpk/zapis"           element={<TpmpkZapisPage    {...tpmpkProps} />} />
          <Route path="/tpmpk/dokumenty/*"     element={<DokumentyPage     {...tpmpkProps} />} />
          <Route path="/tpmpk/blanki/*"        element={<BlankiPage        {...tpmpkProps} />} />
          <Route path="/tpmpk/grafik/*"        element={<GrafikPage        {...tpmpkProps} />} />
          <Route path="/tpmpk/sostav/*"        element={<SostavPage        {...tpmpkProps} />} />
          <Route path="/tpmpk/npa/*"           element={<NpaPage           {...tpmpkProps} />} />
          <Route path="/tpmpk/faq/*"           element={<FaqPage           {...tpmpkProps} />} />
          <Route path="/tpmpk/dlya-roditeley/*" element={<DlyaRoditeleyPage {...tpmpkProps} />} />
          <Route path="/tpmpk/dlya-pedagogov/*" element={<DlyaPedagogovPage {...tpmpkProps} />} />
          <Route path="/tpmpk/kontakty/*"      element={<KontaktyPage      {...tpmpkProps} />} />
        </Routes>
        <ChatBot />
      </>
    );
  }

  return (
    <>
      {page === "home" && (
        <HomePage
          onGoAuth={() => setPage("auth")}
          onGoAdmin={isAdmin ? () => setPage("admin") : null}
          onGoProfile={currentUser ? () => setPage("profile") : null}
          currentUser={currentUser}
          publishedNews={publishedNews}
          onOpenArticle={handleOpenArticle}
        />
      )}

      {page === "auth" && (
        <AuthPage onBack={() => setPage("home")} onLogin={handleLogin} />
      )}

      {page === "article" && openedArticle && (
        <ArticlePage
          article={openedArticle}
          onBack={handleBackFromArticle}
        />
      )}

      {page === "admin" && isAdmin && (
        <AdminPage
          onBack={() => setPage("home")}
          articles={articles}
          saveArticle={saveArticle}
          deleteArticle={deleteArticle}
          changeArticleStatus={changeArticleStatus}
        />
      )}

      {page === "profile" && currentUser && (
        <ProfilePage
          user={currentUser}
          onBack={() => setPage("home")}
          onLogout={handleLogout}
        />
      )}

      {page !== "admin" && <ChatBot />}
    </>
  );
}
