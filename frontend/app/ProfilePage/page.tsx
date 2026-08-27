'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ROUTES } from '../../constants/routes';
import { X, Pencil, ChevronRight, Check, User, Trash2, AlertCircle, Key, Home, Car } from 'lucide-react';

interface UserProfile {
  firstName: string;
  lastName: string;
  avatarUrl: string;
  username: string;
  birthDate: string;
  location: string;
  email: string;
  phone: string;
}

const DEFAULT_PROFILE: UserProfile = {
  firstName: 'Firstname',
  lastName: 'Lastname',
  avatarUrl: '',
  username: 'Username_App',
  birthDate: '2006-05-15',
  location: 'London, England',
  email: 'Firstname.business@gmail.com',
  phone: '1234567890',
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [editingField, setEditingField] = useState<'firstName' | 'lastName' | 'birthDate' | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'key' | 'home' | 'car' | null>(null);

  // Data curentă de referință în sistem (Anul 2026)
  const TODAY_STR = '2026-08-24';

  useEffect(() => {
    const savedData = localStorage.getItem('parkshare_user_profile');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (!parsed.birthDate) {
          parsed.birthDate = '2006-05-15';
        }
        setProfile(parsed);
      } catch (e) {
        console.error('Failed to parse profile data:', e);
      }
    }
  }, []);

  const calculateAge = (dateString: string): number => {
    if (!dateString) return 0;
    const today = new Date(TODAY_STR);
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Validări stări
  const userAge = editingField === 'birthDate' ? calculateAge(tempValue) : 0;
  const isUnderage = editingField === 'birthDate' && tempValue !== '' && userAge < 18;
  const isTooOld = editingField === 'birthDate' && tempValue !== '' && userAge > 120;
  const isInvalidDate = isUnderage || isTooOld;

  // Calculăm dinamic data minimă acceptată în calendar (Astăzi minus 120 de ani)
  const getMinDateAttribute = (): string => {
    const d = new Date(TODAY_STR);
    d.setFullYear(d.getFullYear() - 120);
    return d.toISOString().split('T')[0];
  };

  const saveProfileData = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    localStorage.setItem('parkshare_user_profile', JSON.stringify(updatedProfile));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const startEditing = (field: 'firstName' | 'lastName' | 'birthDate') => {
    setEditingField(field);
    setTempValue(profile[field]);
  };

  const handleSaveField = (field: 'firstName' | 'lastName' | 'birthDate') => {
    if (field === 'birthDate' && (calculateAge(tempValue) < 18 || calculateAge(tempValue) > 120)) {
      return;
    }
    const updated = { ...profile, [field]: tempValue };
    saveProfileData(updated);
    setEditingField(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: 'firstName' | 'lastName' | 'birthDate') => {
    if (e.key === 'Enter') {
      if (field === 'birthDate' && isInvalidDate) return;
      handleSaveField(field);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const updated = { ...profile, avatarUrl: base64String };
        saveProfileData(updated);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteImage = () => {
    const updated = { ...profile, avatarUrl: '' };
    saveProfileData(updated);
    setShowDeleteModal(false);
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return '';
    try {
      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('en-US', options);
    } catch {
      return dateString;
    }
  };

  return (
      <div className="min-h-screen bg-[#dfeef0] px-0 py-0 dark:bg-[#011b1b] relative">
        <div className="mx-auto flex h-screen w-full max-w-107.5 flex-col overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),transparent_48%)] bg-[#dfeef0] text-[#121212] shadow-[0_25px_50px_rgba(15,32,35,0.12)] transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_36%)] dark:bg-[#011b1b] dark:text-white pb-6">

          {/* --- Top Header Navigation --- */}
          <header className="flex items-center justify-between px-5 pt-5 pb-3 z-10">
            <div className="w-9" />
            <h1 className="text-[28px] font-bold tracking-tight text-[#121212] dark:text-white">
              Your Profile
            </h1>
            <button
                onClick={() => router.back()}
                aria-label="Close profile"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#121212] transition hover:scale-[1.02] hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
            >
              <X className="w-6 h-6" strokeWidth={2.2} />
            </button>
          </header>

          {/* Toast Notification */}
          {isSaved && (
              <div className="mx-5 mb-4 py-3 px-4 bg-emerald-600 dark:bg-emerald-700 text-white text-sm font-semibold rounded-2xl flex items-center justify-center space-x-2 shadow-lg animate-fade-in">
                <Check className="w-4 h-4" strokeWidth={2.5} />
                <span>Profile updated successfully!</span>
              </div>
          )}

          {/* --- Main Profile Section --- */}
          <main className="flex-1 px-6 pt-2 flex flex-col items-center">

            {/* Profile Avatar Container */}
            <div className="relative mb-4 group">
              {profile.avatarUrl && (
                  <button
                      onClick={() => setShowDeleteModal(true)}
                      aria-label="Delete profile picture"
                      className="absolute bottom-0 left-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white dark:bg-[#0d2a24] text-red-500 shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-black/5 dark:border-white/10 transition-transform active:scale-95 z-10"
                  >
                    <X className="w-5 h-5" strokeWidth={2.5} />
                  </button>
              )}

              <div className="w-32 h-32 rounded-full overflow-hidden bg-black/5 dark:bg-white/10 flex items-center justify-center border border-black/10 dark:border-white/10 shadow-md relative">
                {profile.avatarUrl ? (
                    <Image
                        src={profile.avatarUrl}
                        alt="User avatar"
                        fill
                        className="object-cover"
                    />
                ) : (
                    <User className="w-16 h-16 text-[#42565d] dark:text-[#9db0b6]" strokeWidth={1.5} />
                )}
              </div>

              <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
              />

              <button
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Upload profile picture"
                  className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white dark:bg-[#0d2a24] text-[#121212] dark:text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-black/5 dark:border-white/10 transition-transform active:scale-95 z-10"
              >
                <Pencil className="w-4 h-4" strokeWidth={2.2} />
              </button>
            </div>

            <h2 className="text-[24px] font-bold tracking-tight text-[#121212] dark:text-white text-center leading-tight">
              {profile.firstName} {profile.lastName}
            </h2>
            <p className="text-sm font-medium text-[#42565d] dark:text-[#9db0b6] mb-8">
              @{profile.username}
            </p>

            {/* --- Profile Fields List --- */}
            <div className="w-full space-y-4">

              {/* First Name */}
              <div className="flex flex-col justify-center min-h-18 px-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/5 backdrop-blur-xs">
                <div className="flex items-center justify-between w-full">
                  <div className="flex-1 pr-2">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-[#42565d] dark:text-[#9db0b6] mb-0.5">
                    First Name
                  </span>
                    {editingField === 'firstName' ? (
                        <div className="flex items-center space-x-2 mt-1 w-full">
                          <input
                              type="text"
                              value={tempValue}
                              onChange={(e) => setTempValue(e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, 'firstName')}
                              autoFocus
                              className="flex-1 h-9 px-3 text-sm rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 text-[#121212] dark:text-white focus:outline-none"
                          />
                          <button
                              onClick={() => handleSaveField('firstName')}
                              className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white cursor-pointer hover:bg-emerald-700 transition"
                          >
                            <Check className="w-4 h-4" strokeWidth={2.5} />
                          </button>
                        </div>
                    ) : (
                        <span className="text-base font-semibold text-[#121212] dark:text-white">
                      {profile.firstName}
                    </span>
                    )}
                  </div>
                  {editingField !== 'firstName' && (
                      <button
                          onClick={() => startEditing('firstName')}
                          aria-label="Edit first name"
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#42565d] dark:text-[#9db0b6] hover:bg-black/5 dark:hover:bg-white/5 transition"
                      >
                        <Pencil className="w-4 h-4" strokeWidth={2.2} />
                      </button>
                  )}
                </div>
              </div>

              {/* Last Name */}
              <div className="flex flex-col justify-center min-h-18 px-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/5 backdrop-blur-xs">
                <div className="flex items-center justify-between w-full">
                  <div className="flex-1 pr-2">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-[#42565d] dark:text-[#9db0b6] mb-0.5">
                    Last Name
                  </span>
                    {editingField === 'lastName' ? (
                        <div className="flex items-center space-x-2 mt-1 w-full">
                          <input
                              type="text"
                              value={tempValue}
                              onChange={(e) => setTempValue(e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, 'lastName')}
                              autoFocus
                              className="flex-1 h-9 px-3 text-sm rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 text-[#121212] dark:text-white focus:outline-none"
                          />
                          <button
                              onClick={() => handleSaveField('lastName')}
                              className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white cursor-pointer hover:bg-emerald-700 transition"
                          >
                            <Check className="w-4 h-4" strokeWidth={2.5} />
                          </button>
                        </div>
                    ) : (
                        <span className="text-base font-semibold text-[#121212] dark:text-white">
                      {profile.lastName}
                    </span>
                    )}
                  </div>
                  {editingField !== 'lastName' && (
                      <button
                          onClick={() => startEditing('lastName')}
                          aria-label="Edit last name"
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#42565d] dark:text-[#9db0b6] hover:bg-black/5 dark:hover:bg-white/5 transition"
                      >
                        <Pencil className="w-4 h-4" strokeWidth={2.2} />
                      </button>
                  )}
                </div>
              </div>

              {/* Date of Birth */}
              <div className="flex flex-col justify-center min-h-18 py-2 px-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/5 backdrop-blur-xs">
                <div className="flex items-center justify-between w-full">
                  <div className="flex-1 pr-2">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-[#42565d] dark:text-[#9db0b6] mb-0.5">
                    Date of Birth
                  </span>
                    {editingField === 'birthDate' ? (
                        <div className="flex flex-col w-full mt-1">
                          <div className="flex items-center space-x-2 w-full">
                            <input
                                type="date"
                                value={tempValue}
                                min={getMinDateAttribute()}
                                max={TODAY_STR}
                                onChange={(e) => setTempValue(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, 'birthDate')}
                                autoFocus
                                className="flex-1 h-9 px-3 text-sm rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 text-[#121212] dark:text-white focus:outline-none dark:scheme-dark"
                            />
                            <button
                                disabled={isInvalidDate}
                                onClick={() => handleSaveField('birthDate')}
                                className={`flex h-9 w-9 items-center justify-center rounded-lg text-white transition ${
                                    isInvalidDate
                                        ? 'bg-gray-300 dark:bg-zinc-700 cursor-not-allowed opacity-50'
                                        : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                                }`}
                            >
                              <Check className="w-4 h-4" strokeWidth={2.5} />
                            </button>
                          </div>

                          {/* Warning sub 18 ani */}
                          {isUnderage && (
                              <div className="flex items-center space-x-1 mt-2 text-red-500 dark:text-red-400 animate-fade-in">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-bold">You must be at least 18 years old to use ParkShare.</span>
                              </div>
                          )}

                          {/* Warning peste 120 ani */}
                          {isTooOld && (
                              <div className="flex items-center space-x-1 mt-2 text-red-500 dark:text-red-400 animate-fade-in">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-bold">Please enter a valid birth date.</span>
                              </div>
                          )}
                        </div>
                    ) : (
                        <span className="text-base font-semibold text-[#121212] dark:text-white">
                      {formatDateDisplay(profile.birthDate)} <span className="text-sm font-normal text-[#42565d] dark:text-[#9db0b6]">({calculateAge(profile.birthDate)} years old)</span>
                    </span>
                    )}
                  </div>
                  {editingField !== 'birthDate' && (
                      <button
                          onClick={() => startEditing('birthDate')}
                          aria-label="Edit birth date"
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#42565d] dark:text-[#9db0b6] hover:bg-black/5 dark:hover:bg-white/5 transition"
                      >
                        <Pencil className="w-4 h-4" strokeWidth={2.2} />
                      </button>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="flex flex-col justify-center h-18 px-4 rounded-2xl bg-white/20 dark:bg-white/2 border border-black/3 dark:border-white/2 opacity-75">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#6f797d] dark:text-[#6f797d] mb-0.5">
                Location
              </span>
                <span className="text-base font-medium text-[#121212] dark:text-white">
                {profile.location}
              </span>
              </div>

              {/* Email */}
              <div className="flex flex-col justify-center h-18 px-4 rounded-2xl bg-white/20 dark:bg-white/2 border border-black/3 dark:border-white/2 opacity-75 overflow-hidden">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#6f797d] dark:text-[#6f797d] mb-0.5">
                Email Address
              </span>
                <span className="text-base font-medium text-[#121212] dark:text-white truncate">
                {profile.email}
              </span>
              </div>

              {/* Phone Number */}
              <div className="flex flex-col justify-center h-18 px-4 rounded-2xl bg-white/20 dark:bg-white/2 border border-black/3 dark:border-white/2 opacity-75">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#6f797d] dark:text-[#6f797d] mb-0.5">
                Phone Number
              </span>
                <span className="text-base font-medium text-[#121212] dark:text-white">
                {profile.phone}
              </span>
              </div>

              {/* Account Settings */}
              <button onClick={() => router.push('/AccountSettingsPage')} aria-label="Open account settings" className="w-full flex items-center justify-between h-15 px-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/5 text-base font-bold text-[#121212] dark:text-white hover:bg-white/60 dark:hover:bg-white/10 transition duration-200 mt-2 cursor-pointer active:scale-[0.99]">
                <span>Account Settings</span>
                <ChevronRight className="w-5 h-5 text-[#42565d] dark:text-[#9db0b6]" strokeWidth={2.5} />
              </button>
            </div>
          </main>

          {/* --- Pop-up Modal pentru Ștergere --- */}
          {showDeleteModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
                <div className="w-full max-w-70 rounded-3xl bg-[#dfeef0] p-5 text-center shadow-xl dark:bg-[#0d2a24] border border-black/5 dark:border-white/10 animate-scale-in">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400">
                    <Trash2 className="h-6 w-6" strokeWidth={2.2} />
                  </div>
                  <h3 className="text-lg font-bold tracking-tight text-[#121212] dark:text-white mb-1">
                    Delete Photo?
                  </h3>
                  <p className="text-xs font-medium text-[#42565d] dark:text-[#9db0b6] mb-5">
                    Are you sure you want to remove your profile picture?
                  </p>
                  <div className="flex gap-3">
                    <button
                        onClick={() => setShowDeleteModal(false)}
                        className="flex-1 h-10 rounded-xl border border-black/10 text-sm font-semibold text-[#121212] dark:border-white/10 dark:text-white cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition"
                    >
                      Cancel
                    </button>
                    <button
                        onClick={handleDeleteImage}
                        className="flex-1 h-10 rounded-xl bg-red-500 text-sm font-semibold text-white cursor-pointer hover:bg-red-600 transition shadow-md shadow-red-500/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
          )}

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
      </div>
  );
}