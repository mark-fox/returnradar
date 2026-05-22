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

import { listProducts, archiveProduct } from "@/src/features/products/api";
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

function isExpiringSoon(deadline: string | null): boolean {
    if (!deadline) {
        return false;
    }

    const deadlineDate = new Date(deadline);

    const now = new Date();

    const differenceMs =
        deadlineDate.getTime() - now.getTime();

    const differenceDays =
        differenceMs / (1000 * 60 * 60 * 24);

    return differenceDays >= 0 && differenceDays <= 14;
}

function getDeadlineUrgency(
    deadline: string | null,
): "safe" | "soon" | "urgent" | "expired" {
    if (!deadline) {
        return "safe";
    }

    const deadlineDate = new Date(deadline);

    const now = new Date();

    const differenceMs =
        deadlineDate.getTime() - now.getTime();

    const differenceDays =
        differenceMs / (1000 * 60 * 60 * 24);

    if (differenceDays < 0) {
        return "expired";
    }

    if (differenceDays <= 3) {
        return "urgent";
    }

    if (differenceDays <= 14) {
        return "soon";
    }

    return "safe";
}

function getUrgencyRank(
    urgency: "safe" | "soon" | "urgent" | "expired",
): number {
    switch (urgency) {
        case "expired":
            return 0;

        case "urgent":
            return 1;

        case "soon":
            return 2;

        default:
            return 3;
    }
}

function getProductUrgency(product: Product) {
    const returnUrgency = getDeadlineUrgency(
        product.return_deadline
    );

    const warrantyUrgency = getDeadlineUrgency(
        product.warranty_deadline
    );

    if (
        returnUrgency === "expired" ||
        warrantyUrgency === "expired"
    ) {
        return "expired";
    }

    if (
        returnUrgency === "urgent" ||
        warrantyUrgency === "urgent"
    ) {
        return "urgent";
    }

    if (
        returnUrgency === "soon" ||
        warrantyUrgency === "soon"
    ) {
        return "soon";
    }

    return "safe";
}

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

    const [urgencyFilter, setUrgencyFilter] = useState<
        "all" | "expired" | "urgent" | "protected"
    >("all");

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
        const filteredProducts = products.filter((product) => {
            const urgency = getProductUrgency(product);

            if (urgencyFilter === "expired") {
                return urgency === "expired";
            }

            if (urgencyFilter === "urgent") {
                return (
                    urgency === "urgent" ||
                    urgency === "soon"
                );
            }

            if (urgencyFilter === "protected") {
                return urgency === "safe";
            }

            return true;
        });

        return [...filteredProducts].sort((firstProduct, secondProduct) => {
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

            const firstUrgency =
                getUrgencyRank(
                    getDeadlineUrgency(
                        firstProduct.return_deadline
                    )
                ) <
                    getUrgencyRank(
                        getDeadlineUrgency(
                            firstProduct.warranty_deadline
                        )
                    )
                    ? getDeadlineUrgency(
                        firstProduct.return_deadline
                    )
                    : getDeadlineUrgency(
                        firstProduct.warranty_deadline
                    );

            const secondUrgency =
                getUrgencyRank(
                    getDeadlineUrgency(
                        secondProduct.return_deadline
                    )
                ) <
                    getUrgencyRank(
                        getDeadlineUrgency(
                            secondProduct.warranty_deadline
                        )
                    )
                    ? getDeadlineUrgency(
                        secondProduct.return_deadline
                    )
                    : getDeadlineUrgency(
                        secondProduct.warranty_deadline
                    );

            const urgencyDifference =
                getUrgencyRank(firstUrgency) -
                getUrgencyRank(secondUrgency);

            if (urgencyDifference !== 0) {
                return urgencyDifference;
            }

            return (
                new Date(secondProduct.created_at).getTime() -
                new Date(firstProduct.created_at).getTime()
            );
        });
    }, [products, sortOption, urgencyFilter]);

    const expiringSoonProducts = useMemo(() => {
        return products.filter(
            (product) =>
                isExpiringSoon(product.return_deadline) ||
                isExpiringSoon(product.warranty_deadline)
        );
    }, [products]);

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
            renderItem={({ item }) => {
                const returnUrgency = getDeadlineUrgency(
                    item.return_deadline
                );

                const warrantyUrgency = getDeadlineUrgency(
                    item.warranty_deadline
                );

                const overallUrgency =
                    returnUrgency === "expired" ||
                        warrantyUrgency === "expired"
                        ? "expired"
                        : returnUrgency === "urgent" ||
                            warrantyUrgency === "urgent"
                            ? "urgent"
                            : returnUrgency === "soon" ||
                                warrantyUrgency === "soon"
                                ? "soon"
                                : "safe";

                return (
                    <Pressable
                        style={[
                            styles.productCard,
                            overallUrgency === "soon" &&
                            styles.productCardSoon,
                            overallUrgency === "urgent" &&
                            styles.productCardUrgent,
                            overallUrgency === "expired" &&
                            styles.productCardExpired,
                            selectedProductIds.includes(item.id) &&
                            styles.selectedProductCard,
                        ]}
                        onPress={() => {
                            if (selectionMode) {
                                toggleSelectedProduct(item.id);
                                return;
                            }

                            router.push(`/products/${item.id}`);
                        }}
                    >
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
                        <View
                            style={[
                                styles.urgencyBadge,
                                overallUrgency === "safe" &&
                                styles.urgencyBadgeSafe,
                                overallUrgency === "soon" &&
                                styles.urgencyBadgeSoon,
                                overallUrgency === "urgent" &&
                                styles.urgencyBadgeUrgent,
                                overallUrgency === "expired" &&
                                styles.urgencyBadgeExpired,
                            ]}
                        >
                            <Text style={styles.urgencyBadgeText}>
                                {overallUrgency === "safe"
                                    ? "Protected"
                                    : overallUrgency === "soon"
                                        ? "Expiring Soon"
                                        : overallUrgency === "urgent"
                                            ? "Urgent"
                                            : "Expired"}
                            </Text>
                        </View>
                        <Text style={styles.productName}>{item.name}</Text>

                        {item.receipt_image_path ? (
                            <View style={styles.receiptBadge}>
                                <Text style={styles.receiptBadgeText}>
                                    Receipt Saved
                                </Text>
                            </View>
                        ) : null}

                        <Text style={styles.productMeta}>
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
                );
            }}
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
    productCardSoon: {
        borderColor: "#F59E0B",
        borderWidth: 2,
    },
    productCardUrgent: {
        borderColor: "#DC2626",
        borderWidth: 2,
    },
    productCardExpired: {
        borderColor: "#7F1D1D",
        borderWidth: 2,
        opacity: 0.82,
    },
    urgencyBadge: {
        alignSelf: "flex-start",
        borderRadius: 999,
        paddingVertical: 5,
        paddingHorizontal: 10,
        marginBottom: 12,
    },
    urgencyBadgeSafe: {
        backgroundColor: "#DCFCE7",
    },
    urgencyBadgeSoon: {
        backgroundColor: "#FEF3C7",
    },
    urgencyBadgeUrgent: {
        backgroundColor: "#FEE2E2",
    },
    urgencyBadgeExpired: {
        backgroundColor: "#7F1D1D",
    },
    urgencyBadgeText: {
        fontSize: 12,
        fontWeight: "800",
        color: "#111827",
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
    selectedProductCard: {
        borderWidth: 2,
        borderColor: "#2563EB",
    },
});