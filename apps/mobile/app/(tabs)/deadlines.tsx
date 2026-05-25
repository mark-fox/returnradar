import { Stack, router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { listProducts } from "@/src/features/products/api";
import { getDeadlineGroups } from "@/src/features/products/deadlineFilters";
import type { Product } from "@/src/features/products/types";
import {
    formatDeadlineDate,
    formatLastUpdated,
    formatRemainingTime,
} from "@/src/features/products/deadlineDisplayUtils";
import { DeadlineSection } from "@/src/features/products/DeadlineSection";
import { DeadlineSummaryGrid } from "@/src/features/products/DeadlineSummaryGrid";
import type { DeadlineFocusSection, DeadlineTypeFilter } from "@/src/features/products/deadlineFilters";
import { DeadlineTypeFilterChips } from "@/src/features/products/DeadlineTypeFilterChips";
import {
    DeadlineEmptyState,
    DeadlineErrorState,
    DeadlineLoadingState,
} from "@/src/features/products/DeadlineScreenStates";


export default function DeadlinesScreen() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

    const [deadlineFilter, setDeadlineFilter] =
        useState<DeadlineTypeFilter>("all");

    const [focusedSection, setFocusedSection] =
        useState<DeadlineFocusSection>("all");

    const loadProducts = useCallback(async () => {
        try {
            setErrorMessage(null);

            const data = await listProducts({
                limit: 100,
                offset: 0,
            });

            setProducts(data);
            setLastUpdatedAt(new Date());
        } catch (error) {
            console.error(error);
            setErrorMessage("Could not load deadline data.");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await loadProducts();
    }, [loadProducts]);

    useFocusEffect(
        useCallback(() => {
            void loadProducts();
        }, [loadProducts])
    );

    const deadlineGroups = useMemo(() => {
        return getDeadlineGroups(products);
    }, [products]);

    const hasAnyDeadlines =
        deadlineGroups.upcomingReturns.length > 0 ||
        deadlineGroups.expiredReturns.length > 0 ||
        deadlineGroups.upcomingWarranties.length > 0 ||
        deadlineGroups.expiredWarranties.length > 0;

    if (isLoading) {
        return <DeadlineLoadingState />;
    }

    if (errorMessage) {
        return (
            <DeadlineErrorState
                message={errorMessage}
                onRetry={() => void loadProducts()}
            />
        );
    }

    return (
        <ScrollView
            contentContainerStyle={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={handleRefresh}
                />
            }
        >
            <Stack.Screen options={{ title: "Deadlines" }} />

            <Text style={styles.eyebrow}>Deadline Radar</Text>
            <Text style={styles.title}>Upcoming deadlines</Text>
            <Text style={styles.description}>
                Review returns and warranties that need attention soon.
            </Text>

            <Text style={styles.lastUpdatedText}>
                Last updated: {formatLastUpdated(lastUpdatedAt)}
            </Text>

            <DeadlineTypeFilterChips
                activeFilter={deadlineFilter}
                onFilterChange={setDeadlineFilter}
            />

            {focusedSection !== "all" ? (
                <Pressable
                    style={styles.clearFocusButton}
                    onPress={() =>
                        setFocusedSection("all")
                    }
                >
                    <Text style={styles.clearFocusButtonText}>
                        Show All Deadline Sections
                    </Text>
                </Pressable>
            ) : null}

            <DeadlineSummaryGrid
                activeFilter={focusedSection}
                upcomingReturnsCount={deadlineGroups.upcomingReturns.length}
                expiredReturnsCount={deadlineGroups.expiredReturns.length}
                upcomingWarrantiesCount={deadlineGroups.upcomingWarranties.length}
                expiredWarrantiesCount={deadlineGroups.expiredWarranties.length}
                onFilterChange={setFocusedSection}
            />

            {!hasAnyDeadlines ? (
                <DeadlineEmptyState
                    title="No urgent deadlines"
                    message="Products with return deadlines in the next 7 days or warranty deadlines in the next 30 days will appear here."
                />
            ) : (
                <>
                    {deadlineFilter !== "warranties" &&
                        (
                            focusedSection === "all" ||
                            focusedSection === "upcomingReturns" ||
                            focusedSection === "expiredReturns"
                        ) ? (
                        <>
                            {focusedSection === "all" ||
                                focusedSection === "upcomingReturns" ? (
                                <DeadlineSection
                                    title="Returns due soon"
                                    emptyText="No return deadlines due in the next 7 days."
                                    products={deadlineGroups.upcomingReturns}
                                    deadlineType="return"
                                />
                            ) : null}

                            {focusedSection === "all" ||
                                focusedSection === "expiredReturns" ? (
                                <DeadlineSection
                                    title="Expired returns"
                                    emptyText="No expired return windows."
                                    products={deadlineGroups.expiredReturns}
                                    deadlineType="return"
                                />
                            ) : null}
                        </>
                    ) : null}

                    {deadlineFilter !== "returns" &&
                        (
                            focusedSection === "all" ||
                            focusedSection === "upcomingWarranties" ||
                            focusedSection === "expiredWarranties"
                        ) ? (
                        <>
                            {focusedSection === "all" ||
                                focusedSection === "upcomingWarranties" ? (
                                <DeadlineSection
                                    title="Warranties ending soon"
                                    emptyText="No warranties ending in the next 30 days."
                                    products={deadlineGroups.upcomingWarranties}
                                    deadlineType="warranty"
                                />
                            ) : null}

                            {focusedSection === "all" ||
                                focusedSection === "expiredWarranties" ? (
                                <DeadlineSection
                                    title="Expired warranties"
                                    emptyText="No expired warranties."
                                    products={deadlineGroups.expiredWarranties}
                                    deadlineType="warranty"
                                />
                            ) : null}
                        </>
                    ) : null}
                </>
            )}
        </ScrollView>
    );
}


const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: "#F8FAFC",
        padding: 24,
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
        marginBottom: 24,
    },
    lastUpdatedText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#64748B",
        marginBottom: 20,
    },
    clearFocusButton: {
        backgroundColor: "#0F172A",
        borderRadius: 14,
        paddingVertical: 12,
        alignItems: "center",
        marginBottom: 22,
    },
    clearFocusButtonText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "800",
    },
});