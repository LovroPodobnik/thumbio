import React, { useState, useEffect, useRef, useCallback } from 'react';
import { searchVideos, fetchChannelVideos, searchChannelsForAutocomplete } from '../../services/youtubeApi';
// QuotaWarning component was removed
import { useQuotaStatus } from '../../hooks/useQuotaStatus';

const YouTubeImporter = ({ onVideosImported, onClose, onCreateChannelHeader = null }) => {
  const [activeTab, setActiveTab] = useState('search'); // 'search', 'channel', or 'curated'
  const [searchQuery, setSearchQuery] = useState('');
  const [channelUrl, setChannelUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('views'); // Default to views for best performers
  const [maxResults, setMaxResults] = useState(20);
  const [channelInfo, setChannelInfo] = useState(null);
  const [showChannelConfirm, setShowChannelConfirm] = useState(false);
  const [channelSuggestions, setChannelSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [createSectionHeader, setCreateSectionHeader] = useState(true); // Default to true
  const channelInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  
  // Quota tracking
  const quotaStatus = useQuotaStatus();
  
  // Curated channels state
  const [selectedCategory, setSelectedCategory] = useState('tech');
  
  // Curated channels organized by category - top creators with excellent thumbnails
  const curatedChannels = {
    tech: {
      title: "Tech & Gaming",
      description: "Channels known for high-impact tech and gaming thumbnails",
      channels: [
        { handle: "@MrBeast", name: "MrBeast", description: "Master of attention-grabbing thumbnails with high contrast and emotion", subscribers: "329M" },
        { handle: "@MKBHD", name: "Marques Brownlee", description: "Clean, professional tech thumbnails with consistent branding", subscribers: "21M" },
        { handle: "@LinusTechTips", name: "Linus Tech Tips", description: "Energetic tech thumbnails with clear product focus", subscribers: "16M" },
        { handle: "@PewDiePie", name: "PewDiePie", description: "Master of reaction faces and emotional thumbnails", subscribers: "111M" }
      ]
    },
    education: {
      title: "Education & Science", 
      description: "Educational channels that make complex topics visually compelling",
      channels: [
        { handle: "@kurzgesagt", name: "Kurzgesagt", description: "Beautiful illustrated thumbnails with consistent art style", subscribers: "23M" },
        { handle: "@Veritasium", name: "Veritasium", description: "Science thumbnails that make complex topics visually appealing", subscribers: "15M" },
        { handle: "@3blue1brown", name: "3Blue1Brown", description: "Mathematical concepts made visually compelling", subscribers: "6M" },
        { handle: "@CrashCourse", name: "CrashCourse", description: "Educational thumbnails with clear subject hierarchy", subscribers: "15M" }
      ]
    },
    entertainment: {
      title: "Entertainment & Lifestyle",
      description: "Top entertainers with engaging and relatable thumbnail designs",
      channels: [
        { handle: "@JamesCharles", name: "James Charles", description: "High-energy makeup and lifestyle thumbnails", subscribers: "23M" },
        { handle: "@DudePerfect", name: "Dude Perfect", description: "Action-packed sports thumbnails with dynamic poses", subscribers: "60M" },
        { handle: "@YesTheory", name: "Yes Theory", description: "Adventure thumbnails that tell compelling stories", subscribers: "8M" },
        { handle: "@EmmaChamberlin", name: "Emma Chamberlain", description: "Authentic, relatable lifestyle thumbnails", subscribers: "12M" }
      ]
    },
    business: {
      title: "Business & Marketing",
      description: "Channels focused on business growth with professional thumbnails",
      channels: [
        { handle: "@GaryVee", name: "Gary Vaynerchuk", description: "Bold, text-heavy business thumbnails with clear value props", subscribers: "4M" },
        { handle: "@PeterMcKinnon", name: "Peter McKinnon", description: "Photography/videography thumbnails with cinematic feel", subscribers: "5M" },
        { handle: "@Think-Media", name: "Think Media", description: "YouTube growth tutorials with clear before/after concepts", subscribers: "2M" },
        { handle: "@Ali-Abdaal", name: "Ali Abdaal", description: "Productivity thumbnails with clean layouts and icons", subscribers: "6M" }
      ]
    },
    creative: {
      title: "Design & Creative",
      description: "Channels about design, art, and creative work with beautiful visuals",
      channels: [
        { handle: "@AdobeCreativeCloud", name: "Adobe Creative Cloud", description: "Professional design showcasing creative work", subscribers: "1M" },
        { handle: "@CharliMarieTV", name: "Charli Marie", description: "Design process thumbnails with beautiful color schemes", subscribers: "200K" },
        { handle: "@FluxWithRanSegall", name: "Flux", description: "Design tutorials with modern, minimal aesthetics", subscribers: "300K" },
        { handle: "@TheLineArtSchool", name: "The Line Art School", description: "Art tutorial thumbnails showing clear progression", subscribers: "500K" }
      ]
    }
  };
  
  // Handle curated channel import
  const handleCuratedChannelImport = async (channelHandle) => {
    setLoading(true);
    setError('');
    
    try {
      const result = await fetchChannelVideos(channelHandle, maxResults, sortBy);
      const { videos, channelInfo } = result;
      
      onVideosImported(videos, createSectionHeader ? channelInfo : null);
      if (createSectionHeader && onCreateChannelHeader && channelInfo) {
        onCreateChannelHeader(channelInfo.title);
      }
      onClose();
    } catch (err) {
      console.error('[YouTubeImporter] Curated channel import error:', err);
      setError(`Failed to import ${channelHandle}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };
  
  // Debounced search for channel suggestions
  const debouncedSearchChannels = useCallback((query) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(async () => {
      if (query.length >= 2) {
        setIsLoadingSuggestions(true);
        try {
          const suggestions = await searchChannelsForAutocomplete(query);
          setChannelSuggestions(suggestions);
          setShowSuggestions(suggestions.length > 0);
          setSelectedSuggestionIndex(-1);
        } catch (error) {
          console.error('Error fetching channel suggestions:', error);
          setChannelSuggestions([]);
          setShowSuggestions(false);
          
          // Show quota exceeded message if needed
          if (error.message && error.message.includes('quota')) {
            setError('YouTube API quota exceeded. Channel autocomplete is temporarily disabled. You can still paste YouTube URLs directly.');
          }
        } finally {
          setIsLoadingSuggestions(false);
        }
      } else {
        setChannelSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // 300ms delay
  }, []);
  
  // Handle channel input change
  const handleChannelInputChange = (e) => {
    const value = e.target.value;
    setChannelUrl(value);
    
    // Don't show suggestions if input looks like a URL
    if (value.includes('youtube.com') || value.includes('youtu.be')) {
      setShowSuggestions(false);
      setChannelSuggestions([]);
    } else {
      debouncedSearchChannels(value);
    }
  };
  
  // Handle suggestion selection
  const handleSuggestionClick = (suggestion) => {
    setChannelUrl(suggestion.customUrl ? `@${suggestion.customUrl}` : suggestion.title);
    setShowSuggestions(false);
    setChannelSuggestions([]);
    setSelectedSuggestionIndex(-1);
    channelInputRef.current?.focus();
  };
  
  // Handle keyboard navigation in suggestions
  const handleChannelInputKeyDown = (e) => {
    if (!showSuggestions || channelSuggestions.length === 0) {
      if (e.key === 'Enter') {
        handleChannelImport();
      }
      return;
    }
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < channelSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : channelSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionClick(channelSuggestions[selectedSuggestionIndex]);
        } else {
          handleChannelImport();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };
  
  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
          channelInputRef.current && !channelInputRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const videos = await searchVideos(searchQuery, maxResults, sortBy);
      onVideosImported(videos);
      onClose();
    } catch (err) {
      console.error('[YouTubeImporter] Search error:', err.message);
      setError('Failed to search videos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChannelImport = async () => {
    if (!channelUrl.trim()) return;
    
    setLoading(true);
    setError('');
    setChannelInfo(null);
    setShowChannelConfirm(false);
    
    try {
      const result = await fetchChannelVideos(channelUrl, maxResults, sortBy);
      
      const { videos, channelInfo: foundChannelInfo } = result;
      
      // Set channel info for confirmation
      setChannelInfo(foundChannelInfo);
      
      // If confidence is low, show confirmation dialog
      if (foundChannelInfo.confidence === 'low' || foundChannelInfo.warning) {
        setShowChannelConfirm(true);
        setLoading(false);
        return;
      }
      
      // If confidence is medium or high, proceed directly
      onVideosImported(videos, createSectionHeader && activeTab === 'channel' ? foundChannelInfo : null);
      if (createSectionHeader && activeTab === 'channel' && onCreateChannelHeader && foundChannelInfo) {
        onCreateChannelHeader(foundChannelInfo.title);
      }
      onClose();
      
    } catch (err) {
      console.error('[YouTubeImporter] Channel import error:', err.message);
      setError(err.message || 'Failed to import channel videos. Please check the URL.');
    } finally {
      setLoading(false);
    }
  };
  
  const confirmChannelImport = async () => {
    if (!channelInfo) return;
    
    setLoading(true);
    try {
      const result = await fetchChannelVideos(channelUrl, maxResults, sortBy);
      const { videos } = result;
      
      console.log(`[YouTubeImporter] Confirmed import of ${videos.length} videos from ${channelInfo.title}`);
      onVideosImported(videos, createSectionHeader && activeTab === 'channel' ? channelInfo : null);
      if (createSectionHeader && activeTab === 'channel' && onCreateChannelHeader && channelInfo) {
        onCreateChannelHeader(channelInfo.title);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to import channel videos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-100 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background-primary rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-4 border border-border-divider">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Import YouTube Videos</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors p-1 hover:bg-background-secondary rounded-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex mb-4 border-b border-border-divider">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'search'
                ? 'text-background-brand border-b-2 border-background-brand'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Search
          </button>
          <button
            onClick={() => setActiveTab('channel')}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'channel'
                ? 'text-background-brand border-b-2 border-background-brand'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Channel
          </button>
          <button
            onClick={() => setActiveTab('curated')}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'curated'
                ? 'text-background-brand border-b-2 border-background-brand'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Popular
          </button>
        </div>

        {/* Performance Sorting Options - Compact */}
        <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-background-secondary rounded border border-border-divider">
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              Sort by
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-2 py-1.5 text-sm bg-background-primary border border-border-divider rounded focus:outline-none focus:ring-1 focus:ring-background-brand transition-colors"
            >
              <option value="views">Views</option>
              <option value="engagement">Engagement</option>
              <option value="likes">Likes</option>
              <option value="comments">Comments</option>
              <option value="recency">Recent</option>
              <option value="relevance">Relevant</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              Count
            </label>
            <select
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value))}
              className="w-full px-2 py-1.5 text-sm bg-background-primary border border-border-divider rounded focus:outline-none focus:ring-1 focus:ring-background-brand transition-colors"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>


        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-3">
            {/* Quota Warning */}
            {/* QuotaWarning component was removed */}
            
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Search Query
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="e.g., JavaScript tutorial, gaming highlights"
                className="w-full px-3 py-2 text-sm bg-background-primary border border-border-divider rounded focus:outline-none focus:ring-1 focus:ring-background-brand transition-colors placeholder:text-text-secondary"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !searchQuery.trim() || !quotaStatus.canSearch}
              className="w-full py-2.5 bg-background-brand text-text-on-brand text-sm font-medium rounded hover:bg-background-brand-hover disabled:bg-neutral-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Searching...' : !quotaStatus.canSearch ? 'Insufficient Quota' : 'Search Videos'}
            </button>
          </div>
        )}

        {/* Channel Tab */}
        {activeTab === 'channel' && (
          <div className="space-y-3">
            {/* Quota Warning */}
            {/* QuotaWarning component was removed */}
            
            <div className="relative">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Channel URL or Username
              </label>
              <input
                ref={channelInputRef}
                type="text"
                value={channelUrl}
                onChange={handleChannelInputChange}
                onKeyDown={handleChannelInputKeyDown}
                placeholder="e.g., @MrBeast, youtube.com/@MrBeast"
                className="w-full px-3 py-2 text-sm bg-background-primary border border-border-divider rounded focus:outline-none focus:ring-1 focus:ring-background-brand transition-colors placeholder:text-text-secondary"
                autoComplete="off"
              />
              
              {/* Loading indicator */}
              {isLoadingSuggestions && (
                <div className="absolute right-3 top-10 flex items-center">
                  <svg className="animate-spin h-4 w-4 text-text-secondary" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
              
              {/* Channel suggestions dropdown */}
              {showSuggestions && channelSuggestions.length > 0 && (
                <div 
                  ref={suggestionsRef}
                  className="absolute z-10 w-full mt-1 bg-background-primary border border-border-divider rounded-md shadow-lg max-h-80 overflow-y-auto"
                >
                  {channelSuggestions.map((suggestion, index) => (
                    <div
                      key={suggestion.id}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={`flex items-center p-3 cursor-pointer transition-colors ${
                        index === selectedSuggestionIndex 
                          ? 'bg-background-secondary' 
                          : 'hover:bg-background-secondary'
                      } ${index !== channelSuggestions.length - 1 ? 'border-b border-border-divider' : ''}`}
                    >
                      {/* Channel thumbnail */}
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mr-3 bg-neutral-20">
                        {suggestion.thumbnail ? (
                          <img 
                            src={suggestion.thumbnail} 
                            alt={suggestion.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="w-full h-full bg-neutral-20 flex items-center justify-center text-text-secondary text-compact-bold"
                          style={{ display: suggestion.thumbnail ? 'none' : 'flex' }}
                        >
                          {suggestion.title.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      
                      {/* Channel info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-compact-bold text-text-primary truncate">
                          {suggestion.title}
                        </div>
                        {suggestion.customUrl && (
                          <div className="text-caption text-text-secondary">
                            @{suggestion.customUrl}
                          </div>
                        )}
                        {suggestion.subscriberCount && (
                          <div className="text-caption text-text-secondary">
                            {parseInt(suggestion.subscriberCount).toLocaleString()} subscribers
                          </div>
                        )}
                      </div>
                      
                      {/* Verified badge for large channels */}
                      {suggestion.subscriberCount && parseInt(suggestion.subscriberCount) > 100000 && (
                        <div className="flex-shrink-0 ml-2">
                          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-text-secondary mt-1">
                Start typing to search for channels, or paste a YouTube URL
              </p>
            </div>
            
            {/* Create section header checkbox */}
            {onCreateChannelHeader && (
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  id="create-section-header"
                  checked={createSectionHeader}
                  onChange={(e) => setCreateSectionHeader(e.target.checked)}
                  className="w-4 h-4 text-background-brand bg-background-primary border-border-divider rounded focus:ring-background-brand focus:ring-2"
                />
                <label htmlFor="create-section-header" className="text-sm text-text-primary cursor-pointer">
                  Create section header for this channel
                </label>
              </div>
            )}
            
            <button
              onClick={handleChannelImport}
              disabled={loading || !channelUrl.trim() || !quotaStatus.canSearch}
              className="w-full py-2.5 bg-background-brand text-text-on-brand text-sm font-medium rounded hover:bg-background-brand-hover disabled:bg-neutral-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Importing...' : !quotaStatus.canSearch ? 'Insufficient Quota' : 'Import Channel Videos'}
            </button>
          </div>
        )}

        {/* Curated Channels Tab */}
        {activeTab === 'curated' && (
          <div className="space-y-3">
            {/* Category Selection - Horizontal Pills */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Category
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {Object.entries(curatedChannels).map(([key, category]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      selectedCategory === key
                        ? 'bg-background-brand text-text-on-brand'
                        : 'bg-background-secondary hover:bg-neutral-20 text-text-primary'
                    }`}
                  >
                    {category.title} ({category.channels.length})
                  </button>
                ))}
              </div>
            </div>

            {/* Channel List - Compact */}
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {curatedChannels[selectedCategory].channels.map((channel, index) => (
                <div
                  key={channel.handle}
                  className="flex items-center justify-between p-3 border border-border-divider rounded hover:bg-background-secondary transition-colors"
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-sm font-medium text-text-primary truncate">
                        {channel.name}
                      </div>
                      <div className="text-xs text-text-secondary bg-neutral-20 px-1.5 py-0.5 rounded">
                        {channel.subscribers}
                      </div>
                    </div>
                    <div className="text-xs text-text-secondary truncate">
                      {channel.description}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCuratedChannelImport(channel.handle)}
                    disabled={loading}
                    className="px-3 py-1.5 bg-background-brand text-text-on-brand text-xs font-medium rounded hover:bg-background-brand-hover disabled:opacity-50 transition-colors flex-shrink-0"
                  >
                    {loading ? 'Loading...' : 'Import'}
                  </button>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* Channel Confirmation Dialog */}
        {showChannelConfirm && channelInfo && (
          <div className="mt-6 p-4 bg-yellow-50 bg-opacity-10 border border-yellow-50 border-opacity-30 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-yellow-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-neutral-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-compact-bold text-text-primary mb-2">Confirm Channel</div>
                <div className="text-compact text-text-secondary mb-3">
                  {channelInfo.warning || `Found channel with ${channelInfo.confidence} confidence:`}
                </div>
                <div className="bg-background-secondary rounded-md p-3 mb-4">
                  <div className="text-compact-bold text-text-primary">{channelInfo.title}</div>
                  {channelInfo.customUrl && (
                    <div className="text-caption text-text-secondary">@{channelInfo.customUrl}</div>
                  )}
                  {channelInfo.subscriberCount && (
                    <div className="text-caption text-text-secondary">
                      {parseInt(channelInfo.subscriberCount).toLocaleString()} subscribers
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={confirmChannelImport}
                    disabled={loading}
                    className="px-4 py-2 bg-background-brand text-text-on-brand text-compact-bold rounded-md hover:bg-background-brand-hover disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Importing...' : 'Import Videos'}
                  </button>
                  <button
                    onClick={() => {
                      setShowChannelConfirm(false);
                      setChannelInfo(null);
                    }}
                    className="px-4 py-2 bg-background-secondary text-text-primary text-compact-bold rounded-md hover:bg-neutral-20 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && !showChannelConfirm && (
          <div className="mt-6 p-3 bg-red-50 bg-opacity-10 border border-red-50 border-opacity-30 rounded-lg">
            <div className="flex items-start space-x-2">
              <div className="w-4 h-4 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-2.5 h-2.5 text-neutral-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-compact text-text-primary">{error}</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default YouTubeImporter;