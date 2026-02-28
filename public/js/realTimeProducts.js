document.addEventListener("DOMContentLoaded", () => {
  const productsList = document.getElementById("products-list");
  const productForm = document.getElementById("product-form");

  if (!productsList || !productForm) return;

  const socket = io();

  const renderProduct = (product) => {
    const article = document.createElement("article");
    article.className = "card";
    article.dataset.productId = product.id;
    const thumb = product.thumbnails?.[0]
      ? `<img src="${product.thumbnails[0]}" alt="${product.title}" />`
      : '<div class="card-placeholder">Sin imagen</div>';
    article.innerHTML = `
      ${thumb}
      <h3>${product.title}</h3>
      <p>${product.description}</p>
      <p class="price">$ ${product.price}</p>
      <button class="btn-delete" data-product-id="${product.id}">Eliminar</button>
    `;
    const deleteBtn = article.querySelector(".btn-delete");
    deleteBtn.addEventListener("click", () => socket.emit("product:delete", product.id));
    return article;
  };

  socket.on("product:list", (products) => {
    productsList.innerHTML = "";
    products.forEach((p) => productsList.appendChild(renderProduct(p)));
  });

  socket.on("product:created", (product) => {
    productsList.appendChild(renderProduct(product));
  });

  socket.on("product:deleted", (productId) => {
    const card = productsList.querySelector(`[data-product-id="${productId}"]`);
    if (card) card.remove();
  });

  productForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(productForm);
    const product = {
      title: formData.get("title"),
      description: formData.get("description"),
      code: formData.get("code"),
      price: Number(formData.get("price")),
      stock: Number(formData.get("stock")),
      category: formData.get("category"),
      thumbnails: [],
    };
    socket.emit("product:create", product);
    productForm.reset();
  });

  socket.on("product:error", (msg) => {
    alert("Error: " + msg);
  });
});
