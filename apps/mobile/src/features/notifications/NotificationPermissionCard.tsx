import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { DeadlineReminder } from "@/src/features/products/types";

import {
    cancelExistingDeadlineReminderNotifications,
    scheduleDeadlineReminderNotifications,
} from "./deadlineReminderNotifications";
import {
    getNotificationPermissionStatus,
    requestNotificationPermissions,
    type NotificationPermissionStatus,
} from "./notificationPermissions";
import {
    getNotificationPreferences,
    setDeadlineReminderNotificationsEnabled,
    type NotificationPreferences,
} from "./notificationPreferences";

type NotificationPermissionCardProps = {
    reminders: DeadlineReminder[];
};

type SchedulingStatus =
    | "idle"
    | "checking"
    | "scheduling"
    | "clearing"
    | "error";

export function NotificationPermissionCard({
    reminders,
}: NotificationPermissionCardProps) {
    const [permissionStatus, setPermissionStatus] =
        useState<NotificationPermissionStatus | null>(null);
    const [preferences, setPreferences] =
        useState<NotificationPreferences | null>(null);
    const [schedulingStatus, setSchedulingStatus] =
        useState<SchedulingStatus>("checking");
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [
        lastAutoScheduledReminderSignature,
        setLastAutoScheduledReminderSignature,
    ] = useState<string | null>(null);

    const notificationsEnabled =
        preferences?.deadlineReminderNotificationsEnabled ?? false;

    const schedulableReminderCount = useMemo(() => {
        return reminders.filter((reminder) => reminder.status !== "expired")
            .length;
    }, [reminders]);

    const reminderSignature = useMemo(() => {
        return reminders
            .filter((reminder) => reminder.status !== "expired")
            .map((reminder) =>
                [
                    reminder.product_id,
                    reminder.deadline_type,
                    reminder.deadline_date,
                    reminder.days_remaining,
                    reminder.status,
                ].join(":")
            )
            .join("|");
    }, [reminders]);

    const isBusy =
        schedulingStatus === "checking" ||
        schedulingStatus === "scheduling" ||
        schedulingStatus === "clearing";

    const scheduleReminders = useCallback(
        async (mode: "automatic" | "manual") => {
            try {
                setSchedulingStatus("scheduling");
                setStatusMessage(null);

                const result =
                    await scheduleDeadlineReminderNotifications(reminders);

                setStatusMessage(
                    `${result.scheduledCount} reminder notification${result.scheduledCount === 1 ? "" : "s"
                    } scheduled.`
                );

                if (mode === "manual") {
                    setLastAutoScheduledReminderSignature(reminderSignature);
                }

                setSchedulingStatus("idle");
            } catch (error) {
                console.warn(error);
                setSchedulingStatus("error");
                setStatusMessage(
                    "Could not schedule reminder notifications."
                );
            }
        },
        [reminders, reminderSignature]
    );

    useEffect(() => {
        const loadNotificationState = async () => {
            try {
                setSchedulingStatus("checking");

                const [status, storedPreferences] = await Promise.all([
                    getNotificationPermissionStatus(),
                    getNotificationPreferences(),
                ]);

                setPermissionStatus(status);
                setPreferences(storedPreferences);
                setSchedulingStatus("idle");
            } catch (error) {
                console.warn(error);
                setSchedulingStatus("error");
                setStatusMessage(
                    "Could not load notification preferences."
                );
            }
        };

        void loadNotificationState();
    }, []);

    useEffect(() => {
        const autoScheduleReminders = async () => {
            if (!notificationsEnabled) {
                return;
            }

            if (permissionStatus !== "granted") {
                return;
            }

            if (!reminderSignature) {
                return;
            }

            if (lastAutoScheduledReminderSignature === reminderSignature) {
                return;
            }

            await scheduleReminders("automatic");
            setLastAutoScheduledReminderSignature(reminderSignature);
        };

        void autoScheduleReminders();
    }, [
        notificationsEnabled,
        permissionStatus,
        reminderSignature,
        lastAutoScheduledReminderSignature,
        scheduleReminders,
    ]);

    const handleEnableNotifications = async () => {
        try {
            setSchedulingStatus("checking");
            setStatusMessage(null);

            const status = await requestNotificationPermissions();

            setPermissionStatus(status);

            if (status !== "granted") {
                setSchedulingStatus("idle");
                return;
            }

            const nextPreferences =
                await setDeadlineReminderNotificationsEnabled(true);

            setPreferences(nextPreferences);

            await scheduleReminders("manual");
        } catch (error) {
            console.warn(error);
            setSchedulingStatus("error");
            setStatusMessage("Could not enable reminder notifications.");
        }
    };

    const handleRefreshReminders = async () => {
        await scheduleReminders("manual");
    };

    const handleDisableNotifications = async () => {
        try {
            setSchedulingStatus("clearing");
            setStatusMessage(null);

            await cancelExistingDeadlineReminderNotifications();

            const nextPreferences =
                await setDeadlineReminderNotificationsEnabled(false);

            setPreferences(nextPreferences);
            setLastAutoScheduledReminderSignature(null);
            setStatusMessage("Reminder notifications were disabled.");
            setSchedulingStatus("idle");
        } catch (error) {
            console.warn(error);
            setSchedulingStatus("error");
            setStatusMessage("Could not disable reminder notifications.");
        }
    };

    return (
        <View style={styles.card}>
            <Text style={styles.eyebrow}>Reminder notifications</Text>

            <Text style={styles.title}>
                {getNotificationTitle(permissionStatus, notificationsEnabled)}
            </Text>

            <Text style={styles.description}>
                {getNotificationDescription(
                    permissionStatus,
                    notificationsEnabled,
                    schedulableReminderCount
                )}
            </Text>

            {statusMessage ? (
                <Text
                    style={[
                        styles.statusText,
                        schedulingStatus === "error" && styles.errorText,
                    ]}
                >
                    {statusMessage}
                </Text>
            ) : null}

            {notificationsEnabled && permissionStatus === "granted" ? (
                <>
                    <Pressable
                        style={[
                            styles.button,
                            isBusy && styles.disabledButton,
                        ]}
                        onPress={() => void handleRefreshReminders()}
                        disabled={isBusy}
                    >
                        <Text style={styles.buttonText}>
                            {schedulingStatus === "scheduling"
                                ? "Scheduling..."
                                : "Refresh Reminder Notifications"}
                        </Text>
                    </Pressable>

                    <Pressable
                        style={[
                            styles.secondaryButton,
                            isBusy && styles.disabledButton,
                        ]}
                        onPress={() => void handleDisableNotifications()}
                        disabled={isBusy}
                    >
                        <Text style={styles.secondaryButtonText}>
                            {schedulingStatus === "clearing"
                                ? "Disabling..."
                                : "Disable Reminder Notifications"}
                        </Text>
                    </Pressable>
                </>
            ) : (
                <Pressable
                    style={[
                        styles.button,
                        isBusy && styles.disabledButton,
                    ]}
                    onPress={() => void handleEnableNotifications()}
                    disabled={isBusy}
                >
                    <Text style={styles.buttonText}>
                        {schedulingStatus === "checking"
                            ? "Checking..."
                            : "Enable Reminder Notifications"}
                    </Text>
                </Pressable>
            )}
        </View>
    );
}

