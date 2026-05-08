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
    source: string;
    created_at: string;
    updated_at: string;
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
    source?: string;
};

export type UpdateProductInput = Partial<CreateProductInput>;