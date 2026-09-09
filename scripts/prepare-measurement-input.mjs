import fs from "node:fs/promises";
import { parse } from "csv-parse/sync";

const mediaId = process.argv[2];
const candidatePosition = process.argv[3];

if (!mediaId || !candidatePosition) {
  console.error(
    "Usage: node scripts/prepare-measurement-input.mjs <media_id> <candidate_position>"
  );
  process.exit(1);
}

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

const article = articles.find(
  (row) =>
    row.media_id === mediaId &&
    row.candidate_position === candidatePosition &&
    row.eligibility_status === "SELECTED"
);

if (!article) {
  throw new Error(
    `Selected article not found: ${mediaId} candidate ${candidatePosition}`
  );
}

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
