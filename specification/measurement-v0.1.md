# Brand Integrity Index

## Measurement Specification v0.1

**Status:** Pilot specification  
**Version:** 0.1  
**Project:** Brand Integrity  
**Maintainer:** Y&H Inc.

---

## 1. Purpose

The Brand Integrity Index is an experimental framework for exploring whether
Brand Integrity can be observed and measured using publicly accessible and
machine-observable signals.

The framework is based on two primary dimensions:

> **Behavioral Integrity + Data Integrity = Brand Integrity**

Behavioral Integrity concerns observable signals about how an originator
identifies itself, publishes information, establishes policies, accepts
accountability, and operates advertising experiences.

Data Integrity concerns whether information about the originator and its
content can be technically verified.

The purpose of Measurement Specification v0.1 is not to determine whether an
organization is "good", "bad", "trustworthy", or "untrustworthy".

Instead, the purpose is to test the following research question:

> **Can Brand Integrity be objectively observed and measured from publicly
> accessible signals?**

A second research question follows:

> **Can these observations eventually become machine-readable integrity
> signals for agentic advertising?**

---

## 2. Pilot Principles

### 2.1 Observation before evaluation

Version 0.1 records observable evidence.

It does not assign an overall Brand Integrity score.

It does not rank publishers.

The purpose of Pilot 01 is to validate the measurement methodology before
considering weighting, scoring, or comparative evaluation.

### 2.2 Evidence-based measurement

Every observation should contain, where applicable:

- value
- status
- measurement method
- evidence
- source URL
- timestamp
- measurement environment

A result should be independently reviewable wherever practical.

### 2.3 Absence of evidence is not evidence of absence

If a signal cannot be found through the defined measurement procedure, the
result must be recorded as `NOT_FOUND`.

`NOT_FOUND` does not mean that the organization does not have the relevant
policy, practice, or technology.

It means only that the signal was not found through the measurement method
used at the time of observation.

### 2.4 No judgment of truthfulness

The framework does not determine whether published information is true or
false.

Similarly, the existence of a policy does not prove that an organization
always behaves according to that policy.

The framework measures observable signals and, where possible, their
technical verifiability.

---

# 3. Result States

The following result states are used throughout the specification.

## VERIFIED

The signal was detected and its relevant technical properties were
successfully verified using the defined measurement procedure.

## OBSERVED

Public evidence of the signal was detected, but the signal is not suitable
for technical verification or technical verification was not completed.

## NOT_FOUND

The defined measurement procedure did not identify the signal.

## NOT_APPLICABLE

The signal is not applicable to the measured property or environment.

## MANUAL_REVIEW

The available evidence cannot be reliably classified automatically and
requires human review.

---

# 4. Measurement Dimensions

Measurement Specification v0.1 defines three signal groups.

## Behavioral Integrity

Signals:

- B1 Operator Identity
- B2 Editorial Policy
- B3 Correction Policy
- B4 Advertising Policy
- B5 Privacy Policy
- B6 Accountability
- B7 Advertising Transparency

## Data Integrity

Signals:

- D1 ads.txt
- D2 OWNERDOMAIN
- D3 MANAGERDOMAIN
- D4 sellers.json Consistency
- D5 Originator Profile
- D6 C2PA / Content Credentials
- D7 Other Provenance Mechanisms

## Advertising Experience Integrity

Advertising Experience Integrity is treated in v0.1 as an observable
sub-dimension of Behavioral Integrity.

Signals:

- A1 Ad-to-Content Ratio
- A2 Ad Density
- A3 Advertiser Count
- A4 Ad Unit Count
- A5 Viewport Obstruction
- A6 Intrusive Ad Formats
- A7 Content Interruption

---

# 5. Behavioral Integrity Signals

## B1 — Operator Identity

### Purpose

Determine whether the publisher or service publicly identifies the
organization responsible for the media property.

### Evidence

Examples include:

- company profile
- publisher information
- legal entity name
- corporate information
- domain ownership declarations
- publisher responsibility statements

### Detection Method

Search the media property and associated public pages for information
identifying the operating organization.

### Decision Rule

`OBSERVED` when a responsible legal or organizational entity can be
identified from public evidence.

`NOT_FOUND` when the defined search procedure does not identify such
information.

`MANUAL_REVIEW` when multiple organizations are presented and responsibility
cannot be determined reliably.

### Limitation

Identification of an operator does not establish that the operator behaves
with integrity.

---

## B2 — Editorial Policy

### Purpose

Determine whether the publisher publicly describes principles governing its
editorial activity.

### Evidence

Relevant principles may include:

- accuracy
- editorial independence
- sourcing
- conflicts of interest
- fact checking
- editorial responsibility

### Detection Method

Locate publicly accessible editorial guidelines, editorial policies,
journalistic principles, or equivalent statements.

Automated semantic analysis may be used to identify candidate evidence.

### Decision Rule

`OBSERVED` when substantive public evidence describing editorial principles
is identified.

`NOT_FOUND` when no such evidence is identified.

`MANUAL_REVIEW` when a candidate page exists but its relevance is ambiguous.

### Limitation

The existence of a published editorial policy does not demonstrate
compliance with that policy.

---

## B3 — Correction Policy

