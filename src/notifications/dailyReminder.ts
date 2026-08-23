import type { NotificationSettings } from '../state/types';

type NotifeeModule = typeof import('@notifee/react-native');

function getNotifee(): NotifeeModule {
  // Notifee constructs its native bridge during import. Keeping this lazy lets
  // pure Jest/UI tests run without a native host while the app still loads the
  // real bridge before scheduling or cancelling a reminder.
  return require('@notifee/react-native') as NotifeeModule;
}

export const DAILY_REMINDER_ID = 'egg-daily-reminder';
export const DAILY_REMINDER_CHANNEL_ID = 'egg-daily-reminders';

/** Return the next local occurrence of a reminder time. */
export function nextReminderTimestamp(
  settings: Pick<NotificationSettings, 'hour' | 'minute'>,
  now = new Date(),
): number {
  const next = new Date(now);
  next.setHours(settings.hour, settings.minute, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime();
}

/** Reconcile the single local daily reminder with the persisted preference. */
export async function syncDailyReminder(settings: NotificationSettings): Promise<boolean> {
  const { default: notifee, AndroidImportance, RepeatFrequency, TriggerType } = getNotifee();
  await notifee.cancelNotification(DAILY_REMINDER_ID);

  if (!settings.enabled) {
    return false;
  }

  const permission = await notifee.requestPermission();
  if (permission.authorizationStatus === 0) {
    return false;
  }

  await notifee.createChannel({
    id: DAILY_REMINDER_CHANNEL_ID,
    name: 'Daily reminders',
    importance: AndroidImportance.DEFAULT,
  });
  await notifee.createTriggerNotification(
    {
      id: DAILY_REMINDER_ID,
      title: 'Time for a little English practice',
      body: 'Keep your grammar streak going with one quick level.',
      android: { channelId: DAILY_REMINDER_CHANNEL_ID, pressAction: { id: 'default' } },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: nextReminderTimestamp(settings),
      repeatFrequency: RepeatFrequency.DAILY,
    },
  );
  return true;
}
