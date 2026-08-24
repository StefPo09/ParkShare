'use client';

import React, { useState, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '../../constants/routes';
import {
  X,
  PencilLine,
  Upload,
  CircleHelp,
  Key,
  Home,
  Car,
  ChevronDown
} from 'lucide-react';

export default function EditCarPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  // Stări pentru modul de editare și valorile mașinii[cite: 4]
  const [carImage, setCarImage] = useState<string | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const [values, setValues] = useState({
    name: 'Personal car name 2',
    plate: 'DT 123 RAL',
    model: 'sedan', // Aliniat cu optiunile din select
    document: 'Document.pdf',
  });

  // Stare pentru bara de navigare de jos
  const [activeTab, setActiveTab] = useState<'key' | 'home' | 'car'>('car');

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setCarImage(objectUrl);
    setIsPhotoModalOpen(false);
  };

  const handlePhotoAreaClick = () => {
    if (carImage) {
      setIsPhotoModalOpen(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleDeletePhoto = () => {
    setCarImage(null);
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

  const updateValue = (key: 'name' | 'plate' | 'model', value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleRemoveDocument = () => {
    setValues((current) => ({ ...current, document: '' }));
    if (documentInputRef.current) documentInputRef.current.value = '';
  };

  return (
      <div className="min-h-screen bg-[#dfeef0] px-0 py-0 dark:bg-[#011b1b] relative">
        <div className="mx-auto flex h-screen w-full max-w-107.5 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),transparent_48%)] bg-[#dfeef0] text-[#121212] shadow-[0_25px_50px_rgba(15,32,35,0.12)] transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_36%)] dark:bg-[#011b1b] dark:text-white">

          {/* --- Header --- */}
          <header className="flex items-center justify-between px-5 pt-5">
            <div className="flex-1 text-center">
              <h1 className="text-[28px] font-bold tracking-tight text-[#121212] dark:text-white">
                Your car
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

          {/* --- Main Content Area --- */}
          <main className="flex-1 px-4 pt-4 overflow-y-auto space-y-4 pb-24">

            {/* Zona Foto Cerc */}
            <div className="mb-4 flex justify-center">
              <button
                  type="button"
                  onClick={handlePhotoAreaClick}
                  className="group relative flex h-47.5 w-47.5 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-white/50 bg-[#e8e8e8] shadow-[inset_0_2px_10px_rgba(15,23,42,0.08),0_18px_34px_rgba(15,23,42,0.09)] transition-transform duration-200 hover:scale-[1.01] dark:bg-[#d7d7d7]"
                  aria-label="Car photo options"
              >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                />

                {carImage ? (
                    <img src={carImage} alt="Uploaded car" className="h-full w-full object-cover" />
                ) : (
                    <div className="flex flex-col items-center justify-center gap-2 text-[#404b51] dark:text-[#1f2b2e]">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#404b51]/30 bg-white/15 shadow-sm dark:border-[#1f2b2e]/30">
                    <Upload className="h-6 w-6" strokeWidth={2.2} />
                  </span>
                      <span className="text-sm font-medium tracking-wide">Add photo</span>
                    </div>
                )}
              </button>
            </div>

            {/* --- SECȚIUNEA FORMULAR (Stil Payment/AddCar) --- */}
            <div className="space-y-4 px-2">
              <h3 className="text-[13px] font-bold uppercase tracking-[0.15em] text-[#114B43] dark:text-[#2dd4bf] pl-1">
                Car specifications:
              </h3>

              {/* Câmp Car Name */}
              <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                <label htmlFor="car-name" className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                  Car Name
                </label>
                <input
                    id="car-name"
                    type="text"
                    value={values.name}
                    onChange={(e) => updateValue('name', e.target.value)}
                    placeholder="Personal car name"
                    className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-[18px] font-medium text-[#121212] outline-none placeholder:text-[#6f797d] dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-[#9db0b6]"
                />
              </div>

              {/* Câmp Registration Plate */}
              <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                <label htmlFor="car-plate" className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                  Registration plate
                </label>
                <input
                    id="car-plate"
                    type="text"
                    value={values.plate}
                    onChange={(e) => updateValue('plate', e.target.value)}
                    placeholder="B 123 ABC"
                    className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-[18px] font-medium text-[#121212] outline-none placeholder:text-[#6f797d] dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-[#9db0b6]"
                />
              </div>

              {/* Select Car Model */}
              <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                <label htmlFor="car-model" className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                  Car model
                </label>
                <div className="relative w-full">
                  <select
                      id="car-model"
                      value={values.model}
                      onChange={(e) => updateValue('model', e.target.value)}
                      className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-[18px] font-medium text-[#121212] outline-none appearance-none cursor-pointer dark:border-white/10 dark:bg-[#011b1b] dark:text-white"
                  >
                    <option value="" disabled hidden className="bg-white text-slate-400 dark:bg-[#011b1b] dark:text-slate-500">Car model...</option>
                    <option value="sedan" className="bg-white text-slate-900 dark:bg-[#011b1b] dark:text-white">Sedan</option>
                    <option value="suv" className="bg-white text-slate-900 dark:bg-[#011b1b] dark:text-white">SUV</option>
                    <option value="hatchback" className="bg-white text-slate-900 dark:bg-[#011b1b] dark:text-white">Hatchback</option>
                  </select>
                  <ChevronDown className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-[#42565d] dark:text-[#9db0b6] pointer-events-none" />
                </div>
              </div>

              {/* Câmp Legal Documents (PDF Upload) */}
              <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <label className="text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                    Legal documents
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
                      <span>Upload PDF</span>
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
                      <span className="truncate text-[#6f797d] dark:text-[#9db0b6]">No PDF document uploaded</span>
                  )}
                </div>
              </div>
            </div>

            {/* --- Buton Salvare Date --- */}
            <div className="px-2 pt-4">
              <button
                  type="button"
                  onClick={() => alert('Changes saved successfully!')}
                  className="flex w-full cursor-pointer items-center justify-center rounded-2xl bg-[#0f4c81] px-5 py-3.5 text-base font-semibold text-white shadow-[0_16px_28px_rgba(15,76,129,0.28)] transition hover:bg-[#0c3e67]"
              >
                Save Changes
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
                onClick={() => { setActiveTab('car'); router.push(ROUTES.EDIT_CAR); }}
                className={`p-1.5 transition-all cursor-pointer rounded-full ${
                    activeTab === 'car' ? 'text-[#0f4c81] dark:text-[#2dd4bf] scale-110' : 'text-slate-500 dark:text-slate-400'
                }`}
            >
              <Car className="w-6 h-6" strokeWidth={activeTab === 'car' ? 2.5 : 2} />
            </button>
          </nav>

        </div>

        {/* Pop-up modern pentru opțiuni foto mașină[cite: 4] */}
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
                  Edit car photo
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

        {/* Pop-up informativ pentru Legal Documents[cite: 4] */}
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
                  Please upload a PDF document representing the <span className="font-semibold text-black dark:text-white">proof of ownership of the car</span>.
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