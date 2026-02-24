import { Settings } from 'lucide-react';
import newLogo from 'figma:asset/947525770134ebc88f41e3c99a39691b864e6b35.png';

interface HomeScreenProps {
  storageUsedMB: number;
  storageTotalMB: number;
  wifiConnected: boolean;
  onStartRecording: () => void;
  onPastMeetings: () => void;
  onSettings: () => void;
}

export function HomeScreen({
  onStartRecording,
  onPastMeetings,
  onSettings,
}: HomeScreenProps) {
  return (
    <div className="screen-container bg-gray-100 flex items-stretch justify-between p-8 gap-8">
      {/* Left: large main buttons */}
      <div className="flex-1 flex flex-col gap-6 max-w-md">
        <button
          onClick={onStartRecording}
          className="w-full h-32 bg-gray-800 hover:bg-gray-900 active:bg-black text-white rounded-2xl shadow-lg transition-all touch-target text-3xl font-medium"
        >
          Start Listening
        </button>
        <button
          onClick={onPastMeetings}
          className="w-full h-32 bg-gray-800 hover:bg-gray-900 active:bg-black text-white rounded-2xl shadow-lg transition-all touch-target text-3xl font-medium"
        >
          Past Meetings
        </button>
      </div>

      {/* Right: logo + small buttons */}
      <div className="flex-shrink-0 flex flex-col items-center gap-4 w-64">
        <img src={newLogo} alt="SafeScribe" className="w-full h-32 object-contain" />
        <button
          onClick={onSettings}
          className="flex items-center justify-center gap-2 w-full h-12 px-4 rounded-xl border-2 border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 touch-target text-gray-700 font-medium text-sm"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
          Settings
        </button>
      </div>
    </div>
  );
}