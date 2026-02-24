"""
SafeScribe - AI notetaking desk device.
GUI-only: starts the API server. Use run.py or: python main.py --gui
Legacy CLI mode: python main.py --cli (for development).
"""
import argparse
import threading
import time
import re
from datetime import datetime


def main_cli():
    """Convert text into a filesystem-safe name."""
    # Remove invalid characters, replace spaces with underscores, lowercase
    safe = re.sub(r"[^a-zA-Z0-9\s_-]", "", text)
    safe = re.sub(r"\s+", "_", safe).lower()
    return safe[:50]  # Cap at 50 chars


def transcribe_loop(recorder: AudioRecorder, stt: WhisperSTT, transcript_buffer: list, running_flag: list):
    """
    Background loop that pulls audio chunks from the recorder and
    appends transcribed text to transcript_buffer while running_flag[0] is True.
    """
    while running_flag[0]:
        if recorder.state.name == "RECORDING":
            chunk = recorder.pop_chunk(seconds=TRANSCRIBE_CHUNK_SECONDS)
            if chunk is not None:
                text = stt.transcribe(chunk)
                text = text.strip()
                if text:
                    transcript_buffer.append(text)
        time.sleep(TRANSCRIBE_LOOP_SLEEP_SECONDS)


def save_transcript_and_summary(transcript_lines: list) -> None:
    """
    Save the raw transcript and a structured summary (as PDF) to timestamped files.
    """
    full_text = "\n".join(transcript_lines).strip()
    if not full_text:
        print("No transcript captured; nothing to save.")
        return

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    transcript_filename = f"transcript_{timestamp}.txt"

    # Save raw transcript
    with open(transcript_filename, "w", encoding="utf-8") as f:
        f.write(full_text)
    print(f"Transcript saved to {transcript_filename}")

    # Generate and save structured summary as PDF
    print("Generating summary with Gemma2...")
    
    meeting_title = save_summary_as_pdf(full_text, f"summary_{timestamp}.pdf")
    
    # Optionally rename the PDF with the meeting title for easier browsing
    safe_title = sanitize_filename(meeting_title)
    final_pdf_name = f"summary_{safe_title}_{timestamp}.pdf"
    
    import os
    os.rename(f"summary_{timestamp}.pdf", final_pdf_name)
    
    print(f"Summary saved to {final_pdf_name}")


def main() -> None:
    recorder = AudioRecorder()
    stt = WhisperSTT()

    running_flag = [True]
    transcript_buffer: list[str] = []

    # Start background transcription thread
    thread = threading.Thread(
        target=transcribe_loop,
        args=(recorder, stt, transcript_buffer, running_flag),
        daemon=True,
    )
    thread.start()

    print("Commands: start | pause | resume | stop | quit")

    try:
        while True:
            cmd = input("> ").strip().lower()

            if cmd == "start":
                recorder.start()
                print("Recording started.")

            elif cmd == "pause":
                recorder.pause()
                print("Recording paused.")

            elif cmd == "resume":
                recorder.resume()
                print("Recording resumed.")

            elif cmd == "stop":
                recorder.stop()
                print("Recording stopped.")

            elif cmd == "quit":
                running_flag[0] = False
                recorder.stop()
                break

            else:
                print("Unknown command. Use: start | pause | resume | stop | quit")

    except KeyboardInterrupt:
        print("\nInterrupted by user. Stopping...")
        running_flag[0] = False
        recorder.stop()

    # Ensure the background thread exits
    thread.join(timeout=1.0)

    # Drain remaining audio (graceful shutdown)
    remaining_audio = recorder.pop_all()
    if remaining_audio is not None:
        text = stt.transcribe(remaining_audio)
        text = text.strip()
        if text:
            transcript_buffer.append(text)

    # Persist transcript and summary
    save_transcript_and_summary(transcript_buffer)


if __name__ == "__main__":
    main()
