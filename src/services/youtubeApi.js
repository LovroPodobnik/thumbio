// YouTube Media Downloader API Service (RapidAPI)
import quotaTracker from './quotaTracker';

const RAPIDAPI_KEY = process.env.REACT_APP_YOUTUBE_API_KEY; // Updated to use the correct env var
const BASE_URL = 'https://youtube-media-downloader.p.rapidapi.com';

// Check if RapidAPI key is configured
if (!RAPIDAPI_KEY || RAPIDAPI_KEY === 'your_rapidapi_key_here') {
  console.error('[YouTube API] Error: RapidAPI key is not configured. Please add REACT_APP_YOUTUBE_API_KEY to your .env file');
}

// Debug flag - set to false in production
const DEBUG = process.env.NODE_ENV !== 'production';

// Conditional logger
const logger = {
  log: (...args) => DEBUG && console.log(...args),
  warn: (...args) => DEBUG && console.warn(...args),
  error: (...args) => console.error(...args), // Always log errors
  debug: (...args) => DEBUG && console.debug(...args)
};

// API usage tracking for safety
const API_USAGE = {
  requests: 0,
  lastReset: Date.now(),
  maxRequestsPerHour: 100, // Conservative limit
  maxRequestsPerDay: 1000
};

// Reset counters if needed
const resetUsageIfNeeded = () => {
  const now = Date.now();
  const hoursPassed = (now - API_USAGE.lastReset) / (1000 * 60 * 60);
  
  if (hoursPassed >= 24) {
    API_USAGE.requests = 0;
    API_USAGE.lastReset = now;
  }
};

// Check if we can make a request with quota checking
const canMakeRequest = (operationType = 'SEARCH') => {
  resetUsageIfNeeded();
  
  const now = Date.now();
  const hoursPassed = (now - API_USAGE.lastReset) / (1000 * 60 * 60);
  const requestsPerHour = API_USAGE.requests / Math.max(hoursPassed, 1);
  
  if (requestsPerHour >= API_USAGE.maxRequestsPerHour) {
    throw new Error('API rate limit exceeded. Please wait before making more requests.');
  }
  
  if (API_USAGE.requests >= API_USAGE.maxRequestsPerDay) {
    throw new Error('Daily API quota exceeded. Please try again tomorrow.');
  }
  
  if (!RAPIDAPI_KEY) {
    throw new Error('RapidAPI key is not configured. Please add REACT_APP_YOUTUBE_API_KEY to your environment variables.');
  }
  
  return true;
};

// Track API request
const trackRequest = () => {
  API_USAGE.requests++;
  logger.log(`[API Safety] Request #${API_USAGE.requests} made. Rate: ${(API_USAGE.requests / Math.max((Date.now() - API_USAGE.lastReset) / (1000 * 60 * 60), 1)).toFixed(1)} req/hour`);
};

// Common headers for all requests
const getHeaders = () => ({
  'x-rapidapi-key': RAPIDAPI_KEY,
  'x-rapidapi-host': 'youtube-media-downloader.p.rapidapi.com'
});

