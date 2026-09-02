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
        const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const response = await fetch(`${API}/api/cities`, {
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
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API}/api/spots`, {
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
      <div className="mx-auto flex h-screen w-full max-w-107.5 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),transparent_48%)] bg-[#dfeef0] text-[#121212] shad[...]">

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
                className="relative h-full w-full cursor-pointer overflow-hidden rounded-4xl border border-white/40 bg-[#cce5e7] shadow-md transition duration-200 hover:scale-[1.01] dark:border-w[...]"
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
                className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-[18px] font-medium text-[#121212] outline-none dark:border-white/10 dark:bg-white/5 dark:text-white [...]
              >
                {cities.map((city) => (
                  <option key={city.id} value={city.id} className="text-black bg-white">
                    {city.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Name */}
