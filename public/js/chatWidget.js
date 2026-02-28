(function () {
  const toggle = document.getElementById("chat-toggle");
  const panel = document.getElementById("chat-panel");
  const closeBtn = document.getElementById("chat-close");
  const messages = document.getElementById("chat-messages");
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");

  if (!toggle || !panel) return;

  const socket = io();

  const addMessage = (text, type = "user") => {
    const wrapper = document.createElement("div");
    wrapper.className = `chat-message ${type}`;
    wrapper.textContent = text;
    messages.appendChild(wrapper);
    messages.scrollTop = messages.scrollHeight;
  };

  socket.on("chat:system", (text) => addMessage(text, "system"));
  socket.on("chat:message", (payload) => {
    const text = `${payload.user}: ${payload.message}`;
    const type = payload.user === "Yo" ? "self" : payload.user === "Generadores Calamuchita" ? "bot" : "user";
    addMessage(text, type);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const message = input.value.trim();
    if (!message) return;
    socket.emit("chat:message", { user: "Yo", message });
    input.value = "";
  });

  toggle.addEventListener("click", () => {
    const isOpen = panel.getAttribute("aria-hidden") === "false";
    panel.setAttribute("aria-hidden", isOpen);
    panel.classList.toggle("chat-panel--open", !isOpen);
  });

  closeBtn.addEventListener("click", () => {
    panel.setAttribute("aria-hidden", "true");
    panel.classList.remove("chat-panel--open");
  });
})();
