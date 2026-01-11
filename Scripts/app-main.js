// ==========================================
// EVENT LISTENERS & INITIALIZATION
// ==========================================

/**
 * Setup DOM element references for event listeners
 */
function setupEventListeners() {
  const loginForm = $('loginForm');
  const signupForm = $('signupForm');
  const logoutBtn = $('logoutBtn');
  const closeDrawer = $('closeDrawer');
  const photoUpload = $('photoUpload');
  const photoPreview = $('photoPreview');
  const previewImg = $('previewImg');
  const openCircles = $('openCircles');
  const openProfile = $('openProfile');
  const circlesModal = $('circlesModal');
  const profileModal = $('profileModal');
  const createCircleModal = $('createCircleModal');

  // Auth form submission
  if (loginForm) loginForm.addEventListener('submit', handleLogin);
  if (signupForm) signupForm.addEventListener('submit', handleSignup);
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  // Drawer control
  if (closeDrawer) closeDrawer.addEventListener('click', closeQuestDrawer);

  // Photo upload
  if (photoUpload) {
    photoUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file && previewImg) {
        state.uploadedPhoto = file;
        const url = URL.createObjectURL(file);
        previewImg.src = url;
        if (photoPreview) photoPreview.classList.remove('hidden');
      }
    });
  }

  // Modal toggles
  if (openCircles) {
    openCircles.addEventListener('click', () => {
      if (circlesModal) circlesModal.classList.remove('hidden');
      renderCircles();
      renderFriends();
    });
  }

  if (openProfile) {
    openProfile.addEventListener('click', renderProfileModal);
  }

  // Modal close buttons
  const closeCirclesBtn = $('closeCirclesModal');
  const closeProfileBtn = $('closeProfileModal');
  const closeCreateCircleBtn = $('closeCreateCircle');

  if (closeCirclesBtn) closeCirclesBtn.addEventListener('click', () => {
    if (circlesModal) circlesModal.classList.add('hidden');
  });

  if (closeProfileBtn) closeProfileBtn.addEventListener('click', () => {
    if (profileModal) profileModal.classList.add('hidden');
  });

  if (closeCreateCircleBtn) closeCreateCircleBtn.addEventListener('click', () => {
    if (createCircleModal) createCircleModal.classList.add('hidden');
  });

  // Create circle form
  const createCircleForm = $('createCircleForm');
  const createCircleBtn = $('createCircle');
  if (createCircleBtn) {
    createCircleBtn.addEventListener('click', () => {
      if (createCircleModal) createCircleModal.classList.remove('hidden');
    });
  }
  if (createCircleForm) {
    createCircleForm.addEventListener('submit', handleCreateCircle);
  }

  // Friend request button
  const sendFriendBtn = $('sendFriendRequest');
  if (sendFriendBtn) {
    sendFriendBtn.addEventListener('click', handleSendFriendRequest);
  }

  // Modal backdrop closes
  if (circlesModal) {
    circlesModal.addEventListener('click', (e) => {
      if (e.target === circlesModal) circlesModal.classList.add('hidden');
    });
  }

  if (profileModal) {
    profileModal.addEventListener('click', (e) => {
      if (e.target === profileModal) profileModal.classList.add('hidden');
    });
  }

  if (createCircleModal) {
    createCircleModal.addEventListener('click', (e) => {
      if (e.target === createCircleModal) createCircleModal.classList.add('hidden');
    });
  }

  // Circles tabs
  document.querySelectorAll('.circles-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.circles-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      document.querySelectorAll('.circles-tab-content').forEach(c => c.classList.add('hidden'));
      const tabContent = $(tab.dataset.tab + 'Tab');
      if (tabContent) tabContent.classList.remove('hidden');
    });
  });

  // Map expand/collapse
  const mapWindow = $('mapWindow');
  const toggleMapFull = $('toggleMapFull');
  if (toggleMapFull && mapWindow) {
    toggleMapFull.addEventListener('click', () => {
      const expanded = mapWindow.classList.toggle('map-expanded');
      document.body.classList.toggle('map-fullscreen', expanded);
      toggleMapFull.textContent = expanded ? 'Collapse Map' : 'Expand Map';
      setTimeout(() => {
        if (state.map && typeof state.map.invalidateSize === 'function') {
          state.map.invalidateSize();
        }
      }, 350);
    });
  }
}

