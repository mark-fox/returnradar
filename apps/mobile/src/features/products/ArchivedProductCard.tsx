import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Product } from "./types";

type ArchivedProductCardProps = {
    product: Product;
    isSelected: boolean;
    selectionMode: boolean;
    onPress: () => void;
    onRestorePress: () => void;
};

export function ArchivedProductCard({
    product,
    isSelected,
    selectionMode,
    onPress,
    onRestorePress,
}: ArchivedProductCardProps) {
    return (
        <Pressable
            style={[
                styles.card,
                isSelected && styles.selectedCard,
            ]}
            onPress={onPress}
        >
            <Text style={styles.name}>{product.name}</Text>

            <View style={styles.archivedBadge}>
                <Text style={styles.archivedBadgeText}>Archived</Text>
            </View>

            <Text style={styles.meta}>
                {product.merchant ?? "Unknown merchant"}
            </Text>

            {!selectionMode ? (
                <Pressable
                    style={styles.restoreButton}
                    onPress={onRestorePress}
                >
                    <Text style={styles.restoreButtonText}>
                        Restore Product
                    </Text>
                </Pressable>
            ) : null}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    selectedCard: {
        borderWidth: 2,
        borderColor: "#2563EB",
    },
    name: {
        fontSize: 16,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 8,
    },
    archivedBadge: {
        alignSelf: "flex-start",
        backgroundColor: "#E2E8F0",
        borderRadius: 999,
        paddingVertical: 5,
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    archivedBadgeText: {
        fontSize: 12,
        fontWeight: "800",
        color: "#334155",
    },
    meta: {
        fontSize: 14,
        color: "#64748B",
        marginBottom: 14,
    },
    restoreButton: {
        backgroundColor: "#0F172A",
        borderRadius: 14,
        paddingVertical: 12,
        alignItems: "center",
    },
    restoreButtonText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "800",
    },
});