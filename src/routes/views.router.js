const express = require("express");
const productService = require("../services/product.service");
const cartService = require("../services/cart.service");

const router = express.Router();

const normalizeProducts = (items) =>
  (items || []).map((p) => ({ ...p, id: p._id?.toString() || p.id }));

router.get("/", async (req, res) => {
  try {
    const result = await productService.getProducts({ limit: 50 });
    const products = normalizeProducts(result.docs || result);
    res.render("home", { title: "Generadores Eléctricos", products, page: "home" });
  } catch (err) {
    res.status(500).render("home", {
      title: "Generadores Eléctricos",
      products: [],
      page: "home",
      error: err.message,
    });
  }
});

router.get("/productos", async (req, res) => {
  try {
    const { page, limit, query, sort, category, status } = req.query;
    const result = await productService.getProducts({
      page: page || 1,
      limit: limit || 10,
      query,
      sort,
      category,
      status,
    });
    const products = normalizeProducts(result.docs || result);
    const filters = { query, sort, category, status };
    const buildPageUrl = (p) => {
      const params = new URLSearchParams();
      if (limit) params.set("limit", limit);
      if (query) params.set("query", query);
      if (category) params.set("category", category);
      if (status) params.set("status", status);
      if (sort) params.set("sort", sort);
      params.set("page", p);
      return "/productos?" + params.toString();
    };
    const pagination = {
      ...result,
      prevLink: result.hasPrevPage ? buildPageUrl(result.prevPage) : null,
      nextLink: result.hasNextPage ? buildPageUrl(result.nextPage) : null,
    };
    res.render("products", {
      title: "Productos",
      products,
      pagination,
      filters,
      page: "productos",
    });
  } catch (err) {
    res.status(500).render("products", {
      title: "Productos",
      products: [],
      page: "productos",
      error: err.message,
    });
  }
});

router.get("/productos/:pid", async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.pid);
    const p = product ? { ...product, id: product._id?.toString() } : null;
    res.render("productDetail", {
      title: p ? p.title : "Producto",
      product: p,
      page: "producto",
    });
  } catch (err) {
    res.render("productDetail", { title: "Producto", product: null, page: "producto" });
  }
});

router.get("/carrito", async (req, res) => {
  res.render("cart", { title: "Carrito", page: "carrito" });
});

router.get("/carritos/:cid", async (req, res) => {
  try {
    const cart = await cartService.getCartById(req.params.cid);
    res.render("cartDetail", {
      title: "Carrito",
      cart: cart || null,
      page: "carrito",
    });
  } catch (err) {
    res.render("cartDetail", { title: "Carrito", cart: null, page: "carrito" });
  }
});

router.get("/chat", async (req, res) => {
  res.render("chat", { title: "Chat en vivo", page: "chat" });
});

router.get("/realtimeproducts", async (req, res) => {
  try {
    const result = await productService.getProducts({ limit: 50 });
    const products = normalizeProducts(result.docs || result);
    res.render("realTimeProducts", {
      title: "Productos en tiempo real",
      products,
      page: "realtimeproducts",
    });
  } catch (err) {
    res.status(500).render("realTimeProducts", {
      title: "Productos en tiempo real",
      products: [],
      page: "realtimeproducts",
      error: err.message,
    });
  }
});

module.exports = router;
