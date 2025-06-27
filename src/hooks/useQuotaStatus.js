import { useState, useEffect } from 'react';
import { quotaTracker } from '../services/youtubeApi';

/**
 * Hook to track YouTube API quota status
 * Updates automatically when quota changes
 */
export const useQuotaStatus = () => {
  const [quotaStatus, setQuotaStatus] = useState(() => quotaTracker.getQuotaStatus());
  const [timeUntilReset, setTimeUntilReset] = useState(() => quotaTracker.getFormattedTimeUntilReset());

  useEffect(() => {
    // Update quota status
    const updateStatus = () => {
      const status = quotaTracker.getQuotaStatus();
      const resetTime = quotaTracker.getFormattedTimeUntilReset();
      setQuotaStatus(status);
      setTimeUntilReset(resetTime);
    };

    // Initial update
    updateStatus();

    // Update every 30 seconds
    const interval = setInterval(updateStatus, 30000);

    // Listen for storage events (cross-tab updates)
    const handleStorageChange = (e) => {
      if (e.key === 'youtube_api_quota' || !e.key) {
        updateStatus();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return {
    ...quotaStatus,
    timeUntilReset,
    canSearch: quotaTracker.canMakeOperation('SEARCH'),
    canFetchDetails: quotaTracker.canMakeOperation('VIDEOS_LIST'),
    remainingSearches: quotaTracker.estimateRemainingOperations('SEARCH'),
    remainingDetailFetches: quotaTracker.estimateRemainingOperations('VIDEOS_LIST'),
  };
};

/**
 * Hook to check if a specific operation can be performed
 * @param {string} operationType - Type of operation (SEARCH, VIDEOS_LIST, etc.)
 */
export const useCanPerformOperation = (operationType) => {
  const [canPerform, setCanPerform] = useState(() => quotaTracker.canMakeOperation(operationType));

  useEffect(() => {
    const checkOperation = () => {
      setCanPerform(quotaTracker.canMakeOperation(operationType));
    };

    // Check every 10 seconds
    const interval = setInterval(checkOperation, 10000);

    // Listen for storage events
    const handleStorageChange = (e) => {
      if (e.key === 'youtube_api_quota' || !e.key) {
        checkOperation();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [operationType]);

  return canPerform;
};