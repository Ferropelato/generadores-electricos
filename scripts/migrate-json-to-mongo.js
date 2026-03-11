/**
 * Script de migración: products.json y carts.json -> MongoDB
 * Ejecutar: node scripts/migrate-json-to-mongo.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const fs = require("fs").promises;
const path = require("path");
const mongoose = require("mongoose");
const Product = require("../src/models/Product");
const Cart = require("../src/models/Cart");

const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/generadores";

const productsPath = path.join(__dirname, "..", "src", "data", "products.json");
const cartsPath = path.join(__dirname, "..", "src", "data", "carts.json");

async function migrateProducts() {
  let data = [];
  try {
    const raw = await fs.readFile(productsPath, "utf-8");
    data = JSON.parse(raw || "[]");
  } catch (err) {
    console.log("No se encontró products.json o está vacío. Saltando productos.");
    return { migrated: 0, skipped: 0 };
  }

  const idMap = {};
  let migrated = 0;
  let skipped = 0;

  for (const item of data) {
    if (!item.title || !item.code) {
      skipped++;
      continue;
    }
    try {
      const existing = await Product.findOne({ code: item.code.toUpperCase() });
      let doc;
      if (existing) {
        doc = existing;
      } else {
        doc = await Product.create({
          title: item.title,
          description: item.description || "",
          code: item.code,
          price: Number(item.price) || 0,
          status: item.status !== false,
          stock: Number(item.stock) ?? 0,
          category: (item.category || "otro").toLowerCase(),
          thumbnails: Array.isArray(item.thumbnails) ? item.thumbnails : [],
        });
      }
      if (item.id) idMap[item.id] = doc._id.toString();
      migrated++;
    } catch (err) {
      console.error("Error migrando producto:", item.code, err.message);
      skipped++;
    }
  }

  return { migrated, skipped, idMap };
}

async function migrateCarts(idMap) {
  let data = [];
  try {
    const raw = await fs.readFile(cartsPath, "utf-8");
    data = JSON.parse(raw || "[]");
  } catch (err) {
    console.log("No se encontró carts.json o está vacío. Saltando carritos.");
    return { migrated: 0 };
  }

  let migrated = 0;
  for (const cart of data) {
    if (!cart.products || !Array.isArray(cart.products)) continue;
    const products = [];
    for (const item of cart.products) {
      const pid = item.product;
      const mongoId = idMap?.[pid] || (mongoose.Types.ObjectId.isValid(pid) ? pid : null);
      if (mongoId) {
        products.push({ product: mongoId, quantity: item.quantity || 1 });
      }
    }
    if (products.length > 0) {
      try {
        await Cart.create({ products });
        migrated++;
      } catch (err) {
        console.error("Error migrando carrito:", err.message);
      }
    }
  }
  return { migrated };
}

async function run() {
  console.log("Conectando a MongoDB...");
  await mongoose.connect(MONGO_URL);
  console.log("Conectado.");

  const prodResult = await migrateProducts();
  console.log(`Productos: ${prodResult.migrated} migrados, ${prodResult.skipped} omitidos`);

  const cartResult = await migrateCarts(prodResult.idMap);
  console.log(`Carritos: ${cartResult.migrated} migrados`);

  await mongoose.disconnect();
  console.log("Migración completada.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
