import { Pressable, StyleSheet, Text, View } from "react-native";

import type { DeadlineTypeFilter } from "./deadlineFilters";

type DeadlineTypeFilterChipsProps = {
    activeFilter: DeadlineTypeFilter;
    onFilterChange: (filter: DeadlineTypeFilter) => void;
};

export function DeadlineTypeFilterChips({
    activeFilter,
    onFilterChange,
}: DeadlineTypeFilterChipsProps) {
    return (
        <View style={styles.filterRow}>
            <FilterChip
                label="All"
                isActive={activeFilter === "all"}
                onPress={() => onFilterChange("all")}
            />

            <FilterChip
                label="Returns"
                isActive={activeFilter === "returns"}
                onPress={() => onFilterChange("returns")}
            />

            <FilterChip
                label="Warranties"
                isActive={activeFilter === "warranties"}
                onPress={() => onFilterChange("warranties")}
            />
        </View>
    );
}

function FilterChip({
    label,
    isActive,
    onPress,
}: {
    label: string;
    isActive: boolean;
    onPress: () => void;
}) {
    return (
        <Pressable
            style={[styles.filterChip, isActive && styles.filterChipActive]}
            onPress={onPress}
        >
            <Text
                style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                ]}
            >
                {label}
            </Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    filterRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 24,
    },
    filterChip: {
        backgroundColor: "#E2E8F0",
        borderRadius: 999,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    filterChipActive: {
        backgroundColor: "#2563EB",
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: "800",
        color: "#334155",
    },
    filterChipTextActive: {
        color: "#FFFFFF",
    },
});