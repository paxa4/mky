import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE } from "../../constants/index.js";
import { DEFAULT_ROLE_PERMISSIONS, getRoleLabel } from "../../auth.js";
import { authHeaders } from "../../utils/authHeaders.js";

const emptyForm = {
  id: null,
  email: "",
  username: "",
  password: "",
  role: "user",
};

const ROLE_ORDER = ["admin", "methodist", "metodist_editor", "operator", "tpmpk_admin", "tpmpk_operator", "domu_editor", "user"];

const ROLE_META = {
  admin: { accent: "#0b3fb3", description: "Полный административный доступ" },
  methodist: { accent: "#1647ad", description: "Материалы портала и наградная продукция" },
  metodist_editor: { accent: "#1647ad", description: "Материалы портала и наградная продукция" },
  operator: { accent: "#6d5dfc", description: "Работа с расписанием и заявками ТПМПК" },
  tpmpk_admin: { accent: "#6d5dfc", description: "Администрирование раздела ТПМПК" },
  tpmpk_operator: { accent: "#6d5dfc", description: "Оператор раздела ТПМПК" },
  domu_editor: { accent: "#0f766e", description: "Публикации раздела «Дом учителя»" },
  user: { accent: "#64748b", description: "Базовая роль пользователя" },
};

const MODULE_DEFINITIONS = [
  { key: "articles", label: "Статьи", description: "Материалы публичных разделов" },
  { key: "certificates", label: "Генерация грамот", description: "Одиночный и групповой выпуск PDF" },
  { key: "certificate_templates", label: "Шаблоны грамот", description: "Конструктор шаблонов и подписантов" },
  { key: "users_roles", label: "Пользователи и роли", description: "Учётные записи и права доступа" },
  { key: "tpmpk", label: "Кабинет ТПМПК", description: "Расписание, слоты и записи" },
  { key: "audit_log", label: "Журнал действий", description: "Просмотр действий пользователей" },
  { key: "portal_settings", label: "Настройки портала", description: "Административные параметры системы" },
];

const PERMISSION_OPTIONS = [
  { value: "none", label: "Запрещено", short: "Нет" },
  { value: "view", label: "Только просмотр", short: "Просмотр" },
  { value: "edit", label: "Редактирование", short: "Правка" },
];

function normalizeRoleName(value) {
  const role = typeof value?.role === "object" ? value.role?.role_name : value?.role || value;
  return String(role || "user").trim().toLowerCase() || "user";
}

function roleDetails(roleName) {
  return ROLE_META[roleName] || {
    accent: "#475569",
    description: "Роль из backend-справочника",
  };
}

function normalizePermissions(roleName, permissions) {
  const defaults = DEFAULT_ROLE_PERMISSIONS[roleName] || DEFAULT_ROLE_PERMISSIONS.user;
  const explicit = permissions && typeof permissions === "object" ? permissions : {};
  return MODULE_DEFINITIONS.reduce((result, module) => {
    const level = String(explicit[module.key] || defaults[module.key] || "none").toLowerCase();
    result[module.key] = PERMISSION_OPTIONS.some((option) => option.value === level) ? level : "none";
    return result;
  }, {});
}

function permissionsKey(permissions) {
  return MODULE_DEFINITIONS.map((module) => `${module.key}:${permissions[module.key] || "none"}`).join("|");
}

function sortRoles(roles) {
  return [...roles].sort((left, right) => {
    const leftIndex = ROLE_ORDER.indexOf(left.role_name);
    const rightIndex = ROLE_ORDER.indexOf(right.role_name);
    if (leftIndex !== -1 || rightIndex !== -1) {
      return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex);
    }
    return String(left.role_name).localeCompare(String(right.role_name), "ru");
  });
}

function roleName(user) {
  return normalizeRoleName(user);
}

