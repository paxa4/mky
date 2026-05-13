export function formatArticleDate(value, fallback = "Дата не указана") {
  const raw = String(value || "").trim();
  if (!raw) return fallback;

  const isoDate = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) {
    const [, year, month, day] = isoDate;
    return `${day}.${month}.${year}`;
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function getArticleAuthorLabel(article, fallback = "Автор не указан") {
  if (!article) return fallback;

  const nestedAuthor = article.author && typeof article.author === "object" ? article.author : null;
  const fio = [
    article.lastName || article.last_name,
    article.firstName || article.first_name,
    article.middleName || article.middle_name || article.patronymic,
  ].filter(Boolean).join(" ");
  const nestedFio = nestedAuthor ? [
    nestedAuthor.lastName || nestedAuthor.last_name,
    nestedAuthor.firstName || nestedAuthor.first_name,
    nestedAuthor.middleName || nestedAuthor.middle_name || nestedAuthor.patronymic,
  ].filter(Boolean).join(" ") : "";

  return (
    article.full_name
    || article.fullName
    || article.author_full_name
    || fio
    || nestedAuthor?.full_name
    || nestedAuthor?.fullName
    || nestedFio
    || article.author_name
    || article.author_email
    || nestedAuthor?.email
    || article.email
    || article.author_username
    || nestedAuthor?.username
    || article.username
    || (typeof article.author === "string" ? article.author : "")
    || fallback
  );
}