/**
 * Render profile modal with user stats
 */
function renderProfileModal() {
  const profileUsername = $('profileUsername');
  const profileEmail = $('profileEmail');
  const profileInitial = $('profileInitial');
  const profileTotalXP = $('profileTotalXP');
  const profileCompletedQuests = $('profileCompletedQuests');
  const profileCircles = $('profileCircles');
  const profileBadges = $('profileBadges');
  const profileModal = $('profileModal');

  if (profileUsername) profileUsername.textContent = state.user?.user_metadata?.username || 'User';
  if (profileEmail) profileEmail.textContent = state.user?.email || '';
  if (profileInitial) profileInitial.textContent = (state.user?.user_metadata?.username || 'U')[0].toUpperCase();
  if (profileTotalXP) profileTotalXP.textContent = state.userStats.totalXP;
  if (profileCompletedQuests) profileCompletedQuests.textContent = state.userStats.completedQuests;
  if (profileCircles) profileCircles.textContent = state.circles.length;

  if (profileBadges) {
    profileBadges.innerHTML = BADGES.map(b => {
      const xp = state.userStats.badgeXP[b.id];
      const rank = getRank(xp);
      return `
        <div class="badge-progress-item">
          <div class="badge-progress-info">
            <div class="badge-progress-icon">${b.icon}</div>
            <div>
              <div>${b.label}</div>
              <div style="font-size: 12px; color: var(--text-muted)">${rank.name}</div>
            </div>
          </div>
          <div class="badge-progress-xp">${xp} XP</div>
        </div>
      `;
    }).join('');
  }

  if (profileModal) profileModal.classList.remove('hidden');
}

/**
 * Setup auth tab switching
 */
function setupAuthTabs() {
  const tabs = document.querySelectorAll('.auth-tab');
  
  tabs.forEach((tab) => {
    tab.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Remove active from all
      tabs.forEach(t => t.classList.remove('active'));
      
      // Add active to clicked
      this.classList.add('active');
      
      // Get forms
      const loginForm = $('loginForm');
      const signupForm = $('signupForm');
      
      // Switch forms
      if (this.dataset.tab === 'login') {
        if (loginForm) loginForm.classList.remove('hidden');
        if (signupForm) signupForm.classList.add('hidden');
      } else {
        if (loginForm) loginForm.classList.add('hidden');
        if (signupForm) signupForm.classList.remove('hidden');
      }
    });
  });
}

/**
 * Main app initialization
 */
async function init() {
  // Setup event listeners
  setupEventListeners();
  setupAuthTabs();

  const { data: { session } } = await supabaseClient.auth.getSession();
  
  if (session) {
    showApp();
    await loadUserData();
    renderAll();
  }
}

/**
 * Initialize on DOM ready
 */
document.addEventListener('DOMContentLoaded', init);

// ==========================================
// PLACEHOLDER FUNCTIONS (TO BE IMPLEMENTED)
// ==========================================
async function handleCompleteQuest() {
  // To be implemented
  console.log('handleCompleteQuest not yet implemented');
}

async function handleCreateCircle() {
  // To be implemented
  console.log('handleCreateCircle not yet implemented');
}

async function handleSendFriendRequest() {
  // To be implemented
  console.log('handleSendFriendRequest not yet implemented');
}

async function handleAcceptFriendRequest(requestId, friendId) {
  // To be implemented
  console.log('handleAcceptFriendRequest not yet implemented');
}
