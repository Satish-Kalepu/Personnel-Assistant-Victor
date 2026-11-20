import { SarvamAIClient } from "sarvamai";
import { WebSocket as NodeWebSocket } from "ws";

// The SDK selects globalThis.WebSocket before its Node transport. Explicitly
// select ws here: the Node built-in browser-style socket ignores auth headers.
globalThis.WebSocket = NodeWebSocket;

async function opened(socket) {
  let timer;
  try {
    await Promise.race([
      socket.waitForOpen(),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Speech connection timed out.")),
          10000,
        );
      }),
    ]);
    return socket;
  } catch (error) {
    socket.close();
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

// Sarvam WAV chunks can include a header per segment, or one header followed by
// PCM chunks. Accept only the requested 24kHz mono PCM16; never guess a codec.
export class WavPcm {
  constructor() {
    this.pending = Buffer.alloc(0);
    this.inData = false;
    this.odd = Buffer.alloc(0);
  }
  push(bytes) {
    if (bytes.subarray(0, 4).toString() === "RIFF") this.inData = false;
    let data = bytes;
    if (!this.inData) {
      this.pending = Buffer.concat([this.pending, bytes]);
      if (this.pending.length < 12) return Buffer.alloc(0);
      if (
        this.pending.toString("ascii", 0, 4) !== "RIFF" ||
        this.pending.toString("ascii", 8, 12) !== "WAVE"
      )
        throw new Error("Unsupported speech audio.");
      let position = 12,
        format = false;
      while (position + 8 <= this.pending.length) {
        const tag = this.pending.toString("ascii", position, position + 4);
        const size = this.pending.readUInt32LE(position + 4);
        if (tag === "data") {
          if (!format) throw new Error("Missing speech audio format.");
          this.inData = true;
          data = this.pending.subarray(position + 8);
          this.pending = Buffer.alloc(0);
          break;
        }
        if (position + 8 + size > this.pending.length) break;
        if (tag === "fmt ") {
          const p = position + 8;
          if (
            size < 16 ||
            this.pending.readUInt16LE(p) !== 1 ||
            this.pending.readUInt16LE(p + 2) !== 1 ||
            this.pending.readUInt32LE(p + 4) !== 24000 ||
            this.pending.readUInt16LE(p + 14) !== 16
          )
            throw new Error("Unsupported speech audio format.");
          format = true;
        }
        position += 8 + size + (size % 2);
      }
      if (!this.inData) {
        if (this.pending.length > 65536)
          throw new Error("Invalid speech audio header.");
        return Buffer.alloc(0);
      }
    }
    data = Buffer.concat([this.odd, data]);
    this.odd = data.length % 2 ? data.subarray(-1) : Buffer.alloc(0);
    return data.subarray(0, data.length - this.odd.length);
  }
}

export function sarvamProvider(apiKey, speaker = "simran_en_customer") {
  const client = new SarvamAIClient({ apiSubscriptionKey: apiKey });
  return {
    async listen(onEvent, onError) {
      const socket = await client.speechToTextRealtimeStreaming.connect({
        "Api-Subscription-Key": apiKey,
        model: "saaras:v4",
        language_code: "en-IN",
        mode: "transcribe",
        stream_type: "fast",
        encoding: "linear16",
        sample_rate: "16000",
        endpointing: "vad",
        silence_duration_ms: "650",
        min_speech_duration_ms: "250",
        reconnectAttempts: 0,
      });
      let closed = false;
      socket.on("message", (event) => {
        if (!closed) onEvent(event);
      });
      socket.on("error", () => {
        if (!closed) onError();
      });
      socket.on("close", () => {
        if (!closed) onError();
      });
      await opened(socket);
      return {
        send(bytes) {
          socket.sendRealtimeAudioInput({
            event: "audio_input",
            audio: bytes.toString("base64"),
          });
        },
        close() {
          closed = true;
          socket.close();
        },
      };
    },
    async prepareSpeech(onAudio, onEnd, onError) {
      const socket = await client.textToSpeechStreaming.connect({
        model: "bulbul:v4-flash",
        send_completion_event: true,
        reconnectAttempts: 0,
      });
      const wav = new WavPcm();
      let closed = false;
      const close = () => {
        closed = true;
        socket.close();
      };
      socket.on("message", (message) => {
        if (closed) return;
        try {
          if (message.type === "audio") {
            const pcm = wav.push(Buffer.from(message.data.audio, "base64"));
            if (pcm.length) onAudio(pcm);
          } else if (
            message.type === "event" &&
            message.data?.event_type === "final"
          ) {
            close();
            onEnd();
          } else if (message.type === "error") {
            close();
            onError();
          }
        } catch {
          close();
          onError();
        }
      });
      socket.on("error", () => {
        if (!closed) {
          close();
          onError();
        }
      });
      socket.on("close", () => {
        if (!closed) {
          closed = true;
          onError();
        }
      });
      await opened(socket);
      socket.configureConnection({
        language_code: "en-IN",
        speaker,
        speech_sample_rate: 24000,
        output_audio_codec: "wav",
        enable_preprocessing: true,
        pace: 1,
        min_buffer_size: 50,
        max_chunk_length: 200,
      });
      return {
        get closed() {
          return closed;
        },
        write(text) {
          socket.convert(text);
          socket.flush();
        },
        close,
      };
    },
    async speak(text, onAudio, onEnd, onError) {
      const stream = await this.prepareSpeech(onAudio, onEnd, onError);
      stream.write(text);
      return stream;
    },
  };
}
