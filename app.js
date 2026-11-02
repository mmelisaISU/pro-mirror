const SCREENS = ["start", "connect", "pairing", "connected", "home", "scan", "analyzing", "results", "product", "settings", "lighting"];
const TABBED = new Set(["home", "product", "settings", "lighting"]);
const SETTINGS_ENTRY = new Set(["home", "results", "product", "scan", "lighting"]);

const state = {
  collected: false,
  mode: "natural",
  brightness: 52,
  auto: false
};

let pairTimer = 0;

const phone = document.getElementById("phone");

function screenFromHash() {
  if (capturing()) {
    const fromQuery = new URLSearchParams(location.search).get("screen");
    if (fromQuery && SCREENS.includes(fromQuery)) return fromQuery;
  }
  const name = location.hash.replace(/^#\//, "").split("&")[0];
  return SCREENS.includes(name) ? name : "start";
}

function capturing() {
  return location.hash.includes("figmacapture");
}

function go(name, replace) {
  const next = "#/" + name;
  if (location.hash === next) {
    render();
    return;
  }
  if (replace) location.replace(next);
  else location.hash = next;
}

function render() {
  window.clearTimeout(pairTimer);
  const name = screenFromHash();
  if (!capturing() && location.hash !== "#/" + name) {
    location.replace("#/" + name);
    return;
  }

  phone.querySelectorAll("[data-screen]").forEach((el) => {
    const on = el.dataset.screen === name;
    el.classList.toggle("is-on", on);
    el.hidden = !on;
    if (on) el.scrollTop = 0;
  });

  phone.querySelector(".tabbar").classList.toggle("is-on", TABBED.has(name));

  const settingsEntry = phone.querySelector(".settings-entry");
  const showSettings = SETTINGS_ENTRY.has(name);
  settingsEntry.hidden = !showSettings;
  settingsEntry.classList.toggle("is-on", showSettings);

  if (!capturing() && name === "pairing") {
    pairTimer = window.setTimeout(() => go("connected", true), 1700);
  }
  if (!capturing() && name === "connected") {
    pairTimer = window.setTimeout(() => go("home", true), 1500);
  }
  if (!capturing() && name === "analyzing") {
    pairTimer = window.setTimeout(() => go("results", true), 2200);
  }
  syncLighting();
  if (name === "product") syncProduct();
}

function syncLighting() {
  phone.querySelectorAll("[data-mode]").forEach((btn) => {
    const on = btn.dataset.mode === state.mode;
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-pressed", String(on));
  });

  phone.querySelectorAll(".brightness").forEach((range) => {
    range.value = String(state.brightness);
    range.style.setProperty("--p", state.brightness + "%");
  });

  const sw = document.getElementById("auto");
  sw.classList.toggle("is-on", state.auto);
  sw.setAttribute("aria-checked", String(state.auto));

  phone.querySelectorAll(".mirror--live").forEach((el) => {
    el.dataset.tone = state.mode;
  });
}

function syncProduct() {
  const btn = document.getElementById("add-btn");
  btn.textContent = state.collected ? "Added to Collection" : "Add to Collection";
  btn.classList.toggle("is-added", state.collected);
  btn.setAttribute("aria-pressed", String(state.collected));
}

function capture() {
  go("analyzing", true);
}

phone.addEventListener("click", (event) => {
  const mode = event.target.closest("[data-mode]");
  if (mode) {
    state.mode = mode.dataset.mode;
    syncLighting();
    return;
  }

  if (event.target.closest("#auto")) {
    state.auto = !state.auto;
    syncLighting();
    return;
  }

  if (event.target.closest("#add-btn")) {
    state.collected = !state.collected;
    syncProduct();
    return;
  }

  const saveBtn = event.target.closest(".product__saved");
  if (saveBtn) {
    event.stopPropagation();
    const on = !saveBtn.classList.contains("is-on");
    saveBtn.classList.toggle("is-on", on);
    saveBtn.setAttribute("aria-pressed", String(on));
    saveBtn.setAttribute("aria-label", on ? "Saved" : "Save product");
    return;
  }

  if (event.target.closest("#shutter")) {
    capture();
    return;
  }

  if (event.target.closest("[data-back]")) {
    if (history.length > 1) history.back();
    else go("home");
    return;
  }

  const dest = event.target.closest("[data-go]");
  if (!dest) return;
  go(dest.dataset.go, dest.hasAttribute("data-replace"));
});

phone.addEventListener("input", (event) => {
  if (!event.target.classList.contains("brightness")) return;
  state.brightness = Number(event.target.value);
  syncLighting();
});

window.addEventListener("hashchange", render);

if (capturing()) render();
else if (location.hash === "#/start") render();
else location.replace("#/start");
