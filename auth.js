import { auth } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const els = {
  authForm: document.getElementById("authForm"),
  usernameInput: document.getElementById("authUsername"),
  passwordInput: document.getElementById("authPassword"),
  messageBar: document.getElementById("messageBar"),
};

if (els.authForm) {
  els.authForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = els.usernameInput.value.trim();
    const password = els.passwordInput.value;

    if (!username || !password) {
      showMessage("Username and password are required.", "error");
      return;
    }

    const email = `${username.toLowerCase()}@roommate.local`;
    const button = els.authForm.querySelector("button[type='submit']");
    const original = button?.textContent || "Login";

    if (button) {
      button.disabled = true;
      button.textContent = "Logging in...";
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      showMessage("Login successful.", "success");
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 350);
    } catch (error) {
      let msg = "Invalid username or password.";
      if (error?.code === "auth/user-not-found") msg = "Account not found. Contact admin.";
      if (error?.code === "auth/wrong-password") msg = "Wrong password.";
      if (error?.code === "auth/invalid-credential") msg = "Invalid username or password.";
      showMessage(msg, "error");
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = original;
      }
    }
  });
}

function showMessage(text, type = "info") {
  if (!els.messageBar) return;
  els.messageBar.textContent = text;
  els.messageBar.className = `message-bar ${type}`;
  els.messageBar.classList.remove("hidden");
  clearTimeout(showMessage._t);
  showMessage._t = setTimeout(() => els.messageBar.classList.add("hidden"), 3000);
}
