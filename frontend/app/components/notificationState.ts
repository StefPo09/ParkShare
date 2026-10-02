const UNREAD_EVENT = 'parkshare-unread-notifications-changed';
const STORAGE_PREFIX = 'parkshare-notifications';

function unreadStorageKey(userId: number) {
  return `${STORAGE_PREFIX}:${userId}:unread`;
}

function knownStorageKey(userId: number) {
  return `${STORAGE_PREFIX}:${userId}:known`;
}

export function getUnreadNotificationIds(userId: number): string[] {
  const stored = window.localStorage.getItem(unreadStorageKey(userId));
  if (!stored) return [];

  const value: unknown = JSON.parse(stored);
  return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : [];
}

export function getKnownNotifications(userId: number): Record<string, string> | null {
  const stored = window.localStorage.getItem(knownStorageKey(userId));
  if (!stored) return null;

  const value: unknown = JSON.parse(stored);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  );
}

export function saveNotificationState(
  userId: number,
  known: Record<string, string>,
  unread: string[],
) {
  window.localStorage.setItem(knownStorageKey(userId), JSON.stringify(known));
  window.localStorage.setItem(unreadStorageKey(userId), JSON.stringify(unread));
  window.dispatchEvent(new Event(UNREAD_EVENT));
}

export function markNotificationsRead(userId: number) {
  window.localStorage.setItem(unreadStorageKey(userId), JSON.stringify([]));
  window.dispatchEvent(new Event(UNREAD_EVENT));
}

export function unreadNotificationsChangedEvent() {
  return UNREAD_EVENT;
}
