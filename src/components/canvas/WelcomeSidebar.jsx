import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import * as Separator from '@radix-ui/react-separator';
import * as Avatar from '@radix-ui/react-avatar';
import { fetchBestPerformingVideos } from '../../services/youtubeApi';
import { cn } from '../../lib/utils';
import { 
  X, 
  Move, 
  ZoomIn, 
  MousePointer, 
  MessageSquare, 
  Users,
  Download,
  Loader2,
  Layers
} from 'lucide-react';

const WelcomeSidebar = ({ isOpen, onClose, onVideosImported, onCreateChannelHeader }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [importingChannel, setImportingChannel] = useState(null);

  // Curated channels from the popular tab with enhanced data
  const popularChannels = [
    { handle: "@MrBeast", name: "MrBeast", subscribers: "329M", subscriberCount: 329000000, category: "Entertainment", avatar: "MB", trending: true, verified: true },
    { handle: "@PewDiePie", name: "PewDiePie", subscribers: "111M", subscriberCount: 111000000, category: "Gaming", avatar: "PD", verified: true },
    { handle: "@MarkRober", name: "Mark Rober", subscribers: "25M", subscriberCount: 25000000, category: "Science", avatar: "MR", verified: true },
    { handle: "@MKBHD", name: "Marques Brownlee", subscribers: "21M", subscriberCount: 21000000, category: "Tech", avatar: "MK", verified: true },
    { handle: "@kurzgesagt", name: "Kurzgesagt", subscribers: "23M", subscriberCount: 23000000, category: "Education", avatar: "KG", verified: true },
    { handle: "@Veritasium", name: "Veritasium", subscribers: "15M", subscriberCount: 15000000, category: "Education", avatar: "VT", verified: true },
    { handle: "@LinusTechTips", name: "Linus Tech Tips", subscribers: "16M", subscriberCount: 16000000, category: "Tech", avatar: "LT", verified: true },
    { handle: "@DudePerfect", name: "Dude Perfect", subscribers: "60M", subscriberCount: 60000000, category: "Entertainment", avatar: "DP", trending: true, verified: true },
    { handle: "@TastyDemais", name: "Tasty", subscribers: "22M", subscriberCount: 22000000, category: "Food", avatar: "TS", verified: true },
    { handle: "@UnboxTherapy", name: "Unbox Therapy", subscribers: "18M", subscriberCount: 18000000, category: "Tech", avatar: "UT", verified: true },
    { handle: "@EmmaChamberlain", name: "Emma Chamberlain", subscribers: "12M", subscriberCount: 12000000, category: "Lifestyle", avatar: "EC", verified: true },
    { handle: "@airrack", name: "Airrack", subscribers: "6M", subscriberCount: 6000000, category: "Travel", avatar: "AR", trending: true },
    { handle: "@GaryVee", name: "Gary Vaynerchuk", subscribers: "4M", subscriberCount: 4000000, category: "Business", avatar: "GV" },
    { handle: "@Ali-Abdaal", name: "Ali Abdaal", subscribers: "6M", subscriberCount: 6000000, category: "Business", avatar: "AA" }
  ];


  const handleQuickImport = async (channelHandle, channelName) => {
    setLoading(true);
    setError('');
    setImportingChannel(channelHandle);
    
    try {
      // Import 50 best performing thumbnails using advanced algorithm
      const result = await fetchBestPerformingVideos(channelHandle, 50);
      const { videos, channelInfo } = result;
      
      console.log(`[WelcomeSidebar] Imported ${videos.length} thumbnails from ${channelName}`);
      
      // Import videos and create section header
      onVideosImported(videos, channelInfo);
      if (onCreateChannelHeader && channelInfo) {
        onCreateChannelHeader(channelInfo.title);
      }
      
      // Close sidebar after successful import
      onClose();
    } catch (err) {
      console.error('[WelcomeSidebar] Import error:', err);
      setError(`Failed to import from ${channelName}. Please try again.`);
    } finally {
      setLoading(false);
      setImportingChannel(null);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
          {/* Backdrop with blur */}
          <Dialog.Overlay 
            className={cn(
              "fixed inset-0 z-40",
              "bg-neutral-900/20 backdrop-blur-sm",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
            )}
          />
          
          {/* Sidebar */}
          <Dialog.Content 
            className={cn(
              "fixed left-0 top-0 h-full w-[420px] z-50",
              "bg-background-primary shadow-xl",
              "flex flex-col",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
              "duration-300"
            )}
          >
            {/* Header with Logo */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border-divider">
              <Dialog.Title asChild>
                <div className="flex items-center gap-2.5">
                  {/* Logo Icon */}
                  <div className="w-8 h-8 rounded-lg bg-text-primary flex items-center justify-center">
                    <Layers className="w-5 h-5 text-background-primary" strokeWidth={2.5} />
                  </div>
                  {/* Logo Text */}
                  <span className="text-2xl font-bold text-text-primary tracking-tight">
                    Thumbio
                  </span>
                </div>
              </Dialog.Title>
              <Dialog.Close
                className="p-1.5 text-text-secondary hover:text-text-primary rounded-md transition-colors"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>

            {/* Scrollable Content */}
            <ScrollArea.Root className="flex-1 overflow-hidden">
              <ScrollArea.Viewport className="h-full w-full px-6 py-6">
                {/* Welcome Section */}
                <div className="mb-8">
                  <h2 className="text-lg font-normal text-text-primary mb-2">Welcome to Thumbio</h2>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Import viral thumbnails from top creators for inspiration, analysis, and design insights.
                  </p>
                </div>

                {/* Quick Start Guide */}
                <div className="mb-8">
                  <h3 className="text-base font-medium text-text-primary mb-3">Quick Start</h3>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <Move className="w-4 h-4 text-text-tertiary" />
                      <span className="text-sm text-text-secondary">
                        <span className="font-medium text-text-primary">Navigate</span> – Hold Space + drag
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <ZoomIn className="w-4 h-4 text-text-tertiary" />
                      <span className="text-sm text-text-secondary">
                        <span className="font-medium text-text-primary">Zoom</span> – Scroll or pinch
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MousePointer className="w-4 h-4 text-text-tertiary" />
                      <span className="text-sm text-text-secondary">
                        <span className="font-medium text-text-primary">Select</span> – Click or drag
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-4 h-4 text-text-tertiary" />
                      <span className="text-sm text-text-secondary">
                        <span className="font-medium text-text-primary">Comment</span> – Press C
                      </span>
                    </div>
                  </div>
                </div>

                <Separator.Root className="bg-border-divider h-px w-full mb-6" />

                {/* Top Channels Section */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-medium text-text-primary">Top Channels</h3>
                    <span className="text-xs text-text-tertiary">{popularChannels.length} channels</span>
                  </div>
                  
                  <div className="space-y-3">
                    {popularChannels.map((channel) => (
                      <div
                        key={channel.handle}
                        className={cn(
                          "group flex items-center gap-3 p-3 rounded-lg border border-border-divider",
                          "hover:bg-background-secondary transition-colors",
                          importingChannel === channel.handle && "opacity-60"
                        )}
                      >
                        {/* Avatar */}
                        <Avatar.Root className="relative flex-shrink-0">
                          <Avatar.Fallback className="w-10 h-10 rounded-full bg-neutral-20 flex items-center justify-center text-text-secondary text-sm font-medium">
                            {channel.avatar}
                          </Avatar.Fallback>
                          {channel.verified && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </Avatar.Root>
                        
                        {/* Channel Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-text-primary truncate">
                              {channel.name}
                            </span>
                            {channel.trending && (
                              <span className="text-[11px] px-1.5 py-0.5 bg-neutral-10 text-text-tertiary rounded font-medium">
                                HOT
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-text-tertiary flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {channel.subscribers}
                            </span>
                            <span className="text-xs text-text-tertiary">
                              {channel.category}
                            </span>
                          </div>
                        </div>
                        
                        {/* Import Button */}
                        <button
                          onClick={() => handleQuickImport(channel.handle, channel.name)}
                          disabled={loading}
                          className={cn(
                            "px-3.5 py-1.5 text-sm font-medium rounded-md transition-all",
                            "bg-text-primary text-background-primary",
                            "hover:bg-text-primary/90",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            "flex items-center gap-1.5"
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
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50/10 border border-red-200 rounded-md mb-6">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
              </ScrollArea.Viewport>
              
              <ScrollArea.Scrollbar 
                className="flex select-none touch-none p-0.5 bg-transparent transition-colors duration-[160ms] ease-out hover:bg-background-secondary data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5"
                orientation="vertical"
              >
                <ScrollArea.Thumb className="flex-1 bg-border-secondary rounded-full relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:transform before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px] hover:bg-border-primary transition-colors" />
              </ScrollArea.Scrollbar>
            </ScrollArea.Root>

            {/* Footer */}
            <div className="border-t border-border-divider px-6 py-4">
              <button
                onClick={onClose}
                className="w-full py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                Continue →
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
  );
};

export default WelcomeSidebar; 