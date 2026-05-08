import { useCallback, useMemo, useState } from "react";
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

import { listProducts } from "@/src/features/products/api";
import type { Product } from "@/src/features/products/types";
import { router, useFocusEffect } from "expo-router";
import { getReturnDeadlineStatus } from "@/src/features/products/deadlineUtils";
import { DeadlineStatusPill } from "@/src/features/products/DeadlineStatusPill";

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


export default function ProductsScreen() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const loadProducts = useCallback(async () => {
        try {
            setErrorMessage(null);
            const data = await listProducts();
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
    }, []);

    useFocusEffect(
        useCallback(() => {
            setIsLoading(true);
            void loadProducts();
        }, [loadProducts])
    );

    const handleRefresh = () => {
        setIsRefreshing(true);
        void loadProducts();
    };

    const filteredProducts = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();

        if (!normalizedQuery) {
            return products;
        }

        return products.filter((product) => {
            const searchableText = [
                product.name,
                product.merchant,
                product.notes,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchableText.includes(normalizedQuery);
        });
    }, [products, searchQuery]);

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
            data={filteredProducts}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={[
                styles.listContent,
                filteredProducts.length === 0 && styles.emptyListContent
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
                </View>
            }
            ListEmptyComponent={
                <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>
                        {products.length === 0 ? "No products yet" : "No matching products"}
                    </Text>
                    <Text style={styles.emptyText}>
                        {products.length === 0
                            ? "Add your first product manually or save one from the receipt extraction flow."
                            : "Try a different search term or clear the search box."}
                    </Text>
                </View>
            }
            renderItem={({ item }) => (
                <Pressable style={styles.productCard}
                    onPress={() => router.push(`/products/${item.id}`)}>
                    <Text style={styles.productName}>{item.name}</Text>

                    <Text style={styles.productMeta}>
                        {item.merchant ?? "Merchant not set"} · {formatPrice(item)}
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
});