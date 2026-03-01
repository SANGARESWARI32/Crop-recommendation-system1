// ===== GLOBAL VARIABLES =====
let weatherData = {
    temperature: null,
    description: null,
    location: null
};

// ===== PAGE INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Load weather data on home page
    if (document.getElementById('temperature')) {
        fetchWeatherData();
    }
    
    // Add loading indicators
    addLoadingIndicators();
    
    // Initialize page based on URL
    initializePage();
});

function initializePage() {
    const path = window.location.pathname;
    
    if (path.includes('contact')) {
        initializeContactPage();
    } else if (path.includes('query')) {
        initializeQueryPage();
    }
}

function addLoadingIndicators() {
    // Add loading class to buttons when clicked
    const buttons = document.querySelectorAll('button[onclick]');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            if (!this.classList.contains('no-loading')) {
                const originalText = this.innerHTML;
                this.innerHTML = '<span class="loading"></span> Processing...';
                this.disabled = true;
                
                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.disabled = false;
                }, 1000);
            }
        });
    });
}

// ===== WEATHER FUNCTIONS =====
function fetchWeatherData() {
    const tempElement = document.getElementById('temperature');
    const weatherElement = document.getElementById('weather');
    const locationElement = document.getElementById('location');
    
    // Show loading state
    if (tempElement) tempElement.innerHTML = '<span class="loading"></span> Loading temperature...';
    if (weatherElement) weatherElement.innerHTML = '<span class="loading"></span> Loading weather...';
    if (locationElement) locationElement.innerHTML = '<span class="loading"></span> Detecting location...';
    
    // Try to get user's location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                // Success - get weather with coordinates
                getWeatherByCoords(position.coords.latitude, position.coords.longitude);
            },
            function(error) {
                // Error or denied - use IP-based location
                console.log('Geolocation error:', error.message);
                getWeatherByIP();
            },
            {
                timeout: 10000,
                maximumAge: 600000 // 10 minutes cache
            }
        );
    } else {
        // Browser doesn't support geolocation
        getWeatherByIP();
    }
}

function getWeatherByCoords(lat, lon) {
    const tempElement = document.getElementById('temperature');
    const weatherElement = document.getElementById('weather');
    const locationElement = document.getElementById('location');
    
    // Using Open-Meteo API (free, no API key required)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m&timezone=auto`;
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Weather API error');
            }
            return response.json();
        })
        .then(data => {
            if (data.current_weather) {
                const temp = data.current_weather.temperature;
                const weatherCode = data.current_weather.weathercode;
                const windSpeed = data.current_weather.windspeed;
                
                // Convert weather code to description
                const weatherDesc = getWeatherDescription(weatherCode);
                
                weatherData.temperature = temp;
                weatherData.description = weatherDesc;
                
                // Update UI
                tempElement.innerHTML = `<i class="fas fa-thermometer-half"></i> ${temp}°C`;
                weatherElement.innerHTML = `<i class="fas fa-cloud-sun"></i> ${weatherDesc}`;
                
                // Get location name using reverse geocoding
                getLocationName(lat, lon);
            }
        })
        .catch(error => {
            console.error('Weather fetch error:', error);
            fallbackWeatherData();
        });
}

