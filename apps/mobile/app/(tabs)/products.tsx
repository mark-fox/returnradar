import {
    FlatList,
    RefreshControl,
    StyleSheet,
} from "react-native";

import { archiveProduct } from "@/src/features/products/api";
import type { Product } from "@/src/features/products/types";
import { router, useFocusEffect } from "expo-router";
import { ProductCard } from "@/src/features/products/ProductCard";
import { ProductListHeader } from "@/src/features/products/ProductListHeader";
import { useProductSelection } from "@/src/features/products/useProductSelection";
import {
    ProductEmptyState,
    ProductErrorState,
    ProductLoadingState,
} from "@/src/features/products/ProductListStates";
import { useProductsList } from "@/src/features/products/useProductsList";

export default function ProductsScreen() {
    const {
        selectionMode,
        selectedProductIds,
        resetSelection,
        toggleSelectionMode,
        toggleSelectedProduct,
    } = useProductSelection();

    const {
        visibleProducts,
        isLoading,
        isRefreshing,
        errorMessage,
        searchQuery,
        debouncedSearchQuery,
        sortOption,
        urgencyFilter,
        setSearchQuery,
        setSortOption,
        setUrgencyFilter,
        loadProducts,
        refreshProducts,
    } = useProductsList();


    async function handleBulkArchive() {
        try {
            await Promise.all(
                selectedProductIds.map((productId) =>
                    archiveProduct(productId)
                )
            );

            resetSelection();

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
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={() => void refreshProducts()}
                />
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
                    onToggleSelectionMode={toggleSelectionMode}
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