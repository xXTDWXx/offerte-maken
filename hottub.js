const COMPANY_NAME = "Sunspa Brugge/Lievegem";
const COMPANY_LOGO = "logo.svg";
const HOTTUB_INSTALLATION_PRICE = 695;
const TECHNICAL_IMAGES = [
  { id: "1-YJ0b84SKIHbmNiWyyL1fp8LWnMHTJNu", title: "1. Acrylic 180cm integrated" },
  { id: "1-en6Znvnxu52Zekqg7xMv_PAx0EE7xJU", title: "2. Acrylic 180cm horizon" },
  { id: "1-pJJh1smgtv5u39oc6_yCzQsuIi84nW2", title: "3. Acrylic 180cm external" },
  { id: "1-NOA4bKPdcTTCLts9vBJg75D2xdIQZUB", title: "4. Acrylic 200cm integrated" },
  { id: "1-LhpyGi3vfMXEXxPOpU_etJD4zr0EytP", title: "5. Acrylic 200cm horizon" },
  { id: "10CsxqSuv2SGabDpqjYGRxSigg5DfceCW", title: "6. Acrylic 200cm external" },
  { id: "1-X_vABqnIlutXNEoKencNeUHTS67VH-7", title: "7. Acrylic 180x180cm integrated" },
  { id: "1-mRTCZYjtoNvy6eahCifw6MNT0cXCCKC", title: "8. Acrylic 180x180cm horizon" },
  { id: "10CaN9XPuaDxS7ayI9ahbqmWQdEFDWo8F", title: "9. Acrylic 180x180cm external" },
  { id: "1-gdjTWe_Pvv6FKjdlrL7X8QSNYtKJqdf", title: "10. Acrylic Ofuro integrated" },
  { id: "1-LO77As7nAFcBLchX7RsqPyoHzSKB8kn", title: "11. Acrylic Ofuro external" },
  { id: "1-r7ucm0azFumTrFHrbKlO-IxNVKsk1Hr", title: "12. Fiberglass 180cm integrated" },
  { id: "1-t07Wo7uxZNd73okEUuWMUHtZlJPFU2E", title: "13. Fiberglass 180cm horizon" },
  { id: "1095Z0EDO17uiTsQvRZDv_GfKSAhtYKBW", title: "14. Fiberglass 180cm external" },
  { id: "1029uS5fkXqezb9fNXJES4SJ4Udh5H1oI", title: "15. Fiberglass 200cm integrated" },
  { id: "100MlxNyBWlID58R2EbKhPHgLCsngZ2_X", title: "16. Fiberglass 200cm horizon" },
  { id: "1-kPKXpz_y3nj0seODqjshUzarenFKHyL", title: "17. Fiberglass 200cm external" },
  { id: "1-uUmRexYEXnxnTQUM51AQb1kN_RPyNsV", title: "18. Fiberglass Ofuro integrated" },
  { id: "1-rcXyMuqpdnbO_-T3gPJDoWsfbjnCBjn", title: "19. Fiberglass Ofuro external" },
  { id: "1-t540cNzIBLL13jP2ScidnaxkvRwvMMy", title: "20. Acrylic Jacuzzi integrated" }
];

const config = {
  rond: {
    label: "Rond model",
    sizes: [
      { id: "200", label: "200 cm Ø", note: "4-5 personen · 1300 L" },
      { id: "220", label: "220 cm Ø", note: "6-7 personen · 1600 L" }
    ],
    woods: {
      fichte: { label: "Fichte", image: "images/Fichte hout.jpg", prices: { "200": 3490, "220": 3950 } },
      thermo: { label: "Thermo", image: "images/Thermo hout.jpg", prices: { "200": 3750, "220": 4190 } },
      wpcbrown: { label: "WPC Brown", image: "images/WPC BROWN.jpg", prices: { "200": 3750, "220": 4190 } },
      wpcblack: { label: "WPC Black", image: "images/WPC BLACK.png", prices: { "200": 3750, "220": 4190 } },
      redcedar: { label: "Red Cedar", image: "images/RED CEDAR.jpg", prices: { "200": 4950, "220": 5490 } }
    }
  },
  ovaal: {
    label: "Ovaal model",
    sizes: [
      { id: "180x120", label: "180 × 120 × 89 cm", note: "2 personen · 700 L" }
    ],
    woods: {
      fichte: { label: "Fichte", image: "images/Fichte hout.jpg", prices: { "180x120": 2590 } },
      thermo: { label: "Thermo", image: "images/Thermo hout.jpg", prices: { "180x120": 2690 } },
      wpcbrown: { label: "WPC Brown", image: "images/WPC BROWN.jpg", prices: { "180x120": 2690 } },
      wpcblack: { label: "WPC Black", image: "images/WPC BLACK.png", prices: { "180x120": 2690 } },
      redcedar: { label: "Red Cedar", image: "images/RED CEDAR.jpg", prices: { "180x120": 3590 } }
    }
  },
  vierkant: {
    label: "Vierkant model",
    sizes: [
      { id: "200x200", label: "200 × 200 × 101 cm", note: "6-8 personen · 1600 L" }
    ],
    woods: {
      fichte: { label: "Fichte", image: "images/Fichte hout.jpg", prices: { "200x200": 3950 } },
      thermo: { label: "Thermo", image: "images/Thermo hout.jpg", prices: { "200x200": 4200 } },
      wpcbrown: { label: "WPC Brown", image: "images/WPC BROWN.jpg", prices: { "200x200": 4190 } },
      wpcblack: { label: "WPC Black", image: "images/WPC BLACK.png", prices: { "200x200": 4190 } },
      redcedar: { label: "Red Cedar", image: "images/RED CEDAR.jpg", prices: { "200x200": 5690 } }
    }
  }
};

