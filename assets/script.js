function setupMenu(toggle, nav) {
  const desktop = window.matchMedia("(min-width: 901px)");

  function setOpen(isOpen) {
    nav.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute(
      "aria-label",
      isOpen ? "Fechar navegação" : "Abrir navegação",
    );
    nav.toggleAttribute("inert", !isOpen);
  }

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    setOpen(!isOpen);
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (toggle.getAttribute("aria-expanded") !== "true") return;
    setOpen(false);
    toggle.focus();
  });

  desktop.addEventListener("change", (event) => {
    if (event.matches) setOpen(false);
  });
}

function setupCommandSearch(search, list, notify) {
  const items = [...list.querySelectorAll(".command-item")];
  const empty = list.querySelector(".command-empty");

  function visibleItems() {
    return items.filter((item) => !item.hidden);
  }

  function select(item) {
    items.forEach((entry) => {
      entry.setAttribute("aria-selected", String(entry === item));
    });

    if (item) search.setAttribute("aria-activedescendant", item.id);
    else search.removeAttribute("aria-activedescendant");
  }

  function filterItems() {
    const query = search.value.trim().toLowerCase();
    let visibleCount = 0;

    items.forEach((item) => {
      const haystack =
        `${item.dataset.search} ${item.textContent}`.toLowerCase();
      const match = haystack.includes(query);
      item.hidden = !match;
      if (match) visibleCount += 1;
    });

    empty.hidden = visibleCount > 0;
    select(visibleItems()[0]);
  }

  function moveSelection(direction) {
    const visible = visibleItems();
    if (visible.length === 0) return;

    const current =
      visible.find((item) => item.getAttribute("aria-selected") === "true") ||
      visible[0];
    const index = visible.indexOf(current);
    const next =
      visible[(index + direction + visible.length) % visible.length];
    select(next);
  }

  search.addEventListener("input", filterItems);

  search.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveSelection(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveSelection(-1);
    } else if (event.key === "Enter") {
      const selected = visibleItems().find(
        (item) => item.getAttribute("aria-selected") === "true",
      );
      if (!selected) return;
      event.preventDefault();
      selected.click();
    }
  });

  items.forEach((item) => {
    item.addEventListener("click", () => {
      select(item);
      const name = item.querySelector("strong").textContent;
      notify(`${name} selecionado.`);
    });
  });

  document.addEventListener("keydown", (event) => {
    const shortcut =
      (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
    if (shortcut) {
      event.preventDefault();
      search.focus();
      return;
    }

    if (event.key === "Escape" && document.activeElement === search) {
      search.value = "";
      filterItems();
      search.blur();
    }
  });
}

function setupWorkflowTabs(section) {
  const tabs = [...section.querySelectorAll('[role="tab"]')];
  const panels = [...section.querySelectorAll('[role="tabpanel"]')];

  function activate(tab) {
    const panelId = tab.getAttribute("aria-controls");

    tabs.forEach((entry) => {
      const selected = entry === tab;
      entry.setAttribute("aria-selected", String(selected));
      entry.tabIndex = selected ? 0 : -1;
    });

    panels.forEach((panel) => {
      panel.hidden = panel.id !== panelId;
    });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activate(tab));

    tab.addEventListener("keydown", (event) => {
      const last = tabs.length - 1;
      let nextIndex = null;

      if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft") {
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = last;
      if (nextIndex === null) return;

      event.preventDefault();
      const next = tabs[nextIndex];
      activate(next);
      next.focus();
    });
  });
}

function setupDownload(buttons, notify) {
  const preparingMs = 650;

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const label = button.textContent.trim();

      button.setAttribute("aria-busy", "true");
      button.disabled = true;
      button.textContent = "Preparando…";

      window.setTimeout(() => {
        button.removeAttribute("aria-busy");
        button.disabled = false;
        button.textContent = label;
        // Não existe arquivo para baixar. O botão só mostra o aviso.
        notify(
          "Versão conceitual indisponível — este protótipo não inclui um aplicativo para instalar.",
        );
      }, preparingMs);
    });
  });
}

function createNotifier(toast) {
  const visibleMs = 2600;
  let timer = 0;

  return function notify(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, visibleMs);
  };
}

const notify = createNotifier(document.querySelector("#status-toast"));

setupMenu(
  document.querySelector("#menu-toggle"),
  document.querySelector("#mobile-nav"),
);
setupCommandSearch(
  document.querySelector("#command-search"),
  document.querySelector("#command-list"),
  notify,
);
setupWorkflowTabs(document.querySelector("#workflow"));
setupDownload(document.querySelectorAll(".download-action"), notify);
