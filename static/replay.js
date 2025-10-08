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

  function nowSec() {
    return Math.floor(Date.now() / 1000);
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

    var rrLoaded = false;
    var initializedOnce = false;
    var recordingStop = null;
    var isRecording = false;
    var buffer = [];
    var sizeBytes = 0;
    var uploadedEventCount = 0;
    var startedAt = Date.now();
    var firstActivity = null;
    var lastActivity = Date.now();
    var flushTimer = null;
    var maxChunkMs = 30000;
    var maxUncompressedBytes = 1 * 1024 * 1024;
    var approxBytes = 0;
    var isFlushing = false;
    var ongoingFlush = null;
    var visId = null;
    var replaySession = { id: null };
    var consecutiveFlushErrors = 0;
    var maxConsecutiveFlushErrors = 3;
    var replayDisabled = false;
    var discardSession = false;

    function hasReachedMinDuration() {
      if (!minReplayDurationSec) return true;
      return (
        Math.floor((Date.now() - startedAt) / 1000) >= minReplayDurationSec
      );
    }

    function markActivity() {
      lastActivity = Date.now();
    }

    [
      "mousemove",
      "keydown",
      "scroll",
      "click",
      "pointerdown",
      "touchstart",
    ].forEach(function (ev) {
      window.addEventListener(ev, markActivity, { passive: true });
    });

    function flush() {
      if (replayDisabled) return Promise.resolve();
      if (buffer.length === 0) return Promise.resolve();
      if (isFlushing) return ongoingFlush || Promise.resolve();
      isFlushing = true;
      var events = buffer;
      buffer = [];
      if (!hasReachedMinDuration()) {
        buffer = events.concat(buffer);
        isFlushing = false;
        return Promise.resolve();
      }
      var json = JSON.stringify(events);
      var flushedEventCount = events.length;
      approxBytes = 0;

      ongoingFlush = encodeReplayChunk(json)
        .then(function (payload) {
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
              if (!replaySession.id) replaySession.id = resp.session_id;
              if (!visId) visId = resp.visitor_id;
              var headers = {
                "Content-Type": "application/json",
              };
              if (payload.encoding === "gzip") {
                headers["Content-Encoding"] = "gzip";
              }
              return fetch(resp.url, {
                method: "PUT",
                headers: headers,
                body: payload.bytes,
              }).then(function (putResp) {
                if (!putResp || putResp.status >= 400) {
                  throw new Error();
                }
                uploadedEventCount += flushedEventCount;
                sizeBytes += payload.bytes.byteLength;
                consecutiveFlushErrors = 0;
                return putResp;
              });
            });
        })
        .catch(function (e) {
          try {
            consecutiveFlushErrors += 1;
            if (consecutiveFlushErrors >= maxConsecutiveFlushErrors) {
              discardSession = true;
              replayDisabled = true;
              buffer = [];
              approxBytes = 0;
              try {
                stopRecording(false);
              } catch (_) {}
            } else {
              buffer = events.concat(buffer);
            }
          } catch (_) {}
        })
        .finally(function () {
          isFlushing = false;
          ongoingFlush = null;
        });
      return ongoingFlush;
    }

    function flushAll() {
      return flush().then(function () {
        if (replayDisabled) return;
        if (buffer.length === 0) return;
        return flushAll();
      });
    }

    function startFlushLoop() {
      if (flushTimer) clearInterval(flushTimer);
      flushTimer = setInterval(function () {
        if (Date.now() - lastActivity > idleCutoffMs) {
          stopRecording(true);
          return;
        }
        if (Date.now() - startedAt > maxDurationMs) {
          stopRecording(true);
          return;
        }
        if (buffer.length > 0) {
          flush();
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
      flushAll()
        .then(function () {
          if (discardSession) return;
          if (!finalize) return;
          if (!hasReachedMinDuration()) return;
          if (!replaySession.id || !visId) return;
          return fetch(apiBase + "/replay/finalize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              site_id: siteId,
              session_id: replaySession.id,
              visitor_id: visId,
              started_at: Math.floor(firstActivity / 1000),
              ended_at: Math.floor(lastActivity / 1000),
              size_bytes: sizeBytes,
              sample_rate: replaySamplePct,
              start_url: normalize(window.location.href),
              event_count: uploadedEventCount,
            }),
            keepalive: true,
          })
            .catch(function () {})
            .finally(function () {
              uploadedEventCount = 0;
            });
        })
        .catch(function () {})
        .finally(function () {
          rrLoaded = false;
          initializedOnce = false;
          isRecording = false;
        });
    }

    function startRecording() {
      if (!window.rrweb || rrLoaded) return;
      if (initializedOnce) return; // guard against duplicate start
      initializedOnce = true;
      rrLoaded = true;
      var isCoarsePointer = false;
      try {
        isCoarsePointer = !!(
          window.matchMedia && window.matchMedia("(pointer: coarse)").matches
        );
      } catch (_) {}

      function estimateEventSize(ev) {
        try {
          return JSON.stringify(ev).length | 0;
        } catch (_) {
          return 0;
        }
      }

      recordingStop = window.rrweb.record({
        emit: function (e) {
          if (firstActivity === null) {
            firstActivity = Date.now();
          }
          buffer.push(e);
          approxBytes += estimateEventSize(e) + 1; // +1 for separator overhead
          if (approxBytes >= maxUncompressedBytes) {
            flush();
          }
        },
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
      // Add an initial pageview marker (no snapshot here; rrweb already emitted initial FullSnapshot)
      emitReplayPageview(window.location.href, false);
      startFlushLoop();
      isRecording = true;
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

    // Load rrweb from the same directory as this script, then start
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

    // Track SPA navigation
    if (window.history.pushState) {
      // Override pushState to track navigation
      var originalPushState = history.pushState;
      history.pushState = function () {
        originalPushState.apply(this, arguments);
        if (currentPath !== window.location.pathname) {
          currentPath = window.location.pathname;
          if (isReplayEnabledOnPage()) {
            if (isRecording === false) {
              startRecording();
            }
            emitReplayPageview(window.location.href, true);
          } else {
            emitReplayBlacklist();
            stopRecording(true);
          }
        }
      };

      // Track popstate (back/forward navigation)
      window.addEventListener("popstate", function () {
        if (currentPath !== window.location.pathname) {
          currentPath = window.location.pathname;
          if (isReplayEnabledOnPage()) {
            if (isRecording === false) {
              startRecording();
            }
            emitReplayPageview(window.location.href, true);
          } else {
            emitReplayBlacklist();
            stopRecording(true);
          }
        }
      });
    }
  })();
})();
