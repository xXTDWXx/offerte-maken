const PRODUCTS_URL = new URL('products.json', document.baseURI).toString();
const OVERKAPPING_URL = new URL('overkapping.json', document.baseURI).toString();
const ELECTRICAL_SCHEMA_URL = new URL('stroom.html', document.baseURI).toString();

/*
  Zet hier het pad naar jullie logo.
  Voorbeeld:
  const COMPANY_LOGO_URL = 'logo.png';
*/
const COMPANY_LOGO_URL = 'logo.svg';
const COMPANY_NAME = 'Sunspa Benelux';
const COMPANY_EMAIL = 'sunspabrugge@gmail.com';
const COMPANY_PHONE = '0483399967';
const COMPANY_WEBSITE = 'www.sunspabenelux.be';

const errorBox = document.getElementById('errorBox');
const errorText = document.getElementById('errorText');
const productPage = document.getElementById('productPage');

const productImg = document.getElementById('productImg');
const productTitle = document.getElementById('productTitle');
const productPrice = document.getElementById('productPrice');
const productType = document.getElementById('productType');
const productSpecs = document.getElementById('productSpecs');
const productUrl = document.getElementById('productUrl');
const productPrint = document.getElementById('productPrint');
const offerPrint = document.getElementById('offerPrint');
const sixPercentPrint = document.getElementById('sixPercentPrint');
const backToOverview = document.querySelector('.header-row > a.btn');

const customerName = document.getElementById('customerName');
const customerStreet = document.getElementById('customerStreet');
const customerCity = document.getElementById('customerCity');
const customerPhone = document.getElementById('customerPhone');

let currentProduct = null;
let selectedVariant = null;
let currentOverkappingScreenOptions = [];
let optionHandlersWired = false;
let customerHandlersWired = false;

const OVERKAPPING_HIDDEN_SPEC_LABELS = new Set(['levering', 'levertermijn']);
const OVERKAPPING_HIGH_INSTALL_DIMENSIONS = new Set(['3x6', '3.6x5.3', '3.6x7.2', '4x6']);
const SPA_CRANE_DELIVERY_LIMIT_CM = 236;
const SPA_DELIVERY_MARGIN_CM = 20;
const SPA_MIN_PASSAGE_WIDTH_CM = 88;

function $(id) {
  return document.getElementById(id);
}

function getSpecValue(product, label) {
  const specs = product?.specs;

  if (!specs) return '';

  if (Array.isArray(specs)) {
    const found = specs.find(s => String(s?.label || '').toLowerCase() === String(label || '').toLowerCase());
    return found?.value || '';
  }

  if (typeof specs === 'object') {
    const key = Object.keys(specs).find(k => String(k || '').toLowerCase() === String(label || '').toLowerCase());
    return key ? specs[key] : '';
  }

  return '';
}

function getMerk(product) {
  return String(
    product?.merk ||
    product?.brand ||
    getSpecValue(product, 'Merk') ||
    ''
  ).trim();
}

function isBullfrogProduct(product) {
  return getMerk(product).toLowerCase() === 'bullfrog';
}

function toggleBullfrogUi(product) {
  const hide = isBullfrogProduct(product);

  document.querySelectorAll('.options, .totals').forEach(el => {
    el.style.display = hide ? 'none' : '';
  });
}

function euro(n) {
  const x = Number(n || 0);
  try {
    return new Intl.NumberFormat('nl-BE', {
      style: 'currency',
      currency: 'EUR'
    }).format(x);
  } catch {
    return '€' + x.toFixed(2);
  }
}

function displayPrice(product) {
  return product?.price_display || euro(product?.price || 0);
}

function isProductVisible(product) {
  return product?.hidden !== true && product?.visible !== false;
}

const OVERKAPPING_SCREEN_OPTIONS = [
  { id: 'lamellenwand-100', label: '100 cm', price: 549 },
  { id: 'lamellenwand-120', label: '120 cm', price: 599 },
  { id: 'lamellenwand-133', label: '133 cm', price: 649 }
];

const OVERKAPPING_WPC_OPTIONS = [
  { id: 'wpc-3m', sizeKey: '3', label: '3 m', offerLabel: 'WPC Wand 3 m', price: 899 },
  { id: 'wpc-36m', sizeKey: '3.6', label: '3.6 m', offerLabel: 'WPC Wand 3.6 m', price: 999 },
  { id: 'wpc-4m', sizeKey: '4', label: '4 m', offerLabel: 'WPC Wand 4 m', price: 1049 },
  { id: 'wpc-53m', sizeKey: '5.3', label: '5.3 m', offerLabel: 'WPC Wand 5.3 m', price: 1179 }
];

const OVERKAPPING_ACCESSORY_IMAGES = [
  {
    label: 'Lamellenwand',
    image: 'images/overkappingen/alusense-27796-horizontale-lamellenwand.png'
  },
  {
    label: 'WPC Wand',
    image: 'images/overkappingen/alusense-27843-afscheidingswand-wpc.png'
  }
];

function getProductVariants(product) {
  if (!Array.isArray(product?.variants)) return [];
  return product.variants.filter(variant => Number.isFinite(Number(variant?.price)));
}

function getVariantLabel(product) {
  return product?.variant_label || 'Afmeting';
}

function getVariantKey(variant, index = 0) {
  return String(variant?.id || `${variant?.label || 'variant'}-${index}`);
}

function getCurrentProductPriceValue() {
  if (isQuantityVariantProduct(currentProduct)) {
    return getOverkappingScreenTotal();
  }

  return Number(selectedVariant?.price ?? currentProduct?.price ?? 0);
}

function getPromotionTextSource(product) {
  const specs = Array.isArray(product?.specs)
    ? product.specs.map(spec => `${spec?.label || ''} ${spec?.value || ''}`).join(' ')
    : '';

  return `${product?.id || ''} ${product?.type || ''} ${product?.merk || ''} ${product?.brand || ''} ${product?.title || ''} ${specs}`.toLowerCase();
}

function getProductPromotion(product) {
  const source = getPromotionTextSource(product);
  const merk = getMerk(product).toLowerCase();

  if (merk.includes('vogue') || source.includes('vogue')) {
    return { id: 'vogue', label: '-10% op de Vogue spa' };
  }

  if (merk.includes('myspa') || source.includes('myspa')) {
    return { id: 'myspa', label: '-10% op Myspa' };
  }

  return null;
}

function getPromotionDiscountAmount(product = currentProduct) {
  const promotion = getProductPromotion(product);
  const checked = $('optPromoDiscount')?.checked;

  if (!promotion || !checked) return 0;

  return Math.round(getCurrentProductPriceValue() * 0.10 * 100) / 100;
}

function getCurrentProductPriceText() {
  if (isQuantityVariantProduct(currentProduct)) {
    const total = getOverkappingScreenTotal();
    return total > 0 ? euro(total) : displayPrice(currentProduct);
  }

  return selectedVariant ? euro(selectedVariant.price) : displayPrice(currentProduct);
}

function syncProductPriceDisplay() {
  if (productPrice) {
    productPrice.textContent = `Prijs: ${getCurrentProductPriceText()}`;
  }
}

