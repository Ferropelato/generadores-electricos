const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "El producto es obligatorio"],
    },
    quantity: {
      type: Number,
      default: 1,
      min: [1, "La cantidad mínima es 1"],
    },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    products: {
      type: [cartItemSchema],
      default: [],
      validate: {
        validator: (v) => Array.isArray(v),
        message: "products debe ser un array",
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    id: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Índice para búsquedas por carrito
cartSchema.index({ createdAt: -1 });

// Pre-middleware: evitar duplicados de producto en el carrito
cartSchema.pre("save", async function () {
  const seen = new Map();
  this.products = this.products.filter((item) => {
    const key = item.product?.toString?.() || item.product;
    if (seen.has(key)) {
      seen.get(key).quantity += item.quantity || 1;
      return false;
    }
    seen.set(key, item);
    return true;
  });
});

// Virtual para total de items
cartSchema.virtual("totalItems").get(function () {
  return this.products.reduce((sum, item) => sum + (item.quantity || 0), 0);
});

module.exports = mongoose.model("Cart", cartSchema);
