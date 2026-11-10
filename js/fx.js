(() => {
  "use strict";

  const CANVAS_ID = "fx-canvas";
  const REVEAL_SELECTOR = [
    ".section__title",
    ".card",
    ".timeline li",
    ".stat",
    ".ls__row",
    ".feature",
    ".tree",
    ".about",
  ].join(",");
  const COUNT_SELECTOR = ".stat__value";
  const FPS = 30;
  const GLYPHS = "0123456789ABCDEF";

  function init() {
    if (!document.body) return;

    const root = document.documentElement;
    if (root.classList.contains("fx")) return;

    const motionQuery =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;

    if (motionQuery && motionQuery.matches) return;

    const supportsIO = "IntersectionObserver" in window;
    // Modo simple (reclutadores): sin lluvia, sin reveal, sin count-up.
    const isPlain = () => root.classList.contains("plain");

    try {
      if (!isPlain()) {
        setupReveal(root, supportsIO);
        setupCountUp(supportsIO, motionQuery);
      }
    } catch (_) {
      // Never leave content hidden if setup fails.
      root.classList.remove("fx");
      document.querySelectorAll(".fx-reveal").forEach((el) => {
        el.classList.remove("fx-reveal", "fx-in");
        el.style.transitionDelay = "";
      });
    }

    let rain = null;

    function syncRain() {
      if ((motionQuery && motionQuery.matches) || isPlain()) {
        if (rain) {
          rain.destroy();
          rain = null;
        }
        return;
      }
      if (!rain) rain = createRain();
    }

    syncRain();

    window.addEventListener("plainchange", () => {
      // Al activar el modo simple se muestra todo de inmediato.
      if (isPlain()) root.classList.remove("fx");
      syncRain();
    });

    if (motionQuery) {
      if (typeof motionQuery.addEventListener === "function") {
        motionQuery.addEventListener("change", syncRain);
      } else if (typeof motionQuery.addListener === "function") {
        motionQuery.addListener(syncRain);
      }
    }
  }

  function setupReveal(root, supportsIO) {
    if (!supportsIO) return;

    const targets = Array.prototype.slice.call(
      document.querySelectorAll(REVEAL_SELECTOR)
    );
    if (!targets.length) return;

    root.classList.add("fx");

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          obs.unobserve(entry.target);
          reveal(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );

    targets.forEach((el) => {
      if (!el.classList.contains("fx-reveal")) el.classList.add("fx-reveal");

      const parent = el.parentElement;
      if (parent) {
        const siblings = Array.prototype.filter.call(
          parent.children,
          (child) => child.classList.contains("fx-reveal")
        );
        const index = siblings.indexOf(el);
        if (index > 0) {
          el.style.transitionDelay = Math.min(index, 6) * 60 + "ms";
        }
      }

      observer.observe(el);
    });
  }

  function reveal(el) {
    el.classList.add("fx-in");
    const delay = parseFloat(el.style.transitionDelay) || 0;
    // Remove the helper classes afterwards so each element gets its own
    // original transition (e.g. .card's border-color hover) back.
    window.setTimeout(() => {
      el.classList.remove("fx-reveal", "fx-in");
      el.style.transitionDelay = "";
    }, 700 + delay);
  }

  function setupCountUp(supportsIO, motionQuery) {
    if (!supportsIO) return;

    const values = document.querySelectorAll(COUNT_SELECTOR);
    if (!values.length) return;

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          obs.unobserve(entry.target);
          animateCount(entry.target, motionQuery);
        });
      },
      { threshold: 0.4 }
    );

    values.forEach((el) => {
      const raw = el.textContent || "";
      if (/^#?\d+$/.test(raw.trim())) observer.observe(el);
    });
  }

  function animateCount(el, motionQuery) {
    if (motionQuery && motionQuery.matches) return;
    if (typeof window.requestAnimationFrame !== "function") return;

    const raw = el.textContent || "";
    const match = /^(#?)(\d+)$/.exec(raw.trim());
    if (!match) return;

    const prefix = match[1];
    const target = parseInt(match[2], 10);
    if (!isFinite(target) || target <= 0) return;

    const duration = 900;
    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);

    el.textContent = prefix + "0";

    function frame(now) {
      if (motionQuery && motionQuery.matches) {
        el.textContent = raw;
        return;
      }

      const progress = Math.min(1, (now - start) / duration);
      el.textContent = prefix + Math.round(ease(progress) * target);

      if (progress < 1) {
        window.requestAnimationFrame(frame);
      } else {
        el.textContent = raw;
      }
    }

    window.requestAnimationFrame(frame);
  }

  function createRain() {
    if (document.getElementById(CANVAS_ID)) return null;

    const canvas = document.createElement("canvas");
    canvas.id = CANVAS_ID;
    canvas.setAttribute("aria-hidden", "true");
    document.body.insertBefore(canvas, document.body.firstChild);

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      return null;
    }

    const motionQuery =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let columns = [];
    let fontSize = 14;
    let cell = 21;
    let running = false;
    let visible = true;
    let rafId = 0;
    let lastDraw = 0;
    let resizeTimer = 0;
    let observer = null;

    function makeDrop(x) {
      return {
        x,
        y: Math.random() * height * 1.4 - height * 0.4,
        speed: 18 + Math.random() * 26,
        trail: 6 + Math.floor(Math.random() * 8),
      };
    }

    function resize() {
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      fontSize = width < 640 ? 11 : 14;
      cell = Math.round(fontSize * 1.5);
      ctx.font = fontSize + "px 'JetBrains Mono', ui-monospace, monospace";

      const maxColumns = width < 640 ? 8 : 24;
      const spacing = Math.max(cell * 1.8, width / maxColumns);
      const count = Math.max(
        3,
        Math.min(maxColumns, Math.floor(width / spacing))
      );

      columns = [];
      for (let i = 0; i < count; i += 1) {
        columns.push(
          makeDrop(
            i * spacing +
              spacing / 2 +
              (Math.random() - 0.5) * spacing * 0.25
          )
        );
      }
    }

    function draw(now) {
      if (!running) return;

      if (now - lastDraw < 1000 / FPS) {
        rafId = window.requestAnimationFrame(draw);
        return;
      }

      const dt = lastDraw
        ? Math.min(0.1, (now - lastDraw) / 1000)
        : 1 / FPS;
      lastDraw = now;

      ctx.clearRect(0, 0, width, height);

      for (let c = 0; c < columns.length; c += 1) {
        const drop = columns[c];
        drop.y += drop.speed * dt;
        const head = Math.floor(drop.y / cell);

        for (let i = 0; i < drop.trail; i += 1) {
          const y = (head - i) * cell + cell / 2;
          if (y < -cell || y > height + cell) continue;

          const alpha = (1 - i / drop.trail) * 0.2;
          if (alpha < 0.015) continue;

          ctx.fillStyle = "rgba(245,245,245," + alpha.toFixed(3) + ")";
          ctx.fillText(
            GLYPHS.charAt((Math.random() * GLYPHS.length) | 0),
            drop.x,
            y
          );
        }

        if (drop.y - drop.trail * cell > height) {
          drop.y = -Math.random() * height * 0.5;
          drop.speed = 18 + Math.random() * 26;
          drop.trail = 6 + Math.floor(Math.random() * 8);
        }
      }

      rafId = window.requestAnimationFrame(draw);
    }

    function start() {
      if (running || !visible || document.hidden) return;
      if (motionQuery && motionQuery.matches) return;
      running = true;
      lastDraw = 0;
      rafId = window.requestAnimationFrame(draw);
    }

    function stop() {
      running = false;
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = 0;
    }

    function onVisibility() {
      if (document.hidden) stop();
      else start();
    }

    function onResize() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        resize();
        start();
      }, 150);
    }

    resize();
    start();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", onResize, { passive: true });

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          visible = entries.some((entry) => entry.isIntersecting);
          if (visible) start();
          else stop();
        },
        { threshold: 0 }
      );
      observer.observe(canvas);
    }

    return {
      destroy() {
        stop();
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("resize", onResize);
        if (observer) observer.disconnect();
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      },
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
