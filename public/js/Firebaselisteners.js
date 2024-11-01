// Firebaselisteners.js

import { addMarker, removeMarker } from './markers.js';

export function initializeFirebaseListeners(map) {
    const db = firebase.database();
    const locationsRef = db.ref('locations');

    let eventIcons = {}; // Declare eventIcons variable

    // Fetch event icons from Firebase
    const eventIconsRef = db.ref('eventIcons');
    eventIconsRef.on('value', (snapshot) => {
        eventIcons = snapshot.val(); // Fetch eventIcons data
        console.log('Event icons fetched: ', eventIcons);
    });

    // Listen for new or changed locations
    locationsRef.on('child_added', (snapshot) => {
        const location = snapshot.val();
        const locationId = snapshot.key;
        addMarker(locationId, location, map, eventIcons);  // Pass eventIcons here
    });

    locationsRef.on('child_changed', (snapshot) => {
        const location = snapshot.val();
        const locationId = snapshot.key;
        removeMarker(locationId); // Remove the existing marker before updating
        addMarker(locationId, location, map, eventIcons);  // Pass eventIcons here
    });

    // Listen for deleted locations
    locationsRef.on('child_removed', (snapshot) => {
        const locationId = snapshot.key;
        removeMarker(locationId);
    });
}

