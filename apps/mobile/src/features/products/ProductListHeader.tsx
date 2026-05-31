import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type {
    ProductSortOption,
    ProductUrgencyFilter,
} from "./productListUtils";

type ProductListHeaderProps = {
    searchQuery: string;
    sortOption: ProductSortOption;
    urgencyFilter: ProductUrgencyFilter;
    selectionMode: boolean;
    selectedProductCount: number;
    onSearchQueryChange: (value: string) => void;
    onSortOptionChange: (value: ProductSortOption) => void;
    onUrgencyFilterChange: (value: ProductUrgencyFilter) => void;
    onAddProductPress: () => void;
    onArchivedProductsPress: () => void;
    onToggleSelectionMode: () => void;
    onBulkArchive: () => void;
};

export function ProductListHeader({
    searchQuery,
    sortOption,
    urgencyFilter,
    selectionMode,
    selectedProductCount,
    onSearchQueryChange,
    onSortOptionChange,
    onUrgencyFilterChange,
    onAddProductPress,
    onArchivedProductsPress,
    onToggleSelectionMode,
    onBulkArchive,
}: ProductListHeaderProps) {
    return (
        <View style={styles.header}>
            <Text style={styles.eyebrow}>Products</Text>
            <Text style={styles.title}>Tracked purchases</Text>
            <Text style={styles.description}>
                Saved products from your ReturnRadar backend will appear here.
            </Text>

            <Pressable style={styles.addButton} onPress={onAddProductPress}>
                <Text style={styles.addButtonText}>Add Product</Text>
            </Pressable>

            <Pressable
                style={styles.archivedButton}
                onPress={onArchivedProductsPress}
            >
                <Text style={styles.archivedButtonText}>
                    View Archived Products
                </Text>
            </Pressable>

            <View style={styles.bulkActionsRow}>
                <Pressable
                    style={styles.bulkModeButton}
                    onPress={onToggleSelectionMode}
                >
                    <Text style={styles.bulkModeButtonText}>
                        {selectionMode ? "Cancel Selection" : "Bulk Archive"}
                    </Text>
                </Pressable>

                {selectionMode && selectedProductCount > 0 ? (
                    <Pressable
                        style={styles.bulkArchiveButton}
                        onPress={onBulkArchive}
                    >
                        <Text style={styles.bulkArchiveButtonText}>
                            Archive ({selectedProductCount})
                        </Text>
                    </Pressable>
                ) : null}
            </View>

            <TextInput
                value={searchQuery}
                onChangeText={onSearchQueryChange}
                placeholder="Search name, merchant, model, serial, or support info"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.searchInput}
            />

            {searchQuery.trim() ? (
                <Pressable
                    style={styles.clearSearchButton}
                    onPress={() => onSearchQueryChange("")}
                >
                    <Text style={styles.clearSearchButtonText}>
                        Clear search
                    </Text>
                </Pressable>
            ) : null}

            <View style={styles.sortSection}>
                <Text style={styles.sortLabel}>Sort by</Text>

                <View style={styles.sortButtonRow}>
                    <SortButton
                        label="Newest"
                        isActive={sortOption === "newest"}
                        onPress={() => onSortOptionChange("newest")}
                    />
                    <SortButton
                        label="Return"
                        isActive={sortOption === "returnDeadline"}
                        onPress={() => onSortOptionChange("returnDeadline")}
                    />
                    <SortButton
                        label="Warranty"
                        isActive={sortOption === "warrantyDeadline"}
                        onPress={() => onSortOptionChange("warrantyDeadline")}
                    />
                    <SortButton
                        label="Name"
                        isActive={sortOption === "name"}
                        onPress={() => onSortOptionChange("name")}
                    />
                </View>
            </View>

            <Text style={styles.filterLabel}>Status Filters</Text>

            <View style={styles.filterRow}>
                <FilterChip
                    label="All"
                    isActive={urgencyFilter === "all"}
                    activeStyle={styles.filterChipActive}
                    onPress={() => onUrgencyFilterChange("all")}
                />

                <FilterChip
                    label="Expired"
                    isActive={urgencyFilter === "expired"}
                    activeStyle={styles.filterChipExpired}
                    onPress={() => onUrgencyFilterChange("expired")}
                />

                <FilterChip
                    label="Attention Needed"
                    isActive={urgencyFilter === "urgent"}
                    activeStyle={styles.filterChipUrgent}
                    onPress={() => onUrgencyFilterChange("urgent")}
                />

                <FilterChip
                    label="Protected"
                    isActive={urgencyFilter === "protected"}
                    activeStyle={styles.filterChipProtected}
                    onPress={() => onUrgencyFilterChange("protected")}
                />
            </View>
        </View>
    );
}

