import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import ArticlePage from "./pages/ArticlePage.jsx";
import AuthorArticlesPage from "./pages/AuthorArticlesPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import Smart404 from "./pages/Smart404.jsx";
import TpmpkPage from "./pages/TpmpkPage.jsx";
import TpmpkZapisPage from "./pages/TpmpkZapisPage.jsx";
import TpmpkAdmin from "./pages/admin/tpmpk/TpmpkAdmin.jsx";
import DomUchitelyaAdmin from "./pages/admin/domUchitelya/DomUchitelyaAdmin.jsx";
import {
  CommonNewsPage,
  DomUchitelyaHome,
  DomUchitelyaNewsPage,
  DomUchitelyaStaticPage,
} from "./pages/domUchitelya/DomUchitelyaPages.jsx";
import { DOMU_SECTIONS } from "./pages/domUchitelya/domuSections.js";
import {
  ArchivHomePage,
  ArchivSectionPage,
  DeyatelnostHomePage,
  DeyatelnostSectionPage,
  KonkursyHomePage,
  KonkursySectionPage,
  MethodikaHomePage,
  MethodikaStaticPage,
  MethodikaSubjectPage,
  NokoHomePage,
  NokoSectionPage,
} from "./pages/hubs/HubPages.jsx";
import { getMethodikaArticleBackPath } from "./pages/hubs/hubUtils.js";
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
import { apiMe, authFetch, AUTH_SESSION_EXPIRED_EVENT } from "./api.js";
import { resolveArticleAttachments, resolveArticleBlocks, resolveAssetUrl } from "./utils/assetUrl.js";
import {
  ARCHIV_ROUTES,
  DEYATELNOST_ROUTES,
  KONKURSY_ROUTES,
  METHODIKA_STATIC_PAGES,
  NOKO_ROUTES,
  methodikaSubjectSlug,
  resolveArticleLocation,
  resolveArticleSectionLabel,
} from "./features/admin/articleTaxonomy.js";
import { AUTH_TOKEN_STORAGE_KEYS, canAccessAdmin, canAccessDomuAdmin, canAccessTpmpkAdmin, clearStoredUser, getStoredUser, storeUser } from "./auth.js";

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
  "Проекты": { categoryColor: "#19789C", categoryBg: "#edf6f8" },
  "Семинары": { categoryColor: "#D97706", categoryBg: "#FFFBEB" },
  "События": { categoryColor: "#059669", categoryBg: "#ECFDF5" },
};

CATEGORY_STYLE["Дом учителя"] = { categoryColor: "#047857", categoryBg: "#ECFDF5" };
CATEGORY_STYLE["Методическое пространство"] = { categoryColor: "#19789C", categoryBg: "#edf6f8" };
CATEGORY_STYLE["НОКО"] = { categoryColor: "#7C3AED", categoryBg: "#F5F3FF" };
CATEGORY_STYLE["Олимпиады и конкурсы"] = { categoryColor: "#B45309", categoryBg: "#FEF3C7" };
CATEGORY_STYLE["Деятельность"] = { categoryColor: "#19789C", categoryBg: "#edf6f8" };
CATEGORY_STYLE["Архив"] = { categoryColor: "#374151", categoryBg: "#F3F4F6" };

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
const PUBLIC_HUB_KINDS = ["methodika", "noko", "konkursy", "deyatelnost", "archiv"];

