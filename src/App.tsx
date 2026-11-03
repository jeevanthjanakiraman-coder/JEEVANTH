import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { ChatView } from './components/ChatView';
import { ToolWorkspace } from './components/ToolWorkspace';
import { ApiPlayground } from './components/ApiPlayground';
import { Toast } from './components/Toast';
import { ChatMessage, Conversation, ViewMode } from './types';

const STORAGE_KEY = 'jeevanth_ai_chats';
const THEME_KEY = 'jeevanth_ai_theme';

export default function App() {
  const [currentMode, setCurrentMode] = useState<ViewMode>('chat');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLightMode, setIsLightMode] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [activeModel, setActiveModel] = useState('gemini-3.1-flash-lite');

  // Load chats & theme from local storage
  useEffect(() => {
    try {
      const savedChats = localStorage.getItem(STORAGE_KEY);
      if (savedChats) {
        const parsed = JSON.parse(savedChats);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setConversations(parsed);
          setActiveChatId(parsed[0].id);
        }
      }

      const savedTheme = localStorage.getItem(THEME_KEY);
      if (savedTheme === 'light') {
        setIsLightMode(true);
        document.documentElement.classList.add('light');
      }
    } catch (e) {
      console.error('Failed to restore from storage:', e);
    }

    // Ping API status
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        setHasApiKey(Boolean(data.hasApiKey));
        if (data.model) setActiveModel(data.model);
      })
      .catch((err) => console.warn('Status check warning:', err));
  }, []);

  // Save chats to localStorage
  const saveChats = (chats: Conversation[]) => {
    setConversations(chats);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats.slice(0, 20)));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2400);
  };

  const handleToggleTheme = () => {
    setIsLightMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('light');
        localStorage.setItem(THEME_KEY, 'light');
        showToast('Light theme enabled');
      } else {
        document.documentElement.classList.remove('light');
        localStorage.setItem(THEME_KEY, 'dark');
        showToast('Dark theme enabled');
      }
      return next;
    });
  };

  // Get current messages
  const activeConversation = conversations.find((c) => c.id === activeChatId);
  const currentMessages = activeConversation ? activeConversation.messages : [];

  const handleNewChat = () => {
    const newId = `chat_${Date.now()}`;
    const newChat: Conversation = {
      id: newId,
      title: 'New conversation',
      messages: [],
      updatedAt: Date.now(),
    };
    saveChats([newChat, ...conversations]);
    setActiveChatId(newId);
    setCurrentMode('chat');
    showToast('New conversation ready');
  };

  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
    setCurrentMode('chat');
  };

  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = conversations.filter((c) => c.id !== id);
    saveChats(updated);
    if (activeChatId === id) {
      setActiveChatId(updated.length > 0 ? updated[0].id : null);
    }
    showToast('Conversation deleted');
  };

  // Send message to backend Gemini API
  const handleSendMessage = async (text: string) => {
    let currentId = activeChatId;
    let currentConvs = [...conversations];

    // If no active conversation, create one
    if (!currentId || !activeConversation) {
      currentId = `chat_${Date.now()}`;
      const title = text.slice(0, 32).trim() || 'Conversation';
      const newChat: Conversation = {
        id: currentId,
        title,
        messages: [],
        updatedAt: Date.now(),
      };
      currentConvs = [newChat, ...currentConvs];
      setActiveChatId(currentId);
    }

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      text,
      timestamp: Date.now(),
    };

    const targetConv = currentConvs.find((c) => c.id === currentId)!;
    const history = [...targetConv.messages, userMessage];

    // Update conversation with user message immediately
    const updatedConvs = currentConvs.map((c) =>
      c.id === currentId
        ? {
            ...c,
            title: c.messages.length === 0 ? text.slice(0, 32) : c.title,
            messages: history,
            updatedAt: Date.now(),
          }
        : c
    );
    saveChats(updatedConvs);
    setIsLoading(true);

    const sendWithRetry = async (attempt = 1): Promise<any> => {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: history
              .filter((m) => !m.text.startsWith('⚠️'))
              .map((m) => ({
                role: m.role,
                content: m.text,
              })),
          }),
        });

        let data: any;
        try {
          data = await response.json();
        } catch {
          const textResp = await response.text();
          data = { error: textResp || `HTTP error ${response.status}` };
        }

        if (!response.ok) {
          let msg = data.error || 'Server error occurred';
          if (typeof msg === 'string' && msg.includes('RESOURCE_EXHAUSTED')) {
            msg = 'Gemini model rate limit reached. The system has automatically shifted to high-throughput backup models. Please try sending your message again.';
          }
          throw new Error(msg);
        }

        return data;
      } catch (err: any) {
        if (attempt === 1 && (err?.message?.includes('Failed to fetch') || err?.name === 'TypeError')) {
          console.warn('Network hiccup on fetch, auto-retrying once...');
          await new Promise((r) => setTimeout(r, 1000));
          return sendWithRetry(2);
        }
        throw err;
      }
    };

    try {
      const data = await sendWithRetry();

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        text: data.text || 'No response generated.',
        timestamp: Date.now(),
        model: data.model,
      };

      const finalConvs = updatedConvs.map((c) =>
        c.id === currentId
          ? {
              ...c,
              messages: [...history, assistantMessage],
              updatedAt: Date.now(),
            }
          : c
      );
      saveChats(finalConvs);
    } catch (err: any) {
      console.error('Chat error:', err);
      const isRateLimit = err?.message?.includes('rate limit') || err?.message?.includes('RESOURCE_EXHAUSTED');
      showToast(isRateLimit ? 'Switching to backup model...' : (err.message || 'Error reaching Gemini backend'));
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        text: `⚠️ **API Notice:** ${err.message || 'Could not reach the AI service.'}\n\nPlease try again or use the API Playground to test the endpoints.`,
        timestamp: Date.now(),
      };
      const finalConvs = updatedConvs.map((c) =>
        c.id === currentId
          ? {
              ...c,
              messages: [...history, errorMessage],
              updatedAt: Date.now(),
            }
          : c
      );
      saveChats(finalConvs);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToChat = (prompt: string, response: string) => {
    let currentId = activeChatId;
    let currentConvs = [...conversations];

    if (!currentId || !activeConversation) {
      currentId = `chat_${Date.now()}`;
      const newChat: Conversation = {
        id: currentId,
        title: prompt.slice(0, 32) || 'Studio Output',
        messages: [],
        updatedAt: Date.now(),
      };
      currentConvs = [newChat, ...currentConvs];
      setActiveChatId(currentId);
    }

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      text: prompt,
      timestamp: Date.now(),
    };
    const assistantMessage: ChatMessage = {
      id: `msg_${Date.now() + 1}`,
      role: 'assistant',
      text: response,
      timestamp: Date.now() + 1,
      model: 'gemini-3.8-flash',
    };

    const finalConvs = currentConvs.map((c) =>
      c.id === currentId
        ? {
            ...c,
            messages: [...c.messages, userMessage, assistantMessage],
            updatedAt: Date.now(),
          }
        : c
    );
    saveChats(finalConvs);
    setCurrentMode('chat');
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Sidebar Navigation */}
      <Sidebar
        currentMode={currentMode}
        onSelectMode={(mode) => setCurrentMode(mode)}
        onNewChat={handleNewChat}
        conversations={conversations}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        hasApiKey={hasApiKey}
        activeModel={activeModel}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar
          currentMode={currentMode}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          isLightMode={isLightMode}
          onToggleTheme={handleToggleTheme}
          onOpenApiDocs={() => setCurrentMode('api_docs')}
          hasApiKey={hasApiKey}
        />

        <main className="flex-1">
          {currentMode === 'chat' && (
            <ChatView
              messages={currentMessages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              onSelectTool={(tool) => setCurrentMode(tool)}
              onClearChat={handleNewChat}
            />
          )}

          {currentMode !== 'chat' && currentMode !== 'api_docs' && (
            <ToolWorkspace
              tool={currentMode}
              onClose={() => setCurrentMode('chat')}
              onSendToChat={handleSendToChat}
              onShowToast={showToast}
            />
          )}

          {currentMode === 'api_docs' && (
            <ApiPlayground onShowToast={showToast} />
          )}
        </main>

        <footer className="text-center text-[11px] text-[#6f809f] py-4 border-t border-[#2a3b5b]/50">
          Jeevanth AI API & Workspace · Powered by Google Gemini 3.8 Flash · Full Stack
        </footer>
      </div>

      <Toast message={toastMessage} />
    </div>
  );
}