### Purpose

Determine whether the publisher publicly describes how corrections,
amendments, deletions, or significant content changes are handled.

### Evidence

Examples include:

- correction policy
- amendment policy
- deletion policy
- correction history
- notices attached to corrected articles

### Detection Method

Search public policy pages and article structures for correction-related
statements.

### Decision Rule

Use `OBSERVED`, `NOT_FOUND`, or `MANUAL_REVIEW` according to the evidence.

### Limitation

The framework measures transparency of the correction process, not the
quality of individual editorial decisions.

---

## B4 — Advertising Policy

### Purpose

Determine whether the publisher publicly describes principles governing
advertising, sponsored content, or commercial relationships.

### Evidence

Examples include:

- advertising standards
- advertising review policies
- sponsored-content rules
- native-advertising disclosure policies
- PR-content labeling rules

### Detection Method

Search publicly accessible advertising and editorial policy pages.

### Decision Rule

`OBSERVED` when substantive advertising rules or disclosure principles are
identified.

Otherwise use `NOT_FOUND` or `MANUAL_REVIEW`.

---

## B5 — Privacy Policy

### Purpose

Determine whether the publisher publicly describes its handling of personal
information and user data.

### Evidence

Examples include:

- privacy policy
- personal information policy
- cookie policy
- data-use disclosures

### Detection Method

Identify publicly accessible privacy and data-use documentation.

### Decision Rule

`OBSERVED` when a relevant public policy is identified.

Otherwise use `NOT_FOUND` or `MANUAL_REVIEW`.

---

## B6 — Accountability

### Purpose

Determine whether users can identify a mechanism for contacting the
publisher regarding its content, service, privacy practices, or other
responsibilities.

### Evidence

Examples include:

- contact form
- editorial contact
- correction request
- complaint mechanism
- privacy inquiry contact

### Detection Method

Search public pages for actionable accountability channels.

### Decision Rule

`OBSERVED` when at least one meaningful accountability mechanism is
identified.

Otherwise use `NOT_FOUND` or `MANUAL_REVIEW`.

---

## B7 — Advertising Transparency

### Purpose

Determine whether the publisher provides observable information supporting
transparency in its digital advertising operations.

### Evidence

Evidence may include:

- supply-chain transparency declarations
- advertising technology disclosures
- authorized seller information
- advertising partner disclosures
- public explanations of advertising practices

### Detection Method

Combine public-document discovery with technical advertising transparency
signals.

### Decision Rule

Use `OBSERVED`, `NOT_FOUND`, or `MANUAL_REVIEW`.

Technical components are separately evaluated under D1–D4.

---

# 6. Data Integrity Signals

## D1 — ads.txt

### Purpose

Determine whether the media domain publishes an accessible ads.txt resource
declaring authorized digital advertising sellers.

### Detection Method

Retrieve the ads.txt resource according to the applicable ads.txt
specification.

Record:

- HTTP status
- final URL
- file availability
- number of valid records
- parsing errors

### Decision Rule

`VERIFIED` when an ads.txt resource is successfully retrieved and parsed
according to the applicable specification.

`OBSERVED` when the resource exists but cannot be fully verified.

`NOT_FOUND` when no applicable resource is found.

---

## D2 — OWNERDOMAIN

### Purpose

Determine whether ads.txt identifies the business domain of the entity that
owns the advertising inventory.

### Detection Method

Parse the applicable ads.txt resource for an `OWNERDOMAIN` declaration.

### Decision Rule

`VERIFIED` when a syntactically valid declaration is identified.

`NOT_FOUND` when ads.txt is present but no applicable declaration is found.

`MANUAL_REVIEW` when ownership relationships are ambiguous.

---

## D3 — MANAGERDOMAIN

### Purpose

Determine whether an applicable advertising inventory manager is publicly
declared.

### Detection Method

Parse the applicable ads.txt resource for `MANAGERDOMAIN`.

### Decision Rule

`VERIFIED` when a valid declaration is identified.

`NOT_FOUND` when no declaration is identified.

`NOT_APPLICABLE` may be used where no external inventory manager is
applicable and that conclusion can reasonably be established.

---

## D4 — sellers.json Consistency

### Purpose

Evaluate whether relevant advertising supply-chain declarations can be
cross-checked between ads.txt and sellers.json.

### Detection Method

For applicable ads.txt records:

1. identify advertising-system domains
2. retrieve relevant sellers.json resources
3. identify seller IDs
4. compare declared relationships
5. record inconsistencies or unresolved relationships

### Decision Rule

`VERIFIED` when the selected relationship can be successfully cross-checked.

`MANUAL_REVIEW` when relationships cannot be conclusively resolved.

`NOT_APPLICABLE` where no applicable relationship exists.

### Limitation

A successful technical relationship check does not establish the quality or
trustworthiness of a commercial participant.

---

## D5 — Originator Profile

### Purpose

Determine whether the measured property exposes machine-verifiable
Originator Profile information.

### Evidence

Applicable OP mechanisms may include publicly discoverable OP-related
publisher, originator, or content attestations.

### Detection Method

Use the applicable public Originator Profile specification and verification
mechanisms available at the time of measurement.

### Decision Rule

`VERIFIED` when applicable OP information is detected and successfully
verified.

