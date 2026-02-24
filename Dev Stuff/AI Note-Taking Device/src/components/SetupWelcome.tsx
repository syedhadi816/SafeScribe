import logo from 'figma:asset/947525770134ebc88f41e3c99a39691b864e6b35.png';

interface SetupWelcomeProps {
  onNext: () => void;
}

export function SetupWelcome({ onNext }: SetupWelcomeProps) {
  return (
    <div className="screen-container bg-gray-100 flex items-center justify-center p-8">
      <div className="w-full max-w-4xl flex items-center gap-12">
        {/* Left: Logo */}
        <div className="flex-shrink-0 w-96 h-48 flex items-center justify-center">
          <img src={logo} alt="SafeScribe" className="w-full h-full object-contain" />
        </div>

        {/* Right: Content */}
        <div className="flex-1 space-y-6">
          {/* Features List */}
          <div className="bg-white border border-gray-300 rounded-2xl p-6 space-y-4 text-left shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✓</span>
              <div>
                <h3 className="text-lg text-black">AI-Generated Notes</h3>
                <p className="text-sm text-gray-600">Summaries, action items, and key decisions</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">✓</span>
              <div>
                <h3 className="text-lg text-black">Privacy First</h3>
                <p className="text-sm text-gray-600">All processing happens locally on device</p>
              </div>
            </div>
          </div>

          {/* Get Started Button */}
          <button
            onClick={onNext}
            className="w-full max-w-sm h-16 bg-gray-800 hover:bg-gray-900 active:bg-black text-white rounded-xl shadow-lg transition-all touch-target"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}