function getWeatherByIP() {
    const tempElement = document.getElementById('temperature');
    const weatherElement = document.getElementById('weather');
    const locationElement = document.getElementById('location');
    
    // Get location from IP using ipapi.co (free)
    fetch('https://ipapi.co/json/')
        .then(response => response.json())
        .then(data => {
            const city = data.city || 'Unknown';
            const region = data.region || '';
            const country = data.country_name || '';
            
            if (locationElement) {
                locationElement.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${city}, ${region} ${country}`.trim();
            }
            
            // Get weather for this location using coordinates from IP
            if (data.latitude && data.longitude) {
                getWeatherByCoords(data.latitude, data.longitude);
            } else {
                fallbackWeatherData();
            }
        })
        .catch(error => {
            console.error('IP location error:', error);
            fallbackWeatherData();
        });
}

function getLocationName(lat, lon) {
    const locationElement = document.getElementById('location');
    
    // Using OpenStreetMap Nominatim (free, no API key)
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`;
    
    fetch(url, {
        headers: {
            'User-Agent': 'CropRecommendation/1.0'
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.address) {
                const city = data.address.city || data.address.town || data.address.village || 'Unknown';
                const country = data.address.country || '';
                locationElement.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${city}, ${country}`;
            }
        })
        .catch(error => {
            console.error('Reverse geocoding error:', error);
            locationElement.innerHTML = `<i class="fas fa-map-marker-alt"></i> Location detected`;
        });
}

function getWeatherDescription(code) {
    // WMO Weather interpretation codes
    const weatherCodes = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Fog',
        48: 'Rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        56: 'Freezing drizzle',
        57: 'Dense freezing drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        66: 'Freezing rain',
        67: 'Heavy freezing rain',
        71: 'Slight snow',
        73: 'Moderate snow',
        75: 'Heavy snow',
        77: 'Snow grains',
        80: 'Slight rain showers',
        81: 'Moderate rain showers',
        82: 'Violent rain showers',
        85: 'Slight snow showers',
        86: 'Heavy snow showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with hail',
        99: 'Heavy thunderstorm with hail'
    };
    
    return weatherCodes[code] || 'Unknown weather condition';
}

function fallbackWeatherData() {
    // Fallback to sample data
    const tempElement = document.getElementById('temperature');
    const weatherElement = document.getElementById('weather');
    const locationElement = document.getElementById('location');
    
    if (tempElement) tempElement.innerHTML = '<i class="fas fa-thermometer-half"></i> 28°C (Sample)';
    if (weatherElement) weatherElement.innerHTML = '<i class="fas fa-cloud-sun"></i> Partly cloudy (Sample)';
    if (locationElement) locationElement.innerHTML = '<i class="fas fa-map-marker-alt"></i> Sample Location';
    
    weatherData.temperature = 28;
    weatherData.description = 'Partly cloudy (Sample)';
}

function refreshWeather() {
    const refreshIcon = document.querySelector('.weather-refresh i');
    if (refreshIcon) {
        refreshIcon.style.animation = 'spin 1s linear infinite';
    }
    
    fetchWeatherData();
    
    // Stop spinning after 3 seconds
    setTimeout(() => {
        if (refreshIcon) {
            refreshIcon.style.animation = '';
        }
    }, 3000);
}

// ===== CROP RECOMMENDATION FUNCTION =====
function recommendCrop() {
    const soil = document.getElementById('soil')?.value;
    const previousCrop = document.getElementById('previousCrop')?.value;
    const resultElement = document.getElementById('result');
    
    if (!soil) {
        showResult('⚠️ Please select a soil type', 'warning');
        return;
    }
    
    if (!previousCrop) {
        showResult('⚠️ Please select a previously planted crop', 'warning');
        return;
    }
    
    // Get temperature from weather data
    let temperature = weatherData.temperature || 28;
    
    // Crop recommendation logic
    const recommendations = getCropRecommendation(soil, previousCrop, temperature);
    
    // Display recommendation with animation
    showResult(`🌱 Recommended Crop: ${recommendations.crop}`, 'success');
    
    // Add additional info
    setTimeout(() => {
        const resultBox = document.getElementById('resultBox');
        const additionalInfo = document.createElement('div');
        additionalInfo.className = 'additional-info';
        additionalInfo.innerHTML = `
            <small style="display: block; margin-top: 10px; opacity: 0.8;">
                <i class="fas fa-info-circle"></i> ${recommendations.reason}
            </small>
        `;
        
        // Remove old additional info if exists
        const oldInfo = resultBox.querySelector('.additional-info');
        if (oldInfo) oldInfo.remove();
        
        resultBox.appendChild(additionalInfo);
    }, 500);
}

function getCropRecommendation(soil, previousCrop, temperature) {
    const soilType = soil;
    const lowerPrev = previousCrop.toLowerCase();
    
    // Temperature category
    let tempCategory = 'moderate';
    if (temperature < 18) tempCategory = 'cool';
    else if (temperature > 30) tempCategory = 'hot';
    
    // Crop database with rotation rules
    const cropDatabase = {
        clay: {
            rice: {
                crop: 'Wheat',
                reason: 'Wheat grows well in clay soil after rice. Good rotation for nitrogen balance.'
            },
            wheat: {
                crop: 'Soybean',
                reason: 'Soybean fixes nitrogen in clay soil, perfect after wheat.'
            },
            cotton: {
                crop: 'Maize',
                reason: 'Maize benefits from cotton residue in clay soil.'
            },
            maize: {
                crop: 'Groundnut',
                reason: 'Groundnut helps break pest cycles after maize in clay soil.'
            },
            sugarcane: {
                crop: 'Potato',
                reason: 'Potato is an excellent break crop after sugarcane in clay soil.'
            },
            default: {
                crop: 'Sorghum',
                reason: 'Sorghum is well-suited for clay soil conditions.'
            }
        },
        sandy: {
            rice: {
                crop: 'Groundnut',
                reason: 'Groundnut thrives in sandy soil and follows rice well.'
            },
            wheat: {
                crop: 'Pearl Millet',
                reason: 'Pearl millet is drought-tolerant and perfect for sandy soil after wheat.'
            },
            cotton: {
                crop: 'Chili',
                reason: 'Chili peppers grow well in sandy soil after cotton.'
            },
            maize: {
                crop: 'Green Gram',
                reason: 'Green gram fixes nitrogen and suits sandy soil after maize.'
            },
            sugarcane: {
                crop: 'Sweet Potato',
                reason: 'Sweet potato is ideal for sandy soil after sugarcane.'
            },
            default: {
                crop: 'Millet',
                reason: 'Millet varieties are well-adapted to sandy soil conditions.'
            }
        },
        loamy: {
            rice: {
                crop: 'Mustard',
                reason: 'Mustard is an excellent cash crop after rice in loamy soil.'
            },
            wheat: {
                crop: 'Cotton',
                reason: 'Cotton performs excellently in loamy soil after wheat.'
            },
            cotton: {
                crop: 'Vegetables',
                reason: 'Mixed vegetables benefit from loamy soil after cotton.'
            },
            maize: {
                crop: 'Chickpea',
                reason: 'Chickpea fixes nitrogen and thrives in loamy soil after maize.'
            },
            sugarcane: {
                crop: 'Rice',
                reason: 'Rice-wheat rotation works well in loamy soil after sugarcane.'
            },
            default: {
                crop: 'Sunflower',
                reason: 'Sunflower is profitable in loamy soil conditions.'
            }
        }
    };
    
    // Temperature-based adjustments
    const tempAdjustments = {
        cool: {
            wheat: 'Winter Wheat',
            barley: 'Barley',
            pea: 'Peas',
            lentil: 'Lentils',
            potato: 'Potatoes'
        },
        hot: {
            cotton: 'Cotton',
            maize: 'Summer Maize',
            millet: 'Pearl Millet',
            groundnut: 'Groundnut',
            sugarcane: 'Sugarcane'
        }
    };
    
    // Get base recommendation
    let recommendation;
    if (cropDatabase[soilType] && cropDatabase[soilType][lowerPrev]) {
        recommendation = cropDatabase[soilType][lowerPrev];
    } else {
        recommendation = cropDatabase[soilType]?.default || {
            crop: 'Legumes',
            reason: 'Legumes are generally good for crop rotation.'
        };
    }
    
    // Adjust for temperature
    let finalCrop = recommendation.crop;
    if (tempCategory === 'cool') {
        for (let [coolCrop, adjusted] of Object.entries(tempAdjustments.cool)) {
            if (finalCrop.toLowerCase().includes(coolCrop)) {
                finalCrop = adjusted;
                break;
            }
        }
    } else if (tempCategory === 'hot') {
        for (let [hotCrop, adjusted] of Object.entries(tempAdjustments.hot)) {
            if (finalCrop.toLowerCase().includes(hotCrop)) {
                finalCrop = adjusted;
                break;
            }
        }
    }
    
    return {
        crop: finalCrop,
        reason: recommendation.reason + ` (Current temperature: ${temperature}°C - ${tempCategory} conditions)`
    };
}

function showResult(message, type) {
    const resultElement = document.getElementById('result');
    const resultBox = document.getElementById('resultBox');
    
    if (!resultElement) return;
    
    resultElement.innerHTML = message;
    
    // Add color based on type
    resultBox.style.background = type === 'success' 
        ? 'rgba(0,255,200,0.2)' 
        : 'rgba(255,100,100,0.2)';
    
    // Animate
    resultBox.style.animation = 'none';
    resultBox.offsetHeight; // Trigger reflow
    resultBox.style.animation = 'pop 0.5s ease';
    
    // Reset background after 2 seconds
    setTimeout(() => {
        resultBox.style.background = 'rgba(255,255,255,0.15)';
    }, 2000);
}

// ===== CONTACT PAGE FUNCTIONS =====
function initializeContactPage() {
    console.log('Contact page initialized');
    
    // Add copy to clipboard functionality
    const infoCards = document.querySelectorAll('.info-card p');
    infoCards.forEach(card => {
        card.addEventListener('click', function() {
            const text = this.innerText;
            copyToClipboard(text);
            showToast('Copied to clipboard!');
        });
        card.style.cursor = 'pointer';
    });
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).catch(err => {
        console.error('Copy failed:', err);
    });
}

function showToast(message) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(45deg, #00ffcc, #00b894);
        color: #0a2f1f;
        padding: 1rem 2rem;
        border-radius: 50px;
        font-weight: 600;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// ===== QUERY PAGE FUNCTIONS =====
function initializeQueryPage() {
    console.log('Query page initialized');
    
    // Add character counter for message
    const messageField = document.getElementById('message');
    if (messageField) {
        messageField.addEventListener('input', function() {
            const counter = document.getElementById('charCounter') || createCharCounter();
            const remaining = 500 - this.value.length;
            counter.innerHTML = `${remaining} characters remaining`;
            counter.style.color = remaining < 50 ? '#ff6b6b' : '#00ffcc';
        });
    }
    
    // Add file size validation
    const fileInput = document.getElementById('attachment');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            if (this.files[0] && this.files[0].size > 5 * 1024 * 1024) {
                alert('File size must be less than 5MB');
                this.value = '';
            }
        });
    }
}

function createCharCounter() {
    const counter = document.createElement('small');
    counter.id = 'charCounter';
    counter.style.cssText = `
        display: block;
        margin-top: 5px;
        color: #00ffcc;
    `;
    
    const messageField = document.getElementById('message');
    messageField.parentNode.appendChild(counter);
    return counter;
}

function submitQuery(event) {
    event.preventDefault();
    
    // Get form data
    const formData = {
        name: document.getElementById('name')?.value,
        email: document.getElementById('email')?.value,
        phone: document.getElementById('phone')?.value,
        queryType: document.getElementById('queryType')?.value,
        subject: document.getElementById('subject')?.value,
        message: document.getElementById('message')?.value,
        urgent: document.getElementById('urgent')?.checked,
        copyMe: document.getElementById('copyMe')?.checked,
        timestamp: new Date().toISOString()
    };
    
    // Validate required fields
    if (!formData.name || !formData.email || !formData.queryType || !formData.subject || !formData.message) {
        showToast('Please fill all required fields');
        return;
    }
    
    // Validate email format
    if (!isValidEmail(formData.email)) {
        showToast('Please enter a valid email address');
        return;
    }
    
    // Show loading state
    const submitBtn = event.target.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="loading"></span> Submitting...';
    submitBtn.disabled = true;
    
    // Simulate API call (replace with actual backend in production)
    setTimeout(() => {
        // Hide form, show success message
        const form = document.getElementById('queryForm');
        const successMsg = document.getElementById('successMessage');
        
        if (form && successMsg) {
            form.style.display = 'none';
            successMsg.style.display = 'block';
        }
        
        // Store query in localStorage (demo purpose)
        saveQueryToLocal(formData);
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        showToast('Query submitted successfully!');
    }, 2000);
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function saveQueryToLocal(queryData) {
    // Get existing queries
    let queries = JSON.parse(localStorage.getItem('cropQueries') || '[]');
    
    // Add new query
    queries.push(queryData);
    
    // Save back to localStorage
    localStorage.setItem('cropQueries', JSON.stringify(queries));
    
    console.log('Query saved:', queryData);
}

function resetForm() {
    const form = document.getElementById('queryForm');
    const successMsg = document.getElementById('successMessage');
    
    if (form && successMsg) {
        form.reset();
        form.style.display = 'block';
        successMsg.style.display = 'none';
    }
}

// ===== UTILITY FUNCTIONS =====
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .loading {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 50%;
        border-top-color: #00ffcc;
        animation: spin 1s ease-in-out infinite;
        margin-right: 8px;
    }
    
    .toast-message i {
        margin-right: 8px;
    }
    
    .additional-info {
        animation: fadeIn 0.5s ease;
    }
`;

document.head.appendChild(style);

// ===== EXPORT FUNCTIONS FOR GLOBAL USE =====
window.recommendCrop = recommendCrop;
window.refreshWeather = refreshWeather;
window.submitQuery = submitQuery;
window.resetForm = resetForm;