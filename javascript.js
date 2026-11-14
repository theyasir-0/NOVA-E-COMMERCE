/**
 * NOVA COMMERCE — Core Application Engine
 * Handles Cart Drawer, Quick View, Wishlist, Themes, Checkout & Search
 */

// ==========================================================================
// 1. STATE INITIALIZATION & LOCAL STORAGE
// ==========================================================================
let cart = JSON.parse(localStorage.getItem('amazon_cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('nova_wishlist')) || [];
let savedAddress = JSON.parse(localStorage.getItem('amazon_address')) || null;
let appliedDiscountPercent = 0;
let appliedCouponCode = '';

// Active filter state
let activeCategory = 'all';
let activeSort = 'featured';

// ==========================================================================
// 2. THEME MANAGER (DARK / LIGHT MODE)
// ==========================================================================
function initTheme() {
  const savedTheme = localStorage.getItem('nova_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('nova_theme', newTheme);
      updateThemeIcon(newTheme);
      showToast(`Switched to ${newTheme} mode`, 'info', 'fa-solid fa-moon');
    });
  }
}

function updateThemeIcon(theme) {
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (themeToggleBtn) {
    themeToggleBtn.innerHTML = theme === 'dark' 
      ? '<i class="fa-solid fa-sun" style="color: #f59e0b;"></i>' 
      : '<i class="fa-solid fa-moon"></i>';
    themeToggleBtn.setAttribute('title', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
  }
}

// ==========================================================================
// 3. TOAST NOTIFICATION ENGINE
// ==========================================================================
function showToast(message, type = 'info', icon = 'fa-solid fa-circle-check') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="${icon}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

// ==========================================================================
// 4. CART & DRAWER MANAGEMENT
// ==========================================================================
function saveCart() {
  localStorage.setItem('amazon_cart', JSON.stringify(cart));
  updateCartCounters();
  renderCartDrawer();
}

function updateCartCounters() {
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartBadges = document.querySelectorAll('.cart-count-badge');
  cartBadges.forEach(badge => {
    badge.textContent = totalCount;
  });

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const subtotalElements = document.querySelectorAll('.cart-subtotal-val');
  subtotalElements.forEach(el => {
    el.textContent = `₹${cartSubtotal.toLocaleString()}`;
  });
}

function openCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-drawer-overlay');
  if (drawer && overlay) {
    renderCartDrawer();
    drawer.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-drawer-overlay');
  if (drawer && overlay) {
    drawer.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function addToCart(productId, qty = 1, e = null) {
  if (e) {
    e.stopPropagation();
  }
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.quantity += qty;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      oldPrice: product.oldPrice || null,
      img: product.img,
      category: product.category,
      quantity: qty
    });
  }

  saveCart();
  showToast(`Added ${product.name} to cart!`, 'success', 'fa-solid fa-cart-plus');

  // Button feedback animation if available
  if (e && e.target) {
    const btn = e.target.closest('.btn-add-cart');
    if (btn) {
      const originalHTML = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Added';
      btn.classList.add('added');
      setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.classList.remove('added');
      }, 1600);
    }
  }
}

function updateCartQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter(i => i.id !== productId);
    showToast('Item removed from cart', 'info', 'fa-solid fa-trash-can');
  }
  saveCart();
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.id !== productId);
  saveCart();
  showToast('Item removed from cart', 'info', 'fa-solid fa-trash-can');
}

function clearCart() {
  if (confirm('Are you sure you want to clear your cart?')) {
    cart = [];
    appliedDiscountPercent = 0;
    appliedCouponCode = '';
    saveCart();
    showToast('Cart cleared', 'info', 'fa-solid fa-trash');
  }
}

function applyCoupon(code) {
  const cleanCode = (code || '').trim().toUpperCase();
  if (cleanCode === 'NOVA20') {
    appliedDiscountPercent = 20;
    appliedCouponCode = 'NOVA20';
    showToast('20% discount coupon applied!', 'success', 'fa-solid fa-tag');
    renderCartDrawer();
  } else if (cleanCode === 'WELCOME10') {
    appliedDiscountPercent = 10;
    appliedCouponCode = 'WELCOME10';
    showToast('10% discount coupon applied!', 'success', 'fa-solid fa-tag');
    renderCartDrawer();
  } else {
    showToast('Invalid coupon code. Try NOVA20 or WELCOME10', 'danger', 'fa-solid fa-circle-exclamation');
  }
}

