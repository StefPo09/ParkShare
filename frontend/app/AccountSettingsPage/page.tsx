'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '../../constants/routes';
import {
  Camera,
  Car,
  ChevronRight,
  Globe,
  Home,
  Key,
  Lock,
  Mail,
  MapPin,
  PencilLine,
  Phone,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';

const initialProfile = {
  email: 'johndoe@gmail.com',
  phone: '+1 (555) 123-4567',
  country: 'United States',
  city: 'Boston',
  firstName: 'John',
  lastName: 'Doe',
  password: '••••••••••',
};

type InfoRowProps = {
  label: string;
  value: string;
  Icon: typeof Mail;
  accent?: string;
};

function InfoRow({ label, value, Icon, accent = 'text-[#0f4c81]' }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-black/5 bg-white/20 px-3 py-3 shadow-[0_1px_0_rgba(0,0,0,0.02)] backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
      <div className="flex min-w-0 items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf3f7] ${accent} dark:bg-[#062a2d]`}>
          <Icon className="h-4 w-4" strokeWidth={2.2} />
        </div>

        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#42565d] dark:text-[#dfeef0]/75">
            {label}
          </p>
          <p className="truncate text-[16px] font-semibold text-[#121212] dark:text-white">{value}</p>
        </div>
      </div>

      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-full border border-[#0f4c81]/20 bg-[#0f4c81]/5 px-2.5 py-1.5 text-[12px] font-semibold text-[#0f4c81] transition hover:bg-[#0f4c81]/10 dark:border-[#7dd3fc]/30 dark:bg-[#7dd3fc]/10 dark:text-[#dff7ff]"
      >
        <PencilLine className="h-3.5 w-3.5" strokeWidth={2.3} />
        Change
      </button>
    </div>
  );
}

export default function AccountSettingsPage() {
  const router = useRouter();
  const [profile] = useState(initialProfile);
  const [activeTab, setActiveTab] = useState<'key' | 'home' | 'car'>('home');

  return (
    <div className="relative min-h-screen bg-[#dfeef0] px-0 py-0 text-[#121212] dark:bg-[#011b1b] dark:text-white">
      <div className="mx-auto flex h-screen w-full max-w-107.5 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),transparent_48%)] bg-[#dfeef0] text-[#121212] shadow-[0_25px_50px_rgba(15,32,35,0.12)] transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_36%)] dark:bg-[#011b1b] dark:text-white">
        <header className="flex items-center justify-between px-5 pt-5">
          <div className="flex-1 text-center">
            <h1 className="text-[28px] font-bold tracking-tight text-[#121212] dark:text-white">
              Account Settings
            </h1>
          </div>
          <button
            aria-label="Close"
            onClick={() => router.back()}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#121212] transition hover:scale-[1.02] hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
          >
            <X className="h-7 w-7" strokeWidth={2.2} />
          </button>
        </header>

        <main className="flex-1 space-y-4 overflow-y-auto px-4 pb-28 pt-6 no-scrollbar">
          <div className="rounded-[22px] border border-black/5 bg-white/20 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#0f4c81] via-[#3d7cb3] to-[#9ad7db] text-lg font-bold tracking-[0.1em] text-white shadow-lg shadow-[#0f4c81]/20">
                  JD
                </div>
                <button
                  type="button"
                  aria-label="Change profile picture"
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-white bg-[#0f4c81] text-white shadow-md transition hover:scale-105 dark:border-[#011b1b]"
                >
                  <Camera className="h-4 w-4" strokeWidth={2.2} />
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[22px] font-bold text-[#121212] dark:text-white">
                  {profile.firstName} {profile.lastName}
                </p>
                <p className="text-[13px] font-medium text-[#42565d] dark:text-[#dfeef0]/70">
                  Personal details
                </p>
              </div>

              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/60 px-2.5 py-1.5 text-[12px] font-semibold text-[#121212] transition hover:bg-white/80 dark:border-white/10 dark:bg-white/10 dark:text-white"
              >
                <Camera className="h-3.5 w-3.5" strokeWidth={2.2} />
                Change
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            <InfoRow label="Email" value={profile.email} Icon={Mail} />
            <InfoRow label="Phone" value={profile.phone} Icon={Phone} />
            <InfoRow label="Country" value={profile.country} Icon={Globe} />
            <InfoRow label="City" value={profile.city} Icon={MapPin} />
            <InfoRow label="First name" value={profile.firstName} Icon={UserRound} />
            <InfoRow label="Last name" value={profile.lastName} Icon={UserRound} />
            <InfoRow label="Password" value={profile.password} Icon={Lock} />
          </div>

          <div className="rounded-[22px] border border-black/5 bg-white/20 p-3 dark:border-white/10 dark:bg-white/5">
            <div className="mb-2 flex items-center gap-2 px-1">
              <ShieldCheck className="h-5 w-5 text-[#0f4c81] dark:text-[#7dd3fc]" strokeWidth={2.2} />
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#42565d] dark:text-[#dfeef0]">
                Security
              </p>
            </div>

            <button
              type="button"
              className="group flex w-full items-center justify-between rounded-2xl border border-black/10 bg-white/50 px-3 py-3 text-left transition hover:bg-white/70 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf3f7] text-[#0f4c81] dark:bg-[#062a2d] dark:text-[#7dd3fc]">
                  <Lock className="h-4 w-4" strokeWidth={2.2} />
                </div>
                <div>
                  <p className="text-[16px] font-semibold text-[#121212] dark:text-white">Password</p>
                  <p className="text-[12px] text-[#42565d] dark:text-[#dfeef0]/70">Update your login password</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:text-[#0f4c81] dark:group-hover:text-[#7dd3fc]" />
            </button>
          </div>

          <button
            type="button"
            className="w-full rounded-2xl bg-[#0f4c81] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,76,129,0.24)] transition active:scale-[0.99]"
          >
            Save changes
          </button>
        </main>

        <nav className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-black/5 bg-[#dfeef0] py-4 dark:border-white/10 dark:bg-[#011b1b]">
          <button
            type="button"
            onClick={() => {
              setActiveTab('key');
              router.push(ROUTES.RENT);
            }}
            className={`cursor-pointer rounded-full p-1.5 transition-all ${
              activeTab === 'key' ? 'scale-110 text-[#0f4c81] dark:text-[#7dd3fc]' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Key className="h-6 w-6 -rotate-45" strokeWidth={activeTab === 'key' ? 2.5 : 2} />
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('home');
              router.push(ROUTES.HOME);
            }}
            className={`cursor-pointer rounded-full p-1.5 transition-all ${
              activeTab === 'home' ? 'scale-110 text-[#0f4c81] dark:text-[#7dd3fc]' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Home className="h-6 w-6" strokeWidth={activeTab === 'home' ? 2.5 : 2} />
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('car');
              router.push(ROUTES.MANAGE_CAR);
            }}
            className={`cursor-pointer rounded-full p-1.5 transition-all ${
              activeTab === 'car' ? 'scale-110 text-[#0f4c81] dark:text-[#7dd3fc]' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Car className="h-6 w-6" strokeWidth={activeTab === 'car' ? 2.5 : 2} />
          </button>
        </nav>
      </div>
    </div>
  );
}
