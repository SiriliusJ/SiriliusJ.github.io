(function () {
  "use strict";

  var root = document.documentElement;
  var storageKey = "site-theme";
  var validPreferences = ["system", "light", "dark"];
  var media = typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;

  function normalize(preference) {
    return validPreferences.indexOf(preference) !== -1 ? preference : "system";
  }

  function readPreference() {
    try {
      return normalize(localStorage.getItem(storageKey) || "system");
    } catch (error) {
      return "system";
    }
  }

  function resolveTheme(preference) {
    if (preference === "dark" || preference === "light") return preference;
    return media && media.matches ? "dark" : "light";
  }

  function syncControls(preference) {
    document.querySelectorAll("[data-theme-select]").forEach(function (select) {
      select.value = preference;
    });
  }

  function applyPreference(preference, persist) {
    preference = normalize(preference);
    var theme = resolveTheme(preference);

    root.setAttribute("data-theme-preference", preference);
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;
    syncControls(preference);

    if (persist) {
      try {
        localStorage.setItem(storageKey, preference);
      } catch (error) {
      }
    }

    document.dispatchEvent(new CustomEvent("site:themechange", {
      detail: { preference: preference, theme: theme }
    }));
  }

  var initialPreference = readPreference();
  applyPreference(initialPreference, false);

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-theme-select]").forEach(function (select) {
      select.value = root.getAttribute("data-theme-preference") || "system";
      select.addEventListener("change", function () {
        applyPreference(select.value, true);
      });
    });

    document.querySelectorAll("[data-theme-control]").forEach(function (control) {
      control.hidden = false;
    });

    document.addEventListener("site:themeset", function (event) {
      var requested = event.detail && event.detail.preference;
      if (validPreferences.indexOf(requested) !== -1) {
        applyPreference(requested, true);
      }
    });

    window.addEventListener("storage", function (event) {
      if (event.key === storageKey) applyPreference(event.newValue || "system", false);
    });

    var onSystemChange = function () {
      if ((root.getAttribute("data-theme-preference") || "system") === "system") {
        applyPreference("system", false);
      }
    };

    if (media) {
      if (typeof media.addEventListener === "function") {
        media.addEventListener("change", onSystemChange);
      } else if (typeof media.addListener === "function") {
        media.addListener(onSystemChange);
      }
    }
  });
})();
