import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { ReceiptExtractionResponse } from "./types";

type ReceiptLineItem = ReceiptExtractionResponse["line_items"][number];

type ReceiptExtractionSummaryCardProps = {
    result: ReceiptExtractionResponse;
    savedReceiptItems: string[];
    skippedReceiptItems: string[];
    activeItemName: string;
    onSelectLineItem: (
        itemName: string,
        itemPriceCents: number | null
    ) => void;
    onAddLineItem: (
        itemName: string,
        itemPriceCents: number | null
    ) => void;
};

export function ReceiptExtractionSummaryCard({
    result,
    savedReceiptItems,
    skippedReceiptItems,
    activeItemName,
    onSelectLineItem,
    onAddLineItem,
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
                    skippedReceiptItems={skippedReceiptItems}
                    activeItemName={activeItemName}
                    onSelectLineItem={onSelectLineItem}
                    onAddLineItem={onAddLineItem}
                />
            ) : null}
        </View>
    );
}

function DetectedLineItemsList({
    lineItems,
    savedReceiptItems,
    skippedReceiptItems,
    activeItemName,
    onSelectLineItem,
    onAddLineItem,
}: {
    lineItems: ReceiptLineItem[];
    savedReceiptItems: string[];
    skippedReceiptItems: string[];
    activeItemName: string;
    onSelectLineItem: (
        itemName: string,
        itemPriceCents: number | null
    ) => void;
    onAddLineItem: (
        itemName: string,
        itemPriceCents: number | null
    ) => void;
}) {
    const [customItemName, setCustomItemName] = useState("");
    const [customItemPrice, setCustomItemPrice] = useState("");
    const [customItemError, setCustomItemError] = useState<string | null>(null);

    const handleAddCustomItem = () => {
        const trimmedName = customItemName.trim();

        if (!trimmedName) {
            setCustomItemError("Enter an item name.");
            return;
        }

        if (lineItems.some((item) => item.name === trimmedName)) {
            setCustomItemError("That item is already in the receipt list.");
            return;
        }

        const priceCents = parseCustomPriceToCents(customItemPrice);

        if (customItemPrice.trim() && priceCents === null) {
            setCustomItemError("Enter a valid price, like 19.99.");
            return;
        }

        onAddLineItem(trimmedName, priceCents);

        setCustomItemName("");
        setCustomItemPrice("");
        setCustomItemError(null);
    };
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
                const isSkipped = skippedReceiptItems.includes(item.name);
                const isActiveItem =
                    item.name === activeItemName && !isAlreadySaved && !isSkipped;
                const isReviewed = isAlreadySaved || isSkipped;

                return (
                    <Pressable
                        key={`${item.name}-${index}`}
                        style={[
                            styles.lineItemRow,
                            isActiveItem && styles.activeLineItemRow,
                            isReviewed && styles.reviewedLineItemRow,
                        ]}
                        disabled={isReviewed}
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

                        {isSkipped ? (
                            <Text style={styles.skippedLineItemText}>
                                Skipped
                            </Text>
                        ) : null}

                        {isActiveItem ? (
                            <Text style={styles.activeLineItemText}>
                                Reviewing
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
            <View style={styles.customItemCard}>
                <Text style={styles.customItemTitle}>
                    Missing an item?
                </Text>

                <TextInput
                    value={customItemName}
                    onChangeText={setCustomItemName}
                    placeholder="Item name"
                    autoCapitalize="words"
                    style={styles.customItemInput}
                />

                <TextInput
                    value={customItemPrice}
                    onChangeText={setCustomItemPrice}
                    placeholder="Optional price, like 19.99"
                    keyboardType="decimal-pad"
                    style={styles.customItemInput}
                />

                {customItemError ? (
                    <Text style={styles.customItemError}>
                        {customItemError}
                    </Text>
                ) : null}

                <Pressable
                    style={styles.addCustomItemButton}
                    onPress={handleAddCustomItem}
                >
                    <Text style={styles.addCustomItemButtonText}>
                        Add Missing Item
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}

function parseCustomPriceToCents(priceValue: string): number | null {
    const trimmedPrice = priceValue.trim();

    if (!trimmedPrice) {
        return null;
    }

    if (!/^\d+(\.\d{1,2})?$/.test(trimmedPrice)) {
        return null;
    }

    return Math.round(Number(trimmedPrice) * 100);
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
    reviewedLineItemRow: {
        opacity: 0.45,
    },
    savedLineItemText: {
        fontSize: 12,
        fontWeight: "800",
        color: "#166534",
        marginRight: 10,
    },
    activeLineItemRow: {
        backgroundColor: "#EFF6FF",
        borderWidth: 1,
        borderColor: "#93C5FD",
    },
    activeLineItemText: {
        fontSize: 12,
        fontWeight: "800",
        color: "#1D4ED8",
        marginRight: 10,
    },
    skippedLineItemText: {
        fontSize: 12,
        fontWeight: "800",
        color: "#64748B",
        marginRight: 10,
    },
    customItemCard: {
        backgroundColor: "#F8FAFC",
        borderRadius: 16,
        padding: 14,
        marginTop: 8,
        borderWidth: 1,
        borderColor: "#CBD5E1",
    },
    customItemTitle: {
        fontSize: 14,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 10,
    },
    customItemInput: {
        borderWidth: 1,
        borderColor: "#CBD5E1",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: "#0F172A",
        backgroundColor: "#FFFFFF",
        marginBottom: 10,
    },
    customItemError: {
        color: "#B91C1C",
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 10,
    },
    addCustomItemButton: {
        backgroundColor: "#2563EB",
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: "center",
    },
    addCustomItemButtonText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "800",
    },
});