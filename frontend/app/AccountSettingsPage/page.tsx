'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ROUTES } from '../../constants/routes';
import {
  Car,
  Check,
  CheckCircle2,
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
import { countryOptions, countryFlags } from '../../data/address/countries';
import { useLanguage } from '../components/LanguageProvider';
import { phoneCountryOptions } from '../../data/address/phonePrefixes';
import { cityGroups } from '../../data/address/cities';

type FieldKey = 'email' | 'phone' | 'country' | 'city' | 'firstName' | 'lastName';
type ProfileState = Record<FieldKey, string>;

type CountryPhoneEntry = {
  country: string;
  flag: string;
  code: string;
  minLength: number;
  maxLength: number;
};

type ApiUser = {
  email: string;
  phone_country_code: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  first_name: string | null;
  last_name: string | null;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const emptyProfile: ProfileState = {
  email: '',
  phone: '',
  country: '',
  city: '',
  firstName: '',
  lastName: '',
};

const fieldIcons: Record<FieldKey, typeof Mail> = {
  email: Mail,
  phone: Phone,
  country: Globe,
  city: MapPin,
  firstName: UserRound,
  lastName: UserRound,
};

const isValidEmail = (value: string) => /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+(?:\.[a-zA-Z]{2,})?$/.test(value.trim());
const isValidName = (value: string) => /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/.test(value.trim());
const getCountryFlag = (country: string) => countryFlags[country] ?? '🌍';
const getCountryCityOptions = (country: string) => {
  const list = cityGroups[country] ?? [];
  return list.length ? list.slice().sort((a, b) => a.localeCompare(b)) : ['No cities available'];
};
const getPhoneMeta = (code: string) => phoneCountryOptions.find((entry) => entry.code === code) ?? phoneCountryOptions[0];

export default function AccountSettingsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [savedProfile, setSavedProfile] = useState<ProfileState>(emptyProfile);
  const [draftProfile, setDraftProfile] = useState<ProfileState>(emptyProfile);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [editingField, setEditingField] = useState<FieldKey | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [phonePrefix, setPhonePrefix] = useState('+1');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [changedFields, setChangedFields] = useState<Record<FieldKey, boolean>>({
    email: false,
    phone: false,
    country: false,
    city: false,
    firstName: false,
    lastName: false,
  });
  const [countrySearch, setCountrySearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'key' | 'home' | 'car'>('home');
  const [isLoading, setIsLoading] = useState(true);

  const fieldLabels = useMemo(() => ({
    email: t('labelEmail'),
    phone: t('labelPhone'),
    country: t('labelCountry'),
    city: t('labelCity'),
    firstName: t('labelFirstName'),
    lastName: t('labelLastName'),
  }) as Record<FieldKey, string>, [t]);

  const avatarGradient = useMemo(() => {
    const source = `${draftProfile.firstName}${draftProfile.lastName}`.toLowerCase();
    let hash = 0;
    for (let i = 0; i < source.length; i += 1) hash = source.charCodeAt(i) + ((hash << 5) - hash);
    return ['from-[#0f4c81] via-[#3d7cb3] to-[#9ad7db]', 'from-[#0f7c67] via-[#2fb38d] to-[#b9eedb]'][Math.abs(hash) % 2];
  }, [draftProfile.firstName, draftProfile.lastName]);

  const initials = `${draftProfile.firstName?.[0] ?? ''}${draftProfile.lastName?.[0] ?? ''}`.toUpperCase();
  const hasUnsavedChanges = Object.values(changedFields).some(Boolean);
  const filteredCountryOptions = countryOptions.filter((country) => country.toLowerCase().includes(countrySearch.toLowerCase()));
  const filteredCityOptions = getCountryCityOptions(draftProfile.country).filter((city) => city.toLowerCase().includes(citySearch.toLowerCase()));

  const loadProfilePicture = async () => {
    const res = await fetch(`${API_BASE_URL}/api/user/profile-picture/download`, { credentials: 'include' });
    if (!res.ok) return;
    const blob = await res.blob();
    setAvatarUrl(URL.createObjectURL(blob));
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, { credentials: 'include' });
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        if (!res.ok) throw new Error(`Unexpected status ${res.status}`);
        const data = await res.json();
        const u: ApiUser = data.user;
        const nextProfile: ProfileState = {
          email: u.email || '',
          phone: [u.phone_country_code, u.phone].filter(Boolean).join(' '),
          country: u.country || '',
          city: u.city || '',
          firstName: u.first_name || '',
          lastName: u.last_name || '',
        };
        if (cancelled) return;
        setSavedProfile(nextProfile);
        setDraftProfile(nextProfile);
        await loadProfilePicture();
      } catch (e) {
        console.error('Failed to load account settings:', e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const beginEditing = (field: FieldKey) => {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setEditingField(field);
    setCountrySearch('');
    setCitySearch('');

    if (field === 'phone') {
      const foundPrefix = phoneCountryOptions.find((entry) => draftProfile.phone.startsWith(entry.code));
      const selectedPrefix = foundPrefix?.code ?? '+1';
      const selectedNumber = draftProfile.phone.replace(selectedPrefix, '').replace(/\D/g, '');
      setPhonePrefix(selectedPrefix);
      setPhoneDigits(selectedNumber);
      return;
    }

    if (field === 'city') {
      const cities = getCountryCityOptions(draftProfile.country);
      setTempValue(cities.includes(draftProfile.city) ? draftProfile.city : (cities[0] ?? ''));
      return;
    }

    setTempValue(draftProfile[field]);
  };

  const commitEdit = async (field: FieldKey) => {
    const nextValue = tempValue.trim();
    let payload: Record<string, string> = {};

    if (field === 'email') {
      if (!isValidEmail(nextValue)) {
        setFieldErrors((prev) => ({ ...prev, email: 'Please enter a valid email address.' }));
        return;
      }
      payload = { email: nextValue };
    } else if (field === 'phone') {
      const meta = getPhoneMeta(phonePrefix);
      const sanitized = phoneDigits.replace(/\D/g, '');
      if (sanitized.length < meta.minLength || sanitized.length > meta.maxLength) {
        setFieldErrors((prev) => ({ ...prev, phone: `Use ${meta.minLength}-${meta.maxLength} digits for ${meta.country}.` }));
        return;
      }
      payload = { phone_country_code: phonePrefix, phone: sanitized };
    } else if (field === 'country') {
      if (!countryOptions.includes(nextValue)) {
        setFieldErrors((prev) => ({ ...prev, country: 'Please choose a valid country.' }));
        return;
      }
      const cities = getCountryCityOptions(nextValue);
      const nextCity = cities.includes(draftProfile.city) ? draftProfile.city : (cities[0] ?? '');
      payload = { country: nextValue, city: nextCity };
    } else if (field === 'city') {
      const cities = getCountryCityOptions(draftProfile.country);
      if (!cities.includes(nextValue)) {
        setFieldErrors((prev) => ({ ...prev, city: 'Please choose a valid city for the selected country.' }));
        return;
      }
      payload = { city: nextValue };
    } else {
      if (!isValidName(nextValue)) {
        setFieldErrors((prev) => ({ ...prev, [field]: `Please enter a valid ${field === 'firstName' ? 'first name' : 'last name'}.` }));
        return;
      }
      payload = { [field === 'firstName' ? 'first_name' : 'last_name']: nextValue };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/user/personal-details`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      const u: ApiUser = data.user;
      const nextProfile: ProfileState = {
        email: u.email || '',
        phone: [u.phone_country_code, u.phone].filter(Boolean).join(' '),
        country: u.country || '',
        city: u.city || '',
        firstName: u.first_name || '',
        lastName: u.last_name || '',
      };
      setSavedProfile(nextProfile);
      setDraftProfile(nextProfile);
      setChangedFields({ email: false, phone: false, country: false, city: false, firstName: false, lastName: false });
      setEditingField(null);
      setTempValue('');
      setShowSuccessModal(true);
    } catch (e) {
      console.error('Failed to save field:', e);
    }
  };

  const handleSaveChanges = async () => {
    const dirtyFields = (Object.keys(changedFields) as FieldKey[]).filter((field) => changedFields[field]);
    for (const field of dirtyFields) {
      setEditingField(field);
      setTempValue(draftProfile[field]);
      await commitEdit(field);
    }
    setShowSuccessModal(true);
  };

  const handleDeleteAvatar = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/profile-picture`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok && res.status !== 404) throw new Error('Delete failed');
      setAvatarUrl('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e) {
      console.error('Failed to delete profile picture:', e);
    }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('picture', file);
      const res = await fetch(`${API_BASE_URL}/api/user/profile-picture`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      await loadProfilePicture();
    } catch (err) {
      console.error('Failed to upload profile picture:', err);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/account`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Delete account failed');
      router.push('/login');
    } catch (e) {
      console.error('Failed to delete account:', e);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#dfeef0] dark:bg-[#011b1b]" />;
  }

  return (
    <div className="relative min-h-screen bg-[#dfeef0] px-0 py-0 text-[#121212] dark:bg-[#011b1b] dark:text-white">
      <div className="mx-auto flex h-screen w-full max-w-107.5 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),transparent_48%)] bg-[#dfeef0] text-[#121212] shadow-[0_25px_50px_rgba(15,32,35,0.12)] transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_36%)] dark:bg-[#011b1b] dark:text-white">
        <header className="flex items-center justify-between px-5 pt-5">
          <div className="flex-1 text-center">
            <h1 className="text-[28px] font-bold tracking-tight text-[#121212] dark:text-white">{t('account_settings_title')}</h1>
          </div>
          <button type="button" aria-label="Close" onClick={() => router.back()} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#121212] transition hover:scale-[1.02] hover:bg-black/5 dark:text-white dark:hover:bg-white/5">
            <X className="h-7 w-7" strokeWidth={2.2} />
          </button>
        </header>

        {showSuccessModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-70 rounded-2xl border border-black/5 bg-white/90 p-6 text-center shadow-xl dark:border-white/10 dark:bg-[#0a1d1d]">
              <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-[#0f4c81]" strokeWidth={2} />
              <h3 className="mb-1 text-lg font-bold text-[#121212] dark:text-white">{t('success')}</h3>
              <p className="mb-5 text-[14px] text-[#42565d] dark:text-[#dfeef0]/80">{t('changesSaved')}</p>
              <button type="button" onClick={() => setShowSuccessModal(false)} className="w-full rounded-xl bg-[#0f4c81] px-2.5 py-2.5 text-sm font-semibold text-white">
                OK
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 space-y-4 overflow-y-auto px-4 pb-28 pt-6 no-scrollbar">
          <div className="flex flex-col items-center pt-2">
            <div className="relative mb-4">
              <div className={`flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-white/50 bg-gradient-to-br ${avatarUrl ? 'bg-white' : avatarGradient} text-white shadow-[inset_0_2px_10px_rgba(15,23,42,0.08),0_18px_34px_rgba(15,23,42,0.09)]`}>
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Profile avatar" width={128} height={128} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold tracking-[0.12em] text-white">{initials}</span>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUploadAvatar} className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-white p-2 text-[#121212] shadow">
                <PencilLine className="h-4 w-4" />
              </button>
            </div>

            {avatarUrl && (
              <button type="button" onClick={() => setShowDeleteModal(true)} className="mb-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-red-500 px-3 py-1.5 text-xs font-semibold text-white">
                <X className="h-3.5 w-3.5" />
                Delete photo
              </button>
            )}

            <h2 className="text-[24px] font-bold tracking-tight text-[#121212] dark:text-white text-center leading-tight">
              {draftProfile.firstName} {draftProfile.lastName}
            </h2>
          </div>

          <div className="space-y-2.5">
            {(Object.keys(fieldLabels) as FieldKey[]).map((field) => {
              const Icon = fieldIcons[field];
              const isEditing = editingField === field;
              const value = draftProfile[field];
              const errorText = fieldErrors[field];

              return (
                <div key={field} className="flex items-center justify-between rounded-2xl border border-black/5 bg-white/20 px-3 py-3 shadow-[0_1px_0_rgba(0,0,0,0.02)] backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf3f7] text-[#0f4c81] dark:bg-[#062a2d] dark:text-[#7dd3fc]">
                      <Icon className="h-4 w-4" strokeWidth={2.2} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#42565d] dark:text-[#dfeef0]/75">{fieldLabels[field]}</p>
                      {isEditing ? (
                        <div className="mt-1 w-full">
                          {field === 'country' ? (
                            <div className="space-y-2">
                              <input value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} placeholder={t('searchCountryPlaceholder')} className="w-full rounded-lg border border-black/10 bg-white/80 px-2.5 py-1.5 text-[15px] font-medium text-[#121212]" />
                              <div className="max-h-52 overflow-y-auto rounded-lg border border-black/10 bg-white/80 p-1">
                                {filteredCountryOptions.map((country) => (
                                  <button key={country} type="button" onClick={() => { setTempValue(country); setDraftProfile((prev) => ({ ...prev, country })); setEditingField(null); setChangedFields((prev) => ({ ...prev, country: country !== savedProfile.country })); }} className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-[15px] font-medium">
                                    <span className="flex items-center gap-2"><span>{getCountryFlag(country)}</span><span>{country}</span></span>
                                    <span className="text-xs font-bold">✓</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : field === 'city' ? (
                            <div className="space-y-2">
                              <input value={citySearch} onChange={(e) => setCitySearch(e.target.value)} placeholder={t('searchCityPlaceholder')} className="w-full rounded-lg border border-black/10 bg-white/80 px-2.5 py-1.5 text-[15px] font-medium text-[#121212]" />
                              <div className="max-h-52 overflow-y-auto rounded-lg border border-black/10 bg-white/80 p-1">
                                {filteredCityOptions.map((city) => (
                                  <button key={city} type="button" onClick={() => { setTempValue(city); setDraftProfile((prev) => ({ ...prev, city })); setEditingField(null); setChangedFields((prev) => ({ ...prev, city: city !== savedProfile.city })); }} className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-[15px] font-medium">
                                    <span>{city}</span>
                                    <span className="text-xs font-bold">✓</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : field === 'phone' ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-[38%_62%] gap-2">
                                <select value={phonePrefix} onChange={(e) => setPhonePrefix(e.target.value)} className="w-full rounded-lg border border-black/10 bg-white/80 px-2.5 py-1.5 text-[15px] font-medium text-[#121212]">
                                  {phoneCountryOptions.map((entry) => (
                                    <option key={`${entry.code}-${entry.country}`} value={entry.code}>
                                      {entry.flag} {entry.country} ({entry.code})
                                    </option>
                                  ))}
                                </select>
                                <input value={phoneDigits} onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, '').slice(0, getPhoneMeta(phonePrefix).maxLength))} className="w-full rounded-lg border border-black/10 bg-white/80 px-2.5 py-1.5 text-[15px] font-medium text-[#121212]" />
                              </div>
                              {errorText && <p className="text-[11px] font-medium text-red-500">{errorText}</p>}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={tempValue}
                                onChange={(e) => setTempValue(field === 'firstName' || field === 'lastName' ? e.target.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ' -]/g, '') : e.target.value)}
                                className="w-full rounded-lg border border-black/10 bg-white/80 px-2.5 py-1.5 text-[15px] font-medium text-[#121212]"
                                autoFocus
                              />
                              {errorText && <p className="text-[11px] font-medium text-red-500">{errorText}</p>}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="truncate text-[16px] font-semibold text-[#121212] dark:text-white">{value}</p>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    field === 'country' || field === 'city' ? null : (
                      <button type="button" onClick={() => commitEdit(field)} className="ml-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#0f4c81] text-white" aria-label={`Save ${fieldLabels[field]}`}>
                        <Check className="h-4 w-4" strokeWidth={2.5} />
                      </button>
                    )
                  ) : (
                    <button type="button" onClick={() => beginEditing(field)} className="ml-2 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#cfe9f7] bg-gradient-to-r from-[#eef9ff] via-[#dff2ff] to-[#ffffff] px-2.5 py-1.5 text-[12px] font-semibold text-[#0f4c81] shadow-[0_6px_18px_rgba(59,130,246,0.14)] transition hover:brightness-[1.02] hover:shadow-[0_8px_22px_rgba(59,130,246,0.18)]">
                      <PencilLine className="h-3.5 w-3.5 text-[#3b82f6]" strokeWidth={2.3} />
                      {t('change_label')}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="rounded-[22px] border border-black/5 bg-white/20 p-3 dark:border-white/10 dark:bg-white/5">
            <button type="button" onClick={() => router.push(ROUTES.CHANGE_PASSWORD)} className="group flex w-full cursor-pointer items-center justify-between rounded-2xl border border-black/10 bg-white/50 px-3 py-3 text-left transition hover:bg-white/70 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf3f7] text-[#0f4c81] dark:bg-[#062a2d] dark:text-[#7dd3fc]">
                  <Lock className="h-4 w-4" strokeWidth={2.2} />
                </div>
                <div>
                  <p className="text-[16px] font-semibold text-[#121212] dark:text-white">{t('password_label')}</p>
                  <p className="text-[12px] text-[#42565d] dark:text-[#dfeef0]/70">{t('update_login_password')}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteAccountModal(true)}
              className="mt-3 flex w-full cursor-pointer items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-3 py-3 text-left transition hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/30 dark:hover:bg-red-950/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400">
                  <ShieldCheck className="h-4 w-4" strokeWidth={2.2} />
                </div>
                <div>
                  <p className="text-[16px] font-semibold text-red-700 dark:text-red-300">{t('deleteAccountTitle')}</p>
                  <p className="text-[12px] text-red-600/90 dark:text-red-300/80">{t('deleteAccountSubtitle')}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-red-400" />
            </button>
          </div>

          {hasUnsavedChanges && (
            <button type="button" onClick={handleSaveChanges} className="w-full cursor-pointer rounded-2xl bg-[#0f4c81] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,76,129,0.24)] transition active:scale-[0.99]">
              {t('saveChanges')}
            </button>
          )}
        </main>

        <nav className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-black/5 bg-[#dfeef0] py-4 dark:border-white/10 dark:bg-[#011b1b]">
          <button type="button" onClick={() => { setActiveTab('key'); router.push(ROUTES.RENT); }} className={`cursor-pointer rounded-full p-1.5 transition-all ${activeTab === 'key' ? 'scale-110 text-[#0f4c81] dark:text-[#7dd3fc]' : 'text-slate-500 dark:text-slate-400'}`}>
            <Key className="h-6 w-6 -rotate-45" strokeWidth={activeTab === 'key' ? 2.5 : 2} />
          </button>
          <button type="button" onClick={() => { setActiveTab('home'); router.push(ROUTES.HOME); }} className={`cursor-pointer rounded-full p-1.5 transition-all ${activeTab === 'home' ? 'scale-110 text-[#0f4c81] dark:text-[#7dd3fc]' : 'text-slate-500 dark:text-slate-400'}`}>
            <Home className="h-6 w-6" strokeWidth={activeTab === 'home' ? 2.5 : 2} />
          </button>
          <button type="button" onClick={() => { setActiveTab('car'); router.push(ROUTES.MANAGE_CAR); }} className={`cursor-pointer rounded-full p-1.5 transition-all ${activeTab === 'car' ? 'scale-110 text-[#0f4c81] dark:text-[#7dd3fc]' : 'text-slate-500 dark:text-slate-400'}`}>
            <Car className="h-6 w-6" strokeWidth={activeTab === 'car' ? 2.5 : 2} />
          </button>
        </nav>

        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-70 rounded-3xl bg-[#dfeef0] p-5 text-center shadow-xl dark:bg-[#0d2a24] border border-black/5 dark:border-white/10 animate-scale-in">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400">
                <X className="h-6 w-6" strokeWidth={2.2} />
              </div>
              <h3 className="text-lg font-bold tracking-tight text-[#121212] dark:text-white mb-1">
                {t('delete_photo_title')}
              </h3>
              <p className="text-xs font-medium text-[#42565d] dark:text-[#9db0b6] mb-5">
                {t('delete_photo_confirm')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 h-10 rounded-xl border border-black/10 text-sm font-semibold text-[#121212] dark:border-white/10 dark:text-white cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={async () => {
                    await handleDeleteAvatar();
                    setShowDeleteModal(false);
                  }}
                  className="flex-1 h-10 rounded-xl bg-red-500 text-sm font-semibold text-white cursor-pointer hover:bg-red-600 transition shadow-md shadow-red-500/20"
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeleteAccountModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-70 rounded-3xl bg-[#dfeef0] p-5 text-center shadow-xl dark:bg-[#0d2a24] border border-black/5 dark:border-white/10 animate-scale-in">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400">
                <ShieldCheck className="h-6 w-6" strokeWidth={2.2} />
              </div>
              <h3 className="text-lg font-bold tracking-tight text-[#121212] dark:text-white mb-1">
                {t('deleteAccountWarningTitle')}
              </h3>
              <p className="text-xs font-medium text-[#42565d] dark:text-[#9db0b6] mb-5">
                {t('deleteAccountWarningMessage')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteAccountModal(false)}
                  className="flex-1 h-10 rounded-xl border border-black/10 text-sm font-semibold text-[#121212] dark:border-white/10 dark:text-white cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={async () => {
                    setShowDeleteAccountModal(false);
                    await handleDeleteAccount();
                  }}
                  className="flex-1 h-10 rounded-xl bg-red-500 text-sm font-semibold text-white cursor-pointer hover:bg-red-600 transition shadow-md shadow-red-500/20"
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
