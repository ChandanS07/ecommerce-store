const PRODUCTS = [
  {
    id: 1,
    name: "Linen Accent Chair",
    category: "seating",
    price: 30999,
    badge: "Best Seller",
    description: "Hand-stitched linen upholstery on a solid oak frame.",
    image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&q=80",
  },
  {
    id: 2,
    name: "Pendant Globe Light",
    category: "lighting",
    price: 16999,
    badge: "New",
    description: "Mouth-blown borosilicate glass with a brass fittings.",
    image: "https://images.unsplash.com/photo-1672583144829-4757df16aaca?w=600&q=80",
  },
  {
    id: 3,
    name: "Walnut Side Table",
    category: "storage",
    price: 10999,
    badge: null,
    description: "Solid American walnut with mortise & tenon joinery.",
    image: "https://images.unsplash.com/photo-1749476101600-90b2eb7efa89?w=600&q=80",
  },
  {
    id: 4,
    name: "Ceramic Bud Vase",
    category: "decor",
    price: 5999,
    badge: "New",
    description: "Wheel-thrown stoneware with an ash glaze finish.",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&q=80",
  },
  {
    id: 5,
    name: "Wool Throw Blanket",
    category: "decor",
    price: 10999,
    badge: null,
    description: "100% Merino wool, undyed and naturally processed.",
    image: "https://images.unsplash.com/photo-1696337267138-04b0caf20c76?w=600&q=80",
  },
  {
    id: 6,
    name: "Oak Shelf Unit",
    category: "storage",
    price: 37999,
    badge: "Best Seller",
    description: "Modular shelving in solid European white oak.",
    image: "https://plus.unsplash.com/premium_photo-1714329906297-bf74090791bc?w=600&q=80",
  },
  {
    id: 7,
    name: "Travertine Candle Set",
    category: "decor",
    price: 6999,
    badge: null,
    description: "Carved natural travertine holders, set of three.",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80",
  },
  {
    id: 8,
    name: "Arc Floor Lamp",
    category: "lighting",
    price: 27999,
    badge: "New",
    description: "Brushed brass arc with a ribbed linen shade.",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80",
  },
];

/* ── STATE ───────────────────────────────────────────────── */
/**
 * cart is an array of objects: { ...product, quantity: Number }
 * We persist it to LocalStorage so it survives page refreshes.
 */
let cart = loadCartFromStorage();
let activeFilter = "all";

/* ── DOM REFERENCES ─────────────────────────────────────── */
const productGrid    = document.getElementById("productGrid");
const filterBar      = document.getElementById("filterBar");
const cartDrawer     = document.getElementById("cartDrawer");
const cartOverlay    = document.getElementById("cartOverlay");
const cartToggleBtn  = document.getElementById("cartToggleBtn");
const cartCloseBtn   = document.getElementById("cartCloseBtn");
const cartCount      = document.getElementById("cartCount");
const cartItemsEl    = document.getElementById("cartItems");
const cartTotalEl    = document.getElementById("cartTotal");
const clearCartBtn   = document.getElementById("clearCartBtn");
const checkoutBtn    = document.getElementById("checkoutBtn");
const toastEl        = document.getElementById("toast");
const header         = document.getElementById("header");

/* ── INITIALISATION ─────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  renderProducts(PRODUCTS);    // Render full product list
  updateCartUI();              // Sync cart badge & drawer from storage
  bindEventListeners();        // Wire up all event handlers
});

/* ── RENDER: PRODUCTS ────────────────────────────────────── */
/**
 * Renders an array of product objects into the product grid.
 * Called on load and whenever a filter is applied.
 * @param {Array} products - filtered or full product array
 */
function renderProducts(products) {
  productGrid.innerHTML = "";  // Clear existing cards

  if (products.length === 0) {
    productGrid.innerHTML = `<p style="color:var(--color-ink-muted); font-size:14px; grid-column:1/-1; padding:2rem 0;">No products found in this category.</p>`;
    return;
  }

  products.forEach((product) => {
    const card = createProductCard(product);
    productGrid.appendChild(card);
  });
}

/**
 * Builds and returns a product card DOM element.
 * @param {Object} product - single product from PRODUCTS array
 * @returns {HTMLElement}
 */
