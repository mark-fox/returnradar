import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { DeadlineStatusPill } from "./DeadlineStatusPill";
import {
    formatDeadlineDate,
    formatRemainingTime,
} from "./deadlineDisplayUtils";
import {
    getDaysUntilDate,
    getReturnDeadlineStatus,
    getWarrantyDeadlineStatus,
} from "./deadlineUtils";
import { getProductSourceLabel } from "./sourceUtils";
import type { Product } from "./types";

type DeadlineSectionProps = {
    title: string;
    emptyText: string;
    products: Product[];
    deadlineType: "return" | "warranty";
};

export function DeadlineSection({
    title,
    emptyText,
    products,
    deadlineType,
}: DeadlineSectionProps) {
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
                                {product.merchant ?? "Merchant not set"} ·{" "}
                                {formatDeadlineDate(dateValue)}
                            </Text>

                            <Text style={styles.remainingTimeText}>
                                {formatRemainingTime(daysRemaining)}
                            </Text>

                            <View style={styles.cardFooter}>
                                <View style={styles.sourceBadge}>
                                    <Text style={styles.sourceBadgeText}>
                                        {getProductSourceLabel(product.source)}
                                    </Text>
                                </View>

                                <DeadlineStatusPill status={status} />
                            </View>
                        </Pressable>
                    );
                })
            )}
        </View>
    );
}

const styles = StyleSheet.create({
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
    remainingTimeText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#0F172A",
        marginBottom: 10,
    },
    cardFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
    },
    sourceBadge: {
        backgroundColor: "#DBEAFE",
        borderRadius: 999,
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    sourceBadgeText: {
        fontSize: 12,
        fontWeight: "800",
        color: "#1D4ED8",
    },
});