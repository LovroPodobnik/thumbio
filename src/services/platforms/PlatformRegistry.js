/**
 * Platform Registry
 * 
 * Central registry for managing platform plugins.
 * Handles registration, discovery, and lifecycle of platform plugins.
 */
class PlatformRegistry {
  constructor() {
    this.platforms = new Map();
    this.listeners = new Set();
  }

  /**
   * Register a platform plugin
   * @param {PlatformPlugin} plugin - Platform plugin instance
   */
  register(plugin) {
    if (!plugin || typeof plugin.getConfig !== 'function') {
      throw new Error('Invalid plugin: must implement PlatformPlugin interface');
    }

    const config = plugin.getConfig();
    
    if (!config.id) {
      throw new Error('Plugin must have a valid ID');
    }

    if (this.platforms.has(config.id)) {
      console.warn(`Platform '${config.id}' is already registered. Overwriting...`);
    }

    this.platforms.set(config.id, plugin);
    this.notifyListeners('register', config.id, plugin);
    
    console.log(`[PlatformRegistry] Registered platform: ${config.name} (${config.id})`);
  }

  /**
   * Unregister a platform plugin
   * @param {string} platformId - Platform ID to unregister
   */
  unregister(platformId) {
    if (this.platforms.has(platformId)) {
      const plugin = this.platforms.get(platformId);
      this.platforms.delete(platformId);
      this.notifyListeners('unregister', platformId, plugin);
      console.log(`[PlatformRegistry] Unregistered platform: ${platformId}`);
      return true;
    }
    return false;
  }

  /**
   * Get a platform plugin by ID
   * @param {string} platformId - Platform ID
   * @returns {PlatformPlugin|null} Platform plugin or null if not found
   */
  get(platformId) {
    return this.platforms.get(platformId) || null;
  }

  /**
   * Get all registered platforms
   * @param {boolean} enabledOnly - Only return enabled platforms
   * @returns {Array} Array of platform plugins
   */
  getAll(enabledOnly = false) {
    const allPlatforms = Array.from(this.platforms.values());
    
    if (enabledOnly) {
      return allPlatforms.filter(platform => {
        const status = platform.getStatus();
        return status.ready;
      });
    }
    
    return allPlatforms;
  }

  /**
   * Get platforms grouped by category
   * @returns {Object} Platforms grouped by category
   */
  getByCategory() {
    const platforms = this.getAll(true);
    const categories = {
      video: [],
      social: [],
      other: []
    };

    platforms.forEach(platform => {
      const config = platform.getConfig();
      // Simple categorization - can be enhanced
      if (config.id === 'youtube') {
        categories.video.push(platform);
      } else if (['tiktok', 'instagram', 'twitter'].includes(config.id)) {
        categories.social.push(platform);
      } else {
        categories.other.push(platform);
      }
    });

    return categories;
  }

  /**
   * Get platform configurations for UI
   * @param {boolean} enabledOnly - Only return enabled platforms
   * @returns {Array} Array of platform configurations
   */
  getConfigs(enabledOnly = true) {
    return this.getAll(enabledOnly).map(platform => ({
      ...platform.getConfig(),
      status: platform.getStatus()
    }));
  }

  /**
   * Check if a platform is registered and enabled
   * @param {string} platformId - Platform ID
   * @returns {boolean} True if platform is available
   */
  isAvailable(platformId) {
    const platform = this.get(platformId);
    if (!platform) return false;
    
    const status = platform.getStatus();
    return status.ready;
  }

  /**
   * Get platform status report
   * @returns {Object} Status report for all platforms
   */
  getStatusReport() {
    const report = {
      total: this.platforms.size,
      enabled: 0,
      disabled: 0,
      errors: [],
      warnings: []
    };

    this.platforms.forEach((platform, id) => {
      const status = platform.getStatus();
      const config = platform.getConfig();
      
      if (status.ready) {
        report.enabled++;
      } else {
        report.disabled++;
      }

      if (status.errors.length > 0) {
        report.errors.push({
          platform: config.name,
          id,
          errors: status.errors
        });
      }

      if (status.warnings.length > 0) {
        report.warnings.push({
          platform: config.name,
          id,
          warnings: status.warnings
        });
      }
    });

    return report;
  }

  /**
   * Add listener for platform registry events
   * @param {Function} listener - Event listener function
   */
  addListener(listener) {
    this.listeners.add(listener);
  }

  /**
   * Remove listener
   * @param {Function} listener - Event listener function
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of registry events
   * @private
   */
  notifyListeners(event, platformId, plugin) {
    this.listeners.forEach(listener => {
      try {
        listener(event, platformId, plugin);
      } catch (error) {
        console.error('[PlatformRegistry] Listener error:', error);
      }
    });
  }

  /**
   * Clear all registered platforms
   */
  clear() {
    const platformIds = Array.from(this.platforms.keys());
    platformIds.forEach(id => this.unregister(id));
  }

  /**
   * Initialize with default platforms
   * @param {Array} defaultPlatforms - Array of platform plugin instances
   */
  initialize(defaultPlatforms = []) {
    this.clear();
    defaultPlatforms.forEach(platform => {
      try {
        this.register(platform);
      } catch (error) {
        console.error(`[PlatformRegistry] Failed to register platform:`, error);
      }
    });
  }
}

// Create singleton instance
const platformRegistry = new PlatformRegistry();

export default platformRegistry;
export { PlatformRegistry };