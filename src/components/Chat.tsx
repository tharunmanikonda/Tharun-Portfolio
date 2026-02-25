import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Sparkles, RotateCcw } from 'lucide-react';

// ── TYPES ─────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

// ── CONSTANTS ─────────────────────────────────────────────────────────────

const API_URL = 'http://localhost:5001/api/chat';

const SUGGESTIONS = [
  'Tell me about yourself',
  'What did you build at Uber?',
  'Show me your AI projects',
  'What\'s your tech stack?',
  'Are you available to hire?',
];

const GREETING: Message = {
  role: 'assistant',
  content: "Hey! I'm an AI version of Tharun. Ask me anything — my projects, experience, tech stack, or whether I'm open to new roles.",
};

// ── HOOK: streaming fetch ─────────────────────────────────────────────────

function useChat() {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return;

    // Append user message + empty assistant placeholder
    const userMsg: Message = { role: 'user', content: text };
    const assistantMsg: Message = { role: 'assistant', content: '', streaming: true };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setStreaming(true);

    abortRef.current = new AbortController();

    try {
      const history = messages
        .filter(m => !m.streaming)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error('Stream unavailable');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const token = line.slice(6);
          if (token === '[DONE]') {
            setStreaming(false);
            setMessages(prev => {
              const copy = [...prev];
              copy[copy.length - 1] = { ...copy[copy.length - 1], streaming: false };
              return copy;
            });
            return;
          }
          setMessages(prev => {
            const copy = [...prev];
            copy[copy.length - 1] = {
              ...copy[copy.length - 1],
              content: copy[copy.length - 1].content + token,
            };
            return copy;
          });
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: 'assistant',
          content: "Sorry, I couldn't connect to the backend. Make sure it's running on port 5001.",
          streaming: false,
        };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  }, [messages, streaming]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([GREETING]);
    setStreaming(false);
  }, []);

  return { messages, streaming, send, reset };
}

// ── COMPONENTS ────────────────────────────────────────────────────────────

const TypingIndicator = () => (
  <div className="flex gap-1 items-center px-1 py-0.5">
    {[0, 1, 2].map(i => (
      <span
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-violet-400 opacity-60"
        style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
      />
    ))}
  </div>
);

const UserBubble = ({ content }: { content: string }) => (
  <div className="flex justify-end">
    <div
      className="max-w-[78%] px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed text-white"
      style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
    >
      {content}
    </div>
  </div>
);

const AssistantBubble = ({ content, streaming }: { content: string; streaming?: boolean }) => (
  <div className="flex justify-start gap-2.5">
    {/* Avatar */}
    <div
      className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center mt-0.5"
      style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }}
    >
      <Sparkles size={12} className="text-white" />
    </div>

    <div
      className="max-w-[82%] px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm leading-relaxed"
      style={{
        background: 'rgba(15, 17, 40, 0.8)',
        border: '1px solid rgba(139, 92, 246, 0.15)',
        color: '#e2e8f0',
      }}
    >
      {content === '' && streaming ? (
        <TypingIndicator />
      ) : (
        <>
          {content}
          {streaming && (
            <span
              className="inline-block w-0.5 h-3.5 ml-0.5 bg-violet-400 align-middle"
              style={{ animation: 'blink 1s step-end infinite' }}
            />
          )}
        </>
      )}
    </div>
  </div>
);

// ── MAIN CHAT COMPONENT ───────────────────────────────────────────────────

export default function Chat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, streaming, send, reset } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasInteracted = messages.length > 1;

  // Auto-scroll to bottom on new content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opening
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    send(text);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggest = (q: string) => {
    if (streaming) return;
    send(q);
  };

  return (
    <>
      {/* ── Chat Panel ──────────────────────────────────────────────────── */}
      <div
        className="fixed bottom-24 right-6 z-50 w-[360px] flex flex-col rounded-2xl overflow-hidden transition-all duration-300"
        style={{
          height: open ? '520px' : '0px',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          background: 'rgba(6, 7, 20, 0.95)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 40px rgba(139,92,246,0.08)',
          transformOrigin: 'bottom right',
          transform: open ? 'scale(1)' : 'scale(0.92)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.1)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }}
            >
              <Sparkles size={14} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-100">Ask Tharun AI</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[0.6rem] text-slate-500 font-mono">
                  {streaming ? 'generating...' : 'online'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasInteracted && (
              <button
                onClick={reset}
                className="text-slate-500 hover:text-slate-300 transition-colors duration-150 p-1"
                title="Reset conversation"
              >
                <RotateCcw size={14} />
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="text-slate-500 hover:text-slate-200 transition-colors duration-150 p-1"
              aria-label="Close chat"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
          {messages.map((msg, i) =>
            msg.role === 'user' ? (
              <UserBubble key={i} content={msg.content} />
            ) : (
              <AssistantBubble key={i} content={msg.content} streaming={msg.streaming} />
            )
          )}

          {/* Suggested questions — shown only before first interaction */}
          {!hasInteracted && (
            <div className="space-y-2 pt-1">
              <p className="text-[0.65rem] text-slate-600 font-mono tracking-wide uppercase px-1">
                Suggested
              </p>
              <div className="flex flex-col gap-1.5">
                {SUGGESTIONS.map(q => (
                  <button
                    key={q}
                    onClick={() => handleSuggest(q)}
                    className="text-left text-xs text-slate-400 hover:text-violet-300 px-3 py-2 rounded-xl transition-all duration-150"
                    style={{
                      background: 'rgba(139, 92, 246, 0.05)',
                      border: '1px solid rgba(139, 92, 246, 0.12)',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(139, 92, 246, 0.12)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139, 92, 246, 0.3)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(139, 92, 246, 0.05)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139, 92, 246, 0.12)';
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div
          className="px-3 py-3 shrink-0"
          style={{ borderTop: '1px solid rgba(139, 92, 246, 0.08)' }}
        >
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: 'rgba(15, 17, 40, 0.8)', border: '1px solid rgba(139, 92, 246, 0.15)' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask me anything..."
              disabled={streaming}
              className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || streaming}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0 disabled:opacity-30"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
            >
              <Send size={12} className="text-white" />
            </button>
          </div>
          <p className="text-center text-[0.55rem] text-slate-700 font-mono mt-2 tracking-wide">
            Powered by generative AI · responses may be inaccurate
          </p>
        </div>
      </div>

      {/* ── Floating Bubble Button ───────────────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          background: open
            ? 'rgba(15, 17, 40, 0.95)'
            : 'linear-gradient(135deg, #7c3aed, #0891b2)',
          border: open ? '1px solid rgba(139, 92, 246, 0.4)' : 'none',
          boxShadow: open
            ? '0 8px 30px rgba(124, 58, 237, 0.3)'
            : '0 8px 30px rgba(124, 58, 237, 0.5), 0 0 0 1px rgba(139,92,246,0.2)',
        }}
        aria-label={open ? 'Close chat' : 'Open AI chat'}
      >
        <div
          className="transition-all duration-200"
          style={{ transform: open ? 'rotate(90deg) scale(0.85)' : 'none' }}
        >
          {open ? (
            <X size={20} className="text-slate-300" />
          ) : (
            <Sparkles size={20} className="text-white" />
          )}
        </div>

        {/* Unread dot — shown before first interaction */}
        {!hasInteracted && !open && (
          <span
            className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
            style={{
              background: '#22c55e',
              borderColor: '#04050f',
              animation: 'ping-slow 2s cubic-bezier(0,0,0.2,1) infinite',
            }}
          />
        )}
      </button>

      {/* Bounce keyframes (for typing indicator) */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </>
  );
}
