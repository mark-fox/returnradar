import { Pressable, StyleSheet, Text, View } from "react-native";

import type { DeadlineFocusSection } from "./deadlineFilters";

type DeadlineSummaryGridProps = {
    activeFilter: DeadlineFocusSection;
    upcomingReturnsCount: number;
    expiredReturnsCount: number;
    upcomingWarrantiesCount: number;
    expiredWarrantiesCount: number;
    onFilterChange: (filter: DeadlineFocusSection) => void;
};

export function DeadlineSummaryGrid({
    activeFilter,
    upcomingReturnsCount,
    expiredReturnsCount,
    upcomingWarrantiesCount,
    expiredWarrantiesCount,
    onFilterChange,
}: DeadlineSummaryGridProps) {
    return (
        <View style={styles.summaryGrid}>
            <SummaryCard
                label="Upcoming returns"
                value={upcomingReturnsCount}
                isActive={activeFilter === "upcomingReturns"}
                variant="warning"
                onPress={() => onFilterChange("upcomingReturns")}
            />

            <SummaryCard
                label="Expired returns"
                value={expiredReturnsCount}
                isActive={activeFilter === "expiredReturns"}
                variant="danger"
                onPress={() => onFilterChange("expiredReturns")}
            />

            <SummaryCard
                label="Upcoming warranties"
                value={upcomingWarrantiesCount}
                isActive={activeFilter === "upcomingWarranties"}
                variant="info"
                onPress={() => onFilterChange("upcomingWarranties")}
            />

            <SummaryCard
                label="Expired warranties"
                value={expiredWarrantiesCount}
                isActive={activeFilter === "expiredWarranties"}
                variant="danger"
                onPress={() => onFilterChange("expiredWarranties")}
            />
        </View>
    );
}

function SummaryCard({
    label,
    value,
    isActive,
    variant,
    onPress,
}: {
    label: string;
    value: number;
    isActive: boolean;
    variant: "warning" | "danger" | "info";
    onPress: () => void;
}) {
    return (
        <Pressable
            style={[
                styles.summaryCard,
                isActive && styles.summaryCardActive,
                variant === "warning" && styles.summaryCardWarning,
                variant === "danger" && styles.summaryCardDanger,
                variant === "info" && styles.summaryCardInfo,
            ]}
            onPress={onPress}
        >
            <Text style={styles.summaryValue}>{value}</Text>
            <Text style={styles.summaryLabel}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    summaryGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 24,
    },
    summaryCard: {
        width: "48%",
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    summaryCardActive: {
        borderWidth: 2,
        borderColor: "#2563EB",
    },
    summaryCardWarning: {
        backgroundColor: "#FFFBEB",
    },
    summaryCardDanger: {
        backgroundColor: "#FEF2F2",
    },
    summaryCardInfo: {
        backgroundColor: "#EFF6FF",
    },
    summaryValue: {
        fontSize: 28,
        fontWeight: "900",
        color: "#0F172A",
        marginBottom: 4,
    },
    summaryLabel: {
        fontSize: 13,
        fontWeight: "800",
        color: "#475569",
    },
});