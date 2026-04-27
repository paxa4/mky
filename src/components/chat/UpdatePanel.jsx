/**
 * UpdatePanel — кнопки управления индексом:
 *   — инкрементальное обновление (добавляет новые/изменённые данные)
 *   — полная переиндексация (удаляет всё и строит заново)
 *
 * Обе задачи идут в фоне; статус отображается в StatusPanel через polling.
 */
import { useState } from "react";
import { cardStyle } from "../certificates/shared/styles.js";
import AlertBanner from "../certificates/shared/AlertBanner.jsx";

function actionBtn({ bg, disabled }) {
  return {
    width: "100%",
    padding: "14px 18px",
    fontSize: 15,
    fontWeight: 700,
    color: "#fff",
    background: disabled ? "#CBD5E1" : bg,
    border: "none",
    borderRadius: 12,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "background 0.15s, transform 0.1s",
    textAlign: "left",
  };
}

export default function UpdatePanel({ status, onRun }) {
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState("info");
  const [busy, setBusy] = useState(false);

  const taskRunning = !!status?.background?.running;
  const disabled    = busy || taskRunning;

  const runIncremental = async () => {
    setMsg(null); setBusy(true);
    try {
      await onRun("/admin/update/run");
      setMsg("Инкрементальное обновление запущено. Следите за прогрессом в блоке «Состояние системы».");
      setMsgType("info");
    } catch (e) {
      setMsg(e.message || "Не удалось запустить обновление");
      setMsgType("error");
    } finally {
      setBusy(false);
    }
  };

  const runReindex = async () => {
    if (!confirm(
      "Полная переиндексация удалит все векторы и построит индекс заново.\n" +
      "Это займёт несколько минут. В это время чат-бот может отвечать некорректно.\n\n" +
      "Продолжить?"
    )) return;

    setMsg(null); setBusy(true);
    try {
      await onRun("/admin/reindex");
      setMsg("Полная переиндексация запущена. Это займёт несколько минут.");
      setMsgType("info");
    } catch (e) {
      setMsg(e.message || "Не удалось запустить переиндексацию");
      setMsgType("error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={cardStyle}>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, marginBottom: 8, color: "#0F172A" }}>
        Управление индексом
      </h2>
      <p style={{ color: "#64748B", marginTop: 0, marginBottom: 20, fontSize: 14, lineHeight: 1.55 }}>
        Индекс — база знаний чата. Инкрементальное обновление подтянет новые страницы сайта и документы.
        Полная переиндексация полностью пересобирает базу — используйте при серьёзных изменениях или повреждении индекса.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          type="button"
          disabled={disabled}
          onClick={runIncremental}
          style={actionBtn({ bg: "#1D4ED8", disabled })}
        >
          <div style={{ fontSize: 15, marginBottom: 4 }}>🔄 Обновить индекс</div>
          <div style={{ fontSize: 12, fontWeight: 500, opacity: 0.9 }}>
            Инкрементально — только новые и изменённые данные
          </div>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={runReindex}
          style={actionBtn({ bg: "#DC2626", disabled })}
        >
          <div style={{ fontSize: 15, marginBottom: 4 }}>⚠ Полная переиндексация</div>
          <div style={{ fontSize: 12, fontWeight: 500, opacity: 0.9 }}>
            Удалить всё и построить заново — несколько минут
          </div>
        </button>
      </div>

      {taskRunning && (
        <AlertBanner type="warning">
          Сейчас уже выполняется задача —{" "}
          {status.background.mode === "reindex" ? "полная переиндексация" : "инкрементальное обновление"}.
          Дождитесь её завершения перед запуском новой.
        </AlertBanner>
      )}

      {msg && <AlertBanner type={msgType}>{msg}</AlertBanner>}
    </div>
  );
}
