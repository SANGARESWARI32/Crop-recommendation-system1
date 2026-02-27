const apiKey = "359fcf222c68a8cf7496e0283b9f8076";

// 🌦 Get Real Weather
async function getWeather() {
    const city = "Chennai";

    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`
        );

        const data = await response.json();

        const temp = data.main.temp;
        const weather = data.weather[0].main;

        document.getElementById("temperature").innerText =
            "Temperature: " + temp + " °C";

        document.getElementById("weather").innerText =
            "Weather: " + weather;

        // store for recommendation
        window.currentTemp = temp;
        window.currentWeather = weather;

    } catch (error) {
        console.log("Weather error:", error);
    }
}

function recommendCrop() {
    const soil = document.getElementById("soil").value;
    const previous = document.getElementById("previousCrop").value;
    const temp = window.currentTemp;
    const weather = window.currentWeather;

    let suggestion = "";

    if (!soil || !previous) {
        suggestion = "Please select soil and previous crop.";
    }

    // 🌾 Clay Soil Logic
    else if (soil === "clay") {

        if (temp > 30 && weather.includes("Rain")) {
            suggestion = "Recommended: Rice 🌾 (High temperature + Rain)";
        }
        else if (previous === "rice") {
            suggestion = "Recommended: Pulses 🌱 (Nitrogen recovery)";
        }
        else {
            suggestion = "Recommended: Wheat or Maize";
        }
    }

    // 🌾 Sandy Soil Logic
    else if (soil === "sandy") {

        if (temp > 28 && weather.includes("Clear")) {
            suggestion = "Recommended: Groundnut 🥜";
        }
        else if (previous === "cotton") {
            suggestion = "Recommended: Millets 🌾";
        }
        else {
            suggestion = "Recommended: Watermelon 🍉 or Vegetables";
        }
    }

    // 🌾 Loamy Soil Logic
    else if (soil === "loamy") {

        if (temp >= 20 && temp <= 30) {
            suggestion = "Recommended: Maize 🌽 or Sugarcane";
        }
        else if (previous === "wheat") {
            suggestion = "Recommended: Soybean 🌱";
        }
        else {
            suggestion = "Recommended: Vegetables 🥬";
        }
    }

    else {
        suggestion = "No suitable crop found.";
    }

    document.getElementById("result").innerText = suggestion;
}

getWeather();