import fs from "node:fs/promises";
import { parse } from "csv-parse/sync";
import { chromium, devices } from "playwright";

function collectImageUrls(value, urls = new Set()) {
  if (!value) {
    return urls;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectImageUrls(item, urls);
    }

    return urls;
  }

  if (typeof value !== "object") {
    return urls;
  }

  for (const [key, child] of Object.entries(value)) {
    if (
      key === "src" &&
      typeof child === "string" &&
      /^https?:\/\//i.test(child)
    ) {
      urls.add(child);
    } else {
      collectImageUrls(child, urls);
    }
  }

  return urls;
}

function extensionFromContentType(contentType) {
  const normalized = (contentType || "").split(";")[0].trim().toLowerCase();

  switch (normalized) {
    case "image/png":
      return ".png";

    case "image/jpeg":
      return ".jpg";

    case "image/webp":
      return ".webp";

    case "image/gif":
      return ".gif";

    case "image/avif":
      return ".avif";

    case "image/svg+xml":
      return ".svg";

    default:
      return null;
  }
}

async function archiveCreativeImages(
  candidate,
  evidenceDirectory,
  captureName,
) {
  const imageUrls = [...collectImageUrls(candidate)];

  if (imageUrls.length === 0) {
    return {
      status: "NO_IMAGES",
      files: [],
    };
  }

  const files = [];

  for (const [index, url] of imageUrls.entries()) {
    try {
      const response = await fetch(url, {
        redirect: "follow",
      });

      if (!response.ok) {
        files.push({
          sourceUrl: url,
          status: "FAILED",
          httpStatus: response.status,
          reason: `HTTP ${response.status}`,
        });

        continue;
      }

      const contentType = response.headers.get("content-type");
      const extension = extensionFromContentType(contentType);

      if (!extension) {
        files.push({
          sourceUrl: url,
          status: "SKIPPED",
          contentType,
          reason: "Unsupported or unknown image Content-Type",
        });

        continue;
      }

      const fileName =
        `${captureName}-creative-${String(index + 1).padStart(2, "0")}` +
        extension;

      const filePath = `${evidenceDirectory}/${fileName}`;

      const buffer = Buffer.from(await response.arrayBuffer());

      await fs.writeFile(filePath, buffer);

      files.push({
        sourceUrl: url,
        status: "SAVED",
        fileName,
        contentType,
        byteLength: buffer.length,
      });
    } catch (error) {
      files.push({
        sourceUrl: url,
        status: "FAILED",
        reason: error.message,
      });
    }
  }

  return {
    status: files.some((file) => file.status === "SAVED")
      ? "SAVED"
      : "NOT_SAVED",
    files,
  };
}

const targetMediaId = process.argv[2] || null;

const repeatCount = Math.max(
  1,
  Number.parseInt(process.argv[3] || "1", 10) || 1,
);

const deviceCategory = process.argv[4] || "desktop";

if (!["desktop", "mobile"].includes(deviceCategory)) {
  throw new Error(
    `Unsupported device category: ${deviceCategory}. ` +
      `Use "desktop" or "mobile".`,
  );
}

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
      row.device_category === deviceCategory &&
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

const desktopContextOptions = {
  viewport: {
    width: 1440,
    height: 900,
  },
  locale: "ja-JP",
  timezoneId: "Asia/Tokyo",
  deviceScaleFactor: 1,
};

const mobileDevice = devices["iPhone 13"];

const mobileContextOptions = {
  ...mobileDevice,
  locale: "ja-JP",
  timezoneId: "Asia/Tokyo",
};

const contextOptions =
  deviceCategory === "mobile" ? mobileContextOptions : desktopContextOptions;

const viewport = contextOptions.viewport;

const initialWaitMs = 3000;
const stepPx = Math.round(viewport.height * 0.25);
const stepWaitMs = 1000;
const maxScrollSteps = 200;

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

const runId = new Date()
  .toISOString()
  .replace(/[-:]/g, "")
  .replace(/\.\d{3}Z$/, "Z");

const observations = selected.flatMap((article) =>
  Array.from({ length: repeatCount }, (_, index) => ({
    ...article,
    observationIndex: index + 1,
  })),
);

const results = [];

