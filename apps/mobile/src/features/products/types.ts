export type ProductSource = "manual" | "receipt_ai";

export type Product = {
    id: number;
    name: string;
    merchant: string | null;
    purchase_date: string | null;
    return_deadline: string | null;
    warranty_deadline: string | null;
    warranty_provider: string | null;
    warranty_claim_url: string | null;
    warranty_notes: string | null;
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
    warranty_provider?: string | null;
    warranty_claim_url?: string | null;
    warranty_notes?: string | null;
    price_cents?: number | null;
    currency?: string;
    notes?: string | null;
    receipt_image_path?: string | null;
    source?: ProductSource;
    ai_provider?: string | null;
    ai_confidence?: number | null;
};

export type UpdateProductInput = Partial<CreateProductInput>;

export type DeadlineReminderType = "return" | "warranty";

export type DeadlineReminderStatus = "expired" | "today" | "upcoming";

export type DeadlineReminderPriority = "high" | "medium" | "low";

export type DeadlineReminder = {
    product_id: number;
    product_name: string;
    merchant: string | null;
    deadline_type: DeadlineReminderType;
    deadline_date: string;
    days_remaining: number;
    status: DeadlineReminderStatus;
    priority: DeadlineReminderPriority;
};