const COMPANY_NAME = "Sunspa Brugge/Lievegem";
  const COMPANY_INFO_LINES = [
    "Sunspa Brugge/Lievegem",
    "Tel: 0483 39 99 67",
    "E-mail: sunspabrugge@gmail.com",
    "E-mail: gentsunspa@gmail.com",
    "Website: www.sunspabenelux.be"
  ];
  const COMPANY_LOGO = "logo.svg"; // pas aan naar jouw echte logo-bestand
  const HOTTUB_INSTALLATION_PRICE = 695;

  const config = {
    rond: {
      label: "Rond model",
      sizes: [
        { id: "200", label: "200 cm Ø", note: "4-5 personen · 1300 L" },
        { id: "220", label: "6-7 personen · 1600 L" }
      ],
      woods: {
        fichte: {
          label: "Fichte",
          image: "images/Fichte hout.jpg",
          prices: { "200": 3490, "220": 3950 }
        },
        thermo: {
          label: "Thermo",
          image: "images/Thermo hout.jpg",
          prices: { "200": 3750, "220": 4190 }
        },
        wpcbrown: {
          label: "WPC Brown",
          image: "images/WPC BROWN.jpg",
          prices: { "200": 3750, "220": 4190 }
        },
        wpcblack: {
          label: "WPC Black",
          image: "images/WPC BLACK.png",
          prices: { "200": 3750, "220": 4190 }
        },
        redcedar: {
          label: "Red Cedar",
          image: "images/RED CEDAR.jpg",
          prices: { "200": 4950, "220": 5490 }
        }
      }
    },

    ovaal: {
      label: "Ovaal model",
      sizes: [
        { id: "180x120", label: "180 × 120 × 89 cm", note: "2 personen · 700 L" }
      ],
      woods: {
        fichte: {
          label: "Fichte",
          image: "images/Fichte hout.jpg",
          prices: { "180x120": 2590 }
        },
        thermo: {
          label: "Thermo",
          image: "images/Thermo hout.jpg",
          prices: { "180x120": 2690 }
        },
        wpcbrown: {
          label: "WPC Brown",
          image: "images/WPC BROWN.jpg",
          prices: { "180x120": 2690 }
        },
        wpcblack: {
          label: "WPC Black",
          image: "images/WPC BLACK.png",
          prices: { "180x120": 2690 }
        },
        redcedar: {
          label: "Red Cedar",
          image: "images/RED CEDAR.jpg",
          prices: { "180x120": 3590 }
        }
      }
    },

    vierkant: {
      label: "Vierkant model",
      sizes: [
        { id: "200x200", label: "200 × 200 × 101 cm", note: "6-8 personen · 1600 L" }
      ],
      woods: {
        fichte: {
          label: "Fichte",
          image: "images/Fichte hout.jpg",
          prices: { "200x200": 3950 }
        },
        thermo: {
          label: "Thermo",
          image: "images/Thermo hout.jpg",
          prices: { "200x200": 4200 }
        },
        wpcbrown: {
          label: "WPC Brown",
          image: "images/WPC BROWN.jpg",
          prices: { "200x200": 4190 }
        },
        wpcblack: {
          label: "WPC Black",
          image: "images/WPC BLACK.png",
          prices: { "200x200": 4190 }
        },
        redcedar: {
          label: "Red Cedar",
          image: "images/RED CEDAR.jpg",
          prices: { "200x200": 5690 }
        }
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
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatDateBelgium(date) {
    return new Intl.DateTimeFormat("nl-BE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(date);
  }

  function addDays(date, days) {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
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
      filterLabel: filterItems.length
        ? filterItems.map(input => input.dataset.label || getLabelFromCheckbox(input)).join(", ")
        : "Geen",
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
      { label: 'Levering & installatie', price: current.installation },
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

      lines.push({
        label: `Isolatie: ${isolatieLabels}`,
        price: isolatiePrice
      });
    }

    const extraItems = selectedCheckboxes("extra");
    if (extraItems.length) {
      const extraLabels = extraItems.map(input => input.dataset.label || getLabelFromCheckbox(input)).join(", ");
      const extraPrice = extraItems.reduce((sum, input) => sum + Number(input.value), 0);

      lines.push({
        label: `Extra's: ${extraLabels}`,
        price: extraPrice
      });
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
    const totalIncl = current.total;
    const subtotal = totalIncl / 1.21;
    const btw = totalIncl - subtotal;

    const today = new Date();
    const productTitleHtml = escapeHtml(`${current.model} - ${current.wood} - ${current.size}`);
    const rows = getOfferRowsHtml();

    const logoHtml = COMPANY_LOGO
      ? `<img src="${escapeHtml(COMPANY_LOGO)}" alt="${escapeHtml(COMPANY_NAME)}" class="offer-logo">`
      : "";

    const termsHtml = getTermsHtml();

    const win = window.open("", "_blank");
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
            @page {
              size: A4 portrait;
              margin: 8mm;
            }

            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              background: #f2f4f7;
              color: #1f2937;
              font-family: "Segoe UI", Arial, Helvetica, sans-serif;
              font-size: 14px;
              line-height: 1.4;
            }

            body {
              padding: 14px;
            }

            .sheet {
              width: 100%;
              max-width: 920px;
              margin: 0 auto;
              background: #ffffff;
              border: 1px solid #d9e1ea;
              border-radius: 18px;
              overflow: hidden;
              box-shadow: 0 12px 34px rgba(15, 23, 42, 0.08);
            }

            .header {
              background: linear-gradient(135deg, #5f7fa4 0%, #7fa3ca 100%);
              color: #ffffff;
              padding: 20px 30px 10px;
            }

            .header-top {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 24px;
            }

            .brand {
              display: flex;
              align-items: flex-start;
              gap: 18px;
              min-width: 0;
            }

            .offer-logo {
              width: 280px;
              height: auto;
              display: block;
              background: #ffffff;
              border-radius: 14px;
              padding: 8px 10px;
            }

            .offer-meta {
              min-width: 280px;
              padding: 18px 22px;
              border-radius: 18px;
              background: rgba(255, 255, 255, 0.14);
              border: 1px solid rgba(255, 255, 255, 0.18);
            }

            .offer-meta-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 24px;
              padding: 4px 0;
            }

            .offer-meta-label,
            .offer-meta-value {
              font-size: 15px;
              font-weight: 700;
              color: #ffffff;
            }

            .content {
              padding: 28px 32px 28px;
            }

            .table-wrap {
              border: 1px solid #d7e0e9;
              border-radius: 18px;
              overflow: hidden;
              background: #ffffff;
            }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            thead th {
              background: #eef3f8;
              color: #314f72;
              padding: 8px 18px;
              font-size: 12px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              text-align: left;
              border-bottom: 1px solid #d7e0e9;
            }

            tbody td {
              padding: 8px 18px;
              font-size: 14px;
              color: #0f172a;
              border-bottom: 1px solid #e9eef4;
              vertical-align: top;
            }

            .col-num {
              width: 70px;
              font-weight: 800;
              color: #475569;
            }

            .col-desc {
              font-weight: 600;
            }

            .col-price {
              width: 190px;
              text-align: right;
              white-space: nowrap;
              font-weight: 800;
            }

            .summary {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 40px;
            }

            .summary-left {
              flex: 1;
              display: flex;
              flex-direction: column;
              gap: 16px;
              padding-top: 6px;
            }

            .summary-line {
              display: flex;
              align-items: center;
              gap: 12px;
              font-size: 14px;
              color: #0f172a;
            }

            .summary-line span:first-child {
              min-width: 140px;
              font-weight: 600;
            }

            .line-fill {
              flex: 1;
              border-bottom: 1.5px solid #64748b;
              height: 14px;
            }

            .summary-box {
              width: 320px;
              overflow: hidden;
              background: #ffffff;
            }

            .summary-row {
              display: flex;
              justify-content: space-between;
              gap: 18px;
              padding: 5px 18px;
              border-bottom: 1px solid #e9eef4;
              font-size: 14px;
              color: #0f172a;
            }

            .summary-row.total {
              background: #f3f7fb;
              color: #314f72;
              font-size: 17px;
              font-weight: 800;
            }

            .signature-section {
              margin-top: 26px;
              padding-top: 18px;
              border-top: 1px solid #d7e0e9;
            }

            .signature-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px 28px;
            }

            .signature-label {
              font-size: 13px;
              font-weight: 700;
              color: #0f172a;
              margin-bottom: 30px;
            }

            .signature-line {
              border-bottom: 1.5px solid #64748b;
              height: 18px;
            }

            .terms {
              margin-top: 22px;
              padding-top: 18px;
              border-top: 1px solid #d7e0e9;
            }

            .terms-title {
              margin: 0 0 10px 0;
              font-size: 12px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: #314f72;
            }

            .terms ul {
              margin: 0;
              padding-left: 18px;
              color: #475569;
            }

            .terms li {
              margin: 8px 0;
              font-size: 13px;
              line-height: 1.35;
            }

            .footer {
              margin-top: 18px;
              padding-top: 16px;
              border-top: 1px solid #d7e0e9;
              display: flex;
              justify-content: space-between;
              gap: 20px;
              font-size: 12px;
              color: #64748b;
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
                </div>
              </div>
            </div>

            <div class="content">
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
                    <strong>${euro(totalIncl)}</strong>
                  </div>
                </div>
              </div>

              <div class="signature-section">
                <div class="signature-grid">
                  <div>
                    <div class="signature-label">Naam koper</div>
                    <div class="signature-line"></div>
                  </div>
                  <div>
                    <div class="signature-label">Handtekening koper</div>
                    <div class="signature-line"></div>
                  </div>
                  <div>
                    <div class="signature-label">Naam verkoper</div>
                    <div class="signature-line"></div>
                  </div>
                  <div>
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
                <div>Wellnessmarkt BV | BE 0843 104 796 | BE75 3800 1777 8151<br>Sunspa Benelux | 0483 39 99 67 | sunspabrugge@gmail.com/gentsunspa@gmail.com</div>
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

  document.querySelectorAll('input[name="model"]').forEach(input => {
    input.addEventListener("change", () => {
      rebuildDynamicSections();
    });
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    window.location.reload();
  });

  document.getElementById("offerPrint").addEventListener("click", printOffer);

  bindStaticInputs();
  rebuildDynamicSections();
