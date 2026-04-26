import React, { useMemo, useRef, useEffect, useState } from "react";
import { API_BASE } from "../../../constants/index.js";

const PAGE_W = 210; // мм
const PAGE_H = 297; // мм
const MM_TO_CSS_PX = 96 / 25.4;
const PT_TO_CSS_PX = 96 / 72;

// ── Утилиты ──────────────────────────────────────────────────────────────────

/** Умное выравнивание: определяем align по позиции X внутри рабочей зоны */
function smartAlign(xPct, xMinPct, xMaxPct) {
  const rel = (xPct - xMinPct) / Math.max(xMaxPct - xMinPct, 1);
  if (rel < 0.28) return "left";
  if (rel > 0.72) return "right";
  return "center";
}

/** CSS transform для превью в зависимости от align */
function previewTransform(align) {
  if (align === "left") return "translateY(-50%)";
  if (align === "right") return "translate(-100%, -50%)";
  return "translate(-50%, -50%)";
}

/**
 * Clamp: ограничиваем координату рабочей зоной.
 * Возвращает значение, зажатое между min и max.
 */
function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

/**
 * Auto-shrink шрифта для превью.
 * Имитирует бэкендный алгоритм: уменьшает размер пока текст не вписывается в maxWidthPx.
 * Использует Canvas API для точного измерения ширины текста.
 */
const _canvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
function calcPreviewFontSize(text, baseSizePx, maxWidthPx, fontWeight = "400") {
  if (!_canvas || !text || maxWidthPx <= 0) return baseSizePx;
  const ctx = _canvas.getContext("2d");
  let size = baseSizePx;
  const minSize = 6;
  while (size > minSize) {
    // Используем более универсальный стек шрифтов для лучшей точности
    ctx.font = `${fontWeight} ${size}px "DejaVu Sans", Arial, sans-serif`;
    const w = ctx.measureText(text).width;
    if (w <= maxWidthPx) break;
    size -= 0.5;
  }
  return Math.max(size, minSize);
}

