import { apiFetch } from "@/src/lib/api";

export type AIStatusResponse = {
    receipt_extractor_provider: string;
    openai_configured: boolean;
};

export function getAIStatus(): Promise<AIStatusResponse> {
    return apiFetch<AIStatusResponse>("/ai/status");
}