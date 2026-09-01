'use client';

import React from 'react';
import { Upload, X, CircleHelp, Key, Home, Car } from 'lucide-react';
import { ChangeEvent, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '../../constants/routes';
import { useLanguage } from '../components/LanguageProvider';

export default function AddCarPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const [carImage, setCarImage] = useState<string | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    plate: '',
    model: '',
    document: '',
  });
  const [activeTab, setActiveTab] = useState<'key' | 'home' | 'car'>('car');

  const canSubmit =
      form.name.trim().length > 0 &&
      form.plate.trim().length > 0 &&
      form.model.trim().length > 0 &&
      form.document.trim().length > 0 &&
      !!carImage;

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCarImage(URL.createObjectURL(file));
    setIsPhotoModalOpen(false);
  };

  const handlePhotoAreaClick = () => {
    if (carImage) {
      setIsPhotoModalOpen(true);
    } else {
      photoInputRef.current?.click();
    }
  };

  const handleDeletePhoto = () => {
    setCarImage(null);
    setIsPhotoModalOpen(false);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handleDocumentChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      window.alert('Please upload a PDF file.');
      event.target.value = '';
      return;
    }

    setForm((current) => ({ ...current, document: file.name }));
  };

  const handleDeleteDocument = () => {
    setForm((current) => ({ ...current, document: '' }));
    if (documentInputRef.current) documentInputRef.current.value = '';
  };

  const updateField = (field: 'name' | 'plate' | 'model', value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('http://localhost:5000/api/cars', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brand: form.name,
          model: form.model,
          license_plate: form.plate,
          color: form.name,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setErrorMessage(error.error || 'Failed to create car.');
        setIsLoading(false);
        return;
      }

      router.push(ROUTES.MANAGE_CAR);
    } catch (err) {
      setErrorMessage('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
      <div className="min-h-screen bg-[#dfeef0] px-0 py-0 dark:bg-[#011b1b] relative">
        <div className="mx-auto flex h-screen w-full max-w-107.5 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),transparent_48%)] bg-[#dfeef0] text-[#121212] shadow-[0_25px_50px_rgba(15,32,35,0.12)] transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_36%)] dark:bg-[#011b1b] dark:text-white">
          <header className="flex items-center justify-between px-5 pt-5">
            <div className="flex-1 text-center">
              <h1 className="text-[28px] font-bold tracking-tight text-[#121212] dark:text-white">{t('yourCar')}</h1>
            </div>
            {/* Adăugat cursor-pointer pe butonul "X" din dreapta sus a paginii */}
            <button
                aria-label="Close"
                onClick={() => router.push(ROUTES.MANAGE_CAR)}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#121212] transition hover:scale-[1.02] hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
            >
              <X className="h-7 w-7" strokeWidth={2.2} />
            </button>
          </header>

          <main className="flex-1 px-4 pt-4">
            <div className="mb-4 flex justify-center">
              <button
                  type="button"
                  onClick={handlePhotoAreaClick}
                  className="group relative flex h-47.5 w-47.5 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-white/50 bg-[#e8e8e8] shadow-[inset_0_2px_10px_rgba(15,23,42,0.08),0_18px_34px_rgba(15,23,42,0.09)] transition-transform duration-200 hover:scale-[1.01] dark:bg-[#d7d7d7]"
                  aria-label="Upload car photo options"
              >
                <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                />

                {carImage ? (
                    <img src={carImage} alt="Uploaded car" className="h-full w-full object-cover" />
                ) : (
                    <div className="flex flex-col items-center justify-center gap-2 text-[#404b51] dark:text-[#1f2b2e]">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#404b51]/30 bg-white/15 shadow-sm dark:border-[#1f2b2e]/30">
                    <Upload className="h-6 w-6" strokeWidth={2.2} />
                  </span>
                      <span className="text-sm font-medium tracking-wide">{t('addPhoto')}</span>
                    </div>
                )}
              </button>
            </div>

            <div className="space-y-4 px-2 pb-6">
              <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                <label htmlFor="car-name" className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                  {t('carName')}
                </label>
                <input
                    id="car-name"
                    value={form.name}
                    onChange={(event) => updateField('name', event.target.value)}
                    placeholder={t('carName')}
                    className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-[18px] font-medium text-[#121212] outline-none placeholder:text-[#6f797d] dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-[#9db0b6]"
                />
              </div>

              <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                <label htmlFor="car-plate" className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                  {t('registrationPlate')}
                </label>
                <input
                    id="car-plate"
                    value={form.plate}
                    onChange={(event) => updateField('plate', event.target.value)}
                    placeholder="DT 123 RAL"
                    className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-[18px] font-medium text-[#121212] outline-none placeholder:text-[#6f797d] dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-[#9db0b6]"
                />
              </div>

              <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                <label htmlFor="car-model" className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                  {t('carModel')}
                </label>
                <input
                    id="car-model"
                    value={form.model}
                    onChange={(event) => updateField('model', event.target.value)}
                    placeholder="CarModel_a83"
                    className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-[18px] font-medium text-[#121212] outline-none placeholder:text-[#6f797d] dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-[#9db0b6]"
                />
              </div>

              <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <label className="text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                    {t('legalDocuments')}
                  </label>

                  {/* Containărul pentru butoanele din dreapta etichetei */}
                  <div className="flex items-center gap-2">
                    {/* Butonul "?" de ajutor */}
                    <button
                        type="button"
                        onClick={() => setIsHelpModalOpen(true)}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#1f2937]/15 bg-white/40 text-[#42565d] shadow-sm transition hover:-translate-y-0.5 hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:text-[#d6e7ea] dark:hover:bg-white/10"
                        aria-label={t('documentHelp')}
                    >
                      <CircleHelp className="h-4 w-4" strokeWidth={2.2} />
                    </button>

                    {/* Butonul de Upload PDF */}
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
                    onChange={handleDocumentChange}
                />

                <div className="flex min-h-12.5 items-center justify-between gap-2 rounded-xl border border-[#111827]/15 bg-white/50 px-3 py-2 text-[18px] text-[#121212] shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white">
                  {form.document ? (
                      <>
                        <span className="truncate pr-2">{form.document}</span>
                        <button
                            type="button"
                            onClick={handleDeleteDocument}
                            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-red-500/10 text-red-500 transition hover:bg-red-500 hover:text-white active:scale-95"
                            aria-label="Remove document"
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
          </main>

          <div className="px-4 pb-6 pt-2 mb-24">
            {errorMessage && (
                <div className="mb-3 rounded-lg bg-red-500/20 border border-red-500 px-4 py-2 text-red-700 dark:text-red-300 text-sm">
                  {errorMessage}
                </div>
            )}
            <button
                type="button"
                disabled={!canSubmit || isLoading}
                onClick={handleSubmit}
                className={`flex w-full cursor-pointer items-center justify-center rounded-2xl px-5 py-3.5 text-base font-semibold shadow-[0_16px_28px_rgba(15,76,129,0.28)] transition ${
                    canSubmit && !isLoading
                        ? 'bg-[#0f4c81] text-white hover:bg-[#0c3e67]'
                        : 'bg-[#0f4c81]/45 text-white cursor-not-allowed shadow-none'
                }`}
            >
              {isLoading ? 'Loading...' : t('addCar')}
            </button>
          </div>

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
                        onClick={() => { setActiveTab('car'); router.push(ROUTES.MANAGE_CAR); }}
                        className={`p-1.5 transition-all cursor-pointer rounded-full ${
                            activeTab === 'car' ? 'text-[#0f4c81] dark:text-[#2dd4bf] scale-110' : 'text-slate-500 dark:text-slate-400'
                        }`}
                    >
                        <Car className="w-6 h-6" strokeWidth={activeTab === 'car' ? 2.5 : 2} />
                    </button>
                </nav>
        </div>

        {/* Pop-up / Modal modern pentru opțiuni foto mașină */}
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
                  {t('editCarPhoto')}
                </h3>
                <p className="mt-1 text-sm text-[#404b51] dark:text-slate-400">
                  {t('whatWouldYouLikeToDo')}
                </p>

                <div className="mt-5 space-y-3">
                  <button
                      type="button"
                      onClick={() => {
                        setIsPhotoModalOpen(false);
                        photoInputRef.current?.click();
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

        {/* Pop-up / Modal explicativ pentru secțiunea Legal Documents */}
        {isHelpModalOpen && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
              <div className="relative w-full max-w-85 rounded-3xl bg-white/90 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/40 transition-colors duration-300 dark:bg-[#022525]/90 dark:border-white/5 text-center">
                <button
                    type="button"
                    onClick={() => setIsHelpModalOpen(false)}
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
                      onClick={() => setIsHelpModalOpen(false)}
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