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
    imageUri: string,
): Promise<ReceiptImageUploadResponse> {
    const formData = new FormData();

    formData.append("image", {
        uri: imageUri,
        name: "receipt.jpg",
        type: "image/jpeg",
    } as unknown as Blob);

    const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/ai/receipt-image`,
        {
            method: "POST",
            body: formData,
        },
    );

    if (!response.ok) {
        throw new Error("Image upload failed");
    }

    return response.json();
}