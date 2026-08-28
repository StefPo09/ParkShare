'use client';

import React, { useMemo, useState } from 'react';
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

const initialProfile: ProfileState = {
  email: 'johndoe@gmail.com',
  phone: '+1 5551234567',
  country: 'United States',
  city: 'Boston',
  firstName: 'John',
  lastName: 'Doe',
};


const fieldIcons: Record<FieldKey, typeof Mail> = {
  email: Mail,
  phone: Phone,
  country: Globe,
  city: MapPin,
  firstName: UserRound,
  lastName: UserRound,
};

const avatarGradients = [
  'from-[#0f4c81] via-[#3d7cb3] to-[#9ad7db]',
  'from-[#0f7c67] via-[#2fb38d] to-[#b9eedb]',
  'from-[#b63636] via-[#e06b6b] to-[#fecaca]',
  'from-[#d98c1d] via-[#f5b939] to-[#fef3c7]',
  'from-[#c85d29] via-[#ef8e4f] to-[#fed7aa]',
  'from-[#6939b6] via-[#9063d7] to-[#ddd6fe]',
  'from-[#d84f8f] via-[#ec7abb] to-[#fbcfe8]',
] as const;

/* Country / flags / phone prefixes / city groups moved to separate files in the same folder.
   Files:
     - ./countries
     - ./phonePrefixes
     - ./cities
*/


