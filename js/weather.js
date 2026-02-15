const WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast";
const ANKARA_COORDS = { lat: 39.9334, lon: 32.8597 };

// Weather Codes Mapping (WMO Code)
const weatherCodes = {
    0: { label: 'Açık', icon: 'sun' },
    1: { label: 'Az Bulutlu', icon: 'cloud-sun' },
    2: { label: 'Parçalı Bulutlu', icon: 'cloud-sun' },
    3: { label: 'Kapalı', icon: 'cloud' },
    45: { label: 'Sisli', icon: 'cloud-fog' },
    48: { label: 'Sisli', icon: 'cloud-fog' },
    51: { label: 'Hafif Çiseleme', icon: 'cloud-drizzle' },
    53: { label: 'Çiseleme', icon: 'cloud-drizzle' },
    55: { label: 'Yoğun Çiseleme', icon: 'cloud-drizzle' },
    61: { label: 'Hafif Yağmur', icon: 'cloud-rain' },
    63: { label: 'Yağmur', icon: 'cloud-rain' },
    65: { label: 'Şiddetli Yağmur', icon: 'cloud-rain-wind' },
    71: { label: 'Hafif Kar', icon: 'snowflake' },
    73: { label: 'Kar Yağışlı', icon: 'snowflake' },
    75: { label: 'Yoğun Kar', icon: 'snowflake' },
    77: { label: 'Kar Taneleri', icon: 'snowflake' },
    80: { label: 'Sağanak Yağış', icon: 'cloud-rain' },
    81: { label: 'Şiddetli Sağanak', icon: 'cloud-rain' },
    82: { label: 'Çok Şiddetli Sağanak', icon: 'cloud-rain-wind' },
    95: { label: 'Fırtına', icon: 'cloud-lightning' },
    96: { label: 'Dolu & Fırtına', icon: 'cloud-lightning' },
    99: { label: 'Şiddetli Dolu & Fırtına', icon: 'cloud-lightning' }
};

async function fetchWeather() {
    try {
        const response = await fetch(`${WEATHER_API_URL}?latitude=${ANKARA_COORDS.lat}&longitude=${ANKARA_COORDS.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,precipitation,rain,showers,snowfall,snow_depth,weather_code,pressure_msl,surface_pressure,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,visibility,evapotranspiration,et0_fao_evapotranspiration,vapour_pressure_deficit,wind_speed_10m,wind_speed_80m,wind_speed_120m,wind_speed_180m,wind_direction_10m,wind_direction_80m,wind_direction_120m,wind_direction_180m,wind_gusts_10m,temperature_80m,temperature_120m,temperature_180m,soil_temperature_0cm,soil_temperature_6cm,soil_temperature_18cm,soil_temperature_54cm,soil_moisture_0_to_1cm,soil_moisture_1_to_3cm,soil_moisture_3_to_9cm,soil_moisture_9_to_27cm,soil_moisture_27_to_81cm&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,daylight_duration,sunshine_duration,uv_index_max,uv_index_clear_sky_max,precipitation_sum,rain_sum,showers_sum,snowfall_sum,precipitation_hours,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,shortwave_radiation_sum,et0_fao_evapotranspiration&timezone=auto`);
        const data = await response.json();

        updateWeatherWidget(data.current);
        window.weatherData = data; // Store for modal
    } catch (error) {
        console.error("Hava durumu alınamadı:", error);
        const widget = document.getElementById('weatherWidget');
        if (widget) widget.innerHTML = '<span style="font-size:12px; opacity:0.7;">Veri yok</span>';
    }
}

function updateWeatherWidget(current) {
    const widget = document.getElementById('weatherWidget');
    // Mobile Elements
    const mTemp = document.getElementById('mWeatherTemp');
    const mIcon = document.getElementById('mWeatherIcon');

    const code = current.weather_code;
    const temp = Math.round(current.temperature_2m);
    const humidity = current.relative_humidity_2m;
    const windSpeed = Math.round(current.wind_speed_10m);
    const weatherInfo = weatherCodes[code] || { label: 'Bilinmiyor', icon: 'cloud' };

    // Update Desktop Widget if exists
    if (widget) {
        widget.innerHTML = `
            <div class="weather-icon-large">
                <i data-lucide="${weatherInfo.icon}"></i>
            </div>
            <div class="weather-info">
                <div class="weather-temp">${temp}°</div>
                <div class="weather-desc">${weatherInfo.label}</div>
            </div>
        `;
    }

    // Update Mobile Widget if exists
    if (mTemp && mIcon) {
        mTemp.textContent = `${temp}°`;
        mIcon.innerHTML = `<i data-lucide="${weatherInfo.icon}" style="width:18px; height:18px; color:#1a1a1a;"></i>`;
    }

    // Update Mobile Weather Page Current Card (only if current data exists)
    if (current) {
        updateMobileCurrentWeatherCard(current);
    }

    // YENİDEN ICONLARI OLUŞTUR
    if (window.lucide) lucide.createIcons();
}

