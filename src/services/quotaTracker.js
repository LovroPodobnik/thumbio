// YouTube API v3 Quota Tracking Service
// Default quota: 10,000 units per day
// Quota costs per operation:
// - Search: 100 units
// - Videos.list: 1 unit
// - Channels.list: 1 unit
// - PlaylistItems.list: 1 unit

const QUOTA_CONFIG = {
  DAILY_LIMIT: 10000,
  COSTS: {
    SEARCH: 100,
    VIDEOS_LIST: 1,
    CHANNELS_LIST: 1,
    PLAYLIST_ITEMS_LIST: 1,
  },
  STORAGE_KEY: 'youtube_api_quota',
  RESET_HOUR: 0, // Pacific Time midnight
};

class QuotaTracker {
  constructor() {
    this.loadQuotaData();
  }

  loadQuotaData() {
    try {
      const stored = localStorage.getItem(QUOTA_CONFIG.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const lastReset = new Date(data.lastReset);
        const now = new Date();
        
        // Check if we need to reset (past midnight Pacific Time)
        if (this.shouldReset(lastReset, now)) {
          this.resetQuota();
        } else {
          this.quotaData = data;
        }
      } else {
        this.resetQuota();
      }
    } catch (error) {
      console.error('Error loading quota data:', error);
      this.resetQuota();
    }
  }

  shouldReset(lastReset, now) {
    // Convert to Pacific Time
    const pacificOffset = -8; // PST
    const lastResetPacific = new Date(lastReset.getTime() + (lastReset.getTimezoneOffset() + pacificOffset * 60) * 60000);
    const nowPacific = new Date(now.getTime() + (now.getTimezoneOffset() + pacificOffset * 60) * 60000);
    
    // Check if it's a new day in Pacific Time
    return nowPacific.toDateString() !== lastResetPacific.toDateString();
  }

  resetQuota() {
    this.quotaData = {
      used: 0,
      operations: [],
      lastReset: new Date().toISOString(),
      dailyLimit: QUOTA_CONFIG.DAILY_LIMIT,
    };
    this.saveQuotaData();
  }

  saveQuotaData() {
    try {
      localStorage.setItem(QUOTA_CONFIG.STORAGE_KEY, JSON.stringify(this.quotaData));
    } catch (error) {
      console.error('Error saving quota data:', error);
    }
  }

  trackOperation(type, details = {}) {
    this.loadQuotaData(); // Ensure we have the latest data
    
    const cost = QUOTA_CONFIG.COSTS[type] || 0;
    const operation = {
      type,
      cost,
      timestamp: new Date().toISOString(),
      details,
    };
    
    this.quotaData.used += cost;
    this.quotaData.operations.push(operation);
    
    // Keep only last 100 operations to prevent storage bloat
    if (this.quotaData.operations.length > 100) {
      this.quotaData.operations = this.quotaData.operations.slice(-100);
    }
    
    this.saveQuotaData();
    
    // Return quota status
    return {
      used: this.quotaData.used,
      remaining: this.quotaData.dailyLimit - this.quotaData.used,
      percentage: (this.quotaData.used / this.quotaData.dailyLimit) * 100,
      dailyLimit: this.quotaData.dailyLimit,
    };
  }

  getQuotaStatus() {
    this.loadQuotaData();
    
    return {
      used: this.quotaData.used,
      remaining: this.quotaData.dailyLimit - this.quotaData.used,
      percentage: (this.quotaData.used / this.quotaData.dailyLimit) * 100,
      dailyLimit: this.quotaData.dailyLimit,
      lastReset: this.quotaData.lastReset,
      operations: this.quotaData.operations,
    };
  }

  canMakeOperation(type) {
    const cost = QUOTA_CONFIG.COSTS[type] || 0;
    const status = this.getQuotaStatus();
    return status.remaining >= cost;
  }

  getOperationCost(type) {
    return QUOTA_CONFIG.COSTS[type] || 0;
  }

  getRecentOperations(limit = 10) {
    this.loadQuotaData();
    return this.quotaData.operations.slice(-limit).reverse();
  }

  // Get quota usage by operation type
  getUsageByType() {
    this.loadQuotaData();
    const usage = {};
    
    this.quotaData.operations.forEach(op => {
      if (!usage[op.type]) {
        usage[op.type] = { count: 0, totalCost: 0 };
      }
      usage[op.type].count++;
      usage[op.type].totalCost += op.cost;
    });
    
    return usage;
  }

  // Estimate how many operations of a type can still be performed
  estimateRemainingOperations(type) {
    const cost = QUOTA_CONFIG.COSTS[type] || 0;
    const status = this.getQuotaStatus();
    return cost > 0 ? Math.floor(status.remaining / cost) : Infinity;
  }

  // Get time until quota reset (in milliseconds)
  getTimeUntilReset() {
    const now = new Date();
    const pacificOffset = -8; // PST
    const nowPacific = new Date(now.getTime() + (now.getTimezoneOffset() + pacificOffset * 60) * 60000);
    
    // Calculate next midnight Pacific Time
    const tomorrow = new Date(nowPacific);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    return tomorrow.getTime() - nowPacific.getTime();
  }

  // Format time until reset as human-readable string
  getFormattedTimeUntilReset() {
    const ms = this.getTimeUntilReset();
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  // Export quota data for debugging or analysis
  exportQuotaData() {
    this.loadQuotaData();
    return JSON.parse(JSON.stringify(this.quotaData));
  }

  // Manually set quota limit (for testing or different API tiers)
  setDailyLimit(limit) {
    this.loadQuotaData();
    this.quotaData.dailyLimit = limit;
    this.saveQuotaData();
  }
}

// Create singleton instance
const quotaTracker = new QuotaTracker();

export default quotaTracker;
export { QUOTA_CONFIG };