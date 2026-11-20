"use strict";

const config = window.VICTOR_CONFIG;
const $ = (id) => document.getElementById(id);
const ui = {
  notice: $("notice"), status: $("session-status"), signIn: $("sign-in"), signOut: $("sign-out"),
  workspace: $("workspace"), personal: $("personal-mode"), practice: $("practice-mode"),
  modeDescription: $("mode-description"), messages: $("messages"), form: $("chat-form"),
  input: $("message-input"), send: $("send-button"), newChat: $("new-chat"),
  voiceStart: $("voice-start"), voiceStop: $("voice-stop"), voiceInterrupt: $("voice-interrupt"),
  voiceMuted: $("voice-muted"), voiceStatus: $("voice-status"), voiceTranscript: $("voice-transcript"),
  memoryButton: $("memory-button"), memoryPanel: $("memory-panel"), closeMemory: $("close-memory"),
  pendingFacts: $("pending-facts"), allFacts: $("all-facts"),
  facts: $("facts"), factDialog: $("fact-dialog"), factForm: $("fact-form"),
  factSubject: $("fact-subject"), factPredicate: $("fact-predicate"), factObject: $("fact-object"),
  cancelFact: $("cancel-fact")
};
let accessToken = null;
let expiresAt = 0;
let mode = "personal";
let selectedFactId = null;
let memoryView = "pending";
let memoryFacts = [];
const conversationIds = { personal: null, practice: null };
const voice = window.VictorVoice ? new window.VictorVoice({
  api, token: () => accessToken,
  onState(state) {
    const active = state !== "idle";
    ui.voiceStart.disabled = active; ui.voiceStop.disabled = !active;
    ui.voiceInterrupt.disabled = !active;
    ui.voiceStatus.textContent = ({ idle: "Voice off", connecting: "Connecting…", listening: "Listening…", thinking: "Thinking…", speaking: "Speaking…" })[state] || state;
  },
  onTranscript(text) { ui.voiceTranscript.textContent = text; },
  onReply(data) { conversationIds[mode] = data.conversationId; refreshMessages().catch(showError); },
  onError(message) { notice(message, true); },
}) : null;

function notice(message, error = false) {
  ui.notice.textContent = message;
  ui.notice.classList.toggle("error", error);
}

function validConfig() {
  return config && /^https:\/\//.test(config.apiBaseUrl) && /^https:\/\//.test(config.cognitoDomain)
    && config.clientId && !Object.values(config).some((value) => String(value).includes("YOUR_"));
}

function signedIn(token, seconds) {
  accessToken = token;
  expiresAt = Date.now() + Number(seconds) * 1000;
  ui.status.textContent = "Signed in";
  ui.signIn.hidden = true;
  ui.signOut.hidden = false;
  ui.workspace.hidden = false;
  notice("Signed in. Choose a mode and start chatting.");
  refreshMessages().catch(showError);
}

function signedOut(message = "Signed out.") {
  voice?.stop();
  ui.voiceTranscript.textContent = "";
  accessToken = null;
  expiresAt = 0;
  ui.status.textContent = "Signed out";
  ui.signIn.hidden = false;
  ui.signOut.hidden = true;
  ui.workspace.hidden = true;
  ui.messages.replaceChildren();
  ui.facts.replaceChildren();
  memoryFacts = [];
  ui.input.value = "";
  conversationIds.personal = null;
  conversationIds.practice = null;
  notice(message);
}

