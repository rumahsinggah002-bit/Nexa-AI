// Ganti URL ini setelah Cloudflare Worker berhasil dipublikasikan.
const API_URL = "https://GANTI-DENGAN-URL-WORKER-ANDA.workers.dev";

const form = document.getElementById("chatForm");
const input = document.getElementById("prompt");
const messagesEl = document.getElementById("messages");
const welcome = document.getElementById("welcome");
const sendBtn = document.getElementById("sendBtn");
const statusEl = document.getElementById("status");
const newChatBtn = document.getElementById("newChatBtn");

let history = [];
try { history = JSON.parse(localStorage.getItem("nexa_history") || "[]"); } catch { history = []; }

function saveHistory() {
  localStorage.setItem("nexa_history", JSON.stringify(history.slice(-30)));
}
function addMessage(role, text) {
  welcome.hidden = true;
  const row = document.createElement("div");
  row.className = `message ${role === "user" ? "user" : "assistant"}`;
  if (role !== "user") {
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "N";
    row.appendChild(avatar);
  }
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;
  row.appendChild(bubble);
  messagesEl.appendChild(row);
  messagesEl.parentElement.scrollTop = messagesEl.parentElement.scrollHeight;
  return bubble;
}
function renderHistory() {
  messagesEl.innerHTML = "";
  if (!history.length) { welcome.hidden = false; return; }
  welcome.hidden = true;
  history.forEach(m => addMessage(m.role === "model" ? "assistant" : "user", m.text));
}
function setBusy(busy) {
  sendBtn.disabled = busy;
  input.disabled = busy;
  statusEl.textContent = busy ? "NEXA sedang berpikir..." : "NEXA siap membantu";
}
async function sendMessage(text) {
  const clean = text.trim();
  if (!clean || sendBtn.disabled) return;
  if (!API_URL.startsWith("https://") || API_URL.includes("GANTI-DENGAN")) {
    addMessage("assistant", "Aplikasi belum terhubung. Atur API_URL di file www/app.js menggunakan URL Cloudflare Worker milikmu.");
    return;
  }

  history.push({ role: "user", text: clean });
  addMessage("user", clean);
  saveHistory();
  input.value = "";
  input.style.height = "auto";
  const loadingBubble = addMessage("assistant", "Sedang menyiapkan jawaban...");
  setBusy(true);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history.slice(-20) })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Server error (${response.status})`);
    if (!data.reply) throw new Error("AI tidak mengirim jawaban. Coba lagi.");
    loadingBubble.textContent = data.reply;
    history.push({ role: "model", text: data.reply });
    saveHistory();
  } catch (error) {
    loadingBubble.textContent = `Maaf, terjadi kendala: ${error.message}. Periksa koneksi internet dan URL Worker.`;
  } finally {
    setBusy(false);
    input.focus();
    messagesEl.parentElement.scrollTop = messagesEl.parentElement.scrollHeight;
  }
}
form.addEventListener("submit", e => {
  e.preventDefault();
  sendMessage(input.value);
});
input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 130) + "px";
});
input.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});
document.querySelectorAll(".suggestion").forEach(button => {
  button.addEventListener("click", () => sendMessage(button.dataset.prompt));
});
newChatBtn.addEventListener("click", () => {
  history = [];
  saveHistory();
  renderHistory();
  input.focus();
});
renderHistory();