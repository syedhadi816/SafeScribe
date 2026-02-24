import { ArrowLeft, Upload, Mail } from 'lucide-react';
import { Meeting } from '../App';

interface ExportMeetingsListProps {
  meetings: Meeting[];
  onBack: () => void;
  onExportUsb: () => void;
  onEmailAll: () => void;
}

export function ExportMeetingsList({ meetings, onBack, onExportUsb, onEmailAll }: ExportMeetingsListProps) {
  const unexportedMeetings = meetings.filter(m => !m.exportedUsb && !m.emailed);

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

  const getFilename = (meeting: Meeting) => {
    return `${meeting.title || 'Meeting'}.pdf`;
  };

  if (unexportedMeetings.length === 0) {
    return (
      <div className="screen-container bg-gray-100 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-300 bg-white">
          <div className="p-4 flex items-center gap-3">
            <button onClick={onBack} className="touch-target p-2 -ml-2" aria-label="Back">
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-black">Export Meetings</h1>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <p className="text-xl text-gray-700">No meetings to export</p>
            <p className="text-gray-600">All meetings have been exported</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-container bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-300 bg-white">
        <div className="p-4 flex items-center gap-3">
          <button onClick={onBack} className="touch-target p-2 -ml-2" aria-label="Back">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-black">Export Meetings</h1>
            <p className="text-sm text-gray-600">{unexportedMeetings.length} meeting{unexportedMeetings.length !== 1 ? 's' : ''} ready to export</p>
          </div>
        </div>
      </div>

      {/* Meeting List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {unexportedMeetings.map((meeting) => (
            <div 
              key={meeting.id}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
            >
              <div className="space-y-2">
                <div>
                  <h3 className="text-base text-black font-medium truncate">
                    {getFilename(meeting)}
                  </h3>
                  <p className="text-sm text-gray-600">{formatDate(meeting.createdAt)}</p>
                </div>
                
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                  <span className="text-gray-600">Duration</span>
                  <span className="text-black">{formatDuration(meeting.duration)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Size</span>
                  <span className="text-black">
                    {(meeting.audioSize + meeting.transcriptSize + meeting.pdfSize).toFixed(1)} MB
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 space-y-3 bg-white">
        <button
          onClick={onExportUsb}
          className="w-full h-14 bg-gray-800 hover:bg-gray-900 active:bg-black text-white rounded-xl shadow transition-all touch-target flex items-center justify-center gap-2"
        >
          <Upload className="w-5 h-5" />
          <span>Export to USB</span>
        </button>

        <button
          onClick={onEmailAll}
          className="w-full h-14 bg-gray-800 hover:bg-gray-900 active:bg-black text-white rounded-xl shadow transition-all touch-target flex items-center justify-center gap-2"
        >
          <Mail className="w-5 h-5" />
          <span>Send as Email</span>
        </button>
      </div>
    </div>
  );
}
