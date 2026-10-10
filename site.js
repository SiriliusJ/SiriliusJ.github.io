(function () {
  "use strict";

  var activeDialogController = null;

  function focusCandidate(element) {
    if (!element || !element.isConnected || typeof element.focus !== "function") return false;
    try { element.focus({ preventScroll: true }); } catch (error) {
      try { element.focus(); } catch (fallbackError) { return false; }
    }
    return document.activeElement === element;
  }

  function isMeaningfulFocus(element, dialog) {
    if (!(element instanceof HTMLElement) || !element.isConnected) return false;
    if (element === document.body || element === document.documentElement || (dialog && dialog.contains(element))) return false;
    if (element.hidden || element.hasAttribute("disabled") || element.closest("[inert],[hidden]")) return false;
    return element.getClientRects().length > 0;
  }

  function visibleFocusables(dialog) {
    return Array.from(dialog.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])')).filter(function (element) {
      return !element.hidden && !element.closest("[hidden],[inert]") && element.getClientRects().length > 0;
    });
  }

  function enhanceDialog(dialog, options) {
    var runtime = window.SiteMotion;
    options = options || {};
    if (!runtime || !dialog || typeof dialog.showModal !== "function") return null;
    var savedInvoker = null;
    var suppressRestore = false;
    var backdropPointer = false;
    var destroyed = false;
    var unregister = function () {};
    var controller;

    function fallbackFocus() {
      var candidate = typeof options.fallbackFocus === "function" ? options.fallbackFocus() : document.getElementById("main-content");
      focusCandidate(candidate);
    }

    function restoreFocus() {
      if (suppressRestore) {
        suppressRestore = false;
        savedInvoker = null;
        return;
      }
      var candidate = savedInvoker;
      savedInvoker = null;
      if (!isMeaningfulFocus(candidate, dialog) || !focusCandidate(candidate)) fallbackFocus();
    }

    function close() {
      if (dialog.open) dialog.close();
    }

    function open(invoker) {
      if (destroyed) return false;
      if (dialog.open) {
        var existingFocus = typeof options.initialFocus === "function" ? options.initialFocus() : visibleFocusables(dialog)[0];
        focusCandidate(existingFocus);
        return true;
      }
      var inheritedInvoker = isMeaningfulFocus(invoker, dialog) ? invoker : null;
      if (activeDialogController && activeDialogController !== controller) {
        inheritedInvoker = activeDialogController.savedInvoker() || inheritedInvoker;
        activeDialogController.suppressRestore();
        activeDialogController.close();
      }
      savedInvoker = inheritedInvoker;
      try { dialog.showModal(); } catch (error) {
        savedInvoker = null;
        return false;
      }
      activeDialogController = controller;
      var initial = typeof options.initialFocus === "function" ? options.initialFocus() : visibleFocusables(dialog)[0];
      if (!focusCandidate(initial)) fallbackFocus();
      return true;
    }

    function cleanup() {
      if (destroyed) return;
      destroyed = true;
      suppressRestore = true;
      if (activeDialogController === controller) activeDialogController = null;
      close();
      savedInvoker = null;
    }

    controller = Object.freeze({
      open: open,
      close: close,
      destroy: function () { cleanup(); unregister(); },
      savedInvoker: function () { return savedInvoker; },
      suppressRestore: function () { suppressRestore = true; }
    });

    unregister = runtime.register(options.name || (dialog.id ? "dialog:" + dialog.id : "dialog"), {
      element: dialog,
      priority: "P0",
      setup: function (context) {
        context.listen(dialog, "keydown", function (event) {
          if (event.key !== "Tab") return;
          var focusables = visibleFocusables(dialog);
          if (!focusables.length) return;
          var first = focusables[0];
          var last = focusables[focusables.length - 1];
          if (!dialog.contains(document.activeElement)) {
            event.preventDefault();
            focusCandidate(first);
          } else if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            focusCandidate(last);
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            focusCandidate(first);
          }
        });
        context.listen(dialog, "cancel", function (event) {
          event.preventDefault();
          close();
        });
        context.listen(dialog, "pointerdown", function (event) {
          backdropPointer = event.target === dialog;
        });
        context.listen(dialog, "pointercancel", function () { backdropPointer = false; });
        context.listen(dialog, "click", function (event) {
          var closeFromBackdrop = backdropPointer && event.target === dialog;
          backdropPointer = false;
          if (closeFromBackdrop) close();
        });
        context.listen(dialog, "close", function () {
          if (activeDialogController === controller) activeDialogController = null;
          restoreFocus();
        });
      },
      destroy: cleanup
    });
    return controller;
  }

  Object.defineProperty(window, "SiteDialogLifecycle", {
    value: Object.freeze({ enhance: enhanceDialog }),
    writable: false,
    configurable: false,
    enumerable: true
  });

  function initHeaderNavigation(runtime) {
    var header = document.querySelector(".site-header");
    var navigation = header ? header.querySelector(".primary-nav") : null;
    var list = navigation ? navigation.querySelector(".primary-nav__list") : null;
    var links = list ? Array.from(list.querySelectorAll(".page-link")) : [];
    var current = list ? list.querySelector('.page-link[aria-current="page"]') : null;
    if (!header || !navigation || !list || !current || !links.length) return;

    var indicator = document.createElement("span");
    indicator.className = "primary-nav__indicator is-snap";
    indicator.setAttribute("aria-hidden", "true");
    navigation.append(indicator);
    var target = current;
    var focusTarget = null;
    var hoverTarget = null;
    var pending = null;
    var shouldSnap = true;

    function choose(next, snap, context) {
      if (!next || links.indexOf(next) === -1) next = current;
      if (target === next && shouldSnap === Boolean(snap)) return;
      target = next;
      shouldSnap = Boolean(snap);
      context.requestMeasure("navigation-target");
    }

    function chooseEffective(snap, context) {
      choose(focusTarget || hoverTarget || current, snap, context);
    }

    runtime.register("header-navigation", {
      element: header,
      priority: "P1",
      observe: { resize: true },
      setup: function (context) {
        context.observeResize(list);
        context.listen(navigation, "pointerover", function (event) {
          var state = context.state();
          if (!state.finePointer || !state.hoverCapable) return;
          hoverTarget = event.target.closest ? event.target.closest(".page-link") : null;
          chooseEffective(false, context);
        }, { passive: true });
        context.listen(navigation, "pointerleave", function () {
          hoverTarget = null;
          chooseEffective(false, context);
        }, { passive: true });
        context.listen(navigation, "focusin", function (event) {
          var next = event.target.closest ? event.target.closest(".page-link") : null;
          focusTarget = next && next.matches(":focus-visible") ? next : null;
          chooseEffective(false, context);
        });
        context.listen(navigation, "focusout", function () {
          focusTarget = null;
          chooseEffective(false, context);
        });
        context.listen(document, "site:languagechange", function () {
          focusTarget = null;
          hoverTarget = null;
          choose(current, true, context);
          context.requestMeasure("language");
        });
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(function () { if (context.isAlive()) { shouldSnap = true; context.requestMeasure("fonts"); } });
        }
      },
      measure: function (state, reasons) {
        var navRect = navigation.getBoundingClientRect();
        var targetRect = (target || current).getBoundingClientRect();
        pending = {
          headerOffset: Math.ceil(header.getBoundingClientRect().height + 16),
          x: targetRect.left - navRect.left,
          width: targetRect.width,
          snap: shouldSnap || state.reducedMotion || reasons.some(function (reason) { return reason.indexOf("resize") !== -1 || reason === "bfcache-show"; })
        };
      },
      tick: function () {
        if (!pending) return false;
        document.documentElement.style.setProperty("--header-offset", pending.headerOffset + "px");
        indicator.classList.toggle("is-snap", pending.snap);
        indicator.style.setProperty("--nav-indicator-x", pending.x.toFixed(2) + "px");
        indicator.style.setProperty("--nav-indicator-width", pending.width.toFixed(2) + "px");
        indicator.classList.add("is-visible");
        pending = null;
        return false;
      },
      resume: function (state, reason) {
        if (reason === "bfcache-show") shouldSnap = true;
      },
      destroy: function () { indicator.remove(); }
    });
  }

  function initBackToTop(runtime) {
    var button = document.querySelector(".back-to-top");
    var main = document.getElementById("main-content");
    if (!button || !main) return;
    var desiredHidden = true;
    var showThreshold = 280;
    var hideThreshold = 160;

    function focusMain() {
      return focusCandidate(main);
    }

    runtime.register("back-to-top", {
      element: button,
      priority: "P0",
      observe: { scroll: true },
      setup: function (context) {
        context.listen(button, "keydown", function (event) {
          if (event.key !== "Tab" || event.shiftKey || document.activeElement !== button || window.scrollY >= hideThreshold) return;
          event.preventDefault();
          if (focusMain()) context.requestMeasure("terminal-tab");
        });
        context.listen(button, "click", function () {
          focusMain();
          window.scrollTo({ top: 0, behavior: context.state().reducedMotion ? "auto" : "smooth" });
        });
        context.listen(button, "blur", function () { context.requestMeasure("blur"); });
      },
      measure: function (state) {
        if (document.activeElement === button) return;
        if (state.scroll.y > showThreshold) desiredHidden = false;
        if (state.scroll.y < hideThreshold) desiredHidden = true;
      },
      tick: function () {
        if (button.hidden !== desiredHidden) button.hidden = desiredHidden;
        return false;
      }
    });
  }

  function initPrintDisclosures(runtime) {
    var closedBeforePrint = null;

    function expandForPrint() {
      if (closedBeforePrint !== null) return;
      closedBeforePrint = Array.from(document.querySelectorAll("details:not([open])"));
      closedBeforePrint.forEach(function (detail) { detail.open = true; });
    }

    function restoreAfterPrint() {
      if (closedBeforePrint === null) return;
      closedBeforePrint.forEach(function (detail) { if (detail.isConnected) detail.open = false; });
      closedBeforePrint = null;
    }

    runtime.register("print-disclosures", {
      priority: "P0",
      settle: function (state, reason) {
        if (state.printing) expandForPrint();
        else if (reason === "afterprint" || reason === "print-media") restoreAfterPrint();
      },
      destroy: restoreAfterPrint
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var runtime = window.SiteMotion;
    if (!runtime) return;
    initHeaderNavigation(runtime);
    initBackToTop(runtime);
    initPrintDisclosures(runtime);
  });
})();
