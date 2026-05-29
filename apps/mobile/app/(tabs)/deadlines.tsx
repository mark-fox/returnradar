import { Stack, router } from "expo-router";
import {
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
} from "react-native";

import {
    formatLastUpdated,
} from "@/src/features/products/deadlineDisplayUtils";
import { DeadlineSection } from "@/src/features/products/DeadlineSection";
import { DeadlineSummaryGrid } from "@/src/features/products/DeadlineSummaryGrid";
import { DeadlineTypeFilterChips } from "@/src/features/products/DeadlineTypeFilterChips";
import {
    DeadlineEmptyState,
    DeadlineErrorState,
    DeadlineLoadingState,
} from "@/src/features/products/DeadlineScreenStates";
import { useDeadlinesScreen } from "@/src/features/products/useDeadlinesScreen";


export default function DeadlinesScreen() {
    const {
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
    } = useDeadlinesScreen();


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
                    onRefresh={() => void refreshProducts()}
                />
            }
        >
            <Stack.Screen options={{ title: "Deadlines" }} />

            <Text style={styles.eyebrow}>Deadline Radar</Text>
            <Text style={styles.title}>Deadline center</Text>
            <Text style={styles.description}>
                Review return windows and warranty deadlines that are coming up or already expired.
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
                <>
                    <DeadlineEmptyState
                        title="No deadlines need attention"
                        message="Products with return deadlines in the next 7 days, warranty deadlines in the next 30 days, or expired deadlines will appear here."
                    />

                    <Pressable
                        style={styles.emptyActionButton}
                        onPress={() => router.push("/products/new")}
                    >
                        <Text style={styles.emptyActionButtonText}>
                            Add Product With Deadline
                        </Text>
                    </Pressable>

                    <Pressable
                        style={styles.emptySecondaryButton}
                        onPress={() => router.push("/receipt-scan")}
                    >
                        <Text style={styles.emptySecondaryButtonText}>
                            Scan Receipt
                        </Text>
                    </Pressable>
                </>
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
    emptyActionButton: {
        backgroundColor: "#2563EB",
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        alignItems: "center",
        marginTop: 6,
        marginBottom: 12,
    },
    emptyActionButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "800",
    },
    emptySecondaryButton: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#CBD5E1",
        marginBottom: 24,
    },
    emptySecondaryButtonText: {
        color: "#0F172A",
        fontSize: 16,
        fontWeight: "800",
    },
});