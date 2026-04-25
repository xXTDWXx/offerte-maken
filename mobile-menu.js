document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('[data-mobile-menu-toggle]');
  const drawer = document.querySelector('[data-mobile-menu-drawer]');
  const overlay = document.querySelector('[data-mobile-menu-overlay]');
  const closeButton = document.querySelector('[data-mobile-menu-close]');
  const content = document.querySelector('[data-mobile-menu-content]');

  if (!toggle || !drawer || !overlay || !content) {
    return;
  }

  const sections = [];
  const quickLinks = [];
  const kassaLink = document.querySelector('.brand .kassa');

  if (kassaLink) {
    quickLinks.push(kassaLink);
  }

  if (quickLinks.length) {
    sections.push({
      title: 'Snelle acties',
      links: quickLinks
    });
  }

  const menuRows = Array.from(document.querySelectorAll('.category-menu .category-menu-row'));
  menuRows.forEach((row, index) => {
    const links = Array.from(row.querySelectorAll('a[href]'));
    if (!links.length) return;

    sections.push({
      title: index === 0 ? 'Categorieen' : 'Extra',
      links
    });
  });

  content.innerHTML = '';

  sections.forEach(section => {
    const block = document.createElement('section');
    block.className = 'mobile-menu-section';

    const title = document.createElement('div');
    title.className = 'mobile-menu-section-title';
    title.textContent = section.title;
    block.appendChild(title);

    const list = document.createElement('div');
    list.className = 'mobile-menu-links';

    section.links.forEach(link => {
      const item = document.createElement('a');
      item.className = 'mobile-menu-link';
      if (link.classList.contains('is-active')) {
        item.classList.add('is-active');
      }
      if (link.classList.contains('kassa')) {
        item.classList.add('is-accent');
      }
      item.href = link.getAttribute('href') || '#';
      item.textContent = link.textContent.trim();
      item.addEventListener('click', () => {
        setOpen(false);
      });
      list.appendChild(item);
    });

    block.appendChild(list);
    content.appendChild(block);
  });

  function setOpen(open) {
    document.body.classList.toggle('mobile-menu-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
  }

  toggle.addEventListener('click', () => {
    setOpen(!document.body.classList.contains('mobile-menu-open'));
  });

  overlay.addEventListener('click', () => {
    setOpen(false);
  });

  if (closeButton) {
    closeButton.addEventListener('click', () => {
      setOpen(false);
    });
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      setOpen(false);
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 761) {
      setOpen(false);
    }
  });
});
