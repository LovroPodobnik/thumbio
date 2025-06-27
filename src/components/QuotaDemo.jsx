import React, { useState } from 'react';
import { quotaTracker } from '../services/youtubeApi';
import QuotaTracker from './QuotaTracker';

const QuotaDemo = () => {
  const [showDemo, setShowDemo] = useState(false);

  const simulateApiCall = (type) => {
    const status = quotaTracker.trackOperation(type, {
      demo: true,
      timestamp: new Date().toISOString()
    });
    
    // Force re-render
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'youtube_api_quota',
      newValue: localStorage.getItem('youtube_api_quota'),
      url: window.location.href
    }));
    
    alert(`${type} operation completed. Quota used: ${status.used}/${status.dailyLimit}`);
  };

  const resetQuota = () => {
    quotaTracker.resetQuota();
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'youtube_api_quota',
      newValue: localStorage.getItem('youtube_api_quota'),
      url: window.location.href
    }));
    alert('Quota has been reset');
  };

  if (!showDemo) {
    return (
      <button
        onClick={() => setShowDemo(true)}
        className="fixed bottom-4 right-4 bg-background-brand text-text-on-brand px-4 py-2 rounded-lg shadow-lg hover:bg-background-brand-hover transition-colors z-50"
      >
        Show Quota Demo
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background-primary rounded-lg shadow-xl p-6 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-primary">YouTube API Quota Demo</h2>
          <button
            onClick={() => setShowDemo(false)}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Quota Tracker Component */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-text-primary mb-3">Quota Tracker Component</h3>
          <QuotaTracker />
        </div>

        {/* Simulate API Operations */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-text-primary mb-3">Simulate API Operations</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => simulateApiCall('SEARCH')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Search Videos (100 units)
            </button>
            <button
              onClick={() => simulateApiCall('VIDEOS_LIST')}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              Get Video Details (1 unit)
            </button>
            <button
              onClick={() => simulateApiCall('CHANNELS_LIST')}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
            >
              Get Channel Info (1 unit)
            </button>
            <button
              onClick={() => simulateApiCall('PLAYLIST_ITEMS_LIST')}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
            >
              Get Playlist Items (1 unit)
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-border-divider">
          <button
            onClick={resetQuota}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Reset Quota (Testing Only)
          </button>
          <div className="text-sm text-text-secondary">
            <p>Quota resets daily at midnight Pacific Time</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotaDemo;