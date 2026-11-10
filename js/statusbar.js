(() => {
  "use strict";

  const BAR_ID = "pepy-statusbar";

  function init() {
    if (!document.body || document.getElementById(BAR_ID)) return;

    const bar = document.createElement("div");
    bar.id = BAR_ID;
    bar.className = "statusbar";
    bar.setAttribute("aria-hidden", "true");

    const left = document.createElement("div");
    left.className = "statusbar__left";

    const brand = document.createElement("span");
    brand.className = "statusbar__brand";
    brand.textContent = "[pepy]";

    const path = document.createElement("span");
    path.className = "statusbar__path";
    path.textContent = "~";

    left.append(brand, path);

    const right = document.createElement("div");
    right.className = "statusbar__right";

    const hint = document.createElement("span");
    hint.className = "statusbar__hint";
    hint.textContent = "^K palette";

    const clock = document.createElement("span");
    clock.className = "statusbar__clock";
    clock.textContent = "--:--";

    right.append(hint, clock);
    bar.append(left, right);
    document.body.appendChild(bar);
    document.body.classList.add("has-statusbar");

    const sections = document.querySelectorAll("main section[id]");

    function setSection(id) {
      const value = id && id !== "top" ? "~/" + id : "~";
      if (path.textContent !== value) path.textContent = value;
    }

    function updateSection() {
      if (!sections.length) return;
      const middle = window.innerHeight / 2;
      let current = null;

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= middle && rect.bottom > middle) {
          current = section.id;
        }
      });

      if (current) setSection(current);
    }

    setSection("top");

    if (sections.length && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver(updateSection, {
        rootMargin: "-50% 0px -50% 0px",
        threshold: 0,
      });
      sections.forEach((section) => observer.observe(section));
    }

    window.addEventListener("resize", updateSection, { passive: true });

    function pad(value) {
      return value < 10 ? "0" + value : String(value);
    }

    function tick() {
      const now = new Date();
      clock.textContent = pad(now.getHours()) + ":" + pad(now.getMinutes());
      const untilNextMinute =
        (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
      window.setTimeout(tick, Math.max(1000, untilNextMinute));
    }

    tick();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
