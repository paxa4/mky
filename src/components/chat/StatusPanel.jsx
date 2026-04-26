/**
 * StatusPanel — показывает состояние RAG-системы:
 *   — автоматический планировщик (интервал, last/next run)
 *   — текущая фоновая задача (если идёт)
 *   — результат последнего обновления
 */
import { cardStyle } from "../certificates/shared/styles.js";
import AlertBanner from "../certificates/shared/AlertBanner.jsx";

function formatDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("ru-RU", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function Metric({ label, value, valueColor = "#0F172A", mono = false }) {
  return (
    <div style={{ background: "#F8FAFC", padding: "14px 16px", borderRadius: 10, border: "1px solid #E2E8F0" }}>
      <div style={{ fontSize: 12, color: "#64748B", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>
        {label}
      </div>
      <div style={{
        fontSize: 15,
        fontWeight: 700,
        color: valueColor,
        fontFamily: mono ? "ui-monospace, SFMono-Regular, Menlo, monospace" : "inherit",
        wordBreak: "break-word",
      }}>
        {value}
      </div>
    </div>
  );
}

export default function StatusPanel({ status, loading, error }) {
  if (loading) {
    return (
      <div style={cardStyle}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#0F172A" }}>Состояние системы</h2>
        <div style={{ marginTop: 20, color: "#94A3B8", fontSize: 14 }}>Загрузка статуса…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={cardStyle}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#0F172A" }}>Состояние системы</h2>
        <AlertBanner type="error">Не удалось получить статус: {error}</AlertBanner>
      </div>
    );
  }

  const scheduler = status?.scheduler || {};
  const bg        = status?.background || {};

  const schedulerRunning = !!scheduler.running;
  const taskRunning      = !!bg.running;

  const MODE_LABELS = {
    reindex:           "полная переиндексация",
    incremental:       "обновление: сайт + документы",
    incremental_site:  "обновление: только сайт",
    incremental_docs:  "обновление: только документы",
    full_reindex:      "полная переиндексация",
  };
  const modeLabel = (m, fallback = "обновление") => MODE_LABELS[m] || fallback;

  const STAGE_LABELS = {
    site_crawl:    "Краулинг сайта",
    s3_list:       "Листинг S3",
    s3:            "Обработка документов",
    chroma_delete: "Удаление старых чанков",
    chroma_add:    "Добавление в индекс",
    reindex_clear: "Очистка коллекции",
  };

  const progress = bg.progress;

  // Цвет точки состояния
  const dotColor = taskRunning ? "#F59E0B" : (schedulerRunning ? "#10B981" : "#94A3B8");
  const dotText  = taskRunning
    ? `Идёт задача: ${modeLabel(bg.mode)}`
    : (schedulerRunning ? "Планировщик активен" : "Планировщик остановлен");

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#0F172A" }}>
          Состояние системы
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569" }}>
          <span style={{
            width: 10, height: 10, borderRadius: "50%", background: dotColor,
            boxShadow: `0 0 0 3px ${dotColor}33`,
            animation: taskRunning ? "pulse 1.5s ease-in-out infinite" : "none",
          }}/>
          {dotText}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.4; }
        }
      `}</style>

      {/* Метрики планировщика */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <Metric label="Интервал" value={`${scheduler.interval_hours ?? "—"} ч.`} />
        <Metric label="Последнее обновление" value={formatDate(scheduler.last_run)} />
        <Metric label="Следующее обновление" value={
          scheduler.next_run === "при следующем цикле"
            ? "при следующем цикле"
            : formatDate(scheduler.next_run)
        }/>
        <Metric label="Текущая задача"
          value={taskRunning
            ? `${modeLabel(bg.mode, "инкремент.")} · с ${formatDate(bg.started_at)}`
            : "—"
          }
          valueColor={taskRunning ? "#D97706" : "#0F172A"}
        />
      </div>

      {/* Прогресс текущей задачи */}
      {taskRunning && progress && (
        <div style={{
          marginTop: 16, padding: "14px 16px",
          background: "#FFFBEB", borderRadius: 10, border: "1px solid #FDE68A",
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 8, fontSize: 13, color: "#92400E",
          }}>
            <strong>{STAGE_LABELS[progress.stage] || progress.stage}</strong>
            <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
              {progress.total > 0
                ? `${progress.current}/${progress.total}`
                : "…"}
            </span>
          </div>
          <div style={{
            height: 8, background: "#FEF3C7", borderRadius: 999, overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: progress.total > 0
                ? `${Math.min(100, (progress.current / progress.total) * 100)}%`
                : "30%",
              background: "#F59E0B",
              transition: "width 0.3s ease",
              animation: progress.total === 0 ? "indeterminate 1.5s ease-in-out infinite" : "none",
            }}/>
          </div>
          {progress.detail && (
            <div style={{
              marginTop: 8, fontSize: 12, color: "#78350F",
              wordBreak: "break-word", lineHeight: 1.4,
            }}>
              {progress.detail}
            </div>
          )}
          <style>{`
            @keyframes indeterminate {
              0%   { transform: translateX(-100%); }
              100% { transform: translateX(300%); }
            }
          `}</style>
        </div>
      )}

      {/* Итог последнего обновления */}
      {scheduler.last_stats && (
        <div style={{
          marginTop: 16, padding: "12px 16px",
          background: "#EFF6FF", borderRadius: 10, border: "1px solid #BFDBFE",
          fontSize: 13, color: "#1E40AF", lineHeight: 1.6,
        }}>
          <strong>Последний прогон:</strong>{" "}
          сайт +{scheduler.last_stats.site?.added ?? 0},
          {" "}~{scheduler.last_stats.site?.updated ?? 0},
          {" "}-{scheduler.last_stats.site?.removed ?? 0};{" "}
          S3 +{scheduler.last_stats.s3?.added ?? 0}
        </div>
      )}

      {/* Результат или ошибка предыдущей ручной задачи */}
      {!taskRunning && bg.result && (
        <AlertBanner type="success">
          Задача «{modeLabel(bg.result.mode, "обновление")}» завершена.
          {bg.result.vectors ? ` Векторов в базе: ${bg.result.vectors}.` : ""}
        </AlertBanner>
      )}
      {!taskRunning && bg.error && (
        <AlertBanner type="error">Ошибка последней задачи: {bg.error}</AlertBanner>
      )}
    </div>
  );
}
