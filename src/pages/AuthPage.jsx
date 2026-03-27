import { useState } from "react";
import { apiLogin, apiRegister } from "../api";

export default function AuthPage({ onBack }) {
  const [tab, setTab]           = useState("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm,   setRegForm]   = useState({ name: "", email: "", password: "" });
  const [showPass,  setShowPass]  = useState(false);
  const [done,      setDone]      = useState(false);
  const [loggedIn,  setLoggedIn]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) return;
    setLoading(true);
    setError("");
    try {
      await apiLogin(loginForm.email, loginForm.password);
      setLoggedIn(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regForm.email || regForm.password.length < 8) return;
    setLoading(true);
    setError("");
    try {
      await apiRegister(regForm.email, regForm.password);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", flexDirection: "column" }}>
      <style>{`
        .auth-input {
          width: 100%; padding: 12px 14px; font-size: 14px;
          border: 1.5px solid #E2E8F0; border-radius: 10px;
          outline: none; color: #0F172A; background: #F8FAFC;
          transition: border-color 0.2s, background 0.2s;
          font-family: inherit; box-sizing: border-box;
        }
        .auth-input:focus { border-color: #93C5FD; background: #fff; }
        .auth-input::placeholder { color: #94A3B8; }
        .auth-btn {
          width: 100%; padding: 13px; font-size: 15px; font-weight: 700;
          color: #fff; background: #1D4ED8; border: none; border-radius: 10px;
          cursor: pointer; font-family: inherit;
          transition: background 0.15s, transform 0.1s;
        }
        .auth-btn:hover  { background: #1E40AF; transform: translateY(-1px); }
        .auth-btn:active { transform: translateY(0); }
        .auth-btn:disabled { background: #93C5FD; cursor: default; transform: none; }
        .tab-btn {
          flex: 1; padding: 11px; font-size: 14px; font-weight: 600;
          border: none; background: none; cursor: pointer; border-radius: 9px;
          transition: background 0.15s, color 0.15s; font-family: inherit;
        }
        .tab-btn.active { background: #fff; color: #1D4ED8; box-shadow: 0 1px 6px rgba(0,0,0,0.08); }
        .tab-btn:not(.active) { color: #64748B; }
        .tab-btn:not(.active):hover { color: #334155; }
      `}</style>

      {/* Top bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #F1F5F9", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
        <img src="https://mc.eduirk.ru/images/headers/imcro2.png" alt="МКУ" style={{ height: 42, objectFit: "contain" }} />
        {onBack && (
          <button onClick={onBack} style={{ background: "none", border: "1px solid #E2E8F0", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#64748B", padding: "7px 14px", borderRadius: 9, fontFamily: "inherit", transition: "all 0.15s" }}
            onMouseOver={e => { e.currentTarget.style.borderColor = "#93C5FD"; e.currentTarget.style.color = "#1D4ED8"; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.color = "#64748B"; }}
          >← На главную</button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 440 }}>

          {/* Logo & title */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8ZM4 20c0-3.866 3.582-7 8-7s8 3.134 8 7" stroke="#1D4ED8" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em", margin: "0 0 6px" }}>
              {tab === "login" ? "Добро пожаловать" : "Создать аккаунт"}
            </h1>
            <p style={{ fontSize: 14, color: "#94A3B8" }}>
              {tab === "login" ? "Войдите в личный кабинет" : "Зарегистрируйтесь для доступа к сервисам"}
            </p>
          </div>

          {/* Card */}
          <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #F1F5F9", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", padding: "28px 32px 32px" }}>

            {/* Tabs */}
            <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 11, padding: 4, marginBottom: 28 }}>
              <button className={`tab-btn${tab === "login" ? " active" : ""}`} onClick={() => { setTab("login"); setDone(false); setError(""); }}>Вход</button>
              <button className={`tab-btn${tab === "register" ? " active" : ""}`} onClick={() => { setTab("register"); setLoggedIn(false); setError(""); }}>Регистрация</button>
            </div>

            {/* Ошибка */}
            {error && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#DC2626" }}>
                {error}
              </div>
            )}

            {/* LOGIN */}
            {tab === "login" && (
              <>
                {loggedIn ? (
                  <div style={{ textAlign: "center", padding: "16px 0" }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                        <path d="M5 13l6 6L21 7" stroke="#1D4ED8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>Вы вошли!</h3>
                    <p style={{ fontSize: 14, color: "#64748B", marginBottom: 20 }}>Добро пожаловать, {loginForm.email}</p>
                    {onBack && <button className="auth-btn" onClick={onBack}>Перейти на главную</button>}
                  </div>
                ) : (
                  <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Email</label>
                      <input className="auth-input" type="email" placeholder="example@mail.ru"
                        value={loginForm.email} onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))} required />
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Пароль</label>
                        <span style={{ fontSize: 12, color: "#1D4ED8", cursor: "pointer", fontWeight: 500 }}>Забыли пароль?</span>
                      </div>
                      <div style={{ position: "relative" }}>
                        <input className="auth-input" type={showPass ? "text" : "password"} placeholder="Введите пароль"
                          value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                          style={{ paddingRight: 42 }} required />
                        <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 0, display: "flex" }}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M1.5 8C2.3 5 5 3 8 3s5.7 2 6.5 5c-.8 3-3.5 5-6.5 5S2.3 11 1.5 8Z" stroke="currentColor" strokeWidth="1.4"/>
                            <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <button type="submit" className="auth-btn" style={{ marginTop: 4 }}
                      disabled={!loginForm.email || !loginForm.password || loading}>
                      {loading ? "Входим…" : "Войти"}
                    </button>
                  </form>
                )}
              </>
            )}

            {/* REGISTER */}
            {tab === "register" && (
              <>
                {done ? (
                  <div style={{ textAlign: "center", padding: "16px 0" }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                        <path d="M5 13l6 6L21 7" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>Готово!</h3>
                    <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6, marginBottom: 20 }}>
                      Аккаунт <strong>{regForm.email}</strong> успешно создан.
                    </p>
                    <button className="auth-btn" onClick={() => { setTab("login"); setDone(false); }}>Войти в аккаунт</button>
                  </div>
                ) : (
                  <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Email</label>
                      <input className="auth-input" type="email" placeholder="example@mail.ru"
                        value={regForm.email} onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))} required />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Пароль</label>
                      <div style={{ position: "relative" }}>
                        <input className="auth-input"
                          type={showPass ? "text" : "password"}
                          placeholder="Минимум 8 символов"
                          value={regForm.password}
                          onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))}
                          style={{ paddingRight: 42 }}
                          minLength={8} required
                        />
                        <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 0, display: "flex" }}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M1.5 8C2.3 5 5 3 8 3s5.7 2 6.5 5c-.8 3-3.5 5-6.5 5S2.3 11 1.5 8Z" stroke="currentColor" strokeWidth="1.4"/>
                            <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/>
                          </svg>
                        </button>
                      </div>
                      {regForm.password.length > 0 && (
                        <div style={{ marginTop: 8, display: "flex", gap: 4 }}>
                          {[1,2,3,4].map(i => (
                            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: regForm.password.length >= i * 2 + 2 ? (regForm.password.length >= 10 ? "#059669" : "#F59E0B") : "#E2E8F0", transition: "background 0.2s" }} />
                          ))}
                        </div>
                      )}
                    </div>
                    <button type="submit" className="auth-btn" style={{ marginTop: 4 }}
                      disabled={!regForm.email || regForm.password.length < 8 || loading}>
                      {loading ? "Регистрируем…" : "Зарегистрироваться"}
                    </button>
                    <p style={{ fontSize: 12, color: "#94A3B8", textAlign: "center", lineHeight: 1.5, margin: 0 }}>
                      Нажимая кнопку, вы соглашаетесь с{" "}
                      <span style={{ color: "#1D4ED8", cursor: "pointer" }}>политикой конфиденциальности</span>
                    </p>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}