import fs from "node:fs/promises";
import { parse } from "csv-parse/sync";
import { chromium } from "playwright";

const arg1 = process.argv[2];
const arg2 = process.argv[3];

if (!arg1) {
  console.error(
    "Usage:\n" +
      "  node scripts/inspect-ad-slots.mjs <media_id> <candidate_position>\n" +
      "  node scripts/inspect-ad-slots.mjs <article_url>",
  );
  process.exit(1);
}

const isUrl = arg1.startsWith("https://") || arg1.startsWith("http://");

const [articlesCsv, regionsCsv] = await Promise.all([
  fs.readFile("data/pilot-01-articles.csv", "utf8"),
  fs.readFile("data/pilot-01-reading-regions.csv", "utf8"),
]);

const articles = parse(articlesCsv, {
  columns: true,
  skip_empty_lines: true,
});

const regions = parse(regionsCsv, {
  columns: true,
  skip_empty_lines: true,
});

const matches = articles.filter((row) => {
  if (row.eligibility_status !== "SELECTED") {
    return false;
  }

  if (isUrl) {
    return row.final_resolved_url === arg1 || row.article_url === arg1;
  }

  return row.media_id === arg1 && row.candidate_position === arg2;
});

if (matches.length === 0) {
  throw new Error(
    isUrl
      ? `Selected article not found for URL: ${arg1}`
      : `Selected article not found: ${arg1} candidate ${arg2}`,
  );
}

if (matches.length > 1) {
  throw new Error(
    isUrl
      ? `Multiple selected articles matched URL: ${arg1}`
      : `Multiple selected articles matched: ${arg1} candidate ${arg2}. Use the article URL instead.`,
  );
}

const article = matches[0];

const region = regions.find(
  (row) =>
    row.media_id === article.media_id && row.validation_status === "VALIDATED",
);

if (!region) {
  throw new Error(
    `Validated reading region not found for media: ${article.media_id}`,
  );
}

const input = {
  mediaId: article.media_id,
  group: article.group,
  mediaProperty: article.media_property,
  articleUrl: article.final_resolved_url || article.article_url,
  articleTitle: article.article_title,
  readingRegion: {
    selector: region.selector,
    selectorType: region.selector_type,
    validationStatus: region.validation_status,
  },
};

const viewport = { width: 1440, height: 900 };
const initialWaitMs = 3000;

const browser = await chromium.launch({ headless: false });

try {
  const context = await browser.newContext({
    viewport,
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  await page.goto(input.articleUrl, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });

  await page.waitForTimeout(initialWaitMs);

  await page.evaluate((selector) => {
    const readingRegion = document.querySelector(selector);

    if (!readingRegion) {
      throw new Error(`Reading Region not found: ${selector}`);
    }

    const top = readingRegion.getBoundingClientRect().top + window.scrollY;

    window.scrollTo({
      top,
      left: 0,
      behavior: "instant",
    });
  }, input.readingRegion.selector);

  await page.waitForTimeout(1000);

  const result = await page.evaluate((selector) => {
    const readingRegion = document.querySelector(selector);

    if (!readingRegion) {
      throw new Error(`Reading Region not found: ${selector}`);
    }

    const regionRect = readingRegion.getBoundingClientRect();
    const regionTop = regionRect.top + window.scrollY;
    const regionBottom = regionRect.bottom + window.scrollY;
    const regionLeft = regionRect.left + window.scrollX;
    const regionRight = regionRect.right + window.scrollX;

    const candidateSelectors = [
      "[data-ad]",
      "[data-ad-slot]",
      "[data-google-query-id]",
      "ins.adsbygoogle",
      "iframe",
      "[id^='cam-context-ad-']",
    ];

    const seen = new Set();
    const candidates = [];

    for (const matchedSelector of candidateSelectors) {
      for (const element of document.querySelectorAll(matchedSelector)) {
        if (seen.has(element)) continue;
        seen.add(element);

        const rect = element.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        const bottom = rect.bottom + window.scrollY;
        const left = rect.left + window.scrollX;
        const right = rect.right + window.scrollX;
        const style = getComputedStyle(element);
        const anchor = element.closest("a");
        const parent = element.parentElement;

        const visible =
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== "none" &&
          style.visibility !== "hidden";

        const overlapsReadingRegion =
          bottom > regionTop &&
          top < regionBottom &&
          right > regionLeft &&
          left < regionRight;

        const insideReadingRegion =
          readingRegion === element || readingRegion.contains(element);

        candidates.push({
          matchedSelector,
          tag: element.tagName,
          id: element.id || null,
          className:
            typeof element.className === "string" ? element.className : null,
          top: Math.round(top),
          bottom: Math.round(bottom),
          left: Math.round(left),
          right: Math.round(right),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          visible,
          insideReadingRegion,
          overlapsReadingRegion,
          src:
            element.tagName === "IFRAME" || element.tagName === "IMG"
              ? element.getAttribute("src")
              : null,
          href: anchor?.href ?? null,
          alt: element.getAttribute("alt"),
          parentTag: parent?.tagName ?? null,
          parentId: parent?.id || null,
          parentClass:
            typeof parent?.className === "string" ? parent.className : null,
        });
      }
    }

    return {
      readingRegion: {
        selector,
        scrollY: Math.round(window.scrollY),
        top: Math.round(regionTop),
        bottom: Math.round(regionBottom),
        left: Math.round(regionRect.left + window.scrollX),
        right: Math.round(regionRect.right + window.scrollX),
        width: Math.round(regionRect.width),
        height: Math.round(regionRect.height),
        viewportTop: Math.round(regionRect.top),
        viewportBottom: Math.round(regionRect.bottom),
      },
      candidateCount: candidates.length,
      candidates,
    };
  }, input.readingRegion.selector);

  console.log(
    JSON.stringify(
      {
        input,
        page: {
          url: page.url(),
          title: await page.title(),
        },
        ...result,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
