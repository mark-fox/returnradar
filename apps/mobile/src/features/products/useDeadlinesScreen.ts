import { useCallback, useEffect, useMemo, useState } from "react";

import { listProducts } from "./api";
import {
    getDeadlineGroups,
    type DeadlineFocusSection,
    type DeadlineTypeFilter,
} from "./deadlineFilters";
import type { Product } from "./types";

export function useDeadlinesScreen() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [deadlineFilter, setDeadlineFilter] =
        useState<DeadlineTypeFilter>("all");
    const [focusedSection, setFocusedSection] =
        useState<DeadlineFocusSection>("all");
    const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

    const loadProducts = useCallback(async () => {
        try {
            setErrorMessage(null);

            const data = await listProducts({
                limit: 100,
            });

            setProducts(data);
            setLastUpdatedAt(new Date());
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Something went wrong while loading deadlines."
            );
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    const refreshProducts = useCallback(async () => {
        setIsRefreshing(true);
        await loadProducts();
    }, [loadProducts]);

    useEffect(() => {
        void loadProducts();
    }, [loadProducts]);

    const deadlineGroups = useMemo(() => {
        return getDeadlineGroups(products);
    }, [products]);

    const hasAnyDeadlines =
        deadlineGroups.upcomingReturns.length > 0 ||
        deadlineGroups.expiredReturns.length > 0 ||
        deadlineGroups.upcomingWarranties.length > 0 ||
        deadlineGroups.expiredWarranties.length > 0;

    return {
        products,
        isLoading,
        isRefreshing,
        errorMessage,
        deadlineFilter,
        focusedSection,
        lastUpdatedAt,
        deadlineGroups,
        hasAnyDeadlines,
        setDeadlineFilter,
        setFocusedSection,
        loadProducts,
        refreshProducts,
    };
}