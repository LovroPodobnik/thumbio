/**
 * Base Platform Plugin Class
 * 
 * Defines the interface that all platform plugins must implement.
 * This ensures consistent behavior across different platforms (YouTube, TikTok, etc.)
 */
export class PlatformPlugin {
  constructor(config = {}) {
    this.id = config.id || 'unknown';
    this.name = config.name || 'Unknown Platform';
    this.description = config.description || '';
    this.icon = config.icon;
    this.color = config.color || 'gray';
    this.gradient = config.gradient || 'from-gray-600 to-gray-500';
    this.hoverGradient = config.hoverGradient || 'from-gray-500 to-gray-400';
    this.features = config.features || [];
    this.enabled = config.enabled !== false; // Default to enabled
  }

  /**
   * Get platform configuration
   * @returns {Object} Platform metadata
   */
  getConfig() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      icon: this.icon,
      color: this.color,
      gradient: this.gradient,
      hoverGradient: this.hoverGradient,
      features: this.features,
      enabled: this.enabled
    };
  }

  /**
   * Get available import methods for this platform
   * @returns {Array} Array of import method configurations
   */
  getImportMethods() {
    throw new Error('getImportMethods() must be implemented by platform plugin');
  }

  /**
   * Get popular channels/creators for quick import
   * @returns {Array} Array of popular channel configurations
   */
  getPopularChannels() {
    return [];
  }

  /**
   * Perform quick import from a popular channel
   * @param {string} channelHandle - Channel handle/ID
   * @param {string} channelName - Display name
   * @param {number} maxResults - Maximum number of results
   * @returns {Promise<Object>} Import result with videos and channelInfo
   */
  async quickImport(channelHandle, channelName, maxResults = 50) {
    throw new Error('quickImport() must be implemented by platform plugin');
  }

  /**
   * Import content from URL
   * @param {string} url - Platform URL
   * @param {string} criteria - Sort criteria ('views', 'recent', 'engagement')
   * @param {number} count - Number of items to import
   * @returns {Promise<Object>} Import result with videos and channelInfo
   */
  async importFromUrl(url, criteria = 'views', count = 50) {
    throw new Error('importFromUrl() must be implemented by platform plugin');
  }

  /**
   * Import trending content
   * @param {number} count - Number of items to import
   * @param {string} region - Region code
   * @returns {Promise<Object>} Import result with videos and metadata
   */
  async importTrending(count = 30, region = 'US') {
    throw new Error('importTrending() must be implemented by platform plugin');
  }

  /**
   * Search content
   * @param {string} query - Search query
   * @param {number} count - Number of results
   * @param {string} sortBy - Sort criteria
   * @returns {Promise<Array>} Search results
   */
  async searchContent(query, count = 20, sortBy = 'relevance') {
    throw new Error('searchContent() must be implemented by platform plugin');
  }

  /**
   * Validate and clean URL for this platform
   * @param {string} url - Raw URL input
   * @returns {string} Cleaned URL or throws error if invalid
   */
  validateUrl(url) {
    return url.trim();
  }

  /**
   * Transform platform-specific data to universal format
   * @param {Array} rawData - Platform-specific data
   * @param {Object} metadata - Additional metadata
   * @returns {Array} Normalized data compatible with canvas system
   */
  transformData(rawData, metadata = {}) {
    return rawData.map(item => ({
      ...item,
      platform: this.id,
      ...metadata
    }));
  }

  /**
   * Check if platform is properly configured and ready to use
   * @returns {Object} Status object with ready flag and any errors
   */
  getStatus() {
    return {
      ready: this.enabled,
      errors: this.enabled ? [] : ['Platform is disabled'],
      warnings: []
    };
  }

  /**
   * Get platform-specific UI components (optional)
   * @returns {Object} UI component configurations
   */
  getUIComponents() {
    return {
      settingsPanel: null,
      customViews: [],
      extraControls: []
    };
  }
}

export default PlatformPlugin;