function getNotificationTitle(
    permissionStatus: NotificationPermissionStatus | null,
    notificationsEnabled: boolean
): string {
    if (notificationsEnabled && permissionStatus === "granted") {
        return "Reminder notifications are enabled";
    }

    if (permissionStatus === "denied") {
        return "Notifications are blocked";
    }

    return "Reminder notifications are off";
}

function getNotificationDescription(
    permissionStatus: NotificationPermissionStatus | null,
    notificationsEnabled: boolean,
    schedulableReminderCount: number
): string {
    if (notificationsEnabled && permissionStatus === "granted") {
        if (schedulableReminderCount === 0) {
            return "ReturnRadar is ready to schedule reminders when upcoming deadlines are available.";
        }

        return `${schedulableReminderCount} upcoming reminder${schedulableReminderCount === 1 ? "" : "s"
            } can be scheduled on this device.`;
    }

    if (permissionStatus === "denied") {
        return "You can still view reminders in the app. To receive device notifications, enable notifications in your system settings.";
    }

    return "Enable reminders so ReturnRadar can notify you before return and warranty deadlines are missed.";
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#EFF6FF",
        borderRadius: 20,
        padding: 18,
        marginBottom: 28,
        borderWidth: 1,
        borderColor: "#BFDBFE",
    },
    eyebrow: {
        fontSize: 13,
        fontWeight: "800",
        color: "#2563EB",
        marginBottom: 8,
        textTransform: "uppercase",
    },
    title: {
        fontSize: 18,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 8,
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
        color: "#475569",
        marginBottom: 14,
    },
    statusText: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: "700",
        color: "#166534",
        marginBottom: 12,
    },
    errorText: {
        color: "#B91C1C",
    },
    button: {
        backgroundColor: "#2563EB",
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: "center",
    },
    buttonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800",
    },
    secondaryButton: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#CBD5E1",
        marginTop: 10,
    },
    secondaryButtonText: {
        color: "#0F172A",
        fontSize: 15,
        fontWeight: "800",
    },
    disabledButton: {
        opacity: 0.7,
    },
});