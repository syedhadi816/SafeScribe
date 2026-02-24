import { Loader2 } from 'lucide-react';

export function ProcessingScreen() {
  return (
    <div className="screen-container bg-gray-100 flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-8">
        {/* Animated Icon */}
        <div className="relative">
          <div className="w-24 h-24 bg-white rounded-full mx-auto flex items-center justify-center shadow-lg border border-gray-200">
            <Loader2 className="w-12 h-12 text-gray-800 animate-spin" />
          </div>
          <div className="absolute inset-0 w-24 h-24 mx-auto">
            <div className="w-full h-full rounded-full border-4 border-gray-300 border-t-gray-800 animate-spin" 
                 style={{ animationDuration: '2s' }} />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-3">
          <h2 className="text-2xl text-black">Processing Meeting...</h2>
          <p className="text-gray-600 max-w-xs mx-auto leading-relaxed">
            Generating your AI-powered meeting notes with summaries, action items, and key decisions
          </p>
        </div>

        {/* Processing Steps */}
        <div className="bg-white border border-gray-300 rounded-2xl p-6 space-y-4 text-left max-w-sm mx-auto shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs">✓</span>
            </div>
            <span className="text-sm text-gray-700">Audio saved</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs">✓</span>
            </div>
            <span className="text-sm text-gray-700">Transcription complete</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            </div>
            <span className="text-sm text-gray-700">Analyzing content with AI...</span>
          </div>
          <div className="flex items-center gap-3 opacity-50">
            <div className="w-6 h-6 bg-gray-300 rounded-full flex-shrink-0" />
            <span className="text-sm text-gray-500">Generating PDF</span>
          </div>
        </div>

        {/* Estimated Time */}
        <p className="text-sm text-gray-500">
          This usually takes 30-60 seconds
        </p>
      </div>
    </div>
  );
}