try {
  for (const article of observations) {
    console.error(
      `Inspecting ${article.media_id} ${article.media_property} ` +
        `(observation ${article.observationIndex}/${repeatCount})`,
    );

    const context = await browser.newContext(contextOptions);

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

      /*
       * Advertising creative evidence capture
       *
       * Preserve visual evidence separately from A4-A7 classification.
       * Capturing a candidate does not itself classify the element as advertising.
       */
      const capturedCreativeKeys = new Set();

      const evidenceDirectory =
        `evidence/ad-creatives/${article.media_id}/${deviceCategory}` +
        `/run-${runId}` +
        `/observation-${String(article.observationIndex).padStart(2, "0")}`;

      await fs.mkdir(evidenceDirectory, {
        recursive: true,
      });

      let stalledScrollCount = 0;
      let scrollStatus = "IN_PROGRESS";

      /*
       * Post-article observation window
       *
       * A4 and A7 are scoped to the validated Article Reading Region.
       * A5 and A6 continue for a finite distance after leaving that region
       * so that post-article advertising experiences can be observed without
       * following publisher infinite-scroll feeds indefinitely.
       */
      const postArticleViewportCount = 5;
      const postArticleObservationDistance =
        viewport.height * postArticleViewportCount;

      let postArticleStartScrollY = null;

      const regionExists = await page.evaluate((selector) => {
        return Boolean(document.querySelector(selector));
      }, article.readingRegionSelector);

      if (!regionExists) {
        results.push({
          observationIndex: article.observationIndex,
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

              /*
               * A7 — Content Interruption DOM position
               *
               * Resolve the Google advertising slot to the direct child of the
               * validated Article Reading Region that contains the placement.
               *
               * Multiple advertising iframes may belong to the same direct
               * child. A7 treats that direct-child placement as one candidate
               * interruption rather than counting each iframe separately.
               */
              const readingRegionChildren = [...readingRegion.children];

              let directChild = element;

              while (
                directChild &&
                directChild.parentElement !== readingRegion
              ) {
                directChild = directChild.parentElement;
              }

              const belongsToReadingRegion =
                directChild?.parentElement === readingRegion;

              const directChildIndex = belongsToReadingRegion
                ? readingRegionChildren.indexOf(directChild)
                : -1;

              const isEditorialTextBlock = (node) =>
                ["P", "H1", "H2", "H3", "H4"].includes(node.tagName) &&
                (node.innerText || "").trim().length > 0;

              const editorialBeforeCount =
                directChildIndex >= 0
                  ? readingRegionChildren
                      .slice(0, directChildIndex)
                      .filter(isEditorialTextBlock).length
                  : 0;

              const editorialAfterCount =
                directChildIndex >= 0
                  ? readingRegionChildren
                      .slice(directChildIndex + 1)
                      .filter(isEditorialTextBlock).length
                  : 0;

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

                  /*
                   * Creative / advertiser evidence
                   *
                   * Google advertising iframes may be same-origin accessible in
                   * some observations and cross-origin inaccessible in others.
                   *
                   * Preserve only directly observable evidence here.
                   * Advertiser identity is derived separately from this evidence.
                   */
                  let creativeEvidence = {
                    accessible: false,
                    bodyText: null,
                    anchors: [],
                    images: [],
                    videos: [],
                  };

                  try {
                    const iframeDocument =
                      iframe.contentDocument ||
                      iframe.contentWindow?.document ||
                      null;

                    if (iframeDocument) {
                      const bodyText =
                        (iframeDocument.body?.innerText || "")
                          .trim()
                          .slice(0, 5000) || null;

                      const anchors = [
                        ...iframeDocument.querySelectorAll("a"),
                      ].map((anchor) => {
                        const href =
                          anchor.href || anchor.getAttribute("href") || null;

                        let adUrl = null;
                        let landingDomain = null;

                        if (href) {
                          try {
                            const parsed = new URL(href);

                            adUrl =
                              parsed.searchParams.get("adurl") ||
                              parsed.searchParams.get("url") ||
                              null;

                            if (adUrl) {
                              try {
                                landingDomain = new URL(adUrl).hostname;
                              } catch {
                                landingDomain = null;
                              }
                            }
                          } catch {
                            // Preserve the raw href even when URL parsing fails.
                          }
                        }

                        return {
                          text:
                            (anchor.innerText || "").trim().slice(0, 1000) ||
                            null,
                          href,
                          adUrl,
                          landingDomain,
                        };
                      });

                      const images = [
                        ...iframeDocument.querySelectorAll("img"),
                      ].map((image) => ({
                        src:
                          image.currentSrc || image.getAttribute("src") || null,
                        alt: image.alt || null,
                        width: image.naturalWidth || null,
                        height: image.naturalHeight || null,
                      }));

                      const videos = [
                        ...iframeDocument.querySelectorAll("video"),
                      ].map((video) => ({
                        src:
                          video.currentSrc || video.getAttribute("src") || null,
                        poster: video.getAttribute("poster") || null,
                        width: video.videoWidth || null,
                        height: video.videoHeight || null,
                      }));

                      creativeEvidence = {
                        accessible: true,
                        bodyText,
                        anchors,
                        images,
                        videos,
                      };
                    }
                  } catch {
                    /*
                     * Cross-origin advertising iframe.
                     *
                     * This is expected for many advertising creatives and is
                     * not treated as a measurement error.
                     */
                  }

                  return {
                    id: iframe.id || null,
                    src: iframe.getAttribute("src"),
                    width: Math.round(iframeRect.width),
                    height: Math.round(iframeRect.height),
                    creativeEvidence,
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

                // A7 — Content Interruption evidence
                directChildIndex:
                  directChildIndex >= 0 ? directChildIndex : null,

                editorialBeforeCount,
                editorialAfterCount,

                qualifiesAsInContentInterruption:
                  belongsToReadingRegion &&
                  elementStyle.position === "static" &&
                  editorialBeforeCount > 0 &&
                  editorialAfterCount > 0,

                googleIframeCount: googleIframes.length,

                renderedGoogleIframeCount: renderedGoogleIframes.length,

                renderedGoogleIframes,
              };
            });

          /*
           * A5/A6 — OGY fixed/sticky advertising presentation
           *
           * OGY mobile advertising observed on A01 uses a presentation
           * container whose position becomes fixed after the creative is
           * loaded. The creative iframe itself may remain position: static.
           *
           * Require multiple structural signals before treating the
           * presentation as confirmed advertising evidence:
           *
           * - container ID begins with ogy-root-container-
           * - container class identifies an OGY advertising presentation
           * - an OGY iframe exists inside the container
           * - presentation is fixed or sticky
           * - presentation is visible and intersects the viewport
           *
           * The rule identifies the advertising presentation only. It does
           * not infer advertiser identity, transaction type, or creative type.
           */
          const ogyAdvertisingPresentations = [
            ...document.querySelectorAll("[id^='ogy-root-container-']"),
          ]
            .filter((element) => {
              const rect = element.getBoundingClientRect();
              const style = getComputedStyle(element);

              const iframe = element.querySelector("iframe[id^='ogy-iframe-']");

              if (!iframe) {
                return false;
              }

              const iframeRect = iframe.getBoundingClientRect();
              const iframeStyle = getComputedStyle(iframe);

              const containerVisible =
                rect.width > 0 &&
                rect.height > 0 &&
                style.display !== "none" &&
                style.visibility !== "hidden" &&
                style.opacity !== "0";

              const iframeVisible =
                iframeRect.width > 0 &&
                iframeRect.height > 0 &&
                iframeStyle.display !== "none" &&
                iframeStyle.visibility !== "hidden" &&
                iframeStyle.opacity !== "0";

              const intersectsViewport =
                rect.bottom > 0 &&
                rect.top < window.innerHeight &&
                rect.right > 0 &&
                rect.left < window.innerWidth;

              return (
                ["fixed", "sticky"].includes(style.position) &&
                containerVisible &&
                iframeVisible &&
                intersectsViewport
              );
            })
            .map((element) => {
              const rect = element.getBoundingClientRect();
              const style = getComputedStyle(element);

              const iframe = element.querySelector("iframe[id^='ogy-iframe-']");

              const iframeRect = iframe.getBoundingClientRect();
              const iframeStyle = getComputedStyle(iframe);

              return {
                id: element.id || null,
                className: element.className || null,
                iframeId: iframe.id || null,
                iframeSrc: iframe.getAttribute("src") || null,

                width: Math.round(rect.width),
                height: Math.round(rect.height),
                viewportTop: Math.round(rect.top),
                viewportBottom: Math.round(rect.bottom),
                viewportLeft: Math.round(rect.left),
                viewportRight: Math.round(rect.right),

                iframeWidth: Math.round(iframeRect.width),
                iframeHeight: Math.round(iframeRect.height),
                iframeDisplay: iframeStyle.display,
                iframeVisibility: iframeStyle.visibility,

                position: style.position,
                zIndex: style.zIndex,

                detectionMethod:
                  "ogy-fixed-sticky-visible-iframe-advertising-presentation",
              };
            });

          /*
           * A5/A6 — Celtra advertising presentation
           *
           * Detect a rendered Celtra advertising presentation from explicit
           * DOM structure observed during A02 mobile feasibility testing.
           *
           * Require multiple structural signals:
           *
           * - host class identifies a Celtra advertising presentation
           * - .celtra-content exists inside the host
           * - a visible iframe exists inside .celtra-content
           * - the presentation intersects the viewport
           *
           * Geometry is recorded separately from advertising identification.
           * Presentation size must not itself be used to infer advertising.
           *
           * This rule identifies advertising presentation evidence only.
           * It does not infer advertiser identity, transaction type,
           * campaign type, or creative type.
           */
          const celtraAdvertisingPresentations = [
            ...document.querySelectorAll(".celtra-ad-v3.celtra-ad-inline-host"),
          ]
            .map((host) => {
              const content = host.querySelector(".celtra-content");

              if (!content) {
                return null;
              }

              const iframe = content.querySelector("iframe");

              if (!iframe) {
                return null;
              }

              const hostRect = host.getBoundingClientRect();
              const hostStyle = getComputedStyle(host);

              const contentRect = content.getBoundingClientRect();
              const contentStyle = getComputedStyle(content);

              const iframeRect = iframe.getBoundingClientRect();
              const iframeStyle = getComputedStyle(iframe);

              const hostVisible =
                hostRect.width > 0 &&
                hostRect.height > 0 &&
                hostStyle.display !== "none" &&
                hostStyle.visibility !== "hidden" &&
                hostStyle.opacity !== "0";

              const contentVisible =
                contentRect.width > 0 &&
                contentRect.height > 0 &&
                contentStyle.display !== "none" &&
                contentStyle.visibility !== "hidden" &&
                contentStyle.opacity !== "0";

              const iframeVisible =
                iframeRect.width > 0 &&
                iframeRect.height > 0 &&
                iframeStyle.display !== "none" &&
                iframeStyle.visibility !== "hidden" &&
                iframeStyle.opacity !== "0";

              const intersectsViewport =
                contentRect.bottom > 0 &&
                contentRect.top < window.innerHeight &&
                contentRect.right > 0 &&
                contentRect.left < window.innerWidth;

              if (
                !hostVisible ||
                !contentVisible ||
                !iframeVisible ||
                !intersectsViewport
              ) {
                return null;
              }

              return {
                hostId: host.id || null,
                hostClassName:
                  typeof host.className === "string" ? host.className : null,

                contentClassName:
                  typeof content.className === "string"
                    ? content.className
                    : null,

                iframeId: iframe.id || null,
                iframeSrc: iframe.getAttribute("src") || null,

                width: Math.round(contentRect.width),
                height: Math.round(contentRect.height),
                viewportTop: Math.round(contentRect.top),
                viewportBottom: Math.round(contentRect.bottom),
                viewportLeft: Math.round(contentRect.left),
                viewportRight: Math.round(contentRect.right),

                iframeWidth: Math.round(iframeRect.width),
                iframeHeight: Math.round(iframeRect.height),

                position: contentStyle.position,
                zIndex: contentStyle.zIndex,

                detectionMethod:
                  "celtra-visible-iframe-advertising-presentation",
              };
            })
            .filter(Boolean);

          /*
           * Native / in-feed advertising presentations
           *
           * Detect publisher-declared in-feed advertising structures from
           * explicit DOM evidence.
           *
           * Pilot 01 currently includes a Nikkei implementation using:
           *
           *   data-kad="true"
           *   data-kad-type="infeed"
           *
           * These attributes identify the observed presentation structure.
           * Additional PR-label, click-tracking, impression-tracking, and
           * creative-image evidence is preserved independently.
           *
           * This does not infer transaction type, advertiser identity,
           * campaign type, or commercial arrangement.
           */
          const nativeAdvertisingCandidates = [
            ...document.querySelectorAll(
              '[data-kad="true"][data-kad-type="infeed"]',
            ),
          ].map((element) => {
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);

            const links = [...element.querySelectorAll("a[href]")].map(
              (link) => ({
                href: link.href || link.getAttribute("href") || null,
                text: (link.innerText || "").trim().slice(0, 1000) || null,
              }),
            );

            const images = [...element.querySelectorAll("img")].map(
              (image) => ({
                src: image.currentSrc || image.getAttribute("src") || null,
                alt: image.getAttribute("alt") || null,
                width: image.naturalWidth || null,
                height: image.naturalHeight || null,
              }),
            );

            const prEvidence = images.filter(
              (image) => (image.alt || "").trim().toUpperCase() === "PR",
            );

            const clickEvidence = links.filter((link) => {
              try {
                const url = new URL(link.href);

                return (
                  url.hostname === "nkis.nikkei.com" &&
                  url.pathname.startsWith("/pub_click/")
                );
              } catch {
                return false;
              }
            });

            const impressionEvidence = images.filter((image) => {
              try {
                const url = new URL(image.src);

                return (
                  url.hostname === "nkis.nikkei.com" && url.pathname === "/imp"
                );
              } catch {
                return false;
              }
            });

            const creativeImages = images.filter((image) => {
              try {
                const url = new URL(image.src);

                return (
                  url.hostname === "nkispa.nikkei.com" &&
                  !url.pathname.startsWith("/imp")
                );
              } catch {
                return false;
              }
            });

            const insideReadingRegion =
              readingRegion === element || readingRegion.contains(element);

            return {
              detectionMethod: "nikkei-kad-infeed",

              kadId: element.getAttribute("data-kad-id") || null,
              kadType: element.getAttribute("data-kad-type") || null,
              kadViewable: element.getAttribute("data-kad-viewable") || null,
              kadInfeedTitleStyleType:
                element.getAttribute("data-kad-infeed-title-style-type") ||
                null,

              prLabelPresent: prEvidence.length > 0,

              text: (element.innerText || "").trim().slice(0, 2000) || null,

              clickEvidence,
              impressionEvidence,
              creativeImages,

              insideReadingRegion,

              width: Math.round(rect.width),
              height: Math.round(rect.height),
              viewportTop: Math.round(rect.top),
              viewportBottom: Math.round(rect.bottom),
              viewportLeft: Math.round(rect.left),
              viewportRight: Math.round(rect.right),

              position: style.position,
              display: style.display,
              visibility: style.visibility,
            };
          });

          /*
           * Native / in-feed advertising presentations
           *
           * Detect rendered advertising presentations that expose explicit
           * advertising-delivery evidence in the DOM.
           *
           * data-kad="true" identifies the delivery container observed on
           * Nikkei. Confirmation requires both click and impression evidence;
           * the KAD marker alone is not sufficient.
           *
           * This detector records advertising evidence only. It does not infer
           * advertiser identity, transaction type, or whether the presentation
           * is inside the Article Reading Region.
           */

          const nativeAdvertisingPresentations = nativeAdvertisingCandidates
            .filter((candidate) => {
              /*
               * A KAD container alone is not sufficient evidence that an
               * advertising presentation was actually rendered.
               *
               * Confirm the presentation only when the observed DOM contains
               * explicit advertising-delivery evidence.
               *
               * For the Nikkei KAD implementation observed in Pilot 01:
               *
               * - /pub_click/ provides click-tracking evidence
               * - /imp provides impression-tracking evidence
               *
               * PR labels and creative images are preserved as supporting
               * evidence, but are not required for confirmation because some
               * KAD presentation types may not expose them.
               */
              return (
                candidate.clickEvidence.length > 0 &&
                candidate.impressionEvidence.length > 0
              );
            })
            .map((presentation) => ({
              ...presentation,
              detectionMethod: "nikkei-kad-confirmed-advertising-presentation",
            }));

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

              /*
               * A5/A6 — Fixed/sticky presentation ancestor
               *
               * An advertising iframe may itself remain position: static while a
               * containing presentation element is fixed or sticky in the viewport.
               * Preserve the nearest such ancestor as candidate obstruction evidence.
               *
               * This is evidence only. Advertising association is determined separately
               * and must not be inferred solely from fixed/sticky positioning.
               */
              let presentationAncestor = element.parentElement;
              let fixedOrStickyAncestor = null;

              while (presentationAncestor) {
                const ancestorStyle = getComputedStyle(presentationAncestor);

                if (["fixed", "sticky"].includes(ancestorStyle.position)) {
                  const ancestorRect =
                    presentationAncestor.getBoundingClientRect();

                  const visible =
                    ancestorRect.width > 0 &&
                    ancestorRect.height > 0 &&
                    ancestorStyle.display !== "none" &&
                    ancestorStyle.visibility !== "hidden";

                  const intersectsViewport =
                    ancestorRect.bottom > 0 &&
                    ancestorRect.top < window.innerHeight &&
                    ancestorRect.right > 0 &&
                    ancestorRect.left < window.innerWidth;

                  if (visible && intersectsViewport) {
                    fixedOrStickyAncestor = {
                      tag: presentationAncestor.tagName,
                      id: presentationAncestor.id || null,
                      className:
                        typeof presentationAncestor.className === "string"
                          ? presentationAncestor.className
                          : null,
                      position: ancestorStyle.position,
                      zIndex: ancestorStyle.zIndex,
                      width: Math.round(ancestorRect.width),
                      height: Math.round(ancestorRect.height),
                      viewportTop: Math.round(ancestorRect.top),
                      viewportBottom: Math.round(ancestorRect.bottom),
                      viewportLeft: Math.round(ancestorRect.left),
                      viewportRight: Math.round(ancestorRect.right),
                    };

                    break;
                  }
                }

                presentationAncestor = presentationAncestor.parentElement;
              }

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

                fixedOrStickyAncestor,
              };
            });

          /*
           * Diagnostic — visible fixed/sticky elements
           *
           * Preserve all visible fixed/sticky viewport elements so that
           * advertising evidence rules can be validated independently from
           * presentation detection.
           */
          const fixedStickyCandidates = [...document.querySelectorAll("*")]
            .filter((element) => {
              const style = getComputedStyle(element);

              if (!["fixed", "sticky"].includes(style.position)) {
                return false;
              }

              const rect = element.getBoundingClientRect();

              return (
                rect.width > 0 &&
                rect.height > 0 &&
                style.display !== "none" &&
                style.visibility !== "hidden" &&
                rect.bottom > 0 &&
                rect.top < window.innerHeight &&
                rect.right > 0 &&
                rect.left < window.innerWidth
              );
            })
            .map((element) => {
              const rect = element.getBoundingClientRect();
              const style = getComputedStyle(element);

              return {
                tag: element.tagName,
                id: element.id || null,
                className:
                  typeof element.className === "string"
                    ? element.className
                    : null,

                position: style.position,
                zIndex: style.zIndex,

                width: Math.round(rect.width),
                height: Math.round(rect.height),
                viewportTop: Math.round(rect.top),
                viewportBottom: Math.round(rect.bottom),
                viewportLeft: Math.round(rect.left),
                viewportRight: Math.round(rect.right),

                iframeCount: element.querySelectorAll("iframe").length,

                imageCount: element.querySelectorAll("img").length,

                linkCount: element.querySelectorAll("a[href]").length,

                text: (element.innerText || "")
                  .trim()
                  .replace(/\s+/g, " ")
                  .slice(0, 300),

                htmlPreview: element.outerHTML
                  .replace(/\s+/g, " ")
                  .slice(0, 1000),
              };
            });

          /*
           * A5/A6 — Confirmed fixed/sticky advertising presentations
           *
           * Detect visible fixed/sticky viewport elements whose descendants
           * provide independent advertising evidence.
           *
           * Fixed/sticky positioning alone is not sufficient. A presentation
           * is confirmed only when its subtree contains advertising-delivery,
           * creative, or click-destination evidence.
           *
           * This intentionally avoids media-specific selectors such as
           * #Tsuibi so that the same rule can be evaluated across Pilot 01
           * properties.
           */
          const fixedAdvertisingPresentations = [
            ...document.querySelectorAll("*"),
          ]
            .filter((element) => {
              const style = getComputedStyle(element);

              if (!["fixed", "sticky"].includes(style.position)) {
                return false;
              }

              const rect = element.getBoundingClientRect();

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
              const style = getComputedStyle(element);

              const descendantIframes = [...element.querySelectorAll("iframe")];

              const descendantImages = [...element.querySelectorAll("img")];

              const descendantLinks = [...element.querySelectorAll("a[href]")];

              const iframeEvidence = descendantIframes
                .map((iframe) => ({
                  id: iframe.id || null,
                  src: iframe.getAttribute("src") || null,
                }))
                .filter(({ id, src }) => {
                  const value = `${id || ""} ${src || ""}`.toLowerCase();

                  return (
                    value.includes("google_ads_iframe") ||
                    value.includes("doubleclick") ||
                    value.includes("googlesyndication") ||
                    value.includes("fif_slot__")
                  );
                });

              const imageEvidence = descendantImages
                .map((image) => ({
                  src: image.currentSrc || image.getAttribute("src") || null,
                  alt: image.getAttribute("alt") || null,
                }))
                .filter(({ src }) => {
                  const value = (src || "").toLowerCase();

                  return (
                    value.includes("googlesyndication") ||
                    value.includes("doubleclick")
                  );
                });

              const clickEvidence = descendantLinks
                .map((link) => ({
                  href: link.href || link.getAttribute("href") || null,
                  text: (link.innerText || "").trim().slice(0, 200),
                }))
                .filter(({ href }) => {
                  const value = (href || "").toLowerCase();

                  return (
                    value.includes("doubleclick") ||
                    value.includes("googleadservices") ||
                    value.includes("googlesyndication")
                  );
                });

              const advertisingEvidenceCount =
                iframeEvidence.length +
                imageEvidence.length +
                clickEvidence.length;

              if (advertisingEvidenceCount === 0) {
                return null;
              }

              return {
                tag: element.tagName,
                id: element.id || null,
                className:
                  typeof element.className === "string"
                    ? element.className
                    : null,
                position: style.position,
                zIndex: style.zIndex,
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                viewportTop: Math.round(rect.top),
                viewportBottom: Math.round(rect.bottom),
                viewportLeft: Math.round(rect.left),
                viewportRight: Math.round(rect.right),

                advertisingEvidenceCount,

                evidence: {
                  iframes: iframeEvidence,
                  images: imageEvidence,
                  clicks: clickEvidence,
                },
              };
            })
            .filter(Boolean);

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
            ogyAdvertisingPresentations,
            celtraAdvertisingPresentations,
            nativeAdvertisingCandidates,
            nativeAdvertisingPresentations,
            fixedStickyCandidates,
            fixedAdvertisingPresentations,
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

        const googleA5ConfirmedRects = state.googleSlots
          .filter(
            (slot) =>
              slot.renderedGoogleIframeCount > 0 &&
              ["fixed", "sticky"].includes(slot.position),
          )
          .map((slot) => clipRectToViewport(slot, viewport))
          .filter(Boolean);

        const ogyA5ConfirmedRects = state.ogyAdvertisingPresentations
          .map((presentation) => clipRectToViewport(presentation, viewport))
          .filter(Boolean);

        const celtraA5ConfirmedRects = state.celtraAdvertisingPresentations
          .map((presentation) => clipRectToViewport(presentation, viewport))
          .filter(Boolean);

        const fixedPresentationA5ConfirmedRects =
          state.fixedAdvertisingPresentations
            .map((presentation) => clipRectToViewport(presentation, viewport))
            .filter(Boolean);

        /*
         * A5 — Confirmed advertising obstruction geometry
         *
         * Combine confirmed fixed/sticky advertising presentations from
         * multiple detection paths. calculateUnionArea() prevents overlapping
         * detections of the same presentation from being double-counted.
         */
        const a5ConfirmedRects = [
          ...googleA5ConfirmedRects,
          ...ogyA5ConfirmedRects,
          ...celtraA5ConfirmedRects,
          ...fixedPresentationA5ConfirmedRects,
        ];

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

        /*
         * Advertising creative evidence capture
         *
         * This evidence layer is intentionally independent from A4-A7.
         * A screenshot records what was presented to the user; it does not
         * by itself establish advertiser identity or advertising status.
         */

        const evidenceCandidates = [];

        for (const slot of state.googleSlots) {
          if (slot.renderedGoogleIframeCount <= 0) {
            continue;
          }

          evidenceCandidates.push({
            type: "GOOGLE_SLOT",
            key: `google:${slot.id || slot.queryId}`,
            id: slot.id || null,
            queryId: slot.queryId || null,
            geometry: {
              top: slot.viewportTop,
              bottom: slot.viewportBottom,
              left: slot.viewportLeft,
              right: slot.viewportRight,
              width: slot.width,
              height: slot.height,
            },
            evidence: {
              renderedGoogleIframes: slot.renderedGoogleIframes,
            },
          });
        }

        for (const presentation of state.ogyAdvertisingPresentations) {
          evidenceCandidates.push({
            type: "OGY_PRESENTATION",
            key: `ogy:${presentation.id || presentation.iframeId}`,
            id: presentation.id || null,
            geometry: {
              top: presentation.viewportTop,
              bottom: presentation.viewportBottom,
              left: presentation.viewportLeft,
              right: presentation.viewportRight,
              width: presentation.width,
              height: presentation.height,
            },
            evidence: presentation,
          });
        }

        for (const presentation of state.fixedAdvertisingPresentations) {
          const imageFingerprint = (presentation.evidence?.images || [])
            .map((image) => image.src)
            .filter(Boolean)
            .join("|");

          const clickFingerprint = (presentation.evidence?.clicks || [])
            .map((click) => click.href)
            .filter(Boolean)
            .join("|");

          const fingerprint =
            imageFingerprint ||
            clickFingerprint ||
            presentation.id ||
            presentation.className ||
            "unknown";

          evidenceCandidates.push({
            type: "FIXED_ADVERTISING_PRESENTATION",
            key: `fixed:${fingerprint}`,
            id: presentation.id || null,
            geometry: {
              top: presentation.viewportTop,
              bottom: presentation.viewportBottom,
              left: presentation.viewportLeft,
              right: presentation.viewportRight,
              width: presentation.width,
              height: presentation.height,
            },
            evidence: presentation,
          });
        }

        /*
         * Preserve the full-screen interactive layer separately.
         *
         * This is intentionally classified as UNRESOLVED here. Its presence
         * proves an interactive overlay was shown, but does not by itself
         * prove that the overlay was advertising.
         */
        const interactiveOverlay = state.fixedStickyCandidates.find(
          (candidate) => candidate.id === "hs-web-interactives-top-anchor",
        );

        if (interactiveOverlay) {
          evidenceCandidates.push({
            type: "INTERACTIVE_OVERLAY",
            key: "interactive:hs-web-interactives-top-anchor",
            id: interactiveOverlay.id,
            advertisingStatus: "UNRESOLVED",
            geometry: {
              top: interactiveOverlay.viewportTop,
              bottom: interactiveOverlay.viewportBottom,
              left: interactiveOverlay.viewportLeft,
              right: interactiveOverlay.viewportRight,
              width: interactiveOverlay.width,
              height: interactiveOverlay.height,
            },
            evidence: interactiveOverlay,
          });
        }

        for (const candidate of evidenceCandidates) {
          if (capturedCreativeKeys.has(candidate.key)) {
            continue;
          }

          capturedCreativeKeys.add(candidate.key);

          const safeType = candidate.type
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");

          const captureName = `step-${String(i).padStart(3, "0")}-${safeType}`;

          const viewportPath = `${evidenceDirectory}/${captureName}-viewport.png`;

          const evidencePath = `${evidenceDirectory}/${captureName}-evidence.json`;

          await page.screenshot({
            path: viewportPath,
            fullPage: false,
          });

          /*
           * Creative archive
           *
           * Preserve directly observable image creatives as local evidence.
           * The archive is independent from advertiser identification:
           * saving an image does not establish who the advertiser is.
           *
           * Content-Type, rather than the source URL suffix, determines the
           * local file extension because advertising image URLs frequently
           * contain no filename extension.
           */
          const creativeArchive = await archiveCreativeImages(
            candidate,
            evidenceDirectory,
            captureName,
          );

          await fs.writeFile(
            evidencePath,
            JSON.stringify(
              {
                mediaId: article.media_id,
                mediaProperty: article.media_property,
                articleUrl: article.final_resolved_url || article.article_url,
                deviceCategory,
                observationIndex: article.observationIndex,
                step: i,
                scrollY: state.scrollY,
                capturedAt: new Date().toISOString(),
                candidate,
                creativeArchive,
              },
              null,
              2,
            ),
            "utf8",
          );
        }

        const measurementRegion =
          state.readingRegion.viewportBottom <= viewport.height
            ? "POST_ARTICLE"
            : "ARTICLE_READING_REGION";

        if (
          measurementRegion === "POST_ARTICLE" &&
          postArticleStartScrollY === null
        ) {
          postArticleStartScrollY = state.scrollY;
        }

        states.push({
          index: i,
          scrollY: state.scrollY,
          documentHeight: state.documentHeight,
          readingRegion: state.readingRegion,

          measurementRegion,
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

            // A7 diagnostic evidence
            directChildIndex: slot.directChildIndex,
            editorialBeforeCount: slot.editorialBeforeCount,
            editorialAfterCount: slot.editorialAfterCount,
            qualifiesAsInContentInterruption:
              slot.qualifiesAsInContentInterruption,
          })),

          ogyAdvertisingPresentations: state.ogyAdvertisingPresentations.map(
            (presentation) => ({
              id: presentation.id,
              className: presentation.className,
              iframeId: presentation.iframeId,
              iframeSrc: presentation.iframeSrc,
              viewportTop: presentation.viewportTop,
              viewportBottom: presentation.viewportBottom,
              viewportLeft: presentation.viewportLeft,
              viewportRight: presentation.viewportRight,
              width: presentation.width,
              height: presentation.height,
              position: presentation.position,
              zIndex: presentation.zIndex,
              detectionMethod: presentation.detectionMethod,
            }),
          ),

          celtraAdvertisingPresentations:
            state.celtraAdvertisingPresentations.map((presentation) => ({
              hostId: presentation.hostId,
              hostClassName: presentation.hostClassName,
              contentClassName: presentation.contentClassName,
              iframeId: presentation.iframeId,
              iframeSrc: presentation.iframeSrc,

              viewportTop: presentation.viewportTop,
              viewportBottom: presentation.viewportBottom,
              viewportLeft: presentation.viewportLeft,
              viewportRight: presentation.viewportRight,
              width: presentation.width,
              height: presentation.height,

              iframeWidth: presentation.iframeWidth,
              iframeHeight: presentation.iframeHeight,

              position: presentation.position,
              zIndex: presentation.zIndex,

              detectionMethod: presentation.detectionMethod,
            })),

          nativeAdvertisingCandidates: state.nativeAdvertisingCandidates.map(
            (candidate) => ({
              kadId: candidate.kadId,
              kadType: candidate.kadType,
              kadViewable: candidate.kadViewable,
              kadInfeedTitleStyleType: candidate.kadInfeedTitleStyleType,
              prLabelPresent: candidate.prLabelPresent,
              text: candidate.text,
              clickEvidence: candidate.clickEvidence,
              impressionEvidence: candidate.impressionEvidence,
              creativeImages: candidate.creativeImages,
              insideReadingRegion: candidate.insideReadingRegion,
              viewportTop: candidate.viewportTop,
              viewportBottom: candidate.viewportBottom,
              viewportLeft: candidate.viewportLeft,
              viewportRight: candidate.viewportRight,
              width: candidate.width,
              height: candidate.height,
              position: candidate.position,
              display: candidate.display,
              visibility: candidate.visibility,
              detectionMethod: candidate.detectionMethod,
            }),
          ),

          nativeAdvertisingPresentations:
            state.nativeAdvertisingPresentations.map((presentation) => ({
              kadId: presentation.kadId,
              kadType: presentation.kadType,
              kadViewable: presentation.kadViewable,
              kadInfeedTitleStyleType: presentation.kadInfeedTitleStyleType,
              prLabelPresent: presentation.prLabelPresent,
              text: presentation.text,
              clickEvidence: presentation.clickEvidence,
              impressionEvidence: presentation.impressionEvidence,
              creativeImages: presentation.creativeImages,
              insideReadingRegion: presentation.insideReadingRegion,
              viewportTop: presentation.viewportTop,
              viewportBottom: presentation.viewportBottom,
              viewportLeft: presentation.viewportLeft,
              viewportRight: presentation.viewportRight,
              width: presentation.width,
              height: presentation.height,
              position: presentation.position,
              display: presentation.display,
              visibility: presentation.visibility,
              detectionMethod: presentation.detectionMethod,
            })),

          fixedStickyCandidates: state.fixedStickyCandidates,
          fixedAdvertisingPresentations: state.fixedAdvertisingPresentations,

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

        /*
         * Finite post-article observation window
         *
         * Stop after observing five viewport heights beyond the point where
         * the validated Article Reading Region leaves the reading path.
         * This prevents infinite/lazy post-article feeds from defining the
         * measurement duration.
         */
        const reachedPostArticleObservationEnd =
          postArticleStartScrollY !== null &&
          state.scrollY - postArticleStartScrollY >=
            postArticleObservationDistance;

        if (reachedPostArticleObservationEnd) {
          scrollStatus = "POST_ARTICLE_WINDOW_COMPLETED";
          break;
        }

        /*
         * Reading-region / page-end state
         *
         * A4 and A7 remain scoped to the Article Reading Region.
         * A5 and A6 continue observing the page after the reading region
         * so that post-article advertising presentations can be measured.
         */

        const maxScrollYBefore = Math.max(
          0,
          state.documentHeight - viewport.height,
        );

        const reachedPageEnd = state.scrollY >= maxScrollYBefore - 2;

        if (reachedPageEnd) {
          scrollStatus = "COMPLETED";
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

        const documentHeightAfter = await page.evaluate(
          () => document.documentElement.scrollHeight,
        );

        const maxScrollYAfter = Math.max(
          0,
          documentHeightAfter - viewport.height,
        );

        if (scrollYAfter >= maxScrollYAfter - 2) {
          scrollStatus = "COMPLETED";
          break;
        }

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

      if (scrollStatus === "IN_PROGRESS") {
        scrollStatus = "MAX_SCROLL_STEPS_REACHED";
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

      const measurementCompleted =
        scrollStatus === "COMPLETED" ||
        scrollStatus === "POST_ARTICLE_WINDOW_COMPLETED";

      const measurementStatus = accessState.accessRestrictionDetected
        ? "PARTIALLY_OBSERVABLE_ACCESS_RESTRICTED"
        : measurementCompleted
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
        /*
         * A4 is scoped strictly to the Article Reading Region.
         * Advertising first observed outside that region may be relevant
         * to A5/A6, but must not increase the A4 ad-unit count.
         */
        if (!slot.insideReadingRegion) {
          continue;
        }

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
        /*
         * Keep A4 scoped to the Article Reading Region.
         */
        if (!frame.insideReadingRegion) {
          continue;
        }

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

      /*
       * A6 — Intrusive Ad Formats
       *
       * Phase 1 derives only formats that can be established from
       * technical evidence already collected for A5.
       *
       * A5 measures the extent of viewport obstruction.
       * A6 classifies the observable intrusive advertising format.
       */

      const stickyAdvertisingDetected = states.some(
        (state) =>
          state.googleSlots.some(
            (slot) =>
              slot.renderedGoogleIframeCount > 0 &&
              ["fixed", "sticky"].includes(slot.position),
          ) ||
          state.ogyAdvertisingPresentations.length > 0 ||
          state.fixedAdvertisingPresentations.length > 0,
      );

      const advertisingCoveringEditorialContentDetected = states.some(
        (state) => state.a5?.coversEditorialText === true,
      );

      /*
       * A6 uses explicit classification states rather than booleans.
       *
       * DETECTED:
       *   sufficient technical evidence was observed.
       *
       * NOT_DETECTED:
       *   the complete Article Experience Window was observable and no
       *   qualifying evidence was detected.
       *
       * NOT_OBSERVABLE:
       *   the Article Experience Window could not be observed sufficiently
       *   to support a negative classification.
       *
       * UNRESOLVED:
       *   reserved for intrusive behavior that is observable but whose
       *   relationship to advertising or format cannot be established.
       *   Phase 1 does not yet automatically assign UNRESOLVED to these
       *   two supported formats.
       */
      const classifyA6Phase1 = (detected) => {
        if (detected) {
          return "DETECTED";
        }

        if (measurementStatus === "COMPLETE") {
          return "NOT_DETECTED";
        }

        return "NOT_OBSERVABLE";
      };

      const observedA6 = {
        stickyAdvertising: classifyA6Phase1(stickyAdvertisingDetected),
        advertisingCoveringEditorialContent: classifyA6Phase1(
          advertisingCoveringEditorialContentDetected,
        ),
      };

      const finalA6 =
        measurementStatus === "COMPLETE"
          ? observedA6
          : {
              stickyAdvertising: "NOT_OBSERVABLE",
              advertisingCoveringEditorialContent: "NOT_OBSERVABLE",
            };

      /*
       * A7 — Content Interruption
       *
       * Count unique in-content advertising placements within the validated
       * Article Reading Region.
       *
       * Repeated observation during scrolling must not increase the count.
       * Multiple Google slots contained by the same direct child of the
       * Reading Region represent one interruption placement.
       */
      const observedA7Placements = new Map();

      for (const state of states) {
        for (const slot of state.googleSlots) {
          if (
            slot.renderedGoogleIframeCount <= 0 ||
            slot.qualifiesAsInContentInterruption !== true ||
            slot.directChildIndex === null
          ) {
            continue;
          }

          const key = `direct-child:${slot.directChildIndex}`;

          if (!observedA7Placements.has(key)) {
            observedA7Placements.set(key, {
              directChildIndex: slot.directChildIndex,
              firstObservedStep: state.index,
              firstObservedScrollY: state.scrollY,
              slotIds: [],
              editorialBeforeCount: slot.editorialBeforeCount,
              editorialAfterCount: slot.editorialAfterCount,
            });
          }

          const placement = observedA7Placements.get(key);

          if (slot.id && !placement.slotIds.includes(slot.id)) {
            placement.slotIds.push(slot.id);
          }
        }
      }

      const inContentAdvertisingInterruptions = observedA7Placements.size;

      /*
       * Article character count is derived from the editorial text blocks
       * already identified within the validated Article Reading Region.
       *
       * Use the maximum observed total because lazy loading or page-state
       * changes may alter the available geometry during the reading path.
       */
      const articleCharacterCount = Math.max(
        0,
        ...states.map((state) =>
          (state.editorialTextRects || []).reduce(
            (sum, rect) => sum + (rect.textLength || 0),
            0,
          ),
        ),
      );

      const interruptionsPer1000Characters =
        articleCharacterCount > 0
          ? Number(
              (
                (inContentAdvertisingInterruptions / articleCharacterCount) *
                1000
              ).toFixed(3),
            )
          : null;

      const observedA7 = {
        inContentAdvertisingInterruptions,
        articleCharacterCount,
        interruptionsPer1000Characters,
        placements: [...observedA7Placements.values()],
      };

      const finalA7 = measurementStatus === "COMPLETE" ? observedA7 : null;

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

        // A6 formal output
        a6: finalA6,

        // A6 diagnostic evidence observed before interruption
        a6ObservedBeforeMeasurementStatus: observedA6,

        // A7 formal output
        a7: finalA7,

        // A7 diagnostic evidence observed before interruption
        a7ObservedBeforeMeasurementStatus: observedA7,

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
        observationIndex: article.observationIndex,
        mediaId: article.media_id,
        mediaProperty: article.media_property,
        articleUrl: article.final_resolved_url || article.article_url,
        readingRegionSelector: article.readingRegionSelector,
        ...result,
      });
    } catch (error) {
      results.push({
        observationIndex: article.observationIndex,
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
      deviceCategory,
      deviceProfile:
        deviceCategory === "mobile" ? "iPhone 13" : "desktop-1440x900",
      viewport,
      initialWaitMs,
      stepPx,
      stepWaitMs,
      maxScrollSteps,
      repeatCount,
      inspectedMediaCount: selected.length,
      observationCount: results.length,
      results,
    },
    null,
    2,
  ),
);
