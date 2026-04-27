import { useCallback, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import ArticlePage from "./pages/ArticlePage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import Smart404 from "./pages/Smart404.jsx";
import TpmpkPage from "./pages/TpmpkPage.jsx";
import TpmpkZapisPage from "./pages/TpmpkZapisPage.jsx";
import TpmpkAdmin from "./pages/admin/tpmpk/TpmpkAdmin.jsx";
import BlankiPage from "./pages/tpmpk/BlankiPage.jsx";
import DlyaPedagogovPage from "./pages/tpmpk/DlyaPedagogovPage.jsx";
import DlyaRoditeleyPage from "./pages/tpmpk/DlyaRoditeleyPage.jsx";
import DokumentyPage from "./pages/tpmpk/DokumentyPage.jsx";
import FaqPage from "./pages/tpmpk/FaqPage.jsx";
import GrafikPage from "./pages/tpmpk/GrafikPage.jsx";
import KontaktyPage from "./pages/tpmpk/KontaktyPage.jsx";
import NpaPage from "./pages/tpmpk/NpaPage.jsx";
import SostavPage from "./pages/tpmpk/SostavPage.jsx";
import ChatBot from "./components/ChatBot.jsx";
import { INITIAL_ARTICLES } from "./features/admin/adminStore.js";
import { NEWS } from "./features/news/newsData.js";
import { canAccessAdmin, canAccessTpmpkAdmin, clearStoredUser, getStoredUser, storeUser } from "./auth.js";

const CATEGORY_STYLE = {
  "Мероприятия": { categoryColor: "#fff", categoryBg: "rgba(255,255,255,0.18)" },
  "Курсы": { categoryColor: "#7C3AED", categoryBg: "#F5F3FF" },
  "Достижения": { categoryColor: "#059669", categoryBg: "#ECFDF5" },
  "Новости": { categoryColor: "#D97706", categoryBg: "#FFFBEB" },
  "Проекты": { categoryColor: "#2563EB", categoryBg: "#EFF6FF" },
  "Семинары": { categoryColor: "#D97706", categoryBg: "#FFFBEB" },
  "События": { categoryColor: "#059669", categoryBg: "#ECFDF5" },
};

const DEFAULT_CATEGORIES = [
  { id: 1, name: "Мероприятия" },
  { id: 2, name: "Курсы" },
  { id: 3, name: "Достижения" },
  { id: 4, name: "Новости" },
  { id: 5, name: "Проекты" },
  { id: 6, name: "Семинары" },
];

const FALLBACK_IMAGES = [
  "/mky/images/news1.jpg",
  "/mky/images/news2.jpg",
  "/mky/images/news3.jpg",
  "/mky/images/news4.jpg",
];

function normalizeMojibake(value) {
  return String(value || "")
    .replaceAll("РњРµСЂРѕРїСЂРёСЏС‚РёСЏ", "Мероприятия")
    .replaceAll("РљСѓСЂСЃС‹", "Курсы")
    .replaceAll("Р”РѕСЃС‚РёР¶РµРЅРёСЏ", "Достижения")
    .replaceAll("РќРѕРІРѕСЃС‚Рё", "Новости")
    .replaceAll("РџСЂРѕРµРєС‚С‹", "Проекты")
    .replaceAll("РЎРµРјРёРЅР°СЂС‹", "Семинары")
    .replaceAll("РЎРѕР±С‹С‚РёСЏ", "События");
}

function articleToNewsItem(article) {
  const catObj = DEFAULT_CATEGORIES.find((category) => article.categories?.includes(category.id));
  const catName = catObj?.name ?? "Новости";
  const style = CATEGORY_STYLE[catName] ?? CATEGORY_STYLE["Новости"];
  const heroBlock = article.blocks?.find((block) => block.type === "hero");
  const paraBlock = article.blocks?.find((block) => block.type === "paragraph");
  const imgBlock = article.blocks?.find((block) => block.type === "image" || block.type === "imagetext");
  const excerpt = heroBlock?.data?.intro || paraBlock?.data?.text || article.excerpt || "";
  const image = imgBlock?.data?.url || article.image || FALLBACK_IMAGES[(article.id - 1) % FALLBACK_IMAGES.length];

  return {
    id: `admin-${article.id}`,
    articleId: article.id,
    date: article.updatedAt || article.createdAt || "",
    category: catName,
    categoryColor: style.categoryColor,
    categoryBg: style.categoryBg,
    title: article.title,
    excerpt: String(excerpt).slice(0, 220),
    image,
    blocks: article.blocks || [],
    author: article.author || "",
    _isAdmin: true,
  };
}

function staticNewsToItem(news) {
  const category = normalizeMojibake(news.category);
  const style = CATEGORY_STYLE[category] || {};
  return {
    ...news,
    id: `static-${news.id}`,
    articleId: news.id,
    category,
    categoryColor: style.categoryColor || news.categoryColor,
    categoryBg: style.categoryBg || news.categoryBg,
    blocks: [],
    author: "",
    _isAdmin: false,
  };
}

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [articles, setArticles] = useState(INITIAL_ARTICLES);

  const saveArticle = useCallback((article) => {
    const now = new Date().toISOString().slice(0, 10);
    setArticles((prev) => {
      const exists = prev.find((item) => item.id === article.id);
      if (exists) return prev.map((item) => item.id === article.id ? { ...article, updatedAt: now } : item);
      return [...prev, { ...article, id: Date.now(), createdAt: now, updatedAt: now, author: "Администратор" }];
    });
  }, []);

  const deleteArticle = useCallback((id) => {
    setArticles((prev) => prev.filter((article) => article.id !== id));
  }, []);

  const changeArticleStatus = useCallback((id, status) => {
    setArticles((prev) => prev.map((article) =>
      article.id === id ? { ...article, status, updatedAt: new Date().toISOString().slice(0, 10) } : article
    ));
  }, []);

  const publishedNews = useMemo(() => {
    const adminNews = articles
      .filter((article) => article.status === "published")
      .map(articleToNewsItem);
    const adminTitles = new Set(adminNews.map((news) => news.title));
    const staticNews = NEWS
      .filter((news) => !adminTitles.has(news.title))
      .map(staticNewsToItem);
    return [...adminNews, ...staticNews];
  }, [articles]);

  const openArticle = useCallback((newsItem) => {
    navigate(`/article/${encodeURIComponent(newsItem.id)}`, { state: { article: newsItem } });
    window.scrollTo({ top: 0 });
  }, [navigate]);

  function ArticleRoute() {
    const { id } = useParams();
    const stateArticle = location.state?.article;
    const article = stateArticle || publishedNews.find((item) => String(item.id) === id);
    if (!article) return <Navigate to="/" replace />;
    return <ArticlePage article={article} onBack={() => navigate("/")} />;
  }

  function RequireAuth({ children }) {
    if (!currentUser) {
      return <Navigate to="/auth?tab=login" replace state={{ from: location.pathname }} />;
    }
    return children;
  }

  function RequireAdmin({ children }) {
    if (!currentUser) {
      return <Navigate to="/auth?tab=login" replace state={{ from: location.pathname }} />;
    }
    if (!canAccessAdmin(currentUser)) {
      return <Navigate to="/profile?access=denied" replace />;
    }
    return children;
  }

  function RequireTpmpkAdmin({ children }) {
    if (!currentUser) {
      return <Navigate to="/auth?tab=login" replace state={{ from: location.pathname }} />;
    }
    if (!canAccessTpmpkAdmin(currentUser)) {
      return <Navigate to="/profile?access=denied" replace />;
    }
    return children;
  }

  const handleLogin = useCallback((user) => {
    storeUser(user);
    setCurrentUser(user);
    navigate("/profile", { replace: true });
  }, [navigate]);

  const handleLogout = useCallback(() => {
    clearStoredUser();
    setCurrentUser(null);
    navigate("/auth?tab=login", { replace: true });
  }, [navigate]);

  const tpmpkPublicProps = {
    currentUser,
    onGoAuth: (tab) => navigate(`/auth?tab=${tab || "login"}`),
    onGoAdmin: canAccessAdmin(currentUser) ? () => navigate("/admin") : null,
    onGoProfile: () => navigate("/profile"),
  };

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              onGoAuth={(tab) => navigate(`/auth?tab=${tab || "login"}`)}
              onGoAdmin={canAccessAdmin(currentUser) ? () => navigate("/admin") : null}
              onGoProfile={() => navigate("/profile")}
              currentUser={currentUser}
              publishedNews={publishedNews}
              onOpenArticle={openArticle}
            />
          }
        />
        <Route
          path="/auth"
          element={
            currentUser
              ? <Navigate to="/profile" replace />
              : <AuthPage onLogin={handleLogin} />
          }
        />
        <Route
          path="/admin/tpmpk/*"
          element={
            <RequireTpmpkAdmin>
              <TpmpkAdmin currentUser={currentUser} onLogout={handleLogout} />
            </RequireTpmpkAdmin>
          }
        />
        <Route
          path="/admin/*"
          element={
            <RequireAdmin>
              <AdminPage
                currentUser={currentUser}
                articles={articles}
                saveArticle={saveArticle}
                deleteArticle={deleteArticle}
                changeArticleStatus={changeArticleStatus}
              />
            </RequireAdmin>
          }
        />
        <Route path="/article/:id" element={<ArticleRoute />} />
        <Route
          path="/tpmpk"
          element={
            <TpmpkPage
              currentUser={currentUser}
              onGoAuth={(tab) => navigate(`/auth?tab=${tab || "login"}`)}
              onGoAdmin={canAccessAdmin(currentUser) ? () => navigate("/admin") : null}
              onGoProfile={() => navigate("/profile")}
            />
          }
        />
        <Route
          path="/tpmpk/zapis"
          element={
            <TpmpkZapisPage
              currentUser={currentUser}
              onGoAuth={(tab) => navigate(`/auth?tab=${tab || "login"}`)}
              onGoAdmin={canAccessAdmin(currentUser) ? () => navigate("/admin") : null}
              onGoProfile={() => navigate("/profile")}
            />
          }
        />
        <Route path="/tpmpk/dokumenty/" element={<DokumentyPage {...tpmpkPublicProps} />} />
        <Route path="/tpmpk/blanki/" element={<BlankiPage {...tpmpkPublicProps} />} />
        <Route path="/tpmpk/grafik/" element={<GrafikPage {...tpmpkPublicProps} />} />
        <Route path="/tpmpk/sostav/" element={<SostavPage {...tpmpkPublicProps} />} />
        <Route path="/tpmpk/npa/" element={<NpaPage {...tpmpkPublicProps} />} />
        <Route path="/tpmpk/faq/" element={<FaqPage {...tpmpkPublicProps} />} />
        <Route path="/tpmpk/dlya-roditeley/" element={<DlyaRoditeleyPage {...tpmpkPublicProps} />} />
        <Route path="/tpmpk/dlya-pedagogov/" element={<DlyaPedagogovPage {...tpmpkPublicProps} />} />
        <Route path="/tpmpk/kontakty/" element={<KontaktyPage {...tpmpkPublicProps} />} />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage
                user={currentUser}
                onBack={() => navigate("/")}
                onAdmin={() => navigate("/admin")}
                onLogout={handleLogout}
              />
            </RequireAuth>
          }
        />
        <Route
          path="*"
          element={
            <Smart404
              currentUser={currentUser}
              onGoAuth={(tab) => navigate(`/auth?tab=${tab || "login"}`)}
              onGoAdmin={canAccessAdmin(currentUser) ? () => navigate("/admin") : null}
              onGoProfile={() => navigate("/profile")}
            />
          }
        />
      </Routes>
      {!location.pathname.startsWith("/admin") && <ChatBot />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/mky">
      <AppRoutes />
    </BrowserRouter>
  );
}
