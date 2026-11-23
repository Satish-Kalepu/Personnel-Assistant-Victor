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

/**
 * The same authenticated streaming protocol as the web client. No vendor key.
 *
 * inputMode "live": continuous session, speak naturally and interrupt by speaking.
 * inputMode "push-to-talk": hold to speak; [finishInput] on release sends any remaining audio, then
 * `finishInput`. The session closes by itself once the reply has been spoken (or shown, when muted).
 */
class VoiceConnection(
    private val context: Context,
    private val http: OkHttpClient,
    private val url: String,
    private val token: String,
    private val mode: String,
    private val conversationId: String?,
    private val inputMode: String = "live",
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
    private val pushToTalk = inputMode == "push-to-talk"
    @Volatile private var capturing = false          // microphone is recording and streaming
    @Volatile private var finishRequested = false    // push-to-talk: button released
    @Volatile private var inputEnded = false         // push-to-talk: finishInput sent
    @Volatile private var replyReceived = false
    @Volatile private var closeAfterPlayback = false // push-to-talk: stop once queued audio has played
    @Volatile private var resyncPlayback = false
    private val finishTimeout = Runnable { fail("Microphone could not finish. Please try again.") }

    private fun ui(block: () -> Unit) = main.post { if (active.get()) block() }

    fun start(initiallyMuted: Boolean) {
        muted = initiallyMuted
        onState("connecting")
        main.postDelayed(timeout, 12000)
        socket = http.newWebSocket(Request.Builder().url(url).build(), object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                if (!active.get()) { webSocket.cancel(); return }
                webSocket.send(JSONObject().put("type", "start").put("token", token).put("mode", mode)
                    .put("inputMode", inputMode)
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
                        "state" -> {
                            val state = data.getString("state")
                            if (pushToTalk && inputEnded && state == "listening") finishWhenDone()
                            else ui { onState(state) }
                        }
                        "transcript" -> ui { onTranscript(data.optString("text")) }
                        "reply" -> {
                            replyReceived = true
                            ui { onReply(data) }
                            if (pushToTalk && inputEnded && muted) main.post { stop() }
                        }
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
                        "speechEnd" -> if (pushToTalk && inputEnded) finishWhenDone() else ui { onState("listening") }
                        "inputComplete" -> if (data.optBoolean("empty")) fail("No speech was detected. Hold to talk and try again.")
                        "error" -> {
                            val message = data.optString("message", "Voice unavailable.")
                            if (pushToTalk) fail(message) else ui { onError(message) }
                        }
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
                capturing = true
                val bytes = ByteArray(3200)
                while (active.get() && !finishRequested) {
                    val count = local.read(bytes, 0, bytes.size)
                    if (!active.get()) break
                    if (count <= 0) throw IllegalStateException()
                    val ws = socket ?: break
                    if (ws.queueSize() > 64000 || !ws.send(bytes.toByteString(0, count))) throw IllegalStateException()
                }
                if (active.get() && finishRequested) {
                    // Released: stop the microphone, send what is still buffered, then tell the server the turn is over.
                    local.stop()
                    val ws = socket ?: throw IllegalStateException()
                    while (true) {
                        val count = local.read(bytes, 0, bytes.size, AudioRecord.READ_NON_BLOCKING)
                        if (count <= 0) break
                        if (count % 2 == 0) ws.send(bytes.toByteString(0, count))
                    }
                    main.removeCallbacks(finishTimeout)
                    inputEnded = true
                    capturing = false
                    ws.send(JSONObject().put("type", "finishInput").toString())
                    ui { onState("thinking") }
                }
            } catch (_: Exception) { if (active.get()) fail("Microphone unavailable. Check permission or use text chat.") }
            finally {
                capturing = false
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
                var written = 0L // frames handed to the track since the last clear
                var base = 0L
                while (active.get()) {
                    if (resyncPlayback) { resyncPlayback = false; base = local.playbackHeadPosition.toLong() and 0xFFFFFFFFL; written = 0L }
                    val frame = frames.poll(100, TimeUnit.MILLISECONDS)
                    if (frame == null) {
                        val played = (local.playbackHeadPosition.toLong() and 0xFFFFFFFFL) - base
                        if (closeAfterPlayback && frames.isEmpty() && played >= written) { main.post { stop() }; break }
                        continue
                    }
                    var offset = 0
                    while (active.get() && !muted && frame.turn == turn && offset < frame.bytes.size) {
                        val count = local.write(frame.bytes, offset, minOf(2400, frame.bytes.size - offset), AudioTrack.WRITE_BLOCKING)
                        if (count <= 0) break
                        offset += count
                        written += count / 2
                    }
                }
            } catch (_: InterruptedException) { /* normal shutdown */ }
            catch (_: Exception) { if (active.get()) fail("Audio playback unavailable. Use text chat.") }
            finally { try { local?.stop() } catch (_: Exception) { }; local?.release(); player = null }
        }.apply { name = "victor-playback"; start() }
    }

    /** Push-to-talk: the reply is complete; close once any queued speech has finished playing. */
    private fun finishWhenDone() {
        if (!replyReceived) { ui { onState("thinking") }; return }
        if (muted || player == null) { main.post { stop() }; return }
        closeAfterPlayback = true
    }

    /**
     * Push-to-talk release. If the microphone is not streaming yet, the turn is cancelled with a clear
     * retry message rather than pretending speech was captured.
     */
    fun finishInput() {
        if (!active.get() || finishRequested) return
        if (!pushToTalk || !capturing) {
            fail("Microphone was not ready yet. Hold again and wait for Listening before speaking.")
            return
        }
        finishRequested = true
        main.postDelayed(finishTimeout, 3000)
    }

    private fun clearAudio() {
        frames.clear()
        resyncPlayback = true
        try { player?.pause(); player?.flush(); if (active.get()) player?.play() } catch (_: Exception) { }
    }
    private fun control(type: String, value: Boolean? = null) {
        if (!active.get()) return
        val data = JSONObject().put("type", type)
        value?.let { data.put("value", it) } // server expects "value" (services/api/src/voice.ts)
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
        main.removeCallbacks(finishTimeout)
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
