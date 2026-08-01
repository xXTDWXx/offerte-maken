const COMPANY_NAME = "Sunspa Brugge/Lievegem";
const COMPANY_LOGO = "logo.svg";
const HOTTUB_INSTALLATION_PRICE = 695;
const wizardStepNames = [
  "model",
  "wood",
  "size",
  "kleur",
  "opwarming",
  "kachel",
  "massage",
  "verlichting",
  "filter",
  "cover",
  "extra"
];
const multiSelectStepNames = new Set(["verlichting", "extra"]);
let currentWizardStep = 0;
let wizardCompleted = false;
const TECHNICAL_IMAGES = [
  { src: "images/Hottub technical sheets/1. Acrylic 180cm integrated.jpg", title: "1. Acrylic 180cm integrated" },
  { src: "images/Hottub technical sheets/2. Acrylic 180cm horizon.jpg", title: "2. Acrylic 180cm horizon" },
  { src: "images/Hottub technical sheets/3. Acrylic 180cm external.jpg", title: "3. Acrylic 180cm external" },
  { src: "images/Hottub technical sheets/4. Acrylic 200cm integrated.jpg", title: "4. Acrylic 200cm integrated" },
  { src: "images/Hottub technical sheets/5. Acrylic 200cm horizon.jpg", title: "5. Acrylic 200cm horizon" },
  { src: "images/Hottub technical sheets/6. Acrylic 200cm external.jpg", title: "6. Acrylic 200cm external" },
  { src: "images/Hottub technical sheets/7. Acrylic 180x180cm integrated.jpg", title: "7. Acrylic 180x180cm integrated" },
  { src: "images/Hottub technical sheets/8. Acrylic 180x180cm horizon.jpg", title: "8. Acrylic 180x180cm horizon" },
  { src: "images/Hottub technical sheets/9. Acrylic 180x180cm external.jpg", title: "9. Acrylic 180x180cm external" },
  { src: "images/Hottub technical sheets/10. Acrylic Ofuro integrated.jpg", title: "10. Acrylic Ofuro integrated" },
  { src: "images/Hottub technical sheets/11. Acrylic Ofuro external.jpg", title: "11. Acrylic Ofuro external" },
  { src: "images/Hottub technical sheets/12. Fiberglass 180cm integrated.jpg", title: "12. Fiberglass 180cm integrated" },
  { src: "images/Hottub technical sheets/13. Fiberglass 180cm horizon.jpg", title: "13. Fiberglass 180cm horizon" },
  { src: "images/Hottub technical sheets/14. Fiberglass 180cm external.jpg", title: "14. Fiberglass 180cm external" },
  { src: "images/Hottub technical sheets/15. Fiberglass 200cm integrated.jpg", title: "15. Fiberglass 200cm integrated" },
  { src: "images/Hottub technical sheets/16. Fiberglass 200cm horizon.jpg", title: "16. Fiberglass 200cm horizon" },
  { src: "images/Hottub technical sheets/17. Fiberglass 200cm external.jpg", title: "17. Fiberglass 200cm external" },
  { src: "images/Hottub technical sheets/18. Fiberglass Ofuro integrated.jpg", title: "18. Fiberglass Ofuro integrated" },
  { src: "images/Hottub technical sheets/19. Fiberglass Ofuro external.jpg", title: "19. Fiberglass Ofuro external" },
  { src: "images/Hottub technical sheets/20. Acrylic Jacuzzi integrated.jpg", title: "20. Acrylic Jacuzzi integrated" }
];

const config = {
  rond: {
    label: "Rond model",
    sizes: [
      { id: "200", label: "200 cm Ø", note: "4-5 personen · 1300 L" },
      { id: "220", label: "220 cm Ø", note: "6-7 personen · 1600 L" }
    ],
    woods: {
      fichte: { label: "Fichte", image: "images/hottub-fast/fichte-hout.jpg", prices: { "200": 3650, "220": 4150 } },
      thermo: { label: "Thermo", image: "images/hottub-fast/thermo-hout.jpg", prices: { "200": 3925, "220": 4405 } },
      wpcbrown: { label: "WPC Brown", image: "images/hottub-fast/wpc-brown.jpg", prices: { "200": 3925, "220": 4405 } },
      wpcblack: { label: "WPC Black", image: "images/hottub-fast/wpc-black.jpg", prices: { "200": 3925, "220": 4405 } },
      redcedar: { label: "Red Cedar", image: "images/hottub-fast/red-cedar.jpg", prices: { "200": 5200, "220": 5765 } }
    }
  },
  ovaal: {
    label: "Ovaal model",
    sizes: [
      { id: "180x120", label: "180 × 120 × 89 cm", note: "2 personen · 700 L" }
    ],
    woods: {
      fichte: { label: "Fichte", image: "images/hottub-fast/fichte-hout.jpg", prices: { "180x120": 2720 } },
      thermo: { label: "Thermo", image: "images/hottub-fast/thermo-hout.jpg", prices: { "180x120": 2825 } },
      wpcbrown: { label: "WPC Brown", image: "images/hottub-fast/wpc-brown.jpg", prices: { "180x120": 2825 } },
      wpcblack: { label: "WPC Black", image: "images/hottub-fast/wpc-black.jpg", prices: { "180x120": 2825 } },
      redcedar: { label: "Red Cedar", image: "images/hottub-fast/red-cedar.jpg", prices: { "180x120": 3770 } }
    }
  },
  vierkant: {
    label: "Vierkant model",
    sizes: [
      { id: "200x200", label: "200 × 200 × 101 cm", note: "6-8 personen · 1600 L" }
    ],
    woods: {
      fichte: { label: "Fichte", image: "images/hottub-fast/fichte-hout.jpg", prices: { "200x200": 4150 } },
      thermo: { label: "Thermo", image: "images/hottub-fast/thermo-hout.jpg", prices: { "200x200": 4405 } },
      wpcbrown: { label: "WPC Brown", image: "images/hottub-fast/wpc-brown.jpg", prices: { "200x200": 4405 } },
      wpcblack: { label: "WPC Black", image: "images/hottub-fast/wpc-black.jpg", prices: { "200x200": 4405 } },
      redcedar: { label: "Red Cedar", image: "images/hottub-fast/red-cedar.jpg", prices: { "200x200": 5975 } }
    }
  }
};

const HEATER_OPTIONS = {
  extern: [
    ["External - 20kW, 316", "images/configurator/externe-kachel.webp", 315],
    ["External - 26kW, 316", "images/configurator/externe-kachel.webp", 503],
    ["External - 30kW, 316", "images/configurator/externe-kachel.webp", 708]
  ],
  intern: [
    ["Integrated - 35kW, 316", "images/configurator/integrated-kachel.webp", 315],
    ["Verta - 35kW, 316", "images/configurator/verta-kachel.webp", 1070]
  ]
};

const MASSAGE_OPTIONS = [
  ["Geen massage", "Zonder jets", "images/configurator/geen-massage.webp", 0, "geen"],
  ["Air 12 jets", "Luchtmassage", "images/configurator/air-jets.webp", 440, "air"],
  ["Air 20 jets", "Uitgebreide luchtmassage", "images/configurator/air-jets.webp", 708, "air"],
  ["Water 8 jets", "Watermassage", "images/configurator/water-8-jets.webp", 440, "water"],
  ["Water 14 jets", "Uitgebreide watermassage", "images/hottub-fast/8massagejets.jpg", 708, "water"],
  ["Gecombineerd 8 waterjets + 4 airjets", "Combinatie van water- en luchtmassage", "images/hottub-fast/12combijets.jpg", 692, "gecombineerd"],
  ["LED water 8 jets", "Watermassage met LED-verlichting", "images/configurator/led-jets.webp", 676, "water"],
  ["LED water 14 jets", "Uitgebreide watermassage met LED-verlichting", "images/configurator/led-jets.webp", 975, "water"]
];

