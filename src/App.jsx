import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import DomUchitelyaAdmin from "./pages/admin/domUchitelya/DomUchitelyaAdmin.jsx";
import {
  CommonNewsPage,
  DOMU_SECTIONS,
  DomUchitelyaHome,
  DomUchitelyaNewsPage,
  DomUchitelyaStaticPage,
} from "./pages/domUchitelya/DomUchitelyaPages.jsx";
import SvedeniyaPage from "./pages/SvedeniyaPage.jsx";
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
import { API_BASE } from "./constants/index.js";
import { INITIAL_ARTICLES } from "./features/admin/adminStore.js";
import { NEWS } from "./features/news/newsData.js";
import { canAccessAdmin, canAccessDomuAdmin, canAccessTpmpkAdmin, clearStoredUser, getStoredUser, storeUser } from "./auth.js";

function ScrollToTop() {
  const { pathname } = useLocation();
  const previousPathRef = useRef(pathname);

  useEffect(() => {
    const previousPath = previousPathRef.current;
    previousPathRef.current = pathname;

    if (previousPath.startsWith("/sveden") && pathname.startsWith("/sveden")) {
      return;
    }

    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

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
  "/images/news1.jpg",
  "/images/news2.jpg",
  "/images/news3.jpg",
  "/images/news4.jpg",
];
const ARTICLES_STORAGE_KEY = "mky_articles";
const COMMON_NEWS_SCOPES = new Set(["imcro_only", "both"]);
const DOMU_NEWS_SCOPES = new Set(["dom_uchitelya_only", "both"]);

function stripMkyPrefix(path) {
  return typeof path === "string" ? path.replace(new RegExp("^/" + "mky" + "(?=/)"), "") : path;
}

function getStoredArticles() {
  try {
    const raw = window.localStorage.getItem(ARTICLES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : INITIAL_ARTICLES;
  } catch {
    return INITIAL_ARTICLES;
  }
}

function persistArticles(articles) {
  try {
    window.localStorage.setItem(ARTICLES_STORAGE_KEY, JSON.stringify(articles));
  } catch {
    // Local demo storage can fail in private mode; the current session still keeps state.
  }
}

function getNewsSortValue(item) {
  const raw = item.dateSortValue || item.updatedAt || item.createdAt || item.date || "";
  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed)) return parsed;
  return Number(item.articleId || item.id || 0);
}

function sortNewsByDateDesc(items) {
  return [...items].sort((left, right) => {
    if (Boolean(left.is_pinned) !== Boolean(right.is_pinned)) return left.is_pinned ? -1 : 1;
    return getNewsSortValue(right) - getNewsSortValue(left);
  });
}

function isVisiblePublishedArticle(article) {
  if (article.status !== "published") return false;
  const rawDate = article.published_at || article.publishedAt;
  if (!rawDate) return true;
  const date = Date.parse(rawDate);
  return Number.isNaN(date) || date <= Date.now();
}

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
  const excerpt = article.lead || heroBlock?.data?.intro || article.excerpt || paraBlock?.data?.text || "";
  const image = stripMkyPrefix(article.cover_image_url || imgBlock?.data?.url || article.image) || FALLBACK_IMAGES[(article.id - 1) % FALLBACK_IMAGES.length];

  return {
    id: `admin-${article.id}`,
    articleId: article.id,
    date: article.updatedAt || article.createdAt || "",
    dateSortValue: article.publishedAt || article.published_at || article.updatedAt || article.createdAt || "",
    category: catName,
    categoryColor: style.categoryColor,
    categoryBg: style.categoryBg,
    title: article.title,
    excerpt: String(excerpt).slice(0, 220),
    image: stripMkyPrefix(image),
    is_pinned: Boolean(article.is_pinned),
    body: article.body || "",
    lead: article.lead || article.excerpt || "",
    cover_image_url: stripMkyPrefix(article.cover_image_url || image),
    blocks: article.blocks || [],
    author: article.author || "",
    publishing_scope: article.publishing_scope || "imcro_only",
    _isAdmin: true,
  };
}

