'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Elements } from '@stripe/react-stripe-js';
import type { Appearance } from '@stripe/stripe-js';
import { stripePromise } from '../../lib/stripe';
import { CheckoutForm } from '../components/StripePayment';
import { ROUTES } from '../../constants/routes';
import {
    X,
    ChevronRight,
    ChevronDown,
    CircleHelp,
    Key,
    Home,
    Car,
    Plus,
} from 'lucide-react';

interface CarItem {
    id: number;
    brand: string;
    model: string;
    license_plate: string;
    year?: number;
    color?: string;
    image_url?: string | null;
}

const carModelOptions = [
    { value: 'sedan', label: 'Sedan' },
    { value: 'suv', label: 'SUV' },
    { value: 'hatchback', label: 'Hatchback' },
    { value: 'coupe', label: 'Coupe' },
    { value: 'wagon', label: 'Wagon' },
    { value: 'convertible', label: 'Convertible' },
    { value: 'minivan', label: 'Minivan' },
    { value: 'pickup', label: 'Pickup Truck' },
    { value: 'electric', label: 'Electric / EV' },
];

export default function PaymentPage() {
    const router = useRouter();
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const [activeTab, setActiveTab] = useState<'key' | 'home' | 'car'>('home');

    const [plate, setPlate] = useState('');
    const [carModel, setCarModel] = useState('');
    const [isCarModelOpen, setIsCarModelOpen] = useState(false);
    
    const [userCars, setUserCars] = useState<CarItem[]>([]);
    const [showCarsModal, setShowCarsModal] = useState(false);
    const [isLoadingCars, setIsLoadingCars] = useState(false);
    
    const [showHelpModal, setShowHelpModal] = useState(false);

    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [rentalDateTime, setRentalDateTime] = useState('');

    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = mounted && resolvedTheme === 'dark';

    useEffect(() => {
        fetch('/api/create-payment-intent', {
            method: 'POST',
        })
            .then((res) => res.json())
            .then((data) => setClientSecret(data.clientSecret))
            .catch((err) =>
                console.error('Failed to create payment intent:', err)
            );
    }, []);

    const fetchUserCars = async () => {
        setIsLoadingCars(true);
        try {
            const res = await fetch(`${API}/api/cars`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setUserCars(data.cars || []);
            }
        } catch (err) {
            console.error('Failed to fetch user cars:', err);
        } finally {
            setIsLoadingCars(false);
        }
    };

    useEffect(() => {
        fetchUserCars();
    }, [API]);

    const isCarInfoValid = plate.trim() !== '' && carModel !== '';

    const handleUseOwnCarClick = () => {
        fetchUserCars();
        setShowCarsModal(true);
    };

    const handleSelectCar = (car: CarItem) => {
        setPlate(car.license_plate);
        setCarModel(car.model);
        setShowCarsModal(false);
    };

    const handlePaymentSuccess = () => {
        router.push(ROUTES.SUCCESS_PAYMENT);
    };

    // Minimum date/time = current date/time
    const getMinDateTime = () => {
        const now = new Date();

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const appearance: Appearance = {
        theme: isDark ? 'night' : 'stripe',
        variables: {
            colorPrimary: isDark ? '#2dd4bf' : '#0f4c81',
            colorBackground: isDark ? '#011b1b' : '#dfeef0',
            colorText: isDark ? '#ffffff' : '#121212',
            colorTextSecondary: isDark ? '#ffffff' : '#42565d',
            colorTextPlaceholder: isDark ? '#9db0b6' : '#6f797d',
            colorDanger: '#ef4444',
            fontFamily: '"Your-App-Font", system-ui, sans-serif',
            fontSizeBase: '18px',
            fontWeightNormal: '500',
            spacingUnit: '4px',
            borderRadius: '12px',
        },
        rules: {
            '.Input': {
                border: isDark
                    ? '1px solid rgba(255,255,255,0.1)'
                    : '1px solid rgba(0,0,0,0.1)',
                backgroundColor: isDark
                    ? 'rgba(255,255,255,0.05)'
                    : 'rgba(255,255,255,0.6)',
                boxShadow: 'none',
                padding: '10px 12px',
            },
            '.Input:focus': {
                border: `1px solid ${isDark ? '#2dd4bf' : '#0f4c81'}`,
                boxShadow: `0 0 0 1px ${
                    isDark ? '#2dd4bf' : '#0f4c81'
                }`,
            },
            '.Label': {
                fontSize: '12px',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: '4px',
                color: isDark ? '#ffffff' : undefined,
            },
            '.Tab': {
                border: isDark
                    ? '1px solid rgba(255,255,255,0.1)'
                    : '1px solid rgba(0,0,0,0.1)',
                borderRadius: '12px',
                backgroundColor: isDark
                    ? 'rgba(255,255,255,0.05)'
                    : 'rgba(255,255,255,0.6)',
            },
            '.Tab--selected': {
                border: `1px solid ${isDark ? '#2dd4bf' : '#0f4c81'}`,
                backgroundColor: isDark
                    ? 'rgba(45,212,191,0.08)'
                    : 'rgba(15,76,129,0.05)',
            },
            '.TabLabel': {
                color: isDark ? '#ffffff' : undefined,
            },
        },
    };

    if (!mounted) {
        return null;
    }

    const selectedCarModelLabel =
        carModelOptions.find((opt) => opt.value === carModel.toLowerCase())?.label || carModel;

    return (
        <div className="relative min-h-screen bg-[#dfeef0] px-0 py-0 dark:bg-[#011b1b]">
            <div
                className="
                    mx-auto flex h-screen w-full max-w-107.5 flex-col
                    overflow-hidden
                    bg-[#dfeef0]
                    text-[#121212]
                    shadow-[0_25px_50px_rgba(15,32,35,0.12)]
                    transition-colors duration-300
                    dark:bg-[#011b1b] dark:text-white
                "
            >
                <header className="flex items-center justify-between px-5 pt-5">
                    <div className="flex-1 text-center">
                        <h1 className="text-[28px] font-bold tracking-tight text-[#121212] dark:text-white">
                            Rent parking spot
                        </h1>
                    </div>

                    <button
                        type="button"
                        aria-label="Close"
                        onClick={() => router.push(ROUTES.RENT)}
                        className="
                            flex h-9 w-9 cursor-pointer items-center
                            justify-center rounded-full
                            text-[#121212]
                            transition hover:scale-[1.02]
                            hover:bg-black/5
                            dark:text-white dark:hover:bg-white/5
                        "
                    >
                        <X className="h-7 w-7" strokeWidth={2.2} />
                    </button>
                </header>

                <div className="px-6 pt-2 text-center">
                    <p className="text-xs font-medium text-[#42565d] dark:text-[#d6e7ea]">
                        Renting spot at: Parking spot address
                    </p>

                    <button
                        type="button"
                        className="
                            mt-1 inline-flex cursor-pointer items-center
                            gap-1 text-[11px] font-semibold
                            text-[#0f4c81] hover:underline
                            dark:text-[#2dd4bf]
                        "
                    >
                        View details
                        <ChevronRight className="h-3 w-3" />
                    </button>
                </div>

                <main className="flex-1 space-y-4 overflow-y-auto px-4 pb-24 pt-4">

                    {/* Car info */}
                    <div className="space-y-4 px-2">
                        <h3 className="pl-1 text-[13px] font-bold uppercase tracking-[0.15em] text-[#114B43] dark:text-[#2dd4bf]">
                            Car info:
                        </h3>

                        <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                            <label
                                htmlFor="car-plate"
                                className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]"
                            >
                                Registration plate
                            </label>

                            <input
                                id="car-plate"
                                type="text"
                                value={plate}
                                onChange={(e) => setPlate(e.target.value)}
                                placeholder="B 123 ABC"
                                className="
                                    w-full rounded-xl
                                    border border-black/10
                                    bg-white/60 px-3 py-2
                                    text-[18px] font-medium
                                    text-[#121212] outline-none
                                    placeholder:text-[#6f797d]
                                    dark:border-white/10
                                    dark:bg-white/5
                                    dark:text-white
                                    dark:placeholder:text-[#9db0b6]
                                "
                            />
                        </div>

                        {/* Custom Dropdown for Car Model */}
                        <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                            <label
                                htmlFor="car-model-btn"
                                className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]"
                            >
                                Car model
                            </label>

                            <div className="rounded-xl border border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/5">
                                <button
                                    id="car-model-btn"
                                    type="button"
                                    onClick={() => setIsCarModelOpen((prev) => !prev)}
                                    className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-[18px] font-medium text-[#121212] dark:text-white"
                                >
                                    <span
                                        className={
                                            carModel
                                                ? 'text-[#121212] dark:text-white'
                                                : 'text-[#6f797d] dark:text-[#9db0b6]'
                                        }
                                    >
                                        {carModel ? selectedCarModelLabel : 'Car model...'}
                                    </span>
                                    <ChevronDown
                                        className={`h-5 w-5 text-[#42565d] transition-transform duration-200 dark:text-[#9db0b6] ${
                                            isCarModelOpen ? 'rotate-180' : ''
                                        }`}
                                    />
                                </button>

                                {isCarModelOpen && (
                                    <div className="max-h-52 space-y-1 overflow-y-auto border-t border-black/10 p-2 dark:border-white/10">
                                        {carModelOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => {
                                                    setCarModel(option.value);
                                                    setIsCarModelOpen(false);
                                                }}
                                                className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-base font-medium transition ${
                                                    carModel.toLowerCase() === option.value
                                                        ? 'bg-[#dfeef0] text-[#0f4c81] dark:bg-white/10 dark:text-[#2dd4bf]'
                                                        : 'text-[#121212] hover:bg-black/5 dark:text-white dark:hover:bg-white/10'
                                                }`}
                                            >
                                                <span>{option.label}</span>
                                                {carModel.toLowerCase() === option.value && <span>✓</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-3 pl-1">
                            <button
                                type="button"
                                onClick={handleUseOwnCarClick}
                                className="
                                    inline-flex cursor-pointer
                                    items-center gap-1
                                    text-[11px] font-bold
                                    text-[#0f4c81]
                                    hover:underline
                                    dark:text-[#2dd4bf]
                                "
                            >
                                Use own car
                                <ChevronRight className="h-3 w-3" />
                            </button>
                        </div>
                    </div>

                    {/* Calendar / Rental details */}
                    <div className="space-y-4 px-2 pt-2">
                        <h3 className="pl-1 text-[13px] font-bold uppercase tracking-[0.15em] text-[#114B43] dark:text-[#2dd4bf]">
                            Rental details:
                        </h3>

                        <div className="rounded-2xl border border-black/5 bg-white/20 p-3 dark:border-white/10 dark:bg-white/5">
                            <label
                                htmlFor="rental-datetime"
                                className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]"
                            >
                                Rental date and time
                            </label>

                            <input
                                id="rental-datetime"
                                type="datetime-local"
                                value={rentalDateTime}
                                min={getMinDateTime()}
                                onChange={(e) =>
                                    setRentalDateTime(e.target.value)
                                }
                                required
                                className="
                                    w-full rounded-xl
                                    border border-black/10
                                    bg-white/60 px-3 py-2
                                    text-[16px] font-medium
                                    text-[#121212] outline-none
                                    dark:border-white/10
                                    dark:bg-white/5
                                    dark:text-white
                                "
                            />

                            <p className="mt-2 text-xs text-[#42565d] dark:text-[#9db0b6]">
                                Select the date and time when you want to rent
                                the parking spot.
                            </p>
                        </div>
                    </div>

                    {/* Payment */}
                    <div className="space-y-4 px-2 pt-2">
                        <h3 className="pl-1 text-[13px] font-bold uppercase tracking-[0.15em] text-[#114B43] dark:text-[#2dd4bf]">
                            Payment info:
                        </h3>

                        {clientSecret ? (
                            <Elements
                                stripe={stripePromise}
                                options={{
                                    clientSecret,
                                    appearance,
                                }}
                            >
                                <CheckoutForm
                                    disabled={!isCarInfoValid}
                                    onSuccess={handlePaymentSuccess}
                                />
                            </Elements>
                        ) : (
                            <p className="text-sm text-[#42565d] dark:text-[#d6e7ea]">
                                Loading payment form…
                            </p>
                        )}
                    </div>
                </main>

                <nav className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-black/5 bg-[#dfeef0] py-4 dark:border-white/10 dark:bg-[#011b1b]">
                    <button
                        type="button"
                        onClick={() => setActiveTab('key')}
                        className={`cursor-pointer rounded-full p-1.5 transition-all ${
                            activeTab === 'key'
                                ? 'scale-110 text-[#0f4c81] dark:text-[#2dd4bf]'
                                : 'text-slate-500 dark:text-slate-400'
                        }`}
                    >
                        <Key
                            className="h-6 w-6 -rotate-45 transform"
                            strokeWidth={activeTab === 'key' ? 2.5 : 2}
                        />
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('home')}
                        className={`cursor-pointer rounded-full p-1.5 transition-all ${
                            activeTab === 'home'
                                ? 'scale-110 text-[#0f4c81] dark:text-[#2dd4bf]'
                                : 'text-slate-500 dark:text-slate-400'
                        }`}
                    >
                        <Home
                            className="h-6 w-6"
                            strokeWidth={activeTab === 'home' ? 2.5 : 2}
                        />
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('car')}
                        className={`cursor-pointer rounded-full p-1.5 transition-all ${
                            activeTab === 'car'
                                ? 'scale-110 text-[#0f4c81] dark:text-[#2dd4bf]'
                                : 'text-slate-500 dark:text-slate-400'
                        }`}
                    >
                        <Car
                            className="h-6 w-6"
                            strokeWidth={activeTab === 'car' ? 2.5 : 2}
                        />
                    </button>
                </nav>
            </div>

            {/* Saved Cars Selection Modal */}
            {showCarsModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
                    <div className="relative w-full max-w-85 rounded-3xl border border-white/40 bg-white/90 p-6 text-center shadow-[0_20px_50px_rgba(0,0,0,0.25)] transition-colors duration-300 dark:border-white/5 dark:bg-[#022525]/90">
                        <button
                            type="button"
                            onClick={() => setShowCarsModal(false)}
                            className="absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#404b51] hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10"
                            aria-label="Close"
                        >
                            <X className="h-5 w-5" strokeWidth={2.2} />
                        </button>

                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#0f4c81]/10 text-[#0f4c81] dark:bg-[#2dd4bf]/10 dark:text-[#2dd4bf] mb-2">
                            <Car className="h-6 w-6" strokeWidth={2.2} />
                        </div>

                        <h3 className="text-xl font-bold tracking-tight text-[#121212] dark:text-white">
                            Select Your Car
                        </h3>
                        <p className="mt-1 text-xs text-[#6f797d] dark:text-[#9db0b6]">
                            Choose a car from your profile to auto-complete details.
                        </p>

                        <div className="mt-4 max-h-64 space-y-2.5 overflow-y-auto px-1 text-left">
                            {isLoadingCars ? (
                                <div className="py-8 text-center text-sm font-medium text-[#6f797d] dark:text-[#9db0b6]">
                                    Loading your saved cars...
                                </div>
                            ) : userCars.length === 0 ? (
                                <div className="py-6 text-center">
                                    <p className="text-sm font-medium text-[#42565d] dark:text-[#9db0b6] mb-3">
                                        No saved cars found in your profile.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCarsModal(false);
                                            router.push(ROUTES.ADD_CAR);
                                        }}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f4c81] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0c3e67] transition cursor-pointer"
                                    >
                                        <Plus className="h-4 w-4" strokeWidth={2.2} />
                                        Add New Car
                                    </button>
                                </div>
                            ) : (
                                userCars.map((car) => (
                                    <button
                                        key={car.id}
                                        type="button"
                                        onClick={() => handleSelectCar(car)}
                                        className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-black/5 bg-white/70 p-3 text-left shadow-sm transition hover:scale-[1.01] hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-black/10 bg-[#e8e8e8] dark:border-white/10 dark:bg-white/10 flex items-center justify-center">
                                                {car.image_url ? (
                                                    <img
                                                        src={`${API}${car.image_url}`}
                                                        alt={`${car.brand} ${car.model}`}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <Car className="h-5 w-5 text-[#0f4c81] dark:text-[#2dd4bf]" strokeWidth={2} />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-[#121212] dark:text-white leading-tight">
                                                    {car.brand} {car.model}
                                                </h4>
                                                <p className="text-xs font-semibold text-[#0f4c81] dark:text-[#2dd4bf]">
                                                    {car.license_plate}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-[#6f797d] dark:text-[#9db0b6]" strokeWidth={2.2} />
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showHelpModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
                    <div className="relative w-full max-w-85 rounded-3xl border border-white/40 bg-white/90 p-6 text-center shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-colors duration-300 dark:border-white/5 dark:bg-[#022525]/90">
                        <button
                            type="button"
                            onClick={() => setShowHelpModal(false)}
                            className="absolute right-4 top-4 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-black/5 text-[#121212] hover:bg-black/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                            aria-label="Close info"
                        >
                            <X
                                className="h-4 w-4"
                                strokeWidth={2.5}
                            />
                        </button>

                        <div className="mx-auto mt-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#0f4c81]/10 text-[#0f4c81] dark:bg-white/10 dark:text-white">
                            <CircleHelp
                                className="h-6 w-6"
                                strokeWidth={2.2}
                            />
                        </div>

                        <h3 className="mt-4 text-xl font-bold tracking-tight text-[#121212] dark:text-white">
                            Legal Documents
                        </h3>

                        <p className="mt-3 text-sm leading-relaxed text-[#404b51] dark:text-slate-300">
                            Please upload the official registration document
                            or certificate of your car. The file must be in{' '}
                            <strong>PDF format</strong> and should be clearly
                            legible.
                        </p>

                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={() => setShowHelpModal(false)}
                                className="
                                    w-full cursor-pointer rounded-2xl
                                    bg-[#0f4c81] px-4 py-3
                                    text-sm font-bold text-white
                                    shadow-md transition
                                    hover:bg-[#0c3e67]
                                    active:scale-[0.98]
                                "
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
