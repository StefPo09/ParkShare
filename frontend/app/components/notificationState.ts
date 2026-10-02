export type NotificationAudience = 'received' | 'reservation';
export type NotificationKind = 'status' | 'start-reminder' | 'end-reminder';

export type NotificationRecord = {
  id: string;
  bookingId: number;
  audience: NotificationAudience;
  kind: NotificationKind;
  status: string;
  previousStatus?: string;
  spotTitle: string;
  spotAddress: string;
  startDate: string;
  createdAt: number;
  read: boolean;
};

export type NotificationBooking = {
  id: number;
  start_date: string;
  end_date: string;
  created_at?: string | null;
  status: string;
  spot?: { title?: string; address?: string } | null;
};

export type NotificationBatch = {
  reservations: NotificationBooking[];
  received: NotificationBooking[];
};

type StoredNotifications = {
  records: NotificationRecord[];
  knownStatuses: Record<string, string> | null;
};

const UNREAD_EVENT = 'parkshare-unread-notifications-changed';
const STORAGE_PREFIX = 'parkshare-notifications';
const ACTIVE_USER_STORAGE_KEY = 'parkshare-notification-user-id';
const MAX_READ_RECORDS = 200;

function storageKey(userId: number) {
  return `${STORAGE_PREFIX}:${userId}`;
}

function toBookingKey(audience: NotificationAudience, bookingId: number) {
  return `${audience}-${bookingId}`;
}

function readStoredNotifications(userId: number): StoredNotifications {
  const key = storageKey(userId);
  const stored = window.localStorage.getItem(key);
  if (!stored) return { records: [], knownStatuses: null };

  try {
    const value: unknown = JSON.parse(stored);
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('Invalid stored notification state.');
    }
    const parsed = value as Partial<StoredNotifications>;
    const records = Array.isArray(parsed.records)
      ? parsed.records.filter(isNotificationRecord)
      : [];
    const knownStatuses = parsed.knownStatuses === null
      ? null
      : parsed.knownStatuses && typeof parsed.knownStatuses === 'object' && !Array.isArray(parsed.knownStatuses)
        ? Object.fromEntries(
          Object.entries(parsed.knownStatuses).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
        )
        : null;
    return { records, knownStatuses };
  } catch (error) {
    console.warn('Invalid ParkShare notification state; resetting local data:', error);
    window.localStorage.removeItem(key);
    return { records: [], knownStatuses: null };
  }
}

function isNotificationRecord(value: unknown): value is NotificationRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<NotificationRecord>;
  return typeof record.id === 'string'
    && typeof record.bookingId === 'number'
    && (record.audience === 'received' || record.audience === 'reservation')
    && (record.kind === 'status' || record.kind === 'start-reminder' || record.kind === 'end-reminder')
    && typeof record.status === 'string'
    && typeof record.spotTitle === 'string'
    && typeof record.spotAddress === 'string'
    && typeof record.startDate === 'string'
    && typeof record.createdAt === 'number'
    && typeof record.read === 'boolean';
}

function writeStoredNotifications(userId: number, state: StoredNotifications) {
  const records = [...state.records]
    .sort((a, b) => b.createdAt - a.createdAt);
  const unread = records.filter((record) => !record.read);
  const read = records.filter((record) => record.read).slice(0, MAX_READ_RECORDS);
  window.localStorage.setItem(storageKey(userId), JSON.stringify({
    records: [...unread, ...read].sort((a, b) => b.createdAt - a.createdAt),
    knownStatuses: state.knownStatuses,
  }));
  window.dispatchEvent(new Event(UNREAD_EVENT));
}

function makeBookingRecord(
  booking: NotificationBooking,
  audience: NotificationAudience,
  status: string,
  createdAt: number,
  read: boolean,
  previousStatus?: string,
): NotificationRecord {
  return {
    id: previousStatus
      ? `${toBookingKey(audience, booking.id)}-status-${previousStatus}-${status}-${Math.floor(createdAt / 60_000)}`
      : `${toBookingKey(audience, booking.id)}-status-${status}-initial`,
    bookingId: booking.id,
    audience,
    kind: 'status',
    status,
    previousStatus,
    spotTitle: booking.spot?.title || '',
    spotAddress: booking.spot?.address || '',
    startDate: booking.start_date,
    createdAt,
    read,
  };
}

export function getNotifications(userId: number): NotificationRecord[] {
  return readStoredNotifications(userId).records.sort((a, b) => b.createdAt - a.createdAt);
}

export function hasNotification(userId: number, notificationId: string): boolean {
  return readStoredNotifications(userId).records.some((record) => record.id === notificationId);
}

export function getUnreadNotificationIds(userId: number): string[] {
  return readStoredNotifications(userId).records
    .filter((record) => !record.read)
    .map((record) => record.id);
}

export function syncBookingNotifications(userId: number, batch: NotificationBatch): NotificationRecord[] {
  const state = readStoredNotifications(userId);
  const now = Date.now();
  const incoming = [
    ...batch.reservations.map((booking) => ({ booking, audience: 'reservation' as const })),
    ...batch.received.map((booking) => ({ booking, audience: 'received' as const })),
  ];
  const currentStatuses = Object.fromEntries(
    incoming.map(({ booking, audience }) => [
      toBookingKey(audience, booking.id),
      booking.status.toLowerCase(),
    ]),
  );
  const isFirstSync = state.knownStatuses === null;
  const records = new Map(state.records.map((record) => [record.id, record]));

  for (const { booking, audience } of incoming) {
    const key = toBookingKey(audience, booking.id);
    const status = booking.status.toLowerCase();
    const previousStatus = state.knownStatuses?.[key];
    if (previousStatus === status) continue;

    const createdAt = previousStatus === undefined
      ? new Date(booking.created_at || now).getTime()
      : now;
    const record = makeBookingRecord(
      booking,
      audience,
      status,
      Number.isFinite(createdAt) ? createdAt : now,
      isFirstSync,
      previousStatus,
    );
    records.set(record.id, record);
  }

  writeStoredNotifications(userId, {
    records: [...records.values()],
    knownStatuses: currentStatuses,
  });
  return getNotifications(userId);
}

export function addNotification(userId: number, notification: NotificationRecord): boolean {
  const state = readStoredNotifications(userId);
  if (state.records.some((record) => record.id === notification.id)) return false;
  writeStoredNotifications(userId, {
    ...state,
    records: [notification, ...state.records],
  });
  return true;
}

export function markNotificationRead(userId: number, notificationId: string) {
  const state = readStoredNotifications(userId);
  let changed = false;
  const records = state.records.map((record) => {
    if (record.id !== notificationId || record.read) return record;
    changed = true;
    return { ...record, read: true };
  });
  if (changed) writeStoredNotifications(userId, { ...state, records });
}

export function markAllNotificationsRead(userId: number) {
  const state = readStoredNotifications(userId);
  const records = state.records.map((record) => ({ ...record, read: true }));
  if (records.some((record, index) => !state.records[index].read)) {
    writeStoredNotifications(userId, { ...state, records });
  }
}

export function setActiveNotificationUser(userId: number | null) {
  if (userId === null) window.localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
  else window.localStorage.setItem(ACTIVE_USER_STORAGE_KEY, String(userId));
  window.dispatchEvent(new Event(UNREAD_EVENT));
}

export function getActiveNotificationUser(): number | null {
  const userId = Number(window.localStorage.getItem(ACTIVE_USER_STORAGE_KEY));
  return Number.isInteger(userId) && userId > 0 ? userId : null;
}

export function unreadNotificationsChangedEvent() {
  return UNREAD_EVENT;
}
