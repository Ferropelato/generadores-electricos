const Cart = require("../models/Cart");
const Product = require("../models/Product");

const cartService = {
  async createCart() {
    const cart = new Cart({ products: [] });
    return cart.save();
  },

  async getCartById(cid, populateProducts = true) {
    const query = Cart.findById(cid);
    if (populateProducts) {
      query.populate({
        path: "products.product",
        select: "title price thumbnails code stock status",
      });
    }
    return query.lean();
  },

  async addProductToCart(cartId, productId, quantity = 1) {
    const product = await Product.findById(productId);
    if (!product) return { success: false, error: "Producto no encontrado" };
    if (!product.status) return { success: false, error: "Producto no disponible" };
    if (product.stock < quantity) return { success: false, error: "Stock insuficiente" };

    const cart = await Cart.findById(cartId);
    if (!cart) return { success: false, error: "Carrito no encontrado" };

    const existingIndex = cart.products.findIndex(
      (p) => p.product.toString() === productId
    );

    if (existingIndex >= 0) {
      const newQty = cart.products[existingIndex].quantity + quantity;
      if (newQty > product.stock) return { success: false, error: "Stock insuficiente" };
      cart.products[existingIndex].quantity = newQty;
    } else {
      cart.products.push({ product: productId, quantity });
    }

    await cart.save();
    return { success: true, cart: await this.getCartById(cartId) };
  },

  async updateProductQuantity(cartId, productId, quantity) {
    const cart = await Cart.findById(cartId);
    if (!cart) return { success: false, error: "Carrito no encontrado" };
    if (quantity < 1) return { success: false, error: "Cantidad debe ser al menos 1" };

    const item = cart.products.find((p) => p.product.toString() === productId);
    if (!item) return { success: false, error: "Producto no está en el carrito" };

    const product = await Product.findById(productId);
    if (product && product.stock < quantity) return { success: false, error: "Stock insuficiente" };

    item.quantity = quantity;
    await cart.save();
    return { success: true, cart: await this.getCartById(cartId) };
  },

  async removeProductFromCart(cartId, productId) {
    const cart = await Cart.findById(cartId);
    if (!cart) return { success: false, error: "Carrito no encontrado" };

    cart.products = cart.products.filter((p) => p.product.toString() !== productId);
    await cart.save();
    return { success: true, cart: await this.getCartById(cartId) };
  },

  async clearCart(cartId) {
    const cart = await Cart.findByIdAndUpdate(cartId, { products: [] }, { new: true });
    if (!cart) return { success: false, error: "Carrito no encontrado" };
    return { success: true, cart: await this.getCartById(cartId) };
  },

  async updateCartWithProducts(cartId, products) {
    const cart = await Cart.findById(cartId);
    if (!cart) return { success: false, error: "Carrito no encontrado" };

    if (!Array.isArray(products)) return { success: false, error: "products debe ser un array" };

    for (const item of products) {
      const product = await Product.findById(item.product);
      if (!product) return { success: false, error: `Producto ${item.product} no encontrado` };
      if (!product.status) return { success: false, error: `Producto ${item.product} no disponible` };
      if (product.stock < (item.quantity || 1)) {
        return { success: false, error: `Stock insuficiente para ${product.title}` };
      }
    }

    cart.products = products.map((p) => ({
      product: p.product,
      quantity: Math.max(1, parseInt(p.quantity, 10) || 1),
    }));
    await cart.save();
    return { success: true, cart: await this.getCartById(cartId) };
  },
};

module.exports = cartService;
