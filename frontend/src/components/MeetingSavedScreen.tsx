import { CheckCircle, Home, Send } from 'lucide-react';
import { Meeting } from '../App';

interface MeetingSavedScreenProps {
  meeting?: Meeting;
  onHome: () => void;
  onViewNotes: () => void;
  onUpdateMeeting: (meetingId: string, updates: Partial<Meeting>) => void;
}

export function MeetingSavedScreen({ meeting, onHome, onViewNotes }: MeetingSavedScreenProps) {
  if (!meeting) return null;

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins} min ${secs} sec`;
    }
    return `${secs} sec`;
  };

  return (
    <div className="screen-container bg-gray-100 flex flex-col items-center justify-center p-4 overflow-y-auto">
      <div className="text-center space-y-4 max-w-md w-full">
        {/* Success Icon */}
        <div className="relative mx-auto w-16 h-16">
          <CheckCircle className="w-16 h-16 text-green-600" strokeWidth={2} />
        </div>

        {/* Success Message */}
        <div className="space-y-1">
          <h2 className="text-xl text-black">Meeting Saved Successfully!</h2>
          <p className="text-sm text-gray-600">
            Your notes have been generated and saved to the device. You can export meeting notes now or later.
          </p>
        </div>

        {/* Meeting Info */}
        <div className="bg-white rounded-xl p-4 space-y-3 text-left shadow-sm border border-gray-200">
          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
            <span className="text-xs text-gray-600">Meeting Details</span>
          </div>
          
          <div className="space-y-2">
            {/* Static Title */}
            <div>
              <label className="text-xs text-gray-600 block mb-1">Meeting Title</label>
              <div className="text-sm text-black">
                {meeting.title || 'Untitled Meeting'}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between">
                <span className="text-xs text-gray-600">Date & Time</span>
                <span className="text-xs text-black">{formatDate(meeting.createdAt)}</span>
              </div>
            </div>
            
            <div className="flex justify-between">
              <span className="text-xs text-gray-600">Duration</span>
              <span className="text-xs text-black">{formatDuration(meeting.duration)}</span>
            </div>

            {meeting.emailed && (
              <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-xs text-green-700">Email sent successfully</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="w-full space-y-2">
          <button
            onClick={onViewNotes}
            className="w-full h-12 bg-gray-800 hover:bg-gray-900 active:bg-black text-white rounded-xl shadow transition-all touch-target flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            <span>Export Meeting</span>
          </button>

          <button
            onClick={onHome}
            className="w-full h-12 bg-white hover:bg-gray-50 active:bg-gray-100 text-black rounded-xl shadow transition-all touch-target flex items-center justify-center gap-2 border-2 border-gray-300"
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </button>
        </div>
      </div>
    </div>
  );
}