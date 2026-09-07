import { chromium } from "playwright";

const url = process.argv[2];

if (!url) {
  console.error("Usage: node scripts/inspect-article-boundary-url.mjs <URL>");
  process.exit(1);
}

const browser = await chromium.launch({ headless: false });

const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: "ja-JP",
  timezoneId: "Asia/Tokyo",
  deviceScaleFactor: 1,
});

const page = await context.newPage();

await page.goto(url, {
  waitUntil: "domcontentloaded",
  timeout: 30000,
});

await page.waitForTimeout(3000);

for (let i = 0; i < 20; i++) {
  await page.evaluate(() => window.scrollBy(0, 675));
  await page.waitForTimeout(1000);
}

const result = await page.evaluate(() => {
  const selectors = [
    "article",
    "main article",
    '[itemprop="articleBody"]',
    ".entry-content",
    ".post-content",
    ".article-content",
    "main",
  ];

  return {
    title: document.title,
    finalUrl: location.href,
    documentHeight: document.documentElement.scrollHeight,
    candidates: selectors.map((selector) => {
      const el = document.querySelector(selector);

      if (!el) {
        return {
          selector,
          found: false,
        };
      }

      const r = el.getBoundingClientRect();

      return {
        selector,
        found: true,
        tag: el.tagName,
        id: el.id || null,
        className: el.className || null,
        top: Math.round(r.top + window.scrollY),
        bottom: Math.round(r.bottom + window.scrollY),
        height: Math.round(r.height),
        textLength: (el.innerText || "").length,
      };
    }),
  };
});

console.log(JSON.stringify(result, null, 2));

await browser.close();