function simpleSlug(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function getAuthorLabel(item) {
  const fio = [item.lastName, item.firstName, item.middleName].filter(Boolean).join(" ");
  return item.full_name || item.fullName || fio || item.author_name || item.author || (item.author_id ? `Автор #${item.author_id}` : "Редакция ИМЦРО");
}

function getAuthorKey(item) {
  if (item.author_id) return `id-${item.author_id}`;
  return `name-${simpleSlug(getAuthorLabel(item) || "author")}`;
}

function hasStoredArticleApiToken() {
  if (typeof window === "undefined") return false;
  return AUTH_TOKEN_STORAGE_KEYS.some((key) => Boolean(window.localStorage.getItem(key)));
}

function getStoredArticles() {
  if (typeof window === "undefined" || hasStoredArticleApiToken()) return [];
  try {
    const raw = window.localStorage.getItem(ARTICLES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistArticles(articles) {
  if (typeof window === "undefined") return;
  try {
    if (hasStoredArticleApiToken()) {
      window.localStorage.removeItem(ARTICLES_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(ARTICLES_STORAGE_KEY, JSON.stringify(articles));
  } catch {
    // Local storage can fail in private mode; the current session still keeps state.
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
  if (!article || article.status !== "published") return false;
  const rawDate = article.published_at || article.publishedAt;
  if (!rawDate) return true;
  const parsed = Date.parse(rawDate);
  return Number.isNaN(parsed) || parsed <= Date.now();
}

function isHomePlacement(article) {
  return !article.methodika_subject && !article.dom_uchitelya_section && !article.noko_section && !article.hub_kind;
}

function isInMainFeed(article) {
  return Boolean(article.duplicate_to_main) || isHomePlacement(article);
}

function isCommonScope(article) {
  return ["imcro_only", "both"].includes(article.publishing_scope || "imcro_only");
}

function isDomuScope(article) {
  return ["dom_uchitelya_only", "both"].includes(article.publishing_scope || "imcro_only") || Boolean(article.dom_uchitelya_section);
}

function mergeNewsItems(...groups) {
  const map = new Map();
  groups.flat().forEach((item) => {
    if (!item) return;
    const key = item.articleId ? `article-${item.articleId}` : String(item.slug || item.id);
    if (!map.has(key)) map.set(key, item);
  });
  return sortNewsByDateDesc([...map.values()]);
}

async function fetchArticleItems(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) return [];
  const data = await response.json().catch(() => ({}));
  return Array.isArray(data.items) ? data.items : [];
}

function articleToNewsItem(article) {
  const catObj = DEFAULT_CATEGORIES.find((category) => article.categories?.includes(category.id));
  const catName = resolveArticleSectionLabel(article) || catObj?.name || "Новости";
  const style = CATEGORY_STYLE[catName] ?? CATEGORY_STYLE["Новости"];
  const location = resolveArticleLocation(article);
  const heroBlock = article.blocks?.find((block) => block.type === "hero");
  const paraBlock = article.blocks?.find((block) => block.type === "paragraph");
  const imgBlock = article.blocks?.find((block) => block.type === "image" || block.type === "imagetext");
  const excerpt = article.lead || heroBlock?.data?.intro || article.excerpt || paraBlock?.data?.text || "";
  const numericId = Number(article.id || article.articleId || 1);
  const fallbackIndex = Number.isFinite(numericId) ? Math.max(0, (numericId - 1) % FALLBACK_IMAGES.length) : 0;
  const blocks = resolveArticleBlocks(article.blocks || []);
  const attachments = resolveArticleAttachments(article.attachments || []);
  const image = resolveAssetUrl(article.cover_image_url || imgBlock?.data?.url || article.image) || FALLBACK_IMAGES[fallbackIndex];

  return {
    id: article.slug || `admin-${article.id}`,
    articleId: article.id,
    slug: article.slug,
    date: article.updatedAt || article.createdAt || "",
    dateSortValue: article.publishedAt || article.published_at || article.updatedAt || article.createdAt || "",
    category: catName,
    categoryColor: style.categoryColor,
    categoryBg: style.categoryBg,
    title: article.title,
    excerpt: String(excerpt).slice(0, 220),
    image: resolveAssetUrl(image),
    is_pinned: Boolean(article.is_pinned),
    body: article.body || "",
    lead: article.lead || article.excerpt || "",
    cover_image_url: resolveAssetUrl(article.cover_image_url || image),
    blocks,
    attachments,
    author: getAuthorLabel(article),
    author_id: article.author_id || null,
    author_name: article.author_name || article.full_name || article.fullName || "",
    authorKey: getAuthorKey(article),
    parentLabel: location.parentLabel,
    parentPath: location.parentPath,
    sectionLabel: location.sectionLabel,
    sectionPath: location.sectionPath,
    publishing_scope: article.publishing_scope || "imcro_only",
    duplicate_to_main: Boolean(article.duplicate_to_main),
    duplicate_to_events: Boolean(article.duplicate_to_events),
    methodika_subject: article.methodika_subject || "",
    dom_uchitelya_section: article.dom_uchitelya_section || "",
    noko_section: article.noko_section || "",
    hub_kind: article.hub_kind || "",
    hub_path: article.hub_path || "",
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
    author: article.full_name || article.author_name || "",
    author_name: article.full_name || article.author_name || "",
    full_name: article.full_name || article.author_name || "",
    author_id: article.author_id || null,
  });
}

function apiArticleToLocalArticle(article) {
  return {
    ...article,
    image: resolveAssetUrl(article.image || article.cover_image_url || ""),
    cover_image_url: resolveAssetUrl(article.cover_image_url || article.image || ""),
    blocks: resolveArticleBlocks(article.blocks || []),
    attachments: resolveArticleAttachments(article.attachments || []),
    createdAt: article.createdAt || article.created_at || "",
    updatedAt: article.updatedAt || article.published_at || article.updated_at || article.created_at || "",
    publishedAt: article.publishedAt || article.published_at || "",
    author: article.full_name || article.author_name || article.author || "",
    author_name: article.full_name || article.author_name || article.author || "",
    full_name: article.full_name || article.author_name || article.author || "",
    author_id: article.author_id || null,
    publishing_scope: article.publishing_scope || "imcro_only",
    methodika_subject: article.methodika_subject || "",
    dom_uchitelya_section: article.dom_uchitelya_section || "",
    noko_section: article.noko_section || "",
    hub_kind: article.hub_kind || "",
    hub_path: article.hub_path || "",
  };
}

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [articles, setArticles] = useState(() => getStoredArticles());
  const [apiCommonNews, setApiCommonNews] = useState([]);
  const [apiSectionNews, setApiSectionNews] = useState([]);
  const [apiDomuNews, setApiDomuNews] = useState([]);
  const [apiEventsNews, setApiEventsNews] = useState([]);
  const [apiHubNews, setApiHubNews] = useState([]);

  const currentUserFullName = useMemo(() => {
    const fio = [currentUser?.lastName, currentUser?.firstName, currentUser?.middleName].filter(Boolean).join(" ");
    return currentUser?.full_name || currentUser?.fullName || fio || currentUser?.author_name || currentUser?.email || "Редакция ИМЦРО";
  }, [currentUser]);

  useEffect(() => {
    persistArticles(articles);
  }, [articles]);

  const saveArticle = useCallback((article) => {
    const now = new Date().toISOString().slice(0, 10);
    setArticles((prev) => {
      const exists = prev.find((item) => String(item.id) === String(article.id));
      const authorName = article.full_name || article.author_name || article.author || currentUserFullName;
      if (exists) {
        return prev.map((item) => String(item.id) === String(article.id) ? {
          ...item,
          ...article,
          updatedAt: now,
          author: authorName,
          author_name: authorName,
          full_name: authorName,
          author_id: article.author_id || item.author_id || currentUser?.id || null,
        } : item);
      }
      return [...prev, {
        ...article,
        publishing_scope: article.publishing_scope || "imcro_only",
        id: Date.now(),
        createdAt: now,
        updatedAt: now,
        author: authorName,
        author_name: authorName,
        full_name: authorName,
        author_id: article.author_id || currentUser?.id || null,
      }];
    });
  }, [currentUser?.id, currentUserFullName]);

  const deleteArticle = useCallback((id) => {
    setArticles((prev) => prev.filter((article) => String(article.id) !== String(id)));
  }, []);

  const changeArticleStatus = useCallback((id, status) => {
    setArticles((prev) => prev.map((article) =>
      String(article.id) === String(id) ? { ...article, status, updatedAt: new Date().toISOString().slice(0, 10) } : article
    ));
  }, []);

  const loadPublicNews = useCallback(async () => {
    const shouldLoadAdminArticles = hasStoredArticleApiToken();
    const publicRequests = await Promise.allSettled([
      fetchArticleItems("/api/news/?limit=100"),
      fetchArticleItems("/api/news/?limit=100&include_sections=true"),
      fetchArticleItems("/api/dom-uchitelya/news/?limit=100"),
      fetchArticleItems("/api/events/?limit=100"),
      Promise.all(PUBLIC_HUB_KINDS.map((hub) => fetchArticleItems(`/api/hub/news/?hub=${hub}&limit=100`))),
    ]);

    if (publicRequests[0].status === "fulfilled") setApiCommonNews(publicRequests[0].value.map(apiArticleToNewsItem));
    if (publicRequests[1].status === "fulfilled") setApiSectionNews(publicRequests[1].value.map(apiArticleToNewsItem));
    if (publicRequests[2].status === "fulfilled") setApiDomuNews(publicRequests[2].value.map(apiArticleToNewsItem));
    if (publicRequests[3].status === "fulfilled") setApiEventsNews(publicRequests[3].value.map(apiArticleToNewsItem));
    if (publicRequests[4].status === "fulfilled") {
      setApiHubNews(publicRequests[4].value.flat().map(apiArticleToNewsItem));
    }

    if (shouldLoadAdminArticles && hasStoredArticleApiToken()) {
      try {
        const responses = await Promise.allSettled([
          authFetch(`${API_BASE}/api/admin/news/`),
          authFetch(`${API_BASE}/api/admin/dom-uchitelya/news/`),
        ]);
        const items = [];
        for (const result of responses) {
          if (result.status !== "fulfilled" || !result.value.ok) continue;
          const data = await result.value.json().catch(() => ({}));
          items.push(...(data.items || []));
        }
        if (hasStoredArticleApiToken()) {
          setArticles(items.map(apiArticleToLocalArticle));
        }
      } catch {
        if (hasStoredArticleApiToken()) {
          setArticles([]);
        }
      }
    }
  }, []);

  useEffect(() => {
    loadPublicNews();
  }, [loadPublicNews]);

  useEffect(() => {
    if (!getStoredUser()) return;
    apiMe().catch(() => {
      // Keep the remembered account in place; individual API errors are handled near the request.
    });
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => {
      clearStoredUser();
      setCurrentUser(null);
      navigate("/auth?tab=login&reason=session-expired", { replace: true });
    };

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, [navigate]);

  const visibleLocalArticles = useMemo(
    () => articles.filter(isVisiblePublishedArticle),
    [articles],
  );
  const localMainNews = useMemo(
    () => visibleLocalArticles
      .filter((article) => isCommonScope(article) && isInMainFeed(article))
      .map(articleToNewsItem),
    [visibleLocalArticles],
  );
  const localSectionNews = useMemo(
    () => visibleLocalArticles
      .filter(isCommonScope)
      .map(articleToNewsItem),
    [visibleLocalArticles],
  );
  const localEventsNews = useMemo(
    () => visibleLocalArticles
      .filter((article) => isCommonScope(article) && article.duplicate_to_events)
      .map(articleToNewsItem),
    [visibleLocalArticles],
  );
  const localDomuNews = useMemo(
    () => visibleLocalArticles
      .filter(isDomuScope)
      .map(articleToNewsItem),
    [visibleLocalArticles],
  );
  const publishedNews = useMemo(
    () => mergeNewsItems(apiCommonNews, localMainNews),
    [apiCommonNews, localMainNews],
  );
  const sectionNews = useMemo(
    () => mergeNewsItems(apiSectionNews, apiHubNews, localSectionNews),
    [apiSectionNews, apiHubNews, localSectionNews],
  );
  const eventsNews = useMemo(
    () => mergeNewsItems(apiEventsNews, localEventsNews),
    [apiEventsNews, localEventsNews],
  );
  const domuNews = useMemo(
    () => mergeNewsItems(apiDomuNews, localDomuNews),
    [apiDomuNews, localDomuNews],
  );
  const allPublicNews = useMemo(() => {
    const map = new Map();
    [...sectionNews, ...eventsNews, ...domuNews].forEach((item) => {
      if (!map.has(item.id)) map.set(item.id, item);
    });
    return [...map.values()];
  }, [sectionNews, eventsNews, domuNews]);

  const openArticle = useCallback((newsItem) => {
    navigate(`/article/${encodeURIComponent(newsItem.slug || newsItem.id)}`, { state: { article: newsItem } });
    window.scrollTo({ top: 0 });
  }, [navigate]);
  const openAuthor = useCallback((newsItem) => {
    navigate(`/authors/${encodeURIComponent(newsItem.authorKey || getAuthorKey(newsItem))}/`, {
      state: { authorName: getAuthorLabel(newsItem) },
    });
    window.scrollTo({ top: 0 });
  }, [navigate]);

  function ArticleRoute() {
    const { id } = useParams();
    const stateArticle = location.state?.article;
    const stateKey = stateArticle ? String(stateArticle.slug || stateArticle.id) : "";
    const freshArticle = allPublicNews.find((item) =>
      String(item.slug || item.id) === id
      || String(item.id) === id
      || (stateKey && (String(item.slug || item.id) === stateKey || String(item.id) === String(stateArticle.articleId || stateArticle.id)))
    );
    const article = freshArticle || stateArticle;
    if (!article) return <Navigate to="/" replace />;
    return (
      <ArticlePage
        article={article}
        onBack={() => navigate("/")}
        currentUser={currentUser}
        onGoAuth={(tab) => navigate(`/auth?tab=${tab || "login"}`)}
        onGoAdmin={goAdmin}
        onGoProfile={() => navigate("/profile")}
        onOpenAuthor={openAuthor}
      />
    );
  }

  function MethodikaArticleRoute() {
    const { predmetSlug, articleSlug } = useParams();
    const stateArticle = location.state?.article;
    const stateKey = stateArticle ? String(stateArticle.slug || stateArticle.id) : "";
    const freshArticle = sectionNews.find((item) =>
      methodikaSubjectSlug(item.methodika_subject || "") === predmetSlug
      && (
        String(item.slug || item.id) === articleSlug
        || String(item.id) === articleSlug
        || (stateKey && (String(item.slug || item.id) === stateKey || String(item.id) === String(stateArticle.articleId || stateArticle.id)))
      )
    );
    const article = freshArticle || stateArticle;
    if (!article) return <Navigate to={`/metodika/${predmetSlug || ""}/`} replace />;
    return (
      <ArticlePage
        article={article}
        onBack={() => navigate(getMethodikaArticleBackPath(article))}
        currentUser={currentUser}
        onGoAuth={(tab) => navigate(`/auth?tab=${tab || "login"}`)}
        onGoAdmin={goAdmin}
        onGoProfile={() => navigate("/profile")}
        onOpenAuthor={openAuthor}
      />
    );
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
    if (user?.access_token) setArticles([]);
    void loadPublicNews();
    navigate("/profile", { replace: true });
  }, [loadPublicNews, navigate]);

  const handleLogout = useCallback(() => {
    clearStoredUser();
    setCurrentUser(null);
    setArticles(getStoredArticles());
    void loadPublicNews();
    navigate("/auth?tab=login", { replace: true });
  }, [loadPublicNews, navigate]);

  const adminTarget = canAccessAdmin(currentUser)
    ? "/admin"
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
              eventsNews={eventsNews}
              onOpenArticle={openArticle}
              onOpenAuthor={openAuthor}
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
                onArticlesChanged={loadPublicNews}
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
                onArticlesChanged={loadPublicNews}
              />
            </RequireAdmin>
          }
        />
        <Route path="/article/:id" element={<ArticleRoute />} />
        <Route path="/novosti/" element={<CommonNewsPage {...publicPageProps} newsItems={publishedNews} onOpenArticle={openArticle} onOpenAuthor={openAuthor} />} />
        <Route path="/dom-uchitelya/" element={<DomUchitelyaHome {...publicPageProps} newsItems={domuNews} onOpenArticle={openArticle} onOpenAuthor={openAuthor} />} />
        <Route path="/dom-uchitelya/novosti/" element={<DomUchitelyaNewsPage {...publicPageProps} newsItems={domuNews} onOpenArticle={openArticle} onOpenAuthor={openAuthor} />} />
        {DOMU_SECTIONS.filter((section) => section.path !== "/dom-uchitelya/novosti/").map((section) => (
          <Route key={section.path} path={section.path} element={<DomUchitelyaStaticPage {...publicPageProps} section={section} newsItems={domuNews} onOpenArticle={openArticle} onOpenAuthor={openAuthor} />} />
        ))}
        <Route path="/metodika/" element={<MethodikaHomePage {...publicPageProps} newsItems={sectionNews} />} />
        {METHODIKA_STATIC_PAGES.map((page) => (
          <Route
            key={page.path}
            path={page.path}
            element={<MethodikaStaticPage {...publicPageProps} page={page} newsItems={sectionNews} onOpenArticle={openArticle} onOpenAuthor={openAuthor} />}
          />
        ))}
        <Route path="/metodika/:predmetSlug/:articleSlug/" element={<MethodikaArticleRoute />} />
        <Route path="/metodika/:predmetSlug/" element={<MethodikaSubjectPage {...publicPageProps} newsItems={sectionNews} onOpenAuthor={openAuthor} />} />

        <Route path="/noko/" element={<NokoHomePage {...publicPageProps} />} />
        {NOKO_ROUTES.map((section) => (
          <Route
            key={section.path}
            path={section.path}
            element={<NokoSectionPage {...publicPageProps} section={section} newsItems={sectionNews} onOpenArticle={openArticle} onOpenAuthor={openAuthor} />}
          />
        ))}

        <Route path="/konkursy/" element={<KonkursyHomePage {...publicPageProps} />} />
        {KONKURSY_ROUTES.map((section) => (
          <Route
            key={section.path}
            path={section.path}
            element={<KonkursySectionPage {...publicPageProps} section={section} newsItems={sectionNews} onOpenArticle={openArticle} onOpenAuthor={openAuthor} />}
          />
        ))}

        <Route path="/deyatelnost/" element={<DeyatelnostHomePage {...publicPageProps} />} />
        {DEYATELNOST_ROUTES.map((section) => (
          <Route
            key={section.path}
            path={section.path}
            element={<DeyatelnostSectionPage {...publicPageProps} section={section} newsItems={sectionNews} onOpenArticle={openArticle} onOpenAuthor={openAuthor} />}
          />
        ))}

        <Route path="/archiv/" element={<ArchivHomePage {...publicPageProps} />} />
        {ARCHIV_ROUTES.map((section) => (
          <Route
            key={section.path}
            path={section.path}
            element={<ArchivSectionPage {...publicPageProps} section={section} newsItems={sectionNews} onOpenArticle={openArticle} onOpenAuthor={openAuthor} />}
          />
        ))}
        <Route path="/authors/:authorKey/" element={<AuthorArticlesPage {...publicPageProps} allNews={allPublicNews} onOpenArticle={openArticle} />} />
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
