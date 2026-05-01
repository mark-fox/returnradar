import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { listProducts } from "@/src/features/products/api";
import type { Product } from "@/src/features/products/types";
import { router, useFocusEffect } from "expo-router";

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

function getReturnStatus(returnDeadline: string | null): string {
    if (!returnDeadline) {
        return "No return deadline";
    }

    const today = new Date();
    const deadline = new Date(`${returnDeadline}T00:00:00`);

    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);

    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const daysRemaining = Math.ceil(
        (deadline.getTime() - today.getTime()) / millisecondsPerDay
    );

    if (daysRemaining < 0) {
        return "Return expired";
    }

    if (daysRemaining === 0) {
        return "Return ends today";
    }

    if (daysRemaining <= 7) {
        return `${daysRemaining} days left`;
    }

    return "Return open";
}

export default function ProductsScreen() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
            data={products}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={[
                styles.listContent,
                products.length === 0 && styles.emptyListContent,
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
                </View>
            }
            ListEmptyComponent={
                <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>No products yet</Text>
                    <Text style={styles.emptyText}>
                        Add a product through the API docs for now. Soon, you’ll be able to
                        add products directly from the app.
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

                    <View style={styles.statusPill}>
                        <Text style={styles.statusPillText}>
                            {getReturnStatus(item.return_deadline)}
                        </Text>
                    </View>

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
    statusPill: {
        alignSelf: "flex-start",
        backgroundColor: "#EFF6FF",
        borderRadius: 999,
        paddingVertical: 6,
        paddingHorizontal: 10,
        marginBottom: 14,
    },
    statusPillText: {
        color: "#1D4ED8",
        fontSize: 13,
        fontWeight: "800",
    },
});