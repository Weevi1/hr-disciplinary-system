import Logger from 'logger';
// frontend/src/utils/weatherApi.js
// 🌤️ Real Weather Data from OpenWeatherMap (Free API)

const WEATHER_API_KEY = 'c1ad8342a5ba6f29688178b2b90a82d8'; // Replace with your actual API key
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// 🌍 Get weather by coordinates (GPS)
export const getWeatherByCoords = async (lat, lon) => {
  try {
    // Get current weather
    const currentResponse = await fetch(
      `${WEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
    );
    const currentData = await currentResponse.json();

    // Get 5-day forecast (we'll use tomorrow's data)
    const forecastResponse = await fetch(
      `${WEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
    );
    const forecastData = await forecastResponse.json();

    // Find tomorrow's forecast (next day)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowForecasts = forecastData.list.filter(item => {
      const itemDate = new Date(item.dt * 1000);
      return itemDate.toDateString() === tomorrow.toDateString();
    });

    // Get min/max for tomorrow
    const tomorrowTemps = tomorrowForecasts.map(f => f.main.temp);
    const tomorrowHigh = Math.round(Math.max(...tomorrowTemps));
    const tomorrowLow = Math.round(Math.min(...tomorrowTemps));

    // Format the data to match our component structure
    return {
      current: {
        location: `${currentData.name}, ${currentData.sys.country}`,
        temperature: Math.round(currentData.main.temp),
        condition: currentData.weather[0].main,
        icon: currentData.weather[0].main.toLowerCase(),
        humidity: currentData.main.humidity,
        windSpeed: Math.round(currentData.wind.speed * 3.6), // Convert m/s to km/h
        feelsLike: Math.round(currentData.main.feels_like)
      },
      tomorrow: {
        high: tomorrowHigh,
        low: tomorrowLow,
        condition: tomorrowForecasts[0]?.weather[0].main || 'Clear',
        icon: tomorrowForecasts[0]?.weather[0].main.toLowerCase() || 'clear',
        chanceOfRain: Math.round((tomorrowForecasts[0]?.pop || 0) * 100)
      }
    };
  } catch (error) {
    Logger.error('Weather API Error:', error)
    // Return fallback data if API fails
    return {
      current: {
        location: "Cape Town, ZA",
        temperature: 22,
        condition: "Partly Cloudy",
        icon: "partly-cloudy",
        humidity: 65,
        windSpeed: 15,
        feelsLike: 24
      },
      tomorrow: {
        high: 26,
        low: 18,
        condition: "Sunny",
        icon: "sunny",
        chanceOfRain: 10
      }
    };
  }
};

// 🏙️ Get weather by city name (fallback if GPS denied)
export const getWeatherByCity = async (cityName = 'Cape Town') => {
  try {
    const currentResponse = await fetch(
      `${WEATHER_BASE_URL}/weather?q=${cityName}&appid=${WEATHER_API_KEY}&units=metric`
    );
    const currentData = await currentResponse.json();

    const forecastResponse = await fetch(
      `${WEATHER_BASE_URL}/forecast?q=${cityName}&appid=${WEATHER_API_KEY}&units=metric`
    );
    const forecastData = await forecastResponse.json();

    // Find tomorrow's forecast
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowForecasts = forecastData.list.filter(item => {
      const itemDate = new Date(item.dt * 1000);
      return itemDate.toDateString() === tomorrow.toDateString();
    });

    const tomorrowTemps = tomorrowForecasts.map(f => f.main.temp);
    const tomorrowHigh = Math.round(Math.max(...tomorrowTemps));
    const tomorrowLow = Math.round(Math.min(...tomorrowTemps));

    return {
      current: {
        location: `${currentData.name}, ${currentData.sys.country}`,
        temperature: Math.round(currentData.main.temp),
        condition: currentData.weather[0].main,
        icon: currentData.weather[0].main.toLowerCase(),
        humidity: currentData.main.humidity,
        windSpeed: Math.round(currentData.wind.speed * 3.6),
        feelsLike: Math.round(currentData.main.feels_like)
      },
      tomorrow: {
        high: tomorrowHigh,
        low: tomorrowLow,
        condition: tomorrowForecasts[0]?.weather[0].main || 'Clear',
        icon: tomorrowForecasts[0]?.weather[0].main.toLowerCase() || 'clear',
        chanceOfRain: Math.round((tomorrowForecasts[0]?.pop || 0) * 100)
      }
    };
  } catch (error) {
    Logger.error('Weather API Error:', error)
    return null;
  }
};

// 📍 Get user's location and fetch weather
export const getCurrentLocationWeather = async () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const weatherData = await getWeatherByCoords(latitude, longitude);
        resolve(weatherData);
      },
      async (error) => {
        Logger.debug('Location denied, using default city')
        // Fallback to Cape Town if location denied
        const weatherData = await getWeatherByCity('Cape Town');
        resolve(weatherData);
      },
      {
        timeout: 10000,
        enableHighAccuracy: true,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
};