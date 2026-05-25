import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { DeadlineStatusPill } from "./DeadlineStatusPill";
import { getReturnDeadlineStatus } from "./deadlineUtils";
import {
    formatProductDeadline,
    formatProductPrice,
    getProductUrgency,
    getProductUrgencyLabel,
} from "./productListUtils";
import { getProductSourceLabel } from "./sourceUtils";
import type { Product } from "./types";

type ProductCardProps = {
    product: Product;
    isSelected: boolean;
    selectionMode: boolean;
    onPress: () => void;
    onToggleSelected: () => void;
};

export function ProductCard({
    product,
    isSelected,
    selectionMode,
    onPress,
    onToggleSelected,
}: ProductCardProps) {
    const overallUrgency = getProductUrgency(product);

    const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(
        "/api/v1",
        ""
    );

    const receiptImageUri =
        product.receipt_image_path && apiBaseUrl
            ? `${apiBaseUrl}/${product.receipt_image_path}`
            : null;

    return (
        <Pressable
            style={[
                styles.productCard,
                overallUrgency === "soon" && styles.productCardSoon,
                overallUrgency === "urgent" && styles.productCardUrgent,
                overallUrgency === "expired" && styles.productCardExpired,
                isSelected && styles.selectedProductCard,
            ]}
            onPress={() => {
                if (selectionMode) {
                    onToggleSelected();
                    return;
                }

                onPress();
            }}
        >
            {receiptImageUri ? (
                <Image
                    source={{ uri: receiptImageUri }}
                    style={styles.receiptThumbnail}
                    resizeMode="cover"
                />
            ) : null}

            <View
                style={[
                    styles.urgencyBadge,
                    overallUrgency === "safe" && styles.urgencyBadgeSafe,
                    overallUrgency === "soon" && styles.urgencyBadgeSoon,
                    overallUrgency === "urgent" && styles.urgencyBadgeUrgent,
                    overallUrgency === "expired" && styles.urgencyBadgeExpired,
                ]}
            >
                <Text style={styles.urgencyBadgeText}>
                    {getProductUrgencyLabel(overallUrgency)}
                </Text>
            </View>

            <Text style={styles.productName}>{product.name}</Text>

            {product.receipt_image_path ? (
                <View style={styles.receiptBadge}>
                    <Text style={styles.receiptBadgeText}>Receipt Saved</Text>
                </View>
            ) : null}

            <Text style={styles.productMeta}>
                {product.merchant ?? "Merchant not set"} ·{" "}
                {formatProductPrice(product)}
            </Text>

            <Text style={styles.productSource}>
                {getProductSourceLabel(product.source)}
            </Text>

            <DeadlineStatusPill
                status={getReturnDeadlineStatus(product.return_deadline)}
            />

            <View style={styles.deadlineRow}>
                <Text style={styles.deadlineLabel}>Return</Text>
                <Text style={styles.deadlineValue}>
                    {formatProductDeadline(product.return_deadline)}
                </Text>
            </View>

            <View style={styles.deadlineRow}>
                <Text style={styles.deadlineLabel}>Warranty</Text>
                <Text style={styles.deadlineValue}>
                    {formatProductDeadline(product.warranty_deadline)}
                </Text>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    productCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 18,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "#E2E8F0",
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
    selectedProductCard: {
        borderWidth: 2,
        borderColor: "#2563EB",
    },
    receiptThumbnail: {
        width: "100%",
        height: 140,
        borderRadius: 16,
        backgroundColor: "#E2E8F0",
        marginBottom: 14,
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
    productName: {
        fontSize: 18,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 6,
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
    productMeta: {
        fontSize: 14,
        color: "#64748B",
        marginBottom: 16,
    },
    productSource: {
        fontSize: 13,
        fontWeight: "700",
        color: "#2563EB",
        marginBottom: 12,
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
});