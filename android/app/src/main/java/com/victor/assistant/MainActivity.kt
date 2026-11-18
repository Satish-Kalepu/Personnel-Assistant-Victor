package com.victor.assistant

import android.app.AlertDialog
import android.os.Bundle
import android.view.View
import android.widget.*
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import net.openid.appauth.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class MainActivity : ComponentActivity() {
    private lateinit var authService: AuthorizationService
    private val http = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()
    private var authState: AuthState? = null
    private var mode = "personal"
    private val conversationIds = mutableMapOf<String, String>()
    private lateinit var status: TextView
    private lateinit var history: TextView
    private lateinit var input: EditText
    private lateinit var send: Button
    private lateinit var memory: Button
    private lateinit var practice: Button
    private lateinit var personal: Button

    private val login = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        val data = result.data ?: return@registerForActivityResult
        val response = AuthorizationResponse.fromIntent(data)
        val error = AuthorizationException.fromIntent(data)
        if (response == null) {
            showError(error?.errorDescription ?: "Sign-in cancelled")
            return@registerForActivityResult
        }
        authState = AuthState(response, error)
        authService.performTokenRequest(response.createTokenExchangeRequest()) { token, exchangeError ->
            authState?.update(token, exchangeError)
            runOnUiThread {
                if (token?.accessToken != null) {
                    status.text = "Signed in"
                    refresh()
                } else showError(exchangeError?.errorDescription ?: "Token exchange failed")
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        authService = AuthorizationService(this)
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(24, 24, 24, 24)
        }
        val title = TextView(this).apply { text = "Victor"; textSize = 26f }
        root.addView(title)
        status = TextView(this).apply { text = "Signed out" }
        root.addView(status)
        val signIn = Button(this).apply { text = "Sign in"; setOnClickListener { signIn() } }
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
                history.text = ""
            }
        }
        actions.addView(memory, LinearLayout.LayoutParams(0, -2, 1f))
        actions.addView(newChat, LinearLayout.LayoutParams(0, -2, 1f))
        root.addView(actions)
        val scroll = ScrollView(this)
        history = TextView(this).apply { textSize = 16f }
        scroll.addView(history)
        root.addView(scroll, LinearLayout.LayoutParams(-1, 0, 1f))
        input = EditText(this).apply { hint = "Message Victor"; minLines = 1; maxLines = 4 }
        root.addView(input)
        send = Button(this).apply { text = "Send"; setOnClickListener { sendMessage() } }
        root.addView(send)
        setContentView(root)
        chooseMode("personal")
    }

    private fun signIn() {
        if (BuildConfig.CLIENT_ID.isBlank() || BuildConfig.COGNITO_DOMAIN.isBlank() || BuildConfig.API_URL.isBlank()) {
            showError("Set android/victor.properties from the deployment outputs.")
            return
        }
        val domain = BuildConfig.COGNITO_DOMAIN.trimEnd('/')
        val config = AuthorizationServiceConfiguration(
            android.net.Uri.parse("$domain/oauth2/authorize"),
            android.net.Uri.parse("$domain/oauth2/token")
        )
        val request = AuthorizationRequest.Builder(
            config, BuildConfig.CLIENT_ID, ResponseTypeValues.CODE,
            android.net.Uri.parse("victor://oauth2redirect")
        ).setScope("openid email").build()
        login.launch(authService.getAuthorizationRequestIntent(request))
    }

    private fun chooseMode(selected: String) {
        mode = selected
        personal.isEnabled = selected != "personal"
        practice.isEnabled = selected != "practice"
        memory.visibility = if (selected == "personal") View.VISIBLE else View.GONE
        history.text = ""
        if (authState?.isAuthorized == true) refresh()
    }

    private fun withToken(action: (String) -> Unit) {
        val state = authState
        if (state == null) {
            showError("Sign in first")
            return
        }
        state.performActionWithFreshTokens(authService) { token, _, error ->
            runOnUiThread {
                if (token != null) action(token)
                else showError(error?.errorDescription ?: "Session expired. Sign in again.")
            }
        }
    }

    private fun request(method: String, path: String, payload: JSONObject? = null, done: (JSONObject) -> Unit) {
        withToken { token ->
            Thread {
                try {
                    val builder = Request.Builder()
                        .url(BuildConfig.API_URL.trimEnd('/') + path)
                        .header("Authorization", "Bearer $token")
                        .header("Accept", "application/json")
                    val jsonBody = payload?.toString()?.toRequestBody("application/json".toMediaType())
                    val request = when (method) {
                        "GET" -> builder.get().build()
                        "POST" -> builder.post(requireNotNull(jsonBody)).build()
                        "PATCH" -> builder.patch(requireNotNull(jsonBody)).build()
                        "DELETE" -> builder.delete().build()
                        else -> throw IllegalArgumentException("Unsupported request method")
                    }
                    val (response, success) = http.newCall(request).execute().use { httpResponse ->
                        val body = JSONObject(httpResponse.body?.string() ?: "{}")
                        Pair(body, httpResponse.isSuccessful)
                    }
                    runOnUiThread {
                        if (success) done(response) else showError(response.optString("message", "Request failed"))
                    }
                } catch (_: Exception) {
                    runOnUiThread { showError("Network request failed") }
                }
            }.start()
        }
    }

    private fun refresh() {
        val selected = mode
        request("GET", "/messages?mode=$selected") { body ->
            if (selected != mode) return@request
            val messages = body.optJSONArray("messages") ?: JSONArray()
            val lines = ArrayList<String>()
            for (index in 0 until messages.length()) {
                val message = messages.getJSONObject(index)
                lines.add("${message.optString("role")}: ${message.optString("content")}")
            }
            history.text = lines.joinToString("\n\n")
        }
    }

    private fun sendMessage() {
        val message = input.text.toString().trim()
        if (message.isEmpty()) return
        val selected = mode
        val payload = JSONObject().put("mode", selected).put("message", message)
        conversationIds[selected]?.let { payload.put("conversationId", it) }
        send.isEnabled = false
        request("POST", "/chat", payload) { response ->
            send.isEnabled = true
            if (selected == mode) {
                input.text.clear()
                conversationIds[selected] = response.getString("conversationId")
                refresh()
            }
        }
        // The request may fail before the callback. Keep the button available for retry.
        send.postDelayed({ send.isEnabled = true }, 35000)
    }

    private fun showMemory() {
        request("GET", "/facts") { response ->
            val facts = response.optJSONArray("facts") ?: JSONArray()
            val labels = ArrayList<String>()
            for (i in 0 until facts.length()) {
                val fact = facts.getJSONObject(i)
                labels.add("${fact.optString("subject")} ${fact.optString("predicate")} ${fact.optString("object")}")
            }
            AlertDialog.Builder(this)
                .setTitle("Personal memory")
                .setItems(labels.toTypedArray()) { _, index -> editFact(facts.getJSONObject(index)) }
                .setPositiveButton("Close", null)
                .show()
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
            .setNeutralButton("Cancel", null)
            .show()
    }

    private fun showError(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
        status.text = message
    }

    override fun onDestroy() {
        authService.dispose()
        super.onDestroy()
    }
}