function SortButton({
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
            style={[styles.sortButton, isActive && styles.sortButtonActive]}
            onPress={onPress}
        >
            <Text
                style={[
                    styles.sortButtonText,
                    isActive && styles.sortButtonTextActive,
                ]}
            >
                {label}
            </Text>
        </Pressable>
    );
}

function FilterChip({
    label,
    isActive,
    activeStyle,
    onPress,
}: {
    label: string;
    isActive: boolean;
    activeStyle: object;
    onPress: () => void;
}) {
    return (
        <Pressable
            style={[styles.filterChip, isActive && activeStyle]}
            onPress={onPress}
        >
            <Text style={styles.filterChipText}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    header: {
        marginBottom: 24,
    },
    eyebrow: {
        fontSize: 16,
        fontWeight: "700",
        color: "#2563EB",
        marginBottom: 8,
    },
    title: {
        fontSize: 30,
        lineHeight: 36,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        color: "#475569",
    },
    addButton: {
        backgroundColor: "#2563EB",
        borderRadius: 14,
        paddingVertical: 13,
        paddingHorizontal: 16,
        alignItems: "center",
        marginTop: 18,
    },
    addButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800",
    },
    archivedButton: {
        alignSelf: "flex-start",
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginBottom: 14,
    },
    archivedButtonText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#2563EB",
    },
    bulkActionsRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 18,
    },
    bulkModeButton: {
        backgroundColor: "#E2E8F0",
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 14,
        marginRight: 10,
    },
    bulkModeButtonText: {
        fontSize: 13,
        fontWeight: "800",
        color: "#0F172A",
    },
    bulkArchiveButton: {
        backgroundColor: "#DC2626",
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    bulkArchiveButtonText: {
        fontSize: 13,
        fontWeight: "800",
        color: "#FFFFFF",
    },
    searchInput: {
        borderWidth: 1,
        borderColor: "#CBD5E1",
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        color: "#0F172A",
        backgroundColor: "#FFFFFF",
        marginTop: 14,
    },
    clearSearchButton: {
        alignSelf: "flex-start",
        marginTop: 10,
        paddingVertical: 6,
        paddingHorizontal: 2,
    },
    clearSearchButtonText: {
        color: "#2563EB",
        fontSize: 14,
        fontWeight: "800",
    },
    sortSection: {
        marginTop: 16,
    },
    sortLabel: {
        fontSize: 13,
        fontWeight: "800",
        color: "#64748B",
        marginBottom: 8,
        textTransform: "uppercase",
    },
    sortButtonRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: 14,
    },
    sortButton: {
        borderRadius: 999,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#CBD5E1",
    },
    sortButtonActive: {
        backgroundColor: "#2563EB",
        borderColor: "#2563EB",
    },
    sortButtonText: {
        color: "#334155",
        fontSize: 14,
        fontWeight: "800",
    },
    sortButtonTextActive: {
        color: "#FFFFFF",
    },
    filterLabel: {
        fontSize: 13,
        fontWeight: "800",
        color: "#64748B",
        marginTop: 6,
        marginBottom: 10,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    filterRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: 14,
    },
    filterChip: {
        backgroundColor: "#E2E8F0",
        borderRadius: 999,
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginRight: 8,
        marginBottom: 8,
    },
    filterChipActive: {
        backgroundColor: "#CBD5E1",
    },
    filterChipExpired: {
        backgroundColor: "#FECACA",
    },
    filterChipUrgent: {
        backgroundColor: "#FEF3C7",
    },
    filterChipProtected: {
        backgroundColor: "#DCFCE7",
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: "800",
        color: "#0F172A",
    },
});