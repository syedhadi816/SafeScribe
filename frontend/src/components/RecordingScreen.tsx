import { useState, useEffect } from 'react';
import { Square, Pause, Play } from 'lucide-react';

interface RecordingScreenProps {
  startTime: number;
  isPaused: boolean;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  storageUsedMB: number;
  storageTotalMB: number;
  onStorageWarning: () => void;
}

export function RecordingScreen({
  startTime,
  isPaused,
  onStop,
  onPause,
  onResume,
  storageUsedMB,
  storageTotalMB,
  onStorageWarning,
}: RecordingScreenProps) {
  const [elapsed, setElapsed] = useState(0);
  const [warningShown, setWarningShown] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused) {
        setElapsed(Date.now() - startTime);

        // Check storage
        const availableMB = storageTotalMB - storageUsedMB;
        if (availableMB < 500 && !warningShown) {
          onStorageWarning();
          setWarningShown(true);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused, startTime, storageUsedMB, storageTotalMB, warningShown, onStorageWarning]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="screen-container bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="px-6 py-3 border-b border-gray-300 bg-white">
        <div className="flex items-center justify-center gap-3">
          {!isPaused && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full" />
              <span className="text-green-700 font-medium">RECORDING</span>
            </div>
          )}
          {isPaused && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full" />
              <span className="text-yellow-600 font-medium">PAUSED</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Horizontal Layout for Landscape */}
      <div className="flex-1 flex items-center justify-between px-8 py-6 gap-8">
        {/* Left: Timer and Status */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          {/* Timer */}
          <div className="text-center">
            <div className="text-6xl text-black tabular-nums mb-2">
              {formatTime(elapsed)}
            </div>
            <p className="text-sm text-gray-600">Recording Duration</p>
          </div>

          {/* Status Message */}
          <div className="text-center text-gray-700">
            {isPaused ? (
              <p>Recording paused. Press Resume to continue.</p>
            ) : (
              <p>Capturing audio and transcribing in real-time...</p>
            )}
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex-shrink-0 w-64 space-y-3">
          <button
            onClick={onStop}
            className="w-full h-16 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl shadow-lg transition-colors touch-target flex items-center justify-center gap-3"
          >
            <Square className="w-6 h-6" fill="currentColor" />
            <span className="text-lg">Stop Recording</span>
          </button>

          <button
            onClick={isPaused ? onResume : onPause}
            className="w-full h-14 bg-white hover:bg-gray-50 active:bg-gray-100 text-black rounded-xl shadow transition-colors touch-target flex items-center justify-center gap-3 border-2 border-gray-300"
          >
            {isPaused ? (
              <>
                <Play className="w-5 h-5" fill="currentColor" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <Pause className="w-5 h-5" fill="currentColor" />
                <span>Pause</span>
              </>
            )}
          </button>
          
          <div className="pt-2 text-xs text-center text-gray-600">
            💡 Place device near speakers for best audio quality
          </div>
        </div>
      </div>
    </div>
  );
}