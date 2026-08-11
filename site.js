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
