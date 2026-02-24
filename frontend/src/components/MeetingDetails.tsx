import { ArrowLeft, Trash2, Mail } from 'lucide-react';
import { Meeting } from '../App';

interface MeetingDetailsProps {
  meeting?: Meeting;
  onBack: () => void;
  onDelete: () => void;
  onUpdateMeeting: (meetingId: string, updates: Partial<Meeting>) => void;
  onEmail: () => void;
}

export function MeetingDetails({ meeting, onBack, onDelete, onEmail }: MeetingDetailsProps) {
  if (!meeting) {
    return (
      <div className="screen-container bg-gray-100 flex items-center justify-center p-8">
        <p className="text-gray-600">Meeting not found</p>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins} min ${secs} sec`;
    }
    return `${secs} sec`;
  };

  const totalSize = (meeting.audioSize + meeting.transcriptSize + meeting.pdfSize).toFixed(1);
  const filename = `${meeting.title || 'Meeting'}.pdf`;

  return (
    <div className="screen-container bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-300 bg-white">
        <div className="p-4 flex items-center gap-3">
          <button onClick={onBack} className="touch-target p-2 -ml-2" aria-label="Back">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-black truncate">Export Meeting</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-md mx-auto space-y-4">
          {/* Meeting File Info */}
          <div className="bg-white rounded-xl p-6 space-y-4 shadow-sm border border-gray-200">
            <div>
              <label className="text-xs text-gray-600 block mb-1">Filename</label>
              <div className="text-base text-black font-medium">{filename}</div>
            </div>

            <div className="pt-2 border-t border-gray-200 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Length</span>
                <span className="text-sm text-black">{formatDuration(meeting.duration)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Size</span>
                <span className="text-sm text-black">{totalSize} MB</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 space-y-3 bg-white">
        {!meeting.emailed && (
          <button
            onClick={onEmail}
            className="w-full h-14 bg-gray-800 hover:bg-gray-900 active:bg-black text-white rounded-xl shadow transition-all touch-target flex items-center justify-center gap-2"
          >
            <Mail className="w-5 h-5" />
            <span>Send as Email</span>
          </button>
        )}
        {meeting.emailed && meeting.emailedAt && (
          <p className="text-sm text-gray-600 py-2">
            Delivered via email on {new Date(meeting.emailedAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
          </p>
        )}

        <button
          onClick={onDelete}
          className="w-full h-14 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 rounded-xl transition-all touch-target flex items-center justify-center gap-2"
        >
          <Trash2 className="w-5 h-5" />
          <span>Delete Meeting</span>
        </button>
      </div>
    </div>
  );
}