const STANDARD_ITEMS = [
  { label: "2 meter rookkanaal", image: "images/configurator/standaard-rookkanaal-2m.webp" },
  { label: "Trapje", image: "images/configurator/trapje.webp" },
  { label: "Mini bar", image: "images/configurator/mini-bar.webp" },
  { label: "Water uitlaat", image: "images/configurator/waterafvoer.webp" },
  { label: "Temperatuur meter" },
  { label: "Kuip isolatie" }
];

function euro(value) {
  const numericValue = Number(value);
  return "€ " + numericValue.toLocaleString("nl-BE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDateBelgium(date) {
  return new Intl.DateTimeFormat("nl-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function translatePrintWindow(win) {
  window.SunspaI18n?.translatePrintWindow(win);
}

function selectedRadio(name) {
  return document.querySelector(`input[name="${name}"]:checked`);
}

function selectedRadioValue(name) {
  const el = selectedRadio(name);
  return el ? el.value : null;
}

function selectedRadioNumber(name) {
  const value = selectedRadioValue(name);
  return value ? Number(value) : 0;
}

function selectedCheckboxes(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)];
}

function preloadConfiguratorImages() {
  const urls = new Set();

  document.querySelectorAll(".main img[src]").forEach(img => {
    img.loading = "eager";
    img.decoding = "async";
    urls.add(img.getAttribute("src"));
  });

  Object.values(config).forEach(model => {
    Object.values(model.woods).forEach(wood => {
      if (wood.image) urls.add(wood.image);
    });
  });

  urls.forEach(src => {
    if (!src) return;
    const image = new Image();
    image.decoding = "async";
    image.src = src;
  });
}

function getCurrentModelKey() {
  return selectedRadioValue("model") || "rond";
}

function getCurrentWoodKey() {
  return selectedRadioValue("wood");
}

function getCurrentSizeKey() {
  return selectedRadioValue("size");
}

function renderWoodOptions() {
  const modelKey = getCurrentModelKey();
  const woods = config[modelKey].woods;
  const container = document.getElementById("woodOptions");
  const currentWood = getCurrentWoodKey();

  container.innerHTML = "";

  Object.entries(woods).forEach(([key, wood], index) => {
    const minPrice = Math.min(...Object.values(wood.prices));
    const checked = currentWood === key;

    container.insertAdjacentHTML("beforeend", `
      <label class="choice-card">
        <input type="radio" name="wood" value="${key}" ${checked ? "checked" : ""}>
        <img src="${wood.image}" alt="${escapeHtml(wood.label)}" loading="eager" decoding="async">
        <div class="choice-content">
          <h3>${escapeHtml(wood.label)}</h3>
          <p>Afwerking / houtsoort</p>
          <p class="choice-price">Vanaf ${euro(minPrice)}</p>
        </div>
      </label>
    `);
  });

  document.querySelectorAll('input[name="wood"]').forEach(input => {
    input.addEventListener("change", () => {
      renderSizeOptions();
      updateSummary();
      goToNextStep();
    });
  });
}

function renderSizeOptions() {
  const modelKey = getCurrentModelKey();
  const woodKey = getCurrentWoodKey() || Object.keys(config[modelKey].woods)[0];
  const currentSize = getCurrentSizeKey();
  const sizeWrap = document.getElementById("sizeOptions");
  const model = config[modelKey];
  const wood = model.woods[woodKey];

  sizeWrap.innerHTML = "";

  const hasCurrentSize = model.sizes.some(size => size.id === currentSize);

  model.sizes.forEach((size, index) => {
    const checked = hasCurrentSize && currentSize === size.id;
    const price = wood.prices[size.id];

    sizeWrap.insertAdjacentHTML("beforeend", `
      <label class="simple-card">
        <input type="radio" name="size" value="${size.id}" ${checked ? "checked" : ""}>
        <span class="badge">${escapeHtml(model.label)}</span>
        <h3>${escapeHtml(size.label)}</h3>
        <div class="meta">${escapeHtml(size.note)}</div>
        <div class="price">${euro(price)}</div>
      </label>
    `);
  });

  document.querySelectorAll('input[name="size"]').forEach(input => {
    input.addEventListener("change", () => {
      updateSummary();
      goToNextStep();
    });
  });
}

function renderHeaterOptions() {
  const type = selectedRadioValue("opwarming");
  const container = document.getElementById("heaterOptions");
  const intro = document.getElementById("heaterIntro");
  if (!container) return;
  const selected = document.querySelector('input[name="kachel"]:checked')?.dataset.label;
  const heaterCard = (label, image, price = 0, note = "") => `
    <label class="choice-card">
      <input type="radio" name="kachel" value="${price}" data-label="${escapeHtml(label)}" ${selected === label ? "checked" : ""}>
      <img src="${escapeHtml(image)}" alt="${escapeHtml(label)}" loading="eager" decoding="async">
      <div class="choice-content"><h3>${escapeHtml(label)}</h3>${note ? `<p>${escapeHtml(note)}</p>` : ""}<p class="choice-price">+ ${euro(price)}</p></div>
    </label>`;

  let content = "";
  if (type === "extern" || type === "intern") {
    intro.textContent = `Kies je ${type === "extern" ? "externe" : "interne"} kachel.`;
    content = HEATER_OPTIONS[type].map(([label, image, price]) => heaterCard(label, image, price, price === 0 ? "Inbegrepen in basisprijs" : "")).join("");
  } else if (type === "elektrisch") {
    intro.textContent = "Kies je elektrische kachel en eventueel de touchscreen-upgrade.";
    content = heaterCard("Elektrische 3 kW heater met display (Gecko)", "images/hottub-fast/gecko.jpg", 990, "Elektrische opwarming") + `
      <label class="simple-card heater-upgrade-card">
        <input type="checkbox" name="heaterUpgrade" value="299" data-label="Upgrade touchscreen Gecko" ${selected ? "" : "disabled"}>
      <img src="images/configurator/touchscreen-upgrade.webp" alt="Touchscreen Gecko" loading="lazy" decoding="async"><span class="badge">Optioneel</span><h3>Upgrade touchscreen Gecko</h3><div class="meta">Beschikbaar na selectie van de heater met display</div><div class="price">+ € 299</div>
      </label>`;
  } else if (type === "hybride") {
    intro.textContent = "De elektrische 3 kW heater met display (Gecko) wordt automatisch toegevoegd voor € 990,00. Kies hieronder de houtkachel waarmee je die combineert.";
    const hybridOptions = [
      ...HEATER_OPTIONS.extern.map(([label, image, price]) => [`Extern – ${label}`, image, price]),
      ...HEATER_OPTIONS.intern.map(([label, image, price]) => [`Intern – ${label}`, image, price])
    ];
    content = hybridOptions.map(([label, image, price]) => heaterCard(label, image, price, price === 0 ? "Inbegrepen in basisprijs" : "")).join("");
  } else {
    intro.textContent = "Kies eerst een opwarming in stap 5.";
    content = '<p class="section-intro">Nog geen opwarming gekozen.</p>';
  }
  container.innerHTML = content;
  container.querySelectorAll('input[name="kachel"], input[name="heaterUpgrade"]').forEach(input => input.addEventListener("change", () => {
    const isElectric = selectedRadioValue("opwarming") === "elektrisch";
    if (input.name === "kachel") renderHeaterOptions();
    updateSummary();
    if (input.name === "kachel" && !isElectric) {
      goToNextStep();
      return;
    }
    // Bij elektrische opwarming blijft deze stap zichtbaar zodat de klant
    // de touchscreen-upgrade bewust kan kiezen of overslaan.
    renderWizard();
  }));
}

