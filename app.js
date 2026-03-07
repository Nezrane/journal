/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  KOLTYN Journal — app.js                                             ║
 * ║  Router + shared utilities                                       ║
 * ║                                                                  ║
 * ║  HOW THE ROUTER WORKS:                                           ║
 * ║  - Each page is a <section class="page" id="page-X">            ║
 * ║  - Clicking a nav item calls navigateTo('X')                    ║
 * ║  - navigateTo adds class "active" to the right section and      ║
 * ║    the right nav item, and removes it from all others           ║
 * ║  - The URL hash (#X) is updated so browser back/forward works   ║
 * ║  - On first load, the hash is read to restore the right page    ║
 * ║                                                                  ║
 * ║  HOW PAGE MODULES WORK:                                          ║
 * ║  Each page has its own JS file (e.g. nutrition/page.js).        ║
 * ║  That file calls window.registerPage('nutrition', initFn)        ║
 * ║  The router calls initFn the FIRST TIME the page is shown.      ║
 * ║  After that the page stays rendered (no re-init on re-visit).   ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */


/* ══════════════════════════════════════════════════════════════════
   PAGE REGISTRY
   Each page module registers an init function here.
   The router calls it lazily (only when first visited).
════════════════════════════════════════════════════════════════ */
const PAGE_REGISTRY   = {};  /* { pageName: initFunction } */
const INITIALISED     = {};  /* { pageName: true } — tracks which pages have been init'd */

/**
 * Called by each page module to register itself.
 * @param {string}   name - Page identifier e.g. 'nutrition'
 * @param {Function} fn   - Function to call to build the page's HTML/setup events
 */
window.registerPage = function(name, fn) {
  PAGE_REGISTRY[name] = fn;
};


/* ══════════════════════════════════════════════════════════════════
   ROUTER
════════════════════════════════════════════════════════════════ */
const VALID_PAGES = ['dashboard', 'nutrition', 'workout', 'business', 'wealth', 'creative'];

/**
 * Navigate to a page.
 * @param {string} page - Page name, must be in VALID_PAGES
 */
function navigateTo(page) {
  if (!VALID_PAGES.includes(page)) page = 'dashboard';

  /* Remove active from all pages + nav items */
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  /* Activate the target page */
  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');

  /* Activate the nav item */
  const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navItem) navItem.classList.add('active');

  /* Update URL hash (no page reload) */
  history.replaceState(null, '', '#' + page);

  /* Lazy-init: run the page module's init function on first visit */
  if (PAGE_REGISTRY[page] && !INITIALISED[page]) {
    PAGE_REGISTRY[page]();
    INITIALISED[page] = true;
  }
}

/* Wire up nav items */
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo(item.dataset.page);
  });
});

/* Browser back/forward support */
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '');
  navigateTo(VALID_PAGES.includes(hash) ? hash : 'dashboard');
});

/*
 * NOTE: Initial page load call (navigateTo) is at the bottom of
 * vision/page.js — the last script tag in index.html — so all
 * page modules are registered before the router tries to init any.
 */


/* ══════════════════════════════════════════════════════════════════
   SHARED UTILITIES
   Helper functions available to all page modules.
════════════════════════════════════════════════════════════════ */

/**
 * Creates an eyebrow + title page header and returns the HTML string.
 * Each page calls this to render its top section consistently.
 */
window.buildPageHeader = function(eyebrow, titleMain, titleAccent, subtitle, controlsHTML = '') {
  return `
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-eyebrow">${eyebrow}</div>
        <h1 class="page-title">${titleMain} <span>${titleAccent}</span></h1>
        ${subtitle ? `<div class="page-subtitle">${subtitle}</div>` : ''}
      </div>
      ${controlsHTML ? `<div class="page-header-right">${controlsHTML}</div>` : ''}
    </div>`;
};

/**
 * Formats a number as currency: 1234.5 → "$1,234"
 */
window.formatCurrency = function(n, prefix = '$') {
  return prefix + Math.round(n).toLocaleString('en-US');
};

/**
 * Returns a CSS width% string capped at 100% for progress bars.
 */
window.progressPct = function(current, target) {
  return Math.min(100, Math.round((current / target) * 100)) + '%';
};

/**
 * Shared modal swipe-to-dismiss setup for mobile.
 * @param {Element} modalEl   - The .modal or .ex-modal element
 * @param {Function} closeFn  - Function to call when dismissed
 */
window.setupSwipeDismiss = function(modalEl, closeFn) {
  let startY = 0;

  modalEl.addEventListener('touchstart', e => {
    startY = e.touches[0].clientY;
  }, { passive: true });

  modalEl.addEventListener('touchmove', e => {
    const dy = e.touches[0].clientY - startY;
    if (dy > 0) modalEl.style.transform = `translateY(${Math.min(dy, 200)}px)`;
  }, { passive: true });

  modalEl.addEventListener('touchend', e => {
    const dy = e.changedTouches[0].clientY - startY;
    modalEl.style.transition = 'transform 0.25s ease';
    if (dy > 80) {
      closeFn();
    } else {
      modalEl.style.transform = '';
      setTimeout(() => { modalEl.style.transition = ''; }, 260);
    }
  });
};