// Weather Suggestions Database
const weatherSuggestions = {
    rain: [
        "Yağmurlu günlerde beyaz ayakkabı giyme bence, kirlenmesin.",
        "Şemsiyeni almayı unutma, ıslanmak istemezsin.",
        "Yağmurluk veya su geçirmeyen bir mont hayat kurtarır.",
        "Bugün saçın bozulabilir, şapka veya kapüşon şart.",
        "Su birikintilerine dikkat et, en sevdiğin ayakkabıları giyme."
    ],
    snow: [
        "Kar yağıyor! Botlarını giy ve sıkı giyin.",
        "Atkı, bere ve eldivenlerini al, hava buz gibi.",
        "Kat kat giyinmek için harika bir gün, üşüme.",
        "Kaymayan bir ayakkabı tercih etsen iyi olur."
    ],
    clear_hot: [
        "Hava harika! Güneş gözlüğünü takmayı unutma.",
        "İnce ve açık renkli kıyafetler tercih et, yanma.",
        "Şapka takmak ve güneş kremi sürmek iyi bir fikir.",
        "Bol su içmeyi unutma, hava epey sıcak."
    ],
    clear_cold: [
        "Güneşe aldanma, hava ısırıyor. Kalın montunu al.",
        "Bugün mont iyi olur, hava göründüğünden soğuk.",
        "Güneş var ama dişleri de var, sıkı giyin.",
        "İçlik giymek için utanılacak bir gün değil."
    ],
    cloudy: [
        "Hava biraz kapalı, renkli giyinip modunu yükselt.",
        "Ne sıcak ne soğuk, hırka almak mantıklı olabilir.",
        "Gri bir gün, enerjini yüksek tutacak bir şeyler giy."
    ],
    storm: [
        "Dışarı çıkmasan daha iyi, fırtına var!",
        "Şemsiye bile fayda etmeyebilir, rüzgara dikkat.",
        "Pencereden izlemek için güzel, dışarısı için tehlikeli."
    ]
};

function getSuggestion(code, temp) {
    let category = 'cloudy'; // Default

    // Rain Codes: 51-67, 80-82
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
        category = 'rain';
    }
    // Snow Codes: 71-77, 85-86
    else if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
        category = 'snow';
    }
    // Storm Codes: 95-99
    else if (code >= 95 && code <= 99) {
        category = 'storm';
    }
    // Clear/Partly Cloudy: 0-3
    else if (code <= 3) {
        if (temp > 24) category = 'clear_hot';
        else if (temp < 15) category = 'clear_cold';
        else category = 'cloudy'; // Moderate temp
    }

    const suggestions = weatherSuggestions[category];
    return suggestions[Math.floor(Math.random() * suggestions.length)];
}

