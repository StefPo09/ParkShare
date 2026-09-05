'use client';

import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '../../constants/routes';
import { useLanguage } from '../components/LanguageProvider';
import {
  X,
  Upload,
  CircleHelp,
  Key,
  Home,
  Car,
  CheckCircle2
} from 'lucide-react';

interface City {
  id: number;
  name: string;
}

export default function AddSpotPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const [spotImage, setSpotImage] = useState<string | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cities, setCities] = useState<City[]>([]);

  const [values, setValues] = useState({
    city_id: '',
    name: '',
    address: '',
    startHour: '08:00',
    endHour: '17:00',
    extraInfo: '',
    rentalPriceAmount: '',
    rentalPriceCurrency: 'RON',
    sellingInfo: 'Not on sale',
    document: '',
  });

  const [activeTab, setActiveTab] = useState<'key' | 'home' | 'car'>('key');

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/cities', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setCities(data.cities || []);
          if (data.cities && data.cities.length > 0) {
            setValues((v) => ({ ...v, city_id: data.cities[0].id.toString() }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch cities:', error);
      }
    };
    fetchCities();
  }, []);

  const canSubmit =
    values.city_id.trim().length > 0 &&
    values.name.trim().length > 0 &&
    values.address.trim().length > 0 &&
    values.rentalPriceAmount.trim().length > 0 &&
    values.document.trim().length > 0 &&
    !!spotImage;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setSpotImage(objectUrl);
    setIsPhotoModalOpen(false);
  };

  const handlePhotoAreaClick = () => {
    if (spotImage) {
      setIsPhotoModalOpen(true);
    } else {
      fileInputRef.current?.click();
    }
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

  const handlePriceChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
      updateValue('rentalPriceAmount', val);
    }
  };

  const handlePriceBlur = () => {
    if (values.rentalPriceAmount === '') return;
    const numericValue = parseFloat(values.rentalPriceAmount);
    if (!isNaN(numericValue)) {
      updateValue('rentalPriceAmount', numericValue.toFixed(2));
    } else {
      updateValue('rentalPriceAmount', '0.00');
    }
  };

  const handleRemoveDocument = () => {
    setValues((current) => ({ ...current, document: '' }));
    if (documentInputRef.current) documentInputRef.current.value = '';
  };

  const handleAddSpotSubmit = async () => {
    if (!canSubmit) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('http://localhost:5000/api/spots', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          city_id: parseInt(values.city_id, 10),
          title: values.name,
          address: values.address,
          description: values.extraInfo || null,
          price_per_day: parseFloat(values.rentalPriceAmount),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setErrorMessage(error.error || 'Failed to create parking spot.');
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setIsSuccessModalOpen(true);
    } catch (err) {
      setErrorMessage('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setIsSuccessModalOpen(false);
    router.push(ROUTES.MANAGE_SPOT);
  };

  return (
    <div className="min-h-screen bg-[#dfeef0] px-0 py-0 dark:bg-[#011b1b] relative">
      <div className="mx-auto flex h-screen w-full max-w-107.5 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),transparent_48%)] bg-[#dfeef0] text-[#121212] shadow-[0_25px_50px_rgba(15,32,35,0.12)] transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_36%)] dark:bg-[#011b1b] dark:text-white">

        {/* Header */}
        <header className="flex items-center justify-between px-5 pt-5">
          <div className="flex-1 text-center">
            <h1 className="text-[28px] font-bold tracking-tight text-[#121212] dark:text-white">
              {t('addSpotTitle')}
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

        {/* Main Content */}
        <main className="flex-1 px-4 pt-4 overflow-y-auto space-y-4 pb-24 no-scrollbar">

          {/* Photo Area */}
          <div className="relative flex flex-col items-center justify-center mb-2">
            <div className="relative group w-full max-w-70 h-55">
              <button
                type="button"
                onClick={handlePhotoAreaClick}
                className="relative h-full w-full cursor-pointer overflow-hidden rounded-4xl border border-white/40 bg-[#cce5e7] shadow-md transition duration-200 hover:scale-[1.01] dark:border-white/10 dark:bg-[#032a2a]"
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
                    <span className="text-sm font-medium">{t('spotPhoto')}</span>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Form Specifications */}
          <div className="space-y-4 px-2">
            <h3 className="text-[13px] font-bold uppercase tracking-[0.15em] text-[#114B43] dark:text-[#2dd4bf] pl-1">
              {t('spotSpecifications')}
            </h3>

            {/* City Selection */}
            <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
              <label htmlFor="spot-city" className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                City
              </label>
              <select
                id="spot-city"
                value={values.city_id}
                onChange={(e) => setValues({ ...values, city_id: e.target.value })}
                className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-[18px] font-medium text-[#121212] outline-none dark:border-white/10 dark:bg-white/5 dark:text-white cursor-pointer"
              >
                {cities.map((city) => (
                  <option key={city.id} value={city.id} className="text-black bg-white">
                    {city.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Name */}
            <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
              <label htmlFor="spot-name" className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                {t('spotName')}
              </label>
              <input
                id="spot-name"
                type="text"
                value={values.name}
                onChange={(e) => updateValue('name', e.target.value)}
                placeholder="e.g. Center Secure Parking"
                className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-[18px] font-medium text-[#121212] outline-none placeholder:text-[#6f797d] dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-[#9db0b6]"
              />
            </div>

            {/* Address */}
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

            {/* Time Available */}
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
                    className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-[16px] font-medium text-[#121212] outline-none dark:border-white/10 dark:bg-white/5 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
                <div>
                  <label htmlFor="end-hour" className="sr-only">{t('endHourLabel')}</label>
                  <input
                    id="end-hour"
                    type="time"
                    value={values.endHour}
                    onChange={(e) => updateValue('endHour', e.target.value)}
                    className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-[16px] font-medium text-[#121212] outline-none dark:border-white/10 dark:bg-white/5 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
              </div>
            </div>

            {/* Extra Info */}
            <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
              <label htmlFor="spot-extra" className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                {t('extraInfoOptional')}
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

            {/* Rental Price */}
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
                  placeholder="0.00"
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

            {/* Selling Info */}
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

            {/* Legal Documents */}
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
                  <span className="truncate text-[#6f797d] dark:text-[#9db0b6]">{t('selectPdf')}</span>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="px-2 pt-4">
            {errorMessage && (
              <div className="mb-3 rounded-lg bg-red-500/20 border border-red-500 px-4 py-2 text-red-700 dark:text-red-300 text-sm">
                {errorMessage}
              </div>
            )}
            <button
              type="button"
              disabled={!canSubmit || isLoading}
              onClick={handleAddSpotSubmit}
              className={`flex w-full cursor-pointer items-center justify-center rounded-2xl px-5 py-3.5 text-base font-semibold shadow-[0_16px_28px_rgba(15,76,129,0.28)] transition hover:scale-[1.01] active:scale-[0.99] ${
                canSubmit && !isLoading
                  ? 'bg-[#0f4c81] text-white hover:bg-[#0c3e67]'
                  : 'bg-[#0f4c81]/45 text-white cursor-not-allowed shadow-none'
              }`}
            >
              {isLoading ? 'Loading...' : t('addSpot')}
            </button>
          </div>
        </main>

        {/* Bottom Navigation */}
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
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-85 rounded-3xl bg-white/90 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-white/40 transition-colors duration-300 dark:bg-[#022525]/90 dark:border-white/5 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400 mb-4 animate-bounce">
              <CheckCircle2 className="h-10 w-10 stroke-[2.2]" />
            </div>

            <h3 className="text-2xl font-bold tracking-tight text-[#121212] dark:text-white">
              {t('success')}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#404b51] dark:text-slate-300 font-medium">
              {t('addSpot')} {t('success').toLowerCase()}
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
              <button
                type="button"
                onClick={() => {
                  setIsPhotoModalOpen(false);
                  fileInputRef.current?.click();
                }}
                className="w-full py-3 px-4 cursor-pointer rounded-2xl bg-white border border-black/15 text-sm font-bold shadow-sm text-[#121212] hover:bg-slate-50 transition active:scale-[0.98] dark:bg-white/10 dark:border-white/10 dark:text-white dark:hover:bg-white/15"
              >
                {t('changePhoto')}
              </button>
              <button
                type="button"
                onClick={handleDeletePhoto}
                className="w-full py-3 px-4 cursor-pointer rounded-2xl bg-red-500 text-white text-sm font-bold shadow-sm hover:bg-red-600 transition active:scale-[0.98] dark:bg-red-600/80 dark:hover:bg-red-600"
              >
                {t('deletePhoto')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Info Modal */}
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
              {t('documentHelp')} {t('proofOfOwnershipSpot')}
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