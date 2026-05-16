import { Stack, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import {
    centsToPriceInput,
    isValidDateString,
    normalizeOptionalDate,
    parsePriceToCents,
} from "@/src/features/products/formUtils";

import { createProduct } from "@/src/features/products/api";
import { extractReceipt } from "@/src/features/receiptExtraction/api";
import {
    uploadReceiptImage,
} from "@/src/features/ai/api";
import type { ReceiptExtractionResponse } from "@/src/features/receiptExtraction/types";

const SAMPLE_RECEIPT_TEXT =
    "BEST BUY\nSony WH-1000XM5 Headphones\nSubtotal 399.99\nTax 31.20\nTotal 431.19\nVISA";


export default function ReceiptScanScreen() {
    const [rawText, setRawText] = useState("");
    const [result, setResult] = useState<ReceiptExtractionResponse | null>(null);

    const [suggestedName, setSuggestedName] = useState("");
    const [suggestedMerchant, setSuggestedMerchant] = useState("");
    const [suggestedPrice, setSuggestedPrice] = useState("");
    const [suggestedPurchaseDate, setSuggestedPurchaseDate] = useState("");
    const [suggestedReturnDeadline, setSuggestedReturnDeadline] = useState("");
    const [suggestedWarrantyDeadline, setSuggestedWarrantyDeadline] = useState("");
    const [suggestedNotes, setSuggestedNotes] = useState("");

    const [validationMessage, setValidationMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
    const [uploadedImageInfo, setUploadedImageInfo] = useState<string | null>(null);
    const [imageUploadStatus, setImageUploadStatus] = useState<string | null>(null);

    const handleSelectReceiptImage = async () => {
        const permissionResult =
            await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            setValidationMessage("Photo library access is needed to select a receipt image.");
            return;
        }

        const pickerResult = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: false,
            quality: 0.8,
        });

        if (pickerResult.canceled) {
            return;
        }

        const imageUri = pickerResult.assets[0]?.uri;

        if (!imageUri) {
            setValidationMessage("Could not read the selected image.");
            return;
        }

        setSelectedImageUri(imageUri);
        setValidationMessage(null);

        try {
            setImageUploadStatus("Uploading receipt image...");

            const uploadResult = await uploadReceiptImage(imageUri);

            setImageUploadStatus("Analyzing receipt with AI...");

            setResult(uploadResult);

            setSuggestedName(uploadResult.suggestion.name);
            setSuggestedMerchant(uploadResult.suggestion.merchant ?? "");
            setSuggestedPrice(
                uploadResult.suggestion.price_cents === null
                    ? ""
                    : (uploadResult.suggestion.price_cents / 100).toFixed(2)
            );
            setSuggestedPurchaseDate(uploadResult.suggestion.purchase_date ?? "");
            setSuggestedReturnDeadline(uploadResult.suggestion.return_deadline ?? "");
            setSuggestedWarrantyDeadline(uploadResult.suggestion.warranty_deadline ?? "");
            setSuggestedNotes(uploadResult.suggestion.notes ?? "");

            setImageUploadStatus(null);
            setUploadedImageInfo(
                `${uploadResult.suggestion.name} extracted successfully`
            );
        } catch (error) {
            console.error(error);

            setImageUploadStatus(null);
            setValidationMessage(
                "Receipt image upload failed."
            );
        }
    };

    const handleCaptureReceiptImage = async () => {
        const permissionResult =
            await ImagePicker.requestCameraPermissionsAsync();

        if (!permissionResult.granted) {
            setValidationMessage(
                "Camera access is needed to capture receipt images."
            );

            return;
        }

        const cameraResult = await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 0.8,
        });

        if (cameraResult.canceled) {
            return;
        }

        const imageUri = cameraResult.assets[0]?.uri;

        if (!imageUri) {
            setValidationMessage("Could not read the captured image.");

            return;
        }

        setSelectedImageUri(imageUri);
        setValidationMessage(null);

        try {
            setImageUploadStatus("Uploading receipt image...");

            const uploadResult = await uploadReceiptImage(imageUri);

            setImageUploadStatus("Analyzing receipt with AI...");

            setResult(uploadResult);

            setSuggestedName(uploadResult.suggestion.name);
            setSuggestedMerchant(uploadResult.suggestion.merchant ?? "");
            setSuggestedPrice(
                uploadResult.suggestion.price_cents === null
                    ? ""
                    : (uploadResult.suggestion.price_cents / 100).toFixed(2)
            );
            setSuggestedPurchaseDate(uploadResult.suggestion.purchase_date ?? "");
            setSuggestedReturnDeadline(uploadResult.suggestion.return_deadline ?? "");
            setSuggestedWarrantyDeadline(uploadResult.suggestion.warranty_deadline ?? "");
            setSuggestedNotes(uploadResult.suggestion.notes ?? "");

            setImageUploadStatus(null);
            setUploadedImageInfo(
                `${uploadResult.suggestion.name} extracted successfully`
            );
        } catch (error) {
            console.error(error);

            setImageUploadStatus(null);
            setValidationMessage(
                "Receipt image upload failed."
            );
        }
    };

    const handleSelectLineItem = (
        itemName: string,
        itemPriceCents: number | null,
    ) => {
        setSuggestedName(itemName);

        setSuggestedPrice(
            itemPriceCents === null
                ? ""
                : (itemPriceCents / 100).toFixed(2)
        );
    };

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

            setSuggestedName(extractionResult.suggestion.name);
            setSuggestedMerchant(extractionResult.suggestion.merchant ?? "");
            setSuggestedPrice(centsToPriceInput(extractionResult.suggestion.price_cents));
            setSuggestedPurchaseDate(extractionResult.suggestion.purchase_date ?? "");
            setSuggestedReturnDeadline(extractionResult.suggestion.return_deadline ?? "");
            setSuggestedWarrantyDeadline(
                extractionResult.suggestion.warranty_deadline ?? ""
            );
            setSuggestedNotes(extractionResult.suggestion.notes ?? "");
        } catch (error) {
            console.error(error);
            setErrorMessage(
                "Could not extract receipt details. Make sure the API is running and try again."
            );
        } finally {
            setIsExtracting(false);
        }
    };

    const handleSaveSuggestion = async () => {
        const trimmedName = suggestedName.trim();

        if (!trimmedName) {
            setValidationMessage("Product name is required before saving.");
            return;
        }

        const priceCents = parsePriceToCents(suggestedPrice);

        if (suggestedPrice.trim() && priceCents === null) {
            setValidationMessage("Enter a valid price, like 19.99.");
            return;
        }

        const dateFields = [
            { label: "purchase date", value: suggestedPurchaseDate },
            { label: "return deadline", value: suggestedReturnDeadline },
            { label: "warranty deadline", value: suggestedWarrantyDeadline },
        ];

        const invalidDateField = dateFields.find(
            (field) => !isValidDateString(field.value)
        );

        if (invalidDateField) {
            setValidationMessage(
                `Enter a valid ${invalidDateField.label} using YYYY-MM-DD.`
            );
            return;
        }

        try {
            setIsSaving(true);
            setValidationMessage(null);
            setErrorMessage(null);

            const savedProduct = await createProduct({
                name: trimmedName,
                merchant: suggestedMerchant.trim() || null,
                purchase_date: normalizeOptionalDate(suggestedPurchaseDate),
                return_deadline: normalizeOptionalDate(suggestedReturnDeadline),
                warranty_deadline: normalizeOptionalDate(suggestedWarrantyDeadline),
                price_cents: priceCents,
                currency: result?.suggestion.currency ?? "USD",
                notes: suggestedNotes.trim() || null,
                source: "receipt_ai",
            });

            router.replace(`/products/${savedProduct.id}`);
        } catch (error) {
            console.error(error);
            setErrorMessage(
                "Could not save the suggested product. Please review the details and try again."
            );
        } finally {
            setIsSaving(false);
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
                <Text style={styles.title}>Scan a receipt</Text>
                <Text style={styles.description}>
                    Take a photo or select a receipt image. ReturnRadar will use AI to suggest
                    product details for you to review before saving.
                </Text>

                <View style={styles.formCard}>
                    <Text style={styles.label}>Receipt photo</Text>

                    <Pressable
                        style={styles.primaryButton}
                        onPress={() => void handleCaptureReceiptImage()}
                    >
                        <Text style={styles.primaryButtonText}>
                            Capture Receipt Photo
                        </Text>
                    </Pressable>

                    <Pressable
                        style={styles.secondaryButton}
                        onPress={() => void handleSelectReceiptImage()}
                    >
                        <Text style={styles.secondaryButtonText}>
                            Select Receipt Image
                        </Text>
                    </Pressable>

                    {selectedImageUri ? (
                        <>
                            <Image
                                source={{ uri: selectedImageUri }}
                                style={styles.receiptImagePreview}
                                resizeMode="cover"
                            />

                            {imageUploadStatus ? (
                                <Text style={styles.uploadStatusText}>
                                    {imageUploadStatus}
                                </Text>
                            ) : null}

                            {uploadedImageInfo ? (
                                <Text style={styles.uploadSuccessText}>
                                    Uploaded: {uploadedImageInfo}
                                </Text>
                            ) : null}
                        </>
                    ) : (
                        <Text style={styles.helperText}>
                            Image selection is ready. OCR/vision extraction will be connected next.
                        </Text>
                    )}

                    <Text style={styles.fallbackLabel}>Fallback: paste receipt text</Text>
                    <TextInput
                        value={rawText}
                        onChangeText={setRawText}
                        placeholder="Optional fallback for testing or copied receipt text..."
                        multiline
                        textAlignVertical="top"
                        style={[styles.input, styles.receiptInput]}
                    />

                    <Pressable
                        style={[styles.primaryButton, isExtracting && styles.disabledButton]}
                        onPress={() => void handleExtract()}
                        disabled={isExtracting}
                    >
                        {isExtracting ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.primaryButtonText}>Extract From Text</Text>
                        )}
                    </Pressable>
                </View>

                {result ? (
                    <>
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
                                <View style={styles.lineItemsSection}>
                                    <Text style={styles.lineItemsTitle}>
                                        Detected receipt items
                                    </Text>
                                    <Text style={styles.lineItemsHint}>
                                        Tap an item to load it into the editable review form.
                                    </Text>

                                    {result.line_items.map((item, index) => (
                                        <Pressable
                                            key={`${item.name}-${index}`}
                                            style={styles.lineItemRow}
                                            onPress={() =>
                                                handleSelectLineItem(
                                                    item.name,
                                                    item.price_cents,
                                                )
                                            }
                                        >
                                            <Text style={styles.lineItemName}>
                                                {item.name}
                                            </Text>

                                            <Text style={styles.lineItemPrice}>
                                                {item.price_cents !== null
                                                    ? `$${(item.price_cents / 100).toFixed(2)}`
                                                    : "--"}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            ) : null}
                        </View>
                        <View style={styles.resultCard}>
                            <Text style={styles.resultEyebrow}>
                                Source: {result.source} · Confidence:{" "}
                                {Math.round(result.confidence * 100)}%
                            </Text>

                            <Text style={styles.resultTitle}>Review suggested details</Text>

                            <FieldLabel label="Product name" required />
                            <TextInput
                                value={suggestedName}
                                onChangeText={setSuggestedName}
                                placeholder="Product name"
                                autoCapitalize="words"
                                style={styles.input}
                            />

                            <FieldLabel label="Merchant" />
                            <TextInput
                                value={suggestedMerchant}
                                onChangeText={setSuggestedMerchant}
                                placeholder="Merchant"
                                autoCapitalize="words"
                                style={styles.input}
                            />

                            <FieldLabel label="Price" />
                            <TextInput
                                value={suggestedPrice}
                                onChangeText={setSuggestedPrice}
                                placeholder="399.99"
                                keyboardType="decimal-pad"
                                style={styles.input}
                            />

                            <FieldLabel label="Purchase date" />
                            <TextInput
                                value={suggestedPurchaseDate}
                                onChangeText={setSuggestedPurchaseDate}
                                placeholder="2026-04-28"
                                keyboardType="numbers-and-punctuation"
                                style={styles.input}
                            />

                            <FieldLabel label="Return deadline" />
                            <TextInput
                                value={suggestedReturnDeadline}
                                onChangeText={setSuggestedReturnDeadline}
                                placeholder="2026-05-28"
                                keyboardType="numbers-and-punctuation"
                                style={styles.input}
                            />

                            <FieldLabel label="Warranty deadline" />
                            <TextInput
                                value={suggestedWarrantyDeadline}
                                onChangeText={setSuggestedWarrantyDeadline}
                                placeholder="2027-04-28"
                                keyboardType="numbers-and-punctuation"
                                style={styles.input}
                            />

                            <FieldLabel label="Notes" />
                            <TextInput
                                value={suggestedNotes}
                                onChangeText={setSuggestedNotes}
                                placeholder="Notes"
                                multiline
                                textAlignVertical="top"
                                style={[styles.input, styles.notesInput]}
                            />

                            {validationMessage ? (
                                <Text style={styles.validationText}>{validationMessage}</Text>
                            ) : null}

                            {errorMessage ? (
                                <Text style={styles.errorText}>{errorMessage}</Text>
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
                                onPress={() => void handleSaveSuggestion()}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Save Confirmed Product</Text>
                                )}
                            </Pressable>
                        </View>
                    </>
                ) : null}

                {!result && validationMessage ? (
                    <Text style={styles.validationText}>{validationMessage}</Text>
                ) : null}

                {!result && errorMessage ? (
                    <Text style={styles.errorText}>{errorMessage}</Text>
                ) : null}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

function FieldLabel({ label, required = false }: { label: string; required?: boolean }) {
    return (
        <Text style={styles.label}>
            {label}
            {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
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
    required: {
        color: "#DC2626",
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
    notesInput: {
        minHeight: 110,
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
    primaryButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "800",
    },
    disabledButton: {
        opacity: 0.7,
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
        marginBottom: 16,
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
    secondaryButton: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#CBD5E1",
        marginBottom: 14,
    },
    secondaryButtonText: {
        color: "#0F172A",
        fontSize: 16,
        fontWeight: "800",
    },
    receiptImagePreview: {
        width: "100%",
        height: 220,
        borderRadius: 16,
        marginBottom: 18,
        backgroundColor: "#E2E8F0",
    },
    helperText: {
        fontSize: 14,
        lineHeight: 20,
        color: "#64748B",
        marginBottom: 18,
    },
    uploadSuccessText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#166534",
        marginBottom: 18,
    },
    uploadStatusText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1D4ED8",
        marginBottom: 12,
    },
    fallbackLabel: {
        fontSize: 13,
        fontWeight: "800",
        color: "#64748B",
        marginTop: 18,
        marginBottom: 8,
        textTransform: "uppercase",
    },
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
    lineItemsHint: {
        fontSize: 13,
        lineHeight: 18,
        color: "#64748B",
        marginBottom: 12,
    },
});