'use client';

import React, { useState, useRef, ChangeEvent, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ROUTES } from '../../constants/routes';
import { useLanguage } from '../components/LanguageProvider';
import { countryOptions } from '../../data/address/countries';
import { cityGroups } from '../../data/address/generatedCities';
import { GoogleMap, useJsApiLoader, MarkerF, Circle } from '@react-google-maps/api';
import {
    X,
    Upload,
    CircleHelp,
    Key,
    Home,
    Car,
    CheckCircle2,
    Pencil,
    MapPin,
    Locate
} from 'lucide-react';

interface City {
    id: number;
    name: string;
    country?: string;
}

interface SpotPhoto {
    id: string;
    url: string;
    file: File | null;
}

// Custom dark map style to match dark UI theme
const darkMapStyle: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#091d19' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#091d19' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#74928d' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#a0ece0' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#53827a' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#0e2b25' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#163a33' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#091d19' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#204f46' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#040d0b' }],
  },
];

const defaultMapCenter = { lat: 44.4323, lng: 26.1063 };

export default function EditSpotPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#dfeef0] dark:bg-[#011b1b]" />}>
            <EditSpotPageContent />
        </Suspense>
    );
}

function EditSpotPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const spotId = searchParams.get('id');
    const { t } = useLanguage();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const documentInputRef = useRef<HTMLInputElement>(null);

    const MAX_SPOT_PHOTOS = 5;
    const [spotPhotos, setSpotPhotos] = useState<SpotPhoto[]>([]);
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);
    const [photoMode, setPhotoMode] = useState<'add' | 'replace'>('add');
    const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
    const [showDeletePhotoModal, setShowDeletePhotoModal] = useState(false);

    const [selectedDocumentFile, setSelectedDocumentFile] = useState<File | null>(null);
    const [isDocumentRemoved, setIsDocumentRemoved] = useState(false);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [countries, setCountries] = useState<string[]>(countryOptions);
    const [cities, setCities] = useState<City[]>([]);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedCityName, setSelectedCityName] = useState('');
    const [countrySearch, setCountrySearch] = useState('');
    const [citySearch, setCitySearch] = useState('');
    const [isCountryOpen, setIsCountryOpen] = useState(false);
    const [isCityOpen, setIsCityOpen] = useState(false);

    // Map & Location states
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);

    // Load Google Maps SDK
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    });

    const [values, setValues] = useState({
        country: '',
        city_id: '',
        name: '',
        address: '',
        startHour: '14:00',
        endHour: '18:00',
        extraInfo: '',
        rentalPriceAmount: '0.00',
        rentalPriceCurrency: 'RON',
        sellingInfo: 'Not on sale',
        document: '',
    });

    const [activeTab, setActiveTab] = useState<'key' | 'home' | 'car'>('key');
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const activePhoto = spotPhotos[activePhotoIndex] || null;

    // Detect dark mode
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setIsDarkMode(mediaQuery.matches);

        const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    const reverseGeocode = useCallback((coords: { lat: number; lng: number }) => {
        if (typeof window === 'undefined' || !window.google || !window.google.maps) return;
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: coords }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
                const formattedAddress = results[0].formatted_address;
                setValues((current) => ({ ...current, address: formattedAddress }));

                let foundCountry = '';
                let foundCity = '';

                results[0].address_components.forEach((comp) => {
                    if (comp.types.includes('country')) {
                        foundCountry = comp.long_name;
                    }
                    if (
                        comp.types.includes('locality') ||
                        comp.types.includes('postal_town') ||
                        comp.types.includes('administrative_area_level_2')
                    ) {
                        if (!foundCity) foundCity = comp.long_name;
                    }
                });

                if (foundCountry) {
                    const matchCountry = countryOptions.find(
                        (c) => c.toLowerCase() === foundCountry.toLowerCase()
                    );
                    if (matchCountry) {
                        setSelectedCountry(matchCountry);
                        setValues((current) => ({ ...current, country: matchCountry }));
                    }
                }

                if (foundCity) {
                    setSelectedCityName(foundCity);
                }
            }
        });
    }, []);

    const handleGetCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                setUserLocation(coords);
                setSelectedLocation(coords);
                if (map) {
                    map.panTo(coords);
                    map.setZoom(16);
                }
                reverseGeocode(coords);
            },
            (error) => {
                console.warn('Geolocation error or permission denied:', error);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, [map, reverseGeocode]);

    const handleMapClick = (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        setSelectedLocation(coords);
        reverseGeocode(coords);
    };

    const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        setSelectedLocation(coords);
        reverseGeocode(coords);
    };

    const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
        setMap(mapInstance);
    }, []);

    const onMapUnmount = useCallback(() => {
        setMap(null);
    }, []);

    const normalizeCityName = (value: string) =>
        value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/['\u2019`]/g, '')
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();

    const resolveCityId = (cityName: string, countryName: string, cityList: City[] = cities) => {
        if (!cityName.trim()) return '';

        const normalizedSelectedCity = normalizeCityName(cityName);
        const cityMatch = cityList.find((city) => normalizeCityName(city.name || '') === normalizedSelectedCity);
        if (cityMatch) return String(cityMatch.id);

        const countryCities = cityGroups[countryName] || [];
        const fallbackName = countryCities.find(
            (candidate) => normalizeCityName(candidate) === normalizedSelectedCity
        );
        if (!fallbackName) return '';

        const fallbackMatch = cityList.find(
            (city) => normalizeCityName(city.name || '') === normalizeCityName(fallbackName)
        );
        return fallbackMatch ? String(fallbackMatch.id) : '';
    };

    // Load spot data (including city, coordinates, images, and documents)
    useEffect(() => {
        if (!spotId) return;

        fetch(`${API}/api/spots/${spotId}`, { credentials: 'include' })
            .then((res) => {
                if (!res.ok) throw new Error('Failed to fetch spot');
                return res.json();
            })
            .then(async (data) => {
                if (data.spot) {
                    const spot = data.spot;
                    setValues((prev) => ({
                        ...prev,
                        city_id: spot.city_id ? String(spot.city_id) : '',
                        name: spot.title || '',
                        address: spot.address || '',
                        startHour: spot.start_hour || spot.start_time || '14:00',
                        endHour: spot.end_hour || spot.end_time || '18:00',
                        extraInfo: spot.description || '',
                        rentalPriceAmount: spot.price_per_day ? String(spot.price_per_day) : '0.00',
                        rentalPriceCurrency: spot.price_currency || 'RON',
                        sellingInfo: spot.is_on_sale ? 'On sale' : 'Not on sale',
                        document: spot.document_name || (spot.document_url ? 'Legal Document.pdf' : ''),
                    }));

                    if (spot.latitude && spot.longitude) {
                        setSelectedLocation({ lat: spot.latitude, lng: spot.longitude });
                    }

                    if (spot.image_url) {
                        setSpotPhotos([{ id: 'existing-image', url: `${API}${spot.image_url}`, file: null }]);
                    }

                    if (spot.city_id) {
                        try {
                            const cityRes = await fetch(`${API}/api/cities/${spot.city_id}`, { credentials: 'include' });
                            if (cityRes.ok) {
                                const cityData = await cityRes.json();
                                if (cityData.city) {
                                    if (cityData.city.country) {
                                        setSelectedCountry(cityData.city.country);
                                        setValues((v) => ({ ...v, country: cityData.city.country }));
                                    }
                                    setSelectedCityName(cityData.city.name);
                                }
                            }
                        } catch (cityErr) {
                            console.error('Failed to fetch spot city info:', cityErr);
                        }
                    }
                }
            })
            .catch((err) => console.error('Error fetching spot:', err));
    }, [spotId, API]);

    useEffect(() => {
        const fetchCities = async () => {
            try {
                const response = await fetch(`${API}/api/cities`, {
                    credentials: 'include',
                });
                if (response.ok) {
                    const data = await response.json();
                    const apiCities: City[] = data.cities || [];
                    setCities(apiCities);

                    if (selectedCityName) {
                        const matchedId = resolveCityId(selectedCityName, selectedCountry, apiCities);
                        if (matchedId) {
                            setValues((v) => ({ ...v, city_id: matchedId }));
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to fetch cities:', error);
            }
        };
        fetchCities();
    }, [API, selectedCountry, selectedCityName]);

    const cityOptions = selectedCountry ? cityGroups[selectedCountry] || [] : [];
    const filteredCountries = countries.filter((country) =>
        country.toLowerCase().includes(countrySearch.trim().toLowerCase())
    );
    const filteredCities = cityOptions.filter((cityName) =>
        cityName.toLowerCase().includes(citySearch.trim().toLowerCase())
    );

    const canSubmit =
        values.country.trim().length > 0 &&
        selectedCountry.trim().length > 0 &&
        selectedCityName.trim().length > 0 &&
        values.name.trim().length > 0 &&
        values.address.trim().length > 0 &&
        selectedLocation !== null &&
        values.rentalPriceAmount.trim().length > 0;

    const isSaveDisabled = !canSubmit || isLoading;

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const objectUrl = URL.createObjectURL(file);

        if (photoMode === 'replace' && activePhoto) {
            setSpotPhotos((photos) =>
                photos.map((photo, index) =>
                    index === activePhotoIndex ? { ...photo, url: objectUrl, file } : photo
                )
            );
        } else if (spotPhotos.length < MAX_SPOT_PHOTOS) {
            const newPhoto: SpotPhoto = { id: `${Date.now()}-${Math.random()}`, url: objectUrl, file };
            setSpotPhotos((photos) => {
                const nextPhotos = [...photos, newPhoto];
                setActivePhotoIndex(Math.max(nextPhotos.length - 1, 0));
                return nextPhotos;
            });
        }

        setPhotoMode('add');
        setIsPhotoModalOpen(false);
        setShowDeletePhotoModal(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handlePhotoAreaClick = () => {
        if (spotPhotos.length > 0) {
            setIsPhotoModalOpen(true);
        } else {
            setPhotoMode('add');
            fileInputRef.current?.click();
        }
    };

    const handleDeletePhoto = () => {
        const remainingPhotos = spotPhotos.filter((_, index) => index !== activePhotoIndex);
        setSpotPhotos(remainingPhotos);
        setActivePhotoIndex((prev) => {
            if (remainingPhotos.length === 0) return 0;
            return Math.min(prev, remainingPhotos.length - 1);
        });
        setIsPhotoModalOpen(false);
        setShowDeletePhotoModal(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const openPhotoPickerForAdd = () => {
        if (spotPhotos.length >= MAX_SPOT_PHOTOS) return;
        setPhotoMode('add');
        setIsPhotoModalOpen(false);
        fileInputRef.current?.click();
    };

    const openPhotoPickerForReplace = () => {
        if (!activePhoto) return;
        setPhotoMode('replace');
        setIsPhotoModalOpen(false);
        fileInputRef.current?.click();
    };

    const handleDocumentFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        if (!isPdf) {
            window.alert('Please upload a PDF file.');
            event.target.value = '';
            return;
        }

        setSelectedDocumentFile(file);
        setIsDocumentRemoved(false);
        setValues((current) => ({ ...current, document: file.name }));
    };

    const updateValue = (key: keyof typeof values, value: string) => {
        setValues((current) => ({ ...current, [key]: value }));
    };

    const handleCountryChange = (country: string) => {
        setSelectedCountry(country);
        setSelectedCityName('');
        setValues((current) => ({ ...current, country, city_id: '' }));
    };

    const handleCityChange = (cityName: string) => {
        setSelectedCityName(cityName);
        const resolvedId = resolveCityId(cityName, selectedCountry);
        setValues((current) => ({ ...current, city_id: resolvedId }));
    };

    const handlePriceChange = (e: ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
            updateValue('rentalPriceAmount', val);
        }
    };

    const handlePriceBlur = () => {
        const numericValue = parseFloat(values.rentalPriceAmount);
        if (!isNaN(numericValue)) {
            updateValue('rentalPriceAmount', numericValue.toFixed(2));
        } else {
            updateValue('rentalPriceAmount', '0.00');
        }
    };

    const handleRemoveDocument = () => {
        setSelectedDocumentFile(null);
        setIsDocumentRemoved(true);
        setValues((current) => ({ ...current, document: '' }));
        if (documentInputRef.current) documentInputRef.current.value = '';
    };

    // Save changes with photos, documents, and map location coordinates
    const handleRentSubmit = async () => {
        if (!spotId) return;

        setIsLoading(true);
        setErrorMessage(null);

        try {
            let finalCityId =
                values.city_id.trim().length > 0
                    ? values.city_id
                    : resolveCityId(selectedCityName, values.country) || resolveCityId(selectedCityName, selectedCountry);

            if (!finalCityId && selectedCityName) {
                let createCityResponse: Response;
                try {
                    createCityResponse = await fetch(`${API}/api/cities`, {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: selectedCityName,
                            country: selectedCountry || values.country,
                        }),
                    });
                } catch (fetchErr: any) {
                    setErrorMessage(`Cannot connect to server (${fetchErr?.message || 'Network error'}).`);
                    setIsLoading(false);
                    return;
                }

                if (createCityResponse.status === 409) {
                    const citiesResponse = await fetch(`${API}/api/cities`, { credentials: 'include' });
                    if (citiesResponse.ok) {
                        const citiesData = await citiesResponse.json();
                        const fetchedCities: City[] = citiesData.cities || [];
                        setCities(fetchedCities);
                        const existingCity = fetchedCities.find(
                            (city) => normalizeCityName(city.name || '') === normalizeCityName(selectedCityName)
                        );
                        finalCityId = existingCity ? String(existingCity.id) : '';
                    }
                } else if (createCityResponse.ok) {
                    const cityData = await createCityResponse.json();
                    if (cityData.city) {
                        finalCityId = String(cityData.city.id);
                        setCities((prev) => [...prev, cityData.city]);
                    }
                }
            }

            const formData = new FormData();
            if (finalCityId) formData.append('city_id', finalCityId);
            formData.append('title', values.name);
            formData.append('address', values.address);

            formData.append('start_hour', values.startHour);
            formData.append('end_hour', values.endHour);
            formData.append('start_time', values.startHour);
            formData.append('end_time', values.endHour);

            formData.append('description', values.extraInfo);
            formData.append('price_per_day', values.rentalPriceAmount);
            formData.append('price_currency', values.rentalPriceCurrency);

            const isOnSale = values.sellingInfo === 'On sale';
            formData.append('is_on_sale', String(isOnSale));
            formData.append('selling_info', values.sellingInfo);

            if (selectedLocation) {
                formData.append('latitude', String(selectedLocation.lat));
                formData.append('longitude', String(selectedLocation.lng));
            }

            const primaryPhoto = spotPhotos.find((photo) => photo.file);
            if (primaryPhoto?.file) {
                formData.append('image', primaryPhoto.file);
            } else if (spotPhotos.length === 0) {
                formData.append('remove_image', 'true');
            }

            spotPhotos.forEach((photo) => {
                if (photo.file) {
                    formData.append('images', photo.file);
                }
            });

            if (selectedDocumentFile) {
                formData.append('document', selectedDocumentFile);
            } else if (isDocumentRemoved) {
                formData.append('remove_document', 'true');
            }

            const res = await fetch(`${API}/api/spots/${spotId}`, {
                method: 'PATCH',
                body: formData,
                credentials: 'include',
            });

            if (res.ok) {
                setIsLoading(false);
                setIsSuccessModalOpen(true);
            } else {
                const text = await res.text();
                let errMsg = 'Failed to update spot';
                try {
                    const data = JSON.parse(text);
                    errMsg = data.error || data.message || errMsg;
                } catch {
                    errMsg = text || errMsg;
                }
                setErrorMessage(errMsg);
                setIsLoading(false);
            }
        } catch (err: any) {
            console.error('Error updating spot:', err);
            setErrorMessage(err?.message || 'An error occurred while saving changes.');
            setIsLoading(false);
        }
    };

    const handleCloseSuccessModal = () => {
        setIsSuccessModalOpen(false);
        router.push(ROUTES.MANAGE_SPOT);
    };

    return (
        <div className="min-h-screen bg-[#dfeef0] px-0 py-0 dark:bg-[#011b1b] relative">
            <div className="mx-auto flex h-screen w-full max-w-107.5 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),transparent_48%)] bg-[#dfeef0] text-[#121212] shadow-[0_25px_50px_rgba(15,32,35,0.12)] transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_36%)] dark:bg-[#011b1b] dark:text-white">

                <header className="flex items-center justify-between px-5 pt-5">
                    <div className="flex-1 text-center">
                        <h1 className="text-[28px] font-bold tracking-tight text-[#121212] dark:text-white">
                            {t('yourSpot')}
                        </h1>
                    </div>
                    <button
                        aria-label="Close"
                        onClick={() => router.push(ROUTES.MANAGE_SPOT)}
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#121212] transition hover:scale-[1.02] hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
                    >
                        <X className="h-7 w-7" strokeWidth={2.2} />
                    </button>
                </header>

                <main className="flex-1 px-4 pt-4 overflow-y-auto space-y-4 pb-24 no-scrollbar">

                    {/* Photo Area */}
                    <div className="relative flex flex-col items-center justify-center mb-2">
                        <div className="relative group flex w-full max-w-80 items-center justify-center gap-2 h-60">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />

                            {spotPhotos.length > 0 && activePhoto ? (
                                <>
                                    {activePhotoIndex > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setActivePhotoIndex((prev) => Math.max(prev - 1, 0))}
                                            className="relative h-32 w-16 overflow-hidden rounded-2xl border border-white/40 bg-black/5 shadow-sm transition-transform duration-300 hover:scale-[1.02] dark:border-white/10 dark:bg-white/5"
                                            aria-label="Previous photo"
                                        >
                                            <img
                                                src={spotPhotos[activePhotoIndex - 1].url}
                                                alt="Previous spot photo"
                                                className="h-full w-full object-cover opacity-75"
                                            />
                                        </button>
                                    )}

                                    <div className="relative h-55 w-full max-w-70 overflow-hidden rounded-[32px] border border-white/40 bg-[#cce5e7] shadow-lg transition-all duration-300 dark:border-white/10 dark:bg-white/5">
                                        <div className="absolute inset-0 transition-transform duration-300 ease-out">
                                            <button
                                                type="button"
                                                onClick={handlePhotoAreaClick}
                                                className="relative h-full w-full cursor-pointer overflow-hidden"
                                                aria-label="Spot photo options"
                                            >
                                                <img src={activePhoto.url} alt="Parking Spot" className="h-full w-full object-cover" />
                                            </button>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setShowDeletePhotoModal(true)}
                                            className="absolute bottom-3 left-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/90 text-red-500 shadow-[0_4px_12px_rgba(0,0,0,0.18)] border border-black/5 transition-transform active:scale-95"
                                            aria-label="Delete current photo"
                                        >
                                            <X className="h-5 w-5" strokeWidth={2.6} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={openPhotoPickerForReplace}
                                            className="absolute bottom-3 right-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/90 text-[#121212] shadow-[0_4px_12px_rgba(0,0,0,0.18)] border border-black/5 transition-transform active:scale-95"
                                            aria-label="Change current photo"
                                        >
                                            <Pencil className="h-4 w-4" strokeWidth={2.2} />
                                        </button>
                                    </div>

                                    {activePhotoIndex < spotPhotos.length - 1 ? (
                                        <button
                                            type="button"
                                            onClick={() => setActivePhotoIndex((prev) => Math.min(prev + 1, spotPhotos.length - 1))}
                                            className="relative h-32 w-16 overflow-hidden rounded-2xl border border-white/40 bg-black/5 shadow-sm transition-transform duration-300 hover:scale-[1.02] dark:border-white/10 dark:bg-white/5"
                                            aria-label="Next photo"
                                        >
                                            <img
                                                src={spotPhotos[activePhotoIndex + 1].url}
                                                alt="Next spot photo"
                                                className="h-full w-full object-cover opacity-75"
                                            />
                                        </button>
                                    ) : spotPhotos.length < MAX_SPOT_PHOTOS ? (
                                        <button
                                            type="button"
                                            onClick={openPhotoPickerForAdd}
                                            className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border border-dashed border-[#0f4c81]/50 bg-white/70 text-[#0f4c81] shadow-sm transition hover:scale-105 dark:border-[#2dd4bf]/60 dark:bg-[#032a2a] dark:text-[#2dd4bf]"
                                            aria-label="Add photo"
                                        >
                                            <span className="text-3xl leading-none">+</span>
                                        </button>
                                    ) : null}
                                </>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handlePhotoAreaClick}
                                    className="relative h-55 w-full max-w-70 cursor-pointer overflow-hidden rounded-[32px] border border-white/40 bg-[#cce5e7] shadow-md transition duration-200 hover:scale-[1.01] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                                    aria-label="Spot photo options"
                                >
                                    <div className="flex h-full flex-col items-center justify-center gap-2 text-[#404b51] dark:text-[#8ba2a6]">
                                        <Upload className="h-8 w-8 stroke-[1.8]" />
                                        <span className="text-sm font-medium">{t('spotPhoto')}</span>
                                    </div>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4 px-2">
                        <h3 className="text-[13px] font-bold uppercase tracking-[0.15em] text-[#114B43] dark:text-[#2dd4bf] pl-1">
                            {t('spotSpecifications')}
                        </h3>

                        {/* Country Selection */}
                        <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                            <label className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                                Country
                            </label>
                            <div className="rounded-xl border border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/5">
                                <button
                                    type="button"
                                    onClick={() => setIsCountryOpen((prev) => !prev)}
                                    className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-[18px] font-medium text-[#121212] dark:text-white"
                                >
                                    <span className={values.country ? 'text-[#121212] dark:text-white' : 'text-[#6f797d] dark:text-[#9db0b6]'}>
                                        {values.country || 'Select a country...'}
                                    </span>
                                    <span className="text-base text-[#42565d] dark:text-[#d6e7ea]">{isCountryOpen ? '▴' : '▾'}</span>
                                </button>

                                {isCountryOpen && (
                                    <div className="border-t border-black/10 p-2 dark:border-white/10">
                                        <input
                                            type="text"
                                            value={countrySearch}
                                            onChange={(e) => setCountrySearch(e.target.value)}
                                            placeholder="Search country..."
                                            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#121212] outline-none placeholder:text-[#6f797d] dark:border-white/10 dark:bg-[#032a2a] dark:text-white dark:placeholder:text-[#9db0b6]"
                                        />
                                        <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                                            {filteredCountries.length > 0 ? (
                                                filteredCountries.map((country) => (
                                                    <button
                                                        key={country}
                                                        type="button"
                                                        onClick={() => {
                                                            handleCountryChange(country);
                                                            setCountrySearch('');
                                                            setIsCountryOpen(false);
                                                        }}
                                                        className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                                                            values.country === country
                                                                ? 'bg-[#dfeef0] text-[#0f4c81] dark:bg-white/10 dark:text-[#2dd4bf]'
                                                                : 'text-[#121212] hover:bg-black/5 dark:text-white dark:hover:bg-white/10'
                                                        }`}
                                                    >
                                                        <span>{country}</span>
                                                        {values.country === country && <span>✓</span>}
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-3 py-2 text-sm text-[#6f797d] dark:text-[#9db0b6]">
                                                    No countries found
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* City Selection */}
                        <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                            <label className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                                City
                            </label>
                            <div className="rounded-xl border border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/5">
                                <button
                                    type="button"
                                    onClick={() => selectedCountry && setIsCityOpen((prev) => !prev)}
                                    disabled={!selectedCountry}
                                    className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-[18px] font-medium text-[#121212] disabled:cursor-not-allowed disabled:opacity-60 dark:text-white"
                                >
                                    <span className={selectedCityName ? 'text-[#121212] dark:text-white' : 'text-[#6f797d] dark:text-[#9db0b6]'}>
                                        {selectedCityName || (selectedCountry ? 'Select a city...' : 'Select a country first')}
                                    </span>
                                    <span className="text-base text-[#42565d] dark:text-[#d6e7ea]">{isCityOpen ? '▴' : '▾'}</span>
                                </button>

                                {isCityOpen && selectedCountry && (
                                    <div className="border-t border-black/10 p-2 dark:border-white/10">
                                        <input
                                            type="text"
                                            value={citySearch}
                                            onChange={(e) => setCitySearch(e.target.value)}
                                            placeholder="Search city..."
                                            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#121212] outline-none placeholder:text-[#6f797d] dark:border-white/10 dark:bg-[#032a2a] dark:text-white dark:placeholder:text-[#9db0b6]"
                                        />
                                        <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                                            {filteredCities.length > 0 ? (
                                                filteredCities.map((cityName) => (
                                                    <button
                                                        key={cityName}
                                                        type="button"
                                                        onClick={() => {
                                                            handleCityChange(cityName);
                                                            setCitySearch('');
                                                            setIsCityOpen(false);
                                                        }}
                                                        className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                                                            selectedCityName === cityName
                                                                ? 'bg-[#dfeef0] text-[#0f4c81] dark:bg-white/10 dark:text-[#2dd4bf]'
                                                                : 'text-[#121212] hover:bg-black/5 dark:text-white dark:hover:bg-white/10'
                                                        }`}
                                                    >
                                                        <span>{cityName}</span>
                                                        {selectedCityName === cityName && <span>✓</span>}
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-3 py-2 text-sm text-[#6f797d] dark:text-[#9db0b6]">
                                                    No cities found
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Name */}
                        <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                            <label htmlFor="spot-name" className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                                {t('spotName')}
                            </label>
                            <input
                                id="spot-name"
                                type="text"
                                value={values.name}
                                onChange={(e) => updateValue('name', e.target.value)}
                                placeholder="Custom spot name"
                                className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-[18px] font-medium text-[#121212] outline-none placeholder:text-[#6f797d] dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-[#9db0b6]"
                            />
                        </div>

                        {/* Address (ReadOnly - set strictly via Google Maps pin placement) */}
                        <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                            <label htmlFor="spot-address" className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                                {t('address')}
                            </label>
                            <div className="w-full rounded-xl border border-black/10 bg-white/30 px-3 py-2 text-[18px] font-medium text-[#121212] dark:border-white/10 dark:bg-white/5 dark:text-white min-h-[44px] flex items-center select-none cursor-not-allowed opacity-90">
                                {values.address ? (
                                    <span>{values.address}</span>
                                ) : (
                                    <span className="text-[#6f797d] dark:text-[#9db0b6] text-base italic font-normal">
                                        Select pin on map to set address
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Precise Location Map Box */}
                        <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5 space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea] flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-[#0f4c81] dark:text-[#2dd4bf]" />
                                    Precise Location on Map
                                </label>
                                <button
                                    type="button"
                                    onClick={handleGetCurrentLocation}
                                    className="flex items-center gap-1 text-[11px] font-semibold text-[#0f4c81] dark:text-[#2dd4bf] bg-white/60 dark:bg-white/10 px-2.5 py-1 rounded-xl border border-black/10 dark:border-white/10 hover:bg-white/90 dark:hover:bg-white/20 transition cursor-pointer active:scale-95"
                                >
                                    <Locate className="w-3 h-3" />
                                    My Location
                                </button>
                            </div>

                            <div className="relative w-full h-60 rounded-xl overflow-hidden border border-black/10 dark:border-white/10 shadow-inner bg-[#e8e8e8] dark:bg-[#121c1a]">
                                {isLoaded ? (
                                    <GoogleMap
                                        mapContainerStyle={{ width: '100%', height: '100%' }}
                                        center={selectedLocation || userLocation || defaultMapCenter}
                                        zoom={selectedLocation || userLocation ? 16 : 13}
                                        onLoad={onMapLoad}
                                        onUnmount={onMapUnmount}
                                        onClick={handleMapClick}
                                        options={{
                                            disableDefaultUI: true,
                                            zoomControl: true,
                                            styles: isDarkMode ? darkMapStyle : [],
                                        }}
                                    >
                                        {userLocation && (
                                            <Circle
                                                center={userLocation}
                                                radius={20}
                                                options={{
                                                    strokeColor: '#1e90ff',
                                                    strokeOpacity: 0.8,
                                                    strokeWeight: 2,
                                                    fillColor: '#1e90ff',
                                                    fillOpacity: 0.2,
                                                    clickable: false,
                                                    zIndex: 1,
                                                }}
                                            />
                                        )}

                                        {selectedLocation && (
                                            <MarkerF
                                                position={selectedLocation}
                                                draggable={true}
                                                onDragEnd={handleMarkerDragEnd}
                                                icon={{
                                                    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
                                                        '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="#ef4444" stroke="#dc2626" stroke-width="1.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="white"/></svg>'
                                                    )}`,
                                                    anchor: isLoaded ? new window.google.maps.Point(18, 36) : undefined,
                                                }}
                                            />
                                        )}
                                    </GoogleMap>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-sm font-medium text-[#6f797d] dark:text-[#9db0b6]">
                                        {t('loadingMap')}
                                    </div>
                                )}
                            </div>
                            <p className="text-[11px] text-[#6f797d] dark:text-[#9db0b6] px-1 italic">
                                Click on the map or drag the pin to set the exact spot location.
                            </p>
                        </div>

                        {/* Time Available */}
                        <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                            <span className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                                {t('timeAvailable')}
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label htmlFor="start-hour" className="sr-only">{t('startHourLabel')}</label>
                                    <input
                                        id="start-hour"
                                        type="time"
                                        value={values.startHour}
                                        onChange={(e) => updateValue('startHour', e.target.value)}
                                        className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-[16px] font-medium text-[#121212] outline-none dark:border-white/10 dark:bg-white/5 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="end-hour" className="sr-only">{t('endHourLabel')}</label>
                                    <input
                                        id="end-hour"
                                        type="time"
                                        value={values.endHour}
                                        onChange={(e) => updateValue('endHour', e.target.value)}
                                        className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-[16px] font-medium text-[#121212] outline-none dark:border-white/10 dark:bg-white/5 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Extra Info */}
                        <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                            <label htmlFor="spot-extra" className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                                {t('extraInfoOptional')}
                            </label>
                            <input
                                id="spot-extra"
                                type="text"
                                value={values.extraInfo}
                                onChange={(e) => updateValue('extraInfo', e.target.value)}
                                placeholder="None"
                                className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-[18px] font-medium text-[#121212] outline-none placeholder:text-[#6f797d] dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-[#9db0b6]"
                            />
                        </div>

                        {/* Rental Price */}
                        <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                            <label htmlFor="spot-price" className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                                {t('rentalPrice')}
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    id="spot-price"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={values.rentalPriceAmount}
                                    onChange={handlePriceChange}
                                    onBlur={handlePriceBlur}
                                    placeholder="4.00"
                                    className="w-full flex-1 rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-[18px] font-medium text-[#121212] outline-none placeholder:text-[#6f797d] dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-[#9db0b6]"
                                />
                                <select
                                    aria-label="Currency"
                                    value={values.rentalPriceCurrency}
                                    onChange={(e) => updateValue('rentalPriceCurrency', e.target.value)}
                                    className="rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-[18px] font-medium text-[#121212] outline-none dark:border-white/10 dark:bg-white/5 dark:text-white cursor-pointer"
                                >
                                    <option value="RON" className="text-black bg-white">RON</option>
                                    <option value="$" className="text-black bg-white">$</option>
                                    <option value="€" className="text-black bg-white">€</option>
                                </select>
                                <span className="text-[18px] font-semibold text-[#42565d] dark:text-[#d6e7ea] pr-2 select-none">
                                    /h
                                </span>
                            </div>
                        </div>

                        {/* Selling Info */}
                        <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                            <label htmlFor="spot-selling" className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                                Selling info
                            </label>
                            <select
                                id="spot-selling"
                                value={values.sellingInfo}
                                onChange={(e) => updateValue('sellingInfo', e.target.value)}
                                className={`w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-[18px] font-medium outline-none dark:border-white/10 dark:bg-white/5 cursor-pointer transition-colors duration-200 ${
                                    values.sellingInfo === 'On sale'
                                        ? 'text-emerald-500 dark:text-emerald-400'
                                        : 'text-red-500 dark:text-red-400'
                                }`}
                            >
                                <option value="On sale" className="text-emerald-500 bg-white dark:bg-[#032a2a]">On sale</option>
                                <option value="Not on sale" className="text-red-500 bg-white dark:bg-[#032a2a]">Not on sale</option>
                            </select>
                        </div>

                        {/* Legal Documents */}
                        <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                            <div className="mb-2 flex items-center justify-between gap-2">
                                <label className="text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                                    {t('legalDocuments')}
                                </label>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsInfoModalOpen(true)}
                                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#1f2937]/15 bg-white/40 text-[#42565d] shadow-sm transition hover:-translate-y-0.5 hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:text-[#d6e7ea] dark:hover:bg-white/10"
                                    >
                                        <CircleHelp className="h-4 w-4" strokeWidth={2.2} />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => documentInputRef.current?.click()}
                                        className="flex h-8 items-center gap-1.5 rounded-full border border-[#1f2937]/15 bg-white/40 px-3 text-[14px] text-[#1f2937] shadow-sm cursor-pointer transition hover:-translate-y-0.5 hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                                    >
                                        <Upload className="h-3.5 w-3.5" strokeWidth={2.2} />
                                        <span>{t('uploadPdf')}</span>
                                    </button>
                                </div>
                            </div>
                            <input
                                ref={documentInputRef}
                                type="file"
                                accept=".pdf,application/pdf"
                                className="hidden"
                                onChange={handleDocumentFileChange}
                            />
                            <div className="flex min-h-12.5 items-center justify-between gap-2 rounded-xl border border-[#111827]/15 bg-white/50 px-3 py-2 text-[18px] text-[#121212] shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white">
                                {values.document ? (
                                    <>
                                        <span className="truncate pr-2 font-medium">{values.document}</span>
                                        <button
                                            type="button"
                                            onClick={handleRemoveDocument}
                                            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-red-500/10 text-red-500 transition hover:bg-red-500 hover:text-white active:scale-95"
                                        >
                                            <X className="h-4 w-4" strokeWidth={2.5} />
                                        </button>
                                    </>
                                ) : (
                                    <span className="truncate text-[#6f797d] dark:text-[#9db0b6]">{t('noPdf')}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="px-2 pt-4">
                        {errorMessage && (
                            <div className="mb-3 rounded-lg bg-red-500/20 border border-red-500 px-4 py-2 text-red-700 dark:text-red-300 text-sm">
                                {errorMessage}
                            </div>
                        )}
                        <button
                            type="button"
                            disabled={isSaveDisabled}
                            onClick={handleRentSubmit}
                            className={`flex w-full items-center justify-center rounded-2xl px-5 py-3.5 text-base font-semibold text-white shadow-[0_16px_28px_rgba(15,76,129,0.28)] transition ${
                                isSaveDisabled
                                    ? 'cursor-not-allowed bg-[#0f4c81]/45 text-white shadow-none'
                                    : 'cursor-pointer bg-[#0f4c81] text-white hover:scale-[1.01] hover:bg-[#0c3e67] active:scale-[0.99]'
                            }`}
                        >
                            {isLoading ? 'Saving...' : t('saveChanges')}
                        </button>
                    </div>
                </main>

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

            {/* Success Modal */}
            {isSuccessModalOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 animate-fadeIn">
                    <div className="relative w-full max-w-85 rounded-3xl bg-white/90 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-white/40 transition-colors duration-300 dark:bg-[#022525]/90 dark:border-white/5 text-center transform scale-100 transition-transform duration-300">

                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400 mb-4 animate-bounce">
                            <CheckCircle2 className="h-10 w-10 stroke-[2.2]" />
                        </div>

                        <h3 className="text-2xl font-bold tracking-tight text-[#121212] dark:text-white">
                            {t('success')}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-[#404b51] dark:text-slate-300 font-medium">
                            {t('Changes were successfully saved!')}
                        </p>

                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={handleCloseSuccessModal}
                                className="w-full py-3.5 px-4 cursor-pointer rounded-2xl bg-emerald-500 text-white text-base font-bold shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:bg-emerald-600 transition active:scale-[0.98]"
                            >
                                Awesome
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Photo Options Modal */}
            {isPhotoModalOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                    <div className="relative w-full max-w-85 rounded-3xl bg-white/90 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/40 transition-colors duration-300 dark:bg-[#022525]/90 dark:border-white/5 text-center">
                        <button
                            type="button"
                            onClick={() => setIsPhotoModalOpen(false)}
                            className="absolute right-4 top-4 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-black/5 text-[#121212] hover:bg-black/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 transition"
                            aria-label="Cancel"
                        >
                            <X className="h-4 w-4" strokeWidth={2.5} />
                        </button>

                        <h3 className="mt-2 text-xl font-bold tracking-tight text-[#121212] dark:text-white">
                            {t('spotPhoto')}
                        </h3>
                        <p className="mt-1 text-sm text-[#404b51] dark:text-slate-400">
                            {t('whatWouldYouLikeToDo')}
                        </p>

                        <div className="mt-5 space-y-3">
                            {spotPhotos.length < MAX_SPOT_PHOTOS && (
                                <button
                                    type="button"
                                    onClick={openPhotoPickerForAdd}
                                    className="w-full py-3 px-4 cursor-pointer rounded-2xl bg-[#0f4c81] text-white text-sm font-bold shadow-sm hover:bg-[#0c3e67] transition active:scale-[0.98]"
                                >
                                    Add Another Photo
                                </button>
                            )}
                            {activePhoto && (
                                <button
                                    type="button"
                                    onClick={openPhotoPickerForReplace}
                                    className="w-full py-3 px-4 cursor-pointer rounded-2xl bg-white border border-black/15 text-sm font-bold shadow-sm text-[#121212] hover:bg-slate-50 transition active:scale-[0.98] dark:bg-white/10 dark:border-white/10 dark:text-white dark:hover:bg-white/15"
                                >
                                    {t('changePhoto')}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsPhotoModalOpen(false);
                                    setShowDeletePhotoModal(true);
                                }}
                                className="w-full py-3 px-4 cursor-pointer rounded-2xl bg-red-500 text-white text-sm font-bold shadow-sm hover:bg-red-600 transition active:scale-[0.98] dark:bg-red-600/80 dark:hover:bg-red-600"
                            >
                                {t('deletePhoto')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeletePhotoModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                    <div className="relative w-full max-w-85 rounded-3xl bg-white/90 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/40 transition-colors duration-300 dark:bg-[#022525]/90 dark:border-white/5 text-center">
                        <h3 className="text-xl font-bold tracking-tight text-[#121212] dark:text-white">
                            Delete Photo?
                        </h3>
                        <p className="mt-2 text-sm text-[#404b51] dark:text-slate-300 font-medium">
                            Are you sure you want to delete this photo from your spot?
                        </p>

                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowDeletePhotoModal(false)}
                                className="flex-1 py-3 px-4 cursor-pointer rounded-2xl bg-slate-200 text-[#121212] text-sm font-bold shadow-sm hover:bg-slate-300 transition active:scale-[0.98] dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeletePhoto}
                                className="flex-1 py-3 px-4 cursor-pointer rounded-2xl bg-red-500 text-white text-sm font-bold shadow-sm hover:bg-red-600 transition active:scale-[0.98]"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Info Modal */}
            {isInfoModalOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                    <div className="relative w-full max-w-85 rounded-3xl bg-white/90 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/40 transition-colors duration-300 dark:bg-[#022525]/90 dark:border-white/5 text-center">
                        <button
                            type="button"
                            onClick={() => setIsInfoModalOpen(false)}
                            className="absolute right-4 top-4 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-black/5 text-[#121212] hover:bg-black/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 transition"
                            aria-label="Close information"
                        >
                            <X className="h-4 w-4" strokeWidth={2.5} />
                        </button>

                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#0f4c81]/10 text-[#0f4c81] dark:bg-white/10 dark:text-white mb-3">
                            <CircleHelp className="h-6 w-6" strokeWidth={2.2} />
                        </div>

                        <h3 className="text-xl font-bold tracking-tight text-[#121212] dark:text-white">
                            {t('legalDocuments')}
                        </h3>
                        <p className="mt-3 text-sm leading-relaxed text-[#404b51] dark:text-slate-300 font-normal">
                            {t('proofOfOwnershipSpot')}
                        </p>

                        <div className="mt-5">
                            <button
                                type="button"
                                onClick={() => setIsInfoModalOpen(false)}
                                className="w-full py-3 px-4 cursor-pointer rounded-2xl bg-[#0f4c81] text-white text-sm font-bold shadow-sm hover:bg-[#0c3e67] transition active:scale-[0.98]"
                            >
                                {t('understood')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