function renderCartDrawer() {
  const body = document.getElementById('cart-drawer-body');
  const foot = document.getElementById('cart-drawer-foot');
  const countEl = document.getElementById('cart-drawer-count');
  const shippingTrack = document.getElementById('shipping-progress-fill');
  const shippingText = document.getElementById('shipping-progress-text');

  if (!body) return;

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (countEl) countEl.textContent = `${totalItems} items`;

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const freeShippingThreshold = 999;

  // Free shipping bar calculation
  if (shippingTrack && shippingText) {
    if (subtotal >= freeShippingThreshold) {
      shippingTrack.style.width = '100%';
      shippingText.innerHTML = '<span>🎉 You have unlocked <b>FREE Express Shipping!</b></span>';
    } else {
      const remaining = freeShippingThreshold - subtotal;
      const pct = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
      shippingTrack.style.width = `${pct}%`;
      shippingText.innerHTML = `<span>Add <b>₹${remaining.toLocaleString()}</b> for FREE Express Shipping</span><span>${pct}%</span>`;
    }
  }

  if (cart.length === 0) {
    body.innerHTML = `
      <div class="cart-empty-state">
        <div class="cart-empty-icon"><i class="fa-solid fa-bag-shopping"></i></div>
        <h4>Your cart is empty</h4>
        <p>Looks like you haven't added anything to your cart yet.</p>
        <button class="btn-primary" onclick="closeCartDrawer(); window.location.href='index.html#catalog';">
          <i class="fa-solid fa-sparkles"></i> Start Shopping
        </button>
      </div>
    `;
    if (foot) foot.style.display = 'none';
    return;
  }

  if (foot) foot.style.display = 'block';

  // Render items
  body.innerHTML = cart.map(item => `
    <div class="cart-item-row">
      <img src="${item.img}" alt="${item.name}" class="cart-item-thumb">
      <div class="cart-item-info">
        <h4 class="cart-item-name">${item.name}</h4>
        <span class="cart-item-category">${item.category}</span>
        <div class="cart-item-price-actions">
          <span class="cart-item-price">₹${(item.price * item.quantity).toLocaleString()}</span>
          <div class="qty-stepper">
            <button class="qty-step-btn" onclick="updateCartQty(${item.id}, -1)">−</button>
            <span class="qty-display">${item.quantity}</span>
            <button class="qty-step-btn" onclick="updateCartQty(${item.id}, 1)">+</button>
          </div>
          <button class="btn-remove-item" onclick="removeFromCart(${item.id})" title="Remove">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');

  // Calculate pricing breakdown
  const shippingFee = subtotal >= freeShippingThreshold ? 0 : 99;
  const discountAmount = Math.round(subtotal * (appliedDiscountPercent / 100));
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  if (foot) {
    foot.innerHTML = `
      <div class="coupon-row">
        <input type="text" id="coupon-code-input" class="coupon-input" placeholder="Coupon code (e.g. NOVA20)" value="${appliedCouponCode}">
        <button class="coupon-btn" onclick="applyCoupon(document.getElementById('coupon-code-input').value)">Apply</button>
      </div>
      <div class="cart-summary-line">
        <span>Subtotal</span>
        <span>₹${subtotal.toLocaleString()}</span>
      </div>
      ${discountAmount > 0 ? `
        <div class="cart-summary-line" style="color: var(--accent-emerald);">
          <span>Discount (${appliedDiscountPercent}%)</span>
          <span>−₹${discountAmount.toLocaleString()}</span>
        </div>
      ` : ''}
      <div class="cart-summary-line">
        <span>Estimated Shipping</span>
        <span>${shippingFee === 0 ? '<strong style="color: var(--accent-emerald);">FREE</strong>' : `₹${shippingFee}`}</span>
      </div>
      <div class="cart-summary-line total-line">
        <span>Estimated Total</span>
        <span>₹${finalTotal.toLocaleString()}</span>
      </div>
      <button class="btn-drawer-checkout" onclick="initiateCheckout()">
        <i class="fa-solid fa-lock"></i> Proceed to Checkout
      </button>
      <span class="btn-clear-cart-text" onclick="clearCart()">Clear All Items</span>
    `;
  }
}

// ==========================================================================
// 5. WISHLIST MANAGEMENT
// ==========================================================================
function toggleWishlist(productId, e = null) {
  if (e) e.stopPropagation();
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  const index = wishlist.indexOf(productId);
  if (index > -1) {
    wishlist.splice(index, 1);
    showToast(`Removed from Wishlist`, 'info', 'fa-regular fa-heart');
  } else {
    wishlist.push(productId);
    showToast(`Added ${product.name} to Wishlist!`, 'success', 'fa-solid fa-heart');
  }

  localStorage.setItem('nova_wishlist', JSON.stringify(wishlist));
  updateWishlistCounters();
  updateWishlistButtonsUI();
}

function updateWishlistCounters() {
  const badges = document.querySelectorAll('.wishlist-count-badge');
  badges.forEach(b => b.textContent = wishlist.length);
}

function updateWishlistButtonsUI() {
  document.querySelectorAll('[data-wishlist-id]').forEach(btn => {
    const id = parseInt(btn.dataset.wishlistId);
    if (wishlist.includes(id)) {
      btn.classList.add('wishlist-active');
      btn.innerHTML = '<i class="fa-solid fa-heart" style="color: #ef4444;"></i>';
    } else {
      btn.classList.remove('wishlist-active');
      btn.innerHTML = '<i class="fa-regular fa-heart"></i>';
    }
  });
}

// ==========================================================================
// 6. QUICK VIEW MODAL
// ==========================================================================
function openQuickView(productId, e = null) {
  if (e) e.stopPropagation();
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  const overlay = document.getElementById('quickview-modal-overlay');
  const content = document.getElementById('quickview-modal-content');
  if (!overlay || !content) return;

  const starsHtml = renderStars(product.rating || 4.8);
  const specsPills = (product.specs || ['Premium Quality', 'Official Warranty', 'Express Delivery'])
    .map(s => `<span class="spec-pill"><i class="fa-solid fa-check"></i> ${s}</span>`)
    .join('');

  content.innerHTML = `
    <button class="modal-close-btn" onclick="closeQuickView()"><i class="fa-solid fa-xmark"></i></button>
    <div class="quickview-img-col">
      <img src="${product.img}" alt="${product.name}">
    </div>
    <div class="quickview-details-col">
      <div class="quickview-badge-row">
        <span class="badge-tag ${product.tagColor || 'badge-purple'}">${product.tag || 'Popular'}</span>
        ${product.discount ? `<span class="badge-discount">−${product.discount}% OFF</span>` : ''}
      </div>
      <span style="font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">
        ${product.brand || 'NOVA'} • ${product.category}
      </span>
      <h2 class="quickview-title">${product.name}</h2>
      
      <div class="product-rating-row">
        <div class="rating-stars">${starsHtml}</div>
        <span class="rating-score">${product.rating || 4.8}</span>
        <span class="rating-count">(${product.reviews || 420} customer reviews)</span>
      </div>

      <p class="quickview-desc">${product.description || 'High performance and stylish design curated for modern everyday lifestyle.'}</p>

      <div class="quickview-specs-list">${specsPills}</div>

      <div class="quickview-price-row">
        <span class="current-price" style="font-size: 2rem;">₹${product.price.toLocaleString()}</span>
        ${product.oldPrice ? `<span class="old-price" style="font-size: 1.15rem;">₹${product.oldPrice.toLocaleString()}</span>` : ''}
        ${product.oldPrice ? `<span class="savings-chip">Save ₹${(product.oldPrice - product.price).toLocaleString()}</span>` : ''}
      </div>

      <div class="quickview-actions">
        <button class="btn-primary" style="flex: 1;" onclick="addToCart(${product.id}, 1, event); closeQuickView(); openCartDrawer();">
          <i class="fa-solid fa-bag-shopping"></i> Add to Cart
        </button>
        <button class="btn-secondary" style="color: var(--text-main); border-color: var(--border-color);" onclick="instantBuyNow(${product.id}); closeQuickView();">
          Buy Now
        </button>
      </div>
    </div>
  `;

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeQuickView() {
  const overlay = document.getElementById('quickview-modal-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  let html = '';
  for (let i = 0; i < full; i++) html += '<i class="fa-solid fa-star"></i>';
  if (half) html += '<i class="fa-solid fa-star-half-stroke"></i>';
  const empty = 5 - full - half;
  for (let i = 0; i < empty; i++) html += '<i class="fa-regular fa-star"></i>';
  return html;
}

// ==========================================================================
// 7. CHECKOUT & ADDRESS MODAL
// ==========================================================================
function initiateCheckout() {
  if (cart.length === 0) {
    showToast('Your cart is empty', 'warning', 'fa-solid fa-bag-shopping');
    return;
  }
  closeCartDrawer();
  openCheckoutModal();
}

function instantBuyNow(productId) {
  addToCart(productId, 1);
  initiateCheckout();
}

function openCheckoutModal() {
  const overlay = document.getElementById('checkout-modal-overlay');
  if (!overlay) return;

  // Pre-fill address if stored
  if (savedAddress) {
    const nameInput = document.getElementById('checkout-name');
    const phoneInput = document.getElementById('checkout-phone');
    const pincodeInput = document.getElementById('checkout-pincode');
    const flatInput = document.getElementById('checkout-flat');
    const areaInput = document.getElementById('checkout-area');
    const cityInput = document.getElementById('checkout-city');

    if (nameInput) nameInput.value = savedAddress.name || '';
    if (phoneInput) phoneInput.value = savedAddress.phone || '';
    if (pincodeInput) pincodeInput.value = savedAddress.pincode || '';
    if (flatInput) flatInput.value = savedAddress.flat || '';
    if (areaInput) areaInput.value = savedAddress.area || '';
    if (cityInput) cityInput.value = savedAddress.city || '';
  }

  // Calculate order total
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = Math.round(subtotal * (appliedDiscountPercent / 100));
  const shippingFee = subtotal >= 999 ? 0 : 99;
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  const totalEl = document.getElementById('checkout-order-total');
  if (totalEl) totalEl.textContent = `₹${finalTotal.toLocaleString()}`;

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCheckoutModal() {
  const overlay = document.getElementById('checkout-modal-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Handle Checkout Form Submission (PHP backend with graceful simulated fallback)
function handleCheckoutSubmit(e) {
  e.preventDefault();

  const addressData = {
    name: document.getElementById('checkout-name').value.trim(),
    phone: document.getElementById('checkout-phone').value.trim(),
    pincode: document.getElementById('checkout-pincode').value.trim(),
    flat: document.getElementById('checkout-flat').value.trim(),
    area: document.getElementById('checkout-area').value.trim(),
    city: document.getElementById('checkout-city').value.trim()
  };

  localStorage.setItem('amazon_address', JSON.stringify(addressData));
  savedAddress = addressData;
  updateHeaderAddressUI(addressData);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = Math.round(subtotal * (appliedDiscountPercent / 100));
  const shippingFee = subtotal >= 999 ? 0 : 99;
  const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

  const submitBtn = document.getElementById('submit-order-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Securing Your Order...';
  }

  // Send to PHP backend
  fetch('checkout.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      address: addressData,
      cart: cart,
      total: totalAmount
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      completeOrder(data.order_id, addressData, totalAmount);
    } else {
      // If server error, fallback safely
      completeOrder(generateFallbackOrderId(), addressData, totalAmount);
    }
  })
  .catch(err => {
    // If running statically without PHP server running, simulate successful order placement
    console.log('Static mode or PHP offline: generating local simulated order.');
    completeOrder(generateFallbackOrderId(), addressData, totalAmount);
  })
  .finally(() => {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Place Order Now';
    }
  });
}

function generateFallbackOrderId() {
  return 'NV-' + Math.floor(100000 + Math.random() * 900000);
}

function completeOrder(orderId, addressData, totalAmount) {
  // Save order in local history
  const orders = JSON.parse(localStorage.getItem('nova_orders')) || [];
  const newOrder = {
    id: orderId,
    date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
    items: [...cart],
    total: totalAmount,
    address: addressData,
    status: 'Confirmed'
  };
  orders.unshift(newOrder);
  localStorage.setItem('nova_orders', JSON.stringify(orders));

  // Reset cart
  cart = [];
  appliedDiscountPercent = 0;
  appliedCouponCode = '';
  saveCart();

  closeCheckoutModal();
  showOrderSuccessModal(orderId, addressData, totalAmount);
}

function showOrderSuccessModal(orderId, addressData, total) {
  const overlay = document.getElementById('order-success-modal-overlay');
  const idEl = document.getElementById('success-order-id');
  const detailsEl = document.getElementById('success-order-details');

  if (idEl) idEl.textContent = `#${orderId}`;
  if (detailsEl) {
    detailsEl.innerHTML = `
      Your order of <b>₹${total.toLocaleString()}</b> has been confirmed.<br>
      Deliver to: <b>${addressData.name}</b>, ${addressData.city} (${addressData.pincode}).<br>
      Estimated delivery within <b>2-3 business days</b>.
    `;
  }

  if (overlay) {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeOrderSuccessModal() {
  const overlay = document.getElementById('order-success-modal-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function updateHeaderAddressUI(address) {
  const addressLabel = document.getElementById('header-address-text');
  if (addressLabel && address) {
    addressLabel.textContent = `${address.city} ${address.pincode}`;
  }
}

// ==========================================================================
// 8. LIVE SEARCH & SUGGESTIONS
// ==========================================================================
function initLiveSearch() {
  const searchInput = document.getElementById('header-search-input');
  const categorySelect = document.getElementById('header-category-select');
  const dropdown = document.getElementById('search-suggestions-dropdown');
  const searchBtn = document.getElementById('header-search-btn');

  if (!searchInput || !dropdown) return;

  let debounceTimer;

  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value.trim().toLowerCase();
    const cat = categorySelect ? categorySelect.value.toLowerCase() : 'all';

    if (query.length < 2) {
      dropdown.classList.remove('active');
      return;
    }

    debounceTimer = setTimeout(() => {
      let pool = (cat === 'all' || !productsByCategory[cat]) 
        ? allProducts 
        : productsByCategory[cat];

      const matches = pool.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.category.toLowerCase().includes(query) ||
        (p.brand && p.brand.toLowerCase().includes(query))
      ).slice(0, 5);

      if (matches.length > 0) {
        dropdown.innerHTML = matches.map(m => `
          <div class="suggestion-item" onclick="openQuickView(${m.id}); document.getElementById('search-suggestions-dropdown').classList.remove('active');">
            <img src="${m.img}" alt="${m.name}">
            <div class="suggestion-meta">
              <div class="suggestion-name">${m.name}</div>
              <div class="suggestion-sub">in ${m.category} • ⭐ ${m.rating || 4.8}</div>
            </div>
            <div class="suggestion-price">₹${m.price.toLocaleString()}</div>
          </div>
        `).join('') + `
          <div class="suggestion-item" style="justify-content: center; background: var(--bg-subtle);" onclick="executeSearch()">
            <span style="font-size: 0.8rem; font-weight: 700; color: var(--primary);">
              See all results for "${query}" →
            </span>
          </div>
        `;
        dropdown.classList.add('active');
      } else {
        dropdown.innerHTML = `
          <div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
            No products found matching "${query}"
          </div>
        `;
        dropdown.classList.add('active');
      }
    }, 200);
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeSearch();
    }
  });

  if (searchBtn) {
    searchBtn.addEventListener('click', executeSearch);
  }

  // Close dropdown on click outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrapper')) {
      dropdown.classList.remove('active');
    }
  });
}

