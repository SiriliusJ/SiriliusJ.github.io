(function () {
  "use strict";

  var dialog = document.getElementById("construction-dialog");
  var controller = window.SiteDialogLifecycle && window.SiteDialogLifecycle.enhance(dialog, {
    name: "release-construction",
    initialFocus: function () { return dialog.querySelector("button"); }
  });
  document.querySelectorAll("[data-unavailable]").forEach(function (button) {
    button.addEventListener("click", function () {
      var message = button.getAttribute("data-unavailable") + " is under construction.";
      if (button.closest(".release-languages")) message += " The current edition is available in English.";
      document.getElementById("construction-description").textContent = message;
      if (!controller || !controller.open(button)) window.alert("Under construction\n\n" + message);
    });
  });

  function revealHash() {
    var id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch (error) { return; }
    if (!id) return;
    var target = document.getElementById(id);
    if (!target) return;
    if (target.tagName === "DETAILS") target.open = true;
    var parent = target.parentElement;
    while (parent) {
      if (parent.tagName === "DETAILS") parent.open = true;
      parent = parent.parentElement;
    }
    requestAnimationFrame(function () { target.scrollIntoView({ block: "start" }); });
  }
  window.addEventListener("hashchange", revealHash);
  revealHash();
})();
