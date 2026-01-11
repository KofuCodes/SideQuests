// ==========================================
// MAP INITIALIZATION & MARKER RENDERING
// ==========================================

/**
 * Initialize Leaflet map
 */
function initMap() {
  state.map = L.map('map').setView([43.6532, -79.3832], 13);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(state.map);

  state.markers = L.layerGroup().addTo(state.map);

  getUserPosition().then(pos => {
    state.map.setView([pos.lat, pos.lng], 14);
    const playerIcon = L.icon({
      iconUrl: '../assets/Pins/Map_Dino.png',
      iconSize: [64, 64],
      iconAnchor: [32, 64],
      popupAnchor: [0, -64]
    });
    state.userMarker = L.marker([pos.lat, pos.lng], { icon: playerIcon })
      .addTo(state.map)
      .bindPopup('You are here');
  });
}

/**
 * Render all quest markers on map with filtering
 */
function renderMapMarkers() {
  const iconMap = {
    food: L.icon({
      iconUrl: '../assets/Pins/Food_Pin.png',
      iconSize: [56, 56],
      iconAnchor: [28, 56],
      popupAnchor: [0, -56]
    }),
    fitness: L.icon({
      iconUrl: '../assets/Pins/Fitness_Dino.png',
      iconSize: [56, 56],
      iconAnchor: [28, 56],
      popupAnchor: [0, -56]
    }),
    culture: L.icon({
      iconUrl: '../assets/Pins/Culture_Dino.png',
      iconSize: [56, 56],
      iconAnchor: [28, 56],
      popupAnchor: [0, -56]
    }),
    outdoors: L.icon({
      iconUrl: '../assets/Pins/Food_Pin.png',
      iconSize: [56, 56],
      iconAnchor: [28, 56],
      popupAnchor: [0, -56]
    })
  };

  // Create markers lazily (only once per quest)
  for (const quest of state.quests) {
    if (state.markerIndex.has(quest.id)) continue;

    const icon = iconMap[quest.badge] || iconMap.food;
    const marker = L.marker([quest.lat, quest.lng], { icon: icon });
    marker.on('click', () => openQuestDrawer(quest));
    state.markerIndex.set(quest.id, marker);
  }

  // Apply filter by adding/removing from layerGroup
  state.markers.clearLayers();
  for (const [questId, marker] of state.markerIndex.entries()) {
    const quest = state.quests.find(q => q.id === questId);
    if (!quest) continue;

    const matches = (state.selectedBadge === 'all' || quest.badge === state.selectedBadge);
    if (matches) {
      marker.addTo(state.markers);
    }
  }
}

/**
 * Load quests from OpenStreetMap via Overpass API
 */
async function loadQuestsFromOSM(center) {
  const jobs = [];

  // User location jobs
  for (const badge of BADGES) {
    jobs.push({ kind: "user", badge: badge.id, loc: center, radius: 7500 });
  }

  // Hub jobs - check all hubs
  for (const hub of ACTIVITY_HUBS) {
    for (const badge of BADGES) {
      jobs.push({ kind: "hub", badge: badge.id, loc: hub, radius: 3000, hubName: hub.name });
    }
  }

  // Run jobs in parallel
  const results = await Promise.allSettled(
    jobs.map(async (job) => {
      const data = await fetchOverpass(job.loc, job.badge, job.radius);
      const mapped = (data.elements || []).map(el => {
        const q = osmToQuest(el, job.badge);
        if (job.kind === "hub") q.hubCity = job.hubName;
        return q;
      });
      return job.kind === "hub" ? mapped.slice(0, 3) : mapped;
    })
  );

  // Collect successes
  const quests = [];
  for (const r of results) {
    if (r.status === "fulfilled") quests.push(...r.value);
  }

  state.quests = quests;
  return quests;
}
