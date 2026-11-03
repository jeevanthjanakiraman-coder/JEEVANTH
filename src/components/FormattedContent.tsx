import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface FormattedContentProps {
  content: string;
}

export const FormattedContent: React.FC<FormattedContentProps> = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  // Split content by code blocks ```lang ... ```
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 leading-relaxed text-sm">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const firstLineBreak = part.indexOf('\n');
          let language = 'text';
          let code = '';

          if (firstLineBreak !== -1) {
            language = part.slice(3, firstLineBreak).trim() || 'code';
            code = part.slice(firstLineBreak + 1, -3).trim();
          } else {
            code = part.slice(3, -3).trim();
          }

          return (
            <div
              key={index}
              className="my-3 rounded-xl overflow-hidden border border-[#2a3b5b] bg-[#070b16] shadow-md"
            >
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#101a2d] border-b border-[#2a3b5b] text-xs text-[#9aaaca]">
                <span className="font-mono uppercase text-[11px] tracking-wide font-medium">
                  {language}
                </span>
                <button
                  onClick={() => handleCopyCode(code, index)}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-[#1b2b46] text-[#cbd8ef] transition"
                  title="Copy code"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 text-xs md:text-sm font-mono overflow-x-auto text-[#e9edff] leading-relaxed">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        // Regular text formatting (paragraphs, bold, list items)
        const paragraphs = part.split('\n\n');
        return (
          <React.Fragment key={index}>
            {paragraphs.map((p, pIdx) => {
              const trimmed = p.trim();
              if (!trimmed) return null;

              // Check if bullet list
              if (trimmed.split('\n').every((line) => line.trim().startsWith('- ') || line.trim().startsWith('* ') || /^\d+\.\s/.test(line.trim()))) {
                const items = trimmed.split('\n');
                return (
                  <ul key={pIdx} className="space-y-1.5 list-disc list-inside pl-1 text-[#dce7ff]">
                    {items.map((item, iIdx) => (
                      <li key={iIdx} className="leading-relaxed">
                        {item.replace(/^[-*]\s+|\d+\.\s+/, '')}
                      </li>
                    ))}
                  </ul>
                );
              }

              // Check if header
              if (trimmed.startsWith('### ')) {
                return (
                  <h3 key={pIdx} className="text-base font-semibold text-[#f3f6ff] mt-2 mb-1">
                    {trimmed.replace('### ', '')}
                  </h3>
                );
              }
              if (trimmed.startsWith('## ')) {
                return (
                  <h2 key={pIdx} className="text-lg font-bold text-[#f3f6ff] mt-3 mb-1">
                    {trimmed.replace('## ', '')}
                  </h2>
                );
              }
              if (trimmed.startsWith('# ')) {
                return (
                  <h1 key={pIdx} className="text-xl font-extrabold text-[#f3f6ff] mt-4 mb-2">
                    {trimmed.replace('# ', '')}
                  </h1>
                );
              }

              return (
                <p key={pIdx} className="leading-relaxed whitespace-pre-line text-[#e0e8f8]">
                  {trimmed}
                </p>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
};