`OBSERVED` when OP-related information is detected but cannot be fully
verified.

`NOT_FOUND` when no applicable implementation is detected.

---

## D6 — C2PA / Content Credentials

### Purpose

Determine whether sampled media assets contain C2PA-compatible provenance
information or Content Credentials.

### Detection Method

Sample qualifying media assets from the measured articles and inspect them
using an applicable C2PA verification method.

Record:

- number of assets sampled
- number containing C2PA data
- number successfully verified
- verification failures

### Decision Rule

`VERIFIED` when at least one relevant asset contains successfully verified
C2PA provenance.

`OBSERVED` when C2PA-related data is present but cannot be fully verified.

`NOT_FOUND` when no sampled asset contains applicable data.

### Limitation

`NOT_FOUND` applies only to the sampled assets and must not be interpreted as
proof that the publisher never uses C2PA.

---

## D7 — Other Provenance Mechanisms

### Purpose

Identify other publicly observable, machine-verifiable mechanisms that
support origin, authenticity, or integrity verification.

### Detection Method

Record the mechanism, applicable specification, verification method, and
evidence.

### Decision Rule

Prefer `VERIFIED` only where an objective technical verification procedure
exists.

Otherwise use `OBSERVED` or `MANUAL_REVIEW`.

---

# 7. Advertising Experience Integrity

Advertising Experience Integrity measures the advertising environment
experienced by a user while consuming editorial content.

These measurements are performed using a real browser environment.

Measurements must distinguish between desktop and mobile environments.

Because programmatic advertising is dynamic, a single page load is not
considered sufficient evidence.

---

## A1 — Ad-to-Content Ratio

### Purpose

Measure the quantitative relationship between advertising and editorial
content.

### Definition

For a measured article:

**Ad-to-Content Ratio = Observed Advertising Area / Observed Editorial Content Area**

The precise DOM and geometry methodology must be recorded by the
measurement implementation.

### Measurement

The browser identifies:

- article content
- advertising units
- their rendered dimensions

Overlapping regions must not be double-counted.

### Output

Report the ratio as a percentage.

Example:

`Ad-to-Content Ratio: 26.7%`

### Limitation

Complex layouts, embedded widgets, recommendation modules, sponsored
content, and dynamically resized advertising may require manual
classification.

---

## A2 — Ad Density

### Purpose

Measure the proportion of the user's article-reading environment occupied by
advertising.

### Definition

Ad Density differs from A1.

A1 compares advertising area with editorial content area.

A2 measures advertising occupancy across the reading experience, including
the spatial distribution of advertising while scrolling through the article.

### Article Reading Region

For Advertising Experience measurements A1-A7, the **Article Reading Region**
defines the portion of the page through which an ordinary user progresses
while consuming the selected article.

The Article Reading Region must be identified and documented for each media
property before full-scale measurement begins.

Boundary identification should use the following order of preference:

1. semantic article structure, such as `article` or an explicit article-body
   attribute
2. a stable structural selector representing the article-reading region
3. a documented media-specific selector

A media-specific selector is permitted when the publisher does not expose a
suitable semantic or stable generic article structure.

The selected region may include advertisements, images, embeds, and other
elements encountered within the normal article-reading flow. Such elements
must not be removed merely to isolate editorial text because their presence
may itself contribute to Advertising Experience measurements.

The configured selector must be validated before measurement. If it no longer
resolves to the expected article-reading region, the observation must be
reported as `MANUAL_REVIEW` rather than silently substituting an automatically
inferred boundary.

Article Reading Region configuration is part of the measurement environment
and must be applied consistently to all selected articles from the same media
property unless a documented structural difference requires review.

### Measurement

The implementation records advertising geometry throughout the article's
scrollable reading region.

Where applicable, results may be compared with published industry reference
thresholds.

Reference thresholds must be reported separately from the measured value.

### Output

Example:

`Observed Mobile Ad Density: 24.7%`

The measurement must not automatically classify a publisher as good or bad
based solely on a reference threshold.

---

## A3 — Advertiser Count

### Purpose

Measure how many distinct advertisers appear during consumption of a single
article.

### Definition

A distinct advertiser represents a distinct identifiable advertising brand
or advertiser, rather than the number of advertising slots.

Repeated appearances of the same advertiser count as one advertiser within
an observation.

### Detection Method

Candidate signals may include:

- ad destination domains
- advertiser domains
- creative metadata
- rendered advertiser labels
- network request information

### Measurement

Report:

- advertisers identified per page load
- median advertisers per article
- minimum
- maximum
- unresolved advertisers

### Limitation

Some programmatic creatives may prevent reliable advertiser identification.

Such cases must be recorded as unresolved rather than guessed.

---

## A4 — Ad Unit Count

### Purpose

Measure the number of advertising units presented during the article
experience.

### Definition

For A4, the observation scope is the **Article Experience Window**: the
observable article-page experience from the initial article-page viewport
through the end of the validated Article Reading Region.

Advertising units may therefore be counted when they are presented either
within the Article Reading Region or elsewhere in the page layout while
remaining part of the user's observable article-reading experience.

A4 is independent of advertising transaction or delivery model.

