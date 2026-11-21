import "./voice.js";
const $ = (id) => document.getElementById(id);
let user = null,
  epoch = 0,
  view = 0,
  authMode = "login",
  mode = "personal",
  memoryView = "pending",
  selectedFact = null,
  factCursor = null,
  conversationCursor = null,
  memoryQuery = 0,
  messageCursor = null;
let memoryFacts = [],
  chatMessages = [];
const conversations = { personal: null, practice: null };
const notice = (message, error = false) => {
  $("notice").textContent = message;
  $("notice").classList.toggle("error", error);
};
function signedOut(message = "Signed out.") {
  epoch++;
  view++;
  voice.stop();
  user = null;
  conversations.personal = null;
  conversations.practice = null;
  memoryFacts = [];
  chatMessages = [];
  $("messages").replaceChildren();
  $("facts").replaceChildren();
  $("conversation-list").replaceChildren();
  $("workspace").hidden = true;
  $("auth-panel").hidden = false;
  $("settings-button").hidden = true;
  $("sign-out").hidden = true;
  $("session-status").textContent = "Signed out";
  $("auth-password").value = "";
  $("auth-code").value = "";
  $("message-input").value = "";
  $("current-password").value = "";
  $("new-password").value = "";
  $("recovery-codes").textContent = "";
  for (const id of ["settings-dialog", "fact-dialog", "recovery-dialog"])
    $(id).close();
  setAuth("login");
  notice(message);
}
async function api(path, options = {}) {
  const generation = epoch;
  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const result = await response.json();
  if (generation !== epoch)
    throw new DOMException("Session changed", "AbortError");
  if (!response.ok) {
    if (response.status === 401 && user)
      signedOut("Your session ended. Sign in again.");
    throw new Error(result.message || "Request failed.");
  }
  return result;
}
const post = (path, body) =>
  api(path, { method: "POST", body: JSON.stringify(body) });
