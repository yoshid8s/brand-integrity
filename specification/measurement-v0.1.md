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

### Output

The implementation should distinguish:

`Unique ad slots`

from:

`Ad creatives observed`

where possible.

---

## A5 — Viewport Obstruction

### Purpose

Measure how much of the user's visible screen is occupied or obstructed by
advertising while reading.

### Definition

For each sampled viewport state:

**Viewport Obstruction = Advertising Overlay Area / Viewport Area**

### Measurement

Sample the viewport at defined scroll positions.

Record:

- maximum obstruction
- median obstruction
- persistent obstruction
- location of obstruction
- applicable ad format

### Output

Example:

`Maximum Viewport Obstruction: 12.3%`

### Special Cases

Record separately:

- sticky advertising
- overlay advertising
- interstitial advertising
- advertising covering editorial text
- advertising covering navigation or controls

---

## A6 — Intrusive Ad Formats

### Purpose

Detect objectively observable advertising formats that may interrupt or
obstruct content consumption.

### Measurement

Record the presence or absence of:

- popup advertising
- prestitial advertising
- interstitial advertising
- overlay advertising
- sticky advertising
- autoplay video
- autoplay audio
- advertising covering editorial content
- advertising covering controls
- advertising-triggered layout movement

### Output

Each detected format should be recorded independently.

Example:

Popup: NO  
Interstitial: NO  
Sticky Ad: YES  
Autoplay Video: NO  
Autoplay Audio: NO  
Content Overlay: NO

### Layout Stability

Where technically possible, layout instability associated with advertising
loading should also be recorded using browser performance data.

This measurement should remain separate from general page CLS unless the
measurement implementation can reasonably attribute the shift to
advertising.

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
