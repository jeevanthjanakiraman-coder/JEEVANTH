import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Copy,
  Check,
  Send,
  RotateCcw,
  Palette,
  PenTool,
  Code2,
  BookOpen,
  Languages,
  Zap,
} from 'lucide-react';
import { ViewMode } from '../types';
import { FormattedContent } from './FormattedContent';

interface ToolWorkspaceProps {
  tool: ViewMode;
  onClose: () => void;
  onSendToChat: (prompt: string, response: string) => void;
  onShowToast: (msg: string) => void;
}

interface ToolMeta {
  title: string;
  desc: string;
  placeholder: string;
  buttonLabel: string;
  icon: React.ReactNode;
}

const TOOL_CONFIGS: Record<string, ToolMeta> = {
  image: {
    title: 'Image Studio',
    desc: 'Describe any visual idea. Jeevanth AI expands it into a production-ready, hyper-detailed prompt with lighting, camera optics, and styles.',
    placeholder: 'Example: A cyberpunk cyber-coupe driving through rainy neo-Tokyo at night, volumetric purple neon reflections...',
    buttonLabel: 'Generate Image Prompt',
    icon: <Palette className="w-5 h-5 text-[#4ce0ce]" />,
  },
  writing: {
    title: 'Writing Assistant',
    desc: 'Specify what you need to write. Jeevanth AI crafts tailored drafts with impeccable flow, vocabulary, and chosen tone.',
    placeholder: 'Example: An email to my team announcing a project launch milestone, thanking the design and engineering leads...',
    buttonLabel: 'Draft Content',
    icon: <PenTool className="w-5 h-5 text-[#8875ff]" />,
  },
  code: {
    title: 'Code Helper',
    desc: 'Ask coding questions, request algorithms, or paste buggy snippets for immediate debugging and architecture recommendations.',
    placeholder: 'Example: Write a TypeScript function with debouncing and abort controller for real-time search inputs...',
    buttonLabel: 'Generate Code & Solution',
    icon: <Code2 className="w-5 h-5 text-[#559ef0]" />,
  },
  study: {
    title: 'Study Buddy',
    desc: 'Enter any subject, chapter, or complex equation. Jeevanth AI prepares conceptual breakdowns, analogies, and self-test quizzes.',
    placeholder: 'Example: Explain how Transformer neural networks use self-attention mechanisms in natural language processing...',
    buttonLabel: 'Create Study Guide',
    icon: <BookOpen className="w-5 h-5 text-[#f59e0b]" />,
  },
  translate: {
    title: 'Translator',
    desc: 'Translate text accurately into another language with cultural nuances, tone awareness, and pronunciation guides.',
    placeholder: 'Example: Welcome to our company. We look forward to building innovative software together...',
    buttonLabel: 'Translate with Context',
    icon: <Languages className="w-5 h-5 text-[#ec4899]" />,
  },
  summary: {
    title: 'Quick Summary',
    desc: 'Paste articles, transcripts, documentation, or meeting notes to extract key bullet points, decisions, and action items.',
    placeholder: 'Paste your long text, meeting notes, or article here...',
    buttonLabel: 'Generate Summary',
    icon: <Zap className="w-5 h-5 text-[#10b981]" />,
  },
};

