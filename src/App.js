import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FigmaStyleCanvasRefactored } from './components/canvas';
import MultiplayerTest from './components/MultiplayerTest';

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
  const [showMultiplayerTest, setShowMultiplayerTest] = useState(false);

  // Check URL params for test mode
  React.useEffect(() => {
    const handleURLChange = () => {
      const params = new URLSearchParams(window.location.search);
      setShowMultiplayerTest(params.get('test') === 'multiplayer');
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
        {showMultiplayerTest ? (
          <>
            <div className="absolute top-4 right-4 z-50">
              <button
                onClick={() => {
                  setShowMultiplayerTest(false);
                  window.history.pushState({}, '', '/');
                }}
                className="px-4 py-2 bg-text-primary text-background-primary rounded-md 
                         hover:bg-text-primary/90 transition-colors"
              >
                Back to Main App
              </button>
            </div>
            <MultiplayerTest />
          </>
        ) : (
          <>
            <FigmaStyleCanvasRefactored />
          </>
        )}
      </div>
    </QueryClientProvider>
  );
}

export default App;