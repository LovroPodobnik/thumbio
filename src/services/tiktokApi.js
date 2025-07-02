// TikTok API23 Service by Lundehund
// Mirrors YouTube API architecture for consistency

const RAPIDAPI_KEY = process.env.REACT_APP_RAPIDAPI_KEY;
const TIKTOK_API_KEY = process.env.REACT_APP_TIKTOK_API_KEY;
const BASE_URL = 'https://tiktok-api23.p.rapidapi.com';

// Check if API keys are configured
if (!RAPIDAPI_KEY || RAPIDAPI_KEY === 'your_rapidapi_key_here') {
  console.error('[TikTok API] Error: RapidAPI key is not configured. Please add REACT_APP_RAPIDAPI_KEY to your .env file');
}

if (!TIKTOK_API_KEY || TIKTOK_API_KEY === 'your_tiktok_api_key_here') {
  console.error('[TikTok API] Error: TikTok API key is not configured. Please add REACT_APP_TIKTOK_API_KEY to your .env file');
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
  maxRequestsPerHour: 100, // Conservative limit for TikTok API
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
    throw new Error('TikTok API rate limit exceeded. Please wait before making more requests.');
  }
  
  if (API_USAGE.requests >= API_USAGE.maxRequestsPerDay) {
    throw new Error('Daily TikTok API quota exceeded. Please try again tomorrow.');
  }
  
  if (!RAPIDAPI_KEY) {
    throw new Error('RapidAPI key is not configured. Please add REACT_APP_RAPIDAPI_KEY to your environment variables.');
  }
  
  return true;
};

// Track API request
const trackRequest = () => {
  API_USAGE.requests++;
  logger.log(`[TikTok API Safety] Request #${API_USAGE.requests} made. Rate: ${(API_USAGE.requests / Math.max((Date.now() - API_USAGE.lastReset) / (1000 * 60 * 60), 1)).toFixed(1)} req/hour`);
};

