import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TldrawCanvasPOC from './components/canvas/TldrawCanvasPOC';
import TldrawCanvasIntegrated from './components/canvas/TldrawCanvasIntegrated';
import TldrawCanvasPure from './components/canvas/TldrawCanvasPure';
import TldrawCanvasHybrid from './components/canvas/TldrawCanvasHybrid';
// TikTok functionality removed

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function App() {
  // Simple route state for testing
  const [showTldrawPOC, setShowTldrawPOC] = useState(false);
  const [showTldrawIntegrated, setShowTldrawIntegrated] = useState(false);
  const [showTldrawPure, setShowTldrawPure] = useState(false);
  const [showTldrawHybrid, setShowTldrawHybrid] = useState(false);
  // TikTok functionality removed

  // Check URL params for test mode
  React.useEffect(() => {
    const handleURLChange = () => {
      const params = new URLSearchParams(window.location.search);
      setShowTldrawPOC(params.get('test') === 'tldraw');
      setShowTldrawIntegrated(params.get('test') === 'integrated');
      setShowTldrawPure(params.get('test') === 'pure');
      setShowTldrawHybrid(params.get('test') === 'hybrid');
      // TikTok test route removed
    };

    handleURLChange();
    window.addEventListener('popstate', handleURLChange);

    return () => {
      window.removeEventListener('popstate', handleURLChange);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background-primary">
        {showTldrawPOC ? (
          <>
            <div className="absolute top-4 right-4 z-50">
              <button
                onClick={() => {
                  setShowTldrawPOC(false);
                  window.history.pushState({}, '', '/');
                }}
                className="px-4 py-2 bg-text-primary text-background-primary rounded-md 
                         hover:bg-text-primary/90 transition-colors"
              >
                Back to Main App
              </button>
            </div>
            <TldrawCanvasPOC />
          </>
        ) : showTldrawIntegrated ? (
          <>
            <div className="absolute top-4 right-4 z-50">
              <button
                onClick={() => {
                  setShowTldrawIntegrated(false);
                  window.history.pushState({}, '', '/');
                }}
                className="px-4 py-2 bg-text-primary text-background-primary rounded-md 
                         hover:bg-text-primary/90 transition-colors"
              >
                Back to Main App
              </button>
            </div>
            <TldrawCanvasIntegrated />
          </>
        ) : showTldrawPure ? (
          <>
            <div className="absolute top-4 right-4 z-50">
              <button
                onClick={() => {
                  setShowTldrawPure(false);
                  window.history.pushState({}, '', '/');
                }}
                className="px-4 py-2 bg-text-primary text-background-primary rounded-md 
                         hover:bg-text-primary/90 transition-colors"
              >
                Back to Main App
              </button>
            </div>
            <TldrawCanvasPure />
          </>
        ) : showTldrawHybrid ? (
          <TldrawCanvasHybrid />
        ) : (
          <TldrawCanvasHybrid />
        )}
      </div>
    </QueryClientProvider>
  );
}

export default App;