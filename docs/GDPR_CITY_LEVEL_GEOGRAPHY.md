# City-Level Geography Data: Privacy Decision Document

## Summary

Betterlytics offers city-level geography analytics that, when combined with other dimensions, can create re-identification risk under GDPR. After researching legal requirements and competitor approaches, we implemented a configurable display-level minimum visitor threshold (default: 10) that suppresses city and subdivision rows below that count from the dashboard.

---

## 1. Problem Statement

City-level geography data presents a "singling out" risk under GDPR when a geographic location has very few visitors.

**Example scenario:** A dashboard shows "City: Olstykke — 1 visitor." The site owner, who sent a link to a specific person, can trivially re-identify that visitor by combining city + device type + browser + time of visit — even without names or IP addresses.

Key research supporting this concern:

- **Combinatorial re-identification** (de Montjoye et al., 2015): Just four spatio-temporal data points were enough to uniquely identify 90% of individuals in a credit card dataset.
- **Singling out formalized** (Cohen & Nissim, PNAS 2020): Research formalizing GDPR's notion of singling out demonstrated it can be accomplished with a collection of seemingly innocuous traits.
- **ICO "motivated intruder" test**: The UK ICO's anonymisation guidance considers a motivated intruder who has access to "obvious sources of information" — which now includes generative AI tools.

The risk is highest for:
- Small cities or towns with very few visitors
- Sites with low overall traffic
- Dashboard views combining geography with device, browser, OS, page path, and time dimensions

---

## 2. Legal Basis

| Authority | Key Point |
|-----------|-----------|
| **GDPR Recital 26** | Data is personal if "all means reasonably likely" can be used for identification, including singling out |
| **Article 29 WP Opinion 05/2014** | k-anonymity with too-small groups allows inferences; anonymisation must be engineered case-by-case |
| **UK ICO Anonymisation Guidance** | "Motivated intruder" test — someone with access to obvious sources can attempt re-identification |
| **CNIL (French DPA)** | Consent-exempt analytics must produce "anonymous, aggregated reports"; GPS geolocation must not be collected |

**Conclusion:** City-level geo data combined with other analytics dimensions constitutes personal data under GDPR when it enables singling out. The fact that IP addresses are discarded does not absolve the controller if remaining data combinations allow re-identification.

---

## 3. Competitor Analysis

| Feature | Plausible | Matomo | Fathom | PostHog | GA4 | **Betterlytics** |
|---------|-----------|--------|--------|---------|-----|-------------------|
| City data available | Yes | Yes | Yes | Yes | Yes | Yes |
| City data opt-in | Yes (self-hosted) | Configurable | Default on | Configurable | Default on | Yes (env var) |
| Minimum visitor threshold | No | No | No | No | **Yes (~50)** | **Yes (default 10)** |
| IP discarded after lookup | Yes | Configurable | Yes | Configurable | N/A | Yes |
| Geolocation disableable | Yes (self-hosted) | Yes | No | Yes | No | Yes |

**Notable approaches:**

