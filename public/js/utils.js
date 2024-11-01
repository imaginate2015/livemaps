// utils.js
export function getIconForTitle(title, eventIcons) {
    const normalizedTitle = title.toLowerCase();
    const keywordToIconMap = {
    'vehicle fire': 'Vehicle Fire',   // Specific first
    'structure fire': 'Structure Fire',
    'rescue': 'Rescue',
    'road crash':'Road Crash',
    'materials': 'Hazardous Materials',
    'incident': 'Incident',
    'report of smoke': 'Report of Smoke',
    'bushfire': 'Fire',   // Lowercased for matching consistency
    'fire': 'Fire',       // More general after 'vehicle fire'
    'active alarm': 'Active Alarm'
};



    // Ensure eventIcons is not undefined or empty before proceeding
    if (!eventIcons || Object.keys(eventIcons).length === 0) {
        console.warn('eventIcons is either not loaded or empty, using fallback icon');
        return 'https://firebasestorage.googleapis.com/v0/b/live-feed-map.appspot.com/o/Icon-round-Question_mark.svg.png?alt=media&token=d33f6812-a923-4898-b61e-f126100955d8';
    }

    // Try to match the title against the keywords in keywordToIconMap
    for (const keyword in keywordToIconMap) {
        if (normalizedTitle.includes(keyword)) {
            const iconKey = keywordToIconMap[keyword];
            const iconUrl = eventIcons[iconKey];
            
            // Return the icon if it exists in eventIcons, otherwise log a warning and fallback
            if (iconUrl) {
                return iconUrl;
            } else {
                console.warn(`Icon for '${iconKey}' not found in eventIcons, using fallback icon`);
                return 'https://firebasestorage.googleapis.com/v0/b/live-feed-map.appspot.com/o/Icon-round-Question_mark.svg.png?alt=media&token=d33f6812-a923-4898-b61e-f126100955d8';
            }
        }
    }

    // Fallback icon if no match is found in keywordToIconMap
    console.warn(`No matching keyword found for title: '${title}', using default fallback icon`);
    return 'https://firebasestorage.googleapis.com/v0/b/live-feed-map.appspot.com/o/ew-other-fire.svg?alt=media&token=de9999ab-4e3b-49ee-be13-961bd41cc167';
}
