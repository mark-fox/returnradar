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

type NotificationPermissionCardProps = {
    reminders: DeadlineReminder[];
};

type SchedulingStatus = "idle" | "checking" | "scheduling" | "clearing" | "error";

export function NotificationPermissionCard({
    reminders,
}: NotificationPermissionCardProps) {
    const [permissionStatus, setPermissionStatus] =
        useState<NotificationPermissionStatus | null>(null);
    const [schedulingStatus, setSchedulingStatus] =
        useState<SchedulingStatus>("checking");
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [hasAutoScheduled, setHasAutoScheduled] = useState(false);

    const schedulableReminderCount = useMemo(() => {
        return reminders.filter((reminder) => reminder.status !== "expired").length;
    }, [reminders]);

    const isBusy =
        schedulingStatus === "checking" ||
        schedulingStatus === "scheduling" ||
        schedulingStatus === "clearing";

    useEffect(() => {
        const loadPermissionStatus = async () => {
            try {
                setSchedulingStatus("checking");

                const status = await getNotificationPermissionStatus();

                setPermissionStatus(status);
                setSchedulingStatus("idle");
            } catch (error) {
                console.warn(error);
                setSchedulingStatus("error");
                setStatusMessage("Could not check notification permissions.");
            }
        };

        void loadPermissionStatus();
    }, []);

    const scheduleReminders = useCallback(
        async (mode: "automatic" | "manual") => {
            try {
                setSchedulingStatus("scheduling");
                setStatusMessage(null);

                const result = await scheduleDeadlineReminderNotifications(reminders);

                setStatusMessage(
                    `${result.scheduledCount} reminder notification${result.scheduledCount === 1 ? "" : "s"
                    } scheduled.`
                );

                if (mode === "manual") {
                    setHasAutoScheduled(true);
                }

                setSchedulingStatus("idle");
            } catch (error) {
                console.warn(error);
                setSchedulingStatus("error");
                setStatusMessage("Could not schedule reminder notifications.");
            }
        },
        [reminders]
    );

    useEffect(() => {
        const autoScheduleReminders = async () => {
            if (permissionStatus !== "granted") {
                return;
            }

            if (hasAutoScheduled) {
                return;
            }

            await scheduleReminders("automatic");
            setHasAutoScheduled(true);
        };

        void autoScheduleReminders();
    }, [permissionStatus, hasAutoScheduled, reminders, scheduleReminders]);


    const handleRequestPermission = async () => {
        try {
            setSchedulingStatus("checking");
            setStatusMessage(null);

            const status = await requestNotificationPermissions();

            setPermissionStatus(status);

            if (status === "granted") {
                await scheduleReminders("manual");
                return;
            }

            setSchedulingStatus("idle");
        } catch (error) {
            console.warn(error);
            setSchedulingStatus("error");
            setStatusMessage("Could not request notification permission.");
        }
    };

    const handleScheduleReminders = async () => {
        await scheduleReminders("manual");
    };

    const handleCancelReminders = async () => {
        try {
            setSchedulingStatus("clearing");
            setStatusMessage(null);

            await cancelExistingDeadlineReminderNotifications();

            setStatusMessage("Reminder notifications were cleared.");
            setHasAutoScheduled(false);
            setSchedulingStatus("idle");
        } catch (error) {
            console.warn(error);
            setSchedulingStatus("error");
            setStatusMessage("Could not clear scheduled reminders.");
        }
    };

    return (
        <View style={styles.card}>
            <Text style={styles.eyebrow}>Reminder notifications</Text>

            <Text style={styles.title}>
                {getPermissionTitle(permissionStatus)}
            </Text>

            <Text style={styles.description}>
                {getPermissionDescription(permissionStatus, schedulableReminderCount)}
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

            {permissionStatus === "granted" ? (
                <>
                    <Pressable
                        style={[
                            styles.button,
                            isBusy && styles.disabledButton,
                        ]}
                        onPress={() => void handleScheduleReminders()}
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
                        onPress={() => void handleCancelReminders()}
                        disabled={isBusy}
                    >
                        <Text style={styles.secondaryButtonText}>
                            {schedulingStatus === "clearing"
                                ? "Clearing..."
                                : "Clear Scheduled Reminders"}
                        </Text>
                    </Pressable>
                </>
            ) : (
                <Pressable
                    style={[
                        styles.button,
                        isBusy && styles.disabledButton,
                    ]}
                    onPress={() => void handleRequestPermission()}
                    disabled={isBusy}
                >
                    <Text style={styles.buttonText}>
                        {schedulingStatus === "checking"
                            ? "Checking..."
                            : "Enable Notifications"}
                    </Text>
                </Pressable>
            )}
        </View>
    );
}

function getPermissionTitle(
    permissionStatus: NotificationPermissionStatus | null
): string {
    if (permissionStatus === "granted") {
        return "Notifications are enabled";
    }

    if (permissionStatus === "denied") {
        return "Notifications are disabled";
    }

    return "Notifications are not set up yet";
}

function getPermissionDescription(
    permissionStatus: NotificationPermissionStatus | null,
    schedulableReminderCount: number
): string {
    if (permissionStatus === "granted") {
        if (schedulableReminderCount === 0) {
            return "ReturnRadar is ready to schedule reminders when upcoming deadlines are available.";
        }

        return `${schedulableReminderCount} upcoming reminder${schedulableReminderCount === 1 ? "" : "s"
            } can be scheduled on this device.`;
    }

    if (permissionStatus === "denied") {
        return "You can still view reminders in the app. To receive device notifications, enable them in your system settings.";
    }

    return "Enable notifications so ReturnRadar can remind you before return and warranty deadlines are missed.";
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