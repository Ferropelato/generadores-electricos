const fs = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");

class ProductManager {
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

  async getProducts() {
    return this._readFile();
  }

  async getProductById(id) {
    const products = await this._readFile();
    return products.find((item) => item.id === id);
  }

  async addProduct(product) {
    const products = await this._readFile();
    const newProduct = {
      id: randomUUID(),
      status: true,
      ...product,
    };
    products.push(newProduct);
    await this._writeFile(products);
    return newProduct;
  }

  async updateProduct(id, updates) {
    const products = await this._readFile();
    const index = products.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const updatedProduct = {
      ...products[index],
      ...updates,
      id: products[index].id,
    };
    products[index] = updatedProduct;
    await this._writeFile(products);
    return updatedProduct;
  }

  async deleteProduct(id) {
    const products = await this._readFile();
    const index = products.findIndex((item) => item.id === id);
    if (index === -1) return false;
    products.splice(index, 1);
    await this._writeFile(products);
    return true;
  }
}

module.exports = ProductManager;
