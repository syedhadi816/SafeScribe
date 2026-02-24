from recorder import AudioRecorder
import time

rec = AudioRecorder()

print("Starting recording for 15 seconds...")
rec.start()

for i in range(3):
    time.sleep(5)
    chunk = rec.pop_chunk(seconds=5)
    if chunk is not None:
        print(f"Chunk {i+1} length:", len(chunk))
    else:
        print(f"Chunk {i+1} not ready yet")

rec.stop()
print("Recording stopped")
