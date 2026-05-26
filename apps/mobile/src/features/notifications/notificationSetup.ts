import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

export const DEADLINE_REMINDER_CHANNEL_ID = "deadline-reminders";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export async function configureNotificationChannels(): Promise<void> {
    if (Platform.OS !== "android") {
        return;
    }

    await Notifications.setNotificationChannelAsync(
        DEADLINE_REMINDER_CHANNEL_ID,
        {
            name: "Deadline reminders",
            importance: Notifications.AndroidImportance.HIGH,
            description:
                "Reminders for upcoming return windows and warranty deadlines.",
        }
    );
}