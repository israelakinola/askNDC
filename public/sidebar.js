const PROMPT_CHIPS = [
  "What are the core values of the NDC party?",
  "Who founded the NDC?",
  "What is the NDC's stance on education?",
  "Tell me about NDC's economic policies",
  "How is the NDC Presidential Candidate",
  "What are the NDC's achievements?",
  "What is the NDC's position on healthcare?",
  "How can I join the NDC party?"
];

function renderPromptChips() {
  const containers = document.querySelectorAll("[data-chip-list]");
  if (!containers.length || !Array.isArray(PROMPT_CHIPS)) return;
  containers.forEach((container) => {
    const frag = document.createDocumentFragment();
    PROMPT_CHIPS.forEach((label) => {
      if (typeof label === "string" && label.trim()) {
        const btn = document.createElement("button");
        btn.className = "prompt-chip";
        btn.type = "button";
        btn.textContent = label.trim();
        frag.appendChild(btn);
      }
    });
    container.replaceChildren(frag);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderPromptChips, { once: true });
} else {
  renderPromptChips();
}