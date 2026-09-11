(function () {
  const optionPrices = Object.freeze({
    install_bullfrog: 895,
    bullfrog_cover_trap_unit: 699,
    coverlift_unit: 189,
    spa_balancer_package_unit: 189
  });
  const includedOptionsTotal = Object.values(optionPrices).reduce((sum, price) => sum + price, 0);
  const offers = [
    { id: 'showroom::bullfrog-m7-gent', productId: 'spa::bullfrog-m7', location: 'Gent', innerColor: 'Solitude', cabinetColor: 'Ebony', total: 21495,
      images: [
        { src: 'images/showroom/bullfrog-m7-gent-vooraanzicht.jpeg', label: 'M7 showroommodel Gent — vooraanzicht' },
        { src: 'images/showroom/bullfrog-m7-gent-binnenzijde.jpeg', label: 'M7 showroommodel Gent — binnenzijde' }
      ]
    },
    { id: 'showroom::bullfrog-a7d-select-brugge', productId: 'spa::bullfrog-a7d-select', location: 'Brugge', innerColor: 'Snow', cabinetColor: 'Ebony', total: 18895 },
    { id: 'showroom::bullfrog-a7l-choice-gent', productId: 'spa::bullfrog-a7l-choice', location: 'Gent', innerColor: 'Mist', cabinetColor: 'Coastal Grey', total: 16995,
      images: [
        { src: 'images/showroom/bullfrog-a7l-choice-gent-vooraanzicht.jpeg', label: 'A7L Choice showroommodel Gent — vooraanzicht' },
        { src: 'images/showroom/bullfrog-a7l-choice-gent-binnenzijde.jpeg', label: 'A7L Choice showroommodel Gent — binnenzijde' }
      ]
    }
  ];

  function createProducts(products) {
    return offers.map(offer => {
      const source = products.find(product => product.id === offer.productId);
      if (!source) throw new Error(`Showroommodel niet gevonden: ${offer.productId}`);
      const specs = Array.isArray(source.specs)
        ? source.specs
        : Object.entries(source.specs || {}).map(([label, value]) => ({ label, value }));
      return {
        ...source,
        ...(offer.images?.length ? { image: offer.images[0].src, gallery_images: offer.images, images: [], secondary_image: null } : {}),
        id: offer.id,
        title: `${source.title} — showroommodel ${offer.location}`,
        showroom: offer.location,
        showroom_extra: [],
        showroomOffer: offer,
        price_display: '',
        sale_price: null,
        specs: [
          { label: 'Showroom', value: offer.location },
          { label: 'Kleur', value: `${offer.innerColor} / ${offer.cabinetColor}` },
          ...specs.filter(spec => !['showroom', 'kleur'].includes(String(spec.label).toLowerCase()))
        ]
      };
    });
  }

  function getPricing(product) {
    if (!product?.showroomOffer) return null;
    const originalTotal = Math.round((Number(product.price) + includedOptionsTotal) * 100) / 100;
    const total = product.showroomOffer.total;
    const discount = Math.round((originalTotal - total) * 100) / 100;
    return { originalTotal, total, discount, percentage: discount / originalTotal * 100 };
  }

  window.SunspaShowroomModels = { optionPrices, createProducts, getPricing };
})();