Reserved, direct-sold, programmatic reserved, programmatic auction, and other
advertising units are included when they satisfy the same observation criteria.

The transaction or delivery model must not be inferred solely from the
technical implementation of an advertising slot. Where it can be established
from reliable evidence, it should be recorded separately from A4.

### Measurement

Count separately where possible:

- display ads
- in-content ads
- sticky ads
- video advertising
- native advertising
- other identifiable commercial units

Repeated refreshes of the same physical slot should be recorded separately
from unique slot count when technically detectable.

A **unique ad slot** is a distinct advertising placement within the Article
Reading Region or another advertising placement that remains part of the
observed article-reading experience.

Where technical identifiers are available, slot identity should be based on
placement-level evidence such as:

- stable DOM position or container
- placement identifier
- ad-slot identifier
- other repeatable structural evidence

A change of advertiser, creative, image, destination, or internal ad ID within
the same placement must not by itself increase the unique ad slot count.

Conversely, repeated appearances of the same advertiser or internal ad ID in
different placements must be counted as separate unique ad slots.

### Detection Confidence and Manual Evidence

Automated detection may identify advertising units through repeatable technical
evidence such as advertising containers, placement identifiers, ad-slot
identifiers, or advertising-specific iframe structures.

Where an advertising exposure is visibly present during the Article Experience
Window but cannot be reliably classified by the automated procedure, it should
be retained as an unresolved candidate rather than silently excluded.

Manual observation may be used to confirm such a candidate when the visual
evidence clearly establishes that the element is advertising. The manual
confirmation and its evidence must be recorded separately from the automated
detection result.

The implementation should therefore distinguish, where necessary:

- automatically confirmed advertising units
- manually confirmed advertising units
- unresolved advertising candidates

Manual confirmation must not be used to infer the advertising transaction or
delivery model without separate reliable evidence.

### Output

The implementation should distinguish:

`Unique ad slots`

from:

`Ad creatives observed`

where possible.

---

## A5 — Viewport Obstruction

### Purpose

Measure how much of the user's visible viewport is occupied or obstructed by
advertising or by interface elements directly caused by an advertising
presentation while reading.

### Definition

For each sampled viewport state:

**Viewport Obstruction =
Advertising Obstruction Area / Viewport Area**

`Advertising Obstruction Area` is the portion of the visible viewport occupied
or obscured by an advertising or advertising-associated element that obstructs
the ordinary reading experience, including:

- a sticky or fixed advertising unit that occupies viewport space independently
  of the normal document flow;
- an advertising overlay or interstitial; or
- an overlay, backdrop, mask, or similar interface element that is directly
  associated with an advertising presentation and reduces the normally visible
  article-reading area.

An advertising unit positioned within the normal document flow does not
constitute Advertising Obstruction solely because it is visible within the
viewport.

The measurement concerns the observable effect on the viewport rather than the
number of advertising units.

An interface element must not be classified as Advertising Obstruction solely
because it covers or occupies part of the viewport. Cookie notices,
subscription prompts, site notifications, navigation interfaces, and other
non-advertising elements are excluded unless reliable evidence establishes
that they are directly associated with an advertising presentation.

Where the relationship between an obstructing element and advertising cannot
be established reliably, the observation must remain unresolved rather than
being classified as advertising obstruction.

### Measurement

Sample the viewport at the defined scroll positions used for the Article
Experience Window.

The initial automated implementation counts technically confirmed advertising
units with `position: fixed` or `position: sticky` as Advertising Obstruction.

Other advertising-associated overlays, interstitials, backdrops, or masks
require reliable technical or documented evidence before contributing to the
automated A5 measurement.

For each sampled viewport state, record where technically observable:

- viewport width and height;
- advertising obstruction area;
- viewport obstruction ratio;
- location of obstruction;
- whether the obstruction overlaps the Article Reading Region;
- whether the obstruction covers editorial text;
- whether the obstruction covers navigation or controls;
- whether the obstruction persists across multiple sampled viewport states;
- applicable ad format; and
- evidence supporting classification as advertising obstruction.

When multiple advertising or advertising-related elements overlap each other,
their overlapping pixels must not be counted more than once in the total
Advertising Obstruction Area.

Advertising elements that are present in the document but are outside the
visible viewport at the sampled state do not contribute to Viewport
Obstruction for that state.

### Aggregate Output

For each completed article observation, record:

- maximum viewport obstruction;
- median viewport obstruction;
- persistent obstruction;
- location of obstruction; and
- applicable ad format where identifiable.

`Maximum Viewport Obstruction` is the highest obstruction ratio observed among
the sampled viewport states.

`Median Viewport Obstruction` is the median of the obstruction ratios observed
among the sampled viewport states.

`Persistent Obstruction` records advertising obstruction that remains visible
across multiple consecutive sampled viewport states.

### Output

Example:

`Maximum Viewport Obstruction: 12.3%`

`Median Viewport Obstruction: 8.1%`

`Persistent Obstruction: YES`

### Special Cases

Record separately where observed:

- sticky advertising;
- overlay advertising;
- interstitial advertising;
- advertising covering editorial text;
- advertising covering navigation or controls; and
- advertising-related overlays, backdrops, or masks.

An advertising-related backdrop or mask may contribute to A5 even when it is
not counted as a separate advertising unit under A4.