function renderMassageOptions() {
  const container = document.querySelector("#massageSection .auto-grid");
  if (!container) return;
  const selectedLabels = new Set(selectedCheckboxes("massage").map(input => input.dataset.label));
  container.innerHTML = MASSAGE_OPTIONS.map(([label, note, image, price, group]) => `
    <label class="choice-card">
      <input type="checkbox" name="massage" value="${price}" data-label="${escapeHtml(label)}" data-group="${group}" ${selectedLabels.has(label) ? "checked" : ""}>
      <img src="${escapeHtml(image)}" alt="${escapeHtml(label)}" loading="eager" decoding="async">
      <div class="choice-content"><h3>${escapeHtml(label)}</h3><p>${escapeHtml(note)}</p><p class="choice-price">+ ${euro(price)}</p></div>
    </label>`).join("");
  const inputs = [...container.querySelectorAll('input[name="massage"]')];
  inputs.forEach(input => input.addEventListener("change", () => {
    if (input.checked) {
      const group = input.dataset.group;
      inputs.forEach(other => {
        if (other === input) return;
        const otherGroup = other.dataset.group;
        const isExclusive = group === "geen" || group === "gecombineerd";
        const conflictsWithSelection = otherGroup === group || otherGroup === "geen" || otherGroup === "gecombineerd";
        if (isExclusive || conflictsWithSelection) other.checked = false;
      });
    }
    updateSummary();
  }));
}

function renderLightingOptions() {
  const container = document.getElementById("lightingOptions");
  if (!container) return;
  const mainLed = selectedRadioValue("hoofdled");
  const miniLed = selectedCheckboxes("verlichting").some(input => input.value === "305");
  const choices = [["1 hoofdled", 199], ["2 hoofdleds", 265], ["3 hoofdleds", 285]];
  container.innerHTML = choices.map(([label, price]) => `
    <label class="choice-card"><input type="radio" name="hoofdled" value="${price}" data-label="${label}" ${mainLed === String(price) ? "checked" : ""}>
      <img src="images/configurator/hoofdled.webp" alt="${label}" loading="lazy" decoding="async"><div class="choice-content"><h3>${label}</h3><p>${label} in hottub</p><p class="choice-price">+ ${euro(price)}</p></div></label>`).join("") + `
    <label class="choice-card"><input type="checkbox" name="verlichting" value="305" data-label="10 mini leds" ${miniLed ? "checked" : ""}>
      <img src="images/configurator/mini-leds.webp" alt="10 mini leds" loading="lazy" decoding="async"><div class="choice-content"><h3>10 mini leds</h3><p>Fijne sfeerverlichting</p><p class="choice-price">+ € 305</p></div></label>`;
  container.querySelectorAll('input[name="hoofdled"], input[name="verlichting"]').forEach(input => input.addEventListener("change", updateSummary));
}

function syncWifiAccessory() {
  const wifiCard = document.getElementById("wifiAccessory");
  if (!wifiCard) return;
  const isAvailable = ["elektrisch", "hybride"].includes(selectedRadioValue("opwarming"));
  const wifiInput = wifiCard.querySelector('input[name="extra"]');
  wifiCard.hidden = !isAvailable;
  if (wifiInput) {
    wifiInput.disabled = !isAvailable;
    if (!isAvailable) wifiInput.checked = false;
  }
}

function getBasePrice() {
  const modelKey = getCurrentModelKey();
  const woodKey = getCurrentWoodKey();
  const sizeKey = getCurrentSizeKey();
  const model = config[modelKey];
  if (!model) return 0;

  const wood = model.woods[woodKey] || model.woods[Object.keys(model.woods)[0]];
  const resolvedSizeKey = model.sizes.some(size => size.id === sizeKey)
    ? sizeKey
    : model.sizes[0]?.id;

  return wood?.prices?.[resolvedSizeKey] || 0;
}

function getBaseLabels() {
  const modelKey = getCurrentModelKey();
  const woodKey = getCurrentWoodKey();
  const sizeKey = getCurrentSizeKey();

  const model = config[modelKey];
  const wood = model?.woods?.[woodKey] || model?.woods?.[Object.keys(model?.woods || {})[0]];
  const size = model?.sizes?.find(s => s.id === sizeKey) || model?.sizes?.[0];

  return {
    model: model ? model.label : "-",
    wood: wood ? wood.label : "-",
    size: size ? size.label : "-"
  };
}

function getLabelFromSelected(name) {
  const input = selectedRadio(name);
  if (!input) return "-";
  const card = input.closest("label");
  const h3 = card ? card.querySelector("h3") : null;
  return h3 ? h3.textContent.trim() : "-";
}

function getCheckedLabels(name) {
  return selectedCheckboxes(name).map(input => input.dataset.label || input.value);
}

function getLabelFromCheckbox(input) {
  const card = input.closest("label");
  const h3 = card ? card.querySelector("h3") : null;
  return h3 ? h3.textContent.trim() : (input.dataset.label || input.value);
}

function getCardImage(input) {
  const card = input?.closest("label");
  const image = card ? card.querySelector("img") : null;
  return image ? { src: image.getAttribute("src"), alt: image.getAttribute("alt") || getInputLabel(input) } : null;
}

function getInputLabel(input) {
  if (!input) return "-";
  const card = input.closest("label");
  const h3 = card ? card.querySelector("h3") : null;
  return h3 ? h3.textContent.trim() : (input.dataset.label || input.value);
}

function inputPrice(input) {
  return input ? Number(input.value || 0) : 0;
}

function checkedInput(name) {
  return document.querySelector(`input[name="${name}"]:checked`);
}

function selectedSummaryItem(name, title, price = null) {
  const input = checkedInput(name);
  return {
    title,
    label: getInputLabel(input),
    price: price ?? inputPrice(input),
    image: getCardImage(input)
  };
}

function selectedCheckboxSummaryItems(name, title) {
  const items = selectedCheckboxes(name);
  if (!items.length) {
    return [{ title, label: "Geen", price: 0, image: null }];
  }

  return items.map(input => ({
    title,
    label: getInputLabel(input),
    price: inputPrice(input),
    image: getCardImage(input)
  }));
}

