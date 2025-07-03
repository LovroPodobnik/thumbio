import { PlatformPlugin } from '../PlatformPlugin.js';
import { Music, TrendingUp, Users, Hash } from 'lucide-react';
import tiktokAPI from '../../tiktokApi.js';

/**
 * TikTok Platform Plugin (Example Structure)
 * 
 * This demonstrates how easy it is to add a new platform.
 * Simply implement the required methods and register the plugin.
 */
export class TikTokPlatform extends PlatformPlugin {
  constructor() {
    super({
      id: 'tiktok',
      name: 'TikTok',
      description: 'Import content from TikTok creators and trending videos',
      icon: Music,
      color: 'pink',
      gradient: 'from-pink-600 to-pink-500',
      hoverGradient: 'from-pink-500 to-pink-400',
      features: ['User Posts', 'Popular Content', 'Viral Analysis'],
      enabled: true // Enabled with RapidAPI integration
    });

    // Example popular TikTok creators
    this.popularCreators = [
      { handle: "@khaby.lame", name: "Khaby Lame", followers: "161M", category: "Comedy", avatar: "KL", trending: true, verified: true },
      { handle: "@charlidamelio", name: "Charli D'Amelio", followers: "151M", category: "Dance", avatar: "CD", trending: true, verified: true },
      { handle: "@bellapoarch", name: "Bella Poarch", followers: "93M", category: "Music", avatar: "BP", verified: true },
      { handle: "@addisonre", name: "Addison Rae", followers: "88M", category: "Dance", avatar: "AR", verified: true },
    ];
  }

  /**
   * Get available import methods for TikTok
   */
  getImportMethods() {
    return [
      {
        id: 'trending',
        name: 'Trending Content',
        description: 'Discover viral TikTok content and popular thumbnails',
        icon: TrendingUp,
        gradient: 'from-pink-600 to-pink-500',
        hoverGradient: 'from-pink-500 to-pink-400',
        primary: true,
        requiresSubscription: false
      },
      {
        id: 'quick',
        name: 'Quick Import',
        description: 'Import from popular TikTok creators',
        icon: Users,
        gradient: 'from-purple-600 to-purple-500',
        hoverGradient: 'from-purple-500 to-purple-400',
        primary: false,
        requiresSubscription: false
      },
      {
        id: 'url',
        name: 'Import from User',
        description: 'Import from any TikTok creator by username',
        icon: Hash,
        gradient: 'from-gray-800 to-gray-700',
        hoverGradient: 'from-gray-700 to-gray-600',
        primary: false,
        requiresSubscription: false
      }
    ];
  }

  /**
   * Get popular TikTok creators for quick import
   */
  getPopularChannels() {
    return this.popularCreators;
  }

  /**
   * Perform quick import from a popular TikTok creator
   */
  async quickImport(creatorHandle, creatorName, maxResults = 50) {
    try {
      console.log(`[TikTokPlatform] Quick import from ${creatorName} (${creatorHandle})`);
      
      const result = await tiktokAPI.quickImport(creatorHandle, creatorName, maxResults);
      
      return {
        videos: result.videos,
        channelInfo: {
          ...result.channelInfo,
          platform: this.id
        },
        metadata: {
          ...result.metadata,
          platform: this.id,
          method: 'quick',
          importedFrom: creatorName
        }
      };
    } catch (error) {
      console.error(`[TikTokPlatform] Quick import failed:`, error);
      throw new Error(`Failed to import from ${creatorName}: ${error.message}`);
    }
  }

  /**
   * Import content from TikTok URL/username
   */
  async importFromUrl(url, criteria = 'popular', count = 50) {
    try {
      console.log(`[TikTokPlatform] URL import from ${url} with criteria: ${criteria}`);
      
      const result = await tiktokAPI.importFromUrl(url, criteria, count);
      
      return {
        videos: result.videos,
        channelInfo: {
          ...result.channelInfo,
          platform: this.id
        },
        metadata: {
          ...result.metadata,
          platform: this.id,
          method: 'url'
        }
      };
    } catch (error) {
      console.error(`[TikTokPlatform] URL import failed:`, error);
      throw new Error(`TikTok import failed: ${error.message}`);
    }
  }

