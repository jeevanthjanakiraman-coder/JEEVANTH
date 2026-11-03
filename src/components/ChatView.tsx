import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Copy, Check, RotateCw, AlertCircle, Palette, PenTool, Code2, BookOpen, Languages, Zap } from 'lucide-react';
import { ChatMessage, ViewMode } from '../types';
import { FormattedContent } from './FormattedContent';

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  onSelectTool: (tool: ViewMode) => void;
  onClearChat: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onSelectTool,
}) => {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-adjust height
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const suggestions = [
    { label: '💡 Explain a topic', prompt: 'Explain quantum computing in simple, memorable terms.' },
    { label: '✍️ Write something', prompt: 'Help me draft a concise, professional follow-up email after a meeting.' },
    { label: '💻 Coding idea', prompt: 'Give me 3 creative, modern web application project ideas for portfolio.' },
    { label: '⚡ Summarize tech', prompt: 'Explain the difference between REST API and WebSockets with real examples.' },
  ];

  const tools = [
    { id: 'image' as ViewMode, icon: <Palette className="w-5 h-5 text-[#4ce0ce]" />, name: 'Image Studio', desc: 'Craft detailed, cinematic visual prompts for AI art.' },
    { id: 'writing' as ViewMode, icon: <PenTool className="w-5 h-5 text-[#8875ff]" />, name: 'Writing Assistant', desc: 'Draft captivating articles, messages, and stories.' },
    { id: 'code' as ViewMode, icon: <Code2 className="w-5 h-5 text-[#559ef0]" />, name: 'Code Helper', desc: 'Write, debug, and explain clean algorithms & scripts.' },
    { id: 'study' as ViewMode, icon: <BookOpen className="w-5 h-5 text-[#f59e0b]" />, name: 'Study Buddy', desc: 'Break down complex lessons with analogies & quizzes.' },
    { id: 'translate' as ViewMode, icon: <Languages className="w-5 h-5 text-[#ec4899]" />, name: 'Translator', desc: 'Accurate multilingual translations with nuanced notes.' },
    { id: 'summary' as ViewMode, icon: <Zap className="w-5 h-5 text-[#10b981]" />, name: 'Quick Summary', desc: 'Turn long reports and articles into high-signal takeaways.' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-10 space-y-8">
      {/* Hero Header */}
      <section className="text-center space-y-2">
        <div className="text-[11px] font-extrabold tracking-widest text-[#b2a4ff] uppercase">
          YOUR IDEAS, POWERED BY REAL AI
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
          Meet <span className="bg-gradient-to-r from-[#c1b4ff] via-[#8875ff] to-[#6cebd8] bg-clip-text text-transparent">Jeevanth AI</span>
        </h1>
        <p className="text-sm md:text-base text-[#9aaaca] max-w-lg mx-auto">
          Connected directly to Google Gemini 3.8. Ask questions, explore code, generate prompts, and create without limits.
        </p>
      </section>

      {/* Main Chatbox */}
      <div className="rounded-2xl border border-[#35496d] bg-gradient-to-b from-[#14213a] to-[#0e1729] shadow-2xl p-4 md:p-6 space-y-4">
        {/* Messages List */}
        <div className="min-h-[220px] max-h-[52vh] overflow-y-auto space-y-4 pr-1">
          {messages.length === 0 ? (
            <div className="py-12 text-center text-[#9aaaca] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#1b2b46] border border-[#2a3b5b] flex items-center justify-center mx-auto text-[#9a83ff] text-2xl shadow-inner">
                ✦
              </div>
              <div className="font-semibold text-white text-base">What can I help you with today?</div>
              <p className="text-xs md:text-sm max-w-md mx-auto leading-relaxed">
                Start a live conversation below or pick a prompt idea. All responses are powered by the real backend API.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                >
                  <div
                    className={`max-w-[90%] md:max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      isUser
                        ? 'bg-gradient-to-r from-[#6657c8] to-[#5148a7] text-white rounded-br-xs shadow-md shadow-[#6657c8]/20'
                        : 'bg-[#1a273f] text-[#dce7ff] border border-[#2d4063] rounded-bl-xs shadow-md'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{m.text}</p>
                    ) : (
                      <FormattedContent content={m.text} />
                    )}

                    {!isUser && (
                      <div className="mt-3 pt-2 border-t border-[#2a3c5a] flex items-center justify-between text-[11px] text-[#7f94b8]">
                        <span className="font-mono text-[10px] text-[#4ce0ce]">
                          {m.model || 'gemini-3.8-flash'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopy(m.id, m.text)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-[#253857] text-[#cbd8ef] transition"
                            title="Copy response"
                          >
                            {copiedId === m.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {isLoading && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#1a273f] border border-[#2d4063] text-xs text-[#9aaaca] w-fit">
              <Sparkles className="w-4 h-4 text-[#9a83ff] animate-spin" />
              <span>Jeevanth AI is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="pt-2">
          <div className="bg-[#0a1324] border border-[#35496b] focus-within:border-[#796fe0] rounded-xl p-2 md:p-3 flex items-end gap-2 transition shadow-inner">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              maxLength={4000}
              placeholder="Ask Jeevanth AI anything..."
              disabled={isLoading}
              className="flex-1 bg-transparent border-0 outline-hidden text-sm md:text-base text-white placeholder-[#7082a0] resize-none px-2 py-1 max-h-[160px]"
            />
            <button
              onClick={() => handleSubmit()}
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#9a83ff] to-[#4dabea] disabled:opacity-40 disabled:cursor-not-allowed text-[#091322] font-black flex items-center justify-center hover:brightness-110 active:scale-95 transition cursor-pointer shadow-md shadow-[#9a83ff]/30 shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="flex justify-between items-center text-[10px] text-[#7385a5] px-2 pt-2">
            <span>Enter to send · Shift + Enter for newline</span>
            <span>{input.length} / 4000</span>
          </div>
        </div>
      </div>

      {/* Suggestion Pills */}
      <div className="flex flex-wrap gap-2 justify-center">
        {suggestions.map((item, idx) => (
          <button
            key={idx}
            onClick={() => {
              setInput(item.prompt);
              if (textareaRef.current) textareaRef.current.focus();
            }}
            className="px-3.5 py-1.5 rounded-full bg-[#121d31] border border-[#2a3b5b] hover:border-[#8875ff] hover:bg-[#182640] text-[#c5d1e8] text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Explore AI Tools Grid */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white tracking-wide">Explore AI Tools</h2>
          <span className="text-xs text-[#9aaaca]">Click any tool to launch its studio</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelectTool(t.id)}
              className="p-4 rounded-xl bg-gradient-to-br from-[#142039] to-[#10192b] border border-[#2a3b5b] hover:border-[#796fe0] hover:-translate-y-0.5 transition duration-200 text-left cursor-pointer group shadow-xs"
            >
              <div className="mb-2.5 p-2 rounded-lg bg-[#0d1629] w-fit border border-[#243450] group-hover:border-[#796fe0] transition">
                {t.icon}
              </div>
              <strong className="block text-sm text-white font-semibold mb-1 group-hover:text-[#c1b4ff] transition">
                {t.name}
              </strong>
              <span className="block text-xs text-[#9aaaca] leading-relaxed">
                {t.desc}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
