import { Stack } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { extractReceipt } from "@/src/features/receiptExtraction/api";
import type { ReceiptExtractionResponse } from "@/src/features/receiptExtraction/types";

const SAMPLE_RECEIPT_TEXT =
    "BEST BUY\nSony WH-1000XM5 Headphones\nSubtotal 399.99\nTax 31.20\nTotal 431.19\nVISA";

function formatPrice(priceCents: number | null, currency: string): string {
    if (priceCents === null) {
        return "Not found";
    }

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
    }).format(priceCents / 100);
}

function formatDate(value: string | null): string {
    if (!value) {
        return "Not found";
    }

    return new Date(`${value}T00:00:00`).toLocaleDateString();
}

export default function ReceiptScanScreen() {
    const [rawText, setRawText] = useState(SAMPLE_RECEIPT_TEXT);
    const [result, setResult] = useState<ReceiptExtractionResponse | null>(null);
    const [validationMessage, setValidationMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);

    const handleExtract = async () => {
        const trimmedText = rawText.trim();

        if (!trimmedText) {
            setValidationMessage("Paste receipt text before extracting details.");
            return;
        }

        try {
            setIsExtracting(true);
            setValidationMessage(null);
            setErrorMessage(null);
            setResult(null);

            const extractionResult = await extractReceipt({
                raw_text: trimmedText,
            });

            setResult(extractionResult);
        } catch (error) {
            console.error(error);
            setErrorMessage(
                "Could not extract receipt details. Make sure the API is running and try again."
            );
        } finally {
            setIsExtracting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.select({ ios: "padding", android: undefined })}
        >
            <Stack.Screen options={{ title: "Scan Receipt" }} />

            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.eyebrow}>AI Receipt Extraction</Text>
                <Text style={styles.title}>Paste receipt text</Text>
                <Text style={styles.description}>
                    This is the first version of the receipt flow. The backend currently
                    returns mock AI-suggested details so we can build the app contract
                    before adding camera/OCR support.
                </Text>

                <View style={styles.formCard}>
                    <Text style={styles.label}>Receipt text</Text>
                    <TextInput
                        value={rawText}
                        onChangeText={setRawText}
                        placeholder="Paste receipt text here..."
                        multiline
                        textAlignVertical="top"
                        style={[styles.input, styles.receiptInput]}
                    />

                    {validationMessage ? (
                        <Text style={styles.validationText}>{validationMessage}</Text>
                    ) : null}

                    {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

                    <Pressable
                        style={[styles.primaryButton, isExtracting && styles.disabledButton]}
                        onPress={() => void handleExtract()}
                        disabled={isExtracting}
                    >
                        {isExtracting ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.primaryButtonText}>Extract Details</Text>
                        )}
                    </Pressable>
                </View>

                {result ? (
                    <View style={styles.resultCard}>
                        <Text style={styles.resultEyebrow}>
                            Source: {result.source} · Confidence:{" "}
                            {Math.round(result.confidence * 100)}%
                        </Text>

                        <Text style={styles.resultTitle}>Suggested product details</Text>

                        <SuggestionRow label="Name" value={result.suggestion.name} />
                        <SuggestionRow
                            label="Merchant"
                            value={result.suggestion.merchant ?? "Not found"}
                        />
                        <SuggestionRow
                            label="Price"
                            value={formatPrice(
                                result.suggestion.price_cents,
                                result.suggestion.currency
                            )}
                        />
                        <SuggestionRow
                            label="Purchase date"
                            value={formatDate(result.suggestion.purchase_date)}
                        />
                        <SuggestionRow
                            label="Return deadline"
                            value={formatDate(result.suggestion.return_deadline)}
                        />
                        <SuggestionRow
                            label="Warranty deadline"
                            value={formatDate(result.suggestion.warranty_deadline)}
                        />

                        <View style={styles.warningBox}>
                            <Text style={styles.warningTitle}>Before saving</Text>
                            {result.warnings.map((warning) => (
                                <Text key={warning} style={styles.warningText}>
                                    • {warning}
                                </Text>
                            ))}
                        </View>
                    </View>
                ) : null}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

function SuggestionRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.suggestionRow}>
            <Text style={styles.suggestionLabel}>{label}</Text>
            <Text style={styles.suggestionValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#F8FAFC",
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
    formCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        marginBottom: 18,
    },
    label: {
        fontSize: 14,
        fontWeight: "700",
        color: "#334155",
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: "#CBD5E1",
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        color: "#0F172A",
        backgroundColor: "#FFFFFF",
        marginBottom: 16,
    },
    receiptInput: {
        minHeight: 180,
    },
    validationText: {
        color: "#B45309",
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    errorText: {
        color: "#B91C1C",
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    primaryButton: {
        backgroundColor: "#2563EB",
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        alignItems: "center",
    },
    disabledButton: {
        opacity: 0.7,
    },
    primaryButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "800",
    },
    resultCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: "#BFDBFE",
        marginBottom: 30,
    },
    resultEyebrow: {
        fontSize: 13,
        fontWeight: "700",
        color: "#2563EB",
        marginBottom: 8,
    },
    resultTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 12,
    },
    suggestionRow: {
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: "#E2E8F0",
    },
    suggestionLabel: {
        fontSize: 13,
        fontWeight: "700",
        color: "#64748B",
        marginBottom: 4,
        textTransform: "uppercase",
    },
    suggestionValue: {
        fontSize: 16,
        color: "#0F172A",
    },
    warningBox: {
        backgroundColor: "#FFFBEB",
        borderRadius: 16,
        padding: 14,
        marginTop: 16,
        borderWidth: 1,
        borderColor: "#FDE68A",
    },
    warningTitle: {
        fontSize: 15,
        fontWeight: "800",
        color: "#92400E",
        marginBottom: 6,
    },
    warningText: {
        fontSize: 14,
        lineHeight: 20,
        color: "#92400E",
        marginBottom: 4,
    },
});