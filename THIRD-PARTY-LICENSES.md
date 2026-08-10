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

## rrweb

**Files**: `static/replay.js` (the bundled rrweb build at the top of the file, below the banner comment; Betterlytics' own recorder wrapper follows it)  
**Source**: [rrweb-io/rrweb](https://github.com/rrweb-io/rrweb)  
**Version**: 2.0.0-alpha.11 (`dist/rrweb.min.js`, reformatted but otherwise unmodified)  
**License**: MIT License  
**Copyright**: Copyright (c) 2018 Contributors (https://github.com/rrweb-io/rrweb/graphs/contributors) and SmartX Inc.  
**Description**: Session recording and replay library. The bundled build is embedded in the session replay script served to instrumented sites, and provides the DOM serialization, mutation recording and playback used by session replay.

The rrweb bundle inlines `rrweb-snapshot` and `rrdom` (same project, same terms), plus the following, all under the same MIT terms:

- `@xstate/fsm` - Copyright (c) 2015 David Khourshid
- `base64-arraybuffer` - Copyright (c) 2012 Niklas von Hertzen
- `mitt` - Copyright (c) 2021 Jason Miller

It also inlines `tslib` (0BSD, Copyright (c) Microsoft Corporation), whose notice is retained inline in `static/replay.js`.

### MIT License

```
MIT License

Copyright (c) 2018 Contributors (https://github.com/rrweb-io/rrweb/graphs/contributors) and SmartX Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

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
