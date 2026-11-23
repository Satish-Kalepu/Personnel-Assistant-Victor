package com.victor.assistant

import android.app.Dialog
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.text.InputFilter
import android.text.method.PasswordTransformationMethod
import android.util.Patterns
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.ImageButton
import android.widget.ImageView
import androidx.core.widget.doAfterTextChanged
import android.text.InputType
import android.util.Log
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import androidx.activity.ComponentActivity
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

class NativeAccount(
    private val activity: ComponentActivity,
    private val http: OkHttpClient,
    private val store: SessionStore,
    private val changed: (String?) -> Unit,
) {
    private var requestGeneration = 0
    private fun error(text: String) { Toast.makeText(activity, text, Toast.LENGTH_LONG).show() }
    private fun call(path: String, body: JSONObject, signed: Boolean = false, failed: ((String) -> Unit)? = null, done: (JSONObject) -> Unit) {
        val generation = ++requestGeneration
        val token = store.load()
        Thread {
            try {
                val builder = Request.Builder().url(BuildConfig.API_URL.trimEnd('/') + path)
                    .header("X-Victor-Client", "android").header("Accept", "application/json")
                    .post(body.toString().toRequestBody("application/json".toMediaType()))
                if (signed && token != null) builder.header("Authorization", "Bearer $token")
                val request = builder.build()
                logRequest(request.method, request.url.toString(), body, signed && token != null)
                val started = System.nanoTime()
                val result = http.newCall(request).execute().use { response ->
                    val raw = response.body?.string().orEmpty()
                    val tookMs = (System.nanoTime() - started) / 1_000_000
                    logResponse(path, response.code, tookMs, raw, response.header("set-auth-token") != null)
                    Triple(response.code, JSONObject(raw.ifBlank { "{}" }), response.header("set-auth-token"))
                }
                activity.runOnUiThread {
                    if (generation != requestGeneration || activity.isFinishing || activity.isDestroyed || (signed && store.load() != token)) return@runOnUiThread
                    if (result.first in 200..299) {
                        result.third?.let { store.save(it); changed(it) }
                        done(result.second)
                    } else {
                        if (result.first == 401 && signed) { store.clear(); changed(null) }
                        val message = result.second.optString("message", "Account request failed")
                        if (failed != null) failed(message) else error(message)
                    }
                }
            } catch (e: Exception) {
                if (BuildConfig.DEBUG) Log.e(TAG, "✖ POST $path failed: ${e.javaClass.simpleName}: ${e.message}", e)
                activity.runOnUiThread {
                    val message = "Couldn't reach Victor. Check your connection and try again."
                    if (failed != null) failed(message) else error(message)
                }
            }
        }.start()
    }
    // Debug-only network logging. Filter Logcat by tag "VictorAccount".
    // Passwords, codes and tokens are masked so they never reach the log.
    private fun logRequest(method: String, url: String, body: JSONObject, authorized: Boolean) {
        if (!BuildConfig.DEBUG) return
        Log.d(TAG, "→ $method $url${if (authorized) " [Authorization: Bearer ***]" else ""}\n${redact(body)}")
    }

    private fun logResponse(path: String, code: Int, tookMs: Long, raw: String, issuedToken: Boolean) {
        if (!BuildConfig.DEBUG) return
        val shown = try { redact(JSONObject(raw.ifBlank { "{}" })) } catch (_: Exception) { raw.take(2000) }
        val line = "← $code $path (${tookMs} ms)${if (issuedToken) " [set-auth-token: ***]" else ""}\n$shown"
        if (code in 200..299) Log.d(TAG, line) else Log.w(TAG, line)
    }

    private fun redact(json: JSONObject): String {
        val copy = JSONObject(json.toString())
        for (key in json.keys()) {
            if (SECRET_KEYS.any { key.contains(it, ignoreCase = true) }) copy.put(key, "***")
        }
        return copy.toString(2)
    }

    private companion object {
        const val TAG = "VictorAccount"
        val SECRET_KEYS = listOf("password", "code", "token", "secret")
    }

    // ---------- UI helpers ----------

    private enum class Kind { EMAIL, CODE, NAME, PASSWORD, NEW_PASSWORD, CONFIRM_PASSWORD, RECOVERY_CODE }
    private class Field(val label: String, val kind: Kind, val initial: String = "")
    /** Lets a submit handler report a server error inline (keeping the form open) or close the form on success. */
    private class FormResult(val fail: (String) -> Unit, val close: () -> Unit)

    private fun dp(value: Int) = (value * activity.resources.displayMetrics.density).toInt()
    private fun color(id: Int) = activity.getColor(id)
    private fun rounded(fill: Int, radius: Int, stroke: Int? = null) = GradientDrawable().apply {
        setColor(fill)
        cornerRadius = dp(radius).toFloat()
        if (stroke != null) setStroke(dp(1), stroke)
    }
    private fun isPassword(kind: Kind) = kind == Kind.PASSWORD || kind == Kind.NEW_PASSWORD || kind == Kind.CONFIRM_PASSWORD

    private fun pill(label: String, filled: Boolean, danger: Boolean = false) = Button(activity).apply {
        text = label
        isAllCaps = false
        textSize = 15f
        stateListAnimator = null
        minHeight = dp(46)
        minimumHeight = dp(46)
        background = if (filled) rounded(color(R.color.victor_primary), 23)
                     else rounded(color(R.color.victor_surface), 23, color(R.color.victor_outline))
        setTextColor(when {
            filled -> color(R.color.victor_surface)
            danger -> color(R.color.victor_danger)
            else -> color(R.color.victor_primary_dark)
        })
    }

    /** A rounded card dialog with the Victor logo, a title and subtitle. Screenshots are blocked like the main screen. */
    private fun sheet(title: String, subtitle: String): Pair<Dialog, LinearLayout> {
        val dialog = Dialog(activity)
        val root = LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(22), dp(22), dp(22), dp(18))
        }
        val header = LinearLayout(activity).apply { gravity = Gravity.CENTER_VERTICAL }
        header.addView(ImageView(activity).apply { setImageResource(R.drawable.ic_victor_logo) }, LinearLayout.LayoutParams(dp(40), dp(40)))
        val titles = LinearLayout(activity).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(12), 0, 0, 0) }
        titles.addView(TextView(activity).apply {
            text = title
            textSize = 20f
            setTypeface(typeface, Typeface.BOLD)
            setTextColor(color(R.color.victor_text))
        })
        titles.addView(TextView(activity).apply {
            text = subtitle
            textSize = 13f
            setTextColor(color(R.color.victor_text_muted))
        })
        header.addView(titles, LinearLayout.LayoutParams(0, -2, 1f))
        root.addView(header, LinearLayout.LayoutParams(-1, -2).apply { bottomMargin = dp(14) })
        dialog.setContentView(ScrollView(activity).apply { addView(root) })
        dialog.window?.apply {
            if (!BuildConfig.DEBUG) addFlags(WindowManager.LayoutParams.FLAG_SECURE)
            setBackgroundDrawable(rounded(color(R.color.victor_surface), 24))
        }
        dialog.setOnShowListener {
            dialog.window?.setLayout((activity.resources.displayMetrics.widthPixels * 0.9).toInt(), WindowManager.LayoutParams.WRAP_CONTENT)
        }
        return dialog to root
    }

    // Mirrors the server's passwordSchema (services/api/src/errors.ts) so problems are shown before sending.
    private fun passwordProblem(password: String): String? = when {
        password.isEmpty() -> "Create a password."
        password.length < 15 -> "Use at least 15 characters (currently ${password.length})."
        password.length > 128 -> "Use 128 characters or fewer."
        password.lowercase() in listOf("passwordpassword", "123456789012345", "qwertyuiopasdfgh") -> "Choose a less common password."
        else -> null
    }

    private fun problem(field: Field, value: String, fields: List<Field>, values: List<String>): String? = when (field.kind) {
        Kind.EMAIL -> when {
            value.isEmpty() -> "Enter your email address."
            !Patterns.EMAIL_ADDRESS.matcher(value).matches() || value.length > 254 -> "Enter a valid email address."
            else -> null
        }
        Kind.CODE -> if (!value.matches(Regex("\\d{6}"))) "Enter the 6-digit code from your email." else null
        Kind.NAME -> when {
            value.isEmpty() -> "Enter your name."
            value.length > 100 -> "Use 100 characters or fewer."
            else -> null
        }
        Kind.PASSWORD -> if (value.isEmpty()) "Enter your password." else null
        Kind.NEW_PASSWORD -> passwordProblem(value)
        Kind.CONFIRM_PASSWORD -> {
            val original = values[fields.indexOfFirst { it.kind == Kind.NEW_PASSWORD }]
            when {
                value.isEmpty() -> "Re-enter the password."
                value != original -> "Passwords don't match."
                else -> null
            }
        }
        Kind.RECOVERY_CODE -> if (value.isEmpty()) "Enter one of your saved recovery codes." else null
    }

    private fun form(title: String, subtitle: String, fields: List<Field>, action: String, submit: (List<String>, FormResult) -> Unit) {
        val (dialog, root) = sheet(title, subtitle)
        val inputs = ArrayList<EditText>()
        val boxes = ArrayList<LinearLayout>()
        val messages = ArrayList<TextView>()
        val boxNormal = { rounded(color(R.color.victor_background), 14, color(R.color.victor_outline)) }
        val boxError = { rounded(color(R.color.victor_background), 14, color(R.color.victor_danger)) }

        fields.forEachIndexed { index, field ->
            root.addView(TextView(activity).apply {
                text = field.label
                textSize = 13f
                setTypeface(typeface, Typeface.BOLD)
                setTextColor(color(R.color.victor_text))
            }, LinearLayout.LayoutParams(-1, -2).apply { if (index > 0) topMargin = dp(12) })
            val box = LinearLayout(activity).apply {
                gravity = Gravity.CENTER_VERTICAL
                background = boxNormal()
            }
            val edit = EditText(activity).apply {
                isSingleLine = true
                textSize = 15f
                background = null
                setTextColor(color(R.color.victor_text))
                setHintTextColor(color(R.color.victor_text_muted))
                setPadding(dp(14), dp(12), dp(8), dp(12))
                inputType = when (field.kind) {
                    Kind.EMAIL -> android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS
                    Kind.CODE -> android.text.InputType.TYPE_CLASS_NUMBER
                    Kind.NAME -> android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_FLAG_CAP_WORDS
                    Kind.RECOVERY_CODE -> android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS
                    else -> android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD
                }
                hint = when (field.kind) {
                    Kind.EMAIL -> "you@example.com"
                    Kind.CODE -> "6-digit code"
                    Kind.NAME -> "Your name"
                    Kind.NEW_PASSWORD -> "At least 15 characters"
                    Kind.CONFIRM_PASSWORD -> "Type it again"
                    Kind.RECOVERY_CODE -> "Saved recovery code"
                    Kind.PASSWORD -> "Password"
                }
                if (field.kind == Kind.CODE) {
                    filters = arrayOf(InputFilter.LengthFilter(6))
                    letterSpacing = 0.3f
                }
                if (isPassword(field.kind)) transformationMethod = PasswordTransformationMethod.getInstance()
                setText(field.initial)
            }
            box.addView(edit, LinearLayout.LayoutParams(0, -2, 1f))
            if (isPassword(field.kind)) {
                // Show / hide password toggle
                box.addView(ImageButton(activity).apply {
                    setImageResource(R.drawable.ic_eye)
                    background = null
                    contentDescription = "Show password"
                    setPadding(dp(12), dp(8), dp(14), dp(8))
                    setOnClickListener {
                        val hidden = edit.transformationMethod != null
                        val cursor = edit.selectionEnd
                        edit.transformationMethod = if (hidden) null else PasswordTransformationMethod.getInstance()
                        edit.setSelection(cursor.coerceIn(0, edit.text.length))
                        setImageResource(if (hidden) R.drawable.ic_eye_off else R.drawable.ic_eye)
                        contentDescription = if (hidden) "Hide password" else "Show password"
                    }
                })
            }
            root.addView(box, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(6) })
            val message = TextView(activity).apply {
                textSize = 12f
                visibility = View.GONE
                setPadding(dp(4), dp(4), dp(4), 0)
            }
            root.addView(message)
            // Live hint for new passwords; any edit clears that field's error.
            fun refreshHint() {
                if (field.kind != Kind.NEW_PASSWORD) { message.visibility = View.GONE; return }
                val length = edit.text.length
                message.visibility = View.VISIBLE
                message.text = if (length >= 15) "✓ $length characters" else "$length / 15 characters minimum"
                message.setTextColor(color(if (length >= 15) R.color.victor_success else R.color.victor_text_muted))
            }
            edit.doAfterTextChanged { box.background = boxNormal(); refreshHint() }
            refreshHint()
            inputs.add(edit); boxes.add(box); messages.add(message)
        }

        val formError = TextView(activity).apply {
            textSize = 13f
            visibility = View.GONE
            setTextColor(color(R.color.victor_danger))
            background = rounded(0x14DC2626, 12)
            setPadding(dp(12), dp(10), dp(12), dp(10))
        }
        root.addView(formError, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(14) })

        val primary = pill(action, filled = true)
        root.addView(primary, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(16) })
        root.addView(Button(activity).apply {
            text = "Cancel"
            isAllCaps = false
            background = null
            stateListAnimator = null
            setTextColor(color(R.color.victor_text_muted))
            setOnClickListener { dialog.dismiss() }
        }, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(4) })

        fun busy(on: Boolean) {
            primary.isEnabled = !on
            primary.alpha = if (on) 0.6f else 1f
            primary.text = if (on) "Please wait…" else action
            inputs.forEach { it.isEnabled = !on }
        }

        primary.setOnClickListener {
            val values = inputs.mapIndexed { index, input ->
                val raw = input.text.toString()
                when {
                    isPassword(fields[index].kind) -> raw
                    fields[index].kind == Kind.CODE -> raw.replace(" ", "")
                    fields[index].kind == Kind.EMAIL -> raw.trim().lowercase()
                    else -> raw.trim()
                }
            }
            formError.visibility = View.GONE
            var firstBad = -1
            fields.forEachIndexed { index, field ->
                val issue = problem(field, values[index], fields, values)
                if (issue != null) {
                    if (firstBad < 0) firstBad = index
                    boxes[index].background = boxError()
                    messages[index].text = issue
                    messages[index].setTextColor(color(R.color.victor_danger))
                    messages[index].visibility = View.VISIBLE
                } else if (fields[index].kind != Kind.NEW_PASSWORD) {
                    messages[index].visibility = View.GONE
                }
            }
            if (firstBad >= 0) { inputs[firstBad].requestFocus(); return@setOnClickListener }
            busy(true)
            submit(values, FormResult(
                fail = { message ->
                    busy(false)
                    formError.text = message
                    formError.visibility = View.VISIBLE
                },
                close = { dialog.dismiss() },
            ))
        }
        // Never leave typed secrets in memory once the form goes away.
        dialog.setOnDismissListener { inputs.forEach { it.text.clear() } }
        dialog.show()
        inputs.firstOrNull { it.text.isEmpty() }?.requestFocus()
    }

    // ---------- Screens ----------

    fun show() {
        val signedIn = store.load() != null
        val (dialog, root) = sheet(
            "Your Victor account",
            if (signedIn) "You're signed in on this device." else "Sign in or create a private account.",
        )
        fun option(label: String, filled: Boolean = false, danger: Boolean = false, action: () -> Unit) {
            root.addView(pill(label, filled, danger).apply {
                setOnClickListener { dialog.dismiss(); action() }
            }, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(8) })
        }
        if (signedIn) {
            option("Change password") { changePassword() }
            option("Replace recovery codes") { regenerate() }
            option("Sign out", danger = true) { call("/auth/sign-out", JSONObject(), true) { store.clear(); changed(null) } }
        } else {
            option("Sign in", filled = true) { login() }
            option("Create account") { requestCode(false) }
            option("Forgot password") { requestCode(true) }
            option("Use a recovery code") { verify("recover", "") }
        }
        root.addView(Button(activity).apply {
            text = "Close"
            isAllCaps = false
            background = null
            stateListAnimator = null
            setTextColor(color(R.color.victor_text_muted))
            setOnClickListener { dialog.dismiss() }
        }, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(6) })
        dialog.show()
    }

    private fun login() = form(
        "Sign in", "Welcome back to Victor.",
        listOf(Field("Email", Kind.EMAIL), Field("Password", Kind.PASSWORD)),
        "Sign in",
    ) { values, result ->
        call("/auth/sign-in/email", JSONObject().put("email", values[0]).put("password", values[1]), failed = result.fail) {
            result.close()
            if (store.load() == null) error("The server did not return a session. Try again.")
        }
    }

    private fun requestCode(reset: Boolean, email: String = "") = form(
        if (reset) "Forgot password" else "Create account",
        "We'll email you a 6-digit code.",
        listOf(Field("Email", Kind.EMAIL, email)),
        "Send code",
    ) { values, result ->
        val path = if (reset) "/account/forgot-password" else "/account/register"
        call(path, JSONObject().put("email", values[0]), failed = result.fail) { response ->
            result.close()
            error(response.optString("message", "Check your email for the code."))
            verify(if (reset) "reset" else "verify", values[0])
        }
    }

    private fun verify(kind: String, email: String) {
        val registration = kind == "verify"
        val fields = buildList {
            add(Field("Email", Kind.EMAIL, email))
            add(if (kind == "recover") Field("Recovery code", Kind.RECOVERY_CODE) else Field("Email code", Kind.CODE))
            if (registration) add(Field("Name", Kind.NAME))
            add(Field(if (registration) "Create password" else "New password", Kind.NEW_PASSWORD))
            add(Field("Confirm password", Kind.CONFIRM_PASSWORD))
        }
        val title = when (kind) { "verify" -> "Verify your email"; "reset" -> "Reset password"; else -> "Use a recovery code" }
        val subtitle = when (kind) {
            "verify" -> if (email.isBlank()) "Enter the code we emailed you." else "Enter the code sent to $email."
            "reset" -> "Enter the code we emailed you and a new password."
            else -> "Each recovery code works only once."
        }
        val action = when (kind) { "verify" -> "Create account"; "reset" -> "Reset password"; else -> "Recover account" }
        form(title, subtitle, fields, action) { values, result ->
            val password = values[fields.indexOfFirst { it.kind == Kind.NEW_PASSWORD }]
            val body = JSONObject().put("email", values[0]).put("code", values[1]).put("password", password)
            if (registration) body.put("name", values[fields.indexOfFirst { it.kind == Kind.NAME }])
            val path = when (kind) { "verify" -> "/account/verify-registration"; "reset" -> "/account/reset-password"; else -> "/account/recover" }
            call(path, body, failed = result.fail) { response ->
                result.close()
                error(response.optString("message", "Done."))
                if (registration) codes(response) else login()
            }
        }
    }

    private fun codes(result: JSONObject) {
        val codes = result.optJSONArray("recoveryCodes") ?: return
        val (dialog, root) = sheet("Save your recovery codes", "Store them privately. Each code works once.")
        val list = TextView(activity).apply {
            setTextIsSelectable(true)
            typeface = Typeface.MONOSPACE
            textSize = 15f
            setLineSpacing(dp(4).toFloat(), 1f)
            setTextColor(color(R.color.victor_text))
            background = rounded(color(R.color.victor_chip), 14)
            setPadding(dp(16), dp(14), dp(16), dp(14))
            text = (0 until codes.length()).joinToString("\n") { codes.getString(it) }
        }
        root.addView(list, LinearLayout.LayoutParams(-1, -2))
        root.addView(pill("I've saved them", filled = true).apply { setOnClickListener { dialog.dismiss() } },
            LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(16) })
        dialog.setCancelable(false)
        dialog.setOnDismissListener { list.text = "" }
        dialog.show()
    }

    private fun changePassword() = form(
        "Change password", "Other devices will be signed out.",
        listOf(
            Field("Current password", Kind.PASSWORD),
            Field("New password", Kind.NEW_PASSWORD),
            Field("Confirm new password", Kind.CONFIRM_PASSWORD),
        ),
        "Change password",
    ) { values, result ->
        call("/account/change-password", JSONObject().put("currentPassword", values[0]).put("newPassword", values[1]), true, failed = result.fail) {
            result.close()
            error("Password changed. Other sessions were revoked.")
        }
    }

    private fun regenerate() = form(
        "Replace recovery codes", "Your old codes will stop working.",
        listOf(Field("Current password", Kind.PASSWORD)),
        "Replace codes",
    ) { values, result ->
        call("/account/recovery-codes", JSONObject().put("password", values[0]), true, failed = result.fail) { response ->
            result.close()
            codes(response)
        }
    }
}
