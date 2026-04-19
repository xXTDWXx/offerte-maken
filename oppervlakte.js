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

const SIZE_OPTIONS = {
  spa: [
    { value: 'spa-205', label: 'Tot en met 205 cm' },
    { value: 'spa-205-220', label: '205 tot 220 cm' },
    { value: 'spa-220-240', label: '220 tot 240 cm' },
    { value: 'spa-240+', label: '240 cm of groter' }
  ],
  barrelsauna: [
    { value: 'barrel-200', label: 'Tot en met 200 cm' },
    { value: 'barrel-200-240', label: '200 tot 240 cm' },
    { value: 'barrel-240-300', label: '240 tot 300 cm' },
    { value: 'barrel-300+', label: '300 cm of groter' }
  ],
  Infrarood: [
    { value: 'ir-120', label: 'Tot en met 120 cm' },
    { value: 'ir-120-160', label: '120 tot 160 cm' },
    { value: 'ir-160-200', label: '160 tot 200 cm' },
    { value: 'ir-200+', label: '200 cm of groter' }
  ],
  zwemspa: [
    { value: 'swim-400', label: 'Tot en met 400 cm' },
    { value: 'swim-400-500', label: '400 tot 500 cm' },
    { value: 'swim-500-650', label: '500 tot 650 cm' },
    { value: 'swim-650+', label: '650 cm of groter' }
  ]
};

const EXTRA_OPTIONS = {
  spa: [
    { value: 'any', label: 'Geen voorkeur' },
    { value: '1', label: '1 ligplaats' },
    { value: '2', label: '2 ligplaatsen' }
  ],
  barrelsauna: [
    { value: 'any', label: 'Geen voorkeur' },
    { value: 'closed', label: 'Dichte achterzijde' },
    { value: 'halfglass', label: 'Halfglas achterzijde' }
  ],
  Infrarood: [
    { value: 'any', label: 'Geen extra voorkeur' }
  ],
  zwemspa: [
    { value: 'any', label: 'Geen extra voorkeur' }
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

function optionCard(option, selectedValue, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'choice-card';
  if (selectedValue === option.value) button.classList.add('is-selected');

  button.innerHTML = `<div class="choice-title">${option.label}</div>`;
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
  if (index < SCREEN_ORDER.length - 1) showScreen(SCREEN_ORDER[index + 1]);
}

function updateNextButtons() {
  elements.nextButtons.forEach(btn => {
    const step = btn.dataset.step;
    btn.disabled = !state.selections[step];
  });
}

function renderTypeOptions() {
  elements.typeOptions.innerHTML = '';
  TYPE_OPTIONS.forEach(option => {
    elements.typeOptions.appendChild(optionCard(option, state.selections.type, () => {
      state.selections.type = option.value;
      renderTypeOptions();
      renderCurrentStep();
      updateNextButtons();
    }));
  });
}

function renderCurrentStep() {
  const type = state.selections.type;
  if (!type) return;

  elements.sizeOptions.innerHTML = '';
  SIZE_OPTIONS[type].forEach(opt => {
    elements.sizeOptions.appendChild(optionCard(opt, state.selections.size, () => {
      state.selections.size = opt.value;
      renderCurrentStep();
      updateNextButtons();
    }));
  });

  elements.extraOptions.innerHTML = '';
  EXTRA_OPTIONS[type].forEach(opt => {
    elements.extraOptions.appendChild(optionCard(opt, state.selections.extra, () => {
      state.selections.extra = opt.value;
      updateNextButtons();
    }));
  });
}

function filterProducts() {
  return state.products.filter(p => p.type === state.selections.type);
}

function renderResults() {
  const results = filterProducts();
  elements.resultGrid.innerHTML = results.map(p => `<div>${p.title}</div>`).join('');
}

function attachNavigation() {
  elements.backButtons.forEach(btn => {
    btn.addEventListener('click', () => showScreen(btn.dataset.back));
  });

  elements.nextButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const step = btn.dataset.step;
      if (!state.selections[step]) return;

      if (step === 'extra') {
        renderResults();
        showScreen('results');
      } else {
        nextScreen();
      }
    });
  });
}

async function init() {
  const res = await fetch(PRODUCTS_URL);
  state.products = await res.json();

  attachNavigation();
  renderTypeOptions();
  showScreen('type');
}

init();
