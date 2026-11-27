// Betterlytics heatmap capture and live page preview. analytics.js loads this instead of tracking
// when the page is opened from a capture link from the dashboard or framed by the Heatmaps page.
// A capture is one snapshot of the editor's own view of the page.
(function () {
  var config = window.__betterlytics_capture__;
  if (!config || window.__betterlytics_capture_started__) {
    return;
  }
  window.__betterlytics_capture_started__ = true;

  if (config.hash === "#bl-preview") {
    if (window.parent !== window) startPreview();
    return;
  }

  // isCaptureMode() in analytics.js reads this key too, for the link's token and expires
  var CAPTURE_STORAGE_KEY = "betterlytics:capture";
  // As long as the dashboard's capture link lives
  var CAPTURE_LINK_TTL_MS = 15 * 60 * 1000;
  var capture = takeCaptureLink();
  if (!capture) {
    return;
  }

  var endpoint;
  try {
    endpoint = new URL(config.serverUrl).origin + "/heatmap/capture";
  } catch (e) {
    return;
  }

  var SCROLL_STEP_DELAY_MS = 150;
  var MAX_SCROLL_STEPS = 60;
  var IMAGE_WAIT_MS = 3000;
  // Inlined fonts count toward the upload limit of 10 MB compressed
  var MAX_FONT_BYTES = 4 * 1024 * 1024;
  var FONT_FACE = /@font-face\s*{[^}]*}/g;
  var CSS_URL = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g;
  // A link is used up only once a capture is stored, so other refusals can be retried
  var FINAL_REASONS = ["link_invalid", "wrong_site"];
  // Typed text lives in these as text, which maskAllInputs doesn't reach; site masks are honored
  var TYPED_TEXT = 'textarea, [contenteditable]:not([contenteditable="false"]), [data-rrweb-mask]';
  // Text the page shows or reads out from attributes, which privacy masking hides like other text
  var TEXT_ATTRIBUTES = ["alt", "title", "aria-label", "placeholder"];
  var PATH_CHECK_MS = 500;

  // "preparing" | "ready" | "capturing" | "finished"
  var phase = "preparing";
  var preparedPath = null;
  var panel = null;

  // replay.js brings rrweb; its own recorder stays off while __betterlytics_capture__ is set.
  // Content hash replaced by esbuild --define in static/build.mjs; unbuilt copies stay on "dev"
  var replayScriptHash = typeof __BL_REPLAY_HASH__ === "string" ? __BL_REPLAY_HASH__ : "dev";
  var replayScript = document.createElement("script");
  replayScript.src = `${config.scriptsBaseUrl}/replay.js?v=${replayScriptHash}`;
  replayScript.async = true;
  replayScript.onload = start;
  replayScript.onerror = function () {
    console.warn(
      "Betterlytics: the heatmap capture could not start because replay.js did not load (blocked by the page's Content-Security-Policy or an extension?)"
    );
  };
  document.head.appendChild(replayScript);

  function start() {
    panel = createPanel();
    prepare();

    // In-app navigation keeps this script running, so a page reached that way is prepared too
    setInterval(function () {
      if (phase === "ready" && window.location.pathname !== preparedPath) prepare();
    }, PATH_CHECK_MS);
  }

  // The page is scrolled through first, so lazy content loads and anything that opens on
  // scroll can be closed by the editor before capturing
  function prepare() {
    phase = "preparing";
    preparedPath = window.location.pathname;
    panel.show("working", "Loading the whole page...");
    scrollThrough()
      .then(waitForImages)
      .then(function () {
        if (window.location.pathname !== preparedPath) return prepare();
        phase = "ready";
        panel.show(
          "ready",
          capture.hideText
            ? "Set the page up the way visitors see it, then capture it. You can go to another page first. Text is hidden and form fields are masked."
            : "Set the page up the way visitors see it, then capture it. You can go to another page first. Text and images are kept as you see them; form fields are masked.",
          pageWarning()
        );
      });
  }

  // The page path this page's visits are grouped under, by the page's own data-dynamic-urls.
  // Another page may be captured on purpose, such as a staging copy on another path.
  function pageWarning() {
    if (!capture.page) return "";
    try {
      if (new URL(config.normalize(window.location.href)).pathname === capture.page) return "";
    } catch (e) {
      return "";
    }
    return "This page isn't one of the pages the heatmap " + capture.page + " covers. Go to one of those, or capture this page anyway.";
  }

  function startCapture() {
    phase = "capturing";
    panel.show("working", "Capturing...");
    scrollToTop()
      .then(function () {
        return inlineFonts(takeSnapshot());
      })
      .then(function (events) {
        panel.show("working", "Uploading...");
        return upload(events);
      })
      .then(function (result) {
        if (result.ok) {
          finish("done", "Captured. You can close this window.");
        } else if (FINAL_REASONS.indexOf(result.reason) === -1) {
          retry(result.message);
        } else {
          finish("final", result.message);
        }
      })
      .catch(function () {
        retry("The page could not be captured. Try again.");
      });
  }

  function retry(message) {
    phase = "ready";
    panel.show("failed", message);
  }

  function finish(state, message) {
    phase = "finished";
    try {
      sessionStorage.removeItem(CAPTURE_STORAGE_KEY);
    } catch (e) {}
    panel.show(state, message);
  }

  // Instant, also on sites with scroll-behavior: smooth, so the page isn't caught mid-scroll
  function scrollInstantly(top) {
    window.scrollTo({ top: top, left: 0, behavior: "instant" });
  }

  function scrollThrough() {
    return new Promise(function (resolve) {
      var root = document.documentElement;
      var step = Math.max(200, Math.round(window.innerHeight * 0.8));
      var steps = 0;
      function next() {
        var bottom = root.scrollHeight - window.innerHeight;
        if (window.scrollY >= bottom - 1 || steps >= MAX_SCROLL_STEPS) {
          scrollToTop().then(resolve);
          return;
        }
        steps++;
        scrollInstantly(Math.min(bottom, window.scrollY + step));
        setTimeout(next, SCROLL_STEP_DELAY_MS);
      }
      next();
    });
  }

  function scrollToTop() {
    scrollInstantly(0);
    return new Promise(function (resolve) {
      requestAnimationFrame(function () {
        requestAnimationFrame(resolve);
      });
    });
  }

  function waitForImages() {
    var pending = Array.prototype.filter.call(document.images, function (img) {
      return !img.complete;
    });
    var loaded = Promise.all(
      pending.map(function (img) {
        return new Promise(function (resolve) {
          img.addEventListener("load", resolve, { once: true });
          img.addEventListener("error", resolve, { once: true });
        });
      })
    );
    return Promise.race([
      loaded,
      new Promise(function (resolve) {
        setTimeout(resolve, IMAGE_WAIT_MS);
      }),
    ]);
  }

  // rrweb emits the Meta event and the full snapshot while record() starts on a loaded page,
  // so recording stops right after. The panel is taken out so it never ends up in the capture.
  function takeSnapshot() {
    var events = [];
    var stop = null;
    panel.detach();
    try {
      stop = window.rrweb.record({
        emit: function (event) {
          events.push(event);
        },
        maskAllInputs: true,
        maskTextSelector: capture.hideText ? "*" : TYPED_TEXT,
        recordCanvas: false,
        slimDOMOptions: {
          comment: true,
          headFavicon: true,
          headWhitespace: true,
          headMetaHttpEquiv: true,
          headMetaVerification: true,
        },
      });
    } finally {
      if (stop) stop();
      panel.attach();
    }
    events.forEach(function (event) {
      if (event.type === 4 && event.data) {
        event.data.clientWidth = viewportWidth();
      }
      if (event.type === 2 && event.data && event.data.node) {
        cleanNode(event.data.node);
      }
    });
    return events;
  }

  // A base tag would point the layout's relative URLs and links somewhere else in the dashboard.
  // maskAllInputs leaves the values of hidden and file fields, such as a CSRF token or a file's
  // name, which are never shown anyway.
  function cleanNode(node) {
    var attributes = node.type === 2 ? node.attributes : null;
    if (attributes && node.tagName === "base") {
      delete attributes.href;
      delete attributes.target;
    }
    if (attributes && node.tagName === "input" && /^(hidden|file)$/i.test(attributes.type)) {
      delete attributes.value;
    }
    if (attributes && capture.hideText) {
      maskTextAttributes(node.tagName, attributes);
    }
    if (node.childNodes) {
      node.childNodes.forEach(cleanNode);
    }
  }

  // Masked the way rrweb masks text, keeping the length. URLs stay, so the page still renders.
  function maskTextAttributes(tagName, attributes) {
    var names = TEXT_ATTRIBUTES;
    if (tagName === "button" || (tagName === "input" && /^(button|submit|reset)$/i.test(attributes.type))) {
      names = names.concat("value");
    }
    names.forEach(function (name) {
      if (typeof attributes[name] === "string") {
        attributes[name] = attributes[name].replace(/\S/g, "*");
      }
    });
  }

  // The dashboard can't load this site's fonts (font requests need CORS), so the site's own
  // @font-face files are embedded in the captured stylesheets
  function inlineFonts(events) {
    var styles = [];
    events.forEach(function (event) {
      if (event.type === 2 && event.data && event.data.node) {
        collectStyles(event.data.node, styles);
      }
    });
    var urls = [];
    styles.forEach(function (style) {
      fontUrls(style.owner[style.key]).forEach(function (url) {
        if (urls.indexOf(url) === -1) urls.push(url);
      });
    });
    var budget = MAX_FONT_BYTES;
    return urls
      .reduce(function (prev, url) {
        return prev.then(function (inlined) {
          return fetchAsDataUrl(url, budget).then(function (dataUrl) {
            if (dataUrl) {
              budget -= dataUrl.length;
              inlined[url] = dataUrl;
            }
            return inlined;
          });
        });
      }, Promise.resolve({}))
      .then(function (inlined) {
        styles.forEach(function (style) {
          style.owner[style.key] = style.owner[style.key].replace(FONT_FACE, function (face) {
            return face.replace(CSS_URL, function (match, quote, url) {
              return inlined[url] ? 'url("' + inlined[url] + '")' : match;
            });
          });
        });
        return events;
      });
  }

  // Linked and script-built stylesheets carry their CSS as _cssText; an inline <style> block
  // keeps it as a text node
  function collectStyles(node, out) {
    if (node.type === 2 && node.attributes && typeof node.attributes._cssText === "string") {
      out.push({ owner: node.attributes, key: "_cssText" });
    } else if (node.type === 3 && node.isStyle && typeof node.textContent === "string") {
      out.push({ owner: node, key: "textContent" });
    }
    if (node.childNodes) {
      node.childNodes.forEach(function (child) {
        collectStyles(child, out);
      });
    }
  }

  function fontUrls(cssText) {
    var found = [];
    (cssText.match(FONT_FACE) || []).forEach(function (face) {
      face.replace(CSS_URL, function (match, quote, url) {
        try {
          if (new URL(url, window.location.href).origin === window.location.origin) {
            found.push(url);
          }
        } catch (e) {}
        return match;
      });
    });
    return found;
  }

  function fetchAsDataUrl(url, budget) {
    return fetch(url, { credentials: "same-origin" })
      .then(function (res) {
        return res.ok ? res.blob() : null;
      })
      .then(function (blob) {
        // Base64 makes a file a third larger
        if (!blob || blob.size * 1.37 > budget) return null;
        return new Promise(function (resolve) {
          var reader = new FileReader();
          reader.onload = function () {
            resolve(typeof reader.result === "string" ? reader.result : null);
          };
          reader.onerror = function () {
            resolve(null);
          };
          reader.readAsDataURL(blob);
        });
      })
      .catch(function () {
        return null;
      });
  }

  function viewportWidth() {
    return document.documentElement.clientWidth || window.innerWidth;
  }

  // The width CSS breakpoints see, scrollbar included, which the link's device is checked against.
  // On phones pinch zoom moves innerWidth away from the layout both ways, so a wider innerWidth
  // only counts when a media query confirms it.
  function windowWidth() {
    var layout = viewportWidth();
    var inner = window.innerWidth || 0;
    if (inner <= layout) return layout;
    try {
      return window.matchMedia("(min-width: " + (inner - 1) + "px)").matches ? inner : layout;
    } catch (e) {
      return layout;
    }
  }

  function gzip(text) {
    var bytes = new TextEncoder().encode(text);
    if (typeof CompressionStream === "undefined") {
      return Promise.resolve({ bytes: bytes, gzip: false });
    }
    try {
      var stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip"));
      return new Response(stream)
        .arrayBuffer()
        .then(function (buffer) {
          return { bytes: new Uint8Array(buffer), gzip: true };
        })
        .catch(function () {
          return { bytes: bytes, gzip: false };
        });
    } catch (e) {
      return Promise.resolve({ bytes: bytes, gzip: false });
    }
  }

  function upload(events) {
    return gzip(JSON.stringify(events)).then(function (encoded) {
      var query =
        "site_id=" +
        encodeURIComponent(config.siteId) +
        "&viewport_width=" +
        viewportWidth() +
        "&window_width=" +
        windowWidth() +
        "&document_height=" +
        config.documentHeight() +
        (encoded.gzip ? "&encoding=gzip" : "");
      return fetch(endpoint + "?" + query, {
        method: "POST",
        credentials: "omit",
        // Not Authorization: a cross-origin preflight's "*" never allows that header
        headers: { "X-Capture-Token": capture.token },
        body: encoded.bytes,
      }).then(
        function (res) {
          if (res.ok) return { ok: true };
          return res.json().then(
            function (body) {
              return { ok: false, reason: body.reason, message: body.message };
            },
            function () {
              return {
                ok: false,
                reason: res.status === 413 ? "too_large" : "failed",
                message:
                  res.status === 413
                    ? "This page is too large to capture."
                    : "The capture could not be uploaded (" + res.status + "). Try again.",
              };
            }
          );
        },
        function () {
          return {
            ok: false,
            reason: "network",
            message: "The capture could not be uploaded. This page's security settings may block it.",
          };
        }
      );
    });
  }

  // Shadow DOM keeps the page's CSS off the panel
  function createPanel() {
    var host = document.createElement("div");
    host.setAttribute("data-betterlytics-capture", "");
    host.style.cssText = "all:initial;position:fixed;right:16px;bottom:16px;z-index:2147483647;";
    var root = host.attachShadow ? host.attachShadow({ mode: "closed" }) : host;
    root.innerHTML =
      "<style>" +
      ".panel{box-sizing:border-box;width:320px;padding:16px;border-radius:12px;background:#111827;color:#f9fafb;" +
      "font:14px/1.45 system-ui,-apple-system,'Segoe UI',sans-serif;box-shadow:0 12px 32px rgba(0,0,0,.35)}" +
      ".title{font-weight:600;margin:0 0 6px}.message{margin:0 0 12px;color:#d1d5db}.warning{margin:0 0 12px;color:#fcd34d}" +
      "button{font:inherit;font-weight:600;border:0;border-radius:8px;padding:8px 14px;cursor:pointer;background:#6366f1;color:#fff}" +
      "button[hidden],.warning[hidden]{display:none}.done .title{color:#86efac}.failed .title,.final .title{color:#fca5a5}" +
      "</style>" +
      '<div class="panel"><p class="title"></p><p class="message"></p><p class="warning" hidden></p><button type="button"></button></div>';
    var box = root.querySelector(".panel");
    var title = root.querySelector(".title");
    var message = root.querySelector(".message");
    var warning = root.querySelector(".warning");
    var button = root.querySelector("button");
    var action = null;
    button.addEventListener("click", function () {
      if (action) action();
    });
    document.documentElement.appendChild(host);

    // Kept in the visible part of the page: on a phone a page wider than the screen widens the
    // layout viewport, and a corner of that is off screen
    function place() {
      var view = window.visualViewport;
      if (!view) return;
      var width = Math.min(320, Math.max(200, view.width - 32));
      box.style.width = width + "px";
      host.style.right = "auto";
      host.style.bottom = "auto";
      host.style.left = Math.max(0, Math.round(view.offsetLeft + view.width - width - 16)) + "px";
      host.style.top = Math.max(0, Math.round(view.offsetTop + view.height - box.offsetHeight - 16)) + "px";
    }
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", place);
      window.visualViewport.addEventListener("scroll", place);
    }

    var states = {
      ready: { title: "Betterlytics heatmap capture", label: "Capture page", action: startCapture },
      working: { title: "Capturing this page", label: null, action: null },
      done: {
        title: "Page captured",
        label: "Close window",
        action: function () {
          window.close();
        },
      },
      failed: { title: "Capture failed", label: "Try again", action: startCapture },
      final: { title: "Capture failed", label: null, action: null },
    };

    return {
      show: function (state, text, warningText) {
        var s = states[state];
        box.className = "panel " + state;
        title.textContent = s.title;
        message.textContent = text;
        warning.textContent = warningText || "";
        warning.hidden = !warningText;
        button.hidden = !s.label;
        button.textContent = s.label || "";
        action = s.action;
        place();
      },
      detach: function () {
        host.remove();
      },
      attach: function () {
        document.documentElement.appendChild(host);
        place();
      },
    };
  }

  // analytics.js has already taken the link out of the address bar, so it isn't shared or
  // bookmarked. It is kept for this tab until the link expires, so a reload (a consent banner's,
  // say) or going on to other pages continues the capture instead of tracking a visit.
  function takeCaptureLink() {
    var hash = config.hash;
    if (hash.indexOf("#bl-capture=") === 0) {
      var params = new URLSearchParams(hash.slice(1));
      var token = params.get("bl-capture");
      if (!token) return null;
      // Anyone can send a visitor a link like this, so only a page path is shown in the panel
      var page = params.get("bl-page") || "";
      var link = {
        token: token,
        hideText: params.get("bl-hide-text") === "1",
        page: /^\/\S{0,2047}$/.test(page) ? page : "",
        expires: Date.now() + CAPTURE_LINK_TTL_MS,
      };
      try {
        sessionStorage.setItem(CAPTURE_STORAGE_KEY, JSON.stringify(link));
      } catch (e) {}
      return link;
    }
    try {
      var stored = JSON.parse(sessionStorage.getItem(CAPTURE_STORAGE_KEY));
      if (stored && stored.token && stored.expires > Date.now()) {
        return stored;
      }
      if (stored) sessionStorage.removeItem(CAPTURE_STORAGE_KEY);
    } catch (e) {}
    return null;
  }

  // The Heatmaps page frames the live page: tell the dashboard how tall the page is, which page the
  // frame ended up on, and where the elements that got clicks are, so it can put the clicks on
  // them. Messages go only to the dashboard, the origin this script is served from, since the
  // page's height and path can tell another site something about the visitor.
  function startPreview() {
    var dashboardOrigin;
    try {
      dashboardOrigin = new URL(config.scriptsBaseUrl).origin;
    } catch (e) {
      return;
    }
    // The dashboard asks for its 2000 most clicked selectors at most, and heatmap.js keeps them
    // under 500 characters. A selector matching more than 20 elements was made on a very
    // different page, as on captures.
    var MAX_FIND_SELECTORS = 2000;
    var MAX_SELECTOR_CHARS = 500;
    var MAX_MATCHES = 20;
    // Elements are looked up again once the page has been still this long after a report or the
    // end of a transition or animation, and once more a while after a report, for animations run
    // by scripts
    var FIND_DELAY_MS = 300;
    var SETTLED_FIND_DELAY_MS = 1500;
    var SCROLLING_OVERFLOW = /^(auto|scroll|overlay)$/;
    var selectors = [];
    var lastFound = null;
    var findTimer = null;
    var settledTimer = null;

    // The heat is drawn at the frame's full width, the width visitors' clicks were recorded at,
    // so the page's own scrollbar must not take any of it. The dashboard scrolls the frame.
    document.documentElement.style.setProperty("scrollbar-width", "none", "important");
    function post(message) {
      window.parent.postMessage(message, dashboardOrigin);
    }
    function report() {
      post({
        type: "betterlytics:preview",
        height: config.documentHeight(),
        path: window.location.pathname,
      });
      // Late content and scrolling can move the elements
      scheduleFind();
      if (selectors.length > 0) {
        clearTimeout(settledTimer);
        settledTimer = setTimeout(sendFound, SETTLED_FIND_DELAY_MS);
      }
    }
    function scheduleFind() {
      if (selectors.length === 0) return;
      clearTimeout(findTimer);
      findTimer = setTimeout(sendFound, FIND_DELAY_MS);
    }
    // Sent when asked, then again whenever the elements have moved
    function sendFound(asked) {
      var found = findElements();
      var json = JSON.stringify(found);
      if (asked !== true && json === lastFound) return;
      lastFound = json;
      post({ type: "betterlytics:preview-found", found: found });
    }
    window.addEventListener("message", function (event) {
      if (event.source !== window.parent || event.origin !== dashboardOrigin) {
        return;
      }
      var data = event.data;
      if (!data) return;
      // The frame keeps a visitor's window height and is scrolled along with the heatmap
      if (data.type === "betterlytics:preview-scroll" && typeof data.y === "number") {
        window.scrollTo({ top: data.y, behavior: "instant" });
        // Scrolling can load more of the page
        report();
      } else if (data.type === "betterlytics:preview-find" && Array.isArray(data.selectors)) {
        selectors = data.selectors
          .filter(function (selector) {
            return typeof selector === "string" && selector.length <= MAX_SELECTOR_CHARS;
          })
          .slice(0, MAX_FIND_SELECTORS);
        sendFound(true);
      }
    });
    // Content revealed on scroll and carousels move elements after the report
    document.addEventListener("transitionend", scheduleFind, true);
    document.addEventListener("animationend", scheduleFind, true);

    // Each selector's elements, as [left, top, width, height] boxes on the page: the element's own,
    // and the area its clicks are compared with, which is the outermost part around it that scrolls
    // its own content, since a click's page position includes the visitor's scroll there. Elements
    // in a fixed or sticky part, cut off by a part around them (a carousel's other slides, say), or
    // off the page aren't where the dashboard draws the page's heat, so they are left out.
    // findInDocument in the dashboard's placeClicks.ts finds elements on captures by the same rules,
    // except that it keeps elements that are cut off, and only counts scrolling parts it can draw
    // heat inside; the frame is another origin, so the two can't share code.
    function findElements() {
      var root = document.documentElement;
      var pageScrolls = root.scrollHeight > root.clientHeight;
      var pageWidth = root.clientWidth;
      var found = [];
      for (var i = 0; i < selectors.length; i++) {
        var matches;
        try {
          matches = document.querySelectorAll(selectors[i]);
        } catch (e) {
          continue;
        }
        if (matches.length > MAX_MATCHES) continue;
        var elements = [];
        for (var j = 0; j < matches.length; j++) {
          var element = elementOnPage(matches[j], pageScrolls, pageWidth);
          if (element) elements.push(element);
        }
        if (elements.length > 0) found.push({ selector: selectors[i], elements: elements });
      }
      return found;
    }
    function elementOnPage(element, pageScrolls, pageWidth) {
      var rect = element.getBoundingClientRect();
      if (!(rect.width > 0 && rect.height > 0)) return null;
      // Moved off the page until it opens, like some menus and drawers
      if (rect.right <= 0 || rect.left >= pageWidth || rect.bottom + window.scrollY <= 0) return null;
      var area = rect;
      for (var el = element; el && el !== document.documentElement; el = el.parentElement) {
        var style = window.getComputedStyle(el);
        if (style.position === "fixed" || style.position === "sticky") return null;
        // The body's overflow belongs to the page unless the body scrolls in place of it
        if (el === element || (el === document.body && pageScrolls) || !cutsOffContent(style)) {
          continue;
        }
        var part = el.getBoundingClientRect();
        if (rect.right <= part.left || rect.left >= part.right || rect.bottom <= part.top || rect.top >= part.bottom) {
          return null;
        }
        if (scrollsOwnContent(el, style)) area = part;
      }
      return { box: pageBox(rect), area: pageBox(area) };
    }
    function cutsOffContent(style) {
      return style.overflowX !== "visible" || style.overflowY !== "visible";
    }
    function scrollsOwnContent(el, style) {
      return (
        (SCROLLING_OVERFLOW.test(style.overflowY) && el.scrollHeight > el.clientHeight) ||
        (SCROLLING_OVERFLOW.test(style.overflowX) && el.scrollWidth > el.clientWidth)
      );
    }
    function pageBox(rect) {
      return [
        Math.round(rect.left + window.scrollX),
        Math.round(rect.top + window.scrollY),
        Math.round(rect.width),
        Math.round(rect.height),
      ];
    }

    report();
    // Late content keeps changing the height for a while after load
    var reports = 0;
    var timer = setInterval(function () {
      report();
      if (++reports >= 20) clearInterval(timer);
    }, 500);
  }
})();
