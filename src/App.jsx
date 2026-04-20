import { useState } from "react";
import HomePage    from "./pages/HomePage.jsx";
import AuthPage    from "./pages/AuthPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import ProfilePage, { MOCK_USER } from "./pages/ProfilePage.jsx";
import ChatBot     from "./components/ChatBot.jsx";

export default function App() {
  const [page,    setPage]    = useState("home");
  const [isAdmin] = useState(true);
  // В реальном проекте currentUser берётся из контекста авторизации / JWT
  const [currentUser] = useState(MOCK_USER);

  return (
    <>
      {page === "home"    && (
        <HomePage
          onGoAuth={()    => setPage("auth")}
          onGoAdmin={isAdmin ? () => setPage("admin") : null}
          onGoProfile={currentUser ? () => setPage("profile") : null}
          currentUser={currentUser}
        />
      )}
      {page === "auth"    && <AuthPage    onBack={() => setPage("home")} />}
      {page === "admin"   && <AdminPage   onBack={() => setPage("home")} />}
      {page === "profile" && (
        <ProfilePage
          user={currentUser}
          onBack={()   => setPage("home")}
          onLogout={()  => setPage("home")}
        />
      )}
      {page !== "admin" && <ChatBot />}
    </>
  );
}