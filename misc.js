(function () {
  "use strict";

  function focusCandidate(element) {
    if (!element || !element.isConnected || typeof element.focus !== "function") return false;
    try { element.focus({ preventScroll: true }); } catch (error) { element.focus(); }
    if (document.activeElement !== element) element.focus();
    return document.activeElement === element;
  }

  function t(key, parameters) {
    return window.SiteI18n ? window.SiteI18n.t(key, parameters) : "";
  }

  function currentPublicLanguage() {
    var language = document.documentElement.getAttribute("data-lang") || "en";
    return language === "zh" ? "zh-CN" : language;
  }

  function initPcComparison() {
    var runtime = window.SiteMotion;
    var form = document.querySelector("[data-pc-compare]");
    if (!runtime || !form) return;

    var choices = Array.from(form.querySelectorAll("[data-pc-choice]"));
    var action = form.querySelector("[data-pc-compare-action]");
    var status = form.querySelector("[data-pc-compare-status]");
    var output = form.querySelector("[data-pc-compare-output]");
    var tableRegion = form.querySelector("[data-pc-compare-table]");
    if (choices.length !== 3 || !action || !status || !output || !tableRegion) return;

    var builds = choices.map(function (choice) {
      var article = document.getElementById(choice.value);
      var title = article ? article.querySelector(".card-title") : null;
      var keys = article ? Array.from(article.querySelectorAll(".pc-k")) : [];
      var values = article ? Array.from(article.querySelectorAll(".pc-v")) : [];
      if (!article || !title || !keys.length || keys.length !== values.length) return null;

      var specs = keys.map(function (key, position) {
        var label = key.textContent.trim();
        var value = values[position].textContent.trim();
        if (!label || !value) return null;
        return {
          key: (key.getAttribute("data-spec-key") || label).toLocaleLowerCase(),
          labelElement: key,
          valueElement: values[position]
        };
      });
      if (specs.some(function (spec) { return !spec; })) return null;
      return { choice: choice, article: article, title: title, specs: specs };
    });
    if (builds.some(function (build) { return !build; })) return;
    var resultPending = false;
    var componentContext = null;

    function updateArticleStates() {
      builds.forEach(function (build) {
        var label = build.choice.closest("label");
        build.article.classList.toggle("is-compare-selected", build.choice.checked);
        if (label) label.classList.toggle("is-selected", build.choice.checked);
      });
    }

    function clearPreview() {
      builds.forEach(function (build) {
        build.article.classList.remove("is-compare-preview");
        var label = build.choice.closest("label");
        if (label) label.classList.remove("is-preview");
      });
    }

    function previewBuild(build) {
      clearPreview();
      build.article.classList.add("is-compare-preview");
      var label = build.choice.closest("label");
      if (label) label.classList.add("is-preview");
    }

    function selectedBuilds() {
      return builds.filter(function (build) { return build.choice.checked; });
    }

    function updateSelectionState() {
      var count = selectedBuilds().length;
      updateArticleStates();
      action.disabled = count < 2;
      tableRegion.replaceChildren();
      output.hidden = true;
      status.lang = currentPublicLanguage();
      status.textContent = count < 2
        ? (t("PCSelectAtLeastTwo") || "Select at least two builds to compare.")
        : (t("PCBuildsSelected", { count: count }) || count + " builds selected. Activate Compare to build the table.");
      if (window.SiteI18n && window.SiteI18n.markTechnicalTerms) window.SiteI18n.markTechnicalTerms(status);
    }

    function makeCell(tagName, text, scope) {
      var cell = document.createElement(tagName);
      cell.textContent = text;
      if (scope) cell.setAttribute("scope", scope);
      return cell;
    }

    function renderComparison() {
      var selected = selectedBuilds();
      if (selected.length < 2) {
        updateSelectionState();
        return;
      }

      var rows = [];
      selected.forEach(function (build) {
        build.specs.forEach(function (spec) {
          if (!rows.some(function (row) { return row.key === spec.key; })) {
            rows.push({ key: spec.key, labelElement: spec.labelElement });
          }
        });
      });

      var table = document.createElement("table");
      var caption = document.createElement("caption");
      caption.textContent = t("PCTableCaption") || "Selected PC build specifications";
      caption.lang = currentPublicLanguage();
      table.append(caption);

      var head = document.createElement("thead");
      var headRow = document.createElement("tr");
      var specificationHeading = makeCell("th", t("Specification") || "Specification", "col");
      specificationHeading.lang = currentPublicLanguage();
      headRow.append(specificationHeading);
      selected.forEach(function (build) {
        var buildHeading = makeCell("th", build.title.textContent.trim(), "col");
        buildHeading.lang = build.title.getAttribute("lang") || currentPublicLanguage();
        headRow.append(buildHeading);
      });
      head.append(headRow);
      table.append(head);

      var body = document.createElement("tbody");
      rows.forEach(function (row) {
        var tableRow = document.createElement("tr");
        var rowHeading = makeCell("th", row.labelElement.textContent.trim(), "row");
        rowHeading.lang = row.labelElement.getAttribute("lang") || currentPublicLanguage();
        tableRow.append(rowHeading);
        selected.forEach(function (build) {
          var spec = build.specs.find(function (candidate) { return candidate.key === row.key; });
          var cell = makeCell("td", spec ? spec.valueElement.textContent.trim() : (t("NotListed") || "Not listed"));
          if (spec) cell.lang = spec.valueElement.getAttribute("lang") || currentPublicLanguage();
          else cell.setAttribute("lang", currentPublicLanguage());
          tableRow.append(cell);
        });
        body.append(tableRow);
      });
      table.append(body);

      tableRegion.replaceChildren(table);
      if (window.SiteI18n && window.SiteI18n.markTechnicalTerms) window.SiteI18n.markTechnicalTerms(tableRegion);
      output.hidden = false;
      output.classList.remove("is-rendered");
      resultPending = true;
      if (componentContext) componentContext.requestFrame("comparison-result");
      status.lang = currentPublicLanguage();
      status.textContent = t("PCComparing", { count: selected.length }) || "Comparing " + selected.length + " builds.";
      if (window.SiteI18n && window.SiteI18n.markTechnicalTerms) window.SiteI18n.markTechnicalTerms(status);
    }

    runtime.register("pc-comparison", {
      element: form,
      priority: "P1",
      setup: function (context) {
        componentContext = context;
        context.listen(form, "submit", function (event) { event.preventDefault(); });
        choices.forEach(function (choice, index) {
          var build = builds[index];
          var label = choice.closest("label");
          context.listen(choice, "change", updateSelectionState);
          if (label) {
            context.listen(label, "pointerenter", function (event) { if (event.pointerType !== "touch") previewBuild(build); });
            context.listen(label, "pointerleave", function (event) { if (event.pointerType !== "touch") clearPreview(); });
            context.listen(label, "focusin", function () { previewBuild(build); });
            context.listen(label, "focusout", function (event) {
              if (!event.relatedTarget || !label.contains(event.relatedTarget)) clearPreview();
            });
          }
          var specification = build.article.querySelector(".pc-spec");
          if (specification && label) {
            context.listen(specification, "toggle", function () {
              label.classList.toggle("is-related", specification.open);
            });
          }
        });
        context.listen(action, "click", renderComparison);
        context.listen(document, "site:languagechange", function () {
          if (output.hidden) updateSelectionState();
          else renderComparison();
        });
        updateSelectionState();
        form.hidden = false;
      },
      tick: function () {
        if (!resultPending) return false;
        output.classList.add("is-rendered");
        resultPending = false;
        return false;
      },
      suspend: function () { clearPreview(); },
      destroy: function () { componentContext = null; }
    });
  }

  function initPhotoViewer() {
    var runtime = window.SiteMotion;
    var dialogLifecycle = window.SiteDialogLifecycle;
    var trigger = document.querySelector("[data-photo-viewer]");
    var probe = document.createElement("dialog");
    if (!runtime || !dialogLifecycle || !trigger || typeof window.HTMLDialogElement === "undefined" || typeof probe.showModal !== "function") return;

    var sourceImage = trigger.querySelector("img");
    var figure = trigger.closest("figure");
    var sourceTitle = figure ? figure.querySelector(".photo-title") : null;
    var sourceMeta = figure ? figure.querySelector(".photo-meta") : null;
    if (!sourceImage || !sourceTitle || !sourceMeta) return;

    var dialog = document.createElement("dialog");
    dialog.className = "photo-viewer-dialog";
    dialog.id = "photo-viewer-dialog";
    dialog.setAttribute("aria-labelledby", "photo-viewer-title");
    dialog.setAttribute("aria-describedby", "photo-viewer-meta");

    var panel = document.createElement("div");
    panel.className = "photo-viewer-dialog__panel";
    var header = document.createElement("div");
    header.className = "photo-viewer-dialog__header";
    var title = document.createElement("h2");
    title.id = "photo-viewer-title";
    var closeButton = document.createElement("button");
    closeButton.className = "photo-viewer-dialog__close";
    closeButton.type = "button";
    closeButton.textContent = t("Close") || "Close";
    header.append(title, closeButton);

    var viewerImage = document.createElement("img");
    viewerImage.className = "photo-viewer-dialog__image";
    viewerImage.decoding = "async";
    viewerImage.alt = sourceImage.alt;
    var meta = document.createElement("p");
    meta.className = "photo-viewer-dialog__meta";
    meta.id = "photo-viewer-meta";
    panel.append(header, viewerImage, meta);
    dialog.append(panel);
    document.body.append(dialog);

    var lifecycle = dialogLifecycle.enhance(dialog, {
      name: "photo-dialog",
      initialFocus: function () { return closeButton; },
      fallbackFocus: function () { return document.getElementById("main-content"); }
    });
    if (!lifecycle) { dialog.remove(); return; }
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.setAttribute("aria-controls", dialog.id);

    function syncViewerText() {
      var language = currentPublicLanguage();
      closeButton.textContent = t("Close") || "Close";
      closeButton.lang = language;
      title.lang = language;
      meta.lang = language;
      if (!dialog.open) return;
      title.textContent = sourceTitle.textContent.trim();
      meta.replaceChildren.apply(meta, Array.from(sourceMeta.childNodes, function (node) { return node.cloneNode(true); }));
      viewerImage.alt = sourceImage.alt;
      if (window.SiteI18n && window.SiteI18n.markTechnicalTerms) window.SiteI18n.markTechnicalTerms(dialog);
    }

    function openViewer(event) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (dialog.open) {
        focusCandidate(closeButton);
        event.preventDefault();
        return;
      }
      title.textContent = sourceTitle.textContent.trim();
      meta.replaceChildren.apply(meta, Array.from(sourceMeta.childNodes, function (node) { return node.cloneNode(true); }));
      viewerImage.src = trigger.getAttribute("href");
      viewerImage.alt = sourceImage.alt;
      viewerImage.width = Number(sourceImage.getAttribute("width"));
      viewerImage.height = Number(sourceImage.getAttribute("height"));
      if (window.SiteI18n && window.SiteI18n.markTechnicalTerms) window.SiteI18n.markTechnicalTerms(dialog);
      if (lifecycle.open(trigger)) event.preventDefault();
    }

    runtime.register("photo-viewer", {
      element: trigger,
      priority: "P0",
      setup: function (context) {
        context.listen(trigger, "click", openViewer);
        context.listen(closeButton, "click", lifecycle.close);
        context.listen(document, "site:languagechange", syncViewerText);
        syncViewerText();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    try { initPcComparison(); } catch (error) {}
    try { initPhotoViewer(); } catch (error) {}
  });
})();
