const PRODUCTS_URL = new URL('products.json', document.baseURI).toString();

const state = {
  products: [],
  filtered: [],
  currentScreen: 'type',
  selections: {
    type: '',
    size: '',
    extra: ''
  }
};

const TYPE_OPTIONS = [
  {
    value: 'spa',
    label: 'Een jacuzzi',
    description: 'Massage, wellness en comfort voor thuis.',
    image: 'images/Spa.jpg'
  },
  {
    value: 'barrelsauna',
    label: 'Barrel sauna',
    description: 'Compacte buitensauna met warme natuurlijke uitstraling.',
    image: 'images/Barrel.jpg'
  },
  {
    value: 'Infrarood',
    label: 'Infrarood sauna',
    description: 'Snelle opwarming en ontspanning binnenshuis.',
    image: 'images/Infrarood.jpg'
  },
  {
    value: 'zwemspa',
    label: 'Zwemspa',
    description: 'Zwemmen, trainen en ontspannen in één product.',
    image: 'images/Zwemspa.jpg'
  }
];

const SIZE_OPTIONS = {
  spa: [
    { value: 'spa-205', label: 'Tot en met 205 cm', description: 'Compacte jacuzzi’s tot 205 cm.' },
    { value: 'spa-205-220', label: '205 tot 220 cm', description: 'Middelgrote jacuzzi’s van 205 tot 220 cm.' },
    { value: 'spa-220-240', label: '220 tot 240 cm', description: 'Ruimere jacuzzi’s van 220 tot 240 cm.' },
    { value: 'spa-240+', label: '240 cm of groter', description: 'XL jacuzzi’s vanaf 240 cm.' }
  ],
  barrelsauna: [
    { value: 'barrel-200', label: 'Tot en met 200 cm', description: 'Compacte barrel sauna’s.' },
    { value: 'barrel-200-240', label: '200 tot 240 cm', description: 'Middelgrote barrel sauna’s.' },
    { value: 'barrel-240-300', label: '240 tot 300 cm', description: 'Ruime barrel sauna’s.' },
    { value: 'barrel-300+', label: '300 cm of groter', description: 'XL barrel sauna’s.' }
  ],
  Infrarood: [
    { value: 'ir-120', label: 'Tot en met 120 cm', description: 'Compacte infrarood sauna’s.' },
    { value: 'ir-120-160', label: '120 tot 160 cm', description: 'Middelgrote infrarood sauna’s.' },
    { value: 'ir-160-200', label: '160 tot 200 cm', description: 'Grotere infrarood sauna’s.' },
    { value: 'ir-200+', label: '200 cm of groter', description: 'Zeer ruime infrarood sauna’s.' }
  ],
  zwemspa: [
    { value: 'swim-400', label: 'Tot en met 400 cm', description: 'Compacte zwemspa’s.' },
    { value: 'swim-400-500', label: '400 tot 500 cm', description: 'Middelgrote zwemspa’s.' },
    { value: 'swim-500-650', label: '500 tot 650 cm', description: 'Ruime zwemspa’s.' },
    { value: 'swim-650+', label: '650 cm of groter', description: 'XL zwemspa’s.' }
  ]
};

const EXTRA_OPTIONS = {
  spa: [
    { value: 'any', label: 'Geen voorkeur', description: 'Toon alle passende jacuzzi’s.' },
    { value: '1', label: '1 ligplaats', description: 'Met één ligplaats.' },
    { value: '2', label: '2 ligplaatsen', description: 'Met twee ligplaatsen.' }
  ],
  barrelsauna: [
    { value: 'any', label: 'Geen voorkeur', description: 'Toon alle passende barrel sauna’s.' },
    { value: 'closed', label: 'Dichte achterzijde', description: 'Volledig gesloten achterzijde.' },
    { value: 'halfglass', label: 'Halfglas achterzijde', description: 'Model met halfglas achteraan.' }
  ],
  Infrarood: [
    { value: 'ontspanning', label: 'Enkel ontspanning', description: 'Voor rust, warmte en algemeen welzijn.' },
    { value: 'spiertherapie', label: 'Spiertherapie', description: 'Gericht op herstel en verlichting van spierklachten.' }
  ],
  zwemspa: [
    { value: 'any', label: 'Geen extra voorkeur', description: 'Toon alle passende zwemspa’s.' }
  ]
};

const SCREEN_ORDER = ['type', 'size', 'extra', 'results'];

const elements = {
  typeOptions: document.getElementById('typeOptions'),
  sizeOptions: document.getElementById('sizeOptions'),
  extraOptions: document.getElementById('extraOptions'),
  step4Description: document.getElementById('step4Description'),
  resultMeta: document.getElementById('resultMeta'),
  resultGrid: document.getElementById('resultGrid'),
  emptyState: document.getElementById('emptyState'),
  errorBox: document.getElementById('errorBox'),
  errorText: document.getElementById('errorText'),
  resultCardTemplate: document.getElementById('resultCardTemplate'),
  backButtons: [...document.querySelectorAll('[data-back]')],
  nextButtons: [...document.querySelectorAll('.next-btn')]
};

