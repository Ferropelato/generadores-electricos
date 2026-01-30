const fs = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");

class CartManager {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async _ensureFile() {
    try {
      await fs.access(this.filePath);
    } catch (error) {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      await fs.writeFile(this.filePath, JSON.stringify([], null, 2));
    }
  }

  async _readFile() {
    await this._ensureFile();
    const data = await fs.readFile(this.filePath, "utf-8");
    return JSON.parse(data || "[]");
  }

  async _writeFile(data) {
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
  }

  async createCart() {
    const carts = await this._readFile();
    const newCart = {
      id: randomUUID(),
      products: [],
    };
    carts.push(newCart);
    await this._writeFile(carts);
    return newCart;
  }

  async getCartById(id) {
    const carts = await this._readFile();
    return carts.find((cart) => cart.id === id);
  }

  async addProductToCart(cartId, productId) {
    const carts = await this._readFile();
    const cartIndex = carts.findIndex((cart) => cart.id === cartId);
    if (cartIndex === -1) return null;

    const cart = carts[cartIndex];
    const productIndex = cart.products.findIndex(
      (item) => item.product === productId
    );

    if (productIndex === -1) {
      cart.products.push({ product: productId, quantity: 1 });
    } else {
      cart.products[productIndex].quantity += 1;
    }

    carts[cartIndex] = cart;
    await this._writeFile(carts);
    return cart;
  }
}

module.exports = CartManager;
