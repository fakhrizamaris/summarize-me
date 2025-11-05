const SESSION_TIMEOUT = 10 * 60 * 1000; 
const LAST_ACTIVITY_KEY = 'lastActivityTime';

export const updateLastActivity = () => {
  const now = new Date().getTime();
  localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
  console.log('🕐 Activity updated:', new Date(now).toLocaleTimeString());
};

export const isSessionValid = () => {
  const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);

  if (!lastActivity) {
    console.log('⚠️ No lastActivity found, initializing...');
    updateLastActivity();
    return true; // ← INI PENTING!
  }

  const now = new Date().getTime();
  const timeDiff = now - parseInt(lastActivity, 10);
  const isValid = timeDiff < SESSION_TIMEOUT;

  if (!isValid) {
    console.log(`⏰ Session expired: ${Math.floor(timeDiff / 1000 / 60)} minutes ago`);
  }

  return isValid;
};


export const clearSession = () => {
  localStorage.removeItem(LAST_ACTIVITY_KEY);
  console.log('🗑️ Session cleared');
};

export const initSessionTracking = () => {
  // Update activity saat ada interaksi
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

  const throttledUpdate = throttle(updateLastActivity, 5000); // Update max setiap 5 detik

  events.forEach((event) => {
    window.addEventListener(event, throttledUpdate, { passive: true });
  });

  // Update saat pertama kali load
  updateLastActivity();

  console.log('✅ Session tracking initialized');
};


export const cleanupSessionTracking = () => {
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

  events.forEach((event) => {
    window.removeEventListener(event, updateLastActivity);
  });

  console.log('🧹 Session tracking cleaned up');
};

function throttle(func, wait) {
  let timeout;
  let lastRan;

  return function executedFunction(...args) {
    const context = this;

    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(timeout);
      timeout = setTimeout(function () {
        if (Date.now() - lastRan >= wait) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, wait - (Date.now() - lastRan));
    }
  };
}
