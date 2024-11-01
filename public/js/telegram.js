// telegram.js

// Your Telegram bot token
const TELEGRAM_BOT_TOKEN = '7017538507:AAGu4Y4T4WDPOoQCp-qXRla5K80koNIUfhU';

// Store the telegram locations globally
let telegramLocations = [];

// Function to parse a Telegram message and extract coordinates
export function parseTelegramMessage(message) {
    const regex = /https:\/\/www\.waze\.com\/ul\?ll=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = message.match(regex);

    if (match) {
        const latitude = parseFloat(match[1]);
        const longitude = parseFloat(match[2]);
        console.log(`Parsed Coordinates: Latitude: ${latitude}, Longitude: ${longitude}`);
        return { latitude, longitude };
    } else {
        console.warn('No coordinates found in the message.');
        return null;
    }
}

// Function to update the map based on the number of points
export function updateMapWithTelegramLocations(map, coordinates) {
    if (coordinates) {
        // Add the new coordinate to the global list of telegram locations
        telegramLocations.push(coordinates);

        if (telegramLocations.length <= 5) {
            // Switch to individual markers if there are 5 or fewer points
            displayMarkers(map);
        } else {
            // Switch to heatmap for more than 5 points
            displayHeatmap(map);
        }
    } else {
        console.error('Invalid coordinates, unable to update the map.');
    }
}

// Function to display individual markers
function displayMarkers(map) {
    // Clear the heatmap source
    if (map.getSource('telegram-locations')) {
        map.getSource('telegram-locations').setData({ type: 'FeatureCollection', features: [] });
    }

    // Add individual markers for each coordinate
    telegramLocations.forEach(coordinates => {
        const el = document.createElement('div');
        el.className = 'pulse-marker';  // Class for styling the marker
        new mapboxgl.Marker(el)
            .setLngLat([coordinates.longitude, coordinates.latitude])
            .addTo(map);
    });

    console.log('Displaying individual markers.');
}

// Function to display heatmap
function displayHeatmap(map) {
    const features = telegramLocations.map(coordinates => ({
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [coordinates.longitude, coordinates.latitude]
        },
        properties: {}
    }));

    const heatmapData = {
        type: 'FeatureCollection',
        features: features
    };

    if (map.getSource('telegram-locations')) {
        map.getSource('telegram-locations').setData(heatmapData);
    }

    console.log('Displaying heatmap.');
}

// Function to get real-time messages from Telegram using long polling and update the map
export async function fetchTelegramUpdates(map) {
    let offset = 0;  // Keeps track of the last processed message
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`;

    while (true) {
        try {
            const response = await fetch(`${url}?offset=${offset}&timeout=30`); // 30 seconds timeout for long polling
            const data = await response.json();

            if (data.ok) {
                for (const update of data.result) {
                    const message = update.message?.text || '';
                    console.log(`Received message: ${message}`);

                    // Parse the message for coordinates
                    const coordinates = parseTelegramMessage(message);

                    // Update the map based on the number of Telegram locations
                    updateMapWithTelegramLocations(map, coordinates);

                    // Update offset to ensure we only get new messages
                    offset = update.update_id + 1;
                }
            } else {
                console.error('Error fetching Telegram updates:', data);
            }
        } catch (error) {
            console.error('Error in Telegram long polling:', error);
        }
    }
}
