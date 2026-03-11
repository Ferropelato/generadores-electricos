const Product = require("../models/Product");

const productService = {
  async getProducts(options = {}) {
    const { page = 1, limit = 10, category, sort, query, status } = options;
    const filter = {};

    // Filtro por categoría
    if (category) filter.category = category;
    // Filtro por disponibilidad (status: true = disponible, false = no disponible)
    if (status !== undefined && status !== "") {
      filter.status = status === "true" || status === true;
    }
    // Búsqueda por texto (título, descripción, código)
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { code: { $regex: query, $options: "i" } },
      ];
    }

    // sort: asc/desc por precio; si no se recibe, no ordenar
    const sortOption =
      sort === "desc" ? { price: -1 } : sort === "asc" ? { price: 1 } : null;

    const paginateOptions = {
      page: parseInt(page, 10) || 1,
      limit: Math.min(parseInt(limit, 10) || 10, 100),
      lean: true,
    };
    if (sortOption) paginateOptions.sort = sortOption;

    const result = await Product.paginate(filter, paginateOptions);
    return result;
  },

  async getProductById(id) {
    return Product.findById(id).lean();
  },

  async addProduct(data) {
    const product = new Product(data);
    return product.save();
  },

  async updateProduct(id, updates) {
    return Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).lean();
  },

  async deleteProduct(id) {
    const result = await Product.findByIdAndDelete(id);
    return !!result;
  },

  async aggregateByCategory() {
    return Product.aggregate([
      { $match: { status: true } },
      { $group: { _id: "$category", count: { $sum: 1 }, totalStock: { $sum: "$stock" } } },
      { $sort: { count: -1 } },
    ]);
  },

  async aggregatePriceStats() {
    return Product.aggregate([
      { $match: { status: true } },
      {
        $group: {
          _id: null,
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
          totalProducts: { $sum: 1 },
        },
      },
    ]);
  },

  async getProductsPipeline(options = {}) {
    const { page = 1, limit = 10, category, minPrice, maxPrice } = options;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const match = { status: true };
    if (category) match.category = category;
    if (minPrice != null || maxPrice != null) {
      match.price = {};
      if (minPrice != null) match.price.$gte = Number(minPrice);
      if (maxPrice != null) match.price.$lte = Number(maxPrice);
    }

    const pipeline = [
      { $match: match },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: Math.min(parseInt(limit, 10) || 10, 100) }],
        },
      },
      {
        $project: {
          data: 1,
          total: { $arrayElemAt: ["$metadata.total", 0] },
        },
      },
    ];

    const [result] = await Product.aggregate(pipeline);
    const total = result?.total || 0;
    const totalPages = Math.ceil(total / (parseInt(limit, 10) || 10));

    return {
      docs: result?.data || [],
      totalDocs: total,
      limit: parseInt(limit, 10) || 10,
      page: parseInt(page, 10) || 1,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  },
};

module.exports = productService;
