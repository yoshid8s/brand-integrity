import { chromium } from "playwright";

const url =
  process.argv[2] ||
  "https://style.yh-inc.jp/%E3%82%B8%E3%82%B8%E3%82%A4%E3%81%AEsummer-white-shirt-styles-3-looks/";

const viewport = { width: 1440, height: 900 };
const initialWaitMs = 3000;
const stepPx = Math.round(viewport.height * 0.75);
const stepWaitMs = 1000;

const browser = await chromium.launch({ headless: false });

const context = await browser.newContext({
  viewport,
  locale: "ja-JP",
  timezoneId: "Asia/Tokyo",
  deviceScaleFactor: 1,
});

const page = await context.newPage();

await page.goto(url, {
  waitUntil: "domcontentloaded",
  timeout: 30000,
});

await page.waitForTimeout(initialWaitMs);

const states = [];

for (let i = 0; i < 100; i++) {
  const state = await page.evaluate(() => {
    const region = document.querySelector("article");
    const rect = region?.getBoundingClientRect();

    return {
      scrollY: Math.round(window.scrollY),
      viewportHeight: window.innerHeight,
      documentHeight: document.documentElement.scrollHeight,
      bodyTextLength: document.body?.innerText?.length ?? 0,
      readingRegion: rect
        ? {
            top: Math.round(rect.top + window.scrollY),
            bottom: Math.round(rect.bottom + window.scrollY),
            height: Math.round(rect.height),
            viewportTop: Math.round(rect.top),
            viewportBottom: Math.round(rect.bottom),
          }
        : null,
    };
  });

  states.push({
    index: i,
    ...state,
  });

  const reachedReadingRegionEnd =
    state.readingRegion &&
    state.readingRegion.viewportBottom <= state.viewportHeight;

  if (reachedReadingRegionEnd) break;

  await page.evaluate((step) => {
    window.scrollBy({
      top: step,
      left: 0,
      behavior: "instant",
    });
  }, stepPx);

  await page.waitForTimeout(stepWaitMs);
}

console.log(
  JSON.stringify(
    {
      url,
      viewport,
      initialWaitMs,
      stepPx,
      stepWaitMs,
      states,
    },
    null,
    2
  )
);

await browser.close();
