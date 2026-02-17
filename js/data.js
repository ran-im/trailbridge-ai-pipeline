const LOCATIONS = ['wicklow', 'kerry', 'clare', 'donegal', 'antrim'];
const ACTIVITIES = ['hiking', 'kayaking', 'cycling', 'rock-climbing', 'coasteering', 'wild-camping'];
const FILTER_KEYS = ['difficulty', 'location', 'duration', 'activity'];
const DIFFICULTIES = ['easy', 'moderate', 'hard'];
const DURATIONS = ['half-day', '1day', '2day', '3day', 'weekend'];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateFilters() {
  const numFilters = Math.floor(Math.random() * 3) + 1;
  const filters = [];
  const usedKeys = new Set();
  
  for (let i = 0; i < numFilters; i++) {
    let key;
    do {
      key = randomChoice(FILTER_KEYS);
    } while (usedKeys.has(key) && usedKeys.size < FILTER_KEYS.length);
    usedKeys.add(key);
    
    let value;
    if (key === 'location') value = randomChoice(LOCATIONS);
    else if (key === 'activity') value = randomChoice(ACTIVITIES);
    else if (key === 'difficulty') value = randomChoice(DIFFICULTIES);
    else if (key === 'duration') value = randomChoice(DURATIONS);
    
    filters.push(`${key}:${value}`);
  }
  return filters;
}

function getAbandonmentStage() {
  const rand = Math.random();
  if (rand < 0.4) return 'payment';
  if (rand < 0.7) return 'checkout';
  if (rand < 0.9) return 'date_selection';
  return 'pricing_page';
}

function getDevice() {
  const rand = Math.random();
  if (rand < 0.55) return 'mobile';
  if (rand < 0.90) return 'desktop';
  return 'tablet';
}

function getReferralSource() {
  const rand = Math.random();
  if (rand < 0.35) return 'google_organic';
  if (rand < 0.60) return 'instagram';
  if (rand < 0.80) return 'direct';
  if (rand < 0.92) return 'email';
  return 'google_ads';
}

export function generateSyntheticData() {
  const sessions = [];
  
  for (let i = 1; i <= 50; i++) {
    const sessionId = `sess_${String(i).padStart(3, '0')}`;
    const device = getDevice();
    const referralSource = getReferralSource();
    const cartAdded = Math.random() < 0.45;
    
    let cartAbandoned = false;
    let abandonmentStage = null;
    let bookingValue = null;
    
    if (cartAdded) {
      cartAbandoned = Math.random() < 0.72;
      if (cartAbandoned) {
        abandonmentStage = getAbandonmentStage();
      }
      if (!cartAbandoned || Math.random() < 0.3) {
        bookingValue = Math.floor(Math.random() * (850 - 90 + 1)) + 90;
      }
    }
    
    const returnVisit = Math.random() < 0.25;
    const daysSinceLastVisit = returnVisit ? Math.floor(Math.random() * 60) + 1 : null;
    
    sessions.push({
      session_id: sessionId,
      visitor_type: Math.random() < 0.65 ? 'new' : 'returning',
      device,
      referral_source: referralSource,
      time_on_site_seconds: Math.floor(Math.random() * (900 - 45 + 1)) + 45,
      pages_viewed: Math.floor(Math.random() * 12) + 1,
      filters_used: generateFilters(),
      cart_added: cartAdded,
      cart_abandoned: cartAbandoned,
      abandonment_stage: abandonmentStage,
      booking_value_eur: bookingValue,
      return_visit: returnVisit,
      days_since_last_visit: daysSinceLastVisit
    });
  }
  
  return sessions;
}

export function getDataSummary(sessions) {
  const cartAddedSessions = sessions.filter(s => s.cart_added);
  const abandonedSessions = cartAddedSessions.filter(s => s.cart_abandoned);
  const completedBookings = cartAddedSessions.filter(s => s.booking_value_eur !== null);
  
  const referralCounts = {};
  const deviceCounts = {};
  const locationCounts = {};
  
  sessions.forEach(s => {
    referralCounts[s.referral_source] = (referralCounts[s.referral_source] || 0) + 1;
    deviceCounts[s.device] = (deviceCounts[s.device] || 0) + 1;
    
    s.filters_used.forEach(f => {
      if (f.startsWith('location:')) {
        const loc = f.replace('location:', '');
        locationCounts[loc] = (locationCounts[loc] || 0) + 1;
      }
    });
  });
  
  const topReferral = Object.entries(referralCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  const topDevice = Object.entries(deviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  const topLocation = Object.entries(locationCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  
  const avgBooking = completedBookings.length > 0
    ? completedBookings.reduce((sum, s) => sum + s.booking_value_eur, 0) / completedBookings.length
    : 0;
  
  return {
    total_sessions: sessions.length,
    cart_add_rate: (cartAddedSessions.length / sessions.length) * 100,
    abandonment_rate: cartAddedSessions.length > 0 ? (abandonedSessions.length / cartAddedSessions.length) * 100 : 0,
    avg_booking_value: Math.round(avgBooking),
    top_referral_source: topReferral,
    top_device: topDevice,
    top_location: topLocation
  };
}
