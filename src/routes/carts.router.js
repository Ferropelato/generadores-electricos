const express = require("express");
const cartService = require("../services/cart.service");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const cart = await cartService.createCart();
    res.status(201).json({ status: "success", payload: cart });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.get("/:cid", async (req, res) => {
  try {
    const cart = await cartService.getCartById(req.params.cid);
    if (!cart) {
      return res.status(404).json({ status: "error", message: "Carrito no encontrado" });
    }
    res.json({ status: "success", payload: cart });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ status: "error", message: "ID inválido" });
    }
    res.status(500).json({ status: "error", message: err.message });
  }
});

// PUT api/carts/:cid - Actualizar todos los productos del carrito con un arreglo
router.put("/:cid", async (req, res) => {
  try {
    const { products } = req.body;
    const result = await cartService.updateCartWithProducts(req.params.cid, products || []);

    if (!result.success) {
      if (result.error === "Carrito no encontrado") {
        return res.status(404).json({ status: "error", message: result.error });
      }
      return res.status(400).json({ status: "error", message: result.error });
    }
    res.json({ status: "success", payload: result.cart });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ status: "error", message: "ID inválido" });
    }
    res.status(500).json({ status: "error", message: err.message });
  }
});

// POST api/carts/:cid/products/:pid - Agregar producto (también acepta /product/:pid)
router.post("/:cid/products/:pid", async (req, res) => {
  try {
    const quantity = parseInt(req.body.quantity, 10) || 1;
    const result = await cartService.addProductToCart(
      req.params.cid,
      req.params.pid,
      quantity
    );
    if (!result.success) {
      if (result.error === "Producto no encontrado" || result.error === "Carrito no encontrado") {
        return res.status(404).json({ status: "error", message: result.error });
      }
      if (result.error === "Stock insuficiente" || result.error === "Producto no disponible") {
        return res.status(400).json({ status: "error", message: result.error });
      }
    }
    res.json({ status: "success", payload: result.cart });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ status: "error", message: "ID inválido" });
    }
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.post("/:cid/product/:pid", async (req, res) => {
  try {
    const quantity = parseInt(req.body.quantity, 10) || 1;
    const result = await cartService.addProductToCart(
      req.params.cid,
      req.params.pid,
      quantity
    );

    if (!result.success) {
      if (result.error === "Producto no encontrado" || result.error === "Carrito no encontrado") {
        return res.status(404).json({ status: "error", message: result.error });
      }
      if (result.error === "Stock insuficiente" || result.error === "Producto no disponible") {
        return res.status(400).json({ status: "error", message: result.error });
      }
    }

    res.json({ status: "success", payload: result.cart });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ status: "error", message: "ID inválido" });
    }
    res.status(500).json({ status: "error", message: err.message });
  }
});

// DELETE api/carts/:cid/products/:pid - Eliminar producto del carrito
router.delete("/:cid/products/:pid", async (req, res) => {
  try {
    const result = await cartService.removeProductFromCart(
      req.params.cid,
      req.params.pid
    );
    if (!result.success) {
      return res.status(404).json({ status: "error", message: result.error });
    }
    res.json({ status: "success", payload: result.cart });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ status: "error", message: "ID inválido" });
    }
    res.status(500).json({ status: "error", message: err.message });
  }
});

// PUT api/carts/:cid/products/:pid - Actualizar cantidad del producto
router.put("/:cid/products/:pid", async (req, res) => {
  try {
    const quantity = parseInt(req.body.quantity, 10);
    if (isNaN(quantity) || quantity < 1) {
      return res.status(400).json({ status: "error", message: "Cantidad inválida" });
    }
    const result = await cartService.updateProductQuantity(
      req.params.cid,
      req.params.pid,
      quantity
    );

    if (!result.success) {
      if (result.error === "Carrito no encontrado") {
        return res.status(404).json({ status: "error", message: result.error });
      }
      return res.status(400).json({ status: "error", message: result.error });
    }
    res.json({ status: "success", payload: result.cart });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ status: "error", message: "ID inválido" });
    }
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Mantener compatibilidad con ruta singular
router.delete("/:cid/product/:pid", async (req, res) => {
  try {
    const result = await cartService.removeProductFromCart(
      req.params.cid,
      req.params.pid
    );
    if (!result.success) {
      return res.status(404).json({ status: "error", message: result.error });
    }
    res.json({ status: "success", payload: result.cart });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ status: "error", message: "ID inválido" });
    }
    res.status(500).json({ status: "error", message: err.message });
  }
});

// DELETE api/carts/:cid - Eliminar todos los productos del carrito
router.delete("/:cid", async (req, res) => {
  try {
    const result = await cartService.clearCart(req.params.cid);
    if (!result.success) {
      return res.status(404).json({ status: "error", message: result.error });
    }
    res.json({ status: "success", payload: result.cart });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ status: "error", message: "ID inválido" });
    }
    res.status(500).json({ status: "error", message: err.message });
  }
});

module.exports = router;