function executeSearch() {
  const searchInput = document.getElementById('header-search-input');
  const categorySelect = document.getElementById('header-category-select');
  const query = searchInput ? searchInput.value.trim() : '';
  const category = categorySelect ? categorySelect.value.toLowerCase() : 'all';

  let url = 'category.html?';
  const params = [];
  if (category && category !== 'all') params.push(`category=${encodeURIComponent(category)}`);
  if (query) params.push(`query=${encodeURIComponent(query)}`);

  window.location.href = url + params.join('&');
}

// ==========================================================================
// 9. PRODUCT CARDS RENDERING (GRID & SLIDERS)
// ==========================================================================
function renderProductCardHTML(product) {
  const starsHtml = renderStars(product.rating || 4.8);
  const isWishlisted = wishlist.includes(product.id);

  return `
    <div class="product-card" onclick="openQuickView(${product.id}, event)">
      <div class="product-card-img-wrap">
        <img class="product-card-img" src="${product.img}" alt="${product.name}" loading="lazy">
        <div class="card-badge-top-left">
          ${product.discount ? `<span class="badge-discount">−${product.discount}%</span>` : ''}
          ${product.tag ? `<span class="badge-tag ${product.tagColor || 'badge-purple'}">${product.tag}</span>` : ''}
        </div>
        <div class="card-floating-actions">
          <button class="floating-action-btn ${isWishlisted ? 'wishlist-active' : ''}" 
                  data-wishlist-id="${product.id}" 
                  onclick="toggleWishlist(${product.id}, event)" 
                  title="Save to Wishlist">
            <i class="${isWishlisted ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}"></i>
          </button>
          <button class="floating-action-btn" onclick="openQuickView(${product.id}, event)" title="Quick View">
            <i class="fa-regular fa-eye"></i>
          </button>
        </div>
      </div>

      <div class="product-category-brand">
        <span>${product.brand || 'NOVA'}</span>
        <span>${product.category}</span>
      </div>

      <h3 class="product-card-title">${product.name}</h3>

      <div class="product-rating-row">
        <div class="rating-stars">${starsHtml}</div>
        <span class="rating-score">${product.rating || 4.8}</span>
        <span class="rating-count">(${product.reviews || 320})</span>
      </div>

      <div class="product-price-row">
        <span class="current-price">₹${product.price.toLocaleString()}</span>
        ${product.oldPrice ? `<span class="old-price">₹${product.oldPrice.toLocaleString()}</span>` : ''}
        ${product.oldPrice ? `<span class="savings-chip">Save ₹${(product.oldPrice - product.price).toLocaleString()}</span>` : ''}
      </div>

      <div class="card-cta-group">
        <button class="btn-add-cart" onclick="addToCart(${product.id}, 1, event)">
          <i class="fa-solid fa-bag-shopping"></i> Add to Cart
        </button>
        <button class="btn-quick-buy" onclick="instantBuyNow(${product.id}); event.stopPropagation();">
          Buy Now
        </button>
      </div>
    </div>
  `;
}

