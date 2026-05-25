import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { listProducts, archiveProduct } from "@/src/features/products/api";
import type { Product } from "@/src/features/products/types";
import { router, useFocusEffect } from "expo-router";
import { ProductCard } from "@/src/features/products/ProductCard";
import {
    getVisibleProducts,
    type ProductSortOption,
    type ProductUrgencyFilter,
} from "@/src/features/products/productListUtils";

export default function ProductsScreen() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOption, setSortOption] = useState<ProductSortOption>("newest");
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
    const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
    const [selectionMode, setSelectionMode] = useState(false);

    const [urgencyFilter, setUrgencyFilter] =
        useState<ProductUrgencyFilter>("all");

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const loadProducts = useCallback(async () => {
        try {
            setErrorMessage(null);
            const data = await listProducts({
                search: debouncedSearchQuery,
            });
            setProducts(data);
        } catch (error) {
            console.error(error);
            setErrorMessage(
                "Could not load products. Make sure the API is running and your mobile API URL is correct."
            );
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [debouncedSearchQuery]);

    useFocusEffect(
        useCallback(() => {
            void loadProducts();
        }, [loadProducts])
    );

    const handleRefresh = () => {
        setIsRefreshing(true);
        void loadProducts();
    };


    const visibleProducts = useMemo(() => {
        return getVisibleProducts(products, sortOption, urgencyFilter);
    }, [products, sortOption, urgencyFilter]);


    function toggleSelectedProduct(productId: number) {
        setSelectedProductIds((current) => {
            if (current.includes(productId)) {
                return current.filter((id) => id !== productId);
            }

            return [...current, productId];
        });
    }

    async function handleBulkArchive() {
        try {
            await Promise.all(
                selectedProductIds.map((productId) =>
                    archiveProduct(productId)
                )
            );

            setSelectedProductIds([]);
            setSelectionMode(false);

            await loadProducts();
        } catch (error) {
            console.warn(error);
        }
    }

    if (isLoading) {
        return (
            <View style={styles.centeredState}>
                <ActivityIndicator />
                <Text style={styles.stateText}>Loading products...</Text>
            </View>
        );
    }

    if (errorMessage) {
        return (
            <View style={styles.container}>
                <View style={styles.errorCard}>
                    <Text style={styles.errorTitle}>Unable to load products</Text>
                    <Text style={styles.errorText}>{errorMessage}</Text>

                    <Pressable style={styles.primaryButton} onPress={() => void loadProducts()}>
                        <Text style={styles.primaryButtonText}>Try again</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    return (
        <FlatList
            data={visibleProducts}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={[
                styles.listContent,
                visibleProducts.length === 0 && styles.emptyListContent
            ]}
            refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
            }
            ListHeaderComponent={
                <View style={styles.header}>
                    <Text style={styles.eyebrow}>Products</Text>
                    <Text style={styles.title}>Tracked purchases</Text>
                    <Text style={styles.description}>
                        Saved products from your ReturnRadar backend will appear here.
                    </Text>
                    <Pressable
                        style={styles.addButton}
                        onPress={() => router.push("/products/new")}
                    >
                        <Text style={styles.addButtonText}>Add Product</Text>
                    </Pressable>

                    <Pressable
                        style={styles.archivedButton}
                        onPress={() => router.push("/archived-products")}
                    >
                        <Text style={styles.archivedButtonText}>
                            View Archived Products
                        </Text>
                    </Pressable>

                    <View style={styles.bulkActionsRow}>
                        <Pressable
                            style={styles.bulkModeButton}
                            onPress={() => {
                                setSelectionMode((current) => !current);

                                setSelectedProductIds([]);
                            }}
                        >
                            <Text style={styles.bulkModeButtonText}>
                                {selectionMode
                                    ? "Cancel Selection"
                                    : "Bulk Archive"}
                            </Text>
                        </Pressable>

                        {selectionMode &&
                            selectedProductIds.length > 0 ? (
                            <Pressable
                                style={styles.bulkArchiveButton}
                                onPress={handleBulkArchive}
                            >
                                <Text style={styles.bulkArchiveButtonText}>
                                    Archive ({selectedProductIds.length})
                                </Text>
                            </Pressable>
                        ) : null}
                    </View>

                    <TextInput
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Search products, merchants, or notes"
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={styles.searchInput}
                    />
                    {searchQuery.trim() ? (
                        <Pressable
                            style={styles.clearSearchButton}
                            onPress={() => setSearchQuery("")}
                        >
                            <Text style={styles.clearSearchButtonText}>Clear search</Text>
                        </Pressable>
                    ) : null}

                    <View style={styles.sortSection}>
                        <Text style={styles.sortLabel}>Sort by</Text>

                        <View style={styles.sortButtonRow}>
                            <SortButton
                                label="Newest"
                                isActive={sortOption === "newest"}
                                onPress={() => setSortOption("newest")}
                            />
                            <SortButton
                                label="Return"
                                isActive={sortOption === "returnDeadline"}
                                onPress={() => setSortOption("returnDeadline")}
                            />
                            <SortButton
                                label="Warranty"
                                isActive={sortOption === "warrantyDeadline"}
                                onPress={() => setSortOption("warrantyDeadline")}
                            />
                            <SortButton
                                label="Name"
                                isActive={sortOption === "name"}
                                onPress={() => setSortOption("name")}
                            />
                        </View>
                    </View>
                    <Text style={styles.filterLabel}>
                        Status Filters
                    </Text>
                    <View style={styles.filterRow}>
                        <Pressable
                            style={[
                                styles.filterChip,
                                urgencyFilter === "all" &&
                                styles.filterChipActive,
                            ]}
                            onPress={() => setUrgencyFilter("all")}
                        >
                            <Text style={styles.filterChipText}>
                                All
                            </Text>
                        </Pressable>

                        <Pressable
                            style={[
                                styles.filterChip,
                                urgencyFilter === "expired" &&
                                styles.filterChipExpired,
                            ]}
                            onPress={() => setUrgencyFilter("expired")}
                        >
                            <Text style={styles.filterChipText}>
                                Expired
                            </Text>
                        </Pressable>

                        <Pressable
                            style={[
                                styles.filterChip,
                                urgencyFilter === "urgent" &&
                                styles.filterChipUrgent,
                            ]}
                            onPress={() => setUrgencyFilter("urgent")}
                        >
                            <Text style={styles.filterChipText}>
                                Attention Needed
                            </Text>
                        </Pressable>

                        <Pressable
                            style={[
                                styles.filterChip,
                                urgencyFilter === "protected" &&
                                styles.filterChipProtected,
                            ]}
                            onPress={() =>
                                setUrgencyFilter("protected")
                            }
                        >
                            <Text style={styles.filterChipText}>
                                Protected
                            </Text>
                        </Pressable>
                    </View>
                </View>
            }
            ListEmptyComponent={
                <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>
                        {debouncedSearchQuery.trim() ? "No matching products" : "No products yet"}                    </Text>
                    <Text style={styles.emptyText}>
                        {debouncedSearchQuery.trim()
                            ? "Try a different search term or clear the search box."
                            : "Add your first product manually or save one from the receipt extraction flow."}
                    </Text>
                </View>
            }
            renderItem={({ item }) => (
                <ProductCard
                    product={item}
                    isSelected={selectedProductIds.includes(item.id)}
                    selectionMode={selectionMode}
                    onToggleSelected={() => toggleSelectedProduct(item.id)}
                    onPress={() => router.push(`/products/${item.id}`)}
                />
            )}
        />
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


const styles = StyleSheet.create({
    centeredState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F8FAFC",
        padding: 24,
    },
    stateText: {
        marginTop: 12,
        fontSize: 16,
        color: "#475569",
    },
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
        padding: 24,
    },
    listContent: {
        backgroundColor: "#F8FAFC",
        padding: 24,
        paddingBottom: 40,
    },
    emptyListContent: {
        flexGrow: 1,
    },
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
    emptyState: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0F172A",
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 15,
        lineHeight: 22,
        color: "#64748B",
    },
    errorCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: "#FCA5A5",
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#991B1B",
        marginBottom: 8,
    },
    errorText: {
        fontSize: 15,
        lineHeight: 22,
        color: "#7F1D1D",
        marginBottom: 18,
    },
    primaryButton: {
        backgroundColor: "#2563EB",
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: "center",
    },
    primaryButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "700",
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
    filterLabel: {
        fontSize: 13,
        fontWeight: "800",
        color: "#64748B",
        marginTop: 6,
        marginBottom: 10,
        textTransform: "uppercase",
        letterSpacing: 0.5,
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
});