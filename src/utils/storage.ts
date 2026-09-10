const STORAGE_KEY_PREFIX = 'site_inventory_mgr_';

export function loadStoredData<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(`${STORAGE_KEY_PREFIX}${key}`);
    if (item) return JSON.parse(item) as T;
  } catch (err) {
    console.error(`Failed to load ${key} from storage:`, err);
  }
  return fallback;
}

export function saveStoredData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${key}`, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to save ${key} to storage:`, err);
  }
}

export function getActiveSessionUserId(): string | null {
  try {
    return localStorage.getItem(`${STORAGE_KEY_PREFIX}active_user_id`);
  } catch {
    return null;
  }
}

export function setActiveSessionUserId(userId: string | null): void {
  try {
    if (userId) localStorage.setItem(`${STORAGE_KEY_PREFIX}active_user_id`, userId);
    else localStorage.removeItem(`${STORAGE_KEY_PREFIX}active_user_id`);
  } catch (err) {
    console.error('Failed to update active session:', err);
  }
}

export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayStr(): string {
  return formatDateString(new Date());
}