function renderFlashDealCardHTML(deal) {
  const starsHtml = renderStars(deal.rating || 4.9);
  const isWishlisted = wishlist.includes(deal.id);

  return `
    <div class="product-card" onclick="openQuickView(${deal.id}, event)">
      <div class="product-card-img-wrap">
        <img class="product-card-img" src="${deal.img}" alt="${deal.name}" loading="lazy">
        <div class="card-badge-top-left">
          <span class="badge-discount">−${deal.discount}% OFF</span>
          <span class="badge-tag badge-rose">${deal.dealType || 'Hot Deal'}</span>
        </div>
        <div class="card-floating-actions">
          <button class="floating-action-btn ${isWishlisted ? 'wishlist-active' : ''}" 
                  data-wishlist-id="${deal.id}" 
                  onclick="toggleWishlist(${deal.id}, event)" 
                  title="Save to Wishlist">
            <i class="${isWishlisted ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}"></i>
          </button>
          <button class="floating-action-btn" onclick="openQuickView(${deal.id}, event)" title="Quick View">
            <i class="fa-regular fa-eye"></i>
          </button>
        </div>
      </div>

      <div class="product-category-brand">
        <span>⚡ Flash Deal</span>
        <span>${deal.category}</span>
      </div>

      <h3 class="product-card-title">${deal.name}</h3>

      <div class="deal-claimed-bar-wrap">
        <div class="deal-claimed-info">
          <span>Claimed: ${deal.soldPercent}%</span>
          <span>Almost Sold Out!</span>
        </div>
        <div class="deal-claimed-bar">
          <div class="deal-claimed-fill" style="width: ${deal.soldPercent}%;"></div>
        </div>
      </div>

      <div class="product-price-row">
        <span class="current-price">₹${deal.price.toLocaleString()}</span>
        <span class="old-price">₹${deal.oldPrice.toLocaleString()}</span>
        <span class="savings-chip">Save ₹${(deal.oldPrice - deal.price).toLocaleString()}</span>
      </div>

      <div class="card-cta-group">
        <button class="btn-add-cart" onclick="addToCart(${deal.id}, 1, event)">
          <i class="fa-solid fa-bolt"></i> Claim Deal
        </button>
        <button class="btn-quick-buy" onclick="instantBuyNow(${deal.id}); event.stopPropagation();">
          Buy Now
        </button>
      </div>
    </div>
  `;
}

