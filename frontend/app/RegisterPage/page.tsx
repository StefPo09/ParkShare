'use client'

import { useState } from 'react';
import { Check, Eye, EyeOff, X } from 'lucide-react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import Image from "next/image";

// Country-to-cities dictionary
const CITIES_BY_COUNTRY: Record<string, string[]> = {
  Romania: ['Bucharest', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Brașov', 'Constanța'],
  UK: ['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Glasgow'],
  USA: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami'],
  Germany: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne'],
  France: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice'],
  Italy: ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo'],
  Spain: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza'],
};

export default function RegisterPage() {
  const router = useRouter();

  // State for text inputs
  const [fullName, setFullName] = useState('');
  const [hasFullNameBlurred, setHasFullNameBlurred] = useState(false);
  const [isFullNameFocused, setIsFullNameFocused] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  // State for country & city selection
  const [selectedCountry, setSelectedCountry] = useState<string>('Romania');
  const [selectedCity, setSelectedCity] = useState<string>(CITIES_BY_COUNTRY['Romania'][0]);

  // State for passwords
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // State for password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Automatically update cities dropdown when country changes
  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    if (CITIES_BY_COUNTRY[country]) {
      setSelectedCity(CITIES_BY_COUNTRY[country][0]);
    }
  };

  const passwordsMatch = confirmPassword === '' || password === confirmPassword;
  const isFullNameValid = fullName.trim().split(/[\s-]+/).filter(word => word.length > 0).length >= 2;
  const showFullNameWarning =
      hasFullNameBlurred &&
      !isFullNameFocused &&
      fullName.trim() !== '' &&
      !isFullNameValid;
  const passwordRequirements = [
    {
      label: 'At least 8 characters',
      isMet: password.length >= 8,
    },
    {
      label: 'One uppercase letter',
      isMet: /[A-Z]/.test(password),
    },
    {
      label: 'One lowercase letter',
      isMet: /[a-z]/.test(password),
    },
    {
      label: 'One symbol',
      isMet: /[^A-Za-z0-9]/.test(password),
    },
    {
      label: 'One number',
      isMet: /\d/.test(password),
    },
  ];
  const isPasswordValid = passwordRequirements.every((requirement) => requirement.isMet);

  const canSignUp =
      isFullNameValid &&
      phoneNumber.trim() !== '' &&
      selectedCountry.trim() !== '' &&
      selectedCity.trim() !== '' &&
      isPasswordValid &&
      confirmPassword.trim() !== '' &&
      password === confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSignUp) {
      return;
    }

    router.push('/HomePage');
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-white dark:bg-[#0B1C2C]">
      <div className="flex w-full max-w-sm flex-1 flex-col">
        {/* Logo + wordmark */}
        <div className="flex flex-col items-center pb-6 pt-12">
          <Image
            src="/Icon.svg"
            alt="Park | Share logo"
            width={120}
            height={100}
            className="h-28 w-auto"
            priority
          />
          <h1 className="mt-3 text-2xl font-bold tracking-tight">
            <span className="text-[#0F4C81] dark:text-white">Park</span>
            <span className="mx-2 text-[#0F4C81]/60 dark:text-white/60">|</span>
            <span className="text-[#04B697]">Share</span>
          </h1>
        </div>
        <div
            className="flex flex-1 flex-col items-center rounded-t-4xl px-6 pb-10 pt-8 bg-gradient-to-b from-[#B3E3DE] to-[#B6CDDA] dark:from-[#1A2B3A] dark:to-[#0F1C2D]"
        >
          <div className="flex flex-col items-center mb-5 text-center">
            <p className="text-2xl font-semibold text-[#0B1C2C] dark:text-white">Create Account</p>
            <p className="text-sm font-regular text-[#0B1C2C]/80 dark:text-white/80">
              Complete all the fields below
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">

            {/* Full Name */}
            <div className="flex flex-col w-full gap-1">
              <label className="font-medium text-sm text-[#0B1C2C] dark:text-white">Full Name</label>
              <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onFocus={() => setIsFullNameFocused(true)}
                  onBlur={() => {
                    setHasFullNameBlurred(true);
                    setIsFullNameFocused(false);
                  }}
                  placeholder="e.g. John Doe"
                  className={`h-12 w-full rounded-xl border bg-white px-4 text-sm text-[#0B1C2C] focus:outline-none focus:ring-2 transition dark:bg-[#1A2B3A] dark:text-white dark:border-white/20 ${
                      showFullNameWarning
                          ? 'border-red-500 focus:ring-red-500/40'
                          : 'border-white/40 focus:ring-[#0F4C81]/40'
                  }`}
              />
              {showFullNameWarning && (
                  <span className="text-xs text-red-600 font-medium mt-0.5 dark:text-red-400">
                Please enter your full name with at least first and last name.
              </span>
              )}
            </div>

            {/* Phone Number */}
            <div className="flex flex-col w-full gap-1">
              <label className="font-medium text-sm text-[#0B1C2C] dark:text-white">Phone Number</label>
              <div className="flex w-full rounded-xl border border-white/40 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#0F4C81]/40 transition dark:bg-[#1A2B3A] dark:border-white/20">
                <select
                    aria-label="Select country code"
                    defaultValue="+40"
                    className="h-12 bg-gray-50 border-r border-gray-200 px-3 text-sm text-[#0B1C2C] font-medium outline-none cursor-pointer hover:bg-gray-100 transition dark:bg-[#2A3B4A] dark:text-white dark:border-white/20"
                >
                  <option value="+40">🇷🇴 +40</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+49">🇩🇪 +49</option>
                  <option value="+33">🇫🇷 +33</option>
                  <option value="+39">🇮🇹 +39</option>
                  <option value="+34">🇪🇸 +34</option>
                </select>
                <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="774 123 567"
                    className="h-12 w-full bg-transparent px-4 text-sm text-[#0B1C2C] focus:outline-none dark:text-white"
                />
              </div>
            </div>

            {/* Country */}
            <div className="flex flex-col w-full gap-1">
              <label className="font-medium text-sm text-[#0B1C2C] dark:text-white">Country</label>
              <div className="flex w-full rounded-xl border border-white/40 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#0F4C81]/40 transition dark:bg-[#1A2B3A] dark:border-white/20">
                <select
                    aria-label="Select country"
                    value={selectedCountry}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="h-12 bg-white px-4 text-sm text-[#0B1C2C] font-medium outline-none cursor-pointer w-full dark:bg-[#1A2B3A] dark:text-white"
                >
                  <option value="Romania">Romania</option>
                  <option value="UK">United Kingdom</option>
                  <option value="USA">United States of America</option>
                  <option value="Germany">Germany</option>
                  <option value="France">France</option>
                  <option value="Italy">Italy</option>
                  <option value="Spain">Spain</option>
                </select>
              </div>
            </div>

            {/* City (Dynamic based on selected country) */}
            <div className="flex flex-col w-full gap-1">
              <label className="font-medium text-sm text-[#0B1C2C] dark:text-white">City</label>
              <div className="flex w-full rounded-xl border border-white/40 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#0F4C81]/40 transition dark:bg-[#1A2B3A] dark:border-white/20">
                <select
                    aria-label="Select city"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="h-12 bg-white px-4 text-sm text-[#0B1C2C] font-medium outline-none cursor-pointer w-full dark:bg-[#1A2B3A] dark:text-white"
                >
                  {CITIES_BY_COUNTRY[selectedCountry]?.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col w-full gap-1">
              <label className="font-medium text-sm text-[#0B1C2C] dark:text-white">Password</label>
              <div className="relative flex items-center w-full">
                <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-12 w-full rounded-xl border border-white/40 bg-white pl-4 pr-12 text-sm text-[#0B1C2C] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/40 dark:bg-[#1A2B3A] dark:text-white dark:border-white/20"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-4 text-[#0F4C81] hover:text-[#0B1C2C] transition cursor-pointer dark:text-white/80 dark:hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div className="mt-2 rounded-xl border border-white/50 bg-white/70 p-3 shadow-sm backdrop-blur-sm dark:bg-white/10 dark:border-white/20">
                <p className="mb-2 text-xs font-semibold text-[#0B1C2C] dark:text-white">
                  Password must include
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {passwordRequirements.map((requirement) => (
                      <div
                          key={requirement.label}
                          className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                              requirement.isMet
                                  ? 'bg-green-50 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                                  : 'bg-red-50 text-red-600 dark:bg-red-900/50 dark:text-red-400'
                          }`}
                      >
                        <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full ${
                                requirement.isMet
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                                    : 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'
                            }`}
                        >
                          {requirement.isMet ? <Check size={14} /> : <X size={14} />}
                        </span>
                        {requirement.label}
                      </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col w-full gap-1">
              <label className="font-medium text-sm text-[#0B1C2C] dark:text-white">Confirm Password</label>
              <div className="relative flex items-center w-full">
                <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className={`h-12 w-full rounded-xl border bg-white pl-4 pr-12 text-sm text-[#0B1C2C] focus:outline-none focus:ring-2 transition dark:bg-[#1A2B3A] dark:text-white dark:border-white/20 ${
                        !passwordsMatch
                            ? 'border-red-500 focus:ring-red-500/40'
                            : 'border-white/40 focus:ring-[#0F4C81]/40'
                    }`}
                />
                <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-4 text-[#0F4C81] hover:text-[#0B1C2C] transition cursor-pointer dark:text-white/80 dark:hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {!passwordsMatch && (
                  <span className="text-xs text-red-600 font-medium mt-0.5 dark:text-red-400">
                Passwords do not match!
              </span>
              )}
            </div>
            {/* Submit Button */}
            <button
                type="submit"
                disabled={!canSignUp}
                className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-[#0F4C81] text-white font-medium hover:bg-[#0B1C2C] transition shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#0F4C81]/45 disabled:hover:bg-[#0F4C81]/45 cursor-pointer"
            >
              Sign up
            </button>
            <Link
                href="/LoginPage"
                className="text-[#000000]/50 text-sm underline flex justify-end dark:text-white/80"
            >
              Already have an account?
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
