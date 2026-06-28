# Black Hat Arsenal – SafeScribe Submission Text

Copy the sections below into the Arsenal application form as needed.

---

## Tool Details (primary field for reviewers)

**Paragraph 1 — Security problem and why it belongs at Arsenal**

Meeting notes and voice data are routinely sent to third-party clouds and used for training or analytics; that’s unacceptable in government, healthcare, legal, and compliance-sensitive environments. SafeScribe is a local-first desk device that captures, transcribes, summarizes, and emails meeting notes as a PDF without sending audio or transcripts to any vendor or cloud. Only the user’s chosen email receives the final PDF; no account or subscription required. It’s a reference implementation for privacy-preserving meeting capture: all processing on-device, minimal threat surface, auditable stack (open source), and a clear threat model so security teams can validate what leaves the device.

**Paragraph 2 — Technical depth**

Tech stack: STT is faster-whisper (Whisper base, int8) on-device; summarization is Ollama (Gemma 2 2B) local; OS is Raspberry Pi OS 64-bit on Pi 5. Architecture: microphone → sounddevice; audio streamed in chunks, resampled to 16 kHz, transcribed by faster-whisper; transcript segmented with NLTK; Ollama runs extraction (actions, decisions, topics) and summary per segment; outputs merged to a single summary and PDF. Delivery: the device sends one outbound SMTP email (user’s own provider, e.g. Gmail/Outlook) with PDF attachment. Security model: no cloud STT or LLM; credentials (email + 16-char app password) stored only on device (SQLite or /etc/safescribe/env). Only the final PDF is transmitted, over the user’s SMTP. No telemetry or third-party APIs for meeting content. Open source: https://github.com/syedhadi816/SafeScribe, MIT.

---

## Optional Summary (for a separate “Summary” or “Use cases” field, if present)

SafeScribe is a dedicated desk device that captures, summarizes, and delivers meeting notes to your inbox as a PDF. No app, no cloud, no subscription. It also serves as an assistive technology for people who struggle with simultaneous listening and note-taking (e.g. ADHD, auditory processing disorder, hearing loss). Everything runs on Raspberry Pi–class hardware (~$180 build); processing is local and back-to-back meetings are supported without vendor lock-in or data leaving the device beyond the single PDF email you configure.
