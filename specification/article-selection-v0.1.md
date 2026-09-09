# Brand Integrity Index

## Article Selection Protocol v0.1

**Status:** Pilot specification  
**Version:** 0.1  
**Project:** Brand Integrity  
**Maintainer:** Y&H Inc.

---

# 1. Purpose

This protocol defines how article pages are selected for Brand Integrity
Index Pilot 01.

The purpose is to minimize researcher discretion and prevent article selection
from being influenced by expected measurement outcomes.

Article URLs must be selected and recorded before advertising-experience
measurements are performed.

The protocol is designed to answer the following question:

> **What advertising experience does an ordinary reader encounter when
> reading ordinary editorial content on each measured media property?**

---

# 2. Unit of Selection

The unit of selection is an individual publicly accessible article page.

Pilot 01 will select:

- 3 articles per media property
- 17 media properties
- 51 article pages in total

The same selection procedure must be applied to Groups A, B, and C wherever
technically and editorially applicable.

---

# 3. Selection Reference Point

For each media property, article selection begins from the property's primary
public article listing or equivalent editorial feed.

Preferred sources, in order, are:

1. latest or newest article listing
2. primary news or article feed
3. clearly identified general editorial listing
4. homepage article stream when no dedicated listing exists

The exact selection source URL must be recorded.

The selection timestamp must also be recorded.

Article order is determined by the order presented by the media property at
that timestamp.

Researchers must not reorder articles according to expected advertising
density, subject matter, publisher reputation, or anticipated measurement
results.

---

# 4. Primary Selection Rule

Starting from the first article in the selected listing, examine article
candidates sequentially.

Select the first three candidates that satisfy all eligibility requirements
defined in this protocol.

For example:

Candidate 1 → eligible → Article 1  
Candidate 2 → excluded → record reason  
Candidate 3 → eligible → Article 2  
Candidate 4 → eligible → Article 3

Once three eligible articles have been selected, selection for that media
property is complete.

This procedure is intended to minimize discretionary article selection.

---

# 5. Eligible Articles

An article is eligible when all of the following conditions are satisfied:

- it is an ordinary article page
- the article contains substantial editorial or published textual content
- the article can be accessed without authentication
- enough article content is publicly visible to perform the measurements
- the page represents the normal article-reading experience of the media
  property
- the page is technically accessible using the Pilot 01 measurement
  environment

Eligible content may include:

- news articles
- analysis
- columns
- interviews
- feature articles
- explanatory articles
- ordinary summary or aggregation posts in Group B
- ordinary JiJi Style articles in Group C

---

# 6. Exclusion Criteria

The following pages must be excluded from primary article selection.

## 6.1 Paid or Authentication-Restricted Content

Exclude pages when meaningful measurement of the article requires:

- subscription
- membership
- login
- purchase
- authentication

A partially accessible article may remain eligible only when the publicly
available portion provides a normal and sufficiently substantial article
reading experience.

The reason must be recorded when a candidate is excluded.

## 6.2 Advertising Access Gates

Exclude a candidate when access to sufficient article content requires
completion of an advertising, rewarded-ad, or similar access-gate
interaction before the article can be normally read.

An advertising access gate does not by itself constitute a Safety Exclusion
or evidence of poor advertising quality.

The exclusion is based on measurement feasibility: completing the required
interaction would alter the observation environment before advertising
measurement begins.

Researchers must not complete the advertising interaction solely to make an
otherwise inaccessible candidate eligible.

## 6.3 Sponsored or Advertorial Content

Exclude content clearly identified as:

- sponsored
- advertorial
- native advertising
- paid content
- PR content
- tie-up content
- advertiser-produced content

Pilot 01 is intended to measure advertising surrounding ordinary editorial
content rather than advertising that is itself the primary content.

## 6.4 Special Experiences

Exclude:

- campaign landing pages
- special promotional pages
- interactive features with materially different layouts
- live event pages
- photo galleries with little textual content
- video-only pages
- podcast-only pages
- shopping pages
- product catalog pages

## 6.5 Non-Article Pages

Exclude:

- homepages
- category pages
- search results
- tag archives
- author pages
- corporate pages
- policy pages
- index pages

## 6.6 Technical Failure

Exclude a candidate when technical conditions prevent a valid measurement,
including:

- repeated page-load failure
- broken article rendering
- access denied
- automated-access challenge that cannot be resolved within the defined
  measurement environment
- content unavailable at the time of selection

Access controls or technical protections must not be bypassed.

---

# 7. Replacement Rule

When a candidate is excluded, proceed to the next article in the same listing.

Do not search manually for a more convenient replacement.

Every excluded candidate encountered before the third eligible article must be
recorded with:

- candidate position
- URL
- exclusion reason
- selection timestamp

This creates an audit trail showing how the final three articles were selected.

---

# 8. Article Length

