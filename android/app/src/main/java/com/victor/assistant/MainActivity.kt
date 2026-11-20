package com.victor.assistant

import android.app.AlertDialog
import android.os.Bundle
import android.Manifest
import android.content.pm.PackageManager
import android.view.View
import android.view.WindowManager
import android.net.Uri
import java.util.UUID
import android.widget.*
import androidx.activity.ComponentActivity
import androidx.lifecycle.Lifecycle
import androidx.activity.result.contract.ActivityResultContracts
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class MainActivity : ComponentActivity() {
    private lateinit var sessionStore: SessionStore
    private lateinit var account: NativeAccount
    private var sessionToken: String? = null
    private var sessionGeneration = 0
    private val http = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()
    private var mode = "personal"
    private val conversationIds = mutableMapOf<String, String>()
    private lateinit var status: TextView
    private lateinit var history: TextView
    private lateinit var input: EditText
    private lateinit var send: Button
    private lateinit var memory: Button
    private lateinit var practice: Button
    private lateinit var personal: Button
    private var voice: VoiceConnection? = null
    private var voiceGeneration = 0
    private lateinit var voiceStart: Button
    private lateinit var voiceStop: Button
    private lateinit var voiceStatus: TextView
    private lateinit var voiceTranscript: TextView
    private lateinit var muteReplies: CheckBox
    private lateinit var olderMessages: Button
    private var messageCursor: String? = null
    private val microphonePermission = registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (granted) startVoice() else showError("Allow microphone access to use voice.")
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
        sessionStore = SessionStore(this)
        sessionToken = sessionStore.load()
        account = NativeAccount(this, http, sessionStore) { token -> resetSession(token) }
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(24, 24, 24, 24)
        }
        val title = TextView(this).apply { text = "Victor"; textSize = 26f }
        root.addView(title)
        status = TextView(this).apply { text = if (sessionToken == null) "Signed out" else "Signed in" }
        root.addView(status)
        val signIn = Button(this).apply { text = "Account / sign in"; setOnClickListener { signIn() } }
        root.addView(signIn)
        val modes = LinearLayout(this)
        personal = Button(this).apply { text = "Personal"; setOnClickListener { chooseMode("personal") } }
        practice = Button(this).apply { text = "English Practice"; setOnClickListener { chooseMode("practice") } }
        modes.addView(personal, LinearLayout.LayoutParams(0, -2, 1f))
        modes.addView(practice, LinearLayout.LayoutParams(0, -2, 1f))
        root.addView(modes)
        val actions = LinearLayout(this)
        memory = Button(this).apply { text = "Memory"; setOnClickListener { showMemory() } }
        val newChat = Button(this).apply {
            text = "New chat"
            setOnClickListener {
                conversationIds.remove(mode)
                stopVoice()
                history.text = ""
                messageCursor = null
                olderMessages.visibility = View.GONE
            }
        }
        actions.addView(memory, LinearLayout.LayoutParams(0, -2, 1f))
        actions.addView(newChat, LinearLayout.LayoutParams(0, -2, 1f))
        root.addView(actions)
        val historyActions = LinearLayout(this)
        historyActions.addView(Button(this).apply { text = "Conversations"; setOnClickListener { showConversations() } }, LinearLayout.LayoutParams(0, -2, 1f))
        historyActions.addView(Button(this).apply { text = "Delete chat"; setOnClickListener { deleteConversation() } }, LinearLayout.LayoutParams(0, -2, 1f))
        root.addView(historyActions)
        val scroll = ScrollView(this)
        history = TextView(this).apply { textSize = 16f }
        scroll.addView(history)
        root.addView(scroll, LinearLayout.LayoutParams(-1, 0, 1f))
        olderMessages = Button(this).apply { text = "Earlier messages"; visibility = View.GONE; setOnClickListener { refresh(messageCursor, true) } }
        root.addView(olderMessages)
        val voiceActions = LinearLayout(this)
        voiceStart = Button(this).apply { text = "Start voice"; setOnClickListener { startVoice() } }
        voiceStop = Button(this).apply { text = "Stop voice"; isEnabled = false; setOnClickListener { stopVoice() } }
        voiceActions.addView(voiceStart, LinearLayout.LayoutParams(0, -2, 1f))
        voiceActions.addView(voiceStop, LinearLayout.LayoutParams(0, -2, 1f))
        root.addView(voiceActions)
        val speechActions = LinearLayout(this)
        speechActions.addView(Button(this).apply { text = "Stop speaking"; setOnClickListener { voice?.interrupt() } }, LinearLayout.LayoutParams(0, -2, 1f))
        muteReplies = CheckBox(this).apply { text = "Mute replies"; setOnCheckedChangeListener { _, checked -> voice?.muteReplies(checked) } }
        speechActions.addView(muteReplies, LinearLayout.LayoutParams(0, -2, 1f))
        root.addView(speechActions)
        voiceStatus = TextView(this).apply { text = "Voice off" }; root.addView(voiceStatus)
        voiceTranscript = TextView(this); root.addView(voiceTranscript)
        input = EditText(this).apply { hint = "Message Victor"; minLines = 1; maxLines = 4 }
        root.addView(input)
        send = Button(this).apply { text = "Send"; setOnClickListener { sendMessage() } }
        root.addView(send)
        setContentView(root)
        chooseMode("personal")
    }

    private fun signIn() {
        if (BuildConfig.API_URL.isBlank()) { showError("Set API_URL in android/victor.properties"); return }
        account.show()
    }

    private fun resetSession(token: String?) {
        sessionGeneration++
        sessionToken = token
        stopVoice()
        conversationIds.clear()
        history.text = ""
        input.text.clear()
        voiceTranscript.text = ""
        status.text = if (token == null) "Signed out" else "Signed in"
        if (token != null) refresh()
    }

    private fun chooseMode(selected: String) {
        stopVoice()
        voiceTranscript.text = ""
        mode = selected
        personal.isEnabled = selected != "personal"
        practice.isEnabled = selected != "practice"
        memory.visibility = if (selected == "personal") View.VISIBLE else View.GONE
        history.text = ""
        messageCursor = null
        olderMessages.visibility = View.GONE
        if (sessionToken != null) refresh()
    }

    private fun withToken(action: (String) -> Unit) {
        val token = sessionToken
        if (token == null) { showError("Sign in first"); return }
        action(token)
    }

    private fun request(method: String, path: String, payload: JSONObject? = null, failed: () -> Unit = {}, done: (JSONObject) -> Unit) {
        withToken { token ->
            val generation = sessionGeneration
            Thread {
                try {
                    val builder = Request.Builder()
                        .url(BuildConfig.API_URL.trimEnd('/') + path)
                        .header("Authorization", "Bearer $token")
                        .header("Accept", "application/json")
                        .header("X-Victor-Client", "android")
                    val jsonBody = payload?.toString()?.toRequestBody("application/json".toMediaType())
                    val request = when (method) {
                        "GET" -> builder.get().build()
                        "POST" -> builder.post(requireNotNull(jsonBody)).build()
                        "PATCH" -> builder.patch(requireNotNull(jsonBody)).build()
                        "DELETE" -> builder.delete().build()
                        else -> throw IllegalArgumentException("Unsupported request method")
                    }
                    val (response, success, statusCode) = http.newCall(request).execute().use { httpResponse ->
                        val body = JSONObject(httpResponse.body?.string() ?: "{}")
                        Triple(body, httpResponse.isSuccessful, httpResponse.code)
                    }
                    runOnUiThread {
                        if (generation != sessionGeneration || isFinishing || isDestroyed) return@runOnUiThread
                        if (statusCode == 401) { sessionStore.clear(); resetSession(null) }
                        if (success) done(response) else { failed(); showError(response.optString("message", "Request failed")) }
                    }
                } catch (_: Exception) {
                    runOnUiThread { if (generation == sessionGeneration) { failed(); showError("Network request failed") } }
                }
            }.start()
        }
    }

    private fun refresh(cursor: String? = null, append: Boolean = false) {
        val selected = mode
        val conversation = conversationIds[selected]
        var path = "/messages?mode=$selected"
        if (conversation != null) path += "&conversationId=$conversation"
        if (cursor != null) path += "&cursor=$cursor"
        request("GET", path) { body ->
            if (selected != mode || conversation != conversationIds[selected]) return@request
            val messages = body.optJSONArray("messages") ?: JSONArray()
            val lines = (0 until messages.length()).map { index ->
                val message = messages.getJSONObject(index)
                "${message.optString("role")}: ${message.optString("content")}"
            }
            val text = lines.joinToString("\n\n")
            history.text = if (append) "$text\n\n${history.text}" else text
            messageCursor = body.optString("nextCursor").takeUnless { it.isBlank() || it == "null" }
            olderMessages.visibility = if (messageCursor == null) View.GONE else View.VISIBLE
        }
    }

    private fun sendMessage() {
        stopVoice()
        val message = input.text.toString().trim()
        if (message.isEmpty()) return
        val selected = mode
        send.isEnabled = false
        fun submit(id: String) {
            val payload = JSONObject().put("mode", selected).put("message", message)
                .put("conversationId", id).put("clientMessageId", UUID.randomUUID().toString())
            request("POST", "/chat", payload, failed = { send.isEnabled = true }) { response ->
                send.isEnabled = true
                if (selected == mode) { input.text.clear(); conversationIds[selected] = response.getString("conversationId"); refresh() }
            }
        }
        val existing = conversationIds[selected]
        if (existing != null) submit(existing)
        else request("POST", "/conversations", JSONObject().put("mode", selected), failed = { send.isEnabled = true }) { response ->
            val id = response.getString("conversationId")
            conversationIds[selected] = id
            submit(id)
        }
    }

    private fun showConversations(cursor: String? = null) {
        val selected = mode
        request("GET", "/conversations?mode=$selected" + (cursor?.let { "&cursor=$it" } ?: "")) { response ->
            if (selected != mode) return@request
            val rows = response.optJSONArray("conversations") ?: JSONArray()
            val labels = (0 until rows.length()).map { rows.getJSONObject(it).optString("createdAt") }.toTypedArray()
            val builder = AlertDialog.Builder(this).setTitle("Conversations").setItems(labels) { _, index ->
                stopVoice(); conversationIds[selected] = rows.getJSONObject(index).getString("id"); refresh()
            }.setPositiveButton("Close", null)
            response.optString("nextCursor").takeUnless { it.isBlank() || it == "null" }?.let { next ->
                builder.setNegativeButton("More") { _, _ -> showConversations(next) }
            }
            builder.show()
        }
    }

    private fun deleteConversation() {
        val selected = mode
        val id = conversationIds[selected] ?: return showError("Select a conversation first")
        AlertDialog.Builder(this).setTitle("Delete conversation?")
            .setMessage("This permanently deletes the conversation and its derived memory.")
            .setNegativeButton("Cancel", null).setPositiveButton("Delete") { _, _ ->
                stopVoice()
                request("DELETE", "/conversations/$id?mode=$selected") {
                    conversationIds.remove(selected)
                    if (mode == selected) history.text = ""
                }
            }.show()
    }

    private fun showMemory(pending: Boolean = true, cursor: String? = null) {
        if (mode != "personal") return
        var path = "/facts?" + if (pending) "reviewed=false" else ""
        if (cursor != null) path += "&cursor=$cursor"
        request("GET", path) { response ->
            if (mode != "personal") return@request
            val facts = response.optJSONArray("facts") ?: JSONArray()
            val labels = (0 until facts.length()).map { index ->
                val fact = facts.getJSONObject(index)
                val added = try {
                    java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy h:mm a z").withZone(java.time.ZoneId.systemDefault())
                        .format(java.time.Instant.parse(fact.getString("createdAt")))
                } catch (_: Exception) { "Unknown time" }
                "${fact.optString("subject")} ${fact.optString("predicate")} ${fact.optString("object")}\nAdded $added"
            }.toTypedArray()
            val builder = AlertDialog.Builder(this).setTitle(if (pending) "Pending memory" else "All memory")
                .setItems(labels) { _, index -> editFact(facts.getJSONObject(index)) }
                .setPositiveButton("Close", null).setNeutralButton(if (pending) "All memory" else "Pending") { _, _ -> showMemory(!pending) }
            response.optString("nextCursor").takeUnless { it.isBlank() || it == "null" }?.let { next -> builder.setNegativeButton("More") { _, _ -> showMemory(pending, next) } }
            builder.show()
        }
    }

    private fun editFact(fact: JSONObject) {
        val editor = EditText(this).apply {
            setText(listOf("subject", "predicate", "object").joinToString(" | ") { fact.optString(it) })
        }
        AlertDialog.Builder(this).setTitle("Correct or delete fact").setView(editor)
            .setPositiveButton("Save") { _, _ ->
                val parts = editor.text.toString().split(" | ", limit = 3)
                if (parts.size != 3) {
                    showError("Use subject | predicate | object")
                    return@setPositiveButton
                }
                val body = JSONObject().put("subject", parts[0]).put("predicate", parts[1]).put("object", parts[2])
                request("PATCH", "/facts/${fact.getString("id")}", body) { showMemory() }
            }
            .setNegativeButton("Delete") { _, _ ->
                request("DELETE", "/facts/${fact.getString("id")}") { showMemory() }
            }
            .setNeutralButton("Confirm") { _, _ ->
                request("PATCH", "/facts/${fact.getString("id")}", JSONObject().put("reviewed", true)) { showMemory() }
            }
            .show()
    }

    private fun showError(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
        status.text = message
    }

    private fun startVoice() {
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            microphonePermission.launch(Manifest.permission.RECORD_AUDIO); return
        }
        stopVoice()
        val generation = voiceGeneration
        val selected = mode
        request("GET", "/voice/config") { config ->
            if (generation != voiceGeneration || selected != mode || !lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED)) return@request
            val url = config.optString("gatewayUrl")
            val endpoint = Uri.parse(url)
            val base = Uri.parse(BuildConfig.API_URL)
            val expectedScheme = if (base.scheme == "https") "wss" else if (BuildConfig.DEBUG) "ws" else "wss"
            if (endpoint.scheme != expectedScheme || endpoint.authority != base.authority || endpoint.path != "/voice" || endpoint.query != null || endpoint.fragment != null) {
                showError("Voice is not enabled yet. Text chat is available."); return@request
            }
            withToken { token ->
                if (generation != voiceGeneration || selected != mode || !lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED)) return@withToken
                voice = VoiceConnection(this, http, url, token, selected, conversationIds[selected],
                    onState = stateChanged@{ state ->
                        if (generation != voiceGeneration) return@stateChanged
                        voiceStart.isEnabled = state == "idle"
                        voiceStop.isEnabled = state != "idle"
                        voiceStatus.text = when (state) {
                            "connecting" -> "Connecting…"; "listening" -> "Listening…"
                            "thinking" -> "Thinking…"; "speaking" -> "Speaking…"; else -> "Voice off"
                        }
                    },
                    onTranscript = { text -> if (generation == voiceGeneration && selected == mode) voiceTranscript.text = text },
                    onReply = { response ->
                        if (generation == voiceGeneration && selected == mode) { conversationIds[selected] = response.getString("conversationId"); refresh() }
                    },
                    onError = { message -> if (generation == voiceGeneration) showError(message) },
                ).also { it.start(muteReplies.isChecked) }
            }
        }
    }

    private fun stopVoice() {
        voiceGeneration++
        voice?.stop(); voice = null
        if (this::voiceStart.isInitialized) { voiceStart.isEnabled = true; voiceStop.isEnabled = false; voiceStatus.text = "Voice off" }
    }

    override fun onStop() {
        stopVoice()
        super.onStop()
    }

    override fun onDestroy() {
        stopVoice()
        super.onDestroy()
    }
}
