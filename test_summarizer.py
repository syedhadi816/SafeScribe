import time
from pathlib import Path
from summarizer import save_summary_as_pdf

TRANSCRIPT_PATH = Path("transcript.txt")
OUTPUT_PDF = Path("testing.pdf")


def main():
    if not TRANSCRIPT_PATH.exists():
        raise FileNotFoundError(f"{TRANSCRIPT_PATH} not found")

    transcript = TRANSCRIPT_PATH.read_text(encoding="utf-8")

    start = time.perf_counter()
    meeting_title = save_summary_as_pdf(
        transcript,
        OUTPUT_PDF.name,
    )
    elapsed = time.perf_counter() - start

    print(f"Summary PDF saved to: {OUTPUT_PDF.resolve()}")
    print(f"Detected meeting title: {meeting_title}")
    print(f"Total seconds: {elapsed:.1f}")


if __name__ == "__main__":
    main()
