/**
 * TikTok API Service
 * 
 * Provides access to TikTok data via RapidAPI TikTok API.
 * Handles user profiles, posts, and content import functionality.
 */

const API_BASE_URL = 'https://tiktok-api23.p.rapidapi.com';
const API_KEY = process.env.REACT_APP_TIKTOK_API_KEY;

// Rate limiting and caching
const requestCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Make authenticated request to TikTok API
 */
async function makeRequest(endpoint, params = {}) {
  if (!API_KEY) {
    throw new Error('TikTok API key not configured. Please set REACT_APP_TIKTOK_API_KEY in your .env file.');
  }

  // Build URL with parameters
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value.toString());
    }
  });

  // Check cache first
  const cacheKey = url.toString();
  const cached = requestCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('[TikTokAPI] Cache hit for:', endpoint);
    return cached.data;
  }

  console.log('[TikTokAPI] Making request to:', endpoint, params);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'tiktok-api23.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      throw new Error(`TikTok API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Check for API-level errors
    if (data.statusCode && data.statusCode !== 0) {
      throw new Error(`TikTok API error: ${data.statusMsg || 'Unknown error'}`);
    }

    // Cache successful response
    requestCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    return data;
  } catch (error) {
    console.error('[TikTokAPI] Request failed:', error);
    throw error;
  }
}

/**
 * Get user information by username
 */
export async function getUserInfo(uniqueId) {
  try {
    const data = await makeRequest('/api/user/info', { uniqueId });
    
    if (!data.userInfo) {
      throw new Error(`User '${uniqueId}' not found`);
    }

    return {
      user: data.userInfo.user,
      stats: data.userInfo.stats,
      success: true
    };
  } catch (error) {
    console.error('[TikTokAPI] getUserInfo failed:', error);
    throw new Error(`Failed to fetch user info for '${uniqueId}': ${error.message}`);
  }
}

/**
 * Get user posts with different sorting options
 */
export async function getUserPosts(secUid, sortBy = 'recent', count = 35, cursor = 0) {
  let endpoint;
  
  switch (sortBy) {
    case 'popular':
      endpoint = '/api/user/popular-posts';
      break;
    case 'oldest':
      endpoint = '/api/user/oldest-posts';
      break;
    case 'recent':
    default:
      endpoint = '/api/user/posts';
      break;
  }

  try {
    const data = await makeRequest(endpoint, { secUid, count, cursor });
    
    if (!data.data || !data.data.itemList) {
      throw new Error('No posts data received');
    }

    return {
      posts: data.data.itemList,
      hasMore: data.data.hasMore,
      cursor: data.data.cursor,
      success: true
    };
  } catch (error) {
    console.error('[TikTokAPI] getUserPosts failed:', error);
    throw new Error(`Failed to fetch user posts: ${error.message}`);
  }
}

/**
 * Get trending TikTok posts
 */
export async function getTrendingPosts(count = 16, cursor = null) {
  try {
    console.log(`[TikTokAPI] Fetching ${count} trending posts`);
    
    const params = { count };
    if (cursor) {
      params.cursor = cursor;
    }
    
    const data = await makeRequest('/api/post/trending', params);
    
    if (!data.itemList) {
      throw new Error('No trending posts data received');
    }

    return {
      posts: data.itemList,
      hasMore: data.hasMore || false,
      cursor: data.cursor,
      success: true
    };
  } catch (error) {
    console.error('[TikTokAPI] getTrendingPosts failed:', error);
    throw new Error(`Failed to fetch trending posts: ${error.message}`);
  }
}

/**
 * Get detailed information for a specific post
 */
export async function getPostDetail(videoId) {
  try {
    console.log(`[TikTokAPI] Fetching details for video: ${videoId}`);
    
    const data = await makeRequest('/api/post/detail', { videoId });
    
    if (!data.itemInfo || !data.itemInfo.itemStruct) {
      throw new Error('No post detail data received');
    }

    return {
      post: data.itemInfo.itemStruct,
      success: true
    };
  } catch (error) {
    console.error('[TikTokAPI] getPostDetail failed:', error);
    throw new Error(`Failed to fetch post details: ${error.message}`);
  }
}

/**
 * Import content from TikTok username
 */
