import { chromium } from "playwright";

const url =
  "https://style.yh-inc.jp/%E3%82%B8%E3%82%B8%E3%82%A4%E3%81%AEsummer-white-shirt-styles-3-looks/";

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

/* Trigger ordinary lazy loading through the page. */
for (let i = 0; i < 20; i++) {
  await page.evaluate(() => window.scrollBy(0, 675));
  await page.waitForTimeout(1000);
}

const result = await page.evaluate(() => {
  const selectors = [
    "article",
    "main article",
    ".article-content",
    ".entry-content",
    ".post-content",
    '[itemprop="articleBody"]',
    "main",
  ];

  return {
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
