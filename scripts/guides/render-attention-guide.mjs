// Renders scripts/guides/attention-maps.html to public/guides/attention-maps.pdf.
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(new URL("./attention-maps.html", import.meta.url).href);
await page.pdf({ path: fileURLToPath(new URL("../../public/guides/attention-maps.pdf", import.meta.url)), format: "A4", printBackground: true, preferCSSPageSize: true });
await browser.close();
