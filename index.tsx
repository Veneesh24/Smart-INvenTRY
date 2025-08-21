/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, Type } from "@google/genai";

// --- TYPES ---
interface CustomField {
  name: string;
  value: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  bargainPrice?: number;
  currency: string;
  images: string[]; // Array of base64 strings
  customFields: CustomField[];
  quantity: number;
}

interface AiProductSuggestion {
  name: string;
  category: string;
  description: string;
  customFields: CustomField[];
  imagePrompts: string[];
  images: string[];
}

// --- ICONS ---
const icons = {
    dashboard: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
    inventory: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>`,
    import: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>`,
    export: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
    add: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
    edit: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
    delete: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`,
    products: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`,
    value: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
    lowStock: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="M12 8v4"></path><path d="M12 16h.01"></path></svg>`,
    category: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
    generate: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c.3 0 .5.1.8.3l6.4 3.7c.3.2.5.5.5.8v7.4c0 .3-.2.6-.5.8l-6.4 3.7c-.3.2-.5.3-.8.3s-.5-.1-.8-.3l-6.4-3.7c-.3-.2-.5-.5-.5-.8V7.8c0-.3.2-.6.5-.8l6.4-3.7c.3-.2.5-.3.8-.3z"></path><path d="M12 15.5l-6.4-3.7"></path><path d="M12 3.5v4.5l6.4 3.7"></path><path d="M18.4 11.8L12 15.5v4.5"></path><path d="M5.6 11.8l6.4 3.7"></path></svg>`,
};

// --- STATE MANAGEMENT ---
let products: Product[] = [];
let currentView: 'dashboard' | 'list' | 'form' = 'dashboard';
let editingProductId: string | null = null;
let selectedCategory: string = 'All';
let searchTerm: string = '';
let sortBy: string = 'default';
let aiProductSuggestions: AiProductSuggestion[] = [];
let aiSearchStatus: string = '';
const slideshowIntervals = new WeakMap<HTMLElement, number>();
const app = document.getElementById('app') as HTMLElement;
let activeModalConfirmation: (() => void) | null = null;

// --- GEMINI AI ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


// --- DATA PERSISTENCE ---
function saveProducts() {
  localStorage.setItem('inventory_products_v2', JSON.stringify(products));
}

function loadProducts() {
  const savedProducts = localStorage.getItem('inventory_products_v2');
  if (savedProducts) {
    products = JSON.parse(savedProducts);
  }
}

// --- RENDERING LOGIC ---

function render() {
  if (!app) return;

  // Stop all running slideshows before re-rendering to prevent memory leaks
  document.querySelectorAll('.product-card').forEach(card => stopSlideshow(card as HTMLElement));

  const appContent = `
    <div id="toast-container"></div>
    <div id="modal-container"></div>
    <header>
        <div class="header-left">
            <h1>Invntry</h1>
            <nav class="main-nav">
                <button class="nav-btn ${currentView === 'dashboard' ? 'active' : ''}" data-action="nav-dashboard">${icons.dashboard}Dashboard</button>
                <button class="nav-btn ${currentView === 'list' ? 'active' : ''}" data-action="nav-inventory">${icons.inventory}Inventory</button>
            </nav>
        </div>
        <div class="header-actions">
            <button class="secondary-btn icon-btn" data-action="import-json" aria-label="Import JSON">${icons.import}</button>
            <button class="secondary-btn icon-btn" data-action="export-json" aria-label="Export JSON">${icons.export}</button>
            <input type="file" id="import-file-input" style="display: none;" accept="application/json">
            ${currentView !== 'form' ? `<button data-action="add-new-product" class="primary-btn">${icons.add} Add Product</button>` : ''}
        </div>
    </header>
    <main class="fade-in">
        <!-- Main content will be injected here -->
    </main>
  `;
  app.innerHTML = appContent;

  const main = app.querySelector('main')!;
  if (currentView === 'dashboard') {
      main.appendChild(renderDashboard());
  } else if (currentView === 'list') {
    main.appendChild(renderCategoryFilters());
    main.appendChild(renderListControls());
    main.appendChild(renderInventoryList());
  } else {
    main.appendChild(renderProductForm());
  }

  if (currentView === 'list') {
    initializeSlideshows();
  }
}

