import * as Notifications from "expo-notifications";

import type { DeadlineReminder } from "@/src/features/products/types";

import { DEADLINE_REMINDER_CHANNEL_ID } from "./notificationSetup";

const SCHEDULED_DEADLINE_REMINDER_PREFIX = "deadline-reminder";

export type ScheduledDeadlineReminderResult = {
    scheduledCount: number;
};

export async function scheduleDeadlineReminderNotifications(
    reminders: DeadlineReminder[]
): Promise<ScheduledDeadlineReminderResult> {
    await cancelExistingDeadlineReminderNotifications();

    const remindersToSchedule = reminders.filter(
        (reminder) => reminder.status !== "expired"
    );

    for (const reminder of remindersToSchedule) {
        await Notifications.scheduleNotificationAsync({
            identifier: getDeadlineReminderIdentifier(reminder),
            content: {
                title: getNotificationTitle(reminder),
                body: getNotificationBody(reminder),
                data: {
                    productId: reminder.product_id,
                    deadlineType: reminder.deadline_type,
                },
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: getReminderNotificationDate(reminder),
                channelId: DEADLINE_REMINDER_CHANNEL_ID,
            },
        });
    }

    return {
        scheduledCount: remindersToSchedule.length,
    };
}

export async function cancelExistingDeadlineReminderNotifications(): Promise<void> {
    const scheduledNotifications =
        await Notifications.getAllScheduledNotificationsAsync();

    const deadlineReminderNotifications = scheduledNotifications.filter(
        (notification) =>
            notification.identifier.startsWith(
                SCHEDULED_DEADLINE_REMINDER_PREFIX
            )
    );

    await Promise.all(
        deadlineReminderNotifications.map((notification) =>
            Notifications.cancelScheduledNotificationAsync(
                notification.identifier
            )
        )
    );
}

function getDeadlineReminderIdentifier(reminder: DeadlineReminder): string {
    return `${SCHEDULED_DEADLINE_REMINDER_PREFIX}-${reminder.product_id}-${reminder.deadline_type}`;
}

function getNotificationTitle(reminder: DeadlineReminder): string {
    const deadlineLabel =
        reminder.deadline_type === "return" ? "Return window" : "Warranty";

    if (reminder.status === "today") {
        return `${deadlineLabel} ends today`;
    }

    return `${deadlineLabel} coming up`;
}

function getNotificationBody(reminder: DeadlineReminder): string {
    if (reminder.days_remaining === 0) {
        return `${reminder.product_name} has a deadline today.`;
    }

    return `${reminder.product_name} has an upcoming ${reminder.deadline_type} deadline.`;
}

function getReminderNotificationDate(reminder: DeadlineReminder): Date {
    const now = new Date();

    if (reminder.days_remaining <= 0) {
        return new Date(now.getTime() + 60 * 1000);
    }

    const notificationDate = new Date(now);
    notificationDate.setHours(9, 0, 0, 0);

    if (notificationDate <= now) {
        notificationDate.setDate(notificationDate.getDate() + 1);
    }

    return notificationDate;
}