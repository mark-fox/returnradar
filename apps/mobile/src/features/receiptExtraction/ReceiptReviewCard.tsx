import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { ProductFormInput } from "@/src/features/products/ProductFormFields";
import type { ReceiptExtractionResponse } from "./types";

type ReceiptReviewCardProps = {
    result: ReceiptExtractionResponse;
    suggestedName: string;
    suggestedMerchant: string;
    suggestedPrice: string;
    suggestedPurchaseDate: string;
    suggestedReturnDeadline: string;
    suggestedWarrantyDeadline: string;
    warrantyProvider: string;
    warrantyClaimUrl: string;
    warrantyNotes: string;
    suggestedNotes: string;
    validationMessage: string | null;
    errorMessage: string | null;
    saveSuccessMessage: string | null;
    restoredSessionNoticeVisible: boolean;
    savedReceiptItems: string[];
    isSaving: boolean;
    onSuggestedNameChange: (value: string) => void;
    onSuggestedMerchantChange: (value: string) => void;
    onSuggestedPriceChange: (value: string) => void;
    onSuggestedPurchaseDateChange: (value: string) => void;
    onSuggestedReturnDeadlineChange: (value: string) => void;
    onSuggestedWarrantyDeadlineChange: (value: string) => void;
    onWarrantyProviderChange: (value: string) => void;
    onWarrantyClaimUrlChange: (value: string) => void;
    onWarrantyNotesChange: (value: string) => void;
    onSuggestedNotesChange: (value: string) => void;
    onDismissRestoredSessionNotice: () => void;
    onSaveSuggestion: () => void;
    onSkipCurrentLineItem: () => void;
    onFinishSession: () => void;
};