function renderDashboard(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'dashboard-grid';

    // --- Calculate Metrics ---
    const totalProducts = products.length;

    const totalValueByCurrency = products.reduce((acc, product) => {
        const value = product.price * product.quantity;
        if (!acc[product.currency]) {
            acc[product.currency] = 0;
        }
        acc[product.currency] += value;
        return acc;
    }, {} as Record<string, number>);

    const categoryCounts = products.reduce((acc, product) => {
        const category = product.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const lowStockItems = products.filter(p => p.quantity > 0 && p.quantity <= 10)
                                 .sort((a,b) => a.quantity - b.quantity);

    // --- Render Widgets ---
    container.innerHTML = `
        <div class="dashboard-card stat-card" style="--stagger-index: 1;">
             <div class="card-icon">${icons.products}</div>
            <h3>Total Products</h3>
            <div class="stat-card-value">${totalProducts}</div>
        </div>

        <div class="dashboard-card stat-card" style="--stagger-index: 2;">
            <div class="card-icon">${icons.value}</div>
            <h3>Inventory Value</h3>
            <div class="stat-card-value">
                ${Object.keys(totalValueByCurrency).length > 0 ? 
                    Object.entries(totalValueByCurrency).map(([currency, value]) => `
                        <div>${getCurrencySymbol(currency)}${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    `).join('') :
                    'N/A'
                }
            </div>
        </div>

        <div class="dashboard-card full-width" style="--stagger-index: 3;">
            <div class="card-icon">${icons.category}</div>
            <h3>Products by Category</h3>
            ${Object.keys(categoryCounts).length > 0 ? renderCategoryChart(categoryCounts) : '<p class="empty-chart-message">No products with categories to display.</p>'}
        </div>

        <div class="dashboard-card full-width" style="--stagger-index: 4;">
            <div class="card-icon">${icons.lowStock}</div>
            <h3>Low Stock Items (10 or less)</h3>
            <div class="low-stock-list">
                ${lowStockItems.length > 0 ? 
                    lowStockItems.map(item => `
                        <div class="low-stock-item" data-action="edit-product" data-id="${item.id}" role="button" tabindex="0">
                            <span>${item.name}</span>
                            <span class="low-stock-quantity">${item.quantity} units left</span>
                        </div>
                    `).join('') :
                    '<p class="empty-list-message">Great! All items are well-stocked.</p>'
                }
            </div>
        </div>
    `;

    return container;
}

function renderCategoryChart(categoryCounts: Record<string, number>): string {
    const maxCount = Math.max(...Object.values(categoryCounts));
    const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);

    return `
        <div class="chart-container">
            ${sortedCategories.map(([category, count]) => `
                <div class="chart-bar-group">
                    <div class="chart-label">${category} (${count})</div>
                    <div class="chart-bar-wrapper">
                        <div class="chart-bar" style="width: ${(count / maxCount) * 100}%;"></div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderCategoryFilters(): HTMLElement {
    const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];
    const container = document.createElement('div');
    container.className = 'category-filters';

    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = 'category-filter-btn';
        if (category === selectedCategory) {
            button.classList.add('active');
        }
        button.textContent = category;
        button.dataset.category = category;
        button.dataset.action = 'filter-category';
        container.appendChild(button);
    });

    return container;
}

function renderListControls(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'list-controls';

    container.innerHTML = `
        <div class="search-container">
            <input type="search" id="search-input" class="search-input" placeholder="Search by name or description..." value="${searchTerm}">
        </div>
        <div class="sort-container">
            <label for="sort-select">Sort by:</label>
            <select id="sort-select" class="sort-select">
                <option value="default" ${sortBy === 'default' ? 'selected' : ''}>Default</option>
                <option value="name-asc" ${sortBy === 'name-asc' ? 'selected' : ''}>Name (A-Z)</option>
                <option value="name-desc" ${sortBy === 'name-desc' ? 'selected' : ''}>Name (Z-A)</option>
                <option value="price-asc" ${sortBy === 'price-asc' ? 'selected' : ''}>Price (Low to High)</option>
                <option value="price-desc" ${sortBy === 'price-desc' ? 'selected' : ''}>Price (High to Low)</option>
            </select>
        </div>
    `;
    return container;
}

function getStockBadgeHTML(quantity: number): string {
    if (quantity === 0) {
        return `<span class="stock-badge out-of-stock">Out of Stock</span>`;
    }
    if (quantity > 0 && quantity <= 10) {
        return `<span class="stock-badge low-stock">Low Stock (${quantity})</span>`;
    }
    return `<span class="stock-badge in-stock">In Stock (${quantity})</span>`;
}

