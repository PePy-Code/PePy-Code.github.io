(() => {
  "use strict";

  const STORAGE_KEY = "booted";
  const LINE_DELAY = 120;
  const BANNER_DELAY = 680;
  const HOLD = 900;
  const FADE = 380;

  const LINES = [
    "Mounting /dev/pepy ...",
    "Loading module: offensive-security",
    "Loading module: ctf-toolkit",
    "Connecting to HackTheBox ... lvl 31",
    "Starting portfolio.service",
  ];

  const BANNER = [
    "██████╗ ███████╗██████╗ ██╗   ██╗",
    "██╔══██╗██╔════╝██╔══██╗╚██╗ ██╔╝",
    "██████╔╝█████╗  ██████╔╝ ╚████╔╝",
    "██╔═══╝ ██╔══╝  ██╔═══╝   ╚██╔╝",
    "██║     ███████╗██║        ██║",
    "╚═╝     ╚══════╝╚═╝        ╚═╝",
  ].join("\n");

  function init() {
    const root = document.documentElement;

    // Recruiter/plain mode: no intro at all.
    if (root.classList.contains("plain")) return;

    // Guard against the script being evaluated more than once.
    if (root.hasAttribute("data-boot-init")) return;
    root.setAttribute("data-boot-init", "1");

    // Respect users who prefer less motion: no overlay at all.
    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    // Show once per browser session. If storage is unavailable, still show.
    let alreadyBooted = false;
    try {
      alreadyBooted = window.sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch (_) {
      alreadyBooted = false;
    }
    if (alreadyBooted) return;

    try {
      window.sessionStorage.setItem(STORAGE_KEY, "1");
    } catch (_) {
      /* Storage may throw (private mode, file://); the boot still plays. */
    }

    if (!document.body) return;

    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";

    const overlay = document.createElement("div");
    overlay.id = "boot";
    overlay.setAttribute("role", "presentation");
    overlay.setAttribute("aria-hidden", "true");

    const screen = document.createElement("div");
    screen.className = "boot__screen";

    const log = document.createElement("div");
    log.className = "boot__log";

    const banner = document.createElement("pre");
    banner.className = "boot__banner";
    banner.textContent = BANNER;

    screen.appendChild(log);
    screen.appendChild(banner);
    overlay.appendChild(screen);
    document.body.appendChild(overlay);

    const timers = [];
    let done = false;

    function cleanup() {
      window.removeEventListener("keydown", onSkip, true);
      window.removeEventListener("pointerdown", onSkip, true);
      window.removeEventListener("touchstart", onSkip, true);
      window.removeEventListener("click", onSkip, true);
      window.removeEventListener("plainchange", onPlainChange);
      for (let i = 0; i < timers.length; i += 1) clearTimeout(timers[i]);
      timers.length = 0;
    }

    function finish() {
      if (done) return;
      done = true;
      cleanup();

      overlay.classList.add("boot--out");

      let removed = false;
      const removeOverlay = () => {
        if (removed) return;
        removed = true;
        root.style.overflow = previousOverflow;
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      };

      overlay.addEventListener("transitionend", (event) => {
        if (event.target === overlay && event.propertyName === "opacity") {
          removeOverlay();
        }
      });
      // Fallback in case the transition never fires.
      setTimeout(removeOverlay, FADE + 120);
    }

    function onSkip() {
      finish();
    }

    LINES.forEach((text, index) => {
      timers.push(
        setTimeout(() => {
          const active = log.querySelector(".boot__line.is-active");
          if (active) active.classList.remove("is-active");

          const line = document.createElement("div");
          line.className = "boot__line is-active";

          const ok = document.createElement("span");
          ok.className = "boot__ok";
          ok.textContent = "[  OK  ]";

          const msg = document.createElement("span");
          msg.className = "boot__msg";
          msg.textContent = " " + text;

          line.appendChild(ok);
          line.appendChild(msg);
          log.appendChild(line);
        }, index * LINE_DELAY)
      );
    });

    timers.push(
      setTimeout(() => {
        const active = log.querySelector(".boot__line.is-active");
        if (active) active.classList.remove("is-active");
        banner.classList.add("is-visible");
      }, BANNER_DELAY)
    );

    timers.push(setTimeout(finish, BANNER_DELAY + HOLD));

    window.addEventListener("keydown", onSkip, true);
    window.addEventListener("pointerdown", onSkip, true);
    window.addEventListener("touchstart", onSkip, true);
    window.addEventListener("click", onSkip, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
