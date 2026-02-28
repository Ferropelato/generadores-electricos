const express = require("express");
const path = require("path");
const CartManager = require("../managers/CartManager");
const ProductManager = require("../managers/ProductManager");

const router = express.Router();
const cartManager = new CartManager(
  path.join(__dirname, "..", "data", "carts.json")
);
const productManager = new ProductManager(
  path.join(__dirname, "..", "data", "products.json")
);

router.post("/", async (req, res) => {
  const cart = await cartManager.createCart();
  res.status(201).json({ status: "success", payload: cart });
});

router.get("/:cid", async (req, res) => {
  const cart = await cartManager.getCartById(req.params.cid);
  if (!cart) {
    return res.status(404).json({ status: "error", message: "Carrito no encontrado" });
  }
  const detailedProducts = await Promise.all(
    cart.products.map(async (item) => {
      const product = await productManager.getProductById(item.product);
      return {
        product: product || null,
        quantity: item.quantity,
      };
    })
  );
  res.json({ status: "success", payload: detailedProducts });
});

router.post("/:cid/product/:pid", async (req, res) => {
  const product = await productManager.getProductById(req.params.pid);
  if (!product) {
    return res.status(404).json({ status: "error", message: "Producto no encontrado" });
  }

  const cart = await cartManager.addProductToCart(req.params.cid, req.params.pid);
  if (!cart) {
    return res.status(404).json({ status: "error", message: "Carrito no encontrado" });
  }

  res.json({ status: "success", payload: cart });
});

module.exports = router;