For example, a full-viewport backdrop presented as part of an advertising
experience may produce substantial Viewport Obstruction while still
representing only one advertising unit for A4.

A5 measures the **extent of obstruction**. A6 records the **type of intrusive
advertising format**. The same observed advertising experience may therefore
produce evidence for both signals without being double-counted within either
signal.

---

## A6 — Intrusive Ad Formats

### Purpose

Detect objectively observable advertising formats that may interrupt or
obstruct content consumption.

### Measurement

Each intrusive advertising format must be evaluated independently.

Where technically observable, record one of:

- `DETECTED` — sufficient technical evidence establishes that the advertising
  format occurred during the observed Article Experience Window;
- `NOT_DETECTED` — the relevant experience was observable and no evidence of
  the format was detected;
- `UNRESOLVED` — an intrusive interface or media behavior was observed, but
  its relationship to advertising or its format classification could not be
  established reliably; or
- `NOT_OBSERVABLE` — the relevant Article Experience Window could not be
  observed sufficiently to evaluate the format.

The absence of automatically detected evidence must not be interpreted as
`NOT_DETECTED` when the relevant experience was not fully observable.

Record independently:

- popup advertising;
- prestitial advertising;
- interstitial advertising;
- overlay advertising;
- sticky advertising;
- autoplay video;
- autoplay audio;
- advertising covering editorial content;
- advertising covering controls; and
- advertising-triggered layout movement.

A format must be classified as advertising only when the observed element or
behavior can be associated with advertising through reliable technical or
documented evidence.

Generic overlays, dialogs, subscription prompts, cookie notices, navigation
interfaces, and other obstructing interface elements must not be classified
as intrusive advertising solely because they interrupt or cover content.
Where an intrusive interface is observable but its relationship to advertising
cannot be established reliably, record the relevant format as `UNRESOLVED`.

### Automated Phase 1 Classification

The initial automated A6 implementation classifies only intrusive advertising
formats that can be established from technical evidence already collected
during the A5 viewport observation.

The following Phase 1 classifications are supported:

- `Sticky Advertising`: detected when a technically confirmed advertising unit
  is observed with CSS `position: fixed` or `position: sticky`.
- `Advertising Covering Editorial Content`: detected when a technically
  confirmed advertising obstruction geometrically overlaps editorial text
  within the validated Article Reading Region.

The presence of an advertising unit within the visible viewport does not by
itself establish an intrusive advertising format.

Advertising units positioned within the normal document flow (`position:
static`) are therefore not classified as Sticky Advertising solely because
they are visible during scrolling.

Likewise, an overlay, backdrop, mask, iframe, or other interface element must
not be classified as an intrusive advertising format unless reliable evidence
establishes its relationship to an advertising presentation.

Where such a relationship cannot be established, the observation remains
unresolved rather than being classified automatically.

Phase 1 does not yet automatically classify popup advertising, prestitial
advertising, interstitial advertising, autoplay video, autoplay audio,
advertising covering controls, or advertising-triggered layout movement unless
separate reliable detection evidence is implemented.

### Output

Each format should be recorded independently using the applicable A6
classification state.

Example:

- `Popup Advertising: NOT_DETECTED`
- `Interstitial Advertising: NOT_DETECTED`
- `Sticky Advertising: DETECTED`
- `Autoplay Video: NOT_DETECTED`
- `Autoplay Audio: NOT_DETECTED`
- `Advertising Covering Editorial Content: DETECTED`

### Layout Stability

Where technically possible, layout instability associated with advertising
loading should also be recorded using browser performance data.

This measurement should remain separate from general page CLS unless the
measurement implementation can reasonably attribute the shift to
advertising.

### Phase 1 Feasibility Validation

Initial Phase 1 feasibility testing produced both positive and negative
validation cases.

In an A01 Asahi Shimbun Digital observation using a 1440 × 900 desktop
viewport, a technically confirmed Google advertising unit was observed with
`position: fixed` across the sampled reading path. The unit occupied the
bottom 1440 × 60 pixels of the viewport.

A5 measured the resulting persistent viewport obstruction at 6.667%. Using the
same technical evidence, A6 classified:

- `Sticky Advertising: DETECTED`
- `Advertising Covering Editorial Content: DETECTED`

The editorial-content classification was based on geometric overlap between
the confirmed advertising obstruction and editorial text blocks, rather than
on the presence of the advertising unit alone.

In a completed A04 Mainichi Shimbun observation, advertising units were
observed within the ordinary article experience, but no technically confirmed
fixed or sticky advertising obstruction was detected. A5 therefore recorded
0% maximum and median viewport obstruction, and A6 classified:

- `Sticky Advertising: NOT_DETECTED`
- `Advertising Covering Editorial Content: NOT_DETECTED`

This provides a negative validation case showing that advertising visible
within the normal document flow must not automatically be classified as an
intrusive advertising format.

A separate A04 feasibility observation produced a full-viewport gray interface
state associated with an unresolved iframe. That state was not reproduced in
the subsequent completed observation. Its triggering conditions and its
relationship to advertising have therefore not been established.

