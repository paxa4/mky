import { useNavigate } from "react-router-dom";
import Header from "../../../features/nav/Header.jsx";
import Footer from "../../../components/Footer.jsx";
import ArticlesModule from "../../../features/admin/ArticlesModule.jsx";

export default function DomUchitelyaAdmin({
  currentUser,
  articles,
  saveArticle,
  deleteArticle,
  changeArticleStatus,
  onArticlesChanged,
  onLogout,
}) {
  const navigate = useNavigate();
  const domuArticles = articles.filter((article) =>
    ["both", "dom_uchitelya_only"].includes(article.publishing_scope || "imcro_only")
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #FFFFFF 0%, #ECFDF5 100%)", display: "flex", flexDirection: "column" }}>
      <Header
        currentUser={currentUser}
        onGoAuth={(tab) => navigate(`/auth?tab=${tab || "login"}`)}
        onGoAdmin={() => navigate("/admin/dom-uchitelya/")}
        onGoProfile={() => navigate("/profile")}
      />
      <main style={{ flex: 1, paddingTop: 72 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "34px 24px 64px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 26 }}>
            <div>
              <div style={{ color: "#047857", fontSize: 12, fontWeight: 900, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 6 }}>Админ-панель</div>
              <h1 style={{ margin: 0, color: "#0F172A", fontSize: 34, lineHeight: 1.05 }}>Дом учителя</h1>
            </div>
            <div style={{ flex: 1 }} />
            <button
              type="button"
              onClick={() => navigate("/dom-uchitelya/")}
              style={{ minHeight: 40, border: "1px solid #BBF7D0", borderRadius: 8, background: "#fff", color: "#047857", padding: "0 14px", font: "800 13px/1 inherit", cursor: "pointer" }}
            >
              На сайт
            </button>
            <button
              type="button"
              onClick={onLogout}
              style={{ minHeight: 40, border: "1px solid #FECACA", borderRadius: 8, background: "#fff", color: "#B91C1C", padding: "0 14px", font: "800 13px/1 inherit", cursor: "pointer" }}
            >
              Выйти
            </button>
          </div>
          <ArticlesModule
            currentUser={currentUser}
            articles={domuArticles}
            saveArticle={(article) => saveArticle({ ...article, publishing_scope: article.publishing_scope || "both" })}
            deleteArticle={deleteArticle}
            changeArticleStatus={changeArticleStatus}
            allowedScopes={["both", "dom_uchitelya_only"]}
            defaultScope="both"
            apiPath="/api/admin/dom-uchitelya/news/"
            uploadPath="/api/admin/dom-uchitelya/news/upload-cover/"
            uploadAttachmentPath="/api/admin/dom-uchitelya/news/upload-attachment/"
            isDomuMode
            onArticlesChanged={onArticlesChanged}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
