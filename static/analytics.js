// Betterlytics - Privacy-focused, cookieless analytics
(function () {
  // Get the script element and required site ID
  var script =
    document.currentScript ||
    document.querySelector('script[src*="analytics.js"]');
  var siteId = script.getAttribute("data-site-id");
  var serverUrl = script.getAttribute("data-server-url");

  if (!siteId) {
    return console.error("Betterlytics: data-site-id attribute missing");
  }

  if (!serverUrl) {
    return console.error("Betterlytics: data-server-url attribute missing");
  }

  // Track current path for SPA navigation
  var currentPath = window.location.pathname;

  function trackEvent(eventName, isCustomEvent = false, properties = {}) {
    var url = window.location.href;
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

  window.betterlytics = (eventName, eventProps = {}) =>
    trackEvent(eventName, true, eventProps);

  // DEPRECATED: Remains temporarily for backwards compatibility
  window.baEvent = (eventName, eventProps = {}) =>
    trackEvent(eventName, true, eventProps);

  for (var i = 0; i < queuedEvents.length; i++) {
    window.betterlytics.apply(this, queuedEvents[i]);
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
