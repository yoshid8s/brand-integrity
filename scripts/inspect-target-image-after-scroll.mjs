import { chromium } from "playwright";

const url =
  "https://style.yh-inc.jp/ジジイのsummer-white-shirt-styles-3-looks/";

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

const img = page.locator("img.wp-image-3606");
await img.scrollIntoViewIfNeeded();

await page.waitForTimeout(3000);

const result = await page.evaluate(() => {
  const img = document.querySelector("img.wp-image-3606");
  const r = img.getBoundingClientRect();
  const figure = img.closest("figure");
  const fr = figure?.getBoundingClientRect();

  return {
    img: {
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      width: Math.round(r.width),
      height: Math.round(r.height),
      top: Math.round(r.top + window.scrollY),
    },
    figure: {
      width: Math.round(fr.width),
      height: Math.round(fr.height),
      top: Math.round(fr.top + window.scrollY),
    },
    documentHeight: document.documentElement.scrollHeight,
    scrollY: Math.round(window.scrollY),
  };
});

console.log(JSON.stringify(result, null, 2));

await browser.close();
