import { useCallback, useEffect, useMemo, useState } from "react";
import {
    FlatList,
    RefreshControl,
    StyleSheet,
} from "react-native";

import { listProducts, archiveProduct } from "@/src/features/products/api";
import type { Product } from "@/src/features/products/types";
import { router, useFocusEffect } from "expo-router";
import { ProductCard } from "@/src/features/products/ProductCard";
import { ProductListHeader } from "@/src/features/products/ProductListHeader";
import {
    getVisibleProducts,
    type ProductSortOption,
    type ProductUrgencyFilter,
} from "@/src/features/products/productListUtils";
import {
    ProductEmptyState,
    ProductErrorState,
    ProductLoadingState,
} from "@/src/features/products/ProductListStates";

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
        return <ProductLoadingState />;
    }

    if (errorMessage) {
        return (
            <ProductErrorState
                message={errorMessage}
                onRetry={() => void loadProducts()}
            />
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
                <ProductListHeader
                    searchQuery={searchQuery}
                    sortOption={sortOption}
                    urgencyFilter={urgencyFilter}
                    selectionMode={selectionMode}
                    selectedProductCount={selectedProductIds.length}
                    onSearchQueryChange={setSearchQuery}
                    onSortOptionChange={setSortOption}
                    onUrgencyFilterChange={setUrgencyFilter}
                    onAddProductPress={() => router.push("/products/new")}
                    onArchivedProductsPress={() => router.push("/archived-products")}
                    onToggleSelectionMode={() => {
                        setSelectionMode((current) => !current);
                        setSelectedProductIds([]);
                    }}
                    onBulkArchive={() => void handleBulkArchive()}
                />
            }
            ListEmptyComponent={
                <ProductEmptyState
                    isSearching={Boolean(debouncedSearchQuery.trim())}
                />
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


const styles = StyleSheet.create({
    listContent: {
        backgroundColor: "#F8FAFC",
        padding: 24,
        paddingBottom: 40,
    },
    emptyListContent: {
        flexGrow: 1,
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
});