# Third-Party Licenses

This project includes components from other open source projects. Below are the licenses and attributions for these components.

## ua-parser-core

**Files**: `backend/assets/user_agent_headers/regexes.yaml`
**Source**: [ua-parser/uap-core](https://github.com/ua-parser/uap-core)
**License**: Apache License 2.0
**Copyright**: Copyright 2009 Google Inc.
**Description**: Regular expressions for parsing user agent strings. This file contains the core regex patterns used by the ua-parser library for browser, OS, and device detection.

### Apache License 2.0

```
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

**Full License Text**: https://www.apache.org/licenses/LICENSE-2.0

---

## Snowplow Referer Parser (based on Piwik)

**Files**: `backend/assets/referers/referers-latest.json`  
**Source**: [snowplow-referer-parser](https://github.com/snowplow-referer-parser/referer-parser)  
**License**: GNU General Public License v3.0  
**Original Copyright**:

- Piwik's `SearchEngines.php` and `Socials.php`, © 2012 Matthieu Aubry
- Derived and adapted by Snowplow Analytics Ltd.

**Description**: The referer classification file is based on work from Piwik, listing known search engines and social media sources. It was adapted by the Snowplow project and converted into JSON format for use in referer parsing.

### GNU General Public License v3.0

A copy of the GNU General Public License v3.0 is available in this repository or at:  
https://www.gnu.org/licenses/gpl-3.0.html

---

## web-vitals

**Files**: `static/web-vitals.js`
**Source**: [GoogleChrome/web-vitals](https://github.com/GoogleChrome/web-vitals)
**License**: Apache License 2.0
**Copyright**: Copyright 2020 Google LLC
**Description**: Version 5.3.0 of Google's Core Web Vitals measurement library, vendored unmodified from the npm registry tarball (`dist/web-vitals.iife.js`) below a legal banner; loaded on demand when `data-web-vitals="true"`.

### Apache License 2.0

```
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

**Full License Text**: https://www.apache.org/licenses/LICENSE-2.0
