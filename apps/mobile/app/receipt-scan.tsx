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
import {
    clearReceiptSession,
    persistReceiptSession,
    readReceiptSession,
} from "@/src/features/receiptExtraction/receiptSessionStorage";


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
    const [warrantyProvider, setWarrantyProvider] = useState("");
    const [warrantyClaimUrl, setWarrantyClaimUrl] = useState("");
    const [warrantyNotes, setWarrantyNotes] = useState("");
    const [skippedReceiptItems, setSkippedReceiptItems] = useState<string[]>([]);

    const [restoredSessionNoticeVisible, setRestoredSessionNoticeVisible] =
        useState(false);

    useEffect(() => {
        const restoreReceiptSession = async () => {
            try {
                const parsed = await readReceiptSession();

                if (!parsed) {
                    return;
                }

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
                setWarrantyClaimUrl(parsed.warrantyClaimUrl ?? "");
                setWarrantyNotes(parsed.warrantyNotes ?? "");
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

                setSkippedReceiptItems(
                    parsed.skippedReceiptItems ?? [],
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

    const applyExtractionResultToReviewForm = (
        extractionResult: ReceiptExtractionResponse
    ) => {
        const nextSuggestedName = extractionResult.suggestion.name;
        const nextSuggestedMerchant = extractionResult.suggestion.merchant ?? "";
        const nextSuggestedPrice = centsToPriceInput(
            extractionResult.suggestion.price_cents
        );
        const nextSuggestedPurchaseDate =
            extractionResult.suggestion.purchase_date ?? "";
        const nextSuggestedReturnDeadline =
            extractionResult.suggestion.return_deadline ?? "";
        const nextSuggestedWarrantyDeadline =
            extractionResult.suggestion.warranty_deadline ?? "";
        const nextWarrantyProvider =
            extractionResult.suggestion.warranty_provider ?? "";
        const nextSuggestedNotes = extractionResult.suggestion.notes ?? "";

        setSuggestedName(nextSuggestedName);
        setSuggestedMerchant(nextSuggestedMerchant);
        setSuggestedPrice(nextSuggestedPrice);
        setSuggestedPurchaseDate(nextSuggestedPurchaseDate);
        setSuggestedReturnDeadline(nextSuggestedReturnDeadline);
        setSuggestedWarrantyDeadline(nextSuggestedWarrantyDeadline);
        setWarrantyProvider(nextWarrantyProvider);
        setSuggestedNotes(nextSuggestedNotes);

        return {
            suggestedName: nextSuggestedName,
            suggestedMerchant: nextSuggestedMerchant,
            suggestedPrice: nextSuggestedPrice,
            suggestedPurchaseDate: nextSuggestedPurchaseDate,
            suggestedReturnDeadline: nextSuggestedReturnDeadline,
            suggestedWarrantyDeadline: nextSuggestedWarrantyDeadline,
            warrantyProvider: nextWarrantyProvider,
            suggestedNotes: nextSuggestedNotes,
        };
    };

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

            const nextReceiptImagePath = uploadResult.receipt_image_path ?? "";

            const reviewFormValues = applyExtractionResultToReviewForm(uploadResult);
            const nextUploadedImageInfo =
                `${reviewFormValues.suggestedName} extracted successfully`;

            setReceiptImagePath(nextReceiptImagePath);
            setImageUploadStatus(null);
            setUploadedImageInfo(nextUploadedImageInfo);

            await persistReceiptSession({
                result: uploadResult,
                ...reviewFormValues,
                warrantyClaimUrl: "",
                warrantyNotes: "",
                selectedImageUri: imageUri,
                uploadedImageInfo: nextUploadedImageInfo,
                receiptImagePath: nextReceiptImagePath,
                savedReceiptItems,
                skippedReceiptItems,
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


    const handleAddMissingLineItem = async (
        itemName: string,
        itemPriceCents: number | null
    ) => {
        if (!result) {
            return;
        }

        const nextResult = {
            ...result,
            line_items: [
                ...result.line_items,
                {
                    name: itemName,
                    price_cents: itemPriceCents,
                },
            ],
        };

        const nextSuggestedPrice =
            itemPriceCents === null
                ? ""
                : (itemPriceCents / 100).toFixed(2);

        setResult(nextResult);
        setSuggestedName(itemName);
        setSuggestedPrice(nextSuggestedPrice);
        setSaveSuccessMessage(`${itemName} was added to the receipt review queue.`);
        setErrorMessage(null);

        await persistReceiptSession({
            result: nextResult,
            suggestedName: itemName,
            suggestedMerchant,
            suggestedPrice: nextSuggestedPrice,
            suggestedPurchaseDate,
            suggestedReturnDeadline,
            suggestedWarrantyDeadline,
            warrantyProvider,
            warrantyClaimUrl,
            warrantyNotes,
            suggestedNotes,
            selectedImageUri,
            uploadedImageInfo,
            receiptImagePath,
            savedReceiptItems,
            skippedReceiptItems,
        });
    };

    const handleSkipCurrentLineItem = async () => {
        const trimmedName = suggestedName.trim();

        if (!trimmedName || !result) {
            return;
        }

        if (savedReceiptItems.includes(trimmedName)) {
            return;
        }

        const nextSkippedReceiptItems = skippedReceiptItems.includes(trimmedName)
            ? skippedReceiptItems
            : [...skippedReceiptItems, trimmedName];

        setSkippedReceiptItems(nextSkippedReceiptItems);

        const nextUnreviewedLineItem = findNextUnreviewedLineItem(
            savedReceiptItems,
            nextSkippedReceiptItems,
            trimmedName
        );

        let nextSuggestedName = suggestedName;
        let nextSuggestedPrice = suggestedPrice;

        if (nextUnreviewedLineItem) {
            nextSuggestedName = nextUnreviewedLineItem.name;
            nextSuggestedPrice =
                nextUnreviewedLineItem.price_cents === null
                    ? ""
                    : (nextUnreviewedLineItem.price_cents / 100).toFixed(2);

            setSuggestedName(nextSuggestedName);
            setSuggestedPrice(nextSuggestedPrice);
        }

        await persistReceiptSession({
            result,
            suggestedName: nextSuggestedName,
            suggestedMerchant,
            suggestedPrice: nextSuggestedPrice,
            suggestedPurchaseDate,
            suggestedReturnDeadline,
            suggestedWarrantyDeadline,
            warrantyProvider,
            warrantyClaimUrl,
            warrantyNotes,
            suggestedNotes,
            selectedImageUri,
            uploadedImageInfo,
            receiptImagePath,
            savedReceiptItems,
            skippedReceiptItems: nextSkippedReceiptItems,
        });

        setSaveSuccessMessage(
            nextUnreviewedLineItem
                ? `${trimmedName} was skipped. Next detected item loaded for review.`
                : `${trimmedName} was skipped. All detected receipt items have been reviewed.`
        );

        setErrorMessage(null);
    };

    const findNextUnreviewedLineItem = (
        savedItemNames: string[],
        skippedItemNames: string[],
        currentItemName: string
    ) => {
        if (!result) {
            return null;
        }

        return (
            result.line_items.find((item) => {
                const itemWasSaved = savedItemNames.includes(item.name);
                const itemWasSkipped = skippedItemNames.includes(item.name);
                const isCurrentItem = item.name === currentItemName;

                return !itemWasSaved && !itemWasSkipped && !isCurrentItem;
            }) ?? null
        );
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
        setWarrantyClaimUrl("");
        setWarrantyNotes("");
        setSelectedImageUri(null);
        setUploadedImageInfo(null);
        setImageUploadStatus(null);
        setReceiptImagePath("");

        void clearReceiptSession();

        setValidationMessage(null);
        setErrorMessage(null);
        setSavedReceiptItems([]);
        setSkippedReceiptItems([]);
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

            const reviewFormValues =
                applyExtractionResultToReviewForm(extractionResult);

            await persistReceiptSession({
                result: extractionResult,
                ...reviewFormValues,
                warrantyClaimUrl: "",
                warrantyNotes: "",
                selectedImageUri,
                uploadedImageInfo,
                receiptImagePath,
                savedReceiptItems,
                skippedReceiptItems,
            });
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

            await createProduct({
                name: trimmedName,
                merchant: suggestedMerchant.trim() || null,
                purchase_date: normalizeOptionalDate(suggestedPurchaseDate),
                return_deadline: normalizeOptionalDate(suggestedReturnDeadline),
                warranty_deadline: normalizeOptionalDate(suggestedWarrantyDeadline),
                warranty_provider: warrantyProvider.trim() || null,
                warranty_claim_url: warrantyClaimUrl.trim() || null,
                warranty_notes: warrantyNotes.trim() || null,
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

            const nextSavedReceiptItems = [
                ...savedReceiptItems,
                trimmedName,
            ];

            setSavedReceiptItems(nextSavedReceiptItems);

            const nextUnsavedLineItem = findNextUnreviewedLineItem(
                nextSavedReceiptItems,
                skippedReceiptItems,
                trimmedName
            );

            let nextSuggestedName = suggestedName;
            let nextSuggestedPrice = suggestedPrice;

            if (nextUnsavedLineItem) {
                nextSuggestedName = nextUnsavedLineItem.name;
                nextSuggestedPrice =
                    nextUnsavedLineItem.price_cents === null
                        ? ""
                        : (nextUnsavedLineItem.price_cents / 100).toFixed(2);

                setSuggestedName(nextSuggestedName);
                setSuggestedPrice(nextSuggestedPrice);
            }

            if (result) {
                await persistReceiptSession({
                    result,
                    suggestedName: nextSuggestedName,
                    suggestedMerchant,
                    suggestedPrice: nextSuggestedPrice,
                    suggestedPurchaseDate,
                    suggestedReturnDeadline,
                    suggestedWarrantyDeadline,
                    warrantyProvider,
                    warrantyClaimUrl,
                    warrantyNotes,
                    suggestedNotes,
                    selectedImageUri,
                    uploadedImageInfo,
                    receiptImagePath,
                    savedReceiptItems: nextSavedReceiptItems,
                    skippedReceiptItems,
                });
            }

            setSaveSuccessMessage(
                nextUnsavedLineItem
                    ? `${trimmedName} was saved. Next detected item loaded for review.`
                    : `${trimmedName} was saved. All detected receipt items have been reviewed.`
            );
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
                            skippedReceiptItems={skippedReceiptItems}
                            activeItemName={suggestedName}
                            onSelectLineItem={handleSelectLineItem}
                            onAddLineItem={(itemName, itemPriceCents) =>
                                void handleAddMissingLineItem(itemName, itemPriceCents)
                            }
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
                            warrantyClaimUrl={warrantyClaimUrl}
                            warrantyNotes={warrantyNotes}
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
                            onWarrantyClaimUrlChange={setWarrantyClaimUrl}
                            onWarrantyNotesChange={setWarrantyNotes}
                            onSuggestedNotesChange={setSuggestedNotes}
                            onDismissRestoredSessionNotice={() =>
                                setRestoredSessionNoticeVisible(false)
                            }
                            onSaveSuggestion={() => void handleSaveSuggestion()}
                            onSkipCurrentLineItem={() => void handleSkipCurrentLineItem()}
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