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
import { useProductSelection } from "@/src/features/products/useProductSelection";
import { ArchivedProductCard } from "@/src/features/products/ArchivedProductCard";

export default function ArchivedProductsScreen() {
    const [products, setProducts] = useState<Product[]>([]);
    const [restoreMessage, setRestoreMessage] = useState<
        string | null
    >(null);

    const {
        selectionMode,
        selectedProductIds,
        resetSelection,
        toggleSelectionMode,
        toggleSelectedProduct,
    } = useProductSelection();

    async function loadProducts() {
        const archivedProducts =
            await listArchivedProducts();

        setProducts(
            archivedProducts.filter(
                (product) => product.is_archived
            )
        );
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

        resetSelection();
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
                            onPress={toggleSelectionMode}
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
                <ArchivedProductCard
                    product={item}
                    isSelected={selectedProductIds.includes(item.id)}
                    selectionMode={selectionMode}
                    onPress={() => {
                        if (selectionMode) {
                            toggleSelectedProduct(item.id);
                        }
                    }}
                    onRestorePress={() => void handleRestore(item.id)}
                />
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
});