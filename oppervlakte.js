const PRODUCTS_URL = new URL('products.json', document.baseURI).toString();

const state = {
  products: [],
  filtered: [],
  selections: {
    type: '',
    persons: '',
    size: '',
    budget: '',
    extra: ''
  }
};

const TYPE_OPTIONS = [
  {
    value: 'spa',
    label: 'Een jacuzzi',
    description: 'Massage, wellness en comfort voor thuis.',
    image: 'https://www.sunspabenelux.be/wp-content/uploads/2022/05/sunspa-marbella-2.jpg'
  },
  {
    value: 'barrelsauna',
    label: 'Barrel sauna',
    description: 'Compacte buitensauna met warme natuurlijke uitstraling.',
    image: 'https://www.sunspabenelux.be/wp-content/uploads/2022/07/barrelsauna-tr210.jpg'
  },
  {
    value: 'Infrarood',
    label: 'Infrarood sauna',
    description: 'Snelle opwarming en ontspanning binnenshuis.',
    image: 'https://www.sunspabenelux.be/wp-content/uploads/2022/07/i120-infrarood-sauna.webp'
  },
  {
    value: 'zwemspa',
    label: 'Zwemspa',
    description: 'Zwemmen, trainen en ontspannen in één product.',
    image: 'https://www.sunspabenelux.be/wp-content/uploads/2022/05/zwemspa-pacific.jpg'
  }
];

const PERSON_OPTIONS = {
  spa: [
    { value: '1-3', label: '1 tot 3 personen' },
    { value: '4-5', label: '4 tot 5 personen' },
    { value: '6+', label: '6 personen of meer' }
  ],
  barrelsauna: [
    { value: '1-2', label: '1 tot 2 personen' },
    { value: '3-4', label: '3 tot 4 personen' },
    { value: '5+', label: '5 personen of meer' }
  ],
  Infrarood: [
    { value: '1', label: '1 persoon' },
    { value: '2', label: '2 personen' },
    { value: '3+', label: '3 personen of meer' }
  ],
  zwemspa: [
    { value: '1-4', label: '1 tot 4 personen' },
    { value: '5-9', label: '5 tot 9 personen' },
    { value: '10+', label: '10 personen of meer' }
  ]
};

const SIZE_OPTIONS = {
  spa: [
    { value: 'compact', label: 'Compact', description: 'Tot en met 200 cm' },
    { value: 'medium', label: 'Medium', description: '200 tot 220 cm' },
    { value: 'large', label: 'Groot', description: '220 tot 240 cm' },
    { value: 'xl', label: 'XL', description: '240 cm of groter' }
  ],
  barrelsauna: [
    { value: 'compact', label: 'Compact', description: 'Tot en met 200 cm lengte' },
    { value: 'medium', label: 'Medium', description: '200 tot 240 cm lengte' },
    { value: 'large', label: 'Groot', description: '240 tot 300 cm lengte' },
    { value: 'xl', label: 'XL', description: '300 cm of langer' }
  ],
  Infrarood: [
    { value: 'compact', label: 'Compact', description: 'Tot en met 120 cm breedte/lengte' },
    { value: 'medium', label: 'Medium', description: '120 tot 160 cm' },
    { value: 'large', label: 'Groot', description: '160 tot 200 cm' },
    { value: 'xl', label: 'XL', description: '200 cm of groter' }
  ],
  zwemspa: [
    { value: 'medium', label: 'Medium', description: 'Tot en met 400 cm lengte' },
    { value: 'large', label: 'Groot', description: '400 tot 500 cm lengte' },
    { value: 'xl', label: 'XL', description: '500 tot 650 cm lengte' },
    { value: 'xxl', label: 'XXL', description: '650 cm of langer' }
  ]
};