function initials(user) {
  const source = user?.username || user?.email || "?";
  const parts = String(source).replace(/@.+$/, "").split(/[._\s-]+/).filter(Boolean);
  if (parts.length > 1) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return String(source).slice(0, 2).toUpperCase();
}

function userDisplayName(user) {
  return user?.username || user?.email || `Пользователь #${user?.id || ""}`;
}

function accessSummary(permissions) {
  const enabled = MODULE_DEFINITIONS
    .filter((module) => permissions[module.key] !== "none")
    .map((module) => {
      const suffix = permissions[module.key] === "view" ? "просмотр" : "правка";
      return `${module.label} (${suffix})`;
    });
  return enabled.length ? enabled.join(", ") : "Нет доступных разделов";
}

function permissionClass(level) {
  if (level === "edit") return "edit";
  if (level === "view") return "view";
  return "none";
}

function permissionLabel(level) {
  return PERMISSION_OPTIONS.find((option) => option.value === level)?.label || "Запрещено";
}

async function errorMessage(response, fallback) {
  const data = await response.json().catch(() => null);
  if (typeof data?.detail === "string") return data.detail;
  if (Array.isArray(data?.detail)) {
    return data.detail.map((item) => item?.msg || String(item)).join("; ");
  }
  return fallback;
}

