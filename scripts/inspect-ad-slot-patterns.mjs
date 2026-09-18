import fs from "node:fs/promises";
import { parse } from "csv-parse/sync";
import { chromium } from "playwright";

const targetMediaId = process.argv[2] || null;

const articlesCsv = await fs.readFile("data/pilot-01-articles.csv", "utf8");

const regionsCsv = await fs.readFile(
  "data/pilot-01-reading-regions.csv",
  "utf8",
);

const a4ManualReviewCsv = await fs.readFile(
  "data/pilot-01-a4-manual-review.csv",
  "utf8",
);
const articles = parse(articlesCsv, {
  columns: true,
  skip_empty_lines: true,
});

const regions = parse(regionsCsv, {
  columns: true,
  skip_empty_lines: true,
});

const a4ManualReviews = parse(a4ManualReviewCsv, {
  columns: true,
  skip_empty_lines: true,
});

function normalizeUrl(value) {
  if (!value) return "";

  try {
    const url = new URL(value);
    url.hash = "";

    return url.href;
  } catch {
    return value;
  }
}

/*
 * Group A only.
 * Take the first SELECTED article for each media property.
 */
const selected = [];

for (const article of articles) {
  if (article.group !== "A") continue;
  if (article.eligibility_status !== "SELECTED") continue;

  if (targetMediaId && article.media_id !== targetMediaId) {
    continue;
  }

  if (selected.some((item) => item.media_id === article.media_id)) {
    continue;
  }

  const region = regions.find(
    (row) =>
      row.media_id === article.media_id &&
      row.validation_status === "VALIDATED",
  );

  if (!region) continue;

  const articleUrl = normalizeUrl(
    article.final_resolved_url || article.article_url,
  );

  const manualReviews = a4ManualReviews.filter(
    (review) =>
      review.media_id === article.media_id &&
      normalizeUrl(review.article_url) === articleUrl,
  );

  selected.push({
    ...article,
    readingRegionSelector: region.selector,
    a4ManualReviews: manualReviews,
  });
}

const viewport = {
  width: 1440,
  height: 900,
};

const initialWaitMs = 3000;
const stepPx = Math.round(viewport.height * 0.25);
const stepWaitMs = 1000;
const maxScrollSteps = 100;

const browser = await chromium.launch({
  headless: false,
});

function clipRectToViewport(rect, viewport) {
  const left = Math.max(0, rect.viewportLeft);
  const top = Math.max(0, rect.viewportTop);
  const right = Math.min(viewport.width, rect.viewportRight);
  const bottom = Math.min(viewport.height, rect.viewportBottom);

  if (right <= left || bottom <= top) {
    return null;
  }

  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
  };
}

function calculateUnionArea(rectangles) {
  if (rectangles.length === 0) {
    return 0;
  }

  const xCoordinates = [
    ...new Set(rectangles.flatMap((rect) => [rect.left, rect.right])),
  ].sort((a, b) => a - b);

  let totalArea = 0;

  for (let i = 0; i < xCoordinates.length - 1; i++) {
    const x1 = xCoordinates[i];
    const x2 = xCoordinates[i + 1];

    if (x2 <= x1) continue;

    const intervals = rectangles
      .filter((rect) => rect.left < x2 && rect.right > x1)
      .map((rect) => [rect.top, rect.bottom])
      .sort((a, b) => a[0] - b[0]);

    if (intervals.length === 0) continue;

    let coveredHeight = 0;
    let currentTop = intervals[0][0];
    let currentBottom = intervals[0][1];

    for (let j = 1; j < intervals.length; j++) {
      const [top, bottom] = intervals[j];

      if (top <= currentBottom) {
        currentBottom = Math.max(currentBottom, bottom);
      } else {
        coveredHeight += currentBottom - currentTop;
        currentTop = top;
        currentBottom = bottom;
      }
    }

    coveredHeight += currentBottom - currentTop;
    totalArea += (x2 - x1) * coveredHeight;
  }

  return totalArea;
}

const results = [];

