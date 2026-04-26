export default function Logo() {
  return (
    <div
      style={{ display: "flex", alignItems: "center", cursor: "pointer", flexShrink: 0, transition: "transform 0.2s" }}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      onMouseOver={e => e.currentTarget.style.transform = "scale(1.02)"}
      onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
    >
      <img
        src="https://mc.eduirk.ru/images/headers/imcro2.png"
        alt="МКУ развития образования города Иркутска"
        style={{ height: 48, width: "auto", objectFit: "contain" }}
      />
    </div>
  );
}
