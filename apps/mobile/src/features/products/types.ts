export type ProductSource = "manual" | "receipt_ai";

export type Product = {
    id: number;
    name: string;
    merchant: string | null;
    purchase_date: string | null;
    return_deadline: string | null;
    warranty_deadline: string | null;
    price_cents: number | null;
    currency: string;
    notes: string | null;
    receipt_image_path: string | null;
    source: ProductSource;
    ai_provider: string | null;
    ai_confidence: number | null;
    created_at: string;
    updated_at: string;
    is_archived: boolean;
};

export type CreateProductInput = {
    name: string;
    merchant?: string | null;
    purchase_date?: string | null;
    return_deadline?: string | null;
    warranty_deadline?: string | null;
    price_cents?: number | null;
    currency?: string;
    notes?: string | null;
    receipt_image_path?: string | null;
    source?: ProductSource;
    ai_provider?: string | null;
    ai_confidence?: number | null;
};

export type UpdateProductInput = Partial<CreateProductInput>;