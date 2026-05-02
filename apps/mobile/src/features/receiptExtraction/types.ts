export type ReceiptExtractionRequest = {
    raw_text: string;
};

export type ReceiptProductSuggestion = {
    name: string;
    merchant: string | null;
    purchase_date: string | null;
    return_deadline: string | null;
    warranty_deadline: string | null;
    price_cents: number | null;
    currency: string;
    notes: string | null;
};

export type ReceiptExtractionResponse = {
    source: string;
    confidence: number;
    suggestion: ReceiptProductSuggestion;
    warnings: string[];
};