// ==========================================================================
// 10. HOMEPAGE SPECIFIC INITIALIZERS
// ==========================================================================
function initHomepage() {
  // 1. Render Flash Deals
  const flashContainer = document.getElementById('flash-deals-grid');
  if (flashContainer && typeof flashDeals !== 'undefined') {
    flashContainer.innerHTML = flashDeals.map(d => renderFlashDealCardHTML(d)).join('');
  }

  // 2. Render Footwear Spotlight
  const footwearContainer = document.getElementById('footwear-showcase-grid');
  if (footwearContainer && typeof footwearShowcase !== 'undefined') {
    footwearContainer.innerHTML = footwearShowcase.map(f => renderProductCardHTML(f)).join('');
  }

  // 3. Render Catalog Products with Filter & Sort
  renderFilteredCatalog();

  // 4. Hero Carousel
  initHeroSlider();

  // 5. Flash Sale Countdown Timer
  initFlashSaleCountdown();

  // 6. Filter Tabs
  initCatalogFilters();
}

function renderFilteredCatalog() {
  const container = document.getElementById('catalog-products-grid');
  if (!container) return;

  let list = (activeCategory === 'all') 
    ? [...allProducts] 
    : (productsByCategory[activeCategory] ? [...productsByCategory[activeCategory]] : [...allProducts]);

  // Apply sorting
  if (activeSort === 'price-asc') {
    list.sort((a, b) => a.price - b.price);
  } else if (activeSort === 'price-desc') {
    list.sort((a, b) => b.price - a.price);
  } else if (activeSort === 'rating') {
    list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (activeSort === 'discount') {
    list.sort((a, b) => (b.discount || 0) - (a.discount || 0));
  }

  container.innerHTML = list.map(p => renderProductCardHTML(p)).join('');
}

function initCatalogFilters() {
  const chips = document.querySelectorAll('.filter-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeCategory = chip.dataset.category || 'all';
      renderFilteredCatalog();
    });
  });

  const sortSelect = document.getElementById('catalog-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      activeSort = e.target.value;
      renderFilteredCatalog();
    });
  }
}

