'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

type GoogleMapsContextValue = {
  apiKey: string;
  isLoaded: boolean;
  loadError: Error | undefined;
  requestLoad: () => void;
};

const GoogleMapsContext = createContext<GoogleMapsContextValue>({
  apiKey: '',
  isLoaded: false,
  loadError: undefined,
  requestLoad: () => {},
});

export function useGoogleMaps() {
  const context = useContext(GoogleMapsContext);
  useEffect(() => {
    context.requestLoad();
  }, [context.requestLoad]);
  return context;
}

function GoogleMapsLoader({
  apiKey,
  onStateChange,
}: {
  apiKey: string;
  onStateChange: (state: { isLoaded: boolean; loadError: Error | undefined }) => void;
}) {
  const options = useMemo(
    () => ({
      id: 'google-map-script',
      googleMapsApiKey: apiKey,
      authReferrerPolicy: 'origin' as const,
      version: 'weekly',
    }),
    [apiKey],
  );
  const { isLoaded, loadError } = useJsApiLoader(options);

  useEffect(() => {
    onStateChange({ isLoaded, loadError });
  }, [isLoaded, loadError, onStateChange]);

  return null;
}

export default function GoogleMapsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const [shouldLoad, setShouldLoad] = useState(false);
  const [loaderState, setLoaderState] = useState<{
    isLoaded: boolean;
    loadError: Error | undefined;
  }>({ isLoaded: false, loadError: undefined });
  const requestLoad = useCallback(() => {
    if (apiKey) setShouldLoad(true);
  }, [apiKey]);
  const updateLoaderState = useCallback(
    (state: { isLoaded: boolean; loadError: Error | undefined }) => {
      setLoaderState(state);
    },
    [],
  );
  const contextValue = useMemo(
    () => ({ apiKey, ...loaderState, requestLoad }),
    [apiKey, loaderState, requestLoad],
  );

  return (
    <GoogleMapsContext.Provider value={contextValue}>
      {shouldLoad && apiKey && (
        <GoogleMapsLoader apiKey={apiKey} onStateChange={updateLoaderState} />
      )}
      {children}
    </GoogleMapsContext.Provider>
  );
}
