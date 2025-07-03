import { PlatformPlugin } from '../PlatformPlugin.js';
import { fetchBestPerformingVideos, fetchChannelVideos } from '../../youtubeApi.js';
import { Play, TrendingUp, Link } from 'lucide-react';

/**
 * YouTube Platform Plugin
 * 
 * Implements YouTube-specific functionality for content import
 */
export class YouTubePlatform extends PlatformPlugin {
  constructor() {
    super({
      id: 'youtube',
      name: 'YouTube',
      description: 'Import thumbnails from YouTube channels and videos',
      icon: Play,
      color: 'red',
      gradient: 'from-red-600 to-red-500',
      hoverGradient: 'from-red-500 to-red-400',
      features: ['Quick Import', 'URL Import', 'Best Performers'],
      enabled: true
    });

    // YouTube popular channels data
    this.popularChannels = [
      { handle: "@MrBeast", name: "MrBeast", subscribers: "329M", subscriberCount: 329000000, category: "Entertainment", avatar: "MB", trending: true, verified: true },
      { handle: "@PewDiePie", name: "PewDiePie", subscribers: "111M", subscriberCount: 111000000, category: "Gaming", avatar: "PD", verified: true },
      { handle: "@MarkRober", name: "Mark Rober", subscribers: "25M", subscriberCount: 25000000, category: "Science", avatar: "MR", verified: true },
      { handle: "@MKBHD", name: "Marques Brownlee", subscribers: "21M", subscriberCount: 21000000, category: "Tech", avatar: "MK", verified: true },
      { handle: "@kurzgesagt", name: "Kurzgesagt", subscribers: "23M", subscriberCount: 23000000, category: "Education", avatar: "KG", verified: true },
      { handle: "@Veritasium", name: "Veritasium", subscribers: "15M", subscriberCount: 15000000, category: "Education", avatar: "VT", verified: true },
      { handle: "@LinusTechTips", name: "Linus Tech Tips", subscribers: "16M", subscriberCount: 16000000, category: "Tech", avatar: "LT", verified: true },
      { handle: "@DudePerfect", name: "Dude Perfect", subscribers: "60M", subscriberCount: 60000000, category: "Entertainment", avatar: "DP", trending: true, verified: true },
    ];
  }

  /**
   * Get available import methods for YouTube
   */
  getImportMethods() {
    return [
      {
        id: 'quick',
        name: 'Quick Import',
        description: 'Import from popular YouTube creators',
        icon: TrendingUp,
        gradient: 'from-red-600 to-red-500',
        hoverGradient: 'from-red-500 to-red-400',
        primary: true
      },
      {
        id: 'url',
        name: 'Import from URL',
        description: 'Paste YouTube video or channel links',
        icon: Link,
        gradient: 'from-gray-800 to-gray-700',
        hoverGradient: 'from-gray-700 to-gray-600',
        primary: false
      }
    ];
  }

  /**
   * Get popular YouTube channels for quick import
   */
  getPopularChannels() {
    return this.popularChannels;
  }

