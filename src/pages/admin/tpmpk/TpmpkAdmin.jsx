import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../../../constants/index.js";

const statusLabels = {
  new: "Новая",
  confirmed: "Подтверждена",
  cancelled: "Отменена",
  done: "Выполнена",
};

const weekLabels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const emptyManual = {
  child_full_name: "",
  child_age: "7",
  parent_phone: "+7",
  is_repeat: false,
  needs_psychiatrist: false,
  date: todayIso(),
  start_time: "09:00",
};

function todayIso(offset = 0) {
  const value = new Date();
  value.setDate(value.getDate() + offset);
  return value.toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatTime(value) {
  return String(value || "").slice(0, 5) || "";
}

function roleName(user) {
  return typeof user?.role === "object" ? user.role?.role_name : user?.role;
}

async function fetchJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof data?.detail === "string" ? data.detail : "Ошибка запроса";
    throw new Error(message);
  }
  return data;
}

function normalizeDay(day) {
  return {
    ...day,
    open_time: formatTime(day.open_time) || "09:00",
    close_time: formatTime(day.close_time) || "17:00",
    lunch_start: formatTime(day.lunch_start) || "13:00",
    lunch_end: formatTime(day.lunch_end) || "14:00",
    slot_minutes: Number(day.slot_minutes || 30),
    note: day.note || "",
  };
}

function StatCard({ label, value, hint }) {
  return (
    <article className="ta-stat">
      <span>{label}</span>
      <strong>{value ?? "-"}</strong>
      {hint && <small>{hint}</small>}
    </article>
  );
}

