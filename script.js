(() => {
  'use strict';

  /* ============================================================
     Product data
     ============================================================ */
  const BASE_PRICE = 1180;
  const CASE_PRICES = { titanium: 0, steel: 0, black: 60 };
  const CASE_COLORS = {
    titanium: { hi: '#D8D3CC', mid: '#9C9691', lo: '#5C5854' },
    steel:    { hi: '#E7EAEC', mid: '#B9BEC2', lo: '#7C8288' },
    black:    { hi: '#3A3934', mid: '#2A2926', lo: '#141311' },
  };
  const STRAP_PRICES = { leather: 0, steel: 90, rubber: 20 };
  const STRAP_COLORS = { leather: '#5A3A28', steel: '#B9BEC2', rubber: '#1B1B1A' };
  const CASE_LABELS = { titanium: 'Titanium case', steel: 'Steel case', black: 'Black DLC case' };
  const STRAP_LABELS = { leather: 'Brown leather strap', steel: 'Steel bracelet', rubber: 'Rubber strap' };

  const fmt = (n) => '$' + n.toLocaleString('en-US');

  const state = {
    caseFinish: 'titanium',
    strap: 'leather',
    engraving: '',
  };

  const currentUnitPrice = () =>
    BASE_PRICE + CASE_PRICES[state.caseFinish] + STRAP_PRICES[state.strap];

  /* ============================================================
     Header: mobile nav + scroll shrink
     ============================================================ */
  const siteHeader = document.getElementById('siteHeader');
  const menuToggle = document.getElementById('menuToggle');
  menuToggle?.addEventListener('click', () => {
    const isOpen = siteHeader.classList.toggle('nav-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
  document.querySelectorAll('.mobile-nav a').forEach(a =>
    a.addEventListener('click', () => {
      siteHeader.classList.remove('nav-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    })
  );

  /* ============================================================
     Watch SVG: generate hour markers + bezel ticks, draggable bezel
     ============================================================ */
  const CX = 220, CY = 220;
  function polar(cx, cy, r, deg){
    const rad = (deg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  const hourMarkers = document.querySelector('.hour-markers');
  if (hourMarkers) {
    for (let i = 0; i < 12; i++) {
      const deg = i * 30;
      const isCardinal = i % 3 === 0;
      const r1 = 108, r2 = isCardinal ? 96 : 100;
      const a = polar(CX, CY, r1, deg);
      const b = polar(CX, CY, r2, deg);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
      line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
      if (isCardinal) line.setAttribute('stroke-width', '4.5');
      hourMarkers.appendChild(line);
    }
  }

  const bezelTicks = document.querySelector('.bezel__ticks');
  if (bezelTicks) {
    for (let i = 0; i < 60; i++) {
      const deg = i * 6;
      const long = i % 5 === 0;
      const a = polar(CX, CY, 150, deg);
      const b = polar(CX, CY, long ? 141 : 146, deg);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
      line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
      bezelTicks.appendChild(line);
    }
  }

  // Draggable bezel rotation
  const bezel = document.getElementById('bezel');
  const watchWrap = document.getElementById('watchWrap');
  const watchHint = document.getElementById('watchHint');
  if (bezel && watchWrap) {
    let rotation = 0;
    let dragging = false;
    let lastAngle = 0;

    const angleFromEvent = (evt) => {
      const rect = watchWrap.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const x = evt.clientX - cx;
      const y = evt.clientY - cy;
      return Math.atan2(y, x) * 180 / Math.PI;
    };

    const start = (evt) => {
      dragging = true;
      lastAngle = angleFromEvent(evt);
      bezel.setPointerCapture?.(evt.pointerId);
      if (watchHint) watchHint.style.opacity = '0';
    };
    const move = (evt) => {
      if (!dragging) return;
      const angle = angleFromEvent(evt);
      let delta = angle - lastAngle;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      rotation += delta;
      lastAngle = angle;
      bezel.style.transform = `rotate(${rotation}deg)`;
    };
    const end = () => { dragging = false; };

    watchWrap.addEventListener('pointerdown', start);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    watchWrap.addEventListener('pointercancel', end);
  }

  /* ============================================================
     Configurator
     ============================================================ */
  const root = document.documentElement;
  const configureCaption = document.getElementById('configureCaption');
  const configureGlow = document.querySelector('.configure__glow');
  const configPriceEl = document.getElementById('configPrice');
  const heroPriceEl = document.getElementById('heroPrice');
  const heroPricePartEl = document.getElementById('heroPricePart');
  const finalPriceEl = document.getElementById('finalPrice');
  const stickyPriceEl = document.getElementById('stickyPrice');

  function applyCaseColors(){
    const c = CASE_COLORS[state.caseFinish];
    root.style.setProperty('--case-hi', c.hi);
    root.style.setProperty('--case-mid', c.mid);
    root.style.setProperty('--case-lo', c.lo);
    root.style.setProperty('--bezel-tick', state.caseFinish === 'black' ? '#000' : c.lo);
  }
  function applyStrapColor(){
    root.style.setProperty('--strap-color', STRAP_COLORS[state.strap]);
    if (configureGlow) configureGlow.style.background =
      `radial-gradient(circle, ${STRAP_COLORS[state.strap]} 0%, transparent 70%)`;
  }

  function refreshPrices(){
    const unit = currentUnitPrice();
    const priceStr = fmt(unit);
    [configPriceEl, heroPriceEl, finalPriceEl, stickyPriceEl].forEach(el => { if (el) el.textContent = priceStr; });
    if (heroPricePartEl) heroPricePartEl.textContent = fmt(Math.round(unit / 4));
    if (configureCaption) configureCaption.textContent = `${CASE_LABELS[state.caseFinish]} · ${STRAP_LABELS[state.strap]}`;
  }

  function wireSwatchGroup(containerId, stateKey, applyFn){
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('.swatch').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.swatch').forEach(b => b.setAttribute('aria-pressed', 'false'));
        btn.setAttribute('aria-pressed', 'true');
        state[stateKey] = btn.dataset[stateKey === 'caseFinish' ? 'case' : 'strap'];
        applyFn();
        refreshPrices();
      });
    });
  }
  wireSwatchGroup('caseOptions', 'caseFinish', applyCaseColors);
  wireSwatchGroup('strapOptions', 'strap', applyStrapColor);

  const engravingInput = document.getElementById('engravingInput');
  const engraveCount = document.getElementById('engraveCount');
  engravingInput?.addEventListener('input', () => {
    state.engraving = engravingInput.value;
    if (engraveCount) engraveCount.textContent = String(engravingInput.value.length);
  });

  applyCaseColors();
  applyStrapColor();
  refreshPrices();

  /* ============================================================
     Cart (persisted in localStorage)
     ============================================================ */
  const CART_KEY = 'vantier_cart_v1';
  const loadCart = () => {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch { return []; }
  };
  const saveCart = (cart) => localStorage.setItem(CART_KEY, JSON.stringify(cart));

  let cart = loadCart();

  const cartCountEl = document.getElementById('cartCount');
  const cartItemsEl = document.getElementById('cartItems');
  const cartEmptyEl = document.getElementById('cartEmpty');
  const cartSubtotalEl = document.getElementById('cartSubtotal');
  const modalTotalEl = document.getElementById('modalTotal');

  function cartTotalQty(){ return cart.reduce((s, i) => s + i.qty, 0); }
  function cartSubtotal(){ return cart.reduce((s, i) => s + i.qty * i.unitPrice, 0); }

  function renderCart(){
    const qty = cartTotalQty();
    if (cartCountEl) {
      cartCountEl.textContent = String(qty);
      cartCountEl.hidden = qty === 0;
    }
    if (cartEmptyEl) cartEmptyEl.hidden = cart.length > 0;
    if (cartItemsEl) {
      cartItemsEl.innerHTML = '';
      cart.forEach((item, idx) => {
        const li = document.createElement('li');
        li.className = 'cart-item';
        li.innerHTML = `
          <div class="cart-item__thumb"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="12" y1="12" x2="12" y2="7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="12" y1="12" x2="15" y2="14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></div>
          <div>
            <p class="cart-item__name">The Meridian</p>
            <p class="cart-item__opts">${item.caseLabel} · ${item.strapLabel}${item.engraving ? ' · "' + escapeHtml(item.engraving) + '"' : ''}</p>
            <div class="cart-item__qty">
              <button type="button" data-action="dec" data-idx="${idx}" aria-label="Decrease quantity">−</button>
              <span>${item.qty}</span>
              <button type="button" data-action="inc" data-idx="${idx}" aria-label="Increase quantity">+</button>
            </div>
          </div>
          <div>
            <p class="cart-item__price">${fmt(item.qty * item.unitPrice)}</p>
            <button type="button" class="cart-item__remove" data-action="remove" data-idx="${idx}">Remove</button>
          </div>
        `;
        cartItemsEl.appendChild(li);
      });
    }
    const subtotal = cartSubtotal();
    if (cartSubtotalEl) cartSubtotalEl.textContent = fmt(subtotal);
    if (modalTotalEl) modalTotalEl.textContent = fmt(subtotal);
    saveCart(cart);
  }

  function escapeHtml(str){
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  cartItemsEl?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const idx = Number(btn.dataset.idx);
    const action = btn.dataset.action;
    if (action === 'inc') cart[idx].qty += 1;
    if (action === 'dec') cart[idx].qty = Math.max(1, cart[idx].qty - 1);
    if (action === 'remove') cart.splice(idx, 1);
    renderCart();
  });

  function addToCart(){
    const unitPrice = currentUnitPrice();
    const existing = cart.find(i =>
      i.caseFinish === state.caseFinish &&
      i.strap === state.strap &&
      i.engraving === state.engraving
    );
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        caseFinish: state.caseFinish,
        strap: state.strap,
        engraving: state.engraving,
        caseLabel: CASE_LABELS[state.caseFinish],
        strapLabel: STRAP_LABELS[state.strap],
        unitPrice,
        qty: 1,
      });
    }
    renderCart();
    showToast('Added to cart');
    openCart();
  }

  ['heroAddToCart', 'configAddToCart', 'finalAddToCart', 'stickyAddToCart'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', addToCart);
  });

  /* ============================================================
     Cart drawer open/close
     ============================================================ */
  const cartDrawer = document.getElementById('cartDrawer');
  const drawerOverlay = document.getElementById('drawerOverlay');
  const cartToggle = document.getElementById('cartToggle');
  const cartClose = document.getElementById('cartClose');

  function openCart(){
    cartDrawer.classList.add('is-open');
    drawerOverlay.classList.add('is-active');
    cartDrawer.setAttribute('aria-hidden', 'false');
    cartToggle.setAttribute('aria-expanded', 'true');
  }
  function closeCart(){
    cartDrawer.classList.remove('is-open');
    drawerOverlay.classList.remove('is-active');
    cartDrawer.setAttribute('aria-hidden', 'true');
    cartToggle.setAttribute('aria-expanded', 'false');
  }
  cartToggle?.addEventListener('click', () => {
    cartDrawer.classList.contains('is-open') ? closeCart() : openCart();
  });
  cartClose?.addEventListener('click', closeCart);
  drawerOverlay?.addEventListener('click', () => { closeCart(); closeCheckout(); });

  /* ============================================================
     Checkout modal
     ============================================================ */
  const checkoutOverlay = document.getElementById('checkoutOverlay');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const checkoutClose = document.getElementById('checkoutClose');
  const orderForm = document.getElementById('orderForm');
  const formError = document.getElementById('formError');
  const checkoutFormWrap = document.getElementById('checkoutForm');
  const checkoutConfirmWrap = document.getElementById('checkoutConfirm');
  const confirmClose = document.getElementById('confirmClose');

  function openCheckout(){
    if (cart.length === 0) { showToast("Your cart is empty"); return; }
    closeCart();
    checkoutOverlay.classList.add('is-active');
    checkoutFormWrap.hidden = false;
    checkoutConfirmWrap.hidden = true;
  }
  function closeCheckout(){
    checkoutOverlay.classList.remove('is-active');
  }
  checkoutBtn?.addEventListener('click', openCheckout);
  checkoutClose?.addEventListener('click', closeCheckout);
  confirmClose?.addEventListener('click', closeCheckout);

  orderForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!orderForm.checkValidity()) {
      formError.hidden = false;
      formError.textContent = 'Please fill in every field before placing your order.';
      orderForm.reportValidity();
      return;
    }
    formError.hidden = true;

    const name = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const ref = 'VNT-' + Math.random().toString(36).slice(2, 8).toUpperCase();

    /* --------------------------------------------------------
       PAYMENT INTEGRATION POINT
       This static site cannot process real payments on its own.
       Wire in one of the following here before going live:
         - Stripe Payment Links / Checkout (redirect using the
           cart contents to a pre-created Payment Link)
         - Snipcart (snipcart.com) — add data-item attributes
         - Gumroad overlay checkout
       For now we simulate a successful order locally.
    -------------------------------------------------------- */
    document.getElementById('confirmName').textContent = name ? `, ${name}` : '';
    document.getElementById('confirmEmail').textContent = email;
    document.getElementById('confirmRef').textContent = ref;

    checkoutFormWrap.hidden = true;
    checkoutConfirmWrap.hidden = false;

    cart = [];
    renderCart();
    orderForm.reset();
    if (engraveCount) engraveCount.textContent = '0';
  });

  /* ============================================================
     FAQ accordion
     ============================================================ */
  document.querySelectorAll('.faq-item__q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const answer = item.querySelector('.faq-item__a');
      const isOpen = btn.getAttribute('aria-expanded') === 'true';

      document.querySelectorAll('.faq-item__q').forEach(other => {
        if (other !== btn) {
          other.setAttribute('aria-expanded', 'false');
          other.closest('.faq-item').querySelector('.faq-item__a').style.maxHeight = null;
        }
      });

      btn.setAttribute('aria-expanded', String(!isOpen));
      answer.style.maxHeight = isOpen ? null : answer.scrollHeight + 'px';
    });
  });

  /* ============================================================
     Sticky mobile add-to-cart bar
     ============================================================ */
  const stickyBar = document.getElementById('stickyBar');
  const heroSection = document.querySelector('.hero');
  if (stickyBar && heroSection) {
    const io = new IntersectionObserver(([entry]) => {
      stickyBar.classList.toggle('is-visible', !entry.isIntersecting && entry.boundingClientRect.top < 0);
    }, { threshold: 0 });
    io.observe(heroSection);
  }

  /* ============================================================
     Toast
     ============================================================ */
  const toastEl = document.getElementById('toast');
  let toastTimer;
  function showToast(msg){
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2200);
  }

  /* ============================================================
     Scroll reveal
     ============================================================ */
  const revealTargets = document.querySelectorAll(
    '.craft__grid, .specs__grid, .configure__grid, .reviews__grid, .final-cta, .gallery__track'
  );
  revealTargets.forEach(el => el.classList.add('reveal'));
  if ('IntersectionObserver' in window) {
    const revealIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealTargets.forEach(el => revealIO.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('is-visible'));
  }

  /* ============================================================
     Misc
     ============================================================ */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  renderCart();
})();