function escapeHtml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDateBelgium(date) {
  return new Intl.DateTimeFormat('nl-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function typeNorm(type) {
  return String(type || '').toLowerCase();
}

function titleNorm(title) {
  return String(title || '').trim().toLowerCase();
}

function isRoundSpaWithoutCoverlift(product) {
  const title = titleNorm(product?.title);
  return title.includes('marrakech') || title.includes('python');
}

function isSwimspa(type) {
  const t = typeNorm(type);
  return t.includes('zwemspa') || t.includes('swim');
}

function isSpaProduct(product) {
  const t = typeNorm(product?.type);
  return !isSwimspa(t) && (t === 'spa' || t === "spa's");
}

function parseProductDimensionsCm(product) {
  const raw = String(getSpecValue(product, 'Afmeting') || '').trim();
  const values = Array.from(raw.replace(/,/g, '.').matchAll(/\d+(?:\.\d+)?/g))
    .map(match => Number(match[0]))
    .filter(Number.isFinite);

  if (values.length >= 3) {
    return {
      raw,
      length: values[0],
      width: values[1],
      height: values[2]
    };
  }

  if (values.length === 2) {
    return {
      raw,
      length: values[0],
      width: values[0],
      height: values[1]
    };
  }

  return null;
}

function formatCm(value) {
  const rounded = Math.round(Number(value) * 10) / 10;
  if (!Number.isFinite(rounded)) return '-';
  return `${String(rounded).replace('.', ',')} cm`;
}

function getSpaDeliveryAccess(product) {
  if (!isSpaProduct(product)) return null;

  const dimensions = parseProductDimensionsCm(product);
  if (!dimensions) return null;

  const shortestSide = Math.min(dimensions.length, dimensions.width);
  const craneOnly =
    dimensions.length > SPA_CRANE_DELIVERY_LIMIT_CM ||
    dimensions.width > SPA_CRANE_DELIVERY_LIMIT_CM;

  return {
    dimensions,
    craneOnly,
    passageWidth: Math.max(dimensions.height + SPA_DELIVERY_MARGIN_CM, SPA_MIN_PASSAGE_WIDTH_CM),
    passageHeight: shortestSide + SPA_DELIVERY_MARGIN_CM
  };
}

function isInfrared(type) {
  return typeNorm(type).includes('infrarood');
}

function isBarrelSauna(type) {
  const t = typeNorm(type);
  return t.includes('barrel') && t.includes('sauna');
}

function isSaunaPod(type) {
  const t = typeNorm(type);
  return t.includes('sauna pod') || t.includes('pod sauna') || t.includes('saunapod');
}

function isSauna(type) {
  return typeNorm(type).includes('sauna');
}

function isOutdoorSaunaWithRoofAndStove(type) {
  return isBarrelSauna(type) || isSaunaPod(type);
}

function isOverkapping(type) {
  return typeNorm(type).includes('overkapping');
}

function getCategoryTypeForProduct(product) {
  const type = typeNorm(product?.type);

  if (isOverkapping(type)) return 'overkappingen';
  if (isSwimspa(type)) return 'Zwemspa';
  if (isBarrelSauna(type)) return 'Barrelsauna';
  if (isInfrared(type)) return 'Infrarood';
  if (isSaunaPod(type)) return 'sauna pod';
  if (type === 'combi sauna') return 'combi sauna';
  if (isSauna(type)) return 'sauna';
  return 'Spa';
}

function getBackToOverviewHref(product) {
  try {
    const referrerUrl = document.referrer ? new URL(document.referrer) : null;
    if (
      referrerUrl &&
      referrerUrl.origin === window.location.origin &&
      referrerUrl.pathname.toLowerCase().endsWith('/category.html')
    ) {
      return referrerUrl.href;
    }
  } catch {
    // Fall back to the derived category link below.
  }

  const categoryType = getCategoryTypeForProduct(product);
  return `category.html?type=${encodeURIComponent(categoryType)}`;
}

function getProductCategoryText(product) {
  const categories = Array.isArray(product?.categories) ? product.categories.join(' ') : '';
  return `${product?.category || ''} ${categories}`.toLowerCase();
}

function isAccessoryProduct(product) {
  return getProductCategoryText(product).includes('accessoires');
}

function isMainOverkappingProduct(product) {
  return isOverkapping(product?.type) && !isAccessoryProduct(product);
}

function isLamellenwandProduct(product) {
  return String(product?.id || '') === 'alusense-27796';
}

function isWpcWandProduct(product) {
  return String(product?.id || '') === 'alusense-27843';
}

function isQuantityVariantProduct(product) {
  return isLamellenwandProduct(product) || isWpcWandProduct(product);
}

function isJacuzzi(type) {
  const t = typeNorm(type);
  return !isOverkapping(t) && !isSwimspa(t) && !isInfrared(t) && !isSauna(t);
}

function syncProductTypeClasses(product) {
  if (!document.body) return;

  document.body.classList.toggle('product-type-overkapping', isOverkapping(product?.type));
  document.body.classList.toggle('product-type-swimspa', isSwimspa(product?.type));
  document.body.classList.toggle('product-type-jacuzzi', isJacuzzi(product?.type));
}

function hasSpaColorOptions(type) {
  return isJacuzzi(type) || isSwimspa(type);
}

function toPositiveInt(value) {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

function setNumberInputValue(input, value) {
  if (!input) return 0;
  const cleanValue = Math.max(0, toPositiveInt(value));
  input.value = String(cleanValue);
  return cleanValue;
}

const PRICES = {
  install_jacuzzi: 695,
  install_swimspa: 895,
  install_barrel_sauna: 995,
  install_infrared: 450,
  install_sauna: 695,
  install_overkapping: 680,

  coverlift_unit: 189,
  maintenance_unit: 179,
  swim_filterset_unit: 250,
  warmtepomp_unit: 2795,

  barrel_wood_stove_unit: 1245,
  barrel_electric_heater_unit: 495,
  barrel_roof_shingles_unit: 399,
  barrel_roof_heather_unit: 849,
  barrel_roof_design_unit: 899,
  barrel_infrared_module_unit: 699
};

function installCost(type, product = currentProduct) {
  if (isOverkapping(type)) {
    if (!isMainOverkappingProduct(product)) return 0;

    const dimensionPairKey = getOverkappingDimensionPairKey(product);
    return OVERKAPPING_HIGH_INSTALL_DIMENSIONS.has(dimensionPairKey) ? 1360 : PRICES.install_overkapping;
  }
  if (isSwimspa(type)) return PRICES.install_swimspa;
  if (isBarrelSauna(type)) return PRICES.install_barrel_sauna;
  if (isInfrared(type)) return PRICES.install_infrared;
  if (isSauna(type)) return PRICES.install_sauna;
  return PRICES.install_jacuzzi;
}

function extraOptionsAllowed(type) {
  return isJacuzzi(type) || isSwimspa(type);
}

function specTableHtml(p) {
  const specs = getVisibleSpecs(p);
  if (!specs.length) return '<div class="small">Geen specificaties beschikbaar.</div>';

  return specs.map(s => `
    <div class="spec-row">
      <strong>${escapeHtml(s.label || '')}</strong>
      <span>${escapeHtml(s.value || '')}</span>
    </div>
  `).join('');
}

function getVisibleSpecs(product) {
  const specs = Array.isArray(product?.specs) ? product.specs : [];
  if (!isOverkapping(product?.type)) return specs;

  return specs.filter(spec => {
    const label = String(spec?.label || '').trim().toLowerCase();
    return !OVERKAPPING_HIDDEN_SPEC_LABELS.has(label);
  });
}

async function fetchProductItems(url, label = 'producten') {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Kan ${label} niet laden (${res.status})`);

  const json = await res.json();
  const items = Array.isArray(json) ? json : (json.products || []);
  return Array.isArray(items) ? items : [];
}

async function loadProducts() {
  const catalogProducts = (await fetchProductItems(PRODUCTS_URL, 'products.json')).filter(isProductVisible);
  const productId = getProductIdFromUrl();

  if (!productId || catalogProducts.some(product => String(product.id) === String(productId))) {
    return catalogProducts;
  }

  const overkappingProducts = (await fetchProductItems(OVERKAPPING_URL, 'overkapping.json')).filter(isProductVisible);
  return [...catalogProducts, ...overkappingProducts];
}

function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id') || '';
}

function showError(msg) {
  if (!errorBox || !errorText) return;
  errorBox.style.display = '';
  errorText.textContent = msg;
}

function getCustomerData() {
  return {
    name: customerName ? customerName.value.trim() : '',
    street: customerStreet ? customerStreet.value.trim() : '',
    city: customerCity ? customerCity.value.trim() : '',
    phone: customerPhone ? customerPhone.value.trim() : ''
  };
}

function wireCustomerHandlers() {
  if (customerHandlersWired) return;
  customerHandlersWired = true;

  [customerName, customerStreet, customerCity, customerPhone].forEach(el => {
    if (!el) return;
    el.addEventListener('input', () => {});
  });
}

function setupVariantOptions(product) {
  const variants = getProductVariants(product);
  const variantOptions = $('variantOptions');
  const variantSelect = $('productVariant');
  const variantLabel = $('variantLabel');

  selectedVariant = null;

  if (!variantOptions || !variantSelect) {
    return false;
  }

  if (isQuantityVariantProduct(product)) {
    variantOptions.style.display = 'none';
    variantSelect.innerHTML = '';
    return false;
  }

  if (!variants.length) {
    variantOptions.style.display = 'none';
    variantSelect.innerHTML = '';
    return false;
  }

  if (variantLabel) {
    variantLabel.textContent = getVariantLabel(product);
  }

  variantSelect.innerHTML = variants
    .map((variant, index) => {
      const key = getVariantKey(variant, index);
      const label = variant.label || `Optie ${index + 1}`;
      return `<option value="${escapeHtml(key)}">${escapeHtml(label)} - ${euro(variant.price)}</option>`;
    })
    .join('');

  selectedVariant = variants[0];
  variantSelect.value = getVariantKey(selectedVariant, 0);
  variantOptions.style.display = '';

  variantSelect.onchange = () => {
    const selectedValue = variantSelect.value;
    selectedVariant =
      variants.find((variant, index) => getVariantKey(variant, index) === selectedValue) ||
      variants[0] ||
      null;

    syncProductPriceDisplay();
    updateOptionUI();
  };

  return true;
}

function shouldShowOverkappingScreenOptions(product) {
  return isQuantityVariantProduct(product) || isMainOverkappingProduct(product);
}

function getOverkappingScreenOptions(product) {
  const variants = isQuantityVariantProduct(product) ? getProductVariants(product) : [];
  const sourceOptions = variants.length ? variants : OVERKAPPING_SCREEN_OPTIONS;
  const useWpcLabels = isWpcWandProduct(product);

  return sourceOptions.map(option => ({
    id: option.id,
    label: useWpcLabels
      ? String(option.label || '')
          .replace(',', '.')
          .replace(/(\d+(?:\.\d+)?)m$/i, '$1 m')
      : option.label,
    price: Number(option.price || 0),
    offerLabel: useWpcLabels
      ? `WPC Wand ${String(option.label || '')
          .replace(',', '.')
          .replace(/(\d+(?:\.\d+)?)m$/i, '$1 m')}`
      : `Horizontale Lamellenwand ${option.label}`
  }));
}

function normalizeOverkappingDimensionValue(value) {
  const normalizedValue = String(value || '').replace(',', '.').trim();
  const numberValue = Number(normalizedValue);
  return Number.isFinite(numberValue) ? String(numberValue) : '';
}

function getOverkappingDimensionKeys(product) {
  const title = String(product?.title || '');
  const match = title.match(/(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)m/i);
  if (!match) return [];

  return Array.from(new Set(
    match
      .slice(1, 3)
      .map(normalizeOverkappingDimensionValue)
      .filter(Boolean)
  ));
}

function getOverkappingDimensionPairKey(product) {
  const title = String(product?.title || '');
  const match = title.match(/(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)m/i);
  if (!match) return '';

  const first = normalizeOverkappingDimensionValue(match[1]);
  const second = normalizeOverkappingDimensionValue(match[2]);
  if (!first || !second) return '';

  return `${first}x${second}`;
}

function getOverkappingWpcOptions(product) {
  const dimensionKeys = new Set(getOverkappingDimensionKeys(product));
  const filteredOptions = OVERKAPPING_WPC_OPTIONS.filter(option => dimensionKeys.has(option.sizeKey));
  const sourceOptions = filteredOptions.length ? filteredOptions : OVERKAPPING_WPC_OPTIONS;

  return sourceOptions.map(option => ({
    id: option.id,
    label: option.label,
    price: Number(option.price || 0),
    offerLabel: option.offerLabel || `WPC Wand ${option.label}`
  }));
}

function getOverkappingAccessoryGroups(product) {
  if (!shouldShowOverkappingScreenOptions(product)) return [];

  const groups = [
    {
      title: isQuantityVariantProduct(product) ? 'Afmetingen' : 'Horizontale Lamellenwand',
      options: getOverkappingScreenOptions(product)
    }
  ];

  if (isMainOverkappingProduct(product)) {
    groups.push({
      title: 'WPC Wand',
      options: getOverkappingWpcOptions(product)
    });
  }

  return groups;
}

function getOverkappingScreenQtyInput(optionId) {
  return document.querySelector(`[data-overkapping-screen-qty="${CSS.escape(String(optionId))}"]`);
}

function getOverkappingScreenSelections() {
  return currentOverkappingScreenOptions.map(option => ({
    ...option,
    qty: toPositiveInt(getOverkappingScreenQtyInput(option.id)?.value)
  }));
}

function getOverkappingScreenTotal() {
  return getOverkappingScreenSelections()
    .reduce((sum, option) => sum + option.qty * Number(option.price || 0), 0);
}

function getOverkappingScreenOfferLines() {
  return getOverkappingScreenSelections()
    .filter(option => option.qty > 0)
    .map(option => ({
      label: `${option.offerLabel} x ${option.qty}`,
      price: option.qty * Number(option.price || 0)
    }));
}

function setOverkappingScreenQty(optionId, value) {
  const input = getOverkappingScreenQtyInput(optionId);
  if (!input) return;
  setNumberInputValue(input, value);
  updateOptionUI();
}

function setupOverkappingScreenOptions(product) {
  const group = $('overkappingScreensGroup');
  currentOverkappingScreenOptions = [];

  if (!group) {
    return false;
  }

  if (!shouldShowOverkappingScreenOptions(product)) {
    group.style.display = 'none';
    group.innerHTML = '';
    return false;
  }

  const accessoryGroups = getOverkappingAccessoryGroups(product);
  currentOverkappingScreenOptions = accessoryGroups.flatMap(group => group.options);

  if (!currentOverkappingScreenOptions.length) {
    group.style.display = 'none';
    group.innerHTML = '';
    return false;
  }

  group.innerHTML = accessoryGroups.map(groupData => `
    <div class="overkapping-accessory-group">
      <div class="option-group-title">${escapeHtml(groupData.title)}</div>
      ${groupData.options.map((option, index) => {
        const initialQty = isQuantityVariantProduct(product) && index === 0 ? 1 : 0;
        return `
          <label class="opt opt-inline overkapping-screen-row">
            <div class="opt-text" style="width:100%;">
              <div class="opt-title overkapping-screen-title">
                <span class="overkapping-screen-name">
                  ${escapeHtml(option.label)}
                  <span class="overkapping-screen-price">${euro(option.price)}/stuk</span>
                </span>
                <div class="opt-counter">
                  <button type="button" class="opt-counter-btn" data-overkapping-screen-minus="${escapeHtml(option.id)}">-</button>
                  <input
                    id="overkappingScreenQty${escapeHtml(option.id)}"
                    type="number"
                    min="0"
                    step="1"
                    value="${initialQty}"
                    inputmode="numeric"
                    class="opt-counter-input"
                    data-overkapping-screen-qty="${escapeHtml(option.id)}"
                  />
                  <button type="button" class="opt-counter-btn" data-overkapping-screen-plus="${escapeHtml(option.id)}">+</button>
                </div>
              </div>
            </div>
          </label>
        `;
      }).join('')}
    </div>
  `).join('');

  group.querySelectorAll('[data-overkapping-screen-minus]').forEach(button => {
    button.addEventListener('click', () => {
      const optionId = button.getAttribute('data-overkapping-screen-minus');
      const input = getOverkappingScreenQtyInput(optionId);
      setOverkappingScreenQty(optionId, toPositiveInt(input?.value) - 1);
    });
  });

  group.querySelectorAll('[data-overkapping-screen-plus]').forEach(button => {
    button.addEventListener('click', () => {
      const optionId = button.getAttribute('data-overkapping-screen-plus');
      const input = getOverkappingScreenQtyInput(optionId);
      setOverkappingScreenQty(optionId, toPositiveInt(input?.value) + 1);
    });
  });

  group.querySelectorAll('[data-overkapping-screen-qty]').forEach(input => {
    input.addEventListener('input', updateOptionUI);
    input.addEventListener('change', updateOptionUI);
  });

  group.style.display = '';
  return true;
}

function setupOverkappingAccessoryImages(product) {
  const wrap = $('overkappingAccessoryImages');
  if (!wrap) return;

  if (!isMainOverkappingProduct(product)) {
    wrap.style.display = 'none';
    wrap.innerHTML = '';
    return;
  }

  wrap.innerHTML = OVERKAPPING_ACCESSORY_IMAGES.map(item => `
    <div class="overkapping-accessory-thumb">
      <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.label)}" loading="lazy">
      <span>${escapeHtml(item.label)}</span>
    </div>
  `).join('');
  wrap.style.display = '';
}

function updateOptionUI() {
  if (!currentProduct) return;

  const type = currentProduct.type || '';

  const optInstallPrice = $('optInstallPrice');
  const optInstallRow = $('optInstallRow');
  const optPromoDiscountRow = $('optPromoDiscountRow');
  const optPromoDiscount = $('optPromoDiscount');
  const optPromoDiscountLabel = $('optPromoDiscountLabel');
  const optPromoDiscountPrice = $('optPromoDiscountPrice');

  const optCoverTrapRow = $('optCoverTrapRow');

  const optCoverliftRow = $('optCoverliftRow');
  const optCoverlift = $('optCoverlift');
  const optCoverliftTotal = $('optCoverliftTotal');

  const optCoverlift2Row = $('optCoverlift2Row');
  const optCoverlift2 = $('optCoverlift2');
  const optCoverlift2Total = $('optCoverlift2Total');

  const optMaintRow = $('optMaintRow');
  const optMaint = $('optMaint');
  const optMaintTotal = $('optMaintTotal');

  const optSwimFiltersetRow = $('optSwimFiltersetRow');
  const optSwimFilterset = $('optSwimFilterset');
  const optSwimFiltersetTotal = $('optSwimFiltersetTotal');

  const optWarmtepompRow = $('optWarmtepompRow');
  const optWarmtepompQty = $('optWarmtepompQty');
  const optWarmtepompTotal = $('optWarmtepompTotal');

  const optBarrelStoveGroup = $('optBarrelStoveGroup');
  const optBarrelWoodStoveRow = $('optBarrelWoodStoveRow');
  const optBarrelWoodStove = $('optBarrelWoodStove');
  const optBarrelWoodStoveTotal = $('optBarrelWoodStoveTotal');

  const optBarrelElectricHeaterRow = $('optBarrelElectricHeaterRow');
  const optBarrelElectricHeater = $('optBarrelElectricHeater');
  const optBarrelElectricHeaterTotal = $('optBarrelElectricHeaterTotal');

  const optBarrelRoofGroup = $('optBarrelRoofGroup');
  const optBarrelRoofShingles = $('optBarrelRoofShingles');
  const optBarrelRoofShinglesTotal = $('optBarrelRoofShinglesTotal');
  const optBarrelRoofHeather = $('optBarrelRoofHeather');
  const optBarrelRoofHeatherTotal = $('optBarrelRoofHeatherTotal');
  const optBarrelRoofDesign = $('optBarrelRoofDesign');
  const optBarrelRoofDesignTotal = $('optBarrelRoofDesignTotal');

  const optBarrelInfraredModuleRow = $('optBarrelInfraredModuleRow');
  const optBarrelInfraredModule = $('optBarrelInfraredModule');
  const optBarrelInfraredModuleTotal = $('optBarrelInfraredModuleTotal');

  const tProduct = $('optProductTotal');
  const tOptions = $('optOptionsTotal');
  const tGrand = $('optGrandTotal');

  const inst = installCost(type);
  const promotion = getProductPromotion(currentProduct);
  const productPriceValue = getCurrentProductPriceValue();
  const promoDiscountLine = promotion && optPromoDiscount?.checked
    ? Math.round(productPriceValue * 0.10 * 100) / 100
    : 0;

  if (optInstallPrice) optInstallPrice.textContent = euro(inst);
  if (optInstallRow) optInstallRow.style.display = inst > 0 ? '' : 'none';
  if (optPromoDiscountRow) optPromoDiscountRow.style.display = promotion ? '' : 'none';
  if (optPromoDiscountLabel && promotion) optPromoDiscountLabel.textContent = promotion.label;
  if (optPromoDiscountPrice) optPromoDiscountPrice.textContent = promoDiscountLine > 0 ? `-${euro(promoDiscountLine)}` : euro(0);
  syncProductPriceDisplay();

  const allowExtraOptions = extraOptionsAllowed(type);
  const allowCoverlift = allowExtraOptions && !isRoundSpaWithoutCoverlift(currentProduct);
  const swim = isSwimspa(type);
  const outdoorSauna = isOutdoorSaunaWithRoofAndStove(type);
  const barrelSauna = isBarrelSauna(type);
  const sauna = isSauna(type);
  const showStoveGroup = outdoorSauna || sauna;
  const showElectricHeater = sauna;
  const showWoodStove = outdoorSauna;
  const showRoofGroup = outdoorSauna;
  const showInfraredModule = barrelSauna;

  if (optCoverTrapRow) optCoverTrapRow.style.display = allowExtraOptions ? '' : 'none';
  if (optCoverliftRow) optCoverliftRow.style.display = allowCoverlift ? '' : 'none';
  if (optMaintRow) optMaintRow.style.display = allowExtraOptions ? '' : 'none';

  if (optCoverlift2Row) optCoverlift2Row.style.display = swim ? '' : 'none';
  if (optSwimFiltersetRow) optSwimFiltersetRow.style.display = swim ? '' : 'none';
  if (optWarmtepompRow) optWarmtepompRow.style.display = swim ? '' : 'none';

  if (!allowCoverlift && optCoverlift) optCoverlift.checked = false;
  if (!allowExtraOptions && optMaint) optMaint.checked = false;
  if (!swim && optCoverlift2) optCoverlift2.checked = false;
  if (!swim && optSwimFilterset) optSwimFilterset.checked = false;
  if (!swim && optWarmtepompQty) optWarmtepompQty.value = '0';

  if (optBarrelStoveGroup) optBarrelStoveGroup.style.display = showStoveGroup ? '' : 'none';
  if (optBarrelWoodStoveRow) optBarrelWoodStoveRow.style.display = showWoodStove ? '' : 'none';
  if (optBarrelElectricHeaterRow) optBarrelElectricHeaterRow.style.display = showElectricHeater ? '' : 'none';

  if (optBarrelRoofGroup) optBarrelRoofGroup.style.display = showRoofGroup ? '' : 'none';
  if (optBarrelInfraredModuleRow) optBarrelInfraredModuleRow.style.display = showInfraredModule ? '' : 'none';

  if (!showWoodStove && optBarrelWoodStove) optBarrelWoodStove.checked = false;
  if (!showElectricHeater && optBarrelElectricHeater) optBarrelElectricHeater.checked = false;
  if (!showRoofGroup && optBarrelRoofShingles) optBarrelRoofShingles.checked = false;
  if (!showRoofGroup && optBarrelRoofHeather) optBarrelRoofHeather.checked = false;
  if (!showRoofGroup && optBarrelRoofDesign) optBarrelRoofDesign.checked = false;
  if (!showInfraredModule && optBarrelInfraredModule) optBarrelInfraredModule.checked = false;

  const warmtepompQty = swim ? toPositiveInt(optWarmtepompQty?.value) : 0;
  if (optWarmtepompQty && String(warmtepompQty) !== String(optWarmtepompQty.value)) {
    optWarmtepompQty.value = String(warmtepompQty);
  }

  currentOverkappingScreenOptions.forEach(option => {
    const input = getOverkappingScreenQtyInput(option.id);
    if (!input) return;
    setNumberInputValue(input, input.value);
  });

  const coverliftLine = (allowCoverlift && optCoverlift?.checked) ? PRICES.coverlift_unit : 0;
  const coverlift2Line = (swim && optCoverlift2?.checked) ? PRICES.coverlift_unit : 0;
  const maintLine = (allowExtraOptions && optMaint?.checked) ? PRICES.maintenance_unit : 0;
  const swimFiltersetLine = (swim && optSwimFilterset?.checked) ? PRICES.swim_filterset_unit : 0;
  const warmtepompLine = warmtepompQty * PRICES.warmtepomp_unit;
  const overkappingScreenLine = isQuantityVariantProduct(currentProduct) ? 0 : getOverkappingScreenTotal();

  const barrelWoodStoveLine = (showWoodStove && optBarrelWoodStove?.checked) ? PRICES.barrel_wood_stove_unit : 0;
  const barrelElectricHeaterLine = (showElectricHeater && optBarrelElectricHeater?.checked) ? PRICES.barrel_electric_heater_unit : 0;
  const barrelRoofShinglesLine = (showRoofGroup && optBarrelRoofShingles?.checked) ? PRICES.barrel_roof_shingles_unit : 0;
  const barrelRoofHeatherLine = (showRoofGroup && optBarrelRoofHeather?.checked) ? PRICES.barrel_roof_heather_unit : 0;
  const barrelRoofDesignLine = (showRoofGroup && optBarrelRoofDesign?.checked) ? PRICES.barrel_roof_design_unit : 0;
  const barrelInfraredModuleLine = (showInfraredModule && optBarrelInfraredModule?.checked) ? PRICES.barrel_infrared_module_unit : 0;

  if (optCoverliftTotal) optCoverliftTotal.textContent = euro(coverliftLine);
  if (optCoverlift2Total) optCoverlift2Total.textContent = euro(coverlift2Line);
  if (optMaintTotal) optMaintTotal.textContent = euro(maintLine);
  if (optSwimFiltersetTotal) optSwimFiltersetTotal.textContent = euro(swimFiltersetLine);
  if (optWarmtepompTotal) optWarmtepompTotal.textContent = euro(warmtepompLine);
  if (optBarrelWoodStoveTotal) optBarrelWoodStoveTotal.textContent = euro(barrelWoodStoveLine);
  if (optBarrelElectricHeaterTotal) optBarrelElectricHeaterTotal.textContent = euro(barrelElectricHeaterLine);
  if (optBarrelRoofShinglesTotal) optBarrelRoofShinglesTotal.textContent = euro(barrelRoofShinglesLine);
  if (optBarrelRoofHeatherTotal) optBarrelRoofHeatherTotal.textContent = euro(barrelRoofHeatherLine);
  if (optBarrelRoofDesignTotal) optBarrelRoofDesignTotal.textContent = euro(barrelRoofDesignLine);
  if (optBarrelInfraredModuleTotal) optBarrelInfraredModuleTotal.textContent = euro(barrelInfraredModuleLine);

  const optionsTotal =
    inst +
    -promoDiscountLine +
    coverliftLine +
    coverlift2Line +
    maintLine +
    swimFiltersetLine +
    warmtepompLine +
    overkappingScreenLine +
    barrelWoodStoveLine +
    barrelElectricHeaterLine +
    barrelRoofShinglesLine +
    barrelRoofHeatherLine +
    barrelRoofDesignLine +
    barrelInfraredModuleLine;

  const grand = productPriceValue + optionsTotal;

  if (tProduct) tProduct.textContent = euro(productPriceValue);
  if (tOptions) tOptions.textContent = euro(optionsTotal);
  if (tGrand) tGrand.textContent = euro(grand);
}

function wireOptionHandlers() {
  if (optionHandlersWired) return;
  optionHandlersWired = true;

  const ids = [
    'optCoverlift',
    'optPromoDiscount',
    'optCoverlift2',
    'optMaint',
    'optSwimFilterset',
    'optWarmtepompQty',
    'optBarrelWoodStove',
    'optBarrelElectricHeater',
    'optBarrelRoofShingles',
    'optBarrelRoofHeather',
    'optBarrelRoofDesign',
    'optBarrelInfraredModule'
  ];

  ids.forEach(id => {
    const el = $(id);
    if (!el) return;
    el.addEventListener('input', updateOptionUI);
    el.addEventListener('change', updateOptionUI);
  });

  const optWarmtepompMinus = $('optWarmtepompMinus');
  const optWarmtepompPlus = $('optWarmtepompPlus');
  const optWarmtepompQty = $('optWarmtepompQty');

  if (optWarmtepompMinus && optWarmtepompQty) {
    optWarmtepompMinus.addEventListener('click', () => {
      const current = toPositiveInt(optWarmtepompQty.value);
      setNumberInputValue(optWarmtepompQty, current - 1);
      updateOptionUI();
    });
  }

  if (optWarmtepompPlus && optWarmtepompQty) {
    optWarmtepompPlus.addEventListener('click', () => {
      const current = toPositiveInt(optWarmtepompQty.value);
      setNumberInputValue(optWarmtepompQty, current + 1);
      updateOptionUI();
    });
  }
}

function getSelectedOfferLines() {
  if (!currentProduct) return [];

  const type = currentProduct.type || '';
  const lines = [];
  const allowCoverlift = extraOptionsAllowed(type) && !isRoundSpaWithoutCoverlift(currentProduct);
  const showSpaColors = hasSpaColorOptions(type);
  const quantityVariantProduct = isQuantityVariantProduct(currentProduct);
  const innerColor = showSpaColors ? ($('spaInnerColor')?.value || '') : '';
  const cabinetColor = showSpaColors ? ($('spaCabinetColor')?.value || '') : '';

  let productLabel = currentProduct.title || 'Product';
  const detailParts = [];

  if (selectedVariant?.label) {
    detailParts.push(`${getVariantLabel(currentProduct)}: ${selectedVariant.label}`);
  }

  if (innerColor) detailParts.push(`${innerColor}`);
  if (cabinetColor) detailParts.push(`${cabinetColor}`);

  if (detailParts.length) {
    productLabel += ` <span style="font-weight:400;color:#475569;">(${escapeHtml(detailParts.join(' - '))})</span>`;
  }

  if (!quantityVariantProduct) {
    lines.push({
      label: productLabel,
      price: getCurrentProductPriceValue(),
      is_html: true
    });
  }

  const promotion = getProductPromotion(currentProduct);
  const promoDiscount = getPromotionDiscountAmount();

  if (!quantityVariantProduct && promotion && promoDiscount > 0) {
    lines.push({
      label: promotion.label,
      price: -promoDiscount
    });
  }

  lines.push(...getOverkappingScreenOfferLines());

  const installation = installCost(type);

  if (installation > 0) {
    lines.push({
      label: 'Levering & installatie',
      price: installation
    });
  }

  if (extraOptionsAllowed(type)) {
    lines.push({
      label: 'Cover & trap inclusief',
      price: 0
    });
  }

  if ($('optCoverlift')?.checked && allowCoverlift) {
    lines.push({ label: 'Coverlift', price: PRICES.coverlift_unit });
  }

  if ($('optCoverlift2')?.checked && isSwimspa(type)) {
    lines.push({ label: '2e Coverlift', price: PRICES.coverlift_unit });
  }

  if ($('optMaint')?.checked && extraOptionsAllowed(type)) {
    lines.push({ label: 'Onderhoudspakket', price: PRICES.maintenance_unit });
  }

  if ($('optSwimFilterset')?.checked && isSwimspa(type)) {
    lines.push({ label: 'Filterset (zwemspa)', price: PRICES.swim_filterset_unit });
  }

  const warmtepompQty = isSwimspa(type) ? toPositiveInt($('optWarmtepompQty')?.value) : 0;
  if (warmtepompQty > 0) {
    lines.push({
      label: `Warmtepomp incl. afstelling x ${warmtepompQty}`,
      price: warmtepompQty * PRICES.warmtepomp_unit
    });
  }

  if ($('optBarrelWoodStove')?.checked && isOutdoorSaunaWithRoofAndStove(type)) {
    lines.push({ label: 'Houtkachel + rookafvoer', price: PRICES.barrel_wood_stove_unit });
  }

  if ($('optBarrelElectricHeater')?.checked && isSauna(type)) {
    lines.push({ label: 'Elektrische kachel 8 kW', price: PRICES.barrel_electric_heater_unit });
  }

  if ($('optBarrelRoofShingles')?.checked && isOutdoorSaunaWithRoofAndStove(type)) {
    lines.push({ label: 'Shingles dak', price: PRICES.barrel_roof_shingles_unit });
  }

  if ($('optBarrelRoofHeather')?.checked && isOutdoorSaunaWithRoofAndStove(type)) {
    lines.push({ label: 'Heidedak', price: PRICES.barrel_roof_heather_unit });
  }

  if ($('optBarrelRoofDesign')?.checked && isOutdoorSaunaWithRoofAndStove(type)) {
    lines.push({ label: 'Design dak', price: PRICES.barrel_roof_design_unit });
  }

  if ($('optBarrelInfraredModule')?.checked && isBarrelSauna(type)) {
    lines.push({ label: 'Infrarood module', price: PRICES.barrel_infrared_module_unit });
  }

  return lines;
}

function printProductFiche(p) {
  const win = window.open('', '_blank');
  if (!win) return;

  const specs = getVisibleSpecs(p).map(s =>
    `<tr><td><strong>${escapeHtml(s.label)}</strong></td><td>${escapeHtml(s.value)}</td></tr>`
  ).join('');

  const img = p.image
    ? `<img src="${escapeHtml(p.image)}" style="width:100%;max-width:760px;border:1px solid #ddd;border-radius:12px;margin:10px 0">`
    : '';

  win.document.write(`
    <html>
      <head>
        <meta charset="utf-8">
        <title>${escapeHtml(p.title || 'Product')}</title>
        <style>
          body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;margin:24px;color:#111}
          h1{margin:0 0 6px 0}
          .meta{color:#333;margin:0 0 10px 0}
          table{width:100%;border-collapse:collapse;margin-top:12px}
          td{border-bottom:1px solid #eee;padding:8px 0;vertical-align:top}
          td:first-child{width:220px}
        </style>
      </head>
      <body>
        <h1>${escapeHtml(p.title || '')}</h1>
        <div class="meta">
          Type: ${escapeHtml(p.type || '—')}<br>
          Prijs: ${displayPrice(p)}
        </div>
        ${img}
        <table>${specs}</table>
        <script>window.onload=()=>window.print();</script>
      </body>
    </html>
  `);

  win.document.close();
}

function getTermsHtml(type, validUntil) {
  const terms = [];

  terms.push(`<li>Prijzen zijn exclusief kraankosten tenzij anders vermeld.<br>
  Levering & plaatsing volgens afgesproken voorwaarden (voldoende doorgang, geen obstakels & hulp)<br>
  Betalingsvoorwaarden: 10% voorschot bij bestelling, restbedrag uiterlijk één week vóór levering.</li>`);

  if (isJacuzzi(type) || isSwimspa(type)) {
    terms.push(`
      <li>
        Sunspa Benelux verleent een garantie van 5 jaar op de kuip,
        2 jaar op de technische en elektronische onderdelen
        en 1 jaar op de UV vanaf de datum van levering.
      </li>
    `);
  } else if (isInfrared(type)) {
    terms.push(`
      <li>
        Sunspa Benelux verleent een garantie van 20 jaar op de full spectrum stralers
        en 2 jaar op de technische en elektronische onderdelen vanaf de dag van levering.
        Stralers dienen altijd door de klant zelf vervangen te worden,
        ook tijdens de garantieperiode.
      </li>
    `);
  } else if (isSauna(type) || isBarrelSauna(type)) {
    terms.push(`
      <li>
        Sunspa Benelux verleent een garantie van 2 jaar op de technische en elektronische onderdelen
        vanaf de datum van levering. Door logistieke reden kan het inpakmateriaal niet terug meegenomen worden.
      </li>
    `);
  }

  return terms.join('');
}

function normalizeSchemaText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function productMatchesSchemaModel(product, models) {
  const haystack = normalizeSchemaText(`${product?.title || ''} ${product?.id || ''}`);
  return models.some(model => haystack.includes(normalizeSchemaText(model)));
}

function getElectricalSchemaMatch(product) {
  if (!product || (!isJacuzzi(product.type) && !isSwimspa(product.type))) return null;

  const brand = normalizeSchemaText(getMerk(product));
  const title = normalizeSchemaText(product.title);

  if (brand.includes('vogue') || title.includes('vogue')) {
    return { sectionKey: 'vogue spa', summaryKey: 'alle modellen' };
  }

  const matches = [
    {
      sectionKey: 'sunspa spa',
      summaryKey: 'marbella marrakech milano monaco new york nice san marino',
      models: ['Marbella', 'Marrakech', 'Milano', 'Monaco', 'New York', 'Nice', 'San Marino']
    },
    {
      sectionKey: 'sunspa spa',
      summaryKey: 'lima london napoli orlando palermo tenerife san diego vancouver',
      models: ['Lima', 'London', 'Napoli', 'Orlando', 'Palermo', 'Tenerife', 'San Diego', 'Vancouver']
    },
    {
      sectionKey: 'sunspa spa',
      summaryKey: 'lyon palm springs roma',
      models: ['Lyon', 'Palm Springs', 'Roma']
    },
    {
      sectionKey: 'sunspa zwemspa',
      summaryKey: 'silverline pluto mississippi goldline mars pacific calgary merkur everglade',
      models: ['Silverline', 'Pluto', 'Mississippi', 'Goldline', 'Mars', 'Pacific', 'Calgary', 'Merkur', 'Everglade'],
      swimspaOnly: true
    },
    {
      sectionKey: 'sunspa zwemspa',
      summaryKey: 'alicante catana standaard catana platinum jupiter saturn galaxy milkyway',
      models: ['Alicante', 'Catana Standaard', 'Catana Platinum', 'Jupiter', 'Saturn', 'Galaxy', 'Milkyway'],
      swimspaOnly: true
    },
    {
      sectionKey: 'myspa spa',
      summaryKey: 'nashville boston',
      models: ['Nashville', 'Boston']
    },
    {
      sectionKey: 'myspa spa',
      summaryKey: 'colorado double dutch houston lake city quebec',
      models: ['Colorado', 'Double Dutch', 'Houston', 'Lake City', 'Quebec']
    },
    {
      sectionKey: 'myspa spa',
      summaryKey: 'grand canyon seattle',
      models: ['Grand Canyon', 'Seattle']
    },
    {
      sectionKey: 'overige spa',
      summaryKey: 'promotie',
      models: ['Plug and Play', 'Plug and play', 'Promotie', 'DELight', 'Delight']
    }
  ];

  const exactMatch = matches.find(match => {
    if (match.swimspaOnly && !isSwimspa(product.type)) return false;
    if (!match.swimspaOnly && isSwimspa(product.type) && !normalizeSchemaText(match.sectionKey).includes('zwemspa')) return false;
    return productMatchesSchemaModel(product, match.models);
  });

  if (exactMatch) return exactMatch;

  if (isJacuzzi(product.type)) {
    return { sectionKey: 'overige spa', summaryKey: 'promotie' };
  }

  return null;
}

function findElectricalDetails(doc, match) {
  const sectionTitle = Array.from(doc.querySelectorAll('.accordion_title'))
    .find(title => normalizeSchemaText(title.textContent).includes(normalizeSchemaText(match.sectionKey)));

  const accordion = sectionTitle?.nextElementSibling;
  if (!accordion) return null;

  const details = Array.from(accordion.querySelectorAll('details'));
  return details.find(item => {
    const summary = item.querySelector('summary');
    return normalizeSchemaText(summary?.textContent).includes(normalizeSchemaText(match.summaryKey));
  }) || null;
}

function cleanElectricalContentHtml(html) {
  const template = document.createElement('template');
  template.innerHTML = html;

  template.content.querySelectorAll('script, style, iframe, object, embed, link').forEach(el => el.remove());
  template.content.querySelectorAll('*').forEach(el => {
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.toLowerCase().startsWith('on')) el.removeAttribute(attr.name);
    });
  });

  return template.innerHTML;
}

async function getElectricalSchemaForProduct(product) {
  const match = getElectricalSchemaMatch(product);
  if (!match) return null;

  try {
    const res = await fetch(ELECTRICAL_SCHEMA_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Kan stroom.html niet laden (${res.status})`);

    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const details = findElectricalDetails(doc, match);
    if (!details) return null;

    const sectionTitle = details.closest('.accordion')?.previousElementSibling?.textContent?.trim() || 'Elektrische aansluiting';
    const summary = details.querySelector('summary')?.textContent?.trim() || '';
    const content = details.querySelector('.accordion-content');
    if (!content) return null;

    return {
      sectionTitle,
      summary,
      contentHtml: cleanElectricalContentHtml(content.innerHTML)
    };
  } catch (err) {
    console.warn('Stroomschema kon niet geladen worden voor de offerte.', err);
    return null;
  }
}

