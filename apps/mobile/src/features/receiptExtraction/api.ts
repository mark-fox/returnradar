import { apiFetch } from "@/src/lib/api";

import type {
    ReceiptExtractionRequest,
    ReceiptExtractionResponse,
} from "./types";

export function extractReceipt(
    input: ReceiptExtractionRequest
): Promise<ReceiptExtractionResponse> {
    return apiFetch<ReceiptExtractionResponse>("/ai/receipt-extract", {
        method: "POST",
        body: JSON.stringify(input),
    });
}