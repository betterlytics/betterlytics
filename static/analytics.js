// Betterlytics - Privacy-focused, cookieless analytics
(function () {
  if (window.__betterlytics_analytics_initialized__) {
    return;
  }
  window.__betterlytics_analytics_initialized__ = true;

  var script =
    document.currentScript ||
    document.querySelector('script[src*="analytics.js"]');
  var siteId = script.getAttribute("data-site-id");

  var serverUrl = script.getAttribute("data-server-url");
  if (!serverUrl) {
    serverUrl = "https://betterlytics.io/event";
    script.setAttribute("data-server-url", serverUrl);
  }

  var urlPatterns =
    script
      .getAttribute("data-dynamic-urls")
      ?.split(",")
      .map(function (p) {
        p = p.trim();
        return {
          original: p,
          regex: new RegExp(
            `^${p.replace(/\*\*/g, "(.+)").replace(/\*/g, "([^/]+)")}`,
          ),
        };
      }) ?? [];

  var scriptsBaseUrl =
    script.getAttribute("data-scripts-base-url") ?? "https://betterlytics.io";

  // "off" | "domain" | "full" (defaults to "domain")
  var outboundLinks = script.getAttribute("data-outbound-links") ?? "domain";

  var coreWebVitals = script.getAttribute("data-web-vitals") === "true";

  var enableReplay = script.getAttribute("data-replay") === "true";
  var consentReplay = script.getAttribute("data-consent-replay") === "true";

  var replaySamplePct = parseInt(
    script.getAttribute("data-replay-sample") || "5",
    10,
  );

  if (isNaN(replaySamplePct) || replaySamplePct < 0 || replaySamplePct > 100) {
    replaySamplePct = 0;
  }

  if (!siteId) {
    return console.error("Betterlytics: data-site-id attribute missing");
  }

  // Store current URL for SPA navigation
  var currentPath = window.location.pathname;

  // Scroll depth tracking state
  var currentUrl = null;
  var maxScrollDepthPx = 0;
  var lastSentScrollDepthPx = 0;
  var currentDocHeight = 0;

  function normalize(url) {
    var urlObj = new URL(url);
    var pathname = urlObj.pathname;
    for (var i = 0; i < urlPatterns.length; i++) {
      var match = urlPatterns[i].regex.exec(pathname);
      if (match) {
        var normalizedPath = `${urlPatterns[i].original.replace(
          /\*\*/g,
          "*",
        )}${pathname.slice(match[0].length)}`;
        return `${urlObj.origin}${normalizedPath}${urlObj.search}${urlObj.hash}`;
      }
    }
    return url;
  }

  function sendEvent(eventName, overrides = {}) {
    var url = normalize(window.location.href);
    var referrer = document.referrer || null;
    var userAgent = navigator.userAgent;
    var screenResolution = window.screen.width + "x" + window.screen.height;

    // Send event data
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
        ...overrides,
      }),
    })
      .then((res) => res.text())
      .catch(function (error) {
        console.error("Analytics event failed:", error);
      });
  }

  var queuedEvents = (window.betterlytics && window.betterlytics.q) || [];

  var replayConsentCallbacks = [];

  window.betterlytics = {
    event: (eventName, eventProps = {}) =>
      sendEvent(eventName, {
        is_custom_event: true,
        properties: JSON.stringify(eventProps),
      }),
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
    s.src = "https://unpkg.com/web-vitals@5/dist/web-vitals.iife.js";
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

  function flushScrollDepth(urlOverride) {
    if (maxScrollDepthPx <= lastSentScrollDepthPx) return;

    lastSentScrollDepthPx = maxScrollDepthPx;

    var percentage = Math.min(
      100,
      Math.round((maxScrollDepthPx / currentDocHeight) * 100),
    );

    var overrides = {
      scroll_depth_percentage: percentage,
      scroll_depth_pixels: maxScrollDepthPx,
    };
    if (urlOverride) overrides.url = urlOverride;

    sendEvent("scroll_depth", overrides);
  }

  function resetScrollDepth() {
    currentUrl = normalize(window.location.href);
    maxScrollDepthPx = 0;
    lastSentScrollDepthPx = 0;
    updateScrollDepth();
  }

  window.addEventListener("scroll", updateScrollDepth, { passive: true });

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") flushScrollDepth();
  });
  window.addEventListener("pagehide", flushScrollDepth);

  // Initialize currentUrl and capture initial viewport
  currentUrl = normalize(window.location.href);
  updateScrollDepth();

  function monitorContentHeight() {
    updateScrollDepth();
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
    // Override pushState to send navigation
    var originalPushState = history.pushState;
    history.pushState = function () {
      flushScrollDepth(); // Flush before URL changes (uses current URL)
      originalPushState.apply(this, arguments); // URL changes here
      if (currentPath !== window.location.pathname) {
        currentPath = window.location.pathname;
        resetScrollDepth();
        monitorContentHeight();
        sendEvent("pageview");
      }
    };

    // Detect popstate (back/forward navigation)
    window.addEventListener("popstate", function () {
      if (currentPath !== window.location.pathname) {
        currentPath = window.location.pathname;
        flushScrollDepth(currentUrl); // Pass old URL as override
        resetScrollDepth();
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

  if (enableReplay) {
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

      var hasCustomConsent = checkReplayConsent();

      if (hasCustomConsent) {
        if (shouldSample()) {
          replayLoaded = true;
          loadScript(`${scriptsBaseUrl}/replay.js`);
        }
      }
    }

    replayConsentCallbacks.push(function (consented) {
      if (consented && !replayLoaded && shouldSample()) {
        replayLoaded = true;
        loadScript(`${scriptsBaseUrl}/replay.js`);
      } else if (!consented && replayLoaded && window.__betterlytics_replay__) {
        if (
          window.__betterlytics_replay__.stop &&
          typeof window.__betterlytics_replay__.stop === "function"
        ) {
          window.__betterlytics_replay__.stop();
        }
      }
    });

    initReplay();
  }
})();
