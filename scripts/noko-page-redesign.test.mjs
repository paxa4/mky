import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const hubPagePath = new URL("../src/pages/hubs/HubPages.jsx", import.meta.url);
const nokoCssPath = new URL("../src/pages/hubs/NokoPage.css", import.meta.url);

const source = readFileSync(hubPagePath, "utf8");

assert.ok(existsSync(nokoCssPath), "NOKO scoped CSS exists");

[
  "ImcroPage",
  "ImcroContainer",
  "ImcroSection",
  "ImcroNewsPanel",
  "ImcroServiceCard",
  "ImcroContactPanel",
].forEach((componentName) => {
  assert.ok(source.includes(componentName), `NOKO page uses ${componentName}`);
});

[
  "noko-page",
  "noko-hero-grid",
  "noko-materials-grid",
  "noko-contact-section",
  "Последние новости",
  "Материалы и разделы",
  "Контакты отдела",
].forEach((marker) => {
  assert.ok(source.includes(marker), `NOKO page contains ${marker}`);
});

[
  "/noko/operativnaya-informaciya/",
  "/noko/gia-9/",
  "/noko/gia-11/",
  "/noko/sborniki/",
].forEach((path) => {
  assert.ok(source.includes(path), `NOKO page keeps route ${path}`);
});

assert.ok(!source.includes("Ознакомиться"), "NOKO page does not show the old ознакомительные buttons");

const styles = readFileSync(nokoCssPath, "utf8");

[
  ".noko-page",
  ".noko-hero-grid",
  ".noko-materials-grid",
  ".noko-contact-section",
].forEach((className) => {
  assert.ok(styles.includes(className), `NOKO CSS contains ${className}`);
});

assert.ok(!/tailwind|grid-cols-\d|bg-\[|text-\[|rounded-\[|shadow-\[/i.test(source), "NOKO JSX does not use Tailwind utility classes");
assert.ok(!/tailwind|@tailwind|@apply/i.test(styles), "NOKO CSS does not use Tailwind directives");
assert.ok(!/#(?:7C3AED|6D28D9|8B5CF6|C4B5FD|F5F3FF|F3EEFF|EDE9FE|92400E|B45309|F59E0B|D97706)/i.test(styles), "NOKO CSS avoids banned accent colors");
