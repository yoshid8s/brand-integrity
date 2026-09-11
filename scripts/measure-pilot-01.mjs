import fs from "node:fs/promises";
import { parse } from "csv-parse/sync";
import { chromium } from "playwright";

const arg1 = process.argv[2];
const arg2 = process.argv[3];

if (!arg1) {
  console.error(
    "Usage:\n" +
      "  node scripts/measure-pilot-01.mjs <media_id> <candidate_position>\n" +
      "  node scripts/measure-pilot-01.mjs <article_url>"
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
    return (
      row.final_resolved_url === arg1 ||
      row.article_url === arg1
    );
  }

  return (
    row.media_id === arg1 &&
    row.candidate_position === arg2
  );
});

if (matches.length === 0) {
  throw new Error(
    isUrl
      ? `Selected article not found for URL: ${arg1}`
      : `Selected article not found: ${arg1} candidate ${arg2}`
  );
}

if (matches.length > 1) {
  throw new Error(
    isUrl
      ? `Multiple selected articles matched URL: ${arg1}`
      : `Multiple selected articles matched: ${arg1} candidate ${arg2}. Use the article URL instead.`
  );
}

const article = matches[0];

const region = regions.find(
  (row) =>
    row.media_id === article.media_id &&
    row.validation_status === "VALIDATED"
);

if (!region) {
  throw new Error(
    `Validated reading region not found for media: ${article.media_id}`
  );
}

const input = {
  pilotId: article.pilot_id,
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
const stepPx = Math.round(viewport.height * 0.75);
const stepWaitMs = 1000;

const browser = await chromium.launch({ headless: false });

try {
  const context = await browser.newContext({
    viewport,
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  const response = await page.goto(input.articleUrl, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });

  await page.waitForTimeout(initialWaitMs);

  const states = [];

  for (let i = 0; i < 100; i++) {
    const state = await page.evaluate((selector) => {
      const readingRegion = document.querySelector(selector);
      const rect = readingRegion?.getBoundingClientRect();

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
    }, input.readingRegion.selector);

    if (!state.readingRegion) {
      throw new Error(
        `Reading region selector no longer resolved: ${input.readingRegion.selector}`
      );
    }

    states.push({
      index: i,
      ...state,
    });

    const reachedReadingRegionEnd =
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

  const output = {
    input,
    environment: {
      viewport,
      locale: "ja-JP",
      timezoneId: "Asia/Tokyo",
      deviceScaleFactor: 1,
      initialWaitMs,
      stepPx,
      stepWaitMs,
      headless: false,
    },
    navigation: {
      requestedUrl: input.articleUrl,
      finalUrl: page.url(),
      httpStatus: response?.status() ?? null,
    },
    states,
  };

  const json = JSON.stringify(output, null, 2);

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-");

  const outputDir =
    `evidence/pilot-01/${input.mediaId}/measurement`;

  await fs.mkdir(outputDir, { recursive: true });

  const outputPath =
    `${outputDir}/${timestamp}.json`;

  await fs.writeFile(
    outputPath,
    `${json}\n`,
    "utf8"
  );

  console.log(json);
  console.error(`Saved measurement: ${outputPath}`);
} finally {
  await browser.close();
}
