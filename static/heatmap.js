// Betterlytics heatmaps: records where visitors click, loaded by analytics.js when data-heatmaps="true"
(function () {
  if (window.__betterlytics_heatmap__) {
    return;
  }
  var config = window.__betterlytics_heatmap_config__;
  if (!config || !config.siteId || !config.serverUrl || !config.normalize) {
    return;
  }

  var endpoint;
  try {
    endpoint = new URL(config.serverUrl).origin + "/heatmap/clicks";
  } catch (e) {
    return;
  }

  // The backend refuses batches over 200 clicks or 64 KiB and stores at most 300 clicks per session
  var MAX_BATCH_CLICKS = 200;
  var MAX_BATCH_BYTES = 56 * 1024;
  var MAX_CLICKS_PER_PAGE_LOAD = 300;
  var MAX_SELECTOR_CHARS = 200;
  var MAX_PAGE_WIDTH = 16384;
  var MAX_PAGE_HEIGHT = 1000000;

  var collecting = config.sampled === true;
  var clicksTaken = 0;
  var batch = null;

  // Same page path as pageviews; the query string and hash are dropped when stored anyway
  function currentPage() {
    var url = new URL(config.normalize(window.location.href));
    return url.origin + url.pathname;
  }

  function viewportWidth() {
    return document.documentElement.clientWidth || window.innerWidth || 0;
  }

  function pageSize() {
    var body = document.body || {};
    var el = document.documentElement || {};
    return {
      width: Math.max(body.scrollWidth || 0, el.scrollWidth || 0, el.clientWidth || 0),
      height: Math.max(
        body.scrollHeight || 0,
        body.offsetHeight || 0,
        body.clientHeight || 0,
        el.scrollHeight || 0,
        el.offsetHeight || 0,
        el.clientHeight || 0,
      ),
    };
  }

  function escapeCss(value) {
    if (window.CSS && CSS.escape) return CSS.escape(value);
    return value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }

  function matchesOnce(selector) {
    try {
      return document.querySelectorAll(selector).length === 1;
    } catch (e) {
      return false;
    }
  }

  // Position among siblings with the same tag, only when such siblings exist
  function nthOfType(el) {
    var parent = el.parentElement;
    if (!parent) return "";
    var count = 0;
    var position = 0;
    for (var sib = parent.firstElementChild; sib; sib = sib.nextElementSibling) {
      if (sib.tagName !== el.tagName) continue;
      count++;
      if (sib === el) position = count;
    }
    return count > 1 ? ":nth-of-type(" + position + ")" : "";
  }

  function selectorFor(target) {
    var parts = [];
    for (var el = target; el && el.nodeType === 1; el = el.parentElement) {
      var tag = el.tagName.toLowerCase();
      var id = el.getAttribute("id");
      // Generated ids (React useId and friends contain colons) change between renders
      if (id && id.indexOf(":") === -1) {
        var idPart = tag + "#" + escapeCss(id);
        var withId = [idPart].concat(parts).join(" > ");
        if (withId.length <= MAX_SELECTOR_CHARS && matchesOnce(withId)) {
          return withId;
        }
      }

      var position = tag === "html" || tag === "body" ? "" : nthOfType(el);
      var classes = (el.getAttribute("class") || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(function (c) {
          return "." + escapeCss(c);
        })
        .join("");
      var full = [tag + classes + position].concat(parts).join(" > ");
      var bare = [tag + position].concat(parts).join(" > ");
      var next = full.length <= MAX_SELECTOR_CHARS ? full : bare;
      if (next.length > MAX_SELECTOR_CHARS) break;

      parts.unshift(next === full ? tag + classes + position : tag + position);
      if (tag === "body" || tag === "html" || matchesOnce(next)) break;
    }
    return parts.join(" > ");
  }

  function isFixed(el) {
    for (; el && el.nodeType === 1; el = el.parentElement) {
      var position = window.getComputedStyle(el).position;
      if (position === "fixed" || position === "sticky") return true;
    }
    return false;
  }

  function fraction(offset, size) {
    if (!(size > 0)) return 0.5;
    return Math.round(Math.min(1, Math.max(0, offset / size)) * 10000) / 10000;
  }

  function send(body) {
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(endpoint, body)) return;
    } catch (e) {}
    try {
      fetch(endpoint, {
        method: "POST",
        keepalive: true,
        credentials: "omit",
        headers: { "Content-Type": "text/plain" },
        body: body,
      }).catch(function () {});
    } catch (e) {}
  }

  function flush() {
    var b = batch;
    batch = null;
    if (!b || b.clicks.length === 0) return;
    var now = Date.now();
    send(
      JSON.stringify({
        site_id: config.siteId,
        url: b.url,
        // Same value the pageview sends, so the batch resolves to the pageview's session
        screen_resolution: window.screen.width + "x" + window.screen.height,
        viewport_width: b.viewportWidth,
        document_width: b.documentWidth,
        document_height: b.documentHeight,
        clicks: b.clicks.map(function (c) {
          return {
            page_x: c.page_x,
            page_y: c.page_y,
            selector: c.selector,
            offset_x: c.offset_x,
            offset_y: c.offset_y,
            fixed: c.fixed,
            ms_ago: Math.max(0, now - c.at),
          };
        }),
      }),
    );
  }

  function recordClick(event) {
    if (!collecting || clicksTaken >= MAX_CLICKS_PER_PAGE_LOAD) return;
    // Keyboard and scripted clicks have no pointer position
    if (!event.isTrusted || event.detail === 0) return;
    var target = event.target;
    if (target && target.nodeType !== 1) target = target.parentElement;
    if (!target || !target.getBoundingClientRect) return;

    var width = viewportWidth();
    if (width < 1 || width > MAX_PAGE_WIDTH) return;

    // Measured from the document's top left corner, so never negative, also on RTL pages
    var doc = document.documentElement.getBoundingClientRect();
    var pageX = Math.round(event.clientX - doc.left);
    var pageY = Math.round(event.clientY - doc.top);
    if (pageX < 0 || pageY < 0 || pageX > MAX_PAGE_WIDTH || pageY > MAX_PAGE_HEIGHT) return;

    var page = currentPage();
    if (batch && (batch.url !== page || batch.viewportWidth !== width)) flush();
    if (!batch) {
      batch = {
        url: page,
        viewportWidth: width,
        documentWidth: 0,
        documentHeight: 0,
        clicks: [],
        bytes: 0,
      };
    }

    var rect = target.getBoundingClientRect();
    var click = {
      page_x: pageX,
      page_y: pageY,
      selector: selectorFor(target),
      offset_x: fraction(event.clientX - rect.left, rect.width),
      offset_y: fraction(event.clientY - rect.top, rect.height),
      fixed: isFixed(target),
      at: Date.now(),
    };
    if (!click.selector) return;

    var size = pageSize();
    batch.documentWidth = Math.min(
      MAX_PAGE_WIDTH,
      Math.max(batch.documentWidth, size.width, pageX, 1),
    );
    batch.documentHeight = Math.min(
      MAX_PAGE_HEIGHT,
      Math.max(batch.documentHeight, size.height, pageY, 1),
    );
    batch.clicks.push(click);
    batch.bytes += JSON.stringify(click).length + 16;
    clicksTaken++;

    if (batch.clicks.length >= MAX_BATCH_CLICKS || batch.bytes >= MAX_BATCH_BYTES) {
      flush();
    }
  }

  function safeRecordClick(event) {
    try {
      recordClick(event);
    } catch (e) {
      // Collection must never break the page's own click handling
    }
  }

  window.__betterlytics_heatmap__ = {
    // Called by analytics.js on every client-side page view with that page view's sample roll
    pageview: function (sampled) {
      flush();
      collecting = sampled === true;
    },
  };

  document.addEventListener("click", safeRecordClick, true);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") flush();
  });
  window.addEventListener("pagehide", flush);
})();
