package com.victor.assistant

import android.app.AlertDialog
import android.text.InputType
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
    private fun call(path: String, body: JSONObject, signed: Boolean = false, done: (JSONObject) -> Unit) {
        val generation = ++requestGeneration
        val token = store.load()
        Thread {
            try {
                val builder = Request.Builder().url(BuildConfig.API_URL.trimEnd('/') + path)
                    .header("X-Victor-Client", "android").header("Accept", "application/json")
                    .post(body.toString().toRequestBody("application/json".toMediaType()))
                if (signed && token != null) builder.header("Authorization", "Bearer $token")
                val result = http.newCall(builder.build()).execute().use { response ->
                    Triple(response.code, JSONObject(response.body?.string() ?: "{}"), response.header("set-auth-token"))
                }
                activity.runOnUiThread {
                    if (generation != requestGeneration || activity.isFinishing || activity.isDestroyed || (signed && store.load() != token)) return@runOnUiThread
                    if (result.first in 200..299) {
                        result.third?.let { store.save(it); changed(it) }
                        done(result.second)
                    } else {
                        if (result.first == 401 && signed) { store.clear(); changed(null) }
                        error(result.second.optString("message", "Account request failed"))
                    }
                }
            } catch (_: Exception) { activity.runOnUiThread { error("Account request failed. Check the connection and try again.") } }
        }.start()
    }
    fun show() {
        val signed = store.load() != null
        val options = if (signed) arrayOf("Change password", "Replace recovery codes", "Sign out")
                      else arrayOf("Sign in", "Register", "Forgot password", "Use recovery code")
        AlertDialog.Builder(activity).setTitle("Your Victor account").setItems(options) { _, index ->
            when (options[index]) {
                "Sign in" -> login()
                "Register" -> requestCode(false)
                "Forgot password" -> requestCode(true)
                "Use recovery code" -> verify("recover", "")
                "Change password" -> changePassword()
                "Replace recovery codes" -> regenerate()
                "Sign out" -> call("/auth/sign-out", JSONObject(), true) { store.clear(); changed(null) }
            }
        }.setNegativeButton("Close", null).show()
    }
    private fun form(title: String, labels: List<String>, passwords: Set<Int> = emptySet(), initial: Map<Int, String> = emptyMap(), submit: (List<String>) -> Unit) {
        val layout = LinearLayout(activity).apply { orientation = LinearLayout.VERTICAL; setPadding(32, 16, 32, 16) }
        val inputs = labels.mapIndexed { index, label ->
            layout.addView(TextView(activity).apply { text = label })
            EditText(activity).apply {
                isSingleLine = true
                inputType = when {
                    index in passwords -> InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
                    label == "Email" -> InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS
                    else -> InputType.TYPE_CLASS_TEXT
                }
                setText(initial[index] ?: "")
                layout.addView(this)
            }
        }
        val scroll = ScrollView(activity).apply { addView(layout) }
        val dialog = AlertDialog.Builder(activity).setTitle(title).setView(scroll).setPositiveButton("Continue", null).setNegativeButton("Cancel", null).create()
        dialog.setOnShowListener {
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener {
                val values = inputs.mapIndexed { index, input -> if (index in passwords) input.text.toString() else input.text.toString().trim() }
                if (values.any { it.isEmpty() }) { error("Complete each field"); return@setOnClickListener }
                dialog.dismiss()
                inputs.forEach { it.text.clear() }
                submit(values)
            }
        }
        dialog.show()
    }
    private fun login() = form("Sign in", listOf("Email", "Password"), setOf(1)) { values ->
        call("/auth/sign-in/email", JSONObject().put("email", values[0].lowercase()).put("password", values[1])) {
            if (store.load() == null) error("The server did not return a session. Try again.")
        }
    }
    private fun requestCode(reset: Boolean) = form(if (reset) "Forgot password" else "Register", listOf("Email")) { values ->
        val path = if (reset) "/account/forgot-password" else "/account/register"
        call(path, JSONObject().put("email", values[0].lowercase())) { result ->
            error(result.optString("message")); verify(if (reset) "reset" else "verify", values[0].lowercase())
        }
    }
    private fun verify(kind: String, email: String) {
        val registration = kind == "verify"
        val labels = if (registration) listOf("Email", "Email code", "Name", "Password (15+ characters)")
                     else listOf("Email", if (kind == "recover") "Saved recovery code" else "Email code", "New password (15+ characters)")
        val passwordIndex = labels.lastIndex
        form(if (registration) "Verify email" else "Recover account", labels, setOf(passwordIndex), mapOf(0 to email)) { values ->
            val body = JSONObject().put("email", values[0].lowercase()).put("code", values[1]).put("password", values[passwordIndex])
            if (registration) body.put("name", values[2])
            val path = when (kind) { "verify" -> "/account/verify-registration"; "reset" -> "/account/reset-password"; else -> "/account/recover" }
            call(path, body) { result ->
                error(result.optString("message"))
                if (registration) codes(result) else login()
            }
        }
    }
    private fun codes(result: JSONObject) {
        val codes = result.optJSONArray("recoveryCodes") ?: return
        val text = TextView(activity).apply {
            setPadding(32, 16, 32, 16)
            setTextIsSelectable(true)
            this.text = "Save privately. Each code works once.\n\n" + (0 until codes.length()).joinToString("\n") { codes.getString(it) }
        }
        AlertDialog.Builder(activity).setTitle("Save your recovery codes").setView(ScrollView(activity).apply { addView(text) })
            .setPositiveButton("Saved") { _, _ -> text.text = "" }.show()
    }
    private fun changePassword() = form("Change password", listOf("Current password", "New password (15+ characters)"), setOf(0, 1)) { values ->
        call("/account/change-password", JSONObject().put("currentPassword", values[0]).put("newPassword", values[1]), true) { error("Password changed. Other sessions were revoked.") }
    }
    private fun regenerate() = form("Replace recovery codes", listOf("Current password"), setOf(0)) { values ->
        call("/account/recovery-codes", JSONObject().put("password", values[0]), true) { codes(it) }
    }
}