export async function importFromUsername(username, criteria = 'popular', maxResults = 50) {
  try {
    console.log(`[TikTokAPI] Starting import for @${username} with criteria: ${criteria}`);
    
    // Step 1: Get user info to get secUid
    const userInfo = await getUserInfo(username);
    const { user, stats } = userInfo;
    
    if (!user.secUid) {
      throw new Error('Unable to get user security ID');
    }

    console.log(`[TikTokAPI] Found user: ${user.nickname} (@${user.uniqueId}) with ${stats.videoCount} videos`);

    // Step 2: Get user posts based on criteria
    const sortBy = criteria === 'views' ? 'popular' : 
                   criteria === 'recent' ? 'recent' : 
                   criteria === 'engagement' ? 'popular' : 'popular';
    
    const postsData = await getUserPosts(user.secUid, sortBy, Math.min(maxResults, 35));
    
    if (!postsData.posts || postsData.posts.length === 0) {
      throw new Error('No posts found for this user');
    }

    console.log(`[TikTokAPI] Retrieved ${postsData.posts.length} posts`);

    // Step 3: Transform data to universal format
    const transformedPosts = postsData.posts.map(post => ({
      id: `tiktok-${post.id}`,
      type: 'thumbnail',
      platform: 'tiktok',
      url: post.video?.cover || post.video?.originCover || '',
      title: post.desc || 'TikTok Video',
      creator: {
        username: user.uniqueId,
        displayName: user.nickname,
        verified: user.verified || false,
        avatar: user.avatarLarger || user.avatarMedium || ''
      },
      metrics: {
        viewCount: post.stats?.playCount || 0,
        likeCount: post.stats?.diggCount || 0,
        commentCount: post.stats?.commentCount || 0,
        shareCount: post.stats?.shareCount || 0
      },
      publishedAt: post.createTime ? new Date(post.createTime * 1000).toISOString() : null,
      engagement: calculateEngagement(post.stats),
      originalData: post,
      importSource: 'username',
      importCriteria: criteria,
      importedAt: new Date().toISOString()
    }));

    // Step 4: Sort by engagement if requested
    if (criteria === 'engagement') {
      transformedPosts.sort((a, b) => b.engagement - a.engagement);
    }

    return {
      videos: transformedPosts.slice(0, maxResults),
      channelInfo: {
        id: user.id,
        title: user.nickname,
        username: user.uniqueId,
        description: user.signature || '',
        thumbnailUrl: user.avatarLarger || user.avatarMedium || '',
        verified: user.verified || false,
        subscriberCount: stats.followerCount,
        videoCount: stats.videoCount,
        platform: 'tiktok',
        url: `https://tiktok.com/@${user.uniqueId}`
      },
      metadata: {
        platform: 'tiktok',
        method: 'username',
        criteria: criteria,
        source: username,
        timestamp: new Date().toISOString(),
        totalAvailable: stats.videoCount,
        imported: transformedPosts.length
      }
    };
  } catch (error) {
    console.error('[TikTokAPI] Import failed:', error);
    throw new Error(`TikTok import failed: ${error.message}`);
  }
}

/**
 * Quick import from popular TikTok creators
 */
export async function quickImport(creatorHandle, creatorName, maxResults = 50) {
  // Remove @ if present
  const username = creatorHandle.startsWith('@') ? creatorHandle.substring(1) : creatorHandle;
  
  try {
    const result = await importFromUsername(username, 'popular', maxResults);
    
    // Add quick import metadata
    result.metadata.method = 'quick';
    result.metadata.creatorName = creatorName;
    
    return result;
  } catch (error) {
    throw new Error(`Quick import from ${creatorName} failed: ${error.message}`);
  }
}

/**
 * Import from TikTok URL or username
 */
export async function importFromUrl(url, criteria = 'popular', maxResults = 50) {
  try {
    const username = validateAndExtractUsername(url);
    return await importFromUsername(username, criteria, maxResults);
  } catch (error) {
    throw new Error(`URL import failed: ${error.message}`);
  }
}

/**
 * Import trending TikTok content
 */
