const SCREENS = ["start", "connect", "pairing", "connected", "home", "scan", "results", "product", "settings", "lighting"];
const TABBED = new Set(["home", "product", "settings", "lighting"]);

const state = {
  collected: false,
  mode: "natural",
  brightness: 52,
  auto: true
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

  if (!capturing() && name === "pairing") {
    pairTimer = window.setTimeout(() => go("connected", true), 1700);
  }
  if (!capturing() && name === "connected") {
    pairTimer = window.setTimeout(() => go("home", true), 1500);
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
  const flash = document.getElementById("flash");
  flash.classList.remove("is-on");
  void flash.offsetWidth;
  flash.classList.add("is-on");
  window.setTimeout(() => go("results"), 360);
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

if (!location.hash) location.replace("#/start");
else render();
