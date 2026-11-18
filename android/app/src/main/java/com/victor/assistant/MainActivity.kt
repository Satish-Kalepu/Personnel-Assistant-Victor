package com.victor.assistant

import android.app.AlertDialog
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.widget.*
import androidx.activity.ComponentActivity
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
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
    private lateinit var signInButton: Button
    private lateinit var chat: LinearLayout
    private lateinit var chatScroll: ScrollView
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
                    signInButton.visibility = View.GONE
                    status.text = "Signed in"
                    status.visibility = View.VISIBLE
                    refresh()
                } else showError(exchangeError?.errorDescription ?: "Token exchange failed")
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        authService = AuthorizationService(this)
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(color(R.color.victor_background))
        }
        ViewCompat.setOnApplyWindowInsetsListener(root) { view, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.ime())
            view.setPadding(dp(16) + bars.left, dp(12) + bars.top, dp(16) + bars.right, dp(12) + bars.bottom)
            insets
        }

        // Header: logo, name, tagline, sign-in
        val header = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }
        header.addView(ImageView(this).apply { setImageResource(R.drawable.ic_victor_logo) }, LinearLayout.LayoutParams(dp(48), dp(48)))
        val titles = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(12), 0, dp(8), 0)
        }
        titles.addView(TextView(this).apply {
            text = getString(R.string.app_title)
            textSize = 22f
            setTypeface(typeface, Typeface.BOLD)
            setTextColor(color(R.color.victor_text))
        })
        titles.addView(TextView(this).apply {
            text = getString(R.string.app_tagline)
            textSize = 13f
            setTextColor(color(R.color.victor_text_muted))
        })
        header.addView(titles, LinearLayout.LayoutParams(0, -2, 1f))
        signInButton = pillButton("Sign in", filled = true).apply { setOnClickListener {
            signIn()
        } }
        header.addView(signInButton)
        root.addView(header)

        status = TextView(this).apply {
            visibility = View.GONE
            textSize = 12f
            setTextColor(color(R.color.victor_primary_dark))
            background = rounded(color(R.color.victor_chip), dp(12).toFloat())
            setPadding(dp(10), dp(4), dp(10), dp(4))
        }
        root.addView(status, LinearLayout.LayoutParams(-2, -2).apply { topMargin = dp(12) })

        // Mode switch
        val modes = LinearLayout(this).apply {
            background = rounded(color(R.color.victor_surface), dp(24).toFloat(), color(R.color.victor_outline))
            setPadding(dp(4), dp(4), dp(4), dp(4))
        }
        personal = pillButton("Personal", filled = true).apply { setOnClickListener { chooseMode("personal") } }
        practice = pillButton("English Practice", filled = false).apply { setOnClickListener { chooseMode("practice") } }
        modes.addView(personal, LinearLayout.LayoutParams(0, -2, 1f))
        modes.addView(practice, LinearLayout.LayoutParams(0, -2, 1f))
        root.addView(modes, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(12) })

        // Secondary actions
        val actions = LinearLayout(this).apply { gravity = Gravity.END }
        memory = textButton("Memory").apply { setOnClickListener { showMemory() } }
        val newChat = textButton("New chat").apply {
            setOnClickListener {
                conversationIds.remove(mode)
                renderMessages(emptyList())
            }
        }
        actions.addView(memory)
        actions.addView(newChat)
        root.addView(actions, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(4) })

        // Conversation
        chatScroll = ScrollView(this).apply {
            background = rounded(color(R.color.victor_surface), dp(20).toFloat(), color(R.color.victor_outline))
            setPadding(dp(12), dp(12), dp(12), dp(12))
            clipToPadding = false
        }
        chat = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        chatScroll.addView(chat)
        root.addView(chatScroll, LinearLayout.LayoutParams(-1, 0, 1f).apply { topMargin = dp(4) })

        // Composer
        val composer = LinearLayout(this).apply { gravity = Gravity.CENTER_VERTICAL }
        input = EditText(this).apply {
            hint = "Message Victor"
            minLines = 1
            maxLines = 4
            textSize = 15f
            setTextColor(color(R.color.victor_text))
            background = rounded(color(R.color.victor_surface), dp(24).toFloat(), color(R.color.victor_outline))
            setPadding(dp(16), dp(10), dp(16), dp(10))
        }
        composer.addView(input, LinearLayout.LayoutParams(0, -2, 1f))
        send = pillButton("Send", filled = true).apply { setOnClickListener { sendMessage() } }
        composer.addView(send, LinearLayout.LayoutParams(-2, -2).apply { marginStart = dp(8) })
        root.addView(composer, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(12) })

        setContentView(root)
        chooseMode("personal")
    }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

    private fun color(id: Int): Int = getColor(id)

    private fun rounded(fill: Int, radius: Float, stroke: Int? = null) = GradientDrawable().apply {
        setColor(fill)
        cornerRadius = radius
        if (stroke != null) setStroke(dp(1), stroke)
    }

    private fun pillButton(label: String, filled: Boolean) = Button(this).apply {
        text = label
        isAllCaps = false
        textSize = 14f
        stateListAnimator = null
        minHeight = dp(40)
        minimumHeight = dp(40)
        setPadding(dp(16), 0, dp(16), 0)
        stylePill(this, filled)
    }

    private fun stylePill(button: Button, filled: Boolean) {
        button.background = rounded(
            if (filled) color(R.color.victor_primary) else 0x00000000,
            dp(20).toFloat()
        )
        button.setTextColor(if (filled) color(R.color.victor_surface) else color(R.color.victor_primary_dark))
    }

    private fun textButton(label: String) = Button(this).apply {
        text = label
        isAllCaps = false
        textSize = 14f
        stateListAnimator = null
        background = null
        setTextColor(color(R.color.victor_primary))
    }

    private fun renderMessages(messages: List<Pair<String, String>>) {
        chat.removeAllViews()
        if (messages.isEmpty()) {
            chat.addView(TextView(this).apply {
                text = if (mode == "practice") "Practice your English with Victor.\nSend a message to begin." else "Hi, I'm Victor.\nAsk me anything to get started."
                gravity = Gravity.CENTER
                textSize = 15f
                setTextColor(color(R.color.victor_text_muted))
                setPadding(dp(16), dp(48), dp(16), dp(48))
            }, LinearLayout.LayoutParams(-1, -2))
            return
        }
        val maxBubble = (resources.displayMetrics.widthPixels * 0.78).toInt()
        for ((role, content) in messages) {
            val mine = role == "user"
            val bubble = TextView(this).apply {
                text = content
                textSize = 15f
                maxWidth = maxBubble
                setTextIsSelectable(true)
                setLineSpacing(0f, 1.15f)
                setPadding(dp(14), dp(10), dp(14), dp(10))
                setTextColor(if (mine) color(R.color.victor_surface) else color(R.color.victor_text))
                background = rounded(if (mine) color(R.color.victor_primary) else color(R.color.victor_chip), dp(18).toFloat())
            }
            chat.addView(bubble, LinearLayout.LayoutParams(-2, -2).apply {
                gravity = if (mine) Gravity.END else Gravity.START
                topMargin = dp(8)
            })
        }
        chatScroll.post { chatScroll.fullScroll(View.FOCUS_DOWN) }
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
        stylePill(personal, selected == "personal")
        stylePill(practice, selected == "practice")
        memory.visibility = if (selected == "personal") View.VISIBLE else View.GONE
        renderMessages(emptyList())
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
            val items = ArrayList<Pair<String, String>>()
            for (index in 0 until messages.length()) {
                val message = messages.getJSONObject(index)
                items.add(message.optString("role") to message.optString("content"))
            }
            renderMessages(items)
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
        status.visibility = View.VISIBLE
    }

    override fun onDestroy() {
        authService.dispose()
        super.onDestroy()
    }
}
