package com.victor.assistant

import android.app.AlertDialog
import android.app.Dialog
import android.content.Context
import android.content.res.ColorStateList
import android.graphics.Typeface
import android.animation.ValueAnimator
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.view.MotionEvent
import android.view.Gravity
import android.os.Bundle
import android.Manifest
import android.content.pm.PackageManager
import android.view.View
import android.view.WindowManager
import android.net.Uri
import java.util.UUID
import android.widget.*
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge
import androidx.core.view.WindowCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
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
    private lateinit var chat: LinearLayout
    private lateinit var chatScroll: ScrollView
    private lateinit var accountButton: Button
    private val shownMessages = mutableListOf<Pair<String, String>>()
    private lateinit var input: EditText
    private lateinit var send: Button
    private lateinit var practice: Button
    private lateinit var personal: Button
    private var voice: VoiceConnection? = null
    private var voiceGeneration = 0
    private lateinit var holdTalk: Button
    private lateinit var liveButton: Button
    private var voiceKind: String? = null          // "live" | "push-to-talk" while a session is open
    private var pendingVoiceKind = "live"
    private var holding = false
    private lateinit var liveOverlay: FrameLayout
    private lateinit var liveState: TextView
    private lateinit var liveHint: TextView
    private lateinit var liveTranscript: TextView
    private lateinit var liveMute: Button
    private lateinit var liveRing: View
    private var livePulse: ValueAnimator? = null
    private val liveBack = object : OnBackPressedCallback(false) {
        override fun handleOnBackPressed() { stopVoice() }
    }
    private lateinit var voiceTranscript: TextView
    private var repliesMuted = false
    private lateinit var olderMessages: Button
    private var messageCursor: String? = null
    private val microphonePermission = registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        when {
            !granted -> showError("Allow microphone access to use voice.")
            pendingVoiceKind == "live" -> startVoice("live")
            else -> Toast.makeText(this, "Microphone allowed. Press and speak again.", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Screenshots/screen recording are blocked in release builds for privacy; allowed in debug builds for testing.
        if (!BuildConfig.DEBUG) window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
        sessionStore = SessionStore(this)
        sessionToken = sessionStore.load()
        account = NativeAccount(this, http, sessionStore) { token -> resetSession(token) }
        enableEdgeToEdge()
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(color(R.color.victor_background))
        }
        ViewCompat.setOnApplyWindowInsetsListener(root) { view, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.ime())
            view.setPadding(dp(16) + bars.left, dp(12) + bars.top, dp(16) + bars.right, dp(12) + bars.bottom)
            insets
        }

        // Header: logo, name, tagline, account
        val header = LinearLayout(this).apply { gravity = Gravity.CENTER_VERTICAL }
        header.addView(ImageView(this).apply { setImageResource(R.drawable.ic_victor_logo) }, LinearLayout.LayoutParams(dp(44), dp(44)))
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
            textSize = 12f
            setTextColor(color(R.color.victor_text_muted))
        })
        header.addView(titles, LinearLayout.LayoutParams(0, -2, 1f))
        accountButton = pillButton("Sign in", filled = true).apply { setOnClickListener { signIn() } }
        header.addView(accountButton)
        root.addView(header)

        status = TextView(this).apply {
            visibility = View.GONE
            textSize = 12f
            setTextColor(color(R.color.victor_primary_dark))
            background = rounded(color(R.color.victor_chip), dp(12).toFloat())
            setPadding(dp(10), dp(4), dp(10), dp(4))
        }
        root.addView(status, LinearLayout.LayoutParams(-2, -2).apply { topMargin = dp(10) })

        // Mode switch + conversation actions (like the web workspace bar)
        val modeRow = LinearLayout(this).apply { gravity = Gravity.CENTER_VERTICAL }
        val modes = LinearLayout(this).apply {
            background = rounded(color(R.color.victor_surface), dp(24).toFloat(), color(R.color.victor_outline))
            setPadding(dp(4), dp(4), dp(4), dp(4))
        }
        personal = pillButton("Personal", filled = true, dimWhenDisabled = false).apply { setOnClickListener { chooseMode("personal") } }
        practice = pillButton("English Practice", filled = false, dimWhenDisabled = false).apply { setOnClickListener { chooseMode("practice") } }
        // Two pills + two icon buttons must fit narrow phones: one line, text shrinks to fit.
        listOf(personal, practice).forEach {
            it.maxLines = 1
            it.setPadding(dp(8), 0, dp(8), 0)
            it.setAutoSizeTextTypeUniformWithConfiguration(11, 14, 1, android.util.TypedValue.COMPLEX_UNIT_SP)
        }
        modes.addView(personal, LinearLayout.LayoutParams(0, -2, 1f))
        modes.addView(practice, LinearLayout.LayoutParams(0, -2, 1.25f))
        modeRow.addView(modes, LinearLayout.LayoutParams(0, -2, 1f))
        modeRow.addView(iconButton(R.drawable.ic_list, "Conversations") { showConversations() },
            LinearLayout.LayoutParams(dp(46), dp(46)).apply { marginStart = dp(8) })
        modeRow.addView(iconButton(R.drawable.ic_add, "New chat") { startNewChat() },
            LinearLayout.LayoutParams(dp(46), dp(46)).apply { marginStart = dp(6) })
        root.addView(modeRow, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(12) })

        // Conversation card
        val chatCard = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = rounded(color(R.color.victor_surface), dp(20).toFloat(), color(R.color.victor_outline))
        }
        olderMessages = textButton("Earlier messages").apply { visibility = View.GONE; setOnClickListener { refresh(messageCursor, true) } }
        chatCard.addView(olderMessages, LinearLayout.LayoutParams(-2, -2).apply { gravity = Gravity.CENTER_HORIZONTAL })
        chatScroll = ScrollView(this).apply {
            setPadding(dp(12), dp(4), dp(12), dp(12))
            clipToPadding = false
        }
        chat = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        chatScroll.addView(chat)
        chatCard.addView(chatScroll, LinearLayout.LayoutParams(-1, 0, 1f))
        root.addView(chatCard, LinearLayout.LayoutParams(-1, 0, 1f).apply { topMargin = dp(10) })

        // Voice: Press and speak + Live mode (status, mute and stop-speaking live in the Live mode screen)
        buildLiveOverlay()
        val voiceActions = LinearLayout(this).apply { gravity = Gravity.CENTER_VERTICAL }
        holdTalk = pillButton("Press and speak", filled = true).apply {
            minHeight = dp(46); minimumHeight = dp(46)
            setCompoundDrawablesRelativeWithIntrinsicBounds(R.drawable.ic_mic, 0, 0, 0)
            compoundDrawableTintList = ColorStateList.valueOf(color(R.color.victor_surface))
            compoundDrawablePadding = dp(8)
            setPadding(dp(18), 0, dp(20), 0)
            contentDescription = "Press and speak. Release to send."
            // Hold = record, release = send, finger slides off / gesture cancelled = discard.
            setOnTouchListener { view, event ->
                when (event.actionMasked) {
                    MotionEvent.ACTION_DOWN -> { view.isPressed = true; holding = true; startVoice("push-to-talk") }
                    MotionEvent.ACTION_UP -> { view.isPressed = false; if (holding) { holding = false; releaseTalk() } }
                    MotionEvent.ACTION_CANCEL -> { view.isPressed = false; if (holding) { holding = false; stopVoice() } }
                }
                true
            }
            // Accessibility (TalkBack double-tap has no touch events): first activation starts, second sends.
            setOnClickListener { if (voiceKind == "push-to-talk" && voice != null) releaseTalk() else startVoice("push-to-talk") }
        }
        liveButton = pillButton("Live mode", filled = false).apply {
            minHeight = dp(46); minimumHeight = dp(46)
            background = rounded(color(R.color.victor_chip), dp(20).toFloat())
            val dot = GradientDrawable().apply { shape = GradientDrawable.OVAL; setColor(color(R.color.victor_primary)); setSize(dp(9), dp(9)) }
            setCompoundDrawablesRelativeWithIntrinsicBounds(dot, null, null, null)
            compoundDrawablePadding = dp(10)
            setPadding(dp(18), 0, dp(20), 0)
            setOnClickListener { if (voiceKind == "live") stopVoice() else startVoice("live") }
        }
        // Equal halves (1:1), so the row doesn't jump as the button text changes.
        voiceActions.addView(holdTalk, LinearLayout.LayoutParams(0, -2, 1f))
        voiceActions.addView(liveButton, LinearLayout.LayoutParams(0, -2, 1f).apply { marginStart = dp(10) })
        listOf(holdTalk, liveButton).forEach {
            it.gravity = Gravity.CENTER
            it.maxLines = 1
            it.setAutoSizeTextTypeUniformWithConfiguration(11, 15, 1, android.util.TypedValue.COMPLEX_UNIT_SP)
        }
        root.addView(voiceActions, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(10) })
        voiceTranscript = TextView(this).apply {
            textSize = 14f
            visibility = View.GONE
            setTypeface(typeface, Typeface.ITALIC)
            setTextColor(color(R.color.victor_text_muted))
            setPadding(dp(4), dp(6), dp(4), 0)
        }
        root.addView(voiceTranscript)

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
        root.addView(composer, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(10) })

        val screen = FrameLayout(this)
        screen.addView(root, FrameLayout.LayoutParams(-1, -1))
        screen.addView(liveOverlay, FrameLayout.LayoutParams(-1, -1))
        setContentView(screen)
        onBackPressedDispatcher.addCallback(this, liveBack)
        updateAccountUi(sessionToken != null)
        chooseMode("personal")
    }

    private fun signIn() {
        if (BuildConfig.API_URL.isBlank()) { showError("Set API_URL in android/victor.properties"); return }
        // Memory lives in the account menu, like the web profile menu.
        account.show(if (mode == "personal") listOf("Memory" to { showMemory() }) else emptyList())
    }

    private fun resetSession(token: String?) {
        sessionGeneration++
        sessionToken = token
        stopVoice()
        conversationIds.clear()
        clearChat()
        input.text.clear()
        voiceTranscript.text = ""
        updateAccountUi(token != null)
        if (token != null) refresh()
    }

    private fun chooseMode(selected: String) {
        stopVoice()
        voiceTranscript.text = ""
        mode = selected
        personal.isEnabled = selected != "personal"
        practice.isEnabled = selected != "practice"
        stylePill(personal, selected == "personal")
        stylePill(practice, selected == "practice")
        clearChat()
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
            val items = (0 until messages.length()).map { index ->
                val message = messages.getJSONObject(index)
                message.optString("role") to message.optString("content")
            }
            if (append) shownMessages.addAll(0, items) else { shownMessages.clear(); shownMessages.addAll(items) }
            renderMessages(scrollToEnd = !append)
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

    private fun startNewChat() {
        conversationIds.remove(mode)
        stopVoice()
        clearChat()
        messageCursor = null
        olderMessages.visibility = View.GONE
    }

    private fun formatDate(iso: String): String = try {
        java.time.format.DateTimeFormatter.ofPattern("d MMM yyyy, h:mm a").withZone(java.time.ZoneId.systemDefault())
            .format(java.time.Instant.parse(iso))
    } catch (_: Exception) { iso }

    /** Standard Android touch ripple over [content]; the rounded shape also masks the ripple. */
    private fun ripple(content: GradientDrawable) = android.graphics.drawable.RippleDrawable(
        ColorStateList.valueOf(0x334F46E5), content, GradientDrawable().apply { setColor(Color.WHITE); cornerRadius = content.cornerRadius })

    private fun iconButton(icon: Int, description: String, tint: Int = color(R.color.victor_primary_dark),
                           fill: Int = color(R.color.victor_chip), onClick: () -> Unit) = ImageButton(this).apply {
        setImageResource(icon)
        imageTintList = ColorStateList.valueOf(tint)
        background = ripple(rounded(fill, dp(14).toFloat()))
        contentDescription = description
        tooltipText = description
        setOnClickListener { onClick() }
    }

    /** Conversation list with per-item delete, shown as an Android bottom sheet. */
    private fun showConversations() {
        val selected = mode
        val dialog = Dialog(this)
        val sheetRadius = dp(28).toFloat()
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(16), dp(8), dp(16), dp(12))
            background = GradientDrawable().apply {
                setColor(color(R.color.victor_surface))
                cornerRadii = floatArrayOf(sheetRadius, sheetRadius, sheetRadius, sheetRadius, 0f, 0f, 0f, 0f)
            }
        }
        // Drag handle + title + close; dragging this area down dismisses the sheet.
        val top = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        top.addView(View(this).apply { background = rounded(color(R.color.victor_outline), dp(3).toFloat()) },
            LinearLayout.LayoutParams(dp(36), dp(5)).apply { gravity = Gravity.CENTER_HORIZONTAL; bottomMargin = dp(10) })
        val header = LinearLayout(this).apply { gravity = Gravity.CENTER_VERTICAL }
        val titles = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(4), 0, dp(8), 0) }
        titles.addView(TextView(this).apply {
            text = "Conversations"
            textSize = 20f
            setTypeface(typeface, Typeface.BOLD)
            setTextColor(color(R.color.victor_text))
        })
        titles.addView(TextView(this).apply {
            text = if (selected == "practice") "English Practice" else "Personal"
            textSize = 13f
            setTextColor(color(R.color.victor_text_muted))
        })
        header.addView(titles, LinearLayout.LayoutParams(0, -2, 1f))
        header.addView(iconButton(R.drawable.ic_close, "Close", fill = 0x00000000) { dialog.dismiss() }, LinearLayout.LayoutParams(dp(44), dp(44)))
        top.addView(header)
        root.addView(top)
        var dragStart = 0f
        top.setOnTouchListener { _, event ->
            when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> dragStart = event.rawY
                MotionEvent.ACTION_MOVE -> root.translationY = (event.rawY - dragStart).coerceAtLeast(0f)
                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL ->
                    if (root.translationY > dp(120)) dialog.dismiss()
                    else root.animate().translationY(0f).setDuration(150).start()
            }
            true
        }

        val list = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        val empty = TextView(this).apply {
            text = "No conversations yet."
            gravity = Gravity.CENTER
            textSize = 14f
            visibility = View.GONE
            setTextColor(color(R.color.victor_text_muted))
            setPadding(0, dp(32), 0, dp(32))
        }
        val more = textButton("Load more").apply { visibility = View.GONE }
        val content = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        content.addView(list); content.addView(empty)
        content.addView(more, LinearLayout.LayoutParams(-2, -2).apply { gravity = Gravity.CENTER_HORIZONTAL })
        root.addView(ScrollView(this).apply { addView(content) }, LinearLayout.LayoutParams(-1, 0, 1f).apply { topMargin = dp(10) })

        fun addRow(row: JSONObject) {
            val id = row.getString("id")
            val date = formatDate(row.optString("createdAt"))
            val current = conversationIds[selected] == id
            val line = LinearLayout(this).apply { gravity = Gravity.CENTER_VERTICAL }
            line.addView(TextView(this).apply {
                text = if (current) "$date  · current" else date
                textSize = 15f
                setTextColor(color(R.color.victor_primary_dark))
                if (current) setTypeface(typeface, Typeface.BOLD)
                background = ripple(rounded(color(if (current) R.color.victor_outline else R.color.victor_chip), dp(14).toFloat()))
                setPadding(dp(16), dp(14), dp(16), dp(14))
                isClickable = true
                isFocusable = true
                setOnClickListener {
                    dialog.dismiss()
                    stopVoice(); conversationIds[selected] = id; messageCursor = null; refresh()
                }
            }, LinearLayout.LayoutParams(0, -2, 1f))
            line.addView(iconButton(R.drawable.ic_delete, "Delete conversation from $date",
                tint = color(R.color.victor_danger), fill = 0x1FDC2626) {
                AlertDialog.Builder(this).setTitle("Delete conversation?")
                    .setMessage("This permanently deletes the conversation from $date and its derived memory.")
                    .setNegativeButton("Cancel", null).setPositiveButton("Delete") { _, _ ->
                        request("DELETE", "/conversations/$id?mode=$selected") {
                            list.removeView(line)
                            if (conversationIds[selected] == id) {
                                conversationIds.remove(selected)
                                if (mode == selected) { stopVoice(); clearChat() }
                            }
                            if (list.childCount == 0 && more.visibility == View.GONE) empty.visibility = View.VISIBLE
                        }
                    }.show()
            }, LinearLayout.LayoutParams(dp(48), dp(48)).apply { marginStart = dp(8) })
            list.addView(line, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(8) })
        }

        fun load(cursor: String?) {
            more.isEnabled = false
            request("GET", "/conversations?mode=$selected" + (cursor?.let { "&cursor=$it" } ?: ""), failed = { more.isEnabled = true }) { response ->
                if (!dialog.isShowing || selected != mode) return@request
                val rows = response.optJSONArray("conversations") ?: JSONArray()
                for (index in 0 until rows.length()) addRow(rows.getJSONObject(index))
                val next = response.optString("nextCursor").takeUnless { it.isBlank() || it == "null" }
                more.isEnabled = true
                more.visibility = if (next == null) View.GONE else View.VISIBLE
                more.setOnClickListener { load(next) }
                empty.visibility = if (list.childCount == 0 && next == null) View.VISIBLE else View.GONE
            }
        }

        dialog.requestWindowFeature(android.view.Window.FEATURE_NO_TITLE)
        dialog.setContentView(root)
        dialog.setCanceledOnTouchOutside(true)
        dialog.window?.apply {
            if (!BuildConfig.DEBUG) addFlags(WindowManager.LayoutParams.FLAG_SECURE)
            setBackgroundDrawable(android.graphics.drawable.ColorDrawable(Color.TRANSPARENT))
            setGravity(Gravity.BOTTOM)
            setWindowAnimations(R.style.VictorSheetAnimation)
            addFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND)
            setDimAmount(0.4f)
            decorView.setPadding(0, 0, 0, 0) // full-width sheet, no dialog insets
            setLayout(WindowManager.LayoutParams.MATCH_PARENT, (resources.displayMetrics.heightPixels * 0.7).toInt())
        }
        dialog.show()
        load(null)
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
        status.visibility = View.VISIBLE
    }

    private fun startVoice(kind: String) {
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            pendingVoiceKind = kind
            holding = false
            microphonePermission.launch(Manifest.permission.RECORD_AUDIO); return
        }
        stopVoice()
        voiceKind = kind
        voiceTranscript.text = ""
        voiceTranscript.visibility = View.GONE
        liveTranscript.text = ""
        if (kind == "live") showLive(true)
        updateVoiceUi("connecting")
        val generation = voiceGeneration
        val selected = mode
        request("GET", "/voice/config", failed = { if (generation == voiceGeneration) stopVoice() }) { config ->
            if (generation != voiceGeneration || selected != mode || !lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED)) return@request
            val url = config.optString("gatewayUrl")
            val endpoint = Uri.parse(url)
            val base = Uri.parse(BuildConfig.API_URL)
            val expectedScheme = if (base.scheme == "https") "wss" else if (BuildConfig.DEBUG) "ws" else "wss"
            if (endpoint.scheme != expectedScheme || endpoint.authority != base.authority || endpoint.path != "/voice" || endpoint.query != null || endpoint.fragment != null) {
                stopVoice(); showError("Voice is not enabled yet. Text chat is available."); return@request
            }
            withToken { token ->
                if (generation != voiceGeneration || selected != mode || !lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED)) return@withToken
                voice = VoiceConnection(this, http, url, token, selected, conversationIds[selected], kind,
                    onState = stateChanged@{ state ->
                        if (generation != voiceGeneration) return@stateChanged
                        if (state == "idle") { voice = null; voiceKind = null; showLive(false) }
                        updateVoiceUi(state)
                    },
                    onTranscript = { text ->
                        if (generation == voiceGeneration && selected == mode) {
                            liveTranscript.text = text
                            voiceTranscript.text = text
                            voiceTranscript.visibility = if (voiceKind == "push-to-talk" && text.isNotBlank()) View.VISIBLE else View.GONE
                        }
                    },
                    onReply = { response ->
                        if (generation == voiceGeneration && selected == mode) { conversationIds[selected] = response.getString("conversationId"); refresh() }
                    },
                    onError = { message -> if (generation == voiceGeneration) showError(message) },
                ).also { it.start(repliesMuted) }
            }
        }
    }

    /** Push-to-talk release: send the turn, or cancel clearly if the microphone never started. */
    private fun releaseTalk() {
        if (voiceKind != "push-to-talk") return
        val session = voice
        if (session == null) {
            stopVoice()
            showError("Microphone was not ready yet. Hold again and wait for Listening before speaking.")
        } else session.finishInput()
    }

    private fun stopVoice() {
        voiceGeneration++
        voice?.stop(); voice = null
        voiceKind = null
        if (this::liveOverlay.isInitialized) showLive(false)
        if (this::holdTalk.isInitialized) updateVoiceUi("idle")
    }

    private fun updateVoiceUi(state: String) {
        val kind = voiceKind
        val active = state != "idle"
        val label = when (state) {
            "connecting" -> "Connecting…"; "listening" -> "Listening…"
            "thinking" -> "Thinking…"; "speaking" -> "Speaking…"; else -> "Voice off"
        }
        holdTalk.text = when {
            kind == "push-to-talk" && state == "listening" -> "Release to send"
            kind == "push-to-talk" && active -> label
            else -> "Press and speak"
        }
        if (!active) voiceTranscript.visibility = View.GONE
        holdTalk.isEnabled = !active || kind == "push-to-talk"
        liveButton.text = if (kind == "live") "Exit live mode" else "Live mode"
        liveButton.isEnabled = !active || kind == "live"
        liveState.text = label
        liveHint.text = when (state) {
            "listening" -> "Speak naturally. Interrupt Victor any time by speaking."
            "thinking" -> "Victor is thinking…"
            "speaking" -> "Victor is speaking. Just talk to interrupt."
            "connecting" -> "Starting a private voice session…"
            else -> ""
        }
        livePulse?.duration = when (state) { "speaking" -> 900L; "thinking" -> 2400L; else -> 1600L }
    }

    private fun showLive(on: Boolean) {
        if ((liveOverlay.visibility == View.VISIBLE) == on) return
        liveOverlay.visibility = if (on) View.VISIBLE else View.GONE
        liveBack.isEnabled = on
        // Like the web client's inert shell: hide the chat underneath from TalkBack while live.
        (liveOverlay.parent as? android.view.ViewGroup)?.getChildAt(0)?.importantForAccessibility =
            if (on) View.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS else View.IMPORTANT_FOR_ACCESSIBILITY_AUTO
        WindowCompat.getInsetsController(window, window.decorView).apply {
            isAppearanceLightStatusBars = !on
            isAppearanceLightNavigationBars = !on
        }
        if (on) {
            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            livePulse?.start()
        } else {
            window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            livePulse?.cancel()
            liveRing.scaleX = 1f; liveRing.scaleY = 1f; liveRing.alpha = 0f
            if (this::liveButton.isInitialized) liveButton.requestFocus()
        }
    }

    /** Full-screen dark teal/navy live view, matching the web client's live zone. */
    private fun buildLiveOverlay() {
        val teal = Color.parseColor("#5EEAD4")
        liveOverlay = FrameLayout(this).apply {
            visibility = View.GONE
            isClickable = true // swallow touches meant for the chat underneath
            background = GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,
                intArrayOf(Color.parseColor("#0B1324"), Color.parseColor("#0F2A3D"), Color.parseColor("#134E4A")))
        }
        val content = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
        }
        ViewCompat.setOnApplyWindowInsetsListener(content) { view, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.setPadding(dp(20) + bars.left, dp(16) + bars.top, dp(20) + bars.right, dp(20) + bars.bottom)
            insets
        }
        // LIVE badge
        val badge = LinearLayout(this).apply {
            gravity = Gravity.CENTER_VERTICAL
            background = rounded(Color.parseColor("#33FFFFFF"), dp(14).toFloat())
            setPadding(dp(10), dp(4), dp(12), dp(4))
        }
        badge.addView(View(this).apply { background = rounded(Color.parseColor("#F43F5E"), dp(4).toFloat()) }, LinearLayout.LayoutParams(dp(8), dp(8)))
        badge.addView(TextView(this).apply {
            text = "LIVE"
            textSize = 12f
            letterSpacing = 0.15f
            setTypeface(typeface, Typeface.BOLD)
            setTextColor(Color.WHITE)
            setPadding(dp(6), 0, 0, 0)
        })
        content.addView(badge, LinearLayout.LayoutParams(-2, -2).apply { gravity = Gravity.START })
        content.addView(View(this), LinearLayout.LayoutParams(1, 0, 1f))
        // Pulsing orb
        val orb = FrameLayout(this)
        liveRing = View(this).apply {
            background = GradientDrawable().apply { shape = GradientDrawable.OVAL; setStroke(dp(3), teal) }
            alpha = 0f
        }
        orb.addView(liveRing, FrameLayout.LayoutParams(dp(150), dp(150), Gravity.CENTER))
        orb.addView(View(this).apply {
            background = GradientDrawable().apply { shape = GradientDrawable.OVAL; setColor(Color.parseColor("#1A5EEAD4")) }
        }, FrameLayout.LayoutParams(dp(150), dp(150), Gravity.CENTER))
        orb.addView(ImageView(this).apply { setImageResource(R.drawable.ic_victor_logo) }, FrameLayout.LayoutParams(dp(96), dp(96), Gravity.CENTER))
        content.addView(orb, LinearLayout.LayoutParams(dp(220), dp(220)))
        livePulse = ValueAnimator.ofFloat(0f, 1f).apply {
            duration = 1600L
            repeatCount = ValueAnimator.INFINITE
            addUpdateListener {
                val v = it.animatedValue as Float
                liveRing.scaleX = 1f + 0.35f * v; liveRing.scaleY = 1f + 0.35f * v
                liveRing.alpha = 0.8f * (1f - v)
            }
        }
        liveState = TextView(this).apply {
            textSize = 28f
            gravity = Gravity.CENTER
            setTypeface(typeface, Typeface.BOLD)
            setTextColor(Color.WHITE)
        }
        content.addView(liveState, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(12) })
        liveHint = TextView(this).apply {
            textSize = 14f
            gravity = Gravity.CENTER
            setTextColor(teal)
        }
        content.addView(liveHint, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(6) })
        liveTranscript = TextView(this).apply {
            textSize = 17f
            gravity = Gravity.CENTER
            maxLines = 4
            setTypeface(typeface, Typeface.ITALIC)
            setTextColor(Color.parseColor("#E2E8F0"))
        }
        content.addView(liveTranscript, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(20) })
        content.addView(View(this), LinearLayout.LayoutParams(1, 0, 1f))
        // Controls
        fun ghost(label: String) = Button(this).apply {
            text = label
            isAllCaps = false
            textSize = 14f
            stateListAnimator = null
            setTextColor(Color.WHITE)
            background = rounded(Color.parseColor("#1AFFFFFF"), dp(22).toFloat(), Color.parseColor("#4DFFFFFF"))
        }
        val controls = LinearLayout(this)
        liveMute = ghost("Mute replies").apply {
            setOnClickListener {
                repliesMuted = !repliesMuted
                voice?.muteReplies(repliesMuted)
                text = if (repliesMuted) "Unmute replies" else "Mute replies"
            }
        }
        controls.addView(liveMute, LinearLayout.LayoutParams(0, dp(46), 1f))
        controls.addView(ghost("Stop speaking").apply { setOnClickListener { voice?.interrupt() } },
            LinearLayout.LayoutParams(0, dp(46), 1f).apply { marginStart = dp(10) })
        content.addView(controls, LinearLayout.LayoutParams(-1, -2))
        content.addView(Button(this).apply {
            text = "Exit live mode"
            isAllCaps = false
            textSize = 16f
            stateListAnimator = null
            setTypeface(typeface, Typeface.BOLD)
            setTextColor(Color.parseColor("#0B1324"))
            background = rounded(teal, dp(26).toFloat())
            setOnClickListener { stopVoice() }
        }, LinearLayout.LayoutParams(-1, dp(52)).apply { topMargin = dp(12) })
        liveOverlay.addView(content, FrameLayout.LayoutParams(-1, -1))
    }

    private fun updateAccountUi(signedIn: Boolean) {
        accountButton.text = if (signedIn) "Account" else "Sign in"
        stylePill(accountButton, filled = !signedIn)
        if (!signedIn) accountButton.background = rounded(color(R.color.victor_primary), dp(20).toFloat())
        else accountButton.background = rounded(color(R.color.victor_surface), dp(20).toFloat(), color(R.color.victor_outline))
        status.text = if (signedIn) "Signed in" else ""
        status.visibility = if (signedIn) View.VISIBLE else View.GONE
    }

    private fun clearChat() {
        shownMessages.clear()
        renderMessages()
    }

    private fun renderMessages(scrollToEnd: Boolean = true) {
        chat.removeAllViews()
        if (shownMessages.isEmpty()) {
            chat.addView(TextView(this).apply {
                text = when {
                    sessionToken == null -> "Sign in to start chatting with Victor."
                    mode == "practice" -> "Practice your English with Victor.\nType or start voice to begin."
                    else -> "Hi, I'm Victor.\nAsk me anything, by text or voice."
                }
                gravity = Gravity.CENTER
                textSize = 15f
                setTextColor(color(R.color.victor_text_muted))
                setPadding(dp(16), dp(40), dp(16), dp(40))
            }, LinearLayout.LayoutParams(-1, -2))
            return
        }
        val maxBubble = (resources.displayMetrics.widthPixels * 0.78).toInt()
        for ((role, content) in shownMessages) {
            val mine = role == "user"
            chat.addView(TextView(this).apply {
                text = content
                textSize = 15f
                maxWidth = maxBubble
                setTextIsSelectable(true)
                setLineSpacing(0f, 1.15f)
                setPadding(dp(14), dp(10), dp(14), dp(10))
                setTextColor(if (mine) color(R.color.victor_surface) else color(R.color.victor_text))
                background = rounded(if (mine) color(R.color.victor_primary) else color(R.color.victor_chip), dp(18).toFloat())
            }, LinearLayout.LayoutParams(-2, -2).apply {
                gravity = if (mine) Gravity.END else Gravity.START
                topMargin = dp(8)
            })
        }
        chatScroll.post { chatScroll.fullScroll(if (scrollToEnd) View.FOCUS_DOWN else View.FOCUS_UP) }
    }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

    private fun color(id: Int): Int = getColor(id)

    private fun rounded(fill: Int, radius: Float, stroke: Int? = null) = GradientDrawable().apply {
        setColor(fill)
        cornerRadius = radius
        if (stroke != null) setStroke(dp(1), stroke)
    }

    private fun pillButton(label: String, filled: Boolean, dimWhenDisabled: Boolean = true): Button =
        (if (dimWhenDisabled) DimmingButton(this) else Button(this)).apply {
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
        button.background = rounded(if (filled) color(R.color.victor_primary) else 0x00000000, dp(20).toFloat())
        button.setTextColor(if (filled) color(R.color.victor_surface) else color(R.color.victor_primary_dark))
    }

    private fun textButton(label: String): Button = DimmingButton(this).apply {
        text = label
        isAllCaps = false
        textSize = 14f
        stateListAnimator = null
        background = null
        minWidth = 0
        minimumWidth = 0
        setPadding(dp(10), 0, dp(10), 0)
        setTextColor(color(R.color.victor_primary))
    }

    /** Fades out when disabled, since the custom rounded backgrounds have no disabled state of their own. */
    private class DimmingButton(context: Context) : Button(context) {
        override fun setEnabled(enabled: Boolean) {
            super.setEnabled(enabled)
            alpha = if (enabled) 1f else 0.4f
        }
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
