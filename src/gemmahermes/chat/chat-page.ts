/**
 * Clean, modern web chat UI for GemmaHermes.
 * Talks to the local backend via the proxied /v1/chat/completions endpoint.
 * Single-page, no framework, streaming support.
 */
export function getChatPageHtml(modelId: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>GemmaHermes Chat</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #1a1a2e;
    --surface: #16213e;
    --surface-hover: #1a2745;
    --border: #2a3a5c;
    --text: #e0e0e0;
    --text-muted: #8899aa;
    --accent: #4a9eff;
    --accent-hover: #6ab4ff;
    --user-bg: #2a3f5f;
    --assistant-bg: #1e2d4a;
    --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    --mono: "SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, monospace;
    --radius: 12px;
  }
  html, body { height: 100%; }
  body {
    font-family: var(--font);
    background: var(--bg);
    color: var(--text);
    display: flex;
    flex-direction: column;
  }
  header {
    padding: 16px 24px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--surface);
  }
  header h1 {
    font-size: 18px;
    font-weight: 600;
    color: var(--accent);
  }
  header .model-badge {
    font-size: 12px;
    color: var(--text-muted);
    background: var(--bg);
    padding: 4px 10px;
    border-radius: 20px;
    border: 1px solid var(--border);
  }
  #messages {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .msg {
    max-width: 720px;
    width: 100%;
    margin: 0 auto;
    display: flex;
    gap: 12px;
    animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .msg-avatar {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    flex-shrink: 0;
    margin-top: 2px;
  }
  .msg.user .msg-avatar { background: var(--accent); color: #fff; }
  .msg.assistant .msg-avatar { background: #2d4a3e; color: #6fcf97; }
  .msg-body {
    flex: 1;
    min-width: 0;
  }
  .msg-role {
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .msg.user .msg-role { color: var(--accent); }
  .msg.assistant .msg-role { color: #6fcf97; }
  .msg-content {
    font-size: 15px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .msg-content code {
    font-family: var(--mono);
    font-size: 13px;
    background: rgba(255,255,255,0.06);
    padding: 2px 6px;
    border-radius: 4px;
  }
  .msg-content pre {
    background: rgba(0,0,0,0.3);
    padding: 12px 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 8px 0;
  }
  .msg-content pre code {
    background: none;
    padding: 0;
  }
  #input-area {
    padding: 16px 24px 24px;
    border-top: 1px solid var(--border);
    background: var(--surface);
  }
  #input-wrap {
    max-width: 720px;
    margin: 0 auto;
    display: flex;
    gap: 8px;
    align-items: flex-end;
  }
  #input {
    flex: 1;
    font-family: var(--font);
    font-size: 15px;
    color: var(--text);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 12px 16px;
    resize: none;
    outline: none;
    min-height: 48px;
    max-height: 200px;
    transition: border-color 0.15s;
  }
  #input:focus { border-color: var(--accent); }
  #input::placeholder { color: var(--text-muted); }
  #send {
    font-family: var(--font);
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    background: var(--accent);
    border: none;
    border-radius: var(--radius);
    padding: 12px 20px;
    cursor: pointer;
    transition: background 0.15s;
    white-space: nowrap;
  }
  #send:hover:not(:disabled) { background: var(--accent-hover); }
  #send:disabled { opacity: 0.5; cursor: not-allowed; }
  .thinking {
    display: inline-flex;
    gap: 4px;
    padding: 4px 0;
  }
  .thinking span {
    width: 6px; height: 6px;
    background: var(--text-muted);
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out;
  }
  .thinking span:nth-child(1) { animation-delay: -0.32s; }
  .thinking span:nth-child(2) { animation-delay: -0.16s; }
  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
  }
  .empty-state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    font-size: 16px;
    text-align: center;
    padding: 48px;
  }
  .empty-state h2 {
    font-size: 24px;
    color: var(--text);
    margin-bottom: 8px;
    font-weight: 600;
  }
  .empty-state p { max-width: 400px; line-height: 1.5; }
</style>
</head>
<body>
<header>
  <h1>GemmaHermes</h1>
  <span class="model-badge">${modelId}</span>
</header>
<div id="messages">
  <div class="empty-state">
    <div>
      <h2>Chat with Hermes</h2>
      <p>Your local Hermes model is ready. Type a message below to start.</p>
    </div>
  </div>
</div>
<div id="input-area">
  <div id="input-wrap">
    <textarea id="input" rows="1" placeholder="Type a message..." autofocus></textarea>
    <button id="send">Send</button>
  </div>
</div>
<script>
const MODEL = ${JSON.stringify(modelId)};
const messages = [];
const messagesEl = document.getElementById("messages");
const inputEl = document.getElementById("input");
const sendBtn = document.getElementById("send");
let streaming = false;

function autoResize() {
  inputEl.style.height = "auto";
  inputEl.style.height = Math.min(inputEl.scrollHeight, 200) + "px";
}
inputEl.addEventListener("input", autoResize);

function scrollToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function clearEmptyState() {
  const empty = messagesEl.querySelector(".empty-state");
  if (empty) empty.remove();
}

function addMessage(role, content) {
  clearEmptyState();
  const div = document.createElement("div");
  div.className = "msg " + role;
  const avatar = role === "user" ? "U" : "H";
  const label = role === "user" ? "You" : "Hermes";
  div.innerHTML =
    '<div class="msg-avatar">' + avatar + "</div>" +
    '<div class="msg-body">' +
    '<div class="msg-role">' + label + "</div>" +
    '<div class="msg-content"></div>' +
    "</div>";
  div.querySelector(".msg-content").textContent = content;
  messagesEl.appendChild(div);
  scrollToBottom();
  return div.querySelector(".msg-content");
}

function addThinking() {
  clearEmptyState();
  const div = document.createElement("div");
  div.className = "msg assistant";
  div.id = "thinking-msg";
  div.innerHTML =
    '<div class="msg-avatar">H</div>' +
    '<div class="msg-body">' +
    '<div class="msg-role">Hermes</div>' +
    '<div class="msg-content"><div class="thinking"><span></span><span></span><span></span></div></div>' +
    "</div>";
  messagesEl.appendChild(div);
  scrollToBottom();
}

function removeThinking() {
  const t = document.getElementById("thinking-msg");
  if (t) t.remove();
}

async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text || streaming) return;

  addMessage("user", text);
  messages.push({ role: "user", content: text });
  inputEl.value = "";
  autoResize();

  streaming = true;
  sendBtn.disabled = true;
  addThinking();

  try {
    const resp = await fetch("/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: messages,
        stream: true,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error("HTTP " + resp.status + ": " + errText);
    }

    removeThinking();
    const contentEl = addMessage("assistant", "");
    let fullContent = "";

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullContent += delta;
            contentEl.textContent = fullContent;
            scrollToBottom();
          }
        } catch {}
      }
    }

    messages.push({ role: "assistant", content: fullContent });
  } catch (err) {
    removeThinking();
    addMessage("assistant", "Error: " + err.message);
  } finally {
    streaming = false;
    sendBtn.disabled = false;
    inputEl.focus();
  }
}

sendBtn.addEventListener("click", sendMessage);
inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
</script>
</body>
</html>`;
}
