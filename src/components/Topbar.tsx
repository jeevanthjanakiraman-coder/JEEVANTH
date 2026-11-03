import React from 'react';
import { Menu, Sun, Moon, Terminal, CheckCircle2 } from 'lucide-react';
import { ViewMode } from '../types';

interface TopbarProps {
  currentMode: ViewMode;
  onOpenSidebar: () => void;
  isLightMode: boolean;
  onToggleTheme: () => void;
  onOpenApiDocs: () => void;
  hasApiKey: boolean;
}

const MODE_LABELS: Record<ViewMode, string> = {
  chat: 'AI Chat',
  image: 'Image Studio',
  writing: 'Writing Assistant',
  code: 'Code Helper',
  study: 'Study Buddy',
  translate: 'Translator',
  summary: 'Quick Summary',
  api_docs: 'API Docs & Playground',
};

export const Topbar: React.FC<TopbarProps> = ({
  currentMode,
  onOpenSidebar,
  isLightMode,
  onToggleTheme,
  onOpenApiDocs,
  hasApiKey,
}) => {
  return (
    <header className="h-16 border-b border-[#2a3b5b] px-4 md:px-8 flex items-center justify-between bg-[#0a1020]/80 backdrop-blur-md sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-xl border border-[#2a3b5b] bg-[#101a2d] text-[#d9e3f7] hover:bg-[#1b2b46] transition lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="text-xs md:text-sm text-[#9aaaca] flex items-center gap-1.5 font-medium">
          <span>Workspace</span>
          <span className="text-[#4e6080]">/</span>
          <span className="text-white font-semibold">{MODE_LABELS[currentMode]}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Live Server / API Status Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#10302d] border border-[#285c55] text-[#78e5d2]">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#4ce0ce]" />
          <span>BACKEND API CONNECTED</span>
        </div>

        {/* API Docs quick button */}
        {currentMode !== 'api_docs' && (
          <button
            onClick={onOpenApiDocs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#2a3b5b] bg-[#101a2d] text-[#cbd8ef] hover:bg-[#18263f] hover:text-white text-xs font-medium transition cursor-pointer"
            title="Open Developer API Documentation & Playground"
          >
            <Terminal className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span className="hidden md:inline">API Playground</span>
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl border border-[#2a3b5b] bg-[#101a2d] text-[#d9e3f7] hover:bg-[#1b2b46] transition cursor-pointer"
          title={isLightMode ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
          aria-label="Toggle theme"
        >
          {isLightMode ? <Moon className="w-4 h-4 text-amber-300" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>
      </div>
    </header>
  );
};
