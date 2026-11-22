# Chat voice modes

Requested in prompt024,2026-11-22. The web chat has two distinct entry points.

- **Press and speak:** Hold with a pointer or Space/Enter, wait for Listening and speak, then release. For assistive activation, the button can start/finish on activation. Releasing flushes any partial100ms PCM frame before sending the finish control, disconnects capture/stops microphone tracks, then plays the checked reply and closes the voice session after playback. Cancel/blur while holding discards the turn. Releasing while connection/permission is still pending cancels with a clear retry message; it never claims that unrecorded speech was captured.
- **Live mode:** Opens the existing continuous session with a dark teal/navy screen, live indicator and listening/thinking/speaking status. Speak naturally and interrupt by speaking. Exit live mode restores the standard theme and stops capture/playback/socket resources. Account/mode/conversation changes and existing hide/logout lifecycle keep their cancellation behavior. Reduced-motion preference stops decorative animation.

Hold/release was the stated recommended implementation after the optional press-behavior question received no answer within its grace period. Owner preference can still choose dictation or tap-to-finish; those are different semantics, not an assumption about approval of that option.

## Protocol and authoritative backend

The authenticated start message adds optional inputMode `live` or `push-to-talk`; omission defaults to `live`, preserving older web/Android clients. Origin/authentication, Redis per-user/global voice leases, duration/audio pacing, MongoDB history/memory and quota/checked speech boundaries stay unchanged.

Live input still uses the private owned Silero worker and Sarvam streaming manual STT boundaries. Held input uses a private Sarvam manual STT stream directly: user-controlled boundaries replace silence detection, so a pause while holding does not submit a premature message. The backend queues finalized input without model processing until release; `finishInput` ends recognition and final transcripts enter the existing serialized agent/memory/TTS path. Both modes use the same existing provider keys; none go to the frontend.

The client worklet emits remaining PCM then a flushed marker. Only after forwarding those bytes does the client stop the microphone and send finishInput. Backend rejects audio after finishing a held turn. Empty recognized input completes without a model call. One-shot muted replies finish on text completion; spoken replies finish only after queued audio drains. A held-session error stops the one-shot session; live retains its existing recoverable-error behavior.

## Verification

Focused backend checks cover manual STT authentication/boundaries/duplicate finals, no early model call across held statements, single serialized input, cancel and empty completion, plus existing retained-facts/live tests. Frontend resource tests cover final partial frame, actual track stop before finish, full playback before close, muted completion and live capture until exit. Browser tests use synthetic UI/session fixtures for pointer/keyboard/theme/responsive checks. Staging acceptance additionally uses fresh authenticated synthetic speech and removes only that fixture, retaining global spend and real accounts. Physical microphone/touch/Pixel/acoustic-latency acceptance remains separate.
