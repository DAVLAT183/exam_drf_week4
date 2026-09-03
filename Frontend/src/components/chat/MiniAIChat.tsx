'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, Sparkles, MessageSquare, Minimize2, Maximize2 } from 'lucide-react';
import api from '@/lib/api';
import { showToast, getErrorMessage } from '@/lib/utils';
import { clsx } from '@/lib/utils';
import Button from '@/components/ui/Button';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function MiniAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    try {
      const payload: { message: string; session_id?: number } = { message: text };
      if (sessionId) {
        payload.session_id = sessionId;
      }

      const res = await api.post('/chat/send/', payload);
      const data = res.data;

      const assistantMsg: Message = { role: 'assistant', content: data.assistant_message.content };
      setMessages((prev) => [...prev, assistantMsg]);

      if (!sessionId) {
        setSessionId(data.session_id);
      }
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0) {
      setMessages([{ role: 'assistant', content: 'Привет! Я AI-консультант по карьере. Чем могу помочь? Могу подсказать с резюме, поиском работы или подготовкой к собеседованию.' }]);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSessionId(null);
    setInput('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-[500]">
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="btn-float w-14 h-14 rounded-full bg-accent-primary text-white flex items-center justify-center transition-all duration-200 group"
          aria-label="Открыть AI чат"
        >
          <Bot size={24} className="group-hover:rotate-12 transition-transform duration-200" />
          <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">1</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          ref={containerRef}
          className="fixed bottom-6 right-6 w-96 h-[500px] max-h-[calc(100vh-4rem)] bg-bg-primary border border-border-default rounded-2xl shadow-lg flex flex-col overflow-hidden animate-scale-in"
        >
          <div className="p-4 border-b border-border-default bg-bg-secondary flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent-primary flex items-center justify-center">
                <Bot size={18} className="text-white" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-sm">AI Карьерный консультант</h3>
                <p className="text-xs text-text-muted">Поможет с резюме и поиском работы</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="p-2 rounded-lg hover:bg-surface-hover transition-colors text-text-muted hover:text-text-primary"
                title="Новый чат"
              >
                <Sparkles size={14} />
              </button>
              <button
                onClick={toggleChat}
                className="p-2 rounded-lg hover:bg-surface-hover transition-colors text-text-muted hover:text-text-primary"
                title="Закрыть"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-full bg-accent-primary/10 flex items-center justify-center mb-4">
                  <Bot size={28} className="text-accent-primary" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">Привет! Я AI-ассистент</h3>
                <p className="text-sm text-text-muted max-w-md">
                  Я помогу вам составить резюме, найти работу или подготовиться к собеседованию.
                  Задайте вопрос или расскажите о себе!
                </p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={clsx(
                    'flex gap-3',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-accent-primary/15 flex items-center justify-center flex-shrink-0">
                      <Bot size={14} className="text-accent-primary" />
                    </div>
                  )}
                  <div
                    className={clsx(
                      'max-w-[75%] px-4 py-3 rounded-[16px] text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-accent-primary text-white rounded-br-[4px]'
                        : 'bg-surface-card text-text-primary border border-border-default rounded-bl-[4px]'
                    )}
                  >
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center flex-shrink-0">
                      <MessageSquare size={14} className="text-text-muted" />
                    </div>
                  )}
                </div>
              ))
            )}
            {sending && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-accent-primary/15 flex items-center justify-center">
                  <Bot size={14} className="text-accent-primary" />
                </div>
                <div className="px-4 py-3 rounded-[16px] bg-surface-card border border-border-default">
                  <Loader2 size={16} className="animate-spin text-accent-primary" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-border-default bg-bg-secondary">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Напишите сообщение..."
                className="flex-1 px-4 py-3 rounded-[12px] bg-surface-card border border-border-default text-sm text-text-primary placeholder:text-text-subtle focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary-muted transition-all"
                disabled={sending}
                autoFocus
              />
              <Button onClick={handleSend} disabled={!input.trim() || sending} className="h-11">
                <Send size={16} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}