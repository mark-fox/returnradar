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
    Image,
} from "react-native";

import { listProducts } from "@/src/features/products/api";
import type { Product } from "@/src/features/products/types";
import { router, useFocusEffect } from "expo-router";
import { getReturnDeadlineStatus } from "@/src/features/products/deadlineUtils";
import { DeadlineStatusPill } from "@/src/features/products/DeadlineStatusPill";
import { getProductSourceLabel } from "@/src/features/products/sourceUtils";

type ProductSortOption = "newest" | "returnDeadline" | "warrantyDeadline" | "name";

function formatPrice(product: Product): string {
    if (product.price_cents === null) {
        return "Price not set";
    }

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: product.currency,
    }).format(product.price_cents / 100);
}

function formatDeadline(value: string | null): string {
    if (!value) {
        return "No deadline set";
    }

    return new Date(`${value}T00:00:00`).toLocaleDateString();
}

function compareOptionalDates(firstDate: string | null, secondDate: string | null): number {
    if (!firstDate && !secondDate) {
        return 0;
    }

    if (!firstDate) {
        return 1;
    }

    if (!secondDate) {
        return -1;
    }

    return (
        new Date(`${firstDate}T00:00:00`).getTime() -
        new Date(`${secondDate}T00:00:00`).getTime()
    );
}

export default function ProductsScreen() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOption, setSortOption] = useState<ProductSortOption>("newest");
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

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
        return [...products].sort((firstProduct, secondProduct) => {
            if (sortOption === "name") {
                return firstProduct.name.localeCompare(secondProduct.name);
            }

            if (sortOption === "returnDeadline") {
                return compareOptionalDates(
                    firstProduct.return_deadline,
                    secondProduct.return_deadline
                );
            }

            if (sortOption === "warrantyDeadline") {
                return compareOptionalDates(
                    firstProduct.warranty_deadline,
                    secondProduct.warranty_deadline
                );
            }

            return (
                new Date(secondProduct.created_at).getTime() -
                new Date(firstProduct.created_at).getTime()
            );
        });
    }, [products, sortOption]);

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
                <Pressable style={styles.productCard}
                    onPress={() => router.push(`/products/${item.id}`)}>
                    {item.receipt_image_path ? (
                        <Image
                            source={{
                                uri: `${process.env.EXPO_PUBLIC_API_BASE_URL?.replace(
                                    "/api/v1",
                                    "",
                                )}/${item.receipt_image_path}`,
                            }}
                            style={styles.receiptThumbnail}
                            resizeMode="cover"
                        />
                    ) : null}
                    <Text style={styles.productName}>{item.name}</Text>

                    <Text style={styles.productMeta}>
                        {item.receipt_image_path ? (
                            <View style={styles.receiptBadge}>
                                <Text style={styles.receiptBadgeText}>
                                    Receipt Saved
                                </Text>
                            </View>
                        ) : null}
                        {item.merchant ?? "Merchant not set"} · {formatPrice(item)}
                    </Text>

                    <Text style={styles.productSource}>
                        {getProductSourceLabel(item.source)}
                    </Text>

                    <DeadlineStatusPill status={getReturnDeadlineStatus(item.return_deadline)} />

                    <View style={styles.deadlineRow}>
                        <Text style={styles.deadlineLabel}>Return</Text>
                        <Text style={styles.deadlineValue}>
                            {formatDeadline(item.return_deadline)}
                        </Text>
                    </View>

                    <View style={styles.deadlineRow}>
                        <Text style={styles.deadlineLabel}>Warranty</Text>
                        <Text style={styles.deadlineValue}>
                            {formatDeadline(item.warranty_deadline)}
                        </Text>
                    </View>
                </Pressable>
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
    productCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 18,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    productName: {
        fontSize: 18,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 6,
    },
    productMeta: {
        fontSize: 14,
        color: "#64748B",
        marginBottom: 16,
    },
    deadlineRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 16,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: "#E2E8F0",
    },
    deadlineLabel: {
        fontSize: 14,
        fontWeight: "700",
        color: "#334155",
    },
    deadlineValue: {
        fontSize: 14,
        color: "#475569",
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
        gap: 8,
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
    productSource: {
        fontSize: 13,
        fontWeight: "700",
        color: "#2563EB",
        marginBottom: 12,
    },
    receiptThumbnail: {
        width: "100%",
        height: 140,
        borderRadius: 16,
        backgroundColor: "#E2E8F0",
        marginBottom: 14,
    },
    receiptBadge: {
        alignSelf: "flex-start",
        backgroundColor: "#DBEAFE",
        borderRadius: 999,
        paddingVertical: 4,
        paddingHorizontal: 10,
        marginBottom: 12,
    },
    receiptBadgeText: {
        fontSize: 12,
        fontWeight: "800",
        color: "#1D4ED8",
    },
});