Accordingly, the gray interface state is not classified as an A6 intrusive
advertising format. This illustrates the requirement that visually intrusive
behavior alone is insufficient for A6 classification when its relationship to
advertising cannot be established reliably.

---

## A7 — Content Interruption

### Purpose

Measure how frequently advertising interrupts the flow of editorial content.

### Definition

An interruption occurs when an advertising unit is inserted between
segments of the primary article content.

### Measurement

Record:

- number of in-content advertising interruptions
- article text length
- interruptions per 1,000 characters
- approximate scroll distance between interruptions

### Formula

**Interruptions per 1,000 characters =
In-content Ad Interruptions / Article Character Count × 1,000**

### Output

Example:

Article length: 4,800 characters  
In-content interruptions: 6  
Interruptions / 1,000 characters: 1.25

### Limitation

Recommendation modules, related articles, affiliate modules, and sponsored
content may require separate classification.

---

# 8. Pilot 01 Measurement Protocol

## 8.1 Initial sample

Pilot 01 should begin with approximately 10 media properties selected from a
publicly disclosed premium or PMP-related media list.

The exact sample and selection rationale must be recorded before
measurement.

## 8.2 Unit of measurement

The primary measurement target is the **media property/domain and sampled
article**, not the corporate group as a whole.

## 8.3 Article sampling

For each media property, Pilot 01 should initially select three ordinary
editorial articles.

Selection rules should avoid, where practical:

- homepages
- special advertising pages
- subscription landing pages
- campaign pages
- exceptional interactive features

The selection method must be documented.

### 8.3.1 Measurement-time access state

Article eligibility is determined and recorded at sample selection time.

Because the access state of a digital article may change after selection,
the article access state must be checked again at measurement time.

If an article that was eligible at selection time later becomes subject to
a paywall, authentication requirement, or another access restriction:

- the original selection record must be preserved;
- the changed access state must be recorded as a measurement-time condition;
- access controls must not be bypassed for measurement;
- Advertising Experience signals must not be inferred for portions of the
  article that are not available in the ordinary observed reading experience.

A numerical value of zero must not be used to represent an Advertising
Experience signal when the relevant observation could not be completed
because part of the selected article was access-restricted.

Such observations must instead be recorded with an explicit measurement
status indicating that the full Article Reading Region was not observable.

A measurement-time access restriction applies to the affected article
observation and does not by itself exclude the media property or other
selected articles from Pilot 01.

### 8.3.2 Measurement Status

Each article observation must record a Measurement Status separately from
the Result States defined in Section 3.

The Measurement Status describes whether the article-reading experience
required for Advertising Experience measurement was observable.

The following statuses are used:

`COMPLETE`

The full Article Reading Region required by the measurement procedure was
observable and the measurement completed normally.

`PARTIALLY_OBSERVABLE_ACCESS_RESTRICTED`

The article page and part of the Article Reading Region were observable,
but a paywall, authentication requirement, purchase requirement, or other
access restriction prevented observation of the full Article Reading Region.

Advertising Experience signals must not be reported as zero merely because
the unobservable portion could not be measured.

`INCOMPLETE_READING_EXPERIENCE`

The Article Reading Region was identified and at least part of the reading
experience was observable, but the measurement procedure could not complete
the ordinary reading path because of a page-level condition such as an
overlay, modal, scroll lock, or other interface behavior.

This status describes an incomplete observed reading experience rather than
a measurement-system failure.

Advertising Experience signals observed before the interruption may be
retained as diagnostic evidence, but incomplete observations must not be
reported as complete numerical measurements.

`READING_REGION_NOT_FOUND`

The defined Article Reading Region could not be identified at measurement
time.

`MEASUREMENT_ERROR`

The observation could not be completed because of a technical failure such
as navigation failure, browser error, or another measurement-system error.

Measurement Status must not replace the Result States defined in Section 3.
It records the observability of the measurement session, while Result States
describe the result of an individual integrity signal.

## 8.4 Repeated advertising observations

Because digital advertising delivery is dynamic, Advertising Experience
measurements should use repeated page loads.

The frozen Pilot 01 sample contains:

- 17 media properties
- 3 selected articles per media property
- 51 selected articles in total

The initial design proposed:

- 10 desktop observations per article
- 10 mobile observations per article

If retained unchanged, this would produce:

**60 advertising observations per media property**

and:

**1,020 advertising observations across 17 media properties**

The final repetition count must be determined after feasibility testing.

This is necessary because repeated browser observations may generate
advertising impressions or otherwise interact with publisher and advertising
infrastructure. The research should use the minimum repetition count
necessary to produce useful comparative evidence.

Any change to the repetition count must be documented before full-scale
measurement begins.

### 8.4.1 Scroll-dependent observation

A single Advertising Experience observation must represent a controlled
reading session rather than only the initial page-load state.

Feasibility testing showed that page geometry can change materially as the
page is scrolled because images, embeds, advertisements, and other resources
may use lazy loading.

Accordingly, each observation should follow a documented sequence such as:

1. load the selected article
2. wait for the initial page state to stabilize
3. record the initial viewport state
4. scroll through the article using a consistent procedure
5. allow scroll-triggered resources to load
6. sample defined viewport states during the reading path
7. record the stabilized document geometry and Advertising Experience signals