function renderInventoryList(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'inventory-list-container';

  if (products.length === 0 && selectedCategory === 'All' && !searchTerm) {
    container.innerHTML = `
      <div class="empty-state">
        ${icons.inventory}
        <h2>Your Inventory is Empty</h2>
        <p>Click "Add Product" to get started.</p>
      </div>
    `;
    return container;
  }

  let displayedProducts = [...products];
  if (selectedCategory !== 'All') {
      displayedProducts = displayedProducts.filter(p => p.category === selectedCategory);
  }
  if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      displayedProducts = displayedProducts.filter(p => 
          p.name.toLowerCase().includes(lowerCaseSearchTerm) ||
          p.description.toLowerCase().includes(lowerCaseSearchTerm)
      );
  }
  switch (sortBy) {
      case 'name-asc': displayedProducts.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name-desc': displayedProducts.sort((a, b) => b.name.localeCompare(a.name)); break;
      case 'price-asc': displayedProducts.sort((a, b) => a.price - b.price); break;
      case 'price-desc': displayedProducts.sort((a, b) => b.price - a.price); break;
  }

  if (displayedProducts.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
            <h2>No Products Match Your Criteria</h2>
            <p>Try adjusting your search or filters.</p>
        </div>
      `;
      return container;
  }

  const grid = document.createElement('div');
  grid.className = 'inventory-grid';

  displayedProducts.forEach((product, index) => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.id = product.id;
    card.style.setProperty('--stagger-index', index.toString());


    const currencySymbol = getCurrencySymbol(product.currency);
    
    const imageSlideshowHTML = `
      <div class="product-card-image" data-current-index="0">
        <img src="${product.images[0] || ''}" alt="${product.name}" class="slideshow-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div class="image-placeholder" style="display: none;">No Image</div>
        ${product.images.length > 1 ? `
          <button class="slideshow-btn prev" data-action="slideshow-prev" aria-label="Previous image">&#10094;</button>
          <button class="slideshow-btn next" data-action="slideshow-next" aria-label="Next image">&#10095;</button>
        ` : ''}
      </div>
    `;

    card.innerHTML = `
      ${imageSlideshowHTML}
      <div class="product-card-content">
        <div class="product-card-meta">
            <span class="product-card-category">${product.category || 'Uncategorized'}</span>
            ${getStockBadgeHTML(product.quantity)}
        </div>
        <h3>${product.name}</h3>
        <p class="product-card-description">${product.description.substring(0, 100)}${product.description.length > 100 ? '...' : ''}</p>
        
        ${product.customFields.length > 0 ? `
          <div class="product-card-custom-fields">
            ${product.customFields.slice(0, 2).map(field => `
              <div class="custom-field-item">
                <strong>${field.name}:</strong> <span>${field.value}</span>
              </div>
            `).join('')}
            ${product.customFields.length > 2 ? `<div class="custom-field-item">...and more</div>` : ''}
          </div>
        ` : ''}
        
        <div class="product-card-footer">
            <div class="product-card-pricing">
              <span class="price">${currencySymbol}${product.price}</span>
              ${product.bargainPrice ? `<span class="bargain-price">${currencySymbol}${product.bargainPrice}</span>` : ''}
            </div>
            <div class="product-card-actions">
              <button class="icon-btn edit-btn" data-action="edit-product" aria-label="Edit Product">${icons.edit}</button>
              <button class="icon-btn delete-btn" data-action="delete-product" aria-label="Delete Product">${icons.delete}</button>
            </div>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  container.appendChild(grid);
  return container;
}

