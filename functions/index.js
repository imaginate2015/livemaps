const functions = require('firebase-functions');
const admin = require('firebase-admin');
const feedparser = require('feedparser');
const fetch = require('node-fetch');
const cors = require('cors')({ origin: true }); // CORS middleware

// Initialize Firebase Admin SDK using your service account key
const serviceAccount = require('./live-map-1282a-firebase-adminsdk-ae3yr-6216d4bfc4.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://live-map-1282a-default-rtdb.asia-southeast1.firebasedatabase.app/"
});

// Reference to Firebase Realtime Database
const db = () => admin.database().ref('locations');

// Function to sync RSS feed data to Firebase and return feed data
async function syncRssToFirebase() {
  const items = []; // Array to store RSS feed items
  const feedEntryIds = []; // Array to store IDs of current feed entries

  try {
    const rssFeedUrl = "https://api.emergency.wa.gov.au/v1/rss/incidents";
    const response = await fetch(rssFeedUrl);
    const feed = new feedparser();

    // Log if we successfully fetched the RSS feed
    console.log('RSS feed fetched successfully');

    // Pipe the response to feedparser
    response.body.pipe(feed);

    feed.on('error', (error) => {
      console.error('Error parsing RSS feed:', error);
    });

    feed.on('readable', function () {
      let item;
      while ((item = this.read())) {
        // Log the complete feed item for debugging
        console.log('Full Feed Item:', item);

        // Extract relevant fields
        const title = item.title;
        const published = item.pubDate;

        // Check if the title contains "insert filters" and skip it if true
        if (title.toLowerCase().includes('insert filters')) {
          console.log(`Skipping item with title: ${title} because it contains "Insert Filters"`);
          continue;  // Skip this item
        }

        // Correctly parse the latitude and longitude
        const latitude = item['geo:lat'] ? item['geo:lat']['#'] : 'N/A';
        const longitude = item['geo:long'] ? item['geo:long']['#'] : 'N/A';

        // Simple check to skip "Burn Off" incidents (you can modify this as needed)
        if (title.toLowerCase().includes('burn off')) continue;

        const { incident_type, suburb, local_council, cad_id } = parseTitle(title);
        const formatted_date = formatAwstTime(published).date;
        const formatted_time = formatAwstTime(published).time;
        const time_reported = `${formatted_time}, ${formatted_date}`;

        // Log parsed details
        console.log(`Parsed Incident: ${title}, Lat: ${latitude}, Long: ${longitude}`);

        // Add CAD ID to the list of IDs from the RSS feed
        feedEntryIds.push(cad_id);

        // Push the parsed item into the array
        items.push({
          title,
          published,
          latitude,
          longitude,
          suburb,
          local_council,
          time_reported
        });

        // Update Firebase Realtime Database
        if (latitude !== 'N/A' && longitude !== 'N/A') {
          updateFirebaseLocation(cad_id, latitude, longitude, title, suburb, local_council, time_reported);
        }
      }
    });

    // Return a promise that resolves when the feed is done parsing
    return new Promise((resolve, reject) => {
      feed.on('end', async () => {
        console.log('RSS feed parsing complete, removing missing entries...');
        await removeMissingEntries(feedEntryIds); // Remove markers that are not in the current feed
        resolve(items);
      });

      feed.on('error', (error) => {
        console.error('Error during feed parsing:', error);
        reject(error);
      });
    });

  } catch (error) {
    console.error('Error syncing RSS feed to Firebase:', error);
    throw new Error('Error syncing RSS feed');
  }
}

// Function to update Firebase Realtime Database with new or updated entries
async function updateFirebaseLocation(location_id, latitude, longitude, title, suburb, local_council, time_reported) {
  try {
    await db().child(location_id).set({
      latitude,
      longitude,
      title,
      suburb,
      local_council,
      time_reported
    });
    console.log(`Updated location ${location_id} in Firebase with coordinates: (${latitude}, ${longitude})`);
  } catch (error) {
    console.error(`Error updating Firebase for location ${location_id}:`, error);
  }
}

// Function to remove entries that are no longer in the RSS feed
async function removeMissingEntries(feedEntryIds) {
  try {
    // Get all current entries from Firebase
    const snapshot = await db().once('value');
    const currentEntries = snapshot.val();

    // Loop through each current entry in Firebase
    for (const location_id in currentEntries) {
      // If the current CAD ID is not in the latest RSS feed, remove it from Firebase
      if (!feedEntryIds.includes(location_id)) {
        await db().child(location_id).remove();
        console.log(`Removed outdated location ${location_id} from Firebase`);
      }
    }
  } catch (error) {
    console.error('Error removing missing entries from Firebase:', error);
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

// Helper function to format date/time into AWST
function formatAwstTime(published_date) {
  // Create a Date object from the UTC published date
  const utcDate = new Date(published_date);
  
  // Convert it to Australian Western Standard Time (AWST, UTC+8)
  const options = {
    timeZone: 'Australia/Perth', // AWST time zone
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true  // 12-hour format
  };

  const formatted_date = utcDate.toLocaleDateString('en-AU', { timeZone: 'Australia/Perth' });
  const formatted_time = utcDate.toLocaleTimeString('en-AU', options);

  return { date: formatted_date, time: formatted_time };
}

// Cloud Function with CORS handling
exports.syncRssToFirebase = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Sync the RSS feed and get the data
      const feedData = await syncRssToFirebase();
      
      // Log the feed data
      console.log('Feed data to return:', feedData);

      // Return the feed data as JSON in the HTTP response
      res.status(200).json({
        message: 'RSS Feed Synced Successfully',
        data: feedData
      });
      
    } catch (error) {
      console.error('Error syncing RSS feed:', error);
      res.status(500).send('Error syncing RSS feed');
    }
  });
});
