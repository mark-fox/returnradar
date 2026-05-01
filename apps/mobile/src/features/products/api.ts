import { apiFetch } from "@/src/lib/api";

import type {
    CreateProductInput,
    Product,
    UpdateProductInput,
} from "./types";

export function listProducts(): Promise<Product[]> {
    return apiFetch<Product[]>("/products");
}

export function getProduct(productId: number): Promise<Product> {
    return apiFetch<Product>(`/products/${productId}`);
}

export function createProduct(input: CreateProductInput): Promise<Product> {
    return apiFetch<Product>("/products", {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export function updateProduct(
    productId: number,
    input: UpdateProductInput
): Promise<Product> {
    return apiFetch<Product>(`/products/${productId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
    });
}

export async function deleteProduct(productId: number): Promise<void> {
    await apiFetch<void>(`/products/${productId}`, {
        method: "DELETE",
    });
}