export async function importTrending(maxResults = 30) {
  try {
    console.log(`[TikTokAPI] Starting trending import for ${maxResults} posts`);
    
    const trendingData = await getTrendingPosts(Math.min(maxResults, 50));
    
    if (!trendingData.posts || trendingData.posts.length === 0) {
      throw new Error('No trending posts found');
    }

    console.log(`[TikTokAPI] Retrieved ${trendingData.posts.length} trending posts`);

    // Transform trending posts to universal format
    const transformedPosts = trendingData.posts.map(post => transformTrendingPost(post));

    return {
      videos: transformedPosts.slice(0, maxResults),
      channelInfo: null, // No specific channel for trending
      metadata: {
        platform: 'tiktok',
        method: 'trending',
        source: 'trending',
        timestamp: new Date().toISOString(),
        totalAvailable: trendingData.posts.length,
        imported: transformedPosts.length,
        hasMore: trendingData.hasMore,
        cursor: trendingData.cursor
      }
    };
  } catch (error) {
    console.error('[TikTokAPI] Trending import failed:', error);
    throw new Error(`TikTok trending import failed: ${error.message}`);
  }
}

/**
 * Validate and extract username from TikTok URL
 */
export function validateAndExtractUsername(input) {
  let cleanInput = input.trim();
  
  // Extract username from TikTok URLs
  if (cleanInput.includes('tiktok.com/@')) {
    cleanInput = cleanInput.split('tiktok.com/@')[1].split('/')[0].split('?')[0];
  } else if (cleanInput.startsWith('@')) {
    cleanInput = cleanInput.substring(1);
  }
  
  // Validate username format
  if (!/^[a-zA-Z0-9._-]+$/.test(cleanInput)) {
    throw new Error('Invalid TikTok username format. Use format: @username or username');
  }
  
  return cleanInput;
}

/**
 * Transform a trending post to universal format (from /api/post/trending)
 */
function transformTrendingPost(post) {
  return {
    id: `tiktok-${post.id}`,
    type: 'thumbnail',
    platform: 'tiktok',
    url: post.video?.cover || '',
    title: post.desc || 'TikTok Video',
    creator: {
      username: post.author?.uniqueId || '',
      displayName: post.author?.nickname || '',
      verified: post.author?.verified || false,
      avatar: post.author?.avatarThumb || post.author?.avatarMedium || ''
    },
    metrics: {
      viewCount: parseInt(post.stats?.playCount) || 0,
      likeCount: parseInt(post.stats?.diggCount) || 0,
      commentCount: parseInt(post.stats?.commentCount) || 0,
      shareCount: parseInt(post.stats?.shareCount) || 0
    },
    publishedAt: post.createTime ? new Date(parseInt(post.createTime) * 1000).toISOString() : null,
    engagement: calculateEngagement(post.stats),
    originalData: post,
    importSource: 'trending',
    importedAt: new Date().toISOString(),
    // Additional metadata from trending posts
    music: post.music ? {
      title: post.music.title,
      author: post.music.authorName,
      duration: post.music.duration
    } : null,
    video: post.video ? {
      height: post.video.height,
      width: post.video.width,
      duration: post.video.duration,
      ratio: post.video.ratio
    } : null
  };
}

/**
 * Calculate engagement rate for TikTok posts
 */
function calculateEngagement(stats) {
  if (!stats) return 0;
  
  const views = parseInt(stats.playCount) || 0;
  const likes = parseInt(stats.diggCount) || 0;
  const comments = parseInt(stats.commentCount) || 0;
  const shares = parseInt(stats.shareCount) || 0;
  
  if (views === 0) return 0;
  
  return ((likes + comments + shares) / views) * 100;
}

/**
 * Test TikTok API connection
 */
export async function testConnection() {
  try {
    console.log('[TikTokAPI] Testing connection...');
    
    if (!API_KEY) {
      throw new Error('API key not configured');
    }

    // Test with a known public account
    await getUserInfo('tiktok');
    
    console.log('[TikTokAPI] Connection test successful');
    return { success: true, message: 'TikTok API connection successful' };
  } catch (error) {
    console.error('[TikTokAPI] Connection test failed:', error);
    return { 
      success: false, 
      message: `TikTok API connection failed: ${error.message}` 
    };
  }
}

/**
 * Get API status and quota information
 */
export function getApiStatus() {
  return {
    configured: !!API_KEY,
    baseUrl: API_BASE_URL,
    cacheSize: requestCache.size,
    lastCleared: null // Could track cache clearing
  };
}

/**
 * Clear request cache
 */
export function clearCache() {
  requestCache.clear();
  console.log('[TikTokAPI] Cache cleared');
}

// Export default API object
export default {
  getUserInfo,
  getUserPosts,
  getTrendingPosts,
  getPostDetail,
  importFromUsername,
  importTrending,
  quickImport,
  importFromUrl,
  validateAndExtractUsername,
  testConnection,
  getApiStatus,
  clearCache
};