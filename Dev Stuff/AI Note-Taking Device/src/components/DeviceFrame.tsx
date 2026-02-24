interface DeviceFrameProps {
  children: React.ReactNode;
}

export function DeviceFrame({ children }: DeviceFrameProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
      {/* Device Frame */}
      <div className="relative">
        {/* Phone Body */}
        <div className="bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
          {/* Screen */}
          <div className="bg-white rounded-[2.5rem] overflow-hidden" style={{ width: '480px', height: '800px' }}>
            {children}
          </div>
        </div>

        {/* Power Button */}
        <div className="absolute -right-2 top-32 w-1 h-16 bg-gray-800 rounded-l-md" />
        
        {/* Volume Buttons */}
        <div className="absolute -left-2 top-32 w-1 h-12 bg-gray-800 rounded-r-md" />
        <div className="absolute -left-2 top-48 w-1 h-12 bg-gray-800 rounded-r-md" />

        {/* Label */}
        <div className="absolute -bottom-12 left-0 right-0 text-center">
          <p className="text-sm text-gray-600">4-inch Touchscreen (480×800)</p>
        </div>
      </div>
    </div>
  );
}