Measurements must not assume that the document height or element geometry
observed immediately after page load represents the complete reading
experience.

The scroll procedure, scroll step or sampling positions, wait interval, and
stabilization rule must be fixed before full-scale Pilot 01 measurement and
applied consistently across Groups A, B, and C.

The measurement process must not click advertisements, intentionally trigger
advertising interactions, bypass access controls, or perform interactions
that are unnecessary for ordinary reading.

### 8.4.2 A5 feasibility validation

Initial feasibility testing was performed to validate that A5 distinguishes
viewport obstruction from the mere presence of advertising within the visible
page.

In an A01 Asahi Shimbun Digital observation using a 1440 × 900 desktop
viewport, a technically confirmed Google advertising unit was observed with
`position: fixed` across multiple sampled viewport states. The unit occupied
1440 × 60 pixels at the bottom of the viewport, corresponding to a viewport
obstruction ratio of:

**86,400 / 1,296,000 = 6.667%**

This provides a positive validation case for persistent viewport obstruction.

In an A04 Mainichi Shimbun observation, multiple technically confirmed Google
advertising units were observed during the article-reading experience, but the
observed units were positioned in the normal document flow (`position:
static`). Their presence therefore provided evidence for A4 but did not, by
itself, constitute viewport obstruction under the automated A5 procedure.

This provides a negative validation case demonstrating that A5 must not count
the visible area of every advertising unit merely because the unit intersects
the viewport.

The A04 feasibility observation also produced a full-viewport gray interface
state associated with an unresolved iframe. Because the relationship between
that interface state and advertising could not be established from the
automated technical evidence alone, it must not be automatically classified as
Advertising Obstruction. Such cases require separately documented evidence and
may remain unresolved.

These feasibility cases validate the following distinction:

- A4 measures observed advertising units.
- A5 measures the extent to which confirmed advertising or reliably
  advertising-associated interface elements obstruct the observable viewport.
- The presence of an advertising unit in the viewport does not, by itself,
  establish A5 obstruction.

## 8.5 Environment recording

Each observation should record:

- timestamp
- target URL
- final URL
- viewport dimensions
- device category
- user agent
- browser name and version
- browser execution mode where relevant
- locale
- timezone
- measurement region where known
- device scale factor where applicable
- cookie/consent state
- authentication state
- initial page-load duration
- post-load wait interval
- scroll procedure or sampling profile
- measurement tool version

## 8.6 Evidence capture

Advertising Experience observations should preserve evidence where
practical.

Evidence may include:

- screenshots
- full-page screenshots
- DOM-derived geometry
- network metadata
- detected ad destination domains
- structured measurement logs

Large binary evidence such as full-page screenshots does not need to be
stored directly in the Git repository, provided that its storage location
and relationship to the structured observation record can be preserved.

Sensitive or unnecessary user information must not be collected.

# 9. Example Observation Record

```json
{
  "property": "example.com",
  "article": "https://example.com/article",
  "measuredAt": "2026-09-06T10:00:00Z",
  "environment": {
    "device": "mobile",
    "viewport": {
      "width": 390,
      "height": 844
    }
  },
  "signals": {
    "A3": {
      "name": "Advertiser Count",
      "value": 5,
      "unresolved": 1,
      "status": "OBSERVED"
    },
    "A5": {
      "name": "Viewport Obstruction",
      "value": 12.3,
      "unit": "%",
      "status": "VERIFIED"
    },
    "A6": {
      "name": "Intrusive Ad Formats",
      "value": {
        "popup": false,
        "interstitial": false,
        "sticky": true,
        "autoplayVideo": false,
        "autoplayAudio": false,
        "contentOverlay": false
      },
      "status": "OBSERVED"
    }
  }
}
```

# 10. Reporting

Pilot 01 must distinguish clearly between:

1. observed facts
2. technically verified facts
3. unresolved observations
4. interpretation
5. research hypotheses

No overall publisher score or ranking will be produced in Measurement
Specification v0.1.

Results should primarily be presented as a signal matrix and distributions
of observed measurements.

Example:

| Signal                       |                  Result |
| ---------------------------- | ----------------------: |
| Distinct advertisers         |     Median 5, range 3–8 |
| Ad units                     |                Median 8 |
| Ad-to-content ratio          |                   26.7% |
| Mobile ad density            |                   24.7% |
| Content interruptions        | 1.25 / 1,000 characters |
| Maximum viewport obstruction |                   12.3% |
| Sticky advertising           |                Observed |

---

# 11. One Page × One Advertiser Comparison

The Y&H "One Page × One Advertiser" model must not be used as the definition
of a successful result.

Instead, properties implementing this model may be measured using exactly
the same measurement methodology as the Pilot 01 media sample.

This allows comparison of observable outcomes such as:

- advertising density
- advertiser count
- ad unit count
- content interruptions
- viewport obstruction
- intrusive formats
- engagement metrics where independently available

The research question is therefore not:

> Is One Page × One Advertiser better?

It is:

> **What measurable differences emerge when different advertising models are
> evaluated using the same methodology?**

---

# 12. Future Work

Potential future versions may explore:

