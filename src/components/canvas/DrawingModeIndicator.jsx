import React from 'react';

const DrawingModeIndicator = ({ onClose }) => {
  return (
    <div className="fixed top-4 right-20 z-50 bg-blue-600 text-white px-3 py-2 rounded-md shadow-lg flex items-center gap-2 pointer-events-auto animate-pulse">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
      <span className="text-xs font-medium">Drawing</span>
      <button
        onClick={onClose}
        className="text-white hover:text-gray-200 transition-colors ml-1"
        title="Exit drawing mode (P)"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default DrawingModeIndicator;