function createProductCard(product) {
  const isInCart = cart.some((item) => item.id === product.id);

  const article = document.createElement("article");
  article.classList.add("product-card");
  article.dataset.id = product.id;

  article.innerHTML = `
    <div class="product-card__image-wrap">
      <img
        src="${product.image}"
        alt="${product.name}"
        loading="lazy"
      />
      ${product.badge ? `<span class="product-card__badge">${product.badge}</span>` : ""}
    </div>
    <div class="product-card__body">
      <p class="product-card__category">${capitalise(product.category)}</p>
      <h3 class="product-card__name">${product.name}</h3>
      <p class="product-card__desc">${product.description}</p>
      <div class="product-card__footer">
        <span class="product-card__price">${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(product.price)}
        </span>
        <button
          class="product-card__add-btn ${isInCart ? "in-cart" : ""}"
          data-id="${product.id}"
          aria-label="Add ${product.name} to cart"
        >
          ${isInCart ? "✓ Added" : "+ Cart"}
        </button>
      </div>
    </div>
  `;

  // Attach click listener to the Add-to-Cart button inside this card
  article
    .querySelector(".product-card__add-btn")
    .addEventListener("click", handleAddToCart);

  return article;
}

/* ── CART: ADD ───────────────────────────────────────────── */
/**
 * Handles clicking "Add to Cart" on a product card.
 * Adds a new item or increments quantity if already in cart.
 * @param {Event} e
 */
function handleAddToCart(e) {
  const productId = parseInt(e.currentTarget.dataset.id, 10);
  const product   = PRODUCTS.find((p) => p.id === productId);

  if (!product) return;

  const existingItem = cart.find((item) => item.id === productId);

  if (existingItem) {
    // Item already in cart — increment quantity
    existingItem.quantity += 1;
    showToast(`${product.name} — qty updated`);
  } else {
    // New item — push with quantity 1
    cart.push({ ...product, quantity: 1 });
    showToast(`${product.name} added to cart`);
  }

  saveCartToStorage();
  updateCartUI();
  updateCardButtonState(productId, true);
}

/* ── CART: REMOVE ────────────────────────────────────────── */
/**
 * Removes an item entirely from the cart by product ID.
 * @param {number} productId
 */
function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId);
  saveCartToStorage();
  updateCartUI();
  updateCardButtonState(productId, false);
  showToast("Item removed");
}

/* ── CART: UPDATE QUANTITY ───────────────────────────────── */
/**
 * Increments or decrements a cart item's quantity.
 * Removes item if quantity reaches 0.
 * @param {number} productId
 * @param {number} delta - +1 or -1
 */
function updateQuantity(productId, delta) {
  const item = cart.find((i) => i.id === productId);
  if (!item) return;

  item.quantity += delta;

  if (item.quantity <= 0) {
    removeFromCart(productId);
  } else {
    saveCartToStorage();
    updateCartUI();
  }
}

/* ── CART: CLEAR ─────────────────────────────────────────── */
/**
 * Empties the entire cart and resets all product card buttons.
 */
function clearCart() {
  cart = [];
  saveCartToStorage();
  updateCartUI();
  // Reset all "in-cart" buttons on product cards
  document.querySelectorAll(".product-card__add-btn.in-cart").forEach((btn) => {
    btn.classList.remove("in-cart");
    btn.textContent = "+ Cart";
  });
  showToast("Cart cleared");
}

/* ── UI: UPDATE ALL CART ELEMENTS ────────────────────────── */
/**
 * Syncs the cart badge count, drawer item list,
 * and total price with the current cart state.
 */
function updateCartUI() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // ── Badge count ──
  cartCount.textContent = totalItems;
  if (totalItems > 0) {
    cartCount.classList.add("visible");
  } else {
    cartCount.classList.remove("visible");
  }

  // ── Total price ──
  cartTotalEl.textContent = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalPrice);

  // ── Cart items list ──
  renderCartItems();
}

/**
 * Renders the list of cart items inside the cart drawer.
 * Shows an empty-state illustration when the cart is empty.
 */
function renderCartItems() {
  cartItemsEl.innerHTML = "";

  if (cart.length === 0) {
    cartItemsEl.innerHTML = `
      <div class="cart-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 01-8 0"/>
        </svg>
        <p>Your cart is empty.</p>
        <p style="font-size:12px; margin-top:-0.25rem;">Add something beautiful.</p>
      </div>
    `;
    return;
  }

  cart.forEach((item) => {
    const el = document.createElement("div");
    el.classList.add("cart-item");
    el.dataset.id = item.id;

    el.innerHTML = `
      <img class="cart-item__img" src="${item.image}" alt="${item.name}" />
      <div class="cart-item__info">
        <p class="cart-item__name">${item.name}</p>
        <p class="cart-item__price">${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.price)} each
</p>
        <div class="cart-item__qty">
          <button class="cart-item__qty-btn" data-action="decrement" data-id="${item.id}" aria-label="Decrease quantity">−</button>
          <span class="cart-item__qty-num">${item.quantity}</span>
          <button class="cart-item__qty-btn" data-action="increment" data-id="${item.id}" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <button class="cart-item__remove" data-id="${item.id}" aria-label="Remove ${item.name}">✕</button>
    `;

    // Wire up quantity buttons
    el.querySelectorAll(".cart-item__qty-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const delta = btn.dataset.action === "increment" ? 1 : -1;
        updateQuantity(item.id, delta);
      });
    });

    // Wire up remove button
    el.querySelector(".cart-item__remove").addEventListener("click", () => {
      removeFromCart(item.id);
    });

    cartItemsEl.appendChild(el);
  });
}