function normalize(value) {
  return String(value || '').toLowerCase().trim();
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function euro(value) {
  return new Intl.NumberFormat('nl-BE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function getSpecValue(product, label) {
  const specs = Array.isArray(product?.specs) ? product.specs : [];
  const match = specs.find(spec => normalize(spec?.label) === normalize(label));
  return match?.value || '';
}

function parseNumbers(text) {
  return [...String(text || '').matchAll(/\d+(?:[.,]\d+)?/g)]
    .map(match => Number(match[0].replace(',', '.')))
    .filter(Number.isFinite);
}

function getDimensions(product) {
  const raw = getSpecValue(product, 'Afmeting');
  const normalized = normalize(raw).replace('ø', ' x ').replaceAll('×', ' x ');
  const nums = parseNumbers(normalized);
  if (nums.length < 2) return null;
  return {
    longest: Math.max(nums[0], nums[1]),
    shortest: Math.min(nums[0], nums[1]),
    raw
  };
}

function getLigplaatsen(product) {
  const value = getSpecValue(product, 'Ligplaatsen');
  const nums = parseNumbers(value);
  return nums.length ? nums[0] : 0;
}

function optionCard(option, selectedValue, onClick, variant = 'default') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `choice-card ${variant === 'type' ? 'choice-card-type' : ''}`;
  if (selectedValue === option.value) button.classList.add('is-selected');

  button.innerHTML = `
    ${option.image ? `<div class="choice-image-wrap"><img src="${option.image}" alt="${escapeHtml(option.label)}" class="choice-image"></div>` : ''}
    <div class="choice-content-wrap">
      <div class="choice-title">${escapeHtml(option.label)}</div>
      ${option.description ? `<div class="choice-description">${escapeHtml(option.description)}</div>` : ''}
    </div>
  `;

  button.addEventListener('click', onClick);
  return button;
}

function showScreen(screenName) {
  state.currentScreen = screenName;
  document.querySelectorAll('.wizard-screen').forEach(screen => {
    screen.classList.toggle('is-active', screen.id === `screen-${screenName}`);
  });
}

function nextScreen() {
  const index = SCREEN_ORDER.indexOf(state.currentScreen);
  if (index < SCREEN_ORDER.length - 1) {
    showScreen(SCREEN_ORDER[index + 1]);
  }
}

function canProceed(step) {
  if (step === 'type') return !!state.selections.type;
  if (step === 'size') return !!state.selections.size;
  if (step === 'extra') return !!state.selections.extra;
  return true;
}

function updateNextButtons() {
  elements.nextButtons.forEach(btn => {
    btn.disabled = !canProceed(btn.dataset.step);
  });
}

function renderTypeOptions() {
  elements.typeOptions.innerHTML = '';
  TYPE_OPTIONS.forEach(option => {
    elements.typeOptions.appendChild(optionCard(option, state.selections.type, () => {
      state.selections.type = option.value;
      state.selections.size = '';
      state.selections.extra = '';
      renderTypeOptions();
      renderCurrentStep();
      updateNextButtons();
    }, 'type'));
  });
}

function renderSimpleOptions(target, options, selectedValue, key) {
  target.innerHTML = '';
  options.forEach(option => {
    target.appendChild(optionCard(option, selectedValue, () => {
      state.selections[key] = option.value;
      if (key === 'size') {
        state.selections.extra = '';
        renderCurrentStep();
        updateNextButtons();
        return;
      }

      if (key === 'extra') {
        renderCurrentStep();
        updateNextButtons();
        renderResults();
        showScreen('results');
        return;
      }

      renderCurrentStep();
      updateNextButtons();
    }));
  });
}

function renderCurrentStep() {
  const type = state.selections.type;

  if (!type) {
    elements.sizeOptions.innerHTML = '';
    elements.extraOptions.innerHTML = '';
    return;
  }

  renderSimpleOptions(elements.sizeOptions, SIZE_OPTIONS[type] || [], state.selections.size, 'size');
  renderSimpleOptions(elements.extraOptions, EXTRA_OPTIONS[type] || [], state.selections.extra, 'extra');

  if (type === 'spa') {
    elements.step4Description.textContent = 'Kies of u één of twee ligplaatsen wenst.';
  } else if (type === 'barrelsauna') {
    elements.step4Description.textContent = 'Kies of u een dichte achterzijde of halfglas achteraan wenst.';
  } else if (type === 'Infrarood') {
    elements.step4Description.textContent = 'Wat is voor u het belangrijkste gebruik?';
  } else {
    elements.step4Description.textContent = 'Geen extra voorkeur nodig. Laat dit op geen voorkeur staan of kies verder.';
  }
}

function fitsSize(product, type, sizeKey) {
  const dims = getDimensions(product);
  if (!dims || !sizeKey) return true;
  const value = dims.longest;

  if (type === 'spa') {
    if (sizeKey === 'spa-205') return value <= 205;
    if (sizeKey === 'spa-205-220') return value > 205 && value <= 220;
    if (sizeKey === 'spa-220-240') return value > 220 && value <= 240;
    if (sizeKey === 'spa-240+') return value > 240;
  }

  if (type === 'barrelsauna') {
    if (sizeKey === 'barrel-200') return value <= 200;
    if (sizeKey === 'barrel-200-240') return value > 200 && value <= 240;
    if (sizeKey === 'barrel-240-300') return value > 240 && value <= 300;
    if (sizeKey === 'barrel-300+') return value > 300;
  }

  if (type === 'Infrarood') {
    if (sizeKey === 'ir-120') return value <= 120;
    if (sizeKey === 'ir-120-160') return value > 120 && value <= 160;
    if (sizeKey === 'ir-160-200') return value > 160 && value <= 200;
    if (sizeKey === 'ir-200+') return value > 200;
  }

  if (type === 'zwemspa') {
    if (sizeKey === 'swim-400') return value <= 400;
    if (sizeKey === 'swim-400-500') return value > 400 && value <= 500;
    if (sizeKey === 'swim-500-650') return value > 500 && value <= 650;
    if (sizeKey === 'swim-650+') return value > 650;
  }

  return true;
}

function fitsExtra(product, type, extraKey) {
  if (!extraKey || extraKey === 'any') return true;

  if (type === 'spa') {
    return getLigplaatsen(product) === Number(extraKey);
  }

  if (type === 'barrelsauna') {
    const title = normalize(product.title);
    if (extraKey === 'halfglass') return title.includes('halfglas');
    if (extraKey === 'closed') return !title.includes('halfglas');
  }

  // 🔥 NIEUW: infrarood filtering
  if (type === 'Infrarood') {
    if (extraKey === 'ontspanning') {
      return true; // toon alles
    }

    if (extraKey === 'spiertherapie') {
      const brand = normalize(
        getSpecValue(product, 'Merk') || product.brand || ''
      );

      return (
        brand.includes('infra4health') ||
        brand.includes('health company')
      );
    }
  }

  return true;
}

function filterProducts() {
  const type = state.selections.type;
  state.filtered = state.products.filter(product => {
    return normalize(product.type) === normalize(type)
      && fitsSize(product, type, state.selections.size)
      && fitsExtra(product, type, state.selections.extra);
  }).sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
}

function renderResults() {
  filterProducts();
  elements.resultGrid.innerHTML = '';
  elements.emptyState.hidden = true;

  if (!state.filtered.length) {
    elements.resultMeta.textContent = 'Geen exacte match gevonden voor uw selectie.';
    elements.emptyState.hidden = false;
    return;
  }

  elements.resultMeta.textContent = `${state.filtered.length} model${state.filtered.length > 1 ? 'len' : ''} gevonden.`;

  const fragment = document.createDocumentFragment();
  state.filtered.forEach(product => {
    const node = elements.resultCardTemplate.content.cloneNode(true);
    const link = node.querySelector('.result-card-link');
    const img = node.querySelector('.result-image');
    const badge = node.querySelector('.result-badge');
    const title = node.querySelector('.result-title');
    const price = node.querySelector('.result-price');
    const specs = node.querySelector('.result-spec-list');
    const dims = getDimensions(product);

    link.href = `product.html?id=${encodeURIComponent(product.id || '')}`;
    img.src = product.image || '';
    img.alt = product.title || '';
    title.textContent = product.title || '';
    price.textContent = euro(product.price || 0);
    badge.textContent = dims?.raw || product.type || '';

    const specLines = [];
    if (dims?.raw) specLines.push(`<span><strong>Afmeting:</strong> ${escapeHtml(dims.raw)}</span>`);
    if (state.selections.type === 'spa') {
      const ligplaatsen = getSpecValue(product, 'Ligplaatsen');
      if (ligplaatsen) specLines.push(`<span><strong>Ligplaatsen:</strong> ${escapeHtml(ligplaatsen)}</span>`);
    }
    if (state.selections.type === 'barrelsauna') {
      specLines.push(`<span><strong>Afwerking:</strong> ${normalize(product.title).includes('halfglas') ? 'Halfglas' : 'Dichte achterzijde'}</span>`);
    }
    specs.innerHTML = specLines.join('');
    fragment.appendChild(node);
  });

  elements.resultGrid.appendChild(fragment);
}

function attachNavigation() {
  elements.backButtons.forEach(btn => {
    btn.addEventListener('click', () => showScreen(btn.dataset.back));
  });

  elements.nextButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const step = btn.dataset.step;
      if (!canProceed(step)) return;

      if (step === 'extra') {
        renderResults();
        showScreen('results');
      } else {
        nextScreen();
      }
    });
  });
}

async function loadProducts() {
  const response = await fetch(PRODUCTS_URL);
  if (!response.ok) throw new Error(`Kan products.json niet laden (${response.status})`);
  const data = await response.json();
  return Array.isArray(data) ? data : (Array.isArray(data.products) ? data.products : []);
}

function showError(message) {
  elements.errorBox.hidden = false;
  elements.errorText.textContent = message;
}

async function init() {
  state.products = await loadProducts();
  attachNavigation();
  renderTypeOptions();
  renderCurrentStep();
  updateNextButtons();
  showScreen('type');
}

init().catch(error => {
  console.error(error);
  showError(String(error.message || error));
});
