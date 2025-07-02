// TikTok API Wrapper - Mirrors YouTube API interface for consistency
import { 
  getTrendingPosts, 
  getUserInfo, 
  getUserPosts, 
  searchTikTok,
  calculateEngagementRate 
} from './tiktokApi';

/**
 * Fetch best performing TikTok videos from a user
 * Mirrors fetchBestPerformingVideos from YouTube API
 * @param {string} username - TikTok username (with or without @)
 * @param {number} maxResults - Maximum number of videos to fetch (default: 50)
 * @returns {Promise<Object>} { videos, channelInfo }
 */
export const fetchBestPerformingTikToks = async (username, maxResults = 50) => {
  try {
    console.log(`[TikTok Wrapper] Fetching best performing TikToks for: ${username}`);
    
    // Get user posts sorted by popularity
    const result = await getUserPosts(username, maxResults, 'popular');
    
    // Calculate engagement rates and sort by performance
    const videosWithEngagement = result.posts.map(post => ({
      ...post,
      engagement: calculateEngagementRate(post),
      // Map to YouTube-like structure for compatibility
      snippet: {
        title: post.title,
        description: post.description,
        channelTitle: post.creator.displayName,
        channelId: post.creator.username,
        publishedAt: post.createdAt,
        thumbnails: {
          default: { url: post.thumbnailUrl },
          medium: { url: post.thumbnailUrl },
          high: { url: post.thumbnailUrl },
          maxres: { url: post.thumbnailUrl }
        }
      },
      statistics: {
        viewCount: post.metrics.viewCount,
        likeCount: post.metrics.likeCount,
        commentCount: post.metrics.commentCount,
        shareCount: post.metrics.shareCount
      }
    }));
    
    // Sort by combined performance score (views + engagement)
    const sortedVideos = videosWithEngagement.sort((a, b) => {
      const scoreA = (a.metrics.viewCount * 0.7) + (a.engagement * a.metrics.viewCount * 0.3);
      const scoreB = (b.metrics.viewCount * 0.7) + (b.engagement * b.metrics.viewCount * 0.3);
      return scoreB - scoreA;
    });
    
    // Format channel info to match YouTube structure
    const channelInfo = {
      id: result.userInfo.username,
      title: result.userInfo.displayName,
      description: result.userInfo.bio,
      thumbnails: {
        default: { url: result.userInfo.avatar },
        medium: { url: result.userInfo.avatar },
        high: { url: result.userInfo.avatar }
      },
      statistics: {
        subscriberCount: result.userInfo.metrics.followerCount,
        videoCount: result.userInfo.metrics.videoCount,
        viewCount: result.userInfo.metrics.likeCount // TikTok uses total likes instead of total views
      },
      platform: 'tiktok'
    };
    
    console.log(`[TikTok Wrapper] Successfully fetched ${sortedVideos.length} TikToks from ${username}`);
    
    return {
      videos: sortedVideos.slice(0, maxResults),
      channelInfo
    };
    
  } catch (error) {
    console.error('[TikTok Wrapper] Error in fetchBestPerformingTikToks:', error);
    throw new Error(`Failed to fetch TikTok content for ${username}: ${error.message}`);
  }
};

/**
 * Fetch TikTok user videos with sorting
 * Mirrors fetchChannelVideos from YouTube API
 * @param {string} username - TikTok username
 * @param {number} maxResults - Maximum number of videos
 * @param {string} sortBy - Sort criteria: 'views', 'recency', 'engagement'
 * @returns {Promise<Object>} { videos, channelInfo }
 */
