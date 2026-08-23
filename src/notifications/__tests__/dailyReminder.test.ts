import {
  DAILY_REMINDER_CHANNEL_ID,
  DAILY_REMINDER_ID,
  nextReminderTimestamp,
  syncDailyReminder,
} from '../dailyReminder';

const mockCancelNotification = jest.fn(async () => undefined);
const mockRequestPermission = jest.fn(async () => ({ authorizationStatus: 1 }));
const mockCreateChannel = jest.fn(async () => undefined);
const mockCreateTriggerNotification = jest.fn(async () => undefined);

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    cancelNotification: mockCancelNotification,
    requestPermission: mockRequestPermission,
    createChannel: mockCreateChannel,
    createTriggerNotification: mockCreateTriggerNotification,
  },
  AndroidImportance: { DEFAULT: 3 },
  RepeatFrequency: { DAILY: 0 },
  TriggerType: { TIMESTAMP: 0 },
}));

describe('daily reminder notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestPermission.mockResolvedValue({ authorizationStatus: 1 });
  });

  it('schedules the next local occurrence and repeats it daily when enabled', async () => {
    const now = new Date('2026-08-23T08:30:00');

    await expect(
      syncDailyReminder({ enabled: true, hour: 9, minute: 15 }),
    ).resolves.toBe(true);

    expect(mockCancelNotification).toHaveBeenCalledWith(DAILY_REMINDER_ID);
    expect(mockRequestPermission).toHaveBeenCalledTimes(1);
    expect(mockCreateChannel).toHaveBeenCalledWith({
      id: DAILY_REMINDER_CHANNEL_ID,
      name: 'Daily reminders',
      importance: 3,
    });
    expect(mockCreateTriggerNotification).toHaveBeenCalledWith(
      expect.objectContaining({ id: DAILY_REMINDER_ID }),
      expect.objectContaining({ type: 0, repeatFrequency: 0 }),
    );

    expect(nextReminderTimestamp({ hour: 9, minute: 15 }, now)).toBe(
      new Date('2026-08-23T09:15:00').getTime(),
    );
  });

  it('moves an elapsed reminder to tomorrow', () => {
    expect(nextReminderTimestamp({ hour: 8, minute: 0 }, new Date('2026-08-23T08:00:00'))).toBe(
      new Date('2026-08-24T08:00:00').getTime(),
    );
  });

  it('cancels without requesting permission when disabled', async () => {
    await expect(
      syncDailyReminder({ enabled: false, hour: 9, minute: 0 }),
    ).resolves.toBe(false);

    expect(mockCancelNotification).toHaveBeenCalledWith(DAILY_REMINDER_ID);
    expect(mockRequestPermission).not.toHaveBeenCalled();
    expect(mockCreateTriggerNotification).not.toHaveBeenCalled();
  });

  it('does not schedule when notification permission is denied', async () => {
    mockRequestPermission.mockResolvedValue({ authorizationStatus: 0 });

    await expect(
      syncDailyReminder({ enabled: true, hour: 9, minute: 0 }),
    ).resolves.toBe(false);

    expect(mockCreateChannel).not.toHaveBeenCalled();
    expect(mockCreateTriggerNotification).not.toHaveBeenCalled();
  });
});