// Hero Carousel Logic
function initHeroSlider() {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.slider-dot');
  const prevBtn = document.getElementById('hero-prev-btn');
  const nextBtn = document.getElementById('hero-next-btn');

  if (slides.length === 0) return;

  let currentSlide = 0;
  let slideInterval;

  function showSlide(index) {
    if (index >= slides.length) currentSlide = 0;
    else if (index < 0) currentSlide = slides.length - 1;
    else currentSlide = index;

    slides.forEach((s, idx) => s.classList.toggle('active', idx === currentSlide));
    dots.forEach((d, idx) => d.classList.toggle('active', idx === currentSlide));
  }

  function startAutoPlay() {
    slideInterval = setInterval(() => {
      showSlide(currentSlide + 1);
    }, 5500);
  }

  function pauseAutoPlay() {
    clearInterval(slideInterval);
  }

  if (nextBtn) nextBtn.addEventListener('click', () => { pauseAutoPlay(); showSlide(currentSlide + 1); startAutoPlay(); });
  if (prevBtn) prevBtn.addEventListener('click', () => { pauseAutoPlay(); showSlide(currentSlide - 1); startAutoPlay(); });

  dots.forEach((dot, idx) => {
    dot.addEventListener('click', () => {
      pauseAutoPlay();
      showSlide(idx);
      startAutoPlay();
    });
  });

  const heroContainer = document.querySelector('.hero-slider-container');
  if (heroContainer) {
    heroContainer.addEventListener('mouseenter', pauseAutoPlay);
    heroContainer.addEventListener('mouseleave', startAutoPlay);
  }

  startAutoPlay();
}

