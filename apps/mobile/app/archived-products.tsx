import { useEffect, useState } from "react";
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { Stack } from "expo-router";
import {
    listArchivedProducts,
    restoreProduct,
} from "@/src/features/products/api";
import { Product } from "@/src/features/products/types";

export default function ArchivedProductsScreen() {
    const [products, setProducts] = useState<Product[]>([]);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
    const [restoreMessage, setRestoreMessage] = useState<
        string | null
    >(null);

    async function loadProducts() {
        const archivedProducts =
            await listArchivedProducts();

        setProducts(
            archivedProducts.filter(
                (product) => product.is_archived
            )
        );
    }

    function toggleSelectedProduct(productId: number) {
        setSelectedProductIds((current) => {
            if (current.includes(productId)) {
                return current.filter((id) => id !== productId);
            }

            return [...current, productId];
        });
    }

    async function handleRestore(
        productId: number,
    ) {
        await restoreProduct(productId);

        await loadProducts();
        setRestoreMessage("Product restored successfully.");
    }

    async function handleBulkRestore() {
        await Promise.all(
            selectedProductIds.map((productId) =>
                restoreProduct(productId)
            )
        );

        setSelectedProductIds([]);
        setSelectionMode(false);
        setRestoreMessage("Products restored successfully.");

        await loadProducts();
    }

    useEffect(() => {
        void loadProducts();
    }, []);

    return (
        <FlatList
            contentContainerStyle={styles.container}
            data={products}
            keyExtractor={(item) => item.id.toString()}
            ListHeaderComponent={
                <View>
                    <Stack.Screen options={{ title: "Archived Products" }} />
                    <Text style={styles.title}>
                        Archived Products
                    </Text>

                    <Text style={styles.subtitle}>
                        Previously archived products can
                        be restored later.
                    </Text>

                    <View style={styles.bulkActionsRow}>
                        <Pressable
                            style={styles.bulkModeButton}
                            onPress={() => {
                                setSelectionMode((current) => !current);
                                setSelectedProductIds([]);
                            }}
                        >
                            <Text style={styles.bulkModeButtonText}>
                                {selectionMode ? "Cancel Selection" : "Bulk Restore"}
                            </Text>
                        </Pressable>

                        {selectionMode && selectedProductIds.length > 0 ? (
                            <Pressable
                                style={styles.bulkRestoreButton}
                                onPress={handleBulkRestore}
                            >
                                <Text style={styles.bulkRestoreButtonText}>
                                    Restore ({selectedProductIds.length})
                                </Text>
                            </Pressable>
                        ) : null}
                    </View>

                    {restoreMessage ? (
                        <View style={styles.restoreMessageCard}>
                            <Text style={styles.restoreMessageText}>
                                {restoreMessage}
                            </Text>
                        </View>
                    ) : null}
                </View>
            }
            renderItem={({ item }) => (
                <Pressable
                    style={[
                        styles.card,
                        selectedProductIds.includes(item.id) && styles.selectedCard,
                    ]}
                    onPress={() => {
                        if (selectionMode) {
                            toggleSelectedProduct(item.id);
                        }
                    }}
                >
                    <Text style={styles.name}>
                        {item.name}
                    </Text>

                    <View style={styles.archivedBadge}>
                        <Text style={styles.archivedBadgeText}>
                            Archived
                        </Text>
                    </View>

                    <Text style={styles.meta}>
                        {item.merchant ?? "Unknown merchant"}
                    </Text>

                    {!selectionMode ? (
                        <Pressable
                            style={styles.restoreButton}
                            onPress={() =>
                                handleRestore(item.id)
                            }
                        >
                            <Text style={styles.restoreButtonText}>
                                Restore Product
                            </Text>
                        </Pressable>
                    ) : null}
                </Pressable>
            )}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: "#F8FAFC",
        padding: 24,
        paddingBottom: 120,
    },
    title: {
        fontSize: 32,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 15,
        lineHeight: 22,
        color: "#64748B",
        marginBottom: 24,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    name: {
        fontSize: 16,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 8,
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
    restoreMessageCard: {
        backgroundColor: "#DCFCE7",
        borderRadius: 16,
        padding: 14,
        marginBottom: 18,
    },
    restoreMessageText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#166534",
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
    bulkRestoreButton: {
        backgroundColor: "#16A34A",
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    bulkRestoreButtonText: {
        fontSize: 13,
        fontWeight: "800",
        color: "#FFFFFF",
    },
    selectedCard: {
        borderWidth: 2,
        borderColor: "#2563EB",
    },
});