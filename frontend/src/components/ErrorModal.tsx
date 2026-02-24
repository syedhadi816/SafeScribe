import { X, AlertCircle } from 'lucide-react';

interface ErrorModalProps {
  message: string;
  onClose: () => void;
}

export function ErrorModal({ message, onClose }: ErrorModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full animate-in zoom-in duration-200">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-lg text-gray-800">Error</h2>
          </div>
          <button onClick={onClose} className="touch-target p-2 -mr-2" aria-label="Close">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full h-12 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl transition-all touch-target"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
