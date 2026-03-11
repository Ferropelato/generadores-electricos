const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "El título es obligatorio"],
      trim: true,
      minlength: [2, "El título debe tener al menos 2 caracteres"],
      maxlength: [200, "El título no puede exceder 200 caracteres"],
    },
    description: {
      type: String,
      required: [true, "La descripción es obligatoria"],
      trim: true,
      minlength: [5, "La descripción debe tener al menos 5 caracteres"],
    },
    code: {
      type: String,
      required: [true, "El código es obligatorio"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    price: {
      type: Number,
      required: [true, "El precio es obligatorio"],
      min: [0, "El precio no puede ser negativo"],
    },
    status: {
      type: Boolean,
      default: true,
    },
    stock: {
      type: Number,
      required: [true, "El stock es obligatorio"],
      min: [0, "El stock no puede ser negativo"],
      default: 0,
    },
    category: {
      type: String,
      required: [true, "La categoría es obligatoria"],
      trim: true,
      enum: {
        values: ["solar", "industrial", "comercial", "residencial", "portátil", "otro"],
        message: "{VALUE} no es una categoría válida",
      },
    },
    thumbnails: {
      type: [String],
      default: [],
      validate: {
        validator: (v) => Array.isArray(v) && v.every((url) => typeof url === "string"),
        message: "thumbnails debe ser un array de strings",
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

// Índices para optimizar consultas (code tiene unique en el schema)
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ status: 1 });
productSchema.index({ title: "text", description: "text" });

// Pre-middleware: normalizar categoría antes de guardar
productSchema.pre("save", async function () {
  if (this.category) {
    this.category = this.category.toLowerCase().trim();
  }
});

// Pre-middleware: validar stock antes de actualizar
productSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate();
  if (update?.stock !== undefined && update.stock < 0) {
    throw new Error("El stock no puede ser negativo");
  }
});

// Plugin de paginación
productSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Product", productSchema);