function euro(value) {
  return "€ " + Number(value).toLocaleString("nl-BE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
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
    const checked = currentWood ? currentWood === key : index === 0;

    container.insertAdjacentHTML("beforeend", `
      <label class="choice-card">
        <input type="radio" name="wood" value="${key}" ${checked ? "checked" : ""}>
        <img src="${wood.image}" alt="${escapeHtml(wood.label)}">
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

  model.sizes.forEach((size, index) => {
    const checked = currentSize ? currentSize === size.id : index === 0;
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
    input.addEventListener("change", updateSummary);
  });
}

function getBasePrice() {
  const modelKey = getCurrentModelKey();
  const woodKey = getCurrentWoodKey();
  const sizeKey = getCurrentSizeKey();
  if (!modelKey || !woodKey || !sizeKey) return 0;
  return config[modelKey].woods[woodKey].prices[sizeKey] || 0;
}

function getBaseLabels() {
  const modelKey = getCurrentModelKey();
  const woodKey = getCurrentWoodKey();
  const sizeKey = getCurrentSizeKey();

  const model = config[modelKey];
  const wood = model?.woods?.[woodKey];
  const size = model?.sizes?.find(s => s.id === sizeKey);

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

function getCurrentConfiguration() {
  const labels = getBaseLabels();
  const kachel = selectedRadioNumber("kachel");
  const systeem = selectedRadioNumber("systeem");
  const massage = selectedRadioNumber("massage");
  const verlichting = selectedRadioNumber("verlichting");

  const filterItems = selectedCheckboxes("filter");
  const filter = filterItems.reduce((sum, item) => sum + Number(item.value), 0);

  const isolatieItems = selectedCheckboxes("isolatie");
  const extraItems = selectedCheckboxes("extra");

  const isolatieTotal = isolatieItems.reduce((sum, item) => sum + Number(item.value), 0);
  const extraTotal = extraItems.reduce((sum, item) => sum + Number(item.value), 0);

  const basePrice = getBasePrice();
  const installation = HOTTUB_INSTALLATION_PRICE;
  const total = basePrice + installation + kachel + systeem + massage + verlichting + filter + isolatieTotal + extraTotal;

  return {
    model: labels.model,
    wood: labels.wood,
    size: labels.size,
    kleur: selectedRadioValue("kleur") || "-",
    kachelLabel: getLabelFromSelected("kachel"),
    systeemLabel: getLabelFromSelected("systeem"),
    massageLabel: getLabelFromSelected("massage"),
    verlichtingLabel: getLabelFromSelected("verlichting"),
    filterLabel: filterItems.length ? filterItems.map(input => input.dataset.label || getLabelFromCheckbox(input)).join(", ") : "Geen",
    isolatieLabels: getCheckedLabels("isolatie"),
    extraLabels: getCheckedLabels("extra"),
    basePrice,
    installation,
    kachel,
    systeem,
    massage,
    verlichting,
    filter,
    isolatieTotal,
    extraTotal,
    total
  };
}

function updateSummary() {
  const current = getCurrentConfiguration();
  document.getElementById("totalPrice").textContent = euro(current.total);

  const isolatieText = current.isolatieLabels.length ? current.isolatieLabels.join(", ") : "Geen";
  const extraText = current.extraLabels.length ? current.extraLabels.join(", ") : "Geen";

  const rows = [
    ["Model", current.model],
    ["Houtsoort", current.wood],
    ["Formaat", current.size],
    ["Kuipkleur", current.kleur],
    ["Kachel", current.kachelLabel],
    ["Systeem", current.systeemLabel],
    ["Massage", current.massageLabel],
    ["Verlichting", current.verlichtingLabel],
    ["Filter", current.filterLabel],
    ["Isolatie", isolatieText],
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

function bindStaticInputs() {
  const names = ["kleur", "kachel", "systeem", "massage", "verlichting", "filter", "isolatie", "extra"];
  names.forEach(name => {
    document.querySelectorAll(`input[name="${name}"]`).forEach(input => {
      input.addEventListener("change", updateSummary);
    });
  });
}

function rebuildDynamicSections() {
  renderWoodOptions();
  renderSizeOptions();
  updateSummary();
}

function getOfferRowsHtml() {
  const current = getCurrentConfiguration();
  const lines = [
    { label: `${current.model} / ${current.wood} / ${current.size}`, price: current.basePrice },
    { label: "Levering & installatie", price: current.installation },
    { label: `Kuipkleur: ${current.kleur}`, price: 0 },
    { label: `Kachel: ${current.kachelLabel}`, price: current.kachel },
    { label: `Systeem: ${current.systeemLabel}`, price: current.systeem },
    { label: `Massage: ${current.massageLabel}`, price: current.massage },
    { label: `Verlichting: ${current.verlichtingLabel}`, price: current.verlichting },
    { label: `Filter: ${current.filterLabel}`, price: current.filter }
  ];

  const isolatieItems = selectedCheckboxes("isolatie");
  if (isolatieItems.length) {
    const isolatieLabels = isolatieItems.map(input => input.dataset.label || getLabelFromCheckbox(input)).join(", ");
    const isolatiePrice = isolatieItems.reduce((sum, input) => sum + Number(input.value), 0);
    lines.push({ label: `Isolatie: ${isolatieLabels}`, price: isolatiePrice });
  }

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
          .summary { margin-top: 18px; display: flex; justify-content: flex-end; }
          .summary-box { width: 320px; border: 1px solid #d7e0e9; border-radius: 18px; overflow: hidden; background: #ffffff; }
          .summary-row { display: flex; justify-content: space-between; gap: 18px; padding: 14px 18px; border-bottom: 1px solid #e9eef4; font-size: 14px; color: #0f172a; }
          .summary-row:last-child { border-bottom: none; }
          .summary-row strong { font-weight: 800; }
          .summary-row.total { background: #f3f7fb; color: #314f72; font-size: 17px; font-weight: 800; }
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
            .sheet { width: 194mm !important; max-width: 194mm !important; min-height: 281mm !important; margin: 0 auto !important; border: none !important; border-radius: 0 !important; box-shadow: none !important; overflow: hidden !important; page-break-inside: avoid !important; }
            .header { background: #ffffff !important; color: #274863 !important; border: 1px solid #cfd8e3 !important; border-radius: 10px !important; padding: 10mm 10mm 7mm 10mm !important; }
            .header-top { display: flex !important; justify-content: space-between !important; align-items: flex-start !important; gap: 10mm !important; }
            .brand { display: flex !important; gap: 10px !important; align-items: flex-start !important; }
            .offer-logo { max-width: 42mm !important; width: 42mm !important; max-height: 20mm !important; background: #ffffff !important; border-radius: 8px !important; padding: 3mm !important; }
            .offer-meta { min-width: 58mm !important; background: #f6f9fc !important; border: 1px solid #dbe3ec !important; border-radius: 10px !important; padding: 5mm 6mm !important; color: #274863 !important; backdrop-filter: none !important; }
            .offer-meta-row { gap: 8mm !important; padding: 1.5mm 0 !important; }
            .offer-meta-label, .offer-meta-value { color: #274863 !important; font-size: 10.5px !important; }
            .offer-meta-line { width: 26mm !important; height: 10px !important; border-bottom: 1px solid #64748b !important; }
            .content { padding: 7mm 8mm 6mm 8mm !important; }
            .intro { margin-bottom: 5mm !important; }
            .intro h2 { font-size: 18px !important; margin: 0 0 2mm 0 !important; color: #0f172a !important; }
            .intro p { margin: 0 !important; font-size: 11px !important; color: #475569 !important; }
            .info-grid-single { grid-template-columns: 1fr !important; width: 100% !important; margin-bottom: 5mm !important; }
            .card { border: 1px solid #dbe3ec !important; border-radius: 10px !important; padding: 5mm !important; background: #ffffff !important; page-break-inside: avoid !important; }
            .card-title { margin: 0 0 3mm 0 !important; font-size: 10px !important; letter-spacing: 0.06em !important; color: #407298 !important; }
            .customer-card { width: 100% !important; max-width: none !important; display: block !important; }
            .customer-inline-grid { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 16px 18px !important; width: 100% !important; }
            .field-inline { display: flex !important; align-items: center !important; gap: 8px !important; min-width: 0 !important; }
            .label-inline { min-width: 62px !important; font-weight: 700 !important; font-size: 11px !important; color: #0f172a !important; white-space: nowrap !important; }
            .line-inline { flex: 1 !important; min-width: 0 !important; border-bottom: 1px solid #64748b !important; height: 12px !important; }
            .product-highlight { display: flex !important; justify-content: space-between !important; align-items: center !important; gap: 4mm !important; border: 1px solid #dbe3ec !important; border-radius: 10px !important; padding: 5mm 6mm !important; background: #ffffff !important; margin-bottom: 5mm !important; page-break-inside: avoid !important; }
            .product-highlight-label { font-size: 10px !important; letter-spacing: 0.06em !important; margin-bottom: 1mm !important; color: #64748b !important; }
            .product-highlight-title { font-size: 18px !important; margin: 0 !important; line-height: 1.1 !important; }
            .product-highlight-price small { font-size: 9px !important; margin-bottom: 1mm !important; color: #64748b !important; }
            .product-highlight-price strong { font-size: 18px !important; color: #407298 !important; }
            .table-wrap { border: 1px solid #dbe3ec !important; border-radius: 10px !important; overflow: hidden !important; background: #ffffff !important; page-break-inside: avoid !important; }
            table { width: 100% !important; border-collapse: collapse !important; }
            thead th { background: #f4f7fa !important; color: #274863 !important; font-size: 10px !important; padding: 3.2mm 4mm !important; border-bottom: 1px solid #dbe3ec !important; }
            tbody td { padding: 3mm 4mm !important; border-bottom: 1px solid #edf2f7 !important; font-size: 11px !important; line-height: 1.25 !important; }
            .col-num { width: 10mm !important; }
            .col-price { width: 34mm !important; text-align: right !important; white-space: nowrap !important; }
            .summary { margin-top: 4mm !important; display: flex !important; justify-content: flex-end !important; }
            .summary-box { width: 52mm !important; border: 1px solid #dbe3ec !important; border-radius: 10px !important; overflow: hidden !important; background: #ffffff !important; page-break-inside: avoid !important; }
            .summary-row { gap: 4mm !important; padding: 3mm 4mm !important; border-bottom: 1px solid #edf2f7 !important; font-size: 11px !important; }
            .summary-row.total { background: #f4f7fa !important; color: #274863 !important; font-size: 13px !important; font-weight: 800 !important; }
            .terms { margin-top: 5mm !important; padding-top: 4mm !important; border-top: 1px solid #dbe3ec !important; page-break-inside: avoid !important; }
            .terms-title { margin: 0 0 2mm 0 !important; font-size: 10px !important; color: #274863 !important; }
            .terms ul { margin: 0 !important; padding-left: 5mm !important; }
            .terms li { margin: 1.2mm 0 !important; font-size: 10px !important; line-height: 1.25 !important; color: #475569 !important; }
            .footer { margin-top: 4mm !important; padding-top: 3mm !important; border-top: 1px solid #dbe3ec !important; color: #64748b !important; font-size: 9.5px !important; display: flex !important; justify-content: space-between !important; gap: 6mm !important; page-break-inside: avoid !important; }
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
              <div class="summary-box">
                <div class="summary-row">
                  <span>Subtotaal</span>
                  <strong>${euro(current.total)}</strong>
                </div>
                <div class="summary-row">
                  <span>21% BTW</span>
                  <strong>Incl.</strong>
                </div>
                <div class="summary-row total">
                  <span>Totaal</span>
                  <strong>${euro(current.total)}</strong>
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
              <div>Dit document werd automatisch opgesteld op ${formatDateBelgium(today)}.</div>
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
}

function printTechnicalData() {
  const imageCards = TECHNICAL_IMAGES.map((image, index) => `
    <article class="technical-card">
      <h2>${escapeHtml(image.title)}</h2>
      <img src="https://drive.google.com/thumbnail?id=${encodeURIComponent(image.id)}&sz=w2400" alt="${escapeHtml(image.title)}">
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
          var technicalImages = ${JSON.stringify(TECHNICAL_IMAGES)};

          function getTechnicalImageUrl(image) {
            return "https://drive.google.com/thumbnail?id=" + encodeURIComponent(image.id) + "&sz=w2400";
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
}

document.querySelectorAll('input[name="model"]').forEach(input => {
  input.addEventListener("change", () => {
    rebuildDynamicSections();
  });
});

document.getElementById("resetBtn").addEventListener("click", () => {
  window.location.reload();
});

document.getElementById("offerPrint").addEventListener("click", printOffer);
document.getElementById("technicalPrint").addEventListener("click", printTechnicalData);

bindStaticInputs();
rebuildDynamicSections();