  /**
   * Import trending TikTok content
   */
  async importTrending(maxResults = 30) {
    try {
      console.log(`[TikTokPlatform] Trending import for ${maxResults} posts`);
      
      const result = await tiktokAPI.importTrending(maxResults);
      
      return {
        videos: result.videos,
        channelInfo: null, // No specific channel for trending
        metadata: {
          ...result.metadata,
          platform: this.id,
          method: 'trending'
        }
      };
    } catch (error) {
      console.error(`[TikTokPlatform] Trending import failed:`, error);
      throw new Error(`TikTok trending import failed: ${error.message}`);
    }
  }

  /**
   * Search TikTok content
   */
  async searchContent(query, count = 20, sortBy = 'relevance') {
    // TODO: Implement TikTok search
    throw new Error('TikTok search requires API implementation. Please add your TikTok API service first.');
  }

  /**
   * Validate and clean TikTok URL/username
   */
  validateUrl(url) {
    return tiktokAPI.validateAndExtractUsername(url);
  }

  /**
   * Transform TikTok data to universal format (delegated to API service)
   */
  transformData(rawData, metadata = {}) {
    // This transformation is now handled by the TikTok API service
    // to maintain consistency and reduce duplication
    return rawData;
  }

  /**
   * Calculate engagement rate for TikTok posts (delegated to API service)
   */
  calculateEngagement(post) {
    // Engagement calculation is now handled by the TikTok API service
    return post.engagement || 0;
  }

  /**
   * Check TikTok platform status
   */
  getStatus() {
    const apiStatus = tiktokAPI.getApiStatus();
    
    if (!apiStatus.configured) {
      return {
        ready: false,
        errors: ['TikTok API key not configured'],
        warnings: [
          'Add REACT_APP_TIKTOK_API_KEY to your .env file',
          'Get your API key from RapidAPI TikTok API subscription'
        ]
      };
    }

    return {
      ready: true,
      errors: [],
      warnings: []
    };
  }

  /**
   * Get TikTok-specific UI configurations
   */
  getUIComponents() {
    return {
      settingsPanel: {
        component: 'TikTokSettings',
        fields: [
          {
            id: 'apiKey',
            name: 'TikTok API Key',
            type: 'password',
            required: true,
            description: 'Your RapidAPI key for TikTok API access'
          },
          {
            id: 'defaultRegion',
            name: 'Default Region',
            type: 'select',
            options: ['US', 'UK', 'JP', 'KR', 'DE', 'FR'],
            default: 'US'
          }
        ]
      },
      customViews: [
        {
          id: 'hashtag-analytics',
          name: 'Hashtag Analytics',
          description: 'Analyze hashtag performance and trends'
        },
        {
          id: 'sound-trends',
          name: 'Sound Trends',
          description: 'Track trending sounds and music'
        }
      ],
      extraControls: [
        {
          id: 'includeMusic',
          name: 'Include Music Info',
          type: 'checkbox',
          default: true
        },
        {
          id: 'minViews',
          name: 'Minimum Views',
          type: 'number',
          min: 0,
          default: 1000
        }
      ]
    };
  }

  /**
   * Get supported import criteria options for TikTok
   */
  getImportCriteria() {
    return [
      {
        id: 'views',
        name: 'Views',
        description: 'Most viewed posts',
        icon: TrendingUp,
        color: 'pink'
      },
      {
        id: 'recent',
        name: 'Recent',
        description: 'Latest posts',
        icon: 'Clock',
        color: 'green'
      },
      {
        id: 'engagement',
        name: 'Engaging',
        description: 'High engagement rate',
        icon: 'Heart',
        color: 'red'
      }
    ];
  }

  /**
   * Get supported video count options
   */
  getCountOptions() {
    return [20, 30, 50];
  }
}

export default TikTokPlatform;