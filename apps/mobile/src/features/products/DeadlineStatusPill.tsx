import { StyleSheet, Text, View } from "react-native";

import type { DeadlineStatus } from "./deadlineUtils";

type DeadlineStatusPillProps = {
    status: DeadlineStatus;
};

export function DeadlineStatusPill({ status }: DeadlineStatusPillProps) {
    return (
        <View style={[styles.statusPill, styles[`statusPill_${status.variant}`]]}>
            <Text
                style={[
                    styles.statusPillText,
                    styles[`statusPillText_${status.variant}`],
                ]}
            >
                {status.label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    statusPill: {
        alignSelf: "flex-start",
        borderRadius: 999,
        paddingVertical: 6,
        paddingHorizontal: 10,
        marginBottom: 0,
    },
    statusPillText: {
        fontSize: 13,
        fontWeight: "800",
    },
    statusPill_missing: {
        backgroundColor: "#F1F5F9",
    },
    statusPill_expired: {
        backgroundColor: "#FEE2E2",
    },
    statusPill_today: {
        backgroundColor: "#FFEDD5",
    },
    statusPill_soon: {
        backgroundColor: "#FEF3C7",
    },
    statusPill_open: {
        backgroundColor: "#DCFCE7",
    },
    statusPillText_missing: {
        color: "#475569",
    },
    statusPillText_expired: {
        color: "#991B1B",
    },
    statusPillText_today: {
        color: "#C2410C",
    },
    statusPillText_soon: {
        color: "#92400E",
    },
    statusPillText_open: {
        color: "#166534",
    },
});