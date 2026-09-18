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

              return {
                id: element.id || null,
                queryId: element.getAttribute("data-google-query-id") || null,
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                viewportTop: Math.round(rect.top),
                viewportBottom: Math.round(rect.bottom),
                viewportLeft: Math.round(rect.left),
                viewportRight: Math.round(rect.right),
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

          return {
            scrollY: Math.round(window.scrollY),
            documentHeight: document.documentElement.scrollHeight,
            readingRegion: {
              viewportTop: Math.round(regionRect.top),
              viewportBottom: Math.round(regionRect.bottom),
              height: Math.round(regionRect.height),
            },
            googleSlots,
            otherIframes,
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

        states.push({
          index: i,
          scrollY: state.scrollY,
          documentHeight: state.documentHeight,
          readingRegion: state.readingRegion,
          googleSlotCount: state.googleSlots.length,
          otherIframeCount: state.otherIframes.length,
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

      const observedAdUnitCountBeforeMeasurementStatus =
        automaticAdUnitCount + manuallyConfirmedAdCount;

      const finalObservedAdUnitCount =
        measurementStatus === "COMPLETE"
          ? observedAdUnitCountBeforeMeasurementStatus
          : null;

      const unresolvedAdCandidateCount = remainingUnresolvedAdCandidates.length;

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
