const express = require("express");
const path = require("path");
const ProductManager = require("../managers/ProductManager");

const router = express.Router();
const productManager = new ProductManager(
  path.join(__dirname, "..", "data", "products.json")
);

router.get("/", async (req, res) => {
  const products = await productManager.getProducts();
  res.render("home", { title: "Generadores Eléctricos", products, page: "home" });
});

router.get("/productos", async (req, res) => {
  const products = await productManager.getProducts();
  res.render("products", { title: "Productos", products, page: "productos" });
});

router.get("/carrito", async (req, res) => {
  res.render("cart", { title: "Carrito", page: "carrito" });
});

router.get("/chat", async (req, res) => {
  res.render("chat", { title: "Chat en vivo", page: "chat" });
});

router.get("/realtimeproducts", async (req, res) => {
  const products = await productManager.getProducts();
  res.render("realTimeProducts", { title: "Productos en tiempo real", products, page: "realtimeproducts" });
});

module.exports = router;
