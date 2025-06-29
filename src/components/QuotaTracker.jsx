import React, { useState, useEffect } from 'react';
import { quotaTracker } from '../services/youtubeApi';

const QuotaTracker = ({ className = '', compact = false }) => {
  const [quotaStatus, setQuotaStatus] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Initial load
    updateQuotaStatus();

    // Update every 30 seconds
    const interval = setInterval(updateQuotaStatus, 30000);

    // Listen for storage events to update when quota changes
    const handleStorageChange = (e) => {
      if (e.key === 'youtube_api_quota') {
        updateQuotaStatus();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const updateQuotaStatus = () => {
    try {
      const status = quotaTracker.getQuotaStatus();
      const timeUntilReset = quotaTracker.getFormattedTimeUntilReset();
      const usageByType = quotaTracker.getUsageByType();
      
      setQuotaStatus({
        ...status,
        timeUntilReset,
        usageByType,
      });
    } catch (error) {
      console.error('Failed to update quota status:', error);
      // Optionally set an error state to display to user
    }
  };

  if (!quotaStatus) return null;

  const { used, remaining, percentage, dailyLimit, timeUntilReset, usageByType } = quotaStatus;
  
  // Determine color based on usage
  const getColorClass = () => {
    if (percentage >= 90) return 'text-red-500 bg-red-50';
    if (percentage >= 75) return 'text-orange-500 bg-orange-50';
    if (percentage >= 50) return 'text-yellow-500 bg-yellow-50';
    return 'text-green-500 bg-green-50';
  };

  const getProgressBarColor = () => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Compact view for header/toolbar
  if (compact) {
    return (
      <div 
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${getColorClass()} bg-opacity-10 hover:bg-opacity-20 ${className}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
          />
        </svg>
        <span className="text-xs font-medium">
          {used.toLocaleString()} / {dailyLimit.toLocaleString()}
        </span>
        <div className="w-16 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${getProgressBarColor()}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        
        {/* Expanded details */}
        {isExpanded && (
          <div className="absolute top-full right-0 mt-2 w-80 bg-background-primary border border-border-divider rounded-lg shadow-lg p-4 z-50">
            <QuotaDetails quotaStatus={quotaStatus} onClose={() => setIsExpanded(false)} />
          </div>
        )}
      </div>
    );
  }

  // Full view
  return (
    <div className={`bg-background-primary border border-border-divider rounded-lg p-4 ${className}`}>
      <QuotaDetails quotaStatus={quotaStatus} />
    </div>
  );
};

const QuotaDetails = ({ quotaStatus, onClose }) => {
  const { used, remaining, percentage, dailyLimit, timeUntilReset, usageByType, operations } = quotaStatus;
  const recentOps = quotaTracker.getRecentOperations(5);

  const getColorClass = () => {
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 75) return 'text-orange-500';
    if (percentage >= 50) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getProgressBarColor = () => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
            />
          </svg>
          YouTube API Quota
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-text-secondary mb-1">
          <span>Used: {used.toLocaleString()} units</span>
          <span>Remaining: {remaining.toLocaleString()} units</span>
        </div>
        <div className="w-full h-2 bg-neutral-20 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${getProgressBarColor()}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className={`text-xs font-medium ${getColorClass()}`}>
            {percentage.toFixed(1)}% used
          </span>
          <span className="text-xs text-text-secondary">
            Resets in {timeUntilReset}
          </span>
        </div>
      </div>

      {/* Usage breakdown */}
      {Object.keys(usageByType).length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-text-primary mb-2">Usage by Operation</h4>
          <div className="space-y-1">
            {Object.entries(usageByType).map(([type, data]) => (
              <div key={type} className="flex justify-between text-xs">
                <span className="text-text-secondary">
                  {type.replace(/_/g, ' ').toLowerCase()} ({data.count}x)
                </span>
                <span className="font-medium text-text-primary">
                  {data.totalCost.toLocaleString()} units
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Remaining operations estimate */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-text-primary mb-2">Estimated Remaining Operations</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-text-secondary">Searches:</span>
            <span className="font-medium text-text-primary">
              {quotaTracker.estimateRemainingOperations('SEARCH')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Video details:</span>
            <span className="font-medium text-text-primary">
              {quotaTracker.estimateRemainingOperations('VIDEOS_LIST')}
            </span>
          </div>
        </div>
      </div>

      {/* Recent operations */}
      {recentOps.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-text-primary mb-2">Recent Operations</h4>
          <div className="space-y-1">
            {recentOps.map((op, index) => {
              const time = new Date(op.timestamp);
              const timeStr = time.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              });
              
              return (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-text-secondary">
                    {op.type.replace(/_/g, ' ').toLowerCase()} @ {timeStr}
                  </span>
                  <span className="font-medium text-text-primary">
                    -{op.cost} units
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Warning messages */}
      {percentage >= 75 && (
        <div className={`mt-4 p-2 rounded text-xs ${
          percentage >= 90 ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
        } bg-opacity-10`}>
          {percentage >= 90 ? (
            <p>⚠️ Quota nearly exhausted! Only {remaining} units remaining.</p>
          ) : (
            <p>⚠️ High quota usage. Consider reducing API calls.</p>
          )}
        </div>
      )}
    </>
  );
};

export default QuotaTracker;