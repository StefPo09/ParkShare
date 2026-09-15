'use client';

import React, { useState, useRef, ChangeEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ROUTES } from '../../constants/routes';
import { useLanguage } from '../components/LanguageProvider';
import {
    X,
    Upload,
    CircleHelp,
    Key,
    Home,
    Car,
    CheckCircle2,
    Pencil
} from 'lucide-react';

interface SpotPhoto {
    id: string;
    url: string;
    file: File | null;
}

export default function EditSpotPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#dfeef0] dark:bg-[#011b1b]" />}>
            <EditSpotPageContent />
        </Suspense>
    );
}

function EditSpotPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const spotId = searchParams.get('id');
    const { t } = useLanguage();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const documentInputRef = useRef<HTMLInputElement>(null);

    const MAX_SPOT_PHOTOS = 5;
    const [spotPhotos, setSpotPhotos] = useState<SpotPhoto[]>([]);
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);
    const [photoMode, setPhotoMode] = useState<'add' | 'replace'>('add');
    const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
    const [showDeletePhotoModal, setShowDeletePhotoModal] = useState(false);

    const [selectedDocumentFile, setSelectedDocumentFile] = useState<File | null>(null);
    const [isDocumentRemoved, setIsDocumentRemoved] = useState(false);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

    const [values, setValues] = useState({
        name: '',
        address: '',
        startHour: '14:00',
        endHour: '18:00',
        extraInfo: '',
        rentalPriceAmount: '0.00',
        rentalPriceCurrency: 'RON',
        sellingInfo: 'Not on sale',
        document: '',
    });

    const [activeTab, setActiveTab] = useState<'key' | 'home' | 'car'>('key');
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const activePhoto = spotPhotos[activePhotoIndex] || null;

    // Încărcare date loc de parcare (inclusiv pozele și orele)
    useEffect(() => {
        if (!spotId) return;

        fetch(`${API}/api/spots/${spotId}`, { credentials: 'include' })
            .then((res) => {
                if (!res.ok) throw new Error('Failed to fetch spot');
                return res.json();
            })
            .then((data) => {
                if (data.spot) {
                    const spot = data.spot;
                    setValues((prev) => ({
                        ...prev,
                        name: spot.title || '',
                        address: spot.address || '',
                        startHour: spot.start_hour || spot.start_time || '14:00',
                        endHour: spot.end_hour || spot.end_time || '18:00',
                        extraInfo: spot.description || '',
                        rentalPriceAmount: spot.price_per_day ? String(spot.price_per_day) : '0.00',
                        rentalPriceCurrency: spot.price_currency || 'RON',
                        sellingInfo: spot.is_on_sale ? 'On sale' : 'Not on sale',
                        document: spot.document_name || (spot.document_url ? 'Legal Document.pdf' : ''),
                    }));
                    if (spot.image_url) {
                        setSpotPhotos([{ id: 'existing-image', url: `${API}${spot.image_url}`, file: null }]);
                    }
                }
            })
            .catch((err) => console.error('Error fetching spot:', err));
    }, [spotId, API]);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const objectUrl = URL.createObjectURL(file);

        if (photoMode === 'replace' && activePhoto) {
            setSpotPhotos((photos) =>
                photos.map((photo, index) =>
                    index === activePhotoIndex ? { ...photo, url: objectUrl, file } : photo
                )
            );
        } else if (spotPhotos.length < MAX_SPOT_PHOTOS) {
            const newPhoto: SpotPhoto = { id: `${Date.now()}-${Math.random()}`, url: objectUrl, file };
            setSpotPhotos((photos) => {
                const nextPhotos = [...photos, newPhoto];
                setActivePhotoIndex(Math.max(nextPhotos.length - 1, 0));
                return nextPhotos;
            });
        }

        setPhotoMode('add');
        setIsPhotoModalOpen(false);
        setShowDeletePhotoModal(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handlePhotoAreaClick = () => {
        if (spotPhotos.length > 0) {
            setIsPhotoModalOpen(true);
        } else {
            setPhotoMode('add');
            fileInputRef.current?.click();
        }
    };

    const handleDeletePhoto = () => {
        const remainingPhotos = spotPhotos.filter((_, index) => index !== activePhotoIndex);
        setSpotPhotos(remainingPhotos);
        setActivePhotoIndex((prev) => {
            if (remainingPhotos.length === 0) return 0;
            return Math.min(prev, remainingPhotos.length - 1);
        });
        setIsPhotoModalOpen(false);
        setShowDeletePhotoModal(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const openPhotoPickerForAdd = () => {
        if (spotPhotos.length >= MAX_SPOT_PHOTOS) return;
        setPhotoMode('add');
        setIsPhotoModalOpen(false);
        fileInputRef.current?.click();
    };

    const openPhotoPickerForReplace = () => {
        if (!activePhoto) return;
        setPhotoMode('replace');
        setIsPhotoModalOpen(false);
        fileInputRef.current?.click();
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

        setSelectedDocumentFile(file);
        setIsDocumentRemoved(false);
        setValues((current) => ({ ...current, document: file.name }));
    };

    const updateValue = (key: keyof typeof values, value: string) => {
        setValues((current) => ({ ...current, [key]: value }));
    };

    const handlePriceChange = (e: ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
            updateValue('rentalPriceAmount', val);
        }
    };

    const handlePriceBlur = () => {
        const numericValue = parseFloat(values.rentalPriceAmount);
        if (!isNaN(numericValue)) {
            updateValue('rentalPriceAmount', numericValue.toFixed(2));
        } else {
            updateValue('rentalPriceAmount', '0.00');
        }
    };

    const handleRemoveDocument = () => {
        setSelectedDocumentFile(null);
        setIsDocumentRemoved(true);
        setValues((current) => ({ ...current, document: '' }));
        if (documentInputRef.current) documentInputRef.current.value = '';
    };

    // Salvare modificări cu pozele și documentul PDF
    const handleRentSubmit = async () => {
        if (!spotId) return;

        const formData = new FormData();
        formData.append('title', values.name);
        formData.append('address', values.address);

        formData.append('start_hour', values.startHour);
        formData.append('end_hour', values.endHour);
        formData.append('start_time', values.startHour);
        formData.append('end_time', values.endHour);

        formData.append('description', values.extraInfo);
        formData.append('price_per_day', values.rentalPriceAmount);
        formData.append('price_currency', values.rentalPriceCurrency);

        const isOnSale = values.sellingInfo === 'On sale';
        formData.append('is_on_sale', String(isOnSale));
        formData.append('selling_info', values.sellingInfo);

        const primaryPhoto = spotPhotos.find((photo) => photo.file);
        if (primaryPhoto?.file) {
            formData.append('image', primaryPhoto.file);
        } else if (spotPhotos.length === 0) {
            formData.append('remove_image', 'true');
        }

        spotPhotos.forEach((photo) => {
            if (photo.file) {
                formData.append('images', photo.file);
            }
        });

        if (selectedDocumentFile) {
            formData.append('document', selectedDocumentFile);
        } else if (isDocumentRemoved) {
            formData.append('remove_document', 'true');
        }

        try {
            const res = await fetch(`${API}/api/spots/${spotId}`, {
                method: 'PATCH',
                body: formData,
                credentials: 'include',
            });

            if (res.ok) {
                setIsSuccessModalOpen(true);
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to update spot');
            }
        } catch (err) {
            console.error('Error updating spot:', err);
        }
    };

    const handleCloseSuccessModal = () => {
        setIsSuccessModalOpen(false);
        router.push(ROUTES.MANAGE_SPOT);
    };

    return (
        <div className="min-h-screen bg-[#dfeef0] px-0 py-0 dark:bg-[#011b1b] relative">
            <div className="mx-auto flex h-screen w-full max-w-107.5 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),transparent_48%)] bg-[#dfeef0] text-[#121212] shadow-[0_25px_50px_rgba(15,32,35,0.12)] transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_36%)] dark:bg-[#011b1b] dark:text-white">

                <header className="flex items-center justify-between px-5 pt-5">
                    <div className="flex-1 text-center">
                        <h1 className="text-[28px] font-bold tracking-tight text-[#121212] dark:text-white">
                            {t('yourSpot')}
                        </h1>
                    </div>
                    <button
                        aria-label="Close"
                        onClick={() => router.push(ROUTES.MANAGE_SPOT)}
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#121212] transition hover:scale-[1.02] hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
                    >
                        <X className="h-7 w-7" strokeWidth={2.2} />
                    </button>
                </header>

                <main className="flex-1 px-4 pt-4 overflow-y-auto space-y-4 pb-24 no-scrollbar">

                    {/* Photo Area */}
                    <div className="relative flex flex-col items-center justify-center mb-2">
                        <div className="relative group flex w-full max-w-80 items-center justify-center gap-2 h-60">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />

                            {spotPhotos.length > 0 && activePhoto ? (
                                <>
                                    {activePhotoIndex > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setActivePhotoIndex((prev) => Math.max(prev - 1, 0))}
                                            className="relative h-32 w-16 overflow-hidden rounded-2xl border border-white/40 bg-black/5 shadow-sm transition-transform duration-300 hover:scale-[1.02] dark:border-white/10 dark:bg-white/5"
                                            aria-label="Previous photo"
                                        >
                                            <img
                                                src={spotPhotos[activePhotoIndex - 1].url}
                                                alt="Previous spot photo"
                                                className="h-full w-full object-cover opacity-75"
                                            />
                                        </button>
                                    )}

                                    <div className="relative h-55 w-full max-w-70 overflow-hidden rounded-[32px] border border-white/40 bg-[#cce5e7] shadow-lg transition-all duration-300 dark:border-white/10 dark:bg-white/5">
                                        <div className="absolute inset-0 transition-transform duration-300 ease-out">
                                            <button
                                                type="button"
                                                onClick={handlePhotoAreaClick}
                                                className="relative h-full w-full cursor-pointer overflow-hidden"
                                                aria-label="Spot photo options"
                                            >
                                                <img src={activePhoto.url} alt="Parking Spot" className="h-full w-full object-cover" />
                                            </button>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setShowDeletePhotoModal(true)}
                                            className="absolute bottom-3 left-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/90 text-red-500 shadow-[0_4px_12px_rgba(0,0,0,0.18)] border border-black/5 transition-transform active:scale-95"
                                            aria-label="Delete current photo"
                                        >
                                            <X className="h-5 w-5" strokeWidth={2.6} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={openPhotoPickerForReplace}
                                            className="absolute bottom-3 right-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/90 text-[#121212] shadow-[0_4px_12px_rgba(0,0,0,0.18)] border border-black/5 transition-transform active:scale-95"
                                            aria-label="Change current photo"
                                        >
                                            <Pencil className="h-4 w-4" strokeWidth={2.2} />
                                        </button>
                                    </div>

                                    {activePhotoIndex < spotPhotos.length - 1 ? (
                                        <button
                                            type="button"
                                            onClick={() => setActivePhotoIndex((prev) => Math.min(prev + 1, spotPhotos.length - 1))}
                                            className="relative h-32 w-16 overflow-hidden rounded-2xl border border-white/40 bg-black/5 shadow-sm transition-transform duration-300 hover:scale-[1.02] dark:border-white/10 dark:bg-white/5"
                                            aria-label="Next photo"
                                        >
                                            <img
                                                src={spotPhotos[activePhotoIndex + 1].url}
                                                alt="Next spot photo"
                                                className="h-full w-full object-cover opacity-75"
                                            />
                                        </button>
                                    ) : spotPhotos.length < MAX_SPOT_PHOTOS ? (
                                        <button
                                            type="button"
                                            onClick={openPhotoPickerForAdd}
                                            className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border border-dashed border-[#0f4c81]/50 bg-white/70 text-[#0f4c81] shadow-sm transition hover:scale-105 dark:border-[#2dd4bf]/60 dark:bg-[#032a2a] dark:text-[#2dd4bf]"
                                            aria-label="Add photo"
                                        >
                                            <span className="text-3xl leading-none">+</span>
                                        </button>
                                    ) : null}
                                </>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handlePhotoAreaClick}
                                    className="relative h-55 w-full max-w-70 cursor-pointer overflow-hidden rounded-[32px] border border-white/40 bg-[#cce5e7] shadow-md transition duration-200 hover:scale-[1.01] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                                    aria-label="Spot photo options"
                                >
                                    <div className="flex h-full flex-col items-center justify-center gap-2 text-[#404b51] dark:text-[#8ba2a6]">
                                        <Upload className="h-8 w-8 stroke-[1.8]" />
                                        <span className="text-sm font-medium">{t('spotPhoto')}</span>
                                    </div>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4 px-2">
                        <h3 className="text-[13px] font-bold uppercase tracking-[0.15em] text-[#114B43] dark:text-[#2dd4bf] pl-1">
                            {t('spotSpecifications')}
                        </h3>

                        <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                            <label htmlFor="spot-name" className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                                {t('spotName')}
                            </label>
                            <input
                                id="spot-name"
                                type="text"
                                value={values.name}
                                onChange={(e) => updateValue('name', e.target.value)}
                                placeholder="Custom spot name"
                                className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-[18px] font-medium text-[#121212] outline-none placeholder:text-[#6f797d] dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-[#9db0b6]"
                            />
                        </div>

                        <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                            <label htmlFor="spot-address" className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                                {t('address')}
                            </label>
                            <input
                                id="spot-address"
                                type="text"
                                value={values.address}
                                onChange={(e) => updateValue('address', e.target.value)}
                                placeholder="Parking spot address"
                                className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-[18px] font-medium text-[#121212] outline-none placeholder:text-[#6f797d] dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-[#9db0b6]"
                            />
                        </div>

                        <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                            <span className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                                {t('timeAvailable')}
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label htmlFor="start-hour" className="sr-only">{t('startHourLabel')}</label>
                                    <input
                                        id="start-hour"
                                        type="time"
                                        value={values.startHour}
                                        onChange={(e) => updateValue('startHour', e.target.value)}
                                        className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-[16px] font-medium text-[#121212] outline-none dark:border-white/10 dark:bg-white/5 dark:text-white scheme-light dark:scheme-dark"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="end-hour" className="sr-only">{t('endHourLabel')}</label>
                                    <input
                                        id="end-hour"
                                        type="time"
                                        value={values.endHour}
                                        onChange={(e) => updateValue('endHour', e.target.value)}
                                        className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-[16px] font-medium text-[#121212] outline-none dark:border-white/10 dark:bg-white/5 dark:text-white scheme-light dark:scheme-dark"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                            <label htmlFor="spot-extra" className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                                {t('extraInfo')}
                            </label>
                            <input
                                id="spot-extra"
                                type="text"
                                value={values.extraInfo}
                                onChange={(e) => updateValue('extraInfo', e.target.value)}
                                placeholder="None"
                                className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-[18px] font-medium text-[#121212] outline-none placeholder:text-[#6f797d] dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-[#9db0b6]"
                            />
                        </div>

                        <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                            <label htmlFor="spot-price" className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                                {t('rentalPrice')}
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    id="spot-price"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={values.rentalPriceAmount}
                                    onChange={handlePriceChange}
                                    onBlur={handlePriceBlur}
                                    placeholder="4.00"
                                    className="w-full flex-1 rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-[18px] font-medium text-[#121212] outline-none placeholder:text-[#6f797d] dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-[#9db0b6]"
                                />
                                <select
                                    aria-label="Currency"
                                    value={values.rentalPriceCurrency}
                                    onChange={(e) => updateValue('rentalPriceCurrency', e.target.value)}
                                    className="rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-[18px] font-medium text-[#121212] outline-none dark:border-white/10 dark:bg-white/5 dark:text-white cursor-pointer"
                                >
                                    <option value="RON" className="text-black bg-white">RON</option>
                                    <option value="$" className="text-black bg-white">$</option>
                                    <option value="€" className="text-black bg-white">€</option>
                                </select>
                                <span className="text-[18px] font-semibold text-[#42565d] dark:text-[#d6e7ea] pr-2 select-none">
                                    /h
                                </span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                            <label htmlFor="spot-selling" className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                                Selling info
                            </label>
                            <select
                                id="spot-selling"
                                value={values.sellingInfo}
                                onChange={(e) => updateValue('sellingInfo', e.target.value)}
                                className={`w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-[18px] font-medium outline-none dark:border-white/10 dark:bg-white/5 cursor-pointer transition-colors duration-200 ${
                                    values.sellingInfo === 'On sale'
                                        ? 'text-emerald-500 dark:text-emerald-400'
                                        : 'text-red-500 dark:text-red-400'
                                }`}
                            >
                                <option value="On sale" className="text-emerald-500 bg-white dark:bg-[#032a2a]">On sale</option>
                                <option value="Not on sale" className="text-red-500 bg-white dark:bg-[#032a2a]">Not on sale</option>
                            </select>
                        </div>

                        <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                            <div className="mb-2 flex items-center justify-between gap-2">
                                <label className="text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                                    {t('legalDocuments')}
                                </label>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsInfoModalOpen(true)}
                                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#1f2937]/15 bg-white/40 text-[#42565d] shadow-sm transition hover:-translate-y-0.5 hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:text-[#d6e7ea] dark:hover:bg-white/10"
                                    >
                                        <CircleHelp className="h-4 w-4" strokeWidth={2.2} />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => documentInputRef.current?.click()}
                                        className="flex h-8 items-center gap-1.5 rounded-full border border-[#1f2937]/15 bg-white/40 px-3 text-[14px] text-[#1f2937] shadow-sm cursor-pointer transition hover:-translate-y-0.5 hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                                    >
                                        <Upload className="h-3.5 w-3.5" strokeWidth={2.2} />
                                        <span>{t('uploadPdf')}</span>
                                    </button>
                                </div>
                            </div>
                            <input
                                ref={documentInputRef}
                                type="file"
                                accept=".pdf,application/pdf"
                                className="hidden"
                                onChange={handleDocumentFileChange}
                            />
                            <div className="flex min-h-12.5 items-center justify-between gap-2 rounded-xl border border-[#111827]/15 bg-white/50 px-3 py-2 text-[18px] text-[#121212] shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white">
                                {values.document ? (
                                    <>
                                        <span className="truncate pr-2 font-medium">{values.document}</span>
                                        <button
                                            type="button"
                                            onClick={handleRemoveDocument}
                                            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-red-500/10 text-red-500 transition hover:bg-red-500 hover:text-white active:scale-95"
                                        >
                                            <X className="h-4 w-4" strokeWidth={2.5} />
                                        </button>
                                    </>
                                ) : (
                                    <span className="truncate text-[#6f797d] dark:text-[#9db0b6]">{t('noPdf')}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="px-2 pt-4">
                        <button
                            type="button"
                            onClick={handleRentSubmit}
                            className="flex w-full cursor-pointer items-center justify-center rounded-2xl bg-[#0f4c81] px-5 py-3.5 text-base font-semibold text-white shadow-[0_16px_28px_rgba(15,76,129,0.28)] transition hover:bg-[#0c3e67] hover:scale-[1.01] active:scale-[0.99]"
                        >
                            {t('saveChanges')}
                        </button>
                    </div>
                </main>

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
                        onClick={() => { setActiveTab('car'); router.push(ROUTES.MANAGE_CAR); }}
                        className={`p-1.5 transition-all cursor-pointer rounded-full ${
                            activeTab === 'car' ? 'text-[#0f4c81] dark:text-[#2dd4bf] scale-110' : 'text-slate-500 dark:text-slate-400'
                        }`}
                    >
                        <Car className="w-6 h-6" strokeWidth={activeTab === 'car' ? 2.5 : 2} />
                    </button>
                </nav>

            </div>

            {/* Success Modal */}
            {isSuccessModalOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 animate-fadeIn">
                    <div className="relative w-full max-w-85 rounded-3xl bg-white/90 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-white/40 transition-colors duration-300 dark:bg-[#022525]/90 dark:border-white/5 text-center transform scale-100 transition-transform duration-300">

                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400 mb-4 animate-bounce">
                            <CheckCircle2 className="h-10 w-10 stroke-[2.2]" />
                        </div>

                        <h3 className="text-2xl font-bold tracking-tight text-[#121212] dark:text-white">
                            {t('success')}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-[#404b51] dark:text-slate-300 font-medium">
                            {t('Changes were successfully saved!')}
                        </p>

                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={handleCloseSuccessModal}
                                className="w-full py-3.5 px-4 cursor-pointer rounded-2xl bg-emerald-500 text-white text-base font-bold shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:bg-emerald-600 transition active:scale-[0.98]"
                            >
                                Awesome
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Photo Options Modal */}
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
                            {t('spotPhoto')}
                        </h3>
                        <p className="mt-1 text-sm text-[#404b51] dark:text-slate-400">
                            {t('whatWouldYouLikeToDo')}
                        </p>

                        <div className="mt-5 space-y-3">
                            {spotPhotos.length < MAX_SPOT_PHOTOS && (
                                <button
                                    type="button"
                                    onClick={openPhotoPickerForAdd}
                                    className="w-full py-3 px-4 cursor-pointer rounded-2xl bg-[#0f4c81] text-white text-sm font-bold shadow-sm hover:bg-[#0c3e67] transition active:scale-[0.98]"
                                >
                                    Add Another Photo
                                </button>
                            )}
                            {activePhoto && (
                                <button
                                    type="button"
                                    onClick={openPhotoPickerForReplace}
                                    className="w-full py-3 px-4 cursor-pointer rounded-2xl bg-white border border-black/15 text-sm font-bold shadow-sm text-[#121212] hover:bg-slate-50 transition active:scale-[0.98] dark:bg-white/10 dark:border-white/10 dark:text-white dark:hover:bg-white/15"
                                >
                                    {t('changePhoto')}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsPhotoModalOpen(false);
                                    setShowDeletePhotoModal(true);
                                }}
                                className="w-full py-3 px-4 cursor-pointer rounded-2xl bg-red-500 text-white text-sm font-bold shadow-sm hover:bg-red-600 transition active:scale-[0.98] dark:bg-red-600/80 dark:hover:bg-red-600"
                            >
                                {t('deletePhoto')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeletePhotoModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                    <div className="relative w-full max-w-85 rounded-3xl bg-white/90 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/40 transition-colors duration-300 dark:bg-[#022525]/90 dark:border-white/5 text-center">
                        <h3 className="text-xl font-bold tracking-tight text-[#121212] dark:text-white">
                            Delete Photo?
                        </h3>
                        <p className="mt-2 text-sm text-[#404b51] dark:text-slate-300 font-medium">
                            Are you sure you want to delete this photo from your spot?
                        </p>

                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowDeletePhotoModal(false)}
                                className="flex-1 py-3 px-4 cursor-pointer rounded-2xl bg-slate-200 text-[#121212] text-sm font-bold shadow-sm hover:bg-slate-300 transition active:scale-[0.98] dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeletePhoto}
                                className="flex-1 py-3 px-4 cursor-pointer rounded-2xl bg-red-500 text-white text-sm font-bold shadow-sm hover:bg-red-600 transition active:scale-[0.98]"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Info Modal */}
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
                            {t('legalDocuments')}
                        </h3>
                        <p className="mt-3 text-sm leading-relaxed text-[#404b51] dark:text-slate-300 font-normal">
                            {t('proofOfOwnershipSpot')}
                        </p>

                        <div className="mt-5">
                            <button
                                type="button"
                                onClick={() => setIsInfoModalOpen(false)}
                                className="w-full py-3 px-4 cursor-pointer rounded-2xl bg-[#0f4c81] text-white text-sm font-bold shadow-sm hover:bg-[#0c3e67] transition active:scale-[0.98]"
                            >
                                {t('understood')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}