function Field({ label, children }) {
  return (
    <label className="ta-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export default function TpmpkAdmin({ currentUser, onLogout }) {
  const isAdmin = roleName(currentUser) === "admin";
  const navItems = useMemo(() => [
    { key: "dashboard", label: "Дашборд" },
    { key: "day", label: "Расписание" },
    { key: "manual", label: "Запись со звонка" },
    { key: "appointments", label: "Все записи" },
    { key: "days", label: "Управление днями" },
    ...(isAdmin ? [
      { key: "template", label: "Шаблон недели" },
      { key: "transfer", label: "Перенос дня" },
    ] : []),
    { key: "audit", label: "Журнал" },
  ], [isAdmin]);

  const [activeView, setActiveView] = useState("dashboard");
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [dashboard, setDashboard] = useState(null);
  const [dayData, setDayData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [days, setDays] = useState([]);
  const [template, setTemplate] = useState([]);
  const [audit, setAudit] = useState([]);
  const [manual, setManual] = useState(emptyManual);
  const [transfer, setTransfer] = useState({ sourceDayId: "", target_date: todayIso(1), allow_partial: false });
  const [transferWarning, setTransferWarning] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [revealedPhones, setRevealedPhones] = useState({});
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [toast, setToast] = useState(null);

  const currentDateLabel = useMemo(() => new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date()), []);

  function showToast(type, text) {
    setToast({ type, text });
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => setToast(null), 4200);
  }

  async function loadData(view = activeView) {
    setLoading(true);
    try {
      if (view === "dashboard") setDashboard(await fetchJson(`/api/tpmpk/admin/dashboard/?date=${selectedDate}`));
      if (view === "day") setDayData(await fetchJson(`/api/tpmpk/admin/day/?date=${selectedDate}`));
      if (view === "appointments") setAppointments((await fetchJson("/api/tpmpk/admin/appointments/")).items || []);
      if (view === "days" || view === "transfer") {
        const data = await fetchJson("/api/tpmpk/admin/days/");
        const items = (data.items || []).map(normalizeDay);
        setDays(items);
        setTransfer((prev) => ({ ...prev, sourceDayId: prev.sourceDayId || String(items[0]?.id || "") }));
      }
      if (view === "template" && isAdmin) setTemplate((await fetchJson("/api/tpmpk/admin/template/")).items || []);
      if (view === "audit") setAudit((await fetchJson("/api/tpmpk/admin/audit/")).items || []);
    } catch (error) {
      showToast("error", error.message || "Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = "ТПМПК - личный кабинет";
  }, []);

  useEffect(() => {
    if (!navItems.some((item) => item.key === activeView)) setActiveView("dashboard");
  }, [activeView, navItems]);

  useEffect(() => {
    loadData(activeView);
  }, [activeView, selectedDate]);

  async function revealPhone(appointment) {
    try {
      const data = await fetchJson(`/api/tpmpk/admin/appointments/${appointment.id}/reveal-phone/`, { method: "POST" });
      setRevealedPhones((prev) => ({ ...prev, [appointment.id]: data.phone }));
      showToast("success", "Телефон раскрыт, действие записано в журнал");
    } catch (error) {
      showToast("error", error.message || "Не удалось раскрыть телефон");
    }
  }

  async function changeStatus(appointment, action) {
    try {
      await fetchJson(`/api/tpmpk/admin/appointments/${appointment.id}/${action}/`, { method: "POST" });
      setSelectedAppointment(null);
      showToast("success", action === "cancel" ? "Запись отменена" : "Запись отмечена выполненной");
      await loadData(activeView);
    } catch (error) {
      showToast("error", error.message || "Не удалось изменить запись");
    }
  }

  async function saveDay(day) {
    setSavingId(day.id);
    try {
      const updated = await fetchJson(`/api/tpmpk/admin/days/${day.id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          is_open: day.is_open,
          open_time: day.open_time,
          close_time: day.close_time,
          lunch_start: day.lunch_start,
          lunch_end: day.lunch_end,
          slot_minutes: Number(day.slot_minutes),
          note: day.note,
        }),
      });
      setDays((prev) => prev.map((item) => item.id === day.id ? normalizeDay(updated) : item));
      showToast("success", "День сохранен");
    } catch (error) {
      showToast("error", error.message || "Не удалось сохранить день");
    } finally {
      setSavingId(null);
    }
  }

  async function toggleDay(day) {
    setSavingId(day.id);
    try {
      const updated = await fetchJson(`/api/tpmpk/admin/days/${day.id}/toggle/`, { method: "POST" });
      setDays((prev) => prev.map((item) => item.id === day.id ? normalizeDay(updated) : item));
      showToast("success", updated.is_open ? "День открыт" : "День закрыт");
    } catch (error) {
      showToast("error", error.message || "Не удалось изменить статус дня");
    } finally {
      setSavingId(null);
    }
  }

  function updateDayField(id, field, value) {
    setDays((prev) => prev.map((day) => day.id === id ? { ...day, [field]: value } : day));
  }

  async function saveTemplate() {
    try {
      await fetchJson("/api/tpmpk/admin/template/", {
        method: "PUT",
        body: JSON.stringify({ items: template.map((item) => ({ ...item, slot_minutes: Number(item.slot_minutes) })) }),
      });
      showToast("success", "Шаблон недели сохранен");
      await loadData("template");
    } catch (error) {
      showToast("error", error.message || "Не удалось сохранить шаблон");
    }
  }

  async function applyTemplate() {
    try {
      const data = await fetchJson("/api/tpmpk/admin/template/apply/", { method: "POST" });
      showToast("success", `Шаблон применен к будущим дням: ${data.updated}`);
    } catch (error) {
      showToast("error", error.message || "Не удалось применить шаблон");
    }
  }

  async function createManualAppointment(event) {
    event.preventDefault();
    try {
      await fetchJson("/api/tpmpk/admin/manual-appointments/", {
        method: "POST",
        body: JSON.stringify({
          ...manual,
          child_age: Number(manual.child_age),
          start_time: `${manual.start_time}:00`,
        }),
      });
      setManual({ ...emptyManual, date: manual.date });
      showToast("success", "Запись со звонка добавлена в расписание");
      if (activeView === "day") await loadData("day");
    } catch (error) {
      showToast("error", error.message || "Не удалось добавить запись");
    }
  }

  async function transferDay(event) {
    event.preventDefault();
    setTransferWarning(null);
    try {
      const data = await fetchJson(`/api/tpmpk/admin/days/${transfer.sourceDayId}/transfer/`, {
        method: "POST",
        body: JSON.stringify({
          target_date: transfer.target_date,
          allow_partial: transfer.allow_partial,
        }),
      });
      if (data.status === "not_enough_slots") {
        setTransferWarning(data);
        showToast("error", `Свободных слотов не хватает: ${data.free_slots} из ${data.appointments}`);
        return;
      }
      showToast("success", `Перенесено записей: ${data.moved.length}`);
      await loadData("transfer");
    } catch (error) {
      showToast("error", error.message || "Не удалось перенести день");
    }
  }

  function renderDashboard() {
    const items = dashboard?.today_appointments || [];
    return (
      <>
        <div className="ta-grid stats">
          <StatCard label="Записей на дату" value={dashboard?.today_count ?? 0} hint={formatDate(selectedDate)} />
          <StatCard label="Ближайший слот" value={formatTime(dashboard?.nearest_slot) || "-"} hint="Свободное окно" />
          <StatCard label="Новых за сутки" value={dashboard?.new_24h ?? 0} hint="Создано за 24 часа" />
        </div>
        <section className="ta-card">
          <div className="ta-card-head">
            <h2>Ближайшие записи</h2>
            <button type="button" onClick={() => setActiveView("day")}>Открыть расписание</button>
          </div>
          <div className="ta-mini-list">
            {items.map((item) => (
              <button type="button" className="ta-mini" key={item.id} onClick={() => setSelectedAppointment(item)}>
                <span>{formatTime(item.start_time)}</span>
                <strong>{item.child_full_name}</strong>
                <small>{item.child_age} лет, {statusLabels[item.status] || item.status}</small>
              </button>
            ))}
          </div>
          {!items.length && <div className="ta-empty">На выбранную дату записей пока нет.</div>}
        </section>
      </>
    );
  }

  function renderDay() {
    const slots = dayData?.slots || [];
    return (
      <section className="ta-card">
        <div className="ta-datebar">
          <button type="button" onClick={() => setSelectedDate(todayIso())}>Сегодня</button>
          <button type="button" onClick={() => setSelectedDate(todayIso(1))}>Завтра</button>
          <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
        </div>
        {dayData?.day && (
          <div className="ta-day-summary">
            <strong>{dayData.day.is_open ? "День открыт" : "День закрыт"}</strong>
            <span>{formatTime(dayData.day.open_time)}-{formatTime(dayData.day.close_time)}, обед {formatTime(dayData.day.lunch_start)}-{formatTime(dayData.day.lunch_end)}, шаг {dayData.day.slot_minutes} мин.</span>
          </div>
        )}
        <div className="ta-slots">
          {slots.map((slot) => (
            <button
              type="button"
              className={`ta-slot ${slot.status}`}
              key={`${slot.working_day_id}-${slot.start_time}`}
              onClick={() => slot.appointment && setSelectedAppointment(slot.appointment)}
            >
              <span>{formatTime(slot.start_time)}</span>
              {slot.appointment ? (
                <>
                  <strong>{slot.appointment.child_full_name}</strong>
                  <small>{slot.appointment.child_age} лет, {statusLabels[slot.appointment.status]}</small>
                </>
              ) : (
                <>
                  <strong>Свободно</strong>
                  <small>Можно записать ребенка</small>
                </>
              )}
            </button>
          ))}
        </div>
        {!slots.length && <div className="ta-empty">Для этой даты нет доступных слотов.</div>}
      </section>
    );
  }

  function renderManual() {
    return (
      <section className="ta-card">
        <div className="ta-card-head"><h2>Ручное добавление записи</h2></div>
        <form className="ta-form" onSubmit={createManualAppointment}>
          <Field label="ФИО ребенка">
            <input value={manual.child_full_name} onChange={(event) => setManual({ ...manual, child_full_name: event.target.value })} required minLength={2} />
          </Field>
          <Field label="Возраст">
            <input type="number" min="0" max="18" value={manual.child_age} onChange={(event) => setManual({ ...manual, child_age: event.target.value })} required />
          </Field>
          <Field label="Телефон">
            <input value={manual.parent_phone} onChange={(event) => setManual({ ...manual, parent_phone: event.target.value })} required pattern="\+7\d{10}" />
          </Field>
          <Field label="Дата">
            <input type="date" value={manual.date} onChange={(event) => setManual({ ...manual, date: event.target.value })} required />
          </Field>
          <Field label="Время">
            <input type="time" value={manual.start_time} onChange={(event) => setManual({ ...manual, start_time: event.target.value })} required />
          </Field>
          <label className="ta-check"><input type="checkbox" checked={manual.is_repeat} onChange={(event) => setManual({ ...manual, is_repeat: event.target.checked })} /> Повторная комиссия</label>
          <label className="ta-check"><input type="checkbox" checked={manual.needs_psychiatrist} onChange={(event) => setManual({ ...manual, needs_psychiatrist: event.target.checked })} /> Нужен психиатр</label>
          <button className="ta-primary" type="submit">Добавить запись</button>
        </form>
      </section>
    );
  }

  function renderAppointments() {
    return (
      <section className="ta-card">
        <div className="ta-table appointments">
          <div className="ta-table-row head"><span>Дата</span><span>Время</span><span>Ребенок</span><span>Статус</span><span>Источник</span></div>
          {appointments.map((item) => (
            <button type="button" className="ta-table-row" key={item.id} onClick={() => setSelectedAppointment(item)}>
              <span>{formatDate(item.date)}</span>
              <span>{formatTime(item.start_time)}</span>
              <span>{item.child_full_name}</span>
              <span>{statusLabels[item.status] || item.status}</span>
              <span>{item.source === "phone" ? "Звонок" : "Сайт"}</span>
            </button>
          ))}
        </div>
        {!appointments.length && <div className="ta-empty">Записей пока нет.</div>}
      </section>
    );
  }

  function renderDays() {
    return (
      <section className="ta-card">
        <div className="ta-card-head"><h2>Ближайшие 60 дней</h2></div>
        <div className="ta-days-table">
          <div className="ta-days-row head">
            <span>Дата</span><span>Статус</span><span>Прием</span><span>Обед</span><span>Шаг</span><span>Действие</span>
          </div>
          {days.map((day) => (
            <div className="ta-days-row" key={day.id}>
              <strong>{formatDate(day.date)}</strong>
              <select value={day.is_open ? "open" : "closed"} onChange={(event) => updateDayField(day.id, "is_open", event.target.value === "open")} onBlur={() => saveDay(day)}>
                <option value="open">Открыт</option>
                <option value="closed">Закрыт</option>
              </select>
              <div className="ta-time-pair">
                <input type="time" value={day.open_time} onChange={(event) => updateDayField(day.id, "open_time", event.target.value)} onBlur={() => saveDay(day)} />
                <input type="time" value={day.close_time} onChange={(event) => updateDayField(day.id, "close_time", event.target.value)} onBlur={() => saveDay(day)} />
              </div>
              <div className="ta-time-pair">
                <input type="time" value={day.lunch_start} onChange={(event) => updateDayField(day.id, "lunch_start", event.target.value)} onBlur={() => saveDay(day)} />
                <input type="time" value={day.lunch_end} onChange={(event) => updateDayField(day.id, "lunch_end", event.target.value)} onBlur={() => saveDay(day)} />
              </div>
              <select value={day.slot_minutes} onChange={(event) => updateDayField(day.id, "slot_minutes", Number(event.target.value))} onBlur={() => saveDay(day)}>
                <option value={30}>30 мин</option>
                <option value={60}>60 мин</option>
              </select>
              <button type="button" onClick={() => toggleDay(day)} disabled={savingId === day.id}>
                {day.is_open ? "Закрыть день" : "Открыть день"}
              </button>
            </div>
          ))}
        </div>
        {!days.length && <div className="ta-empty">Рабочие дни еще не созданы.</div>}
      </section>
    );
  }

  function renderTemplate() {
    return (
      <section className="ta-card">
        <div className="ta-card-head">
          <h2>Шаблон недели</h2>
          <div className="ta-actions"><button type="button" onClick={saveTemplate}>Сохранить</button><button type="button" onClick={applyTemplate}>Применить к будущим дням</button></div>
        </div>
        <div className="ta-template-grid">
          {template.map((item) => (
            <article className="ta-template-cell" key={item.weekday}>
              <strong>{weekLabels[item.weekday]}</strong>
              <label className="ta-check"><input type="checkbox" checked={item.is_working_default} onChange={(event) => setTemplate((prev) => prev.map((row) => row.weekday === item.weekday ? { ...row, is_working_default: event.target.checked } : row))} /> Рабочий день</label>
              <div className="ta-time-pair">
                <input type="time" value={formatTime(item.open_time)} onChange={(event) => setTemplate((prev) => prev.map((row) => row.weekday === item.weekday ? { ...row, open_time: event.target.value } : row))} />
                <input type="time" value={formatTime(item.close_time)} onChange={(event) => setTemplate((prev) => prev.map((row) => row.weekday === item.weekday ? { ...row, close_time: event.target.value } : row))} />
              </div>
              <div className="ta-time-pair">
                <input type="time" value={formatTime(item.lunch_start)} onChange={(event) => setTemplate((prev) => prev.map((row) => row.weekday === item.weekday ? { ...row, lunch_start: event.target.value } : row))} />
                <input type="time" value={formatTime(item.lunch_end)} onChange={(event) => setTemplate((prev) => prev.map((row) => row.weekday === item.weekday ? { ...row, lunch_end: event.target.value } : row))} />
              </div>
              <select value={item.slot_minutes} onChange={(event) => setTemplate((prev) => prev.map((row) => row.weekday === item.weekday ? { ...row, slot_minutes: Number(event.target.value) } : row))}>
                <option value={30}>30 минут</option>
                <option value={60}>60 минут</option>
              </select>
            </article>
          ))}
        </div>
      </section>
    );
  }

  function renderTransfer() {
    return (
      <section className="ta-card">
        <div className="ta-card-head"><h2>Закрыть день и перенести записи</h2></div>
        <form className="ta-form transfer" onSubmit={transferDay}>
          <Field label="Исходный день">
            <select value={transfer.sourceDayId} onChange={(event) => setTransfer({ ...transfer, sourceDayId: event.target.value })}>
              {days.map((day) => <option key={day.id} value={day.id}>{formatDate(day.date)} - {day.is_open ? "открыт" : "закрыт"}</option>)}
            </select>
          </Field>
          <Field label="Новая дата">
            <input type="date" value={transfer.target_date} onChange={(event) => setTransfer({ ...transfer, target_date: event.target.value })} required />
          </Field>
          <label className="ta-check"><input type="checkbox" checked={transfer.allow_partial} onChange={(event) => setTransfer({ ...transfer, allow_partial: event.target.checked })} /> Перенести только часть записей, если слотов не хватит</label>
          {transferWarning && (
            <div className="ta-warning">
              Свободных слотов не хватает: можно перенести {transferWarning.can_move} из {transferWarning.appointments}. Включите частичный перенос, если это подходит.
            </div>
          )}
          <button className="ta-primary" type="submit">Закрыть день и перенести</button>
        </form>
      </section>
    );
  }

  function renderAudit() {
    return (
      <section className="ta-card">
        <div className="ta-table audit">
          <div className="ta-table-row head"><span>Время</span><span>Действие</span><span>Объект</span><span>ID</span></div>
          {audit.map((item) => (
            <div className="ta-table-row static" key={item.id}>
              <span>{item.created_at ? new Date(item.created_at).toLocaleString("ru-RU") : "-"}</span>
              <span>{item.action}</span>
              <span>{item.object_type}</span>
              <span>{item.object_id}</span>
            </div>
          ))}
        </div>
        {!audit.length && <div className="ta-empty">Журнал пока пуст.</div>}
      </section>
    );
  }

  function renderContent() {
    if (activeView === "dashboard") return renderDashboard();
    if (activeView === "day") return renderDay();
    if (activeView === "manual") return renderManual();
    if (activeView === "appointments") return renderAppointments();
    if (activeView === "days") return renderDays();
    if (activeView === "template" && isAdmin) return renderTemplate();
    if (activeView === "transfer" && isAdmin) return renderTransfer();
    return renderAudit();
  }

  return (
    <div className="ta-page">
      <style>{`
        .ta-page { min-height: 100vh; background: linear-gradient(180deg, #fbfdff 0%, #eef4fb 100%); color: #0f172a; }
        .ta-shell { display: grid; min-height: 100vh; }
        .ta-sidebar { background: #0f2f66; color: #fff; padding: 18px; display: grid; gap: 18px; align-content: start; }
        .ta-logo { display: grid; gap: 5px; padding-bottom: 12px; }
        .ta-logo strong { font-size: 19px; }
        .ta-logo span, .ta-userline { color: #dbeafe; font-size: 13px; font-weight: 800; }
        .ta-nav { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
        .ta-nav button, .ta-actions button, .ta-card-head button, .ta-datebar button, .ta-primary, .ta-days-row button, .ta-modal-actions button {
          min-height: 40px; border: 0; border-radius: 8px; background: #1e3a8a; color: #fff; padding: 0 13px; font-weight: 900; cursor: pointer; transition: transform .18s ease, box-shadow .18s ease, background .18s ease;
        }
        .ta-nav button { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.16); color: #dbeafe; }
        .ta-nav button.active { background: #fff; color: #1e3a8a; }
        button:hover { transform: translateY(-1px); }
        button:disabled { opacity: .62; cursor: wait; transform: none; }
        .ta-main { min-width: 0; padding: 18px; display: grid; gap: 18px; align-content: start; }
        .ta-header, .ta-stat, .ta-card { border: 1px solid #dbe6f5; border-radius: 8px; background: rgba(255,255,255,0.95); box-shadow: 0 18px 44px rgba(15,23,42,0.07); }
        .ta-header { padding: 18px; display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; align-items: center; }
        .ta-header h1 { font-size: clamp(26px, 5vw, 40px); line-height: 1.08; margin: 0 0 6px; }
        .ta-date, .ta-stat small, .ta-mini small, .ta-day-summary span { color: #64748b; font-weight: 750; }
        .ta-logout { min-height: 40px; border: 1px solid #d7e2f2; border-radius: 8px; background: #fff; color: #1e3a8a; padding: 0 14px; font-weight: 900; cursor: pointer; }
        .ta-grid.stats, .ta-mini-list, .ta-slots, .ta-form, .ta-template-grid { display: grid; gap: 12px; }
        .ta-stat { padding: 18px; display: grid; gap: 8px; }
        .ta-stat span, .ta-table-row.head, .ta-days-row.head, .ta-mini span, .ta-slot span, .ta-field span, .ta-detail-grid span { color: #64748b; font-size: 12px; font-weight: 950; text-transform: uppercase; }
        .ta-stat strong { color: #0f172a; font-size: 34px; line-height: 1; }
        .ta-card { padding: 18px; overflow: hidden; }
        .ta-card-head, .ta-datebar, .ta-actions { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; }
        .ta-card-head h2 { font-size: 22px; margin: 0; }
        input, select { min-height: 38px; width: 100%; border: 1px solid #d7e2f2; border-radius: 8px; background: #fff; padding: 0 10px; color: #0f172a; font: inherit; font-weight: 750; }
        input:focus, select:focus, button:focus-visible { outline: 3px solid rgba(124, 58, 237, .18); border-color: #7c3aed; }
        .ta-field { display: grid; gap: 7px; }
        .ta-check { display: flex; align-items: center; gap: 9px; color: #334155; font-weight: 850; }
        .ta-check input { width: 18px; min-height: 18px; }
        .ta-primary { width: fit-content; padding-inline: 18px; }
        .ta-mini, .ta-slot, .ta-table-row, .ta-days-row, .ta-template-cell, .ta-day-summary { border: 1px solid #dbe6f5; border-radius: 8px; background: #fff; padding: 13px; text-align: left; }
        .ta-mini, .ta-slot, .ta-table-row:not(.head):not(.static) { cursor: pointer; }
        .ta-mini:hover, .ta-slot:hover, .ta-table-row:not(.head):not(.static):hover, .ta-days-row:hover, .ta-template-cell:hover { border-color: #bfdbfe; box-shadow: 0 14px 30px rgba(30,58,138,.08); }
        .ta-slot.free { border-style: dashed; background: #f8fbff; }
        .ta-slot.occupied { border-color: #bfdbfe; box-shadow: inset 4px 0 0 #1e3a8a; }
        .ta-table, .ta-days-table { display: grid; gap: 8px; overflow-x: auto; }
        .ta-table-row { width: 100%; display: grid; grid-template-columns: 1fr; gap: 6px; color: #0f172a; font: inherit; }
        .ta-days-row { min-width: 960px; display: grid; grid-template-columns: 1.3fr .9fr 1.4fr 1.4fr .8fr 1fr; gap: 10px; align-items: center; }
        .ta-days-row.head, .ta-table-row.head { background: #f8fbff; }
        .ta-time-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .ta-template-cell { display: grid; gap: 10px; background: #f8fbff; }
        .ta-empty, .ta-loading, .ta-warning { border-radius: 8px; padding: 14px; font-weight: 850; line-height: 1.45; margin-top: 10px; }
        .ta-empty, .ta-loading { color: #475569; background: #f8fbff; border: 1px solid #dbe6f5; }
        .ta-warning { color: #8a4b0f; background: #fffbeb; border: 1px solid #fde68a; }
        .ta-toast { position: fixed; right: 18px; top: 18px; z-index: 700; max-width: min(420px, calc(100vw - 36px)); border-radius: 8px; padding: 14px 16px; font-weight: 900; box-shadow: 0 18px 50px rgba(15,23,42,.18); }
        .ta-toast.success { color: #065f46; background: #ecfdf5; border: 1px solid #bbf7d0; }
        .ta-toast.error { color: #9a3412; background: #fff7ed; border: 1px solid #fed7aa; }
        .ta-modal-backdrop { position: fixed; inset: 0; z-index: 600; background: rgba(15, 23, 42, 0.42); padding: 18px; display: grid; place-items: center; }
        .ta-modal { width: min(720px, 100%); max-height: calc(100vh - 36px); overflow: auto; border-radius: 8px; background: #fff; box-shadow: 0 30px 90px rgba(15,23,42,0.25); padding: 20px; display: grid; gap: 16px; }
        .ta-modal-head { display: flex; justify-content: space-between; gap: 12px; align-items: start; }
        .ta-modal-head h2 { margin: 0; }
        .ta-close { width: 38px; height: 38px; border: 1px solid #d7e2f2; border-radius: 8px; background: #fff; cursor: pointer; font-weight: 950; }
        .ta-detail-grid { display: grid; gap: 10px; }
        .ta-detail-grid div { border: 1px solid #dbe6f5; border-radius: 8px; background: #f8fbff; padding: 12px; display: grid; gap: 3px; }
        .ta-modal-actions { display: grid; gap: 10px; }
        .ta-modal-actions button.warn { background: #b91c1c; }
        .ta-modal-actions button.secondary { background: #eef4fb; color: #1e3a8a; border: 1px solid #d7e2f2; }
        @media (min-width: 780px) {
          .ta-shell { grid-template-columns: 280px minmax(0, 1fr); }
          .ta-sidebar { min-height: 100vh; position: sticky; top: 0; }
          .ta-nav { display: grid; overflow: visible; }
          .ta-main { padding: 28px; }
          .ta-grid.stats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .ta-slots { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .ta-table-row.appointments, .ta-table-row { grid-template-columns: 1fr .7fr 1.5fr .9fr .8fr; align-items: center; }
          .ta-table.audit .ta-table-row { grid-template-columns: 1.3fr 1fr 1fr .5fr; }
          .ta-detail-grid, .ta-template-grid, .ta-form { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .ta-form .ta-primary, .ta-form .ta-warning { grid-column: 1 / -1; }
          .ta-modal-actions { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
      `}</style>

      {toast && <div className={`ta-toast ${toast.type}`} role="status">{toast.text}</div>}

      <div className="ta-shell">
        <aside className="ta-sidebar">
          <div className="ta-logo">
            <strong>ТПМПК</strong>
            <span>Личный кабинет</span>
          </div>
          <nav className="ta-nav" aria-label="Навигация кабинета ТПМПК">
            {navItems.map((item) => (
              <button type="button" key={item.key} className={activeView === item.key ? "active" : ""} onClick={() => setActiveView(item.key)}>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="ta-userline">{isAdmin ? "Администратор" : "Оператор"}: {currentUser?.firstName || currentUser?.email || "ТПМПК"}</div>
        </aside>

        <main className="ta-main">
          <header className="ta-header">
            <div>
              <h1>ТПМПК - личный кабинет</h1>
              <div className="ta-date">{currentDateLabel}</div>
            </div>
            <button type="button" className="ta-logout" onClick={onLogout}>Выйти</button>
          </header>

          {loading ? <div className="ta-loading">Загружаем данные...</div> : renderContent()}
        </main>
      </div>

      {selectedAppointment && (
        <div className="ta-modal-backdrop" onClick={() => setSelectedAppointment(null)}>
          <section className="ta-modal" onClick={(event) => event.stopPropagation()}>
            <div className="ta-modal-head">
              <div>
                <p className="ta-date">Карточка записи #{selectedAppointment.id}</p>
                <h2>{selectedAppointment.child_full_name}</h2>
              </div>
              <button type="button" className="ta-close" onClick={() => setSelectedAppointment(null)}>x</button>
            </div>
            <div className="ta-detail-grid">
              <div><span>Дата и время</span><strong>{formatDate(selectedAppointment.date)}, {formatTime(selectedAppointment.start_time)}</strong></div>
              <div><span>Возраст</span><strong>{selectedAppointment.child_age} лет</strong></div>
              <div><span>Статус</span><strong>{statusLabels[selectedAppointment.status] || selectedAppointment.status}</strong></div>
              <div><span>Источник</span><strong>{selectedAppointment.source === "phone" ? "Звонок" : "Сайт"}</strong></div>
              <div><span>Повторная комиссия</span><strong>{selectedAppointment.is_repeat ? "Да" : "Нет"}</strong></div>
              <div><span>Психиатр</span><strong>{selectedAppointment.needs_psychiatrist ? "Нужен" : "Не указан"}</strong></div>
              <div><span>Телефон</span><strong>{revealedPhones[selectedAppointment.id] || "Скрыт"}</strong></div>
            </div>
            <div className="ta-modal-actions">
              <button type="button" onClick={() => revealPhone(selectedAppointment)}>Раскрыть телефон</button>
              <button type="button" className="secondary" onClick={() => changeStatus(selectedAppointment, "done")}>Выполнена</button>
              <button type="button" className="warn" onClick={() => changeStatus(selectedAppointment, "cancel")}>Отменить</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
