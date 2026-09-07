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

const elements = await page.evaluate(() => {
  const all = [...document.querySelectorAll("body *")];

  return all
    .map((el) => {
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);

      return {
        tag: el.tagName.toLowerCase(),
        id: el.id || "",
        className:
          typeof el.className === "string"
            ? el.className
            : "",
        top: Math.round(r.top + window.scrollY),
        width: Math.round(r.width),
        height: Math.round(r.height),
        display: style.display,
        position: style.position,
        visibility: style.visibility,
        overflow: style.overflow,
        text: (el.innerText || "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 120),
      };
    })
    .filter((x) => x.height >= 500)
    .sort((a, b) => b.height - a.height)
    .slice(0, 40);
});

console.log(
  JSON.stringify(
    {
      headless,
      documentHeight: await page.evaluate(
        () => document.documentElement.scrollHeight
      ),
      elements,
    },
    null,
    2
  )
);

await browser.close();