try {
  for (const article of selected) {
    console.error(`Inspecting ${article.media_id} ${article.media_property}`);

    const context = await browser.newContext({
      viewport,
      locale: "ja-JP",
      timezoneId: "Asia/Tokyo",
      deviceScaleFactor: 1,
    });

    const page = await context.newPage();

    try {
      await page.goto(article.final_resolved_url || article.article_url, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      await page.waitForTimeout(initialWaitMs);

      const observedGoogleSlots = new Map();
      const observedOtherIframes = new Map();
      const states = [];

      let stalledScrollCount = 0;
      let scrollStatus = "COMPLETED";

      const regionExists = await page.evaluate((selector) => {
        return Boolean(document.querySelector(selector));
      }, article.readingRegionSelector);

      if (!regionExists) {
        results.push({
          mediaId: article.media_id,
          mediaProperty: article.media_property,
          articleUrl: article.final_resolved_url || article.article_url,
          readingRegionSelector: article.readingRegionSelector,
          status: "READING_REGION_NOT_FOUND",
        });

        continue;
      }

      /*
       * Start measurement from the initial article-page viewport.
       *
       * A4 measures the Article Experience Window:
       * from the top of the article page through the end
       * of the validated Reading Region.
       */
      await page.evaluate(() => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: "instant",
        });
      });

      await page.waitForTimeout(stepWaitMs);

      for (let i = 0; i < maxScrollSteps; i++) {
        const state = await page.evaluate((selector) => {
          const readingRegion = document.querySelector(selector);

          if (!readingRegion) {
            return null;
          }

          const regionRect = readingRegion.getBoundingClientRect();

          const googleSlots = [
            ...document.querySelectorAll("[data-google-query-id]"),
          ]
            .filter((element) => {
              const rect = element.getBoundingClientRect();
              const style = getComputedStyle(element);

              const visible =
                rect.width > 0 &&
                rect.height > 0 &&
                style.display !== "none" &&
                style.visibility !== "hidden";

              const intersectsViewport =
                rect.bottom > 0 &&
                rect.top < window.innerHeight &&
                rect.right > 0 &&
                rect.left < window.innerWidth;

              return visible && intersectsViewport;
            })
            .map((element) => {
              const rect = element.getBoundingClientRect();

              const googleIframes = [
                ...element.querySelectorAll("iframe[id^='google_ads_iframe_']"),
              ];

              const renderedGoogleIframes = googleIframes
                .filter((iframe) => {
                  const iframeRect = iframe.getBoundingClientRect();
                  const iframeStyle = getComputedStyle(iframe);

                  return (
                    iframeRect.width > 0 &&
                    iframeRect.height > 0 &&
                    iframeStyle.display !== "none" &&
                    iframeStyle.visibility !== "hidden"
                  );
                })
                .map((iframe) => {
                  const iframeRect = iframe.getBoundingClientRect();

                  return {
                    id: iframe.id || null,
                    src: iframe.getAttribute("src"),
                    width: Math.round(iframeRect.width),
                    height: Math.round(iframeRect.height),
                  };
                });

              const elementStyle = getComputedStyle(element);

              return {
                id: element.id || null,
                queryId: element.getAttribute("data-google-query-id") || null,
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                viewportTop: Math.round(rect.top),
                viewportBottom: Math.round(rect.bottom),
                viewportLeft: Math.round(rect.left),
                viewportRight: Math.round(rect.right),

                position: elementStyle.position,
                zIndex: elementStyle.zIndex,

                insideReadingRegion:
                  readingRegion === element || readingRegion.contains(element),

                googleIframeCount: googleIframes.length,

                renderedGoogleIframeCount: renderedGoogleIframes.length,

                renderedGoogleIframes,
              };
            });

          const otherIframes = [...document.querySelectorAll("iframe")]
            .filter((element) => {
              const rect = element.getBoundingClientRect();
              const style = getComputedStyle(element);

              const visible =
                rect.width > 0 &&
                rect.height > 0 &&
                style.display !== "none" &&
                style.visibility !== "hidden";

              const intersectsViewport =
                rect.bottom > 0 &&
                rect.top < window.innerHeight &&
                rect.right > 0 &&
                rect.left < window.innerWidth;

              return (
                visible &&
                intersectsViewport &&
                !element.id.startsWith("google_ads_iframe_")
              );
            })
            .map((element) => {
              const rect = element.getBoundingClientRect();
              const id = element.id || null;
              const src = element.getAttribute("src");

              /*
               * Non-Google advertising evidence.
               *
               * fif_slot__ is an identifiable advertising-slot structure
               * observed on Nikkei during A4 feasibility testing.
               *
               * This identifies an advertising placement only.
               * It must not be used to infer transaction type.
               */
              const identifiableAdIframe =
                Boolean(id) && id.startsWith("fif_slot__");

              return {
                id,
                src,
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                viewportTop: Math.round(rect.top),
                viewportBottom: Math.round(rect.bottom),
                viewportLeft: Math.round(rect.left),
                viewportRight: Math.round(rect.right),
                insideReadingRegion:
                  readingRegion === element || readingRegion.contains(element),

                a4Classification: identifiableAdIframe
                  ? "AUTOMATICALLY_CONFIRMED"
                  : "UNRESOLVED",

                detectionMethod: identifiableAdIframe
                  ? "identifiable-ad-iframe"
                  : "generic-iframe",
              };
            });

          /*
           * A5 — Editorial text geometry
           *
           * Identify direct-child editorial text blocks within the validated
           * Article Reading Region.
           *
           * For the initial A01 validation, paragraph and heading elements
           * are treated as editorial text. Related-content list items,
           * captions, and other nested elements are intentionally excluded.
           */
          const editorialTextRects = [...readingRegion.children]
            .filter((element) =>
              ["P", "H1", "H2", "H3", "H4"].includes(element.tagName),
            )
            .filter((element) => (element.innerText || "").trim().length > 0)
            .map((element) => {
              const rect = element.getBoundingClientRect();

              return {
                tag: element.tagName,
                textLength: (element.innerText || "").trim().length,
                viewportTop: Math.round(rect.top),
                viewportBottom: Math.round(rect.bottom),
                viewportLeft: Math.round(rect.left),
                viewportRight: Math.round(rect.right),
              };
            });

          return {
            scrollY: Math.round(window.scrollY),
            documentHeight: document.documentElement.scrollHeight,
            readingRegion: {
              viewportTop: Math.round(regionRect.top),
              viewportBottom: Math.round(regionRect.bottom),
              viewportLeft: Math.round(regionRect.left),
              viewportRight: Math.round(regionRect.right),
              width: Math.round(regionRect.width),
              height: Math.round(regionRect.height),
            },
            googleSlots,
            otherIframes,
            editorialTextRects,
          };
        }, article.readingRegionSelector);

        if (!state) break;

        for (const slot of state.googleSlots) {
          /*
           * Prefer the stable DOM slot ID.
           * data-google-query-id can change when an
           * existing slot is refreshed.
           */
          const key = slot.id || `query:${slot.queryId}`;

          const existing = observedGoogleSlots.get(key);

          if (!existing) {
            observedGoogleSlots.set(key, {
              ...slot,
              firstObservedStep: i,
              firstObservedScrollY: state.scrollY,
              firstRenderedStep: slot.renderedGoogleIframeCount > 0 ? i : null,
              firstRenderedScrollY:
                slot.renderedGoogleIframeCount > 0 ? state.scrollY : null,
            });
          } else if (
            existing.renderedGoogleIframeCount === 0 &&
            slot.renderedGoogleIframeCount > 0
          ) {
            observedGoogleSlots.set(key, {
              ...existing,
              renderedGoogleIframeCount: slot.renderedGoogleIframeCount,
              renderedGoogleIframes: slot.renderedGoogleIframes,
              firstRenderedStep: i,
              firstRenderedScrollY: state.scrollY,
            });
          }
        }

        for (const frame of state.otherIframes) {
          const key =
            frame.id || frame.src || `frame:${frame.width}x${frame.height}`;

          if (!observedOtherIframes.has(key)) {
            observedOtherIframes.set(key, {
              ...frame,
              firstObservedStep: i,
              firstObservedScrollY: state.scrollY,
            });
          }
        }

        const a5ConfirmedRects = state.googleSlots
          .filter(
            (slot) =>
              slot.renderedGoogleIframeCount > 0 &&
              ["fixed", "sticky"].includes(slot.position),
          )
          .map((slot) => clipRectToViewport(slot, viewport))
          .filter(Boolean);

        const advertisingObstructionArea = calculateUnionArea(a5ConfirmedRects);

        const readingRegionRect = clipRectToViewport(
          state.readingRegion,
          viewport,
        );

        const a5ReadingRegionOverlapRects = readingRegionRect
          ? a5ConfirmedRects
              .map((rect) => {
                const left = Math.max(rect.left, readingRegionRect.left);
                const right = Math.min(rect.right, readingRegionRect.right);
                const top = Math.max(rect.top, readingRegionRect.top);
                const bottom = Math.min(rect.bottom, readingRegionRect.bottom);

                if (right <= left || bottom <= top) {
                  return null;
                }

                return {
                  left,
                  right,
                  top,
                  bottom,
                  width: right - left,
                  height: bottom - top,
                };
              })
              .filter(Boolean)
          : [];

        const readingRegionOverlapArea = calculateUnionArea(
          a5ReadingRegionOverlapRects,
        );

        const overlapsReadingRegion = readingRegionOverlapArea > 0;

        /*
         * A5 — Editorial text overlap
         *
         * Distinguish advertising that merely intersects the validated
         * Article Reading Region from advertising that actually overlaps
         * editorial text blocks.
         */
        const editorialTextRects = state.editorialTextRects
          .map((rect) => clipRectToViewport(rect, viewport))
          .filter(Boolean);

        const editorialTextOverlapRects = [];

        for (const adRect of a5ConfirmedRects) {
          for (const textRect of editorialTextRects) {
            const left = Math.max(adRect.left, textRect.left);
            const right = Math.min(adRect.right, textRect.right);
            const top = Math.max(adRect.top, textRect.top);
            const bottom = Math.min(adRect.bottom, textRect.bottom);

            if (right <= left || bottom <= top) {
              continue;
            }

            editorialTextOverlapRects.push({
              left,
              right,
              top,
              bottom,
              width: right - left,
              height: bottom - top,
            });
          }
        }

        const editorialTextOverlapArea = calculateUnionArea(
          editorialTextOverlapRects,
        );

        const coversEditorialText = editorialTextOverlapArea > 0;

        const viewportArea = viewport.width * viewport.height;

        const viewportObstructionRatio =
          viewportArea > 0 ? advertisingObstructionArea / viewportArea : null;

        states.push({
          index: i,
          scrollY: state.scrollY,
          documentHeight: state.documentHeight,
          readingRegion: state.readingRegion,
          googleSlotCount: state.googleSlots.length,
          otherIframeCount: state.otherIframes.length,

          // A5 diagnostic:
          editorialTextRects: state.editorialTextRects,

          // A5 feasibility:
          // Preserve viewport geometry for advertising candidates
          // observed at each sampled viewport state.
          googleSlots: state.googleSlots.map((slot) => ({
            id: slot.id,
            queryId: slot.queryId,
            viewportTop: slot.viewportTop,
            viewportBottom: slot.viewportBottom,
            viewportLeft: slot.viewportLeft,
            viewportRight: slot.viewportRight,
            position: slot.position,
            zIndex: slot.zIndex,
            renderedGoogleIframeCount: slot.renderedGoogleIframeCount,
          })),

          otherIframes: state.otherIframes.map((frame) => ({
            id: frame.id,
            src: frame.src,
            viewportTop: frame.viewportTop,
            viewportBottom: frame.viewportBottom,
            viewportLeft: frame.viewportLeft,
            viewportRight: frame.viewportRight,
            a4Classification: frame.a4Classification,
            detectionMethod: frame.detectionMethod,
          })),

          a5: {
            viewportArea,
            advertisingObstructionArea,
            viewportObstructionRatio,
            viewportObstructionPercent:
              viewportObstructionRatio === null
                ? null
                : Number((viewportObstructionRatio * 100).toFixed(3)),
            readingRegionOverlapArea,
            overlapsReadingRegion,
            editorialTextOverlapArea,
            coversEditorialText,
          },
        });

        const reachedReadingRegionEnd =
          state.readingRegion.viewportBottom <= viewport.height;

        if (reachedReadingRegionEnd) {
          break;
        }

        const scrollYBefore = state.scrollY;

        await page.evaluate((step) => {
          window.scrollBy({
            top: step,
            left: 0,
            behavior: "instant",
          });
        }, stepPx);

        await page.waitForTimeout(stepWaitMs);

        const scrollYAfter = await page.evaluate(() =>
          Math.round(window.scrollY),
        );

        if (scrollYAfter === scrollYBefore) {
          stalledScrollCount += 1;
        } else {
          stalledScrollCount = 0;
        }

        if (stalledScrollCount >= 2) {
          scrollStatus = "SCROLL_STALLED";
          break;
        }
      }

      /*
       * Measurement-time access state
       *
       * Detect whether the ordinary observed article-reading experience
       * became access-restricted after sample selection.
       *
       * This is intentionally media-agnostic. A restriction is recorded
       * only when the page contains evidence of both:
       *   1. restricted/premium article status, and
       *   2. an action required to continue reading.
       *
       * Detection does not bypass or interact with the access control.
       */
      const accessState = await page.evaluate(() => {
        const bodyText = document.body?.innerText || "";

        const restrictionPatterns = [
          /この記事は有料記事です/,
          /有料記事/,
          /会員限定/,
          /購読者限定/,
          /会員向け/,
        ];

        const continuationRequirementPatterns = [
          /続きを読むには[^。\n]*(?:購入|会員登録|ログイン|購読)/,
          /(?:購入|会員登録|ログイン|購読)[^。\n]*(?:必要|してください)/,
          /ログインして購入/,
          /新規会員登録して購入/,
        ];

        const restrictionEvidence = restrictionPatterns
          .filter((pattern) => pattern.test(bodyText))
          .map((pattern) => bodyText.match(pattern)?.[0])
          .filter(Boolean);

        const continuationEvidence = continuationRequirementPatterns
          .map((pattern) => bodyText.match(pattern)?.[0])
          .filter(Boolean);

        const accessRestrictionDetected =
          restrictionEvidence.length > 0 && continuationEvidence.length > 0;

        return {
          accessRestrictionDetected,
          restrictionEvidence: [...new Set(restrictionEvidence)],
          continuationEvidence: [...new Set(continuationEvidence)],
        };
      });

      const measurementStatus = accessState.accessRestrictionDetected
        ? "PARTIALLY_OBSERVABLE_ACCESS_RESTRICTED"
        : scrollStatus === "COMPLETED"
          ? "COMPLETE"
          : scrollStatus === "SCROLL_STALLED"
            ? "INCOMPLETE_READING_EXPERIENCE"
            : "MEASUREMENT_ERROR";

      /*
       * A4 — Observed Ad Unit Count
       *
       * Count only advertising units that can be automatically confirmed
       * from repeatable technical evidence.
       *
       * Generic visible iframes remain unresolved candidates until
       * additional evidence (including documented manual observation)
       * confirms that they are advertising.
       */

      const automaticallyConfirmedAdUnits = [];

      for (const slot of observedGoogleSlots.values()) {
        const renderedIframes = (slot.renderedGoogleIframes || []).filter(
          (iframe) => iframe.width > 2 && iframe.height > 1,
        );

        if (renderedIframes.length === 0) {
          continue;
        }

        automaticallyConfirmedAdUnits.push({
          source: "GOOGLE_GAM",
          id: slot.id || null,
          detectionMethod: "rendered-google-ad-slot",
          width: slot.width,
          height: slot.height,
          insideReadingRegion: slot.insideReadingRegion,
          firstObservedStep: slot.firstObservedStep,
          firstObservedScrollY: slot.firstObservedScrollY,
          firstRenderedStep: slot.firstRenderedStep,
          firstRenderedScrollY: slot.firstRenderedScrollY,
          renderedIframes,
        });
      }

      const unresolvedAdCandidates = [];

      for (const frame of observedOtherIframes.values()) {
        if (frame.a4Classification === "AUTOMATICALLY_CONFIRMED") {
          automaticallyConfirmedAdUnits.push({
            source: "NON_GOOGLE",
            id: frame.id,
            detectionMethod: frame.detectionMethod,
            width: frame.width,
            height: frame.height,
            insideReadingRegion: frame.insideReadingRegion,
            firstObservedStep: frame.firstObservedStep,
            firstObservedScrollY: frame.firstObservedScrollY,
          });
        } else {
          unresolvedAdCandidates.push({
            source: "NON_GOOGLE",
            id: frame.id,
            detectionMethod: frame.detectionMethod,
            width: frame.width,
            height: frame.height,
            insideReadingRegion: frame.insideReadingRegion,
            firstObservedStep: frame.firstObservedStep,
            firstObservedScrollY: frame.firstObservedScrollY,
          });
        }
      }

      const observedAdUnitCount = automaticallyConfirmedAdUnits.length;
      const automaticAdUnitCount = observedAdUnitCount;

      /*
       * Apply documented manual review to unresolved A4 candidates.
       *
       * Stable candidates are matched by candidate ID.
       * Candidates whose iframe IDs change between page loads can use
       * candidate_id=dynamic-uuid-iframe and are matched by candidate type
       * and observed dimensions within the same article URL.
       */
      const manualReviewResults = [];
      const remainingUnresolvedAdCandidates = [];

      for (const candidate of unresolvedAdCandidates) {
        const review = article.a4ManualReviews.find((item) => {
          if (item.candidate_type !== candidate.detectionMethod) {
            return false;
          }

          const widthMatches = Number(item.width) === candidate.width;

          const heightMatches = Number(item.height) === candidate.height;

          if (!widthMatches || !heightMatches) {
            return false;
          }

          if (item.candidate_id === "dynamic-uuid-iframe") {
            return true;
          }

          if (item.candidate_id.startsWith("anonymous-") && !candidate.id) {
            return true;
          }

          return item.candidate_id === candidate.id;
        });

        if (!review) {
          remainingUnresolvedAdCandidates.push(candidate);
          continue;
        }

        manualReviewResults.push({
          candidate,
          classification: review.classification,
          evidence: review.evidence,
          reviewNote: review.review_note,
        });

        if (review.classification === "UNRESOLVED") {
          remainingUnresolvedAdCandidates.push(candidate);
        }
      }

      const manuallyConfirmedAdUnits = manualReviewResults
        .filter((review) => review.classification === "CONFIRMED_AD")
        .map((review) => ({
          source: "MANUAL_REVIEW",
          id: review.candidate.id,
          detectionMethod: review.candidate.detectionMethod,
          width: review.candidate.width,
          height: review.candidate.height,
          insideReadingRegion: review.candidate.insideReadingRegion,
          firstObservedStep: review.candidate.firstObservedStep,
          firstObservedScrollY: review.candidate.firstObservedScrollY,
          evidence: review.evidence,
          reviewNote: review.reviewNote,
        }));

      const manuallyConfirmedAdCount = manuallyConfirmedAdUnits.length;

      /*
       * A5 — Manually confirmed advertising-related obstruction
       *
       * RELATED_AD_EXPERIENCE is not counted as an independent A4 ad unit,
       * but may contribute to A5 when manual and technical evidence
       * establishes that the candidate is part of an advertising presentation.
       */
      const manuallyConfirmedA5Obstructions = manualReviewResults
        .filter((review) => review.classification === "RELATED_AD_EXPERIENCE")
        .map((review) => ({
          id: review.candidate.id,
          detectionMethod: review.candidate.detectionMethod,
          width: review.candidate.width,
          height: review.candidate.height,
          firstObservedStep: review.candidate.firstObservedStep,
          firstObservedScrollY: review.candidate.firstObservedScrollY,
          evidence: review.evidence,
          reviewNote: review.reviewNote,
        }));

      const observedAdUnitCountBeforeMeasurementStatus =
        automaticAdUnitCount + manuallyConfirmedAdCount;

      const finalObservedAdUnitCount =
        measurementStatus === "COMPLETE"
          ? observedAdUnitCountBeforeMeasurementStatus
          : null;

      const unresolvedAdCandidateCount = remainingUnresolvedAdCandidates.length;

      /*
       * Apply manually confirmed A5 obstruction evidence to the
       * corresponding sampled viewport states.
       */
      for (const obstruction of manuallyConfirmedA5Obstructions) {
        const state = states[obstruction.firstObservedStep];

        if (!state?.a5) {
          continue;
        }

        const obstructionArea =
          Math.min(obstruction.width, viewport.width) *
          Math.min(obstruction.height, viewport.height);

        const obstructionPercent =
          (obstructionArea / (viewport.width * viewport.height)) * 100;

        /*
         * Manual obstruction evidence is used here only when it exceeds
         * the automatically measured obstruction for the sampled state.
         *
         * This avoids double-counting overlapping automatic and manual
         * evidence for the same viewport.
         */
        if (obstructionArea > state.a5.advertisingObstructionArea) {
          state.a5.advertisingObstructionArea = obstructionArea;
          state.a5.viewportObstructionRatio =
            obstructionArea / (viewport.width * viewport.height);
          state.a5.viewportObstructionPercent = Number(
            obstructionPercent.toFixed(3),
          );
        }

        state.a5.manualObstructionEvidence = {
          classification: "RELATED_AD_EXPERIENCE",
          id: obstruction.id,
          evidence: obstruction.evidence,
          reviewNote: obstruction.reviewNote,
        };
      }

      // A5 — Viewport Obstruction aggregate output
      const completedA5States = states
        .map((state) => state.a5)
        .filter((a5) => a5 && Number.isFinite(a5.viewportObstructionPercent));

      const obstructionPercents = completedA5States
        .map((a5) => a5.viewportObstructionPercent)
        .sort((a, b) => a - b);

      const maximumViewportObstruction =
        obstructionPercents.length > 0
          ? Math.max(...obstructionPercents)
          : null;

      const medianViewportObstruction =
        obstructionPercents.length === 0
          ? null
          : obstructionPercents.length % 2 === 1
            ? obstructionPercents[Math.floor(obstructionPercents.length / 2)]
            : (obstructionPercents[obstructionPercents.length / 2 - 1] +
                obstructionPercents[obstructionPercents.length / 2]) /
              2;

      const persistentObstruction =
        completedA5States.length >= 2 &&
        completedA5States.every((a5) => a5.advertisingObstructionArea > 0);

      const finalA5 =
        measurementStatus === "COMPLETE"
          ? {
              maximumViewportObstruction,
              medianViewportObstruction,
              persistentObstruction,
              sampledViewportStateCount: completedA5States.length,
            }
          : null;

      const result = {
        status: "OK",

        // Measurement observability
        measurementStatus,
        accessRestrictionDetected: accessState.accessRestrictionDetected,
        accessRestrictionEvidence: {
          restriction: accessState.restrictionEvidence,
          continuationRequirement: accessState.continuationEvidence,
        },

        scrollStatus,
        scrollSteps: states.length,

        // A4 formal output
        automaticAdUnitCount,
        manuallyConfirmedAdCount,
        observedAdUnitCountBeforeMeasurementStatus,
        finalObservedAdUnitCount,
        unresolvedAdCandidateCount,

        automaticallyConfirmedAdUnits,
        manuallyConfirmedAdUnits,
        manualReviewResults,
        remainingUnresolvedAdCandidates,

        // A5 formal output
        a5: finalA5,

        // A5 diagnostic evidence observed before interruption
        a5ObservedBeforeMeasurementStatus: {
          maximumViewportObstruction,
          medianViewportObstruction,
          persistentObstruction,
          sampledViewportStateCount: completedA5States.length,
          manuallyConfirmedObstructions: manuallyConfirmedA5Obstructions,
        },

        // Backward-compatible feasibility output
        observedAdUnitCount,
        unresolvedAdCandidates,

        // Diagnostic / feasibility output
        uniqueGoogleSlotCount: observedGoogleSlots.size,
        googleSlots: [...observedGoogleSlots.values()],
        uniqueOtherIframeCount: observedOtherIframes.size,
        otherVisibleIframes: [...observedOtherIframes.values()],

        states,
      };

      results.push({
        mediaId: article.media_id,
        mediaProperty: article.media_property,
        articleUrl: article.final_resolved_url || article.article_url,
        readingRegionSelector: article.readingRegionSelector,
        ...result,
      });
    } catch (error) {
      results.push({
        mediaId: article.media_id,
        mediaProperty: article.media_property,
        articleUrl: article.final_resolved_url || article.article_url,
        readingRegionSelector: article.readingRegionSelector,
        status: "ERROR",
        error: error.message,
      });
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}

console.log(
  JSON.stringify(
    {
      viewport,
      initialWaitMs,
      stepPx,
      stepWaitMs,
      maxScrollSteps,
      inspectedMediaCount: results.length,
      results,
    },
    null,
    2,
  ),
);