function renderProductForm(): HTMLElement {
  const productToEdit = editingProductId ? products.find(p => p.id === editingProductId) : null;
  const formWrapper = document.createElement('div');
  formWrapper.className = 'form-container';

  const aiSearchSection = `
    ${!productToEdit ? `
        <div class="ai-search-section">
            <div class="ai-section-header">
                <h3>${icons.generate} AI Product Assistant</h3>
                <p>Describe a product, and let AI brainstorm variations with details and a full set of generated images.</p>
            </div>
            <div class="ai-search-input-group">
                <input type="text" id="ai-search-query" placeholder="e.g., 'wireless gaming mouse' or 'eco-friendly water bottle'">
                <button type="button" class="primary-btn" data-action="ai-product-search">Generate</button>
            </div>
            <div id="ai-search-status" class="ai-search-status">${aiSearchStatus}</div>
            <div id="ai-suggestions-container" class="ai-suggestions-grid">
                ${aiProductSuggestions.map((suggestion, index) => `
                    <div class="ai-suggestion-card" style="--stagger-index: ${index};">
                        <div class="ai-suggestion-image">
                             ${suggestion.images && suggestion.images.length > 0 ?
                                `<img src="${suggestion.images[0]}" alt="${suggestion.name}">
                                 ${suggestion.images.length > 1 ? `<span class="multi-image-badge">+${suggestion.images.length - 1}</span>` : ''}` :
                                '<div class="image-placeholder shimmer"></div>'
                            }
                        </div>
                        <div class="ai-suggestion-content">
                            <h4>${suggestion.name}</h4>
                            <p class="suggestion-category"><strong>Category:</strong> ${suggestion.category}</p>
                            ${suggestion.customFields.length > 0 ? `
                                <div class="ai-suggestion-specs">
                                    ${suggestion.customFields.slice(0, 3).map(field => `
                                        <div class="spec-item"><strong>${field.name}:</strong> ${field.value}</div>
                                    `).join('')}
                                </div>
                            ` : ''}
                            <button class="secondary-btn select-suggestion-btn" data-action="select-ai-suggestion" data-index="${index}">Select</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : ''}
  `;

  const form = document.createElement('form');
  form.id = 'product-form';
  form.className = 'product-form';
  form.noValidate = true;
  form.addEventListener('submit', handleFormSubmit);

  const currencyOptions = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD'];
  const allCategories = [...new Set(products.map(p => p.category).filter(Boolean))];

  form.innerHTML = `
    <h2>${productToEdit ? 'Edit Product' : 'Add New Product'}</h2>
    <div class="form-group">
      <label for="product-name">Product Name</label>
      <input type="text" id="product-name" required value="${productToEdit?.name || ''}">
    </div>
    <div class="form-group">
      <label for="product-category-select">Category</label>
      <div class="category-input-group">
        <select id="product-category-select">
            <option value="" disabled ${!productToEdit?.category ? 'selected' : ''}>Select a category</option>
            ${allCategories.map(c => `<option value="${c}" ${productToEdit?.category === c ? 'selected' : ''}>${c}</option>`).join('')}
            <option value="--create-new--">-- Create New Category --</option>
        </select>
        <input type="text" id="product-new-category" placeholder="Enter new category name" style="display: none; margin-top: 0.5rem;">
      </div>
    </div>
    <div class="form-group">
        <label>Product Images</label>
        <div class="image-upload-area">
            <div id="image-previews"></div>
            <input type="file" id="image-upload" multiple accept="image/*" style="display: none;">
            <button type="button" class="secondary-btn" data-action="upload-trigger">Select Images</button>
        </div>
    </div>
    <div class="form-group">
      <div class="form-label-group">
        <label for="product-description">Description</label>
        <button type="button" class="ai-generate-btn" data-action="generate-description">${icons.generate} Generate with AI</button>
      </div>
      <textarea id="product-description" rows="4" required>${productToEdit?.description || ''}</textarea>
    </div>
    <div class="form-row">
       <div class="form-group">
        <label for="product-quantity">Quantity in Stock</label>
        <input type="number" id="product-quantity" min="0" required value="${productToEdit?.quantity ?? 0}">
      </div>
      <div class="form-group">
        <label for="product-price">Price</label>
        <input type="number" id="product-price" min="0" step="0.01" required value="${productToEdit?.price || ''}">
      </div>
      <div class="form-group">
        <label for="product-bargain-price">Bargain Price (Optional)</label>
        <input type="number" id="product-bargain-price" min="0" step="0.01" value="${productToEdit?.bargainPrice || ''}">
      </div>
    </div>
     <div class="form-group">
        <label for="product-currency">Currency</label>
        <select id="product-currency" required>
            ${currencyOptions.map(c => `<option value="${c}" ${productToEdit?.currency === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
      </div>
    <fieldset>
        <legend>Custom Fields</legend>
        <div id="custom-fields-container"></div>
        <button type="button" class="add-field-btn" data-action="add-custom-field">${icons.add} Add Field</button>
    </fieldset>
    <div class="form-actions">
        <button type="button" class="secondary-btn" data-action="cancel-form">Cancel</button>
        <button type="submit" class="primary-btn">${productToEdit ? 'Update Product' : 'Save Product'}</button>
    </div>
  `;
    
  formWrapper.innerHTML = aiSearchSection;
  formWrapper.appendChild(form);
    
  setTimeout(() => {
      if (productToEdit) {
          productToEdit.customFields.forEach(field => addCustomFieldRow(field.name, field.value));
          productToEdit.images.forEach(img => addImagePreview(img));
      }
      const categorySelect = document.getElementById('product-category-select') as HTMLSelectElement;
      if (productToEdit?.category && !allCategories.includes(productToEdit.category)) {
          const option = new Option(productToEdit.category, productToEdit.category, true, true);
          categorySelect.add(option, categorySelect.options[categorySelect.options.length - 1]);
      }
  }, 0);

  return formWrapper;
}


// --- EVENT HANDLERS & LOGIC ---

function attachEventListeners() {
    app.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        const actionTarget = target.closest('[data-action]') as HTMLElement | null;
        if (!actionTarget) return;

        const action = actionTarget.dataset.action;
        switch (action) {
            case 'nav-dashboard': showDashboardView(); break;
            case 'nav-inventory': showListView(); break;
            case 'add-new-product': showAddForm(); break;
            case 'cancel-form': showListView(); break;
            case 'edit-product': handleEditClick(actionTarget); break;
            case 'delete-product': handleDeleteClick(actionTarget); break;
            case 'filter-category': handleCategoryFilterClick(actionTarget); break;
            case 'slideshow-prev': handleSlideshowNav(actionTarget, 'prev'); break;
            case 'slideshow-next': handleSlideshowNav(actionTarget, 'next'); break;
            case 'upload-trigger': document.getElementById('image-upload')?.click(); break;
            case 'add-custom-field': addCustomFieldRow(); break;
            case 'remove-custom-field': handleRemoveCustomField(actionTarget); break;
            case 'remove-image': (actionTarget.parentElement as HTMLElement).remove(); break;
            case 'modal-confirm': if (activeModalConfirmation) activeModalConfirmation(); break;
            case 'modal-close': hideModal(); break;
            case 'export-json': handleExportJSON(); break;
            case 'import-json': document.getElementById('import-file-input')?.click(); break;
            case 'generate-description': handleGenerateDescription(actionTarget); break;
            case 'ai-product-search': handleAiProductSearch(actionTarget); break;
            case 'select-ai-suggestion': handleSelectAiSuggestion(actionTarget); break;
        }
    });

    app.addEventListener('input', (event) => {
        const target = event.target as HTMLElement;
        if (target.id === 'search-input') {
            searchTerm = (target as HTMLInputElement).value;
            debouncedRenderList();
        }
    });

    app.addEventListener('change', (event) => {
        const target = event.target as HTMLElement;
        if (target.id === 'sort-select') {
            sortBy = (target as HTMLSelectElement).value;
            render();
        } else if (target.id === 'image-upload') {
            handleImageUpload(target as HTMLInputElement);
        } else if (target.id === 'product-category-select') {
            handleCategoryChange(target as HTMLSelectElement);
        }
    });

    app.addEventListener('mouseenter', (event) => {
        const card = (event.target as HTMLElement).closest('.product-card');
        if (card) stopSlideshow(card as HTMLElement);
    }, true);

    app.addEventListener('mouseleave', (event) => {
        const card = (event.target as HTMLElement).closest('.product-card');
        if (card) startSlideshow(card as HTMLElement);
    }, true);
}


async function handleAiProductSearch(button: HTMLElement) {
    if (!process.env.API_KEY) {
        showToast('API_KEY environment variable not set.', 'error');
        return;
    }

    const query = (document.getElementById('ai-search-query') as HTMLInputElement)?.value;
    if (!query || query.trim() === '') {
        showToast('Please enter a product idea to search for.', 'error');
        return;
    }

    (button as HTMLButtonElement).disabled = true;
    button.classList.add('loading');
    aiProductSuggestions = [];
    aiSearchStatus = 'Generating product ideas...';
    renderProductFormContent();

    const prompt = `You are an expert product data specialist for an e-commerce platform.
    Your task is to brainstorm and generate up to 3 creative and distinct product variations based on the user's query: "${query}".

    For EACH product suggestion, provide the following details:
    1.  **name**: A creative and marketable product name.
    2.  **category**: The most appropriate e-commerce category (e.g., "Smartphones", "Laptops", "Headphones").
    3.  **description**: A compelling, concise product description (1-2 sentences).
    4.  **customFields**: An array of 3-5 key technical specifications. Format as an array of objects: [{ "name": "Spec Name", "value": "Spec Value" }].
    5.  **imagePrompts**: An array of exactly 3 detailed and distinct prompts for an image generation AI. Each prompt should describe a different shot of the product (e.g., a clean studio shot on a white background, a lifestyle shot showing the product in use, a close-up detail shot). The prompts should be photographic and highly descriptive.`;

    const responseSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                category: { type: Type.STRING },
                description: { type: Type.STRING },
                customFields: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            value: { type: Type.STRING },
                        },
                    },
                },
                imagePrompts: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                },
            },
        },
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
            },
        });

        const textResponse = response.text.trim();
        const suggestionsFromAI = JSON.parse(textResponse) as Omit<AiProductSuggestion, 'images'>[];

        if (!suggestionsFromAI || suggestionsFromAI.length === 0) {
            throw new Error('AI failed to generate any product ideas. Please try a different query.');
        }
        
        aiSearchStatus = `Found ${suggestionsFromAI.length} suggestion(s). Now generating images...`;
        aiProductSuggestions = suggestionsFromAI.map(s => ({ ...s, images: [] }));
        renderProductFormContent();

        const suggestionsWithImages = await Promise.all(suggestionsFromAI.map(async (suggestion) => {
            const imagePromises = suggestion.imagePrompts.map(prompt =>
                ai.models.generateImages({
                    model: 'imagen-3.0-generate-002',
                    prompt: prompt,
                    config: { numberOfImages: 1 }
                }).then(res => `data:image/png;base64,${res.generatedImages[0].image.imageBytes}`)
                  .catch(e => {
                      console.error("Image generation failed for prompt:", prompt, e);
                      return '';
                  })
            );
            const images = (await Promise.all(imagePromises)).filter(Boolean);
            return { ...suggestion, images };
        }));

        aiProductSuggestions = suggestionsWithImages;
        aiSearchStatus = `Found ${suggestionsWithImages.length} suggestion(s).`;

    } catch (error) {
        console.error('AI Product Search Error:', error);
        showToast(`AI Error: ${(error as Error).message}`, 'error');
        aiProductSuggestions = [];
        aiSearchStatus = 'Search failed. Please try again.';
    } finally {
        const searchButton = document.querySelector('[data-action="ai-product-search"]') as HTMLButtonElement | null;
        if (searchButton) {
            searchButton.disabled = false;
            searchButton.classList.remove('loading');
        }
        renderProductFormContent();
    }
}


function handleSelectAiSuggestion(button: HTMLElement) {
    const index = parseInt(button.dataset.index || '0', 10);
    const suggestion = aiProductSuggestions[index];
    if (!suggestion) return;

    (document.getElementById('product-name') as HTMLInputElement).value = suggestion.name;
    (document.getElementById('product-description') as HTMLTextAreaElement).value = suggestion.description;

    const categorySelect = document.getElementById('product-category-select') as HTMLSelectElement;
    const allCategories = [...categorySelect.options].map(opt => opt.value);

    if (allCategories.includes(suggestion.category)) {
        categorySelect.value = suggestion.category;
    } else {
        const newOption = new Option(suggestion.category, suggestion.category, true, true);
        categorySelect.add(newOption, categorySelect.options[categorySelect.options.length - 1]);
    }
    handleCategoryChange(categorySelect);

    const previewsContainer = document.getElementById('image-previews');
    if (previewsContainer) previewsContainer.innerHTML = '';
    if (suggestion.images && suggestion.images.length > 0) {
        suggestion.images.forEach(imgData => addImagePreview(imgData));
    }

    const customFieldsContainer = document.getElementById('custom-fields-container');
    if (customFieldsContainer) customFieldsContainer.innerHTML = '';
    if (suggestion.customFields && suggestion.customFields.length > 0) {
        suggestion.customFields.forEach(field => {
            addCustomFieldRow(field.name, field.value);
        });
    }

    aiProductSuggestions = [];
    renderProductFormContent();
    showToast(`Form filled with AI-generated data and images.`);
}


async function handleGenerateDescription(button: HTMLElement) {
    if (!process.env.API_KEY) {
        showToast('API_KEY environment variable not set.', 'error');
        return;
    }

    const productName = (document.getElementById('product-name') as HTMLInputElement)?.value;
    if (!productName || productName.trim() === '') {
        showToast('Please enter a product name first.', 'error');
        return;
    }

    (button as HTMLButtonElement).disabled = true;
    button.classList.add('loading');

    const prompt = `Write a compelling and concise e-commerce product description for: "${productName}". Keep it under 80 words. Focus on benefits and key features. Do not use markdown formatting.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        const description = response.text;
        const descriptionTextarea = document.getElementById('product-description') as HTMLTextAreaElement;
        if (descriptionTextarea) {
            descriptionTextarea.value = description;
            descriptionTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
    } catch (error) {
        console.error('Error generating description:', error);
        showToast(`AI Error: ${(error as Error).message}`, 'error');
    } finally {
        (button as HTMLButtonElement).disabled = false;
        button.classList.remove('loading');
    }
}


function handleCategoryChange(selectElement: HTMLSelectElement) {
    const newCategoryInput = document.getElementById('product-new-category') as HTMLInputElement;
    if (!newCategoryInput) return;

    if (selectElement.value === '--create-new--') {
        newCategoryInput.style.display = 'block';
        newCategoryInput.required = true;
    } else {
        newCategoryInput.style.display = 'none';
        newCategoryInput.required = false;
        newCategoryInput.value = '';
    }
}

function handleCategoryFilterClick(button: HTMLElement) {
    const category = button.dataset.category;
    if (category) {
        selectedCategory = category;
        render();
    }
}

function handleSlideshowNav(button: HTMLElement, direction: 'next' | 'prev') {
    const card = button.closest('.product-card') as HTMLElement;
    if (card) {
        changeSlide(card, direction);
    }
}

function changeSlide(card: HTMLElement, direction: 'next' | 'prev' = 'next') {
    const imageContainer = card.querySelector('.product-card-image') as HTMLElement;
    const imageEl = card.querySelector('.slideshow-image') as HTMLImageElement;
    if (!imageContainer || !imageEl || !card.dataset.id) return;

    const product = products.find(p => p.id === card.dataset.id);
    if (!product || product.images.length <= 1) return;

    let currentIndex = parseInt(imageContainer.dataset.currentIndex || '0', 10);
    
    if (direction === 'next') {
        currentIndex = (currentIndex + 1) % product.images.length;
    } else {
        currentIndex = (currentIndex - 1 + product.images.length) % product.images.length;
    }
    
    imageEl.style.opacity = '0';
    setTimeout(() => {
        imageEl.src = product.images[currentIndex];
        imageContainer.dataset.currentIndex = currentIndex.toString();
        imageEl.style.opacity = '1';
    }, 200);
}

function initializeSlideshows() {
    document.querySelectorAll('.product-card').forEach(card => {
        startSlideshow(card as HTMLElement);
    });
}

function startSlideshow(card: HTMLElement) {
    if (slideshowIntervals.has(card)) return;
    const product = products.find(p => p.id === card.dataset.id);
    if (product && product.images.length > 1) {
        const intervalId = window.setInterval(() => changeSlide(card, 'next'), 3000);
        slideshowIntervals.set(card, intervalId);
    }
}

function stopSlideshow(card: HTMLElement) {
    if (slideshowIntervals.has(card)) {
        clearInterval(slideshowIntervals.get(card));
        slideshowIntervals.delete(card);
    }
}

function showAddForm() {
  currentView = 'form';
  editingProductId = null;
  aiProductSuggestions = [];
  aiSearchStatus = '';
  render();
}

function showListView() {
  currentView = 'list';
  editingProductId = null;
  render();
}

function showDashboardView() {
    currentView = 'dashboard';
    render();
}

function handleEditClick(element: HTMLElement) {
    const id = (element.closest('[data-id]') as HTMLElement)?.dataset.id;
    if (id) {
        editingProductId = id;
        currentView = 'form';
        render();
    }
}

function handleDeleteClick(button: HTMLElement) {
    const card = button.closest('.product-card') as HTMLElement;
    const id = card?.dataset.id;
    if (id) {
        showModal('Are you sure you want to delete this product?', () => {
            products = products.filter(p => p.id !== id);
            saveProducts();
            showToast('Product deleted successfully.');
            render();
        });
    }
}

async function handleFormSubmit(event: Event) {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;

  if (submitButton) {
      submitButton.disabled = true;
      submitButton.classList.add('loading');
  }

  try {
    await new Promise(resolve => setTimeout(resolve, 50));

    const name = (document.getElementById('product-name') as HTMLInputElement).value;
    const description = (document.getElementById('product-description') as HTMLTextAreaElement).value;
    const price = parseFloat((document.getElementById('product-price') as HTMLInputElement).value);
    const bargainPriceValue = (document.getElementById('product-bargain-price') as HTMLInputElement).value;
    const bargainPrice = bargainPriceValue ? parseFloat(bargainPriceValue) : undefined;
    const currency = (document.getElementById('product-currency') as HTMLSelectElement).value;
    const quantity = parseInt((document.getElementById('product-quantity') as HTMLInputElement).value, 10);

    if (bargainPrice !== undefined && !isNaN(price) && bargainPrice > price) {
        showToast('Bargain price cannot be higher than the regular price.', 'error');
        return;
    }
    
    if (isNaN(quantity) || quantity < 0) {
        showToast('Please enter a valid quantity (0 or greater).', 'error');
        return;
    }

    const categorySelect = document.getElementById('product-category-select') as HTMLSelectElement;
    const newCategoryInput = document.getElementById('product-new-category') as HTMLInputElement;
    let category = '';

    if (categorySelect.value === '--create-new--') {
        category = newCategoryInput.value.trim();
        if (!category) {
            showToast('Please enter a name for the new category.', 'error');
            return;
        }
    } else {
        category = categorySelect.value;
    }
    
    if (!category) {
        showToast('Please select or create a category.', 'error');
        return;
    }

    const images: string[] = Array.from(document.querySelectorAll<HTMLDivElement>('.image-preview'))
                                  .map(preview => preview.dataset.imageData)
                                  .filter((data): data is string => !!data);

    const customFields: CustomField[] = [];
    document.querySelectorAll('.custom-field-row').forEach(row => {
      const nameInput = row.querySelector('.custom-field-name') as HTMLInputElement;
      const valueInput = row.querySelector('.custom-field-value') as HTMLInputElement;
      if (nameInput.value.trim() && valueInput.value.trim()) {
        customFields.push({ name: nameInput.value.trim(), value: valueInput.value.trim() });
      }
    });

    if (editingProductId) {
      const productIndex = products.findIndex(p => p.id === editingProductId);
      if (productIndex > -1) {
        products[productIndex] = { ...products[productIndex], name, category, description, price, bargainPrice, currency, images, customFields, quantity };
      }
    } else {
      const newProduct: Product = { id: Date.now().toString(), name, category, description, price, bargainPrice, currency, images, customFields, quantity };
      products.push(newProduct);
    }

    saveProducts();
    showToast(`Product ${editingProductId ? 'updated' : 'saved'} successfully.`);
    selectedCategory = category || 'All';
    showListView();
  } finally {
      if (currentView === 'form' && submitButton) {
          submitButton.disabled = false;
          submitButton.classList.remove('loading');
      }
  }
}

function addCustomFieldRow(name = '', value = '') {
    const container = document.getElementById('custom-fields-container');
    if (!container) return;
    const row = document.createElement('div');
    row.className = 'custom-field-row';
    row.innerHTML = `
        <input type="text" class="custom-field-name" placeholder="Field Name (e.g., Size)" value="${name}">
        <input type="text" class="custom-field-value" placeholder="Field Value (e.g., Large)" value="${value}">
        <button type="button" class="icon-btn remove-custom-field-btn" data-action="remove-custom-field" aria-label="Remove Field">&times;</button>
    `;
    container.appendChild(row);
}

function handleRemoveCustomField(button: HTMLElement) {
    button.closest('.custom-field-row')?.remove();
}

function handleImageUpload(input: HTMLInputElement) {
    if (!input.files) return;
    for (const file of Array.from(input.files)) {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                addImagePreview(e.target.result as string);
            }
        };
        reader.readAsDataURL(file);
    }
    input.value = '';
}

function addImagePreview(imageDataUrl: string) {
    const container = document.getElementById('image-previews');
    if (!container) return;
    const preview = document.createElement('div');
    preview.className = 'image-preview';
    preview.style.backgroundImage = `url(${imageDataUrl})`;
    preview.dataset.imageData = imageDataUrl;
    preview.innerHTML = `<button type="button" class="remove-image-btn" data-action="remove-image" aria-label="Remove Image">&times;</button>`;
    container.appendChild(preview);
}

// --- DATA IMPORT/EXPORT ---
function handleExportJSON() {
    if (products.length === 0) {
        showToast('No products to export.', 'error');
        return;
    }
    const dataStr = JSON.stringify(products, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Inventory exported successfully.');
}

function handleImportFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result as string;
            const importedProducts = JSON.parse(text);
            if (!Array.isArray(importedProducts)) {
                throw new Error('Imported file is not a valid product array.');
            }
            if (importedProducts.length > 0 && (!importedProducts[0].id || !importedProducts[0].name)) {
                 throw new Error('Imported data seems to be in the wrong format.');
            }
            showModal('This will overwrite your current inventory. Are you sure?', () => {
                products = importedProducts;
                saveProducts();
                showToast('Inventory imported successfully.');
                selectedCategory = 'All';
                showListView();
            });
        } catch (error) {
            showToast(`Error importing file: ${(error as Error).message}`, 'error');
        } finally {
            input.value = '';
        }
    };
    reader.readAsText(file);
}


