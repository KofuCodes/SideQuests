// ==========================================
// UI RENDERING & DRAWER MANAGEMENT
// ==========================================

/**
 * Render all UI components
 */
function renderAll() {
  renderNavStats();
  renderBadges();
  renderProgress();
  renderCircles();
  renderRecentActivity();
  renderMapMarkers();
}

/**
 * Render navigation stats (XP, quests, friends)
 */
function renderNavStats() {
  const userDisplayName = $('userDisplayName');
  const totalXP = $('totalXP');
  const totalQuests = $('totalQuests');
  const friendCount = $('friendCount');

  if (userDisplayName) userDisplayName.textContent = state.user?.user_metadata?.username || 'Explorer';
  if (totalXP) totalXP.textContent = state.userStats.totalXP;
  if (totalQuests) totalQuests.textContent = state.userStats.completedQuests;
  if (friendCount) friendCount.textContent = state.friends.length;
}

/**
 * Render badge filter buttons
 */
function renderBadges() {
  const badgeFilters = $('badgeFilters');
  if (!badgeFilters) return;

  const assetPath = '../assets/Badges/';
  
  badgeFilters.innerHTML = `
    <div class="badge-item ${state.selectedBadge === 'all' ? 'active' : ''}" data-badge="all">
      <div class="badge-icon">🌐</div>
      <div class="badge-label">All</div>
    </div>
    ${BADGES.map(b => `
      <div class="badge-item ${state.selectedBadge === b.id ? 'active' : ''}" data-badge="${b.id}">
        <img src="${assetPath}${b.asset}" alt="${b.label}" class="badge-icon-img" />
        <div class="badge-label">${b.label}</div>
      </div>
    `).join('')}
  `;

  document.querySelectorAll('.badge-item').forEach(el => {
    el.onclick = () => {
      state.selectedBadge = el.dataset.badge;
      renderBadges();
      renderProgress();
      renderMapMarkers();
    };
  });
}

/**
 * Render progress bar for selected badge
 */
function renderProgress() {
  if (state.selectedBadge === 'all') {
    const progressBadge = $('progressBadge');
    const progressRank = $('progressRank');
    const progressFill = $('progressFill');
    const progressXP = $('progressXP');
    const progressNext = $('progressNext');

    if (progressBadge) progressBadge.textContent = 'Select a badge';
    if (progressRank) progressRank.textContent = '—';
    if (progressFill) progressFill.style.width = '0%';
    if (progressXP) progressXP.textContent = '0 XP';
    if (progressNext) progressNext.textContent = '—';
    return;
  }

  const xp = state.userStats.badgeXP[state.selectedBadge];
  const rank = getRank(xp);
  const progress = getProgress(xp);

  const progressBadge = $('progressBadge');
  const progressRank = $('progressRank');
  const progressFill = $('progressFill');
  const progressXP = $('progressXP');
  const progressNext = $('progressNext');

  if (progressBadge) progressBadge.textContent = getBadgeLabel(state.selectedBadge);
  if (progressRank) progressRank.textContent = rank.name;
  if (progressFill) progressFill.style.width = progress.percent + '%';
  if (progressXP) progressXP.textContent = xp + ' XP';
  if (progressNext) progressNext.textContent = progress.next ? `${progress.next.minXP - xp} to ${progress.next.name}` : 'Max Rank';
}

/**
 * Render active circles list
 */
function renderCircles() {
  const activeCircles = $('activeCircles');
  if (!activeCircles) return;

  activeCircles.innerHTML = state.circles.length === 0
    ? '<p style="color: var(--text-muted); font-size: 13px;">No active circles</p>'
    : state.circles.map(c => `
        <div class="circle-item ${state.activeCircle?.id === c.id ? 'active' : ''}" data-circle='${JSON.stringify(c)}'>
          <div class="circle-name">${c.name}</div>
          <div class="circle-members">${c.xp_multiplier}x XP</div>
        </div>
      `).join('');

  document.querySelectorAll('.circle-item').forEach(el => {
    el.onclick = () => {
      const circle = JSON.parse(el.dataset.circle);
      state.activeCircle = state.activeCircle?.id === circle.id ? null : circle;
      renderCircles();
    };
  });
}

