# Benchmark corpus v1: 30 scenario definitions

Not executed. All people, numbers, places used as preferences and stored facts below are fictional fixtures. Quoted utterances are original test text. For pause cases, keep a timed recording/annotation rather than speaking the bracketed stage directions aloud. Repeat with multiple consenting voices and Indian English; optional code-switching is an additional stratum.

| ID | Scenario/input | Expected behavior or scoring focus |
|---|---|---|
| B01 | “Hi, how are you today?” | Brief natural greeting; no unnecessary backend task |
| B02 | “Tell me one interesting fact about the Moon.” | Short accurate spoken answer; first useful content timing |
| B03 | “What is twelve times thirteen?” | Correct 156; no filler-only success |
| B04 | “Explain photosynthesis in one sentence.” | Accurate concise first clause |
| B05 | “Which is better for a quick walk: carrying a heavy backpack or going without it?” | Understand the simple comparison; concise answer |
| B06 | “Give me three easy dinner ideas using rice.” | Correct list, natural pacing and sustained audio |
| B07 | “My name is Aniruddha.” | Critical-name recognition; do not invent spelling certainty |
| B08 | “Please repeat the test code: A seven, B nine, Q two.” | Exact six spoken symbols; separate recognition/readback scores |
| B09 | “The fictional reference is four zero two, eight eight one, six three.” | Preserve grouped fictional digits |
| B10 | “Schedule a fictional reminder for Friday at [600 ms pause] six in the evening.” | Do not end at the pause; use mocked scheduler only |
| B11 | “I'd like to know [900 ms thinking pause] how rainbows form.” | Patient turn detection; no repeated premature answer |
| B12 | “Book it for Tuesday—sorry, Wednesday.” | Respect correction; no action before final intent |
| B13 | “Set a reminder for seven—actually, cancel that.” | No persisted reminder in mocked tool state |
| B14 | Interrupt a long reply with “Stop.” | Audible yield, local clear, no stale continuation |
| B15 | Interrupt with “Make that explanation simpler.” | Yield and respond to changed request |
| B16 | Say “Mm-hmm” during a correct explanation. | Appropriate continuation/backchannel handling |
| B17 | Play a short cough or keyboard sound during assistant speech. | Avoid false interruption; document recovery |
| B18 | Speaker playback with assistant saying a phrase containing “stop.” | Avoid self-triggered interruption from echo |
| B19 | User starts speaking quietly during assistant playback. | Double-talk recognition and yield without clipping first words |
| B20 | “In this fictional test, my favorite fruit is guava.” Then ask “What fruit did I say I like?” | Correct immediate context, pending-memory consistency |
| B21 | Same fact in Practice mode, then a new Personal conversation | No cross-mode memory creation/retrieval |
| B22 | “Forget that fruit preference.” Then ask the question again | Mock deletion reflected; no resurrection from stale worker result |
| B23 | “What is the status of fixture order TEST-ALPHA?” | Required mock lookup returns the fixed authoritative status |
| B24 | Ask B23, then change to TEST-BETA while lookup is delayed. | Respect correction; discard obsolete spoken result, avoid mixing tasks |
| B25 | Mock tool fails or returns “not found.” | Honest answer; no invented successful result |
| B26 | “Compare these two fictional travel plans...” with controlled supplied facts and constraints | Multi-step correctness, useful-answer timing and task completion separately |
| B27 | Disconnect/reconnect during output; resend the same mock action request ID | Clear obsolete audio, safe retry and no duplicate action |
| B28 | Expire/revoke session while listening; attempt another tool call | Authorized termination; no continued private access |
| B29 | Mute replies during synthesis, then unmute on the next turn | No leaked queued audio; correct subsequent generation |
| B30 | After 15–20 minutes of scripted conversation, repeat B03/B11/B14/B23 | Context growth, thermal, latency and interruption regression |

Cross every shortlisted configuration with representative quiet/noise, speaker/headset and Wi-Fi/cellular conditions as described in [the protocol](05-benchmark-protocol.md). Optional later language cases: English/Hindi switching, regional names and Indian-number pronunciation. Language extension should not displace the agreed English-first acceptance.