function openWeatherModal() {
    if (!window.weatherData) return;

    // Reset flags
    window.dailyWeatherRendered = false;
    window.detailsWeatherRendered = false;

    const modal = document.getElementById('weatherModal');
    const list = document.getElementById('hourlyWeatherList');
    const hourly = window.weatherData.hourly;
    const current = window.weatherData.current;

    if (!modal || !list) return;

    // Render current weather card
    renderCurrentWeather();

    list.innerHTML = '';

    // Get next 24 hours starting from now
    const now = new Date();
    const currentHour = now.getHours();

    // Find index of current hour in hourly.time strings (ISO format)
    // hourly.time array looks like ["2024-02-14T00:00", ...]

    let startIndex = -1;
    for (let i = 0; i < hourly.time.length; i++) {
        const date = new Date(hourly.time[i]);
        if (date.getDate() === now.getDate() && date.getHours() === currentHour) {
            startIndex = i;
            break;
        }
    }

    if (startIndex === -1) startIndex = 0; // Fallback

    for (let i = startIndex; i < startIndex + 24 && i < hourly.time.length; i++) {
        const timeStr = hourly.time[i];
        const date = new Date(timeStr);
        const hour = date.getHours().toString().padStart(2, '0') + ":00";

        const temp = Math.round(hourly.temperature_2m[i]);
        const precip = hourly.precipitation_probability[i];
        const code = hourly.weather_code[i];
        const info = weatherCodes[code] || { icon: 'cloud' };

        const item = document.createElement('div');
        item.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            padding: 18px 16px;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 20px;
            min-width: 90px;
            transition: all 0.3s;
        `;

        item.innerHTML = `
            <div style="font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.5);">${hour}</div>
            <i data-lucide="${info.icon}" style="width: 32px; height: 32px; color: rgba(255,255,255,0.7);"></i>
            <div style="font-size: 20px; font-weight: 900; color: #fff;">${temp}°</div>
            <div style="display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; color: rgba(59, 130, 246, 0.8);">
                <i data-lucide="droplets" style="width:12px; height:12px;"></i> ${precip}%
            </div>
        `;
        list.appendChild(item);
    }

    modal.style.display = 'flex';
    if (window.lucide) lucide.createIcons();
}

function closeWeatherModal() {
    const modal = document.getElementById('weatherModal');
    if (modal) modal.style.display = 'none';
}

// Render Current Weather Card
function renderCurrentWeather() {
    if (!window.weatherData || !window.weatherData.current) return;

    const card = document.getElementById('currentWeatherCard');
    const current = window.weatherData.current;
    const code = current.weather_code;
    const info = weatherCodes[code] || { icon: 'cloud', label: 'Bilinmiyor' };

    const temp = Math.round(current.temperature_2m);
    const feelsLike = Math.round(current.apparent_temperature);
    const humidity = current.relative_humidity_2m;
    const windSpeed = Math.round(current.wind_speed_10m);
    const windDir = current.wind_direction_10m;
    const pressure = Math.round(current.pressure_msl);
    const cloudCover = current.cloud_cover;

    // Wind direction helper
    const getWindDirection = (deg) => {
        const dirs = ['K', 'KD', 'D', 'GD', 'G', 'GB', 'B', 'KB'];
        return dirs[Math.round(deg / 45) % 8];
    };

    card.innerHTML = `
        <div style="display: grid; grid-template-columns: auto 1fr; gap: 40px; align-items: center; position: relative; z-index: 1;">
            <div style="display: flex; flex-direction: column; align-items: center;">
                <i data-lucide="${info.icon}" style="width: 80px; height: 80px; color: #fff; margin-bottom: 15px;"></i>
                <div style="font-size: 64px; font-weight: 900; color: #fff; line-height: 1; margin-bottom: 8px;">${temp}°</div>
                <div style="font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.6);">Hissedilen ${feelsLike}°</div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                <div style="background: rgba(0,0,0,0.2); padding: 15px 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                        <i data-lucide="droplets" style="width: 16px; height: 16px; color: rgba(59, 130, 246, 0.8);"></i>
                        <span style="font-size: 11px; font-weight: 800; color: rgba(255,255,255,0.5); text-transform: uppercase;">Nem</span>
                    </div>
                    <div style="font-size: 24px; font-weight: 900; color: #fff;">${humidity}%</div>
                </div>
                <div style="background: rgba(0,0,0,0.2); padding: 15px 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                        <i data-lucide="wind" style="width: 16px; height: 16px; color: rgba(34, 197, 94, 0.8);"></i>
                        <span style="font-size: 11px; font-weight: 800; color: rgba(255,255,255,0.5); text-transform: uppercase;">Rüzgar</span>
                    </div>
                    <div style="font-size: 24px; font-weight: 900; color: #fff;">${windSpeed} <span style="font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.6);">km/h ${getWindDirection(windDir)}</span></div>
                </div>
                <div style="background: rgba(0,0,0,0.2); padding: 15px 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                        <i data-lucide="gauge" style="width: 16px; height: 16px; color: rgba(168, 85, 247, 0.8);"></i>
                        <span style="font-size: 11px; font-weight: 800; color: rgba(255,255,255,0.5); text-transform: uppercase;">Basınç</span>
                    </div>
                    <div style="font-size: 24px; font-weight: 900; color: #fff;">${pressure} <span style="font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.6);">hPa</span></div>
                </div>
                <div style="background: rgba(0,0,0,0.2); padding: 15px 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                        <i data-lucide="cloud" style="width: 16px; height: 16px; color: rgba(148, 163, 184, 0.8);"></i>
                        <span style="font-size: 11px; font-weight: 800; color: rgba(255,255,255,0.5); text-transform: uppercase;">Bulutluluk</span>
                    </div>
                    <div style="font-size: 24px; font-weight: 900; color: #fff;">${cloudCover}%</div>
                </div>
            </div>
        </div>
        <div style="margin-top: 25px; padding-top: 25px; border-top: 1px solid rgba(255,255,255,0.1);">
            <div style="font-size: 18px; font-weight: 800; color: #fff; margin-bottom: 5px;">${info.label}</div>
            <div style="font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.5);">Son güncelleme: ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
    `;

    if (window.lucide) lucide.createIcons();
}

// Tab Switching (Updated for 3 tabs)
function switchWeatherTab(tab) {
    const hourlyTab = document.getElementById('weatherTabHourly');
    const dailyTab = document.getElementById('weatherTabDaily');
    const detailsTab = document.getElementById('weatherTabDetails');
    const hourlyContainer = document.getElementById('hourlyWeatherContainer');
    const dailyContainer = document.getElementById('dailyWeatherContainer');
    const detailsContainer = document.getElementById('detailsWeatherContainer');

    // Reset all tabs
    [hourlyTab, dailyTab, detailsTab].forEach(t => {
        t.style.background = 'transparent';
        t.style.color = 'rgba(255,255,255,0.4)';
    });

    // Hide all containers
    hourlyContainer.style.display = 'none';
    dailyContainer.style.display = 'none';
    detailsContainer.style.display = 'none';

    if (tab === 'hourly') {
        hourlyTab.style.background = '#fff';
        hourlyTab.style.color = '#000';
        hourlyContainer.style.display = 'block';
    } else if (tab === 'daily') {
        dailyTab.style.background = '#fff';
        dailyTab.style.color = '#000';
        dailyContainer.style.display = 'block';

        if (!window.dailyWeatherRendered) {
            renderDailyWeather();
            window.dailyWeatherRendered = true;
        }
    } else if (tab === 'details') {
        detailsTab.style.background = '#fff';
        detailsTab.style.color = '#000';
        detailsContainer.style.display = 'block';

        if (!window.detailsWeatherRendered) {
            renderDetailedMetrics();
            window.detailsWeatherRendered = true;
        }
    }
}

// Render Daily Weather
function renderDailyWeather() {
    if (!window.weatherData || !window.weatherData.daily) return;

    const dailyList = document.getElementById('dailyWeatherList');
    const daily = window.weatherData.daily;

    dailyList.innerHTML = '';

    const daysOfWeek = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

    for (let i = 0; i < Math.min(7, daily.time.length); i++) {
        const date = new Date(daily.time[i]);
        const dayName = i === 0 ? 'Bugün' : i === 1 ? 'Yarın' : daysOfWeek[date.getDay()];
        const maxTemp = Math.round(daily.temperature_2m_max[i]);
        const minTemp = Math.round(daily.temperature_2m_min[i]);
        const code = daily.weather_code[i];
        const precip = daily.precipitation_probability_max[i] || 0;
        const uvIndex = daily.uv_index_max[i] || 0;
        const windSpeed = Math.round(daily.wind_speed_10m_max[i]);
        const info = weatherCodes[code] || { icon: 'cloud', label: 'Bilinmiyor' };

        const item = document.createElement('div');
        item.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 20px 24px;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 22px;
            transition: all 0.3s;
        `;

        item.innerHTML = `
            <div style="flex: 1; min-width: 120px;">
                <div style="font-size: 16px; font-weight: 800; color: #fff; margin-bottom: 6px;">${dayName}</div>
                <div style="font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.4);">${info.label}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 25px;">
                <div style="display: flex; align-items: center; gap: 6px; color: rgba(59, 130, 246, 0.8); font-size: 12px; font-weight: 700; min-width: 60px;">
                    <i data-lucide="droplets" style="width:14px; height:14px;"></i>
                    ${precip}%
                </div>
                <div style="display: flex; align-items: center; gap: 6px; color: rgba(251, 191, 36, 0.8); font-size: 12px; font-weight: 700; min-width: 60px;">
                    <i data-lucide="sun" style="width:14px; height:14px;"></i>
                    UV ${uvIndex}
                </div>
                <div style="display: flex; align-items: center; gap: 6px; color: rgba(34, 197, 94, 0.8); font-size: 12px; font-weight: 700; min-width: 80px;">
                    <i data-lucide="wind" style="width:14px; height:14px;"></i>
                    ${windSpeed} km/h
                </div>
                <i data-lucide="${info.icon}" style="width: 32px; height: 32px; color: rgba(255,255,255,0.6);"></i>
                <div style="display: flex; align-items: center; gap: 10px; min-width: 100px; justify-content: flex-end;">
                    <span style="font-size: 20px; font-weight: 900; color: #fff;">${maxTemp}°</span>
                    <span style="font-size: 16px; font-weight: 700; color: rgba(255,255,255,0.4);">${minTemp}°</span>
                </div>
            </div>
        `;

        dailyList.appendChild(item);
    }

    if (window.lucide) lucide.createIcons();
}

