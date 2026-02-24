import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { Meeting } from '../App';

interface PastMeetingsListProps {
  meetings: Meeting[];
  emailConfigured: boolean;
  onBack: () => void;
}

export function PastMeetingsList({ meetings, emailConfigured, onBack }: PastMeetingsListProps) {
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else if (isYesterday) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else {
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
  };

  const formatEmailedDate = (isoString: string) => {
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
    if (mins < 60) {
      return `${mins} min`;
    }
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  if (!emailConfigured) {
    return (
      <div className="screen-container bg-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-300 bg-white flex items-center gap-3">
          <button onClick={onBack} className="touch-target p-2 -ml-2" aria-label="Back">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-black">Past Meetings</h1>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Mail className="w-16 h-16 text-gray-400 mb-4" />
          <p className="text-gray-700 font-medium mb-2">Please set up email in Settings</p>
          <p className="text-sm text-gray-600">to export notes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-container bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-300 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="touch-target p-2 -ml-2" aria-label="Back">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-black">Past Meetings</h1>
            <p className="text-sm text-gray-600">{meetings.length} recordings</p>
            <p className="text-xs text-gray-500 mt-1">Meeting notes are not retained on this device.</p>
          </div>
        </div>
      </div>

      {/* Meetings List - static, scrollable, no click */}
      <div className="flex-1 overflow-y-auto touch-scroll">
        {meetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">🎙️</span>
            </div>
            <h3 className="text-lg text-black mb-2">No meetings yet</h3>
            <p className="text-sm text-gray-600">Start recording to see your meetings here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 bg-white">
            {meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="flex flex-col gap-1 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-black truncate font-medium">
                    {meeting.status === 'processing' ? 'Processing...' : (meeting.title || 'Untitled')}
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span>{formatDate(meeting.createdAt)}</span>
                  <span>•</span>
                  <span>{formatDuration(meeting.duration)}</span>
                </div>
                {meeting.status === 'processing' && (
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Will be emailed when ready</span>
                  </div>
                )}
                {meeting.emailed && meeting.emailedAt && (
                  <div className="mt-1 text-xs text-gray-600">
                    Delivered via email on {formatEmailedDate(meeting.emailedAt)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
