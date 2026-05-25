import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ReceiptExtractionResponse } from "./types";

type ReceiptLineItem = ReceiptExtractionResponse["line_items"][number];

type ReceiptExtractionSummaryCardProps = {
    result: ReceiptExtractionResponse;
    savedReceiptItems: string[];
    onSelectLineItem: (
        itemName: string,
        itemPriceCents: number | null
    ) => void;
};

export function ReceiptExtractionSummaryCard({
    result,
    savedReceiptItems,
    onSelectLineItem,
}: ReceiptExtractionSummaryCardProps) {
    return (
        <View style={styles.summaryCard}>
            <Text style={styles.summaryEyebrow}>
                AI Extraction Complete
            </Text>

            <Text style={styles.summaryTitle}>
                {result.suggestion.name}
            </Text>

            <Text style={styles.summaryText}>
                Merchant: {result.suggestion.merchant ?? "Unknown"}
            </Text>

            <Text style={styles.summaryText}>
                Estimated Price:{" "}
                {result.suggestion.price_cents
                    ? `$${(result.suggestion.price_cents / 100).toFixed(2)}`
                    : "Unknown"}
            </Text>

            <Text style={styles.summaryText}>
                Confidence: {(result.confidence * 100).toFixed(0)}%
            </Text>

            {result.line_items.length > 0 ? (
                <DetectedLineItemsList
                    lineItems={result.line_items}
                    savedReceiptItems={savedReceiptItems}
                    onSelectLineItem={onSelectLineItem}
                />
            ) : null}
        </View>
    );
}

function DetectedLineItemsList({
    lineItems,
    savedReceiptItems,
    onSelectLineItem,
}: {
    lineItems: ReceiptLineItem[];
    savedReceiptItems: string[];
    onSelectLineItem: (
        itemName: string,
        itemPriceCents: number | null
    ) => void;
}) {
    return (
        <View style={styles.lineItemsSection}>
            <Text style={styles.lineItemsTitle}>
                Detected receipt items
            </Text>

            <Text style={styles.lineItemsHint}>
                Tap an item to load it into the editable review form.
            </Text>

            {lineItems.map((item, index) => {
                const isAlreadySaved = savedReceiptItems.includes(item.name);

                return (
                    <Pressable
                        key={`${item.name}-${index}`}
                        style={[
                            styles.lineItemRow,
                            isAlreadySaved && styles.savedLineItemRow,
                        ]}
                        disabled={isAlreadySaved}
                        onPress={() =>
                            onSelectLineItem(item.name, item.price_cents)
                        }
                    >
                        <Text style={styles.lineItemName}>
                            {item.name}
                        </Text>

                        {isAlreadySaved ? (
                            <Text style={styles.savedLineItemText}>
                                Saved
                            </Text>
                        ) : null}

                        <Text style={styles.lineItemPrice}>
                            {item.price_cents !== null
                                ? `$${(item.price_cents / 100).toFixed(2)}`
                                : "--"}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    summaryCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#BFDBFE",
    },
    summaryEyebrow: {
        fontSize: 13,
        fontWeight: "800",
        color: "#2563EB",
        marginBottom: 8,
        textTransform: "uppercase",
    },
    summaryTitle: {
        fontSize: 24,
        lineHeight: 30,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 12,
    },
    summaryText: {
        fontSize: 15,
        lineHeight: 22,
        color: "#475569",
        marginBottom: 6,
    },
    lineItemsSection: {
        marginTop: 18,
        paddingTop: 18,
        borderTopWidth: 1,
        borderTopColor: "#DBEAFE",
    },
    lineItemsTitle: {
        fontSize: 14,
        fontWeight: "800",
        color: "#1E3A8A",
        marginBottom: 12,
        textTransform: "uppercase",
    },
    lineItemsHint: {
        fontSize: 13,
        lineHeight: 18,
        color: "#64748B",
        marginBottom: 12,
    },
    lineItemRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    lineItemName: {
        flex: 1,
        fontSize: 15,
        color: "#0F172A",
        marginRight: 12,
    },
    lineItemPrice: {
        fontSize: 15,
        fontWeight: "700",
        color: "#1D4ED8",
    },
    savedLineItemRow: {
        opacity: 0.45,
    },
    savedLineItemText: {
        fontSize: 12,
        fontWeight: "800",
        color: "#166534",
        marginRight: 10,
    },
});