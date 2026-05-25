import { Stack } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useState, useEffect } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
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
import { ReceiptInputCard } from "@/src/features/receiptExtraction/ReceiptInputCard";
import { ReceiptExtractionSummaryCard } from "@/src/features/receiptExtraction/ReceiptExtractionSummaryCard";
import { ReceiptReviewCard } from "@/src/features/receiptExtraction/ReceiptReviewCard";

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
                setWarrantyProvider(parsed.warrantyProvider ?? "");
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

    const handleAnalyzeReceiptImage = async (imageUri: string) => {
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

            const imagePathWarning = uploadResult.warnings.find((warning) =>
                warning.startsWith("receipt_image_path:")
            );

            const nextReceiptImagePath = imagePathWarning
                ? imagePathWarning.replace("receipt_image_path:", "")
                : "";

            const nextSuggestedName = uploadResult.suggestion.name;
            const nextSuggestedMerchant = uploadResult.suggestion.merchant ?? "";
            const nextSuggestedPrice =
                uploadResult.suggestion.price_cents === null
                    ? ""
                    : (uploadResult.suggestion.price_cents / 100).toFixed(2);
            const nextSuggestedPurchaseDate =
                uploadResult.suggestion.purchase_date ?? "";
            const nextSuggestedReturnDeadline =
                uploadResult.suggestion.return_deadline ?? "";
            const nextSuggestedWarrantyDeadline =
                uploadResult.suggestion.warranty_deadline ?? "";
            const nextWarrantyProvider =
                uploadResult.suggestion.warranty_provider ?? "";
            const nextSuggestedNotes = uploadResult.suggestion.notes ?? "";
            const nextUploadedImageInfo =
                `${nextSuggestedName} extracted successfully`;

            setReceiptImagePath(nextReceiptImagePath);
            setSuggestedName(nextSuggestedName);
            setSuggestedMerchant(nextSuggestedMerchant);
            setSuggestedPrice(nextSuggestedPrice);
            setSuggestedPurchaseDate(nextSuggestedPurchaseDate);
            setSuggestedReturnDeadline(nextSuggestedReturnDeadline);
            setSuggestedWarrantyDeadline(nextSuggestedWarrantyDeadline);
            setWarrantyProvider(nextWarrantyProvider);
            setSuggestedNotes(nextSuggestedNotes);

            setImageUploadStatus(null);
            setUploadedImageInfo(nextUploadedImageInfo);

            await persistReceiptSession({
                result: uploadResult,
                suggestedName: nextSuggestedName,
                suggestedMerchant: nextSuggestedMerchant,
                suggestedPrice: nextSuggestedPrice,
                suggestedPurchaseDate: nextSuggestedPurchaseDate,
                suggestedReturnDeadline: nextSuggestedReturnDeadline,
                suggestedWarrantyDeadline: nextSuggestedWarrantyDeadline,
                warrantyProvider: nextWarrantyProvider,
                suggestedNotes: nextSuggestedNotes,
                selectedImageUri: imageUri,
                uploadedImageInfo: nextUploadedImageInfo,
                receiptImagePath: nextReceiptImagePath,
                savedReceiptItems,
            });
        } catch (error) {
            console.warn(error);

            setImageUploadStatus(null);
            setValidationMessage(
                "Receipt image upload failed. Try selecting the image again or choose a different photo."
            );
        }
    };

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

        await handleAnalyzeReceiptImage(imageUri);
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

        await handleAnalyzeReceiptImage(imageUri);
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

    const persistReceiptSession = async (session: {
        result: ReceiptExtractionResponse;
        suggestedName: string;
        suggestedMerchant: string;
        suggestedPrice: string;
        suggestedPurchaseDate: string;
        suggestedReturnDeadline: string;
        suggestedWarrantyDeadline: string;
        warrantyProvider: string;
        suggestedNotes: string;
        selectedImageUri: string | null;
        uploadedImageInfo: string | null;
        receiptImagePath: string;
        savedReceiptItems: string[];
    }) => {
        try {
            await AsyncStorage.setItem(
                RECEIPT_SESSION_STORAGE_KEY,
                JSON.stringify(session),
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
        setWarrantyProvider("");
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

                <ReceiptInputCard
                    rawText={rawText}
                    selectedImageUri={selectedImageUri}
                    imageUploadStatus={imageUploadStatus}
                    uploadedImageInfo={uploadedImageInfo}
                    isExtracting={isExtracting}
                    onRawTextChange={setRawText}
                    onCaptureReceiptImage={() => void handleCaptureReceiptImage()}
                    onSelectReceiptImage={() => void handleSelectReceiptImage()}
                    onExtractFromText={() => void handleExtract()}
                />

                {result ? (
                    <>
                        <ReceiptExtractionSummaryCard
                            result={result}
                            savedReceiptItems={savedReceiptItems}
                            onSelectLineItem={handleSelectLineItem}
                        />
                        <ReceiptReviewCard
                            result={result}
                            suggestedName={suggestedName}
                            suggestedMerchant={suggestedMerchant}
                            suggestedPrice={suggestedPrice}
                            suggestedPurchaseDate={suggestedPurchaseDate}
                            suggestedReturnDeadline={suggestedReturnDeadline}
                            suggestedWarrantyDeadline={suggestedWarrantyDeadline}
                            warrantyProvider={warrantyProvider}
                            suggestedNotes={suggestedNotes}
                            validationMessage={validationMessage}
                            errorMessage={errorMessage}
                            saveSuccessMessage={saveSuccessMessage}
                            restoredSessionNoticeVisible={restoredSessionNoticeVisible}
                            savedReceiptItems={savedReceiptItems}
                            isSaving={isSaving}
                            onSuggestedNameChange={setSuggestedName}
                            onSuggestedMerchantChange={setSuggestedMerchant}
                            onSuggestedPriceChange={setSuggestedPrice}
                            onSuggestedPurchaseDateChange={setSuggestedPurchaseDate}
                            onSuggestedReturnDeadlineChange={setSuggestedReturnDeadline}
                            onSuggestedWarrantyDeadlineChange={setSuggestedWarrantyDeadline}
                            onWarrantyProviderChange={setWarrantyProvider}
                            onSuggestedNotesChange={setSuggestedNotes}
                            onDismissRestoredSessionNotice={() =>
                                setRestoredSessionNoticeVisible(false)
                            }
                            onSaveSuggestion={() => void handleSaveSuggestion()}
                            onFinishSession={resetReceiptSession}
                        />
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
});