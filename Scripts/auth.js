// ==========================================
// AUTHENTICATION & DATA LOADING
// ==========================================

/**
 * Handle user login
 */
async function handleLogin(e) {
  e.preventDefault();
  const email = $('loginEmail').value;
  const password = $('loginPassword').value;

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    showApp();
    await loadUserData();

  } catch (error) {
    showError(error.message);
  }
}

/**
 * Handle user signup
 */
async function handleSignup(e) {
  e.preventDefault();
  const username = $('signupUsername').value;
  const email = $('signupEmail').value;
  const password = $('signupPassword').value;

  try {
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: { username } }
    });
    if (authError) throw authError;

    const { error: profileError } = await supabaseClient
      .from('users')
      .insert([{
        id: authData.user.id,
        username,
        email,
        total_xp: 0,
        food_xp: 0,
        outdoors_xp: 0,
        fitness_xp: 0,
        culture_xp: 0
      }]);
    
    if (profileError) throw profileError;

    await loadUserData();
    showApp();
  } catch (error) {
    showError(error.message);
  }
}

/**
 * Handle user logout
 */
async function handleLogout() {
  await supabaseClient.auth.signOut();
  state.user = null;
  const authScreen = $('authScreen');
  const mainApp = $('mainApp');
  if (authScreen) authScreen.classList.remove('hidden');
  if (mainApp) mainApp.classList.add('hidden');
}

/**
 * Show app UI and initialize map
 */
function showApp() {
  const authScreen = $('authScreen');
  const mainApp = $('mainApp');
  if (authScreen) authScreen.classList.add('hidden');
  if (mainApp) mainApp.classList.remove('hidden');
  initMap();
  renderAll();
}

/**
 * Load all user data from Supabase
 */
async function loadUserData() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;

  state.user = user;

  const { data: profile } = await supabaseClient
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile) {
    state.userStats = {
      totalXP: profile.total_xp || 0,
      completedQuests: profile.completed_quests || 0,
      badgeXP: {
        food: profile.food_xp || 0,
        outdoors: profile.outdoors_xp || 0,
        fitness: profile.fitness_xp || 0,
        culture: profile.culture_xp || 0
      }
    };
  }

  await Promise.all([loadCircles(), loadFriends(), loadQuests()]);
}

/**
 * Load user's circles from Supabase
 */
async function loadCircles() {
  const { data } = await supabaseClient
    .from('circles')
    .select('*, circle_members!inner(user_id)')
    .eq('circle_members.user_id', state.user.id);

  state.circles = data || [];
}

/**
 * Load user's friends and pending requests
 */
async function loadFriends() {
  const { data } = await supabaseClient
    .from('friendships')
    .select('*, friend:users!friendships_friend_id_fkey(id, username, total_xp)')
    .eq('user_id', state.user.id)
    .eq('status', 'accepted');

  state.friends = data?.map(f => f.friend) || [];

  const { data: requests } = await supabaseClient
    .from('friendships')
    .select('*, requester:users!friendships_user_id_fkey(id, username, total_xp)')
    .eq('friend_id', state.user.id)
    .eq('status', 'pending');

  state.friendRequests = requests || [];
}

/**
 * Load quests from both OSM and Supabase
 */
async function loadQuests() {
  const pos = await getUserPosition();
  await loadQuestsFromOSM(pos);
  renderMapMarkers();
}

/**
 * Get user's current position or default to Toronto
 */
async function getUserPosition() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: 43.6532, lng: -79.3832 });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({ lat: 43.6532, lng: -79.3832 }),
      { enableHighAccuracy: true, timeout: 6000 }
    );
  });
}
