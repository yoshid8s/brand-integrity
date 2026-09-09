import fs from "node:fs/promises";
import { parse } from "csv-parse/sync";

const arg1 = process.argv[2];
const arg2 = process.argv[3];

if (!arg1) {
  console.error(
    "Usage:\n" +
      "  node scripts/prepare-measurement-input.mjs <media_id> <candidate_position>\n" +
      "  node scripts/prepare-measurement-input.mjs <article_url>"
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

console.log(JSON.stringify(input, null, 2));
