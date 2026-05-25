import { useCallback, useEffect, useMemo, useState } from "react";

import { listProducts } from "./api";
import {
    getVisibleProducts,
    type ProductSortOption,
    type ProductUrgencyFilter,
} from "./productListUtils";
import type { Product } from "./types";

export function useProductsList() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
    const [sortOption, setSortOption] = useState<ProductSortOption>("newest");
    const [urgencyFilter, setUrgencyFilter] =
        useState<ProductUrgencyFilter>("all");

    const loadProducts = useCallback(async () => {
        try {
            setErrorMessage(null);

            const data = await listProducts({
                search: debouncedSearchQuery,
            });

            setProducts(data);
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Something went wrong while loading products."
            );
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [debouncedSearchQuery]);

    const refreshProducts = useCallback(async () => {
        setIsRefreshing(true);
        await loadProducts();
    }, [loadProducts]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [searchQuery]);

    useEffect(() => {
        void loadProducts();
    }, [loadProducts]);

    const visibleProducts = useMemo(() => {
        return getVisibleProducts(products, sortOption, urgencyFilter);
    }, [products, sortOption, urgencyFilter]);

    return {
        products,
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
    };
}