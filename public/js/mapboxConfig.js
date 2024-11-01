// mapboxConfig.js

export function initializeMapbox() {
    mapboxgl.accessToken = 'pk.eyJ1IjoiamFtZXNmcnV6ZSIsImEiOiJjbTJxMmxicW8wcmFsMmlxenRvcHkza21oIn0.ZwBMy3CY5VBGgUFLXyopvg'; // Replace with your actual Mapbox access token
    const map = new mapboxgl.Map({
        container: 'map', // The ID of the div where the map will be rendered
        style: 'mapbox://styles/mapbox/traffic-day-v2', // Traffic layer style
        center: [-74.0060, 40.7128], // Starting position [longitude, latitude]
        zoom: 10 // Starting zoom level
    });
    return map;
}