Pilot 01 will not intentionally select articles according to article length.

Article length is instead recorded as an observed property.

For each selected article, record at minimum:

- article character count
- estimated article content height
- number of major content sections where detectable

This allows advertising measurements to be normalized where appropriate.

For example:

> In-content Ad Interruptions per 1,000 characters

Selecting only long or short articles in advance would risk biasing the
advertising-experience results.

---

# 9. Topic Neutrality

Article subject matter must not be used as a selection criterion.

Researchers must not intentionally select articles about:

- advertising
- media criticism
- misinformation
- technology
- politics
- controversial topics
- particular advertisers

unless those articles appear naturally through the primary selection rule.

The goal is to observe the media property's normal publishing environment,
not a topic selected to support a research hypothesis.

---

# 10. Publication Date

Recent articles are preferred because Pilot 01 is intended to observe the
current publishing and advertising environment.

However, publication date is not itself a ranking criterion when the selected
listing already provides a chronological or current editorial feed.

Record:

- publication date where available
- selection timestamp
- measurement timestamp

These values may differ.

---

# 11. Group-Specific Treatment

## 11.1 Group A — Premium / PMP Media

Use the normal public article experience available to a non-authenticated
reader.

Do not use subscriber-specific, ad-reduced, or premium viewing modes.

Participation by the publisher in a premium media or PMP initiative does not
imply that advertising observed on a selected article was delivered through a
PMP transaction.

## 11.2 Group B — Summary / Aggregation Media

Ordinary summary, aggregation, or curation posts are considered eligible
editorial units for the purpose of this comparison.

The research does not judge whether the underlying information is true or
false.

The same advertising-experience measurements must be applied as for Group A.

## 11.3 Group C — Experimental Advertising Model

JiJi Style articles must be selected using the same sequential selection
principle wherever possible.

Researchers must not intentionally choose JiJi Style articles known to have
especially strong advertising performance.

Existing CTR or engagement results must not influence article selection.

---

# 12. Measurement Environment Independence

Article selection and advertising measurement are separate stages.

During article selection, researchers may determine:

- whether the URL is an article
- whether the article is publicly accessible
- whether exclusion criteria apply

They must not use preliminary observations such as:

- apparent number of ads
- apparent advertiser count
- apparent advertising density
- intrusive advertising
- expected Brand Integrity result

to decide whether an otherwise eligible article should be included.

Once an article has been selected, it remains in the sample unless a documented
technical condition makes subsequent measurement impossible.

---

# 13. Selection Record

Each selected article must have a record containing at minimum:

- pilot ID
- media ID
- media property
- group
- candidate position
- selection source URL
- article URL
- final resolved URL
- article title
- publication date where available
- selection timestamp
- eligibility status
- exclusion reason where applicable
- notes

Example:

```text
pilot_id: pilot-01
media_id: A01
candidate_position: 1
selection_source_url: [recorded URL]
article_url: [recorded URL]
selection_timestamp: [ISO 8601 timestamp]
eligibility_status: SELECTED
```

---

# 14. Selection Freeze

After article selection has been completed for all media properties, the
complete article sample must be committed to the research repository before
advertising-experience measurement begins.

This creates a versioned record of the sample that existed before measurement
results were known.

Subsequent replacements are permitted only when a selected article becomes
unavailable or technically impossible to measure.

Any replacement must preserve:

- the original selected URL
- the reason for replacement
- the replacement timestamp
- the replacement selection procedure
- the replacement URL

The original record must not be deleted.

## 14.1 Post-Freeze Eligibility Re-evaluation

A frozen selection may also be re-evaluated when a subsequently clarified or
added eligibility rule shows that the original selection decision was
inconsistent with the current Pilot 01 selection protocol.

Such a re-evaluation must not be based on advertising-experience measurements,
observed ad quantity, publisher integrity signals, or whether the change would
support the research hypotheses.

When a previously selected article is found to be ineligible:

- the original article record must be preserved
- its eligibility status must be changed to `EXCLUDED`
- the applicable exclusion reason must be recorded
- the reason for the post-freeze re-evaluation must be documented
- replacement articles must follow the original sequential-selection principle
  as far as the surviving contemporaneous record permits
- the replacement timestamp and replacement URL must be recorded

If an original candidate position or other required historical field cannot be
reliably reconstructed from contemporaneous records, it must not be guessed.
The field must instead use an explicitly documented unknown value, and the
reason for the missing historical information must be recorded in the notes.

This exception exists to correct protocol-consistency errors, not to optimize
the sample after measurement.

---

# 15. Safety Exclusion

Participant and researcher safety takes precedence over completion of the
planned sample.

A media property or candidate page must be excluded from further assessment
when ordinary access or content interaction produces a potentially unsafe
browser or advertising experience, including:

