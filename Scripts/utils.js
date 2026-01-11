// ==========================================
// UTILITY & HELPER FUNCTIONS
// ==========================================

/**
 * Calculate distance between two lat/lng points in meters (Haversine formula)
 */
function metersBetween(a, b) {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 = Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s1 + s2));
}

/**
 * Fetch OSM data from Overpass API
 */
async function fetchOverpass(location, badge, radius) {
  const filters = {
    food: `node(around:${radius},${location.lat},${location.lng})["amenity"~"restaurant|cafe|fast_food"];`,
    fitness: `node(around:${radius},${location.lat},${location.lng})["leisure"~"fitness_centre|sports_centre"];`,
    outdoors: `node(around:${radius},${location.lat},${location.lng})["leisure"="park"];`,
    culture: `node(around:${radius},${location.lat},${location.lng})["tourism"~"museum|gallery"];`
  };

  const query = `[out:json][timeout:25];(${filters[badge]});out center 40;`;
  
  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
      headers: { 'Content-Type': 'text/plain' }
    });
    return res.json();
  } catch (error) {
    console.error('Overpass API error:', error);
    return { elements: [] };
  }
}

/**
 * Convert OSM element to quest object
 */
function osmToQuest(el, badge) {
  const name = el.tags?.name || "Unknown Location";
  const template = BADGE_TEMPLATES[badge];

  return {
    id: `osm_${badge}_${el.id}`,
    name: template.title(name),
    badge,
    lat: el.lat,
    lng: el.lon,
    baseXP: badge === "food" ? 70 : badge === "fitness" ? 80 : 60,
    note: template.instructions(name),
    hubCity: null
  };
}

/**
 * Get current rank based on XP
 */
function getRank(xp) {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (xp >= r.minXP) rank = r;
  }
  return rank;
}

/**
 * Get progress toward next rank
 */
function getProgress(xp) {
  let current = RANKS[0];
  let next = null;
  
  for (let i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].minXP) current = RANKS[i];
    if (xp < RANKS[i].minXP) {
      next = RANKS[i];
      break;
    }
  }
  
  if (!next) return { percent: 100, next: null };
  
  const span = next.minXP - current.minXP;
  const progress = xp - current.minXP;
  return { percent: (progress / span) * 100, next };
}

/**
 * Get badge label with emoji
 */
function getBadgeLabel(id) {
  const badge = BADGES.find(b => b.id === id);
  return badge ? `${badge.icon} ${badge.label}` : id;
}

/**
 * Get badge asset filename
 */
function getBadgeAsset(id) {
  const badge = BADGES.find(b => b.id === id);
  return badge ? badge.asset : null;
}

/**
 * Show error message temporarily
 */
function showError(message) {
  const authError = $('authError');
  if (authError) {
    authError.textContent = message;
    authError.classList.remove('hidden');
    setTimeout(() => authError.classList.add('hidden'), 5000);
  } else {
    console.error(message);
  }
}

/**
 * DOM helper - already in config but documented here for reference
 */
// const $ = (id) => document.getElementById(id);
