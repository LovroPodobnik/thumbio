import React, { useState, useEffect } from 'react';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import * as Avatar from '@radix-ui/react-avatar';
import { cn } from '../../lib/utils';
import { 
  X, 
  Plus,
  Loader2,
  Download,
  Users,
  Clipboard,
  ArrowLeft,
  Clock,
  Heart,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

// Import the platform system
import { ensureInitialized, getPlatformConfigs, getPlatform } from '../../services/platforms/index.js';

const ContentImportSidebar = ({ 
  isOpen, 
  onClose, 
  onVideosImported, 
  onCreateChannelHeader,
  sidebarWidth = 240
}) => {
  // Platform system state
  const [platforms, setPlatforms] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [view, setView] = useState('platforms'); // 'platforms', 'platform-main', 'platform-method'
  const [selectedMethod, setSelectedMethod] = useState(null);

  // Import state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [importingChannel, setImportingChannel] = useState(null);
  
  // Form state
  const [urlInput, setUrlInput] = useState('');
  const [importCriteria, setImportCriteria] = useState('views');
  const [videoCount, setVideoCount] = useState(50);

  // Initialize platform system and load platforms
  useEffect(() => {
    try {
      ensureInitialized();
      const platformConfigs = getPlatformConfigs();
      setPlatforms(platformConfigs);
      
      // Auto-select first available platform if only one
      if (platformConfigs.length === 1) {
        setSelectedPlatform(platformConfigs[0]);
        setView('platform-main');
      }
    } catch (error) {
      console.error('[ContentImportSidebar] Failed to initialize platforms:', error);
      setError('Failed to initialize import platforms');
    }
  }, []);

  // Reset state when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      setView(platforms.length === 1 ? 'platform-main' : 'platforms');
      setSelectedMethod(null);
      setError('');
      setUrlInput('');
      setImportingChannel(null);
    }
  }, [isOpen, platforms.length]);

  const handlePlatformSelect = (platform) => {
    setSelectedPlatform(platform);
    setView('platform-main');
    setError('');
  };

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
    setView('platform-method');
    setError('');
  };

  const handleBackClick = () => {
    if (view === 'platform-method') {
      setView('platform-main');
      setSelectedMethod(null);
    } else if (view === 'platform-main') {
      setView('platforms');
      setSelectedPlatform(null);
    }
  };

  const handleQuickImport = async (channelHandle, channelName) => {
    if (!selectedPlatform) return;
    
    setLoading(true);
    setError('');
    setImportingChannel(channelHandle);
    
    try {
      const platform = getPlatform(selectedPlatform.id);
      const result = await platform.quickImport(channelHandle, channelName, 50);
      
      console.log(`[ContentImportSidebar] Imported ${result.videos.length} items from ${channelName}`);
      
      onVideosImported(result.videos, result.channelInfo);
      if (onCreateChannelHeader && result.channelInfo) {
        onCreateChannelHeader(result.channelInfo.title);
      }
      
      onClose();
    } catch (err) {
      console.error('[ContentImportSidebar] Quick import error:', err);
      setError(err.message || `Failed to import from ${channelName}. Please try again.`);
    } finally {
      setLoading(false);
      setImportingChannel(null);
    }
  };

  const handleUrlImport = async () => {
    if (!urlInput.trim() || !selectedPlatform) return;
    
    setLoading(true);
    setError('');
    
    try {
      const platform = getPlatform(selectedPlatform.id);
      const result = await platform.importFromUrl(urlInput.trim(), importCriteria, videoCount);
      
      console.log(`[ContentImportSidebar] Imported ${result.videos.length} items from URL`);
      
      onVideosImported(result.videos, result.channelInfo);
      if (onCreateChannelHeader && result.channelInfo) {
        onCreateChannelHeader(result.channelInfo.title);
      }
      
      setUrlInput('');
      onClose();
    } catch (err) {
      console.error('[ContentImportSidebar] URL import error:', err);
      setError(err.message || 'Failed to import from URL. Please check the URL and try again.');
    } finally {
      setLoading(false);
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

  const getTitle = () => {
    if (view === 'platforms') return 'Import Content';
    if (view === 'platform-main') return `${selectedPlatform?.name} Import`;
    if (view === 'platform-method') {
      const methodName = selectedMethod?.name || 'Import';
      return `${methodName} - ${selectedPlatform?.name}`;
    }
    return 'Import Content';
  };

  const drawerWidth = 380;

  return (
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
          {getTitle()}
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
      {view !== 'platforms' && platforms.length > 1 && (
        <div className="px-6 py-4 border-b border-gray-700/50">
          <button
            onClick={handleBackClick}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/80 rounded-lg transition-all duration-200 group"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center group-hover:bg-gray-700 transition-colors">
              <ArrowLeft className="w-4 h-4 group-hover:text-white" />
            </div>
            <span>
              {view === 'platform-method' ? `Back to ${selectedPlatform?.name} options` : 'Back to platforms'}
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
            
            {platforms.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No Platforms Available</h3>
                  <p className="text-sm text-gray-400">No import platforms are currently configured.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {platforms.map((platform) => {
                  const IconComponent = platform.icon;
                  const isDisabled = !platform.status.ready;
                  
                  return (
                    <button
                      key={platform.id}
                      onClick={() => !isDisabled && handlePlatformSelect(platform)}
                      disabled={isDisabled}
                      className={cn(
                        "w-full p-5 rounded-xl transition-all duration-200 text-left group shadow-lg",
                        isDisabled 
                          ? "bg-gray-800/50 border border-gray-700/50 cursor-not-allowed opacity-75"
                          : `bg-gradient-to-r ${platform.gradient} hover:${platform.hoverGradient} hover:shadow-xl transform hover:scale-[1.02]`
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          isDisabled ? "bg-gray-700/50" : "bg-white/20 backdrop-blur-sm"
                        )}>
                          <IconComponent className={cn(
                            "w-6 h-6",
                            isDisabled ? "text-gray-400" : "text-white"
                          )} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1">
                          <h3 className={cn(
                            "text-base font-semibold mb-1",
                            isDisabled ? "text-gray-400" : "text-white"
                          )}>
                            {platform.name}
                            {isDisabled && (
                              <span className="ml-2 text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-300 rounded-full">
                                DISABLED
                              </span>
                            )}
                          </h3>
                          <p className={cn(
                            "text-sm mb-2",
                            isDisabled ? "text-gray-500" : "text-white/80"
                          )}>
                            {platform.description}
                          </p>
                          {!isDisabled && (
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
                          )}
                          {isDisabled && platform.status.errors.length > 0 && (
                            <p className="text-xs text-red-400 mt-1">
                              {platform.status.errors[0]}
                            </p>
                          )}
                        </div>
                        {!isDisabled && (
                          <Plus className="w-5 h-5 text-white/80 group-hover:text-white group-hover:rotate-90 transition-all duration-200" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Platform Main View */}
      {view === 'platform-main' && selectedPlatform && (
        <div className="flex-1 overflow-hidden">
          <div className="px-6 py-6 space-y-4">
            <p className="text-sm text-gray-300 leading-relaxed">
              Choose how you'd like to import {selectedPlatform.name} content for analysis and inspiration.
            </p>
            
            <div className="space-y-4">
              {(() => {
                const platform = getPlatform(selectedPlatform.id);
                const methods = platform?.getImportMethods() || [];
                
                return methods.map((method) => {
                  const IconComponent = method.icon;
                  const isDisabled = method.requiresSubscription && !selectedPlatform.status.ready;
                  
                  return (
                    <button
                      key={method.id}
                      onClick={() => !isDisabled && handleMethodSelect(method)}
                      disabled={isDisabled}
                      className={cn(
                        "w-full p-5 rounded-xl transition-all duration-200 text-left group shadow-lg",
                        isDisabled 
                          ? "bg-gray-800/50 border border-gray-600/50 cursor-not-allowed opacity-75"
                          : method.primary
                            ? `bg-gradient-to-r ${method.gradient} hover:${method.hoverGradient} hover:shadow-xl transform hover:scale-[1.02]`
                            : "bg-gray-800/80 border border-gray-600 hover:bg-gray-700/80 hover:border-gray-500 backdrop-blur-sm"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          isDisabled 
                            ? "bg-gray-700/50" 
                            : method.primary 
                              ? "bg-white/20 backdrop-blur-sm" 
                              : "bg-gray-700 group-hover:bg-gray-600"
                        )}>
                          <IconComponent className={cn(
                            "w-6 h-6",
                            isDisabled 
                              ? "text-gray-400"
                              : method.primary 
                                ? "text-white" 
                                : "text-gray-300 group-hover:text-white"
                          )} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1">
                          <h3 className={cn(
                            "text-base font-semibold mb-1",
                            isDisabled ? "text-gray-400" : "text-white"
                          )}>
                            {method.name}
                            {method.requiresSubscription && (
                              <span className="ml-2 text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-300 rounded-full">
                                SUBSCRIPTION
                              </span>
                            )}
                          </h3>
                          <p className={cn(
                            "text-sm",
                            isDisabled 
                              ? "text-gray-500"
                              : method.primary 
                                ? "text-white/80" 
                                : "text-gray-300"
                          )}>
                            {method.description}
                          </p>
                        </div>
                        {!isDisabled && (
                          <Plus className={cn(
                            "w-5 h-5 group-hover:rotate-90 transition-all duration-200",
                            method.primary ? "text-white/80 group-hover:text-white" : "text-gray-400 group-hover:text-white"
                          )} />
                        )}
                        {method.requiresSubscription && isDisabled && (
                          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Method-Specific Views */}
      {view === 'platform-method' && selectedPlatform && selectedMethod && (
        <>
          {/* Quick Import View */}
          {selectedMethod.id === 'quick' && (
            <ScrollArea.Root className="flex-1 overflow-hidden">
              <ScrollArea.Viewport className="h-full w-full px-6 py-6">
                <div className="mb-6">
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Import content from top-performing {selectedPlatform.name} creators with one click.
                  </p>
                </div>

                <div className="space-y-3">
                  {(() => {
                    const platform = getPlatform(selectedPlatform.id);
                    const channels = platform?.getPopularChannels() || [];
                    
                    return channels.map((channel) => (
                      <div
                        key={channel.handle}
                        className={cn(
                          "group flex items-center gap-4 p-4 rounded-xl bg-gray-800/50 border border-gray-700/50",
                          "hover:bg-gray-800/80 hover:border-gray-600/50 transition-all duration-200",
                          "backdrop-blur-sm hover:shadow-lg",
                          importingChannel === channel.handle && "opacity-60 animate-pulse"
                        )}
                      >
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
                              {channel.subscribers || channel.followers}
                            </span>
                            <span className="text-xs text-gray-400">
                              {channel.category}
                            </span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleQuickImport(channel.handle, channel.name)}
                          disabled={loading}
                          className={cn(
                            "px-3.5 py-2.5 text-sm font-medium rounded-md transition-all",
                            "bg-blue-600 text-white hover:bg-blue-500",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            "flex items-center gap-1.5 shadow-sm"
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
                    ));
                  })()}
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

          {/* Trending Import View */}
          {selectedMethod.id === 'trending' && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="mb-6">
                  <p className="text-sm text-gray-300 leading-relaxed mb-4">
                    Discover viral {selectedPlatform.name} content and trending thumbnails from the current hottest posts.
                  </p>
                </div>

                {/* Video Count Selector */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-white mb-2 block">
                    Number of trending posts to import
                  </label>
                  <div className="flex gap-2">
                    {[16, 30, 50].map((count) => (
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
              
              {/* Import Button */}
              <div className="border-t border-gray-700 p-6">
                <button
                  onClick={async () => {
                    if (!selectedPlatform) return;
                    
                    setLoading(true);
                    setError('');
                    
                    try {
                      const platform = getPlatform(selectedPlatform.id);
                      const result = await platform.importTrending(videoCount);
                      
                      console.log(`[ContentImportSidebar] Imported ${result.videos.length} trending items`);
                      
                      onVideosImported(result.videos, result.channelInfo);
                      onClose();
                    } catch (err) {
                      console.error('[ContentImportSidebar] Trending import error:', err);
                      setError(err.message || 'Failed to import trending content. Please try again.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className={cn(
                    "w-full py-2.5 text-sm font-medium rounded-md transition-colors",
                    "bg-pink-600 text-white hover:bg-pink-500",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "flex items-center gap-2 justify-center shadow-sm"
                  )}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Importing {videoCount} trending posts...</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4" />
                      <span>Import {videoCount} Trending Posts</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* URL Import View */}
          {selectedMethod.id === 'url' && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="mb-6">
                  <p className="text-sm text-gray-300 leading-relaxed mb-4">
                    Import content from any {selectedPlatform.name} channel by pasting a URL.
                  </p>
                    
                  <div className="relative">
                    <input
                      type="text"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder={selectedPlatform.id === 'youtube' ? 'https://youtube.com/@channelname' : '@username or profile URL'}
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

                {/* Import Criteria */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-white mb-3">Sort by</h4>
                  
                  <div className="flex gap-2">
                    {[
                      { id: 'views', name: 'Views', icon: TrendingUp, color: 'blue' },
                      { id: 'recent', name: 'Recent', icon: Clock, color: 'green' },
                      { id: 'engagement', name: 'Engaging', icon: Heart, color: 'red' }
                    ].map((criteria) => (
                      <label key={criteria.id} className="flex-1 cursor-pointer">
                        <input
                          type="radio"
                          name="importCriteria"
                          value={criteria.id}
                          checked={importCriteria === criteria.id}
                          onChange={(e) => setImportCriteria(e.target.value)}
                          className="sr-only"
                        />
                        <div className={cn(
                          "flex items-center gap-2 p-3 rounded-lg border transition-colors",
                          importCriteria === criteria.id
                            ? `bg-${criteria.color}-600/20 border-${criteria.color}-500 text-white`
                            : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600"
                        )}>
                          <criteria.icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{criteria.name}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Video Count Selector */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-white mb-2 block">
                    Count
                  </label>
                  <div className="flex gap-2">
                    {(() => {
                      const platform = getPlatform(selectedPlatform.id);
                      const countOptions = platform?.getCountOptions() || [25, 50, 75];
                      
                      return countOptions.map((count) => (
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
                      ));
                    })()}
                  </div>
                </div>
              </div>
              
              {/* Import Button */}
              <div className="border-t border-gray-700 p-6">
                <button
                  onClick={handleUrlImport}
                  disabled={!urlInput || loading}
                  className={cn(
                    "w-full py-2.5 text-sm font-medium rounded-md transition-colors",
                    "bg-blue-600 text-white hover:bg-blue-500",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "flex items-center gap-2 justify-center shadow-sm"
                  )}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Importing {videoCount} items...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>
                        Import {videoCount} {
                          importCriteria === 'views' ? 'by Views' :
                          importCriteria === 'recent' ? 'Recent' :
                          importCriteria === 'engagement' ? 'Engaging' :
                          'Items'
                        }
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Error Message */}
      {error && (
        <div className="mx-6 mb-6 p-3 bg-red-900/20 border border-red-700 rounded-md">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
};

export default ContentImportSidebar;