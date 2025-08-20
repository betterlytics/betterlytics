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

  function trackEvent(eventName, isCustomEvent = false, properties = {}) {
    var url = normalize(window.location.href);
    var referrer = document.referrer || null;
    var userAgent = navigator.userAgent;
    var screenResolution = window.screen.width + "x" + window.screen.height;

    // Generate visitor ID from browser fingerprint
    var visitorId = (function (fingerprint) {
      var hash = 0;
      for (var i = 0; i < fingerprint.length; i++) {
        var char = fingerprint.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(16);
    })(userAgent + screenResolution);

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
        is_custom_event: isCustomEvent,
        properties: JSON.stringify(properties),
        url: url,
        referrer: referrer,
        user_agent: userAgent,
        screen_resolution: screenResolution,
        visitor_id: visitorId,
        timestamp: Math.floor(Date.now() / 1000),
      }),
    }).catch(function (error) {
      console.error("Analytics tracking failed:", error);
    });
  }

  var queuedEvents = (window.betterlytics && window.betterlytics.q) || [];

  window.betterlytics = {
    event: (eventName, eventProps = {}) =>
      trackEvent(eventName, true, eventProps),
  };

  for (var i = 0; i < queuedEvents.length; i++) {
    window.betterlytics.event.apply(this, queuedEvents[i]);
  }

  if (script.getAttribute("data-web-vitals") === "true") {
    var s = document.createElement("script");
    s.src = "https://unpkg.com/web-vitals@5/dist/web-vitals.iife.js";
    s.async = true;
    s.onload = function () {
      var send = function (m) {
        window.betterlytics.event("cwv", {
          name: m.name,
          value: m.value,
          id: m.id,
          rating: m.rating,
          delta: m.delta,
          navigationType: m.navigationType,
        });
      };
      if (typeof webVitals !== "undefined") {
        webVitals.onCLS(send);
        webVitals.onINP(send);
        webVitals.onLCP(send);
        webVitals.onFCP(send);
        webVitals.onTTFB(send);
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
})();
