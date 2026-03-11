require("dotenv").config();
const express = require("express");
const path = require("path");
const http = require("http");
const fs = require("fs");
const { Server } = require("socket.io");
const { engine } = require("express-handlebars");

const { connectDB } = require("./src/config/database");
const productsRouter = require("./src/routes/products.router");
const cartsRouter = require("./src/routes/carts.router");
const viewsRouter = require("./src/routes/views.router");
const productService = require("./src/services/product.service");

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
fs.mkdirSync(path.join(__dirname, "public", "uploads"), { recursive: true });
app.use(express.static(path.join(__dirname, "public")));

app.engine(
  "handlebars",
  engine({
    helpers: {
      eq: (a, b) => a === b,
    },
  })
);
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);
app.use("/", viewsRouter);

const httpServer = http.createServer(app);
const io = new Server(httpServer);

const CHAT_BOT = "Generadores Calamuchita";
const GREETINGS = /^(hola|buenas|buenos?\s*d[ií]as|buenas\s*tardes|buenas\s*noches|hey|que\s*tal|buen\s*d[ií]a)[\s!.]*$/i;
const OPTIONS = /^(1|2|3|ventas|alquiler|service)$/i;

io.on("connection", async (socket) => {
  socket.emit("chat:system", "Conectado al chat de Generadores Eléctricos");

  socket.on("chat:message", (payload) => {
    io.emit("chat:message", payload);

    const msg = (payload.message || "").trim().toLowerCase();
    if (GREETINGS.test(msg)) {
      io.emit("chat:message", {
        user: CHAT_BOT,
        message: "Hola, te comunicaste con Generadores Calamuchita. ¿Cómo te podemos ayudar?\n1 Ventas\n2 Alquiler\n3 Service",
      });
    } else if (OPTIONS.test(msg)) {
      io.emit("chat:message", {
        user: CHAT_BOT,
        message: "Gracias, a la brevedad uno de nuestros asistentes se comunicará con usted.",
      });
    }
  });

  socket.on("product:create", async (product) => {
    try {
      const newProduct = await productService.addProduct(product);
      const payload = newProduct.toObject ? newProduct.toObject() : newProduct;
      if (payload._id) payload.id = payload._id.toString();
      io.emit("product:created", payload);
    } catch (err) {
      socket.emit("product:error", err.message);
    }
  });

  socket.on("product:delete", async (productId) => {
    try {
      const deleted = await productService.deleteProduct(productId);
      if (deleted) io.emit("product:deleted", productId);
    } catch (err) {
      socket.emit("product:error", err.message);
    }
  });
});

const startServer = async () => {
  await connectDB();

  httpServer
    .once("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.log(`Puerto ${PORT} en uso, intentando ${PORT + 1}...`);
        httpServer.listen(PORT + 1, () => {
          console.log(`Servidor activo en http://localhost:${PORT + 1}`);
        });
      } else {
        throw err;
      }
    })
    .listen(PORT, () => {
      console.log(`Servidor activo en http://localhost:${PORT}`);
    });
};

startServer().catch((err) => {
  console.error("Error al iniciar:", err);
  process.exit(1);
});