export function ReceiptReviewCard({
    result,
    suggestedName,
    suggestedMerchant,
    suggestedPrice,
    suggestedPurchaseDate,
    suggestedReturnDeadline,
    suggestedWarrantyDeadline,
    warrantyProvider,
    warrantyClaimUrl,
    warrantyNotes,
    suggestedNotes,
    validationMessage,
    errorMessage,
    saveSuccessMessage,
    restoredSessionNoticeVisible,
    savedReceiptItems,
    isSaving,
    onSuggestedNameChange,
    onSuggestedMerchantChange,
    onSuggestedPriceChange,
    onSuggestedPurchaseDateChange,
    onSuggestedReturnDeadlineChange,
    onSuggestedWarrantyDeadlineChange,
    onWarrantyProviderChange,
    onWarrantyClaimUrlChange,
    onWarrantyNotesChange,
    onSuggestedNotesChange,
    onDismissRestoredSessionNotice,
    onSaveSuggestion,
    onSkipCurrentLineItem,
    onFinishSession,
}: ReceiptReviewCardProps) {
    const savedReceiptItemCount = savedReceiptItems.length;

    return (
        <View style={styles.resultCard}>
            <Text style={styles.resultEyebrow}>
                Source: {result.source} · Confidence:{" "}
                {Math.round(result.confidence * 100)}%
            </Text>

            <Text style={styles.resultTitle}>Review suggested details</Text>

            <ProductFormInput
                label="Product name"
                required
                value={suggestedName}
                onChangeText={onSuggestedNameChange}
                placeholder="Product name"
                autoCapitalize="words"
            />

            <ProductFormInput
                label="Merchant"
                value={suggestedMerchant}
                onChangeText={onSuggestedMerchantChange}
                placeholder="Merchant"
                autoCapitalize="words"
            />

            <ProductFormInput
                label="Price"
                value={suggestedPrice}
                onChangeText={onSuggestedPriceChange}
                placeholder="399.99"
                keyboardType="decimal-pad"
            />

            <ProductFormInput
                label="Purchase date"
                value={suggestedPurchaseDate}
                onChangeText={onSuggestedPurchaseDateChange}
                placeholder="2026-04-28"
                keyboardType="numbers-and-punctuation"
            />

            <ProductFormInput
                label="Return deadline"
                value={suggestedReturnDeadline}
                onChangeText={onSuggestedReturnDeadlineChange}
                placeholder="2026-05-28"
                keyboardType="numbers-and-punctuation"
            />

            <ProductFormInput
                label="Warranty deadline"
                value={suggestedWarrantyDeadline}
                onChangeText={onSuggestedWarrantyDeadlineChange}
                placeholder="2027-04-28"
                keyboardType="numbers-and-punctuation"
            />

            <ProductFormInput
                label="Warranty provider"
                value={warrantyProvider}
                onChangeText={onWarrantyProviderChange}
                placeholder="Geek Squad"
                autoCapitalize="words"
            />

            <ProductFormInput
                label="Warranty claim URL"
                value={warrantyClaimUrl}
                onChangeText={onWarrantyClaimUrlChange}
                placeholder="https://..."
                autoCapitalize="none"
            />

            <ProductFormInput
                label="Warranty notes"
                value={warrantyNotes}
                onChangeText={onWarrantyNotesChange}
                placeholder="Claim instructions, serial number requirements, etc."
                multiline
            />

            <ProductFormInput
                label="Notes"
                value={suggestedNotes}
                onChangeText={onSuggestedNotesChange}
                placeholder="Notes"
                multiline
            />

            {validationMessage ? (
                <Text style={styles.validationText}>{validationMessage}</Text>
            ) : null}

            {errorMessage ? (
                <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            {restoredSessionNoticeVisible ? (
                <View style={styles.restoredSessionBanner}>
                    <Text style={styles.restoredSessionTitle}>
                        Recovered unfinished receipt session
                    </Text>

                    <Text style={styles.restoredSessionText}>
                        Your previous receipt scan was restored so you can continue saving items.
                    </Text>

                    <Pressable onPress={onDismissRestoredSessionNotice}>
                        <Text style={styles.dismissBannerText}>
                            Dismiss
                        </Text>
                    </Pressable>
                </View>
            ) : null}

            {savedReceiptItemCount > 0 ? (
                <View style={styles.sessionSummaryCard}>
                    <Text style={styles.sessionSummaryTitle}>
                        Receipt Session Progress
                    </Text>

                    <Text style={styles.sessionSummaryText}>
                        Saved {savedReceiptItemCount} item
                        {savedReceiptItemCount === 1 ? "" : "s"} from this receipt.
                    </Text>

                    <View style={styles.savedItemsList}>
                        {savedReceiptItems.map((itemName) => (
                            <View
                                key={itemName}
                                style={styles.savedItemChip}
                            >
                                <Text style={styles.savedItemChipText}>
                                    {itemName}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            ) : null}

            {saveSuccessMessage ? (
                <Text style={styles.successText}>{saveSuccessMessage}</Text>
            ) : null}

            <View style={styles.warningBox}>
                <Text style={styles.warningTitle}>Before saving</Text>

                {result.warnings.map((warning) => (
                    <Text key={warning} style={styles.warningText}>
                        • {warning}
                    </Text>
                ))}
            </View>

            <Pressable
                style={[styles.saveButton, isSaving && styles.disabledButton]}
                onPress={onSaveSuggestion}
                disabled={isSaving}
            >
                {isSaving ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text style={styles.saveButtonText}>
                        Save Confirmed Product
                    </Text>
                )}
            </Pressable>

            <Pressable
                style={styles.skipButton}
                onPress={onSkipCurrentLineItem}
                disabled={isSaving}
            >
                <Text style={styles.skipButtonText}>
                    Skip Current Item
                </Text>
            </Pressable>

            <Pressable
                style={styles.finishSessionButton}
                onPress={onFinishSession}
            >
                <Text style={styles.finishSessionButtonText}>
                    Finish Receipt Session
                </Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
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
        marginBottom: 16,
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
    warningBox: {
        backgroundColor: "#FFFBEB",
        borderRadius: 16,
        padding: 14,
        marginTop: 4,
        marginBottom: 16,
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
    saveButton: {
        backgroundColor: "#16A34A",
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        alignItems: "center",
    },
    saveButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "800",
    },
    disabledButton: {
        opacity: 0.7,
    },
    successText: {
        color: "#166534",
        fontSize: 14,
        lineHeight: 20,
        fontWeight: "700",
        marginBottom: 12,
    },
    sessionSummaryCard: {
        backgroundColor: "#F8FAFC",
        borderRadius: 18,
        padding: 18,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: "#CBD5E1",
    },
    sessionSummaryTitle: {
        fontSize: 15,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 8,
    },
    sessionSummaryText: {
        fontSize: 14,
        lineHeight: 20,
        color: "#475569",
        marginBottom: 12,
    },
    savedItemsList: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    savedItemChip: {
        backgroundColor: "#DBEAFE",
        borderRadius: 999,
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginRight: 8,
        marginBottom: 8,
    },
    savedItemChipText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#1D4ED8",
    },
    finishSessionButton: {
        backgroundColor: "#0F172A",
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: "center",
        marginTop: 10,
    },
    finishSessionButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800",
    },
    restoredSessionBanner: {
        backgroundColor: "#FEF3C7",
        borderRadius: 18,
        padding: 18,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: "#FCD34D",
    },
    restoredSessionTitle: {
        fontSize: 15,
        fontWeight: "800",
        color: "#92400E",
        marginBottom: 8,
    },
    restoredSessionText: {
        fontSize: 14,
        lineHeight: 20,
        color: "#78350F",
        marginBottom: 10,
    },
    dismissBannerText: {
        fontSize: 13,
        fontWeight: "800",
        color: "#B45309",
    },
    skipButton: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#CBD5E1",
        marginTop: 10,
    },
    skipButtonText: {
        color: "#0F172A",
        fontSize: 16,
        fontWeight: "800",
    },
});