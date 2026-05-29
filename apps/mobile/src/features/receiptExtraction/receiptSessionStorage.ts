import AsyncStorage from "@react-native-async-storage/async-storage";

import type { ReceiptExtractionResponse } from "./types";

const RECEIPT_SESSION_STORAGE_KEY =
    "returnradar-active-receipt-session";

export type ReceiptScanSession = {
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
    selectedImageUri: string | null;
    uploadedImageInfo: string | null;
    receiptImagePath: string;
    savedReceiptItems: string[];
    skippedReceiptItems: string[];
};

export async function readReceiptSession(): Promise<Partial<ReceiptScanSession> | null> {
    const storedSession = await AsyncStorage.getItem(
        RECEIPT_SESSION_STORAGE_KEY
    );

    if (!storedSession) {
        return null;
    }

    return JSON.parse(storedSession) as Partial<ReceiptScanSession>;
}

export async function persistReceiptSession(
    session: ReceiptScanSession
): Promise<void> {
    await AsyncStorage.setItem(
        RECEIPT_SESSION_STORAGE_KEY,
        JSON.stringify(session)
    );
}

export async function clearReceiptSession(): Promise<void> {
    await AsyncStorage.removeItem(RECEIPT_SESSION_STORAGE_KEY);
}