function getCurrentConfiguration() {
  const labels = getBaseLabels();
  const opwarming = selectedRadioValue("opwarming");
  const kachel = selectedRadioNumber("kachel");
  const hybridGecko = opwarming === "hybride" ? 990 : 0;
  const heaterUpgradeItems = selectedCheckboxes("heaterUpgrade");
  const heaterUpgrade = heaterUpgradeItems.reduce((sum, item) => sum + Number(item.value), 0);
  const massageItems = selectedCheckboxes("massage");
  const massage = massageItems.reduce((sum, item) => sum + Number(item.value), 0);
  const verlichtingItems = selectedCheckboxes("verlichting");
  const hoofdled = selectedRadioNumber("hoofdled");
  const verlichting = hoofdled + verlichtingItems.reduce((sum, item) => sum + Number(item.value), 0);
  const filter = selectedRadioNumber("filter");
  const cover = selectedRadioNumber("cover");
  const extraItems = selectedCheckboxes("extra");

  const extraTotal = extraItems.reduce((sum, item) => sum + Number(item.value), 0);

  const basePrice = getBasePrice();
  const installation = HOTTUB_INSTALLATION_PRICE;
  const total = basePrice + installation + kachel + hybridGecko + heaterUpgrade + massage + verlichting + filter + cover + extraTotal;

  return {
    model: labels.model,
    wood: labels.wood,
    size: labels.size,
    kleur: selectedRadioValue("kleur") || "-",
    opwarmingLabel: opwarming ? getLabelFromSelected("opwarming") : "-",
    kachelLabel: getLabelFromSelected("kachel"),
    heaterUpgradeLabel: heaterUpgradeItems.length ? heaterUpgradeItems.map(getLabelFromCheckbox).join(", ") : "Geen",
    massageLabel: massageItems.length ? massageItems.map(getLabelFromCheckbox).join(", ") : "Geen",
    verlichtingLabel: [getLabelFromSelected("hoofdled"), ...verlichtingItems.map(getLabelFromCheckbox)].filter(label => label && label !== "-").join(", ") || "Geen",
    filterLabel: getLabelFromSelected("filter"),
    coverLabel: getLabelFromSelected("cover"),
    extraLabels: getCheckedLabels("extra"),
    basePrice,
    installation,
    kachel,
    hybridGecko,
    heaterUpgrade,
    massage,
    verlichting,
    filter,
    cover,
    extraTotal,
    total
  };
}

function updateSummary() {
  const current = getCurrentConfiguration();
  document.getElementById("totalPrice").textContent = euro(current.total);
  renderFinalSummaryCards(current);

  const extraText = current.extraLabels.length ? current.extraLabels.join(", ") : "Geen";

  const rows = [
    ["Model", current.model],
    ["Houtsoort", current.wood],
    ["Formaat", current.size],
    ["Kuipkleur", current.kleur],
    ["Opwarming", current.opwarmingLabel],
    ["Kachel", current.kachelLabel],
    ...(current.hybridGecko ? [["Elektrische 3 kW heater met display (Gecko)", euro(current.hybridGecko)]] : []),
    ...(current.heaterUpgrade ? [["Touchscreen-upgrade", current.heaterUpgradeLabel]] : []),
    ["Massage", current.massageLabel],
    ["Verlichting", current.verlichtingLabel],
    ["Filter", current.filterLabel],
    ["Cover", current.coverLabel],
    ["Extra's", extraText]
  ];

  const summaryList = document.getElementById("summaryList");
  summaryList.innerHTML = rows.map(([left, right]) => `
    <div class="summary-row">
      <div class="left">${escapeHtml(left)}</div>
      <div class="right">${escapeHtml(right)}</div>
    </div>
  `).join("");
}

function getFinalSummaryItems(current) {
  const baseInput = checkedInput("model");
  const woodInput = checkedInput("wood");
  const sizeInput = checkedInput("size");
  const colorInput = checkedInput("kleur");

  return [
    ...STANDARD_ITEMS.map(item => ({
      title: "Standaard in je hottub",
      label: item.label,
      price: 0,
      image: item.image ? { src: item.image, alt: item.label } : null
    })),
    {
      title: "Model",
      label: current.model,
      price: current.basePrice,
      image: getCardImage(baseInput)
    },
    {
      title: "Houtsoort",
      label: current.wood,
      price: 0,
      image: getCardImage(woodInput)
    },
    {
      title: "Formaat",
      label: current.size,
      price: 0,
      image: getCardImage(sizeInput)
    },
    {
      title: "Kuipkleur",
      label: current.kleur,
      price: 0,
      image: getCardImage(colorInput)
    },
    selectedSummaryItem("opwarming", "Opwarming", 0),
    selectedSummaryItem("kachel", "Kachel", current.kachel),
    ...(current.hybridGecko ? [{
      title: "Elektrische opwarming",
      label: "Elektrische 3 kW heater met display (Gecko)",
      price: current.hybridGecko,
      image: { src: "images/hottub-fast/gecko.jpg", alt: "Elektrische Gecko" }
    }] : []),
    ...(selectedCheckboxes("heaterUpgrade").length ? selectedCheckboxSummaryItems("heaterUpgrade", "Kachelupgrade") : []),
    selectedSummaryItem("hoofdled", "Verlichting", selectedRadioNumber("hoofdled")),
    ...selectedCheckboxSummaryItems("massage", "Massage"),
    ...selectedCheckboxSummaryItems("verlichting", "Verlichting"),
    selectedSummaryItem("filter", "Filter", current.filter),
    selectedSummaryItem("cover", "Cover", current.cover),
    ...selectedCheckboxSummaryItems("extra", "Extra's")
  ];
}

function renderFinalSummaryCards(current) {
  const container = document.getElementById("finalSummaryCards");
  if (!container) return;

  const items = getFinalSummaryItems(current).filter(item => item.label && item.label !== "-");
  container.innerHTML = items.map(item => {
    const media = item.image
      ? `<img src="${escapeHtml(item.image.src)}" alt="${escapeHtml(item.image.alt)}">`
      : `<div class="final-summary-thumb-fallback">${escapeHtml(item.title)}</div>`;
    const price = item.price ? euro(item.price) : "+ € 0";

    return `
      <article class="final-summary-card">
        ${media}
        <div>
          <small>${escapeHtml(item.title)}</small>
          <strong>${escapeHtml(item.label)}</strong>
        </div>
        <div class="summary-card-price">${escapeHtml(price)}</div>
      </article>
    `;
  }).join("");
}

function bindStaticInputs() {
  const names = ["kleur", "opwarming", "filter", "cover", "extra"];
  names.forEach(name => {
    document.querySelectorAll(`input[name="${name}"]`).forEach(input => {
      input.addEventListener("change", () => {
        if (name === "opwarming") {
          document.querySelectorAll('input[name="kachel"], input[name="heaterUpgrade"]').forEach(option => {
            option.checked = false;
          });
          renderHeaterOptions();
          syncWifiAccessory();
        }
        updateSummary();
        if (!multiSelectStepNames.has(name)) {
          goToNextStep();
        }
      });
    });
  });
}

function rebuildDynamicSections() {
  renderWoodOptions();
  renderSizeOptions();
  renderHeaterOptions();
  renderMassageOptions();
  renderLightingOptions();
  syncWifiAccessory();
  updateSummary();
}

function getSections() {
  return [...document.querySelectorAll(".main > .section")];
}

function getCurrentStepName() {
  return wizardStepNames[currentWizardStep];
}

function getCurrentStepInputType() {
  const stepName = getCurrentStepName();
  return multiSelectStepNames.has(stepName) ? "checkbox" : "radio";
}

function getProgressLabel() {
  return `Stap ${currentWizardStep + 1} van ${wizardStepNames.length}`;
}

function stepHasSelection(stepName) {
  if (stepName === "massage") return true;
  if (multiSelectStepNames.has(stepName)) return true;
  return Boolean(document.querySelector(`input[name="${stepName}"]:checked`));
}

