// src/utils/sessionManager.js
const SESSION_TIMEOUT = 10 * 60 * 1000;
const LAST_ACTIVITY_KEY = 'lastActivityTime';

let isTrackingActive = false; // ✅ Flag untuk prevent double tracking
let throttledUpdate = null; // ✅ Store reference untuk cleanup

export const updateLastActivity = () => {
  const now = new Date().getTime();
  localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
  
};

export const isSessionValid = () => {
  const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);

  if (!lastActivity) {

    updateLastActivity();
    return true;
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
 
};

export const initSessionTracking = () => {
  if (isTrackingActive) {
    return;
  }

  const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

  throttledUpdate = throttle(updateLastActivity, 5000);

  events.forEach((event) => {
    window.addEventListener(event, throttledUpdate, { passive: true });
  });

  updateLastActivity();
  isTrackingActive = true;
};

export const cleanupSessionTracking = () => {

  if (!isTrackingActive) {
    return;
  }

  const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

  events.forEach((event) => {
    if (throttledUpdate) {
      window.removeEventListener(event, throttledUpdate);
    }
  });

  throttledUpdate = null;
  isTrackingActive = false;
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