function apiArticleToNewsItem(article) {
  return articleToNewsItem({
    ...article,
    id: article.id,
    createdAt: article.created_at,
    updatedAt: article.published_at || article.updated_at || article.created_at,
    publishedAt: article.published_at,
    author: "",
  });
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
    image: stripMkyPrefix(news.image),
    dateSortValue: news.dateSortValue || `2025-11-${String(30 - Number(news.id || 0)).padStart(2, "0")}`,
    blocks: [],
    author: "",
    publishing_scope: news.publishing_scope || "imcro_only",
    _isAdmin: false,
  };
}

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [articles, setArticles] = useState(() => getStoredArticles());
  const [apiCommonNews, setApiCommonNews] = useState([]);
  const [apiDomuNews, setApiDomuNews] = useState([]);

  useEffect(() => {
    persistArticles(articles);
  }, [articles]);

  const saveArticle = useCallback((article) => {
    const now = new Date().toISOString().slice(0, 10);
    setArticles((prev) => {
      const exists = prev.find((item) => item.id === article.id);
      if (exists) return prev.map((item) => item.id === article.id ? { ...article, updatedAt: now } : item);
      return [...prev, { ...article, publishing_scope: article.publishing_scope || "imcro_only", id: Date.now(), createdAt: now, updatedAt: now, author: "Администратор" }];
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

  useEffect(() => {
    let cancelled = false;
    async function loadNews() {
      try {
        const [commonRes, domuRes] = await Promise.all([
          fetch(`${API_BASE}/api/news/`),
          fetch(`${API_BASE}/api/dom-uchitelya/news/`),
        ]);
        if (cancelled) return;
        if (commonRes.ok) {
          const data = await commonRes.json();
          setApiCommonNews((data.items || []).map(apiArticleToNewsItem));
        }
        if (domuRes.ok) {
          const data = await domuRes.json();
          setApiDomuNews((data.items || []).map(apiArticleToNewsItem));
        }
      } catch {
        if (!cancelled) {
          setApiCommonNews([]);
          setApiDomuNews([]);
        }
      }
    }
    loadNews();
    return () => { cancelled = true; };
  }, []);

  const localCommonNews = useMemo(() => {
    const adminNews = articles
      .filter((article) => isVisiblePublishedArticle(article) && COMMON_NEWS_SCOPES.has(article.publishing_scope || "imcro_only"))
      .map(articleToNewsItem);
    const adminTitles = new Set(adminNews.map((news) => news.title));
    const staticNews = NEWS
      .filter((news) => !adminTitles.has(news.title))
      .map(staticNewsToItem);
    return sortNewsByDateDesc([...adminNews, ...staticNews]);
  }, [articles]);

  const localDomuNews = useMemo(() => articles
    .filter((article) => isVisiblePublishedArticle(article) && DOMU_NEWS_SCOPES.has(article.publishing_scope || "imcro_only"))
    .map(articleToNewsItem), [articles]);

  const publishedNews = sortNewsByDateDesc(apiCommonNews.length ? apiCommonNews : localCommonNews);
  const domuNews = sortNewsByDateDesc(apiDomuNews.length ? apiDomuNews : localDomuNews);

  const openArticle = useCallback((newsItem) => {
    navigate(`/article/${encodeURIComponent(newsItem.id)}`, { state: { article: newsItem } });
    window.scrollTo({ top: 0 });
  }, [navigate]);

  function ArticleRoute() {
    const { id } = useParams();
    const stateArticle = location.state?.article;
    const article = stateArticle || [...publishedNews, ...domuNews].find((item) => String(item.id) === id);
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

  function RequireDomuAdmin({ children }) {
    if (!currentUser) {
      return <Navigate to="/auth?tab=login" replace state={{ from: location.pathname }} />;
    }
    if (!canAccessDomuAdmin(currentUser)) {
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

  const adminTarget = canAccessAdmin(currentUser)
    ? "/admin/certificates"
    : canAccessDomuAdmin(currentUser)
      ? "/admin/dom-uchitelya/"
      : null;
  const goAdmin = adminTarget ? () => navigate(adminTarget) : null;

  const tpmpkPublicProps = {
    currentUser,
    onGoAuth: (tab) => navigate(`/auth?tab=${tab || "login"}`),
    onGoAdmin: goAdmin,
    onGoProfile: () => navigate("/profile"),
  };
  const publicPageProps = {
    currentUser,
    onGoAuth: (tab) => navigate(`/auth?tab=${tab || "login"}`),
    onGoAdmin: goAdmin,
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
              onGoAdmin={goAdmin}
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
          path="/admin/dom-uchitelya/*"
          element={
            <RequireDomuAdmin>
              <DomUchitelyaAdmin
                currentUser={currentUser}
                articles={articles}
                saveArticle={saveArticle}
                deleteArticle={deleteArticle}
                changeArticleStatus={changeArticleStatus}
                onLogout={handleLogout}
              />
            </RequireDomuAdmin>
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
        <Route path="/novosti/" element={<CommonNewsPage {...publicPageProps} newsItems={publishedNews} onOpenArticle={openArticle} />} />
        <Route path="/dom-uchitelya/" element={<DomUchitelyaHome {...publicPageProps} newsItems={domuNews} onOpenArticle={openArticle} />} />
        <Route path="/dom-uchitelya/novosti/" element={<DomUchitelyaNewsPage {...publicPageProps} newsItems={domuNews} onOpenArticle={openArticle} />} />
        {DOMU_SECTIONS.filter((section) => section.path !== "/dom-uchitelya/novosti/").map((section) => (
          <Route key={section.path} path={section.path} element={<DomUchitelyaStaticPage {...publicPageProps} section={section} />} />
        ))}
        <Route
          path="/tpmpk"
          element={
            <TpmpkPage
              currentUser={currentUser}
              onGoAuth={(tab) => navigate(`/auth?tab=${tab || "login"}`)}
              onGoAdmin={goAdmin}
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
              onGoAdmin={goAdmin}
              onGoProfile={() => navigate("/profile")}
            />
          }
        />
        <Route
          path="/sveden/*"
          element={
            <SvedeniyaPage
              currentUser={currentUser}
              onGoAuth={(tab) => navigate(`/auth?tab=${tab || "login"}`)}
              onGoAdmin={goAdmin}
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
                onAdmin={goAdmin}
                onTpmpkAdmin={() => navigate("/admin/tpmpk")}
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
              onGoAdmin={goAdmin}
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
    <BrowserRouter>
      <ScrollToTop />
      <AppRoutes />
    </BrowserRouter>
  );
}
