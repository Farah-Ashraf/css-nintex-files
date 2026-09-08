/* ============================================================
   ICT MISR — Loan Origination Platform
   Department Stepper Focus Script
   ------------------------------------------------------------
   Reads the hidden field "department_label_hidden" and highlights
   the matching stage in the top stepper bar:
     Relational management | Investigation department |
     Governance department | Risk department

   HOW IT WORKS
   - The hidden textbox (name="department_label_hidden") holds a
     code such as RM / INV / GOV / RISK (edit DEPT_MAP below if
     your workflow writes a different value, e.g. full names).
   - The 4 stage labels in the HTML have stable `name` attributes:
     rm_label, inv_label, gov_label, risk_label. This script finds
     the one that matches and adds a CSS class to its parent cell
     so it visually "activates" (glow + outline), while the rest
     stay as-is.
   - K2 SmartForms re-renders parts of the page via async partial
     postbacks (ASP.NET UpdatePanel / Sys.WebForms), so the logic
     re-runs after every partial postback, plus a light interval
     poll as a safety net (values can be set programmatically
     without firing a native "change" event).

   HOW TO INSTALL IN NINTEX K2
   - Style Profile > Files (or Resources) > upload this .js file.
   - Reference it from the Style Profile's custom script/head
     include (same place you added your custom CSS file), or add
     it as a "Custom Script" resource linked to the form's theme.
   - No other configuration needed — it is self-initializing.
   ============================================================ */

(function () {
  "use strict";

  // ------------------------------------------------------------------
  // 1. Map whatever value the hidden field holds -> the label's "name"
  //    attribute in the HTML. Add/adjust entries to match exactly what
  //    your K2 workflow writes into department_label_hidden.
  // ------------------------------------------------------------------
  var DEPT_MAP = {
    RM: "rm_label",
    INV: "inv_label",
    GOV: "gov_label",
    RISK: "risk_label",

    // Fallbacks in case the full department name is stored instead
    "RELATIONAL MANAGEMENT": "rm_label",
    INVESTIGATION: "inv_label",
    "INVESTIGATION DEPARTMENT": "inv_label",
    GOVERNANCE: "gov_label",
    "GOVERNANCE DEPARTMENT": "gov_label",
    "RISK DEPARTMENT": "risk_label",
  };

  var ACTIVE_CLASS = "dept-stage-active";
  var STYLE_TAG_ID = "dept-stage-focus-style";
  var POLL_INTERVAL_MS = 800;

  var lastAppliedValue = null;

  // ------------------------------------------------------------------
  // 2. Locate the hidden field. We match by name first (most stable
  //    across form instances); if that ever changes, fall back to the
  //    known id suffix from the control you added.
  // ------------------------------------------------------------------
  function getHiddenField() {
    return (
      document.querySelector('input[name="department_label_hidden"]') ||
      document.querySelector(
        'input[id$="_d49cb766-5631-7171-b498-261eee88ce78"]',
      )
    );
  }

  function getDepartmentValue() {
    var el = getHiddenField();
    if (!el) {
      return null;
    }

    var val = (el.value || "").trim();
    if (!val || val.toLowerCase() === "type a value") {
      return null;
    }

    return val.toUpperCase();
  }

  // ------------------------------------------------------------------
  // 3. Inject the highlight styles once.
  // ------------------------------------------------------------------
  function injectStyles() {
    if (document.getElementById(STYLE_TAG_ID)) {
      return;
    }

    var style = document.createElement("style");
    style.id = STYLE_TAG_ID;

    style.textContent =
      ".editor-cell." +
      ACTIVE_CLASS +
      " {" +
      "  background: linear-gradient(135deg, #0B5CAD 0%, #0878C9 100%) !important;" +
      "  border-color: #0878C9 !important;" +
      "  border-radius: 8px 8px 0 0 !important;" +
      "  box-shadow: 0 -2px 8px rgba(8,120,201,0.15), 0 3px 8px rgba(8,120,201,0.18) !important;" +
      "  position: relative !important;" +
      "  z-index: 2 !important;" +
      "  transition: all .2s ease !important;" +
      "}" +
      ".editor-cell." +
      ACTIVE_CLASS +
      ' span[name$="_label"] {' +
      "  color: #FFFFFF !important;" +
      "  font-weight: 600 !important;" +
      "  text-decoration: none !important;" +
      "}" +
      ".editor-cell." +
      ACTIVE_CLASS +
      "::after {" +
      '  content: "" !important;' +
      "  position: absolute !important;" +
      "  bottom: -1px !important;" +
      "  left: 18% !important;" +
      "  right: 18% !important;" +
      "  height: 3px !important;" +
      "  background: #FFFFFF !important;" +
      "  border-radius: 3px !important;" +
      "}";

    document.head.appendChild(style);
  }

  // ------------------------------------------------------------------
  // 4. Clear any previously-active stage, then activate the matching
  //    one for the current hidden field value.
  // ------------------------------------------------------------------
  function clearActiveStates() {
    var active = document.querySelectorAll(".editor-cell." + ACTIVE_CLASS);
    for (var i = 0; i < active.length; i++) {
      active[i].classList.remove(ACTIVE_CLASS);
    }
  }

  function applyDepartmentFocus(force) {
    var rawVal = getDepartmentValue();

    if (!force && rawVal === lastAppliedValue) {
      return; // nothing changed, skip DOM work
    }
    lastAppliedValue = rawVal;

    clearActiveStates();

    if (!rawVal) {
      return;
    }

    var targetLabelName = DEPT_MAP[rawVal];
    if (!targetLabelName) {
      return;
    }

    var labelSpan = document.querySelector(
      'span[name="' + targetLabelName + '"]',
    );
    if (!labelSpan) {
      return;
    }

    var cell = labelSpan.closest(".editor-cell");
    if (!cell) {
      return;
    }

    cell.classList.add(ACTIVE_CLASS);
  }

  // ------------------------------------------------------------------
  // 5. Wire everything up: initial run, partial-postback hook, and a
  //    light polling fallback (K2 often sets field values via script
  //    without firing a native change event).
  // ------------------------------------------------------------------
  function init() {
    injectStyles();
    applyDepartmentFocus(true);

    if (window.Sys && Sys.WebForms && Sys.WebForms.PageRequestManager) {
      Sys.WebForms.PageRequestManager.getInstance().add_endRequest(function () {
        setTimeout(function () {
          applyDepartmentFocus(true);
        }, 50);
      });
    }

    setInterval(function () {
      applyDepartmentFocus(false);
    }, POLL_INTERVAL_MS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
