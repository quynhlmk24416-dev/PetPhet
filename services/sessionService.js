/**
 * Login session persistence.
 *
 * The app keeps "who is logged in" in React state, which is lost on every reload. This service stores only the
 * user id (never a password) in localStorage so a page reload restores the same account and screen.
 * It is demo-level persistence: a real deployment must use server-side sessions / tokens.
 */
export const SESSION_STORAGE_KEY = 'pet_phet_session_v1';

/** Screens a restored customer may land on after a reload (the payment screen needs data that is not saved). */
export const RESTORABLE_CUSTOMER_TABS = ['landing', 'about', 'services', 'pricing', 'pets', 'booking', 'my-bookings', 'points', 'account'];

export function saveSession(user, storage = globalThis.localStorage) {
  try {
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ userId: user.id, savedAt: new Date().toISOString() }));
  } catch {
    // Storage can be full or blocked (private mode). The user simply has to log in again after a reload.
  }
}

export function clearSession(storage = globalThis.localStorage) {
  try {
    storage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}

/** Returns the stored user id, or null when there is no (valid) session. */
export function readSessionUserId(storage = globalThis.localStorage) {
  try {
    const raw = storage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    return typeof session?.userId === 'string' && session.userId ? session.userId : null;
  } catch {
    return null;
  }
}

/**
 * Looks the saved user up again in the data store and makes it the active account.
 * Returns the user, or null (and clears the stale session) when the account no longer exists.
 */
export function restoreSession(dataStore, storage = globalThis.localStorage) {
  const userId = readSessionUserId(storage);
  if (!userId) return null;
  const user = dataStore.getUserById(userId);
  if (!user) {
    clearSession(storage);
    return null;
  }
  dataStore.setCurrentUser(user);
  return user;
}

/** Chooses the first screen after a reload: admins go to their dashboard, customers keep the page in the URL hash. */
export function getInitialTab(user, hash = globalThis.location?.hash || '') {
  if (!user) return 'landing';
  if (user.role === 'admin') return 'admin-dashboard';
  const requested = hash.replace(/^#/, '');
  return RESTORABLE_CUSTOMER_TABS.includes(requested) ? requested : 'landing';
}
