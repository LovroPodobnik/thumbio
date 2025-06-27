// YouTube Data API v3 Service
import quotaTracker from './quotaTracker';

const API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

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
  
  if (!API_KEY) {
    throw new Error('YouTube API key is not configured. Please add REACT_APP_YOUTUBE_API_KEY to your environment variables.');
  }
  
  // Check YouTube API quota
  if (!quotaTracker.canMakeOperation(operationType)) {
    const status = quotaTracker.getQuotaStatus();
    const timeUntilReset = quotaTracker.getFormattedTimeUntilReset();
    throw new Error(`YouTube API quota exceeded. Used ${status.used}/${status.dailyLimit} units. Resets in ${timeUntilReset}.`);
  }
  
  return true;
};

// Track API request
const trackRequest = () => {
  API_USAGE.requests++;
  logger.log(`[API Safety] Request #${API_USAGE.requests} made. Rate: ${(API_USAGE.requests / Math.max((Date.now() - API_USAGE.lastReset) / (1000 * 60 * 60), 1)).toFixed(1)} req/hour`);
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
  
  // Safety check before making request
  canMakeRequest('SEARCH');
  trackRequest();
  
  try {
    // Track quota usage for search operation
    quotaTracker.trackOperation('SEARCH', { query, maxResults });
    const url = `${BASE_URL}/search?` + new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: maxResults,
      key: API_KEY
    });
    logger.log('[YouTube API] Request URL:', url);
    
    const response = await fetch(url);
    logger.log('[YouTube API] Response status:', response.status);
    logger.log('[YouTube API] Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[YouTube API] Error response:', errorText);
      throw new Error(`Failed to search videos: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    logger.log('[YouTube API] Search response data:', data);
    logger.log('[YouTube API] Number of items returned:', data.items?.length || 0);
    
    if (!data.items || data.items.length === 0) {
      logger.warn('[YouTube API] No items returned from search');
      return [];
    }
    
    const videoIds = data.items.map(item => item.id.videoId).join(',');
    logger.log('[YouTube API] Video IDs to fetch details for:', videoIds);
    
    // Get detailed statistics for videos
    const details = await fetchVideoDetails(videoIds);
    logger.log('[YouTube API] Video details fetched:', details);
    
    const formattedVideos = data.items.map((item, index) => {
      const formattedData = formatVideoData(item, details.items[index]);
      logger.log(`[YouTube API] Formatted video ${index}:`, {
        id: formattedData.id,
        title: formattedData.title,
        thumbnail: formattedData.thumbnail,
        thumbnails: formattedData.thumbnails
      });
      return {
        id: item.id.videoId,
        ...formattedData
      };
    });
    
    // Sort videos based on the specified criteria
    const sortedVideos = sortVideos(formattedVideos, sortBy);
    logger.log('[YouTube API] Videos sorted by:', sortBy);
    logger.log('[YouTube API] Final sorted videos:', sortedVideos);
    return sortedVideos;
  } catch (error) {
    logger.error('[YouTube API] Error searching videos:', error);
    logger.error('[YouTube API] Error stack:', error.stack);
    throw error;
  }
};

/**
 * Fetch videos from a specific channel
 * @param {string} channelId - YouTube channel ID
 * @param {number} maxResults - Maximum number of results
 * @param {string} sortBy - Sort criteria: 'views', 'likes', 'comments', 'recency', 'engagement', 'relevance'
 * @returns {Promise<Array>} Array of video data
 */
export const fetchChannelVideos = async (channelInput, maxResults = 20, sortBy = 'relevance') => {
  logger.log('[YouTube API] Fetching channel videos for:', channelInput);
  
  try {
    // Get channel info with improved accuracy
    const channelResult = await getChannelId(channelInput);
    const { channelId, channelData, confidence, warning } = channelResult;
    
    logger.log(`[YouTube API] Found channel: ${channelData.snippet.title} (confidence: ${confidence})`);
    
    // Show warning if confidence is not high
    if (warning) {
      logger.warn(`[YouTube API] ${warning}`);
    }
    
    // Safety check before making request
    canMakeRequest('SEARCH');
    trackRequest();
    
    // Track quota usage for search operation
    quotaTracker.trackOperation('SEARCH', { channelId, maxResults });
    
    // Determine optimal order parameter based on sortBy
    let order = 'date'; // Default
    if (sortBy === 'views') order = 'viewCount';
    else if (sortBy === 'relevance') order = 'relevance';
    else if (sortBy === 'recency') order = 'date';
    
    const response = await fetch(
      `${BASE_URL}/search?` + new URLSearchParams({
        part: 'snippet',
        channelId: channelId,
        type: 'video',
        order: order,
        maxResults: maxResults,
        key: API_KEY
      })
    );
    
    if (!response.ok) throw new Error('Failed to fetch channel videos');
    
    const data = await response.json();
    
    if (data.items.length === 0) {
      throw new Error(`No videos found for channel: ${channelData.snippet.title}`);
    }
    
    const videoIds = data.items.map(item => item.id.videoId).join(',');
    logger.log(`[YouTube API] Found ${data.items.length} videos, fetching details...`);
    
    // Get detailed statistics for videos
    const details = await fetchVideoDetails(videoIds);
    
    const formattedVideos = data.items.map((item, index) => ({
      id: item.id.videoId,
      ...formatVideoData(item, details.items[index])
    }));
    
    // Sort videos based on the specified criteria (secondary sort)
    const sortedVideos = sortVideos(formattedVideos, sortBy);
    
    logger.log(`[YouTube API] Successfully fetched ${sortedVideos.length} videos from ${channelData.snippet.title}`);
    
    return {
      videos: sortedVideos,
      channelInfo: {
        id: channelId,
        title: channelData.snippet.title,
        description: channelData.snippet.description,
        customUrl: channelData.snippet.customUrl,
        subscriberCount: channelData.statistics?.subscriberCount,
        videoCount: channelData.statistics?.videoCount,
        confidence: confidence,
        warning: warning
      }
    };
  } catch (error) {
    logger.error('[YouTube API] Error fetching channel videos:', error);
    throw error;
  }
};

/**
 * Parse YouTube URL to extract channel identifier
 * @param {string} input - YouTube URL or username
 * @returns {Object} Parsed channel info with type and identifier
 */
const parseChannelInput = (input) => {
  const cleanInput = input.trim();
  
  // Direct channel ID (UC...)
  if (cleanInput.match(/^UC[a-zA-Z0-9_-]{22}$/)) {
    return { type: 'channelId', value: cleanInput };
  }
  
  // Channel URL with ID: youtube.com/channel/UC...
  if (cleanInput.includes('youtube.com/channel/')) {
    const channelId = cleanInput.split('youtube.com/channel/')[1].split('/')[0].split('?')[0];
    if (channelId.match(/^UC[a-zA-Z0-9_-]{22}$/)) {
      return { type: 'channelId', value: channelId };
    }
  }
  
  // Handle (new format): youtube.com/@username
  if (cleanInput.includes('youtube.com/@')) {
    const handle = cleanInput.split('youtube.com/@')[1].split('/')[0].split('?')[0];
    return { type: 'handle', value: handle };
  }
  
  // Custom URL: youtube.com/c/customname
  if (cleanInput.includes('youtube.com/c/')) {
    const customName = cleanInput.split('youtube.com/c/')[1].split('/')[0].split('?')[0];
    return { type: 'customUrl', value: customName };
  }
  
  // Legacy user URL: youtube.com/user/username
  if (cleanInput.includes('youtube.com/user/')) {
    const username = cleanInput.split('youtube.com/user/')[1].split('/')[0].split('?')[0];
    return { type: 'username', value: username };
  }
  
  // Short YouTube URL: youtu.be/... (not for channels, but handle gracefully)
  if (cleanInput.includes('youtu.be/')) {
    throw new Error('This appears to be a video URL, not a channel URL');
  }
  
  // Direct handle input (starts with @)
  if (cleanInput.startsWith('@')) {
    return { type: 'handle', value: cleanInput.substring(1) };
  }
  
  // Plain username/handle (fallback)
  return { type: 'search', value: cleanInput };
};

/**
 * Get channel ID from channel URL or username with improved accuracy
 * @param {string} channelInput - Channel URL, handle, or username
 * @returns {Promise<Object>} Channel data with ID and verification info
 */
export const getChannelId = async (channelInput) => {
  // Safety check before making request
  canMakeRequest('SEARCH');
  trackRequest();
  
  try {
    logger.log('[YouTube API] Parsing channel input:', channelInput);
    const parsed = parseChannelInput(channelInput);
    logger.log('[YouTube API] Parsed as:', parsed);
    
    // If we already have a channel ID, verify it exists
    if (parsed.type === 'channelId') {
      const channelData = await verifyChannelExists(parsed.value);
      return {
        channelId: parsed.value,
        channelData,
        confidence: 'high'
      };
    }
    
    // For handles (@username), use the new method
    if (parsed.type === 'handle') {
      try {
        const result = await findChannelByHandle(parsed.value);
        return result;
      } catch (handleErr) {
        logger.warn('[YouTube API] findChannelByHandle failed, falling back to generic search:', handleErr.message);
        // Fallback: perform generic search to still attempt retrieval
        const fallback = await searchAndVerifyChannel(parsed.value, 'search');
        return fallback;
      }
    }
    
    // For other types, search and verify
    const result = await searchAndVerifyChannel(parsed.value, parsed.type);
    return result;
    
  } catch (error) {
    logger.error('[YouTube API] Error getting channel ID:', error);
    throw error;
  }
};

/**
 * Verify that a channel ID exists and get its data
 * @param {string} channelId - YouTube channel ID
 * @returns {Promise<Object>} Channel data
 */
const verifyChannelExists = async (channelId) => {
  canMakeRequest('CHANNELS_LIST');
  trackRequest();
  
  // Track quota usage for channels.list operation
  quotaTracker.trackOperation('CHANNELS_LIST', { channelId });
  
  const response = await fetch(
    `${BASE_URL}/channels?` + new URLSearchParams({
      part: 'snippet,statistics',
      id: channelId,
      key: API_KEY
    })
  );
  
  if (!response.ok) throw new Error('Failed to verify channel');
  
  const data = await response.json();
  if (data.items.length === 0) {
    throw new Error('Channel not found');
  }
  
  return data.items[0];
};

/**
 * Find channel by handle (@username)
 * @param {string} handle - Channel handle without @
 * @returns {Promise<Object>} Channel result with verification
 */
const findChannelByHandle = async (handle) => {
  // Try to find by handle using search
  const searchQuery = `@${handle}`;
  
  canMakeRequest('SEARCH');
  trackRequest();
  
  // Track quota usage for search operation
  quotaTracker.trackOperation('SEARCH', { handle, type: 'channel' });
  
  const response = await fetch(
    `${BASE_URL}/search?` + new URLSearchParams({
      part: 'snippet',
      q: searchQuery,
      type: 'channel',
      maxResults: 10, // Get more results for better matching
      key: API_KEY
    })
  );
  
  if (!response.ok) throw new Error('Failed to search for channel');
  
  const data = await response.json();
  if (data.items.length === 0) {
    throw new Error(`Channel with handle @${handle} not found`);
  }
  
  // Look for exact handle match
  for (const channel of data.items) {
    const channelHandle = channel.snippet.customUrl || channel.snippet.title;
    
    // Check if this channel matches our handle
    if (channelHandle.toLowerCase().includes(handle.toLowerCase()) || 
        channel.snippet.title.toLowerCase().replace(/\s+/g, '').includes(handle.toLowerCase())) {
      
      // Get full channel data for verification
      const fullChannelData = await verifyChannelExists(channel.id.channelId);
      
      return {
        channelId: channel.id.channelId,
        channelData: fullChannelData,
        confidence: 'high',
        matchedBy: 'handle'
      };
    }
  }
  
  // If no exact match, return the first result with warning
  const firstResult = data.items[0];
  const fullChannelData = await verifyChannelExists(firstResult.id.channelId);
  
  return {
    channelId: firstResult.id.channelId,
    channelData: fullChannelData,
    confidence: 'medium',
    warning: `Exact handle @${handle} not found. Found similar channel: ${fullChannelData.snippet.title}`,
    matchedBy: 'search'
  };
};

/**
 * Search for channels with autocomplete (for dropdown suggestions)
 * @param {string} query - Search query
 * @param {number} maxResults - Maximum number of results
 * @returns {Promise<Array>} Array of channel suggestions
 */
export const searchChannelsForAutocomplete = async (query, maxResults = 8) => {
  if (!query || query.length < 2) return [];
  
  // Safety check before making request
  canMakeRequest('SEARCH');
  trackRequest();
  
  // Track quota usage for channel search
  quotaTracker.trackOperation('SEARCH', { query, type: 'channel', maxResults });
  
  try {
    const response = await fetch(
      `${BASE_URL}/search?` + new URLSearchParams({
        part: 'snippet',
        q: query,
        type: 'channel',
        maxResults: maxResults,
        key: API_KEY
      })
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.warn('[YouTube API] Channel search failed:', response.status, errorText);
      
      // Check if it's a quota exceeded error
      if (response.status === 403 && errorText.includes('quota')) {
        logger.warn('[YouTube API] Quota exceeded - autocomplete disabled');
      }
      return [];
    }
    
    const data = await response.json();
    if (!data.items || data.items.length === 0) return [];
    
    // Get full channel details for better information
    const channelIds = data.items.map(item => item.id.channelId).join(',');
    const channelDetails = await fetchChannelDetails(channelIds);
    
    // Format channels for autocomplete
    return data.items.map((item, index) => {
      const details = channelDetails.items[index] || {};
      return {
        id: item.id.channelId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails?.default?.url || item.snippet.thumbnails?.medium?.url,
        customUrl: item.snippet.customUrl,
        subscriberCount: details.statistics?.subscriberCount,
        videoCount: details.statistics?.videoCount,
        publishedAt: item.snippet.publishedAt
      };
    });
  } catch (error) {
    logger.error('[YouTube API] Error searching channels for autocomplete:', error);
    return [];
  }
};

/**
 * Fetch detailed channel information
 * @param {string} channelIds - Comma-separated channel IDs
 * @returns {Promise<Object>} Channel details
 */
const fetchChannelDetails = async (channelIds) => {
  canMakeRequest('CHANNELS_LIST');
  trackRequest();
  
  // Track quota usage for channels.list operation
  const channelCount = channelIds.split(',').length;
  quotaTracker.trackOperation('CHANNELS_LIST', { channelCount });
  
  const response = await fetch(
    `${BASE_URL}/channels?` + new URLSearchParams({
      part: 'statistics',
      id: channelIds,
      key: API_KEY
    })
  );
  
  if (!response.ok) throw new Error('Failed to fetch channel details');
  return await response.json();
};

/**
 * Search for channel and verify the best match
 * @param {string} searchTerm - Search term
 * @param {string} searchType - Type of search (customUrl, username, search)
 * @returns {Promise<Object>} Channel result with verification
 */
const searchAndVerifyChannel = async (searchTerm, searchType) => {
  canMakeRequest('SEARCH');
  trackRequest();
  
  // Track quota usage for channel search
  quotaTracker.trackOperation('SEARCH', { searchTerm, searchType, type: 'channel' });
  
  // Create targeted search query based on type
  let searchQuery = searchTerm;
  if (searchType === 'customUrl') {
    searchQuery = `"${searchTerm}"`;  // Exact match for custom URLs
  }
  
  const response = await fetch(
    `${BASE_URL}/search?` + new URLSearchParams({
      part: 'snippet',
      q: searchQuery,
      type: 'channel',
      maxResults: 10, // Get more results for better matching
      key: API_KEY
    })
  );
  
  if (!response.ok) throw new Error('Failed to search for channel');
  
  const data = await response.json();
  if (data.items.length === 0) {
    throw new Error(`No channels found for "${searchTerm}"`);
  }
  
  // Score and rank results
  const scoredResults = data.items.map(channel => {
    const title = channel.snippet.title.toLowerCase();
    const description = (channel.snippet.description || '').toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    let score = 0;
    
    // Exact title match (highest score)
    if (title === searchLower) score += 100;
    else if (title.includes(searchLower)) score += 50;
    
    // Custom URL match (very high score)
    if (channel.snippet.customUrl && channel.snippet.customUrl.toLowerCase().includes(searchLower)) {
      score += 80;
    }
    
    // Description match (lower score)
    if (description.includes(searchLower)) score += 10;
    
    // Subscriber count boost (verified channels)
    const subscriberCount = parseInt(channel.snippet.subscriberCount || '0');
    if (subscriberCount > 100000) score += 20;
    if (subscriberCount > 1000000) score += 30;
    
    return { ...channel, score };
  });
  
  // Sort by score
  scoredResults.sort((a, b) => b.score - a.score);
  
  const bestMatch = scoredResults[0];
  const fullChannelData = await verifyChannelExists(bestMatch.id.channelId);
  
  // Determine confidence level
  let confidence = 'low';
  if (bestMatch.score >= 80) confidence = 'high';
  else if (bestMatch.score >= 50) confidence = 'medium';
  
  const result = {
    channelId: bestMatch.id.channelId,
    channelData: fullChannelData,
    confidence,
    matchedBy: searchType,
    score: bestMatch.score
  };
  
  // Add warning for low confidence matches
  if (confidence === 'low') {
    result.warning = `Low confidence match for "${searchTerm}". Found: ${fullChannelData.snippet.title}`;
  }
  
  logger.log(`[YouTube API] Found channel with ${confidence} confidence:`, fullChannelData.snippet.title);
  
  return result;
};

/**
 * Fetch detailed video information in chunks to respect API limits
 * @param {Array} videoIdsArray - Array of video IDs
 * @returns {Promise<Object>} Combined video details
 */
const fetchVideoDetailsInChunks = async (videoIdsArray) => {
  const chunkSize = 50; // YouTube API limit
  const chunks = [];
  
  // Split video IDs into chunks of 50
  for (let i = 0; i < videoIdsArray.length; i += chunkSize) {
    chunks.push(videoIdsArray.slice(i, i + chunkSize));
  }
  
  logger.log(`[YouTube API] Fetching video details in ${chunks.length} chunks`);
  
  // Fetch details for each chunk
  const allDetails = [];
  for (const chunk of chunks) {
    const chunkIds = chunk.join(',');
    const chunkDetails = await fetchVideoDetails(chunkIds);
    allDetails.push(...chunkDetails.items);
  }
  
  return { items: allDetails };
};

/**
 * Fetch detailed video information including statistics
 * @param {string} videoIds - Comma-separated video IDs
 * @returns {Promise<Object>} Video details
 */
export const fetchVideoDetails = async (videoIds) => {
  logger.log('[YouTube API - fetchVideoDetails] Fetching details for video IDs:', videoIds);
  
  // Safety check before making request
  canMakeRequest('VIDEOS_LIST');
  trackRequest();
  
  try {
    // Track quota usage for videos.list operation
    const videoCount = videoIds.split(',').length;
    quotaTracker.trackOperation('VIDEOS_LIST', { videoCount });
    const url = `${BASE_URL}/videos?` + new URLSearchParams({
      part: 'statistics,contentDetails',
      id: videoIds,
      key: API_KEY
    });
    logger.log('[YouTube API - fetchVideoDetails] Request URL:', url);
    
    const response = await fetch(url);
    logger.log('[YouTube API - fetchVideoDetails] Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[YouTube API - fetchVideoDetails] Error response:', errorText);
      throw new Error(`Failed to fetch video details: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    logger.log('[YouTube API - fetchVideoDetails] Response data:', data);
    return data;
  } catch (error) {
    logger.error('[YouTube API - fetchVideoDetails] Error:', error);
    logger.error('[YouTube API - fetchVideoDetails] Error stack:', error.stack);
    throw error;
  }
};

