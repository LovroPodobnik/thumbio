import React, { useState } from 'react';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import * as Avatar from '@radix-ui/react-avatar';
import { fetchBestPerformingVideos, fetchChannelVideos } from '../../services/youtubeApi';
import { 
  fetchBestPerformingTikToks, 
  fetchUserTikToks, 
  fetchTrendingTikToks,
  popularTikTokCreators 
} from '../../services/tiktokApiWrapper';
import { cn } from '../../lib/utils';
import { 
  X, 
  Plus,
  Link,
  Loader2,
  Download,
  Users,
  TrendingUp,
  Clipboard,
  ArrowLeft,
  Clock,
  Heart,
  Play,
  Music
} from 'lucide-react';

const ContentImportSidebar = ({ 
  isOpen, 
  onClose, 
  onVideosImported, 
  onCreateChannelHeader,
  sidebarWidth = 240 // Pass main sidebar width to position correctly
}) => {
  // Multi-platform state management
  const [view, setView] = useState('platforms'); // 'platforms', 'youtube-main', 'youtube-quick', 'youtube-url', 'tiktok-main', 'tiktok-trending', 'tiktok-user'
  const [selectedPlatform, setSelectedPlatform] = useState(null); // 'youtube' or 'tiktok'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [importingChannel, setImportingChannel] = useState(null);
  
  // URL Import state
  const [urlInput, setUrlInput] = useState('');
  const [importCriteria, setImportCriteria] = useState('views'); // 'views', 'recent', 'engagement'
  const [videoCount, setVideoCount] = useState(50);
  

  // Platform configuration
  const platforms = [
    {
      id: 'youtube',
      name: 'YouTube',
      description: 'Import thumbnails from YouTube channels and videos',
      icon: Play,
      color: 'red',
      gradient: 'from-red-600 to-red-500',
      hoverGradient: 'from-red-500 to-red-400',
      features: ['Quick Import', 'URL Import', 'Best Performers']
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      description: 'Import content from TikTok creators and trending videos',
      icon: Music,
      color: 'pink',
      gradient: 'from-pink-600 to-pink-500',
      hoverGradient: 'from-pink-500 to-pink-400',
      features: ['Trending Content', 'User Posts', 'Viral Analysis']
    }
  ];

  // YouTube popular channels data for quick import
  const youtubePopularChannels = [
    { handle: "@MrBeast", name: "MrBeast", subscribers: "329M", subscriberCount: 329000000, category: "Entertainment", avatar: "MB", trending: true, verified: true },
    { handle: "@PewDiePie", name: "PewDiePie", subscribers: "111M", subscriberCount: 111000000, category: "Gaming", avatar: "PD", verified: true },
    { handle: "@MarkRober", name: "Mark Rober", subscribers: "25M", subscriberCount: 25000000, category: "Science", avatar: "MR", verified: true },
    { handle: "@MKBHD", name: "Marques Brownlee", subscribers: "21M", subscriberCount: 21000000, category: "Tech", avatar: "MK", verified: true },
    { handle: "@kurzgesagt", name: "Kurzgesagt", subscribers: "23M", subscriberCount: 23000000, category: "Education", avatar: "KG", verified: true },
    { handle: "@Veritasium", name: "Veritasium", subscribers: "15M", subscriberCount: 15000000, category: "Education", avatar: "VT", verified: true },
    { handle: "@LinusTechTips", name: "Linus Tech Tips", subscribers: "16M", subscriberCount: 16000000, category: "Tech", avatar: "LT", verified: true },
    { handle: "@DudePerfect", name: "Dude Perfect", subscribers: "60M", subscriberCount: 60000000, category: "Entertainment", avatar: "DP", trending: true, verified: true },
  ];

  const handleQuickImport = async (channelHandle, channelName) => {
    setLoading(true);
    setError('');
    setImportingChannel(channelHandle);
    
    try {
      let result;
      
      // Call appropriate API based on selected platform
      if (selectedPlatform === 'tiktok') {
        result = await fetchBestPerformingTikToks(channelHandle, 50);
      } else {
        result = await fetchBestPerformingVideos(channelHandle, 50);
      }
      
      const { videos, channelInfo } = result;
      
      console.log(`[ContentImportSidebar] Imported ${videos.length} thumbnails from ${channelName} (${selectedPlatform})`);
      
      // Add platform information to the imported content
      const platformVideos = videos.map(video => ({
        ...video,
        platform: selectedPlatform || 'youtube',
        importSource: 'quick'
      }));
      
      const platformChannelInfo = {
        ...channelInfo,
        platform: selectedPlatform || 'youtube'
      };
      
      onVideosImported(platformVideos, platformChannelInfo);
      if (onCreateChannelHeader && channelInfo) {
        onCreateChannelHeader(channelInfo.title);
      }
      
      onClose();
    } catch (err) {
      console.error('[ContentImportSidebar] Import error:', err);
      setError(`Failed to import from ${channelName}. Please try again.`);
    } finally {
      setLoading(false);
      setImportingChannel(null);
    }
  };

  const handlePasteUrl = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrlInput(text);
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  const extractChannelFromVideoUrl = (url) => {
    // Extract video ID from various YouTube video URL formats
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (videoIdMatch) {
      return videoIdMatch[1];
    }
    return null;
  };

  const handleUrlImport = async () => {
    if (!urlInput.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      let channelInput = urlInput.trim();
      
      // Platform-specific URL validation
      if (selectedPlatform === 'youtube') {
        // Check if this is a video URL and handle it appropriately
        if (channelInput.includes('watch?v=') || channelInput.includes('youtu.be/')) {
          const videoId = extractChannelFromVideoUrl(channelInput);
          if (videoId) {
            // For video URLs, provide helpful message
            throw new Error('Video URLs are not directly supported. Please use the channel URL instead (e.g., youtube.com/@channelname)');
          }
        }
      } else if (selectedPlatform === 'tiktok') {
        // Clean TikTok username (remove @ and tiktok.com URLs)
        if (channelInput.includes('tiktok.com/@')) {
          channelInput = channelInput.split('tiktok.com/@')[1].split('/')[0];
        } else if (channelInput.startsWith('@')) {
          channelInput = channelInput.substring(1);
        }
      }
      
      // Map UI criteria to API sortBy values
      const sortByMapping = {
        'views': 'views',
        'recent': 'recency', 
        'engagement': 'engagement'
      };
      
      let result;
      
      if (selectedPlatform === 'tiktok') {
        // Use TikTok API
        if (importCriteria === 'views') {
          result = await fetchBestPerformingTikToks(channelInput, videoCount);
        } else {
          const sortBy = sortByMapping[importCriteria];
          result = await fetchUserTikToks(channelInput, videoCount, sortBy);
        }
      } else {
        // Use YouTube API (existing logic)
        if (importCriteria === 'views') {
          // For "Most Viewed", use the sophisticated algorithm from fetchBestPerformingVideos
          result = await fetchBestPerformingVideos(channelInput, videoCount);
        } else {
          // For Recent and Engagement, use fetchChannelVideos with sorting
          const sortBy = sortByMapping[importCriteria];
          result = await fetchChannelVideos(channelInput, videoCount, sortBy);
        }
      }
      
      const { videos, channelInfo } = result;
      
      console.log(`[ContentImportSidebar] Imported ${videos.length} thumbnails from URL (${importCriteria}, ${selectedPlatform}): ${channelInput}`);
      
      // Add platform information to the imported content
      const platformVideos = videos.map(video => ({
        ...video,
        platform: selectedPlatform || 'youtube',
        importSource: 'url',
        importCriteria: importCriteria
      }));
      
      const platformChannelInfo = {
        ...channelInfo,
        platform: selectedPlatform || 'youtube'
      };
      
      onVideosImported(platformVideos, platformChannelInfo);
      if (onCreateChannelHeader && channelInfo) {
        onCreateChannelHeader(channelInfo.title);
      }
      
      // Clear input and close sidebar after successful import
      setUrlInput('');
      onClose();
    } catch (err) {
      console.error('[ContentImportSidebar] URL import error:', err);
      setError(`Failed to import from URL. ${err.message || 'Please check the URL and try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  // Calculate the drawer width
  const drawerWidth = 380;
  
  return (
    <>
      {/* Content Import Drawer - positioned after main sidebar */}
      <div 
        className={cn(
          "fixed top-0 h-full z-30",
          "bg-gray-950 border-r border-gray-700",
          "flex flex-col",
          "transition-all duration-300 ease-out"
        )}
        style={{ 
          left: isOpen ? `${sidebarWidth}px` : `-${drawerWidth}px`,
          width: `${drawerWidth}px`
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700 bg-gray-900/95 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {view === 'platforms' && 'Import Content'}
            {view === 'youtube-main' && 'YouTube Import'}
            {view === 'youtube-quick' && 'Quick Import - YouTube'}
            {view === 'youtube-url' && 'Import from YouTube URL'}
            {view === 'tiktok-main' && 'TikTok Import'}
            {view === 'tiktok-trending' && 'Trending - TikTok'}
            {view === 'tiktok-user' && 'Import from TikTok User'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Back button for sub-views */}
        {view !== 'platforms' && (
          <div className="px-6 py-4 border-b border-gray-700/50">
            <button
              onClick={() => {
                if (view.startsWith('youtube-') || view.startsWith('tiktok-')) {
                  if (view.includes('-main')) {
                    setView('platforms');
                    setSelectedPlatform(null);
                  } else {
                    setView(selectedPlatform + '-main');
                  }
                } else {
                  setView('platforms');
                }
              }}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/80 rounded-lg transition-all duration-200 group"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center group-hover:bg-gray-700 transition-colors">
                <ArrowLeft className="w-4 h-4 group-hover:text-white" />
              </div>
              <span>
                {view.includes('-main') ? 'Back to platforms' : 
                 view.startsWith('youtube-') ? 'Back to YouTube options' :
                 view.startsWith('tiktok-') ? 'Back to TikTok options' :
                 'Back to import options'}
              </span>
            </button>
          </div>
        )}

        {/* Platform Selection View */}
        {view === 'platforms' && (
          <div className="flex-1 overflow-hidden">
            <div className="px-6 py-6 space-y-6">
              <p className="text-sm text-gray-300 leading-relaxed">
                Choose your platform to import content for analysis and competitive intelligence.
              </p>
              
              {/* Platform Options */}
              <div className="space-y-4">
                {platforms.map((platform) => {
                  const IconComponent = platform.icon;
                  return (
                    <button
                      key={platform.id}
                      onClick={() => {
                        setSelectedPlatform(platform.id);
                        setView(platform.id + '-main');
                        setError(''); // Clear any previous errors
                      }}
                      className={cn(
                        "w-full p-5 rounded-xl transition-all duration-200 text-left group shadow-lg hover:shadow-xl transform hover:scale-[1.02]",
                        `bg-gradient-to-r ${platform.gradient} hover:${platform.hoverGradient}`
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <IconComponent className="w-6 h-6 text-white" strokeWidth={2.5} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-white mb-1">{platform.name}</h3>
                          <p className="text-sm text-white/80 mb-2">{platform.description}</p>
                          <div className="flex gap-2 flex-wrap">
                            {platform.features.map((feature) => (
                              <span 
                                key={feature}
                                className="text-xs px-2 py-1 bg-white/20 rounded-full text-white/90"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                        <Plus className="w-5 h-5 text-white/80 group-hover:text-white group-hover:rotate-90 transition-all duration-200" />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Platform Comparison */}
              <div className="mt-8 p-4 bg-gray-800/50 border border-gray-700/50 rounded-xl backdrop-blur-sm">
                <h4 className="text-sm font-medium text-white mb-2">Multi-Platform Analysis</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Import content from multiple platforms to get comprehensive competitive insights and discover cross-platform trends.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* YouTube Main View */}
        {view === 'youtube-main' && (
          <div className="flex-1 overflow-hidden">
            <div className="px-6 py-6 space-y-4">
              <p className="text-sm text-gray-300 leading-relaxed">
                Choose how you'd like to import YouTube thumbnails for analysis and inspiration.
              </p>
              
              {/* YouTube Import Method Options */}
              <div className="space-y-4">
                <button
                  onClick={() => setView('youtube-quick')}
                  className="w-full p-5 bg-gradient-to-r from-red-600 to-red-500 rounded-xl hover:from-red-500 hover:to-red-400 transition-all duration-200 text-left group shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-white mb-1">Quick Import</h3>
                      <p className="text-sm text-red-100">Import from popular YouTube creators</p>
                    </div>
                    <Plus className="w-5 h-5 text-white/80 group-hover:text-white group-hover:rotate-90 transition-all duration-200" />
                  </div>
                </button>

                <button
                  onClick={() => setView('youtube-url')}
                  className="w-full p-5 bg-gray-800/80 border border-gray-600 rounded-xl hover:bg-gray-700/80 hover:border-gray-500 transition-all duration-200 text-left group backdrop-blur-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-700 flex items-center justify-center group-hover:bg-gray-600 transition-colors">
                      <Link className="w-6 h-6 text-gray-300 group-hover:text-white" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-white mb-1">Import from URL</h3>
                      <p className="text-sm text-gray-300">Paste YouTube video or channel links</p>
                    </div>
                    <Plus className="w-5 h-5 text-gray-400 group-hover:text-white group-hover:rotate-90 transition-all duration-200" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* YouTube Quick Import View */}
        {view === 'youtube-quick' && (
          <ScrollArea.Root className="flex-1 overflow-hidden">
            <ScrollArea.Viewport className="h-full w-full px-6 py-6">
              <div className="mb-6">
                <p className="text-sm text-gray-300 leading-relaxed">
                  Import thumbnails from top-performing YouTube creators with one click. Choose from our curated list of successful channels.
                </p>
              </div>

              <div className="space-y-3">
                {(selectedPlatform === 'tiktok' ? popularTikTokCreators : youtubePopularChannels).map((channel) => (
                      <div
                        key={channel.handle}
                        className={cn(
                          "group flex items-center gap-4 p-4 rounded-xl bg-gray-800/50 border border-gray-700/50",
                          "hover:bg-gray-800/80 hover:border-gray-600/50 transition-all duration-200",
                          "backdrop-blur-sm hover:shadow-lg",
                          importingChannel === channel.handle && "opacity-60 animate-pulse"
                        )}
                      >
                        {/* Avatar */}
                        <Avatar.Root className="relative flex-shrink-0">
                          <Avatar.Fallback className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                            {channel.avatar}
                          </Avatar.Fallback>
                          {channel.verified && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-2 border-gray-950">
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </Avatar.Root>
                        
                        {/* Channel Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white truncate">
                              {channel.name}
                            </span>
                            {channel.trending && (
                              <span className="text-[11px] px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded font-medium">
                                HOT
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {channel.subscribers}
                            </span>
                            <span className="text-xs text-gray-400">
                              {channel.category}
                            </span>
                          </div>
                        </div>
                        
                        {/* Import Button */}
                        <button
                          onClick={() => handleQuickImport(channel.handle, channel.name)}
                          disabled={loading}
                          className={cn(
                            "px-3.5 py-2.5 text-sm font-medium rounded-md transition-all",
                            "bg-blue-600 text-white",
                            "hover:bg-blue-500",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            "flex items-center gap-1.5",
                            "shadow-sm"
                          )}
                        >
                          {importingChannel === channel.handle ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Loading</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span>Import</span>
                            </>
                          )}
                        </button>
                      </div>
                ))}
              </div>
            </ScrollArea.Viewport>
                
                <ScrollArea.Scrollbar 
                  className="flex select-none touch-none p-0.5 bg-transparent transition-colors duration-[160ms] ease-out hover:bg-gray-800/50 data-[orientation=vertical]:w-2.5"
                  orientation="vertical"
                >
                  <ScrollArea.Thumb className="flex-1 bg-gray-600 rounded-full hover:bg-gray-500 transition-colors" />
                </ScrollArea.Scrollbar>
              </ScrollArea.Root>
        )}

        {/* TikTok Main View */}
        {view === 'tiktok-main' && (
          <div className="flex-1 overflow-hidden">
            <div className="px-6 py-6 space-y-4">
              <p className="text-sm text-gray-300 leading-relaxed">
                Import TikTok content for competitive analysis and trend discovery.
              </p>
              
              {/* TikTok Import Method Options */}
              <div className="space-y-4">
                <button
                  onClick={() => setView('tiktok-trending')}
                  className="w-full p-5 bg-gradient-to-r from-pink-600 to-pink-500 rounded-xl hover:from-pink-500 hover:to-pink-400 transition-all duration-200 text-left group shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-white mb-1">Trending Content</h3>
                      <p className="text-sm text-pink-100">Discover viral TikTok trends and hashtags</p>
                    </div>
                    <Plus className="w-5 h-5 text-white/80 group-hover:text-white group-hover:rotate-90 transition-all duration-200" />
                  </div>
                </button>

                <button
                  onClick={() => setView('tiktok-user')}
                  className="w-full p-5 bg-gray-800/80 border border-gray-600 rounded-xl hover:bg-gray-700/80 hover:border-gray-500 transition-all duration-200 text-left group backdrop-blur-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-700 flex items-center justify-center group-hover:bg-gray-600 transition-colors">
                      <Users className="w-6 h-6 text-gray-300 group-hover:text-white" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-white mb-1">Import from User</h3>
                      <p className="text-sm text-gray-300">Analyze specific TikTok creators</p>
                    </div>
                    <Plus className="w-5 h-5 text-gray-400 group-hover:text-white group-hover:rotate-90 transition-all duration-200" />
                  </div>
                </button>

                {/* Coming Soon placeholder */}
                <div className="p-4 bg-gray-800/30 border border-gray-700/30 rounded-xl opacity-60">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-700/50 flex items-center justify-center">
                      <Music className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-400">More TikTok features coming soon</p>
                      <p className="text-xs text-gray-500">Hashtag analysis, sound trends, and more</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TikTok Trending View */}
        {view === 'tiktok-trending' && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="mb-6">
                <p className="text-sm text-gray-300 leading-relaxed mb-4">
                  Import trending TikTok content to discover viral patterns and emerging trends.
                </p>
                
                {/* Region Selector */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-white mb-2 block">
                    Region
                  </label>
                  <div className="flex gap-2">
                    {['US', 'UK', 'JP', 'KR'].map((region) => (
                      <button
                        key={region}
                        className="flex-1 py-2 text-sm font-medium rounded-md transition-colors bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
                      >
                        {region}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Video Count Selector */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-white mb-2 block">
                    Count
                  </label>
                  <div className="flex gap-2">
                    {[20, 30, 50].map((count) => (
                      <button
                        key={count}
                        onClick={() => setVideoCount(count)}
                        className={cn(
                          "flex-1 py-2 text-sm font-medium rounded-md transition-colors",
                          videoCount === count
                            ? "bg-pink-600 text-white shadow-sm"
                            : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
                        )}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Import Button - Fixed at bottom */}
            <div className="border-t border-gray-700 p-6">
              <button
                onClick={async () => {
                  setLoading(true);
                  setError('');
                  try {
                    const result = await fetchTrendingTikToks(videoCount, 'US');
                    const platformVideos = result.videos.map(video => ({
                      ...video,
                      platform: 'tiktok',
                      importSource: 'trending'
                    }));
                    
                    onVideosImported(platformVideos, {
                      title: 'TikTok Trending',
                      platform: 'tiktok',
                      metadata: result.metadata
                    });
                    onClose();
                  } catch (err) {
                    console.error('[ContentImportSidebar] TikTok trending import error:', err);
                    setError(`Failed to import trending TikToks: ${err.message}`);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className={cn(
                  "w-full py-2.5 text-sm font-medium rounded-md transition-colors",
                  "bg-pink-600 text-white",
                  "hover:bg-pink-500",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "flex items-center gap-2 justify-center",
                  "shadow-sm"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Importing trending TikToks...</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    <span>Import {videoCount} Trending TikToks</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TikTok User View */}
        {view === 'tiktok-user' && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="mb-6">
                <p className="text-sm text-gray-300 leading-relaxed mb-4">
                  Import content from specific TikTok creators by entering their username.
                </p>
                  
                {/* Username Input */}
                <div className="relative mb-4">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="@username or tiktok.com/@username"
                    className={cn(
                      "w-full px-4 py-3 pr-24 bg-gray-800 border border-gray-700 rounded-lg",
                      "text-white placeholder-gray-500",
                      "focus:outline-none focus:border-pink-500 transition-colors"
                    )}
                  />
                  <button
                    onClick={handlePasteUrl}
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2",
                      "px-3 py-1.5 text-sm bg-gray-700 text-gray-300 rounded-md",
                      "hover:bg-gray-600 hover:text-white transition-colors",
                      "flex items-center gap-1.5"
                    )}
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                    <span>Paste</span>
                  </button>
                </div>

                {/* Import Strategy */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-white mb-3">Sort by</h4>
                  
                  <div className="flex gap-2">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="importCriteria"
                        value="views"
                        checked={importCriteria === 'views'}
                        onChange={(e) => setImportCriteria(e.target.value)}
                        className="sr-only"
                      />
                      <div className={cn(
                        "flex items-center gap-2 p-3 rounded-lg border transition-colors",
                        importCriteria === 'views'
                          ? "bg-pink-600/20 border-pink-500 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600"
                      )}>
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-medium">Popular</span>
                      </div>
                    </label>

                    <label className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="importCriteria"
                        value="recent"
                        checked={importCriteria === 'recent'}
                        onChange={(e) => setImportCriteria(e.target.value)}
                        className="sr-only"
                      />
                      <div className={cn(
                        "flex items-center gap-2 p-3 rounded-lg border transition-colors",
                        importCriteria === 'recent'
                          ? "bg-green-600/20 border-green-500 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600"
                      )}>
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">Recent</span>
                      </div>
                    </label>

                    <label className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="importCriteria"
                        value="engagement"
                        checked={importCriteria === 'engagement'}
                        onChange={(e) => setImportCriteria(e.target.value)}
                        className="sr-only"
                      />
                      <div className={cn(
                        "flex items-center gap-2 p-3 rounded-lg border transition-colors",
                        importCriteria === 'engagement'
                          ? "bg-red-600/20 border-red-500 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600"
                      )}>
                        <Heart className="w-4 h-4" />
                        <span className="text-sm font-medium">Engaging</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Video Count Selector */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-white mb-2 block">
                    Count
                  </label>
                  <div className="flex gap-2">
                    {[25, 50, 75].map((count) => (
                      <button
                        key={count}
                        onClick={() => setVideoCount(count)}
                        className={cn(
                          "flex-1 py-2 text-sm font-medium rounded-md transition-colors",
                          videoCount === count
                            ? "bg-pink-600 text-white shadow-sm"
                            : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
                        )}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Import Button - Fixed at bottom */}
            <div className="border-t border-gray-700 p-6">
              <button
                onClick={handleUrlImport}
                disabled={!urlInput || loading}
                className={cn(
                  "w-full py-2.5 text-sm font-medium rounded-md transition-colors",
                  "bg-pink-600 text-white",
                  "hover:bg-pink-500",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "flex items-center gap-2 justify-center",
                  "shadow-sm"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Importing {videoCount} TikToks...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>
                      Import {videoCount} TikToks {
                        importCriteria === 'views' ? '(Popular)' :
                        importCriteria === 'recent' ? '(Recent)' :
                        importCriteria === 'engagement' ? '(Engaging)' :
                        ''
                      }
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* YouTube URL Import View */}
        {view === 'youtube-url' && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="mb-6">
                <p className="text-sm text-gray-300 leading-relaxed mb-4">
                  Import thumbnails from any YouTube channel by pasting a URL.
                </p>
                  
                  {/* URL Input */}
                  <div className="relative">
                    <input
                      type="text"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className={cn(
                        "w-full px-4 py-3 pr-24 bg-gray-800 border border-gray-700 rounded-lg",
                        "text-white placeholder-gray-500",
                        "focus:outline-none focus:border-blue-500 transition-colors"
                      )}
                    />
                    <button
                      onClick={handlePasteUrl}
                      className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2",
                        "px-3 py-1.5 text-sm bg-gray-700 text-gray-300 rounded-md",
                        "hover:bg-gray-600 hover:text-white transition-colors",
                        "flex items-center gap-1.5"
                      )}
                    >
                      <Clipboard className="w-3.5 h-3.5" />
                      <span>Paste</span>
                    </button>
                  </div>
                </div>

                {/* Import Strategy */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-white mb-3">Sort by</h4>
                  
                  <div className="flex gap-2">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="importCriteria"
                        value="views"
                        checked={importCriteria === 'views'}
                        onChange={(e) => setImportCriteria(e.target.value)}
                        className="sr-only"
                      />
                      <div className={cn(
                        "flex items-center gap-2 p-3 rounded-lg border transition-colors",
                        importCriteria === 'views'
                          ? "bg-blue-600/20 border-blue-500 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600"
                      )}>
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-medium">Views</span>
                      </div>
                    </label>

                    <label className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="importCriteria"
                        value="recent"
                        checked={importCriteria === 'recent'}
                        onChange={(e) => setImportCriteria(e.target.value)}
                        className="sr-only"
                      />
                      <div className={cn(
                        "flex items-center gap-2 p-3 rounded-lg border transition-colors",
                        importCriteria === 'recent'
                          ? "bg-green-600/20 border-green-500 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600"
                      )}>
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">Recent</span>
                      </div>
                    </label>

                    <label className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="importCriteria"
                        value="engagement"
                        checked={importCriteria === 'engagement'}
                        onChange={(e) => setImportCriteria(e.target.value)}
                        className="sr-only"
                      />
                      <div className={cn(
                        "flex items-center gap-2 p-3 rounded-lg border transition-colors",
                        importCriteria === 'engagement'
                          ? "bg-red-600/20 border-red-500 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600"
                      )}>
                        <Heart className="w-4 h-4" />
                        <span className="text-sm font-medium">Engaging</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Video Count Selector */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-white mb-2 block">
                    Count
                  </label>
                  <div className="flex gap-2">
                    {[25, 50, 75].map((count) => (
                      <button
                        key={count}
                        onClick={() => setVideoCount(count)}
                        className={cn(
                          "flex-1 py-2 text-sm font-medium rounded-md transition-colors",
                          videoCount === count
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
                        )}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>
            </div>
            
            {/* Import Button - Fixed at bottom */}
            <div className="border-t border-gray-700 p-6">
              <button
                onClick={handleUrlImport}
                disabled={!urlInput || loading}
                className={cn(
                  "w-full py-2.5 text-sm font-medium rounded-md transition-colors",
                  "bg-blue-600 text-white",
                  "hover:bg-blue-500",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "flex items-center gap-2 justify-center",
                  "shadow-sm"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Importing {videoCount} thumbnails...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>
                      Import {videoCount} {
                        importCriteria === 'views' ? 'by Views' :
                        importCriteria === 'recent' ? 'Recent' :
                        importCriteria === 'engagement' ? 'Engaging' :
                        'Thumbnails'
                      }
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}


        {/* Error Message */}
        {error && (
          <div className="mx-6 mb-6 p-3 bg-red-900/20 border border-red-700 rounded-md">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
      </div>
    </>
  );
};

export default ContentImportSidebar;