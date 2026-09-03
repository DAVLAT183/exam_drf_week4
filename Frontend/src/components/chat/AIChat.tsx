'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, Loader2, MessageSquare } from 'lucide-react';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import { showToast, getErrorMessage } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

interface ChatSession {
  id: number;
  title: string;
  messages: Message[];
  last_message: Message | null;
  created_at: string;
}

export default function AIChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/chat/sessions/');
      const data = res.data;
      setSessions(data.results || data);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSession = async (sessionId: number) => {
    try {
      const res = await api.get(`/chat/${sessionId}/messages/`);
      setActiveSession(res.data);
      setMessages(res.data.messages || []);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const startNewSession = () => {
    setActiveSession(null);
    setMessages([]);
    setInput('');
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    try {
      const payload: { message: string; session_id?: number } = { message: text };
      if (activeSession) {
        payload.session_id = activeSession.id;
      }

      const res = await api.post('/chat/send/', payload);
      const data = res.data;

      const assistantMsg: Message = { role: 'assistant', content: data.assistant_message.content };
      setMessages((prev) => [...prev, assistantMsg]);

      if (!activeSession) {
        setActiveSession({
          id: data.session_id,
          title: data.session_title,
          messages: [userMsg, assistantMsg],
          last_message: assistantMsg,
          created_at: new Date().toISOString(),
        });
        loadSessions();
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
      sendMessage();
    }
  };

  return (
    <div className="flex h-full">
      <div className="w-72 border-r border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] flex flex-col">
        <div className="p-4 border-b border-[var(--color-border-default)]">
          <Button onClick={startNewSession} className="w-full" size="sm">
            <Sparkles size={14} className="mr-1.5" />
            Новый чат
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-[var(--color-text-muted)] text-sm">
              Загрузка...
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center text-[var(--color-text-muted)] text-xs">
              Нет чатов
            </div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => loadSession(session.id)}
                className={`w-full text-left px-4 py-3 border-b border-[var(--color-border-default)] transition-colors ${
                  activeSession?.id === session.id
                    ? 'bg-[var(--color-surface-hover)]'
                    : 'hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-[var(--color-accent-primary)] flex-shrink-0" />
                  <span className="text-sm text-[var(--color-text-primary)] truncate">
                    {session.title}
                  </span>
                </div>
                {session.last_message && (
                  <p className="text-xs text-[var(--color-text-muted)] mt-1 ml-6 truncate">
                    {session.last_message.content}
                  </p>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-[var(--color-border-default)] bg-[var(--color-bg-secondary)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-primary flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-sm">AI Карьерный консультант</h3>
              <p className="text-xs text-[var(--color-text-muted)]">Поможет составить резюме и найти работу</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--color-accent-primary)]/10 flex items-center justify-center mb-4">
                <Bot size={28} className="text-[var(--color-accent-primary)]" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">Привет! Я AI-ассистент</h3>
              <p className="text-sm text-[var(--color-text-muted)] max-w-md">
                Я помогу вам составить резюме, найти работу или подготовиться к собеседованию.
                Задайте вопрос или расскажите о себе!
              </p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-[var(--color-accent-primary)]/15 flex items-center justify-center flex-shrink-0">
                    <Bot size={14} className="text-[var(--color-accent-primary)]" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] px-4 py-3 rounded-[16px] text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[var(--color-accent-primary)] text-white rounded-br-[4px]'
                      : 'bg-[var(--color-surface-card)] text-[var(--color-text-primary)] border border-[var(--color-border-default)] rounded-bl-[4px]'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-[var(--color-surface-hover)] flex items-center justify-center flex-shrink-0">
                    <User size={14} className="text-[var(--color-text-muted)]" />
                  </div>
                )}
              </div>
            ))
          )}
          {sending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--color-accent-primary)]/15 flex items-center justify-center">
                <Bot size={14} className="text-[var(--color-accent-primary)]" />
              </div>
              <div className="px-4 py-3 rounded-[16px] bg-[var(--color-surface-card)] border border-[var(--color-border-default)]">
                <Loader2 size={16} className="animate-spin text-[var(--color-accent-primary)]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-[var(--color-border-default)] bg-[var(--color-bg-secondary)]">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Напишите сообщение..."
              className="flex-1 px-4 py-3 rounded-[12px] bg-[var(--color-surface-card)] border border-[var(--color-border-default)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-subtle)] focus:outline-none focus:border-[var(--color-accent-primary)] focus:ring-2 focus:ring-[var(--color-accent-primary-muted)] transition-all"
              disabled={sending}
            />
            <Button onClick={sendMessage} disabled={!input.trim() || sending}>
              <Send size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
