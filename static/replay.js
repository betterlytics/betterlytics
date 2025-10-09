(function () {
  if (window.__betterlytics_replay_initialized__) {
    return;
  }
  window.__betterlytics_replay_initialized__ = true;

  var script = document.querySelector('script[src*="analytics.js"]');

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

  var disableReplayOnUrls =
    script
      .getAttribute("data-disable-replay-on-urls")
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

  var scriptsBaseUrl =
    script.getAttribute("data-scripts-base-url") ?? "http://localhost:3006";

  // Session Replay (rrweb) - feature flagged via data-replay="true"
  var replaySamplePct = parseInt(
    script.getAttribute("data-replay-sample") || "0",
    10
  );
  var minReplayDurationSec = parseInt(
    script.getAttribute("data-replay-min-duration") || "15",
    10
  );
  var idleCutoffMs = (function () {
    var secs = parseInt(
      script.getAttribute("data-replay-idle-cutoff") || "600",
      10
    );
    if (isNaN(secs) || secs < 1) secs = 600;
    return secs * 1000;
  })();
  var maxDurationMs = (function () {
    var secs = parseInt(
      script.getAttribute("data-replay-max-duration") || "1200",
      10
    );
    if (isNaN(secs) || secs < 1) secs = 1200;
    return secs * 1000;
  })();
  if (isNaN(replaySamplePct) || replaySamplePct < 0 || replaySamplePct > 100) {
    replaySamplePct = 0;
  }
  if (isNaN(minReplayDurationSec) || minReplayDurationSec < 0) {
    minReplayDurationSec = 0;
  }
  var apiBase = null;
  try {
    apiBase = new URL(serverUrl).origin;
  } catch (e) {}

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

  function isReplayEnabledOnPage() {
    var urlObj = new URL(window.location.href);
    var pathname = urlObj.pathname;
    for (var i = 0; i < disableReplayOnUrls.length; i++) {
      var match = disableReplayOnUrls[i].regex.exec(pathname);
      if (match) {
        return false;
      }
    }
    return true;
  }

  // Emit a rrweb custom event for pageview and optionally force a full snapshot (useful for SPA route changes)
  function emitReplayPageview(url, takeSnapshot) {
    try {
      if (window.rrweb && window.rrweb.record) {
        if (typeof window.rrweb.record.addCustomEvent === "function") {
          window.rrweb.record.addCustomEvent("Pageview", {
            url: normalize(url),
          });
        }
        if (
          takeSnapshot &&
          typeof window.rrweb.record.takeFullSnapshot === "function"
        ) {
          window.rrweb.record.takeFullSnapshot();
        }
      }
    } catch (_) {}
  }

  function emitReplayBlacklist() {
    try {
      if (window.rrweb && window.rrweb.record) {
        if (typeof window.rrweb.record.addCustomEvent === "function") {
          window.rrweb.record.addCustomEvent("Blacklist", {});
        }
      }
    } catch {}
  }

  function encodeReplayChunk(json) {
    var encoder = new TextEncoder();
    var rawBytes = encoder.encode(json);
    if (typeof CompressionStream === "undefined") {
      return Promise.resolve({ bytes: rawBytes, encoding: null });
    }
    try {
      var stream = new CompressionStream("gzip");
      var writable = stream.writable.getWriter();
      writable.write(rawBytes);
      writable.close();
      return new Response(stream.readable)
        .arrayBuffer()
        .then(function (buf) {
          return { bytes: new Uint8Array(buf), encoding: "gzip" };
        })
        .catch(function () {
          return { bytes: rawBytes, encoding: null };
        });
    } catch (e) {
      return Promise.resolve({ bytes: rawBytes, encoding: null });
    }
  }

  (function initSessionReplay() {
    if (!apiBase) return;
    if (replaySamplePct > 0 && Math.random() * 100 >= replaySamplePct) return;

    var state = {
      initialized: false,
      recordingStop: null,
      isRecording: false,
      disabled: false,
      buffer: [],
      approxBytes: 0,
      sizeBytes: 0,
      uploadedEventCount: 0,
      startedAt: Date.now(),
      firstActivity: null,
      lastActivity: Date.now(),
      flushTimer: null,
      ongoingFlush: null,
      visId: null,
      replaySession: { id: null },
      consecutiveFlushErrors: 0,
    };

    var config = {
      maxChunkMs: 30000,
      maxUncompressedBytes: 1 * 1024 * 1024,
      maxConsecutiveFlushErrors: 3,
    };

    function hasReachedMinDuration() {
      if (!minReplayDurationSec) return true;
      return (
        Math.floor((Date.now() - state.startedAt) / 1000) >=
        minReplayDurationSec
      );
    }

    function fetchPresignedUrl(payload) {
      var presignPayload = {
        site_id: siteId,
        screen_resolution: window.screen.width + "x" + window.screen.height,
        content_length: payload.bytes.byteLength,
      };
      if (payload.encoding === "gzip") {
        presignPayload.content_encoding = "gzip";
      }

      return fetch(apiBase + "/replay/presign/put", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(presignPayload),
      })
        .then(function (r) {
          return r.json();
        })
        .then(function (resp) {
          return { presignResp: resp, payload: payload };
        });
    }

    function uploadToS3(data) {
      var presignResp = data.presignResp;
      var payload = data.payload;

      if (!state.replaySession.id)
        state.replaySession.id = presignResp.session_id;
      if (!state.visId) state.visId = presignResp.visitor_id;

      var headers = {
        "Content-Type": "application/json",
      };
      if (payload.encoding === "gzip") {
        headers["Content-Encoding"] = "gzip";
      }

      return fetch(presignResp.url, {
        method: "PUT",
        headers: headers,
        body: payload.bytes,
      }).then(function (putResp) {
        if (!putResp || putResp.status >= 400) {
          throw new Error();
        }
        return { putResp: putResp, payload: payload };
      });
    }

    function handleUploadSuccess(data, flushedEventCount) {
      state.uploadedEventCount += flushedEventCount;
      state.sizeBytes += data.payload.bytes.byteLength;
      state.consecutiveFlushErrors = 0;
    }

    function handleFlushError(events) {
      state.consecutiveFlushErrors += 1;
      if (state.consecutiveFlushErrors >= config.maxConsecutiveFlushErrors) {
        state.disabled = true;
        state.buffer = [];
        state.approxBytes = 0;
        try {
          stopRecording(false);
        } catch (_) {}
      } else {
        state.buffer = events.concat(state.buffer);
      }
    }

    function flush() {
      if (state.disabled) return Promise.resolve();
      if (state.buffer.length === 0) return Promise.resolve();
      if (state.ongoingFlush) return state.ongoingFlush;

      var events = state.buffer;
      state.buffer = [];

      if (!hasReachedMinDuration()) {
        state.buffer = events.concat(state.buffer);
        return Promise.resolve();
      }

      var json = JSON.stringify(events);
      var flushedEventCount = events.length;
      state.approxBytes = 0;

      state.ongoingFlush = encodeReplayChunk(json)
        .then(fetchPresignedUrl)
        .then(uploadToS3)
        .then(function (data) {
          handleUploadSuccess(data, flushedEventCount);
        })
        .catch(function () {
          try {
            handleFlushError(events);
          } catch (_) {}
        })
        .finally(function () {
          state.ongoingFlush = null;
        });
      return state.ongoingFlush;
    }

    function flushAll() {
      return flush().then(function () {
        if (state.disabled) return;
        if (state.buffer.length === 0) return;
        return flushAll();
      });
    }

    function startFlushLoop() {
      if (state.flushTimer) clearInterval(state.flushTimer);
      state.flushTimer = setInterval(function () {
        if (Date.now() - state.lastActivity > idleCutoffMs) {
          stopRecording(true);
          return;
        }
        if (Date.now() - state.startedAt > maxDurationMs) {
          stopRecording(true);
          return;
        }
        if (state.buffer.length > 0) {
          flush();
        }
      }, Math.max(3000, config.maxChunkMs));
    }

    function finalizeSession() {
      if (state.disabled) return;
      if (!hasReachedMinDuration()) return;
      if (!state.replaySession.id || !state.visId) return;

      return fetch(apiBase + "/replay/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_id: siteId,
          session_id: state.replaySession.id,
          visitor_id: state.visId,
          started_at: Math.floor(state.firstActivity / 1000),
          ended_at: Math.floor(state.lastActivity / 1000),
          size_bytes: state.sizeBytes,
          sample_rate: replaySamplePct,
          start_url: normalize(window.location.href),
          event_count: state.uploadedEventCount,
        }),
        keepalive: true,
      })
        .catch(function () {})
        .finally(function () {
          state.uploadedEventCount = 0;
        });
    }

    function stopRecording(finalize) {
      try {
        if (state.recordingStop) {
          state.recordingStop();
          state.recordingStop = null;
        }
      } catch (e) {}
      if (state.flushTimer) {
        clearInterval(state.flushTimer);
        state.flushTimer = null;
      }
      flushAll()
        .then(function () {
          if (finalize) {
            return finalizeSession();
          }
        })
        .catch(function () {})
        .finally(function () {
          state.initialized = false;
          state.isRecording = false;
        });
    }

    function estimateEventSize(ev) {
      try {
        return JSON.stringify(ev).length | 0;
      } catch (_) {
        return 0;
      }
    }

    function handleRecordingEmit(e) {
      state.firstActivity = Math.min(
        state.firstActivity ?? e.timestamp,
        e.timestamp
      );
      state.lastActivity = Math.max(state.lastActivity, e.timestamp);
      state.buffer.push(e);
      state.approxBytes += estimateEventSize(e) + 1;
      if (state.approxBytes >= config.maxUncompressedBytes) {
        flush();
      }
    }

    function startRecording() {
      if (!window.rrweb || state.initialized) return;
      state.initialized = true;

      var isCoarsePointer = false;
      try {
        isCoarsePointer = !!(
          window.matchMedia && window.matchMedia("(pointer: coarse)").matches
        );
      } catch (_) {}

      state.recordingStop = window.rrweb.record({
        emit: handleRecordingEmit,
        checkoutEveryNms: 5 * 60 * 1000,
        maskAllInputs: true,
        maskInputOptions: {
          text: true,
          password: true,
          email: true,
          number: true,
          tel: true,
          textArea: true,
          select: true,
          search: true,
        },
        blockClass: "rr-block",
        ignoreClass: "rr-ignore",
        maskTextSelector: `
          input[type=password],
          [data-rrweb-mask],
          [contenteditable="true"],
          *
        `,
        blockSelector:
          "svg[class^='recharts'], svg[class*=' recharts'], .recharts-wrapper, img, iframe",
        slimDOMOptions: {
          script: true,
          comment: true,
          headFavicon: true,
          headWhitespace: true,
          headMetaDescKeywords: true,
          headMetaSocial: true,
          headMetaRobots: true,
          headMetaHttpEquiv: true,
          headMetaAuthorship: true,
          headMetaVerification: true,
        },
        sampling: {
          mousemove: isCoarsePointer ? false : 120,
          input: "last",
          media: 1000,
          scroll: 150,
          mouseInteraction: true,
        },
      });
      emitReplayPageview(window.location.href, false);
      startFlushLoop();
      state.isRecording = true;
    }

    function loadScript(src) {
      return new Promise(function (resolve, reject) {
        var s = document.createElement("script");
        s.src = src;
        s.async = true;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    function handleNavigationChange() {
      if (currentPath === window.location.pathname) return;
      currentPath = window.location.pathname;

      if (isReplayEnabledOnPage()) {
        if (state.isRecording === false) {
          startRecording();
        }
        emitReplayPageview(window.location.href, true);
      } else {
        emitReplayBlacklist();
        stopRecording(true);
      }
    }

    function setupEventListeners() {
      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "hidden") {
          flush();
        }
      });
      window.addEventListener("beforeunload", function () {
        stopRecording(true);
      });
      window.addEventListener("pagehide", function () {
        stopRecording(true);
      });

      if (window.history.pushState) {
        var originalPushState = history.pushState;
        history.pushState = function () {
          originalPushState.apply(this, arguments);
          handleNavigationChange();
        };
        window.addEventListener("popstate", handleNavigationChange);
      }
    }

    var rrLocalUrl = `${scriptsBaseUrl}/rrweb.min.js`;
    loadScript(rrLocalUrl)
      .then(function () {
        if (isReplayEnabledOnPage()) {
          startRecording();
        } else {
          emitReplayBlacklist();
          stopRecording(true);
        }
      })
      .catch(function () {});

    setupEventListeners();
  })();
})();
