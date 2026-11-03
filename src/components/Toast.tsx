import React from 'react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
      <div className="px-4 py-2.5 rounded-xl bg-[#1b2b46]/95 border border-[#435779] text-white text-xs font-medium shadow-2xl backdrop-blur-md flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#4ce0ce] animate-pulse" />
        <span>{message}</span>
      </div>
    </div>
  );
};
