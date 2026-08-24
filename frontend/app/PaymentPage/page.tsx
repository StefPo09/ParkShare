'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '../../constants/routes';
import {
    X,
    ChevronRight,
    ChevronDown,
    Upload,
    CircleHelp,
    Key,
    Home,
    Car
} from 'lucide-react';

export default function PaymentPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Stări pentru navigare (tab-uri active)
    const [activeTab, setActiveTab] = useState<'key' | 'home' | 'car'>('home');

    // Stări pentru valorile din formular
    const [plate, setPlate] = useState('');
    const [carModel, setCarModel] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [cardType, setCardType] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [securityCode, setSecurityCode] = useState('');

    // Stări pentru fișiere și pop-up-ul de ajutor
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [showHelpModal, setShowHelpModal] = useState(false);

    // Lungimea dinamică pentru CVV/CID în funcție de tipul de card selectat (Amex = 4, restul = 3)
    const maxCvvLength = cardType === 'amex' ? 4 : 3;

    // Formularul este valid doar dacă toate box-urile obligatorii au date introduse corect
    const isFormValid =
        plate.trim() !== '' &&
        carModel !== '' &&
        paymentMethod !== '' &&
        (paymentMethod !== 'card' || cardType !== '') &&
        cardNumber.trim().length >= 19 &&
        expiryDate.trim().length >= 5 &&
        securityCode.trim().length >= maxCvvLength;

    // Funcție pentru formatarea automată a numărului de card (adaugă spațiu la fiecare 4 cifre)
    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const digitsOnly = e.target.value.replace(/\D/g, '');
        const formatted = digitsOnly.replace(/(\d{4})(?=\d)/g, '$1 ');
        setCardNumber(formatted);
    };

    // Funcție pentru formatarea automată a datei de expirare (MM/YY)
    const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const digitsOnly = e.target.value.replace(/\D/g, '');
        let formatted = digitsOnly;
        if (digitsOnly.length > 2) {
            formatted = `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}`;
        }
        setExpiryDate(formatted);
    };

    // Funcție pentru codul de securitate (doar cifre)
    const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const digitsOnly = e.target.value.replace(/\D/g, '');
        setSecurityCode(digitsOnly);
    };

    // Resetează tipul de card și codul dacă se schimbă metoda principală de plată
    const handlePaymentMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPaymentMethod(e.target.value);
        setCardType('');
        setSecurityCode('');
    };

    // La schimbarea tipului de card, curățăm codul de securitate anterior pentru a evita conflictele de lungime
    const handleCardTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCardType(e.target.value);
        setSecurityCode('');
    };

    // Declanșează selectorul nativ de fișiere la click pe butonul de upload
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    // Salvează fișierul selectat în starea aplicației
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploadedFile(e.target.files[0]);
        }
    };

    // Elimină fișierul încărcat
    const handleRemoveFile = () => {
        setUploadedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Simulează completarea automată la apăsarea butonului "Use own car"
    const handleUseOwnCar = () => {
        setPlate('B 123 ABC');
        setCarModel('sedan');
    };

    return (
        <div className="min-h-screen bg-[#dfeef0] px-0 py-0 dark:bg-[#011b1b] relative">
            <div className="mx-auto flex h-screen w-full max-w-107.5 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),transparent_48%)] bg-[#dfeef0] text-[#121212] shadow-[0_25px_50px_rgba(15,32,35,0.12)] transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_36%)] dark:bg-[#011b1b] dark:text-white">

                {/* --- Header --- */}
                <header className="flex items-center justify-between px-5 pt-5">
                    <div className="flex-1 text-center">
                        <h1 className="text-[28px] font-bold tracking-tight text-[#121212] dark:text-white">
                            Rent parking spot
                        </h1>
                    </div>
                    <button
                        aria-label="Close"
                        onClick={() => router.push(ROUTES.MANAGE_CAR)}
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#121212] transition hover:scale-[1.02] hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
                    >
                        <X className="h-7 w-7" strokeWidth={2.2} />
                    </button>
                </header>

                {/* Info Text Sub Header */}
                <div className="px-6 pt-2 text-center">
                    <p className="text-xs font-medium text-[#42565d] dark:text-[#d6e7ea]">
                        Renting spot at: Parking spot address
                    </p>
                    <button className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#0f4c81] dark:text-[#2dd4bf] hover:underline cursor-pointer">
                        View details
                        <ChevronRight className="w-3 h-3" />
                    </button>
                </div>

                {/* --- Zona de conținut --- */}
                <main className="flex-1 px-4 pt-4 overflow-y-auto space-y-4 pb-24">

                    {/* --- SECȚIUNEA 1: CAR INFO --- */}
                    <div className="space-y-4 px-2">
                        <h3 className="text-[13px] font-bold uppercase tracking-[0.15em] text-[#114B43] dark:text-[#2dd4bf] pl-1">
                            Car info:
                        </h3>

                        {/* Input Număr Înmatriculare */}
                        <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                            <label htmlFor="car-plate" className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                                Registration plate
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

                        {/* Select Model Mașină */}
                        <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                            <label htmlFor="car-model" className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                                Car model
                            </label>
                            <div className="relative w-full">
                                <select
                                    id="car-model"
                                    value={carModel}
                                    onChange={(e) => setCarModel(e.target.value)}
                                    className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-[18px] font-medium text-[#121212] outline-none appearance-none cursor-pointer dark:border-white/10 dark:bg-white/5 dark:text-white"
                                >
                                    <option value="" disabled hidden className="bg-white dark:bg-[#022525] text-slate-500">Car model...</option>
                                    <option value="sedan" className="bg-white dark:bg-[#022525] text-slate-900 dark:text-white">Sedan</option>
                                    <option value="suv" className="bg-white dark:bg-[#022525] text-slate-900 dark:text-white">SUV</option>
                                    <option value="hatchback" className="bg-white dark:bg-[#022525] text-slate-900 dark:text-white">Hatchback</option>
                                </select>
                                <ChevronDown className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-[#42565d] dark:text-[#9db0b6] pointer-events-none" />
                            </div>
                        </div>

                        {/* Documente Legale */}
                        <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                            <div className="mb-2 flex items-center justify-between gap-2">
                                <label className="text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                                    Legal documents
                                </label>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowHelpModal(true)}
                                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#1f2937]/15 bg-white/40 text-[#42565d] shadow-sm transition hover:-translate-y-0.5 hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:text-[#d6e7ea] dark:hover:bg-white/10"
                                    >
                                        <CircleHelp className="h-4 w-4" strokeWidth={2.2} />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleUploadClick}
                                        className="flex h-8 items-center gap-1.5 rounded-full border border-[#1f2937]/15 bg-white/40 px-3 text-[14px] text-[#1f2937] shadow-sm cursor-pointer transition hover:-translate-y-0.5 hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                                    >
                                        <Upload className="h-3.5 w-3.5" strokeWidth={2.2} />
                                        <span>Upload PDF</span>
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

                            <div className="flex min-h-12.5 items-center justify-between gap-2 rounded-xl border border-[#111827]/15 bg-white/50 px-3 py-2 text-[18px] text-[#121212] shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white">
                                {uploadedFile ? (
                                    <>
                                        <span className="truncate pr-2 font-medium">{uploadedFile.name}</span>
                                        <button
                                            type="button"
                                            onClick={handleRemoveFile}
                                            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-red-500/10 text-red-500 transition hover:bg-red-500 hover:text-white active:scale-95"
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

                    {/* --- SECȚIUNEA 2: PAYMENT INFO --- */}
                    <div className="space-y-4 px-2 pt-2">
                        <h3 className="text-[13px] font-bold uppercase tracking-[0.15em] text-[#114B43] dark:text-[#2dd4bf] pl-1">
                            Payment info:
                        </h3>

                        {/* Select Metodă Platâ */}
                        <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                            <label htmlFor="payment-method" className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                                Payment Method
                            </label>
                            <div className="relative w-full">
                                <select
                                    id="payment-method"
                                    value={paymentMethod}
                                    onChange={handlePaymentMethodChange}
                                    className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-[18px] font-medium text-[#121212] outline-none appearance-none cursor-pointer dark:border-white/10 dark:bg-white/5 dark:text-white"
                                >
                                    <option value="" disabled hidden className="bg-white dark:bg-[#022525] text-slate-500">Choose payment method...</option>
                                    <option value="card" className="bg-white dark:bg-[#022525] text-slate-900 dark:text-white">Credit Card</option>
                                </select>
                                <ChevronDown className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-[#42565d] dark:text-[#9db0b6] pointer-events-none" />
                            </div>
                        </div>

                        {/* Select Tip Card (Apare dinamic) */}
                        {paymentMethod === 'card' && (
                            <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5 animate-fade-in">
                                <label htmlFor="card-type" className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                                    Card Type
                                </label>
                                <div className="relative w-full">
                                    <select
                                        id="card-type"
                                        value={cardType}
                                        onChange={handleCardTypeChange}
                                        className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-[18px] font-medium text-[#121212] outline-none appearance-none cursor-pointer dark:border-white/10 dark:bg-white/5 dark:text-white"
                                    >
                                        <option value="" disabled hidden className="bg-white dark:bg-[#022525] text-slate-500">Card type...</option>
                                        <option value="visa" className="bg-white dark:bg-[#022525] text-slate-900 dark:text-white">Visa</option>
                                        <option value="mastercard" className="bg-white dark:bg-[#022525] text-slate-900 dark:text-white">Mastercard</option>
                                        <option value="amex" className="bg-white dark:bg-[#022525] text-slate-900 dark:text-white">American Express (Amex)</option>
                                        <option value="discover" className="bg-white dark:bg-[#022525] text-slate-900 dark:text-white">Discover</option>
                                    </select>
                                    <ChevronDown className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-[#42565d] dark:text-[#9db0b6] pointer-events-none" />
                                </div>
                            </div>
                        )}

                        {/* Input Număr Card */}
                        <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                            <label htmlFor="card-number" className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                                Card Number
                            </label>
                            <input
                                id="card-number"
                                type="text"
                                placeholder="0000 0000 0000 0000"
                                value={cardNumber}
                                onChange={handleCardNumberChange}
                                maxLength={19}
                                className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-[18px] font-medium text-[#121212] outline-none placeholder:text-[#6f797d] dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-[#9db0b6]"
                            />
                        </div>

                        {/* Câmpurile Expirare & CVV */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                                <label htmlFor="expiry-date" className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                                    Expiry Date
                                </label>
                                <input
                                    id="expiry-date"
                                    type="text"
                                    placeholder="MM/YY"
                                    value={expiryDate}
                                    onChange={handleExpiryChange}
                                    maxLength={5}
                                    className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-[18px] font-medium text-[#121212] outline-none placeholder:text-[#6f797d] dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-[#9db0b6]"
                                />
                            </div>

                            <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                                <label htmlFor="security-code" className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                                    {cardType === 'amex' ? "CID" : "CVC/CVV"}
                                </label>
                                <input
                                    id="security-code"
                                    type="text"
                                    placeholder={cardType === 'amex' ? "1234" : "123"}
                                    value={securityCode}
                                    onChange={handleCvvChange}
                                    maxLength={maxCvvLength}
                                    className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-[18px] font-medium text-[#121212] outline-none placeholder:text-[#6f797d] dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-[#9db0b6]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* --- Butonul Principal de Acțiune --- */}
                    <div className="px-2 pt-4">
                        <button
                            type="button"
                            disabled={!isFormValid}
                            onClick={() => {
                                if (isFormValid) alert('Purchase Confirmed!');
                            }}
                            className="flex w-full cursor-pointer items-center justify-center rounded-2xl bg-[#0f4c81] px-5 py-3.5 text-base font-semibold text-white shadow-[0_16px_28px_rgba(15,76,129,0.28)] transition hover:bg-[#0c3e67] disabled:cursor-not-allowed disabled:bg-[#0f4c81]/45 disabled:shadow-none"
                        >
                            Confirm purchase
                        </button>
                    </div>
                </main>

                {/* --- Bottom Navigation Bar --- */}
                <nav className="absolute bottom-0 left-0 right-0 flex justify-around items-center py-4 bg-[#dfeef0] dark:bg-[#011b1b] border-t border-black/5 dark:border-white/10 z-30">
                    <button
                        onClick={() => setActiveTab('key')}
                        className={`p-1.5 transition-all cursor-pointer rounded-full ${
                            activeTab === 'key' ? 'text-[#0f4c81] dark:text-[#2dd4bf] scale-110' : 'text-slate-500 dark:text-slate-400'
                        }`}
                    >
                        <Key className="w-6 h-6 transform -rotate-45" strokeWidth={activeTab === 'key' ? 2.5 : 2} />
                    </button>

                    <button
                        onClick={() => setActiveTab('home')}
                        className={`p-1.5 transition-all cursor-pointer rounded-full ${
                            activeTab === 'home' ? 'text-[#0f4c81] dark:text-[#2dd4bf] scale-110' : 'text-slate-500 dark:text-slate-400'
                        }`}
                    >
                        <Home className="w-6 h-6" strokeWidth={activeTab === 'home' ? 2.5 : 2} />
                    </button>

                    <button
                        onClick={() => setActiveTab('car')}
                        className={`p-1.5 transition-all cursor-pointer rounded-full ${
                            activeTab === 'car' ? 'text-[#0f4c81] dark:text-[#2dd4bf] scale-110' : 'text-slate-500 dark:text-slate-400'
                        }`}
                    >
                        <Car className="w-6 h-6" strokeWidth={activeTab === 'car' ? 2.5 : 2} />
                    </button>
                </nav>

            </div>

            {/* --- Pop-up / Modal de ajutor --- */}
            {showHelpModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                    <div className="relative w-full max-w-85 rounded-3xl bg-white/90 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/40 transition-colors duration-300 dark:bg-[#022525]/90 dark:border-white/5 text-center">
                        <button
                            type="button"
                            onClick={() => setShowHelpModal(false)}
                            className="absolute right-4 top-4 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-black/5 text-[#121212] hover:bg-black/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 transition"
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