function getElectricalSchemaPageHtml(schema, product) {
  const deliveryAccess = getSpaDeliveryAccess(product);
  if (!schema && !deliveryAccess) return '';

  const logo = COMPANY_LOGO_URL
    ? `<img src="${escapeHtml(COMPANY_LOGO_URL)}" alt="${escapeHtml(COMPANY_NAME)}" class="offer-logo electrical-logo">`
    : '';
  const electricalCardHtml = schema
    ? `<div class="electrical-card">${schema.contentHtml}</div>`
    : '';
  const deliveryMeasureHtml = deliveryAccess?.craneOnly
    ? `
        <p class="delivery-crane-message">
          Deze spa kan door de afmeting enkel geleverd worden met een kraanfirma. Deze kosten zijn ten laste van de klant.
        </p>
      `
    : `
        <div class="delivery-grid">
          <div>
            <span>Afmeting spa</span>
            <strong>${escapeHtml(deliveryAccess?.dimensions.raw || '')}</strong>
          </div>
          <div>
            <span>Vrije breedte doorgang</span>
            <strong>${formatCm(deliveryAccess?.passageWidth)}</strong>
            <small>hoogte spa + ${SPA_DELIVERY_MARGIN_CM} cm, minimum ${SPA_MIN_PASSAGE_WIDTH_CM} cm</small>
          </div>
          <div>
            <span>Vrije hoogte doorgang</span>
            <strong>${formatCm(deliveryAccess?.passageHeight)}</strong>
            <small>kortste zijde spa + ${SPA_DELIVERY_MARGIN_CM} cm</small>
          </div>
        </div>
      `;
  const deliveryCraneTermHtml = deliveryAccess?.craneOnly
    ? ''
    : '<li>Indien de hierboven vermelde minimum afmetingen niet kunnen worden voorzien, wordt de spa enkel geleverd met een kraan. Kosten hiervan zijn ten laste van de klant.</li>';
  const deliveryIntroText = deliveryAccess?.craneOnly
    ? 'Voor deze spa moet de volledige doorgang vrij en bereikbaar zijn, zonder enige obstakels zoals trappen, hoogteverschillen, hellingen of andere belemmeringen.'
    : 'Voor deze spa moet de volledige doorgang vrij en bereikbaar zijn volgens onderstaande minimale maten, zonder enige obstakels zoals trappen, hoogteverschillen, hellingen of andere belemmeringen.';
  const deliveryAccessHtml = deliveryAccess
    ? `
        <div class="delivery-card">
          <h2>Doorgang en voorwaarden levering</h2>
          <p class="delivery-card-intro">
            ${deliveryIntroText}
          </p>
          ${deliveryMeasureHtml}
          <ul class="delivery-terms">
            <li>Klaarleggen van stroomkabel volgens hierboven vermeld schema, is de verantwoordelijkheid van de klant.</li>
            <li>De klant voorziet bij levering twee extra mankrachten om de spa veilig te kunnen kantelen en begeleiden.</li>
            ${deliveryCraneTermHtml}
            <li>Indien op de leveringsdag blijkt dat een of meerdere voorwaarden niet voldaan zijn, gaat de levering niet door waarbij alle hieruit voortvloeiende kosten integraal ten laste van de klant zijn.</li>
          </ul>
        </div>
        <div class="delivery-acceptance">
          <p>De klant verklaart deze leveringsvoorwaarden vooraf te hebben ontvangen, gelezen en aanvaard.</p>
          <div class="delivery-signature-grid">
            <div class="delivery-signature-box">
              <div class="signature-label">Naam klant</div>
              <div class="signature-line"></div>
            </div>
            <div class="delivery-signature-box">
              <div class="signature-label">Handtekening</div>
              <div class="signature-line"></div>
            </div>
          </div>
        </div>
      `
    : '';

  return `
    <section class="sheet electrical-sheet">
      <div class="electrical-header">
        <div class="brand">${logo}</div>
        <div>
          <div class="electrical-eyebrow">Technische info</div>
          <h1>LEVERINGSVOORWAARDEN</h1>
        </div>
      </div>
      <div class="electrical-content">
        <div class="electrical-intro">
          <strong>Info voor:</strong>
          <span>${escapeHtml(product?.title || '')}</span>
        </div>
        ${electricalCardHtml}
        ${deliveryAccessHtml}
      </div>
    </section>
  `;
}

