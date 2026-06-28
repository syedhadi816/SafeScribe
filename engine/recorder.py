import sounddevice as sd
import numpy as np
import threading
from enum import Enum
from collections import deque


class RecorderState(Enum):
    IDLE = 0
    RECORDING = 1
    PAUSED = 2


# Record at 44100 Hz (many USB mics don't support 16k); resample to 16k for Whisper
RECORD_SAMPLERATE = 44100
WHISPER_SAMPLERATE = 16000


class AudioRecorder:
    def __init__(self, samplerate=RECORD_SAMPLERATE, channels=1, blocksize=1024):
        self.samplerate = samplerate
        self.channels = channels
        self.blocksize = blocksize

        self.state = RecorderState.IDLE
        self.state_lock = threading.Lock()

        # Audio buffering
        self.buffer = deque()
        self.buffer_frames = 0

        # Timing
        self.total_frames_recorded = 0
        self.last_chunk_start_time = None
        self.last_chunk_end_time = None

        self.stream = None

    def _callback(self, indata, frames, time, status):
        with self.state_lock:
            if self.state == RecorderState.RECORDING:
                self.buffer.append(indata.copy())
                self.buffer_frames += frames
                self.total_frames_recorded += frames

    def start(self):
        with self.state_lock:
            if self.state != RecorderState.IDLE:
                return
            self.state = RecorderState.RECORDING

        self.stream = sd.InputStream(
            samplerate=self.samplerate,
            channels=self.channels,
            blocksize=self.blocksize,
            callback=self._callback,
        )
        self.stream.start()

    def pause(self):
        with self.state_lock:
            if self.state == RecorderState.RECORDING:
                self.state = RecorderState.PAUSED

    def resume(self):
        with self.state_lock:
            if self.state == RecorderState.PAUSED:
                self.state = RecorderState.RECORDING

    def stop(self):
        with self.state_lock:
            self.state = RecorderState.IDLE

        if self.stream:
            self.stream.stop()
            self.stream.close()
            self.stream = None

    def pop_chunk(self, seconds=30):
        """
        Returns a numpy array of exactly `seconds` audio, or None.
        """
        frames_needed = int(seconds * self.samplerate)

        with self.state_lock:
            if self.buffer_frames < frames_needed:
                return None

            chunks = []
            frames_collected = 0
            start_frame = self.total_frames_recorded - self.buffer_frames

            while frames_collected < frames_needed:
                block = self.buffer[0]
                block_frames = len(block)

                take = min(block_frames, frames_needed - frames_collected)
                chunks.append(block[:take])

                if take < block_frames:
                    self.buffer[0] = block[take:]
                else:
                    self.buffer.popleft()

                frames_collected += take
                self.buffer_frames -= take

            audio = np.concatenate(chunks, axis=0)

            self.last_chunk_start_time = start_frame / self.samplerate
            self.last_chunk_end_time = (
                start_frame + frames_needed
            ) / self.samplerate

        return audio

    def pop_all(self):
        """
        Return all remaining buffered audio, or None.
        Used for graceful shutdown.
        """
        with self.state_lock:
            if self.buffer_frames == 0:
                return None

            chunks = list(self.buffer)
            self.buffer.clear()
            self.buffer_frames = 0

        return np.concatenate(chunks, axis=0)

    def last_chunk_times(self):
        return self.last_chunk_start_time, self.last_chunk_end_time
