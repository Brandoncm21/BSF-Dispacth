// ============================================================
// Script: Batch Geocode Legacy Addresses to locations
// Run: node scripts/migrate-locations.js
// Requires: NEXT_PUBLIC_MAPBOX_TOKEN env var
// ============================================================

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role for updates
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

if (!SUPABASE_URL || !SUPABASE_KEY || !MAPBOX_TOKEN) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_MAPBOX_TOKEN');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function geocodeAddress(formattedAddress) {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(formattedAddress)}.json?access_token=${MAPBOX_TOKEN}&country=US&limit=1`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.features?.[0]) return null;
  
  const feature = data.features[0];
  const [lng, lat] = feature.center;
  const placeId = feature.id;
  
  // Extract context
  let city = null, state = null, zip = null;
  if (feature.context) {
    for (const ctx of feature.context) {
      if (ctx.id.startsWith('place.')) city = ctx.text;
      if (ctx.id.startsWith('region.')) state = ctx.text;
      if (ctx.id.startsWith('postcode.')) zip = ctx.text;
    }
  }
  
  return {
    lat,
    lng,
    mapbox_place_id: placeId,
    city: city || null,
    state: state || null,
    zip: zip || null,
  };
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('Fetching legacy locations without lat/lng...');
  
  const { data: locations, error } = await supabase
    .from('locations')
    .select('location_id, formatted_address, street, city, state')
    .is('lat', null)
    .is('lng', null)
    .eq('source', 'legacy');
  
  if (error) {
    console.error('Error fetching locations:', error);
    process.exit(1);
  }
  
  console.log(`Found ${locations?.length || 0} locations to geocode`);
  
  let success = 0;
  let failed = 0;
  const failures = [];
  
  for (let i = 0; i < locations.length; i++) {
    const loc = locations[i];
    const query = loc.formatted_address || `${loc.street}, ${loc.city}, ${loc.state}`;
    
    console.log(`[${i + 1}/${locations.length}] Geocoding: ${query}`);
    
    try {
      const result = await geocodeAddress(query);
      
      if (result) {
        const { error: updateError } = await supabase
          .from('locations')
          .update({
            lat: result.lat,
            lng: result.lng,
            mapbox_place_id: result.mapbox_place_id,
            city: result.city || loc.city,
            state: result.state || loc.state,
            zip: result.zip,
          })
          .eq('location_id', loc.location_id);
        
        if (updateError) {
          console.error('  Update error:', updateError);
          failed++;
          failures.push({ id: loc.location_id, query, reason: 'update failed' });
        } else {
          console.log(`  -> lat=${result.lat}, lng=${result.lng}`);
          success++;
        }
      } else {
        console.log('  -> No results from Mapbox');
        failed++;
        failures.push({ id: loc.location_id, query, reason: 'no geocode results' });
      }
    } catch (err) {
      console.error('  Error:', err.message);
      failed++;
      failures.push({ id: loc.location_id, query, reason: err.message });
    }
    
    // Rate limit: 1 request per second (Mapbox free tier)
    await sleep(1000);
  }
  
  console.log('\n=== MIGRATION SUMMARY ===');
  console.log(`Total: ${locations.length}`);
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);
  
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(f => console.log(`  - ${f.query}: ${f.reason}`));
  }
  
  console.log('\nDone.');
}

main();
