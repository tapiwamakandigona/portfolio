/*
 * Lightweight GA4 bootstrap for the tapiwa.me estate.
 *
 * The local file is intentionally tiny and deferred. The third-party Google
 * script is not requested until after window.load and an idle window, so it
 * cannot block the page's first render. Browser-level privacy signals win.
 */
(function () {
  "use strict";

  var measurementId = "G-7M8H5S5211";
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

  function boot() {
    if (document.querySelector("script[data-tapiwa-ga4]")) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      function () {
        window.dataLayer.push(arguments);
      };

    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      cookie_domain: "tapiwa.me",
      cookie_flags: "SameSite=Lax;Secure",
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });

    var script = document.createElement("script");
    script.async = true;
    script.src =
      "https://www.googletagmanager.com/gtag/js?id=" +
      encodeURIComponent(measurementId);
    script.dataset.tapiwaGa4 = measurementId;
    document.head.appendChild(script);
  }

  function schedule() {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(boot, { timeout: 2500 });
    } else {
      window.setTimeout(boot, 1200);
    }
  }

  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });
})();