function goToStep(index) {
  const sections = getSections();
  currentWizardStep = Math.max(0, Math.min(index, sections.length - 1));
  wizardCompleted = false;
  renderWizard();
}

function goToNextStep() {
  if (currentWizardStep >= wizardStepNames.length - 1) {
    showFinalSummary();
    return;
  }

  goToStep(currentWizardStep + 1);
}

function goToPreviousStep() {
  if (wizardCompleted) {
    wizardCompleted = false;
    currentWizardStep = wizardStepNames.length - 1;
    renderWizard();
    return;
  }

  goToStep(currentWizardStep - 1);
}

function showFinalSummary() {
  wizardCompleted = true;
  updateSummary();
  renderWizard();
}

function renderWizard() {
  const sections = getSections();
  const summary = document.getElementById("finalSummary");
  const main = document.querySelector(".main");
  const progressPercent = ((currentWizardStep + 1) / wizardStepNames.length) * 100;

  sections.forEach((section, index) => {
    section.classList.toggle("is-active", !wizardCompleted && index === currentWizardStep);

    const existingProgress = section.querySelector(".wizard-progress");
    if (existingProgress) existingProgress.remove();

    const existingActions = section.querySelector(".wizard-actions");
    if (existingActions) existingActions.remove();

    if (!wizardCompleted && index === currentWizardStep) {
      section.insertAdjacentHTML("afterbegin", `
        <div class="wizard-progress" aria-label="${escapeHtml(getProgressLabel())}">
          <span>${escapeHtml(getProgressLabel())}</span>
          <div class="wizard-progress-bar"><span class="wizard-progress-fill" style="width:${progressPercent}%"></span></div>
        </div>
      `);

      const stepName = getCurrentStepName();
      const nextLabel = index === wizardStepNames.length - 1 ? "Samenvatting bekijken" : "Verder";
      const nextDisabled = !stepHasSelection(stepName);

      section.insertAdjacentHTML("beforeend", `
        <div class="wizard-actions">
          <button class="btn btn-secondary wizard-prev" type="button" ${index === 0 ? "disabled" : ""}>Vorige</button>
          <button class="btn btn-primary wizard-next" type="button" ${nextDisabled ? "disabled" : ""}>${nextLabel}</button>
        </div>
      `);
    }
  });

  if (main) main.classList.toggle("hidden", wizardCompleted);
  if (summary) summary.classList.toggle("is-active", wizardCompleted);

  document.querySelectorAll(".wizard-prev").forEach(button => {
    button.addEventListener("click", goToPreviousStep);
  });

  document.querySelectorAll(".wizard-next").forEach(button => {
    button.addEventListener("click", goToNextStep);
  });

  const activeSection = !wizardCompleted ? sections[currentWizardStep] : summary;
  activeSection?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function getOfferRowsHtml() {
  const current = getCurrentConfiguration();
  const lines = [
    { label: `${current.model} / ${current.wood} / ${current.size}`, price: current.basePrice },
    { label: "Levering & installatie", price: current.installation },
    { label: `Kuipkleur: ${current.kleur}`, price: 0 },
    { label: `Opwarming: ${current.opwarmingLabel}`, price: 0 },
    { label: `Kachel: ${current.kachelLabel}`, price: current.kachel },
    ...(current.hybridGecko ? [{ label: "Elektrische 3 kW heater met display (Gecko)", price: current.hybridGecko }] : []),
    ...(current.heaterUpgrade ? [{ label: `Kachelupgrade: ${current.heaterUpgradeLabel}`, price: current.heaterUpgrade }] : []),
    { label: `Massage: ${current.massageLabel}`, price: current.massage },
    { label: `Verlichting: ${current.verlichtingLabel}`, price: current.verlichting },
    { label: `Filter: ${current.filterLabel}`, price: current.filter },
    { label: `Cover: ${current.coverLabel}`, price: current.cover }
  ];

  const extraItems = selectedCheckboxes("extra");
  if (extraItems.length) {
    const extraLabels = extraItems.map(input => input.dataset.label || getLabelFromCheckbox(input)).join(", ");
    const extraPrice = extraItems.reduce((sum, input) => sum + Number(input.value), 0);
    lines.push({ label: `Extra's: ${extraLabels}`, price: extraPrice });
  }

  return lines.map((item, index) => `
    <tr>
      <td class="col-num">${index + 1}</td>
      <td class="col-desc">${escapeHtml(item.label)}</td>
      <td class="col-price">${euro(item.price)}</td>
    </tr>
  `).join("");
}

function getTermsHtml() {
  return `
    <li>Prijzen zijn exclusief kraankosten tenzij anders vermeld.<br>
    Levering & plaatsing volgens afgesproken voorwaarden (voldoende doorgang, geen obstakels & hulp)<br>
    Betalingsvoorwaarden: 10% voorschot bij bestelling, restbedrag uiterlijk één week vóor levering.</li>
    <li>Sunspa Benelux verleent een garantie van 2 jaar op de technische en elektronische onderdelen vanaf de datum van levering.</li>
  `;
}

function printOffer() {
  const current = getCurrentConfiguration();
  const subtotal = current.total / 1.21;
  const btw = current.total - subtotal;
  const today = new Date();
  const productTitleHtml = escapeHtml(`${current.model} - ${current.wood} - ${current.size}`);
  const rows = getOfferRowsHtml();
  const logoHtml = COMPANY_LOGO ? `<img class="offer-logo" src="${encodeURI(COMPANY_LOGO)}" alt="${escapeHtml(COMPANY_NAME)}">` : "";
  const termsHtml = getTermsHtml();

  const win = window.open("", "_blank", "width=1100,height=900");
  if (!win) {
    alert("Pop-up geblokkeerd. Sta pop-ups toe om de offerte te printen.");
    return;
  }

  win.document.open();
  win.document.write(`
    <!doctype html>
    <html lang="nl">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Offerte ${productTitleHtml}</title>
        <style>
          @page { size: A4 portrait; margin: 8mm; }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          html, body { margin: 0; padding: 0; background: #f2f4f7; color: #1f2937; font-family: "Segoe UI", Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.4; }
          body { padding: 14px; }
          .sheet { width: 100%; max-width: 920px; margin: 0 auto; background: #ffffff; border: 1px solid #d9e1ea; border-radius: 18px; overflow: hidden; box-shadow: 0 12px 34px rgba(15, 23, 42, 0.08); }
          .header { background: linear-gradient(135deg, #5f7fa4 0%, #7fa3ca 100%); color: #ffffff; padding: 28px 32px 26px; }
          .header-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; }
          .brand { display: flex; align-items: flex-start; gap: 18px; min-width: 0; }
          .offer-logo { width: 170px; max-width: 170px; height: auto; display: block; background: #ffffff; border-radius: 14px; padding: 8px 10px; }
          .offer-meta { min-width: 280px; padding: 18px 22px; border-radius: 18px; background: rgba(255, 255, 255, 0.14); border: 1px solid rgba(255, 255, 255, 0.18); backdrop-filter: blur(3px); }
          .offer-meta-row { display: flex; justify-content: space-between; align-items: center; gap: 24px; padding: 4px 0; }
          .offer-meta-label { font-size: 15px; font-weight: 700; color: #ffffff; }
          .offer-meta-value { font-size: 15px; font-weight: 800; color: #ffffff; text-align: right; white-space: nowrap; }
          .offer-meta-line { width: 26mm; height: 10px; border-bottom: 1px solid rgba(255,255,255,0.95); }
          .content { padding: 28px 32px 28px; }
          .intro { margin-bottom: 22px; }
          .intro h2 { margin: 0 0 10px 0; font-size: 32px; line-height: 1.1; font-weight: 800; color: #0f172a; }
          .intro p { margin: 0; font-size: 15px; color: #475569; }
          .info-grid-single { display: grid; grid-template-columns: 1fr; width: 100%; margin-bottom: 18px; }
          .card { background: #f8fafc; border: 1px solid #d7e0e9; border-radius: 18px; padding: 18px 20px; }
          .card-title { margin: 0 0 14px 0; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #4f6f96; }
          .customer-card { width: 100%; max-width: none; display: block; }
          .customer-inline-grid { display: grid; gap: 10px 24px; width: 100%; grid-template-columns: 1fr 1fr; }
          .field-inline { display: flex; align-items: center; gap: 10px; min-width: 0; }
          .label-inline { min-width: 70px; font-weight: 700; font-size: 14px; color: #0f172a; white-space: nowrap; }
          .line-inline { flex: 1; min-width: 0; border-bottom: 1.5px solid #64748b; height: 16px; }
          .product-highlight { display: flex; justify-content: space-between; align-items: center; gap: 18px; background: #ffffff; border: 1px solid #d7e0e9; border-radius: 18px; padding: 18px 22px; margin-bottom: 18px; }
          .product-highlight-label { margin: 0 0 8px 0; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; }
          .product-highlight-title { margin: 0; font-size: 28px; line-height: 1.1; font-weight: 800; color: #0f172a; }
          .product-highlight-price { text-align: right; white-space: nowrap; }
          .product-highlight-price small { display: block; margin-bottom: 6px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; }
          .product-highlight-price strong { display: block; font-size: 30px; line-height: 1.05; font-weight: 800; color: #4f6f96; }
          .table-wrap { border: 1px solid #d7e0e9; border-radius: 18px; overflow: hidden; background: #ffffff; }
          table { width: 100%; border-collapse: collapse; }
          thead th { background: #eef3f8; color: #314f72; padding: 16px 18px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; text-align: left; border-bottom: 1px solid #d7e0e9; }
          tbody td { padding: 15px 18px; font-size: 14px; color: #0f172a; border-bottom: 1px solid #e9eef4; vertical-align: top; }
          tbody tr:last-child td { border-bottom: none; }
          .col-num { width: 70px; font-weight: 800; color: #475569; }
          .col-desc { font-weight: 600; }
          .col-price { width: 190px; text-align: right; white-space: nowrap; font-weight: 800; }
          .summary { margin-top: 18px; display: flex; justify-content: space-between; align-items: flex-start; gap: 40px; }
          .summary-left { flex: 1; display: flex; flex-direction: column; gap: 16px; padding-top: 6px; }
          .summary-line { display: flex; align-items: center; gap: 12px; font-size: 14px; color: #0f172a; }
          .summary-line span:first-child { min-width: 140px; font-weight: 600; }
          .line-fill { flex: 1; border-bottom: 1.5px solid #64748b; height: 14px; }
          .summary-box { width: 320px; border: 1px solid #d7e0e9; border-radius: 18px; overflow: hidden; background: #ffffff; }
          .summary-row { display: flex; justify-content: space-between; gap: 18px; padding: 14px 18px; border-bottom: 1px solid #e9eef4; font-size: 14px; color: #0f172a; }
          .summary-row:last-child { border-bottom: none; }
          .summary-row strong { font-weight: 800; }
          .summary-row.total { background: #f3f7fb; color: #314f72; font-size: 17px; font-weight: 800; }
          .bottom-fixed { margin-top: auto; }
          .signature-section { margin-top: 26px; padding-top: 18px; border-top: 1px solid #d7e0e9; }
          .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px 28px; }
          .signature-box { min-width: 0; }
          .signature-label { font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 30px; }
          .signature-line { border-bottom: 1.5px solid #64748b; height: 18px; }
          .terms { margin-top: 22px; padding-top: 18px; border-top: 1px solid #d7e0e9; }
          .terms-title { margin: 0 0 10px 0; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #314f72; }
          .terms ul { margin: 0; padding-left: 18px; color: #475569; }
          .terms li { margin: 8px 0; font-size: 13px; line-height: 1.35; }
          .footer { margin-top: 18px; padding-top: 16px; border-top: 1px solid #d7e0e9; display: flex; justify-content: space-between; gap: 20px; font-size: 12px; color: #64748b; }
          .footer strong { color: #0f172a; }
          @media screen and (max-width: 820px) {
            .header-top, .product-highlight, .footer { display: block; }
            .offer-meta { margin-top: 18px; min-width: 0; }
            .product-highlight-price { margin-top: 14px; text-align: left; }
            .summary { justify-content: stretch; }
            .summary-box { width: 100%; }
            .customer-inline-grid { grid-template-columns: 1fr; }
          }
          @media print {
            html, body { width: 210mm; height: 297mm; margin: 0 !important; padding: 0 !important; background: #ffffff !important; color: #1f2937 !important; }
            body { font-size: 11px !important; line-height: 1.28 !important; }
            .sheet { width: 194mm !important; max-width: 194mm !important; min-height: 281mm !important; margin: 0 auto !important; border: none !important; border-radius: 0 !important; box-shadow: none !important; overflow: hidden !important; page-break-inside: avoid !important; display: flex !important; flex-direction: column !important; }
            .header { background: #ffffff !important; color: #274863 !important; border: 1px solid #cfd8e3 !important; border-radius: 7px !important; padding: 4mm 6mm !important; }
            .header-top { display: flex !important; justify-content: space-between !important; align-items: flex-start !important; gap: 6mm !important; }
            .brand { display: flex !important; gap: 8px !important; align-items: flex-start !important; }
            .offer-logo { max-width: 32mm !important; width: 32mm !important; max-height: 14mm !important; background: #ffffff !important; border-radius: 6px !important; padding: 1.5mm !important; }
            .offer-meta { min-width: 48mm !important; background: #f6f9fc !important; border: 1px solid #dbe3ec !important; border-radius: 7px !important; padding: 2.5mm 4mm !important; color: #274863 !important; backdrop-filter: none !important; }
            .offer-meta-row { gap: 5mm !important; padding: 0.8mm 0 !important; }
            .offer-meta-label, .offer-meta-value { color: #274863 !important; font-size: 9.5px !important; }
            .offer-meta-line { width: 22mm !important; height: 7px !important; border-bottom: 1px solid #64748b !important; }
            .content { padding: 4mm 6mm 4mm 6mm !important; flex: 1 1 auto !important; display: flex !important; flex-direction: column !important; }
            .intro { margin-bottom: 3mm !important; }
            .intro h2 { font-size: 16px !important; margin: 0 0 1mm 0 !important; color: #0f172a !important; }
            .intro p { margin: 0 !important; font-size: 10px !important; color: #475569 !important; }
            .info-grid-single { grid-template-columns: 1fr !important; width: 100% !important; margin-bottom: 3mm !important; }
            .card { border: 1px solid #dbe3ec !important; border-radius: 7px !important; padding: 3mm 4mm !important; background: #ffffff !important; page-break-inside: avoid !important; }
            .card-title { margin: 0 0 2mm 0 !important; font-size: 9px !important; letter-spacing: 0.05em !important; color: #407298 !important; }
            .customer-card { width: 100% !important; max-width: none !important; display: block !important; }
            .customer-inline-grid { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 10px 14px !important; width: 100% !important; }
            .field-inline { display: flex !important; align-items: center !important; gap: 6px !important; min-width: 0 !important; }
            .label-inline { min-width: 54px !important; font-weight: 700 !important; font-size: 10px !important; color: #0f172a !important; white-space: nowrap !important; }
            .line-inline { flex: 1 !important; min-width: 0 !important; border-bottom: 1px solid #64748b !important; height: 9px !important; }
            .product-highlight { display: flex !important; justify-content: space-between !important; align-items: center !important; gap: 4mm !important; border: 1px solid #dbe3ec !important; border-radius: 7px !important; padding: 3mm 4mm !important; background: #ffffff !important; margin-bottom: 3mm !important; page-break-inside: avoid !important; }
            .product-highlight-label { font-size: 9px !important; letter-spacing: 0.05em !important; margin-bottom: 0.5mm !important; color: #64748b !important; }
            .product-highlight-title { font-size: 15px !important; margin: 0 !important; line-height: 1.08 !important; }
            .product-highlight-price small { font-size: 8px !important; margin-bottom: 0.5mm !important; color: #64748b !important; }
            .product-highlight-price strong { font-size: 16px !important; color: #407298 !important; }
            .table-wrap { border: 1px solid #dbe3ec !important; border-radius: 7px !important; overflow: hidden !important; background: #ffffff !important; page-break-inside: avoid !important; }
            table { width: 100% !important; border-collapse: collapse !important; }
            thead th { background: #f4f7fa !important; color: #274863 !important; font-size: 9px !important; padding: 2mm 2.5mm !important; border-bottom: 1px solid #dbe3ec !important; }
            tbody td { padding: 1.8mm 2.5mm !important; border-bottom: 1px solid #edf2f7 !important; font-size: 10px !important; line-height: 1.15 !important; }
            .col-num { width: 7mm !important; }
            .col-price { width: 27mm !important; text-align: right !important; white-space: nowrap !important; }
            .summary { margin-top: 3mm !important; display: flex !important; justify-content: space-between !important; align-items: flex-start !important; gap: 5mm !important; }
            .summary-left { flex: 1 !important; display: flex !important; flex-direction: column !important; gap: 2.5mm !important; padding-top: 0.5mm !important; }
            .summary-line { display: flex !important; align-items: center !important; gap: 2mm !important; font-size: 10px !important; color: #0f172a !important; }
            .summary-line span:first-child { min-width: 29mm !important; font-weight: 600 !important; }
            .line-fill { flex: 1 !important; border-bottom: 1px solid #64748b !important; height: 9px !important; }
            .summary-box { width: 45mm !important; border: 1px solid #dbe3ec !important; border-radius: 7px !important; overflow: hidden !important; background: #ffffff !important; page-break-inside: avoid !important; }
            .summary-row { gap: 2.5mm !important; padding: 2mm 2.5mm !important; border-bottom: 1px solid #edf2f7 !important; font-size: 10px !important; }
            .summary-row.total { background: #f4f7fa !important; color: #274863 !important; font-size: 11px !important; font-weight: 800 !important; }
            .bottom-fixed { margin-top: auto !important; }
            .signature-section { margin-top: 4mm !important; padding-top: 3mm !important; border-top: 1px solid #dbe3ec !important; page-break-inside: avoid !important; }
            .signature-grid { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 5mm !important; }
            .signature-box { min-width: 0 !important; }
            .signature-label { font-size: 10px !important; font-weight: 700 !important; color: #0f172a !important; margin-bottom: 7mm !important; }
            .signature-line { border-bottom: 1px solid #64748b !important; height: 8px !important; }
            .terms { margin-top: 3mm !important; padding-top: 3mm !important; border-top: 1px solid #dbe3ec !important; page-break-inside: avoid !important; }
            .terms-title { margin: 0 0 1.5mm 0 !important; font-size: 9px !important; color: #274863 !important; }
            .terms ul { margin: 0 !important; padding-left: 4mm !important; }
            .terms li { margin: 0.8mm 0 !important; font-size: 8.8px !important; line-height: 1.15 !important; color: #475569 !important; }
            .footer { margin-top: 3mm !important; padding-top: 2mm !important; border-top: 1px solid #dbe3ec !important; color: #64748b !important; font-size: 8.5px !important; display: flex !important; justify-content: space-between !important; gap: 4mm !important; page-break-inside: avoid !important; }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="header">
            <div class="header-top">
              <div class="brand">
                ${logoHtml}
              </div>
              <div class="offer-meta">
                <div class="offer-meta-row">
                  <div class="offer-meta-label">Datum</div>
                  <div class="offer-meta-value">${formatDateBelgium(today)}</div>
                </div>
                <div class="offer-meta-row">
                  <div class="offer-meta-label">Geldig tot</div>
                  <div class="offer-meta-value offer-meta-line"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="content">
            <div class="intro">
              <h2>Offerte</h2>
              <p>Bedankt voor uw interesse. Hieronder vindt u een overzicht van de geselecteerde configuratie en bijhorende opties.</p>
            </div>

            <div class="info-grid-single">
              <div class="card customer-card">
                <div class="card-title">Klantgegevens</div>
                <div class="customer-inline-grid">
                  <div class="field-inline">
                    <span class="label-inline">Naam</span>
                    <span class="line-inline"></span>
                  </div>
                  <div class="field-inline">
                    <span class="label-inline">Telefoon</span>
                    <span class="line-inline"></span>
                  </div>
                  <div class="field-inline">
                    <span class="label-inline">Adres</span>
                    <span class="line-inline"></span>
                  </div>
                  <div class="field-inline">
                    <span class="label-inline">Telefoon 2</span>
                    <span class="line-inline"></span>
                  </div>
                  <div class="field-inline">
                    <span class="label-inline">Plaats</span>
                    <span class="line-inline"></span>
                  </div>
                  <div class="field-inline">
                    <span class="label-inline">Email</span>
                    <span class="line-inline"></span>
                  </div>
                </div>
              </div>
            </div>

            <div class="product-highlight">
              <div>
                <div class="product-highlight-label">Geselecteerd product</div>
                <h3 class="product-highlight-title">${productTitleHtml}</h3>
              </div>
              <div class="product-highlight-price">
                <small>Totaal offertebedrag</small>
                <strong>${euro(current.total)}</strong>
              </div>
            </div>

            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Omschrijving</th>
                    <th style="text-align:right">Prijs</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                </tbody>
              </table>
            </div>

            <div class="summary">
              <div class="summary-left">
                <div class="summary-line">
                  <span>Voorschot</span>
                  <span class="line-fill"></span>
                </div>

                <div class="summary-line">
                  <span>Leveringstermijn</span>
                  <span class="line-fill"></span>
                </div>
              </div>

              <div class="summary-box">
                <div class="summary-row">
                  <span>Subtotaal excl. btw</span>
                  <strong>${euro(subtotal)}</strong>
                </div>
                <div class="summary-row">
                  <span>21% btw</span>
                  <strong>${euro(btw)}</strong>
                </div>
                <div class="summary-row total">
                  <span>Totaal</span>
                  <strong>${euro(current.total)}</strong>
                </div>
              </div>
            </div>

            <div class="bottom-fixed">
              <div class="signature-section">
                <div class="signature-grid">
                  <div class="signature-box">
                    <div class="signature-label">Naam koper</div>
                    <div class="signature-line"></div>
                  </div>

                  <div class="signature-box">
                    <div class="signature-label">Handtekening koper</div>
                    <div class="signature-line"></div>
                  </div>

                  <div class="signature-box">
                    <div class="signature-label">Naam verkoper</div>
                    <div class="signature-line"></div>
                  </div>

                  <div class="signature-box">
                    <div class="signature-label">Handtekening verkoper</div>
                    <div class="signature-line"></div>
                  </div>
                </div>
              </div>

              <div class="terms">
                <h4 class="terms-title">Opmerkingen</h4>
                <ul>
                  ${termsHtml}
                </ul>
              </div>

              <div class="footer">
                <div>Met vriendelijke groeten,<br><strong>Team Sunspa Brugge/Lievegem</strong></div>
                <div>Wellnessmarkt BV | BE 0843 104 796 | BE75 3800 1777 8151<br>
                Sunspa Benelux | 0483 39 99 67 | sunspabrugge@gmail.com/gentsunspa@gmail.com</div>
              </div>
            </div>
          </div>
        </div>

        <script>
          window.onload = function () {
            setTimeout(function () {
              window.print();
            }, 250);
          };
        <\/script>
      </body>
    </html>
  `);
  win.document.close();
  translatePrintWindow(win);
}

function printTechnicalData() {
  const technicalImages = TECHNICAL_IMAGES.map(image => ({
    ...image,
    src: new URL(image.src, window.location.href).href
  }));
  const imageCards = technicalImages.map((image, index) => `
    <article class="technical-card">
      <h2>${escapeHtml(image.title)}</h2>
      <img src="${image.src}" alt="${escapeHtml(image.title)}">
      <div class="technical-card-actions">
        <button class="technical-print-button" type="button" data-index="${index}">Print dit schema</button>
      </div>
    </article>
  `).join("");

  const win = window.open("", "_blank", "width=1100,height=900");
  if (!win) {
    alert("Pop-up geblokkeerd. Sta pop-ups toe om de technische gegevens te printen.");
    return;
  }

  win.document.open();
  win.document.write(`
    <!doctype html>
    <html lang="nl">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Technische gegevens hottubs</title>
        <style>
          @page { size: A4 portrait; margin: 8mm; }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body {
            margin: 0;
            padding: 22px;
            background: #f5f7fa;
            color: #1d2b36;
            font-family: Arial, Helvetica, sans-serif;
          }
          .technical-header {
            max-width: 1040px;
            margin: 0 auto 20px;
            padding: 22px 24px;
            background: #ffffff;
            border: 1px solid #dde5ec;
            border-radius: 18px;
          }
          .technical-header h1 {
            margin: 0 0 6px;
            color: #163c5d;
            font-size: 28px;
          }
          .technical-header p {
            margin: 0;
            color: #6a7885;
            font-size: 14px;
          }
          .technical-grid {
            max-width: 1040px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
          }
          .technical-card {
            break-inside: avoid;
            page-break-inside: avoid;
            background: #ffffff;
            border: 1px solid #dde5ec;
            border-radius: 16px;
            overflow: hidden;
          }
          .technical-card h2 {
            margin: 0;
            padding: 12px 14px;
            color: #163c5d;
            font-size: 16px;
          }
          .technical-card img {
            display: block;
            width: 100%;
            height: auto;
          }
          .technical-card-actions {
            padding: 12px 14px 14px;
          }
          .technical-print-button {
            appearance: none;
            border: none;
            border-radius: 999px;
            background: #1f5f93;
            color: #ffffff;
            cursor: pointer;
            font-size: 14px;
            font-weight: 700;
            padding: 11px 16px;
          }
          @media print {
            body {
              padding: 0;
              background: #ffffff;
            }
            .technical-header {
              max-width: none;
              margin: 0 0 6mm;
              padding: 0 0 4mm;
              border: none;
              border-bottom: 1px solid #cfd8e3;
              border-radius: 0;
            }
            .technical-header h1 {
              font-size: 18px;
            }
            .technical-header p {
              font-size: 10px;
            }
            .technical-grid {
              max-width: none;
              grid-template-columns: 1fr;
              gap: 6mm;
            }
            .technical-card {
              border: none;
              border-radius: 0;
            }
            .technical-card h2 {
              padding: 0 0 2mm;
              font-size: 12px;
            }
            .technical-card img {
              max-height: 246mm;
              object-fit: contain;
            }
            .technical-card-actions {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <header class="technical-header">
          <h1>Technische gegevens hottubs</h1>
          <p>${TECHNICAL_IMAGES.length} technische afbeeldingen voor hottubmodellen.</p>
        </header>
        <main class="technical-grid">
          ${imageCards}
        </main>
        <script>
          var technicalImages = ${JSON.stringify(technicalImages)};

          function getTechnicalImageUrl(image) {
            return image.src;
          }

          function printSingleTechnicalImage(image) {
            var imageUrl = getTechnicalImageUrl(image);
            var printWindow = window.open("", "_blank", "width=900,height=900");
            if (!printWindow) {
              alert("Pop-up geblokkeerd. Sta pop-ups toe om dit schema te printen.");
              return;
            }

            printWindow.document.open();
            printWindow.document.write(
              '<!doctype html>' +
              '<html lang="nl">' +
              '<head>' +
              '<meta charset="utf-8">' +
              '<meta name="viewport" content="width=device-width, initial-scale=1">' +
              '<title>' + image.title + '</title>' +
              '<style>' +
              '@page { size: A4 portrait; margin: 8mm; }' +
              '* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }' +
              'body { margin: 0; padding: 0; color: #1d2b36; font-family: Arial, Helvetica, sans-serif; }' +
              'h1 { margin: 0 0 4mm; color: #163c5d; font-size: 16px; }' +
              'img { display: block; width: 100%; max-height: 266mm; object-fit: contain; }' +
              '</style>' +
              '</head>' +
              '<body>' +
              '<h1>' + image.title + '</h1>' +
              '<img src="' + imageUrl + '" alt="' + image.title + '">' +
              '<script>' +
              'window.onload=function(){var img=document.images[0];var done=function(){setTimeout(function(){window.print();},250);};if(img.complete){done();}else{img.onload=done;img.onerror=done;}};' +
              '<\\/script>' +
              '</body>' +
              '</html>'
            );
            printWindow.document.close();
          }

          document.querySelectorAll(".technical-print-button").forEach(function (button) {
            button.addEventListener("click", function () {
              var image = technicalImages[Number(button.dataset.index)];
              if (image) printSingleTechnicalImage(image);
            });
          });
        <\/script>
      </body>
    </html>
  `);
  win.document.close();
  translatePrintWindow(win);
}

document.querySelectorAll('input[name="model"]').forEach(input => {
  input.addEventListener("change", () => {
    rebuildDynamicSections();
    goToNextStep();
  });
});

document.getElementById("resetBtn").addEventListener("click", () => {
  window.location.reload();
});

document.getElementById("offerPrint").addEventListener("click", printOffer);
document.getElementById("technicalPrint").addEventListener("click", printTechnicalData);

bindStaticInputs();
rebuildDynamicSections();
preloadConfiguratorImages();
renderWizard();
