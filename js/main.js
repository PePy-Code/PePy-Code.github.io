(() => {
  // Modo simple: se aplica antes de que boot.js y fx.js arranquen
  const root = document.documentElement;
  let plain = false;
  try { plain = localStorage.getItem("plain") === "1"; } catch (_) {}
  root.classList.toggle("plain", plain);

  const nodes = document.querySelectorAll("[data-i18n]");
  const ES = {};
  nodes.forEach((el) => { ES[el.dataset.i18n] = el.innerHTML; });
  const DICT = { es: ES, en: I18N_EN };

  const btn = document.getElementById("lang-toggle");
  const typed = document.getElementById("typed");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let typingTimer;

  function typeRole() {
    clearTimeout(typingTimer);
    const text = typed.textContent;
    if (reduceMotion || root.classList.contains("plain")) return;
    typed.textContent = "";
    let i = 0;
    const step = () => {
      typed.textContent = text.slice(0, ++i);
      if (i < text.length) typingTimer = setTimeout(step, 35);
    };
    step();
  }

  function setLang(lang) {
    const dict = DICT[lang] || ES;
    nodes.forEach((el) => {
      const value = dict[el.dataset.i18n];
      if (value !== undefined) el.innerHTML = value;
    });
    document.documentElement.lang = lang;
    btn.textContent = lang === "es" ? "EN" : "ES";
    try { localStorage.setItem("lang", lang); } catch (_) {}
    typeRole();
  }

  let saved = null;
  try { saved = localStorage.getItem("lang"); } catch (_) {}
  const browserLang = (navigator.language || "es").startsWith("es") ? "es" : "en";
  const initial = saved || browserLang;
  setLang(initial);

  btn.addEventListener("click", () => {
    setLang(document.documentElement.lang === "es" ? "en" : "es");
  });

  // Menú móvil
  const toggle = document.querySelector(".nav__toggle");
  const links = document.getElementById("nav-links");
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
  });
  links.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  // Proyecto confidencial: solo muestra "Permission denied"
  const lockedBtn = document.getElementById("locked-btn");
  const denied = document.getElementById("denied");
  if (lockedBtn && denied) {
    lockedBtn.addEventListener("click", () => {
      denied.textContent = "bash: ./undisclosed-cv-research: Permission denied";
      const card = lockedBtn.closest(".card--classified");
      card.classList.remove("flash");
      void card.offsetWidth; // reinicia la animación
      card.classList.add("flash");
    });
  }

  const plainBtn = document.getElementById("plain-toggle");
  if (plainBtn) {
    plainBtn.setAttribute("aria-pressed", String(plain));
    plainBtn.addEventListener("click", () => {
      plain = !root.classList.contains("plain");
      root.classList.toggle("plain", plain);
      plainBtn.setAttribute("aria-pressed", String(plain));
      try { localStorage.setItem("plain", plain ? "1" : "0"); } catch (_) {}
      window.dispatchEvent(new CustomEvent("plainchange", { detail: { plain } }));
    });
  }

  // Copiar correo con confirmación visible
  const copyBtn = document.getElementById("copy-email");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const email = copyBtn.dataset.email;
      const original = copyBtn.innerHTML;
      let ok = false;
      try { await navigator.clipboard.writeText(email); ok = true; } catch (_) {}
      const es = root.lang === "es";
      copyBtn.textContent = ok ? (es ? "[ copiado ✓ ]" : "[ copied ✓ ]") : email;
      setTimeout(() => { copyBtn.innerHTML = original; }, 1800);
    });
  }

  document.getElementById("year").textContent = new Date().getFullYear();
})();
