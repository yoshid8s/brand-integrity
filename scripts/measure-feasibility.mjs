import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";

const url =
  "https://style.yh-inc.jp/ジジイのsummer-white-shirt-styles-3-looks/";

const outDir = "evidence/pilot-01/C01/feasibility";
const waitAfterLoadMs = 5000;
const headless = !process.argv.includes("--headed");

await fs.mkdir(outDir, { recursive: true });

const playwrightVersion = execSync("npx playwright --version", {
  encoding: "utf8",
}).trim();

const browser = await chromium.launch({ headless });

const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: "ja-JP",
  timezoneId: "Asia/Tokyo",
  deviceScaleFactor: 1,
});

const page = await context.newPage();

const startedAt = new Date();

const response = await page.goto(url, {
  waitUntil: "domcontentloaded",
  timeout: 30000,
});

await page.waitForTimeout(waitAfterLoadMs);

const browserVersion = browser.version();
const userAgent = await page.evaluate(() => navigator.userAgent);

const result = await page.evaluate(() => ({
  title: document.title,
  finalUrl: location.href,
  viewportWidth: window.innerWidth,
  viewportHeight: window.innerHeight,
  documentWidth: document.documentElement.scrollWidth,
  documentHeight: document.documentElement.scrollHeight,
  bodyTextLength: document.body?.innerText?.length ?? 0,
}));

const endedAt = new Date();

const output = {
  requestedUrl: url,
  httpStatus: response?.status() ?? null,
  startedAt: startedAt.toISOString(),
  endedAt: endedAt.toISOString(),
  durationMs: endedAt - startedAt,

  environment: {
    playwrightVersion,
    browserName: "chromium",
    browserVersion,
    userAgent,
    headless,
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    deviceScaleFactor: 1,
    waitAfterLoadMs,
  },

  ...result,
};

await fs.writeFile(
  path.join(outDir, headless ? "c01-01-desktop.json" : "c01-01-desktop-headed.json"),
  JSON.stringify(output, null, 2) + "\n",
  "utf8"
);

await page.screenshot({
  path: path.join(outDir, headless ? "c01-01-desktop.png" : "c01-01-desktop-headed.png"),
  fullPage: true,
});

console.log(output);

await browser.close();