// --- UI UTILS (MODALS, TOASTS) ---
function showToast(message: string, type: 'success' | 'error' = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, 4000);
}

function showModal(message: string, onConfirm: () => void) {
    const container = document.getElementById('modal-container');
    if (!container) return;
    
    activeModalConfirmation = () => {
        onConfirm();
        hideModal();
    };
    
    container.innerHTML = `
        <div class="modal-overlay" data-action="modal-close"></div>
        <div class="modal-content">
            <p>${message}</p>
            <div class="modal-actions">
                <button class="secondary-btn" data-action="modal-close">Cancel</button>
                <button class="primary-btn" data-action="modal-confirm">Confirm</button>
            </div>
        </div>
    `;
    container.classList.add('visible');
    (container.querySelector('.modal-content') as HTMLElement)?.focus();
}

function hideModal() {
    const container = document.getElementById('modal-container');
    if (container) {
        container.classList.remove('visible');
        container.addEventListener('transitionend', () => {
            if (!container.classList.contains('visible')) {
                container.innerHTML = '';
            }
        }, { once: true });
    }
    activeModalConfirmation = null;
}

// --- PARTIAL RENDERING & DEBOUNCING ---
function renderProductFormContent() {
    const formContainer = document.querySelector('.form-container');
    if (formContainer) {
        formContainer.replaceWith(renderProductForm());
    }
}

let debounceTimer: number;
function debouncedRenderList() {
    clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
        const listContainer = document.querySelector('.inventory-list-container');
        if(listContainer) {
            listContainer.replaceWith(renderInventoryList());
            initializeSlideshows();
        } else {
            render(); // Fallback to full render if container not found
        }
    }, 250);
}

// --- UTILS ---
function getCurrencySymbol(currencyCode: string): string {
  const symbols: { [key: string]: string } = { USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥', CAD: '$', AUD: '$' };
  return symbols[currencyCode] || currencyCode;
}


// --- INITIALIZATION ---
function init() {
  loadProducts();
  attachEventListeners();
  document.addEventListener('change', (event) => {
      if ((event.target as HTMLElement).id === 'import-file-input') {
          handleImportFile(event);
      }
  });
  render();
}

init();
