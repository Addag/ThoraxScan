// Renders scripts/guides/attention-maps.html to public/guides/attention-maps.pdf.
// Header/footer banners (header.jpg, footer.jpg) come from the LPU headerfooter.docx template.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const banner = (file, edge) => `<div style="position:absolute;${edge}:0;left:0;width:100%;margin:0;-webkit-print-color-adjust:exact">
  <img style="display:block;width:100%" src="data:image/jpeg;base64,${readFileSync(new URL(file, import.meta.url)).toString("base64")}"></div>`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(new URL("./attention-maps.html", import.meta.url).href);
await page.pdf({
  path: fileURLToPath(new URL("../../public/guides/attention-maps.pdf", import.meta.url)),
  printBackground: true, preferCSSPageSize: true, displayHeaderFooter: true,
  headerTemplate: banner("./header.jpg", "top"), footerTemplate: banner("./footer.jpg", "bottom"),
});
await browser.close();