- **Plausible**: City data opt-in for self-hosted. No threshold. Users have requested one (GitHub Discussion #2264) but it hasn't been implemented.
- **Matomo**: Privacy through IP byte masking (default 2 bytes), which degrades city-level accuracy. For CNIL consent-exempt mode, removes last two bytes making city accuracy poor by design.
- **Fathom**: City data added July 2025. SHA256 IP hashing. EU data isolation. No threshold.
- **PostHog**: Granular control — individual GeoIP properties can be stripped. IP capture disabled by default on EU Cloud. No threshold.
- **Google Analytics 4**: The only competitor with thresholds. System-defined (~50 users), not adjustable. Rows below threshold are withheld entirely from reports and API.

---

## 4. Our Decision

1. **Display-level minimum visitor threshold**: Configurable per-dashboard, default 10. Geographic locations with fewer unique visitors than the threshold are hidden from the dashboard.

2. **Scope**: Applied to city and subdivision queries only. Country-level data is sufficiently aggregated and not affected.

3. **Implementation**: `HAVING visitors >= N` clause in the ClickHouse geography query. No data is deleted — the threshold is purely a display-level safeguard.

4. **Self-hoster control**: Geo granularity controlled via `ENABLE_GEOLOCATION` environment variable (`false` | `countries` | `subdivisions`). Default is disabled.

5. **Hosted service**: All dashboards receive subdivision and city data. The threshold is the primary privacy safeguard.

6. **User override**: Setting the threshold to 0 disables filtering for users who accept the risk.

---

## 5. Rationale

**Why storage is acceptable:**
- IP addresses are discarded immediately after geolocation lookup at ingestion time
- A city name alone (e.g., "Berlin") is not personal data — it becomes personal data only when combined with other dimensions in a way that enables singling out
- The stored data (city name as a string) has no direct link to any individual

**Why display-level threshold is the right layer:**
- The re-identification risk exists at the point of *viewing* combined dimensions, not at the point of storage
- A `HAVING` clause prevents the dashboard from ever surfacing identifying combinations
- This matches GA4's approach (the only major analytics platform implementing thresholds)

**Why default of 10:**
- Exceeds the academic minimum for k-anonymity (typically k >= 5)
- Significantly lower than GA4's ~50, balancing privacy with data utility
- Configurable upward for higher-risk scenarios or downward (to 0) for users who accept the risk
- At k=10, the probability of singling out any individual is at most 10%, even with perfect auxiliary information

---

## 6. Future Considerations

- **"Other" bucket**: Group sub-threshold cities into an "Other cities" row to preserve total visitor counts while preventing singling out
- **Privacy tooltips**: Display a warning when city-level data shows very few visitors (1-4), explaining the data may be identifying
- **Self-hoster guidance**: Document that sites with fewer than ~1,000 monthly visitors should keep the default threshold or set it higher
- **Single-session exclusion**: If session replays or visitor profiles are implemented, exclude city-level data from individual records

---

## Sources

- [GDPR Recital 26 - Not Applicable to Anonymous Data](https://gdpr-info.eu/recitals/no-26/)
- [Towards Formalizing the GDPR's Notion of Singling Out (PNAS)](https://www.pnas.org/doi/10.1073/pnas.1914598117)
- [ICO Anonymisation Guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-sharing/anonymisation/how-do-we-ensure-anonymisation-is-effective/)
- [Article 29 Working Party Opinion 05/2014 on Anonymisation Techniques](https://ec.europa.eu/justice/article-29/documentation/opinion-recommendation/files/2014/wp216_en.pdf)
- [Plausible Data Policy](https://plausible.io/data-policy)
- [Plausible GitHub Discussion #2264 - Possibility to Turn Off City Level Data](https://github.com/plausible/analytics/discussions/2264)
- [Matomo Privacy Settings FAQ](https://matomo.org/faq/general/configure-privacy-settings-in-matomo/)
- [Matomo GDPR Analytics](https://matomo.org/gdpr-analytics/)
- [Matomo CNIL Exemption Configuration](https://matomo.org/faq/how-to/how-do-i-configure-matomo-without-tracking-consent-for-french-visitors-cnil-exemption/)
- [Fathom Analytics City Data Changelog](https://usefathom.com/changelog/july2025-city-data)
- [Fathom Analytics Privacy Compliance](https://usefathom.com/legal/compliance)
- [PostHog Privacy Controls](https://posthog.com/docs/product-analytics/privacy)
- [GA4 Data Thresholds](https://support.google.com/analytics/answer/9383630?hl=en)
- [CNIL Sheet #16 - Analytics on Websites](https://www.cnil.fr/en/sheet-ndeg16-use-analytics-your-websites-and-applications)
- [K-anonymity, L-diversity and T-closeness (Utrecht University)](https://utrechtuniversity.github.io/dataprivacyhandbook/k-l-t-anonymity.html)
