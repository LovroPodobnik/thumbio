import { PlatformPlugin } from '../PlatformPlugin.js';
import { fetchBestPerformingVideos, fetchChannelVideos, searchVideos, getSearchSuggestions } from '../../youtubeApi.js';
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
      },
      {
        id: 'trending',
        name: 'Trending Content',
        description: 'Import currently trending videos',
        icon: TrendingUp,
        gradient: 'from-orange-600 to-orange-500',
        hoverGradient: 'from-orange-500 to-orange-400',
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
   * Import trending YouTube content
   */
  async importTrending(count = 30, region = 'US') {
    try {
      console.log(`[YouTubePlatform] Importing trending content (${count} videos)`);
      
      // Use popular search terms to simulate trending content
      const trendingQueries = [
        'trending',
        'viral',
        'popular today',
        'trending videos',
        'viral videos 2024'
      ];
      
      // Pick a random trending query for variety
      const randomQuery = trendingQueries[Math.floor(Math.random() * trendingQueries.length)];
      const videos = await searchVideos(randomQuery, count, 'views');
      
      // Transform data
      const transformedVideos = this.transformData(videos, {
        importSource: 'trending',
        importedFrom: 'YouTube Trending',
        region: region
      });
      
      console.log(`[YouTubePlatform] Successfully imported ${transformedVideos.length} trending videos`);
      
      return {
        videos: transformedVideos,
        channelInfo: {
          title: 'YouTube Trending',
          description: `Trending videos in ${region}`,
          platform: this.id
        },
        metadata: {
          platform: this.id,
          method: 'trending',
          region: region,
          query: randomQuery,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error(`[YouTubePlatform] Trending import failed:`, error);
      throw new Error(`Failed to import trending content: ${error.message}`);
    }
  }

  /**
   * Search YouTube content
   */
  async searchContent(query, count = 20, sortBy = 'relevance') {
    try {
      console.log(`[YouTubePlatform] Searching for: "${query}" (${count} results, sorted by ${sortBy})`);
      
      if (!query || query.trim().length === 0) {
        throw new Error('Search query cannot be empty');
      }
      
      const videos = await searchVideos(query.trim(), count, sortBy);
      
      // Transform data
      const transformedVideos = this.transformData(videos, {
        importSource: 'search',
        searchQuery: query,
        sortCriteria: sortBy,
        importedFrom: 'YouTube Search'
      });
      
      console.log(`[YouTubePlatform] Successfully found ${transformedVideos.length} videos for query: "${query}"`);
      
      return {
        videos: transformedVideos,
        channelInfo: {
          title: `Search: "${query}"`,
          description: `YouTube search results for "${query}"`,
          platform: this.id
        },
        metadata: {
          platform: this.id,
          method: 'search',
          query: query,
          sortBy: sortBy,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error(`[YouTubePlatform] Search failed:`, error);
      throw new Error(`Failed to search YouTube: ${error.message}`);
    }
  }

  /**
   * Validate and clean YouTube URL
   */
  validateUrl(url) {
    const cleanUrl = url.trim();
    
    // Check for video URLs and provide helpful error
    const videoId = this.extractVideoId(cleanUrl);
    if (videoId) {
      throw new Error('Video URLs are not directly supported. Please use the channel URL instead (e.g., youtube.com/@channelname)');
    }
    
    // Try to extract channel identifier
    const channelIdentifier = this.extractChannelIdentifier(cleanUrl);
    if (channelIdentifier) {
      return channelIdentifier;
    }
    
    // If it's not a full URL, assume it's a channel handle or name
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

  /**
   * Get search suggestions for YouTube
   */
  async getSearchSuggestions(query) {
    try {
      if (!query || query.length < 2) {
        return [];
      }
      
      const suggestions = await getSearchSuggestions(query);
      return suggestions.slice(0, 8); // Limit to 8 suggestions
    } catch (error) {
      console.warn(`[YouTubePlatform] Failed to get search suggestions:`, error);
      return [];
    }
  }

  /**
   * Validate YouTube video ID format
   */
  isValidVideoId(videoId) {
    return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
  }

  /**
   * Extract video ID from YouTube URL
   */
  extractVideoId(url) {
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    return videoIdMatch ? videoIdMatch[1] : null;
  }

  /**
   * Extract channel handle or ID from YouTube URL
   */
  extractChannelIdentifier(url) {
    // Handle @username format
    const handleMatch = url.match(/youtube\.com\/@([a-zA-Z0-9_-]+)/);
    if (handleMatch) return `@${handleMatch[1]}`;
    
    // Handle channel ID format
    const channelIdMatch = url.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/);
    if (channelIdMatch) return channelIdMatch[1];
    
    // Handle custom URL format
    const customUrlMatch = url.match(/youtube\.com\/c\/([a-zA-Z0-9_-]+)/);
    if (customUrlMatch) return customUrlMatch[1];
    
    // Handle user format (legacy)
    const userMatch = url.match(/youtube\.com\/user\/([a-zA-Z0-9_-]+)/);
    if (userMatch) return userMatch[1];
    
    return null;
  }
}

export default YouTubePlatform;