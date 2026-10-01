'use client';

import React from 'react';
import { Bot, Send } from 'lucide-react';
import { useLanguage } from './LanguageProvider';
import { getApiBaseUrl } from '../../constants/api';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export default function AiChatConversation({
  compact = false,
  fullHeight = false,
}: {
  compact?: boolean;
  fullHeight?: boolean;
}) {
  const { t } = useLanguage();
  const inputId = React.useId();
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = input.trim();
    if (!content || isLoading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content }];
    setMessages(nextMessages);
    setInput('');
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ messages: nextMessages.slice(-12) }),
      });
      const data: { reply?: string; error?: string } = await response.json();
      if (!response.ok) throw new Error(data.error || t('aiChatError'));
      const reply = data.reply?.trim();
      if (!reply) throw new Error(t('aiChatError'));

      setMessages((current) => [...current, { role: 'assistant', content: reply }]);
    } catch (chatError) {
      setError(chatError instanceof Error ? chatError.message : t('aiChatError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#0f4c81]/15 bg-white/70 shadow-sm dark:border-white/10 dark:bg-[#062727] ${compact || fullHeight ? 'flex-1' : 'h-[min(65vh,34rem)]'} ${fullHeight ? 'w-full rounded-2xl sm:rounded-3xl' : ''}`}>
      <div className="flex items-center gap-3 border-b border-black/5 p-4 dark:border-white/10">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0f4c81]/10 text-[#0f4c81] dark:bg-[#2dd4bf]/10 dark:text-[#2dd4bf]">
          <Bot className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold">{t('aiChatTitle')}</h2>
          <p className="text-xs text-[#42565d] dark:text-[#9db0b6]">{t('aiChatIntro')}</p>
        </div>
      </div>

      <p className="border-b border-black/5 px-4 py-2 text-xs leading-5 text-[#6f797d] dark:border-white/10 dark:text-[#9db0b6]">
        {t('aiChatPrivacy')}
      </p>

      <div
        className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4"
        aria-live="polite"
        aria-label={t('aiChatTitle')}
      >
        {messages.length === 0 && (
          <div className="flex items-start gap-2">
            <Bot className="mt-1 h-4 w-4 shrink-0 text-[#0f4c81] dark:text-[#2dd4bf]" />
            <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-white/80 px-3 py-2 text-sm text-[#42565d] dark:bg-white/10 dark:text-[#dfeef0]">
              {t('aiChatGreeting')}
            </p>
          </div>
        )}
        {messages.map((message, index) => (
          <div
            key={`${index}-${message.role}`}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'items-start gap-2'}`}
          >
            {message.role === 'assistant' && (
              <Bot className="mt-1 h-4 w-4 shrink-0 text-[#0f4c81] dark:text-[#2dd4bf]" />
            )}
            <p
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                message.role === 'user'
                  ? 'rounded-br-sm bg-[#0f4c81] text-white'
                  : 'rounded-tl-sm bg-white/80 text-[#42565d] dark:bg-white/10 dark:text-[#dfeef0]'
              }`}
            >
              {message.content}
            </p>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-2">
            <Bot className="mt-1 h-4 w-4 shrink-0 text-[#0f4c81] dark:text-[#2dd4bf]" />
            <p className="rounded-2xl rounded-tl-sm bg-white/80 px-3 py-2 text-sm text-[#42565d] dark:bg-white/10 dark:text-[#dfeef0]">
              {t('aiChatThinking')}
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <p role="alert" className="px-4 pb-2 text-sm text-red-600 dark:text-red-300">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex shrink-0 items-center gap-2 border-t border-black/5 p-3 dark:border-white/10">
        <label className="sr-only" htmlFor={inputId}>
          {t('aiChatPlaceholder')}
        </label>
        <input
          id={inputId}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          maxLength={2000}
          placeholder={t('aiChatPlaceholder')}
          className="h-11 min-w-0 flex-1 rounded-xl border border-black/10 bg-white/70 px-3 text-sm text-[#121212] outline-none focus:border-[#0f4c81]/50 focus:ring-2 focus:ring-[#0f4c81]/15 dark:border-white/10 dark:bg-white/5 dark:text-white"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          aria-label={t('aiChatSend')}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0f4c81] text-white transition hover:bg-[#0d3e68] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#2dd4bf] dark:text-[#011b1b]"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </section>
  );
}
