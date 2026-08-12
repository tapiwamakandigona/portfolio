// Scroll reveal — progressive enhancement only
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const targets = document.querySelectorAll(
    ".section, .stats, .dark-band .db-inner > *, .flag-card, .tile, .award-list li"
  );
  targets.forEach((el) => el.classList.add("reveal"));
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
  );
  targets.forEach((el) => io.observe(el));
})();

// Pointer-tracked 3D tilt on flagship cards (desktop, fine pointers only)
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  document.querySelectorAll(".tilt").forEach(function (card) {
    var raf = null;
    function move(e) {
      var r = card.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = null;
        card.style.setProperty("--mx", ((x + 0.5) * 100).toFixed(1) + "%");
        card.style.setProperty("--my", ((y + 0.5) * 100).toFixed(1) + "%");
        card.style.transform =
          "rotateY(" + (x * 10).toFixed(2) + "deg) rotateX(" +
          (-y * 10).toFixed(2) + "deg) translateY(-6px) scale(1.012)";
        card.style.boxShadow =
          (-x * 26).toFixed(1) + "px " + (14 - y * 18).toFixed(1) +
          "px 46px -18px rgba(20,20,19,.36)";
      });
    }
    card.addEventListener("pointerenter", function () { card.classList.add("tilting"); });
    card.addEventListener("pointermove", move);
    card.addEventListener("pointerleave", function () {
      card.classList.remove("tilting");
      card.style.transform = "";
      card.style.boxShadow = "";
    });
  });
})();

/* Motion toggle. The graphs respect the OS "reduce motion" setting by dropping to a
   calm drift, but a visitor may want the opposite of whatever their system says, so
   the choice is theirs and it persists. Reloading is the honest way to re-apply it:
   the engine reads the preference once at boot. */
(function () {
  var btn = document.querySelector("[data-motion-toggle]");
  if (!btn || typeof window.NET_MOTION !== "function") return;
  function label() {
    var mode = window.NET_MOTION();
    btn.textContent = mode === "full" ? "Reduce motion" : "Enable motion";
    btn.setAttribute("aria-label", mode === "full"
      ? "Reduce the background animation" : "Enable the background animation");
  }
  btn.hidden = false;
  label();
  btn.addEventListener("click", function () {
    var next = window.NET_MOTION() === "full" ? "off" : "on";
    try { localStorage.setItem("motion", next); } catch (e) { /* private mode */ }
    location.reload();
  });
})();

/* Curated portfolio interactions. Markup supplies fixed slugs and enums;
   hrefs, link text and user-entered values are never sent to analytics. */
(function () {
  document.addEventListener("click", function (event) {
    var link = event.target.closest("a[data-analytics-event]");
    if (!link || typeof window.tapiwaTrack !== "function") return;

    var name = link.getAttribute("data-analytics-event");
    var params = {};
    if (name === "portfolio_project_click") {
      params.project = link.getAttribute("data-analytics-project");
      params.destination = link.getAttribute("data-analytics-destination");
      if (!params.project || !params.destination) return;
    } else if (name === "portfolio_contact_click") {
      params.method = link.getAttribute("data-analytics-method");
      if (!params.method) return;
    } else {
      return;
    }

    try { window.tapiwaTrack(name, params); } catch (_) { /* product action always wins */ }
  });
})();


/* Site-wide behaviours that outlive any one page ---------------------- */
(function () {
  var yr = document.getElementById("yr");
  if (yr) yr.textContent = new Date().getFullYear();

  var top = document.getElementById("back-top");
  if (top) {
    window.addEventListener("scroll", function () {
      top.classList.toggle("visible", window.scrollY > 420);
    }, { passive: true });
    top.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
})();