export default function UsersRolesModule({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState("admin");
  const [permissionDraft, setPermissionDraft] = useState(() => normalizePermissions("admin"));
  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isAdmin = roleName(currentUser) === "admin";
  const sortedUsers = useMemo(
    () => [...users].sort((left, right) => Number(left.id) - Number(right.id)),
    [users],
  );
  const sortedRoles = useMemo(() => sortRoles(roles), [roles]);
  const selectedRoleData = useMemo(
    () => sortedRoles.find((role) => role.role_name === selectedRole) || null,
    [selectedRole, sortedRoles],
  );
  const selectedRolePermissions = useMemo(
    () => normalizePermissions(selectedRole, selectedRoleData?.permissions),
    [selectedRole, selectedRoleData],
  );
  const savedPermissionsKey = useMemo(() => permissionsKey(selectedRolePermissions), [selectedRolePermissions]);
  const draftPermissionsKey = useMemo(() => permissionsKey(permissionDraft), [permissionDraft]);
  const permissionsDirty = savedPermissionsKey !== draftPermissionsKey;
  const selectedRoleDetails = roleDetails(selectedRole);
  const selectedRoleUsers = users.filter((user) => roleName(user) === selectedRole).length;

  const permissionsForRole = useCallback(
    (roleNameValue) => {
      const normalizedRole = normalizeRoleName(roleNameValue);
      const role = roles.find((item) => item.role_name === normalizedRole);
      return normalizePermissions(normalizedRole, role?.permissions);
    },
    [roles],
  );

  const loadData = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError("");
    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        fetch(`${API_BASE}/users/`, { headers: authHeaders() }),
        fetch(`${API_BASE}/users/roles/`, { headers: authHeaders() }),
      ]);
      if (!usersResponse.ok) {
        throw new Error(await errorMessage(usersResponse, "Не удалось загрузить пользователей"));
      }
      if (!rolesResponse.ok) {
        throw new Error(await errorMessage(rolesResponse, "Не удалось загрузить роли"));
      }

      const loadedUsers = await usersResponse.json();
      const loadedRoles = await rolesResponse.json();
      const normalizedRoles = Array.isArray(loadedRoles) ? loadedRoles : [];
      setUsers(Array.isArray(loadedUsers) ? loadedUsers : []);
      setRoles(normalizedRoles);
      setSelectedRole((prev) => {
        if (normalizedRoles.some((role) => role.role_name === prev)) return prev;
        return sortRoles(normalizedRoles)[0]?.role_name || "user";
      });
    } catch (err) {
      setError(err.message || "Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPermissionDraft(selectedRolePermissions);
  }, [selectedRole, selectedRolePermissions]);

  function pushActivity(action, subject, section = "Пользователи") {
    const now = new Date();
    setActivityLog((prev) => [
      {
        id: `${now.getTime()}-${subject?.id || section}`,
        time: now.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
        user: subject?.displayName || userDisplayName(subject),
        action,
        section,
        status: "Успешно",
      },
      ...prev,
    ].slice(0, 5));
  }

  function updateForm(field, value) {
    setError("");
    setSuccess("");
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updatePermission(moduleKey, level) {
    setError("");
    setSuccess("");
    setPermissionDraft((prev) => ({ ...prev, [moduleKey]: level }));
  }

  function startCreate() {
    setForm({ ...emptyForm, role: selectedRole || sortedRoles[0]?.role_name || "user" });
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function editUser(user) {
    const userRole = roleName(user);
    setSelectedRole(userRole);
    setForm({
      id: user.id,
      email: user.email || "",
      username: user.username || "",
      password: "",
      role: userRole,
    });
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function resetForm() {
    setForm(emptyForm);
    setShowForm(false);
    setError("");
    setSuccess("");
  }

  async function saveUser(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const isEdit = Boolean(form.id);
      const payload = isEdit
        ? { role: form.role }
        : {
            email: form.email.trim(),
            username: form.username.trim() || undefined,
            password: form.password.trim(),
            role: form.role,
            is_active: true,
          };

      if (!isEdit && !payload.password) {
        throw new Error("Для нового пользователя укажите пароль");
      }

      const response = await fetch(`${API_BASE}/users/${isEdit ? `${form.id}` : ""}`, {
        method: isEdit ? "PUT" : "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(await errorMessage(response, "Не удалось сохранить пользователя"));
      }

      const savedUser = await response.json();
      setSuccess(isEdit ? "Роль пользователя обновлена" : "Пользователь создан");
      pushActivity(isEdit ? "Изменение роли пользователя" : "Создание пользователя", savedUser);
      setSelectedRole(roleName(savedUser));
      setForm(emptyForm);
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(err.message || "Не удалось сохранить пользователя");
    } finally {
      setSaving(false);
    }
  }

  async function saveRolePermissions() {
    if (!selectedRoleData) return;
    setSavingPermissions(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`${API_BASE}/users/roles/${selectedRoleData.id}/permissions/`, {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ permissions: permissionDraft }),
      });
      if (!response.ok) {
        throw new Error(await errorMessage(response, "Не удалось сохранить права роли"));
      }
      const updatedRole = await response.json();
      setRoles((prev) => prev.map((role) => (role.id === updatedRole.id ? updatedRole : role)));
      setSuccess("Права роли сохранены");
      pushActivity("Изменение прав роли", { id: updatedRole.id, displayName: getRoleLabel(updatedRole.role_name) }, "Роли");
    } catch (err) {
      setError(err.message || "Не удалось сохранить права роли");
    } finally {
      setSavingPermissions(false);
    }
  }

  if (!isAdmin) {
    return (
      <section style={{ padding: 24, border: "1px solid #FED7AA", borderRadius: 8, background: "#FFF7ED", color: "#9A3412", fontWeight: 700 }}>
        Раздел доступен только администратору.
      </section>
    );
  }

  return (
    <section className="ur-admin">
      <style>{`
        @keyframes urFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ur-admin {
          --ur-blue: #0b3fb3;
          --ur-blue-dark: #082f8f;
          --ur-blue-soft: #eef5ff;
          --ur-border: #dbe7ff;
          --ur-line: #e8eef8;
          --ur-muted: #5b6577;
          --ur-ink: #132033;
          color: var(--ur-ink);
          margin: -8px 0 0;
          min-width: 0;
        }
        .ur-admin * {
          box-sizing: border-box;
          letter-spacing: 0;
        }
        .ur-page-head {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          align-items: flex-start;
          margin-bottom: 18px;
          animation: urFadeIn 0.24s ease both;
        }
        .ur-page-head h2 {
          margin: 0 0 6px;
          font-size: 28px;
          line-height: 1.08;
          font-weight: 900;
        }
        .ur-page-head p {
          margin: 0;
          color: var(--ur-muted);
          font-size: 15px;
          font-weight: 650;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }
        .ur-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(320px, 370px);
          gap: 16px;
          align-items: start;
        }
        .ur-card {
          overflow: hidden;
          border: 1px solid var(--ur-border);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.97);
          box-shadow: 0 18px 48px rgba(25, 78, 160, 0.08);
          animation: urFadeIn 0.26s ease both;
        }
        .ur-card-head {
          min-height: 64px;
          padding: 15px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border-bottom: 1px solid var(--ur-line);
        }
        .ur-card-head h3 {
          margin: 0;
          font-size: 18px;
          line-height: 1.2;
          font-weight: 900;
          overflow-wrap: anywhere;
        }
        .ur-button,
        .ur-action-link,
        .ur-role-button,
        .ur-segment-button {
          font-family: inherit;
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease, color 0.18s ease;
        }
        .ur-button {
          min-height: 40px;
          border-radius: 8px;
          border: 1px solid transparent;
          padding: 0 15px;
          cursor: pointer;
          font-size: 13px;
          line-height: 1.1;
          font-weight: 850;
          white-space: normal;
        }
        .ur-button.primary {
          color: #fff;
          background: linear-gradient(180deg, #0f4cd4 0%, var(--ur-blue) 100%);
          box-shadow: 0 12px 24px rgba(11, 63, 179, 0.22);
        }
        .ur-button.secondary {
          color: var(--ur-blue);
          background: #f7faff;
          border-color: #cddcff;
        }
        .ur-button.ghost {
          color: #475569;
          background: #fff;
          border-color: #dbe3f0;
        }
        .ur-button:hover:not(:disabled),
        .ur-action-link:hover:not(:disabled),
        .ur-role-button:hover:not(:disabled) {
          transform: translateY(-1px);
        }
        .ur-button.primary:hover:not(:disabled) {
          background: linear-gradient(180deg, #1554e6 0%, var(--ur-blue-dark) 100%);
          box-shadow: 0 15px 28px rgba(11, 63, 179, 0.27);
        }
        .ur-button:disabled,
        .ur-action-link:disabled,
        .ur-segment-button:disabled {
          opacity: 0.58;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        .ur-refresh {
          flex: 0 0 auto;
        }
        .ur-alert {
          margin-bottom: 14px;
          border-radius: 8px;
          padding: 12px 14px;
          font-weight: 750;
          line-height: 1.45;
          overflow-wrap: anywhere;
          animation: urFadeIn 0.2s ease both;
        }
        .ur-alert.error { background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412; }
        .ur-alert.success { background: #ecfdf5; border: 1px solid #bbf7d0; color: #047857; }
        .ur-table-wrap {
          min-height: 420px;
          overflow-x: auto;
        }
        .ur-table {
          width: 100%;
          min-width: 880px;
          border-collapse: collapse;
          font-size: 13px;
        }
        .ur-table th {
          padding: 14px 16px;
          color: #4f5667;
          background: #f5f7fb;
          text-align: left;
          font-size: 11px;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .ur-table td {
          padding: 14px 16px;
          border-top: 1px solid var(--ur-line);
          color: #172033;
          font-weight: 700;
          vertical-align: middle;
          min-width: 0;
        }
        .ur-table tr {
          transition: background 0.16s ease;
        }
        .ur-table tbody tr:hover {
          background: #f9fbff;
        }
        .ur-access-cell {
          max-width: 260px;
          color: #475569;
          font-size: 12px;
          font-weight: 680;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }
        .ur-user-cell {
          display: grid;
          grid-template-columns: 32px minmax(0, 1fr);
          gap: 10px;
          align-items: center;
          min-width: 0;
        }
        .ur-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: #fff;
          background: var(--role-accent, var(--ur-blue));
          font-size: 11px;
          font-weight: 900;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.16);
        }
        .ur-name {
          display: block;
          max-width: 170px;
          line-height: 1.25;
          overflow-wrap: anywhere;
        }
        .ur-email {
          display: inline-block;
          max-width: 180px;
          color: #5e6678;
          font-size: 12px;
          font-weight: 650;
          overflow-wrap: anywhere;
        }
        .ur-role-pill,
        .ur-status,
        .ur-level-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 24px;
          border-radius: 999px;
          padding: 0 9px;
          font-size: 11px;
          font-weight: 900;
          line-height: 1.1;
          white-space: nowrap;
        }
        .ur-role-pill {
          color: var(--role-accent, var(--ur-blue));
          background: #f1f6ff;
          border: 1px solid #dbe7ff;
        }
        .ur-status.active { color: #07883c; background: #dcfce7; }
        .ur-status.inactive { color: #657080; background: #edf2f7; }
        .ur-level-pill.edit { color: #047857; background: #dcfce7; }
        .ur-level-pill.view { color: #1d4ed8; background: #dbeafe; }
        .ur-level-pill.none { color: #6b7280; background: #eef2f7; }
        .ur-row-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .ur-action-link {
          min-height: 32px;
          border: 1px solid #d8e3f8;
          border-radius: 8px;
          padding: 0 10px;
          cursor: pointer;
          color: var(--ur-blue);
          background: #f8fbff;
          font-size: 12px;
          font-weight: 850;
        }
        .ur-side {
          display: grid;
          gap: 16px;
          min-width: 0;
        }
        .ur-role-list {
          padding: 12px 14px 14px;
          display: grid;
          gap: 8px;
        }
        .ur-role-button {
          min-height: 52px;
          width: 100%;
          border: 1px solid var(--ur-line);
          border-radius: 8px;
          padding: 9px 11px;
          background: #fff;
          color: #172033;
          cursor: pointer;
          text-align: left;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 10px;
          align-items: center;
        }
        .ur-role-button.active {
          border-color: var(--role-accent, var(--ur-blue));
          box-shadow: inset 0 0 0 1px var(--role-accent, var(--ur-blue)), 0 12px 26px rgba(11, 63, 179, 0.1);
          color: var(--role-accent, var(--ur-blue));
          background: #f7faff;
        }
        .ur-role-title {
          display: block;
          font-size: 14px;
          font-weight: 900;
          line-height: 1.2;
          overflow-wrap: anywhere;
        }
        .ur-role-subtitle {
          display: block;
          margin-top: 3px;
          color: #64748b;
          font-size: 11px;
          line-height: 1.25;
          font-weight: 650;
          overflow-wrap: anywhere;
        }
        .ur-role-count {
          min-width: 26px;
          height: 26px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: #eef3ff;
          color: var(--role-accent, var(--ur-blue));
          font-size: 11px;
          font-weight: 900;
        }
        .ur-label {
          color: #5e6678;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
        }
        .ur-input,
        .ur-select {
          width: 100%;
          min-height: 42px;
          border: 1px solid #cdd7e8;
          border-radius: 8px;
          padding: 0 12px;
          color: #172033;
          background: #fff;
          font: 760 14px/1.2 inherit;
          min-width: 0;
        }
        .ur-input:focus,
        .ur-select:focus,
        .ur-action-link:focus,
        .ur-button:focus,
        .ur-role-button:focus,
        .ur-segment-button:focus {
          outline: 0;
          border-color: var(--ur-blue);
          box-shadow: 0 0 0 3px rgba(11, 63, 179, 0.12);
        }
        .ur-permissions {
          padding: 4px 14px 14px;
          display: grid;
          gap: 10px;
        }
        .ur-role-meta {
          color: #596374;
          font-size: 13px;
          font-weight: 650;
          line-height: 1.45;
          margin: 0 0 2px;
          overflow-wrap: anywhere;
        }
        .ur-role-meta strong { color: var(--ur-blue); }
        .ur-permission-row {
          border: 1px solid #edf2fb;
          border-radius: 8px;
          padding: 11px;
          display: grid;
          gap: 10px;
          background: #f8fafc;
        }
        .ur-permission-copy {
          min-width: 0;
        }
        .ur-permission-copy strong {
          display: block;
          color: #243044;
          font-size: 13px;
          line-height: 1.25;
          font-weight: 900;
          overflow-wrap: anywhere;
        }
        .ur-permission-copy span {
          display: block;
          margin-top: 3px;
          color: #64748b;
          font-size: 12px;
          line-height: 1.35;
          font-weight: 650;
          overflow-wrap: anywhere;
        }
        .ur-segmented {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 4px;
          padding: 4px;
          border-radius: 8px;
          background: #eaf0fb;
        }
        .ur-segment-button {
          min-height: 32px;
          border: 1px solid transparent;
          border-radius: 6px;
          background: transparent;
          color: #526074;
          cursor: pointer;
          font-size: 11px;
          font-weight: 900;
          line-height: 1.1;
          padding: 0 6px;
          overflow-wrap: anywhere;
        }
        .ur-segment-button.active {
          background: #fff;
          color: var(--ur-blue);
          border-color: #dbe7ff;
          box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
        }
        .ur-segment-button.active.none { color: #6b7280; }
        .ur-segment-button.active.view { color: #1d4ed8; }
        .ur-segment-button.active.edit { color: #047857; }
        .ur-permission-footer {
          padding: 0 14px 14px;
          display: grid;
          gap: 8px;
        }
        .ur-permission-state {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          color: #64748b;
          font-size: 12px;
          font-weight: 750;
          min-width: 0;
        }
        .ur-form-card {
          margin-top: 16px;
        }
        .ur-user-form {
          padding: 16px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .ur-field {
          display: grid;
          gap: 6px;
          min-width: 0;
        }
        .ur-field.full { grid-column: 1 / -1; }
        .ur-readonly-user {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          padding: 12px;
          border: 1px solid #e2eaf7;
          border-radius: 8px;
          background: #f8fbff;
        }
        .ur-readonly-item {
          min-width: 0;
        }
        .ur-readonly-item span {
          display: block;
          margin-bottom: 4px;
          color: #64748b;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
        }
        .ur-readonly-item strong {
          display: block;
          color: #172033;
          font-size: 13px;
          line-height: 1.35;
          font-weight: 850;
          overflow-wrap: anywhere;
        }
        .ur-form-actions {
          grid-column: 1 / -1;
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          flex-wrap: wrap;
        }
        .ur-activity {
          margin-top: 16px;
        }
        .ur-activity-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .ur-activity-table th,
        .ur-activity-table td {
          padding: 11px 16px;
          border-top: 1px solid var(--ur-line);
          text-align: left;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }
        .ur-activity-table th {
          color: #5b6575;
          font-size: 11px;
          text-transform: uppercase;
          background: #fff;
        }
        .ur-empty {
          padding: 18px 16px;
          color: #64748b;
          font-weight: 700;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }
        @media (max-width: 1180px) {
          .ur-layout { grid-template-columns: 1fr; }
          .ur-side { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 760px) {
          .ur-page-head { display: grid; }
          .ur-refresh { width: 100%; }
          .ur-side { grid-template-columns: 1fr; }
          .ur-user-form { grid-template-columns: 1fr; }
          .ur-readonly-user { grid-template-columns: 1fr; }
          .ur-card-head { align-items: stretch; flex-direction: column; }
          .ur-card-head .ur-button { width: 100%; }
        }
      `}</style>

      <div className="ur-page-head">
        <div>
          <h2>Пользователи и роли</h2>
          <p>Управление учётными записями сотрудников и правами доступа к разделам системы</p>
        </div>
        <button type="button" className="ur-button secondary ur-refresh" onClick={loadData} disabled={loading}>
          {loading ? "Обновление..." : "Обновить данные"}
        </button>
      </div>

      {error && <div className="ur-alert error">{error}</div>}
      {success && <div className="ur-alert success">{success}</div>}

      <div className="ur-layout">
        <div>
          <div className="ur-card">
            <div className="ur-card-head">
              <h3>Пользователи системы</h3>
              <button type="button" className="ur-button primary" onClick={startCreate}>
                + Добавить пользователя
              </button>
            </div>
            <div className="ur-table-wrap">
              <table className="ur-table">
                <thead>
                  <tr>
                    <th>Пользователь</th>
                    <th>Email</th>
                    <th>Роль</th>
                    <th>Доступные разделы</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.map((user) => {
                    const currentRole = roleName(user);
                    const details = roleDetails(currentRole);
                    const permissions = permissionsForRole(currentRole);
                    return (
                      <tr key={user.id}>
                        <td>
                          <div className="ur-user-cell" style={{ "--role-accent": details.accent }}>
                            <span className="ur-avatar">{initials(user)}</span>
                            <strong className="ur-name">{userDisplayName(user)}</strong>
                          </div>
                        </td>
                        <td><span className="ur-email">{user.email}</span></td>
                        <td>
                          <span className="ur-role-pill" style={{ "--role-accent": details.accent }}>
                            {getRoleLabel(currentRole)}
                          </span>
                        </td>
                        <td><div className="ur-access-cell">{accessSummary(permissions)}</div></td>
                        <td>
                          <span className={`ur-status ${user.is_active === false ? "inactive" : "active"}`}>
                            {user.is_active === false ? "Неактивен" : "Активен"}
                          </span>
                        </td>
                        <td>
                          <div className="ur-row-actions">
                            <button type="button" className="ur-action-link" onClick={() => editUser(user)}>
                              Изменить роль
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && sortedUsers.length === 0 && (
                    <tr>
                      <td colSpan="6"><div className="ur-empty">Пользователи не найдены.</div></td>
                    </tr>
                  )}
                  {loading && (
                    <tr>
                      <td colSpan="6"><div className="ur-empty">Загрузка пользователей...</div></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {showForm && (
            <div className="ur-card ur-form-card">
              <div className="ur-card-head">
                <h3>{form.id ? "Изменение роли пользователя" : "Новый пользователь"}</h3>
                <button type="button" className="ur-button ghost" onClick={resetForm}>Закрыть</button>
              </div>
              <form className="ur-user-form" onSubmit={saveUser}>
                {form.id ? (
                  <div className="ur-readonly-user">
                    <div className="ur-readonly-item">
                      <span>Пользователь</span>
                      <strong>{form.username || "Без имени"}</strong>
                    </div>
                    <div className="ur-readonly-item">
                      <span>Email</span>
                      <strong>{form.email}</strong>
                    </div>
                    <div className="ur-readonly-item">
                      <span>Действие</span>
                      <strong>Изменяется только роль</strong>
                    </div>
                  </div>
                ) : (
                  <>
                    <label className="ur-field">
                      <span className="ur-label">Email</span>
                      <input className="ur-input" type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} required />
                    </label>
                    <label className="ur-field">
                      <span className="ur-label">Имя пользователя</span>
                      <input className="ur-input" value={form.username} onChange={(event) => updateForm("username", event.target.value)} placeholder="Например, ivanov_ai" />
                    </label>
                    <label className="ur-field full">
                      <span className="ur-label">Пароль</span>
                      <input className="ur-input" type="password" value={form.password} onChange={(event) => updateForm("password", event.target.value)} minLength={6} required placeholder="Минимум 6 символов" />
                    </label>
                  </>
                )}
                <label className="ur-field full">
                  <span className="ur-label">Роль</span>
                  <select className="ur-select" value={form.role} onChange={(event) => updateForm("role", event.target.value)}>
                    {sortedRoles.map((role) => (
                      <option key={role.id || role.role_name} value={role.role_name}>
                        {getRoleLabel(role.role_name)}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="ur-form-actions">
                  <button type="button" className="ur-button ghost" onClick={resetForm}>Отмена</button>
                  <button type="submit" className="ur-button primary" disabled={saving || sortedRoles.length === 0}>
                    {saving ? "Сохранение..." : form.id ? "Сохранить роль" : "Создать пользователя"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="ur-card ur-activity">
            <div className="ur-card-head">
              <h3>Последние действия</h3>
            </div>
            {activityLog.length > 0 ? (
              <table className="ur-activity-table">
                <thead>
                  <tr>
                    <th>Дата и время</th>
                    <th>Объект</th>
                    <th>Действие</th>
                    <th>Раздел</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {activityLog.map((item) => (
                    <tr key={item.id}>
                      <td>{item.time}</td>
                      <td>{item.user}</td>
                      <td>{item.action}</td>
                      <td>{item.section}</td>
                      <td><span className="ur-status active">{item.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="ur-empty">Действия в текущей сессии пока не выполнялись.</div>
            )}
          </div>
        </div>

        <aside className="ur-side">
          <div className="ur-card">
            <div className="ur-card-head">
              <h3>Роли системы</h3>
            </div>
            <div className="ur-role-list">
              {sortedRoles.map((role) => {
                const details = roleDetails(role.role_name);
                const count = users.filter((user) => roleName(user) === role.role_name).length;
                return (
                  <button
                    key={role.id || role.role_name}
                    type="button"
                    className={`ur-role-button ${selectedRole === role.role_name ? "active" : ""}`}
                    style={{ "--role-accent": details.accent }}
                    onClick={() => setSelectedRole(role.role_name)}
                  >
                    <span>
                      <span className="ur-role-title">{getRoleLabel(role.role_name)}</span>
                      <span className="ur-role-subtitle">{details.description}</span>
                    </span>
                    <span className="ur-role-count">{count}</span>
                  </button>
                );
              })}
              {!loading && sortedRoles.length === 0 && (
                <div className="ur-empty">Роли не найдены.</div>
              )}
            </div>
          </div>

          <div className="ur-card">
            <div className="ur-card-head">
              <h3>Права роли</h3>
            </div>
            <div className="ur-permissions">
              <p className="ur-role-meta">
                Выбрана роль: <strong>{getRoleLabel(selectedRole)}</strong><br />
                Пользователей: <strong>{selectedRoleUsers}</strong>
              </p>
              {MODULE_DEFINITIONS.map((module) => {
                const currentLevel = permissionDraft[module.key] || "none";
                return (
                  <div className="ur-permission-row" key={module.key}>
                    <div className="ur-permission-copy">
                      <strong>{module.label}</strong>
                      <span>{module.description}</span>
                    </div>
                    <div className="ur-segmented" role="group" aria-label={`Права: ${module.label}`}>
                      {PERMISSION_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={`ur-segment-button ${currentLevel === option.value ? `active ${option.value}` : ""}`}
                          onClick={() => updatePermission(module.key, option.value)}
                        >
                          {option.short}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="ur-permission-footer">
              <div className="ur-permission-state">
                <span>Текущее состояние</span>
                <span className={`ur-level-pill ${permissionClass(permissionDraft.users_roles)}`}>
                  Пользователи и роли: {permissionLabel(permissionDraft.users_roles)}
                </span>
              </div>
              <button
                type="button"
                className="ur-button primary"
                onClick={saveRolePermissions}
                disabled={!selectedRoleData || !permissionsDirty || savingPermissions}
              >
                {savingPermissions ? "Сохранение..." : permissionsDirty ? "Сохранить права роли" : "Права сохранены"}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
