package com.victor.assistant

import android.annotation.SuppressLint
import android.content.Context
import android.media.*
import android.media.audiofx.AcousticEchoCanceler
import android.os.Handler
import android.os.Looper
import android.os.Build
import android.util.Base64
import okhttp3.*
import okio.ByteString.Companion.toByteString
import org.json.JSONObject
import java.util.concurrent.LinkedBlockingQueue
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

/** The same authenticated streaming protocol as the web client. No vendor key. */
class VoiceConnection(
    private val context: Context,
    private val http: OkHttpClient,
    private val url: String,
    private val token: String,
    private val mode: String,
    private val conversationId: String?,
    private val onState: (String) -> Unit,
    private val onTranscript: (String) -> Unit,
    private val onReply: (JSONObject) -> Unit,
    private val onError: (String) -> Unit,
) {
    private data class Frame(val turn: Int, val bytes: ByteArray)
    private val main = Handler(Looper.getMainLooper())
    private val active = AtomicBoolean(true)
    private val frames = LinkedBlockingQueue<Frame>(100)
    private var socket: WebSocket? = null
    @Volatile private var recorder: AudioRecord? = null
    @Volatile private var player: AudioTrack? = null
    @Volatile private var turn = -1
    @Volatile private var muted = false
    private var capture: Thread? = null
    private var playback: Thread? = null
    private var echo: AcousticEchoCanceler? = null
    private val manager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    private val previousMode = manager.mode
    private val previousDevice = if (Build.VERSION.SDK_INT >= 31) manager.communicationDevice else null
    private var focus: AudioFocusRequest? = null
    private val timeout = Runnable { fail("Voice connection timed out.") }

    private fun ui(block: () -> Unit) = main.post { if (active.get()) block() }

    fun start(initiallyMuted: Boolean) {
        muted = initiallyMuted
        onState("connecting")
        main.postDelayed(timeout, 12000)
        socket = http.newWebSocket(Request.Builder().url(url).build(), object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                if (!active.get()) { webSocket.cancel(); return }
                webSocket.send(JSONObject().put("type", "start").put("token", token).put("mode", mode)
                    .apply { conversationId?.let { put("conversationId", it) } }.toString())
            }
            override fun onMessage(webSocket: WebSocket, text: String) {
                if (!active.get()) return
                try {
                    val data = JSONObject(text)
                    when (data.optString("type")) {
                        "ready" -> {
                            main.removeCallbacks(timeout)
                            if (muted) control("mute", true)
                            startAudio()
                        }
                        "state" -> ui { onState(data.getString("state")) }
                        "transcript" -> ui { onTranscript(data.optString("text")) }
                        "reply" -> ui { onReply(data) }
                        "clear" -> { turn = data.getInt("turn"); clearAudio() }
                        "audio" -> {
                            val audioTurn = data.getInt("turn")
                            if (!muted && audioTurn == turn) {
                                require(data.getInt("sampleRate") == 24000)
                                val bytes = Base64.decode(data.getString("audio"), Base64.DEFAULT)
                                require(bytes.isNotEmpty() && bytes.size % 2 == 0)
                                if (!frames.offer(Frame(audioTurn, bytes))) fail("Voice playback cannot keep up. Start again.")
                            }
                        }
                        "speechEnd" -> ui { onState("listening") }
                        "error" -> ui { onError(data.optString("message", "Voice unavailable.")) }
                    }
                } catch (_: Exception) { fail("Voice audio could not be read.") }
            }
            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                fail("Voice connection failed. Text chat is available.")
            }
            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                webSocket.close(code, null); stop()
            }
            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) { stop() }
        })
    }

    @SuppressLint("MissingPermission")
    private fun startAudio() {
        if (Looper.myLooper() != Looper.getMainLooper()) { main.post { startAudio() }; return }
        if (capture != null || !active.get()) return
        val request = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE)
            .setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION).setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build())
            .setOnAudioFocusChangeListener { change ->
                if (change == AudioManager.AUDIOFOCUS_LOSS || change == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) stop()
            }.build()
        focus = request
        if (manager.requestAudioFocus(request) != AudioManager.AUDIOFOCUS_REQUEST_GRANTED) {
            fail("Audio is in use by another app. Try voice again shortly."); return
        }
        manager.mode = AudioManager.MODE_IN_COMMUNICATION
        if (Build.VERSION.SDK_INT >= 31) {
            val current = manager.communicationDevice
            if (current == null || current.type == AudioDeviceInfo.TYPE_BUILTIN_EARPIECE) {
                manager.availableCommunicationDevices.firstOrNull { it.type == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER }
                    ?.let { manager.setCommunicationDevice(it) }
            }
        }
        capture = Thread {
            var local: AudioRecord? = null
            try {
                val min = AudioRecord.getMinBufferSize(16000, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT)
                require(min > 0)
                local = AudioRecord(MediaRecorder.AudioSource.VOICE_COMMUNICATION, 16000,
                    AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT, maxOf(min, 6400))
                recorder = local
                require(local.state == AudioRecord.STATE_INITIALIZED)
                if (!active.get()) return@Thread
                if (AcousticEchoCanceler.isAvailable()) echo = AcousticEchoCanceler.create(local.audioSessionId)?.apply { enabled = true }
                local.startRecording()
                val bytes = ByteArray(3200)
                while (active.get()) {
                    val count = local.read(bytes, 0, bytes.size)
                    if (!active.get()) break
                    if (count <= 0) throw IllegalStateException()
                    val ws = socket ?: break
                    if (ws.queueSize() > 64000 || !ws.send(bytes.toByteString(0, count))) throw IllegalStateException()
                }
            } catch (_: Exception) { if (active.get()) fail("Microphone unavailable. Check permission or use text chat.") }
            finally {
                try { local?.stop() } catch (_: Exception) { }
                local?.release(); recorder = null; echo?.release(); echo = null
            }
        }.apply { name = "victor-microphone"; start() }
        playback = Thread {
            var local: AudioTrack? = null
            try {
                val min = AudioTrack.getMinBufferSize(24000, AudioFormat.CHANNEL_OUT_MONO, AudioFormat.ENCODING_PCM_16BIT)
                require(min > 0)
                local = AudioTrack.Builder()
                    .setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION).setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build())
                    .setAudioFormat(AudioFormat.Builder().setEncoding(AudioFormat.ENCODING_PCM_16BIT).setSampleRate(24000).setChannelMask(AudioFormat.CHANNEL_OUT_MONO).build())
                    .setBufferSizeInBytes(maxOf(min, 9600)).setTransferMode(AudioTrack.MODE_STREAM).build()
                player = local; local.play()
                while (active.get()) {
                    val frame = frames.poll(500, TimeUnit.MILLISECONDS) ?: continue
                    var offset = 0
                    while (active.get() && !muted && frame.turn == turn && offset < frame.bytes.size) {
                        val count = local.write(frame.bytes, offset, minOf(2400, frame.bytes.size - offset), AudioTrack.WRITE_BLOCKING)
                        if (count <= 0) break
                        offset += count
                    }
                }
            } catch (_: InterruptedException) { /* normal shutdown */ }
            catch (_: Exception) { if (active.get()) fail("Audio playback unavailable. Use text chat.") }
            finally { try { local?.stop() } catch (_: Exception) { }; local?.release(); player = null }
        }.apply { name = "victor-playback"; start() }
    }

    private fun clearAudio() {
        frames.clear()
        try { player?.pause(); player?.flush(); if (active.get()) player?.play() } catch (_: Exception) { }
    }
    private fun control(type: String, value: Boolean? = null) {
        if (!active.get()) return
        val data = JSONObject().put("type", type)
        value?.let { data.put("muted", it) }
        socket?.send(data.toString())
    }
    fun interrupt() { turn = -1; clearAudio(); control("interrupt") }
    fun muteReplies(value: Boolean) { muted = value; if (value) { turn = -1; clearAudio() }; control("mute", value) }
    private fun fail(message: String) {
        if (!active.get()) return
        main.post { onError(message) }; stop()
    }
    fun stop() {
        if (!active.getAndSet(false)) return
        main.removeCallbacks(timeout)
        socket?.cancel(); socket = null
        frames.clear(); clearAudio()
        try { recorder?.stop() } catch (_: Exception) { }
        capture?.interrupt(); playback?.interrupt()
        val restore = {
            focus?.let { manager.abandonAudioFocusRequest(it) }; focus = null
            if (Build.VERSION.SDK_INT >= 31) {
                if (previousDevice != null) manager.setCommunicationDevice(previousDevice) else manager.clearCommunicationDevice()
            }
            manager.mode = previousMode; onState("idle")
        }
        if (Looper.myLooper() == Looper.getMainLooper()) restore() else main.post { restore() }
    }
}
