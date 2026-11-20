// Explicit, paid synthetic-only connectivity check. No microphone or user text.
import { mkdir, writeFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { sarvamProvider } from "./sarvam.mjs";

if (!process.argv.includes("--synthetic") || !process.env.SARVAM_API_KEY) {
  console.error("Set the key privately and explicitly pass --synthetic."); process.exit(1);
}
const phrase = "Hello. This is Victor. I am ready to help you practice English.";
const provider = sarvamProvider(process.env.SARVAM_API_KEY);
const chunks = [];
let firstAudio, speaker, recognizer;
const started = performance.now();
try {
  let finish, fail;
  const complete = new Promise((resolve, reject) => { finish = resolve; fail = reject; });
  const timeout = setTimeout(() => fail(new Error("synthesis timeout")), 25000);
  try {
    speaker = await provider.speak(phrase, pcm => {
      if (firstAudio === undefined) firstAudio = performance.now() - started;
      chunks.push(Buffer.from(pcm));
    }, finish, () => fail(new Error("synthesis failed")));
    await complete;
  } finally { clearTimeout(timeout); speaker?.close(); }
  const pcm = Buffer.concat(chunks);
  if (!pcm.length) throw new Error("no audio");
  const wav = Buffer.alloc(44 + pcm.length);
  wav.write("RIFF"); wav.writeUInt32LE(wav.length - 8, 4); wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(24000, 24); wav.writeUInt32LE(48000, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
  wav.write("data", 36); wav.writeUInt32LE(pcm.length, 40); pcm.copy(wav, 44);
  await mkdir(".voice-local", { recursive: true });
  await writeFile(".voice-local/sarvam-sample.wav", wav);

  const samples = [];
  let phase = 0, sum = 0, count = 0;
  for (let i = 0; i < pcm.length; i += 2) {
    sum += pcm.readInt16LE(i); count++; phase += 16000;
    if (phase >= 24000) { samples.push(Math.round(sum / count)); sum = 0; count = 0; phase -= 24000; }
  }
  // Include leading/trailing silence so the VAD can finalize naturally.
  const input = Buffer.alloc(6400 + samples.length * 2 + 64000);
  samples.forEach((value, index) => input.writeInt16LE(value, 6400 + index * 2));
  const finals = []; let error = false;
  recognizer = await provider.listen(event => {
    if (event.event === "transcript.final") finals.push(event.text || "");
    if (event.event === "error" && event.is_fatal) error = true;
  }, () => { error = true; });
  for (let offset = 0; offset < input.length; offset += 3200) {
    if (error) throw new Error("recognition failed");
    recognizer.send(input.subarray(offset, offset + 3200)); await delay(100);
  }
  await delay(1000); recognizer.close(); recognizer = null;
  if (error || !finals.length || !finals.join(" ").toLowerCase().includes("victor")) throw new Error("synthetic recognition did not verify");
  const result = {
    checkedAt: new Date().toISOString(), syntheticOnly: true,
    tts: "bulbul:v4-flash", stt: "saaras:v4", speaker: "simran_en_customer",
    connectToFirstPcmMs: Math.round(firstAudio), generatedAudioSeconds: Number((pcm.length / 48000).toFixed(2)),
    syntheticTranscript: finals.join(" "),
    note: "Connectivity and format check only; not a microphone, accent, noise, playback, or end-to-end chat latency benchmark.",
  };
  await writeFile(".voice-local/live-check.json", JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify(result));
} catch {
  console.error("Synthetic speech check failed. No key or provider error object was printed; no personal audio was used.");
  process.exitCode = 1;
} finally { speaker?.close(); recognizer?.close(); }