function printSixPercentForm() {
  if (!currentProduct || !isMainOverkappingProduct(currentProduct)) return;

  const productForForm = currentProduct;
  const win = window.open('', '_blank');
  if (!win) return;

  const today = new Date();
  const logoHtml = COMPANY_LOGO_URL
    ? `<img src="${escapeHtml(COMPANY_LOGO_URL)}" alt="${escapeHtml(COMPANY_NAME)}" class="offer-logo">`
    : '';

  const companyInfo = [
    COMPANY_NAME,
    COMPANY_PHONE,
    COMPANY_EMAIL,
    COMPANY_WEBSITE
  ].filter(Boolean).map(value => `<div>${escapeHtml(value)}</div>`).join('');

  const productTitleHtml = escapeHtml(productForForm.title || '-');

  win.document.open();
  win.document.write(`
    <!doctype html>
    <html lang="nl">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>6% formulier ${productTitleHtml}</title>
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
            line-height: 1.45;
          }

          body {
            padding: 14px;
          }

          .sheet {
            width: 100%;
            max-width: 194mm;
            min-height: 281mm;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 18px;
            box-shadow: 0 18px 40px rgba(15, 23, 42, 0.14);
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }

          .header {
            background: #ffffff;
            color: #274863;
            padding: 16px 22px 10px;
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
            min-width: 0;
            flex: 1 1 auto;
          }

          .offer-logo {
            width: 272px;
            max-width: 100%;
            height: auto;
            display: block;
            background: #ffffff;
            padding: 8px;
          }

          .meta-box {
            flex: 0 0 280px;
            width: 280px;
            min-width: 280px;
            background: #f6f9fc;
            border: 1px solid #dbe3ec;
            border-radius: 12px;
            padding: 14px 16px;
          }

          .meta-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 14px;
            padding: 4px 0;
          }

          .meta-label {
            font-size: 12px;
            font-weight: 700;
            color: #4b6483;
          }

          .meta-value {
            font-size: 12px;
            font-weight: 700;
            color: #0f172a;
            text-align: right;
          }

          .content {
            padding: 10px 22px 18px;
            display: flex;
            flex: 1 1 auto;
            flex-direction: column;
            gap: 14px;
          }

          .card {
            border: 1px solid #dbe3ec;
            border-radius: 12px;
            padding: 16px 18px;
            background: #ffffff;
          }

          .eyebrow {
            margin: 0 0 6px;
            color: #407298;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          h1 {
            margin: 0 0 8px;
            font-size: 28px;
            line-height: 1.08;
            color: #0f172a;
          }

          .intro {
            margin: 0;
            font-size: 14px;
            color: #334155;
          }

          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px 18px;
          }

          .field-block {
            display: flex;
            flex-direction: column;
            gap: 6px;
            min-width: 0;
          }

          .field-block.full {
            grid-column: 1 / -1;
          }

          .field-label {
            font-size: 12px;
            font-weight: 700;
            color: #274863;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .field-value {
            min-height: 24px;
            padding-bottom: 6px;
            border-bottom: 1px solid #64748b;
            font-size: 14px;
            font-weight: 600;
            color: #0f172a;
          }

          .field-value-static {
            min-height: 24px;
            font-size: 14px;
            font-weight: 600;
            color: #0f172a;
          }

          .conditions {
            margin: 0;
            padding-left: 20px;
            color: #334155;
          }

          .conditions li {
            margin: 0 0 8px;
          }

          .warning-box {
            background: #fff7ed;
            border: 1px solid #fdba74;
            border-radius: 12px;
            padding: 14px 16px;
          }

          .warning-title {
            margin: 0 0 8px;
            color: #9a3412;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .warning-box p {
            margin: 0 0 8px;
            color: #7c2d12;
            font-size: 13px;
          }

          .warning-box p:last-child {
            margin-bottom: 0;
          }

          .bottom-fixed {
            margin-top: auto;
            padding-top: 6px;
          }

          .signature-section {
            padding-top: 12px;
            border-top: 1px solid #dbe3ec;
          }

          .signature-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px 24px;
          }

          .signature-label {
            margin-bottom: 22px;
            font-size: 16px;
            font-weight: 700;
            color: #274863;
          }

          .signature-line {
            border-bottom: 1px solid #64748b;
            height: 18px;
          }

          .footer {
            margin-top: 14px;
            padding-top: 10px;
            border-top: 1px solid #dbe3ec;
            display: flex;
            justify-content: space-between;
            gap: 20px;
            color: #64748b;
            font-size: 12px;
          }

          .footer strong {
            color: #0f172a;
          }

          @media print {
            html,
            body {
              width: 210mm;
              min-height: 297mm;
              height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
            }

            body {
              padding: 0 !important;
              font-size: 11px !important;
              line-height: 1.34 !important;
            }

            .sheet {
              width: 194mm !important;
              max-width: 194mm !important;
              min-height: 281mm !important;
              margin: 0 auto !important;
              border: none !important;
              border-radius: 0 !important;
              box-shadow: none !important;
            }

            .header {
              padding: 4mm 6mm 2.5mm !important;
            }

            .header-top {
              gap: 6mm !important;
            }

            .offer-logo {
              width: 72mm !important;
              padding: 2.5mm !important;
            }

            .meta-box {
              width: 66mm !important;
              min-width: 66mm !important;
              flex-basis: 66mm !important;
              border-radius: 10px !important;
              padding: 4mm 5mm !important;
            }

            .meta-row {
              padding: 1.2mm 0 !important;
            }

            .meta-label,
            .meta-value {
              font-size: 10px !important;
            }

            .content {
              padding: 4mm 6mm 5mm !important;
              gap: 3mm !important;
            }

            .card {
              border-radius: 10px !important;
              padding: 4mm !important;
              page-break-inside: avoid !important;
            }

            h1 {
              font-size: 23px !important;
              margin-bottom: 2mm !important;
            }

            .eyebrow,
            .field-label,
            .warning-title {
              font-size: 9px !important;
            }

            .intro,
            .field-value,
            .field-value-static,
            .conditions li,
            .warning-box p,
            .footer {
              font-size: 10px !important;
            }

            .info-grid,
            .signature-grid {
              gap: 4mm 5mm !important;
            }

            .field-value {
              min-height: 7mm !important;
              padding-bottom: 1.6mm !important;
            }

            .field-value-static {
              min-height: auto !important;
            }

            .signature-label {
              margin-bottom: 6mm !important;
              font-size: 12px !important;
            }

            .signature-line {
              height: 4mm !important;
            }

            .footer {
              margin-top: 3mm !important;
              padding-top: 2mm !important;
            }
          }
        </style>
      </head>
      <body>
        <section class="sheet">
          <div class="header">
            <div class="header-top">
              <div class="brand">
                ${logoHtml}
              </div>
              <div class="meta-box">
                <div class="meta-row">
                  <div class="meta-label">Datum</div>
                  <div class="meta-value">${formatDateBelgium(today)}</div>
                </div>
                <div class="meta-row">
                  <div class="meta-label">Product</div>
                  <div class="meta-value">${productTitleHtml}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="content">
            <div class="card">
              <div class="eyebrow">6% formulier</div>
              <h1>Klantverklaring toepassing 6% btw</h1>
            </div>

            <div class="card">
              <div class="eyebrow">Projectgegevens</div>
              <div class="info-grid">
                <div class="field-block">
                  <div class="field-label">Product</div>
                  <div class="field-value-static">${productTitleHtml}</div>
                </div>
                <div class="field-block">
                  <div class="field-label">Datum</div>
                  <div class="field-value"></div>
                </div>
                <div class="field-block full">
                  <div class="field-label">Adres van de woning</div>
                  <div class="field-value"></div>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="eyebrow">Verklaring klant</div>
              <ol class="conditions">
                <li>De werken hebben betrekking op een woning in Belgi&euml;.</li>
                <li>De woning is minstens 10 jaar oud (eerste ingebruikname minstens 10 jaar geleden).</li>
                <li>De woning wordt hoofdzakelijk als priv&eacute;woning gebruikt (minstens 50% priv&eacute;).</li>
                <li>De werken zijn een verbetering, verfraaiing of renovatie van de bestaande woning.</li>
                <li>De overkapping moet gemonteerd worden door de firma.</li>
                <li>De constructie is duurzaam verbonden met de woning of het perceel, bijvoorbeeld tegen de gevel gemonteerd, op een vaste fundering geplaatst of bedoeld als vaste, niet-verplaatsbare structuur.</li>
                <li>De gegevens die de klant doorgeeft zijn correct.</li>
              </ol>
            </div>

            <div class="warning-box">
              <div class="warning-title">Belangrijke verantwoordelijkheid van de klant</div>
              <p>
                De klant blijft volledig verantwoordelijk dat deze voorwaarden kloppen in de eigen situatie thuis.
                Indien bij controle blijkt dat dit niet zo is, blijft het resterende btw-bedrag verplicht nog te betalen.
                Dit is altijd volledig ten laste van de klant.
              </p>
            </div>

            <div class="bottom-fixed">
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
                </div>
              </div>

              <div class="footer">
                <div>Door ondertekening bevestigt de klant bovenstaande verklaring gelezen en begrepen te hebben.</div>
                <div>${companyInfo}</div>
              </div>
            </div>
          </div>
        </section>

        <script>
          window.onload = function () {
            setTimeout(function () {
              window.print();
            }, 250);
          };
        </script>
      </body>
    </html>
  `);
  win.document.close();
}

