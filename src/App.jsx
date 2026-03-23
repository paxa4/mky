import { useState } from "react";
import HomePage from "./pages/HomePage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import ChatBot from "./components/ChatBot.jsx";

export default function App() {
  const [page, setPage] = useState("home"); // "home" | "auth"

  return (
    <>
      {page === "home" && <HomePage onGoAuth={() => setPage("auth")} />}
      {page === "auth" && <AuthPage onBack={() => setPage("home")} />}
      <ChatBot />
    </>
  );
}