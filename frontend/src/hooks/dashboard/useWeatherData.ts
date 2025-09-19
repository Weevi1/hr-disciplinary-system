import Logger from '../../utils/logger';
// frontend/src/hooks/dashboard/useWeatherData.ts
// 🌤️ OPTIMIZED WEATHER DATA MANAGEMENT
// ✅ Intelligent caching and error handling

import { useState, useEffect, useCallback } from 'react';
import { getCurrentLocationWeather, getWeatherByCity } from '../../utils/weatherApi';

interface WeatherData {
  current: {
    location: string;
    temperature: number;
    condition: string;
    icon: string;
    humidity: number;
    windSpeed: number;
    feelsLike: number;
  };
  tomorrow: {
    high: number;
    low: number;
    condition: string;
    icon: string;
    chanceOfRain: number;
  };
}

interface WeatherHookReturn {
  weatherData: WeatherData | null;
  weatherLoading: boolean;
  weatherError: string | null;
  refreshWeather: () => Promise<void>;
  lastUpdated: Date | null;
}

// 🌤️ WEATHER CACHE CONFIGURATION
const WEATHER_CACHE_KEY = 'dashboard_weather_cache';
const WEATHER_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

interface WeatherCache {
  data: WeatherData;
  timestamp: number;
}

export const useWeatherData = (): WeatherHookReturn => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // 🎯 CACHE HELPERS
  const getCachedWeather = useCallback((): WeatherData | null => {
    try {
      const cached = localStorage.getItem(WEATHER_CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp }: WeatherCache = JSON.parse(cached);
      const now = Date.now();

      if (now - timestamp > WEATHER_CACHE_DURATION) {
        localStorage.removeItem(WEATHER_CACHE_KEY);
        return null;
      }

      Logger.debug('📦 Using cached weather data')
      return data;
    } catch (error) {
      Logger.warn('⚠️ Weather cache read failed:', error)
      localStorage.removeItem(WEATHER_CACHE_KEY);
      return null;
    }
  }, []);

  const setCachedWeather = useCallback((data: WeatherData) => {
    try {
      const cache: WeatherCache = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(cache));
      Logger.debug('💾 Weather data cached')
    } catch (error) {
      Logger.warn('⚠️ Weather cache write failed:', error)
    }
  }, []);

  // 🌤️ LOAD WEATHER WITH CACHING
  const loadWeather = useCallback(async () => {
    try {
      setWeatherLoading(true);
      setWeatherError(null);

      // Try cache first
      const cachedData = getCachedWeather();
      if (cachedData) {
        setWeatherData(cachedData);
        setWeatherLoading(false);
        setLastUpdated(new Date());
        return;
      }

      Logger.debug('🌤️ Fetching fresh weather data')
      
      let weather: WeatherData;
      
      try {
        weather = await getCurrentLocationWeather();
        Logger.success(3057)
      } catch (locationError) {
        Logger.warn('⚠️ Location weather failed, trying Cape Town fallback:', locationError)
        weather = await getWeatherByCity('Cape Town');
        Logger.success(3311)
      }

      setWeatherData(weather);
      setCachedWeather(weather);
      setLastUpdated(new Date());
      
    } catch (error) {
      Logger.error('❌ All weather APIs failed:', error)
      setWeatherError('Weather data unavailable');
    } finally {
      setWeatherLoading(false);
    }
  }, [getCachedWeather, setCachedWeather]);

  // 🔄 MANUAL REFRESH
  const refreshWeather = useCallback(async () => {
    localStorage.removeItem(WEATHER_CACHE_KEY);
    await loadWeather();
  }, [loadWeather]);

  // 🎯 INITIAL LOAD
  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  return {
    weatherData,
    weatherLoading,
    weatherError,
    refreshWeather,
    lastUpdated
  };
};