/**
 * Format video data to match our application structure
 */
const formatVideoData = (searchItem, detailItem) => {
  logger.log('[YouTube API - formatVideoData] Input searchItem:', searchItem);
  logger.log('[YouTube API - formatVideoData] Input detailItem:', detailItem);
  
  const snippet = searchItem.snippet;
  const statistics = detailItem?.statistics || {};
  const contentDetails = detailItem?.contentDetails || {};
  
  // Log thumbnail data
  logger.log('[YouTube API - formatVideoData] Thumbnails available:', {
    default: snippet.thumbnails.default?.url,
    medium: snippet.thumbnails.medium?.url,
    high: snippet.thumbnails.high?.url,
    standard: snippet.thumbnails.standard?.url,
    maxres: snippet.thumbnails.maxres?.url
  });
  
  // Parse ISO 8601 duration to readable format
  const duration = parseDuration(contentDetails.duration);
  
  // Calculate days ago
  const publishedAt = new Date(snippet.publishedAt);
  const daysAgo = Math.floor((Date.now() - publishedAt) / (1000 * 60 * 60 * 24));
  
  // Try to get the best quality thumbnail available
  const thumbnailUrl = snippet.thumbnails.high?.url || 
                      snippet.thumbnails.medium?.url || 
                      snippet.thumbnails.default?.url ||
                      snippet.thumbnails.standard?.url ||
                      snippet.thumbnails.maxres?.url;
  
  logger.log('[YouTube API - formatVideoData] Selected thumbnail URL:', thumbnailUrl);
  
  // Ensure thumbnail URL uses HTTPS
  const secureThumbnailUrl = thumbnailUrl ? thumbnailUrl.replace('http://', 'https://') : null;
  logger.log('[YouTube API - formatVideoData] Secure thumbnail URL:', secureThumbnailUrl);
  
  const formattedData = {
    title: snippet.title,
    channelName: snippet.channelTitle,
    channelId: snippet.channelId,
    thumbnail: secureThumbnailUrl,
    thumbnails: snippet.thumbnails,
    publishedAt: snippet.publishedAt,
    duration: duration,
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
  
  logger.log('[YouTube API - formatVideoData] Formatted data:', formattedData);
  return formattedData;
};

/**
 * Parse ISO 8601 duration to MM:SS or HH:MM:SS format
 */
const parseDuration = (duration) => {
  if (!duration) return '0:00';
  
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return '0:00';
  
  const hours = (match[1] || '').replace('H', '');
  const minutes = (match[2] || '').replace('M', '');
  const seconds = (match[3] || '').replace('S', '');
  
  const h = hours ? parseInt(hours) : 0;
  const m = minutes ? parseInt(minutes) : 0;
  const s = seconds ? parseInt(seconds) : 0;
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  } else {
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
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
        // Keep original order (YouTube's relevance ranking)
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
 * Fetch the best performing videos from a channel with advanced filtering
 * Designed specifically for MVP thumbnail analysis - focuses on proven winners
 * @param {string} channelInput - Channel URL, handle, or username  
 * @param {number} targetCount - Target number of videos to return (default: 50)
 * @returns {Promise<Object>} Best performing videos and channel info
 */
export const fetchBestPerformingVideos = async (channelInput, targetCount = 50) => {
  logger.log('[YouTube API] Fetching best performing videos for:', channelInput);
  
  try {
    // Get channel info
    const channelResult = await getChannelId(channelInput);
    const { channelId, channelData, confidence, warning } = channelResult;
    
    logger.log(`[YouTube API] Found channel: ${channelData.snippet.title} (confidence: ${confidence})`);
    
    /**
     * STEP 1 — FETCH USING MULTIPLE STRATEGIES IN PARALLEL
     *   • Paginated fetches for viewCount / date / relevance (deeper coverage)
     *   • Uploads playlist (captures items missed by search, e.g. unlisted)
     */
    const uploadsPlaylistIdPromise = getUploadsPlaylistId(channelId)
      .then((plId) => fetchPlaylistVideos(plId, 50))
      .catch((e) => {
        logger.warn('[YouTube API] Could not fetch uploads playlist:', e.message);
        return [];
      });

    const [mostViewed, mostRecent, mostRelevant, uploadsItems] = await Promise.all([
      fetchChannelVideosPaginated(channelId, 'viewCount'),
      fetchChannelVideosPaginated(channelId, 'date', 60, 365),
      fetchChannelVideosPaginated(channelId, 'relevance', 60),
      uploadsPlaylistIdPromise
    ]);
    
    // STEP 2 — COMBINE & DEDUPE
    const allVideos = [];
    const seenIds = new Set();
    ;[mostViewed, mostRecent, mostRelevant, uploadsItems].forEach((batch) => {
      batch.forEach((item) => {
        const vid = item.id.videoId;
        if (!seenIds.has(vid)) {
          seenIds.add(vid);
          allVideos.push(item);
        }
      });
    });
    logger.log(`[YouTube API] Combined ${allVideos.length} unique videos from all strategies`);

    // Early exit if nothing
    if (allVideos.length === 0) throw new Error('No videos found for this channel');

    // STEP 3 — FETCH DETAILED STATS (chunked)
    const videoIds = allVideos.map((v) => v.id.videoId);
    const videoDetails = await fetchVideoDetailsInChunks(videoIds);
    const detailMap = {};
    (videoDetails.items || []).forEach((d) => {
      detailMap[d.id] = d;
    });

    // STEP 4 — FORMAT & SCORE (z-score normalisation)
    const formatted = allVideos.map((item) => {
      return {
        id: item.id.videoId,
        ...formatVideoData(item, detailMap[item.id.videoId])
      };
    });

    const scoredVideos = attachPerformanceScores(formatted);

    // STEP 5 — QUALITY FILTERS
    const filteredVideos = scoredVideos.filter((video) => {
      const durationSeconds = parseDurationToSeconds(video.duration);
      if (durationSeconds < 60) return false; // shorts

      const ageInDays = video.metrics.publishedDaysAgo;
      if (ageInDays > 365 * 3 && video.metrics.viewCount < 100000) return false;

      const engagementRate = video.metrics.viewCount > 0 ? ((video.metrics.likeCount + video.metrics.commentCount) / video.metrics.viewCount) * 100 : 0;
      if (engagementRate < 0.1 && video.metrics.viewCount < 50000) return false;

      if (video.metrics.viewCount < 1000) return false;
      return true;
    });

    logger.log(`[YouTube API] After quality filters: ${filteredVideos.length} videos`);

    // STEP 6 — SORT BY PERFORMANCE SCORE & TRIM
    const topPerformers = filteredVideos
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, targetCount);

    logger.log('[YouTube API] Top 5 performers after z-score ranking:');
    topPerformers.slice(0, 5).forEach((v, i) => {
      const engagementRate = v.metrics.viewCount > 0 ? ((v.metrics.likeCount + v.metrics.commentCount) / v.metrics.viewCount) * 100 : 0;
      logger.log(`${i + 1}. ${v.title}`, {
        score: v.performanceScore.toFixed(2),
        views: v.metrics.viewCount.toLocaleString(),
        engagement: engagementRate.toFixed(2) + '%',
        velocity: (v.metrics.viewCount / Math.max(v.metrics.publishedDaysAgo, 1)).toFixed(1) + ' views/day'
      });
    });

    return {
      videos: topPerformers,
      channelInfo: {
        id: channelId,
        title: channelData.snippet.title,
        description: channelData.snippet.description,
        customUrl: channelData.snippet.customUrl,
        subscriberCount: channelData.statistics?.subscriberCount,
        videoCount: channelData.statistics?.videoCount,
        confidence,
        warning
      }
    };
  } catch (error) {
    logger.error('[YouTube API] Error fetching best performing videos:', error);
    throw error;
  }
};

/**
 * Helper function to fetch a batch of videos with specific sorting
 * @param {string} channelId - YouTube channel ID
 * @param {number} maxResults - Number of videos to fetch
 * @param {string} order - YouTube API order parameter
 * @returns {Promise<Array>} Array of video search results
 */
const fetchChannelVideosBatch = async (channelId, maxResults, order) => {
  canMakeRequest('SEARCH');
  trackRequest();
  
  // Track quota usage for search operation
  quotaTracker.trackOperation('SEARCH', { channelId, maxResults, order });
  
  const response = await fetch(
    `${BASE_URL}/search?` + new URLSearchParams({
      part: 'snippet',
      channelId: channelId,
      type: 'video',
      order: order,
      maxResults: maxResults,
      key: API_KEY
    })
  );
  
  if (!response.ok) throw new Error(`Failed to fetch videos with order: ${order}`);
  
  const data = await response.json();
  return data.items || [];
};

/**
 * Calculate comprehensive performance score for video ranking
 * Higher score = better performer for thumbnail analysis
 * @param {Object} video - Formatted video data
 * @returns {number} Performance score
 */
const calculatePerformanceScore = (video) => {
  const metrics = video.metrics;
  const views = metrics.viewCount || 0;
  const likes = metrics.likeCount || 0;
  const comments = metrics.commentCount || 0;
  const ageInDays = metrics.publishedDaysAgo || 0;
  
  if (views === 0) return 0;
  
  // Base score from view count (logarithmic to prevent mega-viral videos from dominating)
  const viewScore = Math.log10(views + 1) * 10;
  
  // Engagement rate (likes + comments) / views
  const engagementRate = ((likes + comments) / views) * 100;
  const engagementScore = Math.min(engagementRate * 20, 50); // Cap at 50 points
  
  // Recency bonus (videos from last 2 years get bonus)
  let recencyBonus = 0;
  if (ageInDays <= 365) recencyBonus = 10; // Last year
  else if (ageInDays <= 730) recencyBonus = 5; // Last 2 years
  
  // Like ratio bonus (high like-to-dislike ratio indicator)
  const likeRatio = views > 0 ? (likes / views) * 100 : 0;
  const likeRatioScore = Math.min(likeRatio * 100, 20); // Cap at 20 points
  
  // Comments engagement bonus (indicates discussion/interest)
  const commentRatio = views > 0 ? (comments / views) * 100 : 0;
  const commentScore = Math.min(commentRatio * 200, 15); // Cap at 15 points
  
  // Total performance score
  const totalScore = viewScore + engagementScore + recencyBonus + likeRatioScore + commentScore;
  
  return totalScore;
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

// New helper: get uploads playlist ID for a channel
const getUploadsPlaylistId = async (channelId) => {
  canMakeRequest('CHANNELS_LIST');
  trackRequest();
  
  // Track quota usage for channels.list operation
  quotaTracker.trackOperation('CHANNELS_LIST', { channelId, part: 'contentDetails' });

  const response = await fetch(
    `${BASE_URL}/channels?` + new URLSearchParams({
      part: 'contentDetails',
      id: channelId,
      key: API_KEY
    })
  );

  if (!response.ok) throw new Error('Failed to fetch uploads playlist id');

  const data = await response.json();
  const uploadsPlaylistId = data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) throw new Error('Uploads playlist not found for channel');
  return uploadsPlaylistId;
};

// New helper: fetch first N videos from a playlist (uploads)
const fetchPlaylistVideos = async (playlistId, maxResults = 50) => {
  canMakeRequest('PLAYLIST_ITEMS_LIST');
  trackRequest();
  
  // Track quota usage for playlistItems.list operation
  quotaTracker.trackOperation('PLAYLIST_ITEMS_LIST', { playlistId, maxResults });

  const response = await fetch(
    `${BASE_URL}/playlistItems?` + new URLSearchParams({
      part: 'snippet',
      playlistId,
      maxResults,
      key: API_KEY
    })
  );

  if (!response.ok) throw new Error('Failed to fetch playlist items');
  const data = await response.json();

  // Transform to match search.list structure for downstream compatibility
  const items = (data.items || []).map((item) => ({
    id: { videoId: item.snippet.resourceId.videoId },
    snippet: item.snippet
  }));
  return items;
};

// New helper: paginated video fetch with horizon stop
const fetchChannelVideosPaginated = async (
  channelId,
  order = 'viewCount',
  targetUnique = 120,
  horizonDays = 365 * 5,
  maxPages = 5
) => {
  const allItems = [];
  let nextPageToken = '';
  let pagesFetched = 0;
  const seenIds = new Set();
  const horizonDate = Date.now() - horizonDays * 24 * 60 * 60 * 1000;

  while (pagesFetched < maxPages && allItems.length < targetUnique) {
    canMakeRequest('SEARCH');
    trackRequest();
    
    // Track quota usage for search operation
    quotaTracker.trackOperation('SEARCH', { channelId, order, page: pagesFetched + 1 });

    const resp = await fetch(
      `${BASE_URL}/search?` +
        new URLSearchParams({
          part: 'snippet',
          channelId,
          type: 'video',
          order,
          maxResults: 50,
          pageToken: nextPageToken,
          key: API_KEY
        })
    );
    if (!resp.ok) throw new Error('Paginated fetch failed');
    const data = await resp.json();

    for (const item of data.items || []) {
      const videoId = item.id.videoId;
      if (seenIds.has(videoId)) continue;
      // Check horizonDate stop condition
      const published = new Date(item.snippet.publishedAt).getTime();
      if (published < horizonDate) {
        // Older than horizon, stop paginating further for this order
        pagesFetched = maxPages; // force break outer while
        break;
      }
      seenIds.add(videoId);
      allItems.push(item);
      if (allItems.length >= targetUnique) break;
    }

    nextPageToken = data.nextPageToken;
    pagesFetched += 1;
    if (!nextPageToken) break; // no more pages
  }

  return allItems;
};

// Helper: compute mean and std deviation
const mean = (arr) => arr.reduce((a, b) => a + b, 0) / Math.max(arr.length, 1);
const stdDev = (arr) => {
  const m = mean(arr);
  const variance = mean(arr.map((v) => Math.pow(v - m, 2)));
  return Math.sqrt(variance);
};

// New Z-score based performance score calculation across sample
const attachPerformanceScores = (videos) => {
  if (!videos || videos.length === 0) return videos;

  const viewsArr = videos.map((v) => v.metrics.viewCount);
  const engagementArr = videos.map((v) => {
    const { viewCount, likeCount, commentCount } = v.metrics;
    return viewCount > 0 ? ((likeCount + commentCount) / viewCount) * 100 : 0;
  });
  const velocityArr = videos.map((v) => {
    const { viewCount, publishedDaysAgo } = v.metrics;
    const days = Math.max(publishedDaysAgo, 1);
    return viewCount / days;
  });

  const stats = {
    views: { m: mean(viewsArr), s: stdDev(viewsArr) || 1 },
    engagement: { m: mean(engagementArr), s: stdDev(engagementArr) || 1 },
    velocity: { m: mean(velocityArr), s: stdDev(velocityArr) || 1 }
  };

  return videos.map((v, idx) => {
    const viewsZ = (viewsArr[idx] - stats.views.m) / stats.views.s;
    const engagementZ = (engagementArr[idx] - stats.engagement.m) / stats.engagement.s;
    const velocityZ = (velocityArr[idx] - stats.velocity.m) / stats.velocity.s;

    v.performanceScore = viewsZ + engagementZ + velocityZ; // simple sum
    return v;
  });
};

// Export quota tracker for external use
export { quotaTracker };