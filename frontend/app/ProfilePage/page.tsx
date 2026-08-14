'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Pencil, ChevronRight, Check, User } from 'lucide-react';

interface UserProfile {
  // Editable
  firstName: string;
  lastName: string;
  avatarUrl: string;
  // Non-editable
  username: string;
  age: string;
  location: string;
  email: string;
  phone: string;
}

const DEFAULT_PROFILE: UserProfile = {
  firstName: 'Firstname',
  lastName: 'Lastname',
  avatarUrl: '', // Uses default placeholder if empty
  username: 'Username_App',
  age: '20 years old',
  location: 'London, England',
  email: 'Firstname.business@gmail.com',
  phone: '1234567890',
};

interface ProfilePageProps {
  onBack?: () => void;
}

export default ({onBack}: ProfilePageProps) => {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [editingField, setEditingField] = useState<'firstName' | 'lastName' | 'avatar' | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Load saved profile data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('parkshare_user_profile');
    if (savedData) {
      try {
        setProfile(JSON.parse(savedData));
      } catch (e) {
        console.error('Failed to parse profile data:', e);
      }
    }
  }, []);

  // Save changes to state & localStorage
  const saveProfileData = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    localStorage.setItem('parkshare_user_profile', JSON.stringify(updatedProfile));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const startEditing = (field: 'firstName' | 'lastName' | 'avatar') => {
    setEditingField(field);
    if (field === 'avatar') {
      setTempValue(profile.avatarUrl);
    } else {
      setTempValue(profile[field]);
    }
  };

  const handleSaveField = (field: 'firstName' | 'lastName' | 'avatar') => {
    let updated: UserProfile;
    if (field === 'avatar') {
      updated = { ...profile, avatarUrl: tempValue };
    } else {
      updated = { ...profile, [field]: tempValue };
    }
    saveProfileData(updated);
    setEditingField(null);
  };

  return (
      <div className="relative flex flex-col h-screen w-full max-w-md mx-auto overflow-y-auto bg-[#D8F3ED] dark:bg-[#061512] text-[#0d3b36] dark:text-slate-100 font-sans transition-colors duration-300">

        {/* --- Top Header Navigation --- */}
        <header className="flex items-center justify-between px-5 py-5 sticky top-0 z-10 bg-[#D8F3ED] dark:bg-[#061512] transition-colors duration-300">
          <div className="w-6" /> {/* Spacer */}
          <h1 className="text-xl font-bold tracking-wide text-slate-800 dark:text-white">
            Your Profile
          </h1>
          <button
              onClick={onBack}
              aria-label="Close profile"
              className="p-1 hover:opacity-70 transition-opacity"
          >
            <X className="w-7 h-7 text-slate-700 dark:text-white" />
          </button>
        </header>

        {/* Toast Notification for Saved Changes */}
        {isSaved && (
            <div className="mx-5 mb-2 py-2 px-4 bg-emerald-600 text-white text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 shadow-md">
              <Check className="w-4 h-4" />
              <span>Profile updated!</span>
            </div>
        )}

        {/* --- Main Profile Section --- */}
        <main className="flex-1 px-6 pb-8 pt-2 flex flex-col items-center">

          {/* Profile Avatar Container */}
          <div className="relative mb-3">
            <div className="w-36 h-36 rounded-full overflow-hidden bg-slate-300 dark:bg-slate-700 flex items-center justify-center border-2 border-white/20 shadow-md">
              {profile.avatarUrl ? (
                  <Image
                      src={profile.avatarUrl}
                      alt="User avatar"
                      fill
                      className="object-cover"
                  />
              ) : (
                  <User className="w-24 h-24 text-slate-400 fill-slate-400" />
              )}
            </div>

            {/* Edit Avatar Pencil Button */}
            <button
                onClick={() => startEditing('avatar')}
                aria-label="Edit avatar URL"
                className="absolute bottom-1 right-1 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white shadow hover:scale-105 transition-transform"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>

          {/* Name and Username Display */}
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center">
            {profile.firstName} {profile.lastName}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-8">
            {profile.username}
          </p>

          {/* Avatar URL Edit Modal / Inline Drawer */}
          {editingField === 'avatar' && (
              <div className="w-full mb-6 p-3 bg-white/70 dark:bg-[#0d2a24] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-medium mb-1 text-slate-600 dark:text-slate-300">
                  Avatar Image URL:
                </label>
                <div className="flex space-x-2">
                  <input
                      type="text"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#061512] text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                  <button
                      onClick={() => handleSaveField('avatar')}
                      className="px-3 py-1.5 text-xs bg-[#0A4B75] dark:bg-[#0284c7] text-white font-semibold rounded-lg"
                  >
                    Save
                  </button>
                </div>
              </div>
          )}

          {/* --- Profile Fields List --- */}
          <div className="w-full space-y-5 text-sm">

            {/* First Name (Editable) */}
            <div className="flex items-center justify-between py-1 border-b border-slate-200/50 dark:border-slate-800/60">
              <div className="flex-1">
                {editingField === 'firstName' ? (
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">First Name:</span>
                      <input
                          type="text"
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          className="px-2 py-1 text-sm rounded bg-white dark:bg-[#061512] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none"
                      />
                      <button
                          onClick={() => handleSaveField('firstName')}
                          className="p-1 text-xs bg-teal-600 text-white rounded"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                ) : (
                    <span className="font-semibold text-[#114B43] dark:text-[#38bdf8]">
                  First Name: <span className="font-normal text-slate-800 dark:text-slate-200">{profile.firstName}</span>
                </span>
                )}
              </div>
              {editingField !== 'firstName' && (
                  <button
                      onClick={() => startEditing('firstName')}
                      aria-label="Edit first name"
                      className="p-1 text-slate-600 dark:text-slate-300 hover:opacity-70 transition-opacity"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
              )}
            </div>

            {/* Last Name (Editable) */}
            <div className="flex items-center justify-between py-1 border-b border-slate-200/50 dark:border-slate-800/60">
              <div className="flex-1">
                {editingField === 'lastName' ? (
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Last Name:</span>
                      <input
                          type="text"
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          className="px-2 py-1 text-sm rounded bg-white dark:bg-[#061512] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none"
                      />
                      <button
                          onClick={() => handleSaveField('lastName')}
                          className="p-1 text-xs bg-teal-600 text-white rounded"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                ) : (
                    <span className="font-semibold text-[#114B43] dark:text-[#38bdf8]">
                  Last Name: <span className="font-normal text-slate-800 dark:text-slate-200">{profile.lastName}</span>
                </span>
                )}
              </div>
              {editingField !== 'lastName' && (
                  <button
                      onClick={() => startEditing('lastName')}
                      aria-label="Edit last name"
                      className="p-1 text-slate-600 dark:text-slate-300 hover:opacity-70 transition-opacity"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
              )}
            </div>

            {/* Age (Read Only) */}
            <div className="flex items-center justify-between py-1 border-b border-slate-200/50 dark:border-slate-800/60 opacity-80">
            <span className="font-semibold text-[#114B43] dark:text-[#38bdf8]">
              Age: <span className="font-normal text-slate-800 dark:text-slate-200">{profile.age}</span>
            </span>
              <span className="text-[#114B43] dark:text-[#38bdf8] cursor-not-allowed">
              <Pencil className="w-4 h-4 opacity-40" />
            </span>
            </div>

            {/* Location (Read Only) */}
            <div className="flex items-center justify-between py-1 border-b border-slate-200/50 dark:border-slate-800/60 opacity-80">
            <span className="font-semibold text-[#114B43] dark:text-[#38bdf8]">
              Location: <span className="font-normal text-slate-800 dark:text-slate-200">{profile.location}</span>
            </span>
              <span className="text-[#114B43] dark:text-[#38bdf8] cursor-not-allowed">
              <Pencil className="w-4 h-4 opacity-40" />
            </span>
            </div>

            {/* Email (Read Only) */}
            <div className="flex items-center justify-between py-1 border-b border-slate-200/50 dark:border-slate-800/60 opacity-80">
            <span className="font-semibold text-[#114B43] dark:text-[#38bdf8] truncate pr-2">
              Email: <span className="font-normal text-slate-800 dark:text-slate-200">{profile.email}</span>
            </span>
              <span className="text-[#114B43] dark:text-[#38bdf8] cursor-not-allowed">
              <Pencil className="w-4 h-4 opacity-40" />
            </span>
            </div>

            {/* Phone Number (Read Only) */}
            <div className="flex items-center justify-between py-1 border-b border-slate-200/50 dark:border-slate-800/60 opacity-80">
            <span className="font-semibold text-[#114B43] dark:text-[#38bdf8]">
              Phone Number: <span className="font-normal text-slate-800 dark:text-slate-200">{profile.phone}</span>
            </span>
              <span className="text-[#114B43] dark:text-[#38bdf8] cursor-not-allowed">
              <Pencil className="w-4 h-4 opacity-40" />
            </span>
            </div>

            {/* Account Settings Option */}
            <button className="w-full flex items-center justify-between py-3 font-bold text-slate-900 dark:text-white hover:opacity-80 transition-opacity pt-4">
              <span>Account Settings</span>
              <ChevronRight className="w-5 h-5 text-slate-900 dark:text-white" />
            </button>
          </div>
        </main>
      </div>
  );
}