const BUDGET_OPTIONS = {
  spa: [
    { value: '4000-6000', label: '€ 4.000 – € 6.000', min: 4000, max: 6000 },
    { value: '6000-8000', label: '€ 6.000 – € 8.000', min: 6000, max: 8000 },
    { value: '8000-10000', label: '€ 8.000 – € 10.000', min: 8000, max: 10000 },
    { value: '10000-15000', label: '€ 10.000 – € 15.000', min: 10000, max: 15000 },
    { value: '15000+', label: '€ 15.000+', min: 15000, max: Infinity }
  ],
  barrelsauna: [
    { value: '4000-6000', label: '€ 4.000 – € 6.000', min: 4000, max: 6000 },
    { value: '6000-8000', label: '€ 6.000 – € 8.000', min: 6000, max: 8000 },
    { value: '8000-10000', label: '€ 8.000 – € 10.000', min: 8000, max: 10000 },
    { value: '10000-15000', label: '€ 10.000 – € 15.000', min: 10000, max: 15000 },
    { value: '15000+', label: '€ 15.000+', min: 15000, max: Infinity }
  ],
  Infrarood: [
    { value: '1000-3000', label: '€ 1.000 – € 3.000', min: 1000, max: 3000 },
    { value: '3000-5000', label: '€ 3.000 – € 5.000', min: 3000, max: 5000 },
    { value: '5000+', label: '€ 5.000+', min: 5000, max: Infinity }
  ],
  zwemspa: [
    { value: '10000-15000', label: '€ 10.000 – € 15.000', min: 10000, max: 15000 },
    { value: '15000-20000', label: '€ 15.000 – € 20.000', min: 15000, max: 20000 },
    { value: '20000-30000', label: '€ 20.000 – € 30.000', min: 20000, max: 30000 },
    { value: '30000+', label: '€ 30.000+', min: 30000, max: Infinity }
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
    { value: 'closed', label: 'Dicht achteraan', description: 'Volledig gesloten achterzijde.' },
    { value: 'halfglass', label: 'Half glas achteraan', description: 'Meer lichtinval en open gevoel.' }
  ],
  Infrarood: [
    { value: 'any', label: 'Geen extra voorkeur', description: 'Toon alle passende infrarood sauna’s.' }
  ],
  zwemspa: [
    { value: 'any', label: 'Geen extra voorkeur', description: 'Toon alle passende zwemspa’s.' }
  ]
};

