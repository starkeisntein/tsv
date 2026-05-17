const IP_API_URL = 'https://ipapi.co/json/';
const WTTR_URL = 'https://wttr.in';

let weatherData = null;

async function getLocation() {
  try {
    const response = await fetch(IP_API_URL);
    const data = await response.json();
    return {
      lat: data.latitude,
      lon: data.longitude,
      city: data.city,
      country: data.country_name,
    };
  } catch (e) {
    console.warn('IP定位失败, 使用默认坐标');
    return { lat: 39.9042, lon: 116.4074, city: '北京', country: '中国' };
  }
}

async function fetchWeatherFromWttr(lat, lon) {
  try {
    const url = `${WTTR_URL}/${lat},${lon}?format=j1&lang=zh`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('wttr.in 请求失败');
    const data = await response.json();
    return data;
  } catch (e) {
    console.warn('wttr.in 天气获取失败:', e);
    return null;
  }
}

function parseWttrData(data, city) {
  if (!data || !data.current_condition || data.current_condition.length === 0) {
    return null;
  }
  const current = data.current_condition[0];
  const weatherCode = parseInt(current.weatherCode);
  const desc = current.lang_zh && current.lang_zh[0] ? current.lang_zh[0].value : current.weatherDesc[0].value;

  return {
    city: city || data.nearest_area?.[0]?.areaName?.[0]?.value || '未知',
    temp: current.temp_C,
    desc: desc,
    humidity: current.humidity,
    windSpeed: current.windspeedKmph,
    iconCode: weatherCode,
  };
}

function getWeatherEmoji(code) {
  if (code >= 113) return '☀️';
  if (code >= 116 && code <= 119) return '⛅';
  if (code >= 122 && code <= 143) return '☁️';
  if (code >= 176 && code <= 200) return '🌧️';
  if (code >= 227 && code <= 230) return '🌨️';
  if (code >= 248 && code <= 260) return '🌫️';
  if (code >= 263 && code <= 389) return '⛈️';
  if (code >= 392 && code <= 395) return '🌨️';
  return '🌡️';
}

function updateWeatherUI(weatherData, city) {
  if (!weatherData) {
    document.getElementById('weather-city').textContent = '天气数据不可用';
    document.getElementById('weather-temp').textContent = '--°C';
    document.getElementById('weather-desc').textContent = '请检查网络连接';
    return;
  }

  document.getElementById('weather-city').textContent = weatherData.city || city || '未知';
  document.getElementById('weather-temp').textContent = `${weatherData.temp}°C`;
  document.getElementById('weather-desc').textContent = weatherData.desc;
  document.getElementById('weather-icon').textContent = getWeatherEmoji(weatherData.iconCode);
  document.getElementById('weather-humidity').textContent = `湿度: ${weatherData.humidity}%`;
  document.getElementById('weather-wind').textContent = `风速: ${(weatherData.windSpeed * 1.609).toFixed(1)} km/h`;
}

async function refreshWeather() {
  document.getElementById('weather-city').textContent = '更新中...';
  const location = await getLocation();
  const rawData = await fetchWeatherFromWttr(location.lat, location.lon);
  const parsed = parseWttrData(rawData, location.city);
  updateWeatherUI(parsed, location.city);
  return parsed;
}

refreshWeather();
setInterval(refreshWeather, 600000);