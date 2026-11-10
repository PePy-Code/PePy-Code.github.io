(() => {
  "use strict";

  const PALETTE_ID = "pepy-palette";
  const LIST_ID = "pepy-palette-list";
  const INPUT_ID = "pepy-palette-input";

  function init() {
    if (!document.body || document.getElementById(PALETTE_ID)) return;

    const reduceMotion = () =>
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const overlay = document.createElement("div");
    overlay.id = PALETTE_ID;
    overlay.hidden = true;

    const dialog = document.createElement("div");
    dialog.className = "palette__dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-label", "Command palette");
    dialog.tabIndex = -1;

    const bar = document.createElement("div");
    bar.className = "palette__bar";

    const prompt = document.createElement("span");
    prompt.className = "palette__prompt";
    prompt.setAttribute("aria-hidden", "true");
    prompt.textContent = ">";

    const input = document.createElement("input");
    input.id = INPUT_ID;
    input.className = "palette__input";
    input.type = "text";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-expanded", "true");
    input.setAttribute("aria-controls", LIST_ID);
    input.setAttribute("aria-label", "Filter commands");

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "palette__close";
    closeBtn.setAttribute("aria-label", "Close command palette");
    closeBtn.textContent = "\u00d7";

    bar.append(prompt, input, closeBtn);

    const list = document.createElement("ul");
    list.id = LIST_ID;
    list.className = "palette__list";
    list.setAttribute("role", "listbox");
    list.setAttribute("aria-label", "Commands");

    const foot = document.createElement("div");
    foot.className = "palette__foot";
    foot.setAttribute("aria-hidden", "true");
    ["\u2191\u2193", "\u21b5 run", "esc close"].forEach((label) => {
      const span = document.createElement("span");
      span.textContent = label;
      foot.appendChild(span);
    });

    dialog.append(bar, list, foot);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    let isOpen = false;
    let commands = [];
    let filtered = [];
    let activeIndex = -1;
    let previousFocus = null;
    let previousOverflow = "";

    function isEditable(element) {
      if (!element) return false;
      const tag = element.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        element.isContentEditable === true
      );
    }

    function buildCommands() {
      const items = [];
      const nav = document.getElementById("nav-links");

      if (nav) {
        nav.querySelectorAll("a[href]").forEach((link) => {
          const href = link.getAttribute("href") || "";
          if (!href.startsWith("#") || href.length < 2) return;
          const id = href.slice(1);
          items.push({
            name: (link.textContent || href).trim(),
            hint: href,
            run() {
              const target = document.getElementById(id);
              if (!target) return;
              target.scrollIntoView({
                behavior: reduceMotion() ? "auto" : "smooth",
                block: "start",
              });
            },
          });
        });
      }

      const langBtn = document.getElementById("lang-toggle");
      if (langBtn) {
        items.push({
          name: "lang",
          hint: "es / en",
          run() {
            langBtn.click();
          },
        });
      }

      items.push({
        name: "github",
        hint: "github.com/PePy-Code",
        run() {
          window.open("https://github.com/PePy-Code", "_blank", "noopener");
        },
      });

      items.push({
        name: "email",
        hint: "mailto:SaulBastidas064@outlook.com",
        run() {
          window.location.href = "mailto:SaulBastidas064@outlook.com";
        },
      });

      items.push({
        name: "top",
        hint: "back to top",
        run() {
          window.scrollTo({
            top: 0,
            behavior: reduceMotion() ? "auto" : "smooth",
          });
        },
      });

      return items;
    }

    function setActive(index) {
      if (!filtered.length) {
        activeIndex = -1;
        input.removeAttribute("aria-activedescendant");
        return;
      }

      activeIndex = (index + filtered.length) % filtered.length;

      const options = list.querySelectorAll('[role="option"]');
      options.forEach((option, i) => {
        const selected = i === activeIndex;
        option.setAttribute("aria-selected", selected ? "true" : "false");
        if (selected) {
          input.setAttribute("aria-activedescendant", option.id);
          option.scrollIntoView({ block: "nearest" });
        }
      });
    }

    function render() {
      const query = input.value.trim().toLowerCase();
      filtered = commands.filter((command) => {
        if (!query) return true;
        return (
          command.name.toLowerCase().includes(query) ||
          command.hint.toLowerCase().includes(query)
        );
      });

      list.textContent = "";
      activeIndex = -1;
      input.removeAttribute("aria-activedescendant");

      if (!filtered.length) {
        const empty = document.createElement("li");
        empty.className = "palette__empty";
        empty.setAttribute("role", "presentation");
        empty.textContent = "no matches";
        list.appendChild(empty);
        return;
      }

      filtered.forEach((command, i) => {
        const option = document.createElement("li");
        option.id = PALETTE_ID + "-option-" + i;
        option.className = "palette__option";
        option.setAttribute("role", "option");
        option.setAttribute("aria-selected", "false");

        const name = document.createElement("span");
        name.className = "palette__name";
        name.textContent = command.name;

        const hint = document.createElement("span");
        hint.className = "palette__hint";
        hint.textContent = command.hint;

        option.append(name, hint);
        option.addEventListener("mousedown", (event) => {
          event.preventDefault();
        });
        option.addEventListener("click", () => {
          execute(command);
        });
        option.addEventListener("mousemove", () => {
          if (activeIndex !== i) setActive(i);
        });

        list.appendChild(option);
      });

      setActive(0);
    }

    function close(restoreFocus) {
      if (!isOpen) return;
      isOpen = false;
      document.removeEventListener("keydown", onOpenKey, true);
      overlay.hidden = true;
      document.documentElement.style.overflow = previousOverflow;

      if (
        restoreFocus !== false &&
        previousFocus &&
        typeof previousFocus.focus === "function" &&
        document.contains(previousFocus)
      ) {
        previousFocus.focus({ preventScroll: true });
      }

      previousFocus = null;
    }

    function execute(command) {
      if (!command) return;
      command.run();
      close(true);
    }

    function onOpenKey(event) {
      if (!isOpen) return;
      if (event.isComposing) return;

      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close(true);
        return;
      }

      if (event.key === "Tab") {
        event.preventDefault();
        const focusables = [input, closeBtn];
        const index = focusables.indexOf(document.activeElement);
        let next;
        if (event.shiftKey) {
          next = index <= 0 ? focusables.length - 1 : index - 1;
        } else {
          next = index === focusables.length - 1 ? 0 : index + 1;
        }
        focusables[next].focus({ preventScroll: true });
        return;
      }

      if (event.target !== input) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive(activeIndex + 1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive(activeIndex - 1);
      } else if (event.key === "Enter") {
        event.preventDefault();
        execute(filtered[activeIndex]);
      }
    }

    function open() {
      if (isOpen || document.getElementById("boot")) return;
      isOpen = true;
      previousFocus = document.activeElement;
      previousOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";

      commands = buildCommands();
      input.value = "";
      render();
      overlay.hidden = false;
      input.focus({ preventScroll: true });
      document.addEventListener("keydown", onOpenKey, true);
    }

    function onHotkey(event) {
      if (event.defaultPrevented || event.repeat) return;

      const key = event.key;
      const isK =
        (key === "k" || key === "K") &&
        (event.ctrlKey || event.metaKey) &&
        !event.altKey;
      const isSlash =
        key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey;

      if (!isK && !isSlash) return;

      if (isOpen) {
        if (isK) {
          event.preventDefault();
          close(true);
        }
        return;
      }

      if (isEditable(event.target)) return;
      if (document.getElementById("boot")) return;

      event.preventDefault();
      open();
    }

    input.addEventListener("input", render);
    closeBtn.addEventListener("click", () => close(true));
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close(true);
    });

    document.addEventListener("keydown", onHotkey, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