// Flash Sale Countdown Timer
function initFlashSaleCountdown() {
  const timerH = document.getElementById('timer-h');
  const timerM = document.getElementById('timer-m');
  const timerS = document.getElementById('timer-s');

  if (!timerH || !timerM || !timerS) return;

  function update() {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);

    const diff = midnight - now;
    if (diff <= 0) {
      timerH.textContent = '00';
      timerM.textContent = '00';
      timerS.textContent = '00';
      return;
    }

    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);

    timerH.textContent = String(h).padStart(2, '0');
    timerM.textContent = String(m).padStart(2, '0');
    timerS.textContent = String(s).padStart(2, '0');
  }

  update();
  setInterval(update, 1000);
}

// ==========================================================================
// 11. GLOBAL DOCUMENT READY
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  updateCartCounters();
  updateWishlistCounters();
  initLiveSearch();

  if (savedAddress) {
    updateHeaderAddressUI(savedAddress);
  }

  // Address click in header triggers modal
  const deliveryPill = document.querySelector('.delivery-pill');
  if (deliveryPill) {
    deliveryPill.addEventListener('click', openCheckoutModal);
  }

  // Checkout form submit listener
  const checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', handleCheckoutSubmit);
  }

  // If on homepage, run homepage initializers
  if (document.getElementById('catalog-products-grid')) {
    initHomepage();
  }
});
