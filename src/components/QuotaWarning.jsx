import React from 'react';
import { useQuotaStatus } from '../hooks/useQuotaStatus';

const QuotaWarning = ({ operationType = 'SEARCH', className = '' }) => {
  const quotaStatus = useQuotaStatus();
  
  const operationCosts = {
    SEARCH: { cost: 100, name: 'Search' },
    VIDEOS_LIST: { cost: 1, name: 'Video Details' },
    CHANNELS_LIST: { cost: 1, name: 'Channel Info' },
    PLAYLIST_ITEMS_LIST: { cost: 1, name: 'Playlist Items' },
  };
  
  const operation = operationCosts[operationType] || { cost: 0, name: 'Unknown' };
  const canPerform = quotaStatus.remaining >= operation.cost;
  const percentageUsed = quotaStatus.percentage;
  
  // Don't show warning if plenty of quota remains
  if (percentageUsed < 50 && canPerform) return null;
  
  const getWarningLevel = () => {
    if (!canPerform) return 'error';
    if (percentageUsed >= 90) return 'critical';
    if (percentageUsed >= 75) return 'warning';
    return 'info';
  };
  
  const warningLevel = getWarningLevel();
  
  const warningStyles = {
    error: 'bg-red-50 border-red-200 text-red-700',
    critical: 'bg-orange-50 border-orange-200 text-orange-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  };
  
  const iconColors = {
    error: 'text-red-500',
    critical: 'text-orange-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
  };
  
  return (
    <div className={`p-3 rounded-lg border ${warningStyles[warningLevel]} ${className}`}>
      <div className="flex items-start gap-2">
        <svg className={`w-5 h-5 ${iconColors[warningLevel]} flex-shrink-0 mt-0.5`} fill="currentColor" viewBox="0 0 20 20">
          {warningLevel === 'error' ? (
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          ) : (
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          )}
        </svg>
        
        <div className="flex-1 text-sm">
          {!canPerform ? (
            <div>
              <p className="font-medium">Insufficient quota for {operation.name}</p>
              <p className="mt-1">
                This operation requires {operation.cost} units, but you only have {quotaStatus.remaining} units remaining.
              </p>
              <p className="mt-1 text-xs opacity-75">
                Quota resets in {quotaStatus.timeUntilReset}
              </p>
            </div>
          ) : (
            <div>
              <p className="font-medium">
                {percentageUsed >= 90 ? 'Critical' : 'High'} quota usage: {percentageUsed.toFixed(0)}%
              </p>
              <p className="mt-1">
                {quotaStatus.remaining} units remaining. {operation.name} requires {operation.cost} units.
              </p>
              {percentageUsed >= 75 && (
                <p className="mt-1 text-xs opacity-75">
                  Consider reducing API usage. Resets in {quotaStatus.timeUntilReset}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Mini progress bar */}
      <div className="mt-2 w-full h-1 bg-white bg-opacity-50 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${
            warningLevel === 'error' ? 'bg-red-500' :
            warningLevel === 'critical' ? 'bg-orange-500' :
            warningLevel === 'warning' ? 'bg-yellow-500' :
            'bg-blue-500'
          }`}
          style={{ width: `${Math.min(percentageUsed, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default QuotaWarning;