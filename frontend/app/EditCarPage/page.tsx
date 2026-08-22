'use client';

import React from 'react';
import { CircleHelp, PencilLine, Search, Upload, X } from 'lucide-react';
import { ChangeEvent, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
export default function EditCarPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const [carImage, setCarImage] = useState<string | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<'name' | 'plate' | 'model' | 'document' | null>(null);
  const [values, setValues] = useState({
    name: 'Personal car name 2',
    plate: 'DT 123 RAL',
    model: 'CarModel_a83',
    document: 'Document.pdf',
  });

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
    setEditingField(null);
  };

  const startEditing = (key: 'name' | 'plate' | 'model' | 'document') => setEditingField(key);
  const finishEditing = () => setEditingField(null);

  const updateValue = (key: 'name' | 'plate' | 'model' | 'document', value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const textFieldItems = [
    { key: 'name', label: 'Name', value: values.name },
    { key: 'plate', label: 'Registration plate', value: values.plate },
    { key: 'model', label: 'Car model', value: values.model },
  ] as const;

  return (
      <div className="min-h-screen bg-[#dfeef0] px-0 py-0 dark:bg-[#011b1b] relative">
        <div className="mx-auto flex h-screen w-full max-w-107.5 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),transparent_48%)] bg-[#dfeef0] text-[#121212] shadow-[0_25px_50px_rgba(15,32,35,0.12)] transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_36%)] dark:bg-[#011b1b] dark:text-white">
          <header className="flex items-center justify-between px-5 pt-5">
            <div className="flex-1 text-center">
              <h1 className="text-[28px] font-bold tracking-tight text-[#121212] dark:text-white">Your car</h1>
            </div>
            <button
                aria-label="Close"
                onClick={() => router.push('/ManageCarPage')}
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

            <div className="px-2">
              {editingField === 'name' ? (
                  <div className="flex items-center gap-2">
                    <input
                        autoFocus
                        value={values.name}
                        onChange={(event) => updateValue('name', event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') finishEditing();
                        }}
                        className="w-full rounded-2xl border border-black/10 bg-white/40 px-3 py-2 text-[28px] font-bold tracking-tight text-[#111827] outline-none placeholder:text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    />
                    <button
                        type="button"
                        onClick={finishEditing}
                        className="rounded-full border border-black/10 bg-white/60 px-3 py-2 text-sm font-semibold text-[#111827] transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
                    >
                      Save
                    </button>
                  </div>
              ) : (
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-[28px] font-bold tracking-tight text-[#111827] dark:text-white">{values.name}</h2>
                    <button
                        type="button"
                        aria-label="Edit car name"
                        onClick={() => startEditing('name')}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#1f2937]/15 bg-white/40 text-[#1f2937] shadow-sm transition hover:-translate-y-0.5 hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                    >
                      <PencilLine className="h-4 w-4" strokeWidth={2.2} />
                    </button>
                  </div>
              )}
            </div>

            <div className="mt-5 space-y-4 px-2 pb-8">
              {textFieldItems.map(({ key, label, value }) => (
                  <div key={key} className="flex items-center justify-between gap-3 rounded-2xl border border-transparent px-1 py-1.5 transition-colors hover:border-black/5 dark:hover:border-white/5">
                    <div className="flex min-w-0 flex-1 items-center gap-2 text-[19px] leading-snug text-[#121212] dark:text-white">
                      {editingField === key ? (
                          <div className="flex w-full items-center gap-2">
                            <input
                                autoFocus
                                value={value}
                                onChange={(event) => updateValue(key, event.target.value)}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') finishEditing();
                                }}
                                className="w-full rounded-xl border border-black/10 bg-white/60 px-2 py-1.5 text-[18px] text-[#121212] outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                            />
                            <button
                                type="button"
                                onClick={finishEditing}
                                className="rounded-full border border-black/10 bg-white/60 px-2.5 py-1.5 text-xs font-semibold text-[#111827] dark:border-white/10 dark:bg-white/5 dark:text-white"
                            >
                              Save
                            </button>
                          </div>
                      ) : (
                          <>
                            <span className="shrink-0 font-medium">{label}:</span>
                            <span className="truncate font-normal">{value}</span>
                          </>
                      )}
                    </div>

                    {!editingField && (
                        <button
                            type="button"
                            aria-label={`Edit ${label}`}
                            onClick={() => startEditing(key)}
                            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#1f2937]/15 bg-white/40 text-[#1f2937] shadow-sm transition hover:-translate-y-0.5 hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                        >
                          <PencilLine className="h-4 w-4" strokeWidth={2.2} />
                        </button>
                    )}
                  </div>
              ))}

              <div className="flex items-center justify-between gap-3 rounded-2xl border border-transparent px-1 py-1.5 transition-colors hover:border-black/5 dark:hover:border-white/5">
                <div className="flex min-w-0 flex-1 items-center gap-2 text-[19px] leading-snug text-[#121212] dark:text-white">
                  <span className="shrink-0 font-medium">Legal documents:</span>
                  {editingField === 'document' ? (
                      <div className="flex w-full items-center gap-2">
                        {/* Butonul Upload - Aliniat stilistic la restul butoanelor tip pastilă (border, bg, hover effect) */}
                        <button
                            type="button"
                            onClick={() => documentInputRef.current?.click()}
                            className="flex h-8 items-center gap-1.5 rounded-full border border-[#1f2937]/15 bg-white/40 px-3 text-[14px] text-[#1f2937] shadow-sm cursor-pointer transition hover:-translate-y-0.5 hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                        >
                          <Upload className="h-3.5 w-3.5" strokeWidth={2.2} />
                          <span>Upload PDF</span>
                        </button>
                        <input
                            ref={documentInputRef}
                            type="file"
                            accept=".pdf,application/pdf"
                            className="hidden"
                            onChange={handleDocumentFileChange}
                        />
                        {/* Butonul Save - Aliniat stilistic */}
                        <button
                            type="button"
                            onClick={finishEditing}
                            className="flex h-8 items-center rounded-full border border-[#1f2937]/15 bg-white/40 px-3 text-[14px] font-medium text-[#1f2937] shadow-sm cursor-pointer transition hover:-translate-y-0.5 hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                        >
                          Save
                        </button>
                      </div>
                  ) : (
                      <div className="flex min-w-0 items-center gap-2 rounded-xl border border-[#111827]/20 bg-white/50 px-2 py-1 shadow-sm dark:border-white/10 dark:bg-white/5">
                        <span className="truncate text-[15px]">{values.document}</span>
                        <Search className="h-4 w-4 shrink-0 text-[#121212] dark:text-white" strokeWidth={2.2} />
                      </div>
                  )}
                </div>

                {!editingField && (
                    <div className="flex items-center gap-2">
                      <button
                          type="button"
                          onClick={() => setIsInfoModalOpen(true)}
                          aria-label="Open document info"
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#121212]/20 bg-white/40 text-[#121212] shadow-sm transition hover:-translate-y-0.5 hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                      >
                        <CircleHelp className="h-4 w-4" strokeWidth={2.2} />
                      </button>
                      <button
                          type="button"
                          aria-label="Edit legal documents"
                          onClick={() => startEditing('document')}
                          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#1f2937]/15 bg-white/40 text-[#1f2937] shadow-sm transition hover:-translate-y-0.5 hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                      >
                        <PencilLine className="h-4 w-4" strokeWidth={2.2} />
                      </button>
                    </div>
                )}
              </div>
            </div>
          </main>
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

        {/* Pop-up / Modal informativ pentru Legal Documents */}
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

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#111827]/5 text-[#111827] dark:bg-white/10 dark:text-white mb-3">
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
                      className="w-full py-3 px-4 cursor-pointer rounded-2xl bg-[#111827] text-white text-sm font-bold shadow-sm hover:bg-black transition active:scale-[0.98] dark:bg-white dark:text-[#011b1b] dark:hover:bg-slate-100"
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