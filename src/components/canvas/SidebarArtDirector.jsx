import React from "react";
import * as Dialog from '@radix-ui/react-dialog';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import * as Separator from '@radix-ui/react-separator';
import { cn } from '../../lib/utils';
import { useVisionCritique } from "../../hooks/useVisionCritique";
import { 
  X,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Sparkles,
  ChevronRight
} from 'lucide-react';

const Section = ({ title, bullets, icon: Icon }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-text-tertiary" />
      <h6 className="text-base font-medium text-text-primary">{title}</h6>
    </div>
    <ul className="space-y-2.5">
      {bullets.map((bullet, i) => (
        <li key={i} className="flex items-start gap-3">
          <ChevronRight className="w-3.5 h-3.5 text-text-tertiary mt-0.5 flex-shrink-0" />
          <span className="text-sm text-text-secondary leading-relaxed">{bullet}</span>
        </li>
      ))}
    </ul>
  </div>
);

const LoadingSkeleton = () => (
  <div className="space-y-6">
    {[1, 2, 3].map(i => (
      <div key={i}>
        <div className="h-5 bg-neutral-10 rounded w-32 mb-3 animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 bg-neutral-10 rounded w-full animate-pulse" />
          <div className="h-4 bg-neutral-10 rounded w-4/5 animate-pulse" />
          <div className="h-4 bg-neutral-10 rounded w-3/4 animate-pulse" />
        </div>
      </div>
    ))}
  </div>
);

const SidebarArtDirector = ({ thumbnail, onClose, isOpen }) => {
  const { data, isLoading, error } = useVisionCritique(thumbnail);

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        {/* Sidebar Content */}
        <Dialog.Content 
          className={cn(
            "fixed right-0 top-0 h-full w-[420px] z-50",
            "bg-background-primary shadow-xl",
            "flex flex-col",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
            "duration-300"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-divider">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-text-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-background-primary" strokeWidth={2.5} />
              </div>
              <Dialog.Title className="text-xl font-medium text-text-primary">
                AI Art-Director
              </Dialog.Title>
            </div>
            <Dialog.Close
              className="p-1.5 text-text-secondary hover:text-text-primary rounded-md transition-colors"
              aria-label="Close art director"
            >
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          {/* Scrollable Content */}
          <ScrollArea.Root className="flex-1 overflow-hidden">
            <ScrollArea.Viewport className="h-full w-full">
              <div className="p-6">
                {isLoading && <LoadingSkeleton />}

                {error && (
                  <div className="rounded-lg border border-border-divider p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-4 h-4 text-text-tertiary mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-text-primary mb-1">Error</h4>
                        <p className="text-sm text-text-secondary">{error.message}</p>
                        {error.message.includes('API key') && (
                          <div className="mt-3 space-y-1">
                            <p className="text-xs font-medium text-text-secondary">To fix this:</p>
                            <ol className="list-decimal list-inside space-y-0.5 ml-2">
                              <li className="text-xs text-text-tertiary">Create a <code className="bg-neutral-10 px-1 py-0.5 rounded text-xs">.env</code> file in the project root</li>
                              <li className="text-xs text-text-tertiary">Add: <code className="bg-neutral-10 px-1 py-0.5 rounded text-xs">REACT_APP_OPENAI_API_KEY=sk-...</code></li>
                              <li className="text-xs text-text-tertiary">Restart the development server</li>
                            </ol>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {data && (
                  <>
                    {/* Thumbnail Preview */}
                    <div className="mb-6">
                      <img 
                        src={thumbnail.thumbnail} 
                        alt="Analyzed thumbnail" 
                        className="w-full rounded-lg border border-border-divider"
                      />
                    </div>

                    {/* Analysis Sections */}
                    <Section 
                      title="Strengths" 
                      bullets={data.strengths} 
                      icon={CheckCircle2}
                    />
                    
                    <Separator.Root className="bg-border-divider h-px w-full my-6" />
                    
                    <Section 
                      title="Areas for Improvement" 
                      bullets={data.weaknesses} 
                      icon={AlertCircle}
                    />
                    
                    <Separator.Root className="bg-border-divider h-px w-full my-6" />
                    
                    <Section 
                      title="Recommendations" 
                      bullets={data.recommendations} 
                      icon={Lightbulb}
                    />

                    {/* Overall Verdict */}
                    <div className="mt-6 rounded-lg border border-border-divider p-5 bg-background-secondary">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-text-primary" />
                        <h6 className="text-sm font-medium text-text-primary">Overall Assessment</h6>
                      </div>
                      <p className="text-sm text-text-secondary leading-relaxed">
                        {data.overallVerdict}
                      </p>
                    </div>

                    {/* Tips - minimal without emoji */}
                    <div className="mt-6 p-4 rounded-lg border border-border-divider">
                      <p className="text-xs text-text-tertiary text-center">
                        Apply these suggestions and run the analysis again to see improvements
                      </p>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea.Viewport>
            
            <ScrollArea.Scrollbar 
              className="flex select-none touch-none p-0.5 bg-transparent transition-colors duration-[160ms] ease-out hover:bg-background-secondary data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5"
              orientation="vertical"
            >
              <ScrollArea.Thumb className="flex-1 bg-border-secondary rounded-full relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:transform before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px] hover:bg-border-primary transition-colors" />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default SidebarArtDirector; 