function randomUrlSafe(bytes) {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return btoa(String.fromCharCode(...data)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function codeChallenge(verifier) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const redirectUri = () => `${location.origin}${location.pathname}`;

async function startSignIn() {
  const verifier = randomUrlSafe(32);
  const state = randomUrlSafe(24);
  sessionStorage.setItem("victor-oauth", JSON.stringify({ verifier, state, createdAt: Date.now() }));
  const url = new URL(`${config.cognitoDomain.replace(/\/$/, "")}/oauth2/authorize`);
  url.search = new URLSearchParams({
    response_type: "code", client_id: config.clientId, redirect_uri: redirectUri(),
    scope: "openid email", state, code_challenge_method: "S256",
    code_challenge: await codeChallenge(verifier)
  }).toString();
  location.assign(url.href);
}

async function finishSignIn() {
  const params = new URLSearchParams(location.search);
  const code = params.get("code");
  const oauthError = params.get("error");
  if (!code && !oauthError) return;
  history.replaceState(null, "", location.pathname);
  const pending = sessionStorage.getItem("victor-oauth");
  sessionStorage.removeItem("victor-oauth");
  if (oauthError) throw new Error(`Sign-in failed: ${oauthError}`);
  if (!pending) throw new Error("Sign-in session was lost. Please try again.");
  const { verifier, state, createdAt } = JSON.parse(pending);
  if (state !== params.get("state") || Date.now() - createdAt > 10 * 60 * 1000) {
    throw new Error("Sign-in validation failed. Please try again.");
  }
  const body = new URLSearchParams({
    grant_type: "authorization_code", client_id: config.clientId, code,
    redirect_uri: redirectUri(), code_verifier: verifier
  });
  const response = await fetch(`${config.cognitoDomain.replace(/\/$/, "")}/oauth2/token`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body, cache: "no-store"
  });
  const token = await response.json();
  if (!response.ok || !token.access_token) throw new Error("Token exchange failed. Please sign in again.");
  signedIn(token.access_token, token.expires_in);
}

function signOut() {
  signedOut();
  const url = new URL(`${config.cognitoDomain.replace(/\/$/, "")}/logout`);
  url.search = new URLSearchParams({ client_id: config.clientId, logout_uri: redirectUri() }).toString();
  location.assign(url.href);
}

async function api(path, options = {}) {
  if (!accessToken || Date.now() >= expiresAt - 10000) {
    signedOut("Session expired. Sign in again.");
    throw new Error("Session expired.");
  }
  const response = await fetch(`${config.apiBaseUrl.replace(/\/$/, "")}${path}`, {
    ...options, headers: { Authorization: `Bearer ${accessToken}`, ...(options.body ? { "Content-Type": "application/json" } : {}) },
    cache: "no-store"
  });
  const data = await response.json();
  if (response.status === 401) signedOut("Session expired. Sign in again.");
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status}).`);
  return data;
}

function showError(error) {
  notice(error instanceof Error ? error.message : "Request failed.", true);
}

function renderMessages(messages) {
  ui.messages.replaceChildren();
  if (!messages.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = mode === "personal" ? "Start a conversation with Victor." : "Practice English with Victor.";
    ui.messages.append(empty);
    return;
  }
  for (const message of messages) {
    const item = document.createElement("article");
    item.className = `message ${message.role === "user" ? "user" : "assistant"}`;
    const label = document.createElement("strong");
    label.textContent = message.role === "user" ? "You" : "Victor";
    const content = document.createElement("span");
    content.textContent = message.content;
    item.append(label, content);
    ui.messages.append(item);
  }
  ui.messages.scrollTop = ui.messages.scrollHeight;
}

async function refreshMessages() {
  const selected = mode;
  const query = new URLSearchParams({ mode: selected });
  if (conversationIds[selected]) query.set("conversationId", conversationIds[selected]);
  const data = await api(`/messages?${query}`);
  if (selected === mode) renderMessages(data.messages || []);
}

function chooseMode(next) {
  voice?.stop();
  ui.voiceTranscript.textContent = "";
  mode = next;
  ui.personal.setAttribute("aria-pressed", String(next === "personal"));
  ui.practice.setAttribute("aria-pressed", String(next === "practice"));
  ui.memoryButton.hidden = next !== "personal";
  ui.memoryPanel.hidden = true;
  ui.modeDescription.textContent = next === "personal"
    ? "Victor can use and add to your personal memory."
    : "English practice stays separate from your personal memory.";
  refreshMessages().catch(showError);
}

async function sendMessage(event) {
  event.preventDefault();
  voice?.stop();
  const message = ui.input.value.trim();
  if (!message) return;
  const selected = mode;
  ui.send.disabled = true;
  notice("Victor is replying…");
  try {
    const data = await api("/chat", {
      method: "POST", body: JSON.stringify({ mode: selected, message, ...(conversationIds[selected] ? { conversationId: conversationIds[selected] } : {}) })
    });
    conversationIds[selected] = data.conversationId;
    if (selected === mode) {
      ui.input.value = "";
      await refreshMessages();
    }
    notice("Reply received.");
  } catch (error) { showError(error); }
  finally { ui.send.disabled = false; }
}

function isReviewed(fact) {
  return fact.reviewed === true || fact.corrected === true;
}

function renderFacts() {
  ui.facts.replaceChildren();
  const pendingCount = memoryFacts.filter((fact) => !isReviewed(fact)).length;
  ui.pendingFacts.textContent = `Pending review (${pendingCount})`;
  ui.allFacts.textContent = `All memory (${memoryFacts.length})`;
  ui.pendingFacts.setAttribute("aria-pressed", String(memoryView === "pending"));
  ui.allFacts.setAttribute("aria-pressed", String(memoryView === "all"));
  const visible = memoryView === "pending" ? memoryFacts.filter((fact) => !isReviewed(fact)) : memoryFacts;
  if (!visible.length) {
    const empty = document.createElement("p");
    empty.textContent = memoryView === "pending" ? "Nothing waiting for review." : "No personal facts saved yet.";
    ui.facts.append(empty);
    return;
  }
  for (const fact of visible) {
    const row = document.createElement("div");
    row.className = "fact";
    const details = document.createElement("div");
    details.className = "fact-details";
    const label = document.createElement("span");
    label.textContent = `${fact.subject} · ${fact.predicate} · ${fact.object}`;
    const added = document.createElement("time");
    added.className = "fact-added";
    const addedDate = new Date(fact.createdAt);
    if (Number.isNaN(addedDate.getTime())) {
      added.textContent = "Added time unavailable";
    } else {
      added.dateTime = fact.createdAt;
      added.textContent = `Added ${addedDate.toLocaleString(undefined, {
        year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short"
      })}`;
    }
    details.append(label, added);
    if (memoryView === "all") {
      const review = document.createElement("small");
      review.className = "fact-review";
      review.textContent = isReviewed(fact) ? "Reviewed" : "Pending review";
      details.append(review);
    }
    const actions = document.createElement("div");
    if (!isReviewed(fact)) {
      const confirmFact = document.createElement("button");
      confirmFact.type = "button";
      confirmFact.className = "secondary";
      confirmFact.textContent = "Confirm";
      confirmFact.addEventListener("click", async () => {
        confirmFact.disabled = true;
        try {
          await api(`/facts/${encodeURIComponent(fact.id)}`, {
            method: "PATCH", body: JSON.stringify({ reviewed: true })
          });
          await refreshFacts();
          notice("Fact confirmed. It remains in All memory.");
        } catch (error) { showError(error); confirmFact.disabled = false; }
      });
      actions.append(confirmFact);
    }
    const edit = document.createElement("button");
    edit.type = "button"; edit.className = "secondary"; edit.textContent = "Correct";
    edit.addEventListener("click", () => {
      selectedFactId = fact.id;
      ui.factSubject.value = fact.subject;
      ui.factPredicate.value = fact.predicate;
      ui.factObject.value = fact.object;
      ui.factDialog.showModal();
    });
    const remove = document.createElement("button");
    remove.type = "button"; remove.className = "danger"; remove.textContent = "Delete";
    remove.addEventListener("click", async () => {
      if (!confirm("Delete this fact from Victor's memory?")) return;
      try { await api(`/facts/${encodeURIComponent(fact.id)}`, { method: "DELETE" }); await refreshFacts(); }
      catch (error) { showError(error); }
    });
    actions.append(edit, remove); row.append(details, actions); ui.facts.append(row);
  }
}

async function refreshFacts() {
  const data = await api("/facts");
  memoryFacts = [...(data.facts || [])].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  renderFacts();
}

async function saveFact(event) {
  event.preventDefault();
  if (!selectedFactId) return;
  try {
    await api(`/facts/${encodeURIComponent(selectedFactId)}`, {
      method: "PATCH", body: JSON.stringify({
        subject: ui.factSubject.value.trim(), predicate: ui.factPredicate.value.trim(),
        object: ui.factObject.value.trim(), reviewed: true
      })
    });
    ui.factDialog.close();
    selectedFactId = null;
    await refreshFacts();
    notice("Correction saved. The fact remains in All memory.");
  } catch (error) { showError(error); }
}

ui.signIn.addEventListener("click", () => startSignIn().catch(showError));
ui.signOut.addEventListener("click", signOut);
ui.personal.addEventListener("click", () => chooseMode("personal"));
ui.practice.addEventListener("click", () => chooseMode("practice"));
ui.form.addEventListener("submit", sendMessage);
ui.newChat.addEventListener("click", () => { voice?.stop(); conversationIds[mode] = null; renderMessages([]); notice("New conversation ready."); });
ui.voiceStart.addEventListener("click", () => {
  if (!accessToken || Date.now() >= expiresAt - 10000) { signedOut("Sign in to use voice."); return; }
  voice?.start(mode, conversationIds[mode], ui.voiceMuted.checked);
});
ui.voiceStop.addEventListener("click", () => voice?.stop());
ui.voiceInterrupt.addEventListener("click", () => voice?.interrupt());
ui.voiceMuted.addEventListener("change", () => voice?.setMuted(ui.voiceMuted.checked));
if (voice) {
  document.addEventListener("visibilitychange", () => { if (document.hidden) voice.stop(); });
  window.addEventListener("pagehide", () => voice.stop());
}
ui.memoryButton.addEventListener("click", () => {
  memoryView = "pending";
  ui.memoryPanel.hidden = false;
  refreshFacts().catch(showError);
});
ui.closeMemory.addEventListener("click", () => { ui.memoryPanel.hidden = true; });
ui.pendingFacts.addEventListener("click", () => { memoryView = "pending"; renderFacts(); });
ui.allFacts.addEventListener("click", () => { memoryView = "all"; renderFacts(); });
ui.factForm.addEventListener("submit", saveFact);
ui.cancelFact.addEventListener("click", () => ui.factDialog.close());

if (!validConfig()) {
  ui.signIn.disabled = true;
  notice("Web configuration is missing. Contact the Victor administrator.", true);
} else {
  finishSignIn().catch(showError);
}
