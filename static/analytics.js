// Betterlytics - Privacy-focused, cookieless analytics
(function () {
  // Get the script element and required attributes
  var script =
    document.currentScript ||
    document.querySelector('script[src*="analytics.js"]');
  var siteId = script.getAttribute("data-site-id");
  var serverUrl = script.getAttribute("data-server-url");
  var urlPatterns =
    script
      .getAttribute("data-dynamic-urls")
      ?.split(",")
      .map(function (p) {
        p = p.trim();
        return {
          original: p,
          regex: new RegExp(
            `^${p.replace(/\*\*/g, "(.+)").replace(/\*/g, "([^/]+)")}`
          ),
        };
      }) ?? [];

  // "off" | "domain" | "full" (defaults to "domain")
  var outboundLinks = script.getAttribute("data-outbound-links") ?? "domain";

  if (!siteId) {
    return console.error("Betterlytics: data-site-id attribute missing");
  }

  if (!serverUrl) {
    return console.error("Betterlytics: data-server-url attribute missing");
  }

  // Track current path for SPA navigation
  var currentPath = window.location.pathname;

  function normalize(url) {
    var urlObj = new URL(url);
    var pathname = urlObj.pathname;
    for (var i = 0; i < urlPatterns.length; i++) {
      var match = urlPatterns[i].regex.exec(pathname);
      if (match) {
        var normalizedPath = `${urlPatterns[i].original.replace(
          /\*\*/g,
          "*"
        )}${pathname.slice(match[0].length)}`;
        return `${urlObj.origin}${normalizedPath}${urlObj.search}${urlObj.hash}`;
      }
    }
    return url;
  }

  function trackEvent(eventName, overrides = {}) {
    var url = normalize(window.location.href);
    var referrer = document.referrer || null;
    var userAgent = navigator.userAgent;
    var screenResolution = window.screen.width + "x" + window.screen.height;

    // Send tracking data
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
    }).catch(function (error) {
      console.error("Analytics tracking failed:", error);
    });
  }

  var queuedEvents = (window.betterlytics && window.betterlytics.q) || [];

  window.betterlytics = {
    event: (eventName, eventProps = {}) =>
      trackEvent(eventName, {
        is_custom_event: true,
        properties: JSON.stringify(eventProps),
      }),
  };

  for (var i = 0; i < queuedEvents.length; i++) {
    window.betterlytics.event.apply(this, queuedEvents[i]);
  }

  // Web Vitals batching (send once per page lifecycle)
  if (script.getAttribute("data-web-vitals") === "true") {
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
      trackEvent("cwv", {
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

  // Track initial page view
  trackEvent("pageview");

  // Track SPA navigation
  if (window.history.pushState) {
    // Override pushState to track navigation
    var originalPushState = history.pushState;
    history.pushState = function () {
      originalPushState.apply(this, arguments);
      if (currentPath !== window.location.pathname) {
        currentPath = window.location.pathname;
        trackEvent("pageview");
      }
    };

    // Track popstate (back/forward navigation)
    window.addEventListener("popstate", function () {
      if (currentPath !== window.location.pathname) {
        currentPath = window.location.pathname;
        trackEvent("pageview");
      }
    });
  }

  // Outbound link tracking
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

  // Session Replay (rrweb) - feature flagged via data-replay="true"
  var enableReplay =
    (script.getAttribute("data-replay") || "false").toLowerCase() === "true";
  var replaySamplePct = parseInt(
    script.getAttribute("data-replay-sample") || "0",
    10
  );
  if (isNaN(replaySamplePct) || replaySamplePct < 0 || replaySamplePct > 100) {
    replaySamplePct = 0;
  }
  var apiBase = null;
  try {
    apiBase = new URL(serverUrl).origin;
  } catch (e) {}

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

  function nowSec() {
    return Math.floor(Date.now() / 1000);
  }

  (function initSessionReplay() {
    if (!enableReplay || !apiBase) return;
    if (replaySamplePct > 0 && Math.random() * 100 >= replaySamplePct) return;

    var rrLoaded = false;
    var recordingStop = null;
    var buffer = [];
    var segmentIdx = 0;
    var sizeBytes = 0;
    var startedAt = Date.now();
    var lastActivity = Date.now();
    var flushTimer = null;
    var maxChunkMs = 15000;
    var visId = null;
    var replaySession = { id: null };

    function markActivity() {
      lastActivity = Date.now();
    }

    ["mousemove", "keydown", "scroll", "click", "visibilitychange"].forEach(
      function (ev) {
        window.addEventListener(ev, markActivity, { passive: true });
      }
    );

    function flush(force) {
      if (buffer.length === 0) return Promise.resolve();
      var events = buffer;
      buffer = [];
      var packed =
        window.rrwebPack && window.rrwebPack.pack
          ? window.rrwebPack.pack(events)
          : events;
      var json = JSON.stringify(packed);
      var bytes = new TextEncoder().encode(json);

      return fetch(apiBase + "/replay/presign/put", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_id: siteId,
          screen_resolution: window.screen.width + "x" + window.screen.height,
          content_type: "application/json",
        }),
      })
        .then(function (r) {
          return r.json();
        })
        .then(function (resp) {
          if (!replaySession.id) replaySession.id = resp.session_id;
          if (!visId) visId = resp.visitor_id;
          sizeBytes += bytes.byteLength;
          return fetch(resp.url, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: bytes,
          });
        })
        .catch(function (e) {
          // On failure, re-queue events into the next buffer to avoid loss
          try {
            buffer = events.concat(buffer);
          } catch (_) {}
        });
    }

    function startFlushLoop() {
      if (flushTimer) clearInterval(flushTimer);
      flushTimer = setInterval(function () {
        if (Date.now() - lastActivity > 15 * 60 * 1000) {
          // idle cutoff: stop recording and finalize
          stopRecording(true);
          return;
        }
        if (buffer.length > 0) {
          flush(false);
        }
      }, Math.max(3000, maxChunkMs));
    }

    function stopRecording(finalize) {
      try {
        if (recordingStop) {
          recordingStop();
          recordingStop = null;
        }
      } catch (e) {}
      if (flushTimer) {
        clearInterval(flushTimer);
        flushTimer = null;
      }
      flush(true)
        .then(function () {
          if (!finalize) return;
          return fetch(apiBase + "/replay/finalize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              site_id: siteId,
              session_id: replaySession.id,
              visitor_id: visId,
              started_at: Math.floor(startedAt / 1000),
              ended_at: nowSec(),
              // Keep finalize lean; server can enrich from events table later
              country_code: null,
              device_type: null,
              ua_family: null,
              pages: 0,
              errors: 0,
              size_bytes: sizeBytes,
              segment_count: segmentIdx,
              sample_rate: replaySamplePct,
              has_network_logs: false,
              start_url: normalize(window.location.href),
            }),
          }).catch(function () {});
        })
        .catch(function () {});
    }

    function startRecording() {
      if (!window.rrweb || rrLoaded) return;
      rrLoaded = true;
      recordingStop = window.rrweb.record({
        emit: function (e) {
          buffer.push(e);
          markActivity();
        },
        checkoutEveryNms: 5 * 60 * 1000,
        maskAllInputs: true,
        maskInputOptions: {
          text: true,
          password: true,
          email: true,
          number: true,
        },
        blockClass: "rr-block",
        ignoreClass: "rr-ignore",
        maskTextSelector: "input[type=password], [data-rrweb-mask]",
        sampling: { mousemove: 50, input: "last", media: 25 },
      });
      startFlushLoop();
    }

    // Load rrweb from the same directory as this script, then start
    var rrLocalUrl = new URL("rrweb.min.js", script.src).href;
    loadScript(rrLocalUrl)
      .then(function () {
        startRecording();
      })
      .catch(function () {});

    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") {
        stopRecording(true);
      }
    });
    window.addEventListener("pagehide", function () {
      stopRecording(true);
    });
  })();

  // Only enable if outbounds is set to "domain" or "full"
  if (["domain", "full"].includes(outboundLinks)) {
    // Set up outbound link click tracking
    document.addEventListener("click", function (event) {
      var target = event.target.closest("a");
      if (target && target.href) {
        const parsed = parseOutboundLink(target);
        if (parsed) {
          trackEvent("outbound_link", {
            outbound_link_url: parsed,
          });
        }
      }
    });
  }
})();
