import { Loader2 } from 'lucide-react';

interface EmailWhenReadyScreenProps {
  onGotIt: () => void;
}

export function EmailWhenReadyScreen({ onGotIt }: EmailWhenReadyScreenProps) {
  return (
    <div className="screen-container bg-gray-100 flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-16 h-16 bg-white rounded-full mx-auto flex items-center justify-center shadow-lg border border-gray-200">
          <Loader2 className="w-8 h-8 text-gray-700 animate-spin" />
        </div>
        <div>
          <h2 className="text-xl text-black font-medium mb-2">Processing your meeting</h2>
          <p className="text-gray-600">
            We&apos;ll email it to you once it&apos;s ready.
          </p>
        </div>
        <button
          onClick={onGotIt}
          className="w-full h-14 bg-gray-800 hover:bg-gray-900 active:bg-black text-white rounded-xl shadow transition-all touch-target font-medium"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
