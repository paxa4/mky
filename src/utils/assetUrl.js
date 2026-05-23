import { API_BASE } from "../constants/index.js";

export function stripMkyPrefix(path) {
  return typeof path === "string" ? path.replace(/^\/mky(?=\/)/, "") : path;
}

export function resolveAssetUrl(path) {
  if (typeof path !== "string") return path || "";
  const value = stripMkyPrefix(path.trim());
  if (!value) return "";
  if (/^(?:[a-z][a-z\d+\-.]*:)?\/\//i.test(value) || value.startsWith("data:") || value.startsWith("blob:")) {
    return value;
  }
  if (value.startsWith("/static/")) return `${API_BASE}${value}`;
  return value;
}

export function toBackendAssetUrl(path) {
  if (typeof path !== "string") return path || "";
  const value = stripMkyPrefix(path.trim());
  if (!value) return "";
  if (value.startsWith(`${API_BASE}/static/`)) return value.slice(API_BASE.length);
  return value;
}

export function resolveArticleBlocks(blocks) {
  if (!Array.isArray(blocks)) return [];
  return blocks.map((block) => {
    if (!block?.data?.url) return block;
    return { ...block, data: { ...block.data, url: resolveAssetUrl(block.data.url) } };
  });
}

export function backendArticleBlocks(blocks) {
  if (!Array.isArray(blocks)) return [];
  return blocks.map((block) => {
    if (!block?.data?.url) return block;
    return { ...block, data: { ...block.data, url: toBackendAssetUrl(block.data.url) } };
  });
}

export function resolveArticleAttachments(attachments) {
  if (!Array.isArray(attachments)) return [];
  return attachments.map((item) => item?.url ? { ...item, url: resolveAssetUrl(item.url) } : item);
}

export function backendArticleAttachments(attachments) {
  if (!Array.isArray(attachments)) return [];
  return attachments
    .filter((item) => item?.url && !item.uploading)
    .map(({ uploading, _uploadId, ...item }) => ({ ...item, url: toBackendAssetUrl(item.url) }));
}
