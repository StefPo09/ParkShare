'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '../../constants/routes';
import { getApiBaseUrl } from '../../constants/api';

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
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneCountryCode, setPhoneCountryCode] = useState('+40');
    const [phone, setPhone] = useState('');
    // State for country & city selection
    const [selectedCountry, setSelectedCountry] = useState<string>('Romania');
    const [selectedCity, setSelectedCity] = useState<string>(CITIES_BY_COUNTRY['Romania'][0]);

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

    // Automatically update cities dropdown when country changes
    const handleCountryChange = (country: string) => {
        setSelectedCountry(country);
        if (CITIES_BY_COUNTRY[country]) {
            setSelectedCity(CITIES_BY_COUNTRY[country][0]);
        }
    };

    const passwordsMatch = confirmPassword === '' || password === confirmPassword;
    const canSubmit =
        email.trim() !== '' &&
        firstName.trim() !== '' &&
        lastName.trim() !== '' &&
        phone.trim() !== '' &&
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
                    <div className="flex w-full rounded-xl border border-white/40 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#0F4C81]/40 transition">
                        <select
                            aria-label="Select country"
                            value={selectedCountry}
                            onChange={(e) => handleCountryChange(e.target.value)}
                            className="h-12 bg-white px-4 text-sm text-[#0B1C2C] font-medium outline-none cursor-pointer w-full"
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
                    <label className="font-medium text-sm text-[#0B1C2C]">City</label>
                    <div className="flex w-full rounded-xl border border-white/40 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#0F4C81]/40 transition">
                        <select
                            aria-label="Select city"
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                            className="h-12 bg-white px-4 text-sm text-[#0B1C2C] font-medium outline-none cursor-pointer w-full"
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
                    disabled={typeof window !== 'undefined' ? (!canSubmit || isSubmitting) : false}
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
