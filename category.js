/**
 * NOVA COMMERCE — Category & Catalog Filtering Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const categoryParam = (urlParams.get('category') || '').toLowerCase();
  const queryParam = (urlParams.get('query') || '').trim().toLowerCase();
  const viewParam = (urlParams.get('view') || '').toLowerCase();

  // DOM Elements
  const catalogHeading = document.getElementById('catalog-heading');
  const breadcrumbCurrent = document.getElementById('breadcrumb-current');
  const catalogCountLabel = document.getElementById('catalog-count-label');
  const categoryProductsGrid = document.getElementById('category-products-grid');
  const activeTagsRow = document.getElementById('active-filter-tags-row');

  // Sidebar Inputs
  const categoryCheckboxes = document.querySelectorAll('input[name="cat-filter"]');
  const priceSlider = document.getElementById('price-slider');
  const priceSliderDisplay = document.getElementById('price-slider-display');
  const ratingRadios = document.querySelectorAll('input[name="rating-filter"]');
  const dealsToggle = document.getElementById('only-deals-toggle');
  const sortSelect = document.getElementById('catalog-sort');
  const resetBtn = document.getElementById('reset-filters-btn');

  // Sync initial category from URL
  if (categoryParam && categoryParam !== 'all' && categoryParam !== 'deals') {
    categoryCheckboxes.forEach(cb => {
      if (cb.value === categoryParam) cb.checked = true;
    });
  } else if (categoryParam === 'deals') {
    if (dealsToggle) dealsToggle.checked = true;
  }

  // Sync search input if provided
  if (queryParam) {
    const searchInput = document.getElementById('header-search-input');
    if (searchInput) searchInput.value = queryParam;
  }

  // Price Slider Live Value
  if (priceSlider && priceSliderDisplay) {
    priceSlider.addEventListener('input', () => {
      priceSliderDisplay.textContent = `₹${parseInt(priceSlider.value).toLocaleString()}`;
      filterAndRender();
    });
  }

  // Checkbox & Toggle Listeners
  categoryCheckboxes.forEach(cb => cb.addEventListener('change', filterAndRender));
  ratingRadios.forEach(r => r.addEventListener('change', filterAndRender));
  if (dealsToggle) dealsToggle.addEventListener('change', filterAndRender);
  if (sortSelect) sortSelect.addEventListener('change', filterAndRender);

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      categoryCheckboxes.forEach(cb => cb.checked = false);
      if (priceSlider) {
        priceSlider.value = 150000;
        priceSliderDisplay.textContent = '₹1,50,000';
      }
      ratingRadios.forEach(r => { if (r.value === '0') r.checked = true; });
      if (dealsToggle) dealsToggle.checked = false;
      if (sortSelect) sortSelect.value = 'featured';

      // Clear search from URL without reload
      window.history.replaceState({}, '', 'category.html');
      filterAndRender();
    });
  }

  // Core Filtering & Rendering
  function filterAndRender() {
    if (!categoryProductsGrid) return;

    let pool = [...allProducts];

    // 1. Wishlist View
    if (viewParam === 'wishlist') {
      pool = pool.filter(p => wishlist.includes(p.id));
      if (catalogHeading) catalogHeading.textContent = 'Your Saved Wishlist';
      if (breadcrumbCurrent) breadcrumbCurrent.textContent = 'Wishlist';
    } else if (queryParam) {
      pool = pool.filter(p => 
        p.name.toLowerCase().includes(queryParam) ||
        p.category.toLowerCase().includes(queryParam) ||
        (p.brand && p.brand.toLowerCase().includes(queryParam))
      );
      if (catalogHeading) catalogHeading.textContent = `Search results for "${queryParam}"`;
      if (breadcrumbCurrent) breadcrumbCurrent.textContent = `Search: ${queryParam}`;
    } else {
      // Normal Category
      const selectedCats = Array.from(categoryCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);

      if (selectedCats.length > 0) {
        pool = pool.filter(p => selectedCats.includes(p.category));
        if (catalogHeading) {
          catalogHeading.textContent = selectedCats.length === 1 
            ? capitalize(selectedCats[0]) 
            : `${selectedCats.length} Categories Selected`;
        }
        if (breadcrumbCurrent) {
          breadcrumbCurrent.textContent = selectedCats.map(capitalize).join(', ');
        }
      } else {
        if (catalogHeading) catalogHeading.textContent = 'All Products';
        if (breadcrumbCurrent) breadcrumbCurrent.textContent = 'All Catalog';
      }
    }

    // 2. Price Filter
    if (priceSlider) {
      const maxPrice = parseInt(priceSlider.value);
      pool = pool.filter(p => p.price <= maxPrice);
    }

    // 3. Rating Filter
    const activeRatingRadio = Array.from(ratingRadios).find(r => r.checked);
    const minRating = activeRatingRadio ? parseFloat(activeRatingRadio.value) : 0;
    if (minRating > 0) {
      pool = pool.filter(p => (p.rating || 4.8) >= minRating);
    }

    // 4. Deals Only Filter
    if (dealsToggle && dealsToggle.checked) {
      pool = pool.filter(p => p.discount && p.discount > 0);
    }

    // 5. Sorting
    const sortVal = sortSelect ? sortSelect.value : 'featured';
    if (sortVal === 'price-asc') {
      pool.sort((a, b) => a.price - b.price);
    } else if (sortVal === 'price-desc') {
      pool.sort((a, b) => b.price - a.price);
    } else if (sortVal === 'rating') {
      pool.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortVal === 'discount') {
      pool.sort((a, b) => (b.discount || 0) - (a.discount || 0));
    }

    // 6. Update Result Count
    if (catalogCountLabel) {
      catalogCountLabel.textContent = `Showing ${pool.length} product${pool.length === 1 ? '' : 's'}`;
    }

    // 7. Render Active Filter Tags
    renderActiveFilterChips(minRating);

    // 8. Render Grid or Empty State
    if (pool.length === 0) {
      categoryProductsGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
          <div style="font-size: 3rem; color: var(--text-subtle); margin-bottom: 14px;">
            <i class="fa-solid fa-magnifying-glass"></i>
          </div>
          <h3 style="font-family: var(--font-heading); font-size: 1.3rem; margin-bottom: 8px;">No matching products found</h3>
          <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 20px;">Try adjusting your filters or search keywords.</p>
          <button class="btn-primary" onclick="document.getElementById('reset-filters-btn').click();">
            <i class="fa-solid fa-rotate-left"></i> Reset All Filters
          </button>
        </div>
      `;
    } else {
      categoryProductsGrid.innerHTML = pool.map(p => renderProductCardHTML(p)).join('');
      updateWishlistButtonsUI();
    }
  }

  function renderActiveFilterChips(minRating) {
    if (!activeTagsRow) return;

    let tags = [];

    const selectedCats = Array.from(categoryCheckboxes).filter(cb => cb.checked);
    selectedCats.forEach(cb => {
      tags.push({ label: capitalize(cb.value), onRemove: () => { cb.checked = false; filterAndRender(); } });
    });

    if (priceSlider && parseInt(priceSlider.value) < 150000) {
      tags.push({ label: `≤ ₹${parseInt(priceSlider.value).toLocaleString()}`, onRemove: () => { priceSlider.value = 150000; priceSliderDisplay.textContent = '₹1,50,000'; filterAndRender(); } });
    }

    if (minRating > 0) {
      tags.push({ label: `${minRating}★ & above`, onRemove: () => { ratingRadios.forEach(r => { if (r.value === '0') r.checked = true; }); filterAndRender(); } });
    }

    if (dealsToggle && dealsToggle.checked) {
      tags.push({ label: 'On Sale Only', onRemove: () => { dealsToggle.checked = false; filterAndRender(); } });
    }

    if (queryParam) {
      tags.push({ label: `Search: "${queryParam}"`, onRemove: () => { window.location.href = 'category.html'; } });
    }

    if (tags.length === 0) {
      activeTagsRow.innerHTML = '';
      return;
    }

    activeTagsRow.innerHTML = tags.map((t, idx) => `
      <span class="filter-chip active" style="font-size: 0.76rem; padding: 4px 10px; display: inline-flex; align-items: center; gap: 6px;">
        ${t.label}
        <i class="fa-solid fa-xmark remove-tag-btn" data-tag-idx="${idx}" style="cursor: pointer; font-size: 0.8rem;"></i>
      </span>
    `).join('');

    activeTagsRow.querySelectorAll('.remove-tag-btn').forEach(btn => {
      const idx = parseInt(btn.dataset.tagIdx);
      btn.addEventListener('click', () => tags[idx].onRemove());
    });
  }

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Initial Run
  filterAndRender();
});