/**
 * Render recent activity placeholder
 */
function renderRecentActivity() {
  const recentActivity = $('recentActivity');
  if (!recentActivity) return;

  recentActivity.innerHTML = `
    <div style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px;">
      Complete quests to see activity
    </div>
  `;
}

/**
 * Render friends list and friend requests
 */
function renderFriends() {
  const friendsList = $('friendsList');
  const requestsList = $('requestsList');

  if (friendsList) {
    friendsList.innerHTML = state.friends.length === 0
      ? '<p style="color: var(--text-muted);">No friends yet</p>'
      : state.friends.map(f => `
          <div class="friend-item">
            <div class="friend-info">
              <div class="friend-name">${f.username}</div>
              <div class="friend-stats">${f.total_xp} XP</div>
            </div>
          </div>
        `).join('');
  }

  if (requestsList) {
    requestsList.innerHTML = state.friendRequests.length === 0
      ? '<p style="color: var(--text-muted);">No pending requests</p>'
      : state.friendRequests.map(r => `
          <div class="request-item">
            <div class="friend-info">
              <div class="friend-name">${r.requester.username}</div>
              <div class="friend-stats">${r.requester.total_xp} XP</div>
            </div>
            <div class="friend-actions">
              <button class="btn primary small" onclick="handleAcceptFriendRequest(${r.id}, '${r.requester.id}')">Accept</button>
            </div>
          </div>
        `).join('');
  }
}

/**
 * Open quest drawer with quest details
 */
function openQuestDrawer(quest) {
  state.currentQuest = quest;
  
  const drawerTitle = $('drawerTitle');
  const drawerBadge = $('drawerBadge');
  const drawerXP = $('drawerXP');
  const questDrawer = $('questDrawer');

  if (drawerTitle) drawerTitle.textContent = quest.name;
  
  const badgeAsset = getBadgeAsset(quest.badge);
  const badgeLabel = getBadgeLabel(quest.badge);
  if (drawerBadge) {
    if (badgeAsset) {
      drawerBadge.innerHTML = `
        <div>
          <img src="../assets/Badges/${badgeAsset}" alt="${quest.badge}" class="drawer-badge-img" />
        </div>
      `;
    } else {
      drawerBadge.innerHTML = `<div>${badgeLabel}</div>`;
    }
  }
  
  if (drawerXP) drawerXP.textContent = quest.baseXP + ' XP';

  positionDrawer(quest);
  if (questDrawer) {
    questDrawer.classList.remove('hidden');
    setTimeout(() => questDrawer.classList.add('open'), 20);
  }
}

/**
 * Close quest drawer
 */
function closeQuestDrawer() {
  const questDrawer = $('questDrawer');
  if (questDrawer) {
    questDrawer.classList.remove('open');
    setTimeout(() => questDrawer.classList.add('hidden'), 220);
  }
  state.currentQuest = null;
}

/**
 * Position drawer above the pin on screen
 */
function positionDrawer(quest) {
  const questDrawer = $('questDrawer');
  if (!questDrawer || !state.map) return;

  const point = state.map.latLngToContainerPoint(L.latLng(quest.lat, quest.lng));
  const mapRect = state.map.getContainer().getBoundingClientRect();

  const drawWidth = 420;
  const drawHeight = 240;
  let left = mapRect.left + point.x - drawWidth / 2;
  let top = mapRect.top + point.y - drawHeight - 20;

  left = Math.max(10, Math.min(left, window.innerWidth - drawWidth - 10));
  top = Math.max(10, Math.min(top, window.innerHeight - drawHeight - 10));

  questDrawer.style.left = left + 'px';
  questDrawer.style.top = top + 'px';
}
