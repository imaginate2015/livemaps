// markers.js

import { getIconForTitle } from './utils.js';

export let markers = {};  // Store markers by location ID

// Function to add a marker to the map
export function addMarker(locationId, location, map, eventIcons) {
    const title = location.title || 'Unknown Incident';
    const iconUrl = getIconForTitle(title, eventIcons);  // Pass eventIcons here

    const markerDiv = document.createElement('div');
    markerDiv.style.backgroundImage = `url(${iconUrl})`;
    markerDiv.style.width = '32px';
    markerDiv.style.height = '32px';
    markerDiv.style.backgroundSize = 'contain';

    const marker = new mapboxgl.Marker({
        element: markerDiv,
        anchor: 'bottom'
    })
    .setLngLat([location.longitude, location.latitude])
    .addTo(map);

    const popupContent = `
        <strong>${title}</strong><br/>
        Suburb: ${location.suburb}<br/>
        Local Council: ${location.local_council}<br/>
        Time Reported: ${location.time_reported}<br/>
        Response: ${location.response}<br/>
        Reported Near: ${location.reported_near}
    `;

    const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupContent);
    marker.setPopup(popup);

    markers[locationId] = marker;
}

// Function to remove a marker from the map
export function removeMarker(locationId) {
    if (markers[locationId]) {
        markers[locationId].remove();
        delete markers[locationId];
    }
}

