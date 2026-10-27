'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Send, Bot, User, Sparkles, Menu, X, Globe, Cpu } from 'lucide-react';
import 'katex/dist/katex.min.css'; // Crucial for rendering math styles properly

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Universal LaTeX sanitizer using safe callback functions
const sanitizeLatex = (content: string): string => {
  if (!content) return '';
  return content
    // Convert [ ... ] to $$...$$ safely
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `$$${math}$$`)
    // Convert \(...\) to $...$ safely
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math}$`)
    // Convert standalone bracketed blocks [ ... ] to $$...$$ safely
    .replace(/(^|\n)\s*\[([\s\S]*?)\]/g, (_, prefix, math) => `${prefix}$$${math}$$`);
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [model, setModel] = useState<'groq' | 'gemini'>('groq');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');

    // 1. Add user message and an empty placeholder for the assistant response
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: '' },
    ]);
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, model }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to start stream');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullContent = '';

      // 2. Read stream cleanly into a local string variable
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode chunk
        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;

        // 3. Update state with the exact accumulated string
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          updated[lastIndex] = {
            ...updated[lastIndex],
            content: fullContent,
          };
          return updated;
        });
      }
    } catch (err) {
      console.error('Error reading stream:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-dvh w-full overflow-hidden bg-[#09090b] text-zinc-100 font-sans">
      
      {/* 🌟 AMBIENT RADIAL BLUR BACKGROUND GLOWS */}
      <div className="absolute top-[-10%] left-[15%] h-[300px] sm:h-[500px] w-[300px] sm:w-[500px] rounded-full bg-purple-600/10 blur-[100px] sm:blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] h-[350px] sm:h-[600px] w-[350px] sm:w-[600px] rounded-full bg-indigo-600/10 blur-[120px] sm:blur-[160px] pointer-events-none" />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar - Glassmorphism Drawer */}
      <aside
        className={`fixed md:relative z-30 h-full w-72 bg-zinc-950/90 md:bg-black/40 backdrop-blur-xl border-r border-white/10 p-4 flex flex-col transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between font-bold text-lg text-indigo-400 mb-8 px-2">
          <div className="flex items-center gap-2">
            <Sparkles size={20} /> RayanGPT
          </div>
          {/* Close Sidebar Button (Mobile) */}
          <button 
            type="button" 
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-zinc-400 hover:text-white p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-2">
          Model Engine
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              setModel('groq');
              setSidebarOpen(false);
            }}
            className={`w-full text-left p-3 rounded-xl text-sm transition font-medium flex items-center justify-between ${
              model === 'groq'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-lg shadow-indigo-500/10'
                : 'bg-white/[0.02] text-zinc-400 hover:bg-white/[0.05] border border-white/5'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Cpu size={16} className="text-indigo-400" />
              <span>Groq (Qwen 27B)</span>
            </div>
            <span className={`h-2 w-2 rounded-full ${model === 'groq' ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]' : 'bg-zinc-600'}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              setModel('gemini');
              setSidebarOpen(false);
            }}
            className={`w-full text-left p-3 rounded-xl text-sm transition font-medium flex items-center justify-between ${
              model === 'gemini'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-lg shadow-indigo-500/10'
                : 'bg-white/[0.02] text-zinc-400 hover:bg-white/[0.05] border border-white/5'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Globe size={16} className="text-indigo-400" />
              <span>Live Search (Updated)</span>
            </div>
            <span className={`h-2 w-2 rounded-full ${model === 'gemini' ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]' : 'bg-zinc-600'}`} />
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="relative z-10 flex-1 flex flex-col h-full min-w-0 justify-between">
        
        {/* Mobile Header Bar */}
        <header className="md:hidden flex items-center justify-between border-b border-white/10 px-4 py-3 bg-zinc-950/50 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg bg-white/5 text-zinc-300 hover:bg-white/10"
              aria-label="Open Sidebar"
            >
              <Menu size={20} />
            </button>
            <span className="font-bold text-sm text-indigo-400 flex items-center gap-1.5">
              <Sparkles size={16} /> RayanGPT
            </span>
          </div>

          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
            {model === 'groq' ? 'Qwen 27B' : 'Live Search'}
          </span>
        </header>

        {/* Chat Messages Scroll Container */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-zinc-500 my-auto py-20 sm:py-32">
              <div className="mx-auto mb-4 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-inner text-indigo-400">
                <Sparkles size={24} className="opacity-70" />
              </div>
              <p className="text-base sm:text-lg font-medium text-zinc-300 px-4">
                Ask any math, coding, or homework question.
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 sm:gap-4 max-w-full sm:max-w-3xl mx-auto w-full ${
                msg.role === 'user' ? 'justify-end' : ''
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20 mt-1">
                  <Bot size={15} />
                </div>
              )}
              
              <div
                className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed backdrop-blur-md max-w-[88%] sm:max-w-full overflow-x-auto ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 rounded-tr-sm'
                    : 'bg-white/[0.03] border border-white/10 text-zinc-200 rounded-tl-sm shadow-xl'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-invert prose-sm max-w-none break-words">
                    <ReactMarkdown
                      remarkPlugins={[[remarkMath, { singleDollar: true }]]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {sanitizeLatex(msg.content)}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0 mt-1">
                  <User size={15} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Floating Glassmorphism Input Form */}
        <div className="p-3 sm:p-6 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent">
          <form onSubmit={sendMessage} className="max-w-3xl mx-auto">
            <div className="relative flex items-center rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl p-1.5 sm:p-2 shadow-2xl shadow-black/60">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 bg-transparent px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none min-w-0"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30 hover:opacity-90 disabled:opacity-40 transition shrink-0"
              >
                <Send size={15} />
              </button>
            </div>
          </form>
          <p className="mt-2.5 text-center text-[10px] sm:text-xs text-zinc-500">
            RayanGPT may display inaccurate info. Kindly check important information.
          </p>
        </div>

      </div>
    </div>
  );
}