const showError = (error) => {
  if (error.name !== "AbortError") notice(error.message, true);
};
const voice = new window.VictorVoice({
  api,
  token: () => null,
  onState(state) {
    const active = state !== "idle";
    $("voice-start").disabled = active;
    $("voice-stop").disabled = !active;
    $("voice-interrupt").disabled = !active;
    $("voice-status").textContent =
      {
        idle: "Voice off",
        connecting: "Connecting…",
        listening: "Listening…",
        thinking: "Thinking…",
        speaking: "Speaking…",
      }[state] || state;
  },
  onTranscript(text) {
    $("voice-transcript").textContent = text;
  },
  onActivity(event) {
    $("voice-activity").textContent = event.state === "started"
      ? "Speech detected. Listening to you."
      : `Pause detected (${event.silenceMs} ms). Preparing your reply.`;
  },
  onReply(data) {
    conversations[mode] = data.conversationId;
    refreshMessages().catch(showError);
    refreshConversations().catch(showError);
    refreshUsage().catch(showError);
  },
  onError: (message) => notice(message, true),
});
function setAuth(next) {
  authMode = next;
  const titles = {
    login: "Welcome back",
    register: "Create your private account",
    verify: "Verify your email",
    forgot: "Reset your password",
    reset: "Enter your recovery email code",
    recover: "Recover with a saved code",
  };
  $("auth-title").textContent = titles[next];
  $("auth-name-row").hidden = next !== "verify";
  $("auth-name").required = next === "verify";
  $("auth-password-row").hidden = ["register", "forgot"].includes(next);
  $("auth-password").required = !["register", "forgot"].includes(next);
  $("auth-password").autocomplete =
    next === "login" ? "current-password" : "new-password";
  $("auth-password").minLength = next === "login" ? 1 : 15;
  $("auth-code-row").hidden = !["verify", "reset", "recover"].includes(next);
  $("auth-code").required = ["verify", "reset", "recover"].includes(next);
  $("auth-code-label").textContent =
    next === "recover" ? "Saved recovery code" : "Code from your email";
  $("auth-code").value = "";
  $("resend-code").hidden = !["verify", "reset"].includes(next);
  $("auth-submit").textContent = {
    login: "Sign in",
    register: "Send verification code",
    verify: "Verify and create account",
    forgot: "Send recovery code",
    reset: "Set new password",
    recover: "Recover account",
  }[next];
  $("auth-help").textContent =
    next === "register"
      ? "Verify your email before choosing your account password."
      : "Your chats and memory belong to your account.";
}
function showCodes(codes) {
  $("recovery-codes").textContent = codes.join("\n");
  $("recovery-dialog").showModal();
}
async function loadSession() {
  const data = await api("/me");
  user = data.user;
  $("session-status").textContent = user.name;
  $("workspace").hidden = false;
  $("auth-panel").hidden = true;
  $("settings-button").hidden = false;
  $("sign-out").hidden = false;
  $("auth-password").value = "";
  $("auth-code").value = "";
  showUsage(data.usage);
  notice(
    data.providers.chat
      ? "Ready. Choose Personal or English practice."
      : "Account ready. The owner still needs to configure the OpenAI API key.",
  );
  await Promise.all([refreshConversations(), refreshMessages()]);
}
function showUsage(usage) {
  $("usage").textContent =
    `${usage.chatUsed}/${usage.chatLimit} chat turns · ${Math.ceil(usage.voiceSecondsUsed / 60)}/${Math.ceil(usage.voiceSecondsLimit / 60)} voice minutes today · Resets ${new Date(usage.resetsAt).toLocaleString()}`;
}
async function refreshUsage() {
  const data = await api("/me");
  showUsage(data.usage);
}
$("auth-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = $("auth-submit");
  button.disabled = true;
  const email = $("auth-email").value.trim().toLowerCase(),
    password = $("auth-password").value,
    code = $("auth-code").value.trim();
  try {
    if (authMode === "login") {
      await post("/auth/sign-in/email", { email, password });
      epoch++;
      await loadSession();
    } else if (authMode === "register") {
      const result = await post("/account/register", { email });
      setAuth("verify");
      notice(result.message);
    } else if (authMode === "verify") {
      const result = await post("/account/verify-registration", {
        email,
        code,
        password,
        name: $("auth-name").value.trim(),
      });
      setAuth("login");
      $("auth-password").value = "";
      showCodes(result.recoveryCodes);
      notice(result.message);
    } else if (authMode === "forgot") {
      const result = await post("/account/forgot-password", { email });
      setAuth("reset");
      notice(result.message);
    } else {
      const result = await post(
        authMode === "recover" ? "/account/recover" : "/account/reset-password",
        { email, code, password },
      );
      setAuth("login");
      $("auth-password").value = "";
      notice(result.message);
    }
  } catch (error) {
    showError(error);
  } finally {
    button.disabled = false;
  }
});
document.querySelectorAll("[data-auth]").forEach((button) =>
  button.addEventListener("click", () => {
    setAuth(button.dataset.auth);
    $("auth-password").value = "";
  }),
);
$("resend-code").addEventListener("click", async () => {
  try {
    const result = await post(
      authMode === "verify" ? "/account/register" : "/account/forgot-password",
      { email: $("auth-email").value.trim().toLowerCase() },
    );
    notice(result.message);
  } catch (error) {
    showError(error);
  }
});
$("sign-out").addEventListener("click", async () => {
  try {
    await post("/auth/sign-out", {});
    signedOut();
  } catch (error) {
    voice.stop();
    showError(error);
  }
});
function renderMessages() {
  $("messages").replaceChildren();
  if (!chatMessages.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "Start a conversation with Victor.";
    $("messages").append(empty);
  }
  for (const message of chatMessages) {
    const row = document.createElement("article");
    row.className = `message ${message.role === "user" ? "user" : "assistant"}`;
    const label = document.createElement("strong");
    label.textContent = message.role === "user" ? "You" : "Victor";
    const content = document.createElement("span");
    content.textContent = message.content;
    row.append(label, content);
    $("messages").append(row);
  }
  $("older-messages").hidden = !messageCursor;
  $("messages").scrollTop = $("messages").scrollHeight;
}
async function refreshMessages(older = false) {
  const selected = mode,
    generation = view,
    id = conversations[selected],
    query = new URLSearchParams({ mode: selected });
  if (!id) {
    chatMessages = [];
    messageCursor = null;
    renderMessages();
    return;
  }
  query.set("conversationId", id);
  if (older && messageCursor) query.set("cursor", messageCursor);
  const result = await api(`/messages?${query}`);
  if (generation !== view || selected !== mode) return;
  chatMessages = older
    ? [...result.messages, ...chatMessages]
    : result.messages;
  messageCursor = result.nextCursor;
  renderMessages();
}
async function refreshConversations(more = false) {
  const selected = mode,
    generation = view,
    result = await api(`/conversations?${new URLSearchParams({mode:selected,...(more&&conversationCursor?{cursor:conversationCursor}:{})})}`);
  if (generation !== view || selected !== mode) return;
  const list = $("conversation-list");
  if(!more) list.replaceChildren(new Option("New conversation", ""));
  for (const conversation of result.conversations)
    list.add(
      new Option(
        new Date(conversation.createdAt).toLocaleString(),
        conversation.id,
      ),
    );
  list.value = conversations[selected] || "";
  conversationCursor=result.nextCursor;
  $("more-conversations").hidden=!conversationCursor;
}
function chooseMode(next) {
  voice.stop();
  view++;
  mode = next;
  $("voice-transcript").textContent = "";
  $("memory-panel").hidden = true;
  $("personal-mode").setAttribute("aria-pressed", String(next === "personal"));
  $("practice-mode").setAttribute("aria-pressed", String(next === "practice"));
  $("memory-button").hidden = next !== "personal";
  $("mode-description").textContent =
    next === "personal"
      ? "Victor can use and add to your personal memory."
      : "English practice stays separate from your personal memory.";
  Promise.all([refreshConversations(), refreshMessages()]).catch(showError);
}
$("personal-mode").addEventListener("click", () => chooseMode("personal"));
$("practice-mode").addEventListener("click", () => chooseMode("practice"));
$("conversation-list").addEventListener("change", () => {
  voice.stop();
  view++;
  conversations[mode] = $("conversation-list").value || null;
  refreshMessages().catch(showError);
});
$("new-chat").addEventListener("click", () => {
  voice.stop();
  view++;
  conversations[mode] = null;
  $("conversation-list").value = "";
  refreshMessages().catch(showError);
});
$("delete-chat").addEventListener("click", async () => {
  const selected = mode,
    id = conversations[selected];
  if (
    !id ||
    !confirm("Permanently delete this conversation and its derived memory?")
  )
    return;
  voice.stop();
  try {
    await api(`/conversations/${id}?mode=${selected}`, { method: "DELETE" });
    if (mode === selected) {
      conversations[selected] = null;
      view++;
      await Promise.all([refreshMessages(), refreshConversations()]);
    }
    notice("Conversation and derived memory deleted.");
  } catch (error) {
    showError(error);
  }
});
$("older-messages").addEventListener("click", () =>
  refreshMessages(true).catch(showError),
);
$("more-conversations").addEventListener("click",()=>refreshConversations(true).catch(showError));
$("chat-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  voice.stop();
  const selected = mode,
    generation = view,
    message = $("message-input").value.trim();
  if (!message) return;
  $("send-button").disabled = true;
  try {
    if (!conversations[selected]) {
      const created = await post("/conversations", { mode: selected });
      conversations[selected] = created.conversationId;
    }
    const result = await post("/chat", {
      mode: selected,
      message,
      conversationId: conversations[selected],
      clientMessageId: crypto.randomUUID(),
    });
    conversations[selected] = result.conversationId;
    if (generation === view) {
      $("message-input").value = "";
      await Promise.all([
        refreshMessages(),
        refreshConversations(),
        refreshUsage(),
      ]);
      notice("Reply received.");
    }
  } catch (error) {
    showError(error);
  } finally {
    $("send-button").disabled = false;
  }
});
function renderFacts() {
  $("facts").replaceChildren();
  $("pending-facts").setAttribute(
    "aria-pressed",
    String(memoryView === "pending"),
  );
  $("all-facts").setAttribute("aria-pressed", String(memoryView === "all"));
  if (!memoryFacts.length) {
    const p = document.createElement("p");
    p.textContent =
      memoryView === "pending"
        ? "Nothing waiting for review."
        : "No personal facts saved yet.";
    $("facts").append(p);
  }
  for (const fact of memoryFacts) {
    const row = document.createElement("div");
    row.className = "fact";
    const details = document.createElement("div");
    details.className = "fact-details";
    const text = document.createElement("span");
    text.textContent = `${fact.subject} · ${fact.predicate} · ${fact.object}`;
    const time = document.createElement("time");
    time.className = "fact-added";
    time.dateTime = fact.createdAt;
    time.textContent = `Added ${new Date(fact.createdAt).toLocaleString(undefined, { timeZoneName: "short" })}`;
    details.append(text, time);
    const actions = document.createElement("div");
    const action = (label, work) => {
      const button = document.createElement("button");
      button.className = "secondary";
      button.textContent = label;
      button.addEventListener("click", () => work().catch(showError));
      actions.append(button);
    };
    if (!fact.reviewed)
      action("Confirm", async () => {
        await api(`/facts/${fact.id}`, {
          method: "PATCH",
          body: JSON.stringify({ reviewed: true }),
        });
        await refreshFacts();
        notice("Fact confirmed. It remains in All memory.");
      });
    action("Correct", async () => {
      selectedFact = fact.id;
      for (const key of ["subject", "predicate", "object"])
        $(`fact-${key}`).value = fact[key];
      $("fact-dialog").showModal();
    });
    action("Delete", async () => {
      if (!confirm("Delete this fact?")) return;
      await api(`/facts/${fact.id}`, { method: "DELETE" });
      await refreshFacts();
    });
    row.append(details, actions);
    $("facts").append(row);
  }
  $("more-facts").hidden = !factCursor;
}
async function refreshFacts(more = false) {
  const generation = view,
    requestNumber = ++memoryQuery,
    query = new URLSearchParams();
  if (memoryView === "pending") query.set("reviewed", "false");
  if (more && factCursor) query.set("cursor", factCursor);
  const result = await api(`/facts?${query}`);
  if (generation !== view || mode !== "personal" || requestNumber!==memoryQuery) return;
  memoryFacts = more ? [...memoryFacts, ...result.facts] : result.facts;
  factCursor = result.nextCursor;
  renderFacts();
}
$("memory-button").addEventListener("click", () => {
  memoryView = "pending";
  $("memory-panel").hidden = false;
  refreshFacts().catch(showError);
});
$("close-memory").addEventListener("click", () => {
  $("memory-panel").hidden = true;
});
for (const [id, value] of [
  ["pending-facts", "pending"],
  ["all-facts", "all"],
])
  $(id).addEventListener("click", () => {
    memoryView = value;
    refreshFacts().catch(showError);
  });
