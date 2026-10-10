(function () {
  "use strict";

  if (window.SiteMotion) return;

  var STORAGE_KEY = "site-motion-paused";
  var QUALITY_ORDER = ["static", "lean", "balanced", "full"];
  var root = document.documentElement;
  var rootScope = new AbortController();
  var components = new Map();
  var subscribers = new Set();
  var resizeTargets = new Map();
  var intersectionPools = new Map();
  var intersectionRootIds = new WeakMap();
  var nextIntersectionRootId = 1;
  var pendingReasons = new Set(["initial"]);
  var errorLog = [];
  var listenerTypes = Object.create(null);
  var rootListenerCount = 0;
  var componentListenerCount = 0;
  var frame = 0;
  var destroyed = false;
  var bfcacheSuspended = false;
  var measuring = false;
  var deferredMeasure = false;
  var lastFrameTime = 0;
  var tickCount = 0;
  var measureCount = 0;
  var scheduleCount = 0;
  var runtimeWorkTotal = 0;
  var runtimeWorkFrames = 0;
  var qualityWindowStarted = 0;
  var slowWindows = 0;
  var stableWindows = 0;
  var degradationCount = 0;
  var lastQualityChange = 0;
  var qualityReason = "hardware-default";
  var pointerEventTime = 0;
  var pointerDecayTime = 0;
  var pointerLastX = 0;
  var pointerLastY = 0;
  var pointer = {
    x: 0,
    y: 0,
    dx: 0,
    dy: 0,
    speed: 0,
    normalizedSpeed: 0,
    active: false,
    present: false
  };
  var viewport = readViewport();
  var scroll = readScroll();
  var modality = "keyboard";
  var documentVisible = !document.hidden;
  var printing = false;
  var ambientPaused = readPausedPreference();
  var reducedMedia = safeMedia("(prefers-reduced-motion: reduce)");
  var finePointerMedia = safeMedia("(pointer: fine)");
  var hoverMedia = safeMedia("(hover: hover)");
  var printMedia = safeMedia("print");
  var initialQuality = determineInitialQuality();
  var structuralQuality = initialQuality;
  var resizeObserver = createResizeObserver();
  var publicApi;
  var debugLedger = null;

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function safeMedia(query) {
    if (typeof window.matchMedia !== "function") return null;
    try { return window.matchMedia(query); } catch (error) { recordError("media:" + query, error); return null; }
  }

  function readPausedPreference() {
    try { return window.localStorage.getItem(STORAGE_KEY) === "true"; } catch (error) { return false; }
  }

  function storePausedPreference(value) {
    try { window.localStorage.setItem(STORAGE_KEY, String(value)); } catch (error) {}
  }

  function readViewport() {
    return {
      width: window.innerWidth || document.documentElement.clientWidth || 0,
      height: window.innerHeight || document.documentElement.clientHeight || 0,
      dpr: Math.min(2, window.devicePixelRatio || 1)
    };
  }

  function readScroll() {
    var rootElement = document.documentElement;
    return {
      x: window.scrollX || 0,
      y: window.scrollY || 0,
      maxY: Math.max(0, rootElement.scrollHeight - (window.innerHeight || rootElement.clientHeight || 0))
    };
  }

  function determineInitialQuality() {
    var cores = Number(navigator.hardwareConcurrency);
    var memory = Number(navigator.deviceMemory);
    if ((Number.isFinite(cores) && cores <= 4) || (Number.isFinite(memory) && memory <= 4)) {
      qualityReason = "constrained-hardware";
      return "lean";
    }
    if (Number.isFinite(cores) && cores >= 8 && (!Number.isFinite(memory) || memory > 4)) {
      qualityReason = "capable-hardware";
      return "full";
    }
    qualityReason = "hardware-default";
    return "balanced";
  }

  function effectiveQuality() {
    if (printing || (reducedMedia && reducedMedia.matches)) return "static";
    return structuralQuality;
  }

  function lifecycle() {
    if (destroyed) return "destroyed";
    if (bfcacheSuspended) return "bfcache";
    if (!documentVisible) return "suspended";
    return ambientPaused ? "ambient-paused" : "active";
  }

  function priorityNumber(value) {
    if (typeof value === "string" && /^P[0-3]$/.test(value)) return Number(value.slice(1));
    if (Number.isFinite(value)) return clamp(Math.round(value), 0, 3);
    return 1;
  }

  function recordError(label, error) {
    var message = label;
    if (error && error.message) message += ": " + error.message;
    errorLog.push(message);
    if (errorLog.length > 20) errorLog.shift();
  }

  function addRootListener(target, type, listener, options) {
    if (!target || typeof target.addEventListener !== "function") return;
    var settings = typeof options === "boolean" ? { capture: options } : Object.assign({}, options || {});
    settings.signal = rootScope.signal;
    try {
      target.addEventListener(type, listener, settings);
      rootListenerCount += 1;
      listenerTypes[type] = (listenerTypes[type] || 0) + 1;
    } catch (error) {
      recordError("root-listener:" + type, error);
    }
  }

  function addMediaListener(media, listener, label) {
    if (!media) return;
    if (typeof media.addEventListener === "function") {
      addRootListener(media, "change", listener);
      return;
    }
    if (typeof media.addListener === "function") {
      try {
        media.addListener(listener);
        rootScope.signal.addEventListener("abort", function () { media.removeListener(listener); }, { once: true });
        rootListenerCount += 1;
        listenerTypes[label || "media-change"] = (listenerTypes[label || "media-change"] || 0) + 1;
      } catch (error) {
        recordError("legacy-media:" + label, error);
      }
    }
  }

  function createResizeObserver() {
    if (typeof window.ResizeObserver !== "function") return null;
    try {
      return new ResizeObserver(function (entries) {
        entries.forEach(function (entry) {
          var names = resizeTargets.get(entry.target);
          if (!names) return;
          names.forEach(function (name) { pendingReasons.add("resize:" + name); });
        });
        if (measuring) deferredMeasure = true;
        scheduleFrame();
      });
    } catch (error) {
      recordError("resize-observer", error);
      return null;
    }
  }

  function observerKey(options) {
    var normalized = options || {};
    var observerRoot = normalized.root || null;
    var rootId = "viewport";
    if (observerRoot && (typeof observerRoot === "object" || typeof observerRoot === "function")) {
      if (!intersectionRootIds.has(observerRoot)) intersectionRootIds.set(observerRoot, nextIntersectionRootId++);
      rootId = "root-" + intersectionRootIds.get(observerRoot);
    }
    return [rootId, normalized.rootMargin || "120px 0px", JSON.stringify(normalized.threshold == null ? 0 : normalized.threshold)].join("|");
  }

  function ensureIntersectionPool(options) {
    var key = observerKey(options);
    if (intersectionPools.has(key)) return intersectionPools.get(key);
    if (typeof window.IntersectionObserver !== "function") return null;
    var normalized = options || {};
    var pool = { key: key, observer: null, targets: new Map(), options: { root: normalized.root || null, rootMargin: normalized.rootMargin || "120px 0px", threshold: normalized.threshold == null ? 0 : normalized.threshold } };
    try {
      pool.observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var names = pool.targets.get(entry.target);
          if (!names) return;
          names.forEach(function (name) {
            var record = components.get(name);
            if (!record) return;
            record.nearTargets.set(entry.target, entry.isIntersecting);
            var nextNear = Array.from(record.nearTargets.values()).some(Boolean);
            if (record.near === nextNear) return;
            record.near = nextNear;
            pendingReasons.add((nextNear ? "near:" : "far:") + name);
            callHook(record, nextNear ? "resume" : "suspend", nextNear ? "near" : "offscreen");
          });
        });
        if (!pointerConsumersExist()) resetPointer("offscreen");
        scheduleFrame();
      }, pool.options);
      intersectionPools.set(key, pool);
      return pool;
    } catch (error) {
      recordError("intersection-observer", error);
      return null;
    }
  }

  function observeResize(record, element) {
    if (!element || !resizeObserver) return;
    var names = resizeTargets.get(element);
    if (!names) {
      names = new Set();
      resizeTargets.set(element, names);
      resizeObserver.observe(element);
    }
    names.add(record.name);
    record.resizeElements.add(element);
  }

  function observeNear(record, element, options) {
    if (!element) return;
    var pool = ensureIntersectionPool(options);
    if (!pool) {
      record.near = true;
      return;
    }
    var names = pool.targets.get(element);
    if (!names) {
      names = new Set();
      pool.targets.set(element, names);
      pool.observer.observe(element);
    }
    names.add(record.name);
    record.nearTargets.set(element, true);
    record.intersectionEntries.push({ pool: pool, element: element });
  }

  function unobserveRecord(record) {
    record.resizeElements.forEach(function (element) {
      var names = resizeTargets.get(element);
      if (!names) return;
      names.delete(record.name);
      if (!names.size) {
        resizeTargets.delete(element);
        if (resizeObserver) resizeObserver.unobserve(element);
      }
    });
    record.intersectionEntries.forEach(function (entry) {
      var names = entry.pool.targets.get(entry.element);
      if (!names) return;
      names.delete(record.name);
      if (!names.size) {
        entry.pool.targets.delete(entry.element);
        entry.pool.observer.unobserve(entry.element);
        if (!entry.pool.targets.size) {
          entry.pool.observer.disconnect();
          intersectionPools.delete(entry.pool.key);
        }
      }
    });
    record.resizeElements.clear();
    record.intersectionEntries.length = 0;
    record.nearTargets.clear();
  }

  function resetPointer(reason) {
    pointer.x = 0;
    pointer.y = 0;
    pointer.dx = 0;
    pointer.dy = 0;
    pointer.speed = 0;
    pointer.normalizedSpeed = 0;
    pointer.active = false;
    pointer.present = false;
    pointerEventTime = 0;
    pointerDecayTime = 0;
  }

  function settlePointer() {
    pointer.dx = 0;
    pointer.dy = 0;
    pointer.speed = 0;
    pointer.normalizedSpeed = 0;
    pointer.active = false;
    pointerEventTime = 0;
    pointerDecayTime = 0;
  }

  function pointerConsumersExist() {
    return Array.from(components.values()).some(function (record) {
      return record.near && record.priority >= 2 && typeof record.hooks.tick === "function";
    });
  }

  function samplePointer(event) {
    var samples = typeof event.getCoalescedEvents === "function" ? event.getCoalescedEvents() : null;
    var sample = samples && samples.length ? samples[samples.length - 1] : event;
    var time = Number(sample.timeStamp);
    var x = Number(sample.clientX);
    var y = Number(sample.clientY);
    if (!Number.isFinite(time) || !Number.isFinite(x) || !Number.isFinite(y)) return;
    var elapsed = pointerEventTime ? time - pointerEventTime : 0;
    var dx = pointerEventTime ? x - pointerLastX : 0;
    var dy = pointerEventTime ? y - pointerLastY : 0;
    var speed = 0;
    if (elapsed > 0 && elapsed <= 160) speed = Math.hypot(dx, dy) / elapsed;
    if (speed < .02) speed = 0;
    speed = clamp(speed, 0, 1.5);
    pointer.x = x;
    pointer.y = y;
    pointer.dx = dx;
    pointer.dy = dy;
    pointer.speed = speed;
    pointer.normalizedSpeed = speed / 1.5;
    pointer.present = true;
    var hasConsumer = pointerConsumersExist();
    var pointerEligible = Boolean(
      hasConsumer &&
      (finePointerMedia ? finePointerMedia.matches : true) &&
      (hoverMedia ? hoverMedia.matches : true) &&
      !ambientPaused &&
      !printing &&
      !(reducedMedia && reducedMedia.matches) &&
      effectiveQuality() !== "static" &&
      effectiveQuality() !== "lean"
    );
    pointer.active = pointerEligible && speed > 0;
    if (!hasConsumer) {
      pointer.speed = 0;
      pointer.normalizedSpeed = 0;
    }
    pointerLastX = x;
    pointerLastY = y;
    pointerEventTime = time;
    pointerDecayTime = time;
    modality = "pointer";
    if (pointer.active || hasConsumer) scheduleFrame();
  }

  function decayPointer(timestamp) {
    if (!pointer.active || !pointerEventTime) return;
    var eventAge = Math.max(0, timestamp - pointerEventTime);
    if (eventAge <= 40) return;
    var elapsed = Math.max(0, timestamp - Math.max(pointerDecayTime, pointerEventTime + 40));
    if (!elapsed) return;
    var decay = Math.exp(-elapsed / 110);
    pointer.speed *= decay;
    pointer.normalizedSpeed = pointer.speed / 1.5;
    pointerDecayTime = timestamp;
    if (pointer.speed < .02) settlePointer();
  }

  function snapshot() {
    var proximity = {};
    components.forEach(function (record, name) { proximity[name] = record.near; });
    return Object.freeze({
      reducedMotion: Boolean(reducedMedia && reducedMedia.matches),
      ambientPaused: ambientPaused,
      finePointer: Boolean(finePointerMedia && finePointerMedia.matches),
      hoverCapable: Boolean(hoverMedia && hoverMedia.matches),
      modality: modality,
      documentVisible: documentVisible,
      printing: printing,
      lifecycle: lifecycle(),
      quality: effectiveQuality(),
      pointer: Object.freeze(Object.assign({}, pointer)),
      viewport: Object.freeze(Object.assign({}, viewport)),
      scroll: Object.freeze(Object.assign({}, scroll)),
      proximity: Object.freeze(proximity)
    });
  }

  function notify(reason) {
    var current = snapshot();
    subscribers.forEach(function (listener) {
      try { listener(current, reason); } catch (error) { recordError("subscriber", error); }
    });
  }

  function callHook(record, hookName, reason, currentSnapshot) {
    var hook = record && record.hooks && record.hooks[hookName];
    if (typeof hook !== "function") return undefined;
    try {
      if (hookName === "destroy") return hook(reason);
      return hook(currentSnapshot || snapshot(), reason);
    } catch (error) { recordError(record.name + ":" + hookName, error); return undefined; }
  }

  function scheduleFrame() {
    if (destroyed) {
      recordError("frame-after-destroy");
      return;
    }
    if (frame || bfcacheSuspended || !documentVisible) return;
    scheduleCount += 1;
    frame = window.requestAnimationFrame(runFrame);
  }

  function sampleQuality(timestamp, cost) {
    if (!qualityWindowStarted) qualityWindowStarted = timestamp;
    runtimeWorkTotal += cost;
    runtimeWorkFrames += 1;
    if (timestamp - qualityWindowStarted < 2000) return;
    var average = runtimeWorkFrames ? runtimeWorkTotal / runtimeWorkFrames : 0;
    runtimeWorkTotal = 0;
    runtimeWorkFrames = 0;
    qualityWindowStarted = timestamp;
    if (average > 8) {
      slowWindows += 1;
      stableWindows = 0;
    } else if (average < 4) {
      stableWindows += 1;
      slowWindows = 0;
    } else {
      slowWindows = 0;
      stableWindows = 0;
    }
    if (timestamp - lastQualityChange < 5000) return;
    var index = QUALITY_ORDER.indexOf(structuralQuality);
    if (slowWindows >= 2 && index > 1) {
      structuralQuality = QUALITY_ORDER[index - 1];
      degradationCount += 1;
      slowWindows = 0;
      lastQualityChange = timestamp;
      qualityReason = "runtime-cost";
      pendingReasons.add("quality-downgrade");
      notify("quality-downgrade");
    } else if (stableWindows >= 4 && index < QUALITY_ORDER.indexOf(initialQuality)) {
      structuralQuality = QUALITY_ORDER[index + 1];
      stableWindows = 0;
      lastQualityChange = timestamp;
      qualityReason = "runtime-recovery";
      pendingReasons.add("quality-upgrade");
      notify("quality-upgrade");
    }
  }

  function reasonTargetsRecord(reason, record) {
    if (reason === "scroll") return record.observeScroll;
    if (reason.indexOf("resize:") === 0) return reason.slice(7) === record.name;
    if (reason.indexOf("near:") === 0) return reason.slice(5) === record.name;
    if (reason.indexOf("far:") === 0) return reason.slice(4) === record.name;
    if (reason.indexOf("register:") === 0) return reason.slice(9) === record.name;
    if (reason.indexOf("unregister:") === 0) return false;
    if (reason.indexOf(record.name + ":") === 0) return true;
    var componentReason = false;
    components.forEach(function (candidate, name) {
      if (reason.indexOf(name + ":") === 0) componentReason = true;
    });
    if (componentReason) return false;
    return true;
  }

  function runFrame(timestamp) {
    frame = 0;
    if (destroyed || bfcacheSuspended || !documentVisible) {
      lastFrameTime = 0;
      return;
    }
    var workStarted = performance.now();
    tickCount += 1;
    decayPointer(timestamp);
    viewport = readViewport();
    scroll = readScroll();
    var reasons = Array.from(pendingReasons);
    pendingReasons.clear();
    var current = snapshot();
    var delta = lastFrameTime ? clamp(timestamp - lastFrameTime, 0, 40) : 16;
    lastFrameTime = timestamp;

    if (reasons.length) {
      measuring = true;
      components.forEach(function (record) {
        if (!record.alive || typeof record.hooks.measure !== "function") return;
        var relevantReasons = reasons.filter(function (reason) { return reasonTargetsRecord(reason, record); });
        if (!relevantReasons.length) return;
        try { record.hooks.measure(current, relevantReasons); record.pendingWrite = true; measureCount += 1; } catch (error) { recordError(record.name + ":measure", error); }
      });
      measuring = false;
      if (deferredMeasure) {
        deferredMeasure = false;
      }
    }

    var continueFrame = false;
    components.forEach(function (record) {
      if (!record.alive || typeof record.hooks.tick !== "function") return;
      var allowOneShot = record.pendingWrite;
      if (!allowOneShot && !record.near && record.priority >= 2) return;
      if (!allowOneShot && record.priority >= 2 && (current.reducedMotion || current.ambientPaused || current.printing || !current.finePointer || !current.hoverCapable)) return;
      if (!allowOneShot && record.priority === 2 && (current.quality === "lean" || current.quality === "static")) return;
      if (!allowOneShot && record.priority === 3 && current.quality === "static") return;
      try {
        record.pendingWrite = false;
        if (record.hooks.tick(current, timestamp, delta) === true) continueFrame = true;
      } catch (error) {
        recordError(record.name + ":tick", error);
      }
    });

    sampleQuality(timestamp, performance.now() - workStarted);
    if (pointer.active) continueFrame = true;
    if (deferredMeasure || pendingReasons.size || continueFrame) scheduleFrame();
    else lastFrameTime = 0;
    writeDebugSnapshot();
  }

  function requestMeasure(reason) {
    if (destroyed) {
      recordError("measure-after-destroy:" + (reason || "measure"));
      return;
    }
    if (measuring) deferredMeasure = true;
    pendingReasons.add(reason || "measure");
    scheduleFrame();
  }

  function makeContext(record) {
    function guard(operation) {
      if (record.alive && !destroyed) return true;
      recordError(record.name + ":" + operation + "-after-destroy");
      return false;
    }
    return Object.freeze({
      signal: record.scope.signal,
      listen: function (target, type, listener, options) {
        if (!record.alive || !target || typeof target.addEventListener !== "function") return;
        var settings = typeof options === "boolean" ? { capture: options } : Object.assign({}, options || {});
        settings.signal = record.scope.signal;
        try {
          target.addEventListener(type, listener, settings);
          componentListenerCount += 1;
          record.listenerCount += 1;
          record.listenerTypes[type] = (record.listenerTypes[type] || 0) + 1;
          listenerTypes["component:" + type] = (listenerTypes["component:" + type] || 0) + 1;
        } catch (error) {
          recordError(record.name + ":listener:" + type, error);
        }
      },
      observeResize: function (element) { if (guard("observe-resize")) observeResize(record, element); },
      observeNear: function (element, options) { if (guard("observe-near")) observeNear(record, element, options); },
      requestMeasure: function (reason) { if (guard("request-measure")) requestMeasure(record.name + ":" + (reason || "measure")); },
      requestFrame: function () {
        if (!guard("request-frame")) return;
        record.pendingWrite = true;
        scheduleFrame();
      },
      isAlive: function () { return record.alive && !destroyed; },
      state: snapshot
    });
  }

  function register(name, hooks) {
    if (destroyed || !name || typeof hooks !== "object") {
      recordError("invalid-registration:" + name);
      return function () {};
    }
    if (components.has(name)) {
      recordError("duplicate-component:" + name);
      return function () {};
    }
    var record = {
      name: name,
      hooks: hooks,
      element: hooks.element || null,
      priority: priorityNumber(hooks.priority),
      observeScroll: Boolean(hooks.observe && hooks.observe.scroll),
      near: true,
      alive: true,
      scope: new AbortController(),
      listenerCount: 0,
      listenerTypes: Object.create(null),
      pendingWrite: false,
      resizeElements: new Set(),
      intersectionEntries: [],
      nearTargets: new Map()
    };
    components.set(name, record);
    if (hooks.observe && hooks.observe.resize && record.element) observeResize(record, record.element);
    if (hooks.observe && hooks.observe.near && record.element) observeNear(record, record.element, typeof hooks.observe.near === "object" ? hooks.observe.near : null);
    try {
      if (typeof hooks.setup === "function") hooks.setup(makeContext(record));
    } catch (error) {
      recordError(name + ":setup", error);
    }
    requestMeasure("register:" + name);
    var unregistered = false;
    return function unregister() {
      if (unregistered) return;
      unregistered = true;
      if (!record.alive) return;
      record.alive = false;
      record.pendingWrite = false;
      unobserveRecord(record);
      record.scope.abort();
      componentListenerCount = Math.max(0, componentListenerCount - record.listenerCount);
      Object.keys(record.listenerTypes).forEach(function (type) {
        var key = "component:" + type;
        listenerTypes[key] = Math.max(0, (listenerTypes[key] || 0) - record.listenerTypes[type]);
        if (!listenerTypes[key]) delete listenerTypes[key];
      });
      callHook(record, "destroy", "unregister");
      components.delete(name);
      if (!pointerConsumersExist()) resetPointer("unregister");
      requestMeasure("unregister:" + name);
    };
  }

  function subscribe(listener) {
    if (typeof listener !== "function" || destroyed) return function () {};
    subscribers.add(listener);
    var active = true;
    return function () {
      if (!active) return;
      active = false;
      subscribers.delete(listener);
    };
  }

  function createSpring(options) {
    options = options || {};
    var value = Number.isFinite(options.value) ? options.value : 0;
    var target = Number.isFinite(options.target) ? options.target : value;
    var velocity = 0;
    var frequency = clamp(Number(options.frequency) || 7, 2, 18);
    return Object.freeze({
      set: function (next) { if (Number.isFinite(next)) target = next; },
      snap: function (next) { if (Number.isFinite(next)) target = next; value = target; velocity = 0; },
      update: function (delta) {
        var before = value;
        var omega = Math.PI * 2 * frequency;
        var elapsed = clamp(delta, 0, 40) / 1000;
        var displacement = value - target;
        var decay = Math.exp(-omega * elapsed);
        var nextDisplacement = (displacement + (velocity + omega * displacement) * elapsed) * decay;
        var nextVelocity = (velocity - omega * (velocity + omega * displacement) * elapsed) * decay;
        var next = target + nextDisplacement;
        if ((target - before) * (target - next) < 0) { next = target; nextVelocity = 0; }
        value = next;
        velocity = nextVelocity;
        if (Math.abs(target - value) < .001 && Math.abs(velocity) < .001) { value = target; velocity = 0; }
        return value;
      },
      value: function () { return value; },
      settled: function () { return value === target && velocity === 0; }
    });
  }

  function syncAmbient(source, announce) {
    root.dataset.motionPaused = String(ambientPaused);
    resetPointer("ambient");
    var current = snapshot();
    components.forEach(function (record) { callHook(record, ambientPaused ? "settle" : "resume", source || "ambient", current); });
    notify(source || "ambient");
    document.dispatchEvent(new CustomEvent("site:motionchange", {
      detail: {
        paused: ambientPaused,
        ambientPaused: ambientPaused,
        reducedMotion: current.reducedMotion,
        source: source || "runtime",
        announce: Boolean(announce)
      }
    }));
    requestMeasure("ambient-change");
  }

  function setAmbientPaused(value) {
    value = Boolean(value);
    if (ambientPaused === value) return ambientPaused;
    ambientPaused = value;
    storePausedPreference(ambientPaused);
    syncAmbient("control", true);
    return ambientPaused;
  }

  function toggleAmbient() {
    return setAmbientPaused(!ambientPaused);
  }

  function handleLifecycle(reason) {
    var current = snapshot();
    resetPointer(reason);
    components.forEach(function (record) {
      if (current.lifecycle === "active" || current.lifecycle === "ambient-paused") callHook(record, "resume", reason, current);
      else callHook(record, "suspend", reason, current);
      callHook(record, "settle", reason, current);
    });
    notify(reason);
    if (documentVisible && !bfcacheSuspended) requestMeasure(reason);
  }

  function destroy(reason) {
    if (destroyed) {
      recordError("repeated-destroy:" + reason);
      return;
    }
    destroyed = true;
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    resetPointer("destroy");
    components.forEach(function (record) {
      if (!record.alive) return;
      record.alive = false;
      record.pendingWrite = false;
      unobserveRecord(record);
      record.scope.abort();
      callHook(record, "destroy", reason || "destroy");
    });
    components.clear();
    subscribers.clear();
    if (resizeObserver) resizeObserver.disconnect();
    intersectionPools.forEach(function (pool) { pool.observer.disconnect(); });
    intersectionPools.clear();
    resizeTargets.clear();
    rootScope.abort();
    rootListenerCount = 0;
    componentListenerCount = 0;
    listenerTypes = Object.create(null);
    pendingReasons.clear();
    root.dataset.motionRuntime = "destroyed";
  }

  function debugSnapshot() {
    var observedIntersectionElements = 0;
    intersectionPools.forEach(function (pool) { observedIntersectionElements += pool.targets.size; });
    return {
      runtimeCount: destroyed ? 0 : 1,
      pendingRaf: frame ? 1 : 0,
      components: Array.from(components.values()).map(function (record) {
        return { name: record.name, priority: "P" + record.priority, near: record.near, listeners: record.listenerCount };
      }),
      pointerSpeed: Number(pointer.speed.toFixed(4)),
      modality: modality,
      lifecycle: lifecycle(),
      quality: effectiveQuality(),
      structuralQuality: structuralQuality,
      initialQuality: initialQuality,
      qualityReason: qualityReason,
      degradationCount: degradationCount,
      lastQualityChange: lastQualityChange,
      reducedMotion: Boolean(reducedMedia && reducedMedia.matches),
      ambientPaused: ambientPaused,
      finePointer: Boolean(finePointerMedia && finePointerMedia.matches),
      hoverCapable: Boolean(hoverMedia && hoverMedia.matches),
      documentVisible: documentVisible,
      printing: printing,
      observerCounts: {
        resizeInstances: resizeObserver ? 1 : 0,
        resizeElements: resizeTargets.size,
        intersectionInstances: intersectionPools.size,
        intersectionElements: observedIntersectionElements
      },
      listenerCounts: {
        root: rootListenerCount,
        component: componentListenerCount,
        total: rootListenerCount + componentListenerCount,
        byType: Object.assign({}, listenerTypes)
      },
      tickCount: tickCount,
      measureCount: measureCount,
      scheduleCount: scheduleCount,
      pendingReasons: Array.from(pendingReasons),
      errors: errorLog.length,
      errorLog: errorLog.slice()
    };
  }

  function writeDebugSnapshot() {
    if (!debugLedger) return;
    try { debugLedger.dataset.snapshot = JSON.stringify(debugSnapshot()); } catch (error) { recordError("debug-snapshot", error); }
  }

  addRootListener(document, "pointermove", samplePointer, { passive: true });
  addRootListener(document, "pointerdown", function (event) { modality = event.pointerType === "touch" ? "touch" : "pointer"; }, { passive: true });
  addRootListener(document, "pointercancel", function () { resetPointer("cancel"); if (pointerConsumersExist()) scheduleFrame(); }, { passive: true });
  addRootListener(document, "pointerout", function (event) { if (!event.relatedTarget) { resetPointer("exit"); if (pointerConsumersExist()) scheduleFrame(); } }, { passive: true });
  addRootListener(document, "keydown", function (event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    modality = "keyboard";
    resetPointer("keyboard");
    if (pointerConsumersExist()) scheduleFrame();
  }, true);
  addRootListener(window, "blur", function () { resetPointer("blur"); if (pointerConsumersExist()) scheduleFrame(); });
  addRootListener(window, "scroll", function () { scroll = readScroll(); pendingReasons.add("scroll"); scheduleFrame(); }, { passive: true });
  addRootListener(window, "resize", function () { viewport = readViewport(); requestMeasure("viewport-resize"); }, { passive: true });
  addRootListener(document, "visibilitychange", function () {
    documentVisible = !document.hidden;
    if (!documentVisible && frame) { window.cancelAnimationFrame(frame); frame = 0; lastFrameTime = 0; }
    handleLifecycle("visibility");
  });
  addRootListener(window, "pagehide", function (event) {
    if (!event.persisted) { destroy("pagehide"); return; }
    bfcacheSuspended = true;
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    lastFrameTime = 0;
    handleLifecycle("bfcache-hide");
  });
  addRootListener(window, "pageshow", function (event) {
    if (!event.persisted || destroyed) return;
    bfcacheSuspended = false;
    documentVisible = !document.hidden;
    handleLifecycle("bfcache-show");
  });
  addRootListener(window, "beforeprint", function () { printing = true; handleLifecycle("beforeprint"); });
  addRootListener(window, "afterprint", function () { printing = false; handleLifecycle("afterprint"); });
  addRootListener(document, "site:languagechange", function () { resetPointer("language"); requestMeasure("language"); notify("language"); });
  addRootListener(document, "site:themechange", function () { requestMeasure("theme"); notify("theme"); });
  addMediaListener(reducedMedia, function () {
    handleLifecycle("reduced-motion");
    var current = snapshot();
    document.dispatchEvent(new CustomEvent("site:motionchange", {
      detail: { paused: ambientPaused, ambientPaused: ambientPaused, reducedMotion: current.reducedMotion, source: "reduced-motion", announce: false }
    }));
  }, "reduced-motion");
  addMediaListener(finePointerMedia, function () { resetPointer("pointer-media"); handleLifecycle("pointer-media"); }, "fine-pointer");
  addMediaListener(hoverMedia, function () { resetPointer("hover-media"); handleLifecycle("hover-media"); }, "hover");
  addMediaListener(printMedia, function (event) {
    printing = Boolean(event.matches);
    handleLifecycle("print-media");
  }, "print");

  publicApi = Object.freeze({
    register: register,
    subscribe: subscribe,
    state: snapshot,
    createSpring: createSpring,
    setAmbientPaused: setAmbientPaused,
    toggleAmbient: toggleAmbient,
    requestMeasure: requestMeasure,
    debugSnapshot: debugSnapshot
  });
  Object.defineProperty(window, "SiteMotion", {
    value: publicApi,
    writable: false,
    configurable: false,
    enumerable: true
  });
  root.dataset.motionRuntime = "ready";
  root.dataset.motionPaused = String(ambientPaused);
  if (new URLSearchParams(window.location.search).get("motion") === "debug") {
    debugLedger = document.createElement("div");
    debugLedger.hidden = true;
    debugLedger.inert = true;
    debugLedger.setAttribute("data-motion-debug-ledger", "");
    document.body.append(debugLedger);
    writeDebugSnapshot();
  }
  requestMeasure("bootstrap");
})();
