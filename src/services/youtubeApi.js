// Official Google YouTube Data API v3 Service with API Key Rotation
import quotaTracker from './quotaTracker';

// Multiple API keys for quota management
const API_KEYS = [
  process.env.REACT_APP_YOUTUBE_API_KEY,
  process.env.REACT_APP_YOUTUBE_API_KEY_SECOND,
  process.env.REACT_APP_YOUTUBE_API_KEY_THIRD
].filter(key => key && key !== 'your_youtube_api_key_here');

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// API Key rotation state
const API_KEY_STATE = {
  currentIndex: 0,
  usageCount: {},
  failureCount: {},
  lastRotation: Date.now(),
  rotationThreshold: 50 // Rotate after 50 requests
};

// Initialize usage tracking for each key
API_KEYS.forEach((key, index) => {
  API_KEY_STATE.usageCount[index] = 0;
  API_KEY_STATE.failureCount[index] = 0;
});

// Check if we have valid API keys
if (API_KEYS.length === 0) {
  console.error('[YouTube API] Error: No valid YouTube API keys configured. Please add REACT_APP_YOUTUBE_API_KEY to your .env file');
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

/**
 * Get the current active API key
 * @returns {string} Current API key
 */
const getCurrentApiKey = () => {
  if (API_KEYS.length === 0) {
    throw new Error('No YouTube API keys available');
  }
  return API_KEYS[API_KEY_STATE.currentIndex];
};

/**
 * Rotate to the next API key
 * @param {string} reason - Reason for rotation
 */
const rotateApiKey = (reason = 'usage_threshold') => {
  const oldIndex = API_KEY_STATE.currentIndex;
  API_KEY_STATE.currentIndex = (API_KEY_STATE.currentIndex + 1) % API_KEYS.length;
  API_KEY_STATE.lastRotation = Date.now();
  
  logger.log(`[YouTube API] Rotated API key: ${oldIndex} → ${API_KEY_STATE.currentIndex} (${reason})`);
  logger.log(`[YouTube API] Key usage stats:`, {
    key0: `${API_KEY_STATE.usageCount[0]} requests, ${API_KEY_STATE.failureCount[0]} failures`,
    key1: `${API_KEY_STATE.usageCount[1]} requests, ${API_KEY_STATE.failureCount[1]} failures`,
    key2: `${API_KEY_STATE.usageCount[2]} requests, ${API_KEY_STATE.failureCount[2]} failures`
  });
};

/**
 * Check if current API key should be rotated
 */
const checkKeyRotation = () => {
  const currentUsage = API_KEY_STATE.usageCount[API_KEY_STATE.currentIndex];
  const currentFailures = API_KEY_STATE.failureCount[API_KEY_STATE.currentIndex];
  
  // Rotate if usage threshold reached
  if (currentUsage >= API_KEY_STATE.rotationThreshold) {
    rotateApiKey('usage_threshold');
    return;
  }
  
  // Rotate if too many failures (more than 5)
  if (currentFailures >= 5) {
    rotateApiKey('failure_threshold');
    return;
  }
  
  // Rotate if key has been used for more than 1 hour
  const timeSinceRotation = Date.now() - API_KEY_STATE.lastRotation;
  if (timeSinceRotation > 60 * 60 * 1000) { // 1 hour
    rotateApiKey('time_threshold');
    return;
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
  
  if (API_KEYS.length === 0) {
    throw new Error('No YouTube API keys configured. Please add API keys to your environment variables.');
  }
  
  // Check if we need to rotate API keys
  checkKeyRotation();
  
  return true;
};

// Track API request and add delay to prevent rate limiting
const trackRequest = async (success = true) => {
  API_USAGE.requests++;
  
  // Track usage per API key
  API_KEY_STATE.usageCount[API_KEY_STATE.currentIndex]++;
  
  if (!success) {
    API_KEY_STATE.failureCount[API_KEY_STATE.currentIndex]++;
  }
  
  logger.log(`[API Safety] Request #${API_USAGE.requests} made with key ${API_KEY_STATE.currentIndex}. Rate: ${(API_USAGE.requests / Math.max((Date.now() - API_USAGE.lastReset) / (1000 * 60 * 60), 1)).toFixed(1)} req/hour`);
  
  // Add small delay to prevent rate limiting (250ms between requests)
  await new Promise(resolve => setTimeout(resolve, 250));
};

// Make API request with error handling and automatic retry with key rotation
const makeRequest = async (endpoint, params = {}, retryCount = 0) => {
  const maxRetries = Math.min(3, API_KEYS.length);
  
  try {
    canMakeRequest();
    
    const currentKey = getCurrentApiKey();
    const url = new URL(`${BASE_URL}${endpoint}`);
    
    // Add API key to all requests
    url.searchParams.append('key', currentKey);
    
    // Add other parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });
    
    logger.log(`[YouTube API] Request URL (key ${API_KEY_STATE.currentIndex}):`, url.toString().replace(currentKey, 'KEY_HIDDEN'));
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[YouTube API] Error response:', errorText);
      
      // Track failed request
      await trackRequest(false);
      
      // Check if it's a quota or auth error that might be resolved by key rotation
      const isRetryableError = response.status === 403 || response.status === 429 || response.status === 400;
      
      if (isRetryableError && retryCount < maxRetries) {
        logger.warn(`[YouTube API] Retryable error (${response.status}), rotating API key and retrying...`);
        rotateApiKey('api_error');
        return makeRequest(endpoint, params, retryCount + 1);
      }
      
      throw new Error(`YouTube API request failed: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    logger.log('[YouTube API] Response data received successfully');
    
    // Check for YouTube API error conditions
    if (data.error) {
      // Track failed request
      await trackRequest(false);
      
      // Check if it's a quota or auth error
      const isRetryableError = data.error.code === 403 || data.error.code === 429 || data.error.code === 400;
      
      if (isRetryableError && retryCount < maxRetries) {
        logger.warn(`[YouTube API] API error (${data.error.code}), rotating API key and retrying...`);
        rotateApiKey('api_error');
        return makeRequest(endpoint, params, retryCount + 1);
      }
      
      throw new Error(`YouTube API error: ${data.error.message}`);
    }
    
    // Track successful request
    await trackRequest(true);
    
    return data;
    
  } catch (error) {
    // Track failed request if not already tracked
    if (!error.message.includes('YouTube API request failed') && !error.message.includes('YouTube API error')) {
      await trackRequest(false);
    }
    
    // If it's a network or other error, try rotating key and retrying
    if (retryCount < maxRetries && API_KEYS.length > 1) {
      logger.warn(`[YouTube API] Request failed (${error.message}), rotating API key and retrying...`);
      rotateApiKey('request_error');
      return makeRequest(endpoint, params, retryCount + 1);
    }
    
    throw error;
  }
};

/**
 * Get detailed video information by video ID
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object>} Video details
 */
export const getVideoDetails = async (videoId) => {
  logger.log('[YouTube API] Getting video details for:', videoId);
  
  try {
    const data = await makeRequest('/videos', {
      id: videoId,
      part: 'snippet,statistics,contentDetails'
    });
    
    if (!data.items || data.items.length === 0) {
      throw new Error(`Video not found: ${videoId}`);
    }
    
    return formatVideoDetailsData(data.items[0]);
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
    
    const searchData = await makeRequest('/search', {
      q: query,
      part: 'snippet',
      type: 'video',
      maxResults: maxResults,
      order: apiSortBy
    });
    
    if (!searchData.items || searchData.items.length === 0) {
      logger.warn('[YouTube API] No videos returned from search');
      return [];
    }
    
    // Get video IDs for detailed information
    const videoIds = searchData.items.map(item => item.id.videoId).join(',');
    
    // Get detailed video information including statistics
    const videoDetails = await makeRequest('/videos', {
      id: videoIds,
      part: 'snippet,statistics,contentDetails'
    });
    
    const formattedVideos = videoDetails.items.map(formatVideoDetailsData).filter(v => v);
    
    // Sort videos based on the specified criteria (client-side sorting for some options)
    const sortedVideos = sortVideos(formattedVideos, sortBy);
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
    const searchData = await makeRequest('/search', {
      q: query,
      part: 'snippet',
      type: 'channel',
      maxResults: maxResults
    });
    
    if (!searchData.items || searchData.items.length === 0) {
      logger.warn('[YouTube API] No channels found');
      return [];
    }
    
    // Get channel IDs for detailed information
    const channelIds = searchData.items.map(item => item.id.channelId).join(',');
    
    // Get detailed channel information including statistics
    const channelDetails = await makeRequest('/channels', {
      id: channelIds,
      part: 'snippet,statistics'
    });
    
    return channelDetails.items.map(formatChannelSearchData);
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
    const data = await makeRequest('/channels', {
      id: channelId,
      part: 'snippet,statistics,contentDetails,brandingSettings'
    });
    
    if (!data.items || data.items.length === 0) {
      throw new Error(`Channel not found: ${channelId}`);
    }
    
    return formatChannelDetailsData(data.items[0]);
  } catch (error) {
    logger.error('[YouTube API] Error getting channel details:', error);
    throw error;
  }
};

/**
 * Fetch videos from a specific channel
 * @param {string} channelInput - YouTube channel ID or handle
 * @param {number} maxResults - Maximum number of results
 * @param {string} sortBy - Sort criteria: 'views', 'likes', 'comments', 'recency', 'engagement', 'relevance'
 * @returns {Promise<Array>} Array of video data
 */
export const fetchChannelVideos = async (channelInput, maxResults = 20, sortBy = 'relevance') => {
  logger.log('[YouTube API] Fetching channel videos for:', channelInput);
  
  try {
    let channelId = channelInput;
    let channelInfo = null;
    
    // Step 1: Extract or find channel ID
    if (channelInput.startsWith('UC') && channelInput.length === 24) {
      // Already a channel ID
      channelId = channelInput;
      logger.log(`[YouTube API] Using provided channel ID: ${channelId}`);
    } else {
      // Try to extract channel ID from URL or handle
      const extractedId = extractChannelIdFromInput(channelInput);
      logger.log(`[YouTube API] Extracted from input: ${extractedId}`);
      
      if (extractedId && extractedId.startsWith('UC') && extractedId.length === 24) {
        // Got a real channel ID from URL
        channelId = extractedId;
        logger.log(`[YouTube API] Using extracted channel ID: ${channelId}`);
      } else {
        // Need to search for the channel to get the actual ID
        const searchTerm = extractedId || channelInput;
        logger.log(`[YouTube API] Searching for channel: ${searchTerm}`);
        const channels = await searchChannels(searchTerm, 1);
        if (channels.length === 0) {
          throw new Error(`No channels found for: ${searchTerm}`);
        }
        channelId = channels[0].id;
        logger.log(`[YouTube API] Found channel ID from search: ${channelId}`);
      }
    }
    
    // Validate we have a proper channel ID
    if (!channelId || !channelId.startsWith('UC') || channelId.length !== 24) {
      throw new Error(`Invalid channel ID: ${channelId}. Expected UC* format with 24 characters.`);
    }
    
    logger.log(`[YouTube API] Final channel ID: ${channelId}`);
    
    // Step 2: Get channel details
    try {
      channelInfo = await getChannelDetails(channelId);
      logger.log(`[YouTube API] Got channel info: ${channelInfo?.name}`);
    } catch (error) {
      logger.warn('[YouTube API] Could not get channel details:', error.message);
      // Continue without channel info
    }
    
    // Step 3: Get channel videos using the official YouTube API
    logger.log(`[YouTube API] Requesting videos for channel ID: ${channelId}`);
    
    // First, search for videos from this channel
    const searchData = await makeRequest('/search', {
      channelId: channelId,
      part: 'snippet',
      type: 'video',
      maxResults: maxResults,
      order: sortBy === 'views' ? 'viewCount' : sortBy === 'recency' ? 'date' : 'relevance'
    });
    
    if (!searchData.items || searchData.items.length === 0) {
      logger.warn('[YouTube API] No videos found for channel');
      return {
        videos: [],
        channelInfo: channelInfo ? {
          id: channelId,
          title: channelInfo.name,
          description: channelInfo.description,
          subscriberCount: channelInfo.subscriberCount,
          videoCount: channelInfo.videoCount,
          confidence: 'high'
        } : null
      };
    }
    
    // Get video IDs for detailed information
    const videoIds = searchData.items.map(item => item.id.videoId).join(',');
    
    // Get detailed video information including statistics
    const videoDetails = await makeRequest('/videos', {
      id: videoIds,
      part: 'snippet,statistics,contentDetails'
    });
    
    // Step 4: Format the videos from channel videos response
    const videos = videoDetails.items
      .slice(0, maxResults)
      .map(item => {
        try {
          const formattedVideo = formatVideoDetailsData(item);
          // Set channel info from what we know
          formattedVideo.channelName = channelInfo?.name || formattedVideo.channelName;
          formattedVideo.channelId = channelId;
          return formattedVideo;
        } catch (error) {
          logger.warn('[YouTube API] Failed to format video:', error);
          return null;
        }
      })
      .filter(video => video && video.title && video.id); // Filter out invalid videos
    
    // Step 5: Apply sorting
    const sortedVideos = sortVideos(videos, sortBy);
    
    logger.log(`[YouTube API] Successfully fetched ${sortedVideos.length} videos from channel`);
    
    return {
      videos: sortedVideos,
      channelInfo: channelInfo ? {
        id: channelId,
        title: channelInfo.name,
        description: channelInfo.description,
        subscriberCount: channelInfo.subscriberCount,
        videoCount: channelInfo.videoCount,
        confidence: 'high'
      } : {
        id: channelId,
        title: 'Unknown Channel',
        description: '',
        subscriberCount: 0,
        videoCount: videos.length,
        confidence: 'medium'
      }
    };
  } catch (error) {
    logger.error('[YouTube API] Error fetching channel videos:', error);
    throw error;
  }
};

/**
 * Get search suggestions (Note: Official YouTube API doesn't have suggestions endpoint)
 * @param {string} query - Partial search query
 * @returns {Promise<Array>} Array of suggestion strings
 */
export const getSearchSuggestions = async (query) => {
  if (!query || query.length < 2) return [];
  
  try {
    // Official YouTube API v3 doesn't have a search suggestions endpoint
    // You could use Google Suggest API or implement your own suggestion logic
    logger.warn('[YouTube API] Search suggestions not available in official API');
    return [];
  } catch (error) {
    logger.warn('[YouTube API] Error getting search suggestions:', error);
    return [];
  }
};

/**
 * Format video details data from the official YouTube API v3 response
 * @param {Object} item - Video item from API response
 * @returns {Object} Formatted video data
 */
const formatVideoDetailsData = (item) => {
  const snippet = item.snippet || {};
  const statistics = item.statistics || {};
  const contentDetails = item.contentDetails || {};
  
  const publishedAt = snippet.publishedAt ? new Date(snippet.publishedAt) : new Date();
  const daysAgo = Math.floor((Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24));
  
  // Get the best thumbnail URL from official API structure
  const thumbnails = snippet.thumbnails || {};
  let thumbnailUrl = '';
  
  // YouTube API v3 thumbnail quality order
  if (thumbnails.maxres) thumbnailUrl = thumbnails.maxres.url;
  else if (thumbnails.standard) thumbnailUrl = thumbnails.standard.url;
  else if (thumbnails.high) thumbnailUrl = thumbnails.high.url;
  else if (thumbnails.medium) thumbnailUrl = thumbnails.medium.url;
  else if (thumbnails.default) thumbnailUrl = thumbnails.default.url;
  
  const secureThumbnailUrl = thumbnailUrl ? thumbnailUrl.replace('http://', 'https://') : null;
  
  return {
    id: item.id,
    title: snippet.title || 'Unknown Title',
    channelName: snippet.channelTitle || 'Unknown Channel',
    channelId: snippet.channelId || '',
    thumbnail: secureThumbnailUrl,
    thumbnails: Object.values(thumbnails),
    publishedAt: snippet.publishedAt || 'Unknown',
    duration: formatDuration(parseDurationISO8601(contentDetails.duration)),
    metrics: {
      viewCount: parseInt(statistics.viewCount || '0'),
      likeCount: parseInt(statistics.likeCount || '0'),
      commentCount: parseInt(statistics.commentCount || '0'),
      publishedDaysAgo: daysAgo
    },
    // Default position (will be updated when added to canvas)
    x: 100,
    y: 100
  };
};


/**
 * Format channel search data from official YouTube API v3
 * @param {Object} item - Channel item from API response
 * @returns {Object} Formatted channel data
 */
const formatChannelSearchData = (item) => {
  const snippet = item.snippet || {};
  const statistics = item.statistics || {};
  
  return {
    id: item.id,
    title: snippet.title || snippet.channelTitle || 'Unknown Channel',
    description: snippet.description || '',
    thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
    subscriberCount: parseInt(statistics.subscriberCount || '0'),
    videoCount: parseInt(statistics.videoCount || '0'),
    isVerified: false, // Would need additional API call to get verification status
    handle: snippet.customUrl || ''
  };
};

/**
 * Format channel details data from official YouTube API v3
 * @param {Object} item - Channel item from API response
 * @returns {Object} Formatted channel data
 */
const formatChannelDetailsData = (item) => {
  const snippet = item.snippet || {};
  const statistics = item.statistics || {};
  const brandingSettings = item.brandingSettings || {};
  
  return {
    id: item.id,
    name: snippet.title || 'Unknown Channel',
    handle: snippet.customUrl || '',
    description: snippet.description || '',
    biography: brandingSettings.channel?.description || '',
    isVerified: false, // Would need additional API call to get verification status
    isVerifiedArtist: false,
    subscriberCount: parseInt(statistics.subscriberCount || '0'),
    videoCount: parseInt(statistics.videoCount || '0'),
    viewCount: parseInt(statistics.viewCount || '0'),
    joinedDate: snippet.publishedAt || '',
    avatar: Object.values(snippet.thumbnails || {}),
    banner: brandingSettings.image?.bannerExternalUrl ? [{ url: brandingSettings.image.bannerExternalUrl }] : [],
    links: []
  };
};

/**
 * Parse ISO8601 duration format (PT4M13S) to seconds
 * @param {string} duration - ISO8601 duration string
 * @returns {number} Duration in seconds
 */
const parseDurationISO8601 = (duration) => {
  if (!duration) return 0;
  
  const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!matches) return 0;
  
  const hours = parseInt(matches[1] || '0');
  const minutes = parseInt(matches[2] || '0');
  const seconds = parseInt(matches[3] || '0');
  
  return hours * 3600 + minutes * 60 + seconds;
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
 * Parse published time text to days ago
 * @param {string} publishedTimeText - Text like "3 hours ago", "2 days ago", "1 week ago"
 * @returns {number} Days ago as number
 */
const parsePublishedTime = (publishedTimeText) => {
  if (!publishedTimeText) return 0;
  
  const text = publishedTimeText.toLowerCase();
  const number = parseInt(text.match(/\d+/)?.[0] || '0');
  
  if (text.includes('minute') || text.includes('hour')) {
    return 0; // Less than a day
  } else if (text.includes('day')) {
    return number;
  } else if (text.includes('week')) {
    return number * 7;
  } else if (text.includes('month')) {
    return number * 30;
  } else if (text.includes('year')) {
    return number * 365;
  }
  
  return 0;
};

/**
 * Extract channel ID from various input formats
 * @param {string} input - Channel URL, handle, or other identifier
 * @returns {string|null} Channel ID or null if not found
 */
const extractChannelIdFromInput = (input) => {
  if (!input) return null;
  
  const cleanInput = input.trim();
  
  // Already a channel ID
  if (cleanInput.startsWith('UC') && cleanInput.length === 24) {
    return cleanInput;
  }
  
  // Extract from various YouTube URL formats
  const patterns = [
    // Channel ID URL: https://www.youtube.com/channel/UCJ5v_MCY6GNUBTO8-D3XoAg
    /youtube\.com\/channel\/([a-zA-Z0-9_-]{24})/,
    // Handle URL: https://www.youtube.com/@WWE
    /youtube\.com\/@([a-zA-Z0-9_-]+)/,
    // Custom URL: https://www.youtube.com/c/WWE
    /youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
    // User URL: https://www.youtube.com/user/WWE
    /youtube\.com\/user\/([a-zA-Z0-9_-]+)/,
    // Just the handle: @WWE
    /^@([a-zA-Z0-9_-]+)$/
  ];
  
  for (const pattern of patterns) {
    const match = cleanInput.match(pattern);
    if (match) {
      const extracted = match[1];
      // If it's a channel ID, return it
      if (extracted.startsWith('UC') && extracted.length === 24) {
        return extracted;
      }
      // Otherwise, return the handle/username (will need to be searched)
      return extracted.startsWith('@') ? extracted : `@${extracted}`;
    }
  }
  
  // If no pattern matches, assume it's a channel name or handle
  return cleanInput.startsWith('@') ? cleanInput : `@${cleanInput}`;
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

// Get API usage statistics including key rotation data
export const getAPIUsage = () => {
  return {
    requests: API_USAGE.requests,
    lastReset: API_USAGE.lastReset,
    maxRequestsPerHour: API_USAGE.maxRequestsPerHour,
    maxRequestsPerDay: API_USAGE.maxRequestsPerDay,
    apiKeys: {
      total: API_KEYS.length,
      currentIndex: API_KEY_STATE.currentIndex,
      usageCount: { ...API_KEY_STATE.usageCount },
      failureCount: { ...API_KEY_STATE.failureCount },
      lastRotation: API_KEY_STATE.lastRotation,
      rotationThreshold: API_KEY_STATE.rotationThreshold
    }
  };
};

/**
 * Get API key rotation statistics for monitoring
 * @returns {Object} Rotation statistics
 */
export const getKeyRotationStats = () => {
  const totalUsage = Object.values(API_KEY_STATE.usageCount).reduce((sum, count) => sum + count, 0);
  const totalFailures = Object.values(API_KEY_STATE.failureCount).reduce((sum, count) => sum + count, 0);
  
  return {
    totalKeys: API_KEYS.length,
    currentKey: API_KEY_STATE.currentIndex,
    totalRequests: totalUsage,
    totalFailures: totalFailures,
    successRate: totalUsage > 0 ? ((totalUsage - totalFailures) / totalUsage * 100).toFixed(2) : '100.00',
    keyStats: API_KEYS.map((_, index) => ({
      keyIndex: index,
      requests: API_KEY_STATE.usageCount[index] || 0,
      failures: API_KEY_STATE.failureCount[index] || 0,
      successRate: API_KEY_STATE.usageCount[index] > 0 
        ? (((API_KEY_STATE.usageCount[index] - API_KEY_STATE.failureCount[index]) / API_KEY_STATE.usageCount[index]) * 100).toFixed(2)
        : '100.00'
    })),
    rotationInfo: {
      lastRotation: new Date(API_KEY_STATE.lastRotation).toISOString(),
      rotationThreshold: API_KEY_STATE.rotationThreshold,
      timeSinceLastRotation: Math.floor((Date.now() - API_KEY_STATE.lastRotation) / 1000 / 60) // minutes
    }
  };
};

// Export quota tracker for external use (maintaining compatibility)
export { quotaTracker };