const elements = {
  typeOptions: document.getElementById('typeOptions'),
  personOptions: document.getElementById('personOptions'),
  sizeOptions: document.getElementById('sizeOptions'),
  budgetOptions: document.getElementById('budgetOptions'),
  extraOptions: document.getElementById('extraOptions'),
  selectionSummary: document.getElementById('selectionSummary'),
  progressItems: [...document.querySelectorAll('.progress-item')],
  steps: {
    1: document.getElementById('step1'),
    2: document.getElementById('step2'),
    3: document.getElementById('step3'),
    4: document.getElementById('step4'),
    5: document.getElementById('step5')
  },
  step5Description: document.getElementById('step5Description'),
  resultMeta: document.getElementById('resultMeta'),
  resultGrid: document.getElementById('resultGrid'),
  emptyState: document.getElementById('emptyState'),
  errorBox: document.getElementById('errorBox'),
  errorText: document.getElementById('errorText'),
  resetWizard: document.getElementById('resetWizard'),
  resultCardTemplate: document.getElementById('resultCardTemplate')
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

function getPersonCount(product) {
  const source = getSpecValue(product, 'Aantal personen') || getSpecValue(product, 'Zitplaatsen');
  const nums = parseNumbers(source);
  return nums.length ? nums[nums.length - 1] : 0;
}

function getLigplaatsen(product) {
  const value = getSpecValue(product, 'Ligplaatsen');
  const nums = parseNumbers(value);
  return nums.length ? nums[0] : 0;
}

function getBudgetOption(type, key) {
  return (BUDGET_OPTIONS[type] || []).find(option => option.value === key) || null;
}

function fitsBudget(product, option) {
  const price = Number(product.price || 0);
  if (!option) return true;
  return price >= option.min && price < option.max;
}

function fitsPersons(product, type, selection) {
  const count = getPersonCount(product);
  if (!selection) return true;
  if (selection === '1') return count === 1;
  if (selection === '2') return count === 2;
  if (selection === '3+') return count >= 3;
  if (selection === '1-2') return count >= 1 && count <= 2;
  if (selection === '3-4') return count >= 3 && count <= 4;
  if (selection === '5+') return count >= 5;
  if (selection === '1-3') return count >= 1 && count <= 3;
  if (selection === '4-5') return count >= 4 && count <= 5;
  if (selection === '6+') return count >= 6;
  if (selection === '1-4') return count >= 1 && count <= 4;
  if (selection === '5-9') return count >= 5 && count <= 9;
  if (selection === '10+') return count >= 10;
  return true;
}

function fitsSize(product, type, selection) {
  const dims = getDimensions(product);
  if (!selection || !dims) return true;
  const value = dims.longest;

  if (type === 'zwemspa') {
    if (selection === 'medium') return value <= 400;
    if (selection === 'large') return value > 400 && value <= 500;
    if (selection === 'xl') return value > 500 && value <= 650;
    if (selection === 'xxl') return value > 650;
    return true;
  }

  if (selection === 'compact') return value <= 200;
  if (selection === 'medium') return value > 200 && value <= 220;
  if (selection === 'large') return value > 220 && value <= 240;
  if (selection === 'xl') return value > 240;
  return true;
}

function fitsExtra(product, type, selection) {
  if (!selection || selection === 'any') return true;
  if (type === 'spa') {
    return getLigplaatsen(product) === Number(selection);
  }
  if (type === 'barrelsauna') {
    const title = normalize(product.title);
    const back = normalize(getSpecValue(product, 'Achterzijde Barrel'));
    if (selection === 'halfglass') {
      return title.includes('halfglas') || back.includes('half glas');
    }
    if (selection === 'closed') {
      return !title.includes('halfglas') && (back.includes('dichte') || back.includes('dicht') || !back.includes('half glas'));
    }
  }
  return true;
}

function getRelevantProducts() {
  return state.products.filter(product => normalize(product.type) === normalize(state.selections.type));
}

function sortResults(items) {
  return [...items].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
}

function filterProducts() {
  const type = state.selections.type;
  const budget = getBudgetOption(type, state.selections.budget);

  const items = getRelevantProducts().filter(product => {
    return fitsPersons(product, type, state.selections.persons)
      && fitsSize(product, type, state.selections.size)
      && fitsBudget(product, budget)
      && fitsExtra(product, type, state.selections.extra);
  });

  state.filtered = sortResults(items);
}

function setStepState(stepNumber, open) {
  const step = elements.steps[stepNumber];
  if (!step) return;
  step.classList.toggle('is-open', open);
  step.classList.toggle('is-locked', !open);
}

function updateProgress() {
  const completed = {
    1: !!state.selections.type,
    2: !!state.selections.persons,
    3: !!state.selections.size,
    4: !!state.selections.budget,
    5: !!state.selections.extra
  };

  elements.progressItems.forEach(item => {
    const step = Number(item.dataset.step);
    item.classList.remove('is-active', 'is-complete');
    if (completed[step]) {
      item.classList.add('is-complete');
    }
  });

  const nextStep = !completed[1] ? 1 : !completed[2] ? 2 : !completed[3] ? 3 : !completed[4] ? 4 : 5;
  const activeItem = elements.progressItems.find(item => Number(item.dataset.step) === nextStep);
  activeItem?.classList.add('is-active');

  setStepState(1, true);
  setStepState(2, completed[1]);
  setStepState(3, completed[2]);
  setStepState(4, completed[3]);
  setStepState(5, completed[4]);
}

function optionCard(option, group, selectedValue, onClick, variant = 'default') {
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

  button.addEventListener('click', () => onClick(group, option.value));
  return button;
}

function renderTypeOptions() {
  elements.typeOptions.innerHTML = '';
  TYPE_OPTIONS.forEach(option => {
    elements.typeOptions.appendChild(optionCard(option, 'type', state.selections.type, handleSelection, 'type'));
  });
}

function renderSimpleOptions(target, options, group, selectedValue) {
  target.innerHTML = '';
  options.forEach(option => {
    target.appendChild(optionCard(option, group, selectedValue, handleSelection));
  });
}

function renderDynamicSteps() {
  const type = state.selections.type;
  renderSimpleOptions(elements.personOptions, PERSON_OPTIONS[type] || [], 'persons', state.selections.persons);
  renderSimpleOptions(elements.sizeOptions, SIZE_OPTIONS[type] || [], 'size', state.selections.size);
  renderSimpleOptions(elements.budgetOptions, BUDGET_OPTIONS[type] || [], 'budget', state.selections.budget);
  renderSimpleOptions(elements.extraOptions, EXTRA_OPTIONS[type] || [], 'extra', state.selections.extra);

  if (type === 'spa') {
    elements.step5Description.textContent = 'Kies of u één of twee ligplaatsen wenst.';
  } else if (type === 'barrelsauna') {
    elements.step5Description.textContent = 'Kies of u een dichte achterzijde of half glas achteraan wenst.';
  } else {
    elements.step5Description.textContent = 'Geen verplichte extra voorkeur. U kunt alle passende modellen bekijken.';
  }
}

function updateSummary() {
  const selections = [];
  const typeLabel = TYPE_OPTIONS.find(option => option.value === state.selections.type)?.label;
  if (typeLabel) selections.push(['Type', typeLabel]);
  const personLabel = (PERSON_OPTIONS[state.selections.type] || []).find(option => option.value === state.selections.persons)?.label;
  if (personLabel) selections.push(['Personen', personLabel]);
  const sizeLabel = (SIZE_OPTIONS[state.selections.type] || []).find(option => option.value === state.selections.size)?.label;
  if (sizeLabel) selections.push(['Afmeting', sizeLabel]);
  const budgetLabel = (BUDGET_OPTIONS[state.selections.type] || []).find(option => option.value === state.selections.budget)?.label;
  if (budgetLabel) selections.push(['Budget', budgetLabel]);
  const extraLabel = (EXTRA_OPTIONS[state.selections.type] || []).find(option => option.value === state.selections.extra)?.label;
  if (extraLabel) selections.push(['Voorkeur', extraLabel]);

  if (!selections.length) {
    elements.selectionSummary.innerHTML = '<div class="summary-empty">Nog geen keuzes gemaakt.</div>';
    return;
  }

  elements.selectionSummary.innerHTML = selections.map(([label, value]) => `
    <div class="summary-row">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `).join('');
}

function renderResults() {
  elements.resultGrid.innerHTML = '';
  elements.emptyState.hidden = true;

  if (!state.selections.extra) {
    elements.resultMeta.textContent = 'Maak uw keuzes om uw persoonlijke selectie te zien.';
    return;
  }

  filterProducts();

  if (!state.filtered.length) {
    elements.resultMeta.textContent = 'Er werden geen exacte matches gevonden voor uw selectie.';
    elements.emptyState.hidden = false;
    return;
  }

  elements.resultMeta.textContent = `${state.filtered.length} model${state.filtered.length > 1 ? 'len' : ''} gevonden voor uw selectie.`;

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

    link.href = product.url || `product.html?id=${encodeURIComponent(product.id || '')}`;
    img.src = product.image || '';
    img.alt = product.title || '';
    title.textContent = product.title || '';
    price.textContent = euro(product.price || 0);
    badge.textContent = dims?.raw || product.type || '';

    const specLines = [];
    const persons = getSpecValue(product, 'Aantal personen');
    const ligplaatsen = getSpecValue(product, 'Ligplaatsen');
    if (persons) specLines.push(`<span><strong>Personen:</strong> ${escapeHtml(persons)}</span>`);
    if (ligplaatsen && normalize(state.selections.type) === 'spa') specLines.push(`<span><strong>Ligplaatsen:</strong> ${escapeHtml(ligplaatsen)}</span>`);
    if (dims?.raw) specLines.push(`<span><strong>Afmeting:</strong> ${escapeHtml(dims.raw)}</span>`);
    specs.innerHTML = specLines.join('');

    fragment.appendChild(node);
  });

  elements.resultGrid.appendChild(fragment);
}