  /**
   * Perform quick import from a popular YouTube channel
   */
  async quickImport(channelHandle, channelName, maxResults = 50) {
    try {
      console.log(`[YouTubePlatform] Quick importing from ${channelName} (${channelHandle})`);
      
      const result = await fetchBestPerformingVideos(channelHandle, maxResults);
      const { videos, channelInfo } = result;
      
      // Transform data to include platform info
      const transformedVideos = this.transformData(videos, {
        importSource: 'quick',
        importedFrom: channelName
      });
      
      const transformedChannelInfo = {
        ...channelInfo,
        platform: this.id
      };
      
      console.log(`[YouTubePlatform] Successfully imported ${transformedVideos.length} videos`);
      
      return {
        videos: transformedVideos,
        channelInfo: transformedChannelInfo,
        metadata: {
          platform: this.id,
          method: 'quick',
          source: channelHandle,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error(`[YouTubePlatform] Quick import failed:`, error);
      throw new Error(`Failed to import from ${channelName}: ${error.message}`);
    }
  }

  /**
   * Import content from YouTube URL
   */
  async importFromUrl(url, criteria = 'views', count = 50) {
    try {
      console.log(`[YouTubePlatform] Importing from URL: ${url} (${criteria})`);
      
      const cleanUrl = this.validateUrl(url);
      
      // Map UI criteria to API parameters
      const sortByMapping = {
        'views': 'views',
        'recent': 'recency', 
        'engagement': 'engagement'
      };
      
      let result;
      
      if (criteria === 'views') {
        // Use sophisticated algorithm for view-based imports
        result = await fetchBestPerformingVideos(cleanUrl, count);
      } else {
        // Use standard fetch with sorting
        const sortBy = sortByMapping[criteria];
        result = await fetchChannelVideos(cleanUrl, count, sortBy);
      }
      
      const { videos, channelInfo } = result;
      
      // Transform data
      const transformedVideos = this.transformData(videos, {
        importSource: 'url',
        importCriteria: criteria,
        importedFrom: cleanUrl
      });
      
      const transformedChannelInfo = {
        ...channelInfo,
        platform: this.id
      };
      
      console.log(`[YouTubePlatform] Successfully imported ${transformedVideos.length} videos from URL`);
      
      return {
        videos: transformedVideos,
        channelInfo: transformedChannelInfo,
        metadata: {
          platform: this.id,
          method: 'url',
          criteria: criteria,
          source: cleanUrl,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error(`[YouTubePlatform] URL import failed:`, error);
      throw new Error(`Failed to import from URL: ${error.message}`);
    }
  }

  /**
   * Import trending YouTube content (not implemented yet)
   */
  async importTrending(count = 30, region = 'US') {
    throw new Error('Trending import is not yet implemented for YouTube');
  }

  /**
   * Search YouTube content (not implemented yet)
   */
  async searchContent(query, count = 20, sortBy = 'relevance') {
    throw new Error('Content search is not yet implemented for YouTube');
  }

  /**
   * Validate and clean YouTube URL
   */
  validateUrl(url) {
    const cleanUrl = url.trim();
    
    // Check for video URLs and provide helpful error
    if (cleanUrl.includes('watch?v=') || cleanUrl.includes('youtu.be/')) {
      const videoIdMatch = cleanUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
      if (videoIdMatch) {
        throw new Error('Video URLs are not directly supported. Please use the channel URL instead (e.g., youtube.com/@channelname)');
      }
    }
    
    return cleanUrl;
  }

  /**
   * Transform YouTube data to universal format
   */
  transformData(rawData, metadata = {}) {
    return rawData.map(video => ({
      ...video,
      platform: this.id,
      ...metadata
    }));
  }

  /**
   * Check YouTube platform status
   */
  getStatus() {
    // Check if YouTube API is available
    try {
      // Basic check - could be enhanced with actual API health check
      const hasYouTubeAPI = typeof fetchBestPerformingVideos === 'function';
      
      if (!hasYouTubeAPI) {
        return {
          ready: false,
          errors: ['YouTube API functions not available'],
          warnings: []
        };
      }
      
      return {
        ready: true,
        errors: [],
        warnings: []
      };
    } catch (error) {
      return {
        ready: false,
        errors: [`YouTube platform error: ${error.message}`],
        warnings: []
      };
    }
  }

  /**
   * Get YouTube-specific UI configurations
   */
  getUIComponents() {
    return {
      settingsPanel: null, // Could add YouTube API key settings
      customViews: [
        {
          id: 'analytics',
          name: 'YouTube Analytics',
          description: 'View detailed YouTube metrics'
        }
      ],
      extraControls: [
        {
          id: 'quality',
          name: 'Video Quality',
          type: 'select',
          options: ['any', 'hd', '4k'],
          default: 'any'
        }
      ]
    };
  }

  /**
   * Get supported import criteria options
   */
  getImportCriteria() {
    return [
      {
        id: 'views',
        name: 'Views',
        description: 'Sort by view count',
        icon: TrendingUp,
        color: 'blue'
      },
      {
        id: 'recent',
        name: 'Recent',
        description: 'Sort by upload date',
        icon: 'Clock',
        color: 'green'
      },
      {
        id: 'engagement',
        name: 'Engaging',
        description: 'Sort by engagement rate',
        icon: 'Heart',
        color: 'red'
      }
    ];
  }

  /**
   * Get supported video count options
   */
  getCountOptions() {
    return [25, 50, 75];
  }
}

export default YouTubePlatform;