export default function AccuratePreview({
  bgUrl,
  elements,
  signers,
  signersLayout,
  margins,
}) {
  const previewFrameRef = useRef(null);
  const [previewWidthPx, setPreviewWidthPx] = useState(0);

  useEffect(() => {
    if (!previewFrameRef.current || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width || 0;
      setPreviewWidthPx(width);
    });
    observer.observe(previewFrameRef.current);
    return () => observer.disconnect();
  }, []);

  const previewScale = useMemo(() => {
    const naturalWidthPx = PAGE_W * MM_TO_CSS_PX;
    const widthPx = previewWidthPx || naturalWidthPx;
    return widthPx / naturalWidthPx;
  }, [previewWidthPx]);

  // Вычисляем безопасную зону в %
  const safePct = useMemo(() => ({
    xMin: (margins.left / PAGE_W) * 100,
    xMax: ((PAGE_W - margins.right) / PAGE_W) * 100,
    yMin: (margins.top / PAGE_H) * 100,
    yMax: ((PAGE_H - margins.bottom) / PAGE_H) * 100,
  }), [margins]);

  return (
    <div ref={previewFrameRef} style={{
      width: "100%",
      aspectRatio: "210 / 297",
      maxWidth: 520,
      position: "relative",
      borderRadius: 8,
      overflow: "hidden",
      boxShadow: bgUrl ? "0 4px 24px rgba(0,0,0,0.18)" : "0 0 0 2px #E2E8F0",
      background: bgUrl ? "transparent" : "#F1F5F9",
      margin: "0 auto",
    }}>
      {/* Фон — растягивается на весь контейнер */}
      {bgUrl ? (
        <img src={bgUrl} alt="Фон" style={{
          position: "absolute", top: 0, left: 0,
          width: "100%", height: "100%", objectFit: "fill",
        }} />
      ) : (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#94A3B8", fontSize: 15,
        }}>
          Загрузите фон
        </div>
      )}

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <svg width="100%" height="100%" viewBox="0 0 210 297" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
            <defs>
              <pattern id="grid10mm" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(99,102,241,0.08)" strokeWidth="0.25" />
              </pattern>
              <pattern id="grid50mm" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(99,102,241,0.18)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="210" height="297" fill="url(#grid10mm)" />
            <rect width="210" height="297" fill="url(#grid50mm)" />
          </svg>
          <div style={{ position: "absolute", top: 5, left: 5, fontSize: "8px", color: "rgba(99,102,241,0.6)", fontWeight: "600" }}>
            0 мм
          </div>
          <div style={{ position: "absolute", top: 5, left: "50%", transform: "translateX(-50%)", fontSize: "8px", color: "rgba(99,102,241,0.6)", fontWeight: "600" }}>
            105 мм
          </div>
          <div style={{ position: "absolute", top: 5, right: 5, fontSize: "8px", color: "rgba(99,102,241,0.6)", fontWeight: "600" }}>
            210 мм
          </div>
          <div style={{ position: "absolute", bottom: 5, left: 5, fontSize: "8px", color: "rgba(99,102,241,0.6)", fontWeight: "600" }}>
            297 мм
          </div>
        </div>

        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
          {/* Рабочая зона */}
          <div style={{
            position: "absolute",
            left: `${safePct.xMin}%`, right: `${100 - safePct.xMax}%`,
            top: `${safePct.yMin}%`, bottom: `${100 - safePct.yMax}%`,
            border: "1.5px dashed rgba(220,38,38,0.5)", borderRadius: 3,
            pointerEvents: "none", boxSizing: "border-box",
          }} />

          {/* Текстовые элементы с auto-shrink */}
          {elements.map((el) => {
            const align = el.align || smartAlign(el.x, safePct.xMin, safePct.xMax);
            const xMm = (el.x / 100) * PAGE_W;
            const defaultMaxWidthMm = align === "center"
              ? Math.max(12, 2 * Math.min(xMm - margins.left - 2, (PAGE_W - margins.right) - xMm - 2))
              : align === "left"
                ? Math.max(12, (PAGE_W - margins.right) - xMm - 2)
                : Math.max(12, xMm - margins.left - 2);
            const maxWidthMm = Math.min(el.maxWidthMm || defaultMaxWidthMm, defaultMaxWidthMm);
            const scaledBase = el.size * PT_TO_CSS_PX * previewScale;
            const maxWPx = maxWidthMm * MM_TO_CSS_PX * previewScale;
            const displaySize = calcPreviewFontSize(el.text, scaledBase, maxWPx, el.weight);
            return (
              <div key={el.id} style={{
                position: "absolute",
                left: `${el.x}%`, top: `${el.y}%`,
                transform: previewTransform(align),
                fontSize: `${displaySize}px`,
                color: el.color,
                fontWeight: el.weight,
                width: `${maxWPx}px`,
                textAlign: align,
                pointerEvents: "none",
                lineHeight: 1.25,
                padding: "0 1px",
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
              }}>
                {el.text}
              </div>
            );
          })}

          {/* Блок подписантов */}
          {signers.map((s, i) => {
            const yMm = signersLayout.y_mm + i * signersLayout.row_h_mm + (Number(s.offsetY) || 0);
            const topPct = (yMm / PAGE_H) * 100;
            const leftPct = ((signersLayout.x_mm - signersLayout.band_mm / 2) / PAGE_W) * 100;
            const widthPct = (signersLayout.band_mm / PAGE_W) * 100;
            const rowHPct = Math.max((signersLayout.row_h_mm / PAGE_H) * 100, 3);
            const fs = Math.max(7, signersLayout.font_size * PT_TO_CSS_PX * previewScale);
            const facOffsetXPx = (Number(s.facOffsetX) || 0) * MM_TO_CSS_PX * previewScale;
            const facOffsetYPx = (Number(s.facOffsetY) || 0) * MM_TO_CSS_PX * previewScale;
            const facScale = Math.max(0.1, Number(s.facScale) || 1);

            // Логика расчета размеров факсимиле, аналогичная pdf_generator.py
            const box_w_mm = signersLayout.band_mm * 0.24; // 24% от ширины полосы
            const box_h_mm = signersLayout.row_h_mm * 0.92; // 92% от высоты строки

            const box_w_px = box_w_mm * MM_TO_CSS_PX * previewScale;
            const box_h_px = box_h_mm * MM_TO_CSS_PX * previewScale;

            return (
              <div key={s.id} style={{
                position: "absolute", top: `${topPct}%`, left: `${leftPct}%`,
                width: `${widthPct}%`, minHeight: `${rowHPct}%`,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                fontSize: `${fs}px`, color: signersLayout.text_color,
                fontWeight: signersLayout.font_weight, pointerEvents: "none",
                boxSizing: "border-box", padding: "1px 3px",
                borderTop: "1px dashed rgba(99,102,241,0.4)",
                overflow: "visible",
              }}>
                <span style={{ flex: "0 0 38%", textAlign: "right", paddingRight: 3, overflow: "hidden", textOverflow: "ellipsis" }}>{s.position}</span>
                <span style={{ flex: "0 0 24%", textAlign: "center", display: "flex", justifyContent: "center", alignItems: "center", position: "relative", overflow: "visible", width: box_w_px, height: box_h_px }}>
                  {s.facPreview ? (
                    <img
                      src={s.facPreview}
                      alt=""
                      style={{
                        objectFit: "contain",
                        transform: `translate(${facOffsetXPx}px, ${facOffsetYPx}px) scale(${facScale})`,
                        maxWidth: "100%",
                        maxHeight: "100%",
                      }}
                    />
                  ) : <span style={{ opacity: 0.25, fontSize: "0.9em" }}>✒</span>}
                </span>
                <span style={{ flex: "0 0 38%", textAlign: "left", paddingLeft: 3, overflow: "hidden", textOverflow: "ellipsis" }}>{s.fullName || "ФИО"}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