// Render Detailed Metrics
function renderDetailedMetrics() {
    if (!window.weatherData || !window.weatherData.current) return;

    const grid = document.getElementById('detailedMetricsGrid');
    const current = window.weatherData.current;
    const hourly = window.weatherData.hourly;

    // Get current hour index
    const now = new Date();
    let currentIndex = 0;
    for (let i = 0; i < hourly.time.length; i++) {
        const date = new Date(hourly.time[i]);
        if (date.getDate() === now.getDate() && date.getHours() === now.getHours()) {
            currentIndex = i;
            break;
        }
    }

    const metrics = [
        {
            title: 'Rüzgar Detayları',
            icon: 'wind',
            color: 'rgba(34, 197, 94, 0.8)',
            items: [
                { label: 'Hız', value: `${Math.round(current.wind_speed_10m)} km/h` },
                { label: 'Yön', value: `${current.wind_direction_10m}°` },
                { label: 'Rüzgar Patlamaları', value: `${Math.round(current.wind_gusts_10m)} km/h` }
            ]
        },
        {
            title: 'Basınç & Nem',
            icon: 'gauge',
            color: 'rgba(168, 85, 247, 0.8)',
            items: [
                { label: 'Deniz Seviyesi Basıncı', value: `${Math.round(current.pressure_msl)} hPa` },
                { label: 'Yüzey Basıncı', value: `${Math.round(current.surface_pressure)} hPa` },
                { label: 'Bağıl Nem', value: `${current.relative_humidity_2m}%` }
            ]
        },
        {
            title: 'Görüş Mesafesi',
            icon: 'eye',
            color: 'rgba(59, 130, 246, 0.8)',
            items: [
                { label: 'Görüş Mesafesi', value: hourly.visibility && hourly.visibility[currentIndex] ? `${(hourly.visibility[currentIndex] / 1000).toFixed(1)} km` : 'Veri yok' }
            ]
        },
        {
            title: 'Bulut Katmanları',
            icon: 'cloud',
            color: 'rgba(148, 163, 184, 0.8)',
            items: [
                { label: 'Toplam Bulutluluk', value: `${current.cloud_cover}%` },
                { label: 'Alçak Bulutlar', value: hourly.cloud_cover_low ? `${hourly.cloud_cover_low[currentIndex]}%` : 'N/A' },
                { label: 'Orta Bulutlar', value: hourly.cloud_cover_mid ? `${hourly.cloud_cover_mid[currentIndex]}%` : 'N/A' },
                { label: 'Yüksek Bulutlar', value: hourly.cloud_cover_high ? `${hourly.cloud_cover_high[currentIndex]}%` : 'N/A' }
            ]
        },
        {
            title: 'Yağış Bilgileri',
            icon: 'cloud-rain',
            color: 'rgba(59, 130, 246, 0.8)',
            items: [
                { label: 'Yağış', value: `${current.precipitation || 0} mm` },
                { label: 'Yağmur', value: `${current.rain || 0} mm` },
                { label: 'Sağanak', value: `${current.showers || 0} mm` },
                { label: 'Kar Yağışı', value: `${current.snowfall || 0} cm` }
            ]
        },
        {
            title: 'Çiğ Noktası',
            icon: 'droplet',
            color: 'rgba(14, 165, 233, 0.8)',
            items: [
                { label: 'Çiğ Noktası', value: hourly.dew_point_2m ? `${Math.round(hourly.dew_point_2m[currentIndex])}°C` : 'Veri yok' }
            ]
        }
    ];

    grid.innerHTML = '';

    metrics.forEach(metric => {
        const card = document.createElement('div');
        card.style.cssText = `
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 22px;
            padding: 24px;
            transition: all 0.3s;
        `;

        let itemsHTML = metric.items.map(item => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <span style="font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.5);">${item.label}</span>
                <span style="font-size: 15px; font-weight: 800; color: #fff;">${item.value}</span>
            </div>
        `).join('');

        card.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 18px;">
                <i data-lucide="${metric.icon}" style="width: 20px; height: 20px; color: ${metric.color};"></i>
                <h4 style="margin: 0; font-size: 14px; font-weight: 800; color: #fff; text-transform: uppercase; letter-spacing: 0.5px;">${metric.title}</h4>
            </div>
            <div>${itemsHTML}</div>
        `;

        grid.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
}

// Mobile Weather Page Functions
function updateMobileCurrentWeatherCard(current) {
    const card = document.getElementById('mobileCurrentWeatherCard');
    if (!card) return;

    const code = current.weather_code;
    const info = weatherCodes[code] || { icon: 'cloud', label: 'Bilinmiyor' };
    const temp = Math.round(current.temperature_2m);
    const feelsLike = Math.round(current.apparent_temperature);
    const humidity = current.relative_humidity_2m;
    const windSpeed = Math.round(current.wind_speed_10m);
    const pressure = Math.round(current.pressure_msl);
    const cloudCover = current.cloud_cover;

    card.innerHTML = `
        <div style="text-align: center; padding: 30px 20px;">
            <p style="font-size: 10px; font-weight: 900; color: #a69076; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 15px 0;">ŞUAN</p>
            <i data-lucide="${info.icon}" style="width: 80px; height: 80px; color: #1a1a1a; margin-bottom: 20px;"></i>
            <div style="font-size: 64px; font-weight: 900; color: #1a1a1a; line-height: 1; margin-bottom: 8px;">${temp}°</div>
            <div style="font-size: 16px; font-weight: 700; color: #a69076; margin-bottom: 5px;">${info.label}</div>
            <div style="font-size: 13px; font-weight: 700; color: #bbb;">Hissedilen ${feelsLike}°</div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 0 20px 20px 20px;">
            <div style="background: #f1ede6; padding: 15px; border-radius: 16px; text-align: center;">
                <i data-lucide="droplets" style="width: 20px; height: 20px; color: #3b82f6; margin-bottom: 8px;"></i>
                <div style="font-size: 11px; font-weight: 800; color: #a69076; text-transform: uppercase; margin-bottom: 4px;">Nem</div>
                <div style="font-size: 20px; font-weight: 900; color: #1a1a1a;">${humidity}%</div>
            </div>
            <div style="background: #f1ede6; padding: 15px; border-radius: 16px; text-align: center;">
                <i data-lucide="wind" style="width: 20px; height: 20px; color: #22c55e; margin-bottom: 8px;"></i>
                <div style="font-size: 11px; font-weight: 800; color: #a69076; text-transform: uppercase; margin-bottom: 4px;">Rüzgar</div>
                <div style="font-size: 20px; font-weight: 900; color: #1a1a1a;">${windSpeed} <span style="font-size: 12px;">km/h</span></div>
            </div>
            <div style="background: #f1ede6; padding: 15px; border-radius: 16px; text-align: center;">
                <i data-lucide="gauge" style="width: 20px; height: 20px; color: #a855f7; margin-bottom: 8px;"></i>
                <div style="font-size: 11px; font-weight: 800; color: #a69076; text-transform: uppercase; margin-bottom: 4px;">Basınç</div>
                <div style="font-size: 20px; font-weight: 900; color: #1a1a1a;">${pressure} <span style="font-size: 12px;">hPa</span></div>
            </div>
            <div style="background: #f1ede6; padding: 15px; border-radius: 16px; text-align: center;">
                <i data-lucide="cloud" style="width: 20px; height: 20px; color: #94a3b8; margin-bottom: 8px;"></i>
                <div style="font-size: 11px; font-weight: 800; color: #a69076; text-transform: uppercase; margin-bottom: 4px;">Bulut</div>
                <div style="font-size: 20px; font-weight: 900; color: #1a1a1a;">${cloudCover}%</div>
            </div>
        </div>
    `;

    if (window.lucide) lucide.createIcons();
}

function switchMobileWeatherTab(tab) {
    const tabs = document.querySelectorAll('.mobile-weather-tab');
    const hourlyContainer = document.getElementById('mobileHourlyWeatherContainer');
    const dailyContainer = document.getElementById('mobileDailyWeatherContainer');
    const detailsContainer = document.getElementById('mobileDetailsWeatherContainer');

    // Reset all tabs
    tabs.forEach(t => {
        t.style.background = 'transparent';
        t.style.color = '#a69076';
    });

    // Hide all containers
    hourlyContainer.style.display = 'none';
    dailyContainer.style.display = 'none';
    detailsContainer.style.display = 'none';

    // Activate selected tab
    const activeTab = document.querySelector(`.mobile-weather-tab[data-tab="${tab}"]`);
    if (activeTab) {
        activeTab.style.background = '#fff';
        activeTab.style.color = '#413225';
    }

    if (tab === 'hourly') {
        hourlyContainer.style.display = 'block';
        if (!window.mobileHourlyRendered) {
            renderMobileHourlyWeather();
            window.mobileHourlyRendered = true;
        }
    } else if (tab === 'daily') {
        dailyContainer.style.display = 'block';
        if (!window.mobileDailyRendered) {
            renderMobileDailyWeather();
            window.mobileDailyRendered = true;
        }
    } else if (tab === 'details') {
        detailsContainer.style.display = 'block';
        if (!window.mobileDetailsRendered) {
            renderMobileDetailedMetrics();
            window.mobileDetailsRendered = true;
        }
    }
}

function renderMobileHourlyWeather() {
    if (!window.weatherData || !window.weatherData.hourly) return;

    const list = document.getElementById('mobileHourlyWeatherList');
    const hourly = window.weatherData.hourly;
    const now = new Date();
    const currentHour = now.getHours();

    list.innerHTML = '';

    let startIndex = -1;
    for (let i = 0; i < hourly.time.length; i++) {
        const date = new Date(hourly.time[i]);
        if (date.getDate() === now.getDate() && date.getHours() === currentHour) {
            startIndex = i;
            break;
        }
    }

    if (startIndex === -1) startIndex = 0;

    for (let i = startIndex; i < startIndex + 24 && i < hourly.time.length; i++) {
        const timeStr = hourly.time[i];
        const date = new Date(timeStr);
        const hour = date.getHours().toString().padStart(2, '0') + ":00";

        const temp = Math.round(hourly.temperature_2m[i]);
        const precip = hourly.precipitation_probability[i];
        const code = hourly.weather_code[i];
        const info = weatherCodes[code] || { icon: 'cloud' };

        const item = document.createElement('div');
        item.style.cssText = `
            background: #fff;
            border-radius: 20px;
            padding: 18px 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            min-width: 90px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.03);
        `;

        item.innerHTML = `
            <div style="font-size: 12px; font-weight: 800; color: #a69076;">${hour}</div>
            <i data-lucide="${info.icon}" style="width: 32px; height: 32px; color: #1a1a1a;"></i>
            <div style="font-size: 20px; font-weight: 900; color: #1a1a1a;">${temp}°</div>
            <div style="display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; color: #3b82f6;">
                <i data-lucide="droplets" style="width:12px; height:12px;"></i> ${precip}%
            </div>
        `;
        list.appendChild(item);
    }

    if (window.lucide) lucide.createIcons();
}

function renderMobileDailyWeather() {
    if (!window.weatherData || !window.weatherData.daily) return;

    const list = document.getElementById('mobileDailyWeatherList');
    const daily = window.weatherData.daily;
    const daysOfWeek = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

    list.innerHTML = '';

    for (let i = 0; i < Math.min(7, daily.time.length); i++) {
        const date = new Date(daily.time[i]);
        const dayName = i === 0 ? 'Bugün' : i === 1 ? 'Yarın' : daysOfWeek[date.getDay()];
        const maxTemp = Math.round(daily.temperature_2m_max[i]);
        const minTemp = Math.round(daily.temperature_2m_min[i]);
        const code = daily.weather_code[i];
        const precip = daily.precipitation_probability_max[i] || 0;
        const info = weatherCodes[code] || { icon: 'cloud', label: 'Bilinmiyor' };

        const item = document.createElement('div');
        item.style.cssText = `
            background: #fff;
            border-radius: 20px;
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 4px 15px rgba(0,0,0,0.03);
            margin-bottom: 12px;
        `;

        item.innerHTML = `
            <div style="flex: 1;">
                <div style="font-size: 15px; font-weight: 900; color: #1a1a1a; margin-bottom: 4px;">${dayName}</div>
                <div style="font-size: 12px; font-weight: 700; color: #a69076;">${info.label}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="display: flex; align-items: center; gap: 4px; color: #3b82f6; font-size: 12px; font-weight: 700;">
                    <i data-lucide="droplets" style="width:14px; height:14px;"></i>
                    ${precip}%
                </div>
                <i data-lucide="${info.icon}" style="width: 28px; height: 28px; color: #1a1a1a;"></i>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 18px; font-weight: 900; color: #1a1a1a;">${maxTemp}°</span>
                    <span style="font-size: 16px; font-weight: 700; color: #bbb;">${minTemp}°</span>
                </div>
            </div>
        `;

        list.appendChild(item);
    }

    if (window.lucide) lucide.createIcons();
}

function renderMobileDetailedMetrics() {
    if (!window.weatherData || !window.weatherData.current) return;

    const grid = document.getElementById('mobileDetailedMetricsGrid');
    const current = window.weatherData.current;
    const hourly = window.weatherData.hourly;

    const now = new Date();
    let currentIndex = 0;
    for (let i = 0; i < hourly.time.length; i++) {
        const date = new Date(hourly.time[i]);
        if (date.getDate() === now.getDate() && date.getHours() === now.getHours()) {
            currentIndex = i;
            break;
        }
    }

    const metrics = [
        {
            title: 'Rüzgar Detayları',
            icon: 'wind',
            color: '#22c55e',
            items: [
                { label: 'Hız', value: `${Math.round(current.wind_speed_10m)} km/h` },
                { label: 'Yön', value: `${current.wind_direction_10m}°` },
                { label: 'Patlamalar', value: `${Math.round(current.wind_gusts_10m)} km/h` }
            ]
        },
        {
            title: 'Basınç & Nem',
            icon: 'gauge',
            color: '#a855f7',
            items: [
                { label: 'Deniz Seviyesi', value: `${Math.round(current.pressure_msl)} hPa` },
                { label: 'Yüzey Basıncı', value: `${Math.round(current.surface_pressure)} hPa` },
                { label: 'Bağıl Nem', value: `${current.relative_humidity_2m}%` }
            ]
        },
        {
            title: 'Görüş Mesafesi',
            icon: 'eye',
            color: '#3b82f6',
            items: [
                { label: 'Görüş', value: hourly.visibility && hourly.visibility[currentIndex] ? `${(hourly.visibility[currentIndex] / 1000).toFixed(1)} km` : 'Veri yok' }
            ]
        },
        {
            title: 'Bulut Katmanları',
            icon: 'cloud',
            color: '#94a3b8',
            items: [
                { label: 'Toplam', value: `${current.cloud_cover}%` },
                { label: 'Alçak', value: hourly.cloud_cover_low ? `${hourly.cloud_cover_low[currentIndex]}%` : 'N/A' },
                { label: 'Orta', value: hourly.cloud_cover_mid ? `${hourly.cloud_cover_mid[currentIndex]}%` : 'N/A' },
                { label: 'Yüksek', value: hourly.cloud_cover_high ? `${hourly.cloud_cover_high[currentIndex]}%` : 'N/A' }
            ]
        }
    ];

    grid.innerHTML = '';

    metrics.forEach(metric => {
        const card = document.createElement('div');
        card.style.cssText = `
            background: #fff;
            border-radius: 20px;
            padding: 20px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.03);
            margin-bottom: 12px;
        `;

        let itemsHTML = metric.items.map(item => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,0.05);">
                <span style="font-size: 12px; font-weight: 700; color: #a69076;">${item.label}</span>
                <span style="font-size: 15px; font-weight: 800; color: #1a1a1a;">${item.value}</span>
            </div>
        `).join('');

        card.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                <i data-lucide="${metric.icon}" style="width: 20px; height: 20px; color: ${metric.color};"></i>
                <h4 style="margin: 0; font-size: 13px; font-weight: 900; color: #1a1a1a; text-transform: uppercase; letter-spacing: 0.5px;">${metric.title}</h4>
            </div>
            <div>${itemsHTML}</div>
        `;

        grid.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
}

// Initial fetch
document.addEventListener('DOMContentLoaded', fetchWeather);
setInterval(fetchWeather, 1800000); // 30 mins refresh
