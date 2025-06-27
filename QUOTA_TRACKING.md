# YouTube API v3 Quota Tracking System

This document describes the quota tracking system implemented for monitoring YouTube API v3 usage.

## Overview

The YouTube API v3 has a default quota limit of 10,000 units per day. Different API operations consume different amounts of quota:

- **Search operations**: 100 units per request
- **Videos.list**: 1 unit per request
- **Channels.list**: 1 unit per request
- **PlaylistItems.list**: 1 unit per request

## Components

### 1. QuotaTracker Service (`src/services/quotaTracker.js`)

The core service that handles quota tracking logic:

- Tracks API usage with accurate quota costs
- Persists data in localStorage
- Resets daily at midnight Pacific Time
- Provides methods to check remaining quota
- Estimates remaining operations

Key methods:
- `trackOperation(type, details)` - Track an API operation
- `getQuotaStatus()` - Get current quota status
- `canMakeOperation(type)` - Check if operation can be performed
- `getFormattedTimeUntilReset()` - Get time until quota reset

### 2. QuotaTracker Component (`src/components/QuotaTracker.jsx`)

Visual component that displays quota status:

- Compact mode for toolbar display
- Full mode with detailed breakdown
- Color-coded warnings based on usage
- Real-time updates
- Shows recent operations
- Estimates remaining operations

### 3. QuotaWarning Component (`src/components/QuotaWarning.jsx`)

Contextual warning component:

- Shows warnings when quota is low
- Prevents operations when quota is insufficient
- Provides clear messaging about quota status
- Operation-specific warnings

### 4. useQuotaStatus Hook (`src/hooks/useQuotaStatus.js`)

React hook for easy quota tracking:

```javascript
const quotaStatus = useQuotaStatus();
// Returns: used, remaining, percentage, canSearch, etc.
```

## Integration

### In API Service

The quota tracker is integrated into `youtubeApi.js`:

```javascript
// Before API call
canMakeRequest('SEARCH');

// After API call
quotaTracker.trackOperation('SEARCH', { query, maxResults });
```

### In Components

Components can use the quota tracker to:

1. Display current quota status
2. Disable buttons when quota is insufficient
3. Show warnings before operations

Example:
```javascript
import QuotaWarning from '../QuotaWarning';
import { useQuotaStatus } from '../hooks/useQuotaStatus';

const MyComponent = () => {
  const quotaStatus = useQuotaStatus();
  
  return (
    <>
      <QuotaWarning operationType="SEARCH" />
      <button disabled={!quotaStatus.canSearch}>
        Search
      </button>
    </>
  );
};
```

## Visual Indicators

The quota tracker uses color coding:

- **Green** (0-50%): Normal usage
- **Yellow** (50-75%): Moderate usage
- **Orange** (75-90%): High usage
- **Red** (90-100%): Critical usage

## Testing

A demo component is available at `src/components/QuotaDemo.jsx` for testing quota tracking without making real API calls.

## Best Practices

1. Always check quota before expensive operations (searches)
2. Batch operations when possible
3. Cache results to avoid repeated API calls
4. Show clear warnings to users about quota limitations
5. Consider implementing request queuing for non-critical operations

## Quota Management Tips

1. **Search operations** are the most expensive (100 units each)
2. Fetching video/channel details is cheap (1 unit each)
3. The quota resets at midnight Pacific Time
4. Monitor usage patterns to optimize API calls
5. Consider implementing user-specific quota limits in production