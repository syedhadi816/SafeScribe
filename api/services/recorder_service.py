"""Recorder service: AudioRecorder + WhisperSTT + summarizer."""
import os
import re
import threading
import time
import uuid
from datetime import datetime
from typing import Callable, Optional

from recorder import AudioRecorder
from stt import WhisperSTT
from summarizer import save_summary_as_pdf
from config import MEETINGS_DIR
from api.services import storage
from api.services.email_sender import send_meeting_pdf

TRANSCRIBE_CHUNK_SECONDS = 30
TRANSCRIBE_LOOP_SLEEP_SECONDS = 0.2


def _sanitize_filename(text: str) -> str:
    safe = re.sub(r"[^a-zA-Z0-9\s_-]", "", text)
    safe = re.sub(r"\s+", "_", safe).lower()
    return safe[:50]


class RecorderService:
    def __init__(self):
        self.recorder: Optional[AudioRecorder] = None
        self.stt: Optional[WhisperSTT] = None
        self.transcript_buffer: list = []
        self.running_flag: list = [False]
        self.transcribe_thread: Optional[threading.Thread] = None
        self.on_transcript_update: Optional[Callable[[str], None]] = None

    def _transcribe_loop(self) -> None:
        while self.running_flag[0] and self.recorder and self.stt:
            if self.recorder.state.name == "RECORDING":
                chunk = self.recorder.pop_chunk(seconds=TRANSCRIBE_CHUNK_SECONDS)
                if chunk is not None:
                    text = self.stt.transcribe(chunk, samplerate=self.recorder.samplerate)
                    text = text.strip()
                    if text:
                        self.transcript_buffer.append(text)
                        if self.on_transcript_update:
                            self.on_transcript_update("\n".join(self.transcript_buffer))
            time.sleep(TRANSCRIBE_LOOP_SLEEP_SECONDS)

    def start_recording(self) -> None:
        if self.recorder is None:
            self.recorder = AudioRecorder()
        if self.stt is None:
            self.stt = WhisperSTT()
        self.transcript_buffer = []
        self.running_flag[0] = True
        self.transcribe_thread = threading.Thread(target=self._transcribe_loop, daemon=True)
        self.transcribe_thread.start()
        self.recorder.start()

    def preload_whisper(self) -> None:
        """Load Whisper model in background so recording can start immediately on first use."""
        if self.stt is None:
            self.stt = WhisperSTT()

    def abort_recording(self) -> None:
        """Stop recording without processing. Use when start fails or to reset state."""
        self.running_flag[0] = False
        if self.recorder:
            self.recorder.stop()
        if self.transcribe_thread:
            self.transcribe_thread.join(timeout=2.0)
        self.transcribe_thread = None

    def pause_recording(self) -> None:
        if self.recorder:
            self.recorder.pause()

    def resume_recording(self) -> None:
        if self.recorder:
            self.recorder.resume()

    def _process_and_email(
        self,
        remaining: bytes | None,
        transcript_buffer_copy: list[str],
        samplerate: int,
        duration_seconds: int,
        job_id: str,
    ) -> None:
        """Background worker: transcribe, summarize, create meeting, email, delete files."""
        stt = self.stt
        if not stt:
            storage.delete_processing_job(job_id)
            return
        if remaining is not None:
            text = stt.transcribe(remaining, samplerate=samplerate)
            if text.strip():
                transcript_buffer_copy.append(text.strip())
        full_text = "\n".join(transcript_buffer_copy).strip()
        storage.delete_processing_job(job_id)
        if not full_text:
            return

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        meeting_id = f"meeting-{int(datetime.now().timestamp() * 1000)}"
        created_at = datetime.now().isoformat()
        transcript_path = os.path.join(MEETINGS_DIR, f"transcript_{timestamp}.txt")
        with open(transcript_path, "w", encoding="utf-8") as f:
            f.write(full_text)

        pdf_temp_path = os.path.join(MEETINGS_DIR, f"summary_{timestamp}.pdf")
        raw_result = save_summary_as_pdf(full_text, pdf_temp_path)
        if isinstance(raw_result, str):
            title = raw_result
            summary = ""
            action_items = []
            decisions = []
            topics = []
        else:
            title = raw_result.get("title", "")
            summary = raw_result.get("summary", "")
            action_items = raw_result.get("action_items", [])
            decisions = raw_result.get("decisions", [])
            topics = raw_result.get("topics", [])

        safe_title = _sanitize_filename(title)
        pdf_path = os.path.join(MEETINGS_DIR, f"summary_{safe_title}_{timestamp}.pdf")
        if pdf_temp_path != pdf_path:
            os.rename(pdf_temp_path, pdf_path)

        transcript_size = os.path.getsize(transcript_path) / (1024 * 1024)
        pdf_size = os.path.getsize(pdf_path) / (1024 * 1024)
        audio_size = duration_seconds * 0.01

        storage.create_meeting(
            meeting_id=meeting_id,
            created_at=created_at,
            duration=duration_seconds,
            title=title,
            transcript_path=transcript_path,
            pdf_path=pdf_path,
            transcript=full_text,
            summary=summary,
            action_items=action_items,
            decisions=decisions,
            topics=topics,
            audio_size_mb=audio_size,
            transcript_size_mb=transcript_size,
            pdf_size_mb=pdf_size,
        )

        # Auto-email and delete files after success
        email_addr = storage.get_setting("email_address")
        if email_addr and os.path.isfile(pdf_path):
            try:
                send_meeting_pdf(
                    title,
                    pdf_path,
                    email_addr,
                    meeting_created_at=created_at,
                    meeting_duration=duration_seconds,
                )
                emailed_at = datetime.now().isoformat()
                storage.update_meeting_emailed(meeting_id, True, emailed_at=emailed_at)
                storage.delete_meeting_files(meeting_id)
            except Exception:
                pass  # Keep files if email fails; user can retry from Past Meetings

    def stop_recording(self, duration_seconds: int) -> Optional[str]:
        """Stop recording and process in background. Returns job_id immediately."""
        if not self.recorder or not self.stt:
            return None
        self.running_flag[0] = False
        self.recorder.stop()
        if self.transcribe_thread:
            self.transcribe_thread.join(timeout=2.0)
        remaining = self.recorder.pop_all()
        transcript_buffer_copy = list(self.transcript_buffer)
        samplerate = self.recorder.samplerate if self.recorder else 16000

        job_id = f"job-{uuid.uuid4().hex[:12]}"
        created_at = datetime.now().isoformat()
        storage.create_processing_job(job_id, created_at, duration_seconds)

        thread = threading.Thread(
            target=self._process_and_email,
            args=(remaining, transcript_buffer_copy, samplerate, duration_seconds, job_id),
            daemon=True,
        )
        thread.start()
        return job_id

    @property
    def state(self) -> str:
        return self.recorder.state.name if self.recorder else "IDLE"

    def get_live_transcript(self) -> str:
        return "\n".join(self.transcript_buffer).strip()
