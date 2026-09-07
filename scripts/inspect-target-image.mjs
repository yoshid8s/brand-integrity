import { chromium } from "playwright";

const url =
  "https://style.yh-inc.jp/ジジイのsummer-white-shirt-styles-3-looks/";

const headless = !process.argv.includes("--headed");

const browser = await chromium.launch({ headless });

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

await page.waitForTimeout(5000);

const result = await page.evaluate(() => {
  const img = document.querySelector("img.wp-image-3606");

  if (!img) {
    return { found: false };
  }

  const r = img.getBoundingClientRect();
  const figure = img.closest("figure");
  const fr = figure?.getBoundingClientRect();

  return {
    found: true,
    img: {
      src: img.currentSrc || img.src,
      loading: img.getAttribute("loading"),
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      width: Math.round(r.width),
      height: Math.round(r.height),
      top: Math.round(r.top + window.scrollY),
    },
    figure: figure
      ? {
          width: Math.round(fr.width),
          height: Math.round(fr.height),
          top: Math.round(fr.top + window.scrollY),
        }
      : null,
    documentHeight: document.documentElement.scrollHeight,
  };
});

console.log(JSON.stringify({ headless, ...result }, null, 2));

await browser.close();
