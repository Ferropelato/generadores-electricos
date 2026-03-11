const express = require("express");
const path = require("path");
const productService = require("../services/product.service");
const multer = require("multer");

const router = express.Router();
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

// GET /api/products - Listar con paginación, filtros y ordenamiento
// Query params: limit (default 10), page (default 1), query (búsqueda), sort (asc/desc), category, status
router.get("/", async (req, res) => {
  try {
    const { page, limit, category, sort, query, status } = req.query;
    const result = await productService.getProducts({
      page,
      limit,
      category,
      sort,
      query,
      status,
    });

    const baseUrl = "/api/products";
    const params = new URLSearchParams();
    if (limit) params.set("limit", limit);
    if (category) params.set("category", category);
    if (sort) params.set("sort", sort);
    if (query) params.set("query", query);
    if (status !== undefined && status !== "") params.set("status", status);

    const buildLink = (p) => {
      const q = new URLSearchParams(params);
      q.set("page", p);
      return `${baseUrl}?${q.toString()}`;
    };

    const response = {
      status: "success",
      payload: result.docs,
      totalPages: result.totalPages,
      prevPage: result.prevPage ?? null,
      nextPage: result.nextPage ?? null,
      page: result.page,
      hasPrevPage: result.hasPrevPage ?? false,
      hasNextPage: result.hasNextPage ?? false,
      prevLink: result.hasPrevPage ? buildLink(result.prevPage) : null,
      nextLink: result.hasNextPage ? buildLink(result.nextPage) : null,
    };
    res.json(response);
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// GET /api/products/pipeline - Paginación con aggregation pipeline
router.get("/pipeline", async (req, res) => {
  try {
    const { page, limit, category, minPrice, maxPrice } = req.query;
    const result = await productService.getProductsPipeline({
      page,
      limit,
      category,
      minPrice,
      maxPrice,
    });
    res.json({ status: "success", payload: result });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// GET /api/products/aggregate/category - Agregación por categoría
router.get("/aggregate/category", async (req, res) => {
  try {
    const result = await productService.aggregateByCategory();
    res.json({ status: "success", payload: result });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// GET /api/products/aggregate/stats - Estadísticas de precios
router.get("/aggregate/stats", async (req, res) => {
  try {
    const result = await productService.aggregatePriceStats();
    res.json({ status: "success", payload: result });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.get("/:pid", async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.pid);
    if (!product) {
      return res.status(404).json({ status: "error", message: "Producto no encontrado" });
    }
    res.json({ status: "success", payload: product });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ status: "error", message: "ID inválido" });
    }
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.post("/", upload.single("thumbnail"), async (req, res) => {
  try {
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
        message: "Faltan campos obligatorios: title, description, code, price, stock, category",
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

    const newProduct = await productService.addProduct({
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
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ status: "error", message: "El código ya existe" });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({
        status: "error",
        message: Object.values(err.errors).map((e) => e.message).join(", "),
      });
    }
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.put("/:pid", async (req, res) => {
  try {
    const updated = await productService.updateProduct(req.params.pid, req.body);
    if (!updated) {
      return res.status(404).json({ status: "error", message: "Producto no encontrado" });
    }
    res.json({ status: "success", payload: updated });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ status: "error", message: "ID inválido" });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({
        status: "error",
        message: Object.values(err.errors).map((e) => e.message).join(", "),
      });
    }
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.delete("/:pid", async (req, res) => {
  try {
    const deleted = await productService.deleteProduct(req.params.pid);
    if (!deleted) {
      return res.status(404).json({ status: "error", message: "Producto no encontrado" });
    }
    res.json({ status: "success", message: "Producto eliminado" });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ status: "error", message: "ID inválido" });
    }
    res.status(500).json({ status: "error", message: err.message });
  }
});

module.exports = router;
