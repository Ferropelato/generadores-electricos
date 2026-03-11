const API_BASE = "/api";

const getCartId = () => localStorage.getItem("cartId");
const setCartId = (id) => localStorage.setItem("cartId", id);

const ensureCart = async () => {
  let cartId = getCartId();
  if (cartId) return cartId;

  const response = await fetch(`${API_BASE}/carts`, { method: "POST" });
  const data = await response.json();
  cartId = data.payload._id || data.payload.id;
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

// Delegación: botón "Agregar al carrito" (productos renderizados por servidor)
document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".btn-add-cart");
  if (!btn || btn.disabled) return;
  const productId = btn.dataset.productId;
  if (!productId) return;

  e.preventDefault();
  try {
    const cartId = await ensureCart();
    const res = await fetch(`${API_BASE}/carts/${cartId}/product/${productId}`, {
      method: "POST",
    });
    if (res.ok) {
      btn.textContent = "Agregado";
      btn.disabled = true;
    }
  } catch (err) {
    console.error(err);
  }
});

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
    const detailLink = document.getElementById("cart-detail-link");
    if (detailLink) detailLink.style.display = "none";
    return;
  }

  const cartResponse = await fetch(`${API_BASE}/carts/${cartId}`);
  const cartData = await cartResponse.json();
  const cart = cartData.payload;
  const cartItems = cart?.products || [];

  if (!cartItems.length) {
    status.style.display = "block";
    status.textContent = "Tu carrito está vacío. Agregá productos desde catálogo.";
    cartList.innerHTML = "";
    if (checkoutButton) checkoutButton.disabled = true;
    const detailLink = document.getElementById("cart-detail-link");
    if (detailLink) detailLink.style.display = "none";
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

  const detailLink = document.getElementById("cart-detail-link");
  if (detailLink) {
    detailLink.href = `/carritos/${cartId}`;
    detailLink.style.display = "inline-block";
  }

  if (checkoutButton) {
    checkoutButton.disabled = false;
    checkoutButton.onclick = () => {
      status.style.display = "block";
      status.textContent = "Compra confirmada. ¡Gracias por tu pedido!";
      cartList.innerHTML = "";
      localStorage.removeItem("cartId");
      checkoutButton.disabled = true;
    };
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  if (page === "carrito") renderCart();
});
