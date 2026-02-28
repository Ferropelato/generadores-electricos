const socket = io();

const messages = document.getElementById("chat-messages");
const form = document.getElementById("chat-form");
const input = document.getElementById("chat-input");

const addMessage = (text, type = "user") => {
  const wrapper = document.createElement("div");
  wrapper.className = `chat-message ${type}`;
  wrapper.textContent = text;
  messages.appendChild(wrapper);
  messages.scrollTop = messages.scrollHeight;
};

socket.on("chat:system", (text) => {
  addMessage(text, "system");
});

socket.on("chat:message", (payload) => {
  const text = `${payload.user}: ${payload.message}`;
  const type = payload.user === "Yo" ? "self" : payload.user === "Generadores Calamuchita" ? "bot" : "user";
  addMessage(text, type);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = input.value.trim();
  if (!message) return;
  socket.emit("chat:message", { user: "Yo", message });
  input.value = "";
});