$("more-facts").addEventListener("click", () =>
  refreshFacts(true).catch(showError),
);
$("fact-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const body = { reviewed: true };
    for (const key of ["subject", "predicate", "object"])
      body[key] = $(`fact-${key}`).value.trim();
    await api(`/facts/${selectedFact}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    $("fact-dialog").close();
    await refreshFacts();
    notice("Correction saved. Original added time retained.");
  } catch (error) {
    showError(error);
  }
});
$("cancel-fact").addEventListener("click", () => $("fact-dialog").close());
$("voice-start").addEventListener("click", () =>
  voice.start(mode, conversations[mode], $("voice-muted").checked),
);
$("voice-stop").addEventListener("click", () => voice.stop());
$("voice-interrupt").addEventListener("click", () => voice.interrupt());
$("voice-muted").addEventListener("change", () =>
  voice.setMuted($("voice-muted").checked),
);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) voice.stop();
});
window.addEventListener("pagehide", () => voice.stop());
$("settings-button").addEventListener("click", () =>
  $("settings-dialog").showModal(),
);
$("close-settings").addEventListener("click", () => {
  $("settings-dialog").close();
  $("password-form").reset();
});
$("password-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await post("/account/change-password", {
      currentPassword: $("current-password").value,
      newPassword: $("new-password").value,
    });
    $("password-form").reset();
    $("settings-dialog").close();
    voice.stop();
    notice("Password changed. Other sessions were revoked.");
  } catch (error) {
    showError(error);
  }
});
$("generate-recovery").addEventListener("click", async () => {
  const password = $("current-password").value;
  if (!password) {
    notice(
      "Enter your current password above to replace recovery codes.",
      true,
    );
    $("current-password").focus();
    return;
  }
  try {
    const result = await post("/account/recovery-codes", { password });
    $("password-form").reset();
    $("settings-dialog").close();
    showCodes(result.recoveryCodes);
  } catch (error) {
    showError(error);
  }
});
$("close-recovery").addEventListener("click", () => {
  $("recovery-dialog").close();
  $("recovery-codes").textContent = "";
});
api("/auth/get-session")
  .then((active) => active?.session ? loadSession() : signedOut("Welcome. Sign in or create an account."))
  .catch((error) => { signedOut("Unable to check your session."); showError(error); });
