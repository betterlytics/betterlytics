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
      trackEvent("cwv", false, { metrics: metrics });
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

  // Track page visibility changes
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      trackEvent("pageview");
    }
  });

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
