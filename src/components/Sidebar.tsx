import React from 'react';
import {
  MessageSquare,
  Sparkles,
  Palette,
  PenTool,
  Code2,
  BookOpen,
  Languages,
  Zap,
  Terminal,
  Plus,
  Trash2,
  X,
  Server,
} from 'lucide-react';
import { Conversation, ViewMode } from '../types';

interface SidebarProps {
  currentMode: ViewMode;
  onSelectMode: (mode: ViewMode) => void;
  onNewChat: () => void;
  conversations: Conversation[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string, e: React.MouseEvent) => void;
  isOpen: boolean;
  onClose: () => void;
  hasApiKey: boolean;
  activeModel?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMode,
  onSelectMode,
  onNewChat,
  conversations,
  activeChatId,
  onSelectChat,
  onDeleteChat,
  isOpen,
  onClose,
  hasApiKey,
  activeModel,
}) => {
  const navItems: { mode: ViewMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'chat', label: 'AI Chat', icon: <MessageSquare className="w-4 h-4 text-[#9a83ff]" /> },
    { mode: 'image', label: 'Image Studio', icon: <Palette className="w-4 h-4 text-[#4ce0ce]" /> },
    { mode: 'writing', label: 'Writing Assistant', icon: <PenTool className="w-4 h-4 text-[#8875ff]" /> },
    { mode: 'code', label: 'Code Helper', icon: <Code2 className="w-4 h-4 text-[#559ef0]" /> },
    { mode: 'study', label: 'Study Buddy', icon: <BookOpen className="w-4 h-4 text-[#f59e0b]" /> },
    { mode: 'translate', label: 'Translator', icon: <Languages className="w-4 h-4 text-[#ec4899]" /> },
    { mode: 'summary', label: 'Quick Summary', icon: <Zap className="w-4 h-4 text-[#10b981]" /> },
    { mode: 'api_docs', label: 'API Playground & Docs', icon: <Terminal className="w-4 h-4 text-[#38bdf8]" /> },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-[#080d1b]/95 backdrop-blur-md border-r border-[#2a3b5b] p-5 flex flex-col gap-5 z-40 transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand & Mobile Close */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9a83ff] to-[#4ce0ce] flex items-center justify-center text-[#091322] font-black text-xl shadow-lg shadow-[#9a83ff]/25">
              ✦
            </div>
            <div>
              <div className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
                Jeevanth <span className="bg-gradient-to-r from-[#c1b4ff] to-[#6cebd8] bg-clip-text text-transparent">AI</span>
              </div>
              <span className="text-[10px] tracking-wider font-semibold uppercase text-[#7385a5]">Workspace & API</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9aaaca] hover:text-white hover:bg-[#1b2b46] lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <button
          onClick={() => {
            onNewChat();
            if (window.innerWidth < 1024) onClose();
          }}
          className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-[#8875ff] to-[#559ef0] hover:from-[#7a64ff] hover:to-[#4392eb] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#8875ff]/20 active:scale-[0.98] transition cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New conversation</span>
        </button>

        {/* Main Navigation */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold tracking-widest text-[#7789ab] px-2 mb-2 uppercase">
            Workspace Tools
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = currentMode === item.mode;
              return (
                <button
                  key={item.mode}
                  onClick={() => {
                    onSelectMode(item.mode);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs md:text-sm font-medium transition cursor-pointer text-left ${
                    active
                      ? 'bg-[#16233a] text-white border border-[#35486b] shadow-xs'
                      : 'text-[#b7c5df] hover:bg-[#121c2e] hover:text-white border border-transparent'
                  }`}
                >
                  {item.icon}
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.mode === 'api_docs' && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#38bdf8]/15 text-[#38bdf8] font-bold border border-[#38bdf8]/30">
                      REST
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Recent Chats Section */}
        <div className="flex-1 min-h-0 flex flex-col mt-2">
          <div className="text-[10px] font-bold tracking-widest text-[#7789ab] px-2 mb-2 uppercase flex items-center justify-between">
            <span>Recent Chats</span>
            <span className="text-[10px] font-normal text-[#576988]">
              {conversations.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {conversations.length === 0 ? (
              <div className="text-xs text-[#7385a5] px-3 py-4 text-center border border-dashed border-[#223350] rounded-xl">
                No recent chats yet. Start asking questions!
              </div>
            ) : (
              conversations.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => {
                    onSelectChat(chat.id);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition ${
                    activeChatId === chat.id && currentMode === 'chat'
                      ? 'bg-[#1a2942] text-white font-medium'
                      : 'text-[#9aaaca] hover:bg-[#121c2e] hover:text-white'
                  }`}
                >
                  <span className="truncate flex-1 pr-2">◦ {chat.title}</span>
                  <button
                    onClick={(e) => onDeleteChat(chat.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 rounded transition"
                    title="Delete chat"
                    aria-label="Delete chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bottom Plan / API Status */}
        <div className="pt-2 border-t border-[#2a3b5b]">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#14213a] to-[#0c1424] border border-[#2a3b5b] text-xs text-[#9aaaca]">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-white flex items-center gap-1.5 text-xs truncate max-w-[140px]">
                <Server className="w-3.5 h-3.5 text-[#4ce0ce] shrink-0" />
                <span className="truncate">{activeModel || 'Gemini 3.1 Flash Lite'}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live API
              </span>
            </div>
            <p className="text-[11px] leading-tight text-[#8395b5]">
              Real server-side AI processing with streaming endpoints.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