/* ── UI: UPDATE PRODUCT CARD BUTTON ─────────────────────── */
/**
 * Toggles the visual state of a product card's add button.
 * @param {number} productId
 * @param {boolean} inCart - true = show "✓ Added", false = show "+ Cart"
 */
function updateCardButtonState(productId, inCart) {
  const btn = document.querySelector(`.product-card__add-btn[data-id="${productId}"]`);
  if (!btn) return;

  if (inCart) {
    btn.classList.add("in-cart");
    btn.textContent = "✓ Added";
  } else {
    btn.classList.remove("in-cart");
    btn.textContent = "+ Cart";
  }
}

/* ── FILTER ──────────────────────────────────────────────── */
/**
 * Filters the product grid based on the selected category.
 * @param {string} filter - category key or "all"
 */
function applyFilter(filter) {
  activeFilter = filter;

  // Update active button style
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === filter);
    btn.setAttribute("aria-selected", btn.dataset.filter === filter);
  });

  const filtered =
    filter === "all"
      ? PRODUCTS
      : PRODUCTS.filter((p) => p.category === filter);

  renderProducts(filtered);
}

/* ── CART DRAWER OPEN / CLOSE ────────────────────────────── */
function openCartDrawer() {
  cartDrawer.classList.add("open");
  cartOverlay.classList.add("visible");
  document.body.style.overflow = "hidden"; // Prevent background scroll
  cartCloseBtn.focus();
}

function closeCartDrawer() {
  cartDrawer.classList.remove("open");
  cartOverlay.classList.remove("visible");
  document.body.style.overflow = "";
}

/* ── TOAST NOTIFICATION ──────────────────────────────────── */
let toastTimeout;

/**
 * Displays a brief notification at the bottom of the screen.
 * @param {string} message
 */
function showToast(message) {
  clearTimeout(toastTimeout);
  toastEl.textContent = message;
  toastEl.classList.add("show");

  toastTimeout = setTimeout(() => {
    toastEl.classList.remove("show");
  }, 2600);
}

/* ── LOCALSTORAGE ────────────────────────────────────────── */
/**
 * Saves the current cart array to LocalStorage as a JSON string.
 */
function saveCartToStorage() {
  localStorage.setItem("haus_cart", JSON.stringify(cart));
}

/**
 * Loads and parses the cart from LocalStorage.
 * Returns an empty array if nothing is stored.
 * @returns {Array}
 */
function loadCartFromStorage() {
  try {
    const stored = localStorage.getItem("haus_cart");
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    // Guard against malformed JSON in storage
    console.warn("Could not parse cart from LocalStorage:", e);
    return [];
  }
}

/* ── EVENT LISTENERS ─────────────────────────────────────── */
function bindEventListeners() {
  // Cart open / close
  cartToggleBtn.addEventListener("click", openCartDrawer);
  cartCloseBtn.addEventListener("click", closeCartDrawer);
  cartOverlay.addEventListener("click", closeCartDrawer);

  // Keyboard: close drawer on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && cartDrawer.classList.contains("open")) {
      closeCartDrawer();
    }
  });

  // Filter buttons
  filterBar.addEventListener("click", (e) => {
    if (e.target.matches(".filter-btn")) {
      applyFilter(e.target.dataset.filter);
    }
  });

  // Clear cart
  clearCartBtn.addEventListener("click", () => {
    if (cart.length === 0) {
      showToast("Cart is already empty");
      return;
    }
    clearCart();
  });

  // Checkout (demo — no real flow)
  checkoutBtn.addEventListener("click", () => {
    if (cart.length === 0) {
      showToast("Add items to cart first");
      return;
    }
    showToast("Checkout coming soon 🛠");
  });

  // Header: add "scrolled" class for elevated shadow effect
  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 10);
  }, { passive: true });
}

/* ── UTILS ───────────────────────────────────────────────── */
/**
 * Capitalises the first letter of a string.
 * @param {string} str
 * @returns {string}
 */
function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}