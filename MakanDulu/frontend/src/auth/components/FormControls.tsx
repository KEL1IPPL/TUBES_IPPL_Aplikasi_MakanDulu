import React from 'react';

export const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs border border-[#dee8ff] focus:bg-white focus:ring-2 outline-none ${props.className || ''}`} />
);

export const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...props} className={`w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs border border-[#dee8ff] focus:bg-white focus:ring-2 outline-none resize-none ${props.className || ''}`} />
);

export const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs font-bold text-[#111c2d] mb-1.5">{children}</label>
);

export const SubmitButton = ({ loading, children, className = '', onClick }: { loading: boolean; children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <button type="submit" disabled={loading} onClick={onClick} className={`w-full py-3.5 rounded-2xl text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 ${className}`}>
    {loading ? <><span className="material-symbols-outlined animate-spin text-base">progress_activity</span><span>Memproses...</span></> : children}
  </button>
);
