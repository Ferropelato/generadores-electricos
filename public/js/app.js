const API_BASE = "/api";

const getCartId = () => localStorage.getItem("cartId");
const setCartId = (id) => localStorage.setItem("cartId", id);

const ensureCart = async () => {
  let cartId = getCartId();
  if (cartId) return cartId;

  const response = await fetch(`${API_BASE}/carts`, { method: "POST" });
  const data = await response.json();
  cartId = data.payload.id;
  setCartId(cartId);
  return cartId;
};

const formatPrice = (value) => {
  const number = Number(value) || 0;
  return number.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  });
};

const renderProducts = async () => {
  const list = document.getElementById("products-list");
  if (!list) return;

  const response = await fetch(`${API_BASE}/products`);
  const data = await response.json();
  const products = data.payload || [];

  if (!products.length) {
    list.innerHTML = "<p class='muted'>No hay productos cargados aún.</p>";
    return;
  }

  list.innerHTML = products
    .map(
      (product) => `
      <article class="card">
        ${
          product.thumbnails && product.thumbnails[0]
            ? `<img src="${product.thumbnails[0]}" alt="${product.title}" />`
            : ""
        }
        <h3>${product.title}</h3>
        <p>${product.description}</p>
        <p class="price">${formatPrice(product.price)}</p>
        <button data-product-id="${product.id}">Agregar al carrito</button>
      </article>
    `
    )
    .join("");

  list.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", async () => {
      const productId = button.dataset.productId;
      const cartId = await ensureCart();
      await fetch(`${API_BASE}/carts/${cartId}/product/${productId}`, {
        method: "POST",
      });
      button.textContent = "Agregado";
      button.disabled = true;
    });
  });
};

const renderCart = async () => {
  const cartList = document.getElementById("cart-list");
  const status = document.getElementById("cart-status");
  const checkoutButton = document.getElementById("checkout-btn");
  if (!cartList || !status) return;

  const cartId = getCartId();
  if (!cartId) {
    status.style.display = "block";
    status.textContent = "Tu carrito está vacío. Agregá productos desde catálogo.";
    cartList.innerHTML = "";
    if (checkoutButton) checkoutButton.disabled = true;
    return;
  }

  const cartResponse = await fetch(`${API_BASE}/carts/${cartId}`);
  const cartData = await cartResponse.json();
  const cartItems = cartData.payload || [];

  if (!cartItems.length) {
    status.style.display = "block";
    status.textContent = "Tu carrito está vacío. Agregá productos desde catálogo.";
    cartList.innerHTML = "";
    if (checkoutButton) checkoutButton.disabled = true;
    return;
  }

  cartList.innerHTML = cartItems
    .map((item) => {
      const product = item.product;
      if (!product) return "";
      return `
        <div class="cart-item">
          <div>
            <strong>${product.title}</strong>
            <p class="muted">Cantidad: ${item.quantity}</p>
          </div>
          <span class="price">${formatPrice(product.price)}</span>
        </div>
      `;
    })
    .join("");

  status.style.display = "none";
  status.textContent = "";

  if (checkoutButton) {
    checkoutButton.disabled = false;
    checkoutButton.addEventListener("click", () => {
      status.style.display = "block";
      status.textContent = "Compra confirmada. ¡Gracias por tu pedido!";
      cartList.innerHTML = "";
      localStorage.removeItem("cartId");
      checkoutButton.disabled = true;
    });
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  if (page === "productos") renderProducts();
  if (page === "carrito") renderCart();
});
