// geolocation.js

let userMarker = null; // Declare a variable to hold the marker
let followUserLocation = true; // Default to following the user location
let activityTimeout; // Timeout variable for user activity

// Function to initialize geolocation and update the user's position on the map
export function initializeGeolocation(map) {
    if (navigator.geolocation) {
        // Watch the position to get continuous updates for user movement and heading
        navigator.geolocation.watchPosition((position) => {
            const userLocation = [position.coords.longitude, position.coords.latitude];
            const heading = position.coords.heading; // Get the user's heading (if available)
            
            console.log("User's current position:", userLocation, "Heading:", heading);

            // If a marker already exists, remove it before adding a new one
            if (userMarker) {
                userMarker.remove();
            }

            // Create a div element for the pulsating marker with orientation arrow
            const pulseDiv = document.createElement('div');
            pulseDiv.className = 'pulse-marker'; // Add the class for the pulsating effect and orientation arrow

            // Rotate the arrow based on the user's heading
            if (heading !== null) {
                pulseDiv.style.transform = `rotate(${heading}deg)`;
            }

            // Add the custom pulsating marker with arrow for the user's current position
            userMarker = new mapboxgl.Marker({
                element: pulseDiv,
                anchor: 'center'
            })
            .setLngLat(userLocation)
            .addTo(map);

            // If follow mode is enabled, center the map on the user's location
            if (followUserLocation) {
                map.flyTo({
                    center: userLocation,
                    zoom: 12, // Adjust the zoom level if needed
                    speed: 1.2 // Make the transition smooth
                });
            }
        }, (error) => {
            console.error("Geolocation error:", error);
        });
    } else {
        console.error("Geolocation is not supported by this browser.");
    }
}

// Function to toggle following the user's location
export function setFollowUserLocation(follow) {
    followUserLocation = follow;
}

// Function to reset activity timeout and sync RSS feed
function resetActivityTimeout(syncRssFeed) {
    clearTimeout(activityTimeout);
    activityTimeout = setTimeout(() => {
        syncRssFeed();
    }, 300000); // Sync RSS feed every 5 minutes of inactivity
}

// Function to initialize activity detection
export function initializeActivityTracking(syncRssFeed) {
    // Add event listeners for both mouse and touch events for activity detection
    window.addEventListener('mousemove', () => resetActivityTimeout(syncRssFeed));

    // Touch events to detect activity on mobile devices
    window.addEventListener('touchstart', () => resetActivityTimeout(syncRssFeed));
    window.addEventListener('touchmove', () => resetActivityTimeout(syncRssFeed));
    window.addEventListener('gesturechange', () => resetActivityTimeout(syncRssFeed));  // Detect zoom gestures
    window.addEventListener('gestureend', () => resetActivityTimeout(syncRssFeed));
}
