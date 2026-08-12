/*
 * Consent-first GA4 bootstrap for the tapiwa.me estate.
 *
 * Basic consent mode: no Google script, request, cookie, tracker helper,
 * event queue or event exists before an affirmative choice. The local
 * consent UI and its cross-subdomain preference are the only pre-Google
 * mechanism. DNT, GPC and the explicit kill switch always win.
 */
(function () {
  "use strict";

  var measurementId = "G-7M8H5S5211";
  var consentCookie = "tapiwa_analytics_consent";
  var consentSeconds = 60 * 60 * 24 * 180;
  var hostname = window.location.hostname;
  var isEstateHost = hostname === "tapiwa.me" || hostname.endsWith(".tapiwa.me");
  var privacyRequested =
    navigator.globalPrivacyControl === true ||
    navigator.doNotTrack === "1" ||
    window.doNotTrack === "1" ||
    navigator.msDoNotTrack === "1";

  if (
    !isEstateHost ||
    privacyRequested ||
    window.__tapiwaAnalyticsDisabled ||
    window.__tapiwaAnalyticsLoaded
  )
    return;
  window.__tapiwaAnalyticsLoaded = true;

  function readPreference() {
    var prefix = consentCookie + "=";
    var parts = document.cookie ? document.cookie.split(";") : [];
    for (var i = 0; i < parts.length; i += 1) {
      var part = parts[i].trim();
      if (part.indexOf(prefix) === 0) {
        var value = part.slice(prefix.length);
        return value === "granted" || value === "denied" ? value : null;
      }
    }
    return null;
  }

  function writePreference(value) {
    document.cookie =
      consentCookie +
      "=" +
      value +
      "; Max-Age=" +
      consentSeconds +
      "; Path=/; Domain=.tapiwa.me; SameSite=Lax; Secure";
  }

  function clearAnalyticsCookies() {
    var rawCookies = document.cookie ? document.cookie.split(";") : [];
    var names = [];
    for (var i = 0; i < rawCookies.length; i += 1) {
      var name = rawCookies[i].split("=")[0].trim();
      if (names.indexOf(name) === -1) names.push(name);
    }
    names.forEach(function (name) {
      if (name !== "_ga" && name.indexOf("_ga_") !== 0) return;
      var expired = name + "=; Max-Age=0; Path=/; SameSite=Lax; Secure";
      document.cookie = expired;
      document.cookie = expired + "; Domain=.tapiwa.me";
      var labels = hostname.split(".");
      for (var j = 0; j < labels.length - 1; j += 1) {
        var domain = "." + labels.slice(j).join(".");
        document.cookie = expired + "; Domain=" + domain;
      }
    });
  }

  function enumValue(values) {
    return function (value) {
      return typeof value === "string" && values.indexOf(value) !== -1;
    };
  }

  function exact(value) {
    return function (candidate) {
      return candidate === value;
    };
  }

  var denomination = enumValue(["ZWG", "USD"]);
  var eventContract = {
    portfolio_project_click: {
      project: enumValue([
        "chem_lab",
        "emberdelve",
        "fps_arena",
        "lanlink",
        "podeq",
        "s26u_flow_display",
        "s26u_kernel",
        "tapdo",
        "tapride",
        "tsoro_studios",
        "voltzw",
        "zimbet",
        "zimpay",
        "zldc",
      ]),
      destination: enumValue(["details", "demo", "source", "download", "play_store"]),
    },
    portfolio_contact_click: {
      method: enumValue(["email", "linkedin", "instagram", "github"]),
    },
    tariff_calculator_use: {
      direction: enumValue(["money_to_units", "units_to_money"]),
      denomination: denomination,
      source: enumValue(["input", "quick_amount", "mode", "denomination"]),
    },
    share: {
      method: exact("WhatsApp"),
      content_type: exact("tariff_result"),
      item_id: exact("zesa_tariff_result"),
    },
    copy_tariff_result: {
      direction: enumValue(["money_to_units", "units_to_money"]),
      denomination: denomination,
    },
    buy_token_intent: {
      payment_mode: enumValue(["semi_auto", "paynow"]),
      denomination: denomination,
    },
    join_waitlist: {
      denomination: denomination,
    },
    short_link_created: {
      custom_alias: function (value) {
        return typeof value === "boolean";
      },
      expiry: enumValue(["never", "1h", "1d", "1w", "30d"]),
    },
    short_link_copied: {
      surface: enumValue(["result", "history"]),
    },
    qr_download: {
      format: exact("png"),
    },
    link_details_opened: {},
  };

  function cleanEvent(name, params) {
    if (!/^[a-z][a-z0-9_]{0,39}$/.test(name)) return null;
    var spec = eventContract[name];
    if (!spec) return null;
    var input = params || {};
    var inputKeys = Object.keys(input);
    var specKeys = Object.keys(spec);
    if (inputKeys.length !== specKeys.length) return null;
    var clean = {};
    for (var i = 0; i < specKeys.length; i += 1) {
      var key = specKeys[i];
      if (!Object.prototype.hasOwnProperty.call(input, key) || !spec[key](input[key]))
        return null;
      clean[key] = input[key];
    }
    return [name, clean];
  }

  var preference = readPreference();
  var queue = null;
  var configured = false;
  var trackerInstalled = false;
  var bootScheduled = false;
  var historyTrackingInstalled = false;
  function safePageLocation() {
    return window.location.origin + (window.location.pathname || "/");
  }

  function safeReferrer(value) {
    if (!value) return "";
    try {
      var referrerUrl = new URL(value);
      if (referrerUrl.protocol !== "http:" && referrerUrl.protocol !== "https:")
        return "";
      if (
        referrerUrl.hostname === "tapiwa.me" ||
        referrerUrl.hostname.endsWith(".tapiwa.me")
      )
        return referrerUrl.origin + (referrerUrl.pathname || "/");
      return referrerUrl.origin;
    } catch {
      /* A malformed referrer is safer to discard. */
    }
    return "";
  }

  var pageLocation = safePageLocation();
  var pageReferrer = safeReferrer(document.referrer);

  function boot() {
    bootScheduled = false;
    if (preference !== "granted" || readPreference() !== "granted") return;
    if (document.querySelector("script[data-tapiwa-ga4]")) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      function () {
        window.dataLayer.push(arguments);
      };

    window.gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      cookie_domain: "tapiwa.me",
      cookie_flags: "SameSite=Lax;Secure",
      cookie_expires: consentSeconds,
      cookie_update: false,
      page_location: pageLocation,
      page_referrer: pageReferrer,
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
    window.gtag("event", "page_view", {
      page_title: document.title,
      page_location: pageLocation,
      page_referrer: pageReferrer,
    });
    installHistoryTracking();
    configured = true;
    while (queue && queue.length) {
      var event = queue.shift();
      try {
        window.gtag("event", event[0], event[1]);
      } catch {
        queue.length = 0;
      }
    }

    var script = document.createElement("script");
    script.async = true;
    script.src =
      "https://www.googletagmanager.com/gtag/js?id=" +
      encodeURIComponent(measurementId);
    script.dataset.tapiwaGa4 = measurementId;
    document.head.appendChild(script);
  }

  function installHistoryTracking() {
    if (historyTrackingInstalled) return;
    historyTrackingInstalled = true;
    var lastLocation = pageLocation;
    var timer = 0;

    function trackLocationChange() {
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        if (preference !== "granted" || typeof window.gtag !== "function") return;
        var nextLocation = safePageLocation();
        if (nextLocation === lastLocation) return;
        var previousLocation = lastLocation;
        lastLocation = nextLocation;
        window.gtag("event", "page_view", {
          page_title: document.title,
          page_location: nextLocation,
          page_referrer: previousLocation,
        });
      }, 80);
    }

    ["pushState", "replaceState"].forEach(function (method) {
      var original = window.history[method];
      if (typeof original !== "function") return;
      window.history[method] = function () {
        var result = original.apply(this, arguments);
        trackLocationChange();
        return result;
      };
    });
    window.addEventListener("popstate", trackLocationChange);
  }

  function scheduleBoot() {
    if (bootScheduled || configured) return;
    bootScheduled = true;
    function schedule() {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(boot, { timeout: 2500 });
      } else {
        window.setTimeout(boot, 1200);
      }
    }
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
  }

  function installTracker() {
    if (trackerInstalled || preference !== "granted") return;
    trackerInstalled = true;
    queue = [];
    window["ga-disable-" + measurementId] = false;
    window.tapiwaTrack = function (name, params) {
      if (preference !== "granted") return false;
      var event = cleanEvent(name, params);
      if (!event) return false;
      if (!configured) {
        if (queue.length < 20) queue.push(event);
        return true;
      }
      try {
        window.gtag("event", event[0], event[1]);
        return true;
      } catch {
        return false;
      }
    };
    scheduleBoot();
  }

  var panel;
  var settingsButton;
  var stateText;
  var closeButton;

  function syncUi() {
    if (!panel) return;
    var known = preference === "granted" || preference === "denied";
    stateText.textContent =
      preference === "granted"
        ? "Analytics is currently on."
        : preference === "denied"
          ? "Analytics is currently off."
          : "No analytics loads until you choose.";
    closeButton.hidden = !known;
    panel.querySelector('[data-consent-choice="granted"]').setAttribute(
      "aria-pressed",
      preference === "granted" ? "true" : "false"
    );
    panel.querySelector('[data-consent-choice="denied"]').setAttribute(
      "aria-pressed",
      preference === "denied" ? "true" : "false"
    );
    if (!known) {
      panel.hidden = false;
      settingsButton.hidden = true;
    }
  }

  function closePanel() {
    if (!preference) return;
    panel.hidden = true;
    settingsButton.hidden = false;
    settingsButton.setAttribute("aria-expanded", "false");
    settingsButton.focus();
  }

  function choose(value) {
    var wasTracking = trackerInstalled || configured;
    preference = value;
    writePreference(value);
    if (value === "granted") {
      installTracker();
      syncUi();
      closePanel();
      return;
    }

    if (queue) queue.length = 0;
    window["ga-disable-" + measurementId] = true;
    if (window.tapiwaTrack) {
      try {
        delete window.tapiwaTrack;
      } catch {
        window.tapiwaTrack = undefined;
      }
    }
    clearAnalyticsCookies();
    syncUi();
    closePanel();

    if (wasTracking) {
      try {
        if (typeof window.gtag === "function") {
          window.gtag("consent", "update", {
            analytics_storage: "denied",
            ad_storage: "denied",
            ad_user_data: "denied",
            ad_personalization: "denied",
          });
        }
      } catch {
        /* The denied cookie still prevents the tag on reload. */
      }
      window.setTimeout(function () {
        window.location.reload();
      }, 60);
    }
  }

  function renderConsentUi() {
    if (document.getElementById("tapiwa-consent-panel")) return;

    var style = document.createElement("style");
    style.id = "tapiwa-consent-style";
    style.textContent =
      "#tapiwa-consent-panel,#tapiwa-privacy-settings{" +
      "--tc-bg:var(--card,var(--canvas,#fff));--tc-ink:var(--ink,#181715);" +
      "--tc-body:var(--body,var(--dim,#555));--tc-line:var(--hairline,var(--line,#d8d3cb));" +
      "font-family:inherit;color:var(--tc-ink);box-sizing:border-box}" +
      "#tapiwa-consent-panel[hidden],#tapiwa-privacy-settings[hidden]," +
      "#tapiwa-consent-panel [hidden]{display:none!important}" +
      "#tapiwa-consent-panel{position:fixed;z-index:2147483000;left:max(16px,env(safe-area-inset-left));" +
      "bottom:max(16px,env(safe-area-inset-bottom));width:min(520px,calc(100vw - 32px));max-height:calc(100vh - 32px);" +
      "overflow:auto;padding:20px;background:var(--tc-bg);border:1px solid var(--tc-line);border-radius:16px;" +
      "box-shadow:0 18px 60px rgba(16,16,15,.2);font-size:14px;line-height:1.5;text-align:left}" +
      ".tapiwa-consent-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}" +
      "#tapiwa-consent-title{margin:0;font-family:inherit;font-size:18px;font-weight:600;line-height:1.2;letter-spacing:-.01em;color:var(--tc-ink)}" +
      ".tapiwa-consent-copy{margin:8px 0 0;color:var(--tc-ink)}" +
      ".tapiwa-consent-state{margin:8px 0 0;font-weight:600;color:var(--tc-ink)}" +
      ".tapiwa-consent-close{flex:none;width:40px;height:40px;margin:-9px -9px 0 0;border:0;border-radius:50%;" +
      "background:transparent;color:var(--tc-body);font-family:inherit;font-size:20px;line-height:1;cursor:pointer}" +
      ".tapiwa-consent-close:hover{background:color-mix(in srgb,var(--tc-line) 55%,transparent)}" +
      ".tapiwa-consent-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}" +
      ".tapiwa-consent-choice{min-height:48px;padding:10px 13px;border:1px solid var(--tc-ink);border-radius:999px;" +
      "background:var(--tc-ink);color:var(--tc-bg);font-family:inherit;font-size:13px;font-weight:600;line-height:1.2;cursor:pointer}" +
      ".tapiwa-consent-choice:hover{filter:brightness(1.16)}" +
      ".tapiwa-consent-choice[aria-pressed=true]{box-shadow:0 0 0 3px color-mix(in srgb,var(--tc-ink) 18%,transparent)}" +
      ".tapiwa-consent-more{margin-top:14px;color:var(--tc-ink)}" +
      ".tapiwa-consent-more summary{min-height:32px;display:flex;align-items:center;width:max-content;max-width:100%;" +
      "font-weight:600;color:var(--tc-ink);cursor:pointer}" +
      ".tapiwa-consent-more p{margin:8px 0 0}" +
      ".tapiwa-consent-more a{color:var(--tc-ink);text-underline-offset:3px}" +
      "#tapiwa-privacy-settings{position:fixed;z-index:2147482999;left:max(14px,env(safe-area-inset-left));" +
      "bottom:max(14px,env(safe-area-inset-bottom));min-height:44px;padding:8px 14px;border:1px solid var(--tc-line);" +
      "border-radius:999px;background:var(--tc-bg);color:var(--tc-ink);box-shadow:0 6px 24px rgba(16,16,15,.12);" +
      "font-family:inherit;font-size:12px;font-weight:600;line-height:1;cursor:pointer}" +
      "#tapiwa-consent-panel button:focus-visible,#tapiwa-privacy-settings:focus-visible," +
      "#tapiwa-consent-panel summary:focus-visible,#tapiwa-consent-panel a:focus-visible{" +
      "outline:3px solid var(--tc-ink);outline-offset:3px}" +
      "@media(max-width:390px){#tapiwa-consent-panel{padding:17px}.tapiwa-consent-actions{grid-template-columns:1fr}" +
      ".tapiwa-consent-more{font-size:13px;line-height:1.42}.tapiwa-consent-more p{margin-top:7px}.tapiwa-consent-more a{display:inline-block;margin:2px 3px 2px 0}}" +
      "@media(prefers-reduced-motion:reduce){#tapiwa-consent-panel,#tapiwa-privacy-settings{scroll-behavior:auto}}";
    document.head.appendChild(style);

    settingsButton = document.createElement("button");
    settingsButton.id = "tapiwa-privacy-settings";
    settingsButton.type = "button";
    settingsButton.textContent = "Privacy choices";
    settingsButton.hidden = true;
    settingsButton.setAttribute("aria-controls", "tapiwa-consent-panel");
    settingsButton.setAttribute("aria-expanded", "false");

    panel = document.createElement("section");
    panel.id = "tapiwa-consent-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "false");
    panel.setAttribute("tabindex", "-1");
    panel.setAttribute("aria-labelledby", "tapiwa-consent-title");
    panel.setAttribute("aria-describedby", "tapiwa-consent-copy");
    panel.innerHTML =
      '<div class="tapiwa-consent-head">' +
      "<div><h2 id=\"tapiwa-consent-title\">Optional analytics</h2>" +
      '<p class="tapiwa-consent-copy" id="tapiwa-consent-copy">' +
      "With your permission, Google Analytics helps me see which pages and tools are useful." +
      '</p><p class="tapiwa-consent-state" aria-live="polite"></p></div>' +
      '<button class="tapiwa-consent-close" type="button" aria-label="Close privacy choices">×</button></div>' +
      '<div class="tapiwa-consent-actions">' +
      '<button class="tapiwa-consent-choice" type="button" data-consent-choice="granted">Allow analytics</button>' +
      '<button class="tapiwa-consent-choice" type="button" data-consent-choice="denied">Keep analytics off</button>' +
      "</div>" +
      '<details class="tapiwa-consent-more"><summary>What is collected?</summary>' +
      "<p>Collected: page paths, hostnames and fixed actions such as opening a project or using a calculator. " +
      "Never collected: form contents, long or short links, aliases, meter numbers, names, phone numbers or email addresses.</p>" +
      "<p>Google may process browser/device details and an approximate region; Analytics does not log or store individual IP addresses. " +
      "First-party cookies start only after permission. Ads and personalisation are off. " +
      "Event data is kept up to 14 months. Analytics cookies and this choice last no more than six months.</p>" +
      '<p>Change your choice anytime. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google privacy policy</a></p>' +
      "</details>";

    document.body.appendChild(settingsButton);
    document.body.appendChild(panel);
    stateText = panel.querySelector(".tapiwa-consent-state");
    closeButton = panel.querySelector(".tapiwa-consent-close");

    settingsButton.addEventListener("click", function () {
      settingsButton.hidden = true;
      settingsButton.setAttribute("aria-expanded", "true");
      panel.hidden = false;
      syncUi();
      panel
        .querySelector(
          '[data-consent-choice="' +
            (preference === "granted" ? "granted" : "denied") +
            '"]'
        )
        .focus();
    });
    closeButton.addEventListener("click", closePanel);
    panel.addEventListener("click", function (event) {
      var button = event.target.closest("[data-consent-choice]");
      if (button) choose(button.getAttribute("data-consent-choice"));
    });
    panel.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && preference) closePanel();
    });

    syncUi();
    if (preference) {
      panel.hidden = true;
      settingsButton.hidden = false;
    } else if (
      document.activeElement === document.body ||
      document.activeElement === document.documentElement
    ) {
      try {
        panel.focus({ preventScroll: true });
      } catch {
        panel.focus();
      }
    }
  }

  function uiWhenReady() {
    if (document.body) renderConsentUi();
    else document.addEventListener("DOMContentLoaded", renderConsentUi, { once: true });
  }

  if (preference === "granted") installTracker();
  uiWhenReady();
})();
