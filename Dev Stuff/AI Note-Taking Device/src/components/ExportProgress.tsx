import { useState, useEffect } from 'react';
import { Usb, CheckCircle, Mail } from 'lucide-react';

interface ExportProgressProps {
  mode?: 'usb' | 'email';
}

export function ExportProgress({ mode = 'usb' }: ExportProgressProps) {
  const [progress, setProgress] = useState(0);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setComplete(true);
          return 100;
        }
        return prev + 5;
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  const isEmail = mode === 'email';

  return (
    <div className="screen-container bg-gray-100 flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-8 max-w-md">
        {/* Icon */}
        <div className="relative mx-auto w-24 h-24">
          {complete ? (
            <CheckCircle className="w-24 h-24 text-green-600" strokeWidth={2} />
          ) : (
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-200">
              {isEmail ? (
                <Mail className="w-12 h-12 text-gray-800" />
              ) : (
                <Usb className="w-12 h-12 text-gray-800" />
              )}
            </div>
          )}
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-2xl text-black">
            {complete 
              ? (isEmail ? 'Notes Sent!' : 'Export Complete!') 
              : (isEmail ? 'Sending Email...' : 'Exporting to USB...')
            }
          </h2>
          <p className="text-gray-600">
            {complete 
              ? (isEmail 
                  ? 'Meeting notes have been sent to your email' 
                  : 'Your meeting notes have been saved to the USB drive')
              : (isEmail 
                  ? 'Generating PDF and sending via email' 
                  : 'Generating PDFs and copying files to USB drive')
            }
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
          <div 
            className={`h-full transition-all duration-300 ${
              complete ? 'bg-green-500' : 'bg-gray-800'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Progress Percentage */}
        <div className="text-4xl tabular-nums text-black">
          {progress}%
        </div>

        {/* Warning or Success Message */}
        {!isEmail && (
          <>
            {complete ? (
              <div className="bg-green-100 border-2 border-green-300 rounded-2xl p-6">
                <div className="flex items-center gap-3 text-green-800">
                  <CheckCircle className="w-6 h-6 flex-shrink-0" />
                  <div className="text-left">
                    <p className="mb-1">Safe to remove USB drive</p>
                    <p className="text-sm text-green-700">
                      All files have been successfully transferred
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-100 border-2 border-yellow-300 rounded-2xl p-6">
                <div className="flex items-center gap-3 text-yellow-800">
                  <span className="text-2xl flex-shrink-0">⚠️</span>
                  <div className="text-left">
                    <p className="mb-1">Do not remove USB drive</p>
                    <p className="text-sm text-yellow-700">
                      Removing the drive now may corrupt your files
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}