async function printOfferte() {
  if (!currentProduct) return;

  const productForOffer = currentProduct;
  const win = window.open('', '_blank');
  if (!win) return;

  win.document.open();
  win.document.write('<!doctype html><html lang="nl"><head><meta charset="utf-8"><title>Offerte laden...</title></head><body>Offerte wordt voorbereid...</body></html>');
  win.document.close();

  const customer = getCustomerData();
  const lines = getSelectedOfferLines();
  const totalIncl = lines.reduce((sum, l) => sum + Number(l.price || 0), 0);
  const subtotal = totalIncl / 1.21;
  const btw = totalIncl - subtotal;

  const today = new Date();
  const validUntil = addDays(today, 14);
  const offerNumber = `OFF-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

  const rows = lines.map((line, index) => `
    <tr>
      <td class="col-num">${index + 1}</td>
      <td class="col-desc">${line.is_html ? line.label : escapeHtml(line.label)}</td>
      <td class="col-price">${euro(line.price)}</td>
    </tr>
  `).join('');

  const logoHtml = COMPANY_LOGO_URL
    ? `<img src="${escapeHtml(COMPANY_LOGO_URL)}" alt="${escapeHtml(COMPANY_NAME)}" class="offer-logo">`
    : '';

  const companyInfo = [
    COMPANY_NAME,
    COMPANY_PHONE,
    COMPANY_EMAIL,
    COMPANY_WEBSITE
  ].filter(Boolean).map(v => `<div>${escapeHtml(v)}</div>`).join('');

  const productTitleHtml = escapeHtml(productForOffer.title || '—');
  const productType = productForOffer.type || '';
  const termsHtml = getTermsHtml(productType, validUntil);
  const electricalSchema = await getElectricalSchemaForProduct(productForOffer);
  const electricalSchemaHtml = getElectricalSchemaPageHtml(electricalSchema, productForOffer);
  const offerSheetClass = electricalSchemaHtml ? 'sheet offer-sheet has-next-page' : 'sheet offer-sheet';

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
  
 .info-grid-single {
  display: grid;
  grid-template-columns: 1fr;
  width: 100%;
}

.customer-card {
  width: 100%;
  max-width: none;
  display: block;
}

.customer-inline-grid {
  display: grid;
  gap: 10px 24px;
  width: 100%;
  grid-template-columns: 1fr 1fr;
}

.offer-meta-line {
  width: 26mm !important;
  height: 10px !important;
  border-bottom: 1px solid #64748b !important;
}

.field-inline {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.field-inline-full {
  grid-column: 1 / -1;
}

.label-inline {
  min-width: 70px;
  font-weight: 700;
  font-size: 14px;
  color: #0f172a;
  white-space: nowrap;
}

.line-inline {
  flex: 1;
  min-width: 0;
  border-bottom: 1.5px solid #64748b;
  height: 16px;
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

  .brand-copy {
    min-width: 0;
  }

  .brand-title {
    margin: 0 0 10px 0;
    font-size: 42px;
    line-height: 0.98;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #ffffff;
  }

  .brand-meta {
    font-size: 15px;
    line-height: 1.45;
    color: rgba(255, 255, 255, 0.98);
  }

  .brand-meta div {
    margin: 2px 0;
  }

  .offer-meta {
    min-width: 280px;
    padding: 18px 22px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.14);
    border: 1px solid rgba(255, 255, 255, 0.18);
    backdrop-filter: blur(3px);
  }

  .offer-meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 24px;
    padding: 4px 0;
  }

  .offer-meta-label {
    font-size: 15px;
    font-weight: 700;
    color: #ffffff;
  }

  .offer-meta-value {
    font-size: 15px;
    font-weight: 800;
    color: #ffffff;
    text-align: right;
    white-space: nowrap;
  }

  .content {
    padding: 28px 32px 28px;
  }

  .intro {
    margin-bottom: 22px;
  }

  .intro h2 {
    margin: 0 0 10px 0;
    font-size: 32px;
    line-height: 1.1;
    font-weight: 800;
    color: #0f172a;
  }

  .intro p {
    margin: 0;
    font-size: 15px;
    color: #475569;
  }

  .info-grid {
    display: grid;
    gap: 18px;
    margin-bottom: 18px;
  }

  .card {
    background: #f8fafc;
    border: 1px solid #d7e0e9;
    border-radius: 18px;
    padding: 18px 20px;
  }

  .card-title {
    margin: 0 0 14px 0;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #4f6f96;
  }

  .card-line {
    margin: 8px 0;
    font-size: 14px;
    color: #0f172a;
  }

  .card-line strong {
    font-weight: 800;
    display: inline-block;
    margin-bottom: 14px;
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

  tbody tr:last-child td {
    border-bottom: none;
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
  justify-content: space-between; /* BELANGRIJK */
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

  .summary-row:last-child {
    border-bottom: none;
  }

  .summary-row strong {
    font-weight: 800;
  }

  .summary-row.total {
    background: #f3f7fb;
    color: #314f72;
    font-size: 17px;
    font-weight: 800;
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

.signature-box {
  min-width: 0;
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

  .footer strong {
    color: #0f172a;
  }

  .electrical-sheet {
    margin-top: 18px;
  }

  .electrical-header {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 24px;
    align-items: center;
    padding: 28px 32px 22px;
    background: #eef3f8;
    border-bottom: 1px solid #d7e0e9;
  }

  .electrical-logo {
    width: 180px;
  }

  .electrical-eyebrow {
    margin-bottom: 6px;
    color: #4f6f96;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .electrical-header h1 {
    margin: 0 0 8px 0;
    color: #0f172a;
    font-size: 30px;
    line-height: 1.08;
  }

  .electrical-header p {
    margin: 0;
    color: #475569;
    font-size: 14px;
    font-weight: 700;
  }

  .electrical-content {
    padding: 24px 32px 28px;
    display: flex;
    flex-direction: column;
  }

  .electrical-intro {
    display: flex;
    gap: 10px;
    margin-bottom: 16px;
    padding: 12px 14px;
    border: 1px solid #d7e0e9;
    border-radius: 14px;
    background: #f8fafc;
    color: #0f172a;
  }

  .electrical-card {
    padding: 18px 20px;
    border: 1px solid #d7e0e9;
    border-radius: 16px;
    background: #ffffff;
    color: #0f172a;
  }

  .electrical-card p {
    margin: 0 0 13px;
    font-size: 13px;
    line-height: 1.45;
  }

  .electrical-card p:last-child {
    margin-bottom: 0;
  }

  .electrical-card span[style*="color"] {
    color: #b91c1c !important;
    font-weight: 800;
  }

  .delivery-card {
    margin-top: 18px;
    padding: 18px 20px;
    border: 1px solid #d7e0e9;
    border-radius: 16px;
    background: #ffffff;
    color: #0f172a;
  }

  .delivery-card h2 {
    margin: 0 0 8px;
    font-size: 20px;
    line-height: 1.15;
    color: #0f172a;
  }

  .delivery-card-intro {
    margin: 0 0 14px;
    color: #475569;
    font-size: 13px;
  }

  .delivery-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 14px;
  }

  .delivery-grid div {
    padding: 12px;
    border: 1px solid #dbe3ec;
    border-radius: 12px;
    background: #f8fafc;
  }

  .delivery-grid span,
  .delivery-grid small {
    display: block;
    color: #64748b;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .delivery-grid strong {
    display: block;
    margin: 5px 0 3px;
    color: #0f172a;
    font-size: 18px;
    line-height: 1.1;
  }

  .delivery-grid small {
    color: #475569;
    font-size: 10px;
    font-weight: 700;
    text-transform: none;
    letter-spacing: 0;
  }

  .delivery-crane-message {
    margin: 0 0 14px;
    padding: 14px 16px;
    border: 1px solid #fecaca;
    border-radius: 12px;
    background: #fff1f2;
    color: #991b1b;
    font-size: 15px;
    font-weight: 800;
    line-height: 1.35;
  }

  .delivery-terms {
    margin: 0;
    padding: 12px 14px;
    border: 1px solid #fecaca;
    border-radius: 12px;
    background: #fff1f2;
    color: #991b1b;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.35;
  }

  .delivery-terms li {
    margin: 0 0 8px;
  }

  .delivery-terms li:last-child {
    margin-bottom: 0;
  }

  .delivery-acceptance {
    margin-top: auto;
    padding-top: 18px;
    color: #0f172a;
  }

  .delivery-acceptance p {
    margin: 0 0 18px;
    font-size: 14px;
    font-weight: 700;
  }

  .delivery-signature-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
  }

  .delivery-signature-box {
    min-width: 0;
  }

  @media screen and (max-width: 820px) {
    .header-top,
    .info-grid,
    .product-highlight,
    .footer {

    }

    .offer-meta {
      margin-top: 18px;
      min-width: 0;
    }

    .summary {
      justify-content: stretch;
    }

    .delivery-grid {
      grid-template-columns: 1fr;
    }
    
  }

 @media print {
  html,
  body {
    width: 210mm;
    min-height: 297mm;
    height: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    color: #1f2937 !important;
  }

  body {
    font-size: 11px !important;
    line-height: 1.22 !important;
  }

  .sheet {
    width: 194mm !important;
    max-width: 194mm !important;
    min-height: 281mm !important;
    margin: 0 auto !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
  }

  .offer-sheet {
    height: 281mm !important;
  }

  .offer-sheet.has-next-page {
    page-break-after: always !important;
    break-after: page !important;
  }

  .header {
    background: #ffffff !important;
    color: #274863 !important;
    padding: 4mm 6mm 2mm 6mm !important;
  }

  .header-top {
    display: flex !important;
    justify-content: space-between !important;
    align-items: flex-start !important;
    gap: 6mm !important;
  }

  .brand {
    display: flex !important;
    align-items: flex-start !important;
    min-width: 0 !important;
    flex: 1 1 auto !important;
  }

  .offer-logo {
    width: 72mm !important;
    max-width: 72mm !important;
    height: auto !important;
    display: block !important;
    background: #ffffff !important;
    padding: 2.5mm !important;
  }

  .offer-meta {
    display: block !important;
    flex: 0 0 52mm !important;
    width: 52mm !important;
    min-width: 52mm !important;
    background: #f6f9fc !important;
    border: 1px solid #dbe3ec !important;
    border-radius: 10px !important;
    padding: 4mm 5mm !important;
    color: #274863 !important;
    margin-left: auto !important;
  }

  .offer-meta-row {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    gap: 6mm !important;
    padding: 1.2mm 0 !important;
  }

  .offer-meta-label,
  .offer-meta-value {
    color: #274863 !important;
    font-size: 10px !important;
    font-weight: 700 !important;
    white-space: nowrap !important;
  }

  .content {
    padding: 4mm 6mm 4mm 6mm !important;
    flex: 1 1 auto !important;
    display: flex !important;
    flex-direction: column !important;
  }

  .info-grid {
    display: grid !important;
    gap: 3mm !important;
    margin-bottom: 3mm !important;
  }

  .info-grid-single {
    grid-template-columns: 1fr !important;
    width: 100% !important;
  }

  .customer-card {
    width: 100% !important;
    max-width: none !important;
    display: block !important;
  }

  .customer-inline-grid {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 16px 18px !important;
    width: 100% !important;
  }

  .field-inline {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    min-width: 0 !important;
  }

  .label-inline {
    min-width: 62px !important;
    font-weight: 700 !important;
    font-size: 11px !important;
    color: #0f172a !important;
    white-space: nowrap !important;
  }

  .line-inline {
    flex: 1 !important;
    min-width: 0 !important;
    border-bottom: 1px solid #64748b !important;
    height: 12px !important;
  }

  .card {
    border: 1px solid #dbe3ec !important;
    border-radius: 10px !important;
    padding: 4mm !important;
    background: #ffffff !important;
    page-break-inside: avoid !important;
  }

  .card-title {
    margin: 0 0 2.5mm 0 !important;
    font-size: 10px !important;
    font-weight: 800 !important;
    letter-spacing: 0.06em !important;
    color: #407298 !important;
  }

  .table-wrap {
    border: 1px solid #dbe3ec !important;
    border-radius: 10px !important;
    overflow: hidden !important;
    background: #ffffff !important;
    page-break-inside: avoid !important;
    margin-bottom: 3mm !important;
  }

  table {
    width: 100% !important;
    border-collapse: collapse !important;
  }

  thead th {
    background: #eef3f8 !important;
    color: #314f72 !important;
    padding: 6px 14px !important;
    font-size: 10px !important;
    font-weight: 800 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.06em !important;
    text-align: left !important;
    border-bottom: 1px solid #d7e0e9 !important;
  }

  tbody td {
    padding: 6px 14px !important;
    font-size: 16px !important;
    color: #0f172a !important;
    border-bottom: 1px solid #e9eef4 !important;
    vertical-align: top !important;
  }

  tbody tr:last-child td {
    border-bottom: none !important;
  }

  .col-num {
    width: 10mm !important;
    font-weight: 800 !important;
    color: #475569 !important;
  }

  .col-desc {
    font-weight: 600 !important;
  }

  .offer-meta-line {
  width: 26mm !important;
  height: 10px !important;
  border-bottom: 1px solid #64748b !important;
}

  .col-price {
    width: 34mm !important;
    text-align: right !important;
    white-space: nowrap !important;
    font-weight: 800 !important;
  }

  .summary {
    display: flex !important;
    justify-content: space-between !important;
    align-items: flex-start !important;
    gap: 8mm !important;
    margin-top: 2mm !important;
  }

  .summary-left {
    flex: 1 1 auto !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 8px !important;
    padding-top: 2px !important;
  }

  .summary-line {
    display: flex !important;
    align-items: center !important;
    gap: 10px !important;
    font-size: 11px !important;
    color: #0f172a !important;
  }

  .summary-line span:first-child {
    min-width: 90px !important;
    font-weight: 600 !important;
  }

  .line-fill {
    flex: 1 !important;
    border-bottom: 1px solid #64748b !important;
    height: 10px !important;
  }

  .summary-box {
    width: 320px !important;
    min-width: 54mm !important;
    background: #ffffff !important;
  }

  .summary-row {
    display: flex !important;
    justify-content: space-between !important;
    gap: 4mm !important;
    padding: 4px 10px !important;
    border-bottom: 1px solid #edf2f7 !important;
    font-size: 10px !important;
    color: #0f172a !important;
  }

  .summary-row:last-child {
    border-bottom: none !important;
  }

  .summary-row strong {
    font-weight: 800 !important;
    white-space: nowrap !important;
  }

  .summary-row.total {
    background: #f4f7fa !important;
    color: #274863 !important;
    font-size: 18px !important;
    font-weight: 800 !important;
  }

  .bottom-fixed {
    margin-top: auto !important;
    padding-top: 3mm !important;
  }

  .offer-sheet .bottom-fixed {
    position: static !important;
    flex: 0 0 auto !important;
  }

  .signature-section {
    margin-top: 0 !important;
    padding-top: 3mm !important;
    border-top: 1px solid #dbe3ec !important;
    page-break-inside: avoid !important;
  }

  .signature-grid {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 4mm 6mm !important;
  }

  .signature-box {
    min-width: 0 !important;
  }

  .signature-label {
    font-size: 15px !important;
    font-weight: 700 !important;
    color: #274863 !important;
    margin-bottom: 6mm !important;
  }

  .signature-line {
    border-bottom: 1px solid #64748b !important;
    height: 4mm !important;
  }

  .terms {
    margin-top: 3mm !important;
    padding-top: 3mm !important;
    border-top: 1px solid #dbe3ec !important;
    page-break-inside: avoid !important;
  }

  .terms-title {
    margin: 0 0 2mm 0 !important;
    font-size: 10px !important;
    font-weight: 800 !important;
    letter-spacing: 0.06em !important;
    color: #274863 !important;
  }

  .terms ul {
    margin: 0 !important;
    padding-left: 5mm !important;
  }

  .terms li {
    margin: 0.8mm 0 !important;
    font-size: 8.7px !important;
    line-height: 1.15 !important;
    color: #475569 !important;
  }

  .footer {
    margin-top: 3mm !important;
    padding-top: 2mm !important;
    border-top: 1px solid #dbe3ec !important;
    color: #64748b !important;
    font-size: 8px !important;
    display: flex !important;
    justify-content: space-between !important;
    gap: 4mm !important;
    page-break-inside: avoid !important;
  }

  .footer strong {
    color: #0f172a !important;
  }

  .electrical-sheet {
    width: 194mm !important;
    max-width: 194mm !important;
    min-height: 281mm !important;
    margin: 0 auto !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    overflow: hidden !important;
    page-break-before: always !important;
    break-before: page !important;
    display: flex !important;
    flex-direction: column !important;
  }

  .electrical-header {
    display: grid !important;
    grid-template-columns: auto 1fr !important;
    gap: 6mm !important;
    align-items: center !important;
    padding: 8mm 8mm 6mm !important;
    background: #eef3f8 !important;
    border-bottom: 1px solid #dbe3ec !important;
  }

  .electrical-logo {
    width: 54mm !important;
    max-width: 54mm !important;
    padding: 2mm !important;
  }

  .electrical-eyebrow {
    margin-bottom: 1.5mm !important;
    color: #407298 !important;
    font-size: 9px !important;
    font-weight: 800 !important;
    letter-spacing: 0.06em !important;
    text-transform: uppercase !important;
  }

  .electrical-header h1 {
    margin: 0 0 2mm !important;
    color: #0f172a !important;
    font-size: 23px !important;
    line-height: 1.05 !important;
  }

  .electrical-header p {
    margin: 0 !important;
    color: #475569 !important;
    font-size: 10px !important;
    font-weight: 700 !important;
  }

  .electrical-content {
    padding: 7mm 8mm 8mm !important;
    flex: 1 1 auto !important;
    display: flex !important;
    flex-direction: column !important;
  }

  .electrical-intro {
    display: flex !important;
    gap: 3mm !important;
    margin-bottom: 4mm !important;
    padding: 3mm 4mm !important;
    border: 1px solid #dbe3ec !important;
    border-radius: 10px !important;
    background: #f8fafc !important;
    color: #0f172a !important;
    font-size: 11px !important;
  }

  .electrical-card {
    padding: 5mm !important;
    border: 1px solid #dbe3ec !important;
    border-radius: 10px !important;
    background: #ffffff !important;
    color: #0f172a !important;
  }

  .electrical-card p {
    margin: 0 0 3mm !important;
    font-size: 10px !important;
    line-height: 1.35 !important;
    color: #0f172a !important;
    break-inside: avoid !important;
  }

  .electrical-card p:last-child {
    margin-bottom: 0 !important;
  }

  .electrical-card strong {
    color: #0f172a !important;
  }

  .electrical-card span[style*="color"] {
    color: #b91c1c !important;
    font-weight: 800 !important;
  }

  .delivery-card {
    margin-top: 4mm !important;
    padding: 4mm !important;
    border: 1px solid #dbe3ec !important;
    border-radius: 10px !important;
    background: #ffffff !important;
    color: #0f172a !important;
    page-break-inside: avoid !important;
  }

  .delivery-card h2 {
    margin: 0 0 2mm !important;
    color: #0f172a !important;
    font-size: 15px !important;
    line-height: 1.15 !important;
  }

  .delivery-card-intro {
    margin: 0 0 3mm !important;
    color: #475569 !important;
    font-size: 9.5px !important;
    line-height: 1.25 !important;
  }

  .delivery-grid {
    display: grid !important;
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    gap: 3mm !important;
    margin-bottom: 3mm !important;
  }

  .delivery-grid div {
    padding: 3mm !important;
    border: 1px solid #dbe3ec !important;
    border-radius: 8px !important;
    background: #f8fafc !important;
    min-width: 0 !important;
  }

  .delivery-grid span,
  .delivery-grid small {
    display: block !important;
    color: #64748b !important;
    font-size: 7.5px !important;
    font-weight: 800 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.03em !important;
  }

  .delivery-grid strong {
    display: block !important;
    margin: 1mm 0 0.5mm !important;
    color: #0f172a !important;
    font-size: 14px !important;
    line-height: 1.05 !important;
  }

  .delivery-grid small {
    color: #475569 !important;
    font-size: 7px !important;
    font-weight: 700 !important;
    text-transform: none !important;
    letter-spacing: 0 !important;
  }

  .delivery-crane-message {
    margin: 0 0 3mm !important;
    padding: 3mm !important;
    border: 1px solid #fecaca !important;
    border-radius: 8px !important;
    background: #fff1f2 !important;
    color: #991b1b !important;
    font-size: 10px !important;
    font-weight: 800 !important;
    line-height: 1.25 !important;
  }

  .delivery-terms {
    margin: 0 !important;
    padding: 3mm !important;
    border: 1px solid #fecaca !important;
    border-radius: 8px !important;
    background: #fff1f2 !important;
    color: #991b1b !important;
    font-size: 9px !important;
    font-weight: 700 !important;
    line-height: 1.25 !important;
  }

  .delivery-terms li {
    margin: 0 0 1.5mm !important;
  }

  .delivery-terms li:last-child {
    margin-bottom: 0 !important;
  }

  .delivery-acceptance {
    margin-top: auto !important;
    padding-top: 4mm !important;
    color: #0f172a !important;
    page-break-inside: avoid !important;
  }

  .delivery-acceptance p {
    margin: 0 0 6mm !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    line-height: 1.25 !important;
    color: #0f172a !important;
  }

  .delivery-signature-grid {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 6mm !important;
  }

  .delivery-signature-box {
    min-width: 0 !important;
  }
}
</style>
      </head>
      <body>
        <div class="${offerSheetClass}">
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

      <div class="info-grid info-grid-single">
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
        ${electricalSchemaHtml}

        <script>
          window.onload = function () {
            setTimeout(function () {
              window.print();
            }, 250);
          };
        </script>
      </body>
    </html>
  `);
  win.document.close();
}

