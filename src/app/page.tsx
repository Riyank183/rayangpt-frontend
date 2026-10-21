'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Send, Bot, User, Sparkles } from 'lucide-react';
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

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');

    // 1. Add user message and an empty placeholder for the assistant response
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: '' }
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
    <div className="relative flex h-screen w-full overflow-hidden bg-[#09090b] text-zinc-100 font-sans">
      
      {/* 🌟 AMBIENT RADIAL BLUR BACKGROUND GLOWS */}
      <div className="absolute top-[-10%] left-[15%] h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] h-[600px] w-[600px] rounded-full bg-indigo-600/10 blur-[160px] pointer-events-none" />

      {/* Sidebar - Glassmorphism */}
      <div className="relative z-10 w-72 bg-black/40 backdrop-blur-xl border-r border-white/10 p-4 flex flex-col">
        <div className="flex items-center gap-2 font-bold text-lg text-indigo-400 mb-8 px-2">
          <Sparkles size={20} /> RayanGPT
        </div>
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-2">
          Model Engine
        </div>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setModel('groq')}
            className={`w-full text-left p-3 rounded-xl text-sm transition font-medium flex items-center justify-between ${
              model === 'groq'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-lg shadow-indigo-500/10'
                : 'bg-white/[0.02] text-zinc-400 hover:bg-white/[0.05] border border-white/5'
            }`}
          >
            <span>Groq (Qwen 27B)</span>
            <span className={`h-2 w-2 rounded-full ${model === 'groq' ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]' : 'bg-zinc-600'}`} />
          </button>
          <button
            type="button"
            onClick={() => setModel('gemini')}
            className={`w-full text-left p-3 rounded-xl text-sm transition font-medium flex items-center justify-between ${
              model === 'gemini'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-lg shadow-indigo-500/10'
                : 'bg-white/[0.02] text-zinc-400 hover:bg-white/[0.05] border border-white/5'
            }`}
          >
            <span>Live Search (Updated)</span>
            <span className={`h-2 w-2 rounded-full ${model === 'gemini' ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]' : 'bg-zinc-600'}`} />
          </button>
        </div>
      </div>

      {/* Main Chat Box */}
      <div className="relative z-10 flex-1 flex flex-col h-full justify-between">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-zinc-500 mt-40">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-inner text-indigo-400">
                <Sparkles size={24} className="opacity-70" />
              </div>
              <p className="text-lg font-medium text-zinc-300">Ask any math, coding, or homework question.</p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-4 max-w-3xl mx-auto w-full ${
                msg.role === 'user' ? 'justify-end' : ''
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
                  <Bot size={16} />
                </div>
              )}
              <div
                className={`p-4 rounded-2xl text-sm leading-relaxed backdrop-blur-md ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 rounded-tr-sm'
                    : 'bg-white/[0.03] border border-white/10 text-zinc-200 rounded-tl-sm shadow-xl'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <ReactMarkdown
                    remarkPlugins={[[remarkMath, { singleDollar: true }]]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {sanitizeLatex(msg.content)}
                  </ReactMarkdown>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0">
                  <User size={16} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Floating Glassmorphism Input Form */}
        <div className="p-6">
          <form onSubmit={sendMessage} className="max-w-3xl mx-auto">
            <div className="relative flex items-center rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl p-2 shadow-2xl shadow-black/60">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 bg-transparent px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30 hover:opacity-90 disabled:opacity-40 transition"
              >
                <Send size={16} />
              </button>
            </div>
          </form>
          <p className="mt-3 text-center text-xs text-zinc-500">
            RayanGPT may display inaccurate info. Kindly check important information.
          </p>
        </div>
      </div>
    </div>
  );
}