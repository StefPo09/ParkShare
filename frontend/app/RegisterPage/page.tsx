'use client';

import React from 'react';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!passwordsMatch) {
            alert('Passwords do not match!');
            return;
        }
        console.log('Form submitted successfully!');
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

                {/* Full Name */}
                <div className="flex flex-col w-full gap-1">
                    <label className="font-medium text-sm text-[#0B1C2C]">Full Name</label>
                    <input
                        type="text"
                        required
                        placeholder="e.g. John Doe"
                        className="h-12 w-full rounded-xl border border-white/40 bg-white px-4 text-sm text-[#0B1C2C] placeholder:text-[#8A97A0] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/40"
                    />
                </div>

                {/* Phone Number */}
                <div className="flex flex-col w-full gap-1">
                    <label className="font-medium text-sm text-[#0B1C2C]">Phone Number</label>
                    <div className="flex w-full rounded-xl border border-white/40 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#0F4C81]/40 transition">
                        <select
                            aria-label="Select country code"
                            defaultValue="+40"
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
                            className="absolute right-4 text-[#0F4C81] hover:text-[#0B1C2C] transition"
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
                            className="absolute right-4 text-[#0F4C81] hover:text-[#0B1C2C] transition"
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
                {/* Submit Button */}
                <button
                    type="submit"
                    className="mt-4 h-12 w-full rounded-xl bg-[#0F4C81] text-white font-medium hover:bg-[#0B1C2C] transition shadow-md"
                >
                    Sign up
                </button>
                <a href={ROUTES.LOGIN} className="text-[#000000]/50 text-sm underline flex justify-end">
                    Already have an account?
                </a>
            </form>
        </div>
    );
}