// Common request headers for TikTok API
const getHeaders = () => ({
  'X-RapidAPI-Key': RAPIDAPI_KEY,
  'X-RapidAPI-Host': 'tiktok-api23.p.rapidapi.com'
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
  
  logger.log(`[TikTok API] Making request to: ${url.toString()}`);
  
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`TikTok API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    logger.log(`[TikTok API] Response received:`, data);
    
    return data;
  } catch (error) {
    logger.error('[TikTok API] Request failed:', error);
    throw error;
  }
};

/**
 * Get trending TikTok posts
 * @param {number} count - Number of trending posts to fetch (default: 20)
 * @param {string} region - Region code (default: 'US')
 * @returns {Promise<Object>} Trending posts data
 */
export const getTrendingPosts = async (count = 20, region = 'US') => {
  logger.log('[TikTok API] Fetching trending posts:', { count, region });
  
  try {
    const data = await makeRequest('/trending', {
      count,
      region
    });
    
    // Transform TikTok data to match our internal format
    const transformedPosts = transformTikTokPosts(data.data || []);
    
    return {
      posts: transformedPosts,
      metadata: {
        platform: 'tiktok',
        source: 'trending',
        count: transformedPosts.length,
        region,
        fetchedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    logger.error('[TikTok API] Error fetching trending posts:', error);
    throw new Error(`Failed to fetch trending TikTok posts: ${error.message}`);
  }
};

/**
 * Get user information
 * @param {string} username - TikTok username (with or without @)
 * @returns {Promise<Object>} User information
 */
export const getUserInfo = async (username) => {
  const cleanUsername = username.replace(/^@/, ''); // Remove @ if present
  logger.log('[TikTok API] Fetching user info:', cleanUsername);
  
  try {
    const data = await makeRequest('/user/info', {
      username: cleanUsername
    });
    
    return {
      userInfo: transformTikTokUser(data.data || {}),
      metadata: {
        platform: 'tiktok',
        source: 'user_info',
        username: cleanUsername,
        fetchedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    logger.error('[TikTok API] Error fetching user info:', error);
    throw new Error(`Failed to fetch TikTok user info for ${username}: ${error.message}`);
  }
};

/**
 * Get user posts
 * @param {string} username - TikTok username (with or without @)
 * @param {number} count - Number of posts to fetch (default: 30)
 * @param {string} sortBy - Sort criteria: 'popular', 'recent' (default: 'popular')
 * @returns {Promise<Object>} User posts data
 */
export const getUserPosts = async (username, count = 30, sortBy = 'popular') => {
  const cleanUsername = username.replace(/^@/, '');
  logger.log('[TikTok API] Fetching user posts:', { username: cleanUsername, count, sortBy });
  
  try {
    // Determine endpoint based on sort criteria
    const endpoint = sortBy === 'popular' ? '/user/popular' : '/user/posts';
    
    const data = await makeRequest(endpoint, {
      username: cleanUsername,
      count
    });
    
    const transformedPosts = transformTikTokPosts(data.data || []);
    
    return {
      posts: transformedPosts,
      userInfo: transformTikTokUser(data.user || {}),
      metadata: {
        platform: 'tiktok',
        source: 'user_posts',
        username: cleanUsername,
        count: transformedPosts.length,
        sortBy,
        fetchedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    logger.error('[TikTok API] Error fetching user posts:', error);
    throw new Error(`Failed to fetch TikTok posts for ${username}: ${error.message}`);
  }
};

/**
 * Search TikTok content
 * @param {string} query - Search query
 * @param {number} count - Number of results (default: 20)
 * @param {string} type - Search type: 'general', 'video', 'account' (default: 'general')
 * @returns {Promise<Object>} Search results
 */
export const searchTikTok = async (query, count = 20, type = 'general') => {
  logger.log('[TikTok API] Searching TikTok:', { query, count, type });
  
  try {
    const endpoint = type === 'general' ? '/search' : `/search/${type}`;
    
    const data = await makeRequest(endpoint, {
      query,
      count
    });
    
    const transformedResults = transformTikTokPosts(data.data || []);
    
    return {
      results: transformedResults,
      metadata: {
        platform: 'tiktok',
        source: 'search',
        query,
        type,
        count: transformedResults.length,
        fetchedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    logger.error('[TikTok API] Error searching TikTok:', error);
    throw new Error(`Failed to search TikTok for "${query}": ${error.message}`);
  }
};

// Transform TikTok post data to match our internal format
const transformTikTokPosts = (posts) => {
  return posts.map(post => ({
    id: post.id || post.aweme_id,
    title: post.desc || post.description || 'TikTok Video',
    description: post.desc || post.description || '',
    thumbnailUrl: post.cover || post.video?.cover || post.video?.dynamic_cover || '',
    videoUrl: post.play || post.video?.play_addr?.url_list?.[0] || '',
    
    // Creator information
    creator: {
      username: post.author?.unique_id || post.author?.username || '',
      displayName: post.author?.nickname || post.author?.display_name || '',
      avatar: post.author?.avatar_thumb?.url_list?.[0] || post.author?.avatar || '',
      verified: post.author?.verified || false,
      followerCount: post.author?.follower_count || 0
    },
    
    // Engagement metrics
    metrics: {
      viewCount: post.statistics?.play_count || post.play_count || 0,
      likeCount: post.statistics?.digg_count || post.digg_count || 0,
      commentCount: post.statistics?.comment_count || post.comment_count || 0,
      shareCount: post.statistics?.share_count || post.share_count || 0,
      downloadCount: post.statistics?.download_count || post.download_count || 0
    },
    
    // Metadata
    duration: post.duration || post.video?.duration || 0,
    createdAt: post.create_time ? new Date(post.create_time * 1000).toISOString() : null,
    hashtags: extractHashtags(post.desc || ''),
    music: {
      title: post.music?.title || '',
      author: post.music?.author || '',
      url: post.music?.play_url?.url_list?.[0] || ''
    },
    
    // Platform-specific data
    platform: 'tiktok',
    originalData: post // Keep original for debugging
  }));
};

// Transform TikTok user data to match our internal format
const transformTikTokUser = (user) => {
  return {
    id: user.id || user.uid,
    username: user.unique_id || user.username || '',
    displayName: user.nickname || user.display_name || '',
    avatar: user.avatar_thumb?.url_list?.[0] || user.avatar || '',
    bio: user.signature || user.bio || '',
    verified: user.verified || false,
    
    // Follower metrics
    metrics: {
      followerCount: user.follower_count || 0,
      followingCount: user.following_count || 0,
      videoCount: user.aweme_count || user.video_count || 0,
      likeCount: user.total_favorited || user.heart_count || 0
    },
    
    // Platform data
    platform: 'tiktok',
    originalData: user
  };
};

// Extract hashtags from TikTok description
const extractHashtags = (description) => {
  if (!description) return [];
  const hashtagRegex = /#[\w\u4e00-\u9fff]+/g;
  return description.match(hashtagRegex) || [];
};

// Calculate engagement rate for TikTok posts
export const calculateEngagementRate = (post) => {
  const { viewCount, likeCount, commentCount, shareCount } = post.metrics || {};
  
  if (!viewCount || viewCount === 0) return 0;
  
  const totalEngagement = (likeCount || 0) + (commentCount || 0) + (shareCount || 0);
  return Math.round((totalEngagement / viewCount) * 100 * 100) / 100; // Rounded to 2 decimal places
};

// Get API usage statistics
export const getAPIUsage = () => {
  resetUsageIfNeeded();
  return {
    requests: API_USAGE.requests,
    maxRequestsPerHour: API_USAGE.maxRequestsPerHour,
    maxRequestsPerDay: API_USAGE.maxRequestsPerDay,
    remainingToday: API_USAGE.maxRequestsPerDay - API_USAGE.requests,
    lastReset: new Date(API_USAGE.lastReset).toISOString()
  };
};

export default {
  getTrendingPosts,
  getUserInfo,
  getUserPosts,
  searchTikTok,
  calculateEngagementRate,
  getAPIUsage
};