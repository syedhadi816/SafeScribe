from faster_whisper import WhisperModel

def transcribe_mp3(mp3_path: str, output_txt: str = "transcript.txt") -> str:
    """Transcribe an MP3 file using Whisper and save to txt."""
    print("Loading Whisper model...")
    model = WhisperModel("small", compute_type="int8")
    print("Transcribing...")
    
    segments, _ = model.transcribe(mp3_path)
    transcript = " ".join(s.text for s in segments)
    
    with open(output_txt, 'w', encoding='utf-8') as f:
        f.write(transcript)
    
    print(f"Transcript saved to {output_txt}")
    return transcript

# Usage
if __name__ == "__main__":
    mp3_file = "sample_meeting_audio.mp3"
    text = transcribe_mp3(mp3_file)
