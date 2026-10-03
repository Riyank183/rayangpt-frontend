'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Send, Bot, User, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [model, setModel] = useState<'groq' | 'gemini'>('groq');
  const [loading, setLoading] = useState(false);

const sendMessage = async (e: React.SubmitEvent) => {
  e.preventDefault();
  if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    // Placeholder for streaming output
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage, model }),
      });

      if (!response.body) throw new Error('No readable stream');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          updated[lastIdx].content += chunk;
          return updated;
        });
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '⚠ Error connecting to server.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-zinc-900 border-r border-zinc-800 p-4 flex flex-col">
        <div className="flex items-center gap-2 font-bold text-lg text-indigo-400 mb-8">
          <Sparkles size={20} /> Homework AI
        </div>
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
          Model Engine
        </div>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setModel('groq')}
            className={`w-full text-left p-2.5 rounded text-sm transition ${
              model === 'groq'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/50'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            Groq (Llama 3.3 70B)
          </button>
          <button
            type="button"
            onClick={() => setModel('gemini')}
            className={`w-full text-left p-2.5 rounded text-sm transition ${
              model === 'gemini'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/50'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            Gemini 2.5 Flash
          </button>
        </div>
      </div>

      {/* Main Chat Box */}
      <div className="flex-1 flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-zinc-500 mt-32">
              <Sparkles size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">Ask any math, coding, or homework question.</p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-4 max-w-3xl ${
                msg.role === 'user' ? 'ml-auto justify-end' : ''
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                  <Bot size={18} />
                </div>
              )}
              <div
                className={`p-4 rounded-xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-900 border border-zinc-800'
                }`}
              >
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {msg.content}
                </ReactMarkdown>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
                  <User size={18} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={sendMessage} className="p-4 border-t border-zinc-800 bg-zinc-900">
          <div className="max-w-3xl mx-auto flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-lg flex items-center gap-2 font-medium disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}