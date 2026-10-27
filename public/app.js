"use strict";

const CHAT_ENDPOINT = "/chat";
const PROMPT_CHIPS_URL = "/prompt-chips.json";

let promptChips = [];
let elements = {};
let isSending = false;

function initializeChat() {
  elements = {
    form: document.getElementById("chat-form"),
    input: document.getElementById("chat-input"),
    sendButton: document.getElementById("send-button"),
    messages: document.getElementById("messages"),
  };

  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage();
  });

  elements.input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });

  elements.input.addEventListener("input", autoGrowInput);

  document.body.addEventListener("click", (event) => {
    const newChatBtn = event.target.closest('[data-action="new-chat"]');
    if (newChatBtn) {
      resetChat();
      elements.input.focus();
      return;
    }
    const chip = event.target.closest(".prompt-chip");
    if (!chip) return;
    elements.input.value = chip.textContent.trim();
    autoGrowInput();
    sendMessage();
  });

  const isTouch = window.matchMedia?.("(hover: none) and (pointer: coarse)")?.matches;
  if (!isTouch) elements.input.focus();

  renderPromptChips();
}

function renderPromptChips() {
  const sidebarChips = document.getElementById("sidebar-chips");
  const mobileChips = document.getElementById("mobile-chips");

  const frag = document.createDocumentFragment();
  promptChips.forEach((label) => {
    const btn = document.createElement("button");
    btn.className = "prompt-chip";
    btn.type = "button";
    btn.textContent = label;
    frag.appendChild(btn.cloneNode(true));
  });

  if (sidebarChips) sidebarChips.replaceChildren(frag.cloneNode(true));
  if (mobileChips) mobileChips.replaceChildren(frag);
}

function autoGrowInput() {
  const el = elements.input;
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 200) + "px";
}

async function sendMessage() {
  const question = elements.input.value.trim();
  if (!question || isSending) return;

  elements.input.value = "";
  autoGrowInput();
  setSending(true);

  addUserMessage(question);
  const loadingEl = showLoading();

  try {
    const res = await fetch(CHAT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server error (${res.status})`);
    }

    const data = await res.json();
    loadingEl.remove();
    addAssistantMessage(data);
  } catch (err) {
    loadingEl.remove();
    addErrorMessage(err.message);
  } finally {
    setSending(false);
    document.body.classList.add("has-conversation");
  }
}

function addUserMessage(text) {
  const el = document.createElement("div");
  el.className = "message message--user";
  el.dataset.testid = "user-message";

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.textContent = text;
  el.appendChild(bubble);

  elements.messages.appendChild(el);
  scrollToBottom();
}

function addAssistantMessage(data) {
  const el = document.createElement("div");
  el.className = "message message--assistant";
  el.dataset.testid = "assistant-message";

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  const title = document.createElement("div");
  title.className = "answer-title";
  title.textContent = data.Title || "NDC Information";
  bubble.appendChild(title);

  const body = document.createElement("div");
  body.className = "answer-body";
  body.textContent = data.Body || "";
  bubble.appendChild(body);

  if (data.References && data.References.length > 0) {
    const refs = document.createElement("div");
    refs.className = "message-references";

    const label = document.createElement("div");
    label.className = "message-references__label";
    label.textContent = "References";
    refs.appendChild(label);

    data.References.forEach((ref) => {
      const a = document.createElement("a");
      a.href = ref.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = ref.title || ref.url;
      refs.appendChild(a);
    });

    bubble.appendChild(refs);
  }

  el.appendChild(bubble);
  elements.messages.appendChild(el);
  scrollToBottom();
}

function addErrorMessage(text) {
  const el = document.createElement("div");
  el.className = "message message--error";
  el.dataset.testid = "error-message";

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.textContent = text;
  el.appendChild(bubble);

  elements.messages.appendChild(el);
  scrollToBottom();
}

function showLoading() {
  const el = document.createElement("div");
  el.className = "message message--assistant";
  el.dataset.testid = "loading-message";

  const bubble = document.createElement("div");
  bubble.className = "message-bubble message-bubble--loading";

  const text = document.createElement("span");
  text.className = "loading-text";
  text.textContent = "Searching for answers";
  bubble.appendChild(text);

  const indicator = document.createElement("span");
  indicator.className = "typing-indicator";
  indicator.innerHTML = "<span></span><span></span><span></span>";
  bubble.appendChild(indicator);

  el.appendChild(bubble);
  elements.messages.appendChild(el);
  scrollToBottom();
  return el;
}

function setSending(sending) {
  isSending = sending;
  elements.sendButton.disabled = sending;
  elements.input.disabled = sending;
}

function scrollToBottom() {
  elements.messages.scrollTop = elements.messages.scrollHeight;
}

function resetChat() {
  elements.messages.replaceChildren();
  document.body.classList.remove("has-conversation");
}

function initThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("askndc-theme", next);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.content = next === "light" ? "#ffffff" : "#0b0f19";
  });
}

async function loadPromptChips() {
  try {
    const res = await fetch(PROMPT_CHIPS_URL);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) promptChips = data;
    }
  } catch {
    // keep defaults
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadPromptChips();
  initializeChat();
  initThemeToggle();
});