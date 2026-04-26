/** Общие стили для компонентов генератора сертификатов */

export const cardStyle = {
  background: "#fff",
  borderRadius: 20,
  padding: 40,
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
};

export const pillBtn = (active) => ({
  padding: "12px 24px",
  borderRadius: 12,
  fontWeight: 700,
  cursor: "pointer",
  border: "none",
  fontSize: 15,
  transition: "background 0.15s, color 0.15s, box-shadow 0.15s",
  background: active ? "#1D4ED8" : "#F1F5F9",
  color: active ? "#fff" : "#64748B",
  boxShadow: active ? "0 4px 12px rgba(29,78,216,0.25)" : "none",
});

export const inputStyle = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 12,
  border: "1px solid #E2E8F0",
  fontSize: 15,
  boxSizing: "border-box",
  outline: "none",
  transition: "border-color 0.15s",
  fontFamily: "inherit",
};

export const labelStyle = {
  display: "block",
  marginBottom: 8,
  fontWeight: 600,
  color: "#475569",
  fontSize: 16,
};

export const primaryBtn = (disabled) => ({
  width: "100%",
  padding: "16px",
  fontSize: 16,
  fontWeight: 700,
  background: disabled ? "#CBD5E1" : "#1D4ED8",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  cursor: disabled ? "not-allowed" : "pointer",
  transition: "background 0.15s, transform 0.1s",
  letterSpacing: "0.01em",
});

export const successBtn = (disabled) => ({
  ...primaryBtn(disabled),
  background: disabled ? "#CBD5E1" : "#059669",
});

export const dangerBtn = {
  padding: "6px 12px",
  background: "#FEE2E2",
  color: "#DC2626",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 13,
};

export const sectionBox = (color = "#EFF6FF", border = "#BFDBFE") => ({
  background: color,
  padding: 20,
  borderRadius: 12,
  marginBottom: 24,
  border: `1px solid ${border}`,
});
