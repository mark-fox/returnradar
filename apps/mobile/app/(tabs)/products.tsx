import {
    FlatList,
    RefreshControl,
    StyleSheet,
} from "react-native";

import { archiveProduct } from "@/src/features/products/api";
import { router } from "expo-router";
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
});