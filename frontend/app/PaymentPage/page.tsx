'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Elements } from '@stripe/react-stripe-js';
import type { Appearance } from '@stripe/stripe-js';
import { stripePromise } from '../../lib/stripe';
import { CheckoutForm } from '../components/StripePayment';
import { ROUTES } from '../../constants/routes';
import { useLanguage } from '../components/LanguageProvider';
import {
    X, ChevronRight, ChevronDown, Upload, CircleHelp, Key, Home, Car
} from 'lucide-react';

export default function PaymentPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState<'key' | 'home' | 'car'>('home');

    const [plate, setPlate] = useState('');
    const [carModel, setCarModel] = useState('');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [showHelpModal, setShowHelpModal] = useState(false);

    const [clientSecret, setClientSecret] = useState<string | null>(null);

    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const isDark = mounted && resolvedTheme === 'dark';

    useEffect(() => {
        fetch('/api/create-payment-intent', { method: 'POST' })
            .then((res) => res.json())
            .then((data) => setClientSecret(data.clientSecret))
            .catch((err) => console.error('Failed to create payment intent:', err));
    }, []);

    const isCarInfoValid = plate.trim() !== '' && carModel !== '';

    const handleUploadClick = () => fileInputRef.current?.click();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) setUploadedFile(e.target.files[0]);
    };

    const handleRemoveFile = () => {
        setUploadedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleUseOwnCar = () => {
        setPlate('B 123 ABC');
        setCarModel('sedan');
    };

    const handlePaymentSuccess = () => {
        router.push(ROUTES.SUCCESS_PAYMENT);
    };

    const appearance: Appearance = {
        theme: isDark ? 'night' : 'stripe',
        variables: {
            colorPrimary: isDark ? '#2dd4bf' : '#0f4c81',
            colorBackground: isDark ? '#011b1b' : '#dfeef0',
            colorText: isDark ? '#ffffff' : '#121212',
            colorTextSecondary: isDark ? '#ffffff' : '#42565d',
            colorTextPlaceholder: isDark ? '#9db0b6' : '#6f797d',
            colorDanger: '#ef4444',
            fontFamily: '"Your-App-Font", system-ui, sans-serif',
            fontSizeBase: '18px',
            fontWeightNormal: '500',
            spacingUnit: '4px',
            borderRadius: '12px',
        },
        rules: {
            '.Input': {
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)',
                boxShadow: 'none',
                padding: '10px 12px',
            },
            '.Input:focus': {
                border: `1px solid ${isDark ? '#2dd4bf' : '#0f4c81'}`,
                boxShadow: `0 0 0 1px ${isDark ? '#2dd4bf' : '#0f4c81'}`,
            },
            '.Label': {
                fontSize: '12px',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: '4px',
                color: isDark ? '#ffffff' : undefined,
            },
            '.Tab': {
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                borderRadius: '12px',
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)',
            },
            '.Tab--selected': {
                border: `1px solid ${isDark ? '#2dd4bf' : '#0f4c81'}`,
                backgroundColor: isDark ? 'rgba(45,212,191,0.08)' : 'rgba(15,76,129,0.05)',
            },
            '.TabLabel': {
                color: isDark ? '#ffffff' : undefined,
            },
        },
    };

    if (!mounted) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#dfeef0] px-0 py-0 dark:bg-[#011b1b] relative">
            <div className="mx-auto flex h-screen w-full max-w-107.5 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),transparent_48%)] bg-[#dfeef0] text-[#121212] shadow-[0_25px_50px_rgba(15,32,35,0.12)] transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_36%)] dark:bg-[#011b1b] dark:text-white">

                <header className="flex items-center justify-between px-5 pt-5">
                    <div className="flex-1 text-center">
                        <h1 className="text-[28px] font-bold tracking-tight text-[#121212] dark:text-white">
                            {t('rentParkingSpot')}
                        </h1>
                    </div>
                    <button
                        aria-label="Close"
                        onClick={() => router.push(ROUTES.RENT)}
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#121212] transition hover:scale-[1.02] hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
                    >
                        <X className="h-7 w-7" strokeWidth={2.2} />
                    </button>
                </header>

                <div className="px-6 pt-2 text-center">
                    <p className="text-xs font-medium text-[#42565d] dark:text-[#d6e7ea]">
                        {t('rentingSpotAt')} Parking spot address
                    </p>
                    <button className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#0f4c81] dark:text-[#2dd4bf] hover:underline cursor-pointer">
                        {t('viewDetails')}
                        <ChevronRight className="w-3 h-3" />
                    </button>
                </div>

                <main className="flex-1 px-4 pt-4 overflow-y-auto space-y-4 pb-24">

                    <div className="space-y-4 px-2">
                        <h3 className="text-[13px] font-bold uppercase tracking-[0.15em] text-[#114B43] dark:text-[#2dd4bf] pl-1">
                            {t('carInfo')}
                        </h3>

                        <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                            <label htmlFor="car-plate" className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                                {t('registrationPlate')}
                            </label>
                            <input
                                id="car-plate"
                                type="text"
                                value={plate}
                                onChange={(e) => setPlate(e.target.value)}
                                placeholder="B 123 ABC"
                                className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-[18px] font-medium text-[#121212] outline-none placeholder:text-[#6f797d] dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-[#9db0b6]"
                            />
                        </div>

                        <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                            <label htmlFor="car-model" className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                                {t('carModel')}
                            </label>
                            <div className="relative w-full">
                                <select
                                    id="car-model"
                                    value={carModel}
                                    onChange={(e) => setCarModel(e.target.value)}
                                    className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-[18px] font-medium text-[#121212] outline-none appearance-none cursor-pointer dark:border-white/10 dark:bg-white/5 dark:text-white"
                                >
                                    <option value="" disabled hidden>{t('carModel')}...</option>
                                    <option value="sedan">Sedan</option>
                                    <option value="suv">SUV</option>
                                    <option value="hatchback">Hatchback</option>
                                </select>
                                <ChevronDown className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-[#42565d] dark:text-[#9db0b6] pointer-events-none" />
                            </div>
                        </div>

                        <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                            <div className="mb-2 flex items-center justify-between gap-2">
                                <label className="text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                                    {t('legalDocuments')}
                                </label>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowHelpModal(true)}
                                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#1f2937]/15 bg-white/40 text-[#42565d] shadow-sm transition hover:bg-white/60 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                                    >
                                        <CircleHelp className="h-4 w-4" strokeWidth={2.2} />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleUploadClick}
                                        className="flex h-8 items-center gap-1.5 rounded-full border border-[#1f2937]/15 bg-white/40 px-3 text-[14px] text-[#1f2937] shadow-sm cursor-pointer transition hover:-translate-y-0.5 hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                                    >
                                        <Upload className="h-3.5 w-3.5" strokeWidth={2.2} />
                                        <span>{t('uploadPdf')}</span>
                                    </button>
                                </div>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,application/pdf"
                                className="hidden"
                                onChange={handleFileChange}
                            />

                            <div className="flex min-h-12.5 items-center justify-between gap-2 rounded-xl border border-[#111827]/15 bg-white/50 px-3 py-2 text-[18px] text-[#121212] shadow-sm dark:border-white/5 dark:bg-white/5 dark:text-white">
                                {uploadedFile ? (
                                    <>
                                        <span className="truncate pr-2 font-medium">{uploadedFile.name}</span>
                                        <button
                                            type="button"
                                            onClick={handleRemoveFile}
                                            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-red-500/10 text-red-500 transition hover:bg-red-500 hover:text-white"
                                        >
                                            <X className="h-4 w-4" strokeWidth={2.5} />
                                        </button>
                                    </>
                                ) : (
                                    <span className="truncate text-[#6f797d] dark:text-[#9db0b6]">Select PDF document</span>
                                )}
                            </div>

                            <div className="mt-3 pl-1">
                                <button
                                    type="button"
                                    onClick={handleUseOwnCar}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0f4c81] dark:text-[#2dd4bf] hover:underline cursor-pointer"
                                >
                                    Use own car
                                    <ChevronRight className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 px-2 pt-2">
                        <h3 className="text-[13px] font-bold uppercase tracking-[0.15em] text-[#114B43] dark:text-[#2dd4bf] pl-1">
                            Payment info:
                        </h3>

                        {clientSecret ? (
                            <Elements
                                stripe={stripePromise}
                                options={{ clientSecret, appearance }}
                            >
                                <CheckoutForm
                                    disabled={!isCarInfoValid}
                                    onSuccess={handlePaymentSuccess}
                                />
                            </Elements>
                        ) : (
                            <p className="text-sm text-[#42565d] dark:text-[#d6e7ea]">
                                Loading payment form…
                            </p>
                        )}
                    </div>
                </main>

                <nav className="absolute bottom-0 left-0 right-0 flex justify-around items-center py-4 bg-[#dfeef0] dark:bg-[#011b1b] border-t border-black/5 dark:border-white/10 z-30">
                    <button onClick={() => setActiveTab('key')} className={`p-1.5 transition-all cursor-pointer rounded-full ${activeTab === 'key' ? 'text-[#0f4c81] dark:text-[#2dd4bf] scale-110' : 'text-slate-500 dark:text-slate-400'}`}>
                        <Key className="w-6 h-6 transform -rotate-45" strokeWidth={activeTab === 'key' ? 2.5 : 2} />
                    </button>

                    <button onClick={() => setActiveTab('home')} className={`p-1.5 transition-all cursor-pointer rounded-full ${activeTab === 'home' ? 'text-[#0f4c81] dark:text-[#2dd4bf] scale-110' : 'text-slate-500 dark:text-slate-400'}`}>
                        <Home className="w-6 h-6" strokeWidth={activeTab === 'home' ? 2.5 : 2} />
                    </button>

                    <button onClick={() => setActiveTab('car')} className={`p-1.5 transition-all cursor-pointer rounded-full ${activeTab === 'car' ? 'text-[#0f4c81] dark:text-[#2dd4bf] scale-110' : 'text-slate-500 dark:text-slate-400'}`}>
                        <Car className="w-6 h-6" strokeWidth={activeTab === 'car' ? 2.5 : 2} />
                    </button>
                </nav>

            </div>

            {showHelpModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                    <div className="relative w-full max-w-85 rounded-3xl bg-white/90 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/40 transition-colors duration-300 dark:bg-[#022525]/90 dark:border-white/5 text-center">
                        <button
                            type="button"
                            onClick={() => setShowHelpModal(false)}
                            className="absolute right-4 top-4 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-black/5 text-[#121212] hover:bg-black/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                            aria-label="Close info"
                        >
                            <X className="h-4 w-4" strokeWidth={2.5} />
                        </button>

                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#0f4c81]/10 text-[#0f4c81] dark:bg-white/10 dark:text-white mt-2">
                            <CircleHelp className="h-6 w-6" strokeWidth={2.2} />
                        </div>

                        <h3 className="mt-4 text-xl font-bold tracking-tight text-[#121212] dark:text-white">
                            Legal Documents
                        </h3>
                        <p className="mt-3 text-sm leading-relaxed text-[#404b51] dark:text-slate-300">
                            Please upload the official registration document or certificate of your car. The file must be in <strong>PDF format</strong> and should be clearly legible.
                        </p>

                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={() => setShowHelpModal(false)}
                                className="w-full py-3 px-4 cursor-pointer rounded-2xl bg-[#0f4c81] text-white text-sm font-bold shadow-md hover:bg-[#0c3e67] transition active:scale-[0.98]"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