export const fetchUserTikToks = async (username, maxResults = 30, sortBy = 'views') => {
  try {
    console.log(`[TikTok Wrapper] Fetching user TikToks: ${username}, sort: ${sortBy}`);
    
    // Map sortBy to TikTok API parameters
    const tikTokSortBy = sortBy === 'recency' ? 'recent' : 'popular';
    
    const result = await getUserPosts(username, maxResults, tikTokSortBy);
    
    // Transform and sort videos
    let processedVideos = result.posts.map(post => ({
      ...post,
      engagement: calculateEngagementRate(post),
      snippet: {
        title: post.title,
        description: post.description,
        channelTitle: post.creator.displayName,
        channelId: post.creator.username,
        publishedAt: post.createdAt,
        thumbnails: {
          default: { url: post.thumbnailUrl },
          medium: { url: post.thumbnailUrl },
          high: { url: post.thumbnailUrl },
          maxres: { url: post.thumbnailUrl }
        }
      },
      statistics: {
        viewCount: post.metrics.viewCount,
        likeCount: post.metrics.likeCount,
        commentCount: post.metrics.commentCount,
        shareCount: post.metrics.shareCount
      }
    }));
    
    // Apply additional sorting if needed
    if (sortBy === 'views') {
      processedVideos.sort((a, b) => b.metrics.viewCount - a.metrics.viewCount);
    } else if (sortBy === 'engagement') {
      processedVideos.sort((a, b) => b.engagement - a.engagement);
    } else if (sortBy === 'recency') {
      processedVideos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    // Format channel info
    const channelInfo = {
      id: result.userInfo.username,
      title: result.userInfo.displayName,
      description: result.userInfo.bio,
      thumbnails: {
        default: { url: result.userInfo.avatar },
        medium: { url: result.userInfo.avatar },
        high: { url: result.userInfo.avatar }
      },
      statistics: {
        subscriberCount: result.userInfo.metrics.followerCount,
        videoCount: result.userInfo.metrics.videoCount,
        viewCount: result.userInfo.metrics.likeCount
      },
      platform: 'tiktok'
    };
    
    console.log(`[TikTok Wrapper] Successfully fetched ${processedVideos.length} user TikToks`);
    
    return {
      videos: processedVideos.slice(0, maxResults),
      channelInfo
    };
    
  } catch (error) {
    console.error('[TikTok Wrapper] Error in fetchUserTikToks:', error);
    throw new Error(`Failed to fetch TikTok videos for ${username}: ${error.message}`);
  }
};

/**
 * Fetch trending TikTok content
 * @param {number} maxResults - Maximum number of trending videos (default: 30)
 * @param {string} region - Region code (default: 'US')
 * @returns {Promise<Object>} { videos, metadata }
 */
export const fetchTrendingTikToks = async (maxResults = 30, region = 'US') => {
  try {
    console.log(`[TikTok Wrapper] Fetching trending TikToks: ${maxResults} from ${region}`);
    
    const result = await getTrendingPosts(maxResults, region);
    
    // Transform trending posts to match video structure
    const processedVideos = result.posts.map(post => ({
      ...post,
      engagement: calculateEngagementRate(post),
      snippet: {
        title: post.title,
        description: post.description,
        channelTitle: post.creator.displayName,
        channelId: post.creator.username,
        publishedAt: post.createdAt,
        thumbnails: {
          default: { url: post.thumbnailUrl },
          medium: { url: post.thumbnailUrl },
          high: { url: post.thumbnailUrl },
          maxres: { url: post.thumbnailUrl }
        }
      },
      statistics: {
        viewCount: post.metrics.viewCount,
        likeCount: post.metrics.likeCount,
        commentCount: post.metrics.commentCount,
        shareCount: post.metrics.shareCount
      }
    }));
    
    console.log(`[TikTok Wrapper] Successfully fetched ${processedVideos.length} trending TikToks`);
    
    return {
      videos: processedVideos,
      metadata: result.metadata
    };
    
  } catch (error) {
    console.error('[TikTok Wrapper] Error in fetchTrendingTikToks:', error);
    throw new Error(`Failed to fetch trending TikToks: ${error.message}`);
  }
};

/**
 * Search TikTok videos
 * @param {string} query - Search query
 * @param {number} maxResults - Maximum number of results (default: 20)
 * @param {string} sortBy - Sort criteria (default: 'relevance')
 * @returns {Promise<Array>} Array of video data
 */
export const searchTikTokVideos = async (query, maxResults = 20, sortBy = 'relevance') => {
  try {
    console.log(`[TikTok Wrapper] Searching TikTok videos: "${query}"`);
    
    const result = await searchTikTok(query, maxResults, 'video');
    
    // Transform search results
    const processedVideos = result.results.map(post => ({
      ...post,
      engagement: calculateEngagementRate(post),
      snippet: {
        title: post.title,
        description: post.description,
        channelTitle: post.creator.displayName,
        channelId: post.creator.username,
        publishedAt: post.createdAt,
        thumbnails: {
          default: { url: post.thumbnailUrl },
          medium: { url: post.thumbnailUrl },
          high: { url: post.thumbnailUrl },
          maxres: { url: post.thumbnailUrl }
        }
      },
      statistics: {
        viewCount: post.metrics.viewCount,
        likeCount: post.metrics.likeCount,
        commentCount: post.metrics.commentCount,
        shareCount: post.metrics.shareCount
      }
    }));
    
    console.log(`[TikTok Wrapper] Successfully searched ${processedVideos.length} TikTok videos`);
    
    return processedVideos;
    
  } catch (error) {
    console.error('[TikTok Wrapper] Error in searchTikTokVideos:', error);
    throw new Error(`Failed to search TikTok videos for "${query}": ${error.message}`);
  }
};

// Popular TikTok creators for quick import (equivalent to YouTube popularChannels)
export const popularTikTokCreators = [
  { 
    handle: "@khaby.lame", 
    name: "Khaby Lame", 
    followers: "161M", 
    followerCount: 161000000, 
    category: "Comedy", 
    avatar: "KL", 
    trending: true, 
    verified: true 
  },
  { 
    handle: "@charlidamelio", 
    name: "Charli D'Amelio", 
    followers: "151M", 
    followerCount: 151000000, 
    category: "Dance", 
    avatar: "CD", 
    trending: true, 
    verified: true 
  },
  { 
    handle: "@bellapoarch", 
    name: "Bella Poarch", 
    followers: "93M", 
    followerCount: 93000000, 
    category: "Music", 
    avatar: "BP", 
    verified: true 
  },
  { 
    handle: "@addisonre", 
    name: "Addison Rae", 
    followers: "88M", 
    followerCount: 88000000, 
    category: "Dance", 
    avatar: "AR", 
    verified: true 
  },
  { 
    handle: "@willsmith", 
    name: "Will Smith", 
    followers: "73M", 
    followerCount: 73000000, 
    category: "Entertainment", 
    avatar: "WS", 
    verified: true 
  },
  { 
    handle: "@zachking", 
    name: "Zach King", 
    followers: "70M", 
    followerCount: 70000000, 
    category: "Magic", 
    avatar: "ZK", 
    verified: true 
  },
  { 
    handle: "@kimberly.loaiza", 
    name: "Kimberly Loaiza", 
    followers: "66M", 
    followerCount: 66000000, 
    category: "Music", 
    avatar: "KM", 
    verified: true 
  },
  { 
    handle: "@tiktok", 
    name: "TikTok", 
    followers: "65M", 
    followerCount: 65000000, 
    category: "Official", 
    avatar: "TT", 
    trending: true, 
    verified: true 
  }
];

export default {
  fetchBestPerformingTikToks,
  fetchUserTikToks,
  fetchTrendingTikToks,
  searchTikTokVideos,
  popularTikTokCreators
};