function renderProduct(p) {
  currentProduct = p;

  const type = p.type || '';
  const colorSelects = document.querySelector('.color-selects');
  const showSpaColors = hasSpaColorOptions(type);
  const hasVariants = setupVariantOptions(p);
  const hasOverkappingScreenOptions = setupOverkappingScreenOptions(p);

  if (colorSelects) {
    colorSelects.style.display = showSpaColors ? 'grid' : 'none';
  }

  const cabinetSelect = $('spaCabinetColor');
  if (cabinetSelect && showSpaColors) {
    let colors = [];
    const merk = getMerk(p).toLowerCase();

    if (merk.includes('vogue')) {
      colors = ['taupe', 'black', 'grey'];
    } else if (merk.includes('elite')) {
      colors = ['palm black', 'ancient grey'];
    } else {
      colors = ['graphite', 'grey', 'chocolate'];
    }

    cabinetSelect.innerHTML = colors
      .map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`)
      .join('');
  }

  toggleBullfrogUi(p);
  syncProductTypeClasses(p);

  if (productTitle) productTitle.textContent = p.title || '—';
  syncProductPriceDisplay();
  if (productType) productType.textContent = (p.type || '').toUpperCase();

  const optionsWrap = document.querySelector('.options');
  if (optionsWrap && !isBullfrogProduct(p)) {
    optionsWrap.style.display = isOverkapping(type) && !hasVariants && !hasOverkappingScreenOptions ? 'none' : '';
  }

  if (productImg) {
    productImg.src = p.image || '';
    productImg.alt = p.title || 'Product';
    productImg.style.display = p.image ? '' : 'none';
    productImg.onerror = () => {
      productImg.style.display = 'none';
    };
  }
  setupOverkappingAccessoryImages(p);

  if (productSpecs) {
    productSpecs.innerHTML = specTableHtml(p);
  }

  if (productUrl) {
    productUrl.href = p.url || '#';
    productUrl.style.display = p.url ? '' : 'none';
  }

  if (backToOverview) {
    backToOverview.href = getBackToOverviewHref(p);
  }

  if (sixPercentPrint) {
    const showSixPercentForm = isMainOverkappingProduct(p);
    sixPercentPrint.style.display = showSixPercentForm ? '' : 'none';
    sixPercentPrint.onclick = showSixPercentForm
      ? () => {
          printSixPercentForm();
        }
      : null;
  }

  if (productPrint) {
    productPrint.addEventListener('click', function () {
      printProductFiche(p);
    });
  }

  if (offerPrint) {
    offerPrint.addEventListener('click', function () {
      printOfferte();
    });
  }

  if ($('optInstall')) $('optInstall').checked = true;
  if ($('optPromoDiscount')) $('optPromoDiscount').checked = true;
  if ($('optCoverlift')) $('optCoverlift').checked = false;
  if ($('optCoverlift2')) $('optCoverlift2').checked = false;
  if ($('optMaint')) $('optMaint').checked = false;
  if ($('optSwimFilterset')) $('optSwimFilterset').checked = false;
  if ($('optWarmtepompQty')) $('optWarmtepompQty').value = '0';
  if ($('optBarrelWoodStove')) $('optBarrelWoodStove').checked = false;
  if ($('optBarrelElectricHeater')) $('optBarrelElectricHeater').checked = false;
  if ($('optBarrelRoofShingles')) $('optBarrelRoofShingles').checked = false;
  if ($('optBarrelRoofHeather')) $('optBarrelRoofHeather').checked = false;
  if ($('optBarrelRoofDesign')) $('optBarrelRoofDesign').checked = false;
  if ($('optBarrelInfraredModule')) $('optBarrelInfraredModule').checked = false;

  wireCustomerHandlers();
  wireOptionHandlers();
  updateOptionUI();

  if (productPage) productPage.style.display = '';
}

async function init() {
  const productId = getProductIdFromUrl();
  if (!productId) {
    showError('Geen product-id in de URL.');
    return;
  }

  const products = await loadProducts();
  const product = products.find(p => String(p.id) === String(productId));

  if (!product) {
    showError('Product niet gevonden.');
    return;
  }

  renderProduct(product);
}

init().catch(e => {
  console.error(e);
  showError(String(e.message || e));
});
