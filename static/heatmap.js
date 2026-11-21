// Betterlytics heatmaps: records where visitors click, loaded by analytics.js when data-heatmaps="true"
(function () {
  if (window.__betterlytics_heatmap__) {
    return;
  }
  var config = window.__betterlytics_heatmap_config__;
  if (
    !config ||
    !config.siteId ||
    !config.serverUrl ||
    !config.normalize ||
    !config.documentHeight
  ) {
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
  var MAX_SELECTOR_CHARS = 500;
  var MAX_PAGE_WIDTH = 16384;
  var MAX_PAGE_HEIGHT = 1000000;
  // Batches only resolve to a session the backend still holds, which ends after 30 idle minutes.
  // Each batch's lookup counts as activity, so sending pending clicks this often keeps a page that
  // stays open alive.
  var MAX_PENDING_MS = 5 * 60 * 1000;

  // React useId output (":r1:", "«r1»", "_r_1_") changes between page loads, also inside
  // library ids such as Radix's "radix-_r_v_-trigger-exit"
  var GENERATED_ID = /[:«»]|_r_[0-9a-z]+_/i;
  // The generated part alone, so the fixed text around it ("radix-", "-trigger-exit") is kept
  var GENERATED_PART = /:[0-9a-z_]*:|«[0-9a-z_]*»|_r_[0-9a-z]+_/gi;

  var encoder = new TextEncoder();
  var collecting = config.sampled === true;
  // The pageview's value, so batches resolve to its session even after a phone rotates
  var screenResolution = config.screenResolution;
  var clicksTaken = 0;
  var batch = null;
  var pendingTimer = null;

  // Same page path as pageviews; the query string and hash are dropped when stored anyway
  function currentPage() {
    var url = new URL(config.normalize(window.location.href));
    return url.origin + url.pathname;
  }

  function matchesOnce(selector) {
    try {
      return document.querySelectorAll(selector).length === 1;
    } catch (e) {
      return false;
    }
  }

  // Position among same-tag siblings, only when another sibling also matches the part, so
  // adding an unrelated sibling (a logged-in nav link) doesn't change the selector
  function positionIfShared(el, part) {
    var parent = el.parentElement;
    if (!parent) return "";
    var shared = false;
    var count = 0;
    var position = 0;
    for (var sib = parent.firstElementChild; sib; sib = sib.nextElementSibling) {
      if (sib.tagName !== el.tagName) continue;
      count++;
      if (sib === el) position = count;
      else if (!shared && sib.matches(part)) shared = true;
    }
    return shared ? ":nth-of-type(" + position + ")" : "";
  }

  function classesOf(el) {
    return (el.getAttribute("class") || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(function (c) {
        return "." + CSS.escape(c);
      })
      .join("");
  }

  // An id that stays the same between page loads. Of a generated id only the fixed text around
  // the generated part is used, such as the start and end of "radix-«r1»-trigger-pages".
  function idPart(el) {
    var id = el.getAttribute("id");
    if (!id) return "";
    var tag = CSS.escape(el.tagName.toLowerCase());
    if (!GENERATED_ID.test(id)) return tag + "#" + CSS.escape(id);
    var pieces = id.split(GENERATED_PART);
    var prefix = pieces[0];
    var suffix = pieces[pieces.length - 1];
    if (pieces.length < 2 || !/[a-z]/i.test(suffix)) return "";
    return (
      tag +
      (prefix ? '[id^="' + CSS.escape(prefix) + '"]' : "") +
      '[id$="' + CSS.escape(suffix) + '"]'
    );
  }

  function partFor(el, withClasses) {
    var base = CSS.escape(el.tagName.toLowerCase()) + (withClasses ? classesOf(el) : "");
    return base + positionIfShared(el, base);
  }

  // Walks up until the selector matches only the target, then takes in the next ancestor too, which
  // often keeps a look-alike that renders later (the same kind of card further down) from matching
  // as well. Gives up at the length cap. That ancestor is never the body: there is only one, and its
  // classes change with themes and open dialogs. The page itself (html, body) keeps one part.
  function chainFor(target, withClasses) {
    var parts = [];
    for (var el = target; el && el.nodeType === 1; el = el.parentElement) {
      var anchor = idPart(el);
      if (anchor) {
        var withId = [anchor].concat(parts).join(" > ");
        if (withId.length <= MAX_SELECTOR_CHARS && matchesOnce(withId)) {
          return withId;
        }
      }
      parts.unshift(partFor(el, withClasses));
      var selector = parts.join(" > ");
      if (selector.length > MAX_SELECTOR_CHARS) return "";
      if (matchesOnce(selector)) {
        var parent = el.parentElement;
        if (!parent || parent === document.body || parent === document.documentElement) {
          return selector;
        }
        var longer = (idPart(parent) || partFor(parent, withClasses)) + " > " + selector;
        return longer.length <= MAX_SELECTOR_CHARS ? longer : selector;
      }
    }
    return "";
  }

  // Classes read better, but long class names can use up the cap before the chain is unique
  function selectorFor(target) {
    return chainFor(target, true) || chainFor(target, false);
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

  function flush() {
    clearTimeout(pendingTimer);
    pendingTimer = null;
    var b = batch;
    batch = null;
    if (!b || b.clicks.length === 0) return;
    var now = Date.now();
    fetch(endpoint, {
      method: "POST",
      keepalive: true,
      credentials: "omit",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({
        site_id: config.siteId,
        url: b.url,
        screen_resolution: b.screenResolution,
        viewport_width: b.viewportWidth,
        window_width: b.windowWidth,
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
    }).catch(function () {});
  }

  function recordClick(event) {
    if (!collecting || clicksTaken >= MAX_CLICKS_PER_PAGE_LOAD) return;
    // Keyboard and scripted clicks have no pointer position
    if (!event.isTrusted || event.detail === 0) return;
    var target = event.target;
    if (target && target.nodeType !== 1) target = target.parentElement;
    if (!target || !target.getBoundingClientRect) return;

    var root = document.documentElement;
    var viewportWidth = root.clientWidth || window.innerWidth || 0;
    if (viewportWidth < 1 || viewportWidth > MAX_PAGE_WIDTH) return;
    // The device follows CSS breakpoints, which count the scrollbar. Pinch zoom can shrink
    // innerWidth below the layout width, which the layout doesn't follow.
    var windowWidth = Math.min(MAX_PAGE_WIDTH, Math.max(viewportWidth, window.innerWidth || 0));

    // Measured from the document's top left corner. On RTL pages horizontal overflow
    // extends left of the root box, so it is added back.
    var origin = root.getBoundingClientRect();
    var rtlOverflow =
      window.getComputedStyle(root).direction === "rtl"
        ? root.scrollWidth - root.clientWidth
        : 0;
    var pageX = Math.round(event.clientX - origin.left + rtlOverflow);
    var pageY = Math.round(event.clientY - origin.top);
    if (pageX < 0 || pageY < 0 || pageX > MAX_PAGE_WIDTH || pageY > MAX_PAGE_HEIGHT) {
      return;
    }

    var selector = selectorFor(target);
    if (!selector) return;
    var rect = target.getBoundingClientRect();
    var click = {
      page_x: pageX,
      page_y: pageY,
      selector: selector,
      offset_x: fraction(event.clientX - rect.left, rect.width),
      offset_y: fraction(event.clientY - rect.top, rect.height),
      fixed: isFixed(target),
      at: Date.now(),
    };

    var page = currentPage();
    if (
      batch &&
      (batch.url !== page ||
        batch.viewportWidth !== viewportWidth ||
        batch.windowWidth !== windowWidth)
    ) {
      flush();
    }
    if (!batch) {
      batch = {
        url: page,
        screenResolution:
          screenResolution || window.screen.width + "x" + window.screen.height,
        viewportWidth: viewportWidth,
        windowWidth: windowWidth,
        documentWidth: 1,
        documentHeight: 1,
        clicks: [],
        bytes: 0,
      };
      pendingTimer = setTimeout(flush, MAX_PENDING_MS);
    }
    batch.documentWidth = Math.min(
      MAX_PAGE_WIDTH,
      Math.max(batch.documentWidth, root.scrollWidth, pageX),
    );
    batch.documentHeight = Math.min(
      MAX_PAGE_HEIGHT,
      Math.max(batch.documentHeight, config.documentHeight(), pageY),
    );
    batch.clicks.push(click);
    batch.bytes += encoder.encode(JSON.stringify(click)).byteLength + 16;
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
    // Called by analytics.js on every client-side page view
    pageview: function (sampled, resolution) {
      flush();
      collecting = sampled === true;
      screenResolution = resolution;
    },
  };

  document.addEventListener("click", safeRecordClick, true);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") flush();
  });
  window.addEventListener("pagehide", flush);
})();
