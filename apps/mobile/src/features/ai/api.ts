import { apiFetch } from "@/src/lib/api";

export type AIStatusResponse = {
    receipt_extractor_provider: string;
    openai_configured: boolean;
};

export type ReceiptImageUploadResponse = {
    filename: string;
    content_type: string;
    size_bytes: number;
    ready_for_ocr: boolean;
};

export function getAIStatus(): Promise<AIStatusResponse> {
    return apiFetch<AIStatusResponse>("/ai/status");
}

export async function uploadReceiptImage(
    imageUri: string
): Promise<ReceiptImageUploadResponse> {
    const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

    if (!apiBaseUrl) {
        throw new Error("Missing EXPO_PUBLIC_API_BASE_URL environment variable");
    }

    const formData = new FormData();

    formData.append("image", {
        uri: imageUri,
        name: "receipt.jpg",
        type: "image/jpeg",
    } as unknown as Blob);

    const response = await fetch(`${apiBaseUrl}/ai/receipt-image`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Image upload failed: ${response.status} ${errorText}`);
    }

    return response.json() as Promise<ReceiptImageUploadResponse>;
}