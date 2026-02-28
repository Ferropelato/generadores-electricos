const express = require("express");
const path = require("path");
const ProductManager = require("../managers/ProductManager");
const multer = require("multer");

const router = express.Router();
const manager = new ProductManager(
  path.join(__dirname, "..", "data", "products.json")
);
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, "..", "..", "public", "uploads"));
    },
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${file.originalname}`;
      cb(null, uniqueName);
    },
  }),
});

router.get("/", async (req, res) => {
  const products = await manager.getProducts();
  res.json({ status: "success", payload: products });
});

router.get("/:pid", async (req, res) => {
  const product = await manager.getProductById(req.params.pid);
  if (!product) {
    return res.status(404).json({ status: "error", message: "Producto no encontrado" });
  }
  res.json({ status: "success", payload: product });
});

router.post("/", upload.single("thumbnail"), async (req, res) => {
  const {
    title,
    description,
    code,
    price,
    status,
    stock,
    category,
    thumbnails,
  } = req.body;

  if (!title || !description || !code || price === undefined || stock === undefined || !category) {
    return res.status(400).json({
      status: "error",
      message: "Faltan campos obligatorios",
    });
  }

  const parsedThumbnails = Array.isArray(thumbnails)
    ? thumbnails
    : thumbnails
      ? [thumbnails]
      : [];
  if (req.file) {
    parsedThumbnails.unshift(`/uploads/${req.file.filename}`);
  }

  const newProduct = await manager.addProduct({
    title,
    description,
    code,
    price: Number(price),
    status: status !== undefined ? Boolean(status) : true,
    stock: Number(stock),
    category,
    thumbnails: parsedThumbnails,
  });

  res.status(201).json({ status: "success", payload: newProduct });
});

router.put("/:pid", async (req, res) => {
  const updated = await manager.updateProduct(req.params.pid, req.body);
  if (!updated) {
    return res.status(404).json({ status: "error", message: "Producto no encontrado" });
  }
  res.json({ status: "success", payload: updated });
});

router.delete("/:pid", async (req, res) => {
  const deleted = await manager.deleteProduct(req.params.pid);
  if (!deleted) {
    return res.status(404).json({ status: "error", message: "Producto no encontrado" });
  }
  res.json({ status: "success", message: "Producto eliminado" });
});

module.exports = router;