function rerender() {
  renderTypeOptions();
  if (state.selections.type) renderDynamicSteps();
  updateSummary();
  updateProgress();
  renderResults();
}

function resetFrom(group) {
  if (group === 'type') {
    state.selections = { type: state.selections.type, persons: '', size: '', budget: '', extra: '' };
  }
  if (group === 'persons') {
    state.selections.size = '';
    state.selections.budget = '';
    state.selections.extra = '';
  }
  if (group === 'size') {
    state.selections.budget = '';
    state.selections.extra = '';
  }
  if (group === 'budget') {
    state.selections.extra = '';
  }
}

function handleSelection(group, value) {
  if (group === 'type' && state.selections.type !== value) {
    state.selections.type = value;
    resetFrom('type');
  } else {
    state.selections[group] = value;
    resetFrom(group);
    state.selections[group] = value;
  }
  rerender();
}

function resetWizard() {
  state.selections = { type: '', persons: '', size: '', budget: '', extra: '' };
  elements.personOptions.innerHTML = '';
  elements.sizeOptions.innerHTML = '';
  elements.budgetOptions.innerHTML = '';
  elements.extraOptions.innerHTML = '';
  rerender();
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
  elements.resetWizard.addEventListener('click', resetWizard);
  rerender();
}

init().catch(error => {
  console.error(error);
  showError(String(error.message || error));
});
