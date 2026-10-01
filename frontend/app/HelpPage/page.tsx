'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Car, Home, Key, Menu, Send, Sparkles } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { useLanguage } from '../components/LanguageProvider';
import NavMenu from '../components/NavMenu';
import ProfileMenu from '../components/ProfileMenu';
import { getApiBaseUrl } from '../../constants/api';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export default function HelpPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = React.useState('');
  const [isChatLoading, setIsChatLoading] = React.useState(false);
  const [chatError, setChatError] = React.useState('');
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chatMessages, isChatLoading]);

  const handleChatSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = chatInput.trim();
    if (!content || isChatLoading) return;

    const nextMessages = [...chatMessages, { role: 'user' as const, content }];
    setChatMessages(nextMessages);
    setChatInput('');
    setChatError('');
    setIsChatLoading(true);

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

      setChatMessages((previous) => [...previous, { role: 'assistant', content: reply }]);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : t('aiChatError'));
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#dfeef0] px-0 py-0 text-[#121212] dark:bg-[#011b1b] dark:text-white">
      <div className="mx-auto flex h-screen w-full max-w-107.5 flex-col overflow-hidden bg-[#dfeef0] shadow-[0_25px_50px_rgba(15,32,35,0.12)] transition-colors duration-300 dark:bg-[#011b1b]">
        <header className="z-10 flex items-center justify-between bg-[#dfeef0] px-5 pt-5 pb-3 dark:bg-[#011b1b]">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setIsMenuOpen(true)}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#121212] transition hover:scale-[1.02] hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
          >
            <Menu className="h-6 w-6" strokeWidth={2.2} />
          </button>
          <h1 className="text-[28px] font-bold tracking-tight text-[#121212] dark:text-white">
            {t('parkShare')}
          </h1>
          <ProfileMenu />
        </header>

        <NavMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

        <main className="flex-1 overflow-y-auto px-4 pt-8 pb-24 text-[#121212] dark:text-white">
          <div className="mx-auto max-w-md">
            <div className="rounded-3xl border border-black/5 bg-white/60 p-5 shadow-lg dark:border-white/10 dark:bg-white/5">
              <h2 className="text-2xl font-bold">{t('helpTitle')}</h2>
              <p className="mt-3 text-sm text-[#42565d] dark:text-[#9db0b6]">{t('helpIntro')}</p>

              <div className="mt-5 space-y-4">
                <article className="rounded-2xl border border-black/10 bg-white/50 p-4 dark:border-white/10 dark:bg-white/5">
                  <h3 className="font-semibold">{t('faq1Title')}</h3>
                  <p className="mt-2 text-sm text-[#42565d] dark:text-[#9db0b6]">{t('faq1Text')}</p>
                </article>

                <article className="rounded-2xl border border-black/10 bg-white/50 p-4 dark:border-white/10 dark:bg-white/5">
                  <h3 className="font-semibold">{t('faq2Title')}</h3>
                  <p className="mt-2 text-sm text-[#42565d] dark:text-[#9db0b6]">{t('faq2Text')}</p>
                </article>

                <article className="rounded-2xl border border-black/10 bg-white/50 p-4 dark:border-white/10 dark:bg-white/5">
                  <h3 className="font-semibold">{t('faq3Title')}</h3>
                  <p className="mt-2 text-sm text-[#42565d] dark:text-[#9db0b6]">{t('faq3Text')}</p>
                </article>
              </div>

              <section className="mt-6 overflow-hidden rounded-2xl border border-[#0f4c81]/15 bg-white/60 shadow-sm dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-3 border-b border-black/5 p-4 dark:border-white/10">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0f4c81]/10 text-[#0f4c81] dark:bg-[#2dd4bf]/10 dark:text-[#2dd4bf]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{t('aiChatTitle')}</h3>
                    <p className="text-xs text-[#42565d] dark:text-[#9db0b6]">{t('aiChatIntro')}</p>
                  </div>
                </div>
                <p className="px-4 pt-3 text-xs leading-5 text-[#6f797d] dark:text-[#9db0b6]">
                  {t('aiChatPrivacy')}
                </p>

                <div
                  className="max-h-80 min-h-36 space-y-3 overflow-y-auto p-4"
                  aria-live="polite"
                  aria-label={t('aiChatTitle')}
                >
                  {chatMessages.length === 0 && (
                    <div className="flex items-start gap-2">
                      <Bot className="mt-1 h-4 w-4 shrink-0 text-[#0f4c81] dark:text-[#2dd4bf]" />
                      <p className="rounded-2xl rounded-tl-sm bg-white/80 px-3 py-2 text-sm text-[#42565d] dark:bg-white/10 dark:text-[#dfeef0]">
                        {t('aiChatGreeting')}
                      </p>
                    </div>
                  )}
                  {chatMessages.map((message, index) => (
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
                  {isChatLoading && (
                    <div className="flex items-start gap-2">
                      <Bot className="mt-1 h-4 w-4 shrink-0 text-[#0f4c81] dark:text-[#2dd4bf]" />
                      <p className="rounded-2xl rounded-tl-sm bg-white/80 px-3 py-2 text-sm text-[#42565d] dark:bg-white/10 dark:text-[#dfeef0]">
                        {t('aiChatThinking')}
                      </p>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {chatError && (
                  <p role="alert" className="px-4 pb-2 text-sm text-red-600 dark:text-red-300">
                    {chatError}
                  </p>
                )}

                <form onSubmit={handleChatSubmit} className="flex items-center gap-2 border-t border-black/5 p-3 dark:border-white/10">
                  <label className="sr-only" htmlFor="help-ai-message">{t('aiChatPlaceholder')}</label>
                  <input
                    id="help-ai-message"
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    maxLength={2000}
                    placeholder={t('aiChatPlaceholder')}
                    className="h-11 min-w-0 flex-1 rounded-xl border border-black/10 bg-white/70 px-3 text-sm text-[#121212] outline-none focus:border-[#0f4c81]/50 focus:ring-2 focus:ring-[#0f4c81]/15 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isChatLoading}
                    aria-label={t('aiChatSend')}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0f4c81] text-white transition hover:bg-[#0d3e68] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#2dd4bf] dark:text-[#011b1b]"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </section>
            </div>
          </div>
        </main>

      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 flex w-screen items-center justify-around border-t border-black/5 bg-[#dfeef0] pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:border-white/10 dark:bg-[#011b1b]">
        <a
          href={ROUTES.RENT}
          onClick={(e) => { e.preventDefault(); router.push(ROUTES.RENT); }}
          className="cursor-pointer rounded-full p-1.5 text-slate-500 transition-all dark:text-slate-400"
        >
          <Key className="h-6 w-6 -rotate-45" strokeWidth={2} />
        </a>

        <a
          href={ROUTES.HOME}
          onClick={(e) => { e.preventDefault(); router.push(ROUTES.HOME); }}
          aria-current="page"
          className="cursor-pointer rounded-full p-1.5 text-slate-500 transition-all dark:text-slate-400"
        >
          <Home className="h-6 w-6" strokeWidth={2} />
        </a>

        <a
          href={ROUTES.MANAGE_CAR}
          onClick={(e) => { e.preventDefault(); router.push(ROUTES.MANAGE_CAR); }}
          className="cursor-pointer rounded-full p-1.5 text-slate-500 transition-all dark:text-slate-400"
        >
          <Car className="h-6 w-6" strokeWidth={2} />
        </a>
      </nav>
    </div>
  );
}
