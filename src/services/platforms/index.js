/**
 * Platform System Initialization
 * 
 * This file initializes the platform system and registers all available platforms.
 * To add a new platform, simply import it and add it to the platforms array.
 */

import platformRegistry from './PlatformRegistry.js';
import YouTubePlatform from './plugins/YouTubePlatform.js';
import TikTokPlatform from './plugins/TikTokPlatform.js';

// Import any additional platforms here
// import InstagramPlatform from './plugins/InstagramPlatform.js';
// import TwitterPlatform from './plugins/TwitterPlatform.js';

/**
 * Initialize the platform system with all available platforms
 */
export function initializePlatforms() {
  console.log('[PlatformSystem] Initializing platform system...');
  
  // Register all available platforms
  const platforms = [
    new YouTubePlatform(),
    new TikTokPlatform(),
    // Add new platforms here:
    // new InstagramPlatform(),
    // new TwitterPlatform(),
  ];
  
  // Initialize the registry with default platforms
  platformRegistry.initialize(platforms);
  
  const statusReport = platformRegistry.getStatusReport();
  console.log('[PlatformSystem] Platform initialization complete:', statusReport);
  
  return platformRegistry;
}

/**
 * Get the platform registry instance
 */
export function getPlatformRegistry() {
  return platformRegistry;
}

/**
 * Get all enabled platforms
 */
export function getEnabledPlatforms() {
  return platformRegistry.getAll(true);
}

/**
 * Get platform configurations for UI
 */
export function getPlatformConfigs() {
  return platformRegistry.getConfigs(true);
}

/**
 * Get a specific platform by ID
 */
export function getPlatform(platformId) {
  return platformRegistry.get(platformId);
}

/**
 * Check if a platform is available
 */
export function isPlatformAvailable(platformId) {
  return platformRegistry.isAvailable(platformId);
}

/**
 * Add a new platform at runtime
 */
export function addPlatform(platform) {
  platformRegistry.register(platform);
}

/**
 * Remove a platform at runtime
 */
export function removePlatform(platformId) {
  return platformRegistry.unregister(platformId);
}

/**
 * Get platform system status
 */
export function getPlatformSystemStatus() {
  return platformRegistry.getStatusReport();
}

// Auto-initialize when module is imported
let initialized = false;

export function ensureInitialized() {
  if (!initialized) {
    initializePlatforms();
    initialized = true;
  }
  return platformRegistry;
}

// Export the registry and key classes for advanced usage
export { PlatformPlugin } from './PlatformPlugin.js';
export { PlatformRegistry } from './PlatformRegistry.js';
export { default as platformRegistry } from './PlatformRegistry.js';

export default {
  initialize: initializePlatforms,
  registry: platformRegistry,
  getEnabledPlatforms,
  getPlatformConfigs,
  getPlatform,
  isPlatformAvailable,
  addPlatform,
  removePlatform,
  getStatus: getPlatformSystemStatus,
  ensureInitialized
};