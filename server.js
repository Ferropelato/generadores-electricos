const express = require("express");
const path = require("path");
const http = require("http");
const fs = require("fs");
const { Server } = require("socket.io");
const { engine } = require("express-handlebars");
const mongoose = require("mongoose");

const productsRouter = require("./src/routes/products.router");
const cartsRouter = require("./src/routes/carts.router");
const viewsRouter = require("./src/routes/views.router");
const ProductManager = require("./src/managers/ProductManager");

const app = express();
const productManager = new ProductManager(path.join(__dirname, "src", "data", "products.json"));
const PORT = 8080;
const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/generadores";

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
      const newProduct = await productManager.addProduct(product);
      io.emit("product:created", newProduct);
    } catch (err) {
      socket.emit("product:error", err.message);
    }
  });

  socket.on("product:delete", async (productId) => {
    try {
      const deleted = await productManager.deleteProduct(productId);
      if (deleted) io.emit("product:deleted", productId);
    } catch (err) {
      socket.emit("product:error", err.message);
    }
  });
});

mongoose
  .connect(MONGO_URL)
  .then(() => console.log("MongoDB conectado"))
  .catch((error) => console.error("Error al conectar MongoDB", error.message));

const startServer = (port) => {
  httpServer
    .once("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.log(`Puerto ${port} en uso, intentando ${port + 1}...`);
        startServer(port + 1);
      } else {
        throw err;
      }
    })
    .listen(port, () => {
      console.log(`Servidor activo en http://localhost:${port}`);
    });
};

startServer(PORT);
