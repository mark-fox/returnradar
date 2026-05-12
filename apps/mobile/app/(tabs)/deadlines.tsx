import { Stack, router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { listProducts } from "@/src/features/products/api";
import { DeadlineStatusPill } from "@/src/features/products/DeadlineStatusPill";
import {
    getDaysUntilDate,
    getReturnDeadlineStatus,
    getWarrantyDeadlineStatus,
} from "@/src/features/products/deadlineUtils";
import { getDeadlineGroups } from "@/src/features/products/deadlineFilters";
import type { Product } from "@/src/features/products/types";

function formatDate(value: string | null): string {
    if (!value) {
        return "Not set";
    }

    return new Date(`${value}T00:00:00`).toLocaleDateString();
}

function formatRemainingTime(daysRemaining: number | null): string {
    if (daysRemaining === null) {
        return "No deadline";
    }

    if (daysRemaining === 0) {
        return "Ends today";
    }

    if (daysRemaining > 0) {
        return `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining`;
    }

    const expiredDays = Math.abs(daysRemaining);

    return `Expired ${expiredDays} day${expiredDays === 1 ? "" : "s"} ago`;
}

export default function DeadlinesScreen() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const loadProducts = useCallback(async () => {
        try {
            setErrorMessage(null);

            const data = await listProducts({
                limit: 100,
                offset: 0,
            });

            setProducts(data);
        } catch (error) {
            console.error(error);
            setErrorMessage("Could not load deadline data.");
        } finally {
            setIsLoading(false);
        }
    }, []);

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
        return (
            <View style={styles.centeredState}>
                <Stack.Screen options={{ title: "Deadlines" }} />
                <ActivityIndicator />
                <Text style={styles.stateText}>Loading deadlines...</Text>
            </View>
        );
    }

    if (errorMessage) {
        return (
            <View style={styles.container}>
                <Stack.Screen options={{ title: "Deadlines" }} />

                <View style={styles.errorCard}>
                    <Text style={styles.errorTitle}>Unable to load deadlines</Text>
                    <Text style={styles.errorText}>{errorMessage}</Text>

                    <Pressable style={styles.primaryButton} onPress={() => void loadProducts()}>
                        <Text style={styles.primaryButtonText}>Try again</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Stack.Screen options={{ title: "Deadlines" }} />

            <Text style={styles.eyebrow}>Deadline Radar</Text>
            <Text style={styles.title}>Upcoming deadlines</Text>
            <Text style={styles.description}>
                Review returns and warranties that need attention soon.
            </Text>
            <View style={styles.summaryGrid}>
                <SummaryCard
                    value={deadlineGroups.upcomingReturns.length}
                    label="Returns due soon"
                />

                <SummaryCard
                    value={deadlineGroups.expiredReturns.length}
                    label="Expired returns"
                />

                <SummaryCard
                    value={deadlineGroups.upcomingWarranties.length}
                    label="Warranties ending"
                />

                <SummaryCard
                    value={deadlineGroups.expiredWarranties.length}
                    label="Expired warranties"
                />
            </View>

            {!hasAnyDeadlines ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>No urgent deadlines</Text>
                    <Text style={styles.emptyText}>
                        Products with return deadlines in the next 7 days or warranty
                        deadlines in the next 30 days will appear here.
                    </Text>
                </View>
            ) : (
                <>
                    <DeadlineSection
                        title="Returns due soon"
                        emptyText="No return deadlines due in the next 7 days."
                        products={deadlineGroups.upcomingReturns}
                        deadlineType="return"
                    />

                    <DeadlineSection
                        title="Expired returns"
                        emptyText="No expired return windows."
                        products={deadlineGroups.expiredReturns}
                        deadlineType="return"
                    />

                    <DeadlineSection
                        title="Warranties ending soon"
                        emptyText="No warranties ending in the next 30 days."
                        products={deadlineGroups.upcomingWarranties}
                        deadlineType="warranty"
                    />

                    <DeadlineSection
                        title="Expired warranties"
                        emptyText="No expired warranties."
                        products={deadlineGroups.expiredWarranties}
                        deadlineType="warranty"
                    />
                </>
            )}
        </ScrollView>
    );
}

function SummaryCard({
    value,
    label,
}: {
    value: number;
    label: string;
}) {
    return (
        <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{value}</Text>
            <Text style={styles.summaryLabel}>{label}</Text>
        </View>
    );
}

function DeadlineSection({
    title,
    emptyText,
    products,
    deadlineType,
}: {
    title: string;
    emptyText: string;
    products: Product[];
    deadlineType: "return" | "warranty";
}) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>

            {products.length === 0 ? (
                <Text style={styles.sectionEmptyText}>{emptyText}</Text>
            ) : (
                products.map((product) => {
                    const status =
                        deadlineType === "return"
                            ? getReturnDeadlineStatus(product.return_deadline)
                            : getWarrantyDeadlineStatus(product.warranty_deadline);

                    const dateValue =
                        deadlineType === "return"
                            ? product.return_deadline
                            : product.warranty_deadline;
                    const daysRemaining = getDaysUntilDate(dateValue);

                    return (
                        <Pressable
                            key={`${deadlineType}-${product.id}`}
                            style={styles.deadlineCard}
                            onPress={() => router.push(`/products/${product.id}`)}
                        >
                            <Text style={styles.productName}>{product.name}</Text>
                            <Text style={styles.productMeta}>
                                {product.merchant ?? "Merchant not set"} · {formatDate(dateValue)}
                            </Text>
                            <Text style={styles.remainingTimeText}>
                                {formatRemainingTime(daysRemaining)}
                            </Text>

                            <DeadlineStatusPill status={status} />
                        </Pressable>
                    );
                })
            )}
        </View>
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
    emptyState: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 15,
        lineHeight: 22,
        color: "#64748B",
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 10,
    },
    sectionEmptyText: {
        fontSize: 15,
        lineHeight: 22,
        color: "#64748B",
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    deadlineCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 18,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    productName: {
        fontSize: 17,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 6,
    },
    productMeta: {
        fontSize: 14,
        color: "#64748B",
        marginBottom: 12,
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
    summaryGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 28,
    },
    summaryCard: {
        flexBasis: "48%",
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    summaryValue: {
        fontSize: 36,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 6,
    },
    summaryLabel: {
        fontSize: 15,
        lineHeight: 22,
        fontWeight: "700",
        color: "#64748B",
    },
    remainingTimeText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#0F172A",
        marginBottom: 10,
    },
});