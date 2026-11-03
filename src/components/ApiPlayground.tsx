import React, { useState } from 'react';
import {
  Terminal,
  Play,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Code,
  FileCode,
  BookOpen,
  Send,
  Sparkles,
} from 'lucide-react';
import { generateSnippet } from '../utils/api-helpers';

interface ApiPlaygroundProps {
  onShowToast: (msg: string) => void;
}

interface EndpointPreset {
  id: string;
  name: string;
  method: 'GET' | 'POST';
  path: string;
  description: string;
  defaultBody?: Record<string, unknown>;
}

const ENDPOINTS: EndpointPreset[] = [
  {
    id: 'status',
    name: 'Health & Status',
    method: 'GET',
    path: '/api/status',
    description: 'Check backend service health, connected Gemini model, and uptime.',
  },
  {
    id: 'chat_single',
    name: 'Chat (Single Prompt)',
    method: 'POST',
    path: '/api/chat',
    description: 'Send a prompt and receive a comprehensive response from gemini-3.8-flash.',
    defaultBody: {
      message: 'Explain the core difference between a database index and a cache in 2 concise paragraphs.',
    },
  },
  {
    id: 'chat_history',
    name: 'Chat (Conversation History)',
    method: 'POST',
    path: '/api/chat',
    description: 'Send a conversation array preserving multi-turn context.',
    defaultBody: {
      messages: [
        { role: 'user', content: 'What are the main planets in our solar system?' },
        { role: 'assistant', content: 'The eight planets are Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune.' },
        { role: 'user', content: 'Which of those is the largest?' },
      ],
    },
  },
  {
    id: 'tool_image',
    name: 'Tool: Image Studio',
    method: 'POST',
    path: '/api/tools/image',
    description: 'Generate production-ready, hyper-detailed image prompts.',
    defaultBody: {
      input: 'A glowing bioluminescent underwater coral palace',
      style: 'Cinematic Photorealistic',
    },
  },
  {
    id: 'tool_code',
    name: 'Tool: Code Helper',
    method: 'POST',
    path: '/api/tools/code',
    description: 'Generate, debug, or refactor code with best practices.',
    defaultBody: {
      input: 'Write an asynchronous retry function in TypeScript with exponential backoff.',
      codeLang: 'TypeScript',
    },
  },
  {
    id: 'tool_translate',
    name: 'Tool: Translator',
    method: 'POST',
    path: '/api/tools/translate',
    description: 'Context-rich translation with linguistic nuance and phonetic tips.',
    defaultBody: {
      input: 'Welcome! It is an honor to partner with you.',
      targetLang: 'Tamil',
    },
  },
  {
    id: 'docs',
    name: 'API Schema Docs',
    method: 'GET',
    path: '/api/docs',
    description: 'Retrieve JSON documentation of all endpoints and schema requirements.',
  },
];

export const ApiPlayground: React.FC<ApiPlaygroundProps> = ({ onShowToast }) => {
  const [selectedPreset, setSelectedPreset] = useState<EndpointPreset>(ENDPOINTS[1]);
  const [requestBodyText, setRequestBodyText] = useState(
    JSON.stringify(ENDPOINTS[1].defaultBody || {}, null, 2)
  );
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [snippetLanguage, setSnippetLanguage] = useState<'curl' | 'js' | 'python'>('curl');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const handleSelectPreset = (preset: EndpointPreset) => {
    setSelectedPreset(preset);
    setRequestBodyText(
      preset.defaultBody ? JSON.stringify(preset.defaultBody, null, 2) : ''
    );
    setResponseData(null);
    setResponseStatus(null);
    setResponseTime(null);
  };

  const handleSend = async () => {
    setIsLoading(true);
    setResponseData(null);
    setResponseStatus(null);
    const start = performance.now();

    try {
      let parsedBody: any = undefined;
      if (selectedPreset.method === 'POST') {
        try {
          parsedBody = JSON.parse(requestBodyText);
        } catch (e: any) {
          throw new Error(`Invalid JSON in request body: ${e.message}`);
        }
      }

      const res = await fetch(selectedPreset.path, {
        method: selectedPreset.method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: selectedPreset.method === 'POST' ? JSON.stringify(parsedBody) : undefined,
      });

      const elapsed = Math.round(performance.now() - start);
      setResponseTime(elapsed);
      setResponseStatus(res.status);

      const json = await res.json();
      setResponseData(JSON.stringify(json, null, 2));
      onShowToast(`HTTP ${res.status} received in ${elapsed}ms`);
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - start);
      setResponseTime(elapsed);
      setResponseStatus(500);
      setResponseData(JSON.stringify({ error: err.message }, null, 2));
      onShowToast(`Request failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate snippet
  let parsedJson: Record<string, unknown> | undefined;
  if (selectedPreset.method === 'POST') {
    try {
      parsedJson = JSON.parse(requestBodyText);
    } catch {}
  }
  const codeSnippet = generateSnippet(
    snippetLanguage,
    selectedPreset.path,
    selectedPreset.method,
    parsedJson
  );

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(codeSnippet).then(() => {
      setCopiedSnippet(true);
      onShowToast('Code snippet copied to clipboard');
      setTimeout(() => setCopiedSnippet(false), 2000);
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10 space-y-8">
      {/* Title & Overview */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-[#101a2d] via-[#14213a] to-[#0d1627] border border-[#2a3b5b] shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-[#38bdf8]/15 border border-[#38bdf8]/30 text-[#38bdf8]">
                <Terminal className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#38bdf8]">
                Developer Hub
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              Jeevanth AI REST API Explorer
            </h1>
            <p className="text-sm text-[#9aaaca] max-w-2xl leading-relaxed">
              Test and integrate Jeevanth AI's REST endpoints directly into your apps, scripts, and workflows. Powered by Google Gemini 3.8.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#080d1a] border border-[#2a3b5b] text-xs text-[#78e5d2]">
            <CheckCircle2 className="w-4 h-4 text-[#4ce0ce]" />
            <span>Express Backend Live on :3000</span>
          </div>
        </div>
      </div>

      {/* Preset Endpoint Selector */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-[#7789ab]">
          Select Endpoint to Test
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {ENDPOINTS.map((preset) => {
            const isSelected = selectedPreset.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`p-2.5 rounded-xl text-left border text-xs transition cursor-pointer ${
                  isSelected
                    ? 'bg-[#182640] border-[#38bdf8] text-white shadow-md'
                    : 'bg-[#0f1729] border-[#223350] text-[#9aaaca] hover:text-white hover:bg-[#142036]'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 font-mono text-[10px]">
                  <span
                    className={`px-1.5 py-0.5 rounded font-bold ${
                      preset.method === 'POST'
                        ? 'bg-indigo-500/20 text-indigo-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {preset.method}
                  </span>
                  <span className="truncate">{preset.path}</span>
                </div>
                <div className="font-semibold truncate text-[#f0f4ff]">{preset.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Request & Response Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Panel */}
        <div className="p-5 rounded-2xl bg-[#0e1729] border border-[#2a3b5b] shadow-xl flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#203350]">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <span
                className={`px-2 py-0.5 rounded font-mono text-xs font-bold ${
                  selectedPreset.method === 'POST'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {selectedPreset.method}
              </span>
              <span className="font-mono text-xs text-[#dce7ff]">{selectedPreset.path}</span>
            </div>
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#6366f1] hover:brightness-110 disabled:opacity-40 text-[#091322] font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#38bdf8]/20 transition cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Send Request</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-[#9aaaca]">{selectedPreset.description}</p>

          {selectedPreset.method === 'POST' ? (
            <div className="flex-1 flex flex-col min-h-[220px]">
              <label className="text-xs font-semibold text-[#8292b0] mb-1.5 flex items-center justify-between">
                <span>Request Body (JSON)</span>
                <span className="text-[10px] text-[#55698a]">Content-Type: application/json</span>
              </label>
              <textarea
                value={requestBodyText}
                onChange={(e) => setRequestBodyText(e.target.value)}
                rows={10}
                className="flex-1 w-full p-3 font-mono text-xs rounded-xl bg-[#060a14] border border-[#243552] text-[#8ce2ff] focus:border-[#38bdf8] outline-hidden resize-none leading-relaxed"
              />
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#080d1a] border border-[#203350] text-xs text-[#7385a5] italic">
              GET request does not require a body. Click "Send Request" to fetch the response.
            </div>
          )}
        </div>

        {/* Response Panel */}
        <div className="p-5 rounded-2xl bg-[#0e1729] border border-[#2a3b5b] shadow-xl flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#203350]">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <span>Response Output</span>
              {responseStatus !== null && (
                <span
                  className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                    responseStatus >= 200 && responseStatus < 300
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {responseStatus} {responseStatus === 200 ? 'OK' : ''}
                </span>
              )}
            </div>

            {responseTime !== null && (
              <div className="flex items-center gap-1 text-xs text-[#78e5d2] font-mono">
                <Clock className="w-3.5 h-3.5" />
                <span>{responseTime}ms</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-h-[260px] max-h-[400px] overflow-auto rounded-xl bg-[#060a14] border border-[#243552] p-3">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-xs text-[#9aaaca] gap-2 py-12">
                <Sparkles className="w-4 h-4 animate-spin text-[#38bdf8]" />
                <span>Waiting for response from Gemini backend...</span>
              </div>
            ) : responseData ? (
              <pre className="font-mono text-xs text-[#7ce38b] leading-relaxed whitespace-pre-wrap">
                <code>{responseData}</code>
              </pre>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#5d6f8f] py-16 text-center">
                Click "Send Request" to test this endpoint and view output.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Code Snippets Generator */}
      <div className="p-6 rounded-2xl bg-[#0e1729] border border-[#2a3b5b] shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#203350]">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Code className="w-4 h-4 text-[#8875ff]" />
              <span>Integration Snippets</span>
            </h3>
            <p className="text-xs text-[#9aaaca]">
              Copy-paste ready code to call this API endpoint from your own applications.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-[#080d1a] border border-[#243552] rounded-lg p-0.5 text-xs">
              {(['curl', 'js', 'python'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSnippetLanguage(lang)}
                  className={`px-3 py-1 rounded-md capitalize font-medium transition cursor-pointer ${
                    snippetLanguage === lang
                      ? 'bg-[#1e2e4a] text-white shadow-xs'
                      : 'text-[#8292b0] hover:text-white'
                  }`}
                >
                  {lang === 'js' ? 'JavaScript' : lang}
                </button>
              ))}
            </div>

            <button
              onClick={handleCopySnippet}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2a3b5b] bg-[#121c2e] hover:bg-[#1c2c48] text-xs text-[#cbd8ef] transition cursor-pointer"
            >
              {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSnippet ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden bg-[#060a14] border border-[#243552] p-4">
          <pre className="font-mono text-xs text-[#cbd8ef] overflow-x-auto leading-relaxed">
            <code>{codeSnippet}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
