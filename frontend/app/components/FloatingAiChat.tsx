'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Bot, X } from 'lucide-react';
import { useLanguage } from './LanguageProvider';
import AiChatConversation from './AiChatConversation';
import { ROUTES } from '../../constants/routes';

export default function FloatingAiChat() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = React.useState(false);
  const chatRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !chatRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isOpen]);

  if (pathname === ROUTES.AI_CHAT) return null;

  return (
    <div ref={chatRef} className="pointer-events-none fixed inset-x-0 bottom-0 z-[60]">
      <section
        role="dialog"
        aria-label={t('aiChatTitle')}
        className={`${isOpen ? 'flex' : 'hidden'} pointer-events-auto absolute bottom-[calc(6.5rem+env(safe-area-inset-bottom))] right-4 h-[min(34rem,calc(100dvh-9rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-black/10 bg-[#dfeef0] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.28)] dark:border-white/10 dark:bg-[#011b1b] sm:right-6`}
      >
        <div className="flex items-center justify-between px-2 pb-2 pt-1">
          <span className="text-sm font-semibold text-[#121212] dark:text-white">{t('aiChatTitle')}</span>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label={t('close')}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#42565d] transition hover:bg-black/5 dark:text-[#dfeef0] dark:hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <AiChatConversation compact />
      </section>

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? t('close') : t('aiChatTitle')}
        aria-expanded={isOpen}
        className="pointer-events-auto absolute bottom-[calc(5.75rem+env(safe-area-inset-bottom))] right-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#0f4c81] text-white shadow-lg transition hover:scale-105 hover:bg-[#0d3e68] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0f4c81]/30 dark:bg-[#2dd4bf] dark:text-[#011b1b] dark:hover:bg-[#5be0cf] sm:right-6"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-7 w-7" />}
      </button>
    </div>
  );
}