export const ToolWorkspace: React.FC<ToolWorkspaceProps> = ({
  tool,
  onClose,
  onSendToChat,
  onShowToast,
}) => {
  const config = TOOL_CONFIGS[tool] || TOOL_CONFIGS.image;

  const [input, setInput] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Tool specific options
  const [style, setStyle] = useState('Cinematic Photorealistic');
  const [tone, setTone] = useState('Friendly and Professional');
  const [codeLang, setCodeLang] = useState('TypeScript');
  const [targetLang, setTargetLang] = useState('Tamil');
  const [summaryFormat, setSummaryFormat] = useState('bullets');
  const [complexity, setComplexity] = useState('Intermediate');

  const handleExecute = async () => {
    const text = input.trim();
    if (!text) {
      onShowToast('Please enter your prompt or text first');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch(`/api/tools/${tool}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: text,
          style,
          tone,
          codeLang,
          targetLang,
          summaryFormat,
          complexity,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate result');
      }

      setResult(data.result);
      onShowToast(`${config.title} generated successfully!`);
    } catch (err: any) {
      console.error('Tool execution error:', err);
      onShowToast(err.message || 'Error executing tool');
      setResult(`⚠️ Error: ${err.message || 'Could not complete request'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      onShowToast('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSendToChat = () => {
    if (!result) return;
    onSendToChat(input, result);
    onShowToast('Transferred to AI Chat conversation');
    onClose();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#14213a] to-[#10192d] border border-[#2a3b5b] shadow-xl flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-[#0c1424] border border-[#2a3b5b]">
            {config.icon}
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-1">{config.title}</h2>
            <p className="text-xs md:text-sm text-[#9aaaca] leading-relaxed max-w-xl">
              {config.desc}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl border border-[#2a3b5b] bg-[#121c2e] hover:bg-[#1c2c48] text-[#9aaaca] hover:text-white transition cursor-pointer"
          aria-label="Close tool"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Workspace Form */}
      <div className="p-6 rounded-2xl bg-[#0e1729] border border-[#2a3b5b] shadow-xl space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#9aaaca] mb-2">
            Your Prompt / Input Text
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={config.placeholder}
            rows={5}
            maxLength={6000}
            className="w-full p-4 rounded-xl bg-[#080d1a] border border-[#2a3b5b] focus:border-[#8875ff] outline-hidden text-sm md:text-base text-white placeholder-[#5d6f8f] resize-y transition"
          />
          <div className="text-right text-[11px] text-[#5d6f8f] mt-1">
            {input.length} / 6000
          </div>
        </div>

        {/* Dynamic Tool Configuration Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {tool === 'image' && (
            <div>
              <label className="block text-xs font-semibold text-[#9aaaca] mb-1.5">Artistic Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#080d1a] border border-[#2a3b5b] text-sm text-white focus:border-[#4ce0ce] outline-hidden"
              >
                <option value="Cinematic Photorealistic">Cinematic Photorealistic (35mm, 8K)</option>
                <option value="Cyberpunk & Neon">Cyberpunk & Neon Noir</option>
                <option value="Hyper-realistic 3D Render">Octane 3D Render & Studio Lighting</option>
                <option value="Anime & Digital Art">Anime & Modern Digital Illustration</option>
                <option value="Minimalist Editorial">Minimalist Editorial & Studio Portrait</option>
                <option value="Oil Painting & Fine Art">Oil Painting & Classical Masterpiece</option>
              </select>
            </div>
          )}

          {tool === 'writing' && (
            <div>
              <label className="block text-xs font-semibold text-[#9aaaca] mb-1.5">Tone & Voice</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#080d1a] border border-[#2a3b5b] text-sm text-white focus:border-[#8875ff] outline-hidden"
              >
                <option value="Friendly and Professional">Friendly & Professional</option>
                <option value="Polished Executive">Polished Executive & Confident</option>
                <option value="Creative and Engaging">Creative & Storytelling</option>
                <option value="Simple and Direct">Simple & Direct (Plain English)</option>
                <option value="Persuasive and Compelling">Persuasive Pitch & Sales</option>
                <option value="Academic and Rigorous">Academic & Analytical</option>
              </select>
            </div>
          )}

          {tool === 'code' && (
            <div>
              <label className="block text-xs font-semibold text-[#9aaaca] mb-1.5">Target Language / Framework</label>
              <select
                value={codeLang}
                onChange={(e) => setCodeLang(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#080d1a] border border-[#2a3b5b] text-sm text-white focus:border-[#559ef0] outline-hidden"
              >
                <option value="TypeScript">TypeScript / Node.js</option>
                <option value="Python">Python 3</option>
                <option value="React & Tailwind">React & Tailwind CSS</option>
                <option value="Go">Go (Golang)</option>
                <option value="Rust">Rust</option>
                <option value="SQL">PostgreSQL / SQL</option>
                <option value="Bash">Bash / Shell Script</option>
              </select>
            </div>
          )}

          {tool === 'study' && (
            <div>
              <label className="block text-xs font-semibold text-[#9aaaca] mb-1.5">Target Level</label>
              <select
                value={complexity}
                onChange={(e) => setComplexity(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#080d1a] border border-[#2a3b5b] text-sm text-white focus:border-[#f59e0b] outline-hidden"
              >
                <option value="High School">High School (Grade 9-12)</option>
                <option value="Undergraduate College">Undergraduate / College</option>
                <option value="Explain Like I am 12">Explain Like I am 12 (Simple Analogies)</option>
                <option value="Graduate / Expert">Graduate / Advanced Research</option>
              </select>
            </div>
          )}

          {tool === 'translate' && (
            <div>
              <label className="block text-xs font-semibold text-[#9aaaca] mb-1.5">Translate Into</label>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#080d1a] border border-[#2a3b5b] text-sm text-white focus:border-[#ec4899] outline-hidden"
              >
                <option value="Tamil">Tamil (தமிழ்)</option>
                <option value="Hindi">Hindi (हिन्दी)</option>
                <option value="French">French (Français)</option>
                <option value="Spanish">Spanish (Español)</option>
                <option value="Japanese">Japanese (日本語)</option>
                <option value="German">German (Deutsch)</option>
                <option value="Arabic">Arabic (العربية)</option>
                <option value="English">English</option>
              </select>
            </div>
          )}

          {tool === 'summary' && (
            <div>
              <label className="block text-xs font-semibold text-[#9aaaca] mb-1.5">Summary Format</label>
              <select
                value={summaryFormat}
                onChange={(e) => setSummaryFormat(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#080d1a] border border-[#2a3b5b] text-sm text-white focus:border-[#10b981] outline-hidden"
              >
                <option value="bullets">Key Bullet Points & Takeaways</option>
                <option value="executive">Executive Summary (1 Page)</option>
                <option value="tldr">Quick 3-Sentence TL;DR</option>
                <option value="action_items">Action Items & Decision Log</option>
              </select>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExecute}
            disabled={isLoading || !input.trim()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8875ff] to-[#559ef0] hover:brightness-110 disabled:opacity-40 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-[#8875ff]/25 active:scale-98 transition cursor-pointer"
          >
            {isLoading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-white" />
                <span>Processing with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{config.buttonLabel}</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setInput('');
              setResult(null);
            }}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-[#2a3b5b] bg-[#101a2d] hover:bg-[#1b2b46] text-[#cbd8ef] text-sm font-medium transition cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Result Display Card */}
      {result && (
        <div className="p-6 rounded-2xl bg-[#091222] border border-[#304870] shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#203350]">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <span className="w-2 h-2 rounded-full bg-[#4ce0ce]" />
              <span>AI Generated Result</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2a3b5b] bg-[#121c2e] hover:bg-[#1c2c48] text-xs text-[#cbd8ef] transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={handleSendToChat}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6657c8] hover:bg-[#5849b8] text-xs text-white font-medium transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send to Chat</span>
              </button>
            </div>
          </div>

          <div className="text-sm text-[#dce7ff]">
            <FormattedContent content={result} />
          </div>
        </div>
      )}
    </div>
  );
};
