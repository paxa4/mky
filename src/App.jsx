import { useState } from "react";
import { useAppStore } from "./store/appStore.js";
import HomePage    from "./pages/HomePage.jsx";
import AuthPage    from "./pages/AuthPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import ChatBot     from "./components/ChatBot.jsx";

export default function App() {
  const [page, setPage] = useState("home");
  const store = useAppStore();

  // Статьи текущего пользователя (article.author_id === user.id)
  const userArticles = store.currentUser
    ? store.articles.filter(a => a.author_id === store.currentUser.id)
    : [];

  const handleLogin = (creds) => {
    store.login(creds);
    setPage("home");
  };

  return (
    <>
      {page === "home" && (
        <HomePage
          onGoAuth={() => setPage("auth")}
          onGoProfile={store.currentUser ? () => setPage("profile") : null}
          currentUser={store.currentUser}
          publishedArticles={store.publishedArticles}
        />
      )}

      {page === "auth" && (
        <AuthPage
          onBack={() => setPage("home")}
          onLogin={handleLogin}
        />
      )}

      {page === "profile" && store.currentUser && (
        <ProfilePage
          user={store.currentUser}
          userArticles={userArticles}
          onBack={() => setPage("home")}
          onLogout={() => { store.logout(); setPage("home"); }}
        />
      )}

      <ChatBot />
    </>
  );
}