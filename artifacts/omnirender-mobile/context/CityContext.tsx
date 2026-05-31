import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useGetCityData, useGetElevation, useGetWeather } from "@workspace/api-client-react";
import type {
  Building,
  CityData,
  ElevationData,
  WeatherData,
} from "@workspace/api-client-react";

export interface CityPreset {
  name: string;
  lat: number;
  lon: number;
  country: string;
}

export const CITY_PRESETS: CityPreset[] = [
  { name: "Johannesburg", lat: -26.2041, lon: 28.0473, country: "ZA" },
  { name: "Cape Town",    lat: -33.9249, lon: 18.4241, country: "ZA" },
  { name: "Lagos",        lat: 6.5244,   lon: 3.3792,  country: "NG" },
  { name: "Nairobi",      lat: -1.2921,  lon: 36.8219, country: "KE" },
  { name: "Cairo",        lat: 30.0444,  lon: 31.2357, country: "EG" },
  { name: "London",       lat: 51.5074,  lon: -0.1278, country: "GB" },
  { name: "New York",     lat: 40.7128,  lon: -74.006, country: "US" },
  { name: "São Paulo",    lat: -23.5505, lon: -46.6333,country: "BR" },
];

// ---------------------------------------------------------------------------
// Pipeline status — one per data source
// ---------------------------------------------------------------------------

export type PipelineStatus = "idle" | "loading" | "success" | "error" | "stale";

export interface DataPipelineState {
  osm: PipelineStatus;
  elevation: PipelineStatus;
  weather: PipelineStatus;
}

interface CityContextType {
  selectedCity: CityPreset;
  setSelectedCity: (city: CityPreset) => void;
  cityData: CityData | undefined;
  elevation: ElevationData | undefined;
  weather: WeatherData | undefined;
  isLoading: boolean;
  isError: boolean;
  radius: number;
  setRadius: (r: number) => void;
  favoriteBuilding: Building | null;
  setFavoriteBuilding: (b: Building | null) => void;
  pipeline: DataPipelineState;
  /** True when city data was returned from server cache or stale fallback */
  isCachedData: boolean;
  dataSource: string;
}

const CityContext = createContext<CityContextType | null>(null);

export function CityProvider({ children }: { children: React.ReactNode }) {
  const [selectedCity, setSelectedCityState] = useState<CityPreset>(CITY_PRESETS[0]);
  const [radius, setRadius] = useState(1000);
  const [favoriteBuilding, setFavoriteBuilding] = useState<Building | null>(null);

  // Restore last city from local storage
  useEffect(() => {
    AsyncStorage.getItem("selectedCity").then((val) => {
      if (val) {
        try { setSelectedCityState(JSON.parse(val)); } catch {}
      }
    });
  }, []);

  const setSelectedCity = (city: CityPreset) => {
    setSelectedCityState(city);
    AsyncStorage.setItem("selectedCity", JSON.stringify(city)).catch(() => {});
  };

  // -------------------------------------------------------------------------
  // React Query hooks — staleTime keeps client-side cache aligned with server
  // -------------------------------------------------------------------------

  const {
    data: cityData,
    isLoading: cityLoading,
    isError: cityError,
    fetchStatus: cityFetchStatus,
  } = useGetCityData(
    { lat: selectedCity.lat, lon: selectedCity.lon, radius },
    {
      query: {
        enabled: true,
        // 10 min client cache — matches server-side TTL exactly
        staleTime: 10 * 60 * 1000,
        // Keep previous city data visible while new city loads
        placeholderData: (prev) => prev,
      },
    },
  );

  const {
    data: elevation,
    isLoading: elevLoading,
    fetchStatus: elevFetchStatus,
  } = useGetElevation(
    { lat: selectedCity.lat, lon: selectedCity.lon },
    {
      query: {
        // 24 h — terrain doesn't change; matches server TTL
        staleTime: 24 * 60 * 60 * 1000,
        placeholderData: (prev) => prev,
      },
    },
  );

  const {
    data: weather,
    fetchStatus: weatherFetchStatus,
  } = useGetWeather(
    { lat: selectedCity.lat, lon: selectedCity.lon },
    {
      query: {
        // 5 min — matches server TTL
        staleTime: 5 * 60 * 1000,
        placeholderData: (prev) => prev,
      },
    },
  );

  // -------------------------------------------------------------------------
  // Derive pipeline status from React Query fetch states
  // -------------------------------------------------------------------------

  function toStatus(
    isLoading: boolean,
    isError: boolean,
    hasData: boolean,
    fetchStatus: string,
    dataSource?: string,
  ): PipelineStatus {
    if (isLoading && fetchStatus === "fetching") return "loading";
    if (isError) return "error";
    if (hasData && dataSource === "stale") return "stale";
    if (hasData) return "success";
    return "idle";
  }

  const pipeline: DataPipelineState = {
    osm: toStatus(
      cityLoading,
      cityError,
      !!cityData,
      cityFetchStatus,
      cityData?.data_source,
    ),
    elevation: toStatus(elevLoading, false, !!elevation, elevFetchStatus),
    weather: toStatus(false, false, !!weather, weatherFetchStatus),
  };

  const isCachedData = !!cityData?.cache_hit;
  const dataSource = cityData?.data_source ?? "idle";

  return (
    <CityContext.Provider
      value={{
        selectedCity,
        setSelectedCity,
        cityData,
        elevation,
        weather,
        isLoading: cityLoading || elevLoading,
        isError: cityError,
        radius,
        setRadius,
        favoriteBuilding,
        setFavoriteBuilding,
        pipeline,
        isCachedData,
        dataSource,
      }}
    >
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error("useCity must be used within CityProvider");
  return ctx;
}
