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

// rest van file ongewijzigd

function optionCard(option, selectedValue, onClick, variant = 'default') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `choice-card ${variant === 'type' ? 'choice-card-type' : ''}`;
  if (selectedValue === option.value) button.classList.add('is-selected');

  button.innerHTML = `
    ${option.image ? `<div class="choice-image-wrap"><img src="${option.image}" alt="${option.label}" class="choice-image"></div>` : ''}
    <div class="choice-content-wrap">
      <div class="choice-title">${option.label}</div>
      ${option.description ? `<div class="choice-description">${option.description}</div>` : ''}
    </div>
  `;

  button.addEventListener('click', onClick);
  return button;
}
