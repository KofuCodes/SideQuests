// ==========================================
// SUPABASE CONFIGURATION
// ==========================================
const SUPABASE_URL = 'https://yzfstiavthooulqwcugp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6ZnN0aWF2dGhvb3VscXdjdWdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNzc4MjEsImV4cCI6MjA4MzY1MzgyMX0.WYEb2OQLz72ucSYtY9PE5caaZucjBZop61PZhy7A7aA';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// CONSTANTS & DATA
// ==========================================
const BADGES = [
  { id: "food", label: "Food", icon: "🍜", asset: "fe_gold.png" },
  { id: "outdoors", label: "Outdoors", icon: "🌲", asset: "oa_silver.png" },
  { id: "fitness", label: "Fitness", icon: "🏃", asset: "fg_bronze.png" },
  { id: "culture", label: "Culture", icon: "🎭", asset: "cc_bronze.png" },
];

const RANKS = [
  { name: "Bronze", minXP: 0, color: "#CD7F32" },
  { name: "Silver", minXP: 250, color: "#C0C0C0" },
  { name: "Gold", minXP: 600, color: "#FFD700" },
  { name: "Platinum", minXP: 1100, color: "#E5E4E2" },
  { name: "Diamond", minXP: 2000, color: "#B9F2FF" },
];

const ACTIVITY_HUBS = [
  { name: "Toronto", lat: 43.6532, lng: -79.3832 },
  { name: "Vancouver", lat: 49.2827, lng: -123.1207 },
  { name: "Montreal", lat: 45.5017, lng: -73.5673 },
  { name: "New York", lat: 40.7128, lng: -74.0060 },
  { name: "Los Angeles", lat: 34.0522, lng: -118.2437 },
  { name: "Chicago", lat: 41.8781, lng: -87.6298 },
  { name: "Houston", lat: 29.7604, lng: -95.3698 },
  { name: "Phoenix", lat: 33.4484, lng: -112.0742 },
  { name: "Miami", lat: 25.7617, lng: -80.1918 },
  { name: "Seattle", lat: 47.6062, lng: -122.3321 },
  { name: "San Francisco", lat: 37.7749, lng: -122.4194 },
  { name: "Boston", lat: 42.3601, lng: -71.0589 },
  { name: "Denver", lat: 39.7392, lng: -104.9903 },
];

const BADGE_TEMPLATES = {
  food: {
    title: (name) => `Food Quest: ${name}`,
    instructions: (name) => `Visit ${name} and try something new. Take a photo of your meal!`
  },
  fitness: {
    title: (name) => `Fitness Quest: ${name}`,
    instructions: (name) => `Complete a workout at ${name}. Snap a photo after your session!`
  },
  outdoors: {
    title: (name) => `Outdoors Quest: ${name}`,
    instructions: (name) => `Explore ${name}. Capture the best view you find!`
  },
  culture: {
    title: (name) => `Culture Quest: ${name}`,
    instructions: (name) => `Visit ${name}. Take a photo of something interesting!`
  },
};

// ==========================================
// GLOBAL STATE
// ==========================================
const state = {
  markerIndex: new Map(),
  user: null,
  selectedBadge: "all",
  activeCircle: null,
  quests: [],
  circles: [],
  friends: [],
  friendRequests: [],
  userStats: {
    // Initial badge XP set to requested ranks:
    // food -> Gold (600), outdoors -> Silver (250), fitness -> Bronze (0), culture -> Bronze (0)
    totalXP: 850,
    completedQuests: 0,
    badgeXP: { food: 600, outdoors: 250, fitness: 0, culture: 0 }
  },
  map: null,
  markers: null,
  userMarker: null,
  currentQuest: null,
  uploadedPhoto: null,
};

// ==========================================
// DOM HELPER
// ==========================================
const $ = (id) => document.getElementById(id);