- deceptive security or system warnings
- redirects to confirmed or suspected scam destinations
- unexpected redirects to suspicious external destinations
- attempts to force software downloads or installation
- repeated redirects that prevent normal navigation
- browser behavior that materially interferes with the observer's ability to
  leave or control the page
- other behavior that creates a reasonable security or safety concern

The observer must not intentionally reproduce the behavior merely to confirm
the event.

When a safety exclusion occurs, the following must be recorded where
available:

- media property
- candidate URL
- timestamp
- interaction immediately preceding the event
- observed behavior
- external destination, if safely observable
- evidence captured before measurement was stopped
- reason for exclusion

A destination may be classified as a scam page when the observed behavior
matches established characteristics of a known scam pattern, such as a
tech support scam. For example, a page impersonating a legitimate technology
company, presenting a false security warning, restricting normal browser
control, and instructing the user to call a displayed telephone number may be
recorded as a tech support scam page.

This classification applies to the observed destination and behavior. It must
not by itself be interpreted as evidence that the measured publisher
intentionally caused, controlled, or endorsed the scam or unsafe redirect.

If an entire media property cannot be assessed safely, it may be removed from
the Pilot 01 measurement sample. Any replacement property must be selected
according to a documented replacement procedure before advertising
measurement begins.

No attempt should be made to bypass security controls, reproduce malicious
behavior, or investigate potentially unsafe destinations as part of Pilot 01.

---

# 16. Replacement Media Procedure

When an entire media property is excluded from Pilot 01 after the original
media sample has been fixed, a replacement property may be selected to
preserve the planned comparison-group size.

The replacement must be selected without reference to advertising density,
advertising quality, Brand Integrity signals, or the expected comparative
result.

## 16.1 Replacement Pool

A replacement must belong to the same comparison group as the excluded
property.

For Group B, the replacement pool consists of publicly accessible Japanese
summary or aggregation media properties that satisfy the original Group B
selection concept.

A replacement candidate must:

- primarily publish summary, aggregation, curation, or commentary posts based
  on material originating elsewhere
- provide a publicly accessible stream of ordinary article posts
- be measurable without authentication or subscription
- represent a distinct media property from the properties already included
  in Pilot 01
- be technically accessible using the ordinary research environment
- not be selected because of its observed advertising characteristics

For the purposes of replacement eligibility, ordinary technical accessibility
requires that the media property can be reached through a browser without
overriding a TLS/certificate warning or deliberately downgrading from a secure
HTTPS connection to HTTP.

A property is not classified as unsafe solely because it lacks ordinary HTTPS
access. Such a case should be recorded as a technical eligibility exclusion,
not as a Safety Exclusion under Section 15.

## 16.2 Selection Order

Replacement candidates must be evaluated according to a documented,
predefined ordering that does not use Pilot 01 measurement results.

The candidate pool and ordering must be recorded before detailed advertising
measurement of any replacement candidate begins.

The first candidate in that ordering that satisfies the eligibility and
safety requirements must be selected.

If a candidate is excluded, the reason must be recorded and the next
candidate evaluated.

## 16.3 Safety

The Safety Exclusion procedure in Section 15 applies equally to replacement
candidates.

A researcher must not reproduce a previously observed unsafe event merely to
compare a replacement candidate with the excluded property.

## 16.4 No Matching by Outcome

The replacement is not required to reproduce the advertising characteristics,
traffic scale, monetization structure, or observed behavior of the excluded
property.

In particular, the replacement must not be selected because it appears to
have:

- many or few advertisements
- intrusive advertising
- a complex or simple advertising supply chain
- weak or strong publisher policies
- particular ads.txt or sellers.json characteristics
- any characteristic expected to support or weaken the research hypothesis

The purpose of replacement is to preserve the planned comparison-group size,
not to reproduce or strengthen the excluded observation.

## 16.5 Documentation

The replacement record must include:

- excluded media ID
- replacement media ID
- replacement media property
- measurement domain
- candidate-pool source
- candidate position
- selection timestamp
- eligibility status
- exclusion reason, where applicable
- notes

The excluded media property must remain in the Pilot 01 registry and must not
be deleted or overwritten.

The selected replacement must receive a new media ID.

---

# 17. Reproducibility and Limitations

Pilot 01 represents a time-bounded observation.

Advertising environments may vary according to:

- time
- geography
- device
- browser
- consent state
- advertising auctions
- campaign availability
- frequency controls
- personalization
- publisher configuration

Therefore, article selection does not guarantee that another observer will
receive identical advertisements.

The purpose of this protocol is to make the selection of article pages
reproducible and auditable, while the separate measurement protocol records
the environment in which advertising observations are made.

---

# 18. Research Integrity Principle

The article sample must be determined without knowledge of the final
comparative results.

The guiding principle is:

> Select first. Measure second. Interpret last.

This separation is essential to the integrity of Pilot 01.