// Make API request with error handling
const makeRequest = async (endpoint, params = {}) => {
  canMakeRequest();
  trackRequest();
  
  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });
  
  logger.log('[YouTube API] Request URL:', url.toString());
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders()
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    logger.error('[YouTube API] Error response:', errorText);
    throw new Error(`YouTube API request failed: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  logger.log('[YouTube API] Response data:', data);
  
  if (!data.status || (data.errorId && data.errorId !== 'Success')) {
    throw new Error(`YouTube API error: ${data.errorId || 'Unknown error'}`);
  }
  
  return data;
};

/**
 * Get detailed video information by video ID
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object>} Video details
 */
export const getVideoDetails = async (videoId) => {
  logger.log('[YouTube API] Getting video details for:', videoId);
  
  try {
    const data = await makeRequest('/v2/video/details', {
      videoId,
      urlAccess: 'normal',
      videos: 'auto',
      audios: 'auto'
    });
    
    return formatVideoDetailsData(data);
  } catch (error) {
    logger.error('[YouTube API] Error getting video details:', error);
    throw error;
  }
};

/**
 * Search for YouTube videos
 * @param {string} query - Search query
 * @param {number} maxResults - Maximum number of results (default: 20)
 * @param {string} sortBy - Sort criteria: 'views', 'likes', 'comments', 'recency', 'engagement', 'relevance'
 * @returns {Promise<Array>} Array of video data
 */
export const searchVideos = async (query, maxResults = 20, sortBy = 'relevance') => {
  logger.log('[YouTube API] Starting search with query:', query);
  
  try {
    // Map sortBy to YouTube API parameters
    let apiSortBy = 'relevance';
    switch (sortBy) {
      case 'views':
        apiSortBy = 'viewCount';
        break;
      case 'recency':
        apiSortBy = 'date';
        break;
      case 'relevance':
      default:
        apiSortBy = 'relevance';
        break;
    }
    
    const data = await makeRequest('/v2/search/videos', {
      keyword: query,
      uploadDate: 'all',
      duration: 'all',
      sortBy: apiSortBy
    });
    
    if (!data.items || data.items.length === 0) {
      logger.warn('[YouTube API] No items returned from search');
      return [];
    }
    
    // Get detailed information for each video
    const videoDetailsPromises = data.items.slice(0, maxResults).map(async (item) => {
      try {
        return await getVideoDetails(item.id);
      } catch (error) {
        logger.warn(`[YouTube API] Failed to get details for video ${item.id}:`, error.message);
        return formatSearchItemData(item);
      }
    });
    
    const videoDetails = await Promise.all(videoDetailsPromises);
    
    // Sort videos based on the specified criteria (client-side sorting)
    const sortedVideos = sortVideos(videoDetails.filter(v => v), sortBy);
    logger.log('[YouTube API] Videos sorted by:', sortBy);
    logger.log('[YouTube API] Final sorted videos:', sortedVideos);
    
    return sortedVideos;
  } catch (error) {
    logger.error('[YouTube API] Error searching videos:', error);
    throw error;
  }
};

/**
 * Search for YouTube channels
 * @param {string} query - Search query
 * @param {number} maxResults - Maximum number of results
 * @returns {Promise<Array>} Array of channel data
 */
export const searchChannels = async (query, maxResults = 10) => {
  logger.log('[YouTube API] Searching channels with query:', query);
  
  try {
    const data = await makeRequest('/v2/search/channels', {
      keyword: query,
      sortBy: 'relevance'
    });
    
    if (!data.items || data.items.length === 0) {
      logger.warn('[YouTube API] No channels found');
      return [];
    }
    
    return data.items.slice(0, maxResults).map(formatChannelSearchData);
  } catch (error) {
    logger.error('[YouTube API] Error searching channels:', error);
    throw error;
  }
};

/**
 * Get detailed channel information
 * @param {string} channelId - YouTube channel ID
 * @returns {Promise<Object>} Channel details
 */
export const getChannelDetails = async (channelId) => {
  logger.log('[YouTube API] Getting channel details for:', channelId);
  
  try {
    const data = await makeRequest('/v2/channel/details', {
      channelId
    });
    
    return formatChannelDetailsData(data);
  } catch (error) {
    logger.error('[YouTube API] Error getting channel details:', error);
    throw error;
  }
};

/**
 * Fetch videos from a specific channel
 * @param {string} channelInput - YouTube channel ID
 * @param {number} maxResults - Maximum number of results
 * @param {string} sortBy - Sort criteria: 'views', 'likes', 'comments', 'recency', 'engagement', 'relevance'
 * @returns {Promise<Array>} Array of video data
 */
export const fetchChannelVideos = async (channelInput, maxResults = 20, sortBy = 'relevance') => {
  logger.log('[YouTube API] Fetching channel videos for:', channelInput);
  
  try {
    // First, try to get channel details to validate the channel
    let channelId = channelInput;
    let channelInfo = null;
    
    // If input looks like a channel ID, use it directly
    if (channelInput.startsWith('UC') && channelInput.length === 24) {
      try {
        channelInfo = await getChannelDetails(channelInput);
        channelId = channelInput;
      } catch (error) {
        logger.warn('[YouTube API] Invalid channel ID, trying search:', error.message);
        throw new Error(`Channel not found: ${channelInput}`);
      }
    } else {
      // Search for the channel first
      const channels = await searchChannels(channelInput, 1);
      if (channels.length === 0) {
        throw new Error(`No channels found for: ${channelInput}`);
      }
      
      const bestMatch = channels[0];
      channelId = bestMatch.id;
      channelInfo = await getChannelDetails(channelId);
    }
    
    // For now, we'll search for videos from this channel using the channel name
    // The YouTube Media Downloader API doesn't have a direct channel videos endpoint
    const channelName = channelInfo.name;
    const searchQuery = `channel:${channelName}`;
    
    logger.log(`[YouTube API] Searching for videos from channel: ${channelName}`);
    
    const videos = await searchVideos(searchQuery, maxResults, sortBy);
    
    logger.log(`[YouTube API] Successfully fetched ${videos.length} videos from ${channelName}`);
    
    return {
      videos,
      channelInfo: {
        id: channelId,
        title: channelInfo.name,
        description: channelInfo.description,
        subscriberCount: channelInfo.subscriberCount,
        videoCount: channelInfo.videoCount,
        confidence: 'high'
      }
    };
  } catch (error) {
    logger.error('[YouTube API] Error fetching channel videos:', error);
    throw error;
  }
};

/**
 * Get search suggestions
 * @param {string} query - Partial search query
 * @returns {Promise<Array>} Array of suggestion strings
 */
export const getSearchSuggestions = async (query) => {
  if (!query || query.length < 2) return [];
  
  try {
    const data = await makeRequest('/v2/search/suggestions', {
      keyword: query
    });
    
    return data.items || [];
  } catch (error) {
    logger.warn('[YouTube API] Error getting search suggestions:', error);
    return [];
  }
};

/**
 * Format video details data from the API response
 * @param {Object} data - Raw API response
 * @returns {Object} Formatted video data
 */
const formatVideoDetailsData = (data) => {
  const publishedAt = new Date(data.publishedTime);
  const daysAgo = Math.floor((Date.now() - publishedAt) / (1000 * 60 * 60 * 24));
  
  // Get the best thumbnail URL
  const thumbnailUrl = data.thumbnails?.[0]?.url || '';
  const secureThumbnailUrl = thumbnailUrl ? thumbnailUrl.replace('http://', 'https://') : null;
  
  return {
    id: data.id,
    title: data.title,
    channelName: data.channel?.name || 'Unknown Channel',
    channelId: data.channel?.id || '',
    thumbnail: secureThumbnailUrl,
    thumbnails: data.thumbnails || [],
    publishedAt: data.publishedTime,
    duration: formatDuration(data.lengthSeconds),
    metrics: {
      viewCount: parseInt(data.viewCount || '0'),
      likeCount: parseInt(data.likeCount || '0'),
      commentCount: parseCommentCount(data.commentCountText),
      publishedDaysAgo: daysAgo
    },
    // Default position (will be updated when added to canvas)
    x: 100,
    y: 100
  };
};

/**
 * Format search item data (fallback when detailed data is not available)
 * @param {Object} item - Search result item
 * @returns {Object} Formatted video data
 */
const formatSearchItemData = (item) => {
  const daysAgo = 0; // Unknown, so default to recent
  
  // Get the best thumbnail URL
  const thumbnailUrl = item.thumbnails?.[0]?.url || '';
  const secureThumbnailUrl = thumbnailUrl ? thumbnailUrl.replace('http://', 'https://') : null;
  
  return {
    id: item.id,
    title: item.title,
    channelName: item.channel?.name || 'Unknown Channel',
    channelId: item.channel?.id || '',
    thumbnail: secureThumbnailUrl,
    thumbnails: item.thumbnails || [],
    publishedAt: item.publishedTimeText || 'Unknown',
    duration: item.lengthText || '0:00',
    metrics: {
      viewCount: parseViewCount(item.viewCountText),
      likeCount: 0, // Not available in search results
      commentCount: 0, // Not available in search results
      publishedDaysAgo: daysAgo
    },
    // Default position (will be updated when added to canvas)
    x: 100,
    y: 100
  };
};

/**
 * Format channel search data
 * @param {Object} item - Channel search result
 * @returns {Object} Formatted channel data
 */
const formatChannelSearchData = (item) => {
  return {
    id: item.id,
    title: item.name,
    description: item.description || '',
    thumbnail: item.avatar?.[0]?.url || '',
    subscriberCount: parseSubscriberCount(item.subscriberCountText),
    videoCount: parseVideoCount(item.videoCountText),
    isVerified: item.isVerified || false,
    handle: item.handle || ''
  };
};

/**
 * Format channel details data
 * @param {Object} data - Channel details API response
 * @returns {Object} Formatted channel data
 */
const formatChannelDetailsData = (data) => {
  return {
    id: data.id,
    name: data.name,
    handle: data.handle || '',
    description: data.description || '',
    biography: data.biography || '',
    isVerified: data.isVerified || false,
    isVerifiedArtist: data.isVerifiedArtist || false,
    subscriberCount: parseSubscriberCount(data.subscriberCountText),
    videoCount: parseVideoCount(data.videoCountText),
    viewCount: parseViewCount(data.viewCountText),
    joinedDate: data.joinedDateText || '',
    avatar: data.avatar || [],
    banner: data.banner || [],
    links: data.links || []
  };
};

/**
 * Format duration from seconds to MM:SS or HH:MM:SS
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
const formatDuration = (seconds) => {
  if (!seconds || seconds === 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
};

/**
 * Parse view count text to number
 * @param {string} viewCountText - Text like "1.2M views" or "123,456 views"
 * @returns {number} View count as number
 */
const parseViewCount = (viewCountText) => {
  if (!viewCountText) return 0;
  
  const text = viewCountText.toLowerCase().replace(/[^\d.kmb]/g, '');
  const number = parseFloat(text);
  
  if (viewCountText.includes('k')) return Math.floor(number * 1000);
  if (viewCountText.includes('m')) return Math.floor(number * 1000000);
  if (viewCountText.includes('b')) return Math.floor(number * 1000000000);
  
  return number || 0;
};

/**
 * Parse subscriber count text to number
 * @param {string} subscriberCountText - Text like "1.2M subscribers"
 * @returns {number} Subscriber count as number
 */
const parseSubscriberCount = (subscriberCountText) => {
  if (!subscriberCountText) return 0;
  return parseViewCount(subscriberCountText);
};

/**
 * Parse video count text to number
 * @param {string} videoCountText - Text like "120 videos"
 * @returns {number} Video count as number
 */
const parseVideoCount = (videoCountText) => {
  if (!videoCountText) return 0;
  return parseViewCount(videoCountText);
};

/**
 * Parse comment count text to number
 * @param {string} commentCountText - Text like "359K" or "1.2M"
 * @returns {number} Comment count as number
 */
const parseCommentCount = (commentCountText) => {
  if (!commentCountText) return 0;
  return parseViewCount(commentCountText + ' comments'); // Add 'comments' for parsing
};

/**
 * Sort videos by performance metrics
 * @param {Array} videos - Array of formatted video data
 * @param {string} sortBy - Sort criteria
 * @returns {Array} Sorted videos array
 */
export const sortVideos = (videos, sortBy) => {
  logger.log('[YouTube API - sortVideos] Sorting', videos.length, 'videos by:', sortBy);
  
  if (!videos || videos.length === 0) return videos;
  
  const sortedVideos = [...videos].sort((a, b) => {
    switch (sortBy) {
      case 'views':
        return (b.metrics?.viewCount || 0) - (a.metrics?.viewCount || 0);
      
      case 'likes':
        return (b.metrics?.likeCount || 0) - (a.metrics?.likeCount || 0);
      
      case 'comments':
        return (b.metrics?.commentCount || 0) - (a.metrics?.commentCount || 0);
      
      case 'recency':
        // Sort by publish date (newest first)
        return new Date(b.publishedAt) - new Date(a.publishedAt);
      
      case 'engagement':
        // Calculate engagement rate: (likes + comments) / views * 100
        const aEngagement = a.metrics?.viewCount > 0 
          ? ((a.metrics?.likeCount || 0) + (a.metrics?.commentCount || 0)) / a.metrics.viewCount * 100
          : 0;
        const bEngagement = b.metrics?.viewCount > 0 
          ? ((b.metrics?.likeCount || 0) + (b.metrics?.commentCount || 0)) / b.metrics.viewCount * 100
          : 0;
        return bEngagement - aEngagement;
      
      case 'relevance':
      default:
        // Keep original order (API's relevance ranking)
        return 0;
    }
  });
  
  // Log performance metrics for debugging
  if (sortBy !== 'relevance') {
    logger.log('[YouTube API - sortVideos] Top 3 results by', sortBy + ':');
    sortedVideos.slice(0, 3).forEach((video, index) => {
      const engagement = video.metrics?.viewCount > 0 
        ? ((video.metrics?.likeCount || 0) + (video.metrics?.commentCount || 0)) / video.metrics.viewCount * 100
        : 0;
      logger.log(`${index + 1}. ${video.title}`, {
        views: video.metrics?.viewCount?.toLocaleString() || '0',
        likes: video.metrics?.likeCount?.toLocaleString() || '0',
        comments: video.metrics?.commentCount?.toLocaleString() || '0',
        engagement: engagement.toFixed(3) + '%',
        published: video.metrics?.publishedDaysAgo + ' days ago'
      });
    });
  }
  
  return sortedVideos;
};

/**
 * Legacy compatibility functions - these maintain the same interface as the old API
 */

// Channel ID resolution for legacy compatibility
export const getChannelId = async (channelInput) => {
  try {
    const channels = await searchChannels(channelInput, 1);
    if (channels.length === 0) {
      throw new Error(`No channels found for: ${channelInput}`);
    }
    
    const channel = channels[0];
    const channelDetails = await getChannelDetails(channel.id);
    
    return {
      channelId: channel.id,
      channelData: {
        snippet: {
          title: channelDetails.name,
          description: channelDetails.description
        },
        statistics: {
          subscriberCount: channelDetails.subscriberCount,
          videoCount: channelDetails.videoCount
        }
      },
      confidence: 'high'
    };
  } catch (error) {
    logger.error('[YouTube API] Error getting channel ID:', error);
    throw error;
  }
};

// Search channels for autocomplete
export const searchChannelsForAutocomplete = async (query, maxResults = 8) => {
  if (!query || query.length < 2) return [];
  
  try {
    const channels = await searchChannels(query, maxResults);
    return channels.map(channel => ({
      id: channel.id,
      title: channel.title,
      description: channel.description,
      thumbnail: channel.thumbnail,
      subscriberCount: channel.subscriberCount,
      videoCount: channel.videoCount
    }));
  } catch (error) {
    logger.error('[YouTube API] Error searching channels for autocomplete:', error);
    return [];
  }
};

// Fetch video details (legacy compatibility)
export const fetchVideoDetails = async (videoIds) => {
  const videoIdArray = videoIds.split(',');
  const videoDetailsPromises = videoIdArray.map(async (videoId) => {
    try {
      return await getVideoDetails(videoId.trim());
    } catch (error) {
      logger.warn(`[YouTube API] Failed to get details for video ${videoId}:`, error.message);
      return null;
    }
  });
  
  const videoDetails = await Promise.all(videoDetailsPromises);
  return {
    items: videoDetails.filter(v => v !== null)
  };
};

// Fetch best performing videos with advanced filtering
export const fetchBestPerformingVideos = async (channelInput, targetCount = 50) => {
  logger.log('[YouTube API] Fetching best performing videos for:', channelInput);
  
  try {
    const result = await fetchChannelVideos(channelInput, targetCount, 'views');
    
    // Sort by performance score and apply quality filters
    const filteredVideos = result.videos.filter(video => {
      const durationSeconds = parseDurationToSeconds(video.duration);
      if (durationSeconds < 60) return false; // Filter out shorts
      
      const ageInDays = video.metrics.publishedDaysAgo;
      if (ageInDays > 365 * 3 && video.metrics.viewCount < 100000) return false;
      
      if (video.metrics.viewCount < 1000) return false;
      return true;
    });
    
    return {
      videos: filteredVideos.slice(0, targetCount),
      channelInfo: result.channelInfo
    };
  } catch (error) {
    logger.error('[YouTube API] Error fetching best performing videos:', error);
    throw error;
  }
};

/**
 * Parse duration string to seconds for filtering
 * @param {string} duration - Duration in MM:SS or HH:MM:SS format
 * @returns {number} Duration in seconds
 */
const parseDurationToSeconds = (duration) => {
  if (!duration) return 0;
  
  const parts = duration.split(':').map(Number);
  if (parts.length === 2) {
    // MM:SS format
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // HH:MM:SS format
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  
  return 0;
};

// Get API usage statistics
export const getAPIUsage = () => {
  return {
    requests: API_USAGE.requests,
    lastReset: API_USAGE.lastReset,
    maxRequestsPerHour: API_USAGE.maxRequestsPerHour,
    maxRequestsPerDay: API_USAGE.maxRequestsPerDay
  };
};

// Export quota tracker for external use (maintaining compatibility)
export { quotaTracker };