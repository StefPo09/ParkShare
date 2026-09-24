'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Elements } from '@stripe/react-stripe-js';
import type { Appearance } from '@stripe/stripe-js';
import { stripePromise } from '../../lib/stripe';
import { CheckoutForm } from '../components/StripePayment';
import { ROUTES } from '../../constants/routes';
import {
    X,
    ChevronRight,
    ChevronLeft,
    ChevronDown,
    CircleHelp,
    Key,
    Home,
    Car,
    Plus,
    Calendar as CalendarIcon,
    Clock,
    MapPin,
    AlertCircle,
    Check,
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

interface SpotBooking {
    id?: number;
    start_date: string;
    end_date: string;
    status: string;
}

interface SpotDetails {
    id: number;
    title: string;
    address: string;
    description?: string;
    start_hour: string;
    end_hour: string;
    price_per_day: number;
    price_currency: string;
    is_on_sale?: boolean;
    is_available?: boolean;
    image_url?: string | null;
    bookings: SpotBooking[];
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

function parseHourMinute(timeStr?: string): { hour: number; minute: number } {
    if (!timeStr) return { hour: 8, minute: 0 };
    const parts = timeStr.split(':');
    const hour = parseInt(parts[0], 10);
    const minute = parts.length > 1 ? parseInt(parts[1], 10) : 0;
    return {
        hour: isNaN(hour) ? 8 : hour,
        minute: isNaN(minute) ? 0 : minute,
    };
}

function parseTimeToMinutes(timeStr?: string): number | null {
    if (!timeStr) return null;
    const parts = timeStr.trim().split(':');
    if (parts.length === 0) return null;
    const h = parseInt(parts[0], 10);
    const m = parts.length > 1 ? parseInt(parts[1], 10) : 0;
    if (isNaN(h) || isNaN(m)) return null;
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return h * 60 + m;
}

function formatMinutesToTime(totalMinutes: number): string {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function PaymentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const spotIdParam = searchParams.get('spot');
    const API = process.env.NEXT_PUBLIC_API_URL || '';

    const [activeTab, setActiveTab] = useState<'key' | 'home' | 'car'>('home');

    const [plate, setPlate] = useState('');
    const [carModel, setCarModel] = useState('');
    const [isCarModelOpen, setIsCarModelOpen] = useState(false);

    const [userCars, setUserCars] = useState<CarItem[]>([]);
    const [showCarsModal, setShowCarsModal] = useState(false);
    const [isLoadingCars, setIsLoadingCars] = useState(false);

    const [showHelpModal, setShowHelpModal] = useState(false);
    const [showSpotDetailsModal, setShowSpotDetailsModal] = useState(false);

    const [spotDetails, setSpotDetails] = useState<SpotDetails | null>(null);
    const [isLoadingSpot, setIsLoadingSpot] = useState(false);

    // Calendar & Hour Selection State
    const [viewDate, setViewDate] = useState(() => new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    });
    const [timeMode, setTimeMode] = useState<'preset' | 'custom'>('preset');
    const [selectedStartHour, setSelectedStartHour] = useState<number | null>(null);
    const [selectedEndHour, setSelectedEndHour] = useState<number | null>(null);
    const [customStartTime, setCustomStartTime] = useState('08:00');
    const [customEndTime, setCustomEndTime] = useState('10:00');

    const [clientSecret, setClientSecret] = useState<string | null>(null);

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

    // Fetch Spot Details & Bookings
    useEffect(() => {
        if (!spotIdParam) {
            // Default mock spot if no spot param
            setSpotDetails({
                id: 1,
                title: 'Central Parking Spot',
                address: 'Parking spot address',
                description: 'Convenient central location with dedicated parking slot.',
                start_hour: '08:00',
                end_hour: '18:00',
                price_per_day: 4,
                price_currency: 'RON',
                is_available: true,
                bookings: [],
            });
            return;
        }

        setIsLoadingSpot(true);
        fetch(`${API}/api/spots/${spotIdParam}`, { credentials: 'include' })
            .then((res) => {
                if (!res.ok) throw new Error(`Status ${res.status}`);
                return res.json();
            })
            .then((data) => {
                if (data.spot) {
                    setSpotDetails({
                        id: data.spot.id,
                        title: data.spot.title || data.spot.address,
                        address: data.spot.address,
                        description: data.spot.description || '',
                        start_hour: data.spot.start_hour || '08:00',
                        end_hour: data.spot.end_hour || '18:00',
                        price_per_day: data.spot.price_per_day ?? 4,
                        price_currency: data.spot.price_currency || 'RON',
                        is_on_sale: data.spot.is_on_sale,
                        is_available: data.spot.is_available ?? true,
                        image_url: data.spot.image_url,
                        bookings: Array.isArray(data.spot.bookings) ? data.spot.bookings : [],
                    });
                }
            })
            .catch((err) => {
                console.error('Failed to fetch spot details:', err);
                setSpotDetails({
                    id: Number(spotIdParam) || 1,
                    title: 'Parking Spot',
                    address: 'Parking spot address',
                    start_hour: '08:00',
                    end_hour: '18:00',
                    price_per_day: 4,
                    price_currency: 'RON',
                    is_available: true,
                    bookings: [],
                });
            })
            .finally(() => {
                setIsLoadingSpot(false);
            });
    }, [spotIdParam, API]);

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

    // Operating hours calculation
    const spotStart = useMemo(() => parseHourMinute(spotDetails?.start_hour || '08:00'), [spotDetails?.start_hour]);
    const spotEnd = useMemo(() => parseHourMinute(spotDetails?.end_hour || '18:00'), [spotDetails?.end_hour]);

    const spotStartMinutes = useMemo(() => spotStart.hour * 60 + spotStart.minute, [spotStart]);
    const spotEndMinutes = useMemo(() => spotEnd.hour * 60 + spotEnd.minute, [spotEnd]);

    // Initialize custom start and end times once spotDetails is loaded
    useEffect(() => {
        if (spotDetails?.start_hour && spotDetails?.end_hour) {
            setCustomStartTime(spotDetails.start_hour);
            const sh = parseHourMinute(spotDetails.start_hour);
            const eh = parseHourMinute(spotDetails.end_hour);
            const defaultEndH = Math.min(eh.hour, sh.hour + 2);
            setCustomEndTime(`${String(defaultEndH).padStart(2, '0')}:${String(sh.minute).padStart(2, '0')}`);
        }
    }, [spotDetails?.start_hour, spotDetails?.end_hour]);

    // Check if an hour slot is booked on a specific date
    const isHourSlotBooked = (date: Date, hour: number): boolean => {
        if (!spotDetails?.bookings || spotDetails.bookings.length === 0) return false;

        const slotStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, 0, 0);
        const slotEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour + 1, 0, 0);

        return spotDetails.bookings.some((b) => {
            if (b.status === 'cancelled') return false;
            const bStart = new Date(b.start_date);
            const bEnd = new Date(b.end_date);
            return bStart < slotEnd && bEnd > slotStart;
        });
    };

    // Check if an hour slot is in the past
    const isHourSlotInPast = (date: Date, hour: number): boolean => {
        const slotEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour + 1, 0, 0);
        return slotEnd.getTime() <= Date.now();
    };

    // Check if an entire day is unavailable (past, spot not available, or 100% booked / out of hours)
    const isDayUnavailable = (date: Date): boolean => {
        if (spotDetails?.is_available === false) return true;

        const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
        if (endOfDay.getTime() < Date.now()) return true;

        const startH = spotStart.hour;
        const endH = spotEnd.hour;
        if (startH >= endH) return true;

        // Check if there is at least one valid, unbooked, non-past slot
        let hasAvailableSlot = false;
        for (let h = startH; h < endH; h++) {
            if (!isHourSlotInPast(date, h) && !isHourSlotBooked(date, h)) {
                hasAvailableSlot = true;
                break;
            }
        }

        return !hasAvailableSlot;
    };

    // Available hour slots for the currently selected day
    const availableSlotsForSelectedDate = useMemo(() => {
        if (!selectedDate) return [];

        const slots: { hour: number; label: string; isUnavailable: boolean; reason?: string }[] = [];
        const startH = spotStart.hour;
        const endH = spotEnd.hour;

        for (let h = startH; h < endH; h++) {
            const label = `${String(h).padStart(2, '0')}:00 - ${String(h + 1).padStart(2, '0')}:00`;
            const inPast = isHourSlotInPast(selectedDate, h);
            const booked = isHourSlotBooked(selectedDate, h);

            let isUnavailable = false;
            let reason = '';
            if (inPast) {
                isUnavailable = true;
                reason = 'Past';
            } else if (booked) {
                isUnavailable = true;
                reason = 'Booked';
            }

            slots.push({
                hour: h,
                label,
                isUnavailable,
                reason,
            });
        }

        return slots;
    }, [selectedDate, spotStart.hour, spotEnd.hour, spotDetails?.bookings]);

    // Automatically reset hour selection if selected date changes and chosen hour becomes invalid
    useEffect(() => {
        if (selectedStartHour !== null && selectedDate) {
            const slot = availableSlotsForSelectedDate.find((s) => s.hour === selectedStartHour);
            if (!slot || slot.isUnavailable) {
                setSelectedStartHour(null);
                setSelectedEndHour(null);
            }
        }
    }, [selectedDate, availableSlotsForSelectedDate, selectedStartHour]);

    const handleSelectSlot = (hour: number) => {
        if (selectedStartHour === null || (selectedStartHour !== null && selectedEndHour !== null)) {
            setSelectedStartHour(hour);
            setSelectedEndHour(hour + 1);
        } else if (selectedStartHour !== null && selectedEndHour === null) {
            if (hour >= selectedStartHour) {
                // Check all intermediate hours are available
                let valid = true;
                for (let h = selectedStartHour; h <= hour; h++) {
                    const slot = availableSlotsForSelectedDate.find((s) => s.hour === h);
                    if (!slot || slot.isUnavailable) {
                        valid = false;
                        break;
                    }
                }
                if (valid) {
                    setSelectedEndHour(hour + 1);
                } else {
                    setSelectedStartHour(hour);
                    setSelectedEndHour(hour + 1);
                }
            } else {
                setSelectedStartHour(hour);
                setSelectedEndHour(hour + 1);
            }
        }
    };

    const isSlotSelected = (hour: number) => {
        if (selectedStartHour === null) return false;
        if (selectedEndHour === null) return hour === selectedStartHour;
        return hour >= selectedStartHour && hour < selectedEndHour;
    };

    const selectedHoursCount = selectedStartHour !== null && selectedEndHour !== null ? selectedEndHour - selectedStartHour : 0;

    const timeValidation = useMemo(() => {
        if (!selectedDate) {
            return { isValid: false, error: 'Please select a date on the calendar.' };
        }

        let startM: number | null = null;
        let endM: number | null = null;

        if (timeMode === 'preset') {
            if (selectedStartHour === null || selectedEndHour === null) {
                return { isValid: false, error: 'Please select at least one hour slot to proceed.' };
            }
            startM = selectedStartHour * 60;
            endM = selectedEndHour * 60;
        } else {
            if (!customStartTime || !customEndTime) {
                return { isValid: false, error: 'Please enter both start and end times.' };
            }
            startM = parseTimeToMinutes(customStartTime);
            endM = parseTimeToMinutes(customEndTime);
            if (startM === null || endM === null) {
                return { isValid: false, error: 'Please enter a valid time (HH:MM).' };
            }
        }

        if (endM <= startM) {
            return { isValid: false, error: 'End time must be after start time.' };
        }

        if (startM < spotStartMinutes) {
            return {
                isValid: false,
                error: `Start time (${formatMinutesToTime(startM)}) is before the spot's available opening time (${spotDetails?.start_hour || '08:00'}).`
            };
        }

        if (endM > spotEndMinutes) {
            return {
                isValid: false,
                error: `End time (${formatMinutesToTime(endM)}) is after the spot's available closing time (${spotDetails?.end_hour || '18:00'}).`
            };
        }

        // Check if selected start time has already passed today
        const now = new Date();
        const isToday =
            selectedDate.getFullYear() === now.getFullYear() &&
            selectedDate.getMonth() === now.getMonth() &&
            selectedDate.getDate() === now.getDate();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();

        if (isToday && startM <= nowMinutes) {
            return {
                isValid: false,
                error: `Selected start time (${formatMinutesToTime(startM)}) has already passed today.`
            };
        }

        // Overlap with existing bookings
        if (spotDetails?.bookings && spotDetails.bookings.length > 0) {
            const startH = Math.floor(startM / 60);
            const startMin = startM % 60;
            const endH = Math.floor(endM / 60);
            const endMin = endM % 60;

            const reqStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), startH, startMin, 0);
            const reqEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), endH, endMin, 0);

            const overlapping = spotDetails.bookings.find((b) => {
                if (b.status === 'cancelled') return false;
                const bStart = new Date(b.start_date);
                const bEnd = new Date(b.end_date);
                return bStart < reqEnd && bEnd > reqStart;
            });

            if (overlapping) {
                const bStartStr = new Date(overlapping.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const bEndStr = new Date(overlapping.end_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return {
                    isValid: false,
                    error: `This time slot overlaps with an existing reservation (${bStartStr} - ${bEndStr}).`
                };
            }
        }

        const durationMinutes = endM - startM;
        return {
            isValid: true,
            error: null,
            startMinutes: startM,
            endMinutes: endM,
            durationMinutes,
        };
    }, [selectedDate, timeMode, selectedStartHour, selectedEndHour, customStartTime, customEndTime, spotStartMinutes, spotEndMinutes, spotDetails]);

    const durationMinutes = timeValidation.isValid && timeValidation.durationMinutes ? timeValidation.durationMinutes : 0;

    const formattedDuration = useMemo(() => {
        if (durationMinutes <= 0) return '0 hours';
        const hours = Math.floor(durationMinutes / 60);
        const mins = durationMinutes % 60;
        if (mins === 0) {
            return `${hours} hour${hours !== 1 ? 's' : ''}`;
        }
        if (hours === 0) {
            return `${mins} min${mins !== 1 ? 's' : ''}`;
        }
        return `${hours}h ${mins}m`;
    }, [durationMinutes]);

    const startTimeFormatted = useMemo(() => {
        if (timeValidation.startMinutes === undefined) return '';
        return formatMinutesToTime(timeValidation.startMinutes);
    }, [timeValidation.startMinutes]);

    const endTimeFormatted = useMemo(() => {
        if (timeValidation.endMinutes === undefined) return '';
        return formatMinutesToTime(timeValidation.endMinutes);
    }, [timeValidation.endMinutes]);

    const isDateTimeValid = timeValidation.isValid;
    const isCarInfoValid = plate.trim() !== '' && carModel !== '';
    const isBookingValid = isCarInfoValid && isDateTimeValid;

    const calculatedPrice = useMemo(() => {
        if (!spotDetails || !timeValidation.isValid || durationMinutes <= 0) return 0;
        const totalOperatingHours = Math.max(0.5, (spotEndMinutes - spotStartMinutes) / 60);
        const hourlyRate = spotDetails.price_per_day / totalOperatingHours;
        const price = (durationMinutes / 60) * hourlyRate;
        return Math.round(price * 100) / 100;
    }, [spotDetails, timeValidation.isValid, durationMinutes, spotStartMinutes, spotEndMinutes]);

    const handleUseOwnCarClick = () => {
        fetchUserCars();
        setShowCarsModal(true);
    };

    const handleSelectCar = (car: CarItem) => {
        setPlate(car.license_plate);
        setCarModel(car.model);
        setShowCarsModal(false);
    };

    const handlePaymentSuccess = async () => {
        if (spotDetails && selectedDate && timeValidation.isValid && timeValidation.startMinutes !== undefined && timeValidation.endMinutes !== undefined) {
            try {
                const startH = Math.floor(timeValidation.startMinutes / 60);
                const startM = timeValidation.startMinutes % 60;
                const endH = Math.floor(timeValidation.endMinutes / 60);
                const endM = timeValidation.endMinutes % 60;

                const startIso = new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth(),
                    selectedDate.getDate(),
                    startH,
                    startM,
                    0
                ).toISOString();

                const endIso = new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth(),
                    selectedDate.getDate(),
                    endH,
                    endM,
                    0
                ).toISOString();

                const res = await fetch(`${API}/api/bookings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        spot_id: spotDetails.id,
                        start_date: startIso,
                        end_date: endIso,
                    }),
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    console.error('Backend booking creation failed:', res.status, errData);
                }
            } catch (err) {
                console.error('Failed to create booking in backend:', err);
            }
        }

        const queryParams = new URLSearchParams();
        if (spotDetails) {
            queryParams.set('spotTitle', spotDetails.title || spotDetails.address);
            queryParams.set('spotAddress', spotDetails.address);
            queryParams.set('currency', spotDetails.price_currency || 'RON');
        }
        if (durationMinutes > 0) {
            queryParams.set('duration', formattedDuration);
            queryParams.set('total', calculatedPrice.toFixed(2));
        }
        if (startTimeFormatted && endTimeFormatted) {
            queryParams.set('startHour', startTimeFormatted);
            queryParams.set('endHour', endTimeFormatted);
        }

        router.push(`${ROUTES.SUCCESS_PAYMENT}?${queryParams.toString()}`);
    };

    // Calendar generation
    const calendarDays = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days: { date: Date; isCurrentMonth: boolean; isUnavailable: boolean }[] = [];

        // Previous month filler days
        const prevMonthLastDate = new Date(year, month, 0).getDate();
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            const d = new Date(year, month - 1, prevMonthLastDate - i);
            days.push({
                date: d,
                isCurrentMonth: false,
                isUnavailable: true,
            });
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const d = new Date(year, month, day);
            days.push({
                date: d,
                isCurrentMonth: true,
                isUnavailable: isDayUnavailable(d),
            });
        }

        // Next month filler days to complete grid
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            const d = new Date(year, month + 1, i);
            days.push({
                date: d,
                isCurrentMonth: false,
                isUnavailable: true,
            });
        }

        return days;
    }, [viewDate, spotDetails, spotStart, spotEnd]);

    const handlePrevMonth = () => {
        const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const target = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
        if (target >= currentMonthStart) {
            setViewDate(target);
        }
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const canGoPrevMonth = useMemo(() => {
        const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const target = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
        return target >= currentMonthStart;
    }, [viewDate]);

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
    };

    if (!mounted) return null;

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
                {/* Header */}
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

                {/* Spot Address Header & Details trigger */}
                <div className="px-6 pt-2 text-center">
                    <p className="text-xs font-medium text-[#42565d] dark:text-[#d6e7ea]">
                        Renting spot at:{' '}
                        <span className="font-bold text-[#121212] dark:text-white">
                            {spotDetails?.address || 'Parking spot address'}
                        </span>
                    </p>

                    <button
                        type="button"
                        onClick={() => setShowSpotDetailsModal(true)}
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

                    {/* Spot info summary badge */}
                    {spotDetails && (
                        <div className="rounded-2xl border border-black/5 bg-white/40 p-3 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-[#0f4c81] dark:text-[#2dd4bf]" />
                                    <span className="text-xs font-semibold text-[#121212] dark:text-white">
                                        Operating hours: {spotDetails.start_hour} - {spotDetails.end_hour}
                                    </span>
                                </div>
                                <div className="text-xs font-bold text-[#0f4c81] dark:text-[#2dd4bf]">
                                    {spotDetails.price_per_day} {spotDetails.price_currency} / day
                                </div>
                            </div>
                        </div>
                    )}

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

                        {/* Dropdown for Car Model */}
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

                    {/* Interactive Calendar & Rental Selection */}
                    <div className="space-y-4 px-2 pt-2">
                        <div className="flex items-center justify-between pl-1">
                            <h3 className="text-[13px] font-bold uppercase tracking-[0.15em] text-[#114B43] dark:text-[#2dd4bf]">
                                Select date & hours:
                            </h3>
                            <span className="text-[11px] text-[#52737c] dark:text-[#9db0b6]">
                                Daily: {spotDetails?.start_hour || '08:00'} - {spotDetails?.end_hour || '18:00'}
                            </span>
                        </div>

                        {/* Calendar Card */}
                        <div className="rounded-2xl border border-black/5 bg-white/30 p-3 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                            {/* Month navigation */}
                            <div className="mb-3 flex items-center justify-between px-1">
                                <span className="text-[16px] font-bold text-[#121212] dark:text-white">
                                    {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={handlePrevMonth}
                                        disabled={!canGoPrevMonth}
                                        className="flex h-8 w-8 items-center justify-center rounded-full text-[#121212] hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed dark:text-white dark:hover:bg-white/10 cursor-pointer"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleNextMonth}
                                        className="flex h-8 w-8 items-center justify-center rounded-full text-[#121212] hover:bg-black/5 dark:text-white dark:hover:bg-white/10 cursor-pointer"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Days of Week Header */}
                            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-[#52737c] dark:text-[#9db0b6] mb-1">
                                <div>Su</div>
                                <div>Mo</div>
                                <div>Tu</div>
                                <div>We</div>
                                <div>Th</div>
                                <div>Fr</div>
                                <div>Sa</div>
                            </div>

                            {/* Calendar Days Grid */}
                            <div className="grid grid-cols-7 gap-1 text-center">
                                {calendarDays.map((item, idx) => {
                                    const isSelected =
                                        selectedDate &&
                                        item.isCurrentMonth &&
                                        selectedDate.getFullYear() === item.date.getFullYear() &&
                                        selectedDate.getMonth() === item.date.getMonth() &&
                                        selectedDate.getDate() === item.date.getDate();

                                    const isToday =
                                        new Date().getFullYear() === item.date.getFullYear() &&
                                        new Date().getMonth() === item.date.getMonth() &&
                                        new Date().getDate() === item.date.getDate();

                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            disabled={item.isUnavailable || !item.isCurrentMonth}
                                            onClick={() => {
                                                if (item.isCurrentMonth && !item.isUnavailable) {
                                                    setSelectedDate(new Date(item.date));
                                                    setSelectedStartHour(null);
                                                    setSelectedEndHour(null);
                                                }
                                            }}
                                            className={`
                                                relative flex h-9 w-full items-center justify-center rounded-xl text-[13px] font-semibold transition
                                                ${!item.isCurrentMonth ? 'opacity-20 pointer-events-none' : ''}
                                                ${item.isUnavailable ? 'opacity-35 cursor-not-allowed text-gray-400 dark:text-gray-600 line-through' : 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/10'}
                                                ${
                                                isSelected
                                                    ? 'bg-[#0f4c81] text-white shadow-md hover:bg-[#0f4c81] dark:bg-[#2dd4bf] dark:text-[#011b1b]'
                                                    : ''
                                            }
                                                ${isToday && !isSelected ? 'border border-[#0f4c81]/40 dark:border-[#2dd4bf]/40' : ''}
                                            `}
                                        >
                                            {item.date.getDate()}
                                        </button>
                                    );
                                })}
                            </div>

                            <p className="mt-2 text-center text-[11px] text-[#6f797d] dark:text-[#9db0b6]">
                                * Unavailable or fully booked dates are crossed out and cannot be selected.
                            </p>
                        </div>

                        {/* Time Slot Selection */}
                        {selectedDate && (
                            <div className="rounded-2xl border border-black/5 bg-white/30 p-3.5 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                                        Available Hours for {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </label>
                                    <span className="text-[11px] font-semibold text-[#0f4c81] dark:text-[#2dd4bf]">
                                        {spotDetails?.start_hour || '08:00'} - {spotDetails?.end_hour || '18:00'}
                                    </span>
                                </div>

                                {/* Mode Switch: Preset vs Custom */}
                                <div className="grid grid-cols-2 gap-1 rounded-xl bg-black/5 dark:bg-white/5 p-1 border border-black/5 dark:border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setTimeMode('preset')}
                                        className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                                            timeMode === 'preset'
                                                ? 'bg-white dark:bg-[#0f4c81] text-[#0f4c81] dark:text-white shadow-sm'
                                                : 'text-[#52737c] dark:text-[#9db0b6] hover:text-[#121212] dark:hover:text-white'
                                        }`}
                                    >
                                        Preset Slots
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTimeMode('custom');
                                            if (selectedStartHour !== null && selectedEndHour !== null) {
                                                setCustomStartTime(`${String(selectedStartHour).padStart(2, '0')}:00`);
                                                setCustomEndTime(`${String(selectedEndHour).padStart(2, '0')}:00`);
                                            }
                                        }}
                                        className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                                            timeMode === 'custom'
                                                ? 'bg-white dark:bg-[#0f4c81] text-[#0f4c81] dark:text-white shadow-sm'
                                                : 'text-[#52737c] dark:text-[#9db0b6] hover:text-[#121212] dark:hover:text-white'
                                        }`}
                                    >
                                        Custom Time (From - Until)
                                    </button>
                                </div>

                                {timeMode === 'preset' ? (
                                    <>
                                        <div className="grid grid-cols-2 gap-2 pt-1">
                                            {availableSlotsForSelectedDate.map((slot) => {
                                                const selected = isSlotSelected(slot.hour);

                                                return (
                                                    <button
                                                        key={slot.hour}
                                                        type="button"
                                                        disabled={slot.isUnavailable}
                                                        onClick={() => handleSelectSlot(slot.hour)}
                                                        className={`
                                                            flex items-center justify-between px-3 py-2.5 rounded-xl border text-[13px] font-medium transition
                                                            ${
                                                            slot.isUnavailable
                                                                ? 'opacity-35 border-dashed border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/40 text-gray-400 cursor-not-allowed line-through'
                                                                : selected
                                                                    ? 'border-[#0f4c81] bg-[#0f4c81] text-white shadow-sm dark:border-[#2dd4bf] dark:bg-[#2dd4bf] dark:text-[#011b1b] font-bold cursor-pointer'
                                                                    : 'border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/5 hover:border-[#0f4c81] dark:hover:border-[#2dd4bf] cursor-pointer text-[#121212] dark:text-white'
                                                        }
                                                        `}
                                                    >
                                                        <span>{slot.label}</span>
                                                        {slot.isUnavailable ? (
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">
                                                                {slot.reason}
                                                            </span>
                                                        ) : selected ? (
                                                            <Check className="h-3.5 w-3.5" />
                                                        ) : null}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-3 pt-1">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label htmlFor="custom-start-time" className="block text-[11px] font-bold uppercase tracking-wider text-[#52737c] dark:text-[#9db0b6] mb-1">
                                                    From (Start Time)
                                                </label>
                                                <input
                                                    id="custom-start-time"
                                                    type="time"
                                                    value={customStartTime}
                                                    onChange={(e) => setCustomStartTime(e.target.value)}
                                                    className={`w-full rounded-xl border bg-white/60 dark:bg-white/5 px-3 py-2 text-[15px] font-semibold text-[#121212] dark:text-white outline-none [color-scheme:light] dark:[color-scheme:dark] transition ${
                                                        timeValidation.error && timeValidation.error.includes('Start')
                                                            ? 'border-red-500 ring-1 ring-red-500'
                                                            : 'border-black/10 dark:border-white/10 focus:border-[#0f4c81] dark:focus:border-[#2dd4bf]'
                                                    }`}
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="custom-end-time" className="block text-[11px] font-bold uppercase tracking-wider text-[#52737c] dark:text-[#9db0b6] mb-1">
                                                    Until (End Time)
                                                </label>
                                                <input
                                                    id="custom-end-time"
                                                    type="time"
                                                    value={customEndTime}
                                                    onChange={(e) => setCustomEndTime(e.target.value)}
                                                    className={`w-full rounded-xl border bg-white/60 dark:bg-white/5 px-3 py-2 text-[15px] font-semibold text-[#121212] dark:text-white outline-none [color-scheme:light] dark:[color-scheme:dark] transition ${
                                                        timeValidation.error && timeValidation.error.includes('End')
                                                            ? 'border-red-500 ring-1 ring-red-500'
                                                            : 'border-black/10 dark:border-white/10 focus:border-[#0f4c81] dark:focus:border-[#2dd4bf]'
                                                    }`}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-[11px] text-[#52737c] dark:text-[#9db0b6] px-1">
                                            <span>Spot opening hours: {spotDetails?.start_hour || '08:00'} - {spotDetails?.end_hour || '18:00'}</span>
                                            <span>Exact minutes supported</span>
                                        </div>
                                    </div>
                                )}

                                {timeValidation.isValid && durationMinutes > 0 ? (
                                    <div className="mt-3 rounded-xl bg-[#0f4c81]/10 p-2.5 text-center text-xs font-semibold text-[#0f4c81] dark:bg-[#2dd4bf]/10 dark:text-[#2dd4bf]">
                                        Selected: {formattedDuration} ({startTimeFormatted} - {endTimeFormatted}) — Total: {calculatedPrice.toFixed(2)} {spotDetails?.price_currency || 'RON'}
                                    </div>
                                ) : timeValidation.error ? (
                                    <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/10 p-2.5 text-xs font-medium text-red-700 dark:text-red-300">
                                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                                        <span>{timeValidation.error}</span>
                                    </div>
                                ) : (
                                    <div className="mt-2 text-center text-xs text-[#52737c] dark:text-[#9db0b6]">
                                        Please select an available time to proceed.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Payment info */}
                    <div className="space-y-4 px-2 pt-2">
                        <h3 className="pl-1 text-[13px] font-bold uppercase tracking-[0.15em] text-[#114B43] dark:text-[#2dd4bf]">
                            Payment info:
                        </h3>

                        {!isBookingValid && (
                            <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs font-medium text-amber-800 dark:text-amber-200">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>
                                    {!isCarInfoValid
                                        ? 'Please provide your car registration plate and model.'
                                        : timeValidation.error
                                            ? timeValidation.error
                                            : 'Please select an available date and time slot.'}
                                </span>
                            </div>
                        )}

                        {clientSecret ? (
                            <Elements
                                stripe={stripePromise}
                                options={{
                                    clientSecret,
                                    appearance,
                                }}
                            >
                                <CheckoutForm
                                    disabled={!isBookingValid}
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

                {/* Bottom Navigation */}
                <nav className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-black/5 bg-[#dfeef0] py-4 dark:border-white/10 dark:bg-[#011b1b]">
                    <button
                        type="button"
                        onClick={() => { setActiveTab('key'); router.push(ROUTES.RENT); }}
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
                        onClick={() => { setActiveTab('home'); router.push(ROUTES.HOME); }}
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
                        onClick={() => { setActiveTab('car'); router.push(ROUTES.MANAGE_CAR); }}
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

            {/* Spot Details Modal */}
            {showSpotDetailsModal && spotDetails && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
                    <div className="relative w-full max-w-85 rounded-3xl border border-white/40 bg-white/90 p-6 text-center shadow-[0_20px_50px_rgba(0,0,0,0.25)] transition-colors duration-300 dark:border-white/5 dark:bg-[#022525]/90">
                        <button
                            type="button"
                            onClick={() => setShowSpotDetailsModal(false)}
                            className="absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#404b51] hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10"
                            aria-label="Close"
                        >
                            <X className="h-5 w-5" strokeWidth={2.2} />
                        </button>

                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#0f4c81]/10 text-[#0f4c81] dark:bg-[#2dd4bf]/10 dark:text-[#2dd4bf] mb-2">
                            <MapPin className="h-6 w-6" strokeWidth={2.2} />
                        </div>

                        <h3 className="text-xl font-bold tracking-tight text-[#121212] dark:text-white">
                            {spotDetails.title}
                        </h3>
                        <p className="mt-1 text-xs text-[#6f797d] dark:text-[#9db0b6]">
                            {spotDetails.address}
                        </p>

                        <div className="mt-4 space-y-2 text-left text-xs text-[#42565d] dark:text-[#d6e7ea]">
                            <div className="flex justify-between border-b border-black/5 dark:border-white/10 pb-1.5">
                                <span className="font-semibold">Hours:</span>
                                <span>{spotDetails.start_hour} - {spotDetails.end_hour}</span>
                            </div>
                            <div className="flex justify-between border-b border-black/5 dark:border-white/10 pb-1.5">
                                <span className="font-semibold">Price per day:</span>
                                <span>{spotDetails.price_per_day} {spotDetails.price_currency}</span>
                            </div>
                            {spotDetails.description && (
                                <div className="pt-1">
                                    <span className="font-semibold block mb-0.5">Description:</span>
                                    <p className="text-[11px] leading-relaxed text-[#6f797d] dark:text-[#9db0b6]">
                                        {spotDetails.description}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={() => setShowSpotDetailsModal(false)}
                                className="w-full cursor-pointer rounded-2xl bg-[#0f4c81] px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#0c3e67] active:scale-[0.98] dark:bg-[#155b8a]"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function PaymentPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-[#dfeef0] dark:bg-[#011b1b]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0f4c81] border-t-transparent" />
            </div>
        }>
            <PaymentContent />
        </Suspense>
    );
}
