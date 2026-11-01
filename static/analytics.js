// Betterlytics - Privacy-focused, cookieless analytics
(function () {
  if (window.__betterlytics_analytics_initialized__) {
    return;
  }
  window.__betterlytics_analytics_initialized__ = true;

  // currentScript is null when an optimizer (Rocket Loader, defer/combine) injects us; never match another vendor's analytics.js
  var script =
    document.currentScript ||
    document.querySelector("script[data-betterlytics-tracker]") ||
    document.querySelector('script[data-site-id][src*="analytics"]');
  if (!script) {
    console.error("Betterlytics: could not find own script tag");
    return;
  }
  var siteId = script.getAttribute("data-site-id");

  var serverUrl = script.getAttribute("data-server-url");
  if (!serverUrl) {
    serverUrl = "https://betterlytics.io/event";
    script.setAttribute("data-server-url", serverUrl);
  }

  function parseUrlPatterns(attribute) {
    return (
      script
        .getAttribute(attribute)
        ?.split(",")
        .filter(Boolean)
        .map(function (p) {
          p = p.trim();
          return {
            original: p,
            regex: new RegExp(
              `^${p.replace(/\*\*/g, "(.+)").replace(/\*/g, "([^/]+)")}`,
            ),
          };
        }) ?? []
    );
  }

  var urlPatterns = parseUrlPatterns("data-dynamic-urls");

  var scriptsBaseUrl = script.getAttribute("data-scripts-base-url");
  if (!scriptsBaseUrl) {
    try {
      scriptsBaseUrl = new URL(script.src).origin;
    } catch (e) {}
    scriptsBaseUrl = scriptsBaseUrl || "https://betterlytics.io";
  }

  // Content hash of replay.js, replaced by esbuild --define in static/build.mjs; unbuilt copies stay on "dev"
  var replayScriptHash =
    typeof __BL_REPLAY_HASH__ === "string" ? __BL_REPLAY_HASH__ : "dev";
  var replayScriptUrl = `${scriptsBaseUrl}/replay.js?v=${replayScriptHash}`;

  // "off" | "domain" | "full" (defaults to "domain")
  var outboundLinks = script.getAttribute("data-outbound-links") ?? "domain";

  var coreWebVitals = script.getAttribute("data-web-vitals") === "true";

  var enableReplay = script.getAttribute("data-replay") === "true";
  var consentReplay = script.getAttribute("data-consent-replay") === "true";

  var enableErrors = script.getAttribute("data-track-errors") === "true";
  var enableReplayOnError =
    script.getAttribute("data-replay-on-error") === "true";
  var enableConsoleErrors =
    script.getAttribute("data-track-console-errors") === "true";
  var enableFailedRequests =
    script.getAttribute("data-track-failed-requests") === "true";

  var replaySamplePct = parseInt(
    script.getAttribute("data-replay-sample") || "5",
    10,
  );

  if (isNaN(replaySamplePct) || replaySamplePct < 0 || replaySamplePct > 100) {
    replaySamplePct = 0;
  }

  var initialGlobalProperties = null;
  var initialGlobalPropertiesRaw = script.getAttribute(
    "data-global-properties",
  );
  if (initialGlobalPropertiesRaw) {
    try {
      initialGlobalProperties = JSON.parse(initialGlobalPropertiesRaw);
    } catch (e) {
      console.warn("Betterlytics: data-global-properties is not valid JSON", e);
    }
  }

  if (!siteId) {
    return console.error("Betterlytics: data-site-id attribute missing");
  }

  // Store current URL for SPA navigation
  var currentPath = window.location.pathname;

  var globalProperties = {};

  var automation =
    !!(
      navigator.webdriver ||
      window._phantom ||
      window.__nightmare ||
      window.Cypress
    ) ||
    ((navigator.userAgentData && navigator.userAgentData.brands) || []).some(
      function (b) {
        return /headless/i.test(b.brand);
      },
    );

  // Engagement tracking state (duration + scroll depth)
  var pageStartTime = performance.now();
  var currentUrl = null;
  var maxScrollDepthPx = 0;
  var currentDocHeight = 0;

  // Returns the pathname with the first matching pattern applied, or null when none match
  function applyUrlPatterns(patterns, pathname) {
    for (var i = 0; i < patterns.length; i++) {
      var match = patterns[i].regex.exec(pathname);
      if (match) {
        return `${patterns[i].original.replace(
          /\*\*/g,
          "*",
        )}${pathname.slice(match[0].length)}`;
      }
    }
    return null;
  }

  function normalize(url) {
    var urlObj = new URL(url);
    var normalizedPath = applyUrlPatterns(urlPatterns, urlObj.pathname);
    if (normalizedPath !== null) {
      return `${urlObj.origin}${normalizedPath}${urlObj.search}${urlObj.hash}`;
    }
    return url;
  }

  function sendEvent(eventName, overrides = {}) {
    var url = normalize(window.location.href);
    var referrer = document.referrer || null;
    var userAgent = navigator.userAgent;
    var screenResolution = window.screen.width + "x" + window.screen.height;

    fetch(serverUrl, {
      method: "POST",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        site_id: siteId,
        event_name: eventName,
        is_custom_event: false,
        properties: "{}",
        url: url,
        referrer: referrer,
        user_agent: userAgent,
        screen_resolution: screenResolution,
        timestamp: Math.floor(Date.now() / 1000),
        ...(automation && { automation: true }),
        ...(Object.keys(globalProperties).length > 0 && {
          global_properties: Object.assign({}, globalProperties),
        }),
        ...overrides,
      }),
    })
      .then((res) => res.text())
      .catch(function () {});
  }

  var queuedEvents = (window.betterlytics && window.betterlytics.q) || [];
  var queuedGlobalProperties =
    (window.betterlytics && window.betterlytics.gq) || [];

  var replayConsentCallbacks = [];

  window.betterlytics = {
    event: (eventName, eventProps = {}) =>
      sendEvent(eventName, {
        is_custom_event: true,
        properties: JSON.stringify(eventProps),
      }),
    setGlobalProperties: function (props) {
      if (props == null || typeof props !== "object" || Array.isArray(props)) {
        return console.error(
          "Betterlytics: setGlobalProperties requires a flat object",
        );
      }
      Object.assign(globalProperties, props);
    },
    clearGlobalProperties: function () {
      globalProperties = {};
    },
    getGlobalProperties: function () {
      return Object.assign({}, globalProperties);
    },
    setReplayConsent: function (consented) {
      var CONSENT_KEY = "betterlytics:replay_consent";
      try {
        if (consented) {
          localStorage.setItem(
            CONSENT_KEY,
            JSON.stringify({
              consented: true,
              source: "custom",
              timestamp: Date.now(),
            }),
          );
        } else {
          localStorage.removeItem(CONSENT_KEY);
        }
        for (var i = 0; i < replayConsentCallbacks.length; i++) {
          replayConsentCallbacks[i](consented);
        }
      } catch (e) {
        console.error("Failed to set replay consent:", e);
      }
    },
  };

  if (initialGlobalProperties !== null) {
    window.betterlytics.setGlobalProperties(initialGlobalProperties);
  }

  for (var i = 0; i < queuedGlobalProperties.length; i++) {
    window.betterlytics.setGlobalProperties.apply(
      this,
      queuedGlobalProperties[i],
    );
  }

  for (var i = 0; i < queuedEvents.length; i++) {
    window.betterlytics.event.apply(this, queuedEvents[i]);
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.async = true;

      s.onload = function () {
        resolve();
      };
      s.onerror = function (err) {
        reject(err);
      };
      document.head.appendChild(s);
    });
  }

  // Web Vitals batching (send once per page lifecycle)
  if (coreWebVitals) {
    var cwvQueue = new Map();
    var cwvFlushed = false;

    function addCwvMetric(m) {
      cwvQueue.set(m.name, {
        name: m.name,
        value: m.value,
        id: m.id,
        rating: m.rating,
        delta: m.delta,
        navigationType: m.navigationType,
      });
    }

    function flushCwvQueue() {
      if (cwvFlushed || cwvQueue.size === 0) return;
      cwvFlushed = true;
      var metrics = Array.from(cwvQueue.values());
      var byName = metrics.reduce(function (acc, m) {
        acc[m.name] = m.value;
        return acc;
      }, {});
      sendEvent("cwv", {
        cwv_cls: byName.CLS,
        cwv_lcp: byName.LCP,
        cwv_inp: byName.INP,
        cwv_fcp: byName.FCP,
        cwv_ttfb: byName.TTFB,
      });
      cwvQueue.clear();
    }

    // Flush on visibility change to hidden and on pagehide (Safari/iOS)
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") {
        flushCwvQueue();
      }
    });
    window.addEventListener("pagehide", function () {
      flushCwvQueue();
    });

    var s = document.createElement("script");
    s.src = `${scriptsBaseUrl}/web-vitals.js`;
    s.async = true;
    s.onload = function () {
      if (typeof webVitals !== "undefined") {
        webVitals.onCLS(addCwvMetric);
        webVitals.onINP(addCwvMetric);
        webVitals.onLCP(addCwvMetric);
        webVitals.onFCP(addCwvMetric);
        webVitals.onTTFB(addCwvMetric);
      }
    };
    document.head.appendChild(s);
  }

  function getDocumentHeight() {
    var body = document.body || {};
    var el = document.documentElement || {};
    return Math.max(
      body.scrollHeight || 0,
      body.offsetHeight || 0,
      body.clientHeight || 0,
      el.scrollHeight || 0,
      el.offsetHeight || 0,
      el.clientHeight || 0,
    );
  }

  function updateScrollDepth() {
    if (currentUrl && normalize(window.location.href) !== currentUrl) {
      return;
    }

    var body = document.body || {};
    var el = document.documentElement || {};
    var scrollTop = window.scrollY || el.scrollTop || body.scrollTop || 0;
    var viewportHeight = window.innerHeight || el.clientHeight || 0;

    currentDocHeight = getDocumentHeight();

    var scrollPosition = Math.min(scrollTop + viewportHeight, currentDocHeight);

    if (scrollPosition > maxScrollDepthPx) {
      maxScrollDepthPx = scrollPosition;
    }
  }

  function flushEngagement(urlOverride) {
    var duration = Math.round((performance.now() - pageStartTime) / 1000);
    if (duration <= 0 && maxScrollDepthPx <= 0) return;

    var overrides = {
      page_duration_seconds: duration > 0 ? duration : undefined,
    };

    if (maxScrollDepthPx > 0 && currentDocHeight > 0) {
      overrides.scroll_depth_percentage = Math.min(
        100,
        Math.round((maxScrollDepthPx / currentDocHeight) * 100),
      );
      overrides.scroll_depth_pixels = maxScrollDepthPx;
    }

    if (urlOverride) overrides.url = urlOverride;

    sendEvent("engagement", overrides);

    // Reset after sending so this function become idempotent: a second consecutive call will compute
    // duration=0 and scroll=0 and hit the early-return guard above.
    pageStartTime = performance.now();
    maxScrollDepthPx = 0;
  }

  function resetEngagement() {
    pageStartTime = performance.now();
    currentUrl = normalize(window.location.href);
    maxScrollDepthPx = 0;
  }

  window.addEventListener("scroll", () => updateScrollDepth(), {
    passive: true,
  });

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") {
      flushEngagement();
    } else {
      pageStartTime = performance.now();
    }
  });

  window.addEventListener("pagehide", () => flushEngagement());

  // Initialize currentUrl and capture initial viewport
  currentUrl = normalize(window.location.href);
  updateScrollDepth();

  function monitorContentHeight() {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => updateScrollDepth()),
    );
    var count = 0;
    var interval = setInterval(function () {
      updateScrollDepth();
      if (++count === 15) clearInterval(interval);
    }, 200);
  }

  window.addEventListener("load", monitorContentHeight);

  // Send initial page view
  sendEvent("pageview");

  // Detect SPA navigation
  if (window.history.pushState) {
    var originalPushState = history.pushState;
    history.pushState = function () {
      flushEngagement(); // Flush before URL changes (uses current URL)
      originalPushState.apply(this, arguments); // URL changes here
      if (currentPath !== window.location.pathname) {
        currentPath = window.location.pathname;
        resetEngagement();
        monitorContentHeight();
        sendEvent("pageview");
      }
    };

    window.addEventListener("popstate", function () {
      if (currentPath !== window.location.pathname) {
        currentPath = window.location.pathname;
        flushEngagement(currentUrl); // Pass old URL as override
        resetEngagement();
        monitorContentHeight();
        sendEvent("pageview");
      }
    });
  }

  function parseOutboundLink(link) {
    var linkUrl = URL.parse(link.href, window.location.origin);
    if (
      linkUrl &&
      linkUrl.hostname !== window.location.hostname &&
      linkUrl.hostname !== ""
    ) {
      return outboundLinks === "domain"
        ? linkUrl.origin
        : linkUrl.origin + linkUrl.pathname;
    }
    return false;
  }

  // Only enable if outbounds is set to "domain" or "full"
  if (["domain", "full"].includes(outboundLinks)) {
    document.addEventListener("click", function (event) {
      var target = event.target.closest("a");
      if (target && target.href) {
        const parsed = parseOutboundLink(target);
        if (parsed) {
          sendEvent("outbound_link", {
            outbound_link_url: parsed,
          });
        }
      }
    });
  }

  if (enableErrors || enableReplayOnError) {
    var errorCounts = {},
      errorWindowStart = Date.now();
    function isRateLimited(type) {
      var now = Date.now();
      if (now - errorWindowStart > 10000) {
        errorCounts = {};
        errorWindowStart = now;
      }
      errorCounts[type] = (errorCounts[type] || 0) + 1;
      return errorCounts[type] > 10;
    }

    function captureError(err, mechanismType, request) {
      var type, value, stack;
      if (err != null && typeof err === "object") {
        type = err.name ? String(err.name) : "Error";
        if (err.message != null) {
          value = String(err.message);
        } else {
          try {
            value = JSON.stringify(err);
          } catch (e) {
            value = String(err);
          }
        }
        stack = err.stack ? String(err.stack).replace(/\?[^:)\s\n]+/g, "") : "";
      } else {
        type = "Error";
        value = err != null ? String(err) : "unknown error";
        stack = "";
      }
      if (
        /chrome-extension:|moz-extension:|safari-(web-)?extension:/.test(stack)
      )
        return;
      if (isRateLimited(type)) return;
      var exception = {
        type: type,
        value: value.substring(0, 1000),
        mechanism: mechanismType,
        stack: stack.substring(0, 10000),
      };
      if (request) exception.request = request;
      var errorExceptionsJson = JSON.stringify([exception]);
      sendEvent("client_error", { error_exceptions: errorExceptionsJson });
      if (window.__betterlytics_replay__?.notifyError) {
        window.__betterlytics_replay__.notifyError(type, errorExceptionsJson);
      }
    }

    window.addEventListener("error", function (event) {
      if (!event.error && !event.message) return;
      captureError(
        event.error || { name: "Error", message: event.message },
        "onuncaughtexception",
      );
    });

    window.addEventListener("unhandledrejection", function (event) {
      captureError(
        event.reason != null
          ? event.reason
          : {
              name: "UnhandledRejection",
              message: "Promise rejected with no reason",
            },
        "onunhandledrejection",
      );
    });

    if (enableConsoleErrors) {
      // Fallback for browsers without Error.isError: the tag check also covers Errors from other frames
      function isError(a) {
        if (Error.isError) return Error.isError(a);
        return a instanceof Error || Object.prototype.toString.call(a) === "[object Error]";
      }

      function formatError(e) {
        var name = e.name ? String(e.name) : "Error";
        var message = e.message != null ? String(e.message) : "";
        return message ? name + ": " + message : name;
      }

      // Errors serialize to {}, so write them as text; circular objects and BigInts throw, so fall back to String
      function formatArg(a) {
        if (isError(a)) return formatError(a);
        if (a == null || typeof a !== "object") return String(a);
        try {
          return JSON.stringify(a, function (k, v) {
            return isError(v) ? formatError(v) : v;
          });
        } catch (e) {
          return String(a);
        }
      }

      var _origConsoleError = console.error;
      var _inConsoleCapture = false;
      console.error = function () {
        _origConsoleError.apply(console, arguments);
        if (_inConsoleCapture) return;
        _inConsoleCapture = true;
        try {
          var args = Array.prototype.slice.call(arguments);
          var first = args[0];
          if (isError(first)) {
            var message = first.message != null ? String(first.message) : "";
            if (args.length > 1) {
              message =
                (message ? message + " " : "") +
                args.slice(1).map(formatArg).join(" ");
            }
            captureError(
              { name: first.name, message: message, stack: first.stack },
              "onconsole",
            );
          } else if (first != null && typeof first === "object") {
            if (!first.name) {
              first = Object.assign({ name: "ConsoleError" }, first);
            }
            if (first.message == null) {
              first = {
                name: first.name,
                message: formatArg(first),
                stack: first.stack,
              };
            }
            captureError(first, "onconsole");
          } else {
            var firstError = args.filter(isError)[0];
            captureError(
              {
                name: "ConsoleError",
                message: args.map(formatArg).join(" "),
                stack: firstError ? firstError.stack : undefined,
              },
              "onconsole",
            );
          }
        } catch (e) {
          // Capture must never throw into the page's console.error call
        } finally {
          _inConsoleCapture = false;
        }
      };
    }

    if (enableErrors && enableFailedRequests) {
      var apiUrlPatterns = parseUrlPatterns("data-dynamic-api-urls");
      // Network failures and timeouts only count for the page's own domain and its subdomains, since ad blockers fail third-party requests
      var ownDomain = window.location.hostname.replace(/^www\./, "");
      var ignoredRequestUrls = [];
      try {
        var serverUrlObj = new URL(serverUrl, window.location.href);
        ignoredRequestUrls.push(
          serverUrlObj.origin + serverUrlObj.pathname,
          serverUrlObj.origin + "/replay/segment",
        );
      } catch (e) {}
      var pageUnloading = false;
      window.addEventListener("pagehide", function () {
        pageUnloading = true;
      });
      window.addEventListener("pageshow", function () {
        pageUnloading = false;
      });

      // Resolves the request to { method, urlObj, start }, or null for Betterlytics' own requests and unparsable URLs
      function describeRequest(method, url) {
        var urlObj = new URL(String(url), window.location.href);
        if (!/^https?:$/.test(urlObj.protocol)) return null;
        if (ignoredRequestUrls.indexOf(urlObj.origin + urlObj.pathname) !== -1)
          return null;
        return {
          method: String(method || "GET").toUpperCase(),
          urlObj: urlObj,
          start: performance.now(),
        };
      }

      function isOwnDomain(hostname) {
        return hostname === ownDomain || hostname.endsWith("." + ownDomain);
      }

      function normalizeRequestUrl(urlObj) {
        var pathname = urlObj.pathname;
        var normalizedPath =
          (urlObj.hostname === window.location.hostname
            ? applyUrlPatterns(urlPatterns, pathname)
            : null) ?? applyUrlPatterns(apiUrlPatterns, pathname);
        return urlObj.origin + (normalizedPath ?? pathname);
      }

      // failureType: "http" (with the response status), "network" or "timeout"
      function captureFailedRequest(req, mechanismType, failureType, status) {
        if (failureType === "http") {
          if (!(status >= 500 && status <= 599)) return;
        } else if (pageUnloading || !isOwnDomain(req.urlObj.hostname)) {
          return;
        }
        var url = normalizeRequestUrl(req.urlObj).substring(0, 1000);
        var name, outcome;
        if (failureType === "http") {
          name = "HTTPError";
          outcome = String(status);
        } else if (failureType === "timeout") {
          name = "TimeoutError";
          outcome = "timed out";
        } else {
          name = "NetworkError";
          outcome = "failed";
        }
        captureError(
          { name: name, message: req.method + " " + url + " " + outcome },
          mechanismType,
          {
            method: req.method,
            url: url,
            status_code: failureType === "http" ? status : null,
            duration_ms: Math.round(performance.now() - req.start),
            failure_type: failureType,
          },
        );
      }

      var _origFetch = window.fetch;
      if (typeof _origFetch === "function") {
        window.fetch = function (input, init) {
          var req = null;
          var signal = null;
          try {
            var isRequest =
              input != null &&
              typeof input === "object" &&
              typeof input.url === "string";
            req = describeRequest(
              (init && init.method) || (isRequest ? input.method : "GET"),
              isRequest ? input.url : input,
            );
            signal = (init && init.signal) || (isRequest ? input.signal : null);
          } catch (e) {}
          var promise = _origFetch.apply(this, arguments);
          if (!req) return promise;
          // Chained and passed through, so a rejection stays unhandled exactly when the page doesn't handle it
          return promise.then(
            function (res) {
              try {
                if (res.type !== "opaque" && res.type !== "opaqueredirect") {
                  captureFailedRequest(req, "onfetch", "http", res.status);
                }
              } catch (e) {}
              return res;
            },
            function (err) {
              try {
                if (signal && signal.aborted) {
                  // AbortSignal.timeout() aborts with a TimeoutError; any other abort is the page cancelling
                  if (signal.reason && signal.reason.name === "TimeoutError") {
                    captureFailedRequest(req, "onfetch", "timeout");
                  }
                } else if (err && err.name === "TimeoutError") {
                  captureFailedRequest(req, "onfetch", "timeout");
                } else if (!(err && err.name === "AbortError")) {
                  captureFailedRequest(req, "onfetch", "network");
                }
              } catch (e) {}
              throw err;
            },
          );
        };
      }

      if (typeof XMLHttpRequest !== "undefined") {
        var xhrProto = XMLHttpRequest.prototype;
        var _origXhrOpen = xhrProto.open;
        var _origXhrSend = xhrProto.send;
        var xhrRequests = new WeakMap();
        var xhrListening = new WeakSet();

        function onXhrEvent(event) {
          try {
            var req = xhrRequests.get(this);
            if (!req || !req.sent) return;
            req.sent = false;
            if (event.type === "load") {
              captureFailedRequest(req, "onxhr", "http", this.status);
            } else if (event.type === "error") {
              captureFailedRequest(req, "onxhr", "network");
            } else if (event.type === "timeout") {
              captureFailedRequest(req, "onxhr", "timeout");
            }
          } catch (e) {}
        }

        xhrProto.open = function (method, url) {
          try {
            xhrRequests.delete(this);
            var req = describeRequest(method, url);
            if (req) xhrRequests.set(this, req);
          } catch (e) {}
          return _origXhrOpen.apply(this, arguments);
        };

        xhrProto.send = function () {
          try {
            var req = xhrRequests.get(this);
            if (req) {
              req.start = performance.now();
              req.sent = true;
              if (!xhrListening.has(this)) {
                xhrListening.add(this);
                // Listening for "abort" too clears the sent flag, so a cancelled request is never captured
                ["load", "error", "timeout", "abort"].forEach(function (type) {
                  this.addEventListener(type, onXhrEvent);
                }, this);
              }
            }
          } catch (e) {}
          return _origXhrSend.apply(this, arguments);
        };
      }
    }
  }

  if ((enableReplay || enableReplayOnError) && !automation) {
    // replay.js reads this instead of searching the DOM, where another "analytics.js" (Segment, GA) can come first
    window.__betterlytics_replay_config__ = {
      siteId: siteId,
      serverUrl: serverUrl,
      script: script,
    };

    var REPLAY_STORAGE_KEY = "betterlytics:replay_sample";
    var CONSENT_KEY = "betterlytics:replay_consent";
    var THIRTY_MIN_MS = 30 * 60 * 1000;
    var replayLoaded = false;

    function checkReplayConsent() {
      if (consentReplay) {
        return true;
      }
      try {
        var stored = localStorage.getItem(CONSENT_KEY);
        if (stored) {
          var data = JSON.parse(stored);
          return data.consented === true && data.source === "custom";
        }
      } catch (e) {}
      return false;
    }

    function shouldSample() {
      try {
        var stored = localStorage.getItem(REPLAY_STORAGE_KEY);
        var now = Date.now();

        if (stored) {
          var data = JSON.parse(stored);
          var age = now - data.timestamp;

          if (age < THIRTY_MIN_MS) {
            localStorage.setItem(
              REPLAY_STORAGE_KEY,
              JSON.stringify({ sampled: data.sampled, timestamp: now }),
            );
            return data.sampled;
          }
        }

        var sampled = Math.round(Math.random() * 100) <= replaySamplePct;

        localStorage.setItem(
          REPLAY_STORAGE_KEY,
          JSON.stringify({ sampled, timestamp: now }),
        );
        return sampled;
      } catch (e) {
        return Math.round(Math.random() * 100) <= replaySamplePct;
      }
    }

    function initReplay() {
      if (replayLoaded) return;

      var hasConsent = checkReplayConsent();
      if (!hasConsent) return;

      var sampled = enableReplay && shouldSample();
      var shouldLoadForError = enableReplayOnError;

      if (sampled || shouldLoadForError) {
        window.__betterlytics_replay_sampled__ = sampled;
        replayLoaded = true;
        loadScript(replayScriptUrl);
      }
    }

    replayConsentCallbacks.push(function (consented) {
      if (consented && !replayLoaded) {
        var sampled = enableReplay && shouldSample();
        if (sampled || enableReplayOnError) {
          window.__betterlytics_replay_sampled__ = sampled;
          replayLoaded = true;
          loadScript(replayScriptUrl);
        }
      } else if (!consented && replayLoaded) {
        window.__betterlytics_replay__?.stop();
      }
    });

    initReplay();
  }
})();
