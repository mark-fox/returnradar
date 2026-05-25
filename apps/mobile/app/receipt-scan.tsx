import { Stack, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useState, useEffect } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";

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
import { ProductFormInput } from "@/src/features/products/ProductFormFields";

const SAMPLE_RECEIPT_TEXT =
    "BEST BUY\nSony WH-1000XM5 Headphones\nSubtotal 399.99\nTax 31.20\nTotal 431.19\nVISA";

const RECEIPT_SESSION_STORAGE_KEY =
    "returnradar-active-receipt-session";

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

    const [receiptImagePath, setReceiptImagePath] = useState("");
    const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
    const [savedReceiptItems, setSavedReceiptItems] = useState<string[]>([]);
    const savedReceiptItemCount = savedReceiptItems.length;
    const [warrantyProvider, setWarrantyProvider] = useState("");

    const [restoredSessionNoticeVisible, setRestoredSessionNoticeVisible] =
        useState(false);

    useEffect(() => {
        const restoreReceiptSession = async () => {
            try {
                const storedSession =
                    await AsyncStorage.getItem(
                        RECEIPT_SESSION_STORAGE_KEY,
                    );

                if (!storedSession) {
                    return;
                }

                const parsed = JSON.parse(storedSession);

                setResult(parsed.result ?? null);

                setSuggestedName(parsed.suggestedName ?? "");
                setSuggestedMerchant(parsed.suggestedMerchant ?? "");
                setSuggestedPrice(parsed.suggestedPrice ?? "");
                setSuggestedPurchaseDate(
                    parsed.suggestedPurchaseDate ?? "",
                );
                setSuggestedReturnDeadline(
                    parsed.suggestedReturnDeadline ?? "",
                );
                setSuggestedWarrantyDeadline(
                    parsed.suggestedWarrantyDeadline ?? "",
                );
                setSuggestedNotes(parsed.suggestedNotes ?? "");

                setSelectedImageUri(
                    parsed.selectedImageUri ?? null,
                );

                setUploadedImageInfo(
                    parsed.uploadedImageInfo ?? null,
                );

                setReceiptImagePath(
                    parsed.receiptImagePath ?? "",
                );

                setSavedReceiptItems(
                    parsed.savedReceiptItems ?? [],
                );

                setRestoredSessionNoticeVisible(true);
            } catch (error) {
                console.warn(
                    "Failed to restore receipt session",
                    error,
                );
            }
        };

        void restoreReceiptSession();
    }, []);

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
            exif: false,
            base64: false,
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
        setUploadedImageInfo(null);
        setImageUploadStatus(null);
        setValidationMessage(null);
        setErrorMessage(null);

        try {
            setImageUploadStatus("Uploading receipt image...");

            const uploadResult = await uploadReceiptImage(imageUri);

            setImageUploadStatus("Analyzing receipt with AI...");

            setResult(uploadResult);

            const imagePathWarning = uploadResult.warnings.find(
                (warning) => warning.startsWith("receipt_image_path:")
            );

            if (imagePathWarning) {
                setReceiptImagePath(
                    imagePathWarning.replace("receipt_image_path:", "")
                );
            }

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
            setWarrantyProvider(
                uploadResult.suggestion.warranty_provider ?? ""
            );
            setSuggestedNotes(uploadResult.suggestion.notes ?? "");

            setImageUploadStatus(null);
            setUploadedImageInfo(
                `${uploadResult.suggestion.name} extracted successfully`
            );
            await persistReceiptSession();
        } catch (error) {
            console.warn(error);

            setImageUploadStatus(null);
            setValidationMessage(
                "Receipt image upload failed. Try selecting the image again or choose a different photo."
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
            exif: false,
            base64: false,
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
        setUploadedImageInfo(null);
        setImageUploadStatus(null);
        setValidationMessage(null);
        setErrorMessage(null);

        try {
            setImageUploadStatus("Uploading receipt image...");

            const uploadResult = await uploadReceiptImage(imageUri);

            setImageUploadStatus("Analyzing receipt with AI...");

            setResult(uploadResult);

            const imagePathWarning = uploadResult.warnings.find(
                (warning) => warning.startsWith("receipt_image_path:")
            );

            if (imagePathWarning) {
                setReceiptImagePath(
                    imagePathWarning.replace("receipt_image_path:", "")
                );
            }

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
            setWarrantyProvider(
                uploadResult.suggestion.warranty_provider ?? ""
            );
            setSuggestedNotes(uploadResult.suggestion.notes ?? "");

            setImageUploadStatus(null);
            setUploadedImageInfo(
                `${uploadResult.suggestion.name} extracted successfully`
            );
            await persistReceiptSession();
        } catch (error) {
            console.warn(error);

            setImageUploadStatus(null);
            setValidationMessage(
                "Receipt image upload failed. Try selecting the image again or choose a different photo."
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

        setSaveSuccessMessage(null);
        setErrorMessage(null);
    };

    const persistReceiptSession = async () => {
        if (!result) {
            return;
        }

        try {
            await AsyncStorage.setItem(
                RECEIPT_SESSION_STORAGE_KEY,
                JSON.stringify({
                    result,
                    suggestedName,
                    suggestedMerchant,
                    suggestedPrice,
                    suggestedPurchaseDate,
                    suggestedReturnDeadline,
                    suggestedWarrantyDeadline,
                    suggestedNotes,
                    selectedImageUri,
                    uploadedImageInfo,
                    receiptImagePath,
                    savedReceiptItems,
                }),
            );
        } catch (error) {
            console.warn("Failed to persist receipt session", error);
        }
    };

    const resetReceiptSession = () => {
        setSaveSuccessMessage(
            "Receipt session completed. Ready for a new receipt."
        );

        setRawText("");

        setResult(null);

        setSuggestedName("");
        setSuggestedMerchant("");
        setSuggestedPrice("");
        setSuggestedPurchaseDate("");
        setSuggestedReturnDeadline("");
        setSuggestedWarrantyDeadline("");
        setSuggestedNotes("");

        setSelectedImageUri(null);
        setUploadedImageInfo(null);
        setImageUploadStatus(null);
        setReceiptImagePath("");

        void AsyncStorage.removeItem(
            RECEIPT_SESSION_STORAGE_KEY,
        );

        setValidationMessage(null);
        setErrorMessage(null);
        setSavedReceiptItems([]);
        setRestoredSessionNoticeVisible(false);
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
            console.warn(error);
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
                warranty_provider:
                    warrantyProvider.trim() || null,
                price_cents: priceCents,
                currency: result?.suggestion.currency ?? "USD",
                notes: suggestedNotes.trim() || null,
                source: "receipt_ai",
                ai_provider: result?.source ?? null,
                ai_confidence: result
                    ? Math.round(result.confidence * 100)
                    : null,
                receipt_image_path: receiptImagePath,
            });

            setSavedReceiptItems((current) => [
                ...current,
                trimmedName,
            ]);
            setSaveSuccessMessage(`${trimmedName} was saved. You can select another receipt item or start a new receipt.`);
            setErrorMessage(null);
        } catch (error) {
            console.warn(error);

            const message = error instanceof Error ? error.message : "";

            if (message.includes("409")) {
                setErrorMessage(
                    "This product already exists. Try selecting a different receipt item or editing the product details before saving."
                );
            } else {
                setErrorMessage(
                    "Could not save the suggested product. Please review the details and try again."
                );
            }
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

                                    {result.line_items.map((item, index) => {
                                        const isAlreadySaved =
                                            savedReceiptItems.includes(item.name);

                                        return (
                                            <Pressable
                                                key={`${item.name}-${index}`}
                                                style={[
                                                    styles.lineItemRow,
                                                    isAlreadySaved && styles.savedLineItemRow,
                                                ]}
                                                disabled={isAlreadySaved}
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
                            ) : null}
                        </View>
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
                                onChangeText={setSuggestedName}
                                placeholder="Product name"
                                autoCapitalize="words"
                            />

                            <ProductFormInput
                                label="Merchant"
                                value={suggestedMerchant}
                                onChangeText={setSuggestedMerchant}
                                placeholder="Merchant"
                                autoCapitalize="words"
                            />

                            <ProductFormInput
                                label="Price"
                                value={suggestedPrice}
                                onChangeText={setSuggestedPrice}
                                placeholder="399.99"
                                keyboardType="decimal-pad"
                            />

                            <ProductFormInput
                                label="Purchase date"
                                value={suggestedPurchaseDate}
                                onChangeText={setSuggestedPurchaseDate}
                                placeholder="2026-04-28"
                                keyboardType="numbers-and-punctuation"
                            />

                            <ProductFormInput
                                label="Return deadline"
                                value={suggestedReturnDeadline}
                                onChangeText={setSuggestedReturnDeadline}
                                placeholder="2026-05-28"
                                keyboardType="numbers-and-punctuation"
                            />

                            <ProductFormInput
                                label="Warranty deadline"
                                value={suggestedWarrantyDeadline}
                                onChangeText={setSuggestedWarrantyDeadline}
                                placeholder="2027-04-28"
                                keyboardType="numbers-and-punctuation"
                            />

                            <ProductFormInput
                                label="Warranty provider"
                                value={warrantyProvider}
                                onChangeText={setWarrantyProvider}
                                placeholder="Geek Squad"
                                autoCapitalize="words"
                            />

                            <ProductFormInput
                                label="Notes"
                                value={suggestedNotes}
                                onChangeText={setSuggestedNotes}
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

                                    <Pressable
                                        onPress={() =>
                                            setRestoredSessionNoticeVisible(false)
                                        }
                                    >
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
                                onPress={() => void handleSaveSuggestion()}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Save Confirmed Product</Text>
                                )}
                            </Pressable>
                            <Pressable
                                style={styles.finishSessionButton}
                                onPress={resetReceiptSession}
                            >
                                <Text style={styles.finishSessionButtonText}>
                                    Finish Receipt Session
                                </Text>
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
    successText: {
        color: "#166534",
        fontSize: 14,
        lineHeight: 20,
        fontWeight: "700",
        marginBottom: 12,
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
});