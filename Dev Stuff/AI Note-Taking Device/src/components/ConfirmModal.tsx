import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ message, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full animate-in zoom-in duration-200">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <h2 className="text-lg text-gray-800">Confirm Action</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-12 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800 rounded-xl transition-all touch-target"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-12 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl transition-all touch-target"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
