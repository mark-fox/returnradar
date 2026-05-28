import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATION_PREFERENCES_STORAGE_KEY =
    "returnradar-notification-preferences";

export type NotificationPreferences = {
    deadlineReminderNotificationsEnabled: boolean;
};

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
    deadlineReminderNotificationsEnabled: false,
};

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
    const storedPreferences = await AsyncStorage.getItem(
        NOTIFICATION_PREFERENCES_STORAGE_KEY
    );

    if (!storedPreferences) {
        return DEFAULT_NOTIFICATION_PREFERENCES;
    }

    try {
        return {
            ...DEFAULT_NOTIFICATION_PREFERENCES,
            ...JSON.parse(storedPreferences),
        };
    } catch {
        return DEFAULT_NOTIFICATION_PREFERENCES;
    }
}

export async function saveNotificationPreferences(
    preferences: NotificationPreferences
): Promise<void> {
    await AsyncStorage.setItem(
        NOTIFICATION_PREFERENCES_STORAGE_KEY,
        JSON.stringify(preferences)
    );
}

export async function setDeadlineReminderNotificationsEnabled(
    enabled: boolean
): Promise<NotificationPreferences> {
    const nextPreferences = {
        deadlineReminderNotificationsEnabled: enabled,
    };

    await saveNotificationPreferences(nextPreferences);

    return nextPreferences;
}