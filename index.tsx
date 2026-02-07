import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// API Key Guard Component
const ApiKeyGuard = ({ children }: { children?: React.ReactNode }) => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      const win = window as any;
      // Check if running in an environment with window.aistudio (e.g. Project IDX)
      if (win.aistudio && typeof win.aistudio.hasSelectedApiKey === 'function') {
        try {
          const hasSelected = await win.aistudio.hasSelectedApiKey();
          setHasKey(hasSelected);
        } catch (e) {
          console.error("Error checking API key selection:", e);
          setHasKey(false);
        }
      } else {
        // Not in IDX (e.g. Cloudflare production or local dev without IDX)
        // Assume process.env.API_KEY is baked in via Vite
        setHasKey(true);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    const win = window as any;
    if (win.aistudio && typeof win.aistudio.openSelectKey === 'function') {
      try {
        await win.aistudio.openSelectKey();
        // Assume success to mitigate race condition
        setHasKey(true);
      } catch (e) {
        console.error("Error selecting API key:", e);
        // If error contains specific message, reset (though we just let user try again)
        setHasKey(false); 
      }
    }
  };

  if (hasKey === null) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400">Loading...</div>;
  }

  if (hasKey === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md text-center space-y-6 border border-gray-100 animate-pop-in">
            <div className="w-16 h-16 bg-yellow-400 rounded-2xl mx-auto flex items-center justify-center shadow-lg transform rotate-3 mb-2">
               <span className="font-black text-xl text-yellow-900">HL</span>
            </div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight">HAHA LAB 2026</h1>
            <p className="text-gray-600 font-medium leading-relaxed">
                고품질 AI 기능 사용을 위해<br/>유료 API 키 선택이 필요합니다.
            </p>
            <button 
                onClick={handleSelectKey}
                className="w-full py-4 bg-[#FEE500] hover:bg-[#fdd835] text-[#3A1D1D] font-bold rounded-2xl transition-all transform hover:scale-[1.02] shadow-md text-lg flex items-center justify-center gap-2"
            >
                Choose a paid key for HAHA LAB 2026
            </button>
            <p className="text-xs text-gray-400 mt-4">
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-500 flex items-center justify-center gap-1">
                    API Billing Documentation
                </a>
            </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ApiKeyGuard>
      <App />
    </ApiKeyGuard>
  </React.StrictMode>
);