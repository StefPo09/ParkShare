'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '../../constants/routes';
import { getApiBaseUrl } from '../../constants/api';
import { countryOptions, countryFlags } from '../../data/address/countries';
import { cityGroups, normalizeAddressSearch } from '../../data/address/cities';

const getCitiesForCountry = (country: string) =>
    (cityGroups[country] ?? []).slice().sort((a, b) => a.localeCompare(b));

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneCountryCode, setPhoneCountryCode] = useState('+40');
    const [phone, setPhone] = useState('');
    // State for country & city selection
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [countrySearch, setCountrySearch] = useState('');
    const [citySearch, setCitySearch] = useState('');
    const [isCountryOpen, setIsCountryOpen] = useState(false);
    const [isCityOpen, setIsCityOpen] = useState(false);

    // State for passwords
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // State for password visibility toggles
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const params = new URLSearchParams(window.location.search);
        const q = params.get('email') || params.get('signupEmail');
        const fromSession = sessionStorage.getItem('signupEmail') ?? '';

        const nextEmail = q || fromSession;
        if (nextEmail) {
            setEmail(nextEmail);
            if (!fromSession) {
                sessionStorage.setItem('signupEmail', nextEmail);
            }
        }
    }, []);

    const handleCountryChange = (country: string) => {
        setSelectedCountry(country);
        setSelectedCity('');
        setCitySearch('');
        setIsCountryOpen(false);
        setIsCityOpen(false);
    };

    const availableCities = getCitiesForCountry(selectedCountry);
    const filteredCountries = countryOptions.filter((country) =>
        normalizeAddressSearch(country).includes(normalizeAddressSearch(countrySearch.trim())),
    );
    const filteredCities = availableCities.filter((city) =>
        normalizeAddressSearch(city).includes(normalizeAddressSearch(citySearch.trim())),
    );

    const passwordsMatch = confirmPassword === '' || password === confirmPassword;
    const canSubmit =
        email.trim() !== '' &&
        firstName.trim() !== '' &&
        lastName.trim() !== '' &&
        phone.trim() !== '' &&
        selectedCountry !== '' &&
        selectedCity.trim() !== '' &&
        password.length >= 8 &&
        passwordsMatch;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit || isSubmitting) {
            return;
        }

        setError(null);
        setIsSubmitting(true);

        try {
            const API = getApiBaseUrl();
            const response = await fetch(`${API}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    email,
                    first_name: firstName,
                    last_name: lastName,
                    name: `${firstName} ${lastName}`.trim(),
                    password,
                    phone_country_code: phoneCountryCode,
                    phone,
                    country: selectedCountry,
                    city: selectedCity,
                }),
            });
            const isJson = response.headers.get('content-type')?.includes('application/json');
            const data = isJson ? await response.json() : null;

            if (!response.ok) {
                throw new Error(data?.error || 'The backend is unavailable. Please make sure it is running and try again.');
            }

            sessionStorage.removeItem('signupEmail');
            window.location.href = ROUTES.HOME;
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'Unable to connect to the backend.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="flex flex-1 flex-col items-center rounded-t-4xl px-6 pb-10 pt-8 mt-10 max-w-md mx-auto min-h-screen"
            style={{ background: 'linear-gradient(180deg, #B3E3DE 0%, #B6CDDA 100%)' }}
        >
            <div className="flex flex-col items-center mb-5 text-center">
                <p className="text-2xl font-semibold text-[#0B1C2C]">Create Account</p>
                <p className="text-sm font-regular text-[#0B1C2C]/80">
                    Complete all the fields below
                </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">

                {/* Email */}
                <div className="flex flex-col w-full gap-1">
                    <label className="font-medium text-sm text-[#0B1C2C]">Email</label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@domain.com"
                        className="h-12 w-full rounded-xl border border-white/40 bg-white px-4 text-sm text-[#0B1C2C] placeholder:text-[#8A97A0] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/40"
                    />
                </div>

                {/* First Name & Last Name */}
                <div className="flex w-full gap-3">
                    <div className="flex flex-col w-1/2 gap-1">
                        <label className="font-medium text-sm text-[#0B1C2C]">First Name</label>
                        <input
                            type="text"
                            required
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="e.g. John"
                            className="h-12 w-full rounded-xl border border-white/40 bg-white px-4 text-sm text-[#0B1C2C] placeholder:text-[#8A97A0] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/40"
                        />
                    </div>
                    <div className="flex flex-col w-1/2 gap-1">
                        <label className="font-medium text-sm text-[#0B1C2C]">Last Name</label>
                        <input
                            type="text"
                            required
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="e.g. Doe"
                            className="h-12 w-full rounded-xl border border-white/40 bg-white px-4 text-sm text-[#0B1C2C] placeholder:text-[#8A97A0] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/40"
                        />
                    </div>
                </div>

                {/* Phone Number */}
                <div className="flex flex-col w-full gap-1">
                    <label className="font-medium text-sm text-[#0B1C2C]">Phone Number</label>
                    <div className="flex w-full rounded-xl border border-white/40 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#0F4C81]/40 transition">
                        <select
                            aria-label="Select country code"
                            value={phoneCountryCode}
                            onChange={(e) => setPhoneCountryCode(e.target.value)}
                            className="h-12 bg-gray-50 border-r border-gray-200 px-3 text-sm text-[#0B1C2C] font-medium outline-none cursor-pointer hover:bg-gray-100 transition"
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
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="774 123 567"
                            className="h-12 w-full bg-transparent px-4 text-sm text-[#0B1C2C] placeholder:text-[#8A97A0] focus:outline-none"
                        />
                    </div>
                </div>

                {/* Country */}
                <div className="flex flex-col w-full gap-1">
                    <label className="font-medium text-sm text-[#0B1C2C]">Country</label>
                    <button
                        type="button"
                        aria-expanded={isCountryOpen}
                        onClick={() => setIsCountryOpen((open) => !open)}
                        className="flex h-12 w-full items-center justify-between rounded-xl border border-white/40 bg-white px-4 text-left text-sm font-medium text-[#0B1C2C] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/40"
                    >
                        <span>{selectedCountry ? `${countryFlags[selectedCountry] ?? '🌐'} ${selectedCountry}` : 'Select a country'}</span>
                        <span aria-hidden="true">{isCountryOpen ? '▴' : '▾'}</span>
                    </button>
                    {isCountryOpen && (
                        <div className="space-y-2">
                            <input
                                aria-label="Search countries"
                                value={countrySearch}
                                onChange={(e) => setCountrySearch(e.target.value)}
                                placeholder="Search countries"
                                className="h-12 w-full rounded-xl border border-white/40 bg-white px-4 text-sm font-medium text-[#0B1C2C] placeholder:text-[#42565d] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/40"
                            />
                            <div className="max-h-36 overflow-y-auto rounded-xl border border-white/40 bg-white/80 p-1">
                                {filteredCountries.map((country) => (
                                    <button
                                        key={country}
                                        type="button"
                                        aria-pressed={selectedCountry === country}
                                        onClick={() => {
                                            handleCountryChange(country);
                                            setCountrySearch('');
                                        }}
                                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-[#0B1C2C] hover:bg-[#0F4C81]/10 ${
                                            selectedCountry === country ? 'bg-[#0F4C81]/10 font-semibold text-[#0F4C81]' : ''
                                        }`}
                                    >
                                        <span>{countryFlags[country] ?? '🌐'} {country}</span>
                                        {selectedCountry === country && <span aria-hidden="true">✓</span>}
                                    </button>
                                ))}
                                {filteredCountries.length === 0 && (
                                    <p className="px-3 py-2 text-sm text-[#6f797d]">No matching countries.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* City (filtered by selected country) */}
                <div className="flex flex-col w-full gap-1">
                    <label className="font-medium text-sm text-[#0B1C2C]">
                        {selectedCountry ? `City in ${selectedCountry}` : 'City'}
                    </label>
                    {!selectedCountry ? (
                        <p className="rounded-xl border border-white/40 bg-white/60 px-4 py-3 text-sm text-[#6f797d]">
                            Select a country first.
                        </p>
                    ) : availableCities.length > 0 ? (
                        <>
                            <button
                                type="button"
                                aria-expanded={isCityOpen}
                                onClick={() => setIsCityOpen((open) => !open)}
                                className="flex h-12 w-full items-center justify-between rounded-xl border border-white/40 bg-white px-4 text-left text-sm font-medium text-[#0B1C2C] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/40"
                            >
                                <span>{selectedCity || `Select a city in ${selectedCountry}`}</span>
                                <span aria-hidden="true">{isCityOpen ? '▴' : '▾'}</span>
                            </button>
                            {isCityOpen && (
                                <div className="space-y-2">
                                    <input
                                        aria-label={`Search cities in ${selectedCountry}`}
                                        value={citySearch}
                                        onChange={(e) => setCitySearch(e.target.value)}
                                        placeholder={`Search cities in ${selectedCountry}`}
                                        className="h-12 w-full rounded-xl border border-white/40 bg-white px-4 text-sm font-medium text-[#0B1C2C] placeholder:text-[#42565d] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/40"
                                    />
                                    <div className="max-h-36 overflow-y-auto rounded-xl border border-white/40 bg-white/80 p-1">
                                        {filteredCities.map((city) => (
                                            <button
                                                key={city}
                                                type="button"
                                                aria-pressed={selectedCity === city}
                                                onClick={() => {
                                                    setSelectedCity(city);
                                                    setCitySearch('');
                                                    setIsCityOpen(false);
                                                }}
                                                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-[#0B1C2C] hover:bg-[#0F4C81]/10 ${
                                                    selectedCity === city ? 'bg-[#0F4C81]/10 font-semibold text-[#0F4C81]' : ''
                                                }`}
                                            >
                                                <span>{city}</span>
                                                {selectedCity === city && <span aria-hidden="true">✓</span>}
                                            </button>
                                        ))}
                                        {filteredCities.length === 0 && (
                                            <p className="px-3 py-2 text-sm text-[#6f797d]">No matching cities.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <input
                            type="text"
                            required
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                            placeholder={`Enter a city in ${selectedCountry}`}
                            className="h-12 w-full rounded-xl border border-white/40 bg-white px-4 text-sm text-[#0B1C2C] placeholder:text-[#8A97A0] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/40"
                        />
                    )}
                </div>

                {/* Password */}
                <div className="flex flex-col w-full gap-1">
                    <label className="font-medium text-sm text-[#0B1C2C]">Password</label>
                    <div className="relative flex items-center w-full">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="h-12 w-full rounded-xl border border-white/40 bg-white pl-4 pr-12 text-sm text-[#0B1C2C] placeholder:text-[#8A97A0] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/40"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            className="absolute right-4 text-[#0F4C81] hover:text-[#0B1C2C] transition cursor-pointer"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col w-full gap-1">
                    <label className="font-medium text-sm text-[#0B1C2C]">Confirm Password</label>
                    <div className="relative flex items-center w-full">
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
                            className={`h-12 w-full rounded-xl border bg-white pl-4 pr-12 text-sm text-[#0B1C2C] placeholder:text-[#8A97A0] focus:outline-none focus:ring-2 transition ${
                                !passwordsMatch
                                    ? 'border-red-500 focus:ring-red-500/40'
                                    : 'border-white/40 focus:ring-[#0F4C81]/40'
                            }`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                            className="absolute right-4 text-[#0F4C81] hover:text-[#0B1C2C] transition cursor-pointer"
                        >
                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    {!passwordsMatch && (
                        <span className="text-xs text-red-600 font-medium mt-0.5">
                            Passwords do not match!
                        </span>
                    )}
                </div>
                {password.length > 0 && password.length < 8 && (
                    <span className="text-xs text-red-600 font-medium -mt-3">
                        Password must be at least 8 characters.
                    </span>
                )}
                {error && (
                    <p role="alert" className="text-center text-sm text-red-600">
                        {error}
                    </p>
                )}
                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={!canSubmit || isSubmitting}
                    className="mt-4 h-12 w-full rounded-xl bg-[#0F4C81] text-white font-medium hover:bg-[#0B1C2C] transition shadow-md disabled:cursor-not-allowed disabled:bg-[#0F4C81]/45 cursor-pointer"
                >
                    {isSubmitting ? 'Creating account...' : 'Sign up'}
                </button>
                <a href={ROUTES.LOGIN} className="text-[#000000]/50 text-sm underline flex justify-end">
                    Already have an account?
                </a>
            </form>
        </div>
    );
}
