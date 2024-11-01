const admin = require('firebase-admin');
const feedparser = require('feedparser');
const fetch = require('node-fetch');

// Initialize Firebase Admin SDK
const serviceAccount = require('./live-map-1282a-firebase-adminsdk-ae3yr-6216d4bfc4.json');  // Ensure you use your actual service account file
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://live-map-1282a-default-rtdb.asia-southeast1.firebasedatabase.app/"  // Replace with your Firebase Realtime Database URL
});

// RSS Feed URL (incoming feed)
const rss_feed_url = "https://api.emergency.wa.gov.au/v1/rss/incidents";

// Reference to Firebase Realtime Database 'locations' node
const db = () => admin.database().ref('locations');

// Function to fetch and parse the RSS feed, then sync it to Firebase
async function syncRssToFirebase() {
  try {
    // Fetch the RSS feed
    const response = await fetch(rss_feed_url);
    const feed = new feedparser();

    // Pipe the response stream into the feedparser
    response.body.pipe(feed);

    feed.on('error', (error) => {
      console.error('Error parsing RSS feed:', error);
    });

    feed.on('readable', function () {
      let item;

      while ((item = this.read())) {
        // Extract relevant details from the feed item
        const title = item.title;
        const published = item.pubDate;
        const latitude = item.geo_lat || 'N/A';
        const longitude = item.geo_long || 'N/A';

        // Simple check to skip "Burn Off" incidents (you can modify this as needed)
        if (title.includes("Burn Off")) continue;

        const { incident_type, suburb, local_council, cad_id } = parseTitle(title);

        // Format date/time
        const formatted_date = formatAwstTime(published).date;
        const formatted_time = formatAwstTime(published).time;
        const time_reported = `${formatted_time}, ${formatted_date}`;

        // Sync to Firebase if valid latitude/longitude
        if (latitude !== 'N/A' && longitude !== 'N/A') {
          updateFirebaseLocation(cad_id, latitude, longitude, title, suburb, local_council, time_reported);
        }
      }
    });
  } catch (error) {
    console.error('Error syncing RSS feed to Firebase:', error);
  }
}

// Function to update Firebase Realtime Database
async function updateFirebaseLocation(location_id, latitude, longitude, title, suburb, local_council, time_reported) {
  try {
    await db().child(location_id).set({
      latitude,
      longitude,
      title,
      suburb,
      local_council,
      time_reported,
    });
    console.log(`Updated location ${location_id} in Firebase with coordinates: (${latitude}, ${longitude})`);
  } catch (error) {
    console.error(`Error updating Firebase for location ${location_id}:`, error);
  }
}

// Helper function to parse the title and extract incident details
function parseTitle(title) {
  const match = /(.+?) \(([^,]+), (.+?), CAD-ID: (\d+)\)/.exec(title);
  if (match) {
    return {
      incident_type: match[1],
      suburb: match[2].toUpperCase().trim(),
      local_council: match[3],
      cad_id: match[4]
    };
  }
  return { incident_type: '', suburb: '', local_council: '', cad_id: '' };
}

// Helper function to format date/time (AWST)
function formatAwstTime(published_date) {
  const awst_time = new Date(published_date);
  const formatted_date = awst_time.toLocaleDateString('en-AU'); // Format as dd/mm/yyyy
  const formatted_time = awst_time.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
  return { date: formatted_date, time: formatted_time };
}

// Run the syncRssToFirebase function
syncRssToFirebase().then(() => {
  console.log("RSS Feed Sync completed.");
}).catch((error) => {
  console.error("Error running the sync:", error);
});
