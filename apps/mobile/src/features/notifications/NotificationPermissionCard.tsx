import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
    getNotificationPermissionStatus,
    requestNotificationPermissions,
    type NotificationPermissionStatus,
} from "./notificationPermissions";

export function NotificationPermissionCard() {
    const [permissionStatus, setPermissionStatus] =
        useState<NotificationPermissionStatus | null>(null);
    const [isRequesting, setIsRequesting] = useState(false);

    useEffect(() => {
        const loadPermissionStatus = async () => {
            const status = await getNotificationPermissionStatus();
            setPermissionStatus(status);
        };

        void loadPermissionStatus();
    }, []);

    const handleRequestPermission = async () => {
        try {
            setIsRequesting(true);

            const status = await requestNotificationPermissions();
            setPermissionStatus(status);
        } finally {
            setIsRequesting(false);
        }
    };

    return (
        <View style={styles.card}>
            <Text style={styles.eyebrow}>Reminder notifications</Text>

            <Text style={styles.title}>
                {getPermissionTitle(permissionStatus)}
            </Text>

            <Text style={styles.description}>
                {getPermissionDescription(permissionStatus)}
            </Text>

            {permissionStatus !== "granted" ? (
                <Pressable
                    style={[
                        styles.button,
                        isRequesting && styles.disabledButton,
                    ]}
                    onPress={() => void handleRequestPermission()}
                    disabled={isRequesting}
                >
                    <Text style={styles.buttonText}>
                        {isRequesting ? "Checking..." : "Enable Notifications"}
                    </Text>
                </Pressable>
            ) : null}
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
    permissionStatus: NotificationPermissionStatus | null
): string {
    if (permissionStatus === "granted") {
        return "ReturnRadar can remind you about upcoming return and warranty deadlines.";
    }

    if (permissionStatus === "denied") {
        return "You can still view reminders in the app. To receive device notifications, enable them in your system settings.";
    }

    return "Enable notifications now so ReturnRadar can eventually remind you before deadlines are missed.";
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
    button: {
        backgroundColor: "#2563EB",
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: "center",
    },
    disabledButton: {
        opacity: 0.7,
    },
    buttonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800",
    },
});