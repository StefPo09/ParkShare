'use client';

import React, { useState, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '../../constants/routes';
import {
    X,
    Upload,
    CircleHelp,
    Key,
    Home,
    Car,
    Pencil,
    Search,
    Check,
    ChevronDown
} from 'lucide-react';

export default function EditSpotPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const documentInputRef = useRef<HTMLInputElement>(null);

    // Default parking spot image from public placeholder or uploaded state
    const [spotImage, setSpotImage] = useState<string | null>(
        'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=600&q=80'
    );

    const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [editingField, setEditingField] = useState<string | null>(null);

    // Spot specifications state
    const [values, setValues] = useState({
        name: 'Custom spot name',
        address: 'Parking spot address',
        timeAvailable: '14:00 - 18:00',
        extraInfo: 'None',
        rentalPrice: '4$/h',
        sellingInfo: 'Not for sale',
        document: 'ParkDoc3.pdf',
    });

    // Active bottom navigation tab
    const [activeTab, setActiveTab] = useState<'key' | 'home' | 'car'>('car');

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const objectUrl = URL.createObjectURL(file);
        setSpotImage(objectUrl);
        setIsPhotoModalOpen(false);
    };

    const handlePhotoAreaClick = () => {
        setIsPhotoModalOpen(true);
    };

    const handleDeletePhoto = () => {
        setSpotImage(null);
        setIsPhotoModalOpen(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDocumentFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        if (!isPdf) {
            window.alert('Please upload a PDF file.');
            event.target.value = '';
            return;
        }

        setValues((current) => ({ ...current, document: file.name }));
    };

    const updateValue = (key: keyof typeof values, value: string) => {
        setValues((current) => ({ ...current, [key]: value }));
    };

    const handleRemoveDocument = () => {
        setValues((current) => ({ ...current, document: '' }));
        if (documentInputRef.current) documentInputRef.current.value = '';
    };

    return (
        <div className="min-h-screen bg-[#dfeef0] px-0 py-0 dark:bg-[#011b1b] relative font-sans">
            <div className="mx-auto flex h-screen w-full max-w-107.5 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),transparent_48%)] bg-[#dfeef0] text-[#121212] shadow-[0_25px_50px_rgba(15,32,35,0.12)] transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_36%)] dark:bg-[#011b1b] dark:text-white">

                {/* --- Header --- */}
                <header className="flex items-center justify-between px-5 pt-5 relative">
                    <div className="flex-1 text-center">
                        <h1 className="text-[26px] font-bold tracking-tight text-[#121212] dark:text-white">
                            Your spot
                        </h1>
                    </div>
                    <button
                        aria-label="Close"
                        onClick={() => router.push(ROUTES.MANAGE_SPOT)}
                        className="absolute right-5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#121212] transition hover:scale-[1.02] hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
                    >
                        <X className="h-7 w-7" strokeWidth={2.2} />
                    </button>
                </header>

                {/* --- Main Content Area --- */}
                <main className="flex-1 px-5 pt-3 overflow-y-auto space-y-4 pb-24 no-scrollbar">

                    {/* Zona Foto Parking Spot */}
                    <div className="relative flex flex-col items-center justify-center">
                        <div className="relative group w-full max-w-[280px] h-[220px]">
                            <button
                                type="button"
                                onClick={handlePhotoAreaClick}
                                className="relative h-full w-full cursor-pointer overflow-hidden rounded-[32px] border border-white/40 bg-[#cce5e7] shadow-md transition duration-200 hover:scale-[1.01] dark:border-white/10 dark:bg-[#032a2a]"
                                aria-label="Spot photo options"
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />

                                {spotImage ? (
                                    <img src={spotImage} alt="Parking Spot" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full gap-2 text-[#404b51] dark:text-[#8ba2a6]">
                                        <Upload className="h-8 w-8 stroke-[1.8]" />
                                        <span className="text-sm font-medium">Add spot photo</span>
                                    </div>
                                )}

                                {/* Dots indicator inside image */}
                                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
                                    <span className="h-2 w-2 rounded-full bg-white opacity-90 shadow-sm"></span>
                                    <span className="h-2 w-2 rounded-full bg-white/50 shadow-sm"></span>
                                    <span className="h-2 w-2 rounded-full bg-white/50 shadow-sm"></span>
                                    <span className="h-2 w-2 rounded-full bg-white/50 shadow-sm"></span>
                                </div>
                            </button>

                            {/* Edit pencil icon overlayed on bottom right of photo */}
                            <button
                                type="button"
                                onClick={handlePhotoAreaClick}
                                className="absolute -right-2 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-800 shadow-md transition hover:scale-110 dark:bg-slate-800 dark:text-white"
                                aria-label="Edit photo"
                            >
                                <Pencil className="h-4 w-4 stroke-[2]" />
                            </button>
                        </div>

                        {/* Main spot title */}
                        <h2 className="mt-4 text-center text-[22px] font-bold text-[#121212] dark:text-white tracking-tight">
                            {values.name}
                        </h2>
                    </div>

                    {/* --- SECȚIUNEA DETALII LOC DE PARCARE --- */}
                    <div className="space-y-3 pt-1">

                        {/* Name */}
                        <div className="flex items-center justify-between py-1 border-b border-black/5 dark:border-white/5">
                            <div className="flex-1 pr-2">
                                {editingField === 'name' ? (
                                    <input
                                        type="text"
                                        value={values.name}
                                        onChange={(e) => updateValue('name', e.target.value)}
                                        onBlur={() => setEditingField(null)}
                                        autoFocus
                                        className="w-full bg-white/60 dark:bg-white/10 px-2 py-1 rounded-lg text-[16px] text-[#0f4c81] dark:text-[#2dd4bf] outline-none font-medium"
                                    />
                                ) : (
                                    <p className="text-[16px] text-[#0f4c81] dark:text-[#88d9d0]">
                                        <span className="font-semibold text-[#0a355a] dark:text-[#2dd4bf]">Name:</span> {values.name}
                                    </p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingField(editingField === 'name' ? null : 'name')}
                                className="p-1 text-[#0f4c81] dark:text-white/80 hover:opacity-75 transition"
                            >
                                {editingField === 'name' ? <Check className="h-5 w-5" /> : <Pencil className="h-4 w-4" />}
                            </button>
                        </div>

                        {/* Address */}
                        <div className="flex items-center justify-between py-1 border-b border-black/5 dark:border-white/5">
                            <div className="flex-1 pr-2">
                                {editingField === 'address' ? (
                                    <input
                                        type="text"
                                        value={values.address}
                                        onChange={(e) => updateValue('address', e.target.value)}
                                        onBlur={() => setEditingField(null)}
                                        autoFocus
                                        className="w-full bg-white/60 dark:bg-white/10 px-2 py-1 rounded-lg text-[16px] text-[#0f4c81] dark:text-[#2dd4bf] outline-none font-medium"
                                    />
                                ) : (
                                    <p className="text-[16px] text-[#0f4c81] dark:text-[#88d9d0]">
                                        <span className="font-semibold text-[#0a355a] dark:text-[#2dd4bf]">Adress:</span> {values.address}
                                    </p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingField(editingField === 'address' ? null : 'address')}
                                className="p-1 text-[#0f4c81] dark:text-white/80 hover:opacity-75 transition"
                            >
                                {editingField === 'address' ? <Check className="h-5 w-5" /> : <Pencil className="h-4 w-4" />}
                            </button>
                        </div>

                        {/* Time available */}
                        <div className="flex items-center justify-between py-1 border-b border-black/5 dark:border-white/5">
                            <div className="flex-1 pr-2">
                                {editingField === 'timeAvailable' ? (
                                    <input
                                        type="text"
                                        value={values.timeAvailable}
                                        onChange={(e) => updateValue('timeAvailable', e.target.value)}
                                        onBlur={() => setEditingField(null)}
                                        autoFocus
                                        className="w-full bg-white/60 dark:bg-white/10 px-2 py-1 rounded-lg text-[16px] text-[#0f4c81] dark:text-[#2dd4bf] outline-none font-medium"
                                    />
                                ) : (
                                    <p className="text-[16px] text-[#0f4c81] dark:text-[#88d9d0]">
                                        <span className="font-semibold text-[#0a355a] dark:text-[#2dd4bf]">Time available:</span> {values.timeAvailable}
                                    </p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingField(editingField === 'timeAvailable' ? null : 'timeAvailable')}
                                className="p-1 text-[#0f4c81] dark:text-white/80 hover:opacity-75 transition"
                            >
                                {editingField === 'timeAvailable' ? <Check className="h-5 w-5" /> : <Pencil className="h-4 w-4" />}
                            </button>
                        </div>

                        {/* Extra info */}
                        <div className="flex items-center justify-between py-1 border-b border-black/5 dark:border-white/5">
                            <div className="flex-1 pr-2">
                                {editingField === 'extraInfo' ? (
                                    <input
                                        type="text"
                                        value={values.extraInfo}
                                        onChange={(e) => updateValue('extraInfo', e.target.value)}
                                        onBlur={() => setEditingField(null)}
                                        autoFocus
                                        className="w-full bg-white/60 dark:bg-white/10 px-2 py-1 rounded-lg text-[16px] text-[#0f4c81] dark:text-[#2dd4bf] outline-none font-medium"
                                    />
                                ) : (
                                    <p className="text-[16px] text-[#0f4c81] dark:text-[#88d9d0]">
                                        <span className="font-semibold text-[#0a355a] dark:text-[#2dd4bf]">Extra info:</span> {values.extraInfo}
                                    </p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingField(editingField === 'extraInfo' ? null : 'extraInfo')}
                                className="p-1 text-[#0f4c81] dark:text-white/80 hover:opacity-75 transition"
                            >
                                {editingField === 'extraInfo' ? <Check className="h-5 w-5" /> : <Pencil className="h-4 w-4" />}
                            </button>
                        </div>

                        {/* Rental price */}
                        <div className="flex items-center justify-between py-1 border-b border-black/5 dark:border-white/5">
                            <div className="flex-1 pr-2">
                                {editingField === 'rentalPrice' ? (
                                    <input
                                        type="text"
                                        value={values.rentalPrice}
                                        onChange={(e) => updateValue('rentalPrice', e.target.value)}
                                        onBlur={() => setEditingField(null)}
                                        autoFocus
                                        className="w-full bg-white/60 dark:bg-white/10 px-2 py-1 rounded-lg text-[16px] text-[#0f4c81] dark:text-[#2dd4bf] outline-none font-medium"
                                    />
                                ) : (
                                    <p className="text-[16px] text-[#0f4c81] dark:text-[#88d9d0]">
                                        <span className="font-semibold text-[#0a355a] dark:text-[#2dd4bf]">Rental price:</span> {values.rentalPrice}
                                    </p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingField(editingField === 'rentalPrice' ? null : 'rentalPrice')}
                                className="p-1 text-[#0f4c81] dark:text-white/80 hover:opacity-75 transition"
                            >
                                {editingField === 'rentalPrice' ? <Check className="h-5 w-5" /> : <Pencil className="h-4 w-4" />}
                            </button>
                        </div>

                        {/* Selling info */}
                        <div className="flex items-center justify-between py-1 border-b border-black/5 dark:border-white/5">
                            <div className="flex-1 pr-2">
                                {editingField === 'sellingInfo' ? (
                                    <input
                                        type="text"
                                        value={values.sellingInfo}
                                        onChange={(e) => updateValue('sellingInfo', e.target.value)}
                                        onBlur={() => setEditingField(null)}
                                        autoFocus
                                        className="w-full bg-white/60 dark:bg-white/10 px-2 py-1 rounded-lg text-[16px] text-[#0f4c81] dark:text-[#2dd4bf] outline-none font-medium"
                                    />
                                ) : (
                                    <p className="text-[16px] text-[#0f4c81] dark:text-[#88d9d0]">
                                        <span className="font-semibold text-[#0a355a] dark:text-[#2dd4bf]">Selling info:</span> {values.sellingInfo}
                                    </p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingField(editingField === 'sellingInfo' ? null : 'sellingInfo')}
                                className="p-1 text-[#0f4c81] dark:text-white/80 hover:opacity-75 transition"
                            >
                                {editingField === 'sellingInfo' ? <Check className="h-5 w-5" /> : <Pencil className="h-4 w-4" />}
                            </button>
                        </div>

                        {/* Legal documents */}
                        <div className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-1.5 overflow-hidden pr-1">
                <span className="font-semibold text-[#0a355a] dark:text-[#2dd4bf] text-[16px] shrink-0">
                  Legal documents:
                </span>

                                {values.document ? (
                                    <div className="inline-flex items-center gap-1 rounded-full border border-black/20 dark:border-white/20 bg-white/40 dark:bg-white/5 px-2.5 py-0.5 text-sm text-[#121212] dark:text-white shadow-sm max-w-[170px]">
                                        <span className="truncate font-medium text-[14px]">{values.document}</span>
                                        <Search className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300 shrink-0" />
                                    </div>
                                ) : (
                                    <span className="text-sm text-slate-500 dark:text-slate-400">No doc</span>
                                )}

                                <button
                                    type="button"
                                    onClick={() => setIsInfoModalOpen(true)}
                                    className="p-1 text-[#0f4c81] dark:text-white/80 hover:opacity-75 transition"
                                    aria-label="Document info"
                                >
                                    <CircleHelp className="h-4 w-4" strokeWidth={2.2} />
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => documentInputRef.current?.click()}
                                className="p-1 text-[#0f4c81] dark:text-white/80 hover:opacity-75 transition shrink-0"
                            >
                                <Pencil className="h-4 w-4" />
                            </button>

                            <input
                                ref={documentInputRef}
                                type="file"
                                accept=".pdf,application/pdf"
                                className="hidden"
                                onChange={handleDocumentFileChange}
                            />
                        </div>

                    </div>

                    {/* --- Buton Actiune (Rent / Save) --- */}
                    <div className="pt-4 flex justify-center">
                        <button
                            type="button"
                            onClick={() => alert('Spot updated successfully!')}
                            className="w-36 cursor-pointer rounded-xl bg-[#0f4c81] py-2.5 text-center text-lg font-bold text-white shadow-md transition hover:bg-[#0c3e67] active:scale-[0.98]"
                        >
                            Rent
                        </button>
                    </div>

                </main>

                {/* --- Bottom Navigation Bar --- */}
                <nav className="absolute bottom-0 left-0 right-0 flex justify-around items-center py-4 bg-[#dfeef0] dark:bg-[#011b1b] border-t border-black/5 dark:border-white/10 z-30">
                    <button
                        onClick={() => { setActiveTab('key'); router.push(ROUTES.RENT); }}
                        className={`p-1.5 transition-all cursor-pointer rounded-full ${
                            activeTab === 'key' ? 'text-[#0f4c81] dark:text-[#2dd4bf] scale-110' : 'text-slate-500 dark:text-slate-400'
                        }`}
                    >
                        <Key className="w-6 h-6 transform -rotate-45" strokeWidth={activeTab === 'key' ? 2.5 : 2} />
                    </button>

                    <button
                        onClick={() => { setActiveTab('home'); router.push(ROUTES.HOME); }}
                        className={`p-1.5 transition-all cursor-pointer rounded-full ${
                            activeTab === 'home' ? 'text-[#0f4c81] dark:text-[#2dd4bf] scale-110' : 'text-slate-500 dark:text-slate-400'
                        }`}
                    >
                        <Home className="w-6 h-6" strokeWidth={activeTab === 'home' ? 2.5 : 2} />
                    </button>

                    <button
                        onClick={() => { setActiveTab('car'); router.push(ROUTES.EDIT_SPOT); }}
                        className={`p-1.5 transition-all cursor-pointer rounded-full ${
                            activeTab === 'car' ? 'text-[#0f4c81] dark:text-[#2dd4bf] scale-110' : 'text-slate-500 dark:text-slate-400'
                        }`}
                    >
                        <Car className="w-6 h-6" strokeWidth={activeTab === 'car' ? 2.5 : 2} />
                    </button>
                </nav>

            </div>

            {/* Pop-up modern pentru opțiuni foto loc de parcare */}
            {isPhotoModalOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                    <div className="relative w-full max-w-85 rounded-3xl bg-white/90 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/40 transition-colors duration-300 dark:bg-[#022525]/90 dark:border-white/5 text-center">
                        <button
                            type="button"
                            onClick={() => setIsPhotoModalOpen(false)}
                            className="absolute right-4 top-4 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-black/5 text-[#121212] hover:bg-black/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 transition"
                            aria-label="Cancel"
                        >
                            <X className="h-4 w-4" strokeWidth={2.5} />
                        </button>

                        <h3 className="mt-2 text-xl font-bold tracking-tight text-[#121212] dark:text-white">
                            Edit spot photo
                        </h3>
                        <p className="mt-1 text-sm text-[#404b51] dark:text-slate-400">
                            What would you like to do?
                        </p>

                        <div className="mt-5 space-y-3">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-3 px-4 cursor-pointer rounded-2xl bg-white border border-black/15 text-sm font-bold shadow-sm text-[#121212] hover:bg-slate-50 transition active:scale-[0.98] dark:bg-white/10 dark:border-white/10 dark:text-white dark:hover:bg-white/15"
                            >
                                Change photo
                            </button>
                            <button
                                type="button"
                                onClick={handleDeletePhoto}
                                className="w-full py-3 px-4 cursor-pointer rounded-2xl bg-red-500 text-white text-sm font-bold shadow-sm hover:bg-red-600 transition active:scale-[0.98] dark:bg-red-600/80 dark:hover:bg-red-600"
                            >
                                Delete photo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pop-up informativ pentru Legal Documents */}
            {isInfoModalOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                    <div className="relative w-full max-w-85 rounded-3xl bg-white/90 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/40 transition-colors duration-300 dark:bg-[#022525]/90 dark:border-white/5 text-center">
                        <button
                            type="button"
                            onClick={() => setIsInfoModalOpen(false)}
                            className="absolute right-4 top-4 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-black/5 text-[#121212] hover:bg-black/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 transition"
                            aria-label="Close information"
                        >
                            <X className="h-4 w-4" strokeWidth={2.5} />
                        </button>

                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#0f4c81]/10 text-[#0f4c81] dark:bg-white/10 dark:text-white mb-3">
                            <CircleHelp className="h-6 w-6" strokeWidth={2.2} />
                        </div>

                        <h3 className="text-xl font-bold tracking-tight text-[#121212] dark:text-white">
                            Legal documents
                        </h3>
                        <p className="mt-3 text-sm leading-relaxed text-[#404b51] dark:text-slate-300 font-normal">
                            Please upload a PDF document representing the <span className="font-semibold text-black dark:text-white">proof of ownership or property title for the parking spot</span>.
                        </p>

                        <div className="mt-5">
                            <button
                                type="button"
                                onClick={() => setIsInfoModalOpen(false)}
                                className="w-full py-3 px-4 cursor-pointer rounded-2xl bg-[#0f4c81] text-white text-sm font-bold shadow-sm hover:bg-[#0c3e67] transition active:scale-[0.98]"
                            >
                                Understood
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}