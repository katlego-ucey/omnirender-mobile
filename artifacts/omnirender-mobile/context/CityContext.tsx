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
  { name: "Cape Town", lat: -33.9249, lon: 18.4241, country: "ZA" },
  { name: "Lagos", lat: 6.5244, lon: 3.3792, country: "NG" },
  { name: "Nairobi", lat: -1.2921, lon: 36.8219, country: "KE" },
  { name: "Cairo", lat: 30.0444, lon: 31.2357, country: "EG" },
  { name: "London", lat: 51.5074, lon: -0.1278, country: "GB" },
  { name: "New York", lat: 40.7128, lon: -74.006, country: "US" },
  { name: "São Paulo", lat: -23.5505, lon: -46.6333, country: "BR" },
];

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
}

const CityContext = createContext<CityContextType | null>(null);

export function CityProvider({ children }: { children: React.ReactNode }) {
  const [selectedCity, setSelectedCityState] = useState<CityPreset>(CITY_PRESETS[0]);
  const [radius, setRadius] = useState(1000);
  const [favoriteBuilding, setFavoriteBuilding] = useState<Building | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("selectedCity").then((val) => {
      if (val) {
        try {
          setSelectedCityState(JSON.parse(val));
        } catch {}
      }
    });
  }, []);

  const setSelectedCity = (city: CityPreset) => {
    setSelectedCityState(city);
    AsyncStorage.setItem("selectedCity", JSON.stringify(city)).catch(() => {});
  };

  const { data: cityData, isLoading: cityLoading, isError } = useGetCityData(
    { lat: selectedCity.lat, lon: selectedCity.lon, radius },
    { query: { enabled: true, staleTime: 5 * 60 * 1000 } }
  );

  const { data: elevation, isLoading: elevLoading } = useGetElevation(
    { lat: selectedCity.lat, lon: selectedCity.lon },
    { query: { staleTime: 60 * 60 * 1000 } }
  );

  const { data: weather } = useGetWeather(
    { lat: selectedCity.lat, lon: selectedCity.lon },
    { query: { staleTime: 10 * 60 * 1000 } }
  );

  return (
    <CityContext.Provider
      value={{
        selectedCity,
        setSelectedCity,
        cityData,
        elevation,
        weather,
        isLoading: cityLoading || elevLoading,
        isError,
        radius,
        setRadius,
        favoriteBuilding,
        setFavoriteBuilding,
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