const getAvatarGradient = (firstName: string, lastName: string) => {
  const source = `${firstName}${lastName}`.toLowerCase();
  let hash = 0;

  for (let i = 0; i < source.length; i += 1) {
    hash = source.charCodeAt(i) + ((hash << 5) - hash);
  }

  return avatarGradients[Math.abs(hash) % avatarGradients.length];
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
  const [savedProfile, setSavedProfile] = useState<ProfileState>(initialProfile);
  const [draftProfile, setDraftProfile] = useState<ProfileState>(initialProfile);
  const [editingField, setEditingField] = useState<FieldKey | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [phonePrefix, setPhonePrefix] = useState('+1');
  const [phoneDigits, setPhoneDigits] = useState('5551234567');
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
  const [activeTab, setActiveTab] = useState<'key' | 'home' | 'car'>('home');
  const { t } = useLanguage();

  const fieldLabels = React.useMemo(() => ({
    email: t('labelEmail'),
    phone: t('labelPhone'),
    country: t('labelCountry'),
    city: t('labelCity'),
    firstName: t('labelFirstName'),
    lastName: t('labelLastName'),
  }) as Record<FieldKey, string>, [t]);

  const avatarGradient = useMemo(
    () => getAvatarGradient(draftProfile.firstName, draftProfile.lastName),
    [draftProfile.firstName, draftProfile.lastName],
  );

  const initials = `${draftProfile.firstName?.[0] ?? ''}${draftProfile.lastName?.[0] ?? ''}`.toUpperCase();
  const hasUnsavedChanges = Object.values(changedFields).some(Boolean);
  const filteredCountryOptions = countryOptions.filter((country) =>
    country.toLowerCase().includes(countrySearch.toLowerCase()),
  );
  const filteredCityOptions = getCountryCityOptions(draftProfile.country).filter((city) =>
    city.toLowerCase().includes(citySearch.toLowerCase()),
  );

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
      const availableCities = getCountryCityOptions(draftProfile.country);
      const safeCity = availableCities.includes(draftProfile.city) ? draftProfile.city : (availableCities[0] ?? '');
      setTempValue(safeCity);
      return;
    }

    setTempValue(draftProfile[field]);
  };

  const resetPhoneEditing = () => {
    const previousPrefix = phoneCountryOptions.find((entry) => draftProfile.phone.startsWith(entry.code))?.code ?? '+1';
    setPhonePrefix(previousPrefix);
    setPhoneDigits(draftProfile.phone.replace(previousPrefix, '').replace(/\D/g, ''));
  };

  const commitEdit = (field: FieldKey) => {
    const previousValue = savedProfile[field];
    let nextValue = tempValue.trim();

    if (field === 'email') {
      if (!isValidEmail(nextValue)) {
        setFieldErrors((prev) => ({ ...prev, email: 'Please enter a valid email address.' }));
        return;
      }
    }

    if (field === 'phone') {
      const selectedMeta = getPhoneMeta(phonePrefix);
      const sanitized = phoneDigits.replace(/\D/g, '');
      const candidateValue = `${phonePrefix} ${sanitized}`;

      if (sanitized.length < selectedMeta.minLength || sanitized.length > selectedMeta.maxLength) {
        setFieldErrors((prev) => ({
          ...prev,
          phone: `This phone number must contain between ${selectedMeta.minLength} and ${selectedMeta.maxLength} digits for ${selectedMeta.country}.`,
        }));
        return;
      }

      nextValue = candidateValue;
    }

    if (field === 'country') {
      if (!countryOptions.includes(nextValue)) {
        setFieldErrors((prev) => ({ ...prev, country: 'Please choose a valid country.' }));
        return;
      }
      const cities = getCountryCityOptions(nextValue);
      if (cities[0]) {
        setDraftProfile((prev) => ({
          ...prev,
          country: nextValue,
          city: cities.includes(prev.city) ? prev.city : cities[0],
        }));
      }
    }

    if (field === 'city') {
      const cities = getCountryCityOptions(draftProfile.country);
      if (!cities.includes(nextValue)) {
        setFieldErrors((prev) => ({ ...prev, city: 'Please choose a valid city for the selected country.' }));
        return;
      }
    }

    if (field === 'firstName' || field === 'lastName') {
      if (!isValidName(nextValue)) {
        const fieldName = field === 'firstName' ? 'first name' : 'last name';
        setFieldErrors((prev) => ({ ...prev, [field]: `Please enter a valid ${fieldName} with letters only.` }));
        return;
      }
    }

    const isActualChange = nextValue !== previousValue;

    setDraftProfile((prev) => ({ ...prev, [field]: nextValue }));
    setChangedFields((prev) => ({ ...prev, [field]: isActualChange }));

    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setEditingField(null);
    setTempValue('');
    resetPhoneEditing();
  };

  const handleSaveChanges = () => {
    if (!hasUnsavedChanges) return;

    const updatedProfile = { ...savedProfile } as ProfileState;

    (Object.keys(changedFields) as FieldKey[]).forEach((field) => {
      if (changedFields[field]) {
        updatedProfile[field] = draftProfile[field];
      }
    });

    setSavedProfile(updatedProfile);
    setDraftProfile(updatedProfile);
    setChangedFields({
      email: false,
      phone: false,
      country: false,
      city: false,
      firstName: false,
      lastName: false,
    });
    setFieldErrors({});
    setShowSuccessModal(true);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
  };

  return (
    <div className="relative min-h-screen bg-[#dfeef0] px-0 py-0 text-[#121212] dark:bg-[#011b1b] dark:text-white">
      <div className="mx-auto flex h-screen w-full max-w-107.5 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),transparent_48%)] bg-[#dfeef0] text-[#121212] shadow-[0_25px_50px_rgba(15,32,35,0.12)] transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_36%)] dark:bg-[#011b1b] dark:text-white">
        <header className="flex items-center justify-between px-5 pt-5">
          <div className="flex-1 text-center">
            <h1 className="text-[28px] font-bold tracking-tight text-[#121212] dark:text-white">
            {t('account_settings_title')}
            </h1>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => router.back()}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#121212] transition hover:scale-[1.02] hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
          >
            <X className="h-7 w-7" strokeWidth={2.2} />
          </button>
        </header>

        <main className="flex-1 space-y-4 overflow-y-auto px-4 pb-28 pt-6 no-scrollbar">
          <div className="flex flex-col items-center pt-2">
            <div className="relative mb-4">
              <div className={`flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-white/50 shadow-[inset_0_2px_10px_rgba(15,23,42,0.08),0_18px_34px_rgba(15,23,42,0.09)] bg-gradient-to-br ${avatarGradient} text-white`}>
                <span className="text-2xl font-bold tracking-[0.12em] text-white">{initials}</span>
              </div>
            </div>

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
                <div
                  key={field}
                  className="flex items-center justify-between rounded-2xl border border-black/5 bg-white/20 px-3 py-3 shadow-[0_1px_0_rgba(0,0,0,0.02)] backdrop-blur-sm dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf3f7] text-[#0f4c81] dark:bg-[#062a2d] dark:text-[#7dd3fc]">
                      <Icon className="h-4 w-4" strokeWidth={2.2} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#42565d] dark:text-[#dfeef0]/75">
                        {fieldLabels[field]}
                      </p>

                      {isEditing ? (
                        <div className="mt-1 w-full">
                          {field === 'phone' ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-[38%_62%] gap-2">
                                <select
                                  value={phonePrefix}
                                  onChange={(e) => setPhonePrefix(e.target.value)}
                                  className="w-full rounded-lg border border-black/10 bg-white/80 px-2.5 py-1.5 text-[15px] font-medium text-[#121212] outline-none dark:border-white/10 dark:bg-[#021a1b] dark:text-white"
                                >
                                  {phoneCountryOptions.map((entry) => (
                                    <option key={`${entry.code}-${entry.country}`} value={entry.code}>
                                      {entry.flag} {entry.country} ({entry.code})
                                    </option>
                                  ))}
                                </select>

                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={phoneDigits}
                                  onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, '').slice(0, getPhoneMeta(phonePrefix).maxLength))}
                                  className="w-full rounded-lg border border-black/10 bg-white/80 px-2.5 py-1.5 text-[15px] font-medium text-[#121212] outline-none dark:border-white/10 dark:bg-[#021a1b] dark:text-white"
                                  placeholder={t('phone_number_label')}
                                />
                              </div>
                              {errorText && <p className="text-[11px] font-medium text-red-500">{errorText}</p>}
                            </div>
                          ) : field === 'country' ? (
                            <div className="space-y-2">
                              <div className="overflow-hidden rounded-lg border border-black/10 bg-white/80 shadow-inner dark:border-white/10 dark:bg-[#021a1b]">
                                <div className="border-b border-black/5 bg-white/60 p-1.5 dark:border-white/10 dark:bg-[#031d1d]">
                                  <input
                                    type="text"
                                    value={countrySearch}
                                    onChange={(e) => setCountrySearch(e.target.value)}
                                    placeholder={t('searchCountryPlaceholder')}
                                    className="w-full rounded-md bg-transparent px-2.5 py-2 text-[15px] font-medium text-[#121212] outline-none placeholder:text-[#6f797d] dark:text-white"
                                  />
                                </div>
                                <div className="max-h-52 overflow-y-auto p-1">
                                  {filteredCountryOptions.length > 0 ? (
                                    filteredCountryOptions.map((country) => (
                                      <button
                                        key={country}
                                        type="button"
                                        onClick={() => {
                                          const cities = getCountryCityOptions(country);
                                          const nextCity = cities.includes(draftProfile.city) ? draftProfile.city : cities[0] ?? draftProfile.city;

                                          setTempValue(country);
                                          setDraftProfile((prev) => ({
                                            ...prev,
                                            country,
                                            city: nextCity,
                                          }));
                                          setChangedFields((prev) => ({ ...prev, country: country !== savedProfile.country, city: nextCity !== savedProfile.city || prev.city }));
                                          setEditingField(null);
                                          setCountrySearch('');
                                        }}
                                        className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-[15px] font-medium transition ${
                                          tempValue === country
                                            ? 'bg-[#0f4c81]/10 text-[#0f4c81] dark:bg-[#7dd3fc]/10 dark:text-[#dff7ff]'
                                            : 'text-[#121212] hover:bg-[#0f4c81]/5 dark:text-white dark:hover:bg-white/5'
                                        }`}
                                      >
                                        <span className="flex items-center gap-2">
                                          <span>{getCountryFlag(country)}</span>
                                          <span>{country}</span>
                                        </span>
                                        {tempValue === country && <span className="text-xs font-bold">✓</span>}
                                      </button>
                                    ))
                                  ) : (
                                    <div className="px-2.5 py-3 text-sm text-slate-400">{t('noCountriesFound')}</div>
                                  )}
                                </div>
                              </div>
                              {errorText && <p className="text-[11px] font-medium text-red-500">{errorText}</p>}
                            </div>
                          ) : field === 'city' ? (
                            <div className="space-y-2">
                              <div className="overflow-hidden rounded-lg border border-black/10 bg-white/80 shadow-inner dark:border-white/10 dark:bg-[#021a1b]">
                                <div className="border-b border-black/5 bg-white/60 p-1.5 dark:border-white/10 dark:bg-[#031d1d]">
                                  <input
                                    type="text"
                                    value={citySearch}
                                    onChange={(e) => setCitySearch(e.target.value)}
                                    placeholder={t('searchCityPlaceholder')}
                                    className="w-full rounded-md bg-transparent px-2.5 py-2 text-[15px] font-medium text-[#121212] outline-none placeholder:text-[#6f797d] dark:text-white"
                                  />
                                </div>
                                <div className="max-h-52 overflow-y-auto p-1">
                                  {filteredCityOptions.length > 0 ? (
                                    filteredCityOptions.map((city) => (
                                      <button
                                        key={city}
                                        type="button"
                                        onClick={() => {
                                          setTempValue(city);
                                          setDraftProfile((prev) => ({ ...prev, city }));
                                          setChangedFields((prev) => ({ ...prev, city: city !== savedProfile.city }));
                                          setEditingField(null);
                                          setCitySearch('');
                                        }}
                                        className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-[15px] font-medium transition ${
                                          tempValue === city
                                            ? 'bg-[#0f4c81]/10 text-[#0f4c81] dark:bg-[#7dd3fc]/10 dark:text-[#dff7ff]'
                                            : 'text-[#121212] hover:bg-[#0f4c81]/5 dark:text-white dark:hover:bg-white/5'
                                        }`}
                                      >
                                        <span>{city}</span>
                                        {tempValue === city && <span className="text-xs font-bold">✓</span>}
                                      </button>
                                    ))
                                  ) : (
                                    <div className="px-2.5 py-3 text-sm text-slate-400">{t('noCitiesFound')}</div>
                                  )}
                                </div>
                              </div>
                              {errorText && <p className="text-[11px] font-medium text-red-500">{errorText}</p>}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={tempValue}
                                onChange={(e) => {
                                  const next = e.target.value;
                                  if (field === 'email') {
                                    setTempValue(next);
                                  } else if (field === 'firstName' || field === 'lastName') {
                                    setTempValue(next.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ' -]/g, ''));
                                  } else {
                                    setTempValue(next);
                                  }
                                }}
                                className="w-full rounded-lg border border-black/10 bg-white/80 px-2.5 py-1.5 text-[15px] font-medium text-[#121212] outline-none placeholder:text-[#6f797d] dark:border-white/10 dark:bg-[#021a1b] dark:text-white"
                                autoFocus
                              />
                              {errorText && <p className="text-[11px] font-medium text-red-500">{errorText}</p>}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="truncate text-[16px] font-semibold text-[#121212] dark:text-white">
                          {value}
                        </p>
                      )}
                    </div>
                  </div>

                  {isEditing && field !== 'country' && field !== 'city' ? (
                    <button
                      type="button"
                      onClick={() => commitEdit(field)}
                      className="ml-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#0f4c81] text-white transition hover:bg-[#0d3d68]"
                      aria-label={`Save ${fieldLabels[field]}`}
                    >
                      <Check className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                  ) : field === 'country' || field === 'city' ? (
                    isEditing ? null : (
                      <button
                        type="button"
                        onClick={() => beginEditing(field)}
                        className="ml-2 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#0f4c81]/20 bg-[#0f4c81]/5 px-2.5 py-1.5 text-[12px] font-semibold text-[#0f4c81] transition hover:bg-[#0f4c81]/10 dark:border-[#7dd3fc]/30 dark:bg-[#7dd3fc]/10 dark:text-[#dff7ff]"
                      >
                        <PencilLine className="h-3.5 w-3.5" strokeWidth={2.3} />
                        {t('change_label')}
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() => beginEditing(field)}
                      className="ml-2 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#0f4c81]/20 bg-[#0f4c81]/5 px-2.5 py-1.5 text-[12px] font-semibold text-[#0f4c81] transition hover:bg-[#0f4c81]/10 dark:border-[#7dd3fc]/30 dark:bg-[#7dd3fc]/10 dark:text-[#dff7ff]"
                    >
                      <PencilLine className="h-3.5 w-3.5" strokeWidth={2.3} />
                      {t('change_label')}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="rounded-[22px] border border-black/5 bg-white/20 p-3 dark:border-white/10 dark:bg-white/5">
            <div className="mb-2 flex items-center gap-2 px-1">
              <ShieldCheck className="h-5 w-5 text-[#0f4c81] dark:text-[#7dd3fc]" strokeWidth={2.2} />
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#42565d] dark:text-[#dfeef0]">
                Security
              </p>
            </div>

            <button
              type="button"
              className="group flex w-full cursor-pointer items-center justify-between rounded-2xl border border-black/10 bg-white/50 px-3 py-3 text-left transition hover:bg-white/70 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf3f7] text-[#0f4c81] dark:bg-[#062a2d] dark:text-[#7dd3fc]">
                  <Lock className="h-4 w-4" strokeWidth={2.2} />
                </div>
                <div>
                  <p className="text-[16px] font-semibold text-[#121212] dark:text-white">{t('password_label')}</p>
                  <p className="text-[12px] text-[#42565d] dark:text-[#dfeef0]/70">{t('update_login_password')}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:text-[#0f4c81] dark:group-hover:text-[#7dd3fc]" />
            </button>
          </div>

          {hasUnsavedChanges && (
            <button
              type="button"
              onClick={handleSaveChanges}
              className="w-full cursor-pointer rounded-2xl bg-[#0f4c81] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,76,129,0.24)] transition active:scale-[0.99]"
            >
              {t('saveChanges')}
            </button>
          )}
        </main>

        <nav className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-black/5 bg-[#dfeef0] py-4 dark:border-white/10 dark:bg-[#011b1b]">
          <button
            type="button"
            onClick={() => {
              setActiveTab('key');
              router.push(ROUTES.RENT);
            }}
            className={`cursor-pointer rounded-full p-1.5 transition-all ${
              activeTab === 'key' ? 'scale-110 text-[#0f4c81] dark:text-[#7dd3fc]' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Key className="h-6 w-6 -rotate-45" strokeWidth={activeTab === 'key' ? 2.5 : 2} />
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('home');
              router.push(ROUTES.HOME);
            }}
            className={`cursor-pointer rounded-full p-1.5 transition-all ${
              activeTab === 'home' ? 'scale-110 text-[#0f4c81] dark:text-[#7dd3fc]' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Home className="h-6 w-6" strokeWidth={activeTab === 'home' ? 2.5 : 2} />
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('car');
              router.push(ROUTES.MANAGE_CAR);
            }}
            className={`cursor-pointer rounded-full p-1.5 transition-all ${
              activeTab === 'car' ? 'scale-110 text-[#0f4c81] dark:text-[#7dd3fc]' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Car className="h-6 w-6" strokeWidth={activeTab === 'car' ? 2.5 : 2} />
          </button>
        </nav>
      </div>

      {showSuccessModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-70 rounded-2xl border border-black/5 bg-white/90 p-6 text-center shadow-xl dark:border-white/10 dark:bg-[#0a1d1d]">
            <div className="mb-3 flex justify-center">
              <CheckCircle2 className="h-12 w-12 text-[#0f4c81]" strokeWidth={2} />
            </div>

            <h3 className="mb-1 text-lg font-bold text-[#121212] dark:text-white">{t('success')}</h3>
            <p className="mb-5 text-[14px] text-[#42565d] dark:text-[#dfeef0]/80">{t('changesSaved')}</p>

            <button
              type="button"
              onClick={handleCloseSuccessModal}
              className="w-full cursor-pointer rounded-xl bg-[#0f4c81] px-2.5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.98]"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