- weighting of individual signals
- normalization
- scoring
- confidence levels
- longitudinal measurement
- larger publisher samples
- cross-market comparisons
- automated policy analysis
- agent-consumable integrity signals
- integration with agentic advertising protocols
- machine-readable Brand Integrity declarations

These features are explicitly outside the scope of v0.1.

---

# 13. Core Research Hypothesis

Measurement Specification v0.1 tests the hypothesis:

> **Brand Integrity can be represented by observable and increasingly
> machine-verifiable signals rather than by reputation alone.**

If this hypothesis is supported, a future advertising agent may be able to
consider not only price, audience, context, and inventory availability, but
also measurable signals describing the integrity of the environment in which
an advertisement will appear.

That possibility is the central research objective of the Brand Integrity
Index.

---

# 14. Pilot 01 Comparative Research Design

Pilot 01 will compare three distinct media groups using the same measurement
methodology defined in this specification.

The objective is not to classify one group as inherently good or bad, but to
observe whether measurable differences appear across different publishing and
advertising models.

## 14.1 Group A — Premium / PMP Media

Group A will consist of approximately ten premium media properties selected
from publicly documented premium media or PMP-related publisher groups in
Japan.

The group is expected to include established newspaper, magazine, business,
and digital publishing brands.

Selection criteria will include:

- publicly identifiable publisher or operator
- ordinary editorial article pages available for measurement
- public evidence of participation in a premium media or PMP-related
  initiative
- sufficient accessibility for repeatable browser-based observation
- inclusion of multiple publishing categories where practical

Membership in this group does not imply that every measured page is currently
served through a PMP transaction.

## 14.2 Group B — Summary / Aggregation Media

Group B will consist of approximately six publicly accessible summary,
aggregation, or curation-style media properties.

These properties are included as a comparative media group because their
publishing models, editorial structures, and advertising environments may
differ materially from established premium media.

Pilot 01 will not characterize these properties as unsafe, fraudulent,
low-quality, or advertiser-blocked unless independently verifiable evidence
supports such a conclusion.

The comparison will focus only on observable signals defined by this
specification.

## 14.3 Group C — Experimental Advertising Model

Group C will include a Y&H-operated property implementing the experimental
"One Page × One Advertiser" advertising model.

This group will be evaluated using exactly the same measurement methodology as
Groups A and B.

It will not be treated as the definition of a successful result.

The purpose is to determine whether a materially different advertising model
produces measurable differences in advertising density, advertiser count,
content interruption, viewport obstruction, and other observable signals.

---

## 14.4 Pre-Registered Research Hypotheses

The following hypotheses are defined before Pilot 01 measurement begins.

### H1 — Publisher Integrity Hypothesis

Premium / PMP media are expected to exhibit stronger observable Behavioral
Integrity and Data Integrity signals than summary / aggregation media.

Possible areas of difference include:

- operator identity
- editorial policies
- correction policies
- advertising policies
- privacy policies
- accountability mechanisms
- ads.txt and related supply-chain transparency
- originator and provenance technologies where present

This hypothesis concerns observable and verifiable signals only.

It does not assert that the content published by any media property is true,
false, accurate, inaccurate, trustworthy, or untrustworthy.

### H2 — Advertising Experience Hypothesis

Despite expected differences in Behavioral Integrity and Data Integrity,
Premium / PMP media may show substantially smaller differences from summary /
aggregation media in observable advertising experience.

The comparison will focus on:

- Ad-to-Content Ratio
- Ad Density
- Advertiser Count
- Ad Unit Count
- Viewport Obstruction
- Intrusive Ad Formats
- Content Interruption

The hypothesis is that strong publisher-level integrity signals do not
necessarily imply a less intrusive or less complex advertising experience.

### H3 — Advertising Model Hypothesis

A One Page × One Advertiser model may produce a measurably different
advertising experience compared with both Premium / PMP media and summary /
aggregation media.

Possible measurable differences include:

- fewer distinct advertisers per article
- fewer ad units
- lower advertising density
- fewer in-content interruptions
- lower viewport obstruction
- fewer intrusive ad formats

Where independently available, engagement metrics may also be examined.

This hypothesis does not assume that fewer ads automatically produce better
business outcomes or better user outcomes.

Pilot 01 is intended to test whether measurable differences exist.

---

## 14.5 Interpretation Principle

Pilot 01 must distinguish between:

1. publisher integrity
2. information provenance
3. advertising experience
4. advertising effectiveness

These dimensions must not be treated as interchangeable.

A media property may demonstrate strong publisher identity, editorial
governance, and provenance signals while simultaneously presenting a highly
dense or intrusive advertising environment.

Conversely, a low-density advertising environment does not by itself
demonstrate strong editorial or provenance integrity.

The purpose of the Brand Integrity Index research is to make these differences
observable rather than collapse them into a single reputation judgment.

---

## 14.6 Comparative Research Question

Pilot 01 will therefore examine the following broader question:

> **Can measurable Brand Integrity signals reveal meaningful differences
> between publisher integrity and advertising experience across different
> media and advertising models?**

A related practical question is:

> **Can an advertising model based on fewer, more clearly attributable
> advertiser relationships produce a measurably different advertising
> experience without relying on reputation alone?**

The results of Pilot 01 will be used to determine whether these hypotheses
